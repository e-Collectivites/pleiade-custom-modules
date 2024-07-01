<?php

namespace Drupal\api_pastell_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PleiadePastellChangStatusDoc extends ConfigFormBase
{

        /**
         * {@inheritdoc}
         */
        public function getFormId()
        {
                return 'api_pastell_pleiade_change_status_doc_settings_form';
        }

        /**
         * {@inheritdoc}
         */
        protected function getEditableConfigNames()
        {
                return ['api_pastell_pleiade.settings'];
        }

        // Add form elements and submit handlers as needed.
        public function buildForm(array $form, FormStateInterface $form_state)
        {

                $form['actions']['autre_action']['id_e'] = array(
                        '#type' => 'textarea',
                        '#title' => t('Id_e à traiter (mettre que les entités mère) (NE PAS METTRE D\'ESPACES ENTRE LES ID_E)'),
                        '#default_value' => '',
                );
                $form['actions']['change_status']['change_status_button'] = array(
                        '#type' => 'submit',
                        '#name' => 'change_status_action',
                        '#value' => t('Récupérer le nombre de documents en statut "Traitement terminé" ou "signature récupéré"'),
                );
                // Add new button
                $form['actions']['another_action']['another_action_button'] = [
                        '#type' => 'submit',
                        '#name' => 'another_action',
                        '#value' => t('Export Mail utilisateurs qui ont déjà la GED'),
                ];

                return $form;
        }

        public function submitForm(array &$form, FormStateInterface $form_state)
        {
                // Check which button was clicked
                $triggeringElement = $form_state->getTriggeringElement();
                $clickedButton = $triggeringElement['#name'];
                // Appeler la fonction get_all_coll pour récupérer les données
                if ($clickedButton == 'change_status_action') {
                        $data = get_all_coll();
                        // Ouvrir un fichier temporaire pour écrire les données CSV
                        $file = tmpfile();

                        $id_e = $form_state->getValue('id_e');

                        $id_es = explode(",", $id_e);;
                        // Écrire l'en-tête CSV
                        fputcsv($file, ['dénomination', 'id_e', 'id_e_mere', 'Departement', 'doc', 'Actes']);


                        // Parcourir les données et écrire chaque ligne dans le fichier CSV
                        foreach ($data as $item) {


                                foreach ($id_es as $id_e) {
                                        if ($item->id_e == $id_e) {
                                                if ($item->type == "centre_de_gestion") {
                                                        continue;
                                                }
                                                $dpt = 0;
                                                switch ($item->centre_de_gestion) {
                                                        case '1875':
                                                                $dpt = "17";
                                                                break;
                                                        case '1':
                                                                $dpt = "85";
                                                                break;
                                                        case '384':
                                                                $dpt = "85";
                                                                break;
                                                        case '619':
                                                                $dpt = "85";
                                                                break;
                                                        case '732':
                                                                $dpt = "85";
                                                                break;
                                                        case '1332':
                                                                $dpt = "53";
                                                                break;
                                                        case '1346':
                                                                $dpt = "44";
                                                                break;
                                                        case '1355':
                                                                $dpt = "49";
                                                                break;
                                                        case '1414':
                                                                $dpt = "72";
                                                                break;
                                                        case '1447':
                                                                $dpt = "53";
                                                                break;
                                                        case '1355':
                                                                $dpt = "49";
                                                                break;
                                                        default:
                                                                $dpt = "Aucun departement";
                                                                break;
                                                };
                                                $documents = get_all_docs($item->id_e);
                                                $count = 0;
                                                $count1 = 0;
                                                foreach ($documents as $document) {
                                                        if ($document->type == "actes-ecollectivites" && $document->last_action_display == "termine") {
                                                                $count++;
                                                        }
                                                        if ($document->type == "document-a-signer" && ($document->last_action_display == "recu-iparapheur-etat" || $document->last_action_display == "recu-iparapheur")) {
                                                                $count1++;
                                                        }
                                                }
                                                fputcsv($file, [$item->denomination, $item->id_e, $item->entite_mere, $dpt, $count1, $count]);
                                        }
                                }
                                foreach ($id_es as $id_e) {
                                        if ($item->entite_mere == $id_e) {
                                                if ($item->type == "centre_de_gestion") {
                                                        continue;
                                                }
                                                $dpt = 0;
                                                switch ($item->centre_de_gestion) {
                                                        case '1875':
                                                                $dpt = "17";
                                                                break;
                                                        case '1':
                                                                $dpt = "85";
                                                                break;
                                                        case '384':
                                                                $dpt = "85";
                                                                break;
                                                        case '619':
                                                                $dpt = "85";
                                                                break;
                                                        case '732':
                                                                $dpt = "85";
                                                                break;
                                                        case '1332':
                                                                $dpt = "53";
                                                                break;
                                                        case '1346':
                                                                $dpt = "44";
                                                                break;
                                                        case '1355':
                                                                $dpt = "49";
                                                                break;
                                                        case '1414':
                                                                $dpt = "72";
                                                                break;
                                                        case '1447':
                                                                $dpt = "53";
                                                                break;
                                                        case '1355':
                                                                $dpt = "49";
                                                                break;
                                                        default:
                                                                $dpt = "Aucun departement";
                                                                break;
                                                };
                                                $documents = get_all_docs($item->id_e);
                                                $count = 0;
                                                $count1 = 0;
                                                foreach ($documents as $document) {
                                                        if ($document->type == "actes-ecollectivites" && $document->last_action_display == "termine") {
                                                                $count++;
                                                        }
                                                        if ($document->type == "document-a-signer" && ($document->last_action_display == "recu-iparapheur-etat" || $document->last_action_display == "recu-iparapheur")) {
                                                                $count1++;
                                                        }
                                                }
                                                fputcsv($file, [$item->denomination, $item->id_e, $item->entite_mere, $dpt, $count, $count1]);
                                        }
                                }
                        }

                        // Positionner le pointeur au début du fichier pour pouvoir le lire
                        rewind($file);

                        // Récupérer le contenu du fichier temporaire
                        $csvContent = stream_get_contents($file);

                        // Fermer le fichier temporaire
                        fclose($file);

                        // Télécharger le fichier CSV
                        $form_state->setResponse(new StreamedResponse(function () use ($csvContent) {
                                // Entête HTTP pour indiquer qu'il s'agit d'un fichier CSV à télécharger
                                header('Content-Type: text/csv');
                                header('Content-Disposition: attachment; filename="count_acte_doc.csv"');
                                // Écrire le contenu du fichier CSV
                                echo $csvContent;
                        }));

                        // Écrire les données CSV dans un fichier temporaire
                        $tempFile = tempnam(sys_get_temp_dir(), 'statistiques_documents');
                        file_put_contents($tempFile, $csvContent);

                        $response = new BinaryFileResponse($tempFile);
                        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, 'statistiques_documents.csv');

                        return $response;
                } elseif ($clickedButton == 'another_action') {
                        $data = get_all_coll();

                        // Création d'un fichier temporaire

                        $file = tmpfile();
                        fputcsv($file, ['mail', 'domaine', 'id_e']);

                        $id_e = $form_state->getValue('id_e');
                        $id_es = explode(",", $id_e);

                        // Récupération de tous les utilisateurs
                        $users = get_all_users();

                        foreach ($users as $user) {

                                $roles = get_roles_user($user->id_u);

                                foreach ($roles as $role) {
                                        foreach ($data as $item) {
                                                if (in_array($role->id_e, $id_es)) {
                                                        if ($item->id_e == $role->id_e || $item->entite_mere == $role->id_e) {
                                                                $entite = explode('@', $user->login);
                                                                fputcsv($file, [$user->email, $entite[1], $role->id_e]);
                                                        }
                                                }
                                                if(in_array($item->entite_mere, $id_es)) {
                                                        if ($item->id_e == $role->id_e || $item->entite_mere == $role->id_e) {
                                                                $entite = explode('@', $user->login);
                                                                fputcsv($file, [$user->email, $entite[1], $item->entite_mere]);
                                                        }
                                                }
                                        }
                                }
                        }

                        // Positionner le pointeur au début du fichier pour pouvoir le lire
                        rewind($file);
                        // Récupérer le contenu du fichier temporaire
                        $csvContent = stream_get_contents($file);
                        // Fermer le fichier temporaire
                        fclose($file);
                        // Télécharger le fichier CSV
                        $form_state->setResponse(new StreamedResponse(function () use ($csvContent) {
                                // Entête HTTP pour indiquer qu'il s'agit d'un fichier CSV à télécharger
                                header('Content-Type: text/csv');
                                header('Content-Disposition: attachment; filename="count_acte_doc.csv"');
                                // Écrire le contenu du fichier CSV
                                echo $csvContent;
                        }));
                }
        }
}
