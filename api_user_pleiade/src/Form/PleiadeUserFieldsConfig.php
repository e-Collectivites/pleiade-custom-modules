<?php

namespace Drupal\api_user_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade Pastell fields settings.
 */
class PleiadeUserFieldsConfig extends ConfigFormBase {

  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_user_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'api_user_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_user_pleiade.settings');
    
    $form['have_chatbot'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Assistant Virtuel ?'),
        '#default_value' => $config->get('have_chatbot'),
        
      ]; 

    return parent::buildForm($form, $form_state);
  }
  
  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Retrieve the configuration.
    $config = $this->config('api_user_pleiade.settings');  
    $config->set('have_chatbot', $form_state->getValue('have_chatbot'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}