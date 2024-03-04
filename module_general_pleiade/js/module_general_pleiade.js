(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.ParamsGenBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (
        drupalSettings.module_general_pleiade
      ) {
        setTimeout(function () {
          once("ParamsGenBehavior", "body", context).forEach(function () {
            var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;

            if (settings.module_general_pleiade.color_theme) {
              var newColorCode = settings.module_general_pleiade.color_theme;
              const rootElement = document.documentElement;
              // Modify CSS properties
              rootElement.style.setProperty("--global-color", newColorCode);


              var listeofcommunes = drupalSettings.module_general_pleiade.sites_internets

              var lines = listeofcommunes.split('\n').filter(function (line) {
                return line.trim() !== ''; // Supprimer les lignes vides
              });

              // Initialiser un tableau pour stocker les données
              var dataObject = {};

              // Parcourir chaque ligne et diviser les valeurs en utilisant la virgule comme séparateur
              lines.forEach(function (line) {
                var values = line.split(',');
                // La première valeur est le nom de la commune (utilisé comme clé)
                var commune = values[0];
                // Les valeurs restantes sont les informations associées
                var infos = {
                  siteInternet: values[1],
                  urlGRU: values[2]
                };
                // Stocker les informations dans l'objet associatif
                dataObject[commune] = infos;
              });
              var userCommunes = userGroupsTempstore.split(', ');

              // Afficher l'objet associatif résultant dans la console
              userCommunes.forEach(function (commune) {
                // Vérifier si la commune existe dans dataObject
                if (dataObject.hasOwnProperty(commune)) {
                  // Obtenir les informations associées à la commune
                  var communeInfos = dataObject[commune];
                  // Imprimer les URLs associés à la commune
                  var siteInternetLink = document.getElementById('url_site_internet');

                  var GruLink = document.getElementById('url_gru');
                  // Mettre à jour l'attribut href de la balise <a> existante avec l'URL du site internet
                  if (siteInternetLink) {
                    // Mettre à jour l'attribut href de la balise <a> existante avec l'URL du site internet
                    siteInternetLink.setAttribute('href', communeInfos.siteInternet);
                  }
                  if (GruLink) {
                    // Mettre à jour l'attribut href de la balise <a> existante avec l'URL du site internet
                    GruLink.setAttribute('href', communeInfos.urlGRU);
                  }
                }
              });

            }

          }); // end once
        }, 2000);
      } // fin only on frontpage

    },

  };
})(Drupal, drupalSettings, once);
