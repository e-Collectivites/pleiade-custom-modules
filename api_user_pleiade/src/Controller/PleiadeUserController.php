<?php

namespace Drupal\api_user_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class PleiadeUserController extends ControllerBase {

    public function __construct() {
      $moduleHandler = \Drupal::service('module_handler');
      if ($moduleHandler->moduleExists('api_user_pleiade')) {
        $this->settings_user = \Drupal::config('api_user_pleiade.settings');    
      }
    }
    public function user_list_query(Request $request){
      
      // Load the user storage service.
        $query = \Drupal::entityQuery('user');
        $uids = $query->execute();
        $users = array();

        
        foreach ($uids as $uid) {
          $user = \Drupal\user\Entity\User::load($uid);
      
          // Get user's profile picture URL.
          $picture_url = '';
          if ($user->hasField('user_picture')) {
            $picture_fid = $user->get('user_picture')->target_id;
            if (!empty($picture_fid)) {
              $picture_url = file_create_url(\Drupal\file\Entity\File::load($picture_fid)->getFileUri());
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

        if ($users){
          
          return new JsonResponse(json_encode($users), 200, [], true);
        }
        else
        {
          echo 'erreur lors de la récupération des users'  ;
        }
    } 
    // public function notification_query(Request $request){
    //     $query = \Drupal::entityQuery('node')->condition('type', 'alerte_notification');
    //     $nids = $query->execute();
    //     $nodes = \Drupal::entityTypeManager()->getStorage('node')->loadMultiple($nids);
        
    //     $response = array();
    //     foreach ($nodes as $node) {
    //       $body = $node->body->value;
    //       $created_date = $node->created->value;
    //       $field_nom_de_l_applicatif = $node->field_nom_de_l_applicatif->value;
    //       // do something with the body text here
    //       $response[] = array(
    //         'body' => $body,
    //         'created_date' => $created_date,
    //         'nom_de_l_applicatif' => $field_nom_de_l_applicatif
    //       ); // append the body text and the created date to the $response array as a new array
    //     }
    //     if ($response){
          
    //       return new JsonResponse(json_encode($response), 200, [], true);
    //     }
    //     else
    //     {
    //       return new JsonResponse(json_encode([]), 200, [], true);
    //     }
    // } 
}