<?php

namespace Drupal\api_humhub_pleiade\Service;


interface HumhubServiceInterface
{


    public function executeCurl($method, $inputs, $api);

    public function get_notif_humhub($token);
    public function get_messages_humhub($token);
    public function get_spaces($token);
}
