<?php

namespace Drupal\api_parapheur_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;
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

class PleiadeAjaxParapheurService implements PleiadeAjaxParapheurServiceInterface
{
    use ApiLoggerTrait;

    protected $client;
    protected $settings_parapheur;
    protected $user;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_parapheur = $moduleHandler->moduleExists('api_parapheur_pleiade')
            ? \Drupal::config('api_parapheur_pleiade.settings')
            : null;

        $this->client = new Client();

        $current_user = \Drupal::currentUser();
        $this->user = User::load($current_user->id());

        $this->logInfo('api_parapheur_pleiade', 'PleiadeAjaxParapheurService initialized for user @uid', ['@uid' => $this->user->id()]);
    }

    public function authenticateAndSaveToken(): ?string
    {
        try {
            $this->logInfo('api_parapheur_pleiade', 'Starting OAuth2 authentication for user @uid', ['@uid' => $this->user->id()]);

            $authUrl = 'https://portail.sitiv.fr/oauth2/authorize';
            $params = [
                'response_type' => 'code',
                'client_id' => 'parapheurv5-openid',
                'scope' => 'openid',
                'redirect_uri' => 'https://parapheurv5.sitiv.fr/auth/realms/api/broker/oidc/endpoint',
            ];

            $response = $this->client->request('GET', $authUrl, [
                'query' => $params,
                'headers' => ['Cookie' => 'lemonldap=' . ($_COOKIE['lemonldap'] ?? '')],
                'allow_redirects' => false,
            ]);

            $location = $response->getHeader('Location')[0] ?? null;
            if (!$location) {
                $this->logError('api_parapheur_pleiade', 'No Location header returned during OAuth authorization.');
                return null;
            }

            parse_str(parse_url($location, PHP_URL_QUERY), $queryParams);
            $code = $queryParams['code'] ?? null;

            if (!$code) {
                $this->logError('api_parapheur_pleiade', 'Authorization code not found in redirect URL.');
                return null;
            }

            $tokenUrl = 'https://portail.sitiv.fr/oauth2/token';
            $response = $this->client->request('POST', $tokenUrl, [
                'auth' => ['parapheurv5-openid', 'parapheur-sitiv'],
                'form_params' => [
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $params['redirect_uri'],
                    'code' => $code,
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            $initialAccessToken = $data['access_token'] ?? null;

            $exchangeUrl = 'https://parapheurv5.sitiv.fr/auth/realms/api/protocol/openid-connect/token';
            $response = $this->client->request('POST', $exchangeUrl, [
                'form_params' => [
                    'client_id' => 'ipcore-web',
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:token-exchange',
                    'requested_token_type' => 'urn:ietf:params:oauth:token-type:refresh_token',
                    'subject_token_type' => 'urn:ietf:params:oauth:token-type:access_token',
                    'subject_token' => $initialAccessToken,
                    'subject_issuer' => 'oidc',
                ],
            ]);

            $data = json_decode($response->getBody(), true);
            $finalAccessToken = $data['access_token'] ?? null;

            if ($finalAccessToken) {
                $this->user->set("field_parapheuraccesstoken", $finalAccessToken);
                $this->user->save();
                $this->logInfo('api_parapheur_pleiade', 'Access token saved successfully for user @uid', ['@uid' => $this->user->id()]);
            }

            return $finalAccessToken;
        } catch (RequestException $e) {
            $this->logError('api_parapheur_pleiade', 'Authentication failed: @message', ['@message' => $e->getMessage()]);
            if ($e->hasResponse()) {
                $this->logError('api_parapheur_pleiade', 'Response: @response', ['@response' => (string)$e->getResponse()->getBody()]);
            }
            return null;
        }
    }

    public function getAccessToken(): ?string
    {
        $accessToken = $this->user->get("field_parapheuraccesstoken")->value;
        $this->logInfo('api_parapheur_pleiade', 'Retrieved access token for user @uid: @token', ['@uid' => $this->user->id(), '@token' => $accessToken]);

        if (empty($accessToken)) {
            $this->logWarning('api_parapheur_pleiade', 'Access token is empty. Authenticating for user @uid', ['@uid' => $this->user->id()]);
            return $this->authenticateAndSaveToken();
        }

        return $accessToken;
    }

    public function searchMyDesktop(): array
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                $this->logWarning('api_parapheur_pleiade', 'Cannot search desktop. Access token unavailable for user @uid', ['@uid' => $this->user->id()]);
                return [];
            }

            $apiUrl = 'https://parapheurv5.sitiv.fr/api/standard/v1/tenant';
            $response = $this->client->request('GET', $apiUrl, [
                'headers' => [
                    'accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            $apiData = json_decode($response->getBody(), true);
            $tenantId = $apiData["content"][0]["id"] ?? null;

            if (!$tenantId) {
                $this->logWarning('api_parapheur_pleiade', 'No tenant ID returned for user @uid', ['@uid' => $this->user->id()]);
                return [];
            }

            $apiUrldesk = "https://parapheurv5.sitiv.fr/api/standard/v1/tenant/{$tenantId}/desk";
            $responsedesk = $this->client->request('GET', $apiUrldesk, [
                'headers' => [
                    'accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
            ]);

            $apiDatadesk = json_decode($responsedesk->getBody(), true);
            $allDeskFolders = [];

            foreach ($apiDatadesk['content'] ?? [] as $item) {
                foreach (['/pending', '/delegated'] as $endpoint) {
                    $apiUrldeskFolder = "https://parapheurv5.sitiv.fr/api/standard/v1/tenant/{$tenantId}/desk/{$item['id']}{$endpoint}?size=50";
                    $responsedeskFolder = $this->client->request('GET', $apiUrldeskFolder, [
                        'headers' => [
                            'accept' => 'application/json',
                            'Authorization' => 'Bearer ' . $accessToken,
                        ],
                    ]);

                    $apiDatadeskFolder = json_decode($responsedeskFolder->getBody(), true);
                    $folderContent = $apiDatadeskFolder['content'] ?? [];

                    $folderContent = array_map(function ($deskFolder) use ($tenantId) {
                        $deskFolder['tenant_id'] = $tenantId;
                        return $deskFolder;
                    }, $folderContent);

                    $allDeskFolders = array_merge($allDeskFolders, $folderContent);
                }
            }

            $this->logInfo('api_parapheur_pleiade', 'Fetched @count desk folders for user @uid', ['@count' => count($allDeskFolders), '@uid' => $this->user->id()]);

            return $allDeskFolders;
        } catch (RequestException $e) {
            if ($e->getResponse() && $e->getResponse()->getStatusCode() == 401) {
                $this->logWarning('api_parapheur_pleiade', 'Unauthorized. Refreshing token for user @uid', ['@uid' => $this->user->id()]);
                $newAccessToken = $this->authenticateAndSaveToken();
                if ($newAccessToken) {
                    return $this->searchMyDesktop();
                }
            }

            $this->logError('api_parapheur_pleiade', 'API Error in searchMyDesktop: @message', ['@message' => $e->getMessage()]);
            return [];
        }
    }
}
