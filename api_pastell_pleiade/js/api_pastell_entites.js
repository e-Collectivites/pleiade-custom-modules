(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIpastellEntitesBehavior = {
        attach: function (context, settings) {

            // only on frontpage
            if (drupalSettings.path.isFront) {
                once("APIpastellEntitesBehavior", "body", context).forEach(
                    function () {

                        // On masque le select entités par défaut, sur toutes les pages, tout le monde n'a pas de droits dans Pastell
                        if (!drupalSettings.path.currentPath.includes("admin")) {
                            document.getElementById('collectiviteChoice').style.display = 'none';
                        }
                        // le nom du groupe LDAP pour pastell doit etre renseigné dans l'admin
                        // check si existe + si dans le Drupal tempstore stocké par le module Lemon Pléiade
                        var pastellLDAPGroup = drupalSettings.api_pastell_pleiade.field_pastell_ldap_group;
                        var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;
                        console.log('Pastell ldap group from Pastell Pléiade setting: ' + pastellLDAPGroup);
                        console.log('Drupal tempstore groups from Lemon Pléiade module: ' + userGroupsTempstore);

                        // Call only if pastell group set and in private tempstore user_groups
                        if(pastellLDAPGroup && userGroupsTempstore.includes(pastellLDAPGroup)) {
                        // prepare menu 
                        var linkEntitie = document.getElementById("collectiviteChoice");
                        // make ajax call
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_entities_query"));
                        // Pastell pas en UTF8 :/
                        xhr.overrideMimeType('text/xml; charset=iso-8859-1');
                        xhr.responseType = "json";
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                var donnees = xhr.response;
                                // debug
                                console.log(donnees);
                                // construct menu
                                donnees.forEach(function(value) {
                                    if (value.entite_mere == 0) {
                                      var option = document.createElement("option");
                                      option.id = "entitie_number_" + value.id_e;
                                      option.className = "dropdown-item text-uppercase";
                                      option.value = value.id_e;
                                      option.text = unescape(value.denomination);
                                      linkEntitie.appendChild(option);
                                  
                                      donnees.forEach(function(value_child) {
                                        if (value_child.entite_mere == value.id_e) {
                                          var option_child = document.createElement("option");
                                          option_child.id = "entitie_number_" + value_child.id_e;
                                          option_child.className = "dropdown-item text-uppercase";
                                          option_child.value = value_child.id_e;
                                          option_child.text = "⌊" + unescape(value_child.denomination);
                                          linkEntitie.appendChild(option_child);
                                        }
                                      });
                                    }
                                  });

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

                            // Show menu
                            document.getElementById('collectiviteChoice').style.display = 'block';
                            
                            // Selected coll localStorage management
                            if(!localStorage.getItem('collectivite_id')) {
                                var optionValue = document.getElementById('collectiviteChoice').value;
                                localStorage.setItem('collectivite_id', optionValue );
                            }
                            else {
                                document.getElementById('collectiviteChoice').value = localStorage.getItem('collectivite_id');
                            }
                            // debug
                             console.log('Selected coll from Entites JS module = '+ document.getElementById('collectiviteChoice').value);
                            }
                            // Now call document JS module function to get documents
                            Drupal.behaviors.APIpastellDocumentsBehavior.get_documents();
                            // feather
                            feather.replace();

                            // Monitor select menu change
                            document.addEventListener('input', function (event) {

                                // Only run on our select menu
                                if (event.target.id !== 'collectiviteChoice') return;
                            
                                // The selected value changed, update our localStore
                                localStorage.setItem('collectivite_id', event.target.value );
                                // debug
                                console.log('Collectivité select change : ' + event.target.value);
                                // Now call again document JS module function to get documents
                                Drupal.behaviors.APIpastellDocumentsBehavior.get_documents();

                            
                            }, false);
                            
                        };
                        xhr.send();
                      } // end if pastell group & in tempstore
                    }); // end once
            } // fin only on frontpage 
        },
    };
})(Drupal, drupalSettings, once);