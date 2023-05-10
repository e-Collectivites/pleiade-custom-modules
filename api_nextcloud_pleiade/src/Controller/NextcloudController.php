<?php

namespace Drupal\api_nextcloud_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;

class NextCloudController extends ControllerBase {

    public function notifs_query(Request $request){
        $return = []; //our variable to fill with data returned by Pastell
        $nextcloudataApi = new ApiPleiadeManager();
        $return = $nextcloudataApi->getNextcloudNotifs();
        return new JsonResponse(json_encode($return), 200, [], true);
    }
}