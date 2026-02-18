<?php

namespace Drupal\api_lemon_pleiade\Controller;

use Drupal\api_lemon_pleiade\Service\LemonServiceInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;

class PleiadeAjaxController extends ControllerBase
{

  protected $lemonService;

  public function __construct(LemonServiceInterface $LemonService)
  {
    $this->lemonService = $LemonService;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get(LemonServiceInterface::class)
    );
  }

  /**
   * Function to query LemonLDAP API, myapplications endpoint.
   *
   * @param Request $request
   *   The request object.
   *
   * @return JsonResponse
   *   A JSON response containing the applications or an empty array.
   */
  public function lemon_myapps_query(Request $request): JsonResponse
  {
    $return = $this->lemonService->searchMyApps();

    // Since searchMyApps now returns an array with optimized URLs:
    if (!empty($return)) {
      return new JsonResponse($return); // JsonResponse automatically handles the encoding
    }

    return new JsonResponse([]);
  }

  /**
   * Function to query LemonLDAP API, session/my/global endpoint.
   *
   * @param Request $request
   *   The request object.
   *
   * @return JsonResponse
   *   A JSON response containing session data.
   */
  public function lemon_session_query(Request $request): JsonResponse
  {
    unset($_COOKIE["groups"]);

    $return = $this->lemonService->searchMySession();

    if ($return) {
      $return['groupes'] = '';
      $groupArray = explode(";", $return["groups"]);
      foreach ($groupArray as $group) {
        if (!empty($group)) {
          $dpt = explode("|", $group);
          $return['groupes'] .= $dpt[0] . ',';
        }
      }
      $return['groups'] = $return['groupes'];

      \Drupal::logger('api_lemon_pleiade')->info('User group: @api', ['@api' => $return['groupes']]);

      // Store groups in Drupal private tempstore
      $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
      $tempstore->set('groups', $return["groupes"]);
      setcookie('groups', $return['groups'], time() + 36000, '/');

      $email = $return["mail"];
      $users = \Drupal::entityTypeManager()->getStorage('user')->loadByProperties(['mail' => $email]);

      if (!empty($users)) {
        $user = reset($users);
        $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';

        if ($user->hasField('user_picture')) {
          $user_picture_value = $user->get('user_picture')->getValue();
          if (!empty($user_picture_value[0]['target_id'])) {
            $file = \Drupal\file\Entity\File::load($user_picture_value[0]['target_id']);
            $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
          } else {
            $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
            $default_image = $field->getSetting('default_image');
            if ($default_image) {
              $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
              if ($file) {
                $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
              }
            }
          }
          $return['user_picture_url'] = $picture_url;
        } else {
          \Drupal::logger('api_lemon_pleiade')->warning('The user does not have a user_picture field.');
        }
      } else {
        \Drupal::logger('api_lemon_pleiade')->warning('No user found with this email address: @mail', ['@mail' => $email]);
      }

      // Return data with 200 OK
      return new JsonResponse($return, 200);
    }

    // Return 401 Not Found instead of 200
    return new JsonResponse([
      'error' => 'no_session_found',
      'message' => 'Aucune donnée de session trouvée.'
    ], 401);
  }

  /**
   * Returns our session history page.
   *
   * @return array
   *   A simple renderable array.
   */
  public function reset_password()
  {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="history-connexion"></div>',
    ];
  }

  /**
   * Get the meaning of a LemonLDAP error code.
   *
   * @param string $code
   *   The error code.
   *
   * @return string
   *   The meaning of the error code.
   */
  private function getErrorMeaning(string $code): string
  {
    // Source: LemonLDAP::NG Documentation.
    $meanings = [
      '-4' => 'Authentification réussie',
      '1'  => 'Rechargement de la page',
      '2'  => 'Déconnexion',
      '3'  => 'Changement d\'utilisateur',
      '4'  => 'Nouvel en-tête d\'authentification',
      '5'  => 'Mauvais identifiants (login/mot de passe incorrect)',
      '6'  => 'L\'utilisateur n\'a pas les droits pour ouvrir une session',
      '7'  => 'Session expirée ou invalide',
      '8'  => 'L\'utilisateur a annulé le processus',
      '9'  => 'Attaque XSS détectée',
      '10' => 'Mauvais code de confirmation (Captcha)',
      '11' => 'L\'adresse IP a changé pendant la session',
      '12' => 'Le navigateur a changé pendant la session',
    ];
    return $meanings[$code] ?? "Code d'erreur inconnu ($code)";
  }

  /**
   * Returns the content for the connection history page.
   *
   * @param Request $request
   *   The request object.
   *
   * @return array
   *   A render array.
   */
  public function content(Request $request)
  {
    $return = $this->lemonService->searchMySession();

    if (empty($return) || !isset($return['_loginHistory'])) {
      return [
        '#type' => 'markup',
        '#markup' => $this->t("Impossible de récupérer l'historique des connexions."),
      ];
    }

    $success = $return['_loginHistory']['successLogin'] ?? [];
    $failed = $return['_loginHistory']['failedLogin'] ?? [];

    $type = $request->get('type');
    if ($type == "success") {
      $all = $success;
    } else if ($type == "failed") {
      $all = $failed;
    } else {
      $all = array_merge($success, $failed);
    }

    // Sort entries by date, from most recent to oldest.
    usort($all, function ($a, $b) {
      return $b['_utime'] <=> $a['_utime'];
    });

    // Prepare data for the template.
    $processed_logs = [];
    foreach ($all as $item) {
      $processed_logs[] = [
        'status' => isset($item['error']) && ((int)$item['error']) > 0 ? 'failed' : 'success',
        'timestamp' => $item['_utime'],
        'ip' => $item['ipAddr'],
        'message' => $item['error'] ? $this->getErrorMeaning($item['error']) : "Authentification réussie",
      ];
    }

    // Return data to the Twig template.
    return [
      '#theme' => 'api_lemon_pleiade_history',
      '#success_count' => count($success),
      '#failed_count' => count($failed),
      '#all_logs' => $processed_logs,
    ];
  }

  /**
   * Refreshes the user session.
   *
   * @param Request $request
   *   The request object.
   *
   * @return TrustedRedirectResponse
   *   A redirection to the homepage.
   */
  public function refresh_session(Request $request)
  {
    $this->lemonService->refresh_session();
    return new TrustedRedirectResponse("/");
  }
}
