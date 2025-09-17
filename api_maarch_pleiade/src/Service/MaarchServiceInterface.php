<?php

namespace Drupal\api_maarch_pleiade\Service;

interface MaarchServiceInterface
{
  public function getMaarchUserId($userMail);

  public function findUserIdByEmail(string $emailToFind, array $userList): ?int;

  public function getUserDetails(int $userId): ?array;
  
  public function getMailsForAllBaskets(int $userId): array;

    public function getUserId(): ?int;

    public function getRedirectUrl($userId,$groupId,$basketId,$resId);
}