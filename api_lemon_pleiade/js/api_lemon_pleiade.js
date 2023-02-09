(function ($, Drupal, once) {
  "use strict";

  Drupal.behaviors.APIlemonDataBehavior = {
    attach: function (context, settings) {
      // exclude admin pages
      if (!drupalSettings.path.currentPath.includes("admin")) {
        once("APIlemonDataBehavior", "body", context).forEach(function () {
          
          //------------------------------------------------------
          //Requete pour récupérer les collectivités du user actif
          //------------------------------------------------------

          $.ajax({
            url: Drupal.url("modules/custom/api_lemon_pleiade/js/tempo.json"), // on appelle l'API de notre module LemonDataApiManager.php
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "GET",
            data: {},
            success: function (donnees) {
              // console.log(donnees)
              var linkEntitie = "";

              for (var i = 0; i < donnees.length; i++) {
                linkEntitie +=
                  '<option class="dropdown-item" value="' +
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
          //Changement de la collectivité au clic 
          //------------------------------------------------------
          
          if(!localStorage.getItem('collectivite_id')){
            var id_collectivite = $(this).children("option:selected").val();
          }
          else{
            id_collectivite = localStorage.getItem('collectivite_id');
            
            document.getElementById('collectiviteChoice').options[localStorage.getItem('collectivite_id')].selected = true;
          }
          $("select.collectivitechoiceli").change(function(){
            if(localStorage.getItem('collectivite_id') != $(this).children("option:selected").val()){
              localStorage.setItem('collectivite_id', $(this).children("option:selected").val());
            }
            $.ajax({
              url: Drupal.url(
                "modules/custom/api_lemon_pleiade/js/document_tempo.json"
              ), // on appelle l'API de notre module LemonDataApiManager.php
              dataType: "json", // on spécifie bien que le type de données est en JSON
              type: "GET",
              data: {},
              success: function (donnees) {
                // console.log(donnees)
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
                    document.getElementById("blocLemonCustom").innerHTML += document_coll;
                    feather.replace();
              },
          });
          
         
            
            
            
            
              
        });








          
          // $("ul.collectivitechoiceli", context).on("click", function (event) {
            
          //   var id_collectivite = event.target.id;
          //   var nb_id_coll = id_collectivite.replace(/[^\d]/g, "").replace(/[_\s]/g, "");
            
          //   $.ajax({
          //     url: Drupal.url(
          //       "modules/custom/api_lemon_pleiade/js/document_tempo.json"
          //     ), // on appelle l'API de notre module LemonDataApiManager.php
          //     dataType: "json", // on spécifie bien que le type de données est en JSON
          //     type: "GET",
          //     data: {},
          //     success: function (donnees) {
          //       // console.log(donnees)
          //       $( "#pastell_block" ).remove();
          //       //--------------------------------------//
          //       //Temporaire
          //       if ((nb_id_coll == 24)) {
          //       //--------------------------------------//
          //         localStorage.setItem('collectivite_id', nb_id_coll);
          //         var document_coll =
          //           '\
          //           <div class="col-lg-12" id="pastell_block"> \
          //           <div class="mb-2 shadow-lg">\
          //             <div class="card my-2">\
          //               <div class="card-header rounded-top" style="background-color: #1f3889">\
          //                 <h4 class="card-title text-light">\
          //                   Télétransmission : Derniers documents <span></span>\
          //                 </h4>\
          //               </div>\
          //               <div class="card-body">\
          //                 <table class="table">\
          //                   <thead>\
          //                     <tr>\
          //                       <th scope="col">Titre</th>\
          //                       <th scope="col">Type</th>\
          //                       <th scope="col">Dernière modification</th>\
          //                       <th scope="col">Statut</th>\
          //                       <th></th>\
          //                       <th></th>\
          //                       <th></th>\
          //                     </tr>\
          //                   </thead>\
          //                   <tbody>';

          //           for (var i = 0; i < donnees.length; i++) {
          //             //TODO voir pour les différents états des documents
          //             // switch (donnees[i].last_action_display) {
          //             //   case "":
          //             //     // code block
          //             //     break;
          //             //   default:
          //             //   // code block
          //             // }
          //             var objectDate = new Date(donnees[i].last_action_date);

          //             console.log(objectDate);
          //             var badge_color = "bg-success";
          //             var last_action = "En Cours de Création";
          //             var lien_pastell_detail = "https://pastelldev.ecollectivites.fr/Document/detail?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e;
          //             var lien_pastell_edition = "https://pastelldev.ecollectivites.fr/Document/edition?id_d=" + donnees[i].id_d + "&id_e=" +  donnees[i].id_e;
          //             var lien_pastell_supp = "https://pastelldev.ecollectivites.fr/Document/warning?id_d=" + donnees[i].id_d + "&id_e=" + donnees[i].id_e + "&action=supression";
          //             document_coll += "\
          //             <tr>\
          //               <td>" + donnees[i].titre +"</td>\
          //               <td>" + donnees[i].type +"</td>\
          //               <td>" + String(objectDate.getDate()).padStart(2, "0") +
          //               "/" +
          //               String(objectDate.getMonth() + 1).padStart(2, "0") +
          //               "/" +
          //               objectDate.getFullYear() +
          //               " " +
          //               String(objectDate.getHours()).padStart(2, "0") +
          //               ":" +
          //               String(objectDate.getMinutes()).padStart(2, "0") + '</td>\
          //               <td><span class="badge ' +badge_color +'">'+ last_action +'</span></td>\
          //               <td><a href="' + lien_pastell_detail +'"><i data-feather="search" class="feather-icon"></i></a></td>\
          //               <td><a href="' + lien_pastell_edition +'"><i data-feather="edit" class="feather-icon"></i></a></td>\
          //               <td><a href="' + lien_pastell_supp +'"><i data-feather="trash-2" class="feather-icon"></i></a></td>\
          //             </tr>\
          //             ';
          //           }
          //           document_coll += "\
          //                     </tbody>\
          //                   </table>\
          //                 </div>\
          //               </div>\
          //             </div>\
          //           </div>\
          //           "
          //           document.getElementById("blocLemonCustom").innerHTML += document_coll;
          //           feather.replace();

                    
          //       }

          //       else {
          //         $( "#pastell_block" ).remove();
          //       }
          //     },
          //   });
          // });
          
        }); // fin once
      } // fin exlude admin pages
    },
  };
})(jQuery, Drupal, once);
