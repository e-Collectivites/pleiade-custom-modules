<?php

namespace Drupal\api_pastell_pleiade\Service;



interface PastellServiceInterface
{

    public function searchMyDocs($id_e);

    public function searchMyFlux();

    public function searchMyEntities();

    public static function arrayKeyfirst($array);

    public function executeCurl($method, $inputs, $api);
}
