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
    $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');
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
      $dpt = 'dpt-' . $message->get('field_departement')->value;
      if (!$message->get('field_departement')->isEmpty() && is_string($storedGroups) && strpos($storedGroups, $dpt) === false) {
        continue; // Ignorer les messages pour les départements non autorisés
      }

      $msg[] = [
        'field_message_a_afficher' => $body,
        'importance' => $importance,
      ];
    }
    $this->publishScheduledMessages();
    return new JsonResponse($msg);
  }

  protected function publishScheduledMessages()
  {
    $currentTime = \Drupal::time()->getCurrentTime();
    // Calculer les bornes de temps (delta de 2 minutes).
    $entityTypeManager = \Drupal::entityTypeManager();

    $query = $entityTypeManager->getStorage('node')->getQuery();
    $query->condition('type', 'message_informatif');
    $query->accessCheck(FALSE);

    $entityIds = $query->execute();

    if (!empty($entityIds)) {
      $articles = $entityTypeManager->getStorage('node')->loadMultiple($entityIds);

      foreach ($articles as $article) {
        // Récupérer la valeur de field_published_date.
        $publishedDate = $article->get('field_published_date')->value;
        $unpublishedDate = $article->get('field_unpublished_date')->value;
        $publishedTimestamp = strtotime($publishedDate);
        $unpublishedTimestamp = strtotime($unpublishedDate);

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
