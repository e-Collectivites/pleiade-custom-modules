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
        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');
        if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
            $pastelldataApi = new ApiPleiadeManager();
            $return = $pastelldataApi->searchMyEntities();
            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->set('entites', $return);
            $arrayAsString = print_r($return, true);
            \Drupal::logger('api_pastell_pleiade')->debug('retour de la requête des entités :'. $arrayAsString);
                
            return new JsonResponse(json_encode($return), 200, [], true);
        }
        else {
            \Drupal::logger('api_pastell_pleiade')->debug('pas dans le groupe pastell');
            return new JsonResponse(json_encode([]), 200, [], true);
        }
    }

    public function pastell_flux_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');
        if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
            $pastelldataApi = new ApiPleiadeManager();
            $return = $pastelldataApi->searchMyFlux();
            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->set('flux', $return);
            $arrayAsString = print_r($return, true);
            \Drupal::logger('api_pastell_pleiade')->debug('retour de la requête des flux :'. $arrayAsString);
            
            return new JsonResponse(json_encode($return), 200, [], true);
        }
        else {
            \Drupal::logger('api_pastell_pleiade')->debug('pas dans le groupe pastell');
            return new JsonResponse(json_encode([]), 200, [], true);
        }
    }

}