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
  // function to query LemonLDAP API, myapplications endpoint
  public function lemon_myapps_query(Request $request)
  {
    $return = []; //our variable to fill with data returned by LemonLDAP   

    $return = $this->lemonService->searchMyApps();
    if ($return) {
      return new JsonResponse(json_encode($return), 200, [], true);
    }
  }

  // function to query LemonLDAP API, session/my/global endpoint
  public function lemon_session_query(Request $request)
  {
    unset($_COOKIE["groups"]);
    $return = []; //our variable to fill with data returned by LemonLDAP

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
      // Store groups in Drupal private tempstore to serve to other modules later
      $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
      $tempstore->set('groups', $return["groupes"]);
      setcookie('groups', $return['groups'], time() + 36000, '/');

      $email = $return["mail"];
      // Recherchez l'utilisateur par son adresse e-mail.
      $users = \Drupal::entityTypeManager()->getStorage('user')->loadByProperties(['mail' => $email]);

      // Assurez-vous que l'utilisateur a été trouvé.
      if (!empty($users)) {
        // Obtenez le premier utilisateur correspondant à l'adresse e-mail.
        $user = reset($users);

        // Vérifiez si l'utilisateur a un champ user_picture.
        if ($user->hasField('user_picture')) {
          // Obtenez la valeur du champ user_picture.
          $user_picture_value = $user->get('user_picture')->getValue();

          if (!empty($user_picture_value[0]['target_id'])) {
            // L'utilisateur a une image de profil personnalisée.
            $file = \Drupal\file\Entity\File::load($user_picture_value[0]['target_id']);
            $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
          } else {
            // Utilisez l'image de profil par défaut de l'utilisateur.
            $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
            $default_image = $field->getSetting('default_image');

            if ($default_image) {
              $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
              if ($file) {
                $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
              } else {
                // L'image par défaut n'a pas pu être chargée, utilisez une URL d'image par défaut.
                $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
              }
            } else {
              // Aucune image de profil par défaut n'est définie, utilisez une URL d'image par défaut.
              $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
            }
          }

          // Maintenant, $picture_url contient l'URL de l'image de profil de l'utilisateur.
          $return['user_picture_url'] = $picture_url;
        } else {
          // L'utilisateur n'a pas de champ user_picture.
          \Drupal::logger('api_lemon_pleiade')->warning('L\'utilisateur n\'a pas de champ user_picture.');
        }
      } else {
        // Aucun utilisateur trouvé avec cette adresse e-mail.
        \Drupal::logger('api_lemon_pleiade')->warning('Aucun utilisateur trouvé avec cette adresse e-mail.');
      }

      return new JsonResponse(json_encode($return), 200, [], true);
    } else {
      return new JsonResponse(json_encode('aucune donnée'), 200, [], true);
    }
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

  private function getErrorMeaning(string $code): string
  {
    // Source: Documentation de LemonLDAP::NG. [1]
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
      // Ajoutez d'autres codes si nécessaire.
    ];
    return $meanings[$code] ?? "Code d'erreur inconnu ($code)";
  }


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

    if ($request->get('type') == "success") {
      $all = $success;
    } else if ($request->get('type') == "failed") {
      $all = $failed;
    } else {
      $all = array_merge($success, $failed);
    }


    // Trier les entrées par date, de la plus récente à la plus ancienne
    usort($all, function ($a, $b) {
      return $b['_utime'] <=> $a['_utime'];
    });

    // Préparer les données pour le template
    $processed_logs = [];
    foreach ($all as $item) {
      $processed_logs[] = [
        'status' => $item['error'] ? ((int)$item['error']) < 0 ? 'success' : 'failed' : 'success',
        'timestamp' => $item['_utime'],
        'ip' => $item['ipAddr'],
        'message' => $item['error'] ?  $this->getErrorMeaning($item['error']) :  "",
      ];
    }

    // Renvoyer les données au template Twig
    return [
      '#theme' => 'api_lemon_pleiade_history',
      '#success_count' => count($success),
      '#failed_count' => count($failed),
      '#all_logs' => $processed_logs,
    ];
  }

  public function refresh_session(Request $request)
  {
      $this->lemonService->refresh_session();
      return new TrustedRedirectResponse("/");
  }
}
