(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.ActuBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)

      once("ActuBlocksBehavior", ".actualites", context).forEach(
        function () {
          // make ajax call
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/module_actu_pleiade/actu_list"));

          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response;
              console.log(donnees);
              if (donnees.length > 0) {
                const div_actus = document.querySelector('.actualites');
                for (var i = 0; i < donnees.length; i++) {
                  if (
                    donnees[i].title &&
                    donnees[i].description
                  ) {

                    if (donnees[i].image) {
                      var image = '<img class="" src="' + donnees[i].image + '" alt="Card image cap">'
                    }
                    else {
                      var image = ''
                    }
                    div_actus.innerHTML += '\
                      <div class="row">\
                          <div class="col-12">\
                                  <div class="card">\
                                  <div class="card-horizontal">\
                                      <div class="img-square-wrapper d-flex align-items-center">\
					                            '+ image + ' \
                                      </div>\
                                      <div class="card-body">\
                                          <h4 class="card-title">'+ donnees[i].title + '</h4>\
                                          <div class="card-text">'+ donnees[i].description + '</div>\
                                      </div>\
                                  </div>\
                              </div>\
                          </div>\
                      </div>';
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
