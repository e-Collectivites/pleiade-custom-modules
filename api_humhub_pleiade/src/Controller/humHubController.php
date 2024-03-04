<?php

namespace Drupal\api_humhub_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;


class humHubController extends ControllerBase
{
        public function humhub_query(Request $request)
        {
                $return = []; //our variable to fill with data returned by Pastell
                $apiGeneral = new ApiPleiadeManager();
                if($apiGeneral->get_notif_humhub()){
                        $return['notifs'] = $apiGeneral->get_notif_humhub();
                }
                // if($apiGeneral->get_messages_humhub()){
                //         $return['messages'] = $apiGeneral->get_messages_humhub();
                // }
                if($apiGeneral->get_spaces()){
                        $return['spaces'] = $apiGeneral->get_spaces();
                }
                return new JsonResponse(json_encode($return), 200, [], true);
        }     

}
