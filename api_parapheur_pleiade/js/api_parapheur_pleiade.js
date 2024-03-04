(function (Drupal, drupalSettings, once) {
    "use strict";
    Drupal.behaviors.APIparapheurEntitesBehavior = {
        attach: function (context, settings) {
            setTimeout(function () {
                once("APIparapheurEntitesBehavior", "body", context).forEach(
                    function () {
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


                                    if (donnees.bureaux) {
                                        var a_signer = 0
                                        for (var i = 0; i < donnees.bureaux.length; i++) {

                                            a_signer += donnees.bureaux[i].a_traiter
                                        }
                                        localStorage.setItem('docs_parapheur', a_signer)
                                    }


                                    document.getElementById("a_traiter").innerHTML = '(' + a_signer + ')';

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
                    });
            }, 2900); // 1000 millisecondes = 1 seconde
        },
    };
})(Drupal, drupalSettings, once);