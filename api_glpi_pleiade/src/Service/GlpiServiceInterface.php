<?php

namespace Drupal\api_glpi_pleiade\Service;


interface GlpiServiceInterface
{
    function findIdByPrefix(array $items, string $prefix): ?int;

    public function getGLPITickets();

    public function getCurrentGlpiGroups($sessionToken, $currentUserId);

    public function getCombinedUserAndGroupTickets(string $sessionToken, int $currentUserId, $myGroups);



    public function isAssociated($ticketFieldValue, $idsToMatch): bool;

    public function processCombinedTickets(array $ticketsData, int $currentUserId, $myGroups);

    public function buildSessionUrl($sessionToken);

    public function buildChangeActiveProfileUrl($sessionToken);

    public function sendGlpiGetRequestPayload($url, $profile);

    public function initGlpiSession();

    public function sendGlpiGetRequest($url);

    public function getOrCreateGlpiUserToken();

    public function killGlpiSession($sessionToken);
}
