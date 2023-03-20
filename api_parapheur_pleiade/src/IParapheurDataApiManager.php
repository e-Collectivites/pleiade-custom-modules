<?php

namespace Drupal\api_parapheur_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;
use Drupal\cas\Service\CasProxyHelper;

/**
 * Basic manager of module.
 */
class IParapheurDataApiManager {

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
      \Drupal::logger('api_parapheur_pleiade')->error($msg);
      return;
    }
    $this->client = \Drupal::httpClient();
    // get our custom module settings
    $this->settings = \Drupal::config('api_parapheur_pleiade.settings');
    
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
  private function executeCurl($endpoint, $method, $inputs, $api) {
    if (!isset($_COOKIE['lemonldap'])) {
      $msg = 'Pas authentifié dans le SSO ';
      \Drupal::logger('api_parapheur_pleiade')->error($msg);
      return NULL;
    }
    if( $this->settings->get('field_parapheur_auth_method') == 'cas' || $this->settings->get('field_parapheur_auth_method') == 'oidc'){
    $PARAPHEUR_AP_URL = $api . '?auth=cas';
    }
    else
    {
      $PARAPHEUR_AP_URL = $api;
    }
    
    // ProxyTicket

// TEST
    // $PT_request_url = 'https://iparapheurdev.ecollectivites.fr/iparapheur/proxy/alfresco/parapheur/bureaux?auth=cas';

    // On utilise le sergvice du module CAS Drupal\cas\Service\CasProxyHelper;
     $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($PT_request_url);
   //  $PARAPHEUR_AP_URL = $PT_request_url . '&ticket=' . $proxy_ticket;
    
    //  $PARAPHEUR_AP_URL = 'https://iparapheurdev.ecollectivites.fr/iparapheur/proxy/alfresco/parapheur/bureaux?auth=cas&ticket='.$proxy_ticket;
    //  $PARAPHEUR_AP_URL = '	https://iparapheurdev.ecollectivites.fr/';

    $options = [
      'headers' => [
        'Content-Type' => 'application/json',
        'Cookie'=> 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
      ],
    ];
    $method = 'POST';
   
    if (!empty($inputs)) {

      if($method == 'GET'){
        $PARAPHEUR_AP_URL.= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
        foreach($inputs as $param => $value){
            $PARAPHEUR_AP_URL.= '&' . $param . '=' . $value;
        }
      }else{
        //POST request send data in array index form_params.
        $options['body'] = $inputs;
      }
    }
    
    try {
      $clientRequest = $this->client->request($method, 'https://idtest.ecollectivites.fr/remote.php/dav/files/pleiade1%40formation/', $options); 
      
      $body = $clientRequest->getBody()->getContents();

    } catch (RequestException $e) {
      \Drupal::logger('api_parapheur_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
    }

    var_dump($body);
    return Json::decode($body);
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
  public function curlGet($endpoint, $inputs, $api) {
    return $this->executeCurl($endpoint, "GET", $inputs, $api);
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
  public function curlPost($endpoint, $inputs, $api) {
    return $this->executeCurl($endpoint, "POST", $inputs, $api);
  }

  public function searchMyDesktop() {
    $endpoints = $this->settings->get('field_parapheur_bureaux_url');  // Endpoint myapplications de Lemon qui renvoie toutes nos apps
  //  \Drupal::logger('api_parapheur_documents')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings->get('field_parapheur_url') . $this->settings->get('field_parapheur_bureaux_url'));
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