<?php

namespace Drupal\datatable_pleiade\Controller;

use Drupal\api_maarch_pleiade\Service\MaarchServiceInterface;
use Drupal\api_nextcloud_pleiade\Service\NextCloudServiceInterface;
use Drupal\api_parapheur_pleiade\Service\PleiadeAjaxParapheurServiceInterface;
use Drupal\api_pastell_pleiade\Service\PastellServiceInterface;
use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;

class DatatableController extends ControllerBase
{

    private $nextcloudService;
    private $pastelService;
    private $parapheurService;
    private $maarchService;
    public function __construct(PleiadeAjaxParapheurServiceInterface $parapheurService, NextCloudServiceInterface $nextcloudService, PastellServiceInterface $pastelService, MaarchServiceInterface $maarchService)
    {
        $this->parapheurService = $parapheurService;
        $this->nextcloudService = $nextcloudService;
        $this->pastelService = $pastelService;
        $this->maarchService = $maarchService;
    }


    public static function create(ContainerInterface $container)
    {
        return new static(
            $container->get(PleiadeAjaxParapheurServiceInterface::class),
            $container->get(NextCloudServiceInterface::class),
            $container->get(PastellServiceInterface::class),
            $container->get(MaarchServiceInterface::class)
        );
    }


    public function documents_recents(Request $request)
    {
        $formattedData['docs'] = [];

        $tempstoreGroup = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
        $storedGroups = $tempstoreGroup->get('groups');


        /*******************************************************
         *                  BLOC PASTELL
         *******************************************************/
        if (is_string($storedGroups) && strpos($storedGroups, 'pastell') !== false) {
            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->delete('documents_pastell');
            $returnPastell = [];

            $id_e = $request->query->get('id_e');

            if (null !== $id_e && is_numeric($id_e)) {
                \Drupal::logger('api_pastell_documents')->info('function search Pastell Docs with id_e : ' . $id_e);

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


        /*******************************************************
         *                BLOC I-PARAPHEUR
         *******************************************************/
        if (is_string($storedGroups) && strpos($storedGroups, 'i-parapheur') !== false) {
            $config = \Drupal::config('api_parapheur_pleiade.settings');
            $field_parapheur_url = $config->get('field_parapheur_url');
            $returnParapheur = [];

            $docsParapheur = $this->parapheurService->searchMyDesktop();
            if ($docsParapheur) {
                $returnParapheur = array_map(function ($item) use ($field_parapheur_url) {
                    return [
                        'type' => 'Parapheur',
                        'titre' => $item['stepList'][0]['desks'][0]['name'] . " | " . $item['name'],
                        'id' => $item['id'],
                        'status' => $item['stepList'][0]['action'],
                        'creation' => date('d/m/y', strtotime($item['draftCreationDate'])),
                        'fileUrl' => $field_parapheur_url . "tenant/" . $item['tenant_id'] . '/desk/' . $item['stepList'][0]['desks'][0]['id'] . "/folder/" . $item['id'],
                        'type_dossier' => $item['type']['name'] . " | " . $item['subtype']['name']
                    ];
                }, $docsParapheur);
            }
            $formattedData['docs'] = array_merge($formattedData['docs'], $returnParapheur);
        }


        /*******************************************************
         *                   BLOC MAARCH
         *******************************************************/
        if (is_string($storedGroups) && strpos($storedGroups, 'maarch') !== false) {
            $userId = $this->maarchService->getUserId();
            if ($userId != null) {



                $returnMaarch = [];

                $maarchDocs = $this->maarchService->getMailsForAllBaskets($userId);

                if (!empty($maarchDocs)) {
                    $maarchResources = $maarchDocs;



                    $returnMaarch = array_map(function ($item) {
                        return [
                            'type' => 'Maarch',
                            'titre' => $item['subject'],
                            'id' => $item['res_id'],
                            'status' => $item['status'],
                            'last_action_date' => date('d/m/y', strtotime($item['creation_date'])),
                            'type_dossier' => $item['type_label'],
                            "fileUrl" => $item['redirection_link']
                        ];
                    }, $maarchResources);
                }
                $formattedData['docs'] = array_merge($formattedData['docs'], $returnMaarch);
            }
        }


        /*******************************************************
         *                  BLOC NEXTCLOUD
         *******************************************************/
        $return_nc = $this->nextcloudService->getNextcloudNotifs();
        $tempstore = \Drupal::service('tempstore.private')->get('api_nextcloud_pleiade');
        $tempstore->set('documents_nextcloud', $return_nc);

        if ($return_nc && isset($return_nc->ocs->data) && !empty($return_nc->ocs->data)) {
            $formattedItems = [];
            $data = $return_nc->ocs->data;

            foreach ($data as $item) {
                if (!isset($item->subjectRichParameters->file)) {
                    continue;
                }

                $status = '';
                if (strpos($item->subject, 'modif') !== false) {
                    $status = 'Modifié';
                } elseif (strpos($item->subject, 'partag') !== false) {
                    $status = 'Partagé';
                }

                $formattedItem = [
                    'type' => 'Nextcloud',
                    'titre' => $item->subjectRichParameters->file->name ?? null,
                    'creation' => date('d/m/y', strtotime($item->datetime)),
                    'status' => $status,
                    'fileUrl' => $item->subjectRichParameters->file->link ?? null
                ];
                $formattedItems[] = $formattedItem;
            }

            if (!empty($formattedItems)) {
                $formattedData['docs'] = array_merge($formattedData['docs'], $formattedItems);
            }
        }

        $jsonData = json_encode($formattedData);

        $moduleHandler = \Drupal::service('module_handler');
        if ($moduleHandler->moduleExists('api_pastell_pleiade')) {
            $settings_pastell = \Drupal::config('api_pastell_pleiade.settings');
            if (isset($id_e)) {
                $url = $settings_pastell->get('field_pastell_url') .
                    $settings_pastell->get('field_pastell_documents_url') . $id_e .
                    '&limit=' . $settings_pastell->get('field_pastell_limit_documents');
                \Drupal::logger('api_pastell_pleiade')->debug($url);
            }
        }

        if ($jsonData !== 'null' && !empty($formattedData['docs'])) {
            return new JsonResponse($jsonData, 200, [], true);
        } else {
            return new JsonResponse(json_encode(['docs' => []]), 200, [], true);
        }
    }
}
