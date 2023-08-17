(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraDataHistoryBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_mail
      ) {
        once(
          "APIzimbraDataHistoryBehavior",
          "#zimbra_block_mail_id",
          context
        ).forEach(function () {
          // show spinner while ajax is loading
          document.getElementById("zimbra_block_mail_id").innerHTML =
            drupalSettings.api_lemon_pleiade.spinner;
          var xhr = new XMLHttpRequest();
          // URL DE TEST POUR LE MOMENT COONF DANS l'ADMIN DU MODULE : sites/default/files/datasets/js/zimbra_test.json
          // xhr.open("GET", Drupal.url("v1/api_zimbra_pleiade/zimbra_mail_query"));
          xhr.open(
            "GET",
            Drupal.url("v1/api_zimbra_pleiade/zimbra_mails_query")
          );
          xhr.responseType = "json";

          xhr.onload = function () {
            if (xhr.status === 200) {
              var linkEntitie = ""; // Initialiser la variable linkEntitie ici
              var donnees = xhr.response; // Assurez-vous que xhr.response contient un tableau d'objets "donnees"
              //console.log(donneesArray)
              var linkEntitie =
                '<div id="zimbra_mail" class="col-lg-12 mb-2">\
                                            <div class="card">\
                                              <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                                                <h4 class="card-title text-dark py-2">Boite de réception<span></span></h4>\
                                              </div>\
                                                    <div class="card-body">\
                                                      <div class="scroll_on_table">\
                                                        <table class="table mb-0">\
                                                        <tbody>';

              console.log(donnees);
              var linkEntities = "";
              if (donnees.userData.Body.SearchResponse.c) {
                for (
                  var i = 0;
                  i < donnees.userData.Body.SearchResponse.c.length;
                  i++
                ) {
                  // var mail_expediteur = donnees.userData.Body.SearchResponse.c[i].e[1].a
                  var id_expediteur =
                    donnees.userData.Body.SearchResponse.c[i].id;
                  //------------------------------------------------------
                  //  ON CONVERTIT LA DATE DEPUIS TIMESTAMP ET ON RECUPERE HEURE / MINUTES
                  //------------------------------------------------------
                  var hour_mail =
                    donnees.userData.Body.SearchResponse.c[i].d / 1000;
                  var objectDate = new Date(hour_mail * 1000);

                  linkEntitie +=
                    '<tr class="d-inline-flex mail_content w-100" mail-expe="' +
                    donnees.userData.Body.SearchResponse.c[i].e[0].a +
                    '">\
                                                <th class="col d-flex align-items-center profile-picture"></th>\
                                                <th class="d-flex justify-content-center expediteur align-items-center">' +
                    donnees.userData.Body.SearchResponse.c[i].e[0].p +
                    '</th>\
                                                <th scope="col" class="content-mail">\
                                                    <span class="d-block fw-bold">' +
                    donnees.userData.Body.SearchResponse.c[i].su +
                    '</span>\
                                                    <span class="d-block fw-light">' +
                    donnees.userData.Body.SearchResponse.c[i].fr.substr(0, 65) +
                    "...  " +
                    '</span>\
                                                </th>\
                                                <th class="col mailTime d-flex align-items-center" class="fw-bold">' +
                    String(objectDate.getHours()).padStart(2, "0") +
                    ":" +
                    String(objectDate.getMinutes()).padStart(2, "0") +
                    '</th>\
                                                <th class="col readMail d-flex align-items-center">\
                                                    <a class="hover-zoom" alt="constulter le mail" target="_blank" href="' +
                    donnees.domainEntry +
                    "modern/email/Inbox/conversation/" +
                    id_expediteur +
                    '"><i class="fa fa-envelope-o" aria-hidden="true"></i></a>\
                                                </th>\
                                            </tr>\
                                            ';
                }
              } else {
                var linkEntitie =
                  '<div id="zimbra_mail " class="col-lg-12 mb-2">\
                    <div class="card">\
                      <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                        <h4 class="card-title text-dark py-2">Boite de réception<span></span></h4>\
                      </div>\
                      <div class="d-flex justify-content-center">\
                          <h3 class="my-5">Aucun nouveau mail</h3>\
                      </div>\
                    </div>\
                  </div>\
                    ';
              }
            }
            linkEntitie +=
              "</tbody></table></div>\
                </div>\
                </div>\
            </div>\
            </div>\
            ";
            document.getElementById("zimbra_block_mail_id").innerHTML =
              linkEntitie;
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
          };

          xhr.send();
        }); // fin once function
      }
    },
  };
})(Drupal, once, drupalSettings);
