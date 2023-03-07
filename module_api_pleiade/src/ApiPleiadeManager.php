<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;
use Drupal\cas\Service\CasProxyHelper;

/**
 * Basic manager of module.
 */
class ApiPleiadeManager {

   /**
   * Drupal's settings manager.
   */
  protected $settings;
 
  public $client;
  /**
   * Constructor.
   */
  public function __construct() {
    if (!isset($_COOKIE['lemonldap'])) {
      $msg = 'Pas authentifié dans le SSO Lemon';
      \Drupal::logger('module_api_pleiade')->error($msg);
      return;
    }
    $this->client = \Drupal::httpClient();
    // get our custom module settings
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_lemon_pleiade')) {
      $this->settings_lemon = \Drupal::config('api_lemon_pleiade.settings');    
    }
    if ($moduleHandler->moduleExists('api_pastell_pleiade')) {
      $this->settings_pastell = \Drupal::config('api_pastell_pleiade.settings');
    }
    if ($moduleHandler->moduleExists('api_zimbra_pleiade')) {
      $this->settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
    }
    if ($moduleHandler->moduleExists('api_parapheur_pleiade')) {
      $this->settings_parapheur = \Drupal::config('api_parapheur_pleiade.settings');
    }

    
  }

  /**
   * Do CURL request with authorization.
   *
   * @param string $endpoint
   *   A request action of api.
   * @param string $method
   *   A method of curl request.
   * @param Array $inputs
   *   A data of curl request.
   *
   * @return array
   *   An associate array with respond data.
   */
  private function executeCurl($endpoint, $method, $inputs, $api, $application) {
    
    ////////////////////////////////////////////////////////
    //                                                    //
    //  REQUETE SI API LEMONLDAP RECUPERATION APPLIS ETC  //
    //                                                    //
    ////////////////////////////////////////////////////////

    if ($application == 'lemon')
      {

          // Si on a le cookie Lemon on le loggue dans Drupal pour test - TODO : supprimer
          \Drupal::logger('api_lemon_pleiade')->info('Cookie Lemon: @cookie', ['@cookie' => $_COOKIE['lemonldap']]);
          $LEMON_API_URL = $api . "/" . $endpoint;
          \Drupal::logger('api_lemon_pleiade')->info('LEMON_API_URL: @api', ['@api' => $LEMON_API_URL ]);
        
          $options = [
            'headers' => [
              'Content-Type' => 'application/json',
              'Cookie'=> 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
            ],
          ];

          if (!empty($inputs)) {

            \Drupal::logger('api_lemon_pleiade')->info('Inputs dans la requête: @inp', ['@inp' => $inputs ]);
            
            if($method == 'GET'){
              $LEMON_API_URL.= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
              foreach($inputs as $param => $value){
                  $LEMON_API_URL.= '&' . $param . '=' . $value;
              }
            }else{
              //POST request send data in array index form_params.
              $options['body'] = $inputs;
            }
          }

          try 
          {
            $clientRequest = $this->client->request($method, $LEMON_API_URL, $options);
            $body = $clientRequest->getBody();
          } 
          catch (RequestException $e) 
          {
            \Drupal::logger('api_lemon_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
          }

          return Json::decode($body);
      }

    ////////////////////////////////////////////////////////
    //                                                    //
    //     REQUETE SI API PASTELL DOCUMENTS + ENTITES     //
    //                                                    //
    ////////////////////////////////////////////////////////

      elseif($application =='pastell')
      {
          
          if( $this->settings_pastell->get('field_pastell_auth_method') == 'cas' || $this->settings_pastell->get('field_pastell_auth_method') == 'oidc'){
          $PT_request_url = $api . '?auth=cas';
          }
          else
          {
            $PT_request_url = $api;
          }
          // ProxyTicket
          // On utilise le sergvice du module CAS Drupal\cas\Service\CasProxyHelper;
          $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($PT_request_url);
          $PASTELL_API_URL = $PT_request_url . '&ticket=' . $proxy_ticket;
          
      
          $options = [
            'headers' => [
              'Content-Type' => 'application/json',
              'Cookie'=> 'lemonldap=' . $_COOKIE['lemonldap'],
            ],
          ];
        
          if (!empty($inputs)) {
      
            
            if($method == 'GET'){
              $PASTELL_API_URL.= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
              foreach($inputs as $param => $value){
                  $PASTELL_API_URL.= '&' . $param . '=' . $value;
              }
            }else{
              //POST request send data in array index form_params.
              $options['body'] = $inputs;
            }
          }
      
          try {
            $clientRequest = $this->client->request($method, $PASTELL_API_URL, $options);
            $body = $clientRequest->getBody()->getContents();
      
          } catch (RequestException $e) {
            \Drupal::logger('api_pastell_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
          }
          return Json::decode($body);
      }

    ////////////////////////////////////////////////////////
    //                                                    //
    //   REQUETE API ZIMBRA RECUPERATION AGENDA / MAILS   //
    //                                                    //
    ////////////////////////////////////////////////////////


      elseif($application == 'zimbra')
      {
          
          $ZIMBRA_API_URL = $endpoint;
          \Drupal::logger('api_zimbra_pleiade')->info('ZIMBRA_API_URL: @api', ['@api' => $ZIMBRA_API_URL ]);
        
          $options = [
            'headers' => [
              'Content-Type' => 'application/json',
              'Cookie'=> 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
            ],
          ];
      
          if (!empty($inputs)) {
      
          //  \Drupal::logger('api_zimbra_pleiade')->info('Inputs dans la requête: @inp', ['@inp' => $inputs ]);
            
            if($method == 'GET'){
              $ZIMBRA_API_URL.= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
              foreach($inputs as $param => $value){
                  $ZIMBRA_API_URL.= '&' . $param . '=' . $value;
              }
            }else{
              //POST request send data in array index form_params.
              $options['body'] = $inputs;
            }
          }
      
          try {
            $clientRequest = $this->client->request($method, $ZIMBRA_API_URL, $options);
            $body = $clientRequest->getBody()->getContents();
          } catch (RequestException $e) {
            \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
          }
          
          return Json::decode($body);
      }


    ////////////////////////////////////////////////////////
    //                                                    //
    //       REQUETE API Iparapheur doc à signer          //
    //                                                    //
    ////////////////////////////////////////////////////////


      elseif($application =='parapheur')
      {

      }
  }
  /**
   * Get Request of API.
   *
   * @param string $endpoint
   *   A request action.
   * @param string $input
   *   A data of curl request.
   *
   * @return array
   *   A respond data.
   */
  public function curlGet($endpoint, $inputs, $api, $application) {
    return $this->executeCurl($endpoint, "GET", $inputs, $api, $application);
  }

  /**
   * Post Request of API.
   *
   * @param string $endpoint
   *   A request action.
   * @param string $inputs
   *   A data of curl request.
   *
   * @return array
   *   A respond data.
   */
  public function curlPost($endpoint, $inputs, $api, $application) {
    return $this->executeCurl($endpoint, "POST", $inputs, $api, $application);
  }

    ////////////////////////////////////////////////////////
    //                                                    //
    //   FONCTIONS POUR LES NOTIFICATIONS D'UTILISATEUR   //
    //                                                    //
    ////////////////////////////////////////////////////////


  public function searchIfUserHaveNewMail() {
    $clientRequest = $this->client->request('GET', 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/zimbra_test.json');
    // $clientRequest = $this->client->request('GET', '/v1/api_zimbra_pleiade/zimbra_mail_query');
    $body = $clientRequest->getBody()->getContents();
    
    $array = array();
    
    if ($body) {
      return $body;
    }
    else{
      return $array;
    }
  }
  public function searchIfUserHaveSoonTasks() {
    $clientRequest = $this->client->request('GET', 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json');
    // $clientRequest = $this->client->request('GET', 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json'); a configurer 
    
    $body = $clientRequest->getBody()->getContents();
    $array = array();
    if ($body) {
      return $body;
    }
    else{
      return $array;
    }
  }
  public function searchIfUserHaveParapheurDocs() {
    $clientRequest = $this->client->request('GET', 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/parapheur.json');
    // $clientRequest = $this->client->request('GET', '/v1/api_parapheur_pleiade/parapheur_entities_query');
    $body = $clientRequest->getBody()->getContents();
    $array = array();
    if ($body) {
      return $body;
    }
    else{
      return $array;
    }
  }

    //////////////////////////////////////////////////////////////
    //                                                          //
    //  FONCTIONS POUR API LEMONLDAP APPLICATION + SESSIONTIME  //
    //                                                          //
    //////////////////////////////////////////////////////////////

  public function searchMyApps() {
    $endpoints = $this->settings_lemon->get('field_lemon_myapps_url');  // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    \Drupal::logger('api_lemon_pleiade')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }
  public function searchMySession() {
    $endpoints =  $this->settings_lemon->get('field_lemon_sessioninfo_url');  // Endpoint myapplications de Lemon qui renvoie les dernières connexions
    \Drupal::logger('api_lemon_pleiade')->info('function searchMySession triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }

    //////////////////////////////////////////////////////////////
    //                                                          //
    //  FONCTIONS POUR API PASTELL ENTITES ET DOCUMENTS ENTITE  //
    //                                                          //
    //////////////////////////////////////////////////////////////

  public function searchMyDocs($id_e) {
    $endpoints = $this->settings_pastell->get('field_pastell_documents_url');  // Endpoint field_pastell_documents_url de Pastell qui renvoi la liste des documents Pastell
    //\Drupal::logger('api_pastell_documents')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_documents_url') . $id_e . '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents'), 'pastell' );
  }
  public function searchMyEntities() {
    $endpoints =  $this->settings_pastell->get('field_pastell_entities_url');
   // \Drupal::logger('api_pastell_entites')->info('function searchMyentities triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }


    //////////////////////////////////////////////////////////////
    //                                                          //
    //              FONCTIONS POUR API ZIMBRA MAILS             //
    //                                                          //
    //////////////////////////////////////////////////////////////


  public function searchMyMails() {
    $endpoints = $this->settings_zimbra->get('field_zimbra_url');  // Endpoint mail de Zimbra configuré dans l'admin du module
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyMails triggered !');
    return $this->curlGet($endpoints, [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra');
  }

    //////////////////////////////////////////////////////////////
    //                                                          //
    //              FONCTIONS POUR API IPARAPHEUR               //
    //                                                          //
    //////////////////////////////////////////////////////////////

    
  public function searchMyDesktop() {
    $endpoints = $this->settings_parapheur->get('field_parapheur_bureaux_url');  // Endpoint myapplications de Lemon qui renvoie toutes nos apps
  //  \Drupal::logger('api_parapheur_documents')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_parapheur->get('field_parapheur_url') . $this->settings_parapheur->get('field_parapheur_bureaux_url'), 'parapheur');
  }

  /**
   * Function to return first element of the array, compatability with PHP 5, note that array_key_first is only available for PHP > 7.3.
   *
   * @param array $array
   *   Associative array.
   *
   * @return string
   *   The first key data.
   */
  public static function arrayKeyfirst($array){
    if (!function_exists('array_key_first')) {
        foreach($array as $key => $unused) {
            return $key;
        }
        return NULL;
    }else{
        return array_key_first($array);
    }
  }
}