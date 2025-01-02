<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\file\FileConstants;

class ActuPleiadeController extends ControllerBase
{
    public function actu_list(Request $request)
    {

        $settings_actu = \Drupal::config('module_actu_pleiade.settings');
        $autorize_intern_actu = $settings_actu->get('actu_interne');
        $flux_rss = $settings_actu->get('flux_rss');


        $getArticles = new ApiPleiadeManager();
        $articles = $getArticles->getEcollArticles();

        if ($flux_rss == true) {
            $rssXml = simplexml_load_string($articles);

            $articles = [];

            // Vérifier si le chargement du flux a réussi
            if ($rssXml !== false) {
                // Parcourir chaque élément <item> du flux RSS
                foreach ($rssXml->channel->item as $item) {
                    // Extraire les informations de chaque article
                    $pubDateTimestamp = strtotime((string)$item->pubDate);
                    // Formater la date en dd/mm/YYYY
                    $formattedDate = date("d/m/Y", $pubDateTimestamp);
                    $description = (string)$item->description;
                    $imageUrl = '';
                    if (preg_match('/<img[^>]+src="([^"]+)"[^>]*>/', $description, $matches)) {
                        $imageUrl = $matches[1];
                    }
                    $article = [
                        "title" => (string)$item->title,
                        "field_image" => $imageUrl,
                        // Supposons que les tags sont dans une balise <category>
                        "field_tags" => (string)$item->category,
                        "created" => $formattedDate,
                        "view_node" => (string)$item->link
                    ];
                    // Ajouter l'article à la liste des articles
                    $articles[] = $article;
                }
            }
            $articles = json_encode($articles);
        }



        if ($autorize_intern_actu == true) {
            $nids = \Drupal::entityQuery('node')
                ->condition('type', 'article')
                ->condition('status', Node::PUBLISHED)
                ->sort('created', 'DESC')
                ->accessCheck(TRUE)
                ->execute();

            $nodes = Node::loadMultiple($nids);

            foreach ($nodes as $node) {
                $created_date = \Drupal::service('date.formatter')->format($node->getCreatedTime(), 'custom', 'd/m/Y');
                if ($node->hasField('field_image') && $node->get('field_image')->entity) {
                    $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $node->get('field_image')->entity->uuid());
                    if ($file) {
                        try {
                            $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                        } catch (InvalidStreamWrapperException $e) {
                            // Handle exception if needed.
                        }
                    }
                } else {
                    // Si aucun fichier n'est associé au champ field_image, récupérer l'image par défaut
                    $default_image = $node->get('field_image')->getFieldDefinition()->getSetting('default_image');
                    $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
                    if ($file) {
                        try {
                            $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                        } catch (InvalidStreamWrapperException $e) {
                            // Handle exception if needed.
                        }
                    }
                }
                $tags = $node->get('field_tags')->referencedEntities();

                if (empty($tags)) {
                    $tags = 'Aucun tag';
                } else {
                    $tags = [];
                    foreach ($node->get('field_tags')->referencedEntities() as $tag) {
                        $tags[] = $tag->label();
                    }
                    $tags = implode(', ', $tags);
                }
                $article = [
                    "title" => $node->label(),
                    "field_image" => $image_url,
                    "field_tags" => $tags,
                    "created" => $created_date,
                    "view_node" => $node->toUrl('canonical', ['absolute' => TRUE])->toString()
                ];
            }


            $article = json_encode($article);
            $article_obj = json_decode($article, true);
            $articles_obj = json_decode($articles, true);
            $result = array_merge([$article_obj], $articles_obj);
            $result_json = json_encode($result);
            $result_array = json_decode($result_json, true);

            usort($result_array, function ($a, $b) {
                return strtotime($b['created']) - strtotime($a['created']);
            });
            // Étape 3 : Convertir le tableau trié en JSON
            $result_json_sorted = json_encode($result_array);
        } else {
            $result_json_sorted = $articles;
            // Création des nœuds
            foreach (json_decode($result_json_sorted, true) as $article_data) {
                // Vérifier si l'article existe déjà pour éviter les doublons
                $existing_nids = \Drupal::entityQuery('node')
                    ->condition('type', 'article')
                    ->condition('title', $article_data['title'])
                    ->accessCheck(TRUE) // Ajout de la vérification d'accès
                    ->execute();

                if (empty($existing_nids)) {
                    $image_source_path = $article_data['field_image'];
                    $image_target_path = 'public://images.png';
                    $image_data = file_get_contents($image_source_path);
                    $image_alt = 'Image actualité';
                    $image_object = \Drupal::service('file.repository')
                        ->writeData($image_data, $image_target_path);
                    // var_dump($image_object->id());
                    // exit;
                    $created_timestamp = strtotime($article_data['created']);
                    if ($created_timestamp === false) {
                        // Si la date n'a pas pu être parsée, utiliser le timestamp actuel
                        $created_timestamp = time();
                    }
                    $node = Node::create([
                        'type' => 'article',
                        'title' => $article_data['title'],
                        'body' => [
                            'value' => $article_data['body'],  // Conserver le HTML complet
                            'format' => 'full_html',  // Utiliser le format texte complet HTML
                        ],
                        'field_tags' => $this->getTags($article_data['field_tags']),
                        'created' => $created_timestamp,
                        'status' => Node::PUBLISHED,
                        'uid' => 31,
                    ]);
                    $node->set('field_image', [
                        'target_id' => $image_object->id(),
                        'alt' => $image_alt,
                    ]);
                    $node->save();
                } else {

                    // Récupération du nœud existant
                    $nid = reset($existing_nids);
                    $node = Node::load($nid);
                    $update_needed = false;
                    if ($node->getTitle() !== $article_data['title'] || $node->get('body')->value !== $article_data['body']) {
                        // Vérification des différences et mise à jour si nécessaire


                        if ($node->getTitle() !== $article_data['title']) {
                            $node->setTitle($article_data['title']);
                            $update_needed = true;
                        }

                        if ($node->get('body')->value !== $article_data['body']) {
                            $node->set('body', [
                                'value' => $article_data['body'],
                                'format' => 'full_html',
                            ]);
                            $update_needed = true;
                        }

                        // $existing_tags = $node->get('field_tags')->referencedEntities();
                        // $new_tags = $this->getTags($article_data['field_tags']);
                        // if (array_diff($existing_tags, $new_tags) || array_diff($new_tags, $existing_tags)) {
                        //     $node->set('field_tags', $new_tags);
                        //     $update_needed = true;
                        // }

                        // $existing_image = $node->get('field_image')->entity;
                        // $new_image_data = file_get_contents($article_data['field_image']);
                        // if (md5($existing_image->getFileUri()) !== md5($new_image_data)) {
                        //     $image_target_path = 'public://images.png';
                        //     $image_object = \Drupal::service('file.repository')
                        //         ->writeData($new_image_data, $image_target_path);
                        //     $node->set('field_image', [
                        //         'target_id' => $image_object->id(),
                        //         'alt' => 'Image actualité',
                        //     ]);
                        //     $update_needed = true;
                        // }

                        if ($update_needed) {
                            $node->save();
                        }
                    }
                }
            }
            $nids = \Drupal::entityQuery('node')
                ->condition('type', 'article')
                ->condition('status', Node::PUBLISHED)
                ->sort('created', 'DESC')
                ->accessCheck(TRUE)
                ->execute();

            $nodes = Node::loadMultiple($nids);
            foreach ($nodes as $node) {

                if (!$node->get('field_nouveaute')->value) {
                    continue; // Passer à l'article suivant si 'field_nouveaute' est à false
                }
                $created_date = \Drupal::service('date.formatter')->format($node->getCreatedTime(), 'custom', 'd/m/Y');
                if ($node->hasField('field_image') && $node->get('field_image')->entity) {
                    $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $node->get('field_image')->entity->uuid());
                    if ($file) {
                        try {
                            $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                        } catch (InvalidStreamWrapperException $e) {
                            // Handle exception if needed.
                        }
                    }
                } else {
                    // Si aucun fichier n'est associé au champ field_image, récupérer l'image par défaut
                    $default_image = $node->get('field_image')->getFieldDefinition()->getSetting('default_image');
                    $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
                    if ($file) {
                        try {
                            $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                        } catch (InvalidStreamWrapperException $e) {
                            // Handle exception if needed.
                        }
                    }
                }
                $tags = $node->get('field_tags')->referencedEntities();

                if (empty($tags)) {
                    $tags = 'Aucun tag';
                } else {
                    $tags = [];
                    foreach ($node->get('field_tags')->referencedEntities() as $tag) {
                        $tags[] = $tag->label();
                    }
                    $tags = implode(', ', $tags);
                }
                $article = [
                    "title" => $node->label(),
                    "field_image" => $image_url,
                    "field_tags" => $tags,
                    "created" => $created_date,
                    "view_node" => $node->toUrl('canonical', ['absolute' => TRUE])->toString()
                ];
                $articles_alaune[] = $article;
            }
        }
        if ($articles_alaune) {
            return new JsonResponse((json_encode($articles_alaune)), 200, [], true);
        } else {
            return new JsonResponse(($result_json_sorted), 200, [], true);
        }
    }

    private function getTags($tags_string)
    {
        $tags = [];
        foreach (explode(', ', $tags_string) as $tag_name) {
            $terms = \Drupal::entityQuery('taxonomy_term')
                ->condition('vid', 'tags') // Assurez-vous de remplacer 'tags' par le vocabulaire approprié
                ->condition('name', $tag_name)
                ->accessCheck(TRUE)
                ->execute();

            if (empty($terms)) {
                $term = Term::create([
                    'vid' => 'tags',
                    'name' => $tag_name,
                ]);
                $term->save();
                $tags[] = $term->id();
            } else {
                $tags[] = reset($terms);
            }
        }
        return $tags;
    }
}
