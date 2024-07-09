<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\user\Entity\User;
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
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    }
    if ($moduleHandler->moduleExists('api_zimbra_pleiade')) {
      $this->settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
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
  private function executeCurl($endpoint, $method, $inputs, $api, $application, $zimbra_mail, $zimbra_token, $zimbra_domain)
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

      $current_user = \Drupal::currentUser();
      if ($current_user->id() != 0) {
        $username = $current_user->getEmail();
      }
      $client = new Client([
        'verify' => false, // Désactiver la vérification SSL
      ]);

      try {
        // Construire l'URL de la première requête
$IP_request_url = 'https://parapheurv5.sitiv.fr/auth/realms/api/protocol/openid-connect/token';
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
    //   REQUETE API ZIMBRA RECUPERATION AGENDA / MAILS   //
    ////////////////////////////////////////////////////////
    elseif ($application == 'zimbra') {

      $sessionCookieValue = $_COOKIE['lemonldap'];
      // Get the user's email and other required data
      $value1 = $zimbra_mail;
      $value2 = 'name';
      $value3 = '0';
      $value4 = time() * 1000; // Convert to milliseconds as the original code did
      $key = $zimbra_token;
      $data = $value1 . "|" . $value2 . "|" . $value3 . "|" . $value4;
      $hmac = hash_hmac('sha1', $data, $key);
      $preauthURL = $zimbra_domain . "service/preauth?account=" . $value1 . "&timestamp=" . $value4 . "&expires=0&preauth=" . $hmac;
 	\Drupal::logger('api_zimbra_pleiade')->info($preauthURL);
      ob_start();
      try {
        $clientRequest = $this->client->request('GET', $preauthURL, [
          'headers' => [
            'Content-Type' => 'application/json',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
          'debug' => true,
          'allow_redirects' => false,
        ]);
        $responseToken = $clientRequest->getBody()->getContents();
        $debugInfo = ob_get_clean();
      } catch (RequestException $e) {
        \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      $pattern = '/Set-Cookie: ZM_AUTH_TOKEN=([^;]+)/';
      if (preg_match($pattern, $debugInfo, $matches)) {
        $zmAuthToken = $matches[1];
        $apiEndpoint = $zimbra_domain . 'service/soap';
        $requestXml =
          '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                    <soap:Header>
                        <context xmlns="urn:zimbra">
                            <format type="js"/>
                            <authToken>' . $zmAuthToken . '</authToken>
                        </context>
                    </soap:Header>
                    <soap:Body>' . $endpoint . '</soap:Body>
                </soap:Envelope>';

        try {
          $clientRequest = $this->client->request('POST', $apiEndpoint, [
            'headers' => [
              'Content-Type' => 'application/soap+xml',
              'Cookie' => 'lemonldap=' . $sessionCookieValue,
            ],
            'body' => $requestXml,
          ]);
          $responseSecond = $clientRequest->getBody()->getContents();
        } catch (RequestException $e) {
          \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        }

        $responseJson[] = Json::decode($responseSecond);

        if (strpos($endpoint, 'types="appointment"') !== false) {
          foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as &$appointment) {

            // Check if 'recur' exists in the appointment
            if (isset($appointment['recur']) && $appointment['recur'] == 1) {
              $id_appointment = $appointment['id'];

              $ApptApiEndpoint = $zimbra_domain . 'service/soap';
              $ApptRequestXml =
                '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                      <soap:Header>
                          <context xmlns="urn:zimbra">
                              <format type="js"/>
                              <authToken>' . $zmAuthToken . '</authToken>
                          </context>
                      </soap:Header>
                      <soap:Body><GetAppointmentRequest xmlns="urn:zimbraMail" id="' . $id_appointment . '" sync="1"/></soap:Body>
                  </soap:Envelope>';

              try {
                $clientRequest = $this->client->request('POST', $ApptApiEndpoint, [
                  'headers' => [
                    'Content-Type' => 'application/soap+xml',
                    'Cookie' => 'lemonldap=' . $sessionCookieValue,
                  ],
                  'body' => $ApptRequestXml,
                ]);
                $responseAppt = $clientRequest->getBody()->getContents();
              } catch (RequestException $e) {
                \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
              }

              $responseApptJson = Json::decode($responseAppt);
              $recur_detail = $responseApptJson["Body"]["GetAppointmentResponse"]["appt"][0]['inv'][0]['comp'][0]['recur'];

              // Replace 'recur' with $recur_detail in the appointment
              $appointment['recur'] = $recur_detail;
            }
          }
        }
      }
      return ($responseJson);


      ////////////////////////////////////////////////////////
      //       REQUETE API glpi             
      ////////////////////////////////////////////////////////

    } elseif ($application == 'glpi') {

      $url_api_glpi = $api;
      $glpi_url = $this->settings_glpi->get('glpi_url');
      $app_token = $this->settings_glpi->get('app_token');

      // Load the current user.
      $current_user = \Drupal::currentUser();

      // Load the user entity.
      $user = User::load($current_user->id());
      $sessionCookieValue = $_COOKIE['lemonldap'];
      // Check if the user entity is valid.
      if ($user) {
        $glpi_user_token = $user->get('field_glpi_user_token')->value;
        if (!$glpi_user_token) {
          \Drupal::logger('api_glpi_pleiade')->alert("User token manquant");
          return;
        }
      }
      $url1 = $glpi_url . '/apirest.php/initSession?app_token=' . $app_token . '&user_token=' . $glpi_user_token;
      try {
        $clientRequest = $this->client->request('POST', $url1, [
          'headers' => [
            'Content-Type' => 'text/plain',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
        ]);
        $response1 = $clientRequest->getBody()->getContents();
      } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      $data = json_decode($response1);
      $sessionToken = $data->session_token;
      if (substr($url_api_glpi, -7) === "/Ticket") {
        if ($inputs) {
          $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdown=true&sort=status&' . $inputs;
        } else {
          $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdowns=true&sort=status';
        }
      } else {
        $url = $url_api_glpi . '?app_token=' . $app_token . '&session_token=' . $sessionToken . '&expand_dropdowns=true';
      }

      try {
        $clientRequest = $this->client->request('GET', $url, [
          'headers' => [
            'Content-Type' => 'text/plain',
            'Cookie' => 'lemonldap=' . $sessionCookieValue,
          ],
        ]);
        $response = $clientRequest->getBody()->getContents();
      } catch (RequestException $e) {
        \Drupal::logger('api_glpi_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      $response_data = Json::decode($response);
      return ($response_data);

    }




    ////////////////////////////////////////////////////////
    //                                                    //
    //       REQUETE API articles           //
    //                                                    //
    ////////////////////////////////////////////////////////
	elseif ($application == 'articles_ecoll') {
      if($this->settings_actu->get('url_site')){
        if($this->settings_actu->get('flux_rss') == false){
          try {
              $response = $this->client->request('GET', $this->settings_actu->get('url_site') , []);

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
        else
        {     
     // Récupérer le contenu du flux RSS
          $rssUrl = $this->settings_actu->get('url_site');
	
          $rssContent = file_get_contents($rssUrl);

          if ($rssContent === false) {
              // Gérer les erreurs si la récupération du flux a échoué
              return "Erreur lors de la récupération du flux RSS.";
          } else {
              // Retourner le contenu complet du flux RSS
              return $rssContent;
          }
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
public function curlGet($endpoint, $inputs, $api, $application, $email, $token, $domain)
  {
    return $this->executeCurl($endpoint, "GET", $inputs, $api, $application, $email, $token, $domain);
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
    //\Drupal::logger('api_lemon_pleiade')->info('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon', '', '', '');
  }
  public function searchMySession()
  {
    $endpoints = $this->settings_lemon->get('field_lemon_sessioninfo_url'); // Endpoint myapplications de Lemon qui renvoie les dernières connexions
    //\Drupal::logger('api_lemon_pleiade')->info('function searchMySession triggered !');
    return $this->curlGet($endpoints, [], $this->settings_lemon->get('field_lemon_url'), 'lemon', '', '', '');
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //  FONCTIONS POUR API PASTELL ENTITES ET DOCUMENTS ENTITE  //
  //                                                          //
  //////////////////////////////////////////////////////////////

  public function searchMyDocs($id_e)
  {
    $endpoints = $this->settings_pastell->get('field_pastell_documents_url'); // Endpoint field_pastell_documents_url de Pastell qui renvoi la liste des documents Pastell
    //\Drupal::logger('api_pastell_pleiade')->debug('function searchMyApps triggered !');
    return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_documents_url') . $id_e . '&limit=' . $this->settings_pastell->get('field_pastell_limit_documents'), 'pastell', '', '', '');
  }
  public function searchMyEntities()
  {
    //\Drupal::logger('api_pastell_pleiade')->debug('function searchMyentities triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell', '', '', '');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function searchMyFlux()
  {
    //\Drupal::logger('api_pastell_pleiade')->debug('function searchMyFlux triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_flux_url'), 'pastell', '', '', '');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function creationDoc($id_e)
  {
    //\Drupal::logger('api_pastell_pleiade')->debug('function creationDoc triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . "api/create-document.php&id_e=" . $id_e . "&type=document-a-signer", 'pastell', '', '', '');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function getSousTypeDoc($data)
  {
    \Drupal::logger('api_pastell_pleiade')->debug('function getSousTypeDoc triggered !');
    return $this->curlPost([], $data, $this->settings_pastell->get('field_pastell_url') . "api/external-data.php", 'pastell', '', '', '');
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
    return $this->curlGet([], [], $this->settings_parapheur->get('field_parapheur_url') . $this->settings_parapheur->get('field_parapheur_bureaux_url'), 'parapheur', '', '', '');
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR R2CUP2RER LES ARTICLES       //
  //                          E-COLLECTIVITES                 //
  //////////////////////////////////////////////////////////////


  public function getEcollArticles()
  {
    return $this->curlGet([], [], 'https://ecollectivites.fr/api/v1/artics', 'articles_ecoll', '', '', '');
  }

//////////////////////////////////////////////////////////////
  //   FONCTIONS POUR API ZIMBRA MAILS / AGENDA 
  //////////////////////////////////////////////////////////////


  public function searchMyMails($mail_endpoint, $email, $token, $domain)
  {
    // $endpoints = $this->settings_zimbra->get('field_zimbra_url'); // Endpoint mail de Zimbra configuré dans l'admin du module
    \Drupal::logger('api_zimbra_pleiade')->info('mail endpoint: ' . $mail_endpoint);
      return $this->curlGet($mail_endpoint, [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra', $email, $token, $domain);
  }

  public function searchMyTasks($tasks_endpoint, $email, $token, $domain)
  {
    // $endpoints = $this->settings_zimbra->get('field_zimbra_url');  // Endpoint mail de Zimbra configuré dans l'admin du module
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyTasks triggered !');
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet([], [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
    } else {
      return $this->curlGet($tasks_endpoint, [], $this->settings_zimbra->get('field_zimbra_url') . $this->settings_zimbra->get('field_zimbra_tasks'), 'zimbra', $email, $token, $domain);
    }
  }
  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API HUMHUB                   //
  //                                                          //
  //////////////////////////////////////////////////////////////
 /* public function get_notif_humhub($token)
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
  }*/


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
      return $this->curlGet([], [], $this->settings_nextcloud->get('nextcloud_url') . $endpoints . '?format=json', 'nextcloud', '', '', '');
    }
  }
  //////////////////////////////////////////////////////////////
  //                                                          //
  //              FONCTIONS POUR API GLPI                     //
  //                                                          //
  //////////////////////////////////////////////////////////////

  public function getGLPITickets()
  {
    \Drupal::logger('api_glpi_pleiade')->info('function getGLPITickets triggered !');
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $endpoints = $this->settings_glpi->get('endpoint_ticket'); // Endpoint myapplications de Lemon qui renvoie toutes nos apps
      return $this->curlGet([], [], $this->settings_glpi->get('glpi_url') . '/apirest.php/' . $endpoints, 'glpi', '', '', '');
    }
  }

  public function getStatutActorGLPI($id)
  {
    // \Drupal::logger('api_glpi_pleiade')->info('function getGLPITickets triggered !');
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      return $this->curlGet([], [], $this->settings_glpi->get('glpi_url') . '/apirest.php/Ticket/' . $id . '/Ticket_User', 'glpi', '', '', '');
    }
  }

  public function getLastGLPITickets()
  {
    \Drupal::logger('api_glpi_pleiade')->info('function getLastGLPITickets triggered !');
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $endpoints = $this->settings_glpi->get('endpoint_ticket'); // Endpoint myapplications de Lemon qui renvoie>
      return $this->curlGet([], 'range=0-4', $this->settings_glpi->get('glpi_url') . '/apirest.php/' . $endpoints, 'glpi', '', '', '');
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
