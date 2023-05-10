<?php

namespace Drupal\message_module_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

use Drupal\user\PrivateTempStoreFactory;


class MessageModuleController extends ControllerBase {
    public function __construct() {
        $moduleHandler = \Drupal::service('module_handler');
        if ($moduleHandler->moduleExists('message_module_pleiade')) {
          $this->settings_message = \Drupal::config('message_module_pleiade.settings');    
        }
      }
    
      public function message_fields(Request $request){
        $users = array();
        if($this->settings_message->get('message_actif')){
            if($this->settings_message->get('message_a_afficher') && $this->settings_message->get('gravite_du_message')){}
                $users[] = array(
                    'message' => $this->settings_message->get('message_a_afficher'),
                    'gravite' => $this->settings_message->get('gravite_du_message')
                );
            }
        
                
        return new JsonResponse(json_encode($users), 200, [], true);
    }

    
}