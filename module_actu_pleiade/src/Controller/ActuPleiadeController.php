<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\node\Entity\Node;

class ActuPleiadeController extends ControllerBase
{
    public function actu_list(Request $request)
    {

        
        
        $getArticles = new ApiPleiadeManager();
        $articles = $getArticles->getEcollArticles();
        $settings_actu = \Drupal::config('module_actu_pleiade.settings');
        $autorize_intern_actu = $settings_actu->get('actu_interne');
        
        if($autorize_intern_actu == true){
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
            // Étape 1 : Convertir le JSON en tableau PHP
            $result_array = json_decode($result_json, true);

            // Étape 2 : Trier le tableau par date de publication
            usort($result_array, function($a, $b) {
                return strtotime($b['created']) - strtotime($a['created']);
            });
            // Étape 3 : Convertir le tableau trié en JSON
            $result_json_sorted = json_encode($result_array);
        }
        else{
            $result_json_sorted = $articles;
        }



        
       

        return new JsonResponse(($result_json_sorted), 200, [], true);
    }


}



