// FILE: maarch_unified.js (or your Drupal JS file)

import { EmailWidget } from './main.js';

(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.MaarchUnifiedBehavior = {
    attach: function (context) {
      const container = document.getElementById("maarch_div_id");
      if (!container) return;

      once("MaarchUnifiedBehavior", container, context).forEach((el) => {
        const maarchUrl = drupalSettings.api_maarch_pleiade?.maarch_url;
        
        if (!maarchUrl) {
            console.error("Maarch URL is not defined in drupalSettings.");
            return;
        }

        // Pass the complete data object to the widget
        const app = new EmailWidget(maarchUrl);
        app.initialize();
      });
    },
  };
})(Drupal, once, drupalSettings);