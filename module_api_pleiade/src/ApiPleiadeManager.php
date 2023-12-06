<?php

namespace Drupal\module_api_pleiade;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Drupal\cas\Service\CasProxyHelper;
use Drupal\user\Entity\UserInterface;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\user\Entity\User;
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
    if ($moduleHandler->moduleExists('api_zimbra_pleiade')) {
      $this->settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
    //  \Drupal::logger('api_zimbra_pleiade')->debug('module activé');

    }
    // if ($moduleHandler->moduleExists('api_parapheur_pleiade')) {
    //   $this->settings_parapheur = \Drupal::config('api_parapheur_pleiade.settings');
    //   \Drupal::logger('api_parapheur_pleiade')->debug('module activé');
    // }
    if ($moduleHandler->moduleExists('api_nextcloud_pleiade')) {
      $this->settings_nextcloud = \Drupal::config('api_nextcloud_pleiade.settings');
    //  \Drupal::logger('api_nextcloud_pleiade')->debug('module activé');

    }
	if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    //  \Drupal::logger('api_glpi_pleiade')->debug('module activé');
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
        \Drupal::logger('api_pastell_pleiade')->debug('Curl error: @error', ['@error' => $e->getMessage()]);
      }
      return Json::decode($body);
    }

    ////////////////////////////////////////////////////////
    //                                                    //
    //   REQUETE API ZIMBRA RECUPERATION AGENDA / MAILS   //
    //                                                    //
    ////////////////////////////////////////////////////////
    elseif ($application == 'zimbra') {


      //\Drupal::logger('api_zimbra_pleiade')->info('ZIMBRA_API_URL: @api', ['@api' => $zimbraApiUrl]);

      if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
        $ZIMBRA_API_URL = $api;
        try {
          $clientRequest = $this->client->request($method, $ZIMBRA_API_URL, []);
          $body = $clientRequest->getBody()->getContents();
        } catch (RequestException $e) {
         // \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
        }
  
        return Json::decode($body);
          // Zimbra API endpoint
      } 
      else
      { 
$domainPlusTokenValue = $this->settings_zimbra->get('token_plus_domain');

        // Initialiser un tableau pour stocker les objets.
        $domainTokenArray = [];

        // Diviser la valeur en lignes (séparées par "\n").
        $lines = explode("\n", $domainPlusTokenValue);

        // Parcourir chaque ligne.
        foreach ($lines as $line) {
            // Diviser la ligne en domaine et token (séparés par "| |").
            $parts = explode("| |", $line);
            
            // Vérifier s'il y a deux parties (domaine et token).
            if (count($parts) === 2) {
                $domain = trim($parts[0]);
 		$token = trim($parts[1]);               
                // Créer un objet avec les propriétés domaine et token.
                $domainToken = (object) [
                    'domain' => $domain,
                    'token' => $token,
                ];
                
                // Ajouter l'objet au tableau.
                $domainTokenArray[] = $domainToken;
            }
        }

        $responseJson = array();
        foreach ($domainTokenArray as $domainToken) {      
		 $sessionCookieValue = $_COOKIE['lemonldap'];

		// Get the user's email and other required data
		$user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());
		$value1 = $user->getEmail();
		$value2 = 'name';
		$value3 = '0';
		$value4 = time() * 1000; // Convert to milliseconds as the original code did	

        	$key = $domainToken->token; // Replace with your secret key   

		//$key = $this->settings_zimbra->get('zm_auth_token'); // Replace with your secret key   
	
   	        $data = $value1 ."|". $value2 ."|". $value3 ."|". $value4;
//		echo $data;
		$hmac = hash_hmac('sha1', $data, $key);

// Construct the preauth URL
          	$WEB_MAIL_PREAUTH_URL = $domainToken->domain."service/preauth"; // Replace with your preauth URL

		$preauthURL = $WEB_MAIL_PREAUTH_URL . "?account=" . $value1 . "&timestamp=" . $value4 . "&expires=0&preauth=" . $hmac;


// Set up the headers and data as needed for your request.
$headers = [
  'Content-Type: application/json',
  'Cookie: lemonldap=' . $sessionCookieValue, // Replace with your cookie value
];

// Initialize cURL session
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $preauthURL); // Set the URL
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return the transfer as a string instead of outputting it directly
curl_setopt($ch, CURLOPT_HEADER, true); // Include the response headers in the output
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Adjust this option based on your SSL/TLS configuration
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers); // Set the custom headers

// Execute the cURL request
$response = curl_exec($ch);
$pattern = '/ZM_AUTH_TOKEN=([^;]+)/';
// Check for cURL errors
if (curl_errno($ch)) {
    echo 'cURL error: ' . curl_error($ch);
}

// Get the HTTP response code
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Close cURL session
curl_close($ch);

if (preg_match($pattern, $response, $matches)) {
    // Extract the token value from the first capturing group ($matches[1])
    $zmAuthToken = $matches[1];
$apiEndpoint = $domainToken->domain .'service/soap';
// Get the Zimbra SearchRequest value from the settings (replace 'field_zimbra_agenda' with the actual field name)
$searchRequest = $endpoint;
//$searchRequest = htmlspecialchars($searchRequest);
// The SOAP request XML
$requestXml = 
'<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
    <soap:Header>
        <context xmlns="urn:zimbra">
            <format type="js"/>
            <authToken>' . $zmAuthToken . '</authToken>
        </context>
    </soap:Header>
    <soap:Body>' . $searchRequest . '</soap:Body>
</soap:Envelope>';

//echo $requestXml;

// Create cURL resource
$curl = curl_init();

// Set cURL options
curl_setopt($curl, CURLOPT_URL, $apiEndpoint);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, $requestXml);
curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/soap+xml'));
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification (use with caution)

// Execute the cURL request
$responseXml = curl_exec($curl);
//var_dump($responseXml);
// Check for cURL errors
if (curl_errno($curl)) {
    echo "cURL Error: " . curl_error($curl);
}

// Close cURL resource
curl_close($curl);
$responseJson[] = Json::decode($responseXml);
//var_dump(($responseJson));
}
          //$responseJson[] = $responseXml;
          //var_dump(gettype($responseXml));
// Return the JSON response
        }
        return ($responseJson);}
}

    elseif ($application == 'glpi') {
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
        // Get the value of the 'glpi_user_token' field.
        $glpi_user_token = $user->get('field_glpi_user_token')->value;

        // Use the $glpi_user_token value as needed.
      }
        $url1 = $glpi_url . '/apirest.php/initSession?app_token='.$app_token.'&user_token='.$glpi_user_token;
      // // Initialize curl
        $headers = [
          'Cookie: lemonldap=' . $sessionCookieValue, // Replace with your cookie value
        ];
      $curl1 = curl_init($url1);
      // // Set the request method to POST
      curl_setopt($curl1, CURLOPT_POST, true);
      // // Set the response format to JSON
      
      // // Set the option to return the response as a string
      curl_setopt($curl1, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($curl1, CURLOPT_SSL_VERIFYPEER, false); // Adjust this option based on your SSL/TLS configuration
      curl_setopt($curl1, CURLOPT_HTTPHEADER, $headers);  
    // // Execute the request
      $response1 = curl_exec($curl1);
      // // Close the curl session
      curl_close($curl1);
      // // Decode the JSON response
      $data = json_decode($response1);

      // Récupérer la valeur du token
      $sessionToken = $data->session_token;
      // // Get the session token from the response
       $url = $url_api_glpi .'?app_token='. $app_token  .'&session_token='.$sessionToken.'&expand_dropdowns=true';
      // Session token obtained from initSession API
      // // Initialize curl
       $curl = curl_init($url);
      // // Set the request method to GET 
       curl_setopt($curl, CURLOPT_HTTPGET, true);
      // // Set the response format to JSON
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false); // Adjust this option based on your SSL/TLS configuration
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
      // // Set the option to return the response as a string   
       curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
      // // Execute the request 
       $response = curl_exec($curl);
      // // Close the curl session 
       curl_close($curl);
      // // Decode the JSON response
         $response_data = Json::decode($response); 
       return ($response_data);
      //return new JsonResponse(json_encode('null'), 200, [], true);

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
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell');
    // return $this->curlGet($endpoints, [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_entities_url'), 'pastell' );
  }
  public function searchMyFlux()
  {
    $endpoints = $this->settings_pastell->get('field_pastell_flux_url');
    \Drupal::logger('api_pastell_pleiade')->debug('function searchMyFlux triggered !');
    return $this->curlGet([], [], $this->settings_pastell->get('field_pastell_url') . $this->settings_pastell->get('field_pastell_flux_url'), 'pastell');
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
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyMails triggered !');
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet([], [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/zimbra_test.json', 'zimbra');
    } else {
      return $this->curlGet($this->settings_zimbra->get('field_zimbra_mail'), [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra');
    }
  }

  public function searchMyTasks()
  {
    // $endpoints = $this->settings_zimbra->get('field_zimbra_url');  // Endpoint mail de Zimbra configuré dans l'admin du module
    \Drupal::logger('api_zimbra_pleiade')->info('function searchMyTasks triggered !');
    if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
      return $this->curlGet([], [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
    } else {
      return $this->curlGet($this->settings_zimbra->get('field_zimbra_agenda'), [], $this->settings_zimbra->get('field_zimbra_url') . $this->settings_zimbra->get('field_zimbra_tasks'), 'zimbra');
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
      return $this->curlGet([], [], $this->settings_glpi->get('glpi_url') .'/apirest.php/'. $endpoints  , 'glpi');
    }
  }

public function getStatutActorGLPI( $id )
  {
   // \Drupal::logger('api_glpi_pleiade')->info('function getGLPITickets triggered !');
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      return $this->curlGet([], [], $this->settings_glpi->get('glpi_url') . '/apirest.php/Ticket/' . $id .'/Ticket_User', 'glpi');
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
