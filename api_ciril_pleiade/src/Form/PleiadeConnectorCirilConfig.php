<?php

namespace Drupal\api_ciril_pleiade\Form;

use Drupal\Core\Database\Database;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeConnectorCirilConfig extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_ciril_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_ciril_pleiade.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_ciril_pleiade.settings');

    $form['coll_count'] = [
      '#type' => 'number',
      '#title' => $this->t("Nombre de collectivités"),
      '#default_value' => $config->get('coll_count'),
      '#min' => 0,
    ];

    $count = $config->get('coll_count');
    if ($count === NULL || !is_numeric($count)) {
      $count = 8;
    }
    else {
      $count = intval($count);
    }

    for ($i = 0; $i < $count; $i++) {
      $form['row_' . $i] = [
        '#type' => 'container',
        '#tree' => TRUE,
        '#attributes' => ['class' => ['inline-row', 'row']],
      ];

      $form['row_' . $i]['nom'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Nom de collectivité (DB Key)'),
        '#description' => $this->t('This name will be used as the database key (e.g. "siciri")'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.nom'),
      ];

      $form['row_' . $i]['host'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Host'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.host'),
      ];

      $form['row_' . $i]['port'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Port'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.port'),
      ];

      $form['row_' . $i]['database'] = [
        '#type' => 'textfield',
        '#title' => $this->t('SID / Database'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.database'),
      ];

      $form['row_' . $i]['user'] = [
        '#type' => 'textfield',
        '#title' => $this->t('User'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.user'),
      ];

      $form['row_' . $i]['password'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Password'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.password'),
      ];
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('api_ciril_pleiade.settings');

    $count = intval($form_state->getValue('coll_count'));
    $config->set('coll_count', $count);

    $store = \Drupal::keyValue("collectivities_store");
    $array = $store->get('global', []);

    for ($i = 0; $i < $count; $i++) {
      $row_data = $form_state->getValue('row_' . $i) ?? [];
      
      $nom = $row_data['nom'] ?? '';
      // Skip if no name provided
      if (empty($nom)) {
        continue;
      }

      $host = $row_data['host'] ?? '';
      $port = $row_data['port'] ?? '';
      $sid  = $row_data['database'] ?? '';
      $user = $row_data['user'] ?? '';
      $pass = $row_data['password'] ?? '';

      // 1. Save to Config (Persistence)
      $config->set('row_' . $i . '.nom', $nom);
      $config->set('row_' . $i . '.host', $host);
      $config->set('row_' . $i . '.port', $port);
      $config->set('row_' . $i . '.database', $sid);
      $config->set('row_' . $i . '.user', $user);
      $config->set('row_' . $i . '.password', $pass);

      // 2. Save to KeyValue store (External usage)
      $array[$nom]['host_ciril'] = $host;
      $array[$nom]['port_ciril'] = $port;
      $array[$nom]['database_ciril'] = $sid;
      $array[$nom]['user_ciril'] = $user;
      $array[$nom]['password_ciril'] = $pass;

      // 3. Dynamic Registration
      // We use the exact $nom as the key.
      // NOTE: Ensure your names don't contain spaces if possible, or use underscores.
      $db_key = $nom."_ciril"; 

      // Construct Oracle TNS string
      $tns = "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={$host})(PORT={$port}))(CONNECT_DATA=(SID={$sid})))";

      $connection_info = [
        'driver'   => 'oracle',
        'username' => $user,
        'password' => $pass,
        'database' => $tns, 
        'host'     => $host,
        'port'     => $port,
      ];

      // Add to Drupal's active connections
      Database::addConnectionInfo($db_key, 'default', $connection_info);
    }

    $config->save();
    $store->set('global', $array);

    parent::submitForm($form, $form_state);
  }

}