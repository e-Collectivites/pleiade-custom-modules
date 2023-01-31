<?php

namespace Drupal\api_lemon_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_lemon_pleiade\LemonDataApiManager;

class PleiadeAjaxController extends ControllerBase {
  
  // function to query LemonLDAP API, myapplications endpoint
  public function lemon_myapps_query(Request $request){
    $return = []; //our variable to fill with data returned by LemonLDAP
    // Debug what's in request
    \Drupal::logger('lemon_myapps_query')->info('Request $request: @request', ['@request' => $request ]);

    $lemondataApi = new LemonDataApiManager();
    $return = $lemondataApi->searchMyApps(); 
    return new JsonResponse(json_encode($return), 200, [], true);
  }

  // function to query LemonLDAP API, session/my/global endpoint
  public function lemon_session_query(Request $request){
    $return = []; //our variable to fill with data returned by LemonLDAP
    // Debug what's in request
    \Drupal::logger('lemon_session_query')->info('Request $request: @request', ['@request' => $request ]);

    $lemondataApi = new LemonDataApiManager();
    $return = $lemondataApi->searchMySession(); 
    return new JsonResponse(json_encode($return), 200, [], true);
  }

  // TODO : TOTP query if possible
  
}