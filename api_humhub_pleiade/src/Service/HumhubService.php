<?php

namespace Drupal\api_humhub_pleiade\Service;

use GuzzleHttp\Client;
use Drupal\Component\Serialization\Json;
use Exception;


class HumhubService
{

    protected $settings_humhub;
    private $client;
    public function __construct()
    {
        $moduleHandler = \Drupal::service('module_handler');
        $this->settings_humhub = $moduleHandler->moduleExists('api_humhub_pleiade') ? \Drupal::config('api_humhub_pleiade.settings') : NULL;
        $this->client = new Client();
    }


    public function executeCurl($method, $inputs, $api)
    {

        try {
            $response = $this->client->request($method, $api, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $inputs["token"]
                ],
                'verify' => false,
                'timeout' => 60
            ]);
            return Json::decode($response->getBody()->getContents());
        } catch (Exception $e) {
            return Json::decode($e->getMessage());
        }
    }

    public function get_notif_humhub($token)
    {
        return $this->executeCurl("GET", $token, $this->settings_humhub->get('humhub_url') . '/api/v1/notification/unseen');
    }
    public function get_messages_humhub($token)
    {
        return $this->executeCurl("GET", $token, $this->settings_humhub->get('humhub_url') . '/api/v1/mail');
    }
    public function get_spaces($token)
    {
        return $this->executeCurl("GET", $token, $this->settings_humhub->get('humhub_url') . '/api/v1/space');
    }
}
