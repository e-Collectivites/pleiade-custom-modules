<?php

namespace Drupal\api_pastell_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;

class PleiadeAjaxPastellController extends ControllerBase {

    public function pastell_entities_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        $pastelldataApi = new ApiPleiadeManager();
        $return = $pastelldataApi->searchMyEntities();
        return new JsonResponse(json_encode($return), 200, [], true);
    }

    public function pastell_flux_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        $pastelldataApi = new ApiPleiadeManager();
        $return = $pastelldataApi->searchMyFlux();
        $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
        $tempstore->set('flux', $return);
        return new JsonResponse(json_encode($return), 200, [], true);
    }

}