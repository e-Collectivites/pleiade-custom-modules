<?php

namespace Drupal\api_parapheur_pleiade\Service;

interface PleiadeAjaxParapheurServiceInterface
{
   
      function authenticateAndSaveToken(): ?string;
   
     function getAccessToken(): ?string;

     function searchMyDesktop();
}
