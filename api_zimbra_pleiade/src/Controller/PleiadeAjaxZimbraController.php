<?php

namespace Drupal\api_zimbra_pleiade\Controller;

use Drupal\Core\Controller\ControllerBase;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\module_api_pleiade\ApiPleiadeManager;

class PleiadeAjaxZimbraController extends ControllerBase {

public function zimbra_mails_query(Request $request) {

$settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode('; ', $groupData);
    }
    if (in_array($settings_zimbra->get('lemon_group'), $groupDataArray)) {
    $return = []; // Variable to store Zimbra data
    $zimbradataApi = new ApiPleiadeManager();
    $return = $zimbradataApi->searchMyMails();
    $returnEmailUser = $zimbradataApi->searchMySession();

    if ($return) {
        // Retrieve user's email
        $userEmail = $returnEmailUser['mail'];

        // Extract domain from user's email
        $userDomain = substr(strrchr($userEmail, "@"), 1);

        \Drupal::logger('zimbra_mails_query')->info('User Email: @email, User Domain: @domain', [
            '@email' => $userEmail,
            '@domain' => $userDomain
        ]);

        // Retrieve configuration value
        $domainPlusToken = $this->config('api_zimbra_pleiade.settings')->get('token_plus_domain');

        // Split configuration value into lines
        $lines = explode("\n", $domainPlusToken);

        // Initialize an array to store domains
        $domainArray = array();

        // Iterate through each line
        foreach ($lines as $line) {
            // Remove leading and trailing spaces
            $line = trim($line);
            if (!empty($line)) {
                // Split the line into domain and token using "| |" as separator
                list($domain, $token) = explode("| |", $line);

                // Add the domain to the array
                $domainArray[] = $domain;
            }
        }

	$userDomainKey = false;

	foreach ($domainArray as $key => $domainEntry) {
    		// Check if the user's domain matches the current domain or is part of the value
    		if ($userDomain === $domainEntry || strpos($domainEntry, $userDomain) !== false) {
        		$userDomainKey = $key;
        		break; // Exit the loop once a match is found
    		}
	}
        // If the user's domain is found, return the corresponding data from $return
        if ($userDomainKey !== false) {
            $userDomainData = $return[$userDomainKey];
	    //var_dump($domainEntry);
            //return new JsonResponse(json_encode($userDomainData), 200, [], true);
		return new JsonResponse(json_encode([
        'domainEntry' => $domainEntry, // Add domainEntry to the JSON response
        'userData' => $userDomainData
    	]), 200, [], true);        
	}
    } else {
        \Drupal::logger('zimbra_mails_query')->info('No API response');
    }
	return new JsonResponse(json_encode('null'), 200, [], true);
	}
}


public function zimbra_tasks_query(Request $request){
 
$settings_zimbra = \Drupal::config('api_zimbra_pleiade.settings');
    // // API endpoint URL
    $tempstore = \Drupal::service('tempstore.private')->get('api_lemon_pleiade');
    $groupData = $tempstore->get('groups');
    if ($groupData !== NULL) {
      $groupDataArray = explode('; ', $groupData);
    }
    if (in_array($settings_zimbra->get('lemon_group'), $groupDataArray)) {

       $return = []; //our variable to fill with data returned by Zimbra
        
        // Debug what's in request 
        $zimbradataApi = new ApiPleiadeManager();
        $returnEmailUser = $zimbradataApi->searchMySession();
        
        $return = $zimbradataApi->searchMyTasks();
        if($return){

            $userEmail = $returnEmailUser['mail'];
            $userDomain = substr(strrchr($userEmail, "@"), 1);

            \Drupal::logger('zimbra_tasks_query')->info('Return $return: @return', ['@return' => $return ]);
            \Drupal::logger('zimbra_mails_query')->info('User Email: @email, User Domain: @domain', [
                '@email' => $userEmail,
                '@domain' => $userDomain
            ]);
    
            // Retrieve configuration value
            $domainPlusToken = $this->config('api_zimbra_pleiade.settings')->get('token_plus_domain');
    
            // Split configuration value into lines
            $lines = explode("\n", $domainPlusToken);
    
            // Initialize an array to store domains
            $domainArray = array();
    
            // Iterate through each line
            foreach ($lines as $line) {
                // Remove leading and trailing spaces
                $line = trim($line);
                if (!empty($line)) {
                    // Split the line into domain and token using "| |" as separator
                    list($domain, $token) = explode("| |", $line);
    
                    // Add the domain to the array
                    $domainArray[] = $domain;
                }
            }
    
            $userDomainKey = false;
    
            foreach ($domainArray as $key => $domainEntry) {
                    // Check if the user's domain matches the current domain or is part of the value
                    if ($userDomain === $domainEntry || strpos($domainEntry, $userDomain) !== false) {
                        $userDomainKey = $key;
                        break; // Exit the loop once a match is found
                    }
            }
                // If the user's domain is found, return the corresponding data from $return
                if ($userDomainKey !== false) {
                    $userDomainData = $return[$userDomainKey];
                return new JsonResponse(json_encode([
                    'domainEntry' => $domainEntry, // Add domainEntry to the JSON response
                    'userData' => $userDomainData
                    ]), 200, [], true);        
                }
	}
        else
        {
            \Drupal::logger('zimbra_tasks_query')->info('aucun retour de l\'api');
        }
        return new JsonResponse(json_encode('null'), 200, [], true);
}    
}

}
