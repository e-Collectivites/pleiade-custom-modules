(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.GLPIBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_glpi_pleiade.glpi_url
      ) {
        once("DatatableBehavior", "body", context).forEach(function () {
          document.getElementById("glpi_tickets_id").innerHTML =
            drupalSettings.api_lemon_pleiade.spinner;
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets"));
          xhr.responseType = "json";

          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response; // Assurez-vous que xhr.response contient un tableau d'objets "donnees"
              var blocGLPI = "";

              function formatDate(inputDate) {
                const dateParts = inputDate.split(" ");
                const datePart = dateParts[0];
                const timePart = dateParts[1];
                const dateElements = datePart.split("-");
                const day = dateElements[2];
                const month = dateElements[1];
                const year = dateElements[0];
                const timeElements = timePart.split(":");
                const hours = timeElements[0];
                const minutes = timeElements[1];

                return `${day}/${month}/${year} ${hours}:${minutes}`;
              }

              if (donnees) {
	var userMail = donnees.usermail
                var blocGLPI =
                  '\
                  <div class="col-lg-12" id="glpi_desktop_block"> \
                  <div class="mb-2 shadow-sm">\
                    <div class="card mb-2">\
                      <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                        <h4 class="card-title text-dark py-2">\
                          Mes derniers tickets GLPI <span></span>\
                        </h4>\
                      </div>\
                      <div class="card-body">\
                        <table class="table table-striped" id="glpi_table">\
                          <thead>\
                            <tr>\
                            <th scope="col">Nom du ticket</th>\
                            <th scope="col">Statut</th>\
                            <th scope="col">Date d\'ouverture</th>\
                            <th scope="col">Dernière modification</th>\
                            <th scope="col">Urgence</th>\
                            <th scope="col">Priorité</th>\
			   <th scope="col">Je suis</th>\
                            <th></th>\
                            </tr>\
                          </thead>\
                          <tbody>';
	for (var i = 0; i < Object.keys(donnees).length - 1 && i < 10; i++) {
		
	 var titre, statut, open_date, modif_date, id_demandeur, urgence, priorite, url_ticket, prioriteText, urgenceText, statutText
var statu_actor = [];	

var titre = donnees[i] && donnees[i].name ? donnees[i].name : "Titre manquant";
var statut = donnees[i] && donnees[i].status ? donnees[i].status : "Statut manquant";
var open_date = donnees[i] && donnees[i].date ? donnees[i].date : "Date d'ouverture manquante";
var modif_date = donnees[i] && donnees[i].date_mod ? donnees[i].date_mod : "Date de modification manquante";
var id_demandeur = donnees[i] && donnees[i].users_id_recipient ? donnees[i].users_id_recipient : "ID du demandeur manquant";
var urgence = donnees[i] && donnees[i].urgency ? donnees[i].urgency : "Urgence manquante";
var priorite = donnees[i] && donnees[i].priority ? donnees[i].priority : "Priorité manquante";
var statut_actor = donnees[i] && donnees[i].newData? donnees[i].newData: "Priorité manquante";
                  var url_ticket =
                    drupalSettings.api_glpi_pleiade.glpi_url +
                    "/index.php?redirect=ticket_" + donnees[i].id;

                  const formattedOpenDate = formatDate(open_date);
                  const formattedModifDate = formatDate(modif_date);
	
for (var j = 0; j < donnees[i].newData.length; j++) {
    var newDataItem = donnees[i].newData[j];
    
    if (newDataItem.users_id === userMail) {
        statu_actor.push(newDataItem.type);
    }
}

if (statu_actor.length === 0) {
    statu_actor = "Priorité manquante";
}

for (var k = 0; k < statu_actor.length; k++) {
    switch (statu_actor[k]) {
        case 1:
            statu_actor[k] = "Demandeur du ticket";
            break;
        case 2:
            statu_actor[k] = "Responsable du ticket";
            break;
        case 3:
            statu_actor[k] = "Observateur du ticket";
            break;
        default:
            // Vous pouvez gérer d'autres valeurs ici si nécessaire
            break;
    }
}

// Stockez le résultat dans une nouvelle variable
var mapped_statu_actor = statu_actor;

                  switch (urgence) {
                    case 2:
                      urgenceText = "Basse";
                      break;
                    case 3:
                      urgenceText = "Moyenne";
                      break;
                    case 4:
                      urgenceText = "Haute";
                      break;
                    default:
                      urgenceText = "Valeur invalide";
                  }

                  switch (priorite) {
                    case 2:
                      prioriteText = "Basse";
                      break;
                    case 3:
                      prioriteText = "Moyenne";
                      break;
                    case 4:
                      prioriteText = "Haute";
                      break;
                    case 5:
                      prioriteText = "Très Haute";
                      break;
                    case 6:
                      prioriteText = "Majeure";
                      break;
                    default:
                      prioriteText = "Valeur invalide";
                  }
                  switch (statut) {
                    case 1:
                      statutText = "Nouveau";
                      break;
                    case 2:
                      statutText = "En cours ( attribué )";
                      break;
                    case 3:
                      statutText = "En cours ( planifié )";
                      break;
                    case 4:
                      statutText = "En attente";
                      break;
                    default:
                      statutText = "Valeur invalide";
                  }

if (
                    statutText !== "Valeur invalide" &&
                    urgenceText !== "Valeur invalide" &&
                    prioriteText !== "Valeur invalide"
                  ) {

                  blocGLPI +=
                    "\
                            <tr>\
                              <td>" +
                    titre +
                    "</td>\
                              <td>" +
                              statutText +
                    "</td>\
                              <td>" +
                    formattedOpenDate +
                    "</td>\
                              <td>" +
                    formattedModifDate +
                    "</td>\
                              <td>" +
                              urgenceText +
                    "</td>\
                          <td>" +
                          prioriteText +
                    "</td>\
		<td>" +
                          mapped_statu_actor +
                    "</td>\
<td><a href=" +
                    url_ticket +
                    " target='_blank' id'=ticketLink'>\
                                          <i class='fa-solid fa-magnifying-glass'></i>\
                                    </a>\
                                  </td>\
                                  </tr>\
                            ";
                }
}
                blocGLPI +=
                  "\
                          </tbody>\
                        </table>\
                      </div>\
                    </div>\
                  </div>\
                </div>\
                ";

                document.getElementById("glpi_tickets_id").innerHTML = blocGLPI;
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
          xhr.onloadend = function () {};

          xhr.send();
        }); // fin once function
      }
    },
  };
})(Drupal, once, drupalSettings);
