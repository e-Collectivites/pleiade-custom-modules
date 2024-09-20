<?php

namespace Drupal\api_pastell_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

use Drupal\user\PrivateTempStoreFactory;

class PleiadeAjaxPastellController extends ControllerBase
{

    // public function pastell_entities_query(Request $request)
    // {
    //     $return = []; //our variable to fill with data returned by Pastell
    //     $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    //     $storedGroups = $tempstoreGroup->get('groups');
        
    //     if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
           
    //         $pastelldataApi = new ApiPleiadeManager();
    //         $return = $pastelldataApi->searchMyEntities();
    //         $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
    //         $tempstore->set('entites', $return);
    //         if($return != null){
    //             return new JsonResponse(json_encode($return), 200, [], true);
    //         }
    //         else
    //         {
    //             \Drupal::logger('api_pastell_pleiade')->error('Aucune entitée Pastell');
    //             return new JsonResponse(json_encode('null'), 200, [], true);
    //         }

    //     } else {
    //         \Drupal::logger('api_pastell_pleiade')->debug('pas dans le groupe pastell');
    //         return new JsonResponse(json_encode(''), 200, [], true);
    //     }
    // }

    public function pastell_entities_query(Request $request)
{
    $return = []; // Variable à remplir avec les données retournées par Pastell
    $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');

    $current_user = \Drupal::currentUser();

    // Obtenir l'entité utilisateur.
    $user = \Drupal\user\Entity\User::load($current_user->id());

    $users = get_all_users();
    $role_user = [];
    $isAdmin = false;

    // Récupérer les rôles de l'utilisateur actuel
    foreach ($users as $user_pastell) {
        if ($user->getAccountName() == $user_pastell->login) {
            $role_user = get_roles_user($user_pastell->id_u);
            // Vérifier si l'utilisateur a le rôle "admin"
            foreach ($role_user as $role) {
                if ($role->role === 'admin') {
                    $isAdmin = true;
                    break;
                }
            }
            break; // Stopper la boucle une fois que l'utilisateur est trouvé
        }
    }
    if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {

        $pastelldataApi = new ApiPleiadeManager();
        $entities = $pastelldataApi->searchMyEntities();
        
        if ($isAdmin) {
            $filteredEntities = $entities;
        } else {
        $filteredEntities = [];
        // Filtrer les entités en fonction des rôles de l'utilisateur
       
        foreach ($entities as $entity) {
            
            foreach ($role_user as $role) {
                
                if ($role->id_e == $entity['id_e'] && $role->role !== 'aucun droit') {
                    $filteredEntities[] = $entity;
                    break; // Stopper la boucle interne dès qu'un rôle valide est trouvé pour cette entité
                }
            }
        }
    }

        $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
        $tempstore->set('entites', $filteredEntities);

        if (!empty($filteredEntities)) {
            return new JsonResponse(json_encode($filteredEntities), 200, [], true);
        } else {
            \Drupal::logger('api_pastell_pleiade')->error('Aucune entité Pastell avec des droits valides trouvée');
            return new JsonResponse(json_encode('null'), 200, [], true);
        }

    } else {
        \Drupal::logger('api_pastell_pleiade')->debug('pas dans le groupe pastell');
        return new JsonResponse(json_encode(''), 200, [], true);
    }
}

    public function pastell_flux_query(Request $request)
    {
        $return = []; //our variable to fill with data returned by Pastell
        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');
        
        if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
            $pastelldataApi = new ApiPleiadeManager();
            $return = $pastelldataApi->searchMyFlux();
            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->set('flux', $return);
            if($return != null){
                return new JsonResponse(json_encode($return), 200, [], true);
            }
            else
            {
                \Drupal::logger('api_pastell_pleiade')->error('Erreur lors de la récupération des flux Pastell');
                return new JsonResponse(json_encode('null'), 200, [], true);
            }
        } else {
            \Drupal::logger('api_pastell_pleiade')->debug('pas dans le groupe pastell');
            return new JsonResponse(json_encode([]), 200, [], true);
        }
    }

}