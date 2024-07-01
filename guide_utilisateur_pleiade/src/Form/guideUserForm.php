<?php

namespace Drupal\guide_utilisateur_pleiade\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form definition for the Module actu Pleiade module.
 */
class guideUserForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'guide_utilisateur_pleiade_config_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'guide_utilisateur_pleiade.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('guide_utilisateur_pleiade.settings');

    $form['guide_on_desktop'] = [
      '#type' => 'checkbox',
      '#title' => $this->t("activer l'affichage sur le bureau"),
      '#default_value' => $config->get('guide_on_desktop'),
      '#description' => $this->t("activer l'affichage sur le bureau")
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('guide_utilisateur_pleiade.settings');
    $config->set('guide_on_desktop', $form_state->getValue('guide_on_desktop'));
    $config->save();

    parent::submitForm($form, $form_state);
  }
}
