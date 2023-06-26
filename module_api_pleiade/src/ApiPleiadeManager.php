<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\cas\Service\CasProxyHelper;

/**
 * Basic manager of module.
 */
class ApiPleiadeManager
{

  /**
   * Drupal's settings manager.
   */
  protected $settings;

  public $client;
  /**
   * Constructor.
   */
  public function __construct()
  {
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
      \Drupal::logger('api_lemon_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_pastell_pleiade')) {
      $this->settings_pastell = \Drupal::config('api_pastell_pleiade.settings');
      \Drupal::logger('api_pastell_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_zimbra_pleiade')) {
      $this->settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
      \Drupal::logger('api_zimbra_pleiade')->debug('module activé');

    }
    // if ($moduleHandler->moduleExists('api_parapheur_pleiade')) {
    //   $this->settings_parapheur = \Drupal::config('api_parapheur_pleiade.settings');
    //   \Drupal::logger('api_parapheur_pleiade')->debug('module activé');
    // }
    if ($moduleHandler->moduleExists('api_nextcloud_pleiade')) {
      $this->settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
      \Drupal::logger('api_nextcloud_pleiade')->debug('module activé');

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
  private function executeCurl($endpoint, $method, $inputs, $api, $application)
  {

    ////////////////////////////////////////////////////////
    //                                                    //
    //  REQUETE SI API LEMONLDAP RECUPERATION APPLIS ETC  //
    //                                                    //
    ////////////////////////////////////////////////////////

    if ($application == 'lemon') {

      // Si on a le cookie Lemon on le loggue dans Drupal pour test - TODO : supprimer
      \Drupal::logger('api_lemon_pleiade')->info('Cookie Lemon: @cookie', ['@cookie' => $_COOKIE['lemonldap']]);
      $LEMON_API_URL = $api . "/" . $endpoint;
      \Drupal::logger('api_lemon_pleiade')->info('LEMON_API_URL: @api', ['@api' => $LEMON_API_URL]);

      $options = [
        'headers' => [
          'Content-Type' => 'application/json',
          'Cookie' => 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
        ],
      ];

      if (!empty($inputs)) {

        \Drupal::logger('api_lemon_pleiade')->info('Inputs dans la requête: @inp', ['@inp' => $inputs]);

        if ($method == 'GET') {
          $LEMON_API_URL .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $LEMON_API_URL .= '&' . $param . '=' . $value;
          }
        } else {
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

    ////////////////////////////////////////////////////////
    //                                                    //
    //     REQUETE SI API PASTELL DOCUMENTS + ENTITES     //
    //                                                    //
    ////////////////////////////////////////////////////////
    elseif ($application == 'pastell') {

      if ($this->settings_pastell->get('field_pastell_auth_method') == 'cas' || $this->settings_pastell->get('field_pastell_auth_method') == 'oidc') {
        $PT_request_url = $api . '?auth=cas';
      } else {
        $PT_request_url = $api;

      }
      // ProxyTicket
      // On utilise le sergvice du module CAS Drupal\cas\Service\CasProxyHelper;
      $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($PT_request_url);
      
      \Drupal::logger('api_pastell_pleiade')->debug('PT: ' . $proxy_ticket);

      $PASTELL_API_URL = $PT_request_url . '&ticket=' . $proxy_ticket;


      $options = [
        'headers' => [
          'Content-Type' => 'application/json',
          'Cookie' => 'lemonldap=' . $_COOKIE['lemonldap'],
        ],
      ];

      if (!empty($inputs)) {


        if ($method == 'GET') {
          $PASTELL_API_URL .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $PASTELL_API_URL .= '&' . $param . '=' . $value;
          }
        } else {
          //POST request send data in array index form_params.
          $options['body'] = $inputs;
        }
      }
      \Drupal::logger('api_pastell_pleiade')->debug('requête incoming: ' . $PASTELL_API_URL);
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
    elseif ($application == 'zimbra') {

      $ZIMBRA_API_URL = $api;

      \Drupal::logger('api_zimbra_pleiade')->info('ZIMBRA_API_URL: @api', ['@api' => $ZIMBRA_API_URL]);

      $options = [
        'headers' => [
          'Content-Type' => 'application/json',
          'Cookie' => 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
        ],
      ];

      if (!empty($inputs)) {

        //  \Drupal::logger('api_zimbra_pleiade')->info('Inputs dans la requête: @inp', ['@inp' => $inputs ]);

        if ($method == 'GET') {
          $ZIMBRA_API_URL .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $ZIMBRA_API_URL .= '&' . $param . '=' . $value;
          }
        } else {
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

      ////////////////// ---------------> CODE POUR ROMAIN TEST API ZIMBRA  <-----------/////////////////

        try {
          // Zimbra API endpoint
          $zimbraApiUrl = 'https://courriel.sitiv.fr/service/preauth';

          $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
          // Get the LemonLDAP::NG session cookie value
          $sessionCookieValue = $_COOKIE['lemonldap'];
          $value1 = $user->getEmail();
          $value2 = 'name';
          $value3 = '0';
          $value4 = time();

          $key = $this->settings_zimbra->get('zm_auth_token'); // Replace with your secret key

          $data = $value1 . $value2 . $value3 . $value4;

          $hmac = hash_hmac('sha256', $data, $key);
          echo $hmac;
          $client = new Client();
          $options = [
              'headers' => [
                  'Cookie' => 'lemonldap=' . $sessionCookieValue,
                  'Content-Type' => 'application/json',
              ],
              'query' => [
                'preauth' => $hmac, // Include the preauth parameter
                'account' => $value1,
                'timestamp' => $value4,
                'expire' => '0'
              ],
              'verify' => false, // Adjust this option based on your SSL/TLS configuration
          ];



          // Send request to Zimbra API
          $response = $client->request('GET', $zimbraApiUrl, $options);
          $body = $response->getBody()->getContents();
          var_dump($client->request('POST', $zimbraApiUrl, $options));
          // Process Zimbra API response
          $responseData = Json::decode($body);

          // Extract the preauth token from the response
          $preauthToken = (string)$responseData['soap:Envelope']['soap:Body']['AuthResponse']['authToken'];

          // Use the preauth token for subsequent API requests
          return $preauthToken;
      } catch (RequestException $e) {
          \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
          // Handle the error as needed
      }
    }


    ////////////////////////////////////////////////////////
    //                                                    //
    //       REQUETE API Iparapheur doc à signer          //
    //                                                    //
    ////////////////////////////////////////////////////////
    // elseif ($application == 'parapheur') {

    //   if ($this->settings_parapheur->get('field_parapheur_auth_method') == 'cas' || $this->settings_parapheur->get('field_parapheur_auth_method') == 'oidc') {
    //     $PARAPHEUR_AP_URL = $api . '?auth=cas';
    //   } else {
    //     $PARAPHEUR_AP_URL = $api;
    //   }


    //   //     // ProxyTicket

    //   // TEST
    //   $PT_request_url = 'https://iparapheurdev.ecollectivites.fr/iparapheur/proxy/alfresco/parapheur/bureaux?auth=cas';

    //   // On utilise le service du module CAS Drupal\cas\Service\CasProxyHelper;
    //   $proxy_ticket = \Drupal::service('cas.proxy_helper')->getProxyTicket($PT_request_url);
    //   //  $PARAPHEUR_AP_URL = $PT_request_url . '&ticket=' . $proxy_ticket;

    //   $PARAPHEUR_AP_URL = 'https://iparapheurdev.ecollectivites.fr/iparapheur/proxy/alfresco/parapheur/bureaux?auth=cas&ticket=' . $proxy_ticket;
    //   //  $PARAPHEUR_AP_URL = '	https://iparapheurdev.ecollectivites.fr/';

    //   $options = [
    //     'headers' => [
    //       'Content-Type' => 'application/json',
    //       'Cookie' => 'llnglanguage=fr; lemonldap=' . $_COOKIE['lemonldap']
    //     ],
    //   ];


    //   if (!empty($inputs)) {

    //     if ($method == 'GET') {
    //       $PARAPHEUR_AP_URL .= '?' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
    //       foreach ($inputs as $param => $value) {
    //         $PARAPHEUR_AP_URL .= '&' . $param . '=' . $value;
    //       }
    //     } else {
    //       //POST request send data in array index form_params.
    //       $options['body'] = $inputs;
    //     }
    //   }

    //   try {
    //     $clientRequest = $this->client->request($method, $PARAPHEUR_AP_URL, $options);
    //     $body = $clientRequest->getBody()->getContents();

    //   } catch (RequestException $e) {
    //     \Drupal::logger('api_parapheur_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
    //   }

    //   return Json::encode('A configurer');
    //   //  return Json::decode($body);
    //   //   }
    // }
    ////////////////////////////////////////////////////////
    //                                                    //
    //     REQUETE SI API NEXTCLOUD --- NOTIFICATIONS     //
    //                                                    //
    ////////////////////////////////////////////////////////
    elseif ($application == 'nextcloud') {
      // Nextcloud API URL
      $apiUrl = $api; // Replace with your Nextcloud API URL

      // Create a new cURL resource

      $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
      if ($user->get('field_nextcloud_api_key')->value) {
        $nc_key = $user->get('field_nextcloud_api_key')->value;
        // var_dump($nc_key);

        // Ajout modification pour clé api User pour SITIV 
      }
      if ($user->get('field_nextcloud_api_user')->value) {
        $displayName = $user->get('field_nextcloud_api_user')->value;
      } else {
        if ($user->getDisplayName()) {
          $displayName = $user->getDisplayName();
        }
      }

      // Fin AJOUT modif pour SITIV
      $token_authent = base64_encode($displayName . ':' . $nc_key);
      // var_dump($token_authent);

      $headers = array(
        'OCS-APIRequest: true',
        'Authorization: Basic ' . $token_authent
      );

      // Set the cURL options
      // $url = 'https://idtest.ecollectivites.fr/ocs/v2.php/apps/notifications/api/v2/notifications?format=json';
      $ch = curl_init();
      // Set the URL to send the request to
      curl_setopt($ch, CURLOPT_URL, $apiUrl);

      // Set the HTTP method to GET
      curl_setopt($ch, CURLOPT_HTTPGET, true);

      // Return the response as a string instead of outputting it directly
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
      // Execute the cURL request
      $response = curl_exec($ch);
      $response = json_decode($response);
      // Check for any errors
      if (curl_errno($ch)) {
        echo 'Error: ' . curl_error($ch);
      }

      // Close the cURL resource
      curl_close($ch);

      return ($response);
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
  public function curlGet($endpoint, $inputs, $api, $application)
  {
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
  public function curlPost($endpoint, $inputs, $api, $application)
  {
    return $this->executeCurl($endpoint, "POST", $inputs, $api, $application);
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //  FONCTIONS POUR API LEMONLDAP APPLICATION + SESSIONTIME  //
  //                                                          //
  //////////////////////////////////////////////////////////////

  public function searchMyApps()
  {
    $endpoints = $this->settings_lemon->get('field_lemon_myapps_url'); // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    \Drupal::logger('api_lemon_pleiade')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }
  public function searchMySession()
  {
    $endpoints = $this->settings_lemon->get('field_lemon_sessioninfo_url'); // Endpoint myapplications de Lemon qui renvoie les dernières connexions
    \Drupal::logger('api_lemon_pleiade')->info('function searchMySession triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //  FONCTIONS POUR API PASTELL ENTITES ET DOCUMENTS ENTITE  //
  //                                                          //
  //////////////////////////////////////////////////////////////

  public function searchMyDocs($id_e)
  {
    $endpoints = $this->settings_pastell->get('field_pastell_documents_url'); // Endpoint field_pastell_documents_url de Pastell qui renvoi la liste des documents Pastell
    \Drupal::logger('api_pastell_pleiade')->alert('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_documents_url') . $id_e . '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents'), 'pastell');
  }
  public function searchMyEntities()
  {
    $endpoints = $this->settings_pastell->get('field_pastell_entities_url');
    \Drupal::logger('api_pastell_pleiade')->alert('function searchMyentities triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function searchMyFlux()
  {
    $endpoints = $this->settings_pastell->get('field_pastell_flux_url');
    \Drupal::logger('api_pastell_pleiade')->alert('function searchMyFlux triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_flux_url'), 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }


  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API ZIMBRA MAILS / AGENDA    //
  //                                                          //
  //////////////////////////////////////////////////////////////


  public function searchMyMails()
  {
    // $endpoints = $this->settings_zimbra->get('field_zimbra_url'); // Endpoint mail de Zimbra configuré dans l'admin du module
    $user = \Drupal::currentUser();
    $email = $user->getEmail();
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyMails triggered !');
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet([], [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/zimbra_test.json', 'zimbra');
    } else {
      return $this->curlGet([], [], $this->settings_zimbra->get('field_zimbra_url') . 'home/' . $email . '/' . $this->settings_zimbra->get('field_zimbra_mail'), 'zimbra');
    }
  }

  public function searchMyTasks()
  {
    // $endpoints = $this->settings_zimbra->get('field_zimbra_url');  // Endpoint mail de Zimbra configuré dans l'admin du module
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyTasks triggered !');
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet([], [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
    } else {
      return $this->curlGet([], [], $this->settings_zimbra->get('field_zimbra_url') . 'home/' . $email . '/' . $this->settings_zimbra->get('field_zimbra_tasks'), 'zimbra');
    }
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API IPARAPHEUR               //
  //                                                          //
  //////////////////////////////////////////////////////////////


  public function searchMyDesktop()
  {

    $endpoints = $this->settings_parapheur->get('field_parapheur_bureaux_url'); // Endpoint myapplications de Lemon qui renvoie toutes nos apps
    return $this->curlGet([], [], $this->settings_parapheur->get('field_parapheur_url') . $this->settings_parapheur->get('field_parapheur_bureaux_url'), 'parapheur');
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API NEXTCLOUD               //
  //                                                          //
  //////////////////////////////////////////////////////////////


  public function getNextcloudNotifs()
  {
    \Drupal::logger('api_nextcloud_pleiade')->info('function getNextcloudNotifs triggered !');
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_nextcloud_pleiade')) {
      $endpoints = $this->settings_nextcloud->get('nextcloud_endpoint_notifs'); // Endpoint myapplications de Lemon qui renvoie toutes nos apps
      return $this->curlGet([], [], $this->settings_nextcloud->get('nextcloud_url') . $endpoints . '?format=json', 'nextcloud');
    }
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
  public static function arrayKeyfirst($array)
  {
    if (!function_exists('array_key_first')) {
      foreach ($array as $key => $unused) {
        return $key;
      }
      return NULL;
    } else {
      return array_key_first($array);
    }
  }
}