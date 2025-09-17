(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIUserInfoBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
        once("APIUserInfoBehavior", "body", context).forEach(function () {

        
     
      const buttons = context.querySelectorAll('.clear-api-token-button:not([data-clear-attached])');

      buttons.forEach(function (button) {
        button.setAttribute('data-clear-attached', 'true');

        button.addEventListener('click', function (e) {
          console.log('Clear API token button clicked');
          e.preventDefault();
          // Look for the input next to the button (in the same flex container)
          const container = button.parentElement;
          const input = container.querySelector('.js-text-full');

          if (input) {
            input.value = '';
          }
        });
      });
 
   
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_user_pleiade/user_infos"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {
              var response = xhr.response;
              if (response) {

                 var url_appli = "",
                  url = "",
                  titre = "",
                  a_ajouter = "",
                  mes_apps = document.getElementById("collapse10");
                url_appli = response.field_url_application;
                if (url_appli) {
                  for (let index = 0; index < url_appli.length; index++) {
                    url = url_appli[index].uri;
                    titre = url_appli[index].title;

                    a_ajouter +=
                      '<a href="' +
                      url +
                      '" target="' +
                      titre +
                      '" class="favoris-link sidebar-link waves-effect waves-dark"><span class="hide-menu px-2">' +
                      titre +
                      "</span></a>";
                  }

                  // Ajoutez le contenu de 'a_ajouter' à la fin de la div
                  mes_apps?.insertAdjacentHTML("beforeend", a_ajouter);

                  const deleteModal = document.getElementById("deleteAppModal");
                  const urlInputFav =
                    deleteModal?.querySelector("#uriInputFavoris");
                  const titleInputFav =
                    deleteModal?.querySelector("#titleInputFavoris");
                  document.querySelectorAll(".favoris-link").forEach((el) => {
                    el.addEventListener("contextmenu", (event) => {
                      event.preventDefault();

                      const addAppModal = new bootstrap.Modal(deleteModal);

                      urlInputFav.value = el.href;
                      titleInputFav.value = el.target;
                      addAppModal.show();
                    });
                  });
                if (drupalSettings.path.isFront) {
                  if (
                    response.created &&
                    response.created[0] &&
                    response.created[0].value
                  ) {
                    var created = response.created[0].value;
                  }
                  if (
                    response.access &&
                    response.access[0] &&
                    response.access[0].value
                  ) {
                    var accessed = response.access[0].value;
                  }

                  if (created && accessed) {
                    var createdDate = new Date(created);
                    var accessedDate = new Date(accessed);
                    if (created === accessed) {
                      // if (Math.abs(createdDate.getTime() - accessedDate.getTime()) <= 60000) {
                      var steps = [
                        {
                          intro:
                            "Bienvenue sur le guide interactif du Bureau Virtuel Pléiade",
                        },
                      ];
                      var powerOff = document.querySelector(".fa-power-off");
                      if (powerOff) {
                        steps.push({
                          element: powerOff,
                          intro: "Se déconnecter de Pléiade.",
                        });
                      }
                      var userCardElement =
                        document.querySelector(".user_card");
                      if (userCardElement) {
                        steps.push({
                          element: userCardElement,
                          intro: "Accéder au profil utilisateur.",
                        });
                      }
                      var alertPopupElement =
                        document.querySelector(".alert_popup");
                      if (alertPopupElement) {
                        steps.push({
                          element: alertPopupElement,
                          intro:
                            "Ici apparaîtront les messages importants concernant les solutions d'e-Collectivités.",
                        });
                      }
                      var collectiviteChoiceElement = document.querySelector(
                        "#collectiviteChoice"
                      );
                      if (collectiviteChoiceElement) {
                        steps.push({
                          element: collectiviteChoiceElement,
                          intro:
                            "Accéder aux autres entités rattachées à votre compte.",
                        });
                      }
                      var circle = document.querySelector(".sidebartoggler");
                      if (circle) {
                        steps.push({
                          element: circle,
                          intro: "Réduire ou agrandir le menu.",
                        });
                      }
                      var brand = document.querySelector(".navbar-brand");
                      if (brand) {
                        steps.push({
                          element: brand,
                          intro:
                            "Revenir à la page d'accueil du bureau virtuel.",
                        });
                      }
                      var menuLemon = document.querySelector("#menuLemon");
                      if (menuLemon) {
                        steps.push({
                          element: menuLemon,
                          intro:
                            "Retrouver toutes les rubriques et menus liés à votre profil.",
                        });
                      }

                      var teamviewer = document.querySelector("#teamviewer");
                      if (teamviewer) {
                        steps.push({
                          element: teamviewer,
                          intro: "Télécharger TeamViewer.",
                        });
                      }
                      var actualites = document.querySelector(
                        "#actualites-row"
                      );
                      if (actualites) {
                        steps.push({
                          element: actualites,
                          intro: "Consulter les dernières actualités.",
                        });
                      }
                      var dataTables_wrapper = document.querySelector(
                        "#document_recent_id"
                      );
                      if (dataTables_wrapper) {
                        steps.push({
                          element: dataTables_wrapper,
                          intro:
                            "Visualiser les 50 derniers éléments ( Actes, Convocations, Documents à signer...).",
                          position: "left",
                        });
                      }
                      var dataTables_filter = document.querySelector(
                        ".dataTables_filter .form-control"
                      );
                      if (dataTables_filter) {
                        steps.push({
                          element: dataTables_filter,
                          intro: "Rechercher un élément.",
                          position: "left",
                        });
                      }
                      var action_rapides =
                        document.querySelector(".action_rapides");
                      if (action_rapides) {
                        steps.push({
                          element: action_rapides,
                          intro:
                            "Boutons d'actions rapides (détails, modification, suppression)",
                        });
                      }
                      var postit_block_id =
                        document.getElementById("postit_block_id");
                      if (postit_block_id) {
                        steps.push({
                          element: postit_block_id,
                          intro: "Créer des post-it virtuels.",
                          position: "left",
                        });
                      }
                      var guide_utilisateur =
                        document.getElementById("guide_utilisateur");
                      if (guide_utilisateur) {
                        steps.push({
                          element: guide_utilisateur,
                          intro: "Consulter les guides utilisateurs.",
                          position: "left",
                        });
                      }
                      var customize = document.querySelector(
                        ".service-panel-toggle"
                      );
                      if (customize) {
                        steps.push({
                          element: customize,
                          intro: "Personnaliser votre bureau.",
                          position: "left",
                        });
                      }
                      introJs()
                        .setOptions({
                          steps: steps,
                        })
                        .start();
                    }
                  }
                }
               
                }
              }
            }
          };
          xhr.onerror = function () {
            console.error("Error making AJAX call");
          };
          xhr.onabort = function () {
            console.error("AJAX call aborted");
          };
          xhr.ontimeout = function () {
            console.error("AJAX call timed out");
          };
          xhr.onloadend = function () {};
          xhr.send();
        });

        if (drupalSettings.path.isFront) {
          var interactiveGuideEnabled = true;

          var steps = [
            {
              intro:
                "Bienvenue sur le guide interactif du Bureau Virtuel Pléiade",
            },
          ];

           var brand = document.querySelector(".navbar-brand");
          if (brand) {
            steps.push({
              element: brand,
              intro: "Revenir à la page d'accueil du bureau virtuel.",
            });
          }

          /////////////////////////////////////// farvorites
             var menufav = document.querySelector("#menuFavoris");
          if (menufav) {
            steps.push({
              element: menufav,
              intro:
                "Retrouver toutes les applications favorites.",
            });
          }
          var menuLemon = document.querySelector("#menuLemon");
          if (menuLemon) {
            steps.push({
              element: menuLemon,
              intro:
                "Retrouver toutes les rubriques et menus liés à votre profil.",
            });
          }
             var circle = document.querySelector(".sidebartoggler");
          if (circle) {
            steps.push({
              element: circle,
              intro: "Réduire ou agrandir le menu.",
            });
          }

            var actualites = document.querySelector("#actualites-row");
          if (actualites) {
            steps.push({
              element: actualites,
              intro: "Consulter les dernières actualités.",
            });
          }
          var dataTables_wrapper = document.querySelector(
            "#document_recent_id"
          );
          if (dataTables_wrapper) {
            steps.push({
              element: dataTables_wrapper,
              intro:
                "Visualiser les derniers éléments ( Documents NextCloud, I-PARAPHEUR, MAARCH).",
              position: "left",
            });
          }

              var postit_block_id = document.getElementById("postit_block_id");
          if (postit_block_id) {
            steps.push({
              element: postit_block_id,
              intro: "Créer des post-it virtuels.",
              position: "left",
            });
          }
       
           var zimbraAgenda = document.getElementById("zimbra-fullcalendar");
          if (zimbraAgenda) {
            steps.push({
              element: zimbraAgenda,
              intro: "Visualiser votre agenda Zimbra.",
              position: "left",
            });
          }
  var zimbraInbox = document.getElementById("zimbra_mail");
          if (zimbraInbox) {
            steps.push({
              element: zimbraInbox,
              intro: "Visualiser vos derniers mails Zimbra.",
              position: "left",
            });
          }
            var watcha = document.getElementById("watcha_div_id");
          if (watcha) {
            steps.push({
              element: watcha,
              intro: "Visualiser vos derniers notifications Watcha.",
              position: "left",
            });
          }

            var glpi = document.getElementById("glpi-row");
          if (glpi) {
            steps.push({
              element: glpi,
              intro: "Visualiser vos derniers tickets GLPI.",
              position: "left",
            });
          }

            var footer = document.getElementById("app-footer");
          if (footer) {
            steps.push({
              element: footer,
              intro: "Visualiser les cordonnées de votre collectivité ansi que les cordonnées de SITIV.",
              position: "left",
            });
          }
          ///////////////////////////////////zimbra
          ///////////////////////////////////watcha
          ///////////////////////////////////glpi
           ///////////////////////////////////Cordonners
            var customize = document.querySelector(".service-panel-toggle");
          if (customize) {
            steps.push({
              element: customize,
              intro: "Personnaliser votre bureau .",
              position: "left",
            });
          }
            var alertPopupElement = document.querySelector(".alert_popup");
          if (alertPopupElement) {
            steps.push({
              element: alertPopupElement,
              intro:
                "Ici apparaîtront les messages importants.",
            });
          }
              var userCardElement = document.querySelector(".user_card");
          if (userCardElement) {
            steps.push({
              element: userCardElement,
              intro: "Accéder au profil utilisateur.",
            });
          }
        
          var powerOff = document.querySelector(".fa-power-off");
          if (powerOff) {
            steps.push({
              element: powerOff,
              intro: "Se déconnecter de Pléiade.",
            });
          }
      
       
         
         var guide_utilisateur = document.getElementById("guide_utilisateur");
          if (guide_utilisateur) {
            steps.push({
              element: guide_utilisateur,
              intro: "Consulter les guides utilisateurs.",
              position: "left",
            });
          }
         

          var interactiveGuidElement =
            document.getElementById("interactive_guid");
          if (interactiveGuideEnabled && interactiveGuidElement) {
            interactiveGuidElement.addEventListener("click", function () {
              introJs()
                .setOptions({
                  steps: steps,
                })
                .start();
            });
          }
        }
      }, 1000);
    },
  };
})(Drupal, once, drupalSettings);
