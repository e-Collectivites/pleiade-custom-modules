(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIparapheurEntitesBehavior = {
        attach: function (context, settings) {

            // only on frontpage
            // if (drupalSettings.path.isFront) {
                once("APIparapheurEntitesBehavior", "#iparapheur_block_id", context).forEach(
                    function () {
                        // show spinner while ajax is loading
                        document.getElementById("iparapheur_block_id").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
                        // check si existe + si dans le Drupal tempstore stocké par le module Lemon Pléiade
                        var parapheurLDAPGroup = 'parapheur';
                        var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;         
                        // console.log('Drupal tempstore groups from Lemon Pléiade module: ' + userGroupsTempstore);

                        // Call only if parapheur group set and in private tempstore user_groups
                        if (userGroupsTempstore.includes(parapheurLDAPGroup)) {

                            // make ajax call
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", Drupal.url("sites/default/files/datasets/js/parapheur.json"));
                            // Pastell pas en UTF8 :/
                            // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
                            xhr.responseType = "json";
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    var donnees = xhr.response;
                                    // debug
                                    // console.log(donnees);
                                    if(donnees){
                                        var linkEntitie = '<div class="col-lg-12 shadow-lg bg-white">\
                                                            <div class="card mb-0">\
                                                              <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                                                                <h4 class="card-title text-dark py-2">Liste des tâches</h4>\
                                                              </div>\
                                                                    <div class="card-body">\
                                                                        <table class="table mb-0">\
                                                                        <tbody>';// début table tâches 
                        
                                        for (var i = 0; i < donnees.bureaux.length; i++) {
                                           
                                            var a_traiter = donnees.bureaux[i].a_traiter
                                            var en_retard = donnees.bureaux[i].en_retard
                                            var Shortname = donnees.bureaux[i].name
                                            var dossiers_delegues = donnees.bureaux[i].dossiers_delegues
                                            
                                            if(a_traiter){
                                                linkEntitie +=  '<tr class="d-flex">\
                                                <th class="d-flex align-items-center w-75">Vous avez <b>&nbsp;'+ a_traiter +'&nbsp;</b> documents à signer.</th>\
                                                <th class="d-flex align-items-center w-25">'+ Shortname +'</th>\
                                            </tr>\
                                            ';
                                            }
                                            if(en_retard){
                                                linkEntitie +=  '<tr class="d-flex">\
                                                <th class="d-flex align-items-center w-75">Vous avez <b>&nbsp;'+ en_retard +'&nbsp; </b> documents en retard de signature.</th>\
                                                <th class="d-flex align-items-center w-25">'+ Shortname +'</th>\
                                            </tr>\
                                            '; 
                                            }
                                            if(dossiers_delegues){
                                                linkEntitie +=  '<tr class="d-flex">\
                                                                <th class="d-flex align-items-center w-75"><b>&nbsp;'+ dossiers_delegues +'&nbsp;</b> documents vous ont été délégués.</th>\
                                                                <th class="d-flex align-items-center w-25">'+ Shortname +'</th>\
                                                            </tr>\
                                                            ';
                                            }
                                            
                                                        
                                        }// Fin table tâches 
                                        linkEntitie += '</tbody></table>\
                                                        </div>\
                                                        </div>\
                                                    </div>\
                                                    </div>\
                                                    '
                                      }
                                      else // affiche message si pas de tâches 
                                      {
                                        var linkEntitie = '<div class="col-lg-12">\
                                                            <div class="card">\
                                                              <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                                                                <h4 class="card-title text-dark py-2">Liste des tâches</h4>\
                                                              </div>\
                                                                        <div class="d-flex justify-content-center">\
                                                                            <h3 class="my-5">Aucun document à signer</h3>\
                                                                        </div>\
                                                                    </div>\
                                                                </div>\
                                                            ';
                                    }        
                                    document.getElementById("iparapheur_block_id").innerHTML = linkEntitie;
                                    
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
                        } // end if parapheur group & in tempstore
                    }); // end once
            // } // fin only on frontpage 
        },
    };
})(Drupal, drupalSettings, once);