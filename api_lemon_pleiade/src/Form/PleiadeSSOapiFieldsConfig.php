<?php

namespace Drupal\api_lemon_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade LemonLDAP fields settings.
 */
class PleiadeSSOapiFieldsConfig extends ConfigFormBase {

  /** 
   * Config settings.
   *
   * @var string
   */
  const SETTINGS = 'api_lemon_pleiade.settings';

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_lemon_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      static::SETTINGS,
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(static::SETTINGS);
    
    $form['field_lemon_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('LemonLDAP url'),
      '#default_value' => 'https://auth.mydomain.com',
      '#value' => $config->get('field_lemon_url'),
      '#description' => $this->t('Enter the full auth LemonLDAP endpoint url, ex: https://auth.mydomain.com'),
    ];  

    $form['field_lemon_myapps_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('LemonLDAP : myapplications endpoint'),
      '#default_value' => 'myapplications',
      '#value' => $config->get('field_lemon_myapps_url'),
      '#description' => $this->t('Enter the applications LemonLDAP endpoint url, ex: myapplications'),
    ];

    $form['field_lemon_sessioninfo_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('LemonLDAP : global session info url'),
        '#default_value' => 'session/my/global',
        '#value' => $config->get('field_lemon_sessioninfo_url'),
        '#description' => $this->t('Enter the session info LemonLDAP endpoint url, ex: session/my/global'),
    ];  

    $form['field_lemon_totp_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('LemonLDAP : TOTP info url'),
        '#default_value' => 'totp',
        '#value' => $config->get('field_lemon_totp_url'),
        '#description' => $this->t('Enter the TOTP info LemonLDAP endpoint url, ex: totp'),
    ];


    return parent::buildForm($form, $form_state);
  }
  

  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $this->configFactory->getEditable(static::SETTINGS)
      // Set the submitted configuration setting.
      ->set('field_lemon_url', $form_state->getValue('field_lemon_url'))
      ->set('field_lemon_myapps_url', $form_state->getValue('field_lemon_myapps_url'))
      ->set('field_lemon_sessioninfo_url', $form_state->getValue('field_lemon_sessioninfo_url'))
      ->set('field_lemon_totp_url', $form_state->getValue('field_lemon_totp_url'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}