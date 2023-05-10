(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APImessageBlocksBehavior = {
      attach: function (context, settings) {
        // only on frontpage (desktop)
        if (drupalSettings.path.isFront && drupalSettings.message_module_pleiade) {
          once("APImessageBlocksBehavior", ".message_avertissement", context).forEach(
            function () {
              // make ajax call
              var xhr = new XMLHttpRequest();
              xhr.open("POST", Drupal.url("v1/message_module_pleiade/message_fields"));
              xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
              xhr.responseType = "json";
              xhr.onload = function () {
                if (xhr.status === 200) {
                  var donnees = xhr.response;
                  if(donnees[0]){
                        
                        const div_alert = document.querySelector('.message_avertissement');
                        switch (donnees[0].gravite) {
                            case "info":
                                div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-success opacity-75 d-flex align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
                              break;
                            case "warning":
                                div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-warning d-flex opacity-75 align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
                              break;
                            case "danger":
                                div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-danger d-flex opacity-75 align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
                              break;
                            default:
                              break;
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
      } // fin only on frontpage 
    },
  };
})(Drupal, drupalSettings, once);