 (function (Drupal, $, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIGLPITicketPageBehavior = {
      attach: function (context, settings) {
if (
drupalSettings.path &&
      drupalSettings.path.currentPath &&
drupalSettings.api_glpi_pleiade.glpi_url
    ) {
console.log('coucou');
          once("APIGLPITicketPageBehavior", "body", context).forEach(
            function () {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets"));
                xhr.responseType = "json";
 		console.log('cc');     
                xhr.onload = function () {
                  if (xhr.status === 200) {
                    var donnees = xhr.response; // Assurez-vous que xhr.response contient un tableau d'objets "donnees"
                    var blocGLPI = "";
                    console.log(donnees);
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
                      var blocGLPI =
                        '\
                        <div class="col-lg-12" id="glpi_desktop_block"> \
                        <div class="mb-2 shadow-sm">\
                          <div class="card mb-2">\
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
                                  <th scope="col">ID du demandeur</th>\
                                  <th></th>\
                                  </tr>\
                                </thead>\
                                <tbody>';
                      for (var i = 0; i < donnees.length; i++) {
                        var titre = donnees[i].name;
                        var statut = donnees[i].status;
                        var open_date = donnees[i].date;
                        var modif_date = donnees[i].date_mod;
                        var id_demandeur = donnees[i].users_id_recipient;
                        var urgence = donnees[i].urgency;
                        var priorite = donnees[i].priority;
                        var url_ticket =
                          drupalSettings.api_glpi_pleiade.glpi_url +
                          "/marketplace/formcreator/front/issue.php";
                        var prioriteText = ''
                        var urgenceText = ''
                        var statutText = ''
                        const formattedOpenDate = formatDate(open_date);
                        const formattedModifDate = formatDate(modif_date);
      
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
			  case 5:
                            statutText = "Résolu";
                            break;
                          case 6:
                            statutText = "Clos";
                            break;
                          default:
                            statutText = "Valeur invalide";
                        }
      
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
                          id_demandeur +
                          "</td>\
                                    <td>\
                                         <a href=" +
                          url_ticket +
                          " target='_blank' id='ticketLink'>\
                                                <i class='fa-solid fa-magnifying-glass'></i>\
                                          </a>\
                                        </td>\
                                        </tr>\
                                  ";
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
      
                      document.getElementById("glpi_list_tickets").innerHTML = blocGLPI;
// hide throbber
                    document.getElementById('spinner-history').style.display = 'none';
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
      
