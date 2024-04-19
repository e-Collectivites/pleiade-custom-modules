<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

use Symfony\Component\HttpFoundation\JsonResponse;
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
      // return;
    }
    $this->client = \Drupal::httpClient();
    // get our custom module settings
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_lemon_pleiade')) {
      $this->settings_lemon = \Drupal::config('api_lemon_pleiade.settings');
      // \Drupal::logger('api_lemon_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_pastell_pleiade')) {
      $this->settings_pastell = \Drupal::config('api_pastell_pleiade.settings');
      //  \Drupal::logger('api_pastell_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_parapheur_pleiade')) {
      $this->settings_parapheur = \Drupal::config('api_parapheur_pleiade.settings');
      // \Drupal::logger('api_parapheur_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_nextcloud_pleiade')) {
      $this->settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
      //  \Drupal::logger('api_nextcloud_pleiade')->debug('module activé');
    }
    if ($moduleHandler->moduleExists('api_humhub_pleiade')) {
      $this->settings_humhub = \Drupal::config('api_humhub_pleiade.settings');
    }
    if ($moduleHandler->moduleExists('module_actu_pleiade')) {
      $this->settings_actu = \Drupal::config('module_actu_pleiade.settings');
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
        
        return Json::decode($body);
        
      } catch (RequestException $e) {
        \Drupal::logger('api_lemon_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        return Json::decode('0');
        
      }
     
      
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
          'Content-Type' => 'multipart/form-data',
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
          $PASTELL_API_URL = $api . '&' . self::arrayKeyfirst($inputs) . '=' . array_shift($inputs);
          foreach ($inputs as $param => $value) {
            $PASTELL_API_URL .= '&' . $param . '=' . $value;
          }
          $options += [
            'auth' => [$this->settings_pastell->get('field_pastell_username_doc_lots'), $this->settings_pastell->get('field_pastell_password_doc_lots')]
          ];
        }
      }

      \Drupal::logger('api_pastell_pleiade')->debug('requête incoming: ' . $PASTELL_API_URL);
      try {
        $clientRequest = $this->client->request($method, $PASTELL_API_URL, $options);
        $body = $clientRequest->getBody()->getContents();
        return Json::decode($body);
      } catch (RequestException $e) {
        \Drupal::logger('api_pastell_pleiade')->debug('Curl error: @error', ['@error' => $e->getMessage()]);
      }
     
    }

    ////////////////////////////////////////////////////////
    //                                                    //
    //       REQUETE API Iparapheur doc à signer          //
    //                                                    //
    ////////////////////////////////////////////////////////
    elseif ($application == 'parapheur') {

      $departement = $_COOKIE["departement"];
      if($departement == "85b"){
          $nbDpt = '85';
      }
      elseif($departement == "85"){
          $nbDpt = '';
      }
      else{
          $nbDpt = $departement;
      }

      $current_user = \Drupal::currentUser();
      if ($current_user->id() != 0) {
        $username = $current_user->getAccountName();
      }
      $client = new Client([
        'verify' => false, // Désactiver la vérification SSL
      ]);

      try {
        // Construire l'URL de la première requête
        $IP_request_url = $this->settings_parapheur->get('field_parapheur_url') . $nbDpt.'.ecollectivites.fr/' . $this->settings_parapheur->get('field_parapheur_auth_url') . $username . '/forceLogin';
        // Logger l'URL de la première requête
        \Drupal::logger('api_parapheur_pleiade')->info('Requete iParapheur API : @ReqIP', ['@ReqIP' => $IP_request_url]);

        // Faire la première requête POST
        $ipRequest = $client->request('POST', $IP_request_url, []);
        $response = $ipRequest->getBody()->getContents();
        $json_response = json_decode($response);

      } catch (RequestException $e) {
        // Gérer les erreurs de requête
        \Drupal::logger('api_parapheur_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        return Json::decode('0');
      }

      try {
        // Construire l'URL de la deuxième requête
        $IP_request_url = $api . '?ticket=' . $json_response->ticket;

        // Logger l'URL de la deuxième requête
        \Drupal::logger('api_parapheur_pleiade')->info('Requete iParapheur API : @ReqIP', ['@ReqIP' => $IP_request_url]);

        // Faire la deuxième requête GET
        $ipRequest = $client->request('GET', $IP_request_url, []);
        $response = $ipRequest->getBody()->getContents();
        return Json::decode($response);

      } catch (RequestException $e) {
        // Gérer les erreurs de requête
        \Drupal::logger('api_parapheur_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        return Json::decode('0');
      }

    }

    ////////////////////////////////////////////////////////
    //                                                    //
    //       REQUETE API articles ecollectivités          //
    //                                                    //
    ////////////////////////////////////////////////////////
    elseif ($application == 'articles_ecoll') {
      try {
        $response = $this->client->request('GET', 'https://ecollectivites.fr/api/v1/articles', []);

        // Vérifier le code de statut
        $statusCode = $response->getStatusCode();

        if ($statusCode === 200) {
            $body = $response->getBody()->getContents();
            
            // Vérifier si la réponse est déjà au format JSON
            $jsonData = json_decode($body, true);
            if ($jsonData === null && json_last_error() !== JSON_ERROR_NONE) {
                // Si la réponse n'est pas au format JSON, convertir en JSON
                $jsonData = ['data' => $body];
                $body = json_encode($jsonData);
            }
            
            return $body;
        } else {
            $errorMessage = "Erreur: Code de statut $statusCode lors de la récupération des données.";
            \Drupal::logger('fetch_articles')->error($errorMessage);
            return $errorMessage;
        }
        
    } catch (RequestException $e) {
        // Gérer les exceptions de requête Guzzle
        if ($e->hasResponse()) {
            $statusCode = $e->getResponse()->getStatusCode();
            $errorMessage = "Erreur: Code de statut $statusCode lors de la requête.";
            \Drupal::logger('fetch_articles')->error($errorMessage);
            return json_encode(['error' => $errorMessage]);
        } else {
            $errorMessage = "Erreur: " . $e->getMessage();
            \Drupal::logger('fetch_articles')->error($errorMessage);
            return json_encode(['error' => $errorMessage]);
        }
    }

    }

    ////////////////////////////////////////////////////////
    //                                                    //
    //                        REQUETE API humhub          //
    //                                                    //
    ////////////////////////////////////////////////////////
    
    elseif ($application == 'humhub') {
      try {
        $response = $this->client->request($method, $api, [
          'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $inputs["token"]
          ],
            'verify' => false,
            'timeout' => 60
        ]);
    
        
        // Récupération du contenu de la réponse
        $body = $response->getBody()->getContents();
        
        // Retourner une réponse JSON
        return Json::decode($body);
    } catch (Exception $e) {
      return Json::decode($e->getMessage());
    }

    // $headers = array(
    //   'Content-Type: application/json',
    //   'Authorization: Bearer ' . $inputs["token"]
    // );
    // $ch = curl_init();
    // curl_setopt($ch, CURLOPT_URL, $api);
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    // curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Désactive la vérification du certificat SSL
    
    // $response = curl_exec($ch);
    // $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // curl_close($ch);
    // if ($httpCode != 200) {
    //   // Gérer les erreurs HTTP ici
    //   $errorMessage = "Request failed with status code: {$httpCode}";
    //   return Json::decode($errorMessage);
    // } else {
    //   // Retourner la réponse JSON
    //   return Json::decode($response);
    // }
    
    

    }
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
      if($nc_key && $displayName){
      $token_authent = base64_encode($displayName . ':' . $nc_key);
      }
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

  // //////////////////////////////////////////////////////////////
  // //                                                          //
  // //  FONCTIONS POUR API HUmHUB  //
  // //                                                          //
  // //////////////////////////////////////////////////////////////

  // public function getMyNotifications()
  // {
  //   $endpoints = $this->settings_lemon->get('field_lemon_myapps_url'); // Endpoint myapplications de Lemon qui renvoie toutes nos apps
  //   \Drupal::logger('api_lemon_pleiade')->info('function searchMyApps triggered !');
  //   return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon');
  // }

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
    \Drupal::logger('api_pastell_pleiade')->debug('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_documents_url') . $id_e . '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents'), 'pastell');
  }
  public function searchMyEntities()
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function searchMyentities triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function searchMyFlux()
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function searchMyFlux triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_flux_url'), 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function creationDoc($id_e)
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function creationDoc triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . "api/create-document.php&id_e=" . $id_e . "&type=document-a-signer", 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function getSousTypeDoc($data)
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function getSousTypeDoc triggered !');
    return $this->curlPost([], $data, $this->settings_pastell->get('field_pastell_url') . "api/external-data.php", 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function postModifDoc($data)
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function postModifDoc triggered !');
    return $this->curlPost([], $data, $this->settings_pastell->get('field_pastell_url') . "/api/modif-document.php", 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API IPARAPHEUR               //
  //                                                          //
  //////////////////////////////////////////////////////////////


  public function searchMyDesktop($dpt)
  {
// var_dump($this->settings_parapheur->get('field_parapheur_url').$dpt.".ecollectivites.fr" . $this->settings_parapheur->get('field_parapheur_bureaux_url'));
    return $this->curlGet([], [], $this->settings_parapheur->get('field_parapheur_url').$dpt.".ecollectivites.fr" . $this->settings_parapheur->get('field_parapheur_bureaux_url'), 'parapheur');
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR R2CUP2RER LES ARTICLES       //
//                            E-COLLECTIVITES                 //
  //////////////////////////////////////////////////////////////


  public function getEcollArticles()
  {
    return $this->curlGet([], [], 'https://ecollectivites.fr/api/v1/artics', 'articles_ecoll');
  }
  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API HUMHUB                   //
  //                                                          //
  //////////////////////////////////////////////////////////////
  public function get_notif_humhub($token)
  {
    return $this->curlGet([], $token, $this->settings_humhub->get('humhub_url') . '/api/v1/notification/unseen', 'humhub');
  }
  public function get_messages_humhub($token)
  {
    return $this->curlGet([], $token, $this->settings_humhub->get('humhub_url') . '/api/v1/mail', 'humhub');
  }
  public function get_spaces($token)
  {
    return $this->curlGet([], $token, $this->settings_humhub->get('humhub_url') . '/api/v1/space', 'humhub');
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
  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API GLPI                     //
  //                                                          //
  //////////////////////////////////////////////////////////////


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
