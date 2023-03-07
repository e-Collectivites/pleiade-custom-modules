<?php

namespace Drupal\api_pastell_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;


class PleiadeAjaxPastellController extends ControllerBase {

    public function pastell_entities_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        $pastelldataApi = new ApiPleiadeManager();
        $return = $pastelldataApi->searchMyEntities();
        return new JsonResponse(json_encode($return), 200, [], true);
    }
    public function pastell_documents_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        // Our collectivite ID for Pastell id_e is sent as param by our js module
        $id_e = $request->query->get('id_e');
        // check value exists and is numleric
        if (null !== $id_e && is_numeric($id_e)) {
            \Drupal::logger('api_pastell_documents')->info('function search Pastell Docs with id_e : ' . $id_e);
            $pastelldataApi = new ApiPleiadeManager();
            $return = $pastelldataApi->searchMyDocs($id_e); 
        }

        return new JsonResponse(json_encode($return), 200, [], true);
    }

}