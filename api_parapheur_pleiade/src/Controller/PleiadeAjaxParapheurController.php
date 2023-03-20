<?php

namespace Drupal\api_parapheur_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_parapheur_pleiade\IParapheurDataApiManager;

class PleiadeAjaxParapheurController extends ControllerBase {

    public function parapheur_entities_query(Request $request){
        $return = []; //our variable to fill with data returned by Parapheur

        $parapheurdataApi = new IParapheurDataApiManager();
        $return = $parapheurdataApi->searchMyDesktop();

        return new JsonResponse(json_encode($return), 200, [], true);
    }

}