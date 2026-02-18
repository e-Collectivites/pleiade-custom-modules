<?php

namespace Drupal\api_watcha_pleiade\Service;

use Drupal\user\Entity\User;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Promise\RejectedPromise;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ClientException;

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

class WatchaService implements WatchaServiceInterface
{
    use ApiLoggerTrait;

    protected $clientId;
    protected $clientSecret;
    protected $authTokenUrl = 'https://connecter.territoirenumeriqueouvert.org/oauth2/token';
    protected $authAuthorizeUrl = 'https://connecter.territoirenumeriqueouvert.org/oauth2/authorize';
    protected $synapseServer;
    protected $synapseApi;
    protected $authCallbackUrl;
    protected $synapseCallbackUrl;
    protected $user;
    /**
     * @var \GuzzleHttp\Client
     */
    protected $client;

    public function __construct()
    {
        $config = \Drupal::config('api_watcha_pleiade.settings');
        $baseUrl = \Drupal::request()->getSchemeAndHttpHost();

        $this->clientId = $config->get('clientId');
        $this->clientSecret = $config->get('clientSecret');
        $this->synapseServer = $config->get('synapseServer');
        $this->synapseApi = $this->synapseServer . '/_matrix/client/v3';
        $this->authCallbackUrl = $baseUrl . '/v1/api_watcha_pleiade/watcha_auth';
        $this->synapseCallbackUrl = $baseUrl . '/v1/api_watcha_pleiade/watcha_synapse_callback';
        
        $this->user = User::load(\Drupal::currentUser()->id());

        $stack = HandlerStack::create();
        $stack->push($this->createDetailedLoggingMiddleware());
        $this->client = new Client(['handler' => $stack]);

        if ($this->user) {
            $this->logInfo('api_watcha_pleiade', 'WatchaService initialized for user ID: @uid', ['@uid' => $this->user->id()]);
        }
    }

    private function createDetailedLoggingMiddleware()
    {
        return function (callable $handler) {
            return function (RequestInterface $request, array $options) use ($handler) {
                return $handler($request, $options)->then(
                    function (ResponseInterface $response) use ($request) {
                        try {
                            $details = $this->formatRequestDetails($request) + $this->formatResponseDetails($response);
                            $this->logInfo(
                                'api_watcha_pleiade',
                                sprintf('HTTP Request SUCCEEDED [%d] "%s"', $response->getStatusCode(), $request->getUri()),
                                ['details' => $details]
                            );
                        } catch (\Exception $e) { }
                        return $response;
                    },
                    function (\Exception $reason) use ($request) {
                        try {
                            $details = $this->formatRequestDetails($request);
                            if ($reason instanceof RequestException && $reason->hasResponse()) {
                                $details += $this->formatResponseDetails($reason->getResponse());
                            }
                            $this->logError(
                                'api_watcha_pleiade',
                                sprintf('HTTP Request FAILED: "%s" Reason: %s', $request->getUri(), $reason->getMessage()),
                                ['details' => $details]
                            );
                        } catch (\Exception $e) { }
                        return new RejectedPromise($reason);
                    }
                );
            };
        };
    }

    private function formatRequestDetails(RequestInterface $request): array
    {
        $body = (string) $request->getBody();
        if ($request->getBody()->isSeekable()) {
            $request->getBody()->rewind();
        }
        return [
            'request' => [
                'method' => $request->getMethod(),
                'uri' => (string) $request->getUri(),
                'headers' => $request->getHeaders(),
                'body' => mb_substr($body, 0, 1000),
            ]
        ];
    }

    private function formatResponseDetails(ResponseInterface $response): array
    {
        $body = (string) $response->getBody();
        if ($response->getBody()->isSeekable()) {
            $response->getBody()->rewind();
        }
        return [
            'response' => [
                'status_code' => $response->getStatusCode(),
                'headers' => $response->getHeaders(),
                'body' => mb_substr($body, 0, 1000),
            ]
        ];
    }

    public function getSynapseRedirectUrl(): string
    {
        return $this->synapseApi . "/login/sso/redirect/oidc?redirectUrl=" . urlencode($this->synapseCallbackUrl);
    }

    public function getAuthorizationLink(): string
    {
        $params = [
            'response_type' => 'code',
            'client_id' => 'synapse',
            'scope' => 'openid profile email',
            'redirect_uri' => $this->authCallbackUrl,
        ];
        return $this->authAuthorizeUrl . '?' . http_build_query($params);
    }

    public function exchangeCodeForToken(string $code): array
    {
        $params = [
            'code' => $code,
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri' => $this->authCallbackUrl,
            'grant_type' => 'authorization_code',
        ];

        try {
            $response = $this->client->post($this->authTokenUrl, ['form_params' => $params]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            $this->logError('api_watcha_pleiade', 'Token exchange error: ' . $e->getMessage());
            return ['error' => 'token_exchange_failed', 'message' => $e->getMessage()];
        }
    }

    public function handleSynapseCallback(string $loginToken): array
    {
        $this->logInfo('api_watcha_pleiade', 'Handling Synapse callback.');
        try {
            $response = $this->client->post("{$this->synapseApi}/login", [
                'headers' => ['Content-Type' => 'application/json'],
                'json' => ['type' => 'm.login.token', 'token' => $loginToken],
            ]);
            $data = json_decode($response->getBody()->getContents(), true);
            $token = $data['access_token'] ?? null;
            
            if (!empty($token) && $this->user) {
                $this->user->set("field_watchaaccesstoken", $token);
                $this->user->save();
            }
            return $data;

        } catch (ClientException $e) {
            // Handle 429 Rate Limit
            if ($e->getResponse() && $e->getResponse()->getStatusCode() === 429) {
                $bodyStr = (string) $e->getResponse()->getBody();
                $bodyJson = json_decode($bodyStr, true);
                
                $retryMs = $bodyJson['retry_after_ms'] ?? 0;
                $retrySec = $retryMs > 0 ? $retryMs / 1000 : 60;

                $this->logWarning('api_watcha_pleiade', "Synapse Rate Limit (429). Retry in {$retrySec}s.");
                
                return [
                    'error' => 'rate_limit',
                    'retry_after_ms' => $retryMs,
                    'retry_after_seconds' => $retrySec
                ];
            }
            
            $this->logError('api_watcha_pleiade', 'Client Error: ' . $e->getMessage());
            return ['error' => 'client_error'];

        } catch (RequestException $e) {
            $this->logError('api_watcha_pleiade', 'Request Error: ' . $e->getMessage());
            return ['error' => 'request_error'];
        }
    }

    public function getConfigData(): array
    {
        if (!$this->user) return [];
        
        $token = $this->user->get('field_watchaaccesstoken')->value;
        if (empty($token)) return [];

        if (empty($this->user->get('field_watchauserid')->value)) {
            try {
                $response = $this->client->get("{$this->synapseApi}/account/whoami", [
                    'headers' => ['Authorization' => "Bearer $token", 'Accept' => 'application/json'],
                ]);
                $data = json_decode($response->getBody()->getContents(), true);
                $userId = $data['user_id'] ?? null;
                if ($userId) {
                    $this->user->set("field_watchauserid", $userId);
                    $this->user->save();
                }
            } catch (\Exception $e) {
                 $this->logError('api_watcha_pleiade', 'Error fetching WhoAmI: ' . $e->getMessage());
                 return [];
            }
        }
        
        return [
            'myUserId' => $this->user->get('field_watchauserid')->value,
            'myAccessToken' => $token,
            'synapseServer' => $this->synapseServer,
            'synapseServerApi' => $this->synapseApi,
            'watchaUrl' => "https://discuter-sitiv.territoirenumeriqueouvert.org/app/#/room/",
        ];
    }
}