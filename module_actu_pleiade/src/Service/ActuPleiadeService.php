<?php

namespace Drupal\module_actu_pleiade\Service;

use SimplePie\SimplePie;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileRepositoryInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;
use Drupal\image\Entity\ImageStyle;

trait ApiLoggerTrait
{
    protected function logInfo(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->info("✅ $message", $context);
    }

    protected function logWarning(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->warning("⚠️ $message", $context);
    }

    protected function logError(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->error("❌ $message", $context);
    }
}

class ActuPleiadeService
{
    use ApiLoggerTrait;

    private $collectivite;
    private $collectivite_info;
    private $settings_actu;

    public function __construct()
    {
        $this->collectivite = \Drupal::request()->getSession()->get('cas_attributes')["partner"][0] ?? 'sitiv';
        $this->collectivite_info = \Drupal::keyValue("collectivities_store")->get('global', [])[$this->collectivite] ?? [];
        $this->settings_actu = \Drupal::config('module_actu_pleiade.settings');

        $this->logInfo('module_actu_pleiade', "ActuPleiadeService initialized for '{$this->collectivite}'.");
    }

    public function getList()
    {
        $link = $this->settings_actu->get('url_site');
        $collectivite_default = "sitiv";

        $this->logInfo('module_actu_pleiade', "Fetching news for default collectivite '$collectivite_default'.");
        $array_sitiv = $this->getActu($collectivite_default, $link);

        if ($this->collectivite != "sitiv") {
            $this->logInfo('module_actu_pleiade', "Fetching news for collectivite '{$this->collectivite}'.");
            $array_collectivite = $this->getActu($this->collectivite, $this->collectivite_info['actu_url'] ?? '');
            $array = $this->interleaveArrays($array_sitiv, $array_collectivite);
            return $array;
        }

        $this->logInfo('module_actu_pleiade', "Fetching news for fallback collectivite 'TNO'.");
        $array_collectivite = $this->getActu("TNO", \Drupal::keyValue("collectivities_store")->get('global', [])["TNO"]['actu_url'] ?? '');
        $array = $this->interleaveArrays($array_sitiv, $array_collectivite);
        return $array;
    }

    public function getActu($collectivite, $link)
    {
        $proxy = $this->settings_actu->get('proxy');
        $this->logInfo('module_actu_pleiade', "Fetching feed for '$collectivite' from URL '$link'.");

        $image_style = ImageStyle::load('card_small');

        $feed = new SimplePie();
        $feed->set_feed_url($link);
        $feed->set_curl_options([
            CURLOPT_PROXY => $proxy,
        ]);
        $feed->set_useragent('Mozilla/5.0 (compatible; SimplePie/1.5.8; +https://simplepie.org/)');
        $feed->enable_cache(false);
        $feed->init();
        $feed->handle_content_type();

        if ($feed->error()) {
            $this->logWarning('module_actu_pleiade', "Feed error for '$collectivite': " . $feed->error());
            return [];
        }

        $max = 20;
        $count = 0;
        $data = [];
        foreach ($feed->get_items() as $item) {
            if ($count++ >= $max) break;

            $created = $item->get_date('d-m-Y');
            $title = $item->get_title();
            $link = $item->get_permalink();
            $default = false;
            $image_source = null;

            $enclosure = $item->get_enclosure();
            if ($enclosure && $enclosure->get_type() && strpos($enclosure->get_type(), 'image/') === 0) {
                $image_source = $enclosure->get_link();
            }

            if (!$image_source) {
                $description = $item->get_description();
                if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $description, $matches)) {
                    $image_source = $matches[1];
                }
            }

            if (!$image_source) {
                $content_encoded = $item->get_item_tags('http://purl.org/rss/1.0/modules/content/', 'encoded');
                if ($content_encoded && isset($content_encoded[0]['data'])) {
                    $html = $content_encoded[0]['data'];
                    if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $matches)) {
                        $image_source = $matches[1];
                    }
                }
            }

            $final_image_url = null;

            if ($image_source) {
                $directory = 'public://pleiade_images';
                $filename = basename(parse_url($image_source, PHP_URL_PATH));
                $destination = $directory . '/' . $filename;
                
                $storage = \Drupal::entityTypeManager()->getStorage('file');
                $existing_files = $storage->loadByProperties(['uri' => $destination]);
                
                $file = null;
                $file_exists_on_disk = file_exists($destination);

                // If DB entry exists AND file exists on disk, use it.
                // If either is missing, we try to download/save.
                if (!empty($existing_files) && $file_exists_on_disk) {
                    $file = reset($existing_files);
                } else {
                    try {
                        $imageData = @file_get_contents($image_source);
                        if ($imageData) {
                            \Drupal::service('file_system')->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY);
                            $file = \Drupal::service('file.repository')->writeData($imageData, $destination, FileSystemInterface::EXISTS_REPLACE);
                        }
                    } catch (\Exception $e) {
                        $this->logError('module_actu_pleiade', "Exception fetching image: " . $e->getMessage());
                    }
                }

                if ($file && $image_style) {
                    $final_image_url = $image_style->buildUrl($file->getFileUri());
                } else {
                    $final_image_url = $this->collectivite_info["logo"] ?? null;
                    $default = true;
                }
            } else {
                $final_image_url = $this->collectivite_info["logo"] ?? null;
                $default = true;
            }

            $data[] = [
                "created" => $created,
                "field_image" => $final_image_url,
                "default_image" => $default,
                "title" => $title,
                "view_node" => $link,
                "collectivite" => $collectivite
            ];
        }

        return $data;
    }

    function interleaveArrays(array $array1, array $array2): array
    {
        $result = [];
        $count = max(count($array1), count($array2));
        for ($i = 0; $i < $count; $i++) {
            if (array_key_exists($i, $array1)) { $result[] = $array1[$i]; }
            if (array_key_exists($i, $array2)) { $result[] = $array2[$i]; }
        }
        return $result;
    }
}