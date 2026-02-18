<?php

namespace Drupal\msg_informatif_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\TempStore\PrivateTempStoreFactory;
use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

class AlerteModuleController extends ControllerBase {

  protected $entityTypeManager;
  protected $tempStoreFactory;
  protected $time;
  protected $configFactory;

  public function __construct(
      EntityTypeManagerInterface $entity_type_manager, 
      PrivateTempStoreFactory $temp_store_factory, 
      TimeInterface $time,
      ConfigFactoryInterface $config_factory
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->tempStoreFactory = $temp_store_factory;
    $this->time = $time;
    $this->configFactory = $config_factory;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('tempstore.private'),
      $container->get('datetime.time'),
      $container->get('config.factory')
    );
  }

  public function message_fields(Request $request) {
    $tempstoreGroup = $this->tempStoreFactory->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');

    $config = $this->configFactory->get('module_general_pleiade.settings');
    
    $colors = [
      'Informatif' => [
          'light' => $config->get('color_informatif') ?: '#006DAF',
          'dark'  => $config->get('color_informatif_dark') ?: '#004a75',
      ],
      'Avertissement' => [
          'light' => $config->get('color_avertissement') ?: '#ffc107',
          'dark'  => $config->get('color_avertissement_dark') ?: '#cc9a06',
      ],
      'Attention' => [
          'light' => $config->get('color_attention') ?: '#dc3545',
          'dark'  => $config->get('color_attention_dark') ?: '#a71d2a',
      ],
    ];

    $query = $this->entityTypeManager->getStorage('node')->getQuery();
    $query->condition('type', 'message_informatif');
    $query->condition('status', 1);
    $query->accessCheck(FALSE);
    
    $entityIds = $query->execute();
    
    $response = [
        'messages' => [],
        'colors' => $colors
    ];

    if (empty($entityIds)) {
        return new JsonResponse($response);
    }

    $messages = $this->entityTypeManager->getStorage('node')->loadMultiple($entityIds);
    $msg = [];
    
    $currentDate = date('Y-m-d', $this->time->getRequestTime());

    foreach ($messages as $message) {
      
      if ($message->hasField('field_date_de_debut') && !$message->get('field_date_de_debut')->isEmpty()) {
        $startDate = $message->get('field_date_de_debut')->value;
        if ($currentDate < $startDate) continue; 
      }

      if ($message->hasField('field_date_de_fin') && !$message->get('field_date_de_fin')->isEmpty()) {
        $endDate = $message->get('field_date_de_fin')->value;
        if ($currentDate > $endDate) continue; 
      }

      $showMessage = false;
      $hasDeptField = $message->hasField('field_departement') && !$message->get('field_departement')->isEmpty();

      if ($hasDeptField) {
        $dpt = 'dpt-' . $message->get('field_departement')->value;
        if (is_string($storedGroups) && strpos($storedGroups, $dpt) !== false) {
          $showMessage = true;
        }
      } else {
        $showMessage = true;
      }

      if ($showMessage) {
        $body = $message->hasField('field_message_a_afficher') ? $message->get('field_message_a_afficher')->value : '';
        $importance = $message->hasField('field_importance_du_message') ? $message->get('field_importance_du_message')->value : 'Informatif';
        $application = $message->hasField('field_application_concernee') ? $message->get('field_application_concernee')->value : null;
        $creation = $message->getCreatedTime();

        $msg[] = [
          'field_message_a_afficher' => $body,
          'importance' => $importance,
          'application' => $application,
          'creation_date' => $creation
        ];
      }
    }

    $response['messages'] = $msg;
    return new JsonResponse($response);
  }
}