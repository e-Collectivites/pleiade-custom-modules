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
            function getCookie(name) {
              // Récupérer tous les cookies
              const cookies = document.cookie.split(';');
    
              // Parcourir chaque cookie
              for (let cookie of cookies) {
                // Diviser le nom et la valeur du cookie
                const [cookieName, cookieValue] = cookie.split('=');
    
                // Supprimer les espaces blancs avant et après le nom du cookie
                const trimmedCookieName = cookieName.trim();
    
                // Vérifier si le nom du cookie correspond à celui recherché
                if (trimmedCookieName === name) {
                  // Retourner la valeur du cookie
                  return cookieValue;
                }
              }
    
              // Retourner null si le cookie n'est pas trouvé
              return null;
            }
    
            const userGroupsTempstore = decodeURIComponent(getCookie('groups'));

            if (settings.module_general_pleiade.color_theme) {
              var newColorCode = settings.module_general_pleiade.color_theme;
              const rootElement = document.documentElement;
              // Modify CSS properties
              rootElement.style.setProperty("--global-color", newColorCode);
             
              var listeofcommunes = drupalSettings.module_general_pleiade.sites_internets

              var lines = listeofcommunes.split('\n').filter(function (line) {
                return line.trim() !== ''; // Supprimer les lignes vides
              });

              var dataObject = {};

              lines.forEach(function (line) {
                var values = line.split(',');
                var commune = values[0];
                var infos = {
                  siteInternet: values[1],
                  urlGRU: values[2]
                };
                dataObject[commune] = infos;
              });
              console.log(dataObject)
              var userCommunes = userGroupsTempstore.split(', ');

              userCommunes.forEach(function (commune) {
                var siteInternetLink = document.getElementById('url_site_internet');
                var GruLink = document.getElementById('url_gru');
                if (dataObject.hasOwnProperty(commune)) {
                  console.log(siteInternetLink)
                  var communeInfos = dataObject[commune];
                 
                  if (siteInternetLink) {
                    siteInternetLink.setAttribute('href', 'https://'+communeInfos.siteInternet);
                  }
                  if (GruLink) {
                    GruLink.setAttribute('href', communeInfos.urlGRU);
                  }
                }
                else{
                  console.error('Aucune commune dans les groupes lemonLdAP')
                }
              });

            }

          }); // end once
        }, 5500);
      } // fin only on frontpage

    },

  };
})(Drupal, drupalSettings, once);
