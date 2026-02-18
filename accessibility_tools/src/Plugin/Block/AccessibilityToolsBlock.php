<?php

namespace Drupal\accessibility_tools\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Custom HTML Block' for accessibility and user preferences.
 *
 * @Block(
 *   id = "accessibility_tools",
 *   admin_label = "Bloc Accessibilité",
 * )
 */
class AccessibilityToolsBlock extends BlockBase
{

  /**
   * {@inheritdoc}
   */
  public function getCacheMaxAge()
  {
    // This block is highly dynamic and user-specific. Do not cache.
    return 0;
  }

  /**
   * {@inheritdoc}
   */
  public function build()
  {
    $current_user_id = \Drupal::currentUser()->id();

    // Do not render the block for anonymous users.
    if (!$current_user_id) {
      return [];
    }

    $user_storage = \Drupal::entityTypeManager()->getStorage('user');
    $user = $user_storage->load($current_user_id);

    // --- PHP LOGIC: Prepare variables for the template ---

    $hasWatchaToken = !empty($user->get('field_watchaaccesstoken')->value);
    $js_hasWatchaToken = $hasWatchaToken ? 'true' : 'false';

    $isMenuOpened = (bool) $user->get("field_ismenuopened")->value;
    $isWatchaActivated = (bool) $user->get("field_iswatchaactivated")->value && $hasWatchaToken;
    $isNextCloudActivated = (bool) $user->get("field_isnextcloudactivated")->value; // && !empty($user->get('field_nextcloud_api_key')->value);
    $isGlpiActivated = (bool) $user->get("field_isglpiactivated")->value;
    $isPostitActivated = (bool) $user->get("field_ispostitactivated")->value;

    return [
      '#type' => 'inline_template',
      '#template' => <<<HTML
        <!-- C'est le conteneur principal de votre panneau d'accessibilité -->
<div class="accessibility-panel">
    <div class="p-3">
        <div class="form-group">
            <label class="form-check-label">Taille de la police :</label>
            <div class="controls btn-group" data-control="letter-spacing">
                <button type="button" class="btn btn-par" id="increaseFontSize" aria-label="Augmenter la taille de la police"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn btn-par" id="decreaseFontSize" aria-label="Diminuer la taille de la police"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn btn-par" id="resetFontSize" aria-label="Réinitialiser la taille de la police"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-check-label" for="font-family-select">Police du texte :</label>
            <select class="form-control" id="font-family-select" aria-label="Choisir la police du texte">
                <option value="default">Par défaut</option>
                <optgroup label="Sans-Serif">
                    <option value="Arial, Helvetica, sans-serif">Arial</option>
                    <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                    <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Lato', sans-serif">Lato</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                </optgroup>
                <optgroup label="Serif">
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Garamond', serif">Garamond</option>
                    <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                    <option value="'Merriweather', serif">Merriweather</option>
                </optgroup>
                <optgroup label="Monospace">
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                    <option value="'Inconsolata', monospace">Inconsolata</option>
                </optgroup>
            </select>
        </div>
      
        <div class="form-group">
           <label class="form-check-label">Espace entre les caractères :</label>
           <div class="controls">
                <button type="button" class="btn btn-par" id="increaseSpaces" aria-label="Augmenter l'espace entre les caractères"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn btn-par" id="decreaseSpaces" aria-label="Diminuer l'espace entre les caractères"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn btn-par" id="resetSpaces" aria-label="Réinitialiser l'espace entre les caractères"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
        </div>
        <div class="form-group">
          <label class="form-check-label" for="mode-loupe">Mode loupe :</label>
          <input type="checkbox" class="form-check-input" id="mode-loupe">
        </div>

        <div class="form-group">
          <label class="form-check-label" for="theme-view"><span>Thème Sombre :</span></label>
          <input type="checkbox" name="theme-view" class="form-check-input" id="theme-view" />
        </div>

        <div class="form-group">
          <label class="form-check-label" for="contraste">Contraste élevé :</label>
          <input type="checkbox" class="form-check-input" id="contraste">
        </div>

        <div class="form-group">
          <label class="form-check-label" for="black_and_white">Mode noir et blanc :</label>
          <input type="checkbox" class="form-check-input" id="black_and_white">
        </div>

        <!-- NOUVEAU: Bouton pour tout réinitialiser -->
        <div class="form-group mt-3">
             <button type="button" class="btn btn-secondary w-100" id="reset-all-accessibility">Réinitialiser les options</button>
        </div>
      
        <hr>
      
        <div class="form-group">
            <label class="form-check-label" for="menu-opened">Ouverture menu :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="menu-opened" data-category="field_ismenuopened" {% if is_menuOpened %}checked{% endif %}>
        </div>
        <div class="form-group">
            <label class="form-check-label" for="persoWatcha">Afficher Watcha :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoWatcha" data-category="field_iswatchaactivated" {% if is_watcha %}checked{% endif %}>
        </div>
        <div class="form-group">
            <label class="form-check-label" for="persoNextCloud">Afficher Activités récentes :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoNextCloud" data-category="field_isnextcloudactivated" {% if is_nextcloud %}checked{% endif %}>
        </div>
        <div class="form-group">
            <label class="form-check-label" for="persoGlpi">Afficher GLPI :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoGlpi" data-category="field_isglpiactivated" {% if is_glpi %}checked{% endif %}>
        </div>
        <div class="form-group">
            <label class="form-check-label" for="persoPostit">Afficher Post-It :</label>
            <input type="checkbox" class="form-check-input persoWidget" id="persoPostit" data-category="field_ispostitactivated" {% if is_postit %}checked{% endif %}>
         </div>
     </div>
</div>
        <script>
        (function (Drupal) {
          Drupal.behaviors.userPreferencesToggle = {
            attach: function (context) {
              context.querySelectorAll('.persoWidget:not(.processed)').forEach((checkbox) => {
                checkbox.classList.add('processed');
                checkbox.addEventListener('change', async (event) => {
                  const checkbox = event.currentTarget;
                  const category = checkbox.dataset.category;
                  const setPreferenceUrl = Drupal.url(`v1/api_user_pleiade/setVariables?var=\${category}`);
                  checkbox.disabled = true;
                  
                  try {
                    const response = await fetch(setPreferenceUrl);
                    if (!response.ok) {
                      throw new Error(`Server error: \${response.status} \${response.statusText}`);
                    }
                   
                    if (checkbox.id === 'persoWatcha') {
                      if (checkbox.checked) {
                        const hasToken = {{ js_hasWatchaToken }}; 
                        if (hasToken) {

                         location.reload();
                        } else {
                          window.location.href = Drupal.url('v1/api_watcha_pleiade/watcha_auth_flow');
                        }
                      } else {
                        
                        location.reload();
                      }
                      return;
                    }

                    if (checkbox.id === 'persoNextCloud' && checkbox.checked) {
                      const res = await fetch(Drupal.url('v1/api_nextcloud_pleiade/generateToken'));
                      if (res.status === 409) {
                        location.reload();
                        return;
                      }
                      const data = await res.json();
                      const popup = window.open(data.login_url, '_blank', 'width=600,height=700');
                  
                      if (popup) {
                        const checkClosed = setInterval(() => {
                          if (popup.closed) {
                            clearInterval(checkClosed);
                            fetch(Drupal.url('v1/api_nextcloud_pleiade/pollToken?token=' + data.poll_token))
                              .then(() => location.reload());
                          }
                        }, 500);
                      }
                      return;
                    }

                    location.reload();

                  } catch (error) {
                    console.error('Failed to update user preference:', error);
                    checkbox.disabled = false;
                    alert('Une erreur est survenue. Veuillez réessayer.'+ error.message);
                  }
                });
              });
            }
          };
        })(Drupal);
        </script>
HTML,
      '#context' => [
        'is_menuOpened' => $isMenuOpened,
        'is_watcha' => $isWatchaActivated,
        'is_nextcloud' => $isNextCloudActivated,
        'is_glpi' => $isGlpiActivated,
        'is_postit' => $isPostitActivated,
        'js_hasWatchaToken' => $js_hasWatchaToken,
      ],
      '#attached' => [
        'library' => [
          'accessibility_tools/accessibility_tools',
        ],
      ],
    ];
  }
}