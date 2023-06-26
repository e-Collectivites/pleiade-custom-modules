<?php

namespace Drupal\api_zimbra_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class PleiadeAjaxZimbraController extends ControllerBase {

    public function zimbra_mails_query(Request $request){
        $return = []; //our variable to fill with data returned by Zimbra
        // Debug what's in request
        \Drupal::logger('zimbra_mails_query')->info('Request $request: @request', ['@request' => $request ]);
        $zimbradataApi = new ApiPleiadeManager();
        $return = $zimbradataApi->searchMyMails();
        \Drupal::logger('zimbra_mails_query')->info('Return $return: @return', ['@return' => $return ]);
        return new JsonResponse(json_encode($return), 200, [], true);
    }

    public function zimbra_tasks_query(Request $request){
        $return = []; //our variable to fill with data returned by Zimbra
        // Debug what's in request
        \Drupal::logger('zimbra_tasks_query')->info('Request $request: @request', ['@request' => $request ]);
        $zimbradataApi = new ApiPleiadeManager();
        $return = $zimbradataApi->searchMyTasks();
        \Drupal::logger('zimbra_tasks_query')->info('Return $return: @return', ['@return' => $return ]);
        return new JsonResponse(json_encode($return), 200, [], true);
    }


}