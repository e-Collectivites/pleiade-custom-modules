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
        $messageAAfficher = array();
        $text = $this->settings_message->get('message_a_afficher');
        if($text){
          $parts = explode("\r\n\r\n", $text);
          foreach ($parts as $part) {
            $messageAAfficher[] = array('message' => $part);
          }
          }
        
                
        return new JsonResponse(json_encode($messageAAfficher), 200, [], true);
    }

    
}