<?php

namespace Drupal\api_user_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class PleiadeUserController extends ControllerBase
{

  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_user_pleiade')) {
      $this->settings_user = \Drupal::config('api_user_pleiade.settings');
    }
  }
  public function user_infos(Request $request)
  {

    $current_user = \Drupal::currentUser();

// Get the user entity.
$user = \Drupal\user\Entity\User::load($current_user->id());

// Initialize an array to store user information.
$user_info = array();

// Check if the user entity exists.
if ($user) {
    // Get all user fields and their values.
    $fields = $user->getFields();

    // Iterate through each field.
    foreach ($fields as $field_name => $field) {
        // Get the field value.
        $field_value = $field->getValue();

        // Store the field name and value in the user info array.
        $user_info[$field_name] = $field_value;
    }
}
    if ($user_info) {

      return new JsonResponse(json_encode($user_info), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }
public function user_list_query(Request $request)
  {

    // Load the user storage service.
    $query = \Drupal::entityQuery('user')->accessCheck(TRUE);;
    $uids = $query->execute();
    $users = array();


    foreach ($uids as $uid) {
      $user = \Drupal\user\Entity\User::load($uid);

      // Get user's profile picture URL.
$picture_url = '';
        if (isset($user->get('user_picture')->entity)) {
            $picture_url = $user->get('user_picture')->entity->createFileUrl();
        } else {
            // Default image
            $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
            $default_image = $field->getSetting('default_image');
            if ($default_image) {
                $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
                if ($file != '' || $file != null) {
                    try {
                        $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
                    } catch (InvalidStreamWrapperException $e) {
                        $picture_url = '';
                    }
                } else {
                    $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
                }
            } else {
                $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
            }
        }


      // Get user's last login timestamp.
      $last_login_timestamp = '';
      if ($user->getLastLoginTime()) {
        $last_login_timestamp = $user->getLastLoginTime();
      }

      // Get user's email.
      $email = '';
      if ($user->getEmail()) {
        $email = $user->getEmail();
      }

      $users[] = array(
        'id' => $user->id(),
        'picture_url' => $picture_url,
        'last_login_timestamp' => $last_login_timestamp,
        'email' => $email,
      );
    }

    if ($users) {

      return new JsonResponse(json_encode($users), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }
}
