<?php

namespace Drupal\api_user_pleiade\Service;

use Drupal\user\Entity\User;
use Drupal\user\UserInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;

/**
 * A trait for logging API interactions.
 */
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

/**
 * Service to interact with the Pleiade Annuaire API.
 */
class PleiadeUserService
{
    use ApiLoggerTrait;

    private $annuaireLogin;
    private $annuairePassword;
    private $annuaireUrl;
    private $config;
    private $client;
    private $state;

    /**
     * The logging channel.
     */
    const LOG_CHANNEL = 'api_user_pleiade';

    public function __construct()
    {
        $this->config = \Drupal::config('api_user_pleiade.settings');
        $this->state = \Drupal::state();
        $this->client = new Client();

        $this->annuaireLogin = $this->config->get("annuaire_login");
        $this->annuairePassword = $this->config->get("annuaire_password");
        $this->annuaireUrl = $this->config->get("annuaire_url");
    }

    /**
     * Main public method to get information for a specific user ID.
     *
     * @param int $userId
     *   The user ID for whom to fetch information.
     * @return array
     *   The user information from the API, or an empty array on failure.
     */
    public function getAnnuaireInfos(int $userId): array
    {
        $user = User::load($userId);
        if (!$user) {
            $this->logWarning(self::LOG_CHANNEL, 'Attempted to get Annuaire info for a non-existent user: @id', ['@id' => $userId]);
            return [];
        }

        try {
            // First attempt to fetch data.
            return $this->fetchUserData($user);
        } catch (ClientException $e) {
            // If token is invalid (401), get a new one and retry exactly once.
            if ($e->getCode() === 401) {
                $this->logInfo(self::LOG_CHANNEL, 'API token expired or invalid. Refreshing token and retrying.');
                $this->getAnnuaireToken(true); // Force refresh the token.
                try {
                    // Second attempt.
                    return $this->fetchUserData($user);
                } catch (\Exception $e) {
                    $this->logError(self::LOG_CHANNEL, 'Failed on second attempt for user @id: @msg', ['@id' => $userId, '@msg' => $e->getMessage()]);
                }
            } else {
                $this->logError(self::LOG_CHANNEL, 'API request failed for user @id with code @code: @msg', ['@id' => $userId, '@code' => $e->getCode(), '@msg' => $e->getMessage()]);
            }
        }
        return [];
    }

    /**
     * Fetches the actual data from the API for a given user object.
     */
    private function fetchUserData(UserInterface $user): array
    {
        $dn = $this->getAnnuaireDn($user);
        if (empty($dn)) {
            $this->logWarning(self::LOG_CHANNEL, 'Could not find or retrieve a DN for user @id.', ['@id' => $user->id()]);
            return [];
        }

        $token = $this->getAnnuaireToken();
        if (empty($token)) {
            $this->logError(self::LOG_CHANNEL, 'Could not retrieve a valid API token to make the request.');
            return [];
        }

        $this->logInfo(self::LOG_CHANNEL, 'Fetching info for user @id with DN: @dn', ['@id' => $user->id(), '@dn' => $dn]);

        $response = $this->client->get($this->annuaireUrl . '/objects/USER/' . $dn . '/user', [
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Session-Token' => $token,
            ],
        ]);

        return json_decode($response->getBody()->getContents(), true) ?? [];
    }

    /**
     * Retrieves the API token, storing it globally in Drupal's State API.
     */
    private function getAnnuaireToken(bool $force_refresh = false): ?string
    {
        $token = $this->state->get('api_user_pleiade.session_token');

        if ($force_refresh || empty($token)) {
            try {
                $this->logInfo(self::LOG_CHANNEL, 'Requesting new Annuaire token.');
                $response = $this->client->post($this->annuaireUrl . '/login', [
                    'json' => [
                        "user" => $this->annuaireLogin,
                        "password" => $this->annuairePassword
                    ]
                ]);
                $token = json_decode((string) $response->getBody(), true);
                $this->state->set('api_user_pleiade.session_token', $token);
                $this->logInfo(self::LOG_CHANNEL, 'Annuaire token retrieved and stored.');
            } catch (ClientException $e) {
                $this->logError(self::LOG_CHANNEL, 'Failed to get Annuaire token: @msg', ['@msg' => $e->getMessage()]);
                return null;
            }
        }
        return $token;
    }

    /**
     * Gets the Distinguished Name (DN) for a specific user.
     */
    private function getAnnuaireDn(UserInterface $user): ?string
    {
        // Return the DN if it's already stored on the user's profile.
        if (!$user->get("field_annuairedn")->isEmpty()) {
            return $user->get("field_annuairedn")->value;
        }

        // If not, fetch it from the API.
        $this->logInfo(self::LOG_CHANNEL, 'DN not found for user @id. Fetching from Annuaire.', ['@id' => $user->id()]);
        try {
            $token = $this->getAnnuaireToken();
            if (!$token) return null;

            $response = $this->client->get($this->annuaireUrl . '/objects/USER?filter=mail=' . $user->getEmail(), [
                'headers' => [ 'Session-Token' => $token ]
            ]);

            $result = json_decode((string) $response->getBody(), true);
            $dn = $result ? array_key_first($result) : null;

            if ($dn) {
                $user->set("field_annuairedn", $dn);
                $user->save();
                $this->logInfo(self::LOG_CHANNEL, 'Annuaire DN saved for user @id: @dn', ['@id' => $user->id(), '@dn' => $dn]);
                return $dn;
            }
        } catch (ClientException $e) {
            $this->logError(self::LOG_CHANNEL, 'Failed to retrieve Annuaire DN for user @id: @msg', ['@id' => $user->id(), '@msg' => $e->getMessage()]);
        }
        return null;
    }
}