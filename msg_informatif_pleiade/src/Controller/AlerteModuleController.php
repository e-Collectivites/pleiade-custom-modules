<?php

namespace Drupal\msg_informatif_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AlerteModuleController extends ControllerBase
{
    protected $settings_message;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        if ($moduleHandler->moduleExists('msg_informatif_pleiade')) {
            $this->settings_message = \Drupal::config('msg_informatif_pleiade.settings');
        }
    }

    public function message_fields(Request $request)
    {
      $entityTypeManager = \Drupal::entityTypeManager();
      $query = $entityTypeManager->getStorage('node')->getQuery();
      $query->condition('type', 'message_informatif');
      $query->condition('status', 1); // Published content condition
      $query->accessCheck(FALSE);
      $entityIds = $query->execute();
      $messages = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);
  
      $msg = [];
  
      foreach ($messages as $message) {
          $body = $message->get('field_message_a_afficher')->getValue()[0]['value']; // Supprimer les balises HTML
          $importance = $message->get('field_importance_du_message')->value;
          $msg[] = [
              'field_message_a_afficher' => $body,
              'importance' => $importance,
          ];
      }
  
      return new JsonResponse($msg);
    }
}
