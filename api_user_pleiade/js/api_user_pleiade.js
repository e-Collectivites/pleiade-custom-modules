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
          if (localStorage.getItem("isNextCloudActivated")==true || localStorage.getItem("isNextCloudActivated")=='true') {
            steps.push({
              element: dataTables_wrapper,
              intro:
                "Visualiser les derniers éléments ( Documents NextCloud, I-PARAPHEUR, MAARCH).",
              position: "left",
            });
          }

              var postit_block_id = document.getElementById("postit_block_id");
          if (localStorage.getItem("isPostitActivated")==true || localStorage.getItem("isPostitActivated")=='true') {
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
          if (localStorage.getItem("isWatchaActivated")==true || localStorage.getItem("isWatchaActivated")=='true') {
            steps.push({
              element: watcha,
              intro: "Visualiser vos derniers notifications Watcha.",
              position: "left",
            });
          }

            var glpi = document.getElementById("glpi-row");
          if (localStorage.getItem("isGlpiActivated")==true || localStorage.getItem("isGlpiActivated")=='true') {
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
