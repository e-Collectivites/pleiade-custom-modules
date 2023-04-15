<?php

namespace Drupal\api_glpi_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\user\Entity\UserInterface;
use Drupal\Core\Field\FieldStorageDefinitionInterface;


class GlpiController extends ControllerBase {

    public function __construct() {
      $moduleHandler = \Drupal::service('module_handler');
      if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
        $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');    
      }
    }
    public function glpi_list_tickets(Request $request){

    }
}