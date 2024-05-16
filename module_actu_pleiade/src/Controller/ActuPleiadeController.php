<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class ActuPleiadeController extends ControllerBase
{
    public function actu_list(Request $request)
    {
        $entityTypeManager = \Drupal::entityTypeManager();
        $query = $entityTypeManager->getStorage('node')->getQuery();
        $query->accessCheck(TRUE);
        $query->condition('type', 'actualite');
        $query->condition('status', 1); // Published content condition
        $entityIds = $query->execute();
        $messages = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

        $msg = [];

        foreach ($messages as $node) {
            $title = $node->getTitle();
            $description = $node->hasField('field_description_actu') ? $node->get('field_description_actu')->value : '';
            $link = $node->hasField('field_link') ? $node->get('field_link')->uri : '';

            $image_url = '';
            if ($node->hasField('field_image') && $node->get('field_image')->entity) {
                $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $node->get('field_image')->entity->uuid());
                if ($file) {
                    try {
                        $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                    } catch (InvalidStreamWrapperException $e) {
                        // Handle exception if needed.
                    }
                }
            }

            $msg[] = [
                'title' => $title,
                'description' => $description,
                'link' => $link,
                'image' => $image_url,
            ];
        }
        return new JsonResponse(json_encode($msg), 200, [], true);
    }


}



