<?php

namespace Drupal\api_nextcloud_pleiade\Service;

use Drupal\user\Entity\User;

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

class NextCloudService implements NextCloudServiceInterface
{
    use ApiLoggerTrait;

    protected $settings_nextcloud;

    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_nextcloud = $moduleHandler->moduleExists('api_nextcloud_pleiade')
            ? \Drupal::config('api_nextcloud_pleiade.settings')
            : null;

        $this->logInfo('api_nextcloud_pleiade', 'NextCloudService initialized.');
    }

    public function getNextcloudNotifs()
    {
        $endpoint = $this->settings_nextcloud->get('nextcloud_endpoint_notifs');
        $url = $this->settings_nextcloud->get('nextcloud_url') . $endpoint . '?format=json';

        $this->logInfo('api_nextcloud_pleiade', 'Fetching NextCloud notifications from URL: @url', ['@url' => $url]);
        return $this->executeCurl($url);
    }

    public function executeCurl($api)
    {
        $user = User::load(\Drupal::currentUser()->id());
        $nc_key = $user->get('field_nextcloud_api_key')->value ?? null;
        $displayName = $user->get('field_nextcloud_api_user')->value ?? $user->getDisplayName();

        if (!$nc_key || !$displayName) {
            $this->logWarning('api_nextcloud_pleiade', 'Missing NextCloud API credentials for user @uid', ['@uid' => $user->id()]);
            return null;
        }

        $token_authent = base64_encode($displayName . ':' . $nc_key);
        $headers = [
            'OCS-APIRequest: true',
            'Authorization: Basic ' . $token_authent
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $api);
        curl_setopt($ch, CURLOPT_HTTPGET, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $totalTime = curl_getinfo($ch, CURLINFO_TOTAL_TIME);

        if (curl_errno($ch)) {
            $this->logError('api_nextcloud_pleiade', 'cURL error for URL @url: @error', [
                '@url' => $api,
                '@error' => curl_error($ch),
            ]);
            curl_close($ch);
            return null;
        }

        $decodedResponse = json_decode($response);
        $this->logInfo('api_nextcloud_pleiade', 'cURL request completed.', [
            'url' => $api,
            'time' => $totalTime,
            'headers' => $headers,
            'response' => $decodedResponse,
        ]);

        curl_close($ch);
        return $decodedResponse;
    }
}
