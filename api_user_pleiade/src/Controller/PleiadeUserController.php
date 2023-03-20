<?php

namespace Drupal\api_user_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\user\Entity\UserInterface;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\module_api_pleiade\ApiPleiadeManager;

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
    public function user_infos_query(Request $request){
      
      

      $users_infos = [];
      $userdataApi = new ApiPleiadeManager();
      $return = $_COOKIE['nbOfMails'];
      $return_tasks = json_decode($userdataApi->searchIfUserHaveSoonTasks(), true);
      $return_iparapheur = json_decode($userdataApi->searchIfUserHaveParapheurDocs(), true);
      $want_Chatbot = $this->settings_user->get('have_chatbot');
      
      // Load the user storage service.
      if($want_Chatbot){
        $users_infos[] = array(
          "want_chatbot" => true
          );
      }

      if($return_tasks){
        foreach($return_tasks['appt'] as $tasks){
          $name_task = $tasks['inv'][0]['comp'][0]['name'];
          $location_task = $tasks['inv'][0]['comp'][0]['loc'];
          $timestamp_task = ($tasks['inv'][0]['comp'][0]['s'][0]['u'] / 1000);
          $users_infos[] = array(
            "start_task" => $timestamp_task,
            "name_task" => $name_task .'<br>'. $location_task
            );
        }
      }
      else
      {
        $users_infos = [];
      }
      if($return){
        $users_infos[] = array(
        "haveMail" => true,
        "count_mail" => $return,
        );
        
      }
      else
      {
        $users_infos = [];
      }
      if($return_iparapheur){
        $nb_doc = 0;
        // Count nb docs a signer 
        foreach($return_iparapheur['bureaux'] as $a_signer){
          $nb_doc += $a_signer['a_traiter'] + $a_signer['en_retard'] + $a_signer['dossiers_delegues'];
        }
        
        $users_infos[] = array(
        "haveDocs" => true,
        "count_bureaux" => $nb_doc,
        );
        
      }
      else
      {
        $users_infos = [];
      }
      return new JsonResponse(json_encode($users_infos), 200, [], true);
  }   
}