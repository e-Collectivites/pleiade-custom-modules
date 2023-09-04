<?php

namespace Drupal\api_glpi_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class GlpiController extends ControllerBase
{

  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    }
  }
  public function glpi_list_tickets(Request $request)
  {
	$settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode('; ', $groupData);
    }
    if (in_array($settings_glpi->get('glpi_group'), $groupDataArray)) {
	$glpiDataAPI = new ApiPleiadeManager();
      $return = $glpiDataAPI->getGLPITickets();
      return new JsonResponse(json_encode($return), 200, [], true);

    }
  }
	public function glpi_tickets() {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="glpi_list_tickets"></div>',
    ];
  }
}
