<?php

namespace Drupal\api_ciril_pleiade\Service;

interface CirilServiceInterface
{
  public function getCirilUserId($userMail);

  public function findUserIdByEmail(string $emailToFind, array $userList): ?int;

  public function getUserDetails(int $userId): ?array;
  
  public function getMailsForAllBaskets(int $userId): array;

    public function getUserId(): ?int;

    public function getRedirectUrl($userId,$groupId,$basketId,$resId);
}