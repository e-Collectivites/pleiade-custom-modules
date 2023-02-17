<?php

namespace Drupal\api_pastell_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;
use Drupal\cas\Service\CasProxyHelper;

/**
 * Basic manager of module.
 */
class PastellDataApiManager {

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
    //  \Drupal::logger('api_pastell_pleiade')->error($msg);
      return;
    }
    $this->client = \Drupal::httpClient();
    // get our custom module settings
    $this->settings = \Drupal::config('api_pastell_pleiade.settings');
    
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
   //   \Drupal::logger('api_pastell_pleiade')->error($msg);
      return NULL;
    }


    $PT_request_url = $api . '?auth=cas';
    // ProxyTicket
    // On utilise le sergvice du module CAS Drupal\cas\Service\CasProxyHelper;
    $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($PT_request_url);
    $PASTELL_API_URL = $PT_request_url . '&ticket=' . $proxy_ticket;
    
   // var_dump($PASTELL_API_URL);

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
    // var_dump($body);
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
   // \Drupal::logger('api_pastell_pleiade')->info('Ressource, inputs, api: @res @inputs @api', ['@res' => $endpoint, '@inputs' => $inputs, '@api' => $api]);
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

  public function searchMyDocs() {
    $endpoints = $this->settings->get('field_pastell_documents_url');  // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    \Drupal::logger('api_pastell_pleiade')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings->get('field_pastell_url') . $this->settings->get('field_pastell_documents_url') . $_COOKIE['coll_id'] . '&limit=' . $this->settings->get('field_pastell_limit_documents') );
  }
  public function searchMyEntities() {
    
    $endpoints =  $this->settings->get('field_pastell_entities_url');
    \Drupal::logger('api_pastell_pleiade')->info('function searchMyentities triggered !');
    return $this->curlGet($endpoints, [], $this->settings->get('field_pastell_url') . $this->settings->get('field_pastell_entities_url') );
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