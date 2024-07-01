(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIparapheurEntitesBehavior = {
        attach: function (context, settings) {
            setTimeout(function () {
               
                
                once("APIparapheurEntitesBehavior", "body", context).forEach(
                    function () {
                        var url_parapheur = ''
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
                       
                        
                        
                        const cookieGroups = decodeURIComponent(getCookie('groups'));
                        if (cookieGroups.includes('parapheur')) {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", Drupal.url("v1/api_parapheur_pleiade/parapheur_entities_query"));
                            xhr.responseType = "json";
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    var donnees = xhr.response;
                                    var a_signer = "0"

                                    if (donnees.bureaux) {
                                        var a_signer = 0
                                        for (var i = 0; i < donnees.bureaux.length; i++) {

                                            a_signer += donnees.bureaux[i].a_traiter
                                        }
                                        localStorage.setItem('docs_parapheur', a_signer)
                                    }

                                    var a_traiter = document.getElementById("a_traiter")
                                    if(a_traiter && a_signer !== 'undefined'){
                                        a_traiter.innerHTML = '(' + a_signer + ')';
                                    }
                                   
                                   

                                };
                                xhr.onerror = function () {
                                    console.log("Error making AJAX call");
                                };
                                xhr.onabort = function () {
                                    console.log("AJAX call aborted");
                                };
                                xhr.ontimeout = function () {
                                    console.log("AJAX call timed out");
                                };
                                xhr.onloadend = function () {

                                }

                            };
                            xhr.send();
                        }
                        
                        if ((cookieGroups.includes('parapheur85b') || 
                        cookieGroups.includes('parapheur72')|| 
                        cookieGroups.includes('parapheur53')|| 
                        cookieGroups.includes('parapheur44')|| 
                        cookieGroups.includes('parapheur49')|| 
                        cookieGroups.includes('parapheur')) && (!cookieGroups.includes('pastell') || !cookieGroups.includes('pastell-docasigner'))) {
                            
                            var a_traiter = ''
                            var menu_doc_a_signer = document.getElementById('signature_electronique')
                            var menu_a_remplir = ""
                            var nouvelElement = document.createElement('div');
                            nouvelElement.classList.add('sub_menu_eadmin');
                            nouvelElement.classList.add('collapse');
                            nouvelElement.setAttribute('id', 'collapsesignature_electronique');
                            if (localStorage.getItem('docs_parapheur') !== '0') {
                                a_traiter = '(' + localStorage.getItem('docs_parapheur') + ')'
                              }
                              else {
                                a_traiter = ''
                              }
                              var departement = decodeURIComponent(getCookie('departement'));
                              
                                if (departement == '85b'){
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + '85.ecollectivites.fr'
                                }
                                else if(departement == '85' || departement == 'null' ){
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + '.ecollectivites.fr'
                                }
                                else{
                                    url_parapheur =  drupalSettings.api_parapheur_pleiade.field_parapheur_url + departement +'.ecollectivites.fr'
                                }
                                menu_a_remplir += '\
                                    <a class="waves-effect waves-dark" title="Signer/viser sur le parapheur" target="_blank" href="'+url_parapheur+'" aria-expanded="false">\
                                    <span class="hide-menu px-2">Signer/viser sur le parapheur <span id="a_traiter">'+ a_traiter + '</span></span></a>'
                            nouvelElement.innerHTML = menu_a_remplir
                            if (menu_doc_a_signer) {
                                menu_doc_a_signer.insertAdjacentElement('afterend', nouvelElement);
                            }

                        }
                    });
            }, 2900); // 1000 millisecondes = 1 seconde
        },
    };
})(Drupal, drupalSettings, once);
