<?php

namespace Drupal\api_lemon_pleiade\Service;


interface LemonServiceInterface
{


     public function searchMyApps();

    public function searchMySession();

    public function executeCurl($endpoint, $method, $inputs, $api);

    public static function arrayKeyfirst($array);

    public function refresh_session();
}
