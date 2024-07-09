<?php

namespace Drupal\api_zimbra_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\user\Entity\User;



class PleiadeAjaxZimbraController extends ControllerBase
{
  public function zimbra_mails_query(Request $request)
  {
    /*
$uids = \Drupal::entityQuery('user')
    ->condition('status', 1) // Only active users
    ->accessCheck(FALSE)
        ->execute();

  // Load all user entities.
  $users = User::loadMultiple($uids);

  foreach ($users as $user) {
    $rows[] = $user->getEmail();
  }
*/

    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    $email = $user->getEmail();

    $domainPlusToken = $this->config("api_zimbra_pleiade.settings")->get("token_plus_domain");
    $lines = explode("\n", $domainPlusToken);
    $domainArray = [];
    foreach ($lines as $line) {
      $line = trim($line);
      if (!empty($line)) {
        list($domain, $token) = explode("| |", $line);
        $domainArray[] = [
          "domain" => $domain,
          "token" => $token,
        ];
      }
    }
    /*foreach ($domainArray as &$url) {
      // Parse the URL to get the host
      $host = parse_url($url['domain'], PHP_URL_HOST);

      // Split the host by '.' and get the part after the first '.'
      $parts = explode('.', $host, 2);
      if (isset($parts[1])) {
        $url['domain'] = $parts[1];
      }
    }*/

    foreach ($domainArray as $domain) {
      $userDomain = substr($email, strpos($email, '@') + 1);
	similar_text($userDomain, $domain['domain'], $similarity);

      if ($similarity > 30) {
        $limit_mail = 500;
        $mail_endpoint = '<SearchRequest xmlns="urn:zimbraMail"  limit="' . $limit_mail . '"><query>is:unread</query></SearchRequest>';
        //var_dump($userDomain);
        //var_dump($domain['domain']);
        //var_dump($domain['token']);
        
	$return = []; // Variable to store Zimbra data
        $zimbradataApi = new ApiPleiadeManager();
        $return = $zimbradataApi->searchMyMails($mail_endpoint, $email, $domain['token'], $domain['domain']);
        if ($return) {
	
          $userDomainData = $return[0] ?? null;
 return new JsonResponse(
            json_encode([
              "domainEntry" => $domain,
              "userData" => $userDomainData,
            ]),
            200,
            [],
            true
          );
        }
        else
        {
          \Drupal::logger("zimbra_tasks_query")->error("Aucun retour API");
          return new JsonResponse(json_encode("0"), 200, [], true);
        }
      }
      else
      {
        \Drupal::logger("zimbra_tasks_query")->error("Aucun serveur zimbra associé");
        return new JsonResponse(json_encode("0"), 200, [], true);
      }
    }

  }

public function zimbra_tasks_query(Request $request)
  {
 $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    $email = $user->getEmail();

    /////////////VARIABLE GLOBALE TASKS ENDPOINT //////////////////
    $limit_tasks = 1000;
    $currentDateTime = new \DateTime();
    $limitEndTimeStamp = $currentDateTime->modify("+30 days")->getTimestamp() * 1000;
    $currentDateTime = new \DateTime();
    $limitStartTimeStamp = $currentDateTime->modify("-30 days")->getTimestamp() * 1000;
    $tasks_endpoint =
      '<SearchRequest xmlns="urn:zimbraMail" types="appointment" calExpandInstStart="' .
      $limitStartTimeStamp .
      '" calExpandInstEnd="' .
      $limitEndTimeStamp .
      '" limit="' .
      $limit_tasks .
      '" sortBy="idDesc"><query>inid:10</query></SearchRequest>';

    /////////////FIN VARIABLE GLOBALE TASKS ENDPOINT //////////////////

    /////////////CODE DE TEST SITIV //////////////////
    /*        $ZIMBRA_API_URL = '/var/www/html/pleiade_sitiv/web/themes/custom/pleiadebv/assets/temp.txt';

        $fileContent = file_get_contents($ZIMBRA_API_URL);

        if ($fileContent !== false) {    
        return new JsonResponse($fileContent, 200, [], true);
        } else {
            $error = error_get_last();
            echo "Erreur lors de la lecture du fichier : " . $error['message'];
        }
    */
    /////////////FIN CODE DE TEST SITIV //////////////////

    $settings_zimbra = \Drupal::config("api_zimbra_pleiade.settings");
    $tempstore = \Drupal::service("tempstore.private")->get("api_lemon_pleiade");
    $groupData = $tempstore->get("groups");

    if ($groupData !== null) {
      $groupDataArray = explode(",", str_replace(", ", ",", $groupData));
    }
    if (in_array($settings_zimbra->get("lemon_group"), $groupDataArray)) {
      $domainPlusToken = $this->config("api_zimbra_pleiade.settings")->get("token_plus_domain");
      $lines = explode("\n", $domainPlusToken);
      $domainArray = [];
      foreach ($lines as $line) {
        $line = trim($line);
        if (!empty($line)) {
          list($domain, $token) = explode("| |", $line);
          $domainArray[] = [
            "domain" => $domain,
            "token" => $token,
          ];
        }
      }
  
//  var_dump($domainArray);
      foreach ($domainArray as $domain) {
        $userDomain = substr($email, strpos($email, '@') + 1);
  //var_dump($userDomain);
          similar_text($userDomain, $domain['domain'], $similarity);
//var_dump($similarity);
        if ($similarity > 45) {
  //        var_dump($userDomain);
    //      var_dump($domain['domain']);
      //    var_dump($domain['token']);
          
          $return = []; // Variable to store Zimbra data
          $zimbradataApi = new ApiPleiadeManager();
          $return = $zimbradataApi->searchMyTasks($tasks_endpoint, $email, $domain['token'], $domain['domain']);

          if ($return) {
            $userDomainData = $return[0] ?? null;

            return new JsonResponse(
              json_encode([
                "domainEntry" => $domain,
                "userData" => $userDomainData,
              ]),
              200,
              [],
              true
            );
          }
          else
          {
            \Drupal::logger("zimbra_tasks_query")->error("Aucun retour API");
            return new JsonResponse(json_encode("0"), 200, [], true);
          }
        }
        else
        {
          \Drupal::logger("zimbra_tasks_query")->error("Aucun serveur zimbra associé");
          return new JsonResponse(json_encode("0"), 200, [], true);
        }
      }
    }
    else
    {
      \Drupal::logger("zimbra_tasks_query")->error("Pas dans le groupe zimbra");
      return new JsonResponse(json_encode("0"), 200, [], true);
    }
  }

  public function get_full_calendar()
  {
    \Drupal::logger("zimbra_tasks_query")->info("page calendrier complet target");
    return [
      "#markup" => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="zimbra_full_calendar"></div>',
    ];
  }
}
