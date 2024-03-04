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
  public function user_list_query(Request $request)
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
}