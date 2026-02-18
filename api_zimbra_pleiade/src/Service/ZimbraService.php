<?php

namespace Drupal\api_zimbra_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;

trait ApiLoggerTrait
{
    protected function logInfo(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->info("✅ $message", $context);
    }

    protected function logWarning(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->warning("⚠️ $message", $context);
    }

    protected function logError(string $channel, string $message, array $context = [])
    {
        \Drupal::logger($channel)->error("❌ $message", $context);
    }
}

class ZimbraService implements ZimbraServiceInterface
{
    use ApiLoggerTrait;

    protected $settings_zimbra;
    private $client;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_zimbra = $moduleHandler->moduleExists('api_zimbra_pleiade') ? \Drupal::config('api_zimbra_pleiade.settings') : NULL;
        $this->client = \Drupal::httpClient();

        $this->logInfo('api_zimbra_pleiade', 'ZimbraService initialized.');
    }

    public function searchMyMails($mail_endpoint, $email, $token, $domain)
    {
        $this->logInfo('api_zimbra_pleiade', "Searching mails for $email at endpoint $mail_endpoint");
        return $this->curlGet($mail_endpoint, [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra', $email, $token, $domain);
    }

    public function searchMyTasks($tasks_endpoint, $email, $token, $domain)
    {
        if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
            $this->logInfo('api_zimbra_pleiade', "Demo mode active: fetching tasks from JSON file.");
            return $this->curlGet('', [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
        }

        $url = $this->settings_zimbra->get('field_zimbra_url') . $this->settings_zimbra->get('field_zimbra_tasks');
        $this->logInfo('api_zimbra_pleiade', "Fetching tasks for $email from $url");
        return $this->curlGet($tasks_endpoint, [], $url, 'zimbra', $email, $token, $domain);
    }

    public function curlGet($endpoint, $inputs, $api, $application, $email = '', $token = '', $domain = '')
    {
        $this->logInfo('api_zimbra_pleiade', "Executing GET request to $api with endpoint $endpoint");
        $data = $this->executeCurl($endpoint, "GET", $inputs, $api, $application, $email, $token, $domain);
        $this->logInfo('api_zimbra_pleiade', "GET request completed for endpoint $endpoint");
        return $data;
    }

    public function executeCurl($endpoint, $method, $inputs, $api, $application, $zimbra_mail, $zimbra_token, $zimbra_domain)
    {
        $this->logInfo('api_zimbra_pleiade', "Preparing Zimbra Preauth for $zimbra_mail");

        $sessionCookieValue = $_COOKIE['lemonldap'] ?? '';
        $value1 = $zimbra_mail;
        $value2 = 'name';
        $value3 = '0';
        $value4 = time() * 1000;
        $key = $zimbra_token;
        $data = $value1 . "|" . $value2 . "|" . $value3 . "|" . $value4;
        $hmac = hash_hmac('sha1', $data, $key);
        $preauthURL = $zimbra_domain . "service/preauth?account=" . $value1 . "&timestamp=" . $value4 . "&expires=0&preauth=" . $hmac;

        $this->logInfo('api_zimbra_pleiade', "Preauth URL generated: $preauthURL");

        ob_start();
        $responseJson = null;

        try {
            $clientRequest = $this->client->request('GET', $preauthURL, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Cookie' => 'lemonldap=' . $sessionCookieValue,
                ],
                'debug' => true,
                'allow_redirects' => false,
                'timeout' => 60, // MODIFICATION : Augmentation du délai d'attente à 60 secondes
                'connect_timeout' => 10, // MODIFICATION : Délai pour établir la connexion
            ]);
            $responseToken = $clientRequest->getBody()->getContents();
            $debugInfo = ob_get_clean();
            $this->logInfo('api_zimbra_pleiade', "Preauth request completed.");
        } catch (RequestException $e) {
            $debugInfo = ob_get_clean();
            $this->logError('api_zimbra_pleiade', 'Preauth Curl error: @error', ['@error' => $e->getMessage()]);
        }

        $pattern = '/Set-Cookie: ZM_AUTH_TOKEN=([^;]+)/';

        if (preg_match($pattern, $debugInfo, $matches)) {
            $zmAuthToken = $matches[1];
            $this->logInfo('api_zimbra_pleiade', "ZM_AUTH_TOKEN retrieved.");

            $apiEndpoint = $zimbra_domain . 'service/soap';
            $requestXml = '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
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
                    'headers' => ['Content-Type' => 'application/soap+xml', 'Cookie' => 'lemonldap=' . $sessionCookieValue],
                    'body' => $requestXml,
                    'timeout' => 60, // MODIFICATION : Augmentation du délai d'attente à 60 secondes
                    'connect_timeout' => 10, // MODIFICATION : Délai pour établir la connexion
                ]);
                $responseSecond = $clientRequest->getBody()->getContents();
                $responseJson = [Json::decode($responseSecond)];
                $this->logInfo('api_zimbra_pleiade', "SOAP request completed for endpoint.");
            } catch (RequestException $e) {
                $this->logError('api_zimbra_pleiade', 'SOAP Curl error: @error', ['@error' => $e->getMessage()]);
            }

            // --- LOGIQUE OPTIMISÉE POUR TOUS LES RENDEZ-VOUS ---
            if ($responseJson && strpos($endpoint, 'types="appointment"') !== false) {
                $this->logInfo('api_zimbra_pleiade', "Processing appointments - fetching full details.");

                $allApptIds = [];
                if (isset($responseJson[0]['Body']['SearchResponse']['appt'])) {
                    foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as $appointment) {
                        $allApptIds[] = $appointment['id'];
                    }
                }

                if (!empty($allApptIds)) {
                    $batchRequestsXml = '';
                    foreach ($allApptIds as $id) {
                        $batchRequestsXml .= '<GetAppointmentRequest xmlns="urn:zimbraMail" id="' . $id . '" sync="1" includeContent="1"/>';
                    }

                    $batchRequestEnvelope = '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                  <soap:Header>
                      <context xmlns="urn:zimbra">
                          <format type="js"/>
                          <authToken>' . $zmAuthToken . '</authToken>
                      </context>
                  </soap:Header>
                  <soap:Body>
                      <BatchRequest xmlns="urn:zimbra">' . $batchRequestsXml . '</BatchRequest>
                  </soap:Body>
              </soap:Envelope>';

                    try {
                        $clientRequest = $this->client->request('POST', $apiEndpoint, [
                            'headers' => ['Content-Type' => 'application/soap+xml', 'Cookie' => 'lemonldap=' . $sessionCookieValue],
                            'body' => $batchRequestEnvelope,
                            'timeout' => 60, // MODIFICATION : Augmentation du délai d'attente à 60 secondes
                            'connect_timeout' => 10, // MODIFICATION : Délai pour établir la connexion
                        ]);
                        $batchResponse = $clientRequest->getBody()->getContents();
                        $batchResponseJson = Json::decode($batchResponse);

                        $fullDetailsById = [];
                        if (isset($batchResponseJson['Body']['BatchResponse']['GetAppointmentResponse'])) {
                            foreach ($batchResponseJson['Body']['BatchResponse']['GetAppointmentResponse'] as $apptDetailResponse) {
                                if (isset($apptDetailResponse['appt'][0])) {
                                    $apptDetail = $apptDetailResponse['appt'][0];
                                    $fullDetailsById[$apptDetail['id']] = $apptDetail;
                                }
                            }
                        }

                        // Ajouter uniquement les champs manquants sans changer la structure
                        foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as &$appointment) {
                            if (isset($fullDetailsById[$appointment['id']])) {
                                $fullAppt = $fullDetailsById[$appointment['id']];

                                // Ajouter le contenu complet s'il existe
                                if (isset($fullAppt['inv'][0]['comp'][0])) {
                                    $comp = $fullAppt['inv'][0]['comp'][0];

                                    // Ajouter description complète
                                    if (isset($comp['desc'][0]['_content'])) {
                                        $appointment['desc'] = $comp['desc'][0]['_content'];
                                    }

                                    // Ajouter le contenu HTML si disponible
                                    if (isset($comp['descHtml'][0]['_content'])) {
                                        $appointment['descHtml'] = $comp['descHtml'][0]['_content'];
                                    }

                                    // Ajouter les détails de récurrence s'ils existent
                                    if (isset($comp['recur']) && isset($appointment['recur']) && $appointment['recur'] == 1) {
                                        $appointment['recur'] = $comp['recur'];
                                    }
                                }
                            }
                        }
                        unset($appointment);
                        $this->logInfo('api_zimbra_pleiade', "All appointments processed with full content.");
                    } catch (RequestException $e) {
                        $this->logError('api_zimbra_pleiade', 'Batch SOAP Curl error: @error', ['@error' => $e->getMessage()]);
                    }
                }
            }
        } else {
            $this->logWarning('api_zimbra_pleiade', "ZM_AUTH_TOKEN not found in Preauth response.");
        }

        return $responseJson;
    }

    public function getUserTheme($email, $token, $domain)
    {
        $this->logInfo('api_zimbra_pleiade', "Fetching user theme preference for $email");

        $prefs_endpoint = '<GetPrefsRequest xmlns="urn:zimbraAccount">
                             <pref name="zimbraPrefClientType"/>
                           </GetPrefsRequest>';

        $response = $this->curlGet($prefs_endpoint, [], '', 'zimbra', $email, $token, $domain);
    
        if (isset($response[0]['Body']['GetPrefsResponse']['_attrs']['zimbraPrefClientType'])) {
            $themeValue = $response[0]['Body']['GetPrefsResponse']['_attrs']['zimbraPrefClientType'];
            $this->logInfo('api_zimbra_pleiade', "User theme raw value found for $email: $themeValue");

            // Zimbra uses 'advanced' for the Classic UI. We will return a standardized name.
            if ($themeValue === 'advanced') {
                return 'classic';
            }

            // For 'modern' or any other value, return it directly.
            return $themeValue;
        }

        $this->logWarning('api_zimbra_pleiade', "Could not retrieve user theme for $email.");
        return null;
    }
}