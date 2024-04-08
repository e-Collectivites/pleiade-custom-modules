<?php

namespace Drupal\api_humhub_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;
use Drupal\Core\Database\Database;

class humHubController extends ControllerBase
{
        public function humhub_query(Request $request)
        {
                // $serveur = "192.168.1.18"; // Adresse du serveur MySQL
                // $utilisateur = "humhub_user"; // Nom d'utilisateur MySQL
                // $motdepasse = "HSDt8WdGLKa2M*4+@=Z"; // Mot de passe MySQL
                // $basededonnees = "humhub"; // Nom de la base de données MySQL
                // $user = \Drupal\user\Entity\User::load(\Drupal::currentUser()->id());

                // // Vérifie si l'objet utilisateur est valide
                // if ($user) {
                //     // Récupère l'adresse e-mail de l'utilisateur connecté
                //     $email = $user->getEmail();
                // }
                // else{
                //         $email = '';
                // }

                // try {
                //         // Paramètres de connexion à la base de données externe
                //         $connection_info = array(
                //             'driver' => 'mysql',
                //             'host' => '192.16.1.11',
                //             'database' => 'humhub',
                //             'username' => 'humhub_user',
                //             'password' => 'HSDt8WdGLKa2M*4+@=Z',
                //             'port' => '3306', // Optionnel, par défaut 3306
                //             'prefix' => '', // Optionnel, préfixe de table si nécessaire
                //             'collation' => 'utf8mb4_general_ci', // Optionnel, collation de la base de données
                //         );
                    
                //         // Créer une nouvelle connexion à la base de données externe
                //         $external_db = Database::openConnection($connection_info, 'default');
                    
                //         // Requête SQL pour récupérer des informations
                //         $query = $external_db->select('humhub', 't')
                //             ->fields('t', ['id']) // Remplacez 'id' par les colonnes que vous souhaitez récupérer
                //             ->condition('email', $email);
                    
                //         $result = $query->execute();
                    
                //         // Vérifier si la requête a renvoyé des résultats
                //         if ($result->rowCount() > 0) {
                //             foreach ($result as $record) {
                //                 echo "ID: " . $record->id . "<br>";
                //             }
                //         } else {
                //             echo "Aucun résultat trouvé.";
                //         }
                //     } catch (\Exception $e) {
                //         // Gérer les erreurs de connexion
                //         echo "Erreur lors de la connexion à la base de données externe : " . $e->getMessage();
                //     }
                
                
                // return new JsonResponse(json_encode($resultat), 200, [], true);
                
        }     

}
