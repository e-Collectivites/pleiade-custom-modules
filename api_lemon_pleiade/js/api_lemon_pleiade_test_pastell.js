(function ($, Drupal, once) {
  "use strict";

  Drupal.behaviors.APIlemonDataBehavior = {
    attach: function (context, settings) {
      // exclude admin pages

        $("#collectiviteChoice").val(localStorage.getItem('collectivite_id'))
        .find("option[value=" + localStorage.getItem('collectivite_id') +"]").attr('selected', true);
     
        
      
        if (!drupalSettings.path.currentPath.includes("admin")) {
          once("APIlemonDataBehavior", "body", context).forEach(function () {
              
              
          //------------------------------------------------------
          //Requete pour récupérer les collectivités du user actif
          //------------------------------------------------------

          $.ajax({
            url: Drupal.url("sites/default/files/datasets/js/json_temporaire_group_entitites.json"), // on appelle l'API de notre module LemonDataApiManager.php
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "GET",
            data: {},
            success: function (donnees) {
              // console.log(donnees)
              var linkEntitie = "";

              for (var i = 0; i < donnees.length; i++) {
                linkEntitie +=
                  '<option id="entitie_number_' +
                  donnees[i].id_e +
                  '" class="dropdown-item text-uppercase" value="' +
                  donnees[i].id_e +
                  '">' +
                  donnees[i].denomination +
                  "</option>";
              }
              document.getElementById("collectiviteChoice").innerHTML +=
                linkEntitie;
            },
            
          });

          //------------------------------------------------------
          //Chargement du bloc pastell au chargement initial  
          //------------------------------------------------------
          

          $.ajax({
            url: Drupal.url(
              "sites/default/files/datasets/js/documents_pastell_test.json"
            ), 
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "GET",
            data: {},
            success: function (donnees) {
              $("#pastell_block_id").hide();
              $("#spinner-div-pastell").show();
              $( "#pastell_block" ).remove();
              //--------------------------------------//

                var document_coll =
                  '\
                  <div class="col-lg-12" id="pastell_block"> \
                  <div class="mb-2 shadow-lg">\
                    <div class="card my-2">\
                      <div class="card-header rounded-top" style="background-color: #1f3889">\
                        <h4 class="card-title text-light">\
                          Télétransmission : Derniers documents : Collectivité n°'+ localStorage.getItem('collectivite_id') +'<span></span>\
                        </h4>\
                      </div>\
                      <div class="card-body">\
                        <table class="table">\
                          <thead>\
                            <tr>\
                              <th scope="col">Titre</th>\
                              <th scope="col">Type</th>\
                              <th scope="col">Dernière modification</th>\
                              <th scope="col">Statut</th>\
                              <th></th>\
                              <th></th>\
                              <th></th>\
                            </tr>\
                          </thead>\
                          <tbody>';

                  for (var i = 0; i < donnees.length; i++) {
                    //TODO voir pour les différents états des documents
                    // switch (donnees[i].last_action_display) {
                    //   case "":
                    //     // code block
                    //     break;
                    //   default:
                    //   // code block
                    // }
                    var objectDate = new Date(donnees[i].last_action_date);

                    
                    var badge_color = "bg-success";
                    var last_action = "En Cours de Création";
                    var lien_pastell_detail = "https://pastelldev.ecollectivites.fr/Document/detail?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e;
                    var lien_pastell_edition = "https://pastelldev.ecollectivites.fr/Document/edition?id_d=" + donnees[i].id_d + "&id_e=" +  donnees[i].id_e;
                    var lien_pastell_supp = "https://pastelldev.ecollectivites.fr/Document/warning?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e + "&action=supression";
                    document_coll += "\
                    <tr>\
                      <td>" + donnees[i].titre +"</td>\
                      <td>" + donnees[i].type +"</td>\
                      <td>" + String(objectDate.getDate()).padStart(2, "0") +
                      "/" +
                      String(objectDate.getMonth() + 1).padStart(2, "0") +
                      "/" +
                      objectDate.getFullYear() +
                      " " +
                      String(objectDate.getHours()).padStart(2, "0") +
                      ":" +
                      String(objectDate.getMinutes()).padStart(2, "0") + '</td>\
                      <td><span class="badge ' +badge_color +'">'+ last_action +'</span></td>\
                      <td><a href="' + lien_pastell_detail +'"><i data-feather="search" class="feather-icon"></i></a></td>\
                      <td><a href="' + lien_pastell_edition +'"><i data-feather="edit" class="feather-icon"></i></a></td>\
                      <td><a href="' + lien_pastell_supp +'"><i data-feather="trash-2" class="feather-icon"></i></a></td>\
                    </tr>\
                    ';
                  }
                  document_coll += "\
                            </tbody>\
                          </table>\
                        </div>\
                      </div>\
                    </div>\
                  </div>\
                  "
                  document.getElementById("pastell_block_id").innerHTML += document_coll;
                  feather.replace();
            },
            complete: function () {
              $("#spinner-div-pastell").hide();
              $("#pastell_block_id").show();
            },
          });

          //------------------------------------------------------
          //Changement de la collectivité au clic 
          //------------------------------------------------------


          $("select.collectivitechoiceli").change(function(){
            
            //------------------------------------------------------
            //Changement du cookie de la collectivité au clic 
            //------------------------------------------------------
            if(localStorage.getItem('collectivite_id') != $(this).children("option:selected").val()){
              localStorage.setItem('collectivite_id', $(this).children("option:selected").val());
            }
            
            $.ajax({
              url: Drupal.url(
                "sites/default/files/datasets/js/documents_pastell_test.json"
              ), 
              dataType: "json", // on spécifie bien que le type de données est en JSON
              type: "GET",
              data: {},
              success: function (donnees) {
                //------------------------------------------------------
                //On cache le block le temps qu'il charge / on affiche le spinner
                //------------------------------------------------------
                
                //------------------------------------------------------
                //On supprime le block pastell pour le regénérer avec les nouvelles infos  
                //------------------------------------------------------

                $( "#pastell_block" ).remove();
                
                if(donnees.length > 0){
                  var document_coll =
                    '\
                    <div class="col-lg-12" id="pastell_block"> \
                    <div class="mb-2 shadow-lg">\
                      <div class="card my-2">\
                        <div class="card-header rounded-top" style="background-color: #1f3889">\
                          <h4 class="card-title text-light">\
                            Télétransmission : Derniers documents : Collectivité n°'+ localStorage.getItem('collectivite_id') +'<span></span>\
                          </h4>\
                        </div>\
                        <div class="card-body">\
                          <table class="table">\
                            <thead>\
                              <tr>\
                                <th scope="col">Titre</th>\
                                <th scope="col">Type</th>\
                                <th scope="col">Dernière modification</th>\
                                <th scope="col">Statut</th>\
                                <th></th>\
                                <th></th>\
                                <th></th>\
                              </tr>\
                            </thead>\
                            <tbody>';

                    for (var i = 0; i < donnees.length; i++) {
                      //------------------------------------------------------
                      //TODO : Voir pour les états des documents 

                      // switch (donnees[i].last_action_display) {
                      //   case "":
                      //     // code block
                      //     break;
                      //   default:
                      //   // code block
                      // }
                      //------------------------------------------------------
                      
                      var objectDate = new Date(donnees[i].last_action_date);

                      // TEMPORAIRE POUR AVOIR QUELQUE CHOSE A MONTRER
                      var badge_color = "bg-success";
                      var last_action = "En Cours de Création";
                      // var badge_color = "bg-success";
                      // var last_action = "En Cours de Création";
                      var lien_pastell_detail = "https://pastelldev.ecollectivites.fr/Document/detail?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e;
                      var lien_pastell_edition = "https://pastelldev.ecollectivites.fr/Document/edition?id_d=" + donnees[i].id_d + "&id_e=" +  donnees[i].id_e;
                      var lien_pastell_supp = "https://pastelldev.ecollectivites.fr/Document/warning?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e + "&action=supression";
                      document_coll += "\
                      <tr>\
                        <td>" + donnees[i].titre +"</td>\
                        <td>" + donnees[i].type +"</td>\
                        <td>" + String(objectDate.getDate()).padStart(2, "0") +
                        "/" +
                        String(objectDate.getMonth() + 1).padStart(2, "0") +
                        "/" +
                        objectDate.getFullYear() +
                        " " +
                        String(objectDate.getHours()).padStart(2, "0") +
                        ":" +
                        String(objectDate.getMinutes()).padStart(2, "0") + '</td>\
                        <td><span class="badge ' +badge_color +'">'+ last_action +'</span></td>\
                        <td><a href="' + lien_pastell_detail +'"><i data-feather="search" class="feather-icon"></i></a></td>\
                        <td><a href="' + lien_pastell_edition +'"><i data-feather="edit" class="feather-icon"></i></a></td>\
                        <td><a href="' + lien_pastell_supp +'"><i data-feather="trash-2" class="feather-icon"></i></a></td>\
                      </tr>\
                      ';
                    }
                    document_coll += "\
                              </tbody>\
                            </table>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                    "
                  }
                  else
                  {
                    var document_coll =
                      '\
                      <div class="col-lg-12" id="pastell_block"> \
                      <div class="mb-2 shadow-lg">\
                        <div class="card my-2">\
                          <div class="card-header rounded-top" style="background-color: #1f3889">\
                            <h4 class="card-title text-light">\
                              Télétransmission : Derniers documents : Collectivité n°'+ localStorage.getItem('collectivite_id') +'<span></span>\
                            </h4>\
                          </div>\
                          <div class="card-body">\
                          <div class="d-flex justify-content-center">\
                            <h3>Aucun Documents Disponible</h3>\
                          </div>\
                          </tbody>\
                              </table>\
                            </div>\
                          </div>\
                        </div>\
                      </div>\
                      '
                  }
                  document.getElementById("pastell_block_id").innerHTML = document_coll;
                  feather.replace();
                
              },
              complete: function () {
                //------------------------------------------------------
                //On affiche le block / on cache le spinner
                //------------------------------------------------------
                $("#spinner-div-pastell").hide();
                $("#pastell_block_id").show(); //Request is complete so hide spinner
              },
            });      
          });  
        }); // fin once
      } // fin exlude admin pages
 
    },
  };
})(jQuery, Drupal, once);
