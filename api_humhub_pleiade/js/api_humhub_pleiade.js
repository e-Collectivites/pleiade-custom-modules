(function ($, Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.HumhubBehavior = {
    attach: function (context, settings) {
 
      setTimeout(function () {
        once("HumhubBehavior", "body", context).forEach(
          function () {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Drupal.url("v1/api_humhub_pleiade/humhub_query"));
            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = (xhr.response);
                if (donnees) {

                  if (donnees['messages'] && donnees['notifs']) {
                    var total = donnees['notifs'].total + donnees['messages'].total
                  }
                  else if (donnees['notifs']) {
                    var total = donnees['notifs'].total
                  }
                  var addBadges = document.querySelector(".fa-users");
                  var echangersurlerseausocial = document.querySelector("#echangersurlerseausocial");
                  var Notifs = createErrorBadge("all_notifs", total);
                  var Notifs1 = createErrorBadge("all_notifs", total);

                  var link_humhub = document.querySelector(".pastille_collab");

                  if (total > 0) {
                    addBadges.innerHTML = '<span class="position-absolute start-75 translate-middle badge rounded-pill error_' + total + '">' + total + '</span>'
                    link_humhub.appendChild(Notifs);
                    echangersurlerseausocial.appendChild(Notifs1);
                  }





                  function createErrorBadge(label, count) {
                    var errorDiv = document.createElement("div");
                    errorDiv.classList.add("pastille");
                    errorDiv.textContent = count;
                    errorDiv.setAttribute("data-label", label);
                    return errorDiv;
                  }



                }

              };
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

            xhr.send();
          }); 
      }, 2000);
    },
  };
})(jQuery, Drupal, drupalSettings, once);