<?php

namespace Drupal\api_lemon_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;
/**
 * Basic manager of module.
 */
class LemonDataApiManager {

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
      \Drupal::logger('api_lemon_pleiade')->error($msg);
      return;
    }
    $this->client = \Drupal::httpClient();
    // get our custom module settings
    $this->settings = \Drupal::config('api_lemon_pleiade.settings');
    
  }

  /**
   * Do CURL request with authorization.
   *
   * @param string $resource
   *   A request action of api.
   * @param string $method
   *   A method of curl request.
   * @param Array $inputs
   *   A data of curl request.
   *
   * @return array
   *   An associate array with respond data.
   */
  private function executeCurl($resource, $method, $inputs, $api) {
    if (!isset($_COOKIE['lemonldap'])) {
      $msg = 'Pas authentifié dans le SSO Lemon';
      \Drupal::logger('api_lemon_pleiade')->error($msg);
      return NULL;
    }
    
    
    // Si on a le cookie Lemon on le loggue dans Drupal pour test - TODO : supprimer
    // \Drupal::logger('api_lemon_pleiade')->info($_COOKIE['lemonldap']);
    \Drupal::logger('api_lemon_pleiade')->info('Cookie Lemon: @cookie', ['@cookie' => $_COOKIE['lemonldap']]);

    // Si notre fonction AJAX envoie un array dans sa requête
    if(is_array($resource)){
      $LEMON_API_URL =  $api;
      foreach ($resource as $res){
        $LEMON_API_URL.="/".$res;
        \Drupal::logger('api_lemon_pleiade')->info('Ressource called: @res', ['@res' => $res ]);
      }
    }
    // Sinon on ajoute le param à l'url
    else { 
      $LEMON_API_URL = $api . "/" . $resource;
      \Drupal::logger('api_lemon_pleiade')->info('LEMON_API_URL: @api', ['@api' => $LEMON_API_URL ]);
    }
    
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

    try {
      $clientRequest = $this->client->request($method, $LEMON_API_URL, $options);
      $body = $clientRequest->getBody();
    } catch (RequestException $e) {
      \Drupal::logger('api_lemon_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
    }

    return Json::decode($body);
  }

  /**
   * Get Request of API.
   *
   * @param string $resource
   *   A request action.
   * @param string $input
   *   A data of curl request.
   *
   * @return array
   *   A respond data.
   */
  public function curlGet($resource, $inputs, $api) {
   // \Drupal::logger('api_lemon_pleiade')->info('Ressource, inputs, api: @res @inputs @api', ['@res' => $resource, '@inputs' => $inputs, '@api' => $api]);
    return $this->executeCurl($resource, "GET", $inputs, $api);
  }

  /**
   * Post Request of API.
   *
   * @param string $resource
   *   A request action.
   * @param string $inputs
   *   A data of curl request.
   *
   * @return array
   *   A respond data.
   */
  public function curlPost($resource, $inputs, $api) {
    return $this->executeCurl($resource, "POST", $inputs, $api);
  }

  public function searchByGroupes($groupes) {
    $resources = [
      "groupes",
      $null,
    ];
    return $this->curlGet($resources, [],$this->settings->get('field_lemon_url'));
  }

  public function searchMyApps() {
    $resources = "myapplications"; // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    \Drupal::logger('api_lemon_pleiade')->info('function searchMyApps triggered !');
    return $this->curlGet($resources, [],$this->settings->get('field_lemon_url'));
  }
  public function searchMySession() {
    $resources = "session/my/global"; // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    \Drupal::logger('api_lemon_pleiade')->info('function searchMySession triggered !');
    return $this->curlGet($resources, [],$this->settings->get('field_lemon_url'));
  }
  
  public function searchByName($name) {
    $resources = [
      "full_text",
      $name,
    ];
    return $this->curlGet($resources, [],$this->settings->get('field_lemon_url'));
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