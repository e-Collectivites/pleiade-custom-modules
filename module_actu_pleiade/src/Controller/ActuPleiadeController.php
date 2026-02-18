<?php

namespace Drupal\module_actu_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\module_actu_pleiade\Service\ActuPleiadeService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;

class ActuPleiadeController extends ControllerBase {

  protected $actuService;

  public function __construct(ActuPleiadeService $service) {
    $this->actuService = $service;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('module_actu_pleiade.actu_service')
    );
  }

  public function actu_list(Request $request) {
    // Fetch the real data from the service
    $items = $this->actuService->getList();

    return [
      '#theme' => 'actualites_template',
      '#items' => $items,
    ];
  }
}