<?php

namespace Drupal\notification_module_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;



class NotificationModuleController extends ControllerBase
{
  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('notification_module_pleiade')) {
      $this->settings_notification = \Drupal::config('notification_module_pleiade.settings');
    }
  }

  public function notification_fields(Request $request)
  {
    $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');

    $entityTypeManager = \Drupal::entityTypeManager();
    $query = $entityTypeManager->getStorage('node')->getQuery();
    $query->condition('type', 'notification');
    $query->condition('status', 1); // Published content condition
    $query->accessCheck(FALSE);
    $query->sort('created', 'DESC');
    $entityIds = $query->execute();
    $notifications = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

    $notificationAAfficher = [];

    foreach ($notifications as $notification) {
      $title = $notification->getTitle();
      $body = $notification->get('field_description')->value;
      $dptValues = $notification->get('field_dpt')->getValue();
      $creationDate = $notification->getChangedTime();

      $dpts = array_map(function ($item) {
        return 'dpt-' . $item['value'];
      }, $dptValues);

      if (!empty($dpts)) {
        foreach ($dpts as $dpt) {
          if (is_string($storedGroups) && strpos($storedGroups, $dpt) !== false) {
            $notificationAAfficher[] = [
              'application' => $title,
              'field_description' => $body,
              'creation_date' => $creationDate,
            ];
            break; // Ajoutez cette ligne si vous voulez arrêter la boucle après la première correspondance
          }
        }
      } else {
        $notificationAAfficher[] = [
          'application' => $title,
          'field_description' => $body,
          'creation_date' => $creationDate,
        ];
      }
    }

    // Publish articles with `field_published_date` matching the current time.
    $this->publishScheduledArticles();

    return new JsonResponse($notificationAAfficher);
  }
  protected function publishScheduledArticles()
  {
    $currentTime = \Drupal::time()->getCurrentTime();
    // Calculer les bornes de temps (delta de 2 minutes).
    $entityTypeManager = \Drupal::entityTypeManager();

    $query = $entityTypeManager->getStorage('node')->getQuery();
    $query->condition('type', 'notification');
    $query->accessCheck(FALSE);

    $entityIds = $query->execute();

    if (!empty($entityIds)) {
      $articles = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

      foreach ($articles as $article) {

        $publishedDate = $article->get('field_published_date')->value;
        $unpublishedDate = $article->get('field_unpublished_date')->value;

        $unpublishedTimestamp = strtotime($unpublishedDate);
        $publishedTimestamp = strtotime($publishedDate);

        if ($article->get('status')->value == '0' && $publishedDate != NULL) {

          if (($publishedTimestamp + 60 * 60) >= $currentTime) {

            $article->set('status', 1);
            $article->save();
          }
        }
        if ($article->get('status')->value == '1' && $unpublishedDate != NULL) {
          if (($unpublishedTimestamp + 60 * 60) <= $currentTime) {
            $article->set('status', 0);
            $article->save();
          }
        }
      }
    }
  }
}
