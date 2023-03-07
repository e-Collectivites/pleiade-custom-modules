(function (Drupal, once, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIzimbraDataHistoryBehavior = {
      attach: function (context, settings) {
        // Load on front page only,
        if (drupalSettings.path.isFront) {
          once("APIzimbraDataHistoryBehavior", "#zimbra_block_mail_id", context).forEach(
            function () {
                // show spinner while ajax is loading
                document.getElementById("zimbra_block_mail_id").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
                var xhr = new XMLHttpRequest();
                // URL DE TEST POUR LE MOMENT COONF DANS l'ADMIN DU MODULE : sites/default/files/datasets/js/zimbra_test.json
                // xhr.open("GET", Drupal.url("v1/api_zimbra_pleiade/zimbra_mail_query"));
                xhr.open("GET", Drupal.url("sites/default/files/datasets/js/zimbra_test.json"));
                xhr.responseType = "json";

                xhr.onload = function () {
                    if (xhr.status === 200) {
                      var donnees = xhr.response;
                      // console.log(donnees);

                      if(donnees){
                        var linkEntitie = '<div id="zimbra_mail" class="col-lg-12 shadow-lg">\
                                            <div class="card">\
                                              <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                                                <h4 class="card-title text-dark py-2">Boite de réception<span></span></h4>\
                                              </div>\
                                                    <div class="card-body">\
                                                      <div class="scroll_on_table">\
                                                        <table class="table mb-0">\
                                                        <tbody>';
        
                        for (var i = 0; i < donnees.m.length; i++) {
                            // var mail_expediteur = donnees.m[i].e[1].a
                            var id_expediteur = donnees.m[i].id
                            //------------------------------------------------------
                            //  ON CONVERTIT LA DATE DEPUIS TIMESTAMP ET ON RECUPERE HEURE / MINUTES
                            //------------------------------------------------------
                            var hour_mail = (donnees.m[i].d /1000 );
                            var objectDate = new Date(
                                hour_mail * 1000 
                            );
                            
                            linkEntitie +=  '<tr class="d-flex mail_content" mail-expe="'+  donnees.m[i].e[1].a +'">\
                                                <th class="col d-flex align-items-center profile-picture">\
                                                </th>\
                                                <th class="d-flex align-items-center w-25">'+ donnees.m[i].e[1].p +'</th>\
                                                <th scope="col">\
                                                    <span class="d-block fw-bold">'+ donnees.m[i].su +'</span>\
                                                    <span class="d-block fw-light">'+ donnees.m[i].fr.substr(0,65)+'...  ' +'</span>\
                                                </th>\
                                                <th class="col d-flex align-items-center" class="fw-bold">' + String(objectDate.getHours()).padStart(2, "0") +
                                                    ":" +
                                                    String(objectDate.getMinutes()).padStart(2, "0") +
                                                '</th>\
                                                <th class="col d-flex align-items-center">\
                                                    <a class="hover-zoom" alt="constulter le mail" target="_blank" href="https://courriel.sitiv.fr/modern/email/Inbox/conversation/-'+ id_expediteur +'"><i data-feather="mail" class="feather-icon"></i></a>\
                                                </th>\
                                            </tr>\
                                            ';
                                        
                        }
                        linkEntitie += '</tbody></table></div>\
                                        </div>\
                                        </div>\
                                    </div>\
                                    </div>\
                                    '
                      }
                      else
                      {
                        var linkEntitie = '<div id="zimbra_mail " class="col-lg-12 shadow-lg">\
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
                    document.getElementById("zimbra_block_mail_id").innerHTML = linkEntitie;
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

                    // feather icons
                    feather.replace();

                  };    

            xhr.send();
          }); // fin once function
        }
      },
    };
  })(Drupal, once, drupalSettings);
  