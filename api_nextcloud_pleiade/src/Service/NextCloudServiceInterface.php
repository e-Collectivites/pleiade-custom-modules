<?php

namespace Drupal\api_nextcloud_pleiade\Service;


interface NextCloudServiceInterface
{


    public function getNextcloudNotifs();

    public function executeCurl($api);
}
