<?php

namespace Drupal\api_parapheur_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class PleiadeAjaxParapheurService implements PleiadeAjaxParapheurServiceInterface
{
    protected $client;
    protected $settings_parapheur;
    protected $user;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_parapheur = $moduleHandler->moduleExists('api_parapheur_pleiade') ? \Drupal::config('api_parapheur_pleiade.settings') : NULL;
        $this->client = new Client();

        $current_user = \Drupal::currentUser();
        $this->user = \Drupal\user\Entity\User::load($current_user->id());
    }

    public function authenticateAndSaveToken(): ?string
    {
        try {
            $authUrl = 'https://portail.sitiv.fr/oauth2/authorize';
            $params = [
                'response_type' => 'code',
                'client_id' => 'parapheurv5-openid',
                'scope' => 'openid',
                'redirect_uri' => 'https://parapheurv5.sitiv.fr/auth/realms/api/broker/oidc/endpoint'
            ];
            $response = $this->client->request('GET', $authUrl, [
                'query' => $params,
                'headers' => ['Cookie' => 'lemonldap=' . $_COOKIE['lemonldap']],
                'allow_redirects' => false
            ]);

            $location = $response->getHeaders()['Location'][0];
            parse_str(parse_url($location, PHP_URL_QUERY), $queryParams);
            $code = $queryParams['code'];

            $tokenUrl = 'https://portail.sitiv.fr/oauth2/token';
            $response = $this->client->request('POST', $tokenUrl, [
                'auth' => ['parapheurv5-openid', 'parapheur-sitiv'],
                'form_params' => [
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $params['redirect_uri'],
                    'code' => $code
                ]
            ]);
            $data = json_decode($response->getBody(), true);
            $initialAccessToken = $data['access_token'];

            $exchangeUrl = 'https://parapheurv5.sitiv.fr/auth/realms/api/protocol/openid-connect/token';
            $response = $this->client->request('POST', $exchangeUrl, [
                'form_params' => [
                    'client_id' => 'ipcore-web',
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:token-exchange',
                    'requested_token_type' => 'urn:ietf:params:oauth:token-type:refresh_token',
                    'subject_token_type' => 'urn:ietf:params:oauth:token-type:access_token',
                    'subject_token' => $initialAccessToken,
                    'subject_issuer' => 'oidc'
                ]
            ]);
            $data = json_decode($response->getBody(), true);
            $finalAccessToken = $data['access_token'];

            $this->user->set("field_parapheuraccesstoken", $finalAccessToken);
            $this->user->save();

            return $finalAccessToken;

        } catch (RequestException $e) {
            \Drupal::logger('datatable_pleiade')->error("Authentication failed: @message", ['@message' => $e->getMessage()]);
            if ($e->hasResponse()) {
                \Drupal::logger('datatable_pleiade')->error("Response: @response", ['@response' => $e->getResponse()->getBody()]);
            }
            return null;
        }
    }
   
    public function getAccessToken(): ?string
    {
        $accessToken = $this->user->get("field_parapheuraccesstoken")->value;
          \Drupal::logger('datatable_pleiade')->error("Access Token " . $accessToken);
           \Drupal::logger('datatable_pleiade')->error("Access Token is empty " . empty($accessToken));
        if (empty($accessToken)) {
            return $this->authenticateAndSaveToken();
        }

        return $accessToken;
    }

    public function searchMyDesktop(): array
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return [];
            }

            $apiUrl = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant';
            $response = $this->client->request('GET', $apiUrl, [
                'headers' => [
                    'accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $accessToken
                ]
            ]);
            $apiData = json_decode($response->getBody(), true);
            $tenantId = $apiData["content"][0]["id"];

            $apiUrldesk = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant/' . $tenantId . '/desk';
            $responsedesk = $this->client->request('GET', $apiUrldesk, [
                'headers' => [
                    'accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $accessToken
                ]
            ]);
            $apiDatadesk = json_decode($responsedesk->getBody(), true);

            $allDeskFolders = [];
            if (isset($apiDatadesk['content']) && is_array($apiDatadesk['content'])) {
                foreach ($apiDatadesk['content'] as $item) {
                    foreach (['/pending', '/delegated'] as $endpoint) {
                        $apiUrldeskFolder = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant/' . $tenantId . '/desk/' . $item["id"] . $endpoint . '?size=50';
                        $responsedeskFolder = $this->client->request('GET', $apiUrldeskFolder, [
                            'headers' => [
                                'accept' => 'application/json',
                                'Authorization' => 'Bearer ' . $accessToken
                            ]
                        ]);
                        $apiDatadeskFolder = json_decode($responsedeskFolder->getBody(), true);

                        if (isset($apiDatadeskFolder["content"]) && is_array($apiDatadeskFolder["content"])) {
                            $apiDatadeskFolder["content"] = array_map(function ($deskFolder) use ($tenantId) {
                                $deskFolder['tenant_id'] = $tenantId;
                                return $deskFolder;
                            }, $apiDatadeskFolder["content"]);
                            $allDeskFolders = array_merge($allDeskFolders, $apiDatadeskFolder["content"]);
                        }
                    }
                }
            }
            return $allDeskFolders;

        } catch (RequestException $e) {
            if ($e->getResponse() && $e->getResponse()->getStatusCode() == 401) {
                $newAccessToken = $this->authenticateAndSaveToken();
                if ($newAccessToken) {
                    return $this->searchMyDesktop();
                }
            }

            \Drupal::logger('datatable_pleiade')->error("API Error in searchMyDesktop: @message", ['@message' => $e->getMessage()]);
            return [];
        }
    }
}
