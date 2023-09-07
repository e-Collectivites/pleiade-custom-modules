<?php

namespace Drupal\api_glpi_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Drupal\Component\Serialization\JSON;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class GlpiController extends ControllerBase
{

  public function __construct()
  {
    $moduleHandler = \Drupal::service('module_handler');
    if ($moduleHandler->moduleExists('api_glpi_pleiade')) {
      $this->settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    }
  }
  public function glpi_list_tickets(Request $request)
  {
	$settings_glpi = \Drupal::config('api_glpi_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode('; ', $groupData);
    }
    if (in_array($settings_glpi->get('glpi_group'), $groupDataArray)) {
	$glpiDataAPI = new ApiPleiadeManager();
      $return = $glpiDataAPI->getGLPITickets();
$returnEmailUser = $glpiDataAPI->searchMySession();
      $userEmail = $returnEmailUser['mail'];
if ($return) {
    $allTickets = array(); // Tableau pour stocker tous les tickets

    foreach ($return as $ticket) { // Notez l'utilisation de "&" pour accéder au ticket par référence
        // Extraire l'ID de chaque ticket
        $ticketId = $ticket['id'];

        // Effectuer la requête en utilisant $glpiDataAPI->getStatutActorGLPI() avec $ticketId
        $statut = $glpiDataAPI->getStatutActorGLPI($ticketId);

        // Créer un tableau pour stocker les données extraites de $newData
        $newData = array();

        foreach ($statut as $status) {
            // Extraire le type et le users_id de chaque ticket
            $type = $status['type'];
            $users_id = $status['users_id'];

            // Créer un nouvel objet JSON avec les informations extraites
            $newTicketData = array(
                'type' => $type,
                'users_id' => $users_id
            );

            // Ajouter le nouvel objet JSON au tableau $newData
            $newData[] = $newTicketData;
        }

        // Ajouter $newData à la fin du ticket actuel
        $ticket['newData'] = $newData;

        // Ajouter le ticket actuel au tableau de tous les tickets
        $allTickets[] = $ticket;
    }
    
      }
 $allTickets['usermail'] = $userEmail;
      return new JsonResponse(json_encode($allTickets), 200, [], true);

    }
  }
	public function glpi_tickets() {
    return [
      '#markup' => '
      <div class="d-flex justify-content-center">
        <div id="spinner-history" class="spinner-border text-primary" role="status">
        </div>
      </div>
      <div id="glpi_list_tickets"></div>',
    ];
  }
}
