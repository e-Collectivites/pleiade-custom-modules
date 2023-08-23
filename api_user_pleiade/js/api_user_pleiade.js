(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIUserInfoBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
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
          {
            element: document.querySelector(".navbar-brand"),
            intro: "En cliquant sur le logo, vous retournerez sur la page d'accueil.",
          }
        ];
        
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
            intro: "Si vous avez besoin d'accéder à votre profil, voir votre historique de connexion, ou simplement vous déconnecter, cliquez ici.",
          });
        }
        
        steps.push({
          element: document.querySelector(".service-panel-toggle"),
          intro: "Si vous voulez personnaliser votre bureau, cliquez ici.",
          position: 'left'
        });

        var interactiveGuidElement = document.getElementById("interactive_guid");
        if (interactiveGuideEnabled && interactiveGuidElement) {
          interactiveGuidElement.addEventListener("click", function () {
            introJs().setOptions({
              showProgress: true,
              showBullets: false,
              steps: steps
            }).start();
          });
        }
      }
    },
  };
})(Drupal, once, drupalSettings);
