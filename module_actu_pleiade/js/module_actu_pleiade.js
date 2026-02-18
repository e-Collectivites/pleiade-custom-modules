(function ($, Drupal, once) {
  "use strict";

  Drupal.behaviors.ActuBlocksBehavior = {
    attach: function (context) {
      once("ActuBlocksBehavior", "#carousel_actualites", context).forEach(function (element) {
        if ($.fn.slick) {
          $(element).slick({
            slidesToShow: window.innerWidth < 768 ? 2 : 4,
            slidesToScroll: 2,
            arrows: true,
            dots: true,
            autoplay: false,
            customPaging: (slider, i) => '<i class="fa-solid fa-circle"></i>',
          });
        }
      });
    }
  };
})(jQuery, Drupal, once);