(function (Drupal, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIlemonDataHistoryeBehavior = {
      attach: function (context, settings) {
        // exclude admin pages
        if (drupalSettings.path.currentPath.includes("history")) {
        //  once("APIlemonDataHistoryeBehavior", function () {
            var request = new XMLHttpRequest();
            request.open(
              "POST",
              Drupal.url("v1/api_lemon_pleiade/lemon-session-query"),
              true
            );
            request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
            request.onload = function () {
              if (this.status >= 200 && this.status < 400) {
                var response = JSON.parse(this.response);
                localStorage.setItem("groups", response.groups);
  
                // Si on est sur la page historique des connexions
                if (drupalSettings.path.currentPath === "history") {
                  console.log("We are on page : history!!");
  
                  var history_table =
                    '<h4 class="card-header rounded-top card-title text-light" style="background-color: #1f3889">Dernières connexions</h4><table class="table"><thead><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
                if(response._loginHistory.successLogin) {
                  for (
                    var i = 0;
                    i < response._loginHistory.successLogin.length;
                    i++
                  ) {
                    var objectDate = new Date(
                      response._loginHistory.successLogin[i]._utime * 1000
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
                      response._loginHistory.successLogin[i].ipAddr +
                      "</td></tr>";
                  }
                }
                  history_table +=
                    '</tbody></table><h4 class="card-header rounded-top card-title text-light" style="background-color: #1f3889">Dernières connexions echouées</h4><table class="table mb-5"><thead><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
                if(response._loginHistory.failedLogin) {
                 for (
                    var i = 0;
                    i < response._loginHistory.failedLogin.length;
                    i++
                  ) {
                    var objectDate = new Date(
                      response._loginHistory.failedLogin[i]._utime * 1000
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
                      response._loginHistory.failedLogin[i].ipAddr +
                      "</td></tr>";
                  }
                }
  
                  document.getElementById("history-connexion").innerHTML =
                    history_table;

                    // hide throbber
                    document.getElementById('spinner-history').style.display = 'none';
                }
              }
            };
            request.send();
         // });
        }
      },
    };
  })(Drupal, drupalSettings);
  