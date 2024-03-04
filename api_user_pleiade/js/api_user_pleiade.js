(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIUserInfoBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
      if (drupalSettings.path.isFront) {
        once("APIUserInfoBehavior", "body", context).forEach(function () {
          // Your code here
        }); // fin once function
        
        //ajout guide interactif
        var interactiveGuideEnabled = true; // Set this variable to true or false based on your condition
        
        var steps = [
          {
            intro: "Bienvenue sur le guide interactif du Bureau Virtuel Pléiade",
          },
          {
            element: document.querySelector("#menuLemon"),
            intro: "En cliquant sur les menus, vous pouvez ici accéder à vos différents applicatifs.",
          },
        ];
        var pastille_eadministration = document.querySelector(".pastille_eadministration")
        if (pastille_eadministration) {
          steps.push({
            element: pastille_eadministration,
            intro: "Si vous avez des documents en erreurs, ils apparaitront via une pastille rouge ici. cliquez dessus pour les visualiser",
            
          });
        }
        var mes_apps = document.querySelector(".mes_apps");
        if (mes_apps) {
          steps.push({
            element: mes_apps,
            intro: "Pour voir les applications que vous avez ajouté, c'est ici.",
          });
        }
        var brand = document.querySelector(".navbar-brand");
        if (brand) {
          steps.push({
            element: brand,
            intro: "En cliquant sur le logo, vous retournerez sur la page d'accueil.",          });
        }
        var circle = document.querySelector(".sidebartoggler");
        if (circle) {
          steps.push({
            element: circle,
            intro: "Pour diminuer ou augmenter le menu, cliquez sur ce bouton.",
          });
        }
        
        var collectiviteChoiceElement = document.querySelector("#collectiviteChoice");
        if (collectiviteChoiceElement) {
          steps.push({
            element: collectiviteChoiceElement,
            intro: "Si vous appartenez à plusieurs entités, vous pouvez choisir celle que vous souhaitez ici.",
          });
        }
        
        var alertPopupElement = document.querySelector(".alert_popup");
        if (alertPopupElement) {
          steps.push({
            element: alertPopupElement,
            intro: "Si vous avez des notifications, elles apparaîtront ici.",
          });
        }

        var userCardElement = document.querySelector(".user_card");
        if (userCardElement) {
          steps.push({
            element: userCardElement,
            intro: "Si vous avez besoin d'accéder à votre profil pour voir ou modifier vos infromations, cliquez ici.",
          });
        }
        var powerOff = document.querySelector(".fa-power-off");
        if (powerOff) {
          steps.push({
            element: powerOff,
            intro: "Cliquez ici pour voue déconnecter.",
          });
        }
        var customize = document.querySelector(".service-panel-toggle")
        if (customize) {
          steps.push({
            element: customize,
            intro: "Si vous voulez personnaliser votre bureau, ou bien ajouter des applications à votre menu, cliquez ici.",
            position: 'left'
          });
        }
        var dataTables_wrapper = document.querySelector("#document_recent_id")
        if (dataTables_wrapper) {
          steps.push({
            element: dataTables_wrapper,
            intro: "Ce bloc Vous montre les documents pastell pour l'entité choisie.",
            position: 'left'
          });
        }
        var dataTables_filter = document.querySelector(".dataTables_filter .form-control")
        if (dataTables_filter) {
          steps.push({
            element: dataTables_filter,
            intro: "Pour chercher un document en particlier, faites votre recherche ici.",
            position: 'left'
          });
        }
        var fa_eye = document.querySelector(".fa_eye")
        if (fa_eye) {
          steps.push({
            element: fa_eye,
            intro: "Besoin de voir un document, cliquez ici.",
            position: 'left'
          });
        }
        var fa_pencil = document.querySelector(".fa-pencil-square")
        if (fa_pencil) {
          steps.push({
            element: fa_pencil,
            intro: "Besoin de modifier un document, cliquez ici.",
            position: 'left'
          });
        }
        var fa_trash = document.querySelectorAll(".fa-trash")
        if (fa_trash) {
          steps.push({
            element: fa_trash,
            intro: "Besoin de supprimer un document, cliquez ici.",
            position: 'left'
          });
        }



        var interactiveGuidElement = document.getElementById("interactive_guid");
        if (interactiveGuideEnabled && interactiveGuidElement) {
          interactiveGuidElement.addEventListener("click", function () {
            introJs().setOptions({
              steps: steps
            }).start();
          });
        }
      }
    }, 3300);
    },
  };
})(Drupal, once, drupalSettings);
