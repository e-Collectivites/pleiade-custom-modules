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
    $form['numero_telephone_support'] = [
      '#type' => 'tel',
      '#title' => $this->t('Numéro de téléphone du support'),
      '#default_value' => $config->get('numero_telephone_support')
    ];
    $form['horaire_support'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Horaires du support'),
      '#default_value' => $config->get('horaire_support')
    ];
    $form['adresse_mail_support'] = [
      '#type' => 'email',
      '#title' => $this->t('Adresse mail du support'),
      '#default_value' => $config->get('adresse_mail_support'),
      '#description' => $this->t('Adresse mail du support à contacter si problème et si chatbot marche pas')
    ];
    $form['sites_internets'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Paramètrage des sites par collectivité. Entrez une collectivité par ligne sous le format "ID LDAP","URl du site internet","URL de la GRU",... '),
      '#default_value' => $config->get('sites_internets'),
      '#placeholder' => $this->t('"ID LDAP de la commune ","URL du site internet","URL de la GRU",...')
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
  } else {
    $config->set('color_theme', $form_state->getValue('color_theme'));
    $config->set('numero_telephone_support', $form_state->getValue('numero_telephone_support'));
    $config->set('horaire_support', $form_state->getValue('horaire_support'));
    $config->set('adresse_mail_support', $form_state->getValue('adresse_mail_support'));
    $config->set('menu_ecollectivites', $form_state->getValue('menu_ecollectivites'));
    $config->set('sites_internets', $form_state->getValue('sites_internets'));
    $config->save();
  }

    parent::submitForm($form, $form_state);
  }
}
