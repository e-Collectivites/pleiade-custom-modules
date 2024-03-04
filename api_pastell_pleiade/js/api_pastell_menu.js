(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIpastellMenuBehavior = {};
  Drupal.behaviors.APIpastellMenuBehavior.get_id_coll = function (id_e) {
    setTimeout(function () {
      if (drupalSettings.api_pastell_pleiade.field_pastell_flux_url) {
       
          var url_pastell = drupalSettings.api_pastell_pleiade.field_pastell_url
          var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;
          var menu_a_remplir = ""
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_flux_query"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {
              var response = xhr.response;
              var menu_actes = document.getElementById('actes'),
              menu_convocations = document.getElementById('convocations'), 
              menu_doc_a_signer = document.getElementById('signature_electronique'),
              menu_helios = document.getElementById('flux_financier');
              var aDelete = document.querySelectorAll('.sub_menu_eadmin')
             for (var i = 0; i < aDelete.length; i++) {
                  aDelete[i].parentNode.removeChild(aDelete[i]);
              }
              for (var key in response) {

                var item = response[key];

                var itemName = item.nom;
                
                switch (itemName) {
                  case 'Actes':
                    var nouvelElement = document.createElement('div');
                    nouvelElement.classList.add('sub_menu_eadmin');
                    nouvelElement.classList.add('collapse');
                    nouvelElement.setAttribute('id', 'collapseactes');
                    if (userGroupsTempstore.includes('pastell')) {
                      menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Télétransmettre un acte" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                            <span class="hide-menu px-2">Télétransmettre un acte</span>\
                        </a>';
                      if (drupalSettings.path.isFront) {
                        menu_a_remplir += '\
                        <span class=" waves-effect waves-dark" id="voir_actes" title="Voir les actes" target="_blank" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les actes</span>\
                        </span>'
                      }
                      else {
                        menu_a_remplir += '\
                        <a class="waves-effect waves-dark" href="/node?goToDatatable=true&type=acte" id="voir_actes" title="Voir les actes" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les actes</span>\
                        </a>'
                      }
                    }
                    if (userGroupsTempstore.includes('webactes')) {
                      menu_a_remplir += '\
                          <a class="waves-effect waves-dark" title="Gérer les actes" target="_blank" href="https://www.libriciel.fr/logiciels/webactes/" aria-expanded="false">\
                            <span class="hide-menu px-2">Gérer les actes</span>\
                          </a>'
                    }
                    if (userGroupsTempstore.includes('publicationdesactes')) {
                      menu_a_remplir += '\
                          <span class="waves-effect waves-dark" id="voir_actes" title="Publier les actes" target="_blank" href="https://services.megalis.bretagne.bzh/actualite/publication-des-actes-nouvelle-fonctionnalite/" aria-expanded="false">\
                              <span class="hide-menu px-2">Publier les actes</span>\
                          </span>';
                    }
                    nouvelElement.innerHTML = menu_a_remplir
                    if(menu_actes){
                    menu_actes.insertAdjacentElement('afterend', nouvelElement);
                    }

                    break;

                  case 'Convocation':
                    var nouvelElement = document.createElement('div');
                    nouvelElement.classList.add('sub_menu_eadmin');
                    nouvelElement.classList.add('collapse');
                    nouvelElement.setAttribute('id', 'collapseconvocations');
                    if (userGroupsTempstore.includes('pastell')) {
                      menu_a_remplir = '\
                        <a class=" waves-effect waves-dark" title="Envoyer une convocation" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Envoyer une convocation</span></a>'
                      if (drupalSettings.path.isFront) {
                        menu_a_remplir += '\
                          <span class="waves-effect waves-dark" id="voir_convocs" title="Voir les convocations" target="_blank"  aria-expanded="false">\
                          <span class="hide-menu px-2">Voir les convocations</span></span>'
                      }
                      else {
                        menu_a_remplir += '\
                          <a class="waves-effect waves-dark" href="/node?goToDatatable=true&type=convoc" id="voir_convocs" title="Voir les convocations"  aria-expanded="false">\
                          <span class="hide-menu px-2">Voir les convocations</span></a>'
                      }
                    }
                    if (userGroupsTempstore.includes('idelibre')) {
                      menu_a_remplir += '\
                        <a class=" waves-effect waves-dark" title="Gérer les séances " target="_blank" href="https://idelibre.ecollectivites.fr" aria-expanded="false">\
                        <span class="hide-menu px-2">Gérer les séances</span></a>';
                    }
                    nouvelElement.innerHTML = menu_a_remplir
                    if(menu_convocations){
                      menu_convocations.insertAdjacentElement('afterend', nouvelElement);
                    }


                    break;

                  case 'Helios':

                   
                    var nouvelElement = document.createElement('div');
                    nouvelElement.classList.add('sub_menu_eadmin');
                    nouvelElement.classList.add('collapse');
                    nouvelElement.setAttribute('id', 'collapseflux_financier');
                    if (userGroupsTempstore.includes('pastell')) {
                      menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Télétransmettre un flux Hélios" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Télétransmettre un flux Hélios</span></a>'
                      if (drupalSettings.path.isFront) {
                        menu_a_remplir += '\
                            <span class=" waves-effect waves-dark" id="voir_helios" title="Voir les flux Hélios" target="_blank" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les flux Hélios</span></span>'

                        menu_a_remplir += '\
                            <span class=" waves-effect waves-dark" id="voir_chorus_pro" title="Voir les flux Hélios" target="_blank" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les flux Chorus pro</span></span>';
                      }
                      else {
                        menu_a_remplir += '\
                        <a class=" waves-effect waves-dark" href="/node?goToDatatable=true&type=helios" id="voir_helios" title="Voir les flux Hélios" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les flux Hélios</span></a>'

                        menu_a_remplir += '\
                            <a class=" waves-effect waves-dark" href="/node?goToDatatable=true&type=chorus" id="voir_chorus_pro" title="Voir les flux Hélios" aria-expanded="false">\
                            <span class="hide-menu px-2">Voir les flux Chorus pro</span></a>';
                      

                          }
                    }
                    nouvelElement.innerHTML = menu_a_remplir
                    if(menu_helios){
                      menu_helios.insertAdjacentElement('afterend', nouvelElement);
                    }

                    break;
                  case 'Document à faire signer':

                   
                    var nouvelElement = document.createElement('div');
                    nouvelElement.classList.add('sub_menu_eadmin');
                    nouvelElement.classList.add('collapse');
                    nouvelElement.setAttribute('id', 'collapsesignature_electronique');
                    if (userGroupsTempstore.includes('pastell')) {
                      menu_a_remplir = '\
                        <a class="waves-effect waves-dark" title="Envoyer un document au parapheur" target="_blank" href="' + url_pastell + '/Document/new?id_e=' + id_e + '&type=' + key + '" aria-expanded="false">\
                        <span class="hide-menu px-2">Envoyer un document au parapheur</span></a>'
                      if (userGroupsTempstore.includes('pastellenvoienlots')) {
                        menu_a_remplir += '\
                                <a class="waves-effect waves-dark" title="Envoyer en lots au parapheur" href="/lots/docs?id_e=' + id_e + '" aria-expanded="false">\
                                <span class="hide-menu px-2">Envoyer en lots au parapheur</span></a>'
                      }
                    }
                    if (userGroupsTempstore.includes('parapheur')) {
                      if(localStorage.getItem('docs_parapheur')){
                        var a_traiter = '('+localStorage.getItem('docs_parapheur')+')'
                      }
                      else
                      {
                        var a_traiter = ''
                      }
                      menu_a_remplir += '\
                        <a class=" waves-effect waves-dark" title="Signer/viser sur le parapheur" target="_blank" href="https://iparapheurdev.ecollectivites.fr" aria-expanded="false">\
                        <span class="hide-menu px-2">Signer/viser sur le parapheur <span id="a_traiter">'+ a_traiter +'</span></span></a>'
                    }
                    if (userGroupsTempstore.includes('pastell') && drupalSettings.path.isFront) {
                      menu_a_remplir += '\
                        <span id="voir_docs" class="waves-effect waves-dark" title=Voir les documents du parapheur" target="_blank" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les documents du parapheur</span></span>';
                    }
                    else if(!drupalSettings.path.isFront){
                      menu_a_remplir += '\
                        <a id="voir_docs" href="/node?goToDatatable=true&type=parapheur" class="waves-effect waves-dark" title=Voir les documents du parapheur" aria-expanded="false">\
                        <span class="hide-menu px-2">Voir les documents du parapheur</span></a>';
                    }

                    if (userGroupsTempstore.includes('opensign')) {
                      menu_a_remplir += '\
                        <a class=" waves-effect waves-dark" title="Gérer les signatures à la volée" target="_blank" href="https://sign.ecollectivites.fr/mgt/Index" aria-expanded="false">\
                        <span class="hide-menu px-2">Gérer les signatures à la volée</span></a>'
                    }
                    nouvelElement.innerHTML = menu_a_remplir
                    if(menu_doc_a_signer){
                      menu_doc_a_signer.insertAdjacentElement('afterend', nouvelElement);
                    }

                    break;
                }

                menu_a_remplir += '</div></div>';
              }
            }
          }
          xhr.send();
      
      
  } // fin only on frontpage 
}, 2400);
  }
  
}) (Drupal, jQuery, drupalSettings);
