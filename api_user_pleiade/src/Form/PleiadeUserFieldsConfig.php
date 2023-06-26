<?php

namespace Drupal\api_user_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class PleiadeUserFieldsConfig extends ConfigFormBase
{

  /** 
   * {@inheritdoc}
   */
  public function getFormId()
  {
    return 'api_user_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames()
  {
    return [
      'api_user_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state)
  {
    $config = $this->config('api_user_pleiade.settings');

    $form['have_chatbot'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Assistant Virtuel ?'),
      '#default_value' => $config->get('have_chatbot'),

    ];
    $form['apiKey'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Clé Api SnatchBot ( Si activé )'),
      '#default_value' => $config->get('apiKey'),
    ];
    $form['apiKey']['#states'] = [
      'visible' => [
        ':input[name="have_chatbot"]' => ['checked' => TRUE],
      ],
    ];
    $form['bot_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('ID bot SnatchBot ( Si activé )'),
      '#default_value' => $config->get('bot_id'),
    ];
    $form['bot_id']['#states'] = [
      'visible' => [
        ':input[name="have_chatbot"]' => ['checked' => TRUE],
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state)
  {
    // Retrieve the configuration.
    $config = $this->config('api_user_pleiade.settings');
    $config->set('have_chatbot', $form_state->getValue('have_chatbot'));
    $config->set('apiKey', $form_state->getValue('apiKey'));
    $config->set('bot_id', $form_state->getValue('bot_id'));

    $config->save();

    parent::submitForm($form, $form_state);
  }

}