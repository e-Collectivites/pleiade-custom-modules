<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class ActuPleiadeController extends ControllerBase
{
    public function actu_list(Request $request)
    {
        // $entityTypeManager = \Drupal::entityTypeManager();
        // $query = $entityTypeManager->getStorage('node')->getQuery();
        // $query->accessCheck(TRUE);
        // $query->condition('type', 'article');
        // $query->condition('status', 1); // Published content condition
        // $query->sort('created', 'DESC');
        // $entityIds = $query->execute();
        // $messages = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

        // $msg = [];

        // foreach ($messages as $node) {
        //     $title = $node->getTitle();
        //     $description = $node->hasField('body') ? $node->get('body')->value : '';
        //     $link = $node->toUrl()->toString();
        //     $image_url = '';
            
        //     if ($node->hasField('field_image') && $node->get('field_image')->entity) {
        //         $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $node->get('field_image')->entity->uuid());
        //         if ($file) {
        //             try {
        //                 $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
        //             } catch (InvalidStreamWrapperException $e) {
        //                 // Handle exception if needed.
        //             }
        //         }
        //     } else {
        //         // Si aucun fichier n'est associé au champ field_image, récupérer l'image par défaut
        //         $default_image = $node->get('field_image')->getFieldDefinition()->getSetting('default_image');
        //         $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
        //         if ($file) {
        //             try {
        //                 $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
        //             } catch (InvalidStreamWrapperException $e) {
        //                 // Handle exception if needed.
        //             }
        //         }
        //     }
        
        //     $created_date = \Drupal::service('date.formatter')->format($node->getCreatedTime(), 'custom', 'd/m/Y');
    
        //     // Récupérer les termes de taxonomie (étiquettes)
        //     $tags = [];
        //     if ($node->hasField('field_tags')) {
        //         $tags_field = $node->get('field_tags')->referencedEntities();
        //         foreach ($tags_field as $tag) {
        //             $tags[] = $tag->getName();
        //         }
        //     }

        //     $msg[] = [
        //         'title' => $title,
        //         'description' => $description,
        //         'link' => $link,
        //         'image' => $image_url,
        //         'created_date' => $created_date,
        //         'tags' => $tags,
        //     ];
        //         }


        $return = []; //our variable to fill with data returned by Pastell
        $getArticles = new ApiPleiadeManager();
        $return = $getArticles->getEcollArticles();

        return new JsonResponse(($return), 200, [], true);
    }


}



