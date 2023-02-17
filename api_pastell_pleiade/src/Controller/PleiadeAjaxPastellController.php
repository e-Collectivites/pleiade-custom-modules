<?php

namespace Drupal\api_pastell_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_pastell_pleiade\PastellDataApiManager;

class PleiadeAjaxPastellController extends ControllerBase {

    public function pastell_entities_query(Request $request){
        $return = []; //our variable to fill with data returned by LemonLDAP

        $pastelldataApi = new PastellDataApiManager();
        $return = $pastelldataApi->searchMyEntities();

        return new JsonResponse(json_encode($return), 200, [], true);
    }
    public function pastell_document_query(Request $request){
        $return = []; //our variable to fill with data returned by LemonLDAP

        $pastelldataApi = new PastellDataApiManager();
        $return = $pastelldataApi->searchMyDocs(); 
        return new JsonResponse(json_encode($return), 200, [], true);
    }

}