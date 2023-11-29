<?php

namespace Drupal\api_nextcloud_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\user\Entity\User;
use Drupal\Core\Session\AccountInterface;
use Drupal\user\PrivateTempStoreFactory;

class NextCloudController extends ControllerBase
{

  public function notifs_query(Request $request)
  {

    $settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode('; ', $groupData);
    }
    if (in_array($settings_nextcloud->get('nextcloud_lemon_group'), $groupDataArray)) {

      $current_user = \Drupal::currentUser();

      // Obtenez l'ID de l'utilisateur connecté.
      $user_id = $current_user->id();

      // Chargez l'utilisateur Drupal par son ID.
      $user = User::load($user_id);

      if ($user) {
        // Vérifiez si l'utilisateur connecté possède le champ field_nextcloud_api_key.
        $field_nextcloud_api_key = $user->get('field_nextcloud_api_key')->getValue();
	$field_nextcloud_api_user = $user->get('field_nextcloud_api_user')->getValue();
        if (!empty($field_nextcloud_api_key) && !empty($field_nextcloud_api_user)) {
          $return = []; //our variable to fill with data returned by Pastell
          $nextcloudataApi = new ApiPleiadeManager();
          $return = $nextcloudataApi->getNextcloudNotifs();
//var_dump($return);
		if ($return == NULL){ 
         return new JsonResponse(json_encode("0"), 200, [], true);
}
else
{
          return new JsonResponse(json_encode($return), 200, [], true);
}

        } else {
          return new JsonResponse(json_encode("missing_token"), 200, [], true);
        }
      }
    } else {
      return new JsonResponse(json_encode('0'), 200, [], true);
    }
  }
}
