<?php

namespace Drupal\api_maarch_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeConnectorMaarchConfig extends ConfigFormBase
{

  /** 
   * {@inheritdoc}
   */
  public function getFormId()
  {
    return 'api_maarch_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames()
  {
    return [
      'api_maarch_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state)
  {
    $config = $this->config('api_maarch_pleiade.settings');

    $form['route'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Route Rest API'),
      '#default_value' => $config->get('route'),
    ];


    $form['coll_count'] = [
      '#type' => 'textfield',
      '#title' => $this->t("Nombre de collectivités"),
      '#default_value' => $config->get('coll_count'),
    ];
    $count = $config->get('coll_count');
    if ($count === NULL || !is_numeric($count)) {
      $count = 8;
    } else {
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
        '#title' => $this->t('Nom de collectivité'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.nom'),

      ];
      $form['row_' . $i]['url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Url'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.url'),

      ];
      $form['row_' . $i]['token'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Token'),
        '#wrapper_attributes' => ['class' => ['inline-field']],
        '#default_value' => $config->get('row_' . $i . '.token'),
        '#maxlength' => 1024,
      ];
       $form['row_' . $i]['baskets'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bannettes autorisées (séparées par des virgules)'),
       '#wrapper_attributes' => ['class' => ['inline-field']],
      '#default_value' => $config->get('row_' . $i . '.baskets'),
    ];
    }
    return parent::buildForm($form, $form_state);
  }



  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state)
  {
    // Retrieve the configuration.
    $config = $this->config('api_maarch_pleiade.settings');
    $config->set('url', $form_state->getValue('url'));
    $config->set('route', $form_state->getValue('route'));
    $config->set('key', $form_state->getValue('key'));
    $config->set('coll_count', $form_state->getValue('coll_count'));

    $count = intval($form_state->getValue('coll_count'));
    $array = \Drupal::keyValue("collectivities_store")->get('global', []);

    for ($i = 0; $i < $count; $i++) {


      $row1 = $form_state->getValue('row_' . $i) ?? [];
      if (empty($row1['nom'])) continue; // Skip if no name
      $array[$row1['nom']]['token_maarch'] = $row1['token'];
      $array[$row1['nom']]['url_maarch'] = $row1['url'];
      $array[$row1['nom']]['baskets_maarch'] = $row1['baskets'];
      $config->set('row_' . $i . '.nom', $row1['nom'] ?? '');
      $config->set('row_' . $i . '.url', $row1['url'] ?? '');
      $config->set('row_' . $i . '.token', $row1['token'] ?? '');
       $config->set('row_' . $i . '.baskets', $row1['baskets'] ?? '');
    }
    $config->save();
    \Drupal::keyValue("collectivities_store")->set('global', $array);

    parent::submitForm($form, $form_state);
  }
}
