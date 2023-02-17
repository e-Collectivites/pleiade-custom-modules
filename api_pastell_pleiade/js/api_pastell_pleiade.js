(function ($, Drupal, once) {
  "use strict";
  
  Drupal.behaviors.APIPastellDataBehavior = {
    attach: function (context, settings) {
      // exclude admin pages  
      
      
        if (!drupalSettings.path.currentPath.includes("admin")) {  
          
          once("APIPastellDataBehavior", "body", context).forEach(function () {
           
            var optionValue = localStorage.getItem('collectivite_id');
            document.cookie = 'coll_id=' + optionValue;
            $('#collectiviteChoice').append('<option class="dropdown-item text-uppercase" id="'
            + optionValue + '" selected="selected">' 
            + localStorage.getItem('collectivite_name') + '</option>');
            
            //------------------------------------------------------
            //  Ajout des groupes page utilisateur
            //------------------------------------------------------

            if (drupalSettings.path.currentPath === "user") {
            var pastell_groups_for_user_profile = localStorage.getItem('groups');
            document.getElementById("pastell_group").innerHTML = pastell_groups_for_user_profile.replaceAll(';', ',');
            }

          //------------------------------------------------------
          //Chargement du bloc pastell au chargement initial  
          //------------------------------------------------------
          

          $.ajax({
            url: Drupal.url(
              "api_pastell_pleiade/pastell_document_query"
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
                        <table class="table table-striped" id="tablealldocs">\
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
                    var etat;
                    var titre;
                    var type;


                      var titre_doc = donnees[i].titre;
                      var type_doc = donnees[i].type;
                      var last_etat = donnees[i].last_action_display;
                      switch (titre_doc) {
                        case null:
                        //console.log('NULL');
                        case "":
                          //console.log('vide');
                          titre = 'Aucun titre disponible';
                          break;
                  
                        default: titre = donnees[i].titre;
                      }
                      switch (type_doc) {
                        case 'actes-ecollectivites': type = 'Acte';
                          break;
                  
                        case 'actes-generique': type = 'Acte (Générique)';
                          break;
                  
                        case 'facture-cpp': type = 'Facture Chorus';
                          break;
                  
                        case 'document-a-signer': type = 'Document à faire signer';
                          break;
                  
                        case 'convocation': type = 'Convocation des élus';
                          break;
                  
                        case 'helios-ecollectivites': type = 'Flux Hélios';
                          break;
                  
                        case 'helios-generique': type = 'Flux Hélios (Générique)';
                          break;
                        default: type_doc = donnees[i].type;
                      }
                      switch (last_etat) {
                        case 'creation': etat = '<span class="badge py-2 px-4 bg-secondary">Créé</span>';
                          break;
                  
                        case 'send-ged': etat = '<span class="badge py-2 px-4 bg-success">Versé en GED</span>';
                          break;
                  
                        case 'send-cdg': etat = '<span class="badge py-2 px-4 bg-success">Transmis au CDG</span>';
                          break;
                  
                        case 'termine': etat = '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;
                  
                        case 'info-tdt': etat = '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;
                  
                        case 'reception-partielle': etat = '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;
                  
                        case 'recu-iparapheur': etat = '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;
                  
                        case 'envoi-mail': etat = '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;
                  
                          case 'prepare-tdt': etat = '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;
                  
                        case 'reception': etat = '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;
                  
                        case 'recu-iparapheur-etat': etat = '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;
                  
                        case 'rejet-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Signature refusée</span>';
                          break;
                  
                          case 'remord-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Droit de remord</span>';
                          break;
                  
                        case 'annuler-tdt': etat = '<span class="badge py-2 px-4 bg-danger">Annulé</span>';
                          break;
                  
                        case 'tdt-error': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'erreur-verif-tdt': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'send-tdt-erreur': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'erreur-verif-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Parapheur en erreur</span>';
                          break;

                        case 'modification': etat = '<span class="badge py-2 px-4 bg-primary">En cours de rédaction</span>';
                          break;
                  
                        case 'send-iparapheur': etat = '<span class="badge py-2 px-4 bg-primary">Envoyé au parapheur</span>';
                          break;
                  
                        default: etat = donnees[i].last_action_display;
                      }
                      var lien_pastell_edition = '';
                      var lien_pastell_supp = '';
                      var objectDate = new Date(donnees[i].last_action_date);


                      var lien_pastell_detail = '<a href="https://pastelldev.ecollectivites.fr/Document/detail?id_d=' + donnees[i].id_d + "&id_e=" + donnees[i].id_e + '"><i data-feather="search" class="feather-icon"></i></a>';
                      if(last_etat == 'creation' || last_etat == 'modification'){
                      var lien_pastell_edition = '<a href="https://pastelldev.ecollectivites.fr/Document/edition?id_d=' + donnees[i].id_d + "&id_e=" +  donnees[i].id_e +'"><i data-feather="edit" class="feather-icon"></i></a>';
                      var lien_pastell_supp = '<a href="https://pastelldev.ecollectivites.fr/Document/warning?id_d=' + donnees[i].id_d + "&id_e=" + donnees[i].id_e + '&action=supression"><i data-feather="trash-2" class="feather-icon"></i></a>';
                      }
                    document_coll += "\
                    <tr>\
                      <td>" + titre +"</td>\
                      <td>" + type +"</td>\
                      <td>" + String(objectDate.getDate()).padStart(2, "0") +
                      "/" +
                      String(objectDate.getMonth() + 1).padStart(2, "0") +
                      "/" +
                      objectDate.getFullYear() +
                      " " +
                      String(objectDate.getHours()).padStart(2, "0") +
                      ":" +
                      String(objectDate.getMinutes()).padStart(2, "0") + '</td>\
                      <td>'+ etat +'</td>\
                      <td>' + lien_pastell_detail +'</td>\
                      <td>' + lien_pastell_edition +'</td>\
                      <td>' + lien_pastell_supp +'</td>\
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
              console.log($('#tablealldocs').DataTable(
                {
                  order: [[2, 'desc']],  
                  "paging": true,
                  "language": {
                    "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json"
                  },
                  "responsive": true,
                  "lengthMenu": [[5, 10, 25], [5, 10, 25]],
                }));
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
              localStorage.setItem('collectivite_name', $(this).children("option:selected").text());
              document.cookie = 'coll_id=' + localStorage.getItem('collectivite_id');
            }
            
            $.ajax({
              url: Drupal.url(
                "api_pastell_pleiade/pastell_document_query"
              ), 
              dataType: "json", // on spécifie bien que le type de données est en JSON
              type: "GET",
              data: {},
              success: function (donnees) {

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
                          <table class="table table-striped" id="tablealldocs">\
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
                      var etat;
                      var titre;
                      var type;
                      
                      var titre_doc = donnees[i].titre;
                      var type_doc = donnees[i].type;
                      var last_etat = donnees[i].last_action_display;
                      switch (titre_doc) {
                        case null:
                        //console.log('NULL');
                        case "":
                          //console.log('vide');
                          titre = 'Aucun titre disponible';
                          break;
                  
                        default: titre = donnees[i].titre;;
                      }
                      switch (type_doc) {
                        case 'actes-ecollectivites': type = 'Acte';
                          break;
                  
                        case 'actes-generique': type = 'Acte (Générique)';
                          break;
                  
                        case 'facture-cpp': type = 'Facture Chorus';
                          break;
                  
                        case 'document-a-signer': type = 'Document à faire signer';
                          break;
                  
                        case 'convocation': type = 'Convocation des élus';
                          break;
                  
                        case 'helios-ecollectivites': type = 'Flux Hélios';
                          break;
                  
                        case 'helios-generique': type = 'Flux Hélios (Générique)';
                          break;
                        default: type_doc = donnees[i].type;
                      }
                      switch (last_etat) {
                        case 'creation': etat = '<span class="badge py-2 px-4 bg-secondary">Créé</span>';
                          break;
                  
                        case 'send-ged': etat = '<span class="badge py-2 px-4 bg-success">Versé en GED</span>';
                          break;
                  
                        case 'send-cdg': etat = '<span class="badge py-2 px-4 bg-success">Transmis au CDG</span>';
                          break;
                  
                        case 'termine': etat = '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;
                  
                        case 'info-tdt': etat = '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;
                  
                        case 'reception-partielle': etat = '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;
                  
                        case 'recu-iparapheur': etat = '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;
                  
                        case 'envoi-mail': etat = '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;
                  
                          case 'prepare-tdt': etat = '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;
                  
                        case 'reception': etat = '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;
                  
                        case 'recu-iparapheur-etat': etat = '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;
                  
                        case 'rejet-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Signature refusée</span>';
                          break;
                  
                          case 'remord-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Droit de remord</span>';
                          break;
                  
                        case 'annuler-tdt': etat = '<span class="badge py-2 px-4 bg-danger">Annulé</span>';
                          break;
                  
                        case 'tdt-error': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'erreur-verif-tdt': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'send-tdt-erreur': etat = '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;
                  
                        case 'erreur-verif-iparapheur': etat = '<span class="badge py-2 px-4 bg-danger">Parapheur en erreur</span>';
                          break;

                        case 'modification': etat = '<span class="badge py-2 px-4 bg-primary">En cours de rédaction</span>';
                          break;
                  
                        case 'send-iparapheur': etat = '<span class="badge py-2 px-4 bg-primary">Envoyé au parapheur</span>';
                          break;
                  
                        default: etat = donnees[i].last_action_display;
                      }
                      
                      //------------------------------------------------------
                      var lien_pastell_edition = '';
                      var lien_pastell_supp = '';
                      var objectDate = new Date(donnees[i].last_action_date);


                      var lien_pastell_detail = '<a href="https://pastelldev.ecollectivites.fr/Document/detail?id_d=' + donnees[i].id_d + "&id_e=" + donnees[i].id_e + '"><i data-feather="search" class="feather-icon"></i></a>';
                      if(last_etat == 'creation' || last_etat == 'modification'){
                      var lien_pastell_edition = '<a href="https://pastelldev.ecollectivites.fr/Document/edition?id_d=' + donnees[i].id_d + "&id_e=" +  donnees[i].id_e +'"><i data-feather="edit" class="feather-icon"></i></a>';
                      var lien_pastell_supp = '<a href="https://pastelldev.ecollectivites.fr/Document/warning?id_d=' + donnees[i].id_d + "&id_e=" + donnees[i].id_e + '&action=supression"><i data-feather="trash-2" class="feather-icon"></i></a>';
                      }
                      document_coll += "\
                      <tr>\
                        <td>" + titre +"</td>\
                        <td>" + type +"</td>\
                        <td>" + String(objectDate.getDate()).padStart(2, "0") +
                        "/" +
                        String(objectDate.getMonth() + 1).padStart(2, "0") +
                        "/" +
                        objectDate.getFullYear() +
                        " " +
                        String(objectDate.getHours()).padStart(2, "0") +
                        ":" +
                        String(objectDate.getMinutes()).padStart(2, "0") + '</td>\
                        <td>'+ etat +'</td>\
                        <td>' + lien_pastell_detail +'</td>\
                        <td>' + lien_pastell_edition +'</td>\
                        <td>' + lien_pastell_supp +'</td>\
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
                              Télétransmission : Derniers documents<span></span>\
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
                console.log($('#tablealldocs').DataTable({
                  order: [[2, 'desc']],  
                  "paging": true,
                  "language": {
                    "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json"
                  },
                  "responsive": true,
                  "lengthMenu": [[5, 10, 25], [5, 10, 25]],
                }));
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