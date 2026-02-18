<?php

namespace Drupal\api_ciril_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\api_ciril_pleiade\Service\CirilServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

class PleiadeAjaxCirilController extends ControllerBase {

  protected $cirilService;

  public function __construct(CirilServiceInterface $cirilService) {
    $this->cirilService = $cirilService;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('api_ciril_pleiade.ciril_service')
    );
  }

  public function getPurchaseOrderDocuments(): JsonResponse {
    $email = $this->getUserEmail();
    $data = $this->cirilService->getDocsByEmail($email, '2025');
    return new JsonResponse($data);
  }

  public function getPurchaseOrderDocumentsByYear($year): JsonResponse {
    $email = $this->getUserEmail();
    $data = $this->cirilService->getDocsByEmail($email, (string) $year);
    return new JsonResponse($data);
  }

  private function getUserEmail(): string {
    //return 'ldumaine@sitiv.fr';
    $session = \Drupal::request()->getSession();
    $casAttributes = $session ? $session->get('cas_attributes') : NULL;
    if ($casAttributes && isset($casAttributes["mail"][0])) {
      return $casAttributes["mail"][0];
    }
    return '';
  }
}