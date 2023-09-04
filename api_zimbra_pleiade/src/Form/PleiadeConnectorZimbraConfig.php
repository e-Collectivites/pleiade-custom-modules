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
    
    $form['field_zimbra_mail'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Zimbra endpoint Mails'),
      '#default_value' => $config->get('field_zimbra_mail'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra SOAP request for mails, start with "SearchRequest and end with /SearchRequest"')
    ];
    $form['field_zimbra_agenda'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Zimbra endpoint Agenda'),
      '#default_value' => $config->get('field_zimbra_agenda'),
      // '#value' => $config->get('field_zimbra_url'),
      '#description' => $this->t('Enter the Zimbra SOAP request for agenda, start with "SearchRequest and end with /SearchRequest"'),
    ];
$form['token_plus_domain'] = [
      '#type' => 'textarea',
      '#title' => t('Domain + Token Authenticator Zimbra .'),
      '#default_value' => $config->get('token_plus_domain'),
      '#description' => $this->t('Separate domain and token with "| |". ex : domain.fr| |vrbhuoizfbguisbvgds')
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
$form['lemon_group'] = [
      '#type' => 'textfield',
      '#title' => t('LemonLDAP name group for zimbra module'),
      '#default_value' => $config->get('lemon_group'),
      '#description' => $this->t('Lemon group name in lemonLDAP module ')
    ]; 


    return parent::buildForm($form, $form_state);
  }
  


  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_zimbra_pleiade.settings');
 $config->set('token_plus_domain', $form_state->getValue('token_plus_domain'));
    $config->set('field_zimbra_auth_method', $form_state->getValue('field_zimbra_auth_method'));
    $config->set('field_zimbra_mail', $form_state->getValue('field_zimbra_mail'));
    $config->set('field_zimbra_agenda', $form_state->getValue('field_zimbra_agenda'));
    $config->set('field_zimbra_for_demo', $form_state->getValue('field_zimbra_for_demo'));
    $config->set('lemon_group', $form_state->getValue('lemon_group'));    
$config->save();
    
    parent::submitForm($form, $form_state);
  }

}
