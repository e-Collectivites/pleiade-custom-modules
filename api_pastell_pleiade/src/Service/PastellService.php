<?php

namespace Drupal\api_pastell_pleiade\Service;

use GuzzleHttp\Client;
use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;

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

    protected function logDebug(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->debug("🐞 $message", $context);
    }
}

class PastellService implements PastellServiceInterface
{
    use ApiLoggerTrait;

    protected $settings_pastell;
    private $client;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_pastell = $moduleHandler->moduleExists('api_pastell_pleiade') 
            ? \Drupal::config('api_pastell_pleiade.settings') 
            : null;
        $this->client = new Client();

        $this->logInfo('api_pastell_pleiade', 'PastellService initialized.');
    }

    public function searchMyDocs($id_e)
    {
        $url = $this->settings_pastell->get('field_pastell_url') .
            $this->settings_pastell->get('field_pastell_documents_url') . $id_e .
            '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents');

        $this->logInfo('api_pastell_pleiade', 'Searching documents for entity ID @id', ['@id' => $id_e]);
        return $this->executeCurl("GET", [], $url);
    }

    public function searchMyFlux()
    {
        $url = $this->settings_pastell->get('field_pastell_url') .
            $this->settings_pastell->get('field_pastell_flux_url');
        $this->logInfo('api_pastell_pleiade', 'Fetching flux.');
        return $this->executeCurl("GET", [], $url);
    }

    public function searchMyEntities()
    {
        $url = $this->settings_pastell->get('field_pastell_url') .
            $this->settings_pastell->get('field_pastell_entities_url');
        $this->logInfo('api_pastell_pleiade', 'Fetching entities.');
        return $this->executeCurl('GET', [], $url);
    }

    public static function arrayKeyfirst($array)
    {
        if (function_exists('array_key_first')) {
            return array_key_first($array);
        }
        foreach ($array as $key => $unused) {
            return $key;
        }
        return null;
    }

    public function executeCurl($method, $inputs, $api)
    {
        $authMethod = $this->settings_pastell->get('field_pastell_auth_method');
        $url = ($authMethod === 'cas' || $authMethod === 'oidc') ? $api . '?auth=cas' : $api;

        try {
            $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($url);
            $url .= '&ticket=' . $proxy_ticket;
            $this->logDebug('api_pastell_pleiade', 'Proxy ticket generated.', ['url' => $url, 'ticket' => $proxy_ticket]);
        } catch (\Exception $e) {
            $this->logError('api_pastell_pleiade', 'Failed to get proxy ticket: @message', ['@message' => $e->getMessage()]);
        }

        $options = [
            'headers' => [
                'Content-Type' => 'multipart/form-data',
                'Cookie' => 'lemonldap=' . ($_COOKIE['lemonldap'] ?? ''),
            ],
        ];

        if (!empty($inputs)) {
            if ($method === 'GET') {
                $url .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
                foreach ($inputs as $param => $value) {
                    $url .= '&' . $param . '=' . $value;
                }
            } else {
                $url = $api . '&' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
                foreach ($inputs as $param => $value) {
                    $url .= '&' . $param . '=' . $value;
                }
                $options['auth'] = [
                    $this->settings_pastell->get('field_pastell_username_doc_lots'),
                    $this->settings_pastell->get('field_pastell_password_doc_lots')
                ];
            }
        }

        $this->logDebug('api_pastell_pleiade', 'Executing request', ['method' => $method, 'url' => $url, 'options' => $options]);

        try {
            $response = $this->client->request($method, $url, $options);
            $this->logInfo('api_pastell_pleiade', 'Request successful', ['url' => $url, 'status' => $response->getStatusCode()]);
            return Json::decode($response->getBody()->getContents());
        } catch (RequestException $e) {
            $this->logError('api_pastell_pleiade', 'Curl error: @error', ['@error' => $e->getMessage()]);
            return null;
        }
    }
}
