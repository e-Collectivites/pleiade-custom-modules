<?php

namespace Drupal\api_ciril_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\api_ciril_pleiade\Service\CirilServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
// Notez que 'Request', 'User' et 'AccountProxyInterface' ne sont plus nécessaires ici.

class PleiadeAjaxCirilController extends ControllerBase
{
  protected $cirilService;

  // Le constructeur n'a plus besoin de $current_user
  public function __construct(CirilServiceInterface $cirilService)
  {
    $this->cirilService = $cirilService;
  }

  // La méthode create est également simplifiée
  public static function create(ContainerInterface $container)
  {
    return new static(
     $container->get(CirilServiceInterface::class)
    );
  }

  // La méthode privée getUserId() est supprimée d'ici.

  public function getUserBaskets(): JsonResponse
  {
    // Appel direct à la nouvelle méthode du service
    $userId = $this->cirilService->getUserId();

    if (!$userId) {
      return new JsonResponse(['error' => 'Ciril user ID not found.'], 404);
    }

    $userDetails = $this->cirilService->getUserDetails($userId);

    if (is_null($userDetails)) {
      return new JsonResponse(['error' => 'Failed to retrieve details from ciril.'], 500);
    }
    
    return new JsonResponse($userDetails['baskets'], 200);
  }

  public function getMailsForAllBaskets(): JsonResponse
  {
    // Appel direct à la nouvelle méthode du service
    $userId = $this->cirilService->getUserId();

    if (!$userId) {
      return new JsonResponse(['error' => 'ciril user ID not found.'], 404);
    }

    $allMails = $this->cirilService->getMailsForAllBaskets($userId);

    if (empty($allMails)) {
      return new JsonResponse(['message' => 'No mails found for this user.'], 200);
    }

    return new JsonResponse($allMails, 200);
  }

   public function getMails(): JsonResponse
  {
    // Appel direct à la nouvelle méthode du service
    $userId = $this->cirilService->getUserId();

    if (!$userId) {
      return new JsonResponse(['error' => 'ciril user ID not found.'], 404);
    }

    $allMails = $this->cirilService->getMailsForAllBaskets($userId);

    if (empty($allMails)) {
      return new JsonResponse(['message' => 'No mails found for this user.'], 200);
    }

    return new JsonResponse($allMails, 200);
  }
}