<?php

namespace Drupal\module_general_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form definition for the Module General Pleiade module.
 */
class ModuleGeneralPleiadeConfigForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'module_general_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'module_general_pleiade.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('module_general_pleiade.settings');

    $form['color_theme'] = [
      '#type' => 'color',
      '#title' => $this->t('Couleur du thème'),
      '#default_value' => $config->get('color_theme'),
      '#description' => $this->t('Sur Firefox, pour passer du code HEXA au code RGB, cliquez sur <a href="https://www.rgbtohex.net/hex-to-rgb/" target="_blank">ce lien.</a>')
    ];
    
    $form['url_lien_documentation'] = [
      '#type' => 'url',
      '#title' => $this->t('Lien de l\'onglet "Documentation" du menu de gauche'),
      '#default_value' => $config->get('url_lien_documentation'),
      '#description' => $this->t('<span style="display: flex; align-items: center">Url correspondant à ce lien du menu : &nbsp;&nbsp;<img src="/themes/custom/pleiadebv/assets/images/url_documentation.png"></span>')
    ];
  
    return parent::buildForm($form, $form_state);
  }

  public function resetColor(array &$form, FormStateInterface $form_state) {
    $form_state->setValue('color_theme', null);
    // Optional: Add any additional actions you want to perform when resetting the color field.
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('module_general_pleiade.settings');

  if ($form_state->getTriggeringElement()['#name'] == 'reset_color') {
    $form_state->setValue('color_theme', null);
    // Optional: Add any additional actions you want to perform when resetting the color field.
  } else {
    // Save the submitted values to the configuration.
    $config->set('color_theme', $form_state->getValue('color_theme'));
    $config->set('url_lien_documentation', $form_state->getValue('url_lien_documentation'));
    $config->save();
  }

    parent::submitForm($form, $form_state);
  }
}
