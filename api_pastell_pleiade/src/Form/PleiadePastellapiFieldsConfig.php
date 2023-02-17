<?php

namespace Drupal\api_pastell_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadePastellapiFieldsConfig extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_pastell_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_pastell_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_pastell_pleiade.settings');
    
    $form['field_pastell_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Pastell url'),
        '#default_value' => $config->get('field_pastell_url'),
        // '#value' => $config->get('field_pastell_url'),
        '#description' => $this->t('Enter the full Pastell url, ex: https://pastell.mydomain.com'),
      ]; 
    $form['field_pastell_documents_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Pastell docs endpoint'),
      '#default_value' => $config->get('field_pastell_documents_url'),
      // '#value' => $config->get('field_pastell_documents_url'),
      '#description' => $this->t('Enter the endpoint for documents'),
    ];  

    $form['field_pastell_entities_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Pastell entities endpoint'),
      '#default_value' => $config->get('field_pastell_entities_url'),
      // '#value' => $config->get('field_pastell_entities_url'),
      '#description' => $this->t('Enter the Pastell entities endpoint url'),
    ];
    $form['field_pastell_limit_documents'] = [
      '#type' => 'number',
      '#title' => $this->t('Limite de document à récupérer'),
      '#default_value' => $config->get('field_pastell_limit_documents'),
      // '#value' => $config->get('field_pastell_entities_url'),
      '#description' => $this->t('Limite de document à récupérer'),
    ];
    
    return parent::buildForm($form, $form_state);
  }
  


  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_pastell_pleiade.settings');
   
    $config->set('field_pastell_url', $form_state->getValue('field_pastell_url'));
    $config->set('field_pastell_documents_url', $form_state->getValue('field_pastell_documents_url'));
    $config->set('field_pastell_entities_url', $form_state->getValue('field_pastell_entities_url'));
    $config->set('field_pastell_limit_documents', $form_state->getValue('field_pastell_limit_documents'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}