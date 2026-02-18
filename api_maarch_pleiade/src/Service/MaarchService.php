<?php

namespace Drupal\api_maarch_pleiade\Service;

use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

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

class MaarchService implements MaarchServiceInterface
{
    use ApiLoggerTrait;

    private $url;
    private $key;
    private $redirectUrl;
    private $baskets;
    protected $currentUser;

    public function __construct(AccountProxyInterface $current_user)
    {
        $this->currentUser = $current_user;
        $this->logInfo('api_maarch_pleiade', 'Initializing MaarchService.');

        try {
            $config = \Drupal::config('api_maarch_pleiade.settings');
            $session = \Drupal::request()->getSession();

            if (!$session || !($cas_attributes = $session->get('cas_attributes')) || !isset($cas_attributes["partner"][0])) {
                $this->logError('api_maarch_pleiade', 'CAS partner attribute not found in session during service initialization.');
                return;
            }

            $collectivite = $cas_attributes["partner"][0];
            $this->logInfo('api_maarch_pleiade', 'Current collectivite: @collectivite', ['@collectivite' => $collectivite]);

            $array = \Drupal::keyValue("collectivities_store")->get('global');
            if (empty($array[$collectivite])) {
                $this->logError('api_maarch_pleiade', 'Configuration not found for collectivite: @collectivite', ['@collectivite' => $collectivite]);
                return;
            }

            $collectivite_config = $array[$collectivite];
            $this->key = $collectivite_config['token_maarch'];
            $this->url = $collectivite_config['url_maarch'] . $config->get('route');
            $this->redirectUrl = $collectivite_config['url_maarch'] . "/dist/index.html#";
            $this->baskets = array_map('intval', explode(',', $collectivite_config['baskets_maarch']));

            $this->logInfo('api_maarch_pleiade', 'MaarchService initialized successfully for URL: @url', ['@url' => $this->url]);

        } catch (\Exception $e) {
            $this->logError('api_maarch_pleiade', 'An unexpected error occurred during MaarchService initialization: @message', ['@message' => $e->getMessage()]);
        }
    }

    public function getUserId(): ?int
    {
        $this->logInfo('api_maarch_pleiade', 'Attempting to get Maarch User ID for Drupal user: @uid', ['@uid' => $this->currentUser->id()]);
        $user = User::load($this->currentUser->id());
        $fieldValue = $user->get('field_maarchuserid')->getValue();

        if (empty($fieldValue)) {
            $this->logInfo('api_maarch_pleiade', 'No Maarch User ID found in Drupal profile for user @uid. Fetching from Maarch API.', ['@uid' => $user->id()]);
            $maarchUserId = $this->getMaarchUserId($user->getEmail());
            if ($maarchUserId) {
                $this->logInfo('api_maarch_pleiade', 'Found Maarch User ID @maarchId. Saving it to Drupal user profile @uid.', ['@maarchId' => $maarchUserId, '@uid' => $user->id()]);
                $user->set('field_maarchuserid', $maarchUserId);
                $user->save();
                return $maarchUserId;
            } else {
                $this->logWarning('api_maarch_pleiade', 'Could not retrieve Maarch User ID for email: @email', ['@email' => $user->getEmail()]);
                return null;
            }
        }

        $maarchId = (int)$fieldValue[0]["value"];
        $this->logInfo('api_maarch_pleiade', 'Retrieved Maarch User ID @maarchId from Drupal user profile for user @uid.', ['@maarchId' => $maarchId, '@uid' => $user->id()]);
        return $maarchId;
    }

    public function getMaarchUserId($userMail)
    {
        $this->logInfo('api_maarch_pleiade', 'Fetching Maarch User ID for email: @email', ['@email' => $userMail]);
        $usersUrl = $this->url . '/users';
        $client = new Client();

        try {
            $this->logInfo('api_maarch_pleiade', 'Sending GET request to fetch users from: @url', ['@url' => $usersUrl]);
            $response = $client->get($usersUrl, ['headers' => ['Authorization' => "Bearer " . $this->key]]);
            if ($response->getStatusCode() === 200) {
                $this->logInfo('api_maarch_pleiade', 'Successfully received user list from Maarch API.');
                $data = json_decode($response->getBody()->getContents(), true);
                return $this->findUserIdByEmail($userMail, $data["users"]);
            }
        } catch (RequestException $e) {
            $this->logError('api_maarch_pleiade', 'Failed to fetch Maarch users. Error: @error', ['@error' => $e->getMessage()]);
        }

        return null;
    }

    public function findUserIdByEmail(string $emailToFind, array $userList): ?int
    {
        $this->logInfo('api_maarch_pleiade', 'Searching for user with email: @email in the returned user list.', ['@email' => $emailToFind]);
        $normalizedEmailToFind = strtolower(trim($emailToFind));

        foreach ($userList as $user) {
            if (!empty($user["mail"]) && strtolower(trim($user["mail"])) === $normalizedEmailToFind) {
                $this->logInfo('api_maarch_pleiade', 'Found matching user. Maarch User ID: @id', ['@id' => $user['id']]);
                return (int)$user['id'];
            }
        }

        $this->logWarning('api_maarch_pleiade', 'Could not find a user with the email: @email in the user list.', ['@email' => $emailToFind]);
        return null;
    }

    public function getUserDetails(int $userId): ?array
    {
        $this->logInfo('api_maarch_pleiade', 'Fetching user details for Maarch User ID: @userId', ['@userId' => $userId]);
        $detailsUrl = $this->url . '/users/' . $userId . '/details';
        $client = new Client();

        try {
            $this->logInfo('api_maarch_pleiade', 'Sending GET request to fetch user details from: @url', ['@url' => $detailsUrl]);
            $response = $client->get($detailsUrl, ['headers' => ['Authorization' => "Bearer " . $this->key]]);
            if ($response->getStatusCode() === 200) {
                $data = json_decode($response->getBody()->getContents(), true);
                $visibleBaskets = array_filter($data['baskets'] ?? [], fn($b) => ($b['is_visible'] ?? 'N') === 'Y');
                $this->logInfo('api_maarch_pleiade', 'Found @count visible baskets for user @userId.', ['@count' => count($visibleBaskets), '@userId' => $userId]);
                return ['baskets' => $visibleBaskets, 'entities' => $data['entities'] ?? []];
            }
        } catch (RequestException $e) {
            $this->logError('api_maarch_pleiade', 'Failed to fetch user details for Maarch User ID: @userId. Error: @error', ['@userId' => $userId, '@error' => $e->getMessage()]);
        }

        return null;
    }

    public function getMailsForAllBaskets(int $userId): array
    {
        $this->logInfo('api_maarch_pleiade', 'Fetching mails for all configured baskets for Maarch User ID: @userId', ['@userId' => $userId]);
        $userDetails = $this->getUserDetails($userId);
        $allMails = [];

        if (empty($userDetails['baskets'])) {
            $this->logWarning('api_maarch_pleiade', 'No user details or baskets found for Maarch user @userId. Cannot fetch mails.', ['@userId' => $userId]);
            return [];
        }

        $wantedBaskets = $this->baskets;
        $baskets = array_filter($userDetails['baskets'], fn($b) => in_array($b["id"], $wantedBaskets));
        $this->logInfo('api_maarch_pleiade', 'Processing @count out of @total available baskets for user @userId.', ['@count' => count($baskets), '@total' => count($userDetails['baskets']), '@userId' => $userId]);

        $entityIds = !empty($userDetails['entities']) ? array_column($userDetails['entities'], 'id') : [];
        $entityIdList = !empty($entityIds) ? implode(',', $entityIds) : '0';
        $this->logInfo('api_maarch_pleiade', 'User @userId belongs to entities: @entities', ['@userId' => $userId, '@entities' => $entityIdList]);

        $client = new Client();
        $mailsUrl = $this->url . '/res/list';

        foreach ($baskets as $basket) {
            if (empty($basket['basket_clause'])) {
                $this->logWarning('api_maarch_pleiade', 'Skipping basket ID @basketId because its clause is empty.', ['@basketId' => $basket['id']]);
                continue;
            }

            $this->logInfo('api_maarch_pleiade', 'Fetching mails for basket ID: @basketId for user @userId.', ['@basketId' => $basket['id'], '@userId' => $userId]);
            $clause = str_replace(['@user_id', '@my_entities_id'], [(string)$userId, $entityIdList], $basket['basket_clause']);
            $payload = ['select' => 'subject,res_id,creation_date,status,type_label', 'clause' => $clause];

            try {
                $this->logInfo('api_maarch_pleiade', 'Sending POST request to @url for basket @basketId.', ['@url' => $mailsUrl, '@basketId' => $basket['id']]);
                $response = $client->post($mailsUrl, ['headers' => ['Authorization' => "Bearer " . $this->key, 'Content-Type' => 'application/json'], 'json' => $payload]);

                if ($response->getStatusCode() === 200) {
                    $data = json_decode($response->getBody()->getContents(), true);
                    $mails = $data["resources"] ?? [];
                    $this->logInfo('api_maarch_pleiade', 'Found @count mails in basket @basketId.', ['@count' => count($mails), '@basketId' => $basket['id']]);

                    foreach ($mails as &$mail) {
                        if (isset($mail['res_id'], $basket['groupSerialId'], $basket['id'])) {
                            $mail['redirection_link'] = $this->getRedirectUrl($userId, $basket['groupSerialId'], $basket['id'], $mail['res_id']);
                        }
                    }
                    unset($mail);
                    $allMails = array_merge($allMails, $mails);
                }
            } catch (RequestException $e) {
                $this->logError('api_maarch_pleiade', 'Failed to fetch mails for basket @basketId. Error: @error', ['@basketId' => $basket['id'], '@error' => $e->getMessage()]);
            }
        }

        $this->logInfo('api_maarch_pleiade', 'Finished fetching mails for user @userId. Total mails retrieved: @count', ['@userId' => $userId, '@count' => count($allMails)]);
        return $allMails;
    }

    public function getRedirectUrl($userId, $groupId, $basketId, $resId)
    {
        $url = $this->redirectUrl . "/process/users/$userId/groups/$groupId/baskets/$basketId/resId/$resId";
        $this->logInfo('api_maarch_pleiade', 'Generated redirect URL: @url', ['@url' => $url]);
        return $url;
    }
}
