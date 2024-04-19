<?php


namespace Drupal\accessibility_tools\Plugin\Block;
use Drupal\Core\Block\BlockBase;


/**
 * Provides a 'Custom HTML Block' block.
 *
 * @Block(
 *   id = "accessibility_tools",
 *   admin_label = "Bloc Accessibilité",
 * )
 */
class AccessibilityToolsBlock  extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
   
      $build = [
        '#type' => 'inline_template',
        '#template' => '
      <div>
        <div class="p-3 border-bottom">
          <div class="mt-2">
            
          </div>
          <span>Taille de la police : </span>
          <!-- Utilisation de Bootstrap pour créer les boutons -->
          <div class="btn-group" role="group" aria-label="Taille de la police">
              <button type="button" class="btn" id="increaseFontSize"><i class="fa-solid fa-arrow-up"></i></button>
              <button type="button" class="btn" id="decreaseFontSize"><i class="fa-solid fa-arrow-down"></i></button>
              <button type="button" class="btn" id="resetFontSize"><i class="fa-solid fa-rotate-right"></i></button>
          </div>
          
          <label class="form-check-label" for="space_letters">Espace entre les caractères : </label>
          <div class="btn-group" role="group" aria-label="Espace entre les caractères">
              <button type="button" class="btn" id="increaseSpaces"><i class="fa-solid fa-arrow-up"></i></button>
              <button type="button" class="btn" id="decreaseSpaces"><i class="fa-solid fa-arrow-down"></i></button>
              <button type="button" class="btn" id="resetSpaces"><i class="fa-solid fa-rotate-right"></i></button>
          </div>
          <label class="form-check-label" for="mode-loupe">Mode loupe : </label>
          <input type="checkbox" class="form-check-input" id="mode-loupe">
          <label class="form-check-label" for="theme-view">
              <span>Thème Sombre : </span>
            </label>
            <input
              type="checkbox"
              name="theme-view"
              class="form-check-input"
              id="theme-view"
            />
          <label class="form-check-label" for="contraste">Contraste élevé : </label>
          <input type="checkbox" class="form-check-input" id="contraste">
          <label class="form-check-label" for="black_and_white">Mode noir et blanc : </label>
          <input type="checkbox" class="form-check-input" id="black_and_white">
          
        </div>
      </div>',
            '#attached' => [
              'library' => [
                'accessibility_tools/accessibility_tools',
              ],
            ],
          ];
      
          return $build;
      }

    
}
