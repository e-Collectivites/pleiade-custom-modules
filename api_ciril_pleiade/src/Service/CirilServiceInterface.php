<?php

namespace Drupal\api_ciril_pleiade\Service;

/**
 * Interface for the Ciril Document Retrieval Service.
 */
interface CirilServiceInterface {

  /**
   * Retrieves a list of formatted Purchase Order documents for a specific user.
   *
   * @param string $email
   * The email address of the user (from CAS/LDAP).
   *
   * @return array
   * An array of documents with keys: id, titre, type, date, status, command.
   */
  public function getDocsByEmail(string $email,string $year,string $bud="01"): array;

  /**
   * Optional: Fetches raw content for a specific GED document ID.
   *
   * @param int $dc_num
   * The internal DC_NUM from CIVILDOS.D_DOCUMENT.
   */


}