(function ($, Drupal, once) {
    "use strict";
  
    Drupal.behaviors.APIZimbradataBehavior = {
      attach: function (context, settings) {

          if (!drupalSettings.path.currentPath.includes("admin")) {
            once("APIZimbradataBehavior", "body", context).forEach(function () {
                
                
            //------------------------------------------------------
            //Requete pour récupérer les collectivités du user actif
            //------------------------------------------------------
  
            $.ajax({
              url: Drupal.url("sites/default/files/datasets/js/zimbra_test.json"), // on appelle l'API de notre module LemonDataApiManager.php
              dataType: "json", // on spécifie bien que le type de données est en JSON
              type: "GET",
              data: {},
              success: function (donnees) {
                
                if(donnees.m.length > 0){
                    var linkEntitie = '<div id="zimbra_mail" class="col-lg-12">\
                                        <div class="shadow-lg">\
                                            <div class="card my-2">\
                                                <div class="card-header rounded-top" style="background-color: #1f3889">\
                                                <h4 class="card-title text-light">Boite de réception<span></span></h4>\
                                                </div>\
                                                <div class="card-body">\
                                                    <table class="table mb-0">\
                                                    <tbody>';
    
                    for (var i = 0; i < donnees.m.length; i++) {
                        // var mail_expediteur = donnees.m[i].e[1].a
                        var id_expediteur = donnees.m[i].id
                        //------------------------------------------------------
                        //  oN CONVERTIT LA DATE DEPUIS TIMESTAMP ET ON RECUPERE HEURE / MINUTES
                        //------------------------------------------------------
                        var hour_mail = (donnees.m[i].d /1000 );
                        var objectDate = new Date(
                            hour_mail * 1000 
                        );
                        linkEntitie +=  '<tr class="d-flex">\
                                            <th class="col d-flex align-items-center">\
                                                <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="user" width="30" class="profile-pic rounded-circle" />\
                                            </th>\
                                            <th class="d-flex align-items-center w-25">'+ donnees.m[i].e[1].p +'</th>\
                                            <th scope="col">\
                                                <span class="d-block fw-bold">'+ donnees.m[i].su +'</span>\
                                                <span class="d-block fw-light">'+ donnees.m[i].fr.substr(0,100)+'...  ' +'</span>\
                                            </th>\
                                            <th class="col d-flex align-items-center" class="fw-bold">' + String(objectDate.getHours()).padStart(2, "0") +
                                                ":" +
                                                String(objectDate.getMinutes()).padStart(2, "0") +
                                            '</th>\
                                            <th class="col d-flex align-items-center">\
                                                <a class="bidule hover-zoom" alt="constulter le mail" target="_blank" href="https://courriel.sitiv.fr/modern/email/Inbox/conversation/-'+ id_expediteur +'"><i data-feather="mail" class="feather-icon"></i></a>\
                                            </th>\
                                        </tr>\
                                        ';
                                    
                    }
                    linkEntitie += ' </tbody></table>\
                                    </div>\
                                    </div>\
                                </div>\
                                </div>\
                                '
                }
                else
                {
                    var linkEntitie = '<div id="zimbra_mail" class="col-lg-12">\
                                            <div class="shadow-lg">\
                                                <div class="card my-2">\
                                                    <div class="card-header rounded-top" style="background-color: #1f3889">\
                                                    <h4 class="card-title text-light">Boite de réception<span></span></h4>\
                                                    </div>\
                                                    <div class="d-flex justify-content-center">\
                                                        <h3 class="my-5">Aucun nouveau mail</h3>\
                                                    </div>\
                                                </div>\
                                            </div>\
                                        </div>\
                                        ';
                }            
                document.getElementById("zimbra_block_id").innerHTML += linkEntitie;
                feather.replace();
              },
              complete: function () {
                //------------------------------------------------------
                //On affiche le block / on cache le spinner
                //------------------------------------------------------
                $("#spinner-div-zimbra").hide();
                $("#zimbra_block_id").show(); //Request is complete so hide spinner
              },
            });
 
          }); // fin once
        } // fin exlude admin pages
   
      },
    };
  })(jQuery, Drupal, once);
  