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
    ];
    // Add a reset button
    $form['reset_color'] = [
      '#type' => 'submit',
      '#value' => $this->t('Restaurer la couleur par défaut'),
      '#submit' => ['::resetColor'],
      '#limit_validation_errors' => [],
    ];
    $form['image_footer'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Image du footer'),
      '#default_value' => $config->get('image_footer'),
      '#upload_location' => 'public://module_general_pleiade/images',
    ];

    $form['image_left_sidebar'] = [
        '#type' => 'managed_file',
        '#title' => $this->t('Image de la barre de Gauche ( Menu étendu )'),
        '#default_value' => $config->get('image_left_sidebar'),
        '#upload_location' => 'public://module_general_pleiade/images',
      ];

    $form['image_left_sidebar_reduced'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('Image de la barre de Gauche ( Menu réduit )'),
      '#default_value' => $config->get('image_left_sidebar_reduced'),
      '#upload_location' => 'public://module_general_pleiade/images',
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
    $config->set('image_footer', $form_state->getValue('image_footer'));
    $config->set('image_left_sidebar', $form_state->getValue('image_left_sidebar'));
    $config->set('image_left_sidebar_reduced', $form_state->getValue('image_left_sidebar_reduced'));
    $config->save();
  }

    parent::submitForm($form, $form_state);
  }
}
