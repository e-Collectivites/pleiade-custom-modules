<?php

namespace Drupal\api_user_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class PleiadeUserController extends ControllerBase
{

  private $user;
  private $settings_user;
  private $annuaireLogin;
  private $annuairePassword;
  private $annuaireUrl;
  
  public function __construct()
  {
    $this->annuaireLogin =  $this->config("api_user_pleiade.settings")->get("annuaire_login");
    $this->annuairePassword =  $this->config("api_user_pleiade.settings")->get("annuaire_password");
    $this->annuaireUrl =  $this->config("api_user_pleiade.settings")->get("annuaire_url");

    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_user_pleiade')) {
      $this->settings_user = \Drupal::config('api_user_pleiade.settings');
    }

    $user_storage =  \Drupal::entityTypeManager()->getStorage('user');
    $this->user = $user_storage->load(\Drupal::currentUser()->id());
  }

  public function user_infos(Request $request)
  {
    $current_user = \Drupal::currentUser();
    $user = \Drupal\user\Entity\User::load($current_user->id());
    $user_info = array();

    if ($user) {
      $user_info["field_url_application"] = $user->get("field_url_application")->getValue();
      $user_info["access"] = $user->get("access")->getValue();
      $user_info["created"] = $user->get("created")->getValue();
    }
    
    if ($user_info) {
      return new JsonResponse(json_encode($user_info), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }
  
  public function user_list_query(Request $request)
  {
    $query = \Drupal::entityQuery('user')->accessCheck(TRUE);
    $uids = $query->execute();
    $users = array();

    foreach ($uids as $uid) {
      $user = \Drupal\user\Entity\User::load($uid);

      $picture_url = '';
      if (isset($user->get('user_picture')->entity)) {
        $picture_url = $user->get('user_picture')->entity->createFileUrl();
      } else {
        $field = \Drupal\field\Entity\FieldConfig::loadByName('user', 'user', 'user_picture');
        $default_image = $field->getSetting('default_image');
        if ($default_image) {
          $file = \Drupal::service('entity.repository')->loadEntityByUuid('file', $default_image['uuid']);
          if ($file != '' || $file != null) {
            try {
              $picture_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
            } catch (InvalidStreamWrapperException $e) {
              $picture_url = '';
            }
          } else {
            $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
          }
        } else {
          $picture_url = '/themes/custom/pleiadebv/assets/images/users/img_user.png';
        }
      }

      $last_login_timestamp = '';
      if ($user->getLastLoginTime()) {
        $last_login_timestamp = $user->getLastLoginTime();
      }

      $email = '';
      if ($user->getEmail()) {
        $email = $user->getEmail();
      }

      $users[] = array(
        'id' => $user->id(),
        'picture_url' => $picture_url,
        'last_login_timestamp' => $last_login_timestamp,
        'email' => $email,
      );
    }

    if ($users) {
      return new JsonResponse(json_encode($users), 200, [], true);
    } else {
      echo 'erreur lors de la récupération des users';
    }
  }

  public function user_add_application(Request $request)
  {
    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    if (!$user) {
      return new JsonResponse(['message' => 'User not found.'], 404);
    }

    $uri = $request->get('uri');
    $title = $request->get('title');

    if (empty($uri) || empty($title)) {
      return new JsonResponse(['message' => 'Missing uri or title parameter.'], 400);
    }

    // Normalize URI
    $normalize_uri = function ($u) {
      return rtrim($u, '/');
    };

    $normalized_uri = $normalize_uri($uri);

    $values = $user->get('field_url_application')->getValue();

    $new_value = [
      'uri' => $uri,
      'title' => $title,
    ];

    // Check if the URI already exists to avoid duplicates
    foreach ($values as $existing_value) {
      if (isset($existing_value['uri']) && $normalize_uri($existing_value['uri']) === $normalized_uri) {
        return new JsonResponse(['message' => 'This URI already exists in your favorites.'], 409);
      }
    }

    // Add the new value
    $values[] = $new_value;
    $user->set('field_url_application', $values);
    $user->save();

    return new JsonResponse(['message' => 'Application added successfully.'], 200);
  }

  public function user_modify_application(Request $request)
  {
    $user = \Drupal\user\Entity\User::load(
        \Drupal::currentUser()->id()
    );
    if (!$user) {
        return new JsonResponse(['message' => 'User not found.'], 404);
    }

    $old_uri = $request->get('old_uri');
    $old_title = $request->get('old_title');
    $new_uri = $request->get('new_uri');
    $new_title = $request->get('new_title');

    if (empty($old_uri) || empty($old_title) || empty($new_uri) || empty($new_title)) {
        return new JsonResponse(['message' => 'Missing required parameters.'], 400);
    }

    $normalize_uri = function ($u) {
        return rtrim($u, '/');
    };

    $normalized_old_uri = $normalize_uri($old_uri);
    $normalized_new_uri = $normalize_uri($new_uri);

    $values = $user->get('field_url_application')->getValue();

    $found = false;
    foreach ($values as $key => $item) {
        $item_uri = isset($item['uri']) ? $normalize_uri($item['uri']) : '';
        $item_title = $item['title'] ?? '';
        
        if ($item_uri === $normalized_old_uri && $item_title === $old_title) {
            // Check if new URI doesn't already exist (unless it's the same entry)
            foreach ($values as $check_key => $check_item) {
                if ($check_key !== $key) {
                    $check_uri = isset($check_item['uri']) ? $normalize_uri($check_item['uri']) : '';
                    if ($check_uri === $normalized_new_uri) {
                        return new JsonResponse(['message' => 'New URI already exists.'], 409);
                    }
                }
            }
            
            $values[$key]['uri'] = $new_uri;
            $values[$key]['title'] = $new_title;
            $found = true;
            break;
        }
    }

    if (!$found) {
        return new JsonResponse(['message' => 'Application not found.'], 404);
    }

    $user->set('field_url_application', $values);
    $user->save();

    return new JsonResponse(['message' => 'Application modified successfully.'], 200);
  }

  public function user_delete_application(Request $request)
  {
    $user = \Drupal\user\Entity\User::load(
      \Drupal::currentUser()->id()
    );
    if (!$user) {
      return new JsonResponse(['message' => 'Utilisateur introuvable.'], 404);
    }

    $uri = $request->get('uri');
    $title = $request->get('title');

    if (empty($uri) || empty($title)) {
      return new JsonResponse(['message' => 'Paramètre uri ou title manquant.'], 400);
    }

    $normalize_uri = function ($u) {
      return rtrim($u, '/');
    };

    $normalized_uri = $normalize_uri($uri);

    $values = $user->get('field_url_application')->getValue();

    $new_values = array_filter($values, function ($item) use ($normalized_uri, $title, $normalize_uri) {
      $item_uri = isset($item['uri']) ? $normalize_uri($item['uri']) : '';
      $item_title = $item['title'] ?? '';
      return !($item_uri === $normalized_uri && $item_title === $title);
    });

    if (count($new_values) === count($values)) {
      return new JsonResponse(['message' => 'Aucune correspondance trouvée pour uri et title.'], 404);
    }

    $user->set('field_url_application', array_values($new_values));
    $user->save();

    return new JsonResponse(['message' => 'Application deleted successfully.'], 200);
  }

  public function setVariables(Request $request)
  {
    if ($request->get("var") == "field_isnextcloudactivated" && empty($this->user->get('field_nextcloud_api_key')->value)) {
      $this->user->set($request->get("var"), true);
    } else  if ($request->get("var") == "field_iswatchaactivated" && empty($this->user->get('field_watchaaccesstoken')->value)) {
      $this->user->set($request->get("var"), true);
      $this->user->save();
    } else {
      $this->user->set($request->get("var"), !$this->user->get($request->get("var"))->value);
      $this->user->save();
    }

    return new JsonResponse([
      "isWatchaActivated" => $this->user->get("field_iswatchaactivated")->value,
      "isGlpiActivated" => $this->user->get("field_isglpiactivated")->value,
      "isNextCloudActivated" => $this->user->get("field_isnextcloudactivated")->value,
      "isMenuOpened" => $this->user->get("field_ismenuopened")->value,
      "isPostitActivated" => $this->user->get("field_ispostitactivated")->value,
    ], 200);
  }
  
  public function setVariablesValue(Request $request)
  {
    $this->user->set($request->get("var"), $request->get("value"));
    $this->user->save();
    return new JsonResponse([], 200);
  }

  public function getVariablesValue(Request $request)
  {
    $data = $this->user->get($request->get("var"))->value;
    return new JsonResponse($data, 200);
  }
}