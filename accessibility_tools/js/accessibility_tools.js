/**
 * @file
 * Handles accessibility tool interactions like theme toggling, font size, etc.
 *
 * This file uses the Drupal behaviors system and the drupal/once library to
 * ensure that event handlers are attached only once, even with AJAX content.
 */
(function ($, Drupal, once) {
  'use strict';

  // Define a single behavior for all accessibility tools.
  Drupal.behaviors.AccessibilityTools = {
    attach: function (context) {

      /*
       * =======================================================================
       *   1. Dark/Light Theme Toggler
       * =======================================================================
       */
      once('theme-view-toggle', '#theme-view', context).forEach(function (checkbox) {
        const cleanupFlag = 'v1_layout_cleanup_done';
        if (localStorage.getItem('tabulator-datatable-documents-state-columns')) {
          localStorage.removeItem('tabulator-datatable-documents-state-columns');
          localStorage.removeItem('tabulator-glpi-tabulator-table-columns');
          localStorage.setItem(cleanupFlag, 'true');
        }

        const $checkbox = $(checkbox);
        const body = $('body');
        const applyTheme = () => {
          const newTheme = $checkbox.is(':checked') ? 'dark' : 'light';
          body.attr('data-theme', newTheme);
        };
        $checkbox.on('change', function () {
          localStorage.setItem('themeViewChecked', this.checked);
          applyTheme();
        });
        if (localStorage.getItem('themeViewChecked') === 'true') {
          $checkbox.prop('checked', true);
        }
        applyTheme();
      });

      /*
       * =======================================================================
       *   2. Font Size Controls (Corrected for Dynamic Content)
       * =======================================================================
       */
      once('font-size-controls', '.btn-group[data-control="letter-spacing"]', context).forEach(function (controlGroup) {
        const $controlGroup = $(controlGroup);
        const storageKey = 'accessibility_font_size_step';
        const stepAmountInPixels = 2;

        const applyFontSize = () => {
          const currentStep = parseInt(localStorage.getItem(storageKey) || '0', 10);
          const baseFontSize = 16; // Assuming a base font size of 16px for the root element.
          const newSize = baseFontSize + (currentStep * stepAmountInPixels);
          document.documentElement.style.fontSize = newSize + 'px';
        };

        $controlGroup.on('click', 'button', function () {
          const action = this.id;
          let currentStep = parseInt(localStorage.getItem(storageKey) || '0', 10);
          if (action === 'increaseFontSize') {
            currentStep = Math.min(3, currentStep + 1);
          } else if (action === 'decreaseFontSize') {
            currentStep = Math.max(-3, currentStep - 1);
          } else if (action === 'resetFontSize') {
            currentStep = 0;
          }
          localStorage.setItem(storageKey, currentStep);
          applyFontSize();
        });

        applyFontSize();
      });

      /*
       * =======================================================================
       *   3. Font Family Selection
       * =======================================================================
       */
      once('font-family-control', '#font-family-select', context).forEach(function (selectElement) {
        const $select = $(selectElement);
        const storageKey = 'accessibility_font_family';
        const body = document.body;

        const applyFontFamily = () => {
          const savedFont = localStorage.getItem(storageKey);
          if (savedFont) {
            body.style.fontFamily = savedFont;
            $select.val(savedFont);
          }
          else {
             // If no font is saved, ensure the body's font is reset.
             body.style.fontFamily = '';
          }
        };

        $select.on('change', function () {
          const selectedFont = $(this).val();
          if (selectedFont === 'default') {
             localStorage.removeItem(storageKey);
          } else {
             localStorage.setItem(storageKey, selectedFont);
          }
          applyFontFamily();
        });

        applyFontFamily();
      });

      /*
       * =======================================================================
       *   4. Letter Spacing Controls
       * =======================================================================
       */
      once('letter-spacing-controls', '.controls:has(#increaseSpaces)', context).forEach(function (controlGroup) {
        let currentSpacing = 0;
        const $controlGroup = $(controlGroup);

        const updateLetterSpacing = (delta) => {
          const currentComputedSpacing = parseFloat(window.getComputedStyle(document.body).letterSpacing) || 0;
          currentSpacing = Math.max(0, currentComputedSpacing + delta);
          document.body.style.letterSpacing = currentSpacing > 0 ? `${currentSpacing}px` : 'normal';
        };

        const resetLetterSpacing = () => {
          currentSpacing = 0;
          document.body.style.letterSpacing = 'normal';
        };

        $controlGroup.on('click', 'button', function () {
          const action = this.id;
          if (action === 'increaseSpaces') updateLetterSpacing(1);
          else if (action === 'decreaseSpaces') updateLetterSpacing(-1);
          else if (action === 'resetSpaces') resetLetterSpacing();
        });
      });

      /*
       * =======================================================================
       *   5. Contrast and B&W Filter Controls
       * =======================================================================
       */
      once('filter-controls', '#contraste, #black_and_white', context).forEach(function (checkbox) {
        const $checkbox = $(checkbox);
        const elementsToFilter = document.querySelectorAll(
            ".container-fluid, .left-sidebar, .customizer, .right_position, .navbar-header, #app-footer"
        );
        
        const updateFilter = () => {
          const filterValue = [
            $('#contraste').is(':checked') ? 'contrast(2)' : '',
            $('#black_and_white').is(':checked') ? 'grayscale(1)' : ''
          ].filter(Boolean).join(' ');

          elementsToFilter.forEach(el => {
            el.style.filter = filterValue;
          });
        };

        $checkbox.on('change', function () {
          localStorage.setItem(this.id + 'Checked', this.checked);
          updateFilter();
        });

        if (localStorage.getItem(checkbox.id + 'Checked') === 'true') {
          $checkbox.prop('checked', true);
        }
        updateFilter();
      });

      /*
       * =======================================================================
       *   6. Zoom Mode (Magnifying Glass) - REVISED AND IMPROVED
       * =======================================================================
       */
      once('zoom-mode-control', '#mode-loupe', context).forEach(function (checkbox) {
        const mouseInfoDiv = $('<div>').css({
          position: 'fixed',
          padding: '5px 10px',
          fontSize: '2rem',
          borderRadius: '5px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(0,0,0,0.8)',
          color: '#fff',
          display: 'none',
          zIndex: '9999999999999',
          lineHeight: '1.2',
          pointerEvents: 'none',
          userSelect: 'none',
          maxWidth: '400px',
          wordWrap: 'break-word'
        }).appendTo('body')[0];

        const handleMouseMove = (event) => {
          const el = event.target;
          if (!el) return;

          let ownText = '';
          for (const childNode of el.childNodes) {
              if (childNode.nodeType === Node.TEXT_NODE) {
                  ownText += childNode.textContent;
              }
          }
          ownText = ownText.trim();

          let textToShow = ownText || (el.children.length === 0 ? el.textContent.trim() : '');

          if (textToShow) {
            mouseInfoDiv.style.left = `${event.clientX + 20}px`;
            mouseInfoDiv.style.top = `${event.clientY + 20}px`;
            mouseInfoDiv.textContent = textToShow;
            mouseInfoDiv.style.display = 'block';
          } else {
            mouseInfoDiv.style.display = 'none';
          }
        };

        $(checkbox).on('change', function () {
          if (this.checked) {
            document.body.addEventListener('mousemove', handleMouseMove, false);
          } else {
            document.body.removeEventListener('mousemove', handleMouseMove, false);
            mouseInfoDiv.style.display = 'none';
          }
        });
      });
      
      /*
       * =======================================================================
       *   7. NEW: Restore All Defaults
       * =======================================================================
       */
      once('restore-defaults-control', '#reset-all-accessibility', context).forEach(function (button) {
        $(button).on('click', function() {
        
            // List of all localStorage keys used by this script.
            const keysToRemove = [
              'themeViewChecked',
              'accessibility_font_size_step',
              'accessibility_font_family',
              'contrasteChecked',
              'black_and_whiteChecked'
            ];
            
            // Remove each key from localStorage.
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Reload the page to apply the default settings.
            location.reload();
          
        });
      });
    }
  };
})(jQuery, Drupal, once);