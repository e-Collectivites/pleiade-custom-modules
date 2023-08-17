(function (Drupal, $, drupalSettings) {
  // we use Jquery '$' just...for Datatables plugin :/ Whatever it's included and needed in our custom Bootstrap theme.
  "use strict";
  Drupal.behaviors.APIpastellMenuBehavior = {};
  Drupal.behaviors.APIpastellMenuBehavior.get_id_coll = function(id_e) {
  if (drupalSettings.path.isFront && drupalSettings.api_pastell_pleiade.field_pastell_flux_url) {
      
            var url_pastell = drupalSettings.api_pastell_pleiade.field_pastell_url
            var menu_Pastell = document.getElementById('menuPastell');
            
            var menu_a_remplir = ""
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_flux_query"));
            // Pastell pas en UTF8 :/ 
            // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
            xhr.responseType = "json";
            xhr.onload = function () {
            if (xhr.status === 200) {
                var response = xhr.response;
                for (var key in response) {
                  var item = response[key];
                  var itemName = item.nom;

                  menu_a_remplir += '\
                    <div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapse' + key + '" aria-expanded="' +
                    (localStorage.getItem('extended_menu') === '1' ? 'true' : 'false') +
                    '" aria-controls="collapse' + key + '">\
                    <i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' + itemName + '</span></div>\
                    <div id="collapse' + key + '" class="accordion-collapse collapse' +
                    (localStorage.getItem('extended_menu') === '1' ? ' show' : '') + // Add 'show' class if localStorage has extended_menu value of 1
                    '" aria-labelledby="headingOne" style="">\
                    <a class="sidebar-link waves-effect waves-dark" title="Lister les documents" target="_blank" href="' + url_pastell + '/Document/list?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                    <i class="fa fa-arrow-right" aria-hidden="true"></i><span class="hide-menu px-2">Lister les documents</span></a>\
                    <a class="sidebar-link waves-effect waves-dark" title="Créer un document" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                    <i class="fa fa-arrow-right" aria-hidden="true"></i><span class="hide-menu px-2">Créer un document</span></a>\
                    </div></div>';
                }

                // Set the menu_a_remplir as innerHTML of menu_Pastell
                menu_Pastell.innerHTML = menu_a_remplir
                
              }
            }
            
            
           
            

            function handleCheckboxChange() {
                const checkbox = document.querySelector('input[name="extended_menu"]');
                
                const accordionCollapses = document.querySelectorAll('.accordion-collapse');
                
                const navSmallCaps = document.querySelectorAll('.sidebar-nav .has-arrow');

                if (checkbox.checked) {
                  localStorage.setItem('extended_menu', 1);
                  for (let i = 0; i < navSmallCaps.length; i++) {
                    navSmallCaps[i].setAttribute('aria-expanded', 'true');
                  }// Stocker le menu étendu en local et afficher les éléments de l'accordéon
                  
                  for (let i = 0; i < accordionCollapses.length; i++) {
                    accordionCollapses[i].classList.add('show');
                  }
                } else {
                  // Supprimer le menu étendu du stockage local et masquer les éléments de l'accordéon
                  localStorage.removeItem('extended_menu');
                  for (let i = 0; i < accordionCollapses.length; i++) {
                    accordionCollapses[i].classList.remove('show');
                  }
                  for (let i = 0; i < navSmallCaps.length; i++) {
                    navSmallCaps[i].setAttribute('aria-expanded', 'false');
                  }
                }
              }
              function checkMenusExpanded() {
                const accordionCollapses = document.querySelectorAll('.accordion-collapse');
                let allMenusExpanded = true;
                console.log(accordionCollapses);
              
                for (let i = 0; i < accordionCollapses.length; i++) {
                  if (!accordionCollapses[i].classList.contains('show')) {
                    allMenusExpanded = false;
                    break;
                  }
                }
              
                const checkbox = document.querySelector('input[name="extended_menu"]');
                checkbox.checked = allMenusExpanded;
              }
              
              // Call checkMenusExpanded() when menus are initialized or their state can change
              // Example 1: On DOMContentLoaded event
              document.addEventListener('DOMContentLoaded', function() {
                // Initialize menus
              
                // Call the function to check the state of the menus
                checkMenusExpanded();
              });
              
              // Example 2: On click event of menu toggle buttons
              const toggleButtons = document.querySelectorAll('[data-bs-toggle="collapse"]');
              toggleButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                  // Handle the click event and update the menus
              
                  // Call the function to check the state of the menus
                  setTimeout(checkMenusExpanded, 0); // Delay the function call to ensure the DOM is updated
                });
              });
              
              // Example 3: On shown.bs.collapse event (Bootstrap specific)
              const collapseElements = document.querySelectorAll('.accordion-collapse');
              collapseElements.forEach(function(collapse) {
                collapse.addEventListener('shown.bs.collapse', function() {
                  // Call the function to check the state of the menus
                  setTimeout(checkMenusExpanded, 0); // Delay the function call to ensure the DOM is updated
                });
              });
              // Récupérer la case à cocher et ajouter un écouteur d'événement pour le changement
              const checkbox = document.querySelector('input[name="extended_menu"]');
              checkbox.addEventListener('change', handleCheckboxChange);
              // Écouteur d'événement pour charger l'état de l'accordéon au chargement de la page
              // window.addEventListener('load', toggleAccordion);
            
              xhr.send();
            
     
          } // fin only on frontpage 
      }
    
})(Drupal, jQuery, drupalSettings);