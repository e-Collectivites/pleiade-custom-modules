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
        '#description' => $this->t('Enter the full Zimbra url, ex: https://zimbra.mydomain.com'),
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
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}