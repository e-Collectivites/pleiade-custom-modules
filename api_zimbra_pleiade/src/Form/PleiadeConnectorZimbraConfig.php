<?php

namespace Drupal\api_zimbra_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeConnectorZimbraConfig extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_zimbra_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_zimbra_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_zimbra_pleiade.settings');
    
    $form['field_zimbra_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Zimbra url'),
        '#default_value' => $config->get('field_zimbra_url'),
        // '#value' => $config->get('field_zimbra_url'),
        '#description' => $this->t('Enter the full Zimbra url, ex: https://zimbra.mydomain.com, with a "/" at the end.'),
      ];
    $form['field_zimbra_mail'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Zimbra endpoint Mails'),
      '#default_value' => $config->get('field_zimbra_mail'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra endpoint for mails'),
    ];
    $form['field_zimbra_agenda'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Zimbra endpoint Agenda'),
      '#default_value' => $config->get('field_zimbra_agenda'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra endpoint for agenda'),
    ];   
    $form['field_zimbra_auth_method'] = [
      '#type' => 'select',
      '#title' => t('Méthode d\'authentification.'),
      '#options' => array(
          'cas' => t('CAS'),
          'oidc' => t('OpenID Connect'),
          'saml' => t('SAML'),
          'http' => t('Http Header'),
      ),
      '#default_value' => $config->get('field_zimbra_auth_method'),
      '#description' => $this->t('Authentification method for ZIMBRA API')
    ];
    $form['field_zimbra_for_demo'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Zimbra demo mode'),
      '#default_value' => $config->get('field_zimbra_for_demo'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Checkbox to enable demo mode'),
    ];   
    return parent::buildForm($form, $form_state);
  }
  


  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_zimbra_pleiade.settings');
    $config->set('field_zimbra_auth_method', $form_state->getValue('field_zimbra_auth_method'));
    $config->set('field_zimbra_url', $form_state->getValue('field_zimbra_url'));
    $config->set('field_zimbra_mail', $form_state->getValue('field_zimbra_mail'));
    $config->set('field_zimbra_agenda', $form_state->getValue('field_zimbra_agenda'));
    $config->set('field_zimbra_for_demo', $form_state->getValue('field_zimbra_for_demo'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}