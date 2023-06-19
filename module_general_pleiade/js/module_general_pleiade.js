(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.ParamsGenBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (
        drupalSettings.module_general_pleiade
      ) {
        once("ParamsGenBehavior", "body", context).forEach(function () {

          if (settings.module_general_pleiade.color_theme)  {
            var newColorCode = settings.module_general_pleiade.color_theme;
            const rootElement = document.documentElement;
            // Modify CSS properties
            rootElement.style.setProperty("--global-color", newColorCode);                  
        }

        }); // end once
      } // fin only on frontpage
    },
  };
})(Drupal, drupalSettings, once);
