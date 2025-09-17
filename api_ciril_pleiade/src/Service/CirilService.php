<?php

namespace Drupal\api_ciril_pleiade\Service;

use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class CirilService implements CirilServiceInterface
{
  private $url;
  private $key;
  private $redirectUrl;
  private $baskets;
  protected $currentUser;

  public function __construct(AccountProxyInterface $current_user)
  {
    $this->currentUser = $current_user;
    $config = \Drupal::config('api_ciril_pleiade.settings');
    $collectivite = \Drupal::request()->getSession()->get('cas_attributes')["partner"][0];
    $array = \Drupal::keyValue("collectivities_store")->get('global', "does not exist");
    $this->key = $array[$collectivite]['token_ciril'];
    $this->url =  $array[$collectivite]['url_ciril'] .  $config->get('route');
    $this->redirectUrl = $array[$collectivite]['url_ciril'] . "/dist/index.html#";
    $stingBaskets = $array[$collectivite]['baskets_ciril'];
    $string_array = explode(',', $stingBaskets);
    $integer_array = array_map('intval', $string_array);
    $this->baskets = $integer_array;
  }

  public function getUserId(): ?int
  {
    $user = User::load($this->currentUser->id());
    $fieldValue = $user->get('field_ciriluserid')->getValue();

    if (empty($fieldValue)) {
      $userMail = $user->getEmail();
      $cirilUserId = $this->getCirilUserId($userMail);

      if ($cirilUserId) {
        $user->set('field_ciriluserid', $cirilUserId);
        $user->save();
        return $cirilUserId;
      } else {
        return null;
      }
    }
    return (int)$fieldValue[0]["value"];
  }

  public function getCirilUserId($userMail)
  {
    $usersUrl = $this->url . '/users';
    $client = new Client();
    try {
      $response = $client->get($usersUrl, [
        'headers' => [
          'Authorization' => "Bearer " . $this->key,
        ],
      ]);

      if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getBody()->getContents(), true);
        return $this->findUserIdByEmail($userMail, $data["users"]);
      }
    } catch (RequestException $e) {
      return null;
    }

    return null;
  }

  public function findUserIdByEmail(string $emailToFind, array $userList): ?int
  {
    $normalizedEmailToFind = strtolower(trim($emailToFind));
    foreach ($userList as $user) {
      if (isset($user["mail"])) {
        $normalizedUserMail = strtolower(trim($user["mail"]));
        if ($normalizedUserMail === $normalizedEmailToFind) {
          return (int)$user['id'];
        }
      }
    }
    return null;
  }

  public function getUserDetails(int $userId): ?array
  {
    $detailsUrl = $this->url . '/users/' . $userId . '/details';
    $client = new Client();
    try {
      $response = $client->get($detailsUrl, [
        'headers' => [
          'Authorization' => "Bearer " . $this->key,
        ],
      ]);

      if ($response->getStatusCode() === 200) {
        $data = json_decode($response->getBody()->getContents(), true);

        $visibleBaskets = array_filter($data['baskets'] ?? [], function ($element) {
          return isset($element['is_visible']) && $element['is_visible'] === 'Y';
        });

        return [
          'baskets' => $visibleBaskets,
          'entities' => $data['entities'] ?? []
        ];
      }
    } catch (RequestException $e) {
      return null;
    }
    return null;
  }

  public function getMailsForAllBaskets(int $userId): array
  {
    $userDetails = $this->getUserDetails($userId);

    $allMails = [];

    if (empty($userDetails) || empty($userDetails['baskets'])) {
      return [];
    }

    $baskets = $userDetails['baskets'];
    $wantedBaskets = $this->baskets;
    $baskets = array_filter($userDetails['baskets'], function ($obj) use ($wantedBaskets) {
      return in_array($obj["id"], $wantedBaskets);
    });

    $entities = $userDetails['entities'] ?? [];
    $entityIds = !empty($entities) ? array_column($entities, 'id') : [];
    $entityIdList = !empty($entityIds) ? implode(',', $entityIds) : '0';

    $client = new Client();
    $mailsUrl = $this->url . '/res/list';

    foreach ($baskets as $basket) {
      if (empty($basket['basket_clause'])) {
        continue;
      }

      $clause = str_replace('@user_id', (string)$userId, $basket['basket_clause']);
      $clause = str_replace('@my_entities_id', $entityIdList, $clause);

      $payload = [
        'select' => 'subject,res_id,creation_date,status,type_label',
        'clause' => $clause,
      ];

      try {
        $response = $client->post($mailsUrl, [
          'headers' => [
            'Authorization' => "Bearer " . $this->key,
            'Content-Type' => 'application/json',
          ],
          'json' => $payload,
        ]);

        if ($response->getStatusCode() === 200) {
          $data = json_decode($response->getBody()->getContents(), true);
          $mails = $data["resources"] ?? [];

          foreach ($mails as &$mail) {
            if (isset($mail['res_id']) && isset($basket['groupSerialId']) && isset($basket['id'])) {
              $mail['redirection_link'] = $this->getRedirectUrl($userId, $basket['groupSerialId'], $basket['id'], $mail['res_id']);
            }
          }
          unset($mail);

          $allMails = array_merge($allMails, $mails);
        }
      } catch (RequestException $e) {
      }
    }

    return $allMails;
  }

  public function getRedirectUrl($userId, $groupId, $basketId, $resId)
  {
    return   $this->redirectUrl . "/process/users/" . $userId . "/groups/" . $groupId . "/baskets/" . $basketId . "/resId/" . $resId;
  }
}
