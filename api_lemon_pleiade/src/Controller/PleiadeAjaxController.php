<?php

namespace Drupal\api_lemon_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;


class PleiadeAjaxController extends ControllerBase {
  
  // function to query LemonLDAP API, myapplications endpoint
  public function lemon_myapps_query(Request $request){
    $return = []; //our variable to fill with data returned by LemonLDAP
    // Debug what's in request
    \Drupal::logger('lemon_myapps_query')->info('Request $request: @request', ['@request' => $request ]);

    $lemondataApi = new ApiPleiadeManager();
    $return = $lemondataApi->searchMyApps(); 
    return new JsonResponse(json_encode($return), 200, [], true);
  }

  // function to query LemonLDAP API, session/my/global endpoint
  public function lemon_session_query(Request $request){
    $return = []; //our variable to fill with data returned by LemonLDAP
    // Debug what's in request
    \Drupal::logger('lemon_session_query')->info('Request $request: @request', ['@request' => $request ]);

    $lemondataApi = new ApiPleiadeManager();
    $return = $lemondataApi->searchMySession(); 
    
    // Store groups in Drupal private tempstore to serve to other modules later
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $tempstore->set('groups', $return["groups"]);

    return new JsonResponse(json_encode($return), 200, [], true);
  }

  // TODO : TOTP query if possible

   /**
   * Returns our session history page.
   *
   * @return array
   *   A simple renderable array.
   */
  public function myHistory() {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="history-connexion"></div>',
    ];
  }
  
}