(function ($, Drupal, drupalSettings, once) {
        "use strict";
        Drupal.behaviors.APIlemonSubMenuBehavior = {
                attach: function (context, settings) {
                        // All normal pages but not admin pages

                        if (!drupalSettings.path.currentPath.includes("admin") && drupalSettings.api_lemon_pleiade.field_lemon_myapps_url && drupalSettings.api_lemon_pleiade.field_lemon_url) {
                                 setTimeout(function () {
                                        once("APIlemonSubMenuBehavior", "body", context).forEach(function () {
                                                // Liste des identifiants des éléments
                                                var elementsIds = ['urbanisme', 'relation_usager', 'profil_acheteur', 'demat_rh'];
                                                var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;
                                                var site;
                                                
                                                if (drupalSettings.api_user_pleiade.user_info.field_site_internet.length > 0) {
                                                        var site = drupalSettings.api_user_pleiade.user_info.field_site_internet[0].uri
                                                }

                                                // console.log('2')
                                                elementsIds.forEach(function (elementId) {
                                                        var menuElement = document.getElementById(elementId);
                                                        var nouvelElement, liens = "";                                                      
                                                        switch (elementId) {
                                                               
                                                                case 'urbanisme':
                                                                        if (userGroupsTempstore.includes('urbanisme')) {
                                                                                nouvelElement = document.createElement('div');
                                                                                nouvelElement.classList.add('sub_menu_eadmin');
                                                                                nouvelElement.classList.add('collapse');
                                                                                nouvelElement.setAttribute('id', 'collapseurbanisme')
                                                                                liens = '\
                                                                                <a class="waves-effect waves-dark" title="Signer un document d\'urbanisme" target="_blank" href="" aria-expanded="false">\
                                                                                <span class="hide-menu px-2">Signer un document d\'urbanisme</span></a>'
                                                                                liens += '\
                                                                                <a class="waves-effect waves-dark" title="Voir les documents d\'urbanisme" target="_blank" href="#" aria-expanded="false">\
                                                                                <span class="hide-menu px-2">Voir les documents d\'urbanisme</span></a>';
                                                                                nouvelElement.innerHTML = liens
                                                                                if (menuElement) {
                                                                                        menuElement.insertAdjacentElement('afterend', nouvelElement);
                                                                                }
                                                                        }
                                                                        break;
                                                                case 'relation_usager':
                                                                        nouvelElement = document.createElement('div');
                                                                        nouvelElement.classList.add('sub_menu_eadmin');
                                                                        nouvelElement.classList.add('collapse');
                                                                        nouvelElement.setAttribute('id', 'collapserelation_usager')
                                                                        if (drupalSettings.api_user_pleiade.user_info.field_site_internet.length > 0) {
                                                                                liens = '\
                                                <a class="waves-effect waves-dark" id="url_site_internet" title="Voir mon site internet" target="_blank" href="'+ site + '" aria-expanded="false">\
                                                <span class="hide-menu px-2">Voir mon site internet</span></a>'
                                                                        }
                                                                        else {
                                                                                liens = '\
                                                <a class="waves-effect waves-dark" id="url_site_internet" title="Voir mon site internet" target="_blank" href="" aria-expanded="false">\
                                                <span class="hide-menu px-2">Voir mon site internet</span></a>'
                                                                        }
                                                                        if (userGroupsTempstore.includes('gru')) {
                                                                                liens += '\
                                        <a class="waves-effect waves-dark" id="url_gru" title="Gérer les demandes usagers" target="_blank" href="#" aria-expanded="false">\
                                        <span class="hide-menu px-2">Gérer les demandes usagers</span></a>'
                                                                        }
                                                                        if (userGroupsTempstore.includes('adminchatbot')) {
                                                                                liens += '\
                                                <a class="waves-effect waves-dark" title="Gérer l\'assistant virtuel" target="_blank" href="#" aria-expanded="false">\
                                                <span class="hide-menu px-2">Gérer l\'assistant virtuel</span></a>'
                                                                        }
                                                                        liens += '\
                                                        <a class="waves-effect waves-dark" title="Accéder à la plateforme démocratie participative" target="_blank" href="https://participer.ecollectivites.fr" aria-expanded="false">\
                                                        <span class="hide-menu px-2">Accéder à la plateforme démocratie participative</span></a>';
                                                                        nouvelElement.innerHTML = liens
                                                                        
                                                                        if (menuElement) {
                                                                                
                                                                                menuElement.insertAdjacentElement('afterend', nouvelElement);

                                                                        } break;
                                                                case 'profil_acheteur':
                                                                        nouvelElement = document.createElement('div');
                                                                        nouvelElement.classList.add('sub_menu_eadmin');
                                                                        nouvelElement.classList.add('collapse');
                                                                        nouvelElement.setAttribute('id', 'collapseprofil_acheteur')
                                                                        if (userGroupsTempstore.includes('marches_securises')) {
                                                                                liens = '\
                        <a class="waves-effect waves-dark" title="Gérer la publication des marchés" target="_blank" href="https://marches-securises.fr/" aria-expanded="false">\
                        <span class="hide-menu px-2">Gérer la publication des marchés</span></a>'
                                                                                liens += '\
                        <a class="waves-effect waves-dark" title="Suivre l\'évolution des marchés" target="_blank" href="https://marches-securises.fr/" aria-expanded="false">\
                        <span class="hide-menu px-2">Suivre l\'évolution des marchés</span></a>';
                                                                        }
                                                                        nouvelElement.innerHTML = liens
                                                                        if (menuElement) {
                                                                                menuElement.insertAdjacentElement('afterend', nouvelElement);
                                                                        } break;
                                                                case 'demat_rh':

                                                                        nouvelElement = document.createElement('div');
                                                                        nouvelElement.classList.add('sub_menu_eadmin');
                                                                        nouvelElement.classList.add('collapse');
                                                                        nouvelElement.setAttribute('id', 'collapsedemat_rh')
                                                                        if (userGroupsTempstore.includes('admindeskrh')) {
                                                                                liens = '\
                        <a class="waves-effect waves-dark" title="Gérer les coffres-fort RH" target="_blank" href="https://deskrh.fr/account-choice" aria-expanded="false">\
                        <span class="hide-menu px-2">Gérer les coffres-fort RH</span></a>';
                                                                        }
                                                                        nouvelElement.innerHTML = liens
                                                                        if (menuElement) {
                                                                                menuElement.insertAdjacentElement('afterend', nouvelElement);
                                                                        } break;
                                                                default:

                                                        }
                                                });
                                        }); // fin once
                                 }, 3300);
                        } 

                        $(document).ready(function () {
                                $('#sidebarnav').on('click', '.nav-small-cap', function () {
                                        var target = $(this).attr('data-bs-target');
                                        var collapses = $('#sidebarnav').find('.collapse');

                                        collapses.each(function () {
                                                var collapse = $(this);
                                                var collapseId = collapse.attr('id');

                                                if ('#' + collapseId !== target) {
                                                        collapse.collapse('hide');
                                                }
                                        });
                                });
                                $('#sidebarnav').on('click', '.sidebar-link.has-arrow', function () {
                                        var target = $(this).attr('data-bs-target');
                                        var collapses = $('#sidebarnav').find('.sub_menu_eadmin');

                                        collapses.each(function () {
                                                var collapse = $(this);
                                                var collapseId = collapse.attr('id');

                                                if ('#' + collapseId !== target) {
                                                        collapse.collapse('hide');
                                                }
                                        });
                                });

                        });

                },
        };
})(jQuery, Drupal, drupalSettings, once);
