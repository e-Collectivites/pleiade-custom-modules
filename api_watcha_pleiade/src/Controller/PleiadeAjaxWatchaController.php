<?php

namespace Drupal\api_watcha_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Drupal\api_watcha_pleiade\Service\WatchaServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\user\Entity\User;

class PleiadeAjaxWatchaController extends ControllerBase
{

  protected $watchaService;
  protected $currentUser;

  public function __construct(WatchaServiceInterface $watchaService, AccountProxyInterface $current_user)
  {
    $this->watchaService = $watchaService;
    $this->currentUser = $current_user;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get(WatchaServiceInterface::class),
      $container->get('current_user')
    );
  }

  public function watcha_auth_flow(Request $request)
  {
    $link = $this->watchaService->getAuthorizationLink();
    return new TrustedRedirectResponse($link);
  }

  public function watcha_auth(Request $request)
  {
    $code = $request->query->get('code');
    
    // If no code, redirect home with error instead of breaking
    if (!$code) {
      \Drupal::messenger()->addError("Authentification annulée ou code manquant.");
      return new RedirectResponse("/");
    }

    $tokenData = $this->watchaService->exchangeCodeForToken($code);
    
    if (isset($tokenData['error']) || empty($tokenData['access_token'])) {
       // Log error internally, but show user the app
       \Drupal::logger('api_watcha_pleiade')->error('Watcha Token Error: @err', ['@err' => json_encode($tokenData)]);
       \Drupal::messenger()->addError("Échec de l'échange de token Watcha.");
       return new RedirectResponse("/");
    }

    $redirectUrl = $this->watchaService->getSynapseRedirectUrl();
    return new TrustedRedirectResponse($redirectUrl);
  }

  public function watcha_synapse_callback(Request $request)
  {
    $loginToken = $request->query->get('loginToken');
    
    // Case 1: Missing Token
    if (!$loginToken) {
      \Drupal::messenger()->addError("Connexion Watcha impossible : Token manquant.");
      return new RedirectResponse("/");
    }

    $responseData = $this->watchaService->handleSynapseCallback($loginToken);

    // Case 2: Success
    if (isset($responseData['access_token'])) {
      // Optional: Add success message if desired
      // \Drupal::messenger()->addStatus("Connexion Watcha réussie.");
      return new RedirectResponse("/");
    }

    // Case 3: Rate Limit (429) or other Errors
    if (isset($responseData['error'])) {
        if ($responseData['error'] === 'rate_limit') {
             $wait = isset($responseData['retry_after_seconds']) ? ceil($responseData['retry_after_seconds']) : 'quelques';
             \Drupal::messenger()->addWarning("Le service de discussion est surchargé. Veuillez réessayer dans $wait secondes.");
        } else {
             // General error
             \Drupal::messenger()->addError("Le service de discussion est temporairement indisponible.");
        }
    } else {
        // Fallback for unknown structure
        \Drupal::messenger()->addError("Erreur inconnue lors de la connexion au chat.");
    }

    // CRITICAL: Always redirect to the app, never block with a text response.
    return new RedirectResponse("/");
  }

  public function getConfig(Request $request)
  {
    try {
      $data = $this->watchaService->getConfigData();
      return new JsonResponse(['data' => $data], 200);
    } catch (\Exception $e) {
      return new JsonResponse(['error' => $e->getMessage()], 401);
    }
  }

  public function watcha_test(Request $request)
  {
    $output = "";
    $user = User::load($this->currentUser->id());
    $email = $user ? $user->getEmail() : 'Unknown';

    $session = \Drupal::request()->getSession();
    $cas_attributes = $session->get('cas_attributes');
    $collectivite = isset($cas_attributes["partner"][0]) ? $cas_attributes["partner"][0] : 'Aucune collectivité';

    $output .= "<h1>Collectivité : $collectivite</h1>";
    $output .= "<h2>Utilisateur : $email</h2>";

    $store = \Drupal::keyValue("collectivities_store")->get('global', []);
    $labels = ['Site', 'Image', 'Horaire', 'Téléphone', 'Email', 'Token zimbra'];

    $output .= "<pre>";
    if (is_array($store)) {
      foreach ($store as $key => $infoArray) {
        $output .= strtoupper($key) . ":\n";
        if (is_array($infoArray)) {
          foreach ($infoArray as $i => $value) {
            $label = $labels[$i] ?? "Valeur $i";
            $output .= "  $label: $value\n";
          }
        } else {
          $output .= "  Data: " . print_r($infoArray, true) . "\n";
        }
        $output .= "\n";
      }
    }
    $output .= "</pre>";

    return new Response($output);
  }
}