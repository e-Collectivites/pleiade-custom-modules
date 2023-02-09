(function ($, Drupal, once) {
  "use strict";
  Drupal.behaviors.APIlemonDataHistoryeBehavior = {
    attach: function (context, settings) {
      // exclude admin pages
      if (!drupalSettings.path.currentPath.includes("admin")) {
        once("APIlemonDataHistoryeBehavior", "body", context).forEach(
          function () {
            // Si on est sur la page historique des connexions
            if (drupalSettings.path.currentPath === "history") {
              console.log("We are on page : history!!");

              $.ajax({
                url: Drupal.url("v1/api_lemon_pleiade/lemon-session-query"), // on appelle l'API de notre module LemonDataApiManager.php
                dataType: "json", // on spécifie bien que le type de données est en JSON
                type: "POST",
                data: {},

                success: function (history) {
                  //historique en json
                  //console.log(history);

                  localStorage.setItem("groups", history.groups);
                  
                    var history_table =
                      '<h4 class="card-header rounded-top card-title text-light" style="background-color: #1f3889">Dernières connexions</h4><table class="table"><thead><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
                    for (
                      var i = 0;
                      i < history._loginHistory.successLogin.length;
                      i++
                    ) {
                      var objectDate = new Date(
                        history._loginHistory.successLogin[i]._utime * 1000
                      );

                      history_table +=
                        "<tr><td>" +
                        String(objectDate.getDate()).padStart(2, "0") +
                        "/" +
                        String(objectDate.getMonth() + 1).padStart(2, "0") +
                        "/" +
                        objectDate.getFullYear() +
                        " " +
                        String(objectDate.getHours()).padStart(2, "0") +
                        ":" +
                        String(objectDate.getMinutes()).padStart(2, "0") +
                        "</td><td>" +
                        history._loginHistory.successLogin[i].ipAddr +
                        "</td></tr>";
                    }
                    history_table +=
                      '</tbody></table><h4 class="card-header rounded-top card-title text-light" style="background-color: #1f3889">Dernières connexions echouées</h4><table class="table mb-5"><thead><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
                    for (
                      var i = 0;
                      i < history._loginHistory.failedLogin.length;
                      i++
                    ) {
                      var objectDate = new Date(
                        history._loginHistory.failedLogin[i]._utime * 1000
                      );

                      history_table +=
                        "<tr><td>" +
                        String(objectDate.getDate()).padStart(2, "0") +
                        "/" +
                        String(objectDate.getMonth() + 1).padStart(2, "0") +
                        "/" +
                        objectDate.getFullYear() +
                        " " +
                        String(objectDate.getHours()).padStart(2, "0") +
                        ":" +
                        String(objectDate.getMinutes()).padStart(2, "0") +
                        "</td><td>" +
                        history._loginHistory.successLogin[i].ipAddr +
                        "</td></tr>";
                    }

                    document.getElementById("history-connexion").innerHTML =
                      history_table;
                  
                },
                complete: function () {
                  $("#spinner-div").hide(); //Request is complete so hide spinner
                  $("#spinner-history").hide(); //Request is complete so hide spinner
                },
              });
            }
          }
        ); // fin once
      } // fin exlude admin pages
    },
  };
})(jQuery, Drupal, once);
