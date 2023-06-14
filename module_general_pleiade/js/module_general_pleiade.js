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
            var elements = document.querySelectorAll(
              "#post_it_dashboad button, button#delete-button, .customizer .customizer-tab .nav-item .nav-link:hover, .customizer .customizer-tab .nav-item .nav-link.active, a.text-white.btn.d-block.w-100.my-2.rounded-pill, .page-item.active .page-link, a.text-white.btn.d-block.w-50.rounded-pill, .d-flex.no-block.align-items-center.p-3.text-white.mb-2, #main-wrapper[data-layout=vertical] .topbar .top-navbar .navbar-header, .customizer .service-panel-toggle, #main-wrapper[data-layout=vertical] .left-sidebar, #main-wrapper[data-layout=vertical] .left-sidebar ul, #main-wrapper[data-layout=horizontal] .left-sidebar, #main-wrapper[data-layout=horizontal] .left-sidebar ul"
            );
            var elements_2 = document.querySelectorAll(
              ".customizer .customizer-tab .nav-item .nav-link, svg.feather.feather-bell.feather-sm, .customizer .customizer-tab .nav-item .nav-link:hover, .customizer .customizer-tab .nav-item .nav-link.active"
            );
            var navLinks = document.querySelectorAll(" .page-item.active .page-link, .customizer .customizer-tab .nav-item .nav-link");

            navLinks.forEach(function(navLink) {
              navLink.addEventListener("click", function() {
                // Reset the background color of all nav links
                navLinks.forEach(function(link) {
                  link.style.background = "";
                });
            
                // Set the background color of the clicked nav link
                this.style.background = newColorCode;
              });
            });
            
            for (var i = 0; i < elements.length; i++) {
              elements[i].style.background = newColorCode;
            }
            for (var i = 0; i < elements_2.length; i++) {
              elements_2[i].style.color = newColorCode;
              elements_2[i].style.borderBottomColor = newColorCode;
            }
            const button = document.querySelector(
              '#post_it_dashboard'
            );

            const propertiesToReplace = ["border"];
            if(button){
              const computedStyle = window.getComputedStyle(button);
              for (let property of propertiesToReplace) {
                const originalValue = computedStyle[property];
                const replacedValue = replaceRGB(
                  originalValue,
                  "rgb(31, 56, 137)",
                  newColorCode
                );

                button.style[property] = replacedValue;
              }
            }

            function replaceRGB(value, rgbColor, replacement) {
              return value.replace(rgbColor, replacement);
            }
            
            
        }

        }); // end once
      } // fin only on frontpage
    },
  };
})(Drupal, drupalSettings, once);
