<?php

namespace Drupal\notification_module_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\TempStore\PrivateTempStoreFactory;
use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

class NotificationModuleController extends ControllerBase {

  protected $entityTypeManager;
  protected $tempStoreFactory;
  protected $time;
  protected $configFactory;

  public function __construct(EntityTypeManagerInterface $entity_type_manager, PrivateTempStoreFactory $temp_store_factory, TimeInterface $time, ConfigFactoryInterface $config_factory) {
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

  public function notification_fields(Request $request) {
    $tempstoreGroup = $this->tempStoreFactory->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');

    $query = $this->entityTypeManager->getStorage('node')->getQuery();
    $query->condition('type', 'notification');
    $query->condition('status', 1);
    $query->accessCheck(FALSE);
    
    $entityIds = $query->execute();
    $notifications = $this->entityTypeManager->getStorage('node')->loadMultiple($entityIds);

    $notificationAAfficher = [];
    $currentDate = date('Y-m-d', $this->time->getRequestTime());

    foreach ($notifications as $notification) {
      
      if ($notification->hasField('field_date_debut_notif') && !$notification->get('field_date_debut_notif')->isEmpty()) {
        $startDate = $notification->get('field_date_debut_notif')->value;
        if ($currentDate < $startDate) {
            continue; 
        }
      }

      if ($notification->hasField('field_date_fin_notif') && !$notification->get('field_date_fin_notif')->isEmpty()) {
        $endDate = $notification->get('field_date_fin_notif')->value;
        if ($currentDate > $endDate) {
            continue; 
        }
      }

      $title = $notification->getTitle();
      $body = $notification->hasField('field_description') ? $notification->get('field_description')->value : '';
      $creationDate = $notification->getChangedTime();

      $showNotification = false;
      
      if ($notification->hasField('field_departement') && !$notification->get('field_departement')->isEmpty()) {
        $dptValues = $notification->get('field_departement')->getValue();
        
        foreach($dptValues as $item) {
          $dpt = 'dpt-' . $item['value'];
          if (is_string($storedGroups) && strpos($storedGroups, $dpt) !== false) {
            $showNotification = true;
            break;
          }
        }
      } else {
        $showNotification = true;
      }

      if ($showNotification) {
        $notificationAAfficher[] = [
          'application' => $title,
          'field_description' => $body,
          'creation_date' => $creationDate,
        ];
      }
    }

    return new JsonResponse($notificationAAfficher);
  }
}