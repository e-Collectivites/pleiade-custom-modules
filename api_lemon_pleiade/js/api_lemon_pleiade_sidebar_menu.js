(function (Drupal, once) {
    "use strict";
    Drupal.behaviors.APIlemonMenuBehavior = {
      attach: function (context, settings) {
        // All normal pages but not admin pages
        if (!drupalSettings.path.currentPath.includes("admin") && drupalSettings.api_lemon_pleiade.field_lemon_myapps_url && drupalSettings.api_lemon_pleiade.field_lemon_url ) {
          once("APIlemonMenuBehavior", "body", context).forEach(function () {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", Drupal.url("v1/api_lemon_pleiade/lemon-myapps-query"));
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = JSON.parse(xhr.responseText);
                var menuHtml = '<div class="accordion" id="accordionExample">';
  
                if(drupalSettings.module_general_pleiade.color_theme){
                  var color_theme = drupalSettings.module_general_pleiade.color_theme
                }
                else{
                  var color_theme = '#1f3889'
                } 

                for (var i = 0; i < donnees.myapplications.length; i++) {
                  // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos liens du menu
                  menuHtml +=
                  '<div style="max-width: 240px;"><div class="nav-small-cap has-arrow' +
                  (localStorage.getItem("extended_menu") === "1" ? '' : ' collapsed') +
                  (donnees.myapplications[i].Category.length > 25 ? ' long-category' : '') +
                  '" data-bs-toggle="collapse" data-bs-target="#collapse' +
                  i +
                  '" aria-expanded="' +
                  (localStorage.getItem("extended_menu") === "1" ? 'true' : 'false') +
                  '" aria-controls="collapse' +
                  i +
                  '"><i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' +
                  donnees.myapplications[i].Category +
                  '</span></div><ul style="background-color:' +
                  color_theme +
                  '"><div id="collapse' +
                  i +
                  '" class="accordion-collapse collapse' +
                  (localStorage.getItem("extended_menu") === "1" ? ' show' : '') +
                  '" aria-labelledby="headingOne"><div class="accordion-body">';
                  for (
                    var f = 0;
                    f < donnees.myapplications[i].Applications.length;
                    f++
                  ) {
                    // Pour chaque catégories, on récupère le nombre d'applications de la catégorie puis on boucle dessus
                    const temp = Object.values(
                      donnees.myapplications[i].Applications[f]
                    );
  
                    menuHtml += // on créé ensuite le lien avec le title du lien et le la description, pour créer le bloc
                      '<a class="sidebar-link waves-effect waves-dark" title="' +
                      temp[0].AppDesc +
                      '" href="' +
                      temp[0].AppUri +
                      '" aria-expanded="false" target="_blank" ><i data-feather="arrow-right" class="feather-icon"></i><span class="hide-menu">' +
                      Object.keys(donnees.myapplications[i].Applications[f]) +
                      " </span></a>";
                  }
                  menuHtml += "</div></div></div>";
                }
               
                menuHtml += "</div>";
  
                document.getElementById("menuTestLemon2").innerHTML = menuHtml; // on récupère l'entièreté du menu créé puis on le stocke dans la div contenant l'id menuTestLemon2
                feather.replace();
                // Fo  nction pour gérer le changement de la case à cocher
                function handleCheckboxChange() {
                  const checkbox = document.querySelector('input[name="extended_menu"]');
                  
                  const accordionCollapses = document.querySelectorAll('.accordion-collapse');
                  
                  const navSmallCaps = document.querySelectorAll('.sidebar-nav ul .nav-small-cap');

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
              }
             // document.getElementById('spinner-div-sidebar').style.display = 'none';
            };
            xhr.send(JSON.stringify({}));

          }); // fin once
        } // fin exlude admin pages
      },
    };
  })(Drupal, once);