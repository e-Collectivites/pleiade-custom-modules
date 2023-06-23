<?php

namespace Drupal\notification_module_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\user\PrivateTempStoreFactory;


class NotificationModuleController extends ControllerBase {
    public function __construct() {
        $moduleHandler = \Drupal::service('module_handler');
        if ($moduleHandler->moduleExists('notification_module_pleiade')) {
          $this->settings_notification = \Drupal::config('notification_module_pleiade.settings');    
        }
      }
    
      public function notification_fields(Request $request) {
        $entityTypeManager = \Drupal::entityTypeManager();
        $query = $entityTypeManager->getStorage('node')->getQuery();
        $query->condition('type', 'alerte_notification');
        $query->condition('status', 1); // Published content condition
        $entityIds = $query->execute();
        $notifications = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);
      
        $notificationAAfficher = [];
      
        foreach ($notifications as $notification) {
          $title = $notification->get('field_nom_de_l_applicatif')->value;
          $body = $notification->get('body')->value;
          $creationDate = $notification->getChangedTime();
      
          $notificationAAfficher[] = [
            'application' => $title,
            'body' => $body,
            'creation_date' => $creationDate,
          ];
        }
      
        return new JsonResponse($notificationAAfficher);
      }

    
}