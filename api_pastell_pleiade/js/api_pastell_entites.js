(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIpastellEntitesBehavior = {
        attach: function (context, settings) {

            // only on frontpage
            if (drupalSettings.path.isFront && drupalSettings.api_pastell_pleiade.field_pastell_entities_url) {
                once("APIpastellEntitesBehavior", "#collectiviteChoice", context).forEach(
                    function () {
                        // le nom du groupe LDAP pour pastell doit etre renseigné dans l'admin
                            // prepare menu 
                            var linkEntitie = document.getElementById("collectiviteChoice");
                            // make ajax call
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", Drupal.url("v1/api_pastell_pleiade/pastell_entities_query"));
                            // Pastell pas en UTF8 :/
                            // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
                            xhr.responseType = "json";
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    var donnees = xhr.response;
                                    // console.log(donnees);
                                    // construct menu
                                    if(donnees && donnees != 0){
                                        donnees.forEach(function (value) {
                                            if (value.entite_mere == 0) {
                                                var option = document.createElement("option");
                                                option.id = "entitie_number_" + value.id_e;
                                                option.className = "dropdown-item text-uppercase";
                                                option.value = value.id_e;
                                                option.text = unescape(value.denomination);
                                                linkEntitie.appendChild(option);
                                                donnees.forEach(function (value_child) {
                                                    if (value_child.entite_mere == value.id_e) {
                                                        var option_child = document.createElement("option");
                                                        option_child.id = "entitie_number_" + value_child.id_e;
                                                        option_child.className = "dropdown-item ";
                                                        option_child.value = value_child.id_e;
                                                        option_child.text = "—" + unescape(value_child.denomination);
                                                        linkEntitie.appendChild(option_child);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        var select_choice = document.getElementById('collectiviteChoice');
                                        if(select_choice){
                                            select_choice.style.display = "none";
                                        }
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

                                    // Show menu
                                    // document.getElementById('collectiviteChoice').style.display = 'block';

                                    // Create an array to remove white space in choice at refresh with coll_id who is not an option
                                    var array_value_select = [];
                                    for (var i = 0; i < document.getElementById('collectiviteChoice').length; i++) {
                                        array_value_select.push(document.getElementById('collectiviteChoice').options[i].value);
                                    }
                                    
                                    // Selected coll localStorage management
                                    if (!localStorage.getItem('collectivite_id') || localStorage.getItem('collectivite_id') == null || !array_value_select.includes(localStorage.getItem('collectivite_id'))) {
                                        var optionValue = document.getElementById('collectiviteChoice').value;
                                        // console.log('Optionvalue : ' + document.getElementById('collectiviteChoice').value);
                                        localStorage.setItem('collectivite_id', optionValue);
                                        // Now call document JS module function to get documents with our entity id
                                        
                                        Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(optionValue);
                                       
                                    }
                                    else 
                                    {
                                        // on refresh, set the previous selected collectivite from localstorage
                                        document.getElementById('collectiviteChoice').value = localStorage.getItem('collectivite_id');
                                        // Now call document JS module function to get documents with our entity id
                                        
                                        Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(document.getElementById('collectiviteChoice').value);
                                    }
                                    // debug
                                    // console.log('Selected coll from Entites JS module = '+ document.getElementById('collectiviteChoice').value);
                                    if(!drupalSettings.api_pastell_pleiade){
                                        localStorage.removeItem('collectivite_id');
                                        var element = document.getElementById('collectiviteChoice');
                                        if (element) {
                                          element.style.visibility = 'hidden !important';
                                        }
                                      }
                                }


                                // Monitor select menu change
                                document.addEventListener('input', function (event) {

                                    // Only run on our select menu
                                    if (event.target.id !== 'collectiviteChoice') return;

                                    // The selected value changed, update our localStore
                                    localStorage.setItem('collectivite_id', event.target.value);
                                    // debug
                                     console.log('Collectivité select change : ' + event.target.value);
                                    // Now call again document JS module function to get documents
                                    // Attach the DatatableBehavior again

                                    Drupal.behaviors.APIpastellMenuBehavior.get_id_coll(event.target.value);

                                }, false);

                            };
                            xhr.send();
                    }); // end once
            } // fin only on frontpage 
        },
    };
})(Drupal, drupalSettings, once);
