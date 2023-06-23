<?php

namespace Drupal\datatable_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;


class DatatableController extends ControllerBase {

    public function documents_recents(Request $request) {
        $formattedData = [];
        
        $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
        $tempstore->delete('documents_pastell');
        $return1 = []; //our variable to fill with data returned by Pastell
        // Our collectivite ID for Pastell id_e is sent as param by our js module
        $id_e = $request->query->get('id_e');
        // check value exists and is numleric
        if (null !== $id_e && is_numeric($id_e)) {
            \Drupal::logger('api_pastell_documents')->info('function search Pastell Docs with id_e : ' . $id_e);
            $pastelldataApi = new ApiPleiadeManager();
            $return1 = $pastelldataApi->searchMyDocs($id_e);  
            $tempstore = \Drupal::service('tempstore.private')->get('api_pastell_pleiade');
            $tempstore->set('documents_pastell', $return1);
        }
        $formattedData = array_merge($formattedData, $return1);
        
        $return = []; // our variable to fill with data returned by Pastell
        $nextcloudataApi = new ApiPleiadeManager();
        $return_nc = $nextcloudataApi->getNextcloudNotifs();
        $tempstore = \Drupal::service('tempstore.private')->get('api_nextcloud_pleiade');
        $tempstore->set('documents_nextcloud', $return_nc);
    

        if($return_nc){

            $data = $return_nc->ocs->data; // Access the 'data' property of the object
            
            foreach ($data as $item) {
                if (!isset($item->subjectRichParameters->file)) {
                    continue; // Skip the iteration if 'file' is not present
                }
        
                $status = '';
                if (strpos($item->subject, 'modif') !== false) {
                    $status = 'Modifié';
                } elseif (strpos($item->subject, 'partag') !== false) {
                    $status = 'Partagé';
                }
        
                $fileUrl = isset($item->subjectRichParameters->file->link) ? $item->subjectRichParameters->file->link : null;
                $fileName = isset($item->subjectRichParameters->file->name) ? $item->subjectRichParameters->file->name : null;
        
                $formattedItem = [
                    'type' => 'Nextcloud',
                    'titre' => $fileName,
                    'creation' => date('d/m/Y H:i', strtotime($item->datetime)),
                    // 'subject' => $item->subject,
                    'status' => $status,
                    'fileUrl' => $fileUrl
                ];
                $formattedData[] = $formattedItem;
            }
        }

        $jsonData = json_encode($formattedData); // Convert the array to a JSON string
    
        return new JsonResponse($jsonData, 200, [], true);
    }

}