<?php

namespace Drupal\module_actu_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form definition for the Module actu Pleiade module.
 */
class ActuFormController extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'module_actu_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'module_actu_pleiade.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('module_actu_pleiade.settings');

    $form['url_site'] = [
      '#type' => 'url',
      '#title' => $this->t('Site pour récupérer les actualités'),
      '#default_value' => $config->get('url_site'),
      '#description' => $this->t('Site pour récupérer les actualités')
    ];
    $form['actu_interne'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Autoriser les actualités interne Pléiade'),
      '#default_value' => $config->get('actu_interne'),
      '#description' => $this->t('Autoriser les actualités interne Pléiade')
    ];
    $form['flux_rss'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Flux RSS ? par défaut = JSON'),
      '#default_value' => $config->get('flux_rss'),
      '#description' => $this->t('Flux RSS ? par défaut = JSON')
    ];
  
    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('module_actu_pleiade.settings');
    $config->set('flux_rss', $form_state->getValue('flux_rss'));
    $config->set('url_site', $form_state->getValue('url_site'));
    $config->set('actu_interne', $form_state->getValue('actu_interne'));
    $config->save();

    parent::submitForm($form, $form_state);
  }
}
