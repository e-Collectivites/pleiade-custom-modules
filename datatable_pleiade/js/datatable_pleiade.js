(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.DatatableBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      // if (drupalSettings.path.isFront) {
      setTimeout(function () {
        once("DatatableBehavior", "body", context).forEach(function () {
          // do we have id_e ?
          if (drupalSettings.path.isFront) {
            document.getElementById("document_recent_id").innerHTML =
              drupalSettings.api_lemon_pleiade.spinner;
          }

          // Get the previously selected value from localStorage
          if (localStorage.getItem("collectivite_id")) {
            var previousValue = localStorage.getItem("collectivite_id");
          }

          function reloadDataTable(previousValue) {
            // Now call again document JS module function to get documents

            var xhr = new XMLHttpRequest();
            if (previousValue == undefined) {
              previousValue = ''
            }
            xhr.open("GET",
              Drupal.url("v1/datatable_pleiade/documents_recents?id_e=" + previousValue));

            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {

                var donnees = xhr.response.docs;
                var ErrorActeCounts = 0, ErrorHeliosCounts = 0, ErrorConvocCounts = 0, ErrorDocsCounts = 0, etat, titre, type;
                if (donnees != 0 || donnees != 'null') {
                  var document_coll =
                    '\
                      <div class="col-lg-12" id="pastell_block"> \
                      <div class="mb-2">\
                        <div class="card">\
                          <div class="card-header rounded-top bg-white rounded-top">\
                            <h4 class="card-title text-dark py-2">\
                              Activités récentes<span></span>\
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
                                  <th scope="col">Actions</th>\
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
                        '"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>';
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
                                <td><div class='d-flex justify-content-around align-items-center'>" +
                        lien_nc_detail +
                        "</div></td>\
                                </tr>\
                              ";


                      document_coll += document_row;
                    } else if (donnees[i].type !== "Nextcloud") {
                      console.log(donnees[i])
                      //TODO voir pour les différents états des documents
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
                      switch (last_etat) {
                        case "creation":
                          etat =
                            '<span class="badge py-2 px-4 bg-white text-dark">Créé</span>';
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

                        case "document-transmis-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-success">Transmis au TDT</span>';
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

                        case "etat_ack=Acquittement+KO":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Un fichier de reponse PES est disponible</span>';
                          if (donnees[i].last_type.includes("helios")) {
                            ErrorHeliosCounts++;
                          }
                          break;
                        case "rejet-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Signature refusée</span>';
                          if (donnees[i].last_type.includes("helios")) {
                            ErrorHeliosCounts++;
                          }
                          else if (donnees[i].last_type.includes("convocation")) {
                            ErrorConvocCounts++;
                          }
                          if (donnees[i].last_type == "document-a-signer") {
                            ErrorDocsCounts++;
                          }
                          break;
                        case "error-ged":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur irrécupérable lors du dépôt</span>';
                          if (donnees[i].last_type == "document-a-signer") {
                            ErrorDocsCounts++;
                          }
                          break;

                        case "remord-iparapheur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger">Droit de remord</span>';
                          break;

                        case "annuler-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-secondary">Annulé</span>';
                          break;

                        case "tdt-error":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur sur le TdT</span>';
                          if (donnees[i].last_type.includes("helios")) {
                            ErrorHeliosCounts++;
                          }
                          else if (donnees[i].last_type.includes("actes")) {
                            ErrorActeCounts++;
                          }
                          break;

                        case "erreur-verif-tdt":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de la vérification du statut de l\'acte </span>';
                          if (donnees[i].last_type.includes("actes")) {
                            ErrorActeCounts++;
                          }
                          break;

                        case "send-tdt-erreur":
                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de l\'envoi des données au TdT</span>';
                          if (donnees[i].last_type.includes("actes")) {
                            ErrorActeCounts++;
                          }
                          break;

                        case "erreur-verif-iparapheur":

                          etat =
                            '<span class="badge py-2 px-4 bg-danger"><div class="hidden">Erreur</div>Erreur lors de la vérification du statut de signature</span>';
                          if (donnees[i].last_type.includes("convocation")) {
                            ErrorConvocCounts++;
                          }
                          if (donnees[i].last_type == "document-a-signer") {

                            ErrorDocsCounts++;
                          }
                          if (donnees[i].last_type.includes("actes")) {
                            ErrorActeCounts++;
                          }
                          if (donnees[i].last_type.includes("helios")) {
                            ErrorHeliosCounts++;
                          }
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
                          etat = '<span class="badge py-2 px-4 bg-secondary">' + last_etat + '</span>';
                      }

                      var lien_pastell_edition = "";
                      var lien_pastell_supp = "";
                      var objectDate = donnees[i].last_action_date
                      var pastell_url = drupalSettings.api_pastell_pleiade.field_pastell_url;
                      var lien_pastell_detail =
                        '<a target="_blank" href="' +
                        pastell_url +
                        "Document/detail?id_d=" +
                        donnees[i].id_d +
                        "&id_e=" +
                        donnees[i].id_e +
                        '"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>';
                      if (
                        last_etat == "creation" ||
                        last_etat == "modification"
                      ) {
                        var lien_pastell_edition =
                          '<a class="d-flex" target="_blank" href="' +
                          pastell_url +
                          "Document/edition?id_d=" +
                          donnees[i].id_d +
                          "&id_e=" +
                          donnees[i].id_e +
                          '"><i class="fa fa-2x fa-pencil-square" aria-hidden="true"></i></a>';
                        var lien_pastell_supp =
                          '<a target="_blank" href="' +
                          pastell_url +
                          "Document/warning?id_d=" +
                          donnees[i].id_d +
                          "&id_e=" +
                          donnees[i].id_e +
                          '&action=supression"><i class="fa fa-2x fa-trash" aria-hidden="true"></i></a>';
                      }
                      document_coll +=
                        "\
                          <tr>\
                            <td>" +
                        titre +
                        "</td>\
                            <td>" +
                        type_doc +
                        "</td>\
                            <td>" +
                        objectDate +
                        "</td>\
                            <td>" +
                        etat +
                        "</td>\
                            <td><div class='d-flex justify-content-around align-items-center'>" +
                        lien_pastell_detail +
                        lien_pastell_edition +
                        lien_pastell_supp +
                        "</div></td>\
                                </tr>\
                          ";
                    }
                  }
                  var TotalErrors = ErrorActeCounts + ErrorHeliosCounts + ErrorConvocCounts + ErrorDocsCounts
                  var Errors = { TotalErrors, ErrorActeCounts, ErrorHeliosCounts, ErrorConvocCounts, ErrorDocsCounts }
                  localStorage.setItem('errors', JSON.stringify(Errors))
                  document_coll +=
                    '\
                              </tbody>\
                              <tfoot>\
                                <tr>\
                                  <th scope="col">Titre</th>\
                                  <th scope="col">Type</th>\
                                  <th scope="col">Dernière modification</th>\
                                  <th scope="col">Statut</th>\
                                  <th scope="col">Actions</th>\
                                  </tr>\
                              </tfoot>\
                            </table>\
                          </div>\
                        </div>\
                      </div>\
                    </div>\
                    ';

                  if (drupalSettings.path.isFront) {
                    document.getElementById("document_recent_id").innerHTML =
                      document_coll;
                  }
                }
                else {

                  document_coll = '';
                  if (drupalSettings.path.isFront) {
                    document.getElementById("document_recent_id").innerHTML =
                      document_coll;
                  }
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
              // Datatables effect on doc list
              var table = $("#tablealldocs").DataTable({
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
                  { data: "actions" }
                ],
                aoColumnDefs: [
                  { bSortable: false, aTargets: 4 },
                  { width: "13%", targets: 4 },
                  { width: "20%", targets: 3 },
                  { width: "22%", targets: 2 },
                  { width: "20%", targets: 1 },
                  { width: "25%", targets: 0 },
                ],
                order: [[2, "desc"]],
                paging: false,
                scrollY: 320,
                // scrollCollapse: true,
                language: {
                  url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json",
                  search: "_INPUT_",
                  searchPlaceholder: "Rechercher...",
                  emptyTable: 'Erreur lors de la récupération des documents, veuillez vérifier l\'entitée sur laquelle vous êtes, à défaut, contacter l\'administrateur système'

                },
                responsive: true,
                lengthMenu: [
                  [5, 10, 25],
                  [5, 10, 25],
                ],

              });
              if (drupalSettings.path.isFront) {
                var pastille_signature_electronique = document.getElementById('pastille_signature_electronique')
                if (pastille_signature_electronique) {
                  pastille_signature_electronique.addEventListener("click", function () {
                    table.search('Document à faire signer Erreur', true, true).draw();
                    table.column(1).search("Document à faire signer", true, false).draw();
                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }
                var pastille_actes = document.getElementById('pastille_actes')
                if (pastille_actes) {
                  pastille_actes.addEventListener("click", function () {
                    table.search('Actes Erreur', true, true).draw();
                    table.column(1).search("Actes", true, false).draw();
                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }
                var pastille_flux_financier = document.getElementById('pastille_flux_financier')
                if (pastille_flux_financier) {
                  pastille_flux_financier.addEventListener("click", function () {
                    // table.search('Helios Erreur').draw();
                    table.search("Erreur", true, true).draw();
                    table.column(1).search("Helios|Facture Chorus Pro", true, false).draw();
                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });

                  });
                }
                var pastille_convocations = document.getElementById('pastille_convocations')
                if (pastille_convocations) {
                  pastille_convocations.addEventListener("click", function () {
                    table.search('Convocation Erreur').draw();
                    table.column(1).search("Convocation", true, false).draw();

                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }
                var pastille_eadministration = document.querySelector('.pastille_eadministration')
                if (pastille_eadministration) {
                  pastille_eadministration.addEventListener("click", function () {
                    table.search('Erreur').draw();
                    table.column(1).search("Convocation|Helios|Facture Chorus Pro|Actes|Document à faire signer", true, false).draw();

                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }




                var lienVoirActes = document.querySelector("#voir_actes");
                if (lienVoirActes) {
                  lienVoirActes.addEventListener("click", function () {
                    table.search('Actes', true, true).draw();
                    table.column(1).search("Actes", true, false).draw();

                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });

                  });
                }
                var lienVoirConvocations = document.querySelector("#voir_convocs");
                if (lienVoirConvocations) {
                  lienVoirConvocations.addEventListener("click", function () {
                    table.search('Convocation').draw();
                    table.column(1).search("Convocation", true, false).draw();
                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }

                var lienVoirHelios = document.querySelector("#voir_helios");
                if (lienVoirHelios) {
                  lienVoirHelios.addEventListener("click", function () {
                    table.search('Helios').draw();
                    table.column(1).search("Helios", true, true).draw();
                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }

                var lienVoirDocument = document.querySelector("#voir_docs");
                if (lienVoirDocument) {
                  lienVoirDocument.addEventListener("click", function () {
                    table.search('Document à faire signer').draw();
                    table.column(1).search("Document à faire signer", true, false).draw();

                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }
                var lienVoirDocument = document.querySelector("#voir_chorus_pro");
                if (lienVoirDocument) {
                  lienVoirDocument.addEventListener("click", function () {
                    table.search('Facture Chorus Pro').draw();
                    table.column(1).search("Facture Chorus Pro", true, true).draw();

                    var offsetTop = document.querySelector("#document_recent_id").offsetTop;
                    window.scrollTo({ top: offsetTop - 80, behavior: 'smooth' });
                  });
                }
              }
              var errors = localStorage.getItem('errors');
              errors = JSON.parse(errors);
              var addBadges = document.querySelector(".fa-people-arrows");

              var eadministration = document.querySelector(".eadministration");
              var actes = document.getElementById("actes");
              var convocations = document.getElementById("convocations");
              var signature_electronique = document.getElementById("signature_electronique");
              var flux_financier = document.getElementById("flux_financier");

              // Récupération des compteurs d'erreurs
              var TotalErrors = errors.TotalErrors;
              var ErrorActeCounts = errors.ErrorActeCounts;
              var ErrorHeliosCounts = errors.ErrorHeliosCounts;
              var ErrorConvocCounts = errors.ErrorConvocCounts;
              var ErrorDocsCounts = errors.ErrorDocsCounts;

              // Création des divs avec les compteurs d'erreurs
              var totalErrorsDiv = createErrorBadge("TotalErrors", TotalErrors, "Nombre d'erreurs Pastell");
              var errorActeDiv = createErrorBadge("ErrorActeCounts", ErrorActeCounts, "Nombre d'erreurs sur les actes");
              var errorHeliosDiv = createErrorBadge("ErrorHeliosCounts", ErrorHeliosCounts, "Nombre d'erreurs sur les flux Hélios");
              var errorConvocDiv = createErrorBadge("ErrorConvocCounts", ErrorConvocCounts, "Nombre d'erreurs sur les convocations");
              var errorDocsDiv = createErrorBadge("ErrorDocsCounts", ErrorDocsCounts, "Nombre d'erreurs sur les documents à faire signer");

              // Ajout des divs à la suite d'une div spécifique avec un ID
              var eadministration = document.querySelector(".pastille_eadministration");
              var actes = document.getElementById("pastille_actes");
              var convocations = document.getElementById("pastille_convocations");
              var signature_electronique = document.getElementById("pastille_signature_electronique");
              var flux_financier = document.getElementById("pastille_flux_financier");

              eadministration.innerHTML = '';
              actes.innerHTML = '';
              convocations.innerHTML = '';
              signature_electronique.innerHTML = '';
              flux_financier.innerHTML = '';
              addBadges.innerHTML = '';

              if (TotalErrors > 0) {
                addBadges.innerHTML = '<span class="position-absolute start-75 translate-middle badge rounded-pill bg-danger error_' + TotalErrors + '">' + TotalErrors + '</span>'
                eadministration.appendChild(totalErrorsDiv);
                if (ErrorActeCounts > 0) {
                  actes.appendChild(errorActeDiv);
                }
                if (ErrorHeliosCounts > 0) {
                  flux_financier.appendChild(errorHeliosDiv);
                }
                if (ErrorConvocCounts > 0) {
                  convocations.appendChild(errorConvocDiv);
                }
                if (ErrorDocsCounts > 0) {
                  signature_electronique.appendChild(errorDocsDiv);
                }

              }
              function createErrorBadge(label, count, title) {
                if (drupalSettings.path.isFront) {
                  var errorDiv = document.createElement("div");
                  errorDiv.classList.add("pastille"); // Ajouter une classe CSS pour styliser la pastille
                  errorDiv.textContent = count;
                  errorDiv.setAttribute("data-label", label);
                  // Attribuer une étiquette pour une identification future
                  return errorDiv;
                }
                else {
                  var errorLink = document.createElement("a");
                  errorLink.classList.add("error-link"); // Ajouter une classe CSS pour styliser le lien
                  errorLink.classList.add("pastille");
                  // Switch case pour déterminer l'URL en fonction du label
                  var url;
                  switch (label) {
                    case "TotalErrors":
                      url = "/node?goToDatatable=true&type=all&pastille=true";
                      break;
                    case "ErrorActeCounts":
                      url = "/node?goToDatatable=true&type=acte&pastille=true";
                      break;
                    case "ErrorHeliosCounts":
                      url = "/node?goToDatatable=true&type=helios&pastille=true";
                      break;
                    case "ErrorConvocCounts":
                      url = "/node?goToDatatable=true&type=convoc&pastille=true";
                      break;
                    case "ErrorDocsCounts":
                      url = "/node?goToDatatable=true&type=parapheur&pastille=true";
                      break;
                    default:
                      url = "#"; // URL par défaut si le label n'est pas reconnu
                      break;
                  }
                  errorLink.setAttribute("target", "_blank");
                  errorLink.href = url; // Définir l'URL du lien
                  errorLink.title = title; // Définir le titre du lien
                  errorLink.textContent = count; // Contenu du lien

                  return errorLink;
                }
              }

              if (!drupalSettings.path.isFront) {
              // Sélectionnez toutes les pastilles
                var pastilles = document.querySelectorAll('.pastille');

                // Parcourez toutes les pastilles et ajoutez un gestionnaire d'événements clic à chacune
                pastilles.forEach(function(pastille) {
                  
                    pastille.addEventListener('click', function(event) {
                        window.location.href = pastille.href;
                    });
                });
              }


              var urlParams = new URLSearchParams(window.location.search);
              // console.log(urlParams)
              if (urlParams.has('goToDatatable') && urlParams.get('goToDatatable') === 'true') {
                // Récupérer la division cible
                var targetDiv = document.getElementById("document_recent_id").offsetTop;
                if (targetDiv) {
                  window.scrollTo({ top: targetDiv - 80, behavior: 'smooth' });
                } else {
                  console.error("La div avec l'ID 'field-url-application-values' n'a pas été trouvée.");
                }
              }
              if (urlParams.has('pastille') && urlParams.get('pastille') == 'true') {
                var type = urlParams.get('type')
                switch (type) {
                  case 'acte':
                    table.search('Actes Erreur', true, true).draw();
                    table.column(1).search("Actes", true, false).draw();
                    break;
                  case 'convoc':
                    table.search('Convocation Erreur').draw();
                    table.column(1).search("Convocation", true, false).draw();
                    break;
                  case 'helios':
                    table.search("Erreur", true, true).draw();
                    table.column(1).search("Helios|Facture Chorus Pro", true, false).draw();
                    break;

                  case 'parapheur':
                    table.search('Document à faire signer Erreur', true, true).draw();
                    table.column(1).search("Document à faire signer", true, false).draw();
                    break;
                  case 'all':
                    table.search('Erreur').draw();
                  table.column(1).search("Convocation|Helios|Facture Chorus Pro|Actes|Document à faire signer", true, false).draw();
                    break;
                  default:
                    break;
                }
              }
              else
                if (urlParams.has('type') && urlParams.get('type') !== '') {
                  var type = urlParams.get('type')
                  switch (type) {
                    case 'acte':
                      table.search('Actes').draw();
                      break;
                    case 'convoc':
                      table.search('Convocation').draw();
                      break;
                    case 'helios':
                      table.search('Helios').draw();
                      break;
                    case 'chorus':
                      table.search('Facture Chorus Pro').draw();
                      break;
                    case 'parapheur':
                      table.search('Document à faire signer').draw();
                      break;
                    default:
                      break;
                  }
                }



            };
            xhr.send();
          }
          if (localStorage.getItem("collectivite_id") == 'null') {
            previousValue = 0
          }
          // Reload datatable with the previous value
          if (document.getElementById('collectiviteChoice')) {
            reloadDataTable(previousValue);

            // Listen for changes on the select form
            document.addEventListener("input", function (event) {
              if (event.target.id !== 'collectiviteChoice') return;

              // console.log('Optionvalue : ' + document.getElementById('collectiviteChoice').value);
              localStorage.setItem("collectivite_id", event.target.value);
              // Reload datatable with the new value
              reloadDataTable(event.target.value);
            });
          }
          else {
            reloadDataTable()
          }

        }); // end once
        if (drupalSettings.path.isFront) {
          new Sortable(areaSortable, {
            animation: 150,
            ghostClass: 'blue-background-class'
          });
        }
      }, 3000);


    },

  };
})(Drupal, jQuery, drupalSettings);
