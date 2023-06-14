<?php

namespace Drupal\message_module_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure API Pléiade LemonLDAP fields settings.
 */
class MessageModuleFields extends ConfigFormBase {


  /** 
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'message_module_pleiade_config_form';
  }

  /** 
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'message_module_pleiade.settings'
    ];
  }

  /** 
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('message_module_pleiade.settings');

    // $form['message_actif'] = [
    //     '#type' => 'checkbox',
    //     '#title' => $this->t('Activer le message ?'),
    //     '#default_value' => $config->get('message_actif'),
    //     '#description' => $this->t('cochez si vous voulez que le message soit affiché'),
    //   ]; 

    $form['message_a_afficher'] = [
      '#type' => 'text_format',
      '#title' => $this->t('Message à afficher, si plusieurs messages, sauter une ligne entre chaques message'),
      '#default_value' => $config->get('message_a_afficher'),
      // '#description' => $this->t('entrez le message à afficher'),
    ]; 
    // $form['message_a_afficher']['#states'] = [
    //     'visible' => [
    //       ':input[name="message_actif"]' => ['checked' => TRUE],
    //     ],
    //   ];


    // $form['gravite_du_message'] = [
    //   '#type' => 'select',
    //   '#title' => $this->t('Gravité du message à afficher'),
    //   '#options' => array(
    //     'info' => t('Informatif : vert'),
    //     'warning' => t('Avertissement : orange'),
    //     'danger' => t('Urgent : rouge'),
    // ),
    //   '#default_value' => $config->get('gravite_du_message'),
    //   '#description' => $this->t('choisissez la couleur de fond du message'),
    // ];
    // $form['gravite_du_message']['#states'] = [
    //     'visible' => [
    //       ':input[name="message_actif"]' => ['checked' => TRUE],
    //     ],
    //   ];

    return parent::buildForm($form, $form_state);
  }
 
  /** 
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('message_module_pleiade.settings');
  
    // Save the form values to configuration
    // $config->set('message_actif', $form_state->getValue('message_actif'));
  
    $message_a_afficher_value = $form_state->getValue(['message_a_afficher', 'value']);
    if (is_array($message_a_afficher_value)) {
      $message_a_afficher_value = $message_a_afficher_value['value'];
    }
    $config->set('message_a_afficher', $message_a_afficher_value);
  
    // $config->set('gravite_du_message', $form_state->getValue('gravite_du_message'));
  
    $config->save();
  
    parent::submitForm($form, $form_state);
  }

}