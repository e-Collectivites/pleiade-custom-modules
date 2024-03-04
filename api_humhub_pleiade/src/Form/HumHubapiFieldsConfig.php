<?php

namespace Drupal\api_humhub_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class HumHubapiFieldsConfig extends ConfigFormBase {

 
  public function getFormId() {
    return 'api_humhub_pleiade_config_form';
  }
  protected function getEditableConfigNames() {
    return [
      'api_humhub_pleiade.settings'
    ];
  }
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_humhub_pleiade.settings');
    
    $form['humhub_url'] = [
        '#type' => 'textfield',
        '#title' => $this->t('HumHub url'),
        '#default_value' => $config->get('humhub_url'),
        '#description' => $this->t('Enter the full HumHub url with /api/v1 at the end'),
      ]; 
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('api_humhub_pleiade.settings');
    $config->set('humhub_url', $form_state->getValue('humhub_url'));
    $config->save();
    
    parent::submitForm($form, $form_state);
  }

}