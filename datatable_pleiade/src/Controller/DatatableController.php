<?php

namespace Drupal\datatable_pleiade\Controller;

use Drupal\api_maarch_pleiade\Service\MaarchServiceInterface;
use Drupal\api_nextcloud_pleiade\Service\NextCloudServiceInterface;
use Drupal\api_parapheur_pleiade\Service\PleiadeAjaxParapheurServiceInterface;
use Drupal\api_pastell_pleiade\Service\PastellServiceInterface;
use Drupal\api_ciril_pleiade\Service\CirilServiceInterface;
use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;

class DatatableController extends ControllerBase
{
    protected $parapheurService;
    protected $nextcloudService;
    protected $pastelService;
    protected $maarchService;
    protected $cirilService;

    public function __construct(
        PleiadeAjaxParapheurServiceInterface $parapheurService,
        NextCloudServiceInterface $nextcloudService,
        PastellServiceInterface $pastelService,
        MaarchServiceInterface $maarchService,
        CirilServiceInterface $cirilService
    ) {
        $this->parapheurService = $parapheurService;
        $this->nextcloudService = $nextcloudService;
        $this->pastelService = $pastelService;
        $this->maarchService = $maarchService;
        $this->cirilService = $cirilService;
    }

    public static function create(ContainerInterface $container)
    {
        return new static(
            $container->get(PleiadeAjaxParapheurServiceInterface::class),
            $container->get(NextCloudServiceInterface::class),
            $container->get(PastellServiceInterface::class),
            $container->get(MaarchServiceInterface::class),
            $container->get('api_ciril_pleiade.ciril_service')
        );
    }

  public function documents_recents(Request $request, $exercice, $budget)
  {
    $formattedData = ['docs' => []];
    $cirilresult = ['exercises' => [], 'budgets' => []];

    $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $storedGroups = $tempstoreGroup->get('groups');

    // --- PASTELL INTEGRATION ---
    if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
      $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
      $tempstore->delete('documents_pastell');
      $returnPastell = [];
      $id_e = $request->query->get('id_e');

      if (null !== $id_e && is_numeric($id_e)) {
        $docsPastell = $this->pastelService->searchMyDocs($id_e);
        $fluxPastell = $this->pastelService->searchMyFlux();
        if ($docsPastell) {
          foreach ($docsPastell as &$document) {
            if (isset($fluxPastell[$document['type']]['nom'])) {
              $document['type'] = $fluxPastell[$document['type']]['nom'];
            }
          }
          $tempstore->set('documents_pastell', $docsPastell);
          $returnPastell = $docsPastell;
        }
      }
      $formattedData['docs'] = array_merge($formattedData['docs'], $returnPastell);
    }

    // --- PARAPHEUR INTEGRATION ---
    if (is_string($storedGroups) && strpos($storedGroups, 'i-parapheur') !== false) {
      $config = \Drupal::config('api_parapheur_pleiade.settings');
      $field_parapheur_url = $config->get('field_parapheur_url');
      $returnParapheur = [];
      $docsParapheur = $this->parapheurService->searchMyDesktop();
      
      if ($docsParapheur) {
        $returnParapheur = array_map(function ($item) use ($field_parapheur_url) {
          return [
            'type' => 'Parapheur',
            'titre' => ($item['stepList'][0]['desks'][0]['name'] ?? 'N/A') . " | " . $item['name'],
            'id' => $item['id'],
            'status' => $item['stepList'][0]['action'] ?? '',
            'creation' => isset($item['draftCreationDate']) ? date('d/m/y', strtotime($item['draftCreationDate'])) : '',
            'fileUrl' => $field_parapheur_url . "tenant/" . $item['tenant_id'] . '/desk/' . ($item['stepList'][0]['desks'][0]['id'] ?? '') . "/folder/" . $item['id'],
            'type_dossier' => ($item['type']['name'] ?? '') . " | " . ($item['subtype']['name'] ?? '')
          ];
        }, $docsParapheur);
      }
      $formattedData['docs'] = array_merge($formattedData['docs'], $returnParapheur);
    }

    // --- MAARCH INTEGRATION ---
    if (is_string($storedGroups) && strpos($storedGroups, 'maarch') !== false) {
      $userId = $this->maarchService->getUserId();
      if ($userId != null) {
        $returnMaarch = [];
        $maarchDocs = $this->maarchService->getMailsForAllBaskets($userId);
        if (!empty($maarchDocs)) {
          $returnMaarch = array_map(function ($item) {
            return [
              'type' => 'Maarch',
              'titre' => $item['subject'],
              'id' => $item['res_id'],
              'status' => $item['status'],
              'last_action_date' => date('d/m/y', strtotime($item['creation_date'])),
              'type_dossier' => $item['type_label'],
              'fileUrl' => $item['redirection_link']
            ];
          }, $maarchDocs);
        }
        $formattedData['docs'] = array_merge($formattedData['docs'], $returnMaarch);
      }
    }

    // --- CIRIL (FINANCES) INTEGRATION ---
    if (is_string($storedGroups) && (strpos($storedGroups, 'Ciril') !== false || strpos($storedGroups, 'ciril-user') !== false)) {
      $session = $request->getSession();
      $casAttributes = $session ? $session->get('cas_attributes') : NULL;

      if (isset($casAttributes["mail"][0])) {
        $email = $casAttributes["mail"][0];
        
        $budgetFilter = ($budget === 'all') ? '' : $budget;

        $cirilresult = $this->cirilService->getDocsByEmail($email, $exercice, $budgetFilter);
        
        $cirilDocs = $cirilresult['documents'] ?? [];
        if (!empty($cirilDocs)) {
          $returnCiril = array_map(function ($item) {
            $montantNumerique = (float) ($item['montant_ttc'] ?? 0);
            return [
              'type'             => 'Ciril',
              'titre'            => $item['titre'],
              'id'               => $item['id'],
              'status'           => $item['status'],
              'creation'         => $item['date'],
              'type_dossier'     => $item['type'],
              'fileUrl'          => '',
              'montant'          => number_format($montantNumerique, 2, ',', ' ') . ' €',
              // ADDED: pass budget and exercice to JSON
              'budget'           => $item['budget'] ?? '',
              'exercice'         => $item['exercice'] ?? ''
            ];
          }, $cirilDocs);

          $formattedData['docs'] = array_merge($formattedData['docs'], $returnCiril);
        }
      }
    }

    // --- NEXTCLOUD INTEGRATION ---
    $return_nc = $this->nextcloudService->getNextcloudNotifs();
    $nc_tempstore = \Drupal::service('tempstore.private')->get('api_nextcloud_pleiade');
    $nc_tempstore->set('documents_nextcloud', $return_nc);

    if ($return_nc && isset($return_nc->ocs->data) && !empty($return_nc->ocs->data)) {
      $formattedItems = [];
      foreach ($return_nc->ocs->data as $item) {
        if (!isset($item->subjectRichParameters->file)) {
          continue;
        }
        $status = '';
        if (strpos($item->subject, 'modif') !== false) {
          $status = 'Modifié';
        } elseif (strpos($item->subject, 'partag') !== false) {
          $status = 'Partagé';
        }
        $formattedItems[] = [
          'type' => 'Nextcloud',
          'type_dossier' => "Notification",
          'titre' => $item->subjectRichParameters->file->name ?? null,
          'creation' => date('d/m/y', strtotime($item->datetime)),
          'status' => $status,
          'fileUrl' => $item->subjectRichParameters->file->link ?? null
        ];
      }
      $formattedData['docs'] = array_merge($formattedData['docs'], $formattedItems);
    }

    $responseArray = [
      'docs' => $formattedData['docs'],
      'exercises' => $cirilresult['exercises'] ?? [],
      'budgets' => $cirilresult['budgets'] ?? []
    ];

    return new \Symfony\Component\HttpFoundation\JsonResponse($responseArray);
  }
}