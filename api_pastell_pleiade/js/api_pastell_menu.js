(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIpastellMenuBehavior = {
        attach: function (context, settings) {
            // only on frontpage
            if (drupalSettings.path.isFront && drupalSettings.api_pastell_pleiade.field_pastell_entities_url) {
                once("APIpastellMenuBehavior", "#menuPastell", context).forEach(
                    function () {
                        var url_pastell = drupalSettings.api_pastell_pleiade.field_pastell_url

                        var convoc_tag = drupalSettings.api_pastell_pleiade.convocation_type_name
                        var helios_tag = drupalSettings.api_pastell_pleiade.helios_type_name
                        var acte_tag = drupalSettings.api_pastell_pleiade.acte_type_name
                        var a_signer_tag = drupalSettings.api_pastell_pleiade.doc_a_signer_type_name
                        
                        var menu_Pastell = document.getElementById('menuPastell')
                        var collectvites_id = localStorage.getItem('collectivite_id')
                        var request = new XMLHttpRequest();
                        var menu_a_remplir = ""
                        request.open("GET", Drupal.url("v1/api_lemon_pleiade/lemon-session-query"));
                        request.onload = function() {
                            if (request.status >= 200 && request.status < 400) {
                                var response = JSON.parse(request.responseText);
                                
                                if (response.groups.includes("pastell-actes")) {
                                    
                                    menu_a_remplir += '\
                                        <div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapseActes" aria-expanded="' +
                                        (localStorage.getItem("extended_menu") === "1" ? 'true' : 'false') +
                                        '" aria-controls="collapseActes">\
                                        <i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">Actes</span></div>\
                                        <div id="collapseActes" class="accordion-collapse collapse' +
                                        (localStorage.getItem("extended_menu") === "1" ? ' show' : '') + // Add 'show' class if localStorage has extended_menu value of 1
                                        '" aria-labelledby="headingOne" style="">\
                                        <a class="sidebar-link waves-effect waves-dark" title="Consulter les actes" target=”_blank” href="'+ url_pastell +'/Document/list?id_e='+ collectvites_id +'&type='+ acte_tag +'" aria-expanded="false">\
                                        <i data-feather="arrow-right" class="feather-icon"></i><span class="hide-menu">Consulter les actes </span></a>\
                                        <a class="sidebar-link waves-effect waves-dark" title="Créer un acte" target=”_blank” href="'+ url_pastell +'/Document/new?id_e='+ collectvites_id +'&type='+ acte_tag +'" aria-expanded="false">\
                                        <i data-feather="arrow-right" class="feather-icon"></i>\
                                        <span class="hide-menu">Créer un acte </span></a>\
                                        </div></div>'
                                } else {
                                    console.log("The string 'pastell-actes' is not present in the lemonldap response.");
                                }
                                  // Check if the string "helios" is present in the response
                                if (response.groups.includes("pastell-helios")) {
                                    menu_a_remplir += '\
                                    <div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapseHelios" aria-expanded="' +
                                    (localStorage.getItem("extended_menu") === "1" ? 'true' : 'false') +
                                    '" aria-controls="collapseHelios">\
                                    <i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">Hélios</span></div>\
                                    <div id="collapseHelios" class="accordion-collapse collapse' +
                                    (localStorage.getItem("extended_menu") === "1" ? ' show' : '') + // Add 'show' class if localStorage has extended_menu value of 1
                                    '" aria-labelledby="headingOne" style="">\
                                    <a class="sidebar-link waves-effect waves-dark" title="Consulter les flux Hélios" target=”_blank” href="'+ url_pastell +'/Document/list?id_e='+ collectvites_id +'&type='+ helios_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i><span class="hide-menu">Consulter les flux Hélios </span></a>\
                                    <a class="sidebar-link waves-effect waves-dark" title="Créer un flux" target=”_blank” href="'+ url_pastell +'/Document/new?id_e='+ collectvites_id +'&type='+ helios_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i><span class="hide-menu">Créer un flux </span></a>\
                                    </div></div>'
                                } else {
                                    console.log("The string 'pastell-helios' is not present in the response.");
                                }
                                // Check if the string "convocations" is present in the response
                                if (response.groups.includes("pastell-convocations")) {
                                    menu_a_remplir += '\
                                    <div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapseConvocs" aria-expanded="' +
                                    (localStorage.getItem("extended_menu") === "1" ? 'true' : 'false') +
                                    '" aria-controls="collapseConvocs">\
                                    <i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">Convocations</span></div>\
                                    <div id="collapseConvocs" class="accordion-collapse collapse' +
                                    (localStorage.getItem("extended_menu") === "1" ? ' show' : '') + // Add 'show' class if localStorage has extended_menu value of 1
                                    '" aria-labelledby="headingOne" style="">\
                                    <a class="sidebar-link waves-effect waves-dark" title="Consulter les convocations" target=”_blank” href="'+ url_pastell +'/Document/list?id_e='+ collectvites_id +'&type='+ convoc_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i>                                    <span class="hide-menu">Consulter les convocations </span></a>\
                                    <a class="sidebar-link waves-effect waves-dark" title="Créer une convocation " target=”_blank” href="'+ url_pastell +'/Document/new?id_e='+ collectvites_id +'&type='+ convoc_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i>                                    <span class="hide-menu">Créer une convocation </span></a>\
                                    <a class="sidebar-link waves-effect waves-dark" title="Annuaire & Groupes" target=”_blank” href="'+ url_pastell +'/MailSec/annuaire?id_e='+ collectvites_id +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i>                                    <span class="hide-menu">Annuaire & Groupes </span></a>\
                                    </div></div>'
                                } else {
                                    console.log("The string 'pastell-convocations' is not present in the response.");
                                }
                                // Check if the string "doc_a_faire_signer" is present in the response
                                if (response.groups.includes("pastell-docs-signer")) {
                                    menu_a_remplir += '\
                                    <div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapseSign" aria-expanded="' +
                                    (localStorage.getItem("extended_menu") === "1" ? 'true' : 'false') +
                                    '" aria-controls="collapseSign">\
                                    <i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">Doc. à faire signer</span></div>\
                                    <div id="collapseSign" class="accordion-collapse collapse' +
                                    (localStorage.getItem("extended_menu") === "1" ? ' show' : '') + // Add 'show' class if localStorage has extended_menu value of 1
                                    '" aria-labelledby="headingOne" style="">\
                                    <a class="sidebar-link waves-effect waves-dark" title="Consulter les documents" target=”_blank” href="'+ url_pastell +'/Document/list?id_e='+ collectvites_id +'&type='+ a_signer_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i>                                    <span class="hide-menu">Consulter les documents </span></a>\
                                    <a class="sidebar-link waves-effect waves-dark" title="Créer un document" target=”_blank” href="'+ url_pastell +'/Document/new?id_e='+ collectvites_id +'&type='+ a_signer_tag +'" aria-expanded="false">\
                                    <i data-feather="arrow-right" class="feather-icon"></i>                                    <span class="hide-menu">Créer un document </span></a>\
                                    </div></div>'
                                } else {
                                    console.log("The string 'pastell-docs-signer' is not present in the response.");
                                }
                               
                            }
                       
                        menu_Pastell.innerHTML += menu_a_remplir
                        feather.replace();
                        }; 

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
                        
                        request.send();
                       
                    }); // end once
            } // fin only on frontpage 
        },
    };
})(Drupal, drupalSettings, once);