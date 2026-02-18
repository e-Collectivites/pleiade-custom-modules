<?php

namespace Drupal\api_ciril_pleiade\Service;

use Drupal\Core\Database\Database;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use PDO;
use PDOException;

class CirilService implements CirilServiceInterface
{

  protected ?PDO $pdo = NULL;
  protected LoggerChannelInterface $logger;
  protected array $connectionInfo;

  public function __construct(LoggerChannelFactoryInterface $logger_factory)
  {
    $this->logger = $logger_factory->get('api_ciril_pleiade');
    $info = Database::getConnectionInfo('oracle_siciri');
    $this->connectionInfo = $info['default2'] ?? [];
  }

  public function getDocsByEmail(string $email, string $year, string $bud = ""): array
  {
    $userId = $this->_getUserIdFromEmail($email);

    if (!$userId) {
      $this->logger->warning("No Ciril ID found for email: @email", ['@email' => $email]);
      return [
        'documents' => [],
        'exercises' => [],
        'budgets'   => [],
      ];
    }

    $exercises = $this->getAvailableExercises($userId);
    $budgets = $this->getAvailableBudgets($userId); 

    // Updated: Pass $budgets to BDC method to resolve labels
    $bonDeCommandes = $this->getBonDeCommandesByUser($userId, $year, $bud, $budgets);
    $factures = $this->getFacturesByUser($userId, $year, $bud, $budgets);

    return [
      'documents' => array_merge($bonDeCommandes, $factures),
      'exercises' => $exercises,
      'budgets'   => $budgets,
    ];
  }

  private function getAvailableExercises(string $userId): array
  {
    $sql = "
      SELECT ex_numexe, ex_libexe, CIVILGF.F_ACCES_EXERCICE(:userId, ex_numexe) AS indmaj 
      FROM CIVILGF.c_exe 
      WHERE CIVILGF.F_ACCES_EXERCICE(:userId, ex_numexe) < 2 
      ORDER BY ex_numexe DESC";

    $rows = $this->executeQuery($sql, ['userId' => $userId]);

    return array_map(function ($row) {
      return [
        'id'          => $row['EX_NUMEXE'],
        'label'       => $row['EX_LIBEXE'],
        'accessLevel' => (int) $row['INDMAJ'],
      ];
    }, $rows ?: []);
  }

  private function getAvailableBudgets(string $userId): array
  {
    $sql = "
      SELECT bu_codCol, bu_codBud, ol_libCol, ol_couleur, bu_libBud, CIVILGF.f_acces_budget(:userId, bu_codBud) AS acces 
      FROM CIVILGF.c_bud, CIVILGF.g_col 
      WHERE bu_codCol = ol_codCol 
        AND CIVILGF.f_acces_budget(:userId, bu_codBud) < 3 
      ORDER BY bu_codCol, bu_codBud";

    $rows = $this->executeQuery($sql, ['userId' => $userId]);

    return array_map(function ($row) {
      return [
        'collectivityCode'  => $row['BU_CODCOL'],
        'collectivityLabel' => $row['OL_LIBCOL'],
        'collectivityColor' => $row['OL_COULEUR'],
        'budgetCode'        => $row['BU_CODBUD'],
        'budgetLabel'       => $row['BU_LIBBUD'],
        'accessLevel'       => (int) $row['ACCES'],
      ];
    }, $rows ?: []);
  }

  // Updated signature to accept $availableBudgets
  private function getBonDeCommandesByUser(string $userId, string $year, string $bud, array $availableBudgets): array
  {
    // Create lookup map
    $budgetMap = [];
    foreach ($availableBudgets as $b) {
        $budgetMap[$b['budgetCode']] = $b['budgetLabel'];
    }

    // Added A.AECCodBud to SELECT
    $sql = "
      SELECT 
        rowidtochar(A.rowid) AS rid, 
        A.AECNUMCOM,
        A.AECCodBud, 
        A.AECLIBENG,
        A.AECDATE,
        A.AECNUMDOS,
        A.AECVISA,
        A.AECETAT,
        round(CIVILGF.f_GetMontantHtCommande(A.aecnumcom), 2) AS monht, 
        round(CIVILGF.f_getMontantTvaCommande(A.aecnumcom), 2) AS montva, 
        round(CIVILGF.f_GetMontantHtCommande(A.aecnumcom) + CIVILGF.f_getMontantTvaCommande(A.aecnumcom), 2) AS monttc, 
        (SELECT T.ti_nom || ' ' || T.ti_prenom || ' ' || T.ti_compnom FROM CIVILGF.c_tiers T WHERE T.ti_numtie = A.aecnumtie) AS raisoc, 
        CASE 
            WHEN A.AECVISA = 'R' THEN 'Refusée'
            WHEN A.AECETAT = 'C' AND A.AECVISA = 'N' THEN 'En cours'
            WHEN A.AECETAT = 'A' AND A.AECVISA = 'O' THEN 'À éditer'
            WHEN (A.AECETAT IN ('A', 'E') AND (A.AECVISA IS NULL OR A.AECVISA = 'N')) 
                 AND A.AECNUMDOS IN (
                    SELECT tu_numdos FROM CIVILDOS.v_tache_uti 
                    WHERE tu_coduti = :utilisateur AND tu_typcon = 'ASSIGN_MANU'
                 ) THEN 'À signer'
            WHEN A.AECETAT = 'A' AND A.AECVISA = 'N' THEN 'En attente de visa'
            ELSE 'Autre'
        END AS statut_cible,
        TO_CHAR(A.AECDATE, 'DD/MM/YYYY') AS datcomfor,
        CIVILGF.f_getBdcAViser('00141', A.aecnumcom) AS bdcaviser
      FROM CIVILGF.a_entcom A
      WHERE A.AECNumExe = :exercice 
        AND (:bud IS NULL OR A.AECCodBud = :bud) 
        AND A.AECbonpluri = 'N'
        AND CIVILGF.f_acces_bdc(:utilisateur, A.AECnumcom) < 3
        AND (
            (A.AECETAT = 'C' AND A.AECVISA = 'N') OR
            (A.AECVISA = 'R') OR
            (A.AECETAT = 'A' AND A.AECVISA = 'O') OR
            (A.AECETAT = 'A' AND A.AECVISA = 'N') OR
            (A.AECETAT IN ('A', 'E') AND (A.AECVISA IS NULL OR A.AECVISA = 'N') AND A.AECNUMDOS IS NOT NULL)
        )
      ORDER BY A.AECDATE DESC, A.AECnumcom";

    $params = [
      'utilisateur' => $userId,
      'exercice'    => $year,
      "bud"         => $bud 
    ];

    $rows = $this->executeQuery($sql, $params);

    if (empty($rows)) {
      return [];
    }

    return array_map(function ($row) use ($budgetMap, $year) {
      $montantVal = isset($row['MONTTC']) ? (float)$row['MONTTC'] : 0.0;
      $montantFormatted = number_format($montantVal, 2, ',', ' ') . ' €';
      
      $titre = "N°" . $row['AECNUMCOM'] . " - " . ($row['RAISOC'] ?: 'Inconnu') . " - " . ($row['AECLIBENG'] ?: 'Sans objet') . " (" . $montantFormatted . ")";
      
      $budgetLabel = $budgetMap[$row['AECCODBUD']] ?? $row['AECCODBUD'];

      return [
        'id'          => $row['AECNUMCOM'],
        'titre'       => $titre,
        'type'        => "Bon de Commande",
        'date'        => $row['DATCOMFOR'],
        'status'      => $row['STATUT_CIBLE'],
        'montant_ttc' => $row['MONTTC'],
        'tiers'       => $row['RAISOC'],
        'num_dossier' => $row['AECNUMDOS'],
        'a_viser'     => $row['BDCAVISER'],
        // Added budget and exercice
        'budget'      => $budgetLabel,
        'exercice'    => $year
      ];
    }, $rows);
  }

  private function getFacturesByUser(string $userId, string $year, string $bud, array $availableBudgets): array
  {
    $budgetMap = [];
    foreach ($availableBudgets as $b) {
        $budgetMap[$b['budgetCode']] = $b['budgetLabel'];
    }

    $unionQuery = "
        WITH BaseData AS (
            SELECT 
                f.FA_numfac,
                f.FA_codBud,
                f.FA_numfac || f.FA_codcol AS fa_numfacCol,
                f.FA_numtieref,
                t.TI_nom,
                (f.FA_monhtfac + f.FA_montvafac) AS monttc,
                TO_CHAR(f.FA_datfac, 'DD/MM/YYYY') AS datFacFor,
                CIVILGF.f_getetatfac(f.FA_etatfac, f.FA_numfac, f.FA_codcol, f.FA_modwkf) AS calc_etat,
                CIVILGF.f_gettachewkf(:utilisateur, f.FA_numdos) AS user_tache,
                f.FA_etatliq, f.FA_datlimman, f.FA_datlimpai, f.FA_datpai, f.FA_datdebint, f.FA_datfinint, f.FA_numdos,
                f.FA_indedi 
            FROM 
                CIVILGF.C_fac f
                INNER JOIN CIVILGF.C_tiers t ON f.FA_numtie = t.TI_numtie
                LEFT JOIN CIVILGF.S_parametre ef ON ef.PM_ptnom = f.FA_etatfac AND ef.PM_ppnomtab = 'C_te_eta_fac' AND ef.PM_codmod = 'M14'
                LEFT JOIN CIVILGF.S_parametre el ON el.PM_ptnom = f.FA_etatliq AND el.PM_ppnomtab = 'C_te_eta_liq' AND el.PM_codmod = 'M14'
            WHERE 
                f.FA_numexe = :exercice
                AND f.FA_inddeprec = 'D'
                AND f.FA_modwkf = 'O'
                AND (:bud IS NULL OR f.FA_codBud = :bud)
                AND CIVILGF.f_acces_facture(:utilisateur, f.FA_numfac, f.FA_codcol) < 3
        )
        SELECT * FROM (
            SELECT d.FA_numfac, d.FA_codBud, d.fa_numfacCol, d.FA_numtieref, d.TI_nom, d.monttc, d.datFacFor, s.statut_type
            FROM BaseData d
            CROSS JOIN (
                SELECT 'Dépassement délai mandatement' AS statut_type FROM DUAL UNION ALL
                SELECT 'À signer/valider' FROM DUAL UNION ALL
                SELECT 'Proche délai mandatement' FROM DUAL UNION ALL
                SELECT 'Proche délai paiement' FROM DUAL UNION ALL
                SELECT 'Dépassement délai paiement' FROM DUAL
            ) s
            WHERE 
                (s.statut_type = 'À signer/valider' 
                    AND d.user_tache = 1 
                    AND d.calc_etat IN ('NA', 'AS', 'TS', 'TSC', 'TSD', 'TSF', 'RS', 'CV', 'ER', 'RE', 'RF', 'SU') 
                    AND d.FA_etatliq IN ('AR', 'RP', 'LP', 'LT') 
                    AND d.FA_numdos IS NOT NULL)
                OR
                (d.FA_indedi = 'O' AND d.monttc > -0.001 AND (
                    (s.statut_type = 'Dépassement délai mandatement' 
                        AND d.calc_etat IN ('NA', 'AS', 'TS', 'RS', 'CV', 'VI', 'RE') 
                        AND d.FA_etatliq IN ('AR', 'RP', 'LP', 'LT') 
                        AND SYSDATE > d.FA_datlimman AND d.FA_datpai IS NULL)
                    OR
                    (s.statut_type = 'Proche délai mandatement' 
                        AND d.calc_etat IN ('NA', 'AS', 'TS', 'RS', 'CV', 'VI', 'RE') 
                        AND d.FA_etatliq IN ('AR', 'RP', 'LP', 'LT') 
                        AND (d.FA_datdebint IS NULL OR (d.FA_datdebint IS NOT NULL AND d.FA_datfinint IS NOT NULL)) 
                        AND d.FA_datpai IS NULL 
                        AND ((d.FA_etatliq = 'LT' AND d.FA_datlimman - 3 <= SYSDATE AND SYSDATE <= d.FA_datlimman) 
                             OR (d.FA_etatliq <> 'LT' AND d.FA_datlimman - 5 <= SYSDATE AND SYSDATE <= d.FA_datlimman)))
                    OR
                    (s.statut_type = 'Proche délai paiement' 
                        AND d.calc_etat IN ('NA', 'AS', 'TS', 'RS', 'CV', 'VI', 'RE') 
                        AND d.FA_etatliq IN ('AR', 'RP', 'LP', 'LT') 
                        AND (d.FA_datdebint IS NULL OR (d.FA_datdebint IS NOT NULL AND d.FA_datfinint IS NOT NULL)) 
                        AND d.FA_datlimpai - 3 <= SYSDATE AND SYSDATE <= d.FA_datlimpai AND d.FA_datpai IS NULL)
                    OR
                    (s.statut_type = 'Dépassement délai paiement' 
                        AND d.calc_etat IN ('NA', 'AS', 'TS', 'RS', 'CV', 'VI', 'RE') 
                        AND d.FA_etatliq IN ('AR', 'RP', 'LP', 'LT') 
                        AND SYSDATE > d.FA_datlimpai AND d.FA_datpai IS NULL)
                ))
        )
    ";

    $params = ['utilisateur' => $userId, 'exercice' => $year, "bud" => $bud];
    $allFactures = $this->executeQuery($unionQuery, $params);

    if (empty($allFactures)) {
        return [];
    }

    $uniqueFactures = [];

    foreach ($allFactures as $row) {
        $id = $row['FA_NUMFACCOL'];
        if (!isset($uniqueFactures[$id])) {
            $uniqueFactures[$id] = $row;
            $uniqueFactures[$id]['aggregated_status'] = [$row['STATUT_TYPE']];
        } else {
            if (!in_array($row['STATUT_TYPE'], $uniqueFactures[$id]['aggregated_status'])) {
                $uniqueFactures[$id]['aggregated_status'][] = $row['STATUT_TYPE'];
            }
        }
    }

    return array_map(function ($row) use ($budgetMap, $year) {
        $budgetLabel = $budgetMap[$row['FA_CODBUD']] ?? $row['FA_CODBUD'];
        $refPart = !empty($row['TI_NOM']) ? $row['TI_NOM'] : $row['FA_NUMTIEREF'];
        
        $montantVal = isset($row['MONTTC']) ? (float)$row['MONTTC'] : 0.0;
        $montantFormatted = number_format($montantVal, 2, ',', ' ') . ' €';
        
        $titre = $refPart . " - N°" . $row['FA_NUMFAC'] . " (" . $montantFormatted . ")";

        return [
            'id'          => $row['FA_NUMFACCOL'],
            'titre'       => $titre,
            'type'        => "Facture",
            'date'        => $row['DATFACFOR'],
            'status'      => implode(' / ', $row['aggregated_status']),
            'montant_ttc' => $row['MONTTC'],
            // Added budget and exercice
            'budget'      => $budgetLabel,
            'exercice'    => $year
        ];
    }, array_values($uniqueFactures));
  }

  private function _getUserIdFromEmail(string $userEmail): ?string
  {
    $sql = "SELECT UT_CODUTI FROM CIRIL.s_uti WHERE UT_ADRMEL = :email";
    return $this->executeQuery($sql, ['email' => $userEmail], ['fetch' => 'fetchColumn']);
  }

  private function executeQuery(string $sql, array $params = [], array $options = [])
  {
    $pdo = $this->getPdoConnection();
    if (!$pdo) return $options['default'] ?? NULL;

    try {
      $stmt = $pdo->prepare($sql);
      foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
      }
      $stmt->execute();
      if (($options['fetch'] ?? '') === 'fetchColumn') {
        return $stmt->fetchColumn();
      }
      return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
      $this->logger->error("SQL Execution Error: @err", ['@err' => $e->getMessage()]);
      return $options['default'] ?? NULL;
    }
  }

  private function getPdoConnection(): ?PDO
  {
    if ($this->pdo) return $this->pdo;
    if (empty($this->connectionInfo)) return NULL;
    try {
      $this->pdo = new PDO(
        'oci:dbname=' . $this->connectionInfo['database'] . ';charset=AL32UTF8',
        $this->connectionInfo['username'],
        $this->connectionInfo['password']
      );
      $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      return $this->pdo;
    } catch (PDOException $e) {
      $this->logger->error('PDO Connection Failure: ' . $e->getMessage());
      return NULL;
    }
  }

  public function closeConnection(): void
  {
    $this->pdo = NULL;
  }

  public function __destruct()
  {
    $this->closeConnection();
  }
}