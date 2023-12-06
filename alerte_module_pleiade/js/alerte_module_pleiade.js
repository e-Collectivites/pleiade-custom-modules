(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIalerteBlocksBehavior = {
      attach: function (context, settings) {
        // only on frontpage (desktop)
          once("APIalerteBlocksBehavior", ".message_avertissement", context).forEach(
            function () {
              // make ajax call
              var xhr = new XMLHttpRequest();
              xhr.open("GET", Drupal.url("v1/alerte_module_pleiade/message_fields"));
              
              xhr.responseType = "json";
              xhr.onload = function () {
                if (xhr.status === 200) {
                  var donnees = xhr.response;
                  console.log(donnees)
                  if (donnees.length > 0) {
                    const div_alert = document.querySelector('.message_avertissement');
                    for (var i = 0; i < donnees.length; i++) {
                      switch (donnees[i].importance) {
                        case "Informatif":
                          div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-success  d-flex align-items-center justify-content-center ">' + donnees[i].field_message_a_afficher + '</div>';
                          break;
                        case "Avertissement":
                          div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-warning d-flex align-items-center justify-content-center ">' + donnees[i].field_message_a_afficher + '</div>';
                          break;
                        case "Attention":
                          div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-danger d-flex align-items-center justify-content-center ">' + donnees[i].field_message_a_afficher + '</div>';
                          break;
                        default:
                          break;
                      }
                    }
                  }
                };
                xhr.onerror = function () {
                  console.log("Error making AJAX call");
                };
                xhr.onabort = function () {
                  console.log("AJAX call aborted");
                };
                xhr.ontimeout = function () {
                  console.log("AJAX call timed out");
                };
                xhr.onloadend = function () {
                }
            };
            xhr.send();
          }); // end once
       
    },
  };
})(Drupal, drupalSettings, once);