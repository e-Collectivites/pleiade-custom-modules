(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.DatatableBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (drupalSettings.path.isFront) {
        once("DatatableBehavior", "body", context).forEach(function () {
          // do we have id_e ?
          // console.log('id_e call : ' + id_e);
          // show spinner while ajax is loading
          var userGroupsTempstore =
            drupalSettings.api_lemon_pleiade.user_groups;
          document.getElementById("document_recent_id").innerHTML =
            drupalSettings.api_lemon_pleiade.spinner;
          // console.log('Pastell Documents target function called...');
          // console.log('Retrieve localStorage collectivite id : '+localStorage.getItem('collectivite_id'));

          // Get the previously selected value from localStorage
          if(localStorage.getItem("collectivite_id")){
            var previousValue = localStorage.getItem("collectivite_id");
          }
          else
          {
            var previousValue = null
          }
          

          // debug
          function reloadDataTable(previousValue) {
            // Now call again document JS module function to get documents
            var xhr = new XMLHttpRequest();
            // Pass collectivite ID to our PHP endpoint as a param as server side, it can not access cookie set on client side 
            xhr.open(
              "GET",
              Drupal.url(
                "v1/datatable_pleiade/documents_recents?id_e=" + previousValue
              )
            );
            // Pastell pas en UTF8 :/
            // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = xhr.response;
                // debug
                console.log(donnees);
                if (donnees) {
                  var document_coll =
                    '\
                <div class="col-lg-12" id="pastell_block"> \
                <div class="mb-2 shadow-sm">\
                  <div class="card mb-2">\
                    <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                      <h4 class="card-title text-dark py-2">\
                        Documents récents <span></span>\
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
                            </tr>\
                        </thead>\
                        <tbody>';
                  for (var i = 0; i < donnees.length; i++) {
                    if (
                      donnees[i].type === "Nextcloud" &&
                      donnees[i].titre &&
                      donnees[i].creation &&
                      donnees[i].status &&
                      donnees[i].fileUrl
                    ) {
                      var titre = donnees[i].titre;
                      var type = "Nextcloud"; // Assuming 'Nextcloud' is the type for this item
                      var objectDate = donnees[i].creation;

                      // Split the input string into date and time parts
                      const [datePart, timePart] = objectDate.split(" ");

                      // Split the date part into day, month, and year
                      const [day, month, year] = datePart.split("/");

                      // Split the time part into hours and minutes
                      const [hours, minutes] = timePart.split(":");

                      // Create a new Date object using the extracted values
                      const dateObj = new Date(
                        year,
                        month - 1,
                        day,
                        hours,
                        minutes
                      );

                      // Format the date object to the desired format: "YYYY-MM-DD HH:mm:ss"
                      const formattedDate = `${dateObj.getFullYear()}-${(
                        dateObj.getMonth() + 1
                      )
                        .toString()
                        .padStart(2, "0")}-${dateObj
                        .getDate()
                        .toString()
                        .padStart(2, "0")} ${dateObj
                        .getHours()
                        .toString()
                        .padStart(2, "0")}:${dateObj
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}:${dateObj
                        .getSeconds()
                        .toString()
                        .padStart(2, "0")}`;

                      var etat =
                        '<span class="badge py-2 px-4 bg-primary">' +
                        donnees[i].status +
                        "</span>";
                      var lien_nc_detail =
                        '<a target="_blank" href="' +
                        donnees[i].fileUrl +
                        '"><i data-feather="search" class="feather-icon"></i></a>';
                      var document_row =
                        "\
                              <tr>\
                                <td>" +
                        titre +
                        "</td>\
                                <td>" +
                        type +
                        "</td>\
                                <td>" +
                        formattedDate +
                        "</td>\
                                <td>" +
                        etat +
                        "</td>\
                                <td><div class='btn-group dropend'>\
                                  <button type='button' class='btn dropdown-toggle' data-bs-toggle='dropdown' aria-expanded='false'>\
                                  <i data-feather='more-horizontal' class='feather-icon' id='dropdown-icon'></i>\
                                  </button>\
                                  <ul class='dropdown-menu'>\
                                  " +
                        lien_nc_detail +
                        "</ul>\
                                </div></td>\
                                </tr>\
                              ";

                      document_coll += document_row;
                    } else if (donnees[i].type !== "Nextcloud") {
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
                          titre = "Sans titre";
                          break;

                        default:
                          titre = donnees[i].titre;
                      }
                      switch (type_doc) {
                        case "actes-ecollectivites":
                          type = "Acte";
                          break;

                        case "actes-generique":
                          type = "Acte (Générique)";
                          break;

                        case "facture-cpp":
                          type = "Facture Chorus";
                          break;

                        case "document-a-signer":
                          type = "Document à faire signer";
                          break;

                        case "convocation":
                          type = "Convocation des élus";
                          break;

                        case "helios-ecollectivites":
                          type = "Flux Hélios";
                          break;

                        case "helios-generique":
                          type = "Flux Hélios (Générique)";
                          break;
                        default:
                          type_doc = donnees[i].type;
                      }
                      switch (last_etat) {
                        case "creation":
                          etat =
                            '<span class="badge py-2 px-4 bg-secondary">Créé</span>';
                          break;

                        case "send-ged":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Versé en GED</span>';
                          break;

                        case "send-cdg":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Transmis au CDG</span>';
                          break;

                        case "termine":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;

                        case "info-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Terminé</span>';
                          break;

                        case "acquiter-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Acquité</span>';
                          break;

                        case "reception-partielle":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;

                        case "recu-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;

                        case "envoi-mail":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;

                        case "envoi":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;

                        case "prepare-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">En cours d\'envoi</span>';
                          break;

                        case "reception":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">Envoyé</span>';
                          break;

                        case "recu-iparapheur-etat":
                          etat =
                            '<span class="badge py-2 px-4 bg-warning">Signature récupérée</span>';
                          break;

                        case "rejet-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Signature refusée</span>';
                          break;

                        case "remord-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Droit de remord</span>';
                          break;

                        case "annuler-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Annulé</span>';
                          break;

                        case "tdt-error":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;

                        case "erreur-verif-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;

                        case "send-tdt-erreur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Erreur du tiers de télétransmission</span>';
                          break;

                        case "erreur-verif-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Parapheur en erreur</span>';
                          break;

                        case "annulation-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Annulé</span>';
                          break;

                        case "fatal-error":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Erreur</span>';
                          break;

                        case "modification":
                          etat =
                            '<span class="badge py-2 px-4 bg-primary">En cours de rédaction</span>';
                          break;

                        case "send-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-primary">Envoyé au parapheur</span>';
                          break;

                        default:
                          etat = donnees[i].last_action_display;
                      }

                      var lien_pastell_edition = "";
                      var lien_pastell_supp = "";
                      var objectDate = donnees[i].last_action_date;

                      var pastell_url =
                        drupalSettings.api_pastell_pleiade.field_pastell_url;
                      var lien_pastell_detail =
                        '<a target="_blank" href="' +
                        pastell_url +
                        "Document/detail?id_d=" +
                        donnees[i].id_d +
                        "&id_e=" +
                        donnees[i].id_e +
                        '"><i data-feather="search" class="feather-icon"></i></a>';
                      if (
                        last_etat == "creation" ||
                        last_etat == "modification"
                      ) {
                        var lien_pastell_edition =
                          '<a  target="_blank" href="' +
                          pastell_url +
                          "Document/edition?id_d=" +
                          donnees[i].id_d +
                          "&id_e=" +
                          donnees[i].id_e +
                          '"><i data-feather="edit" class="feather-icon"></i></a>';
                        var lien_pastell_supp =
                          '<a target="_blank" href="' +
                          pastell_url +
                          "Document/warning?id_d=" +
                          donnees[i].id_d +
                          "&id_e=" +
                          donnees[i].id_e +
                          '&action=supression"><i data-feather="trash-2" class="feather-icon"></i></a>';
                      }
                      document_coll +=
                        "\
                          <tr>\
                            <td>" +
                        titre +
                        "</td>\
                            <td>" +
                        type +
                        "</td>\
                            <td>" +
                        objectDate +
                        "</td>\
                            <td>" +
                        etat +
                        "</td>\
                            <td><div class='btn-group dropend'>\
                                  <button type='button' class='btn dropdown-toggle' data-bs-toggle='dropdown' aria-expanded='false'>\
                                  <i data-feather='more-horizontal' class='feather-icon' id='dropdown-icon'></i>\
                                  </button>\
                                  <ul class='dropdown-menu'>\
                                  " +
                        lien_pastell_detail +
                        "\
                                  " +
                        lien_pastell_edition +
                        "\
                                  " +
                        lien_pastell_supp +
                        "\
                                  </ul>\
                                </div></td>\
                                </tr>\
                          ";
                    }
                  }
                  document_coll +=
                    "\
                        </tbody>\
                      </table>\
                    </div>\
                  </div>\
                </div>\
              </div>\
              ";
                  document.getElementById("document_recent_id").innerHTML =
                    document_coll;
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
              // feather icon for doc links
              feather.replace();
              // Datatables effect on doc list
              $("#tablealldocs").DataTable({
                columns: [
                  { data: "titre" },
                  { data: "type" },
                  {
                    data: "objectDate",
                    render: function (data, type) {
                      return type === "sort"
                        ? data
                        : moment(data).format("DD/MM/YYYY HH:mm");
                    },
                  },
                  { data: "etat" },
                ],

                aoColumnDefs: [
                  { bSortable: false, aTargets: [4] },
                  { width: "20%", targets: 3 },
                  { width: "22%", targets: 2 },
                  { width: "25%", targets: 1 },
                  { width: "25%", targets: 0 },
                ],
                order: [[2, "desc"]],
                paging: true,
                language: {
                  url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json",
                },
                responsive: true,
                lengthMenu: [
                  [5, 10, 25],
                  [5, 10, 25],
                ],
              });
            };

            xhr.send();
          }

          // Check if the current value is the same as the previous value
          
            // Reload datatable with the previous value
            reloadDataTable(previousValue);
          
          // Listen for changes on the select form
          document.addEventListener("input", function (event) {
            // console.log('Optionvalue : ' + document.getElementById('collectiviteChoice').value);
            localStorage.setItem("collectivite_id", event.target.value);
            // Reload datatable with the new value
            reloadDataTable(event.target.value);
          });
        }); // end once
      }
    },
  };
})(Drupal, jQuery, drupalSettings);
