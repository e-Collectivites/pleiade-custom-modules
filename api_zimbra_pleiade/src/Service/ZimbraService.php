<?php

namespace Drupal\api_zimbra_pleiade\Service;

use Drupal\Component\Serialization\Json;
use GuzzleHttp\Exception\RequestException;

class ZimbraService implements ZimbraServiceInterface
{

    protected $settings_zimbra;
    private $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_zimbra = $moduleHandler->moduleExists('api_zimbra_pleiade') ? \Drupal::config('api_zimbra_pleiade.settings') : NULL;

        $this->client = \Drupal::httpClient();
    }

    public function searchMyMails($mail_endpoint, $email, $token, $domain)
    {
        return $this->curlGet($mail_endpoint, [], $this->settings_zimbra->get('field_zimbra_url'), 'zimbra', $email, $token, $domain);
    }

    public function searchMyTasks($tasks_endpoint, $email, $token, $domain)
    {
        if ($this->settings_zimbra->get('field_zimbra_for_demo')) {
            return $this->curlGet('', [], 'https://pleiadedev.ecollectivites.fr/sites/default/files/datasets/js/calendar.json', 'zimbra');
        }
        $url = $this->settings_zimbra->get('field_zimbra_url') . $this->settings_zimbra->get('field_zimbra_tasks');
        return $this->curlGet($tasks_endpoint, [], $url, 'zimbra', $email, $token, $domain);
    }

    public function curlGet($endpoint, $inputs, $api, $application, $email = '', $token = '', $domain = '')
    {
        $data = $this->executeCurl($endpoint, "GET", $inputs, $api, $application, $email, $token, $domain);

        return $data;
    }

    public function executeCurl($endpoint, $method, $inputs, $api, $application, $zimbra_mail, $zimbra_token, $zimbra_domain)
    {
        // ... (début de la fonction, authentification Preauth identique)
        $sessionCookieValue = $_COOKIE['lemonldap'];
        $value1 = $zimbra_mail;
        $value2 = 'name';
        $value3 = '0';
        $value4 = time() * 1000;
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

        $responseJson = null; // Initialisation
        $pattern = '/Set-Cookie: ZM_AUTH_TOKEN=([^;]+)/';

        if (preg_match($pattern, $debugInfo, $matches)) {
            $zmAuthToken = $matches[1];
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
                ]);
                $responseSecond = $clientRequest->getBody()->getContents();
                $responseJson = [Json::decode($responseSecond)];
            } catch (RequestException $e) {
                \Drupal::logger('api_zimbra_pleiade')->error('Curl error: @error', ['@error' => $e->getMessage()]);
            }

            // --- DÉBUT DE LA LOGIQUE OPTIMISÉE ---

            if ($responseJson && strpos($endpoint, 'types="appointment"') !== false) {

                // 1. Collecter tous les IDs des rendez-vous récurrents
                $recurringApptIds = [];
                foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as $appointment) {
                    if (isset($appointment['recur']) && $appointment['recur'] == 1) {
                        $recurringApptIds[] = $appointment['id'];
                    }
                }

                // 2. S'il y a des rendez-vous récurrents, construire et exécuter UNE SEULE requête par lot
                if (!empty($recurringApptIds)) {
                    $batchRequestsXml = '';
                    foreach ($recurringApptIds as $id) {
                        // On ajoute une requête pour chaque ID dans le lot
                        $batchRequestsXml .= '<GetAppointmentRequest xmlns="urn:zimbraMail" id="' . $id . '" sync="1"/>';
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
                        ]);
                        $batchResponse = $clientRequest->getBody()->getContents();
                        $batchResponseJson = Json::decode($batchResponse);

                        // 3. Traiter la réponse par lot et mettre à jour les rendez-vous
                        $recurDetailsById = [];
                        // La réponse est dans Body > BatchResponse > GetAppointmentResponse
                        foreach ($batchResponseJson['Body']['BatchResponse']['GetAppointmentResponse'] as $apptDetailResponse) {
                            if (isset($apptDetailResponse['appt'][0])) {
                                $apptDetail = $apptDetailResponse['appt'][0];
                                // On stocke le détail de la récurrence avec l'ID comme clé
                                $recurDetailsById[$apptDetail['id']] = $apptDetail['inv'][0]['comp'][0]['recur'];
                            }
                        }

                        // 4. Mettre à jour le tableau original des rendez-vous
                        foreach ($responseJson[0]['Body']['SearchResponse']['appt'] as &$appointment) {
                            if (isset($recurDetailsById[$appointment['id']])) {
                                $appointment['recur'] = $recurDetailsById[$appointment['id']];
                            }
                        }
                        // Dégage la référence de la dernière variable pour éviter les effets de bord
                        unset($appointment);
                    } catch (RequestException $e) {
                        \Drupal::logger('api_zimbra_pleiade')->error('Batch Curl error: @error', ['@error' => $e->getMessage()]);
                    }
                }
            }
            // --- FIN DE LA LOGIQUE OPTIMISÉE ---
        }

        return $responseJson;
    }
}
