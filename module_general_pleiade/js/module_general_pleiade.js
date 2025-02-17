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
              rootElement.style.setProperty("--text-menu-color", newColorCode);
            }
             
             /* var listeofcommunes = drupalSettings.module_general_pleiade.sites_internets

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
*/

const container = document.querySelector('.container-fluid');

            // Get all direct child divs of the container
            const childDivs = container.querySelectorAll(':scope > div');

            childDivs.forEach(childDiv => {

              // Ensure each childDiv has an ID (like 'pastell_block', 'document_recent_id', etc.)
              if (childDiv.id) {
                const cardHeader = childDiv.querySelector('.card-header');
                const cardBody = childDiv.querySelector('.card-body');

                if (cardHeader && cardBody) {
                  // Create the cross element
                  const closeButton = document.createElement('button');
                  closeButton.innerHTML = '&times;'; // HTML entity for the × symbol
                  closeButton.classList.add('close-button');

                  // Append the cross to the card header
                  cardHeader.appendChild(closeButton);
                  // Retrieve the saved state from localStorage for this specific block by ID
                  const cardBodyState = localStorage.getItem(`${childDiv.id}_cardBodyDisplay`);

                  // Apply the saved state if available
                  if (cardBodyState === "none") {
closeButton.style.transform = 'rotate(45deg)';
                    cardBody.style.display = "none";
                  } else {
closeButton.style.transform = 'rotate(0deg)'; 
                   cardBody.style.display = "block"; // Default display is 'block'
                  }

                  // Add event listener to handle the click (e.g., to remove the card body or hide the div)
                  closeButton.addEventListener('click', () => {
                    if (cardBody.style.display === "none") {
                      cardBody.style.display = "block"; // Show the card-body
                      closeButton.style.transform = 'rotate(0deg)';
                      closeButton.style.transition = 'transform 0.3s ease'; // Smooth transition
                      localStorage.setItem(`${childDiv.id}_cardBodyDisplay`, 'block'); // Save state as 'block'
                    } else {
                      cardBody.style.display = "none"; // Hide the card-body
                      // Add the rotation effect to the close button
                      closeButton.style.transform = 'rotate(45deg)';
                      closeButton.style.transition = 'transform 0.3s ease'; // Smooth transition
                      localStorage.setItem(`${childDiv.id}_cardBodyDisplay`, 'none'); // Save state as 'none'

                    }
                  });
                }
              }
            });
	const htmlDoc = document.getElementById("areaSortable");
              new Sortable(htmlDoc, {
                group: 'shared', // set both lists to same group
                animation: 150,
                store: {
                  // ajout de la sauvegarde des emplacements de chaque blocs au rafraichissement
                  /**
                   * Get the order of elements. Called once during initialization.
                   * @param   {Sortable}  sortable
                   * @returns {Array}
                   */
                  get: function (sortable) {
                    var order = localStorage.getItem(
                      sortable.options.group
                    );
                    return order ? order.split("|") : [];
                  },

                  /**
                   * Save the order of elements. Called onEnd (when the item is dropped).
                   * @param {Sortable}  sortable
                   */
                  set: function (sortable) {
                    var order = sortable.toArray();
                    localStorage.setItem(
                      sortable.options.group,
                      order.join("|")
                    );
                  },
                },
              });
          }); // end once
        }, 3500);
      } // fin only on frontpage

    },

  };
})(Drupal, drupalSettings, once);
