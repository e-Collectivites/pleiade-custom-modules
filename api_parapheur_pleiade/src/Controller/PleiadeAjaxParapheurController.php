<?php

namespace Drupal\api_parapheur_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class PleiadeAjaxParapheurController extends ControllerBase {

    public function parapheur_entities_query(Request $request){
        
        $current_user = \Drupal::currentUser();

        // Get the user entity.
        $user = \Drupal\user\Entity\User::load($current_user->id());
        
        $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstore->get('groups');
        $departement = $_COOKIE["departement"];
        if($departement == "85b"){
            $nbDpt = '85';
        }
        elseif($departement == "85"){
            $nbDpt = '';
        }
        else{
            $nbDpt = $departement;
        }
        if (is_string($storedGroups) && strpos($storedGroups, 'parapheur') !== false) {
            $return = []; //our variable to fill with data returned by Parapheur
            $parapheurdataApi = new ApiPleiadeManager();
            
            $return = $parapheurdataApi->searchMyDesktop($nbDpt);
            if($return){
            return new JsonResponse(json_encode($return), 200, [], true);
            }
            else
            {
                return new JsonResponse(json_encode('no data'), 200, [], true);
            }
        }else
        {
            return new JsonResponse(json_encode('no data'), 200, [], true);
        }
    }

}