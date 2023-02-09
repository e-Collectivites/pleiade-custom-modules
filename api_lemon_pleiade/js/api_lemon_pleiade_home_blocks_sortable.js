(function ($, Drupal, once) {
  "use strict";
  Drupal.behaviors.APIlemonHomeBlocksBehavior = {
    attach: function (context, settings) {
      // exclude admin pages
      if (!drupalSettings.path.currentPath.includes("admin")) {
        once("APIlemonHomeBlocksBehavior", "body", context).forEach(
          function () {
            $.ajax({
                url: Drupal.url("v1/api_lemon_pleiade/lemon-myapps-query"), // on appelle l'API de notre module LemonDataApiManager.php
                dataType: "json", // on spécifie bien que le type de données est en JSON
                type: "POST",
                data: {},
                success: function (donnees) {
                    var blocLemon = "";

                    for (var i = 0; i < donnees.myapplications.length; i++) {
                    // nommage id div pour boucle du bloc i pour drag and drop
                    var id = "row-" + i;

                    blocLemon +=
                        `<div class="col-lg-12"><div class="mb-2 shadow-lg"><div class="card my-2"><div class="card-header rounded-top" style="background-color: #1f3889"><h4 class="card-title text-light">` +
                        donnees.myapplications[i].Category +
                        `<span></span></h4></div><div class="card-body"><div class="row" id="${id}">`; // ajout de le l'id dans le html avec le numéro de boucle
                    for (
                        var f = 0;
                        f < donnees.myapplications[i].Applications.length;
                        f++
                    ) {
                        const temp = Object.values(
                        donnees.myapplications[i].Applications[f]
                        );

                        blocLemon +=
                        '<div class="col-md-4 my-3"><a  target="_blank" class="border-dark text-center" title="' +
                        temp[0].AppDesc +
                        '" href="' +
                        temp[0].AppUri +
                        '"><div class="col-12 py-3 h-100 shadow-lg"><h5 class="card-title">' +
                        Object.keys(donnees.myapplications[i].Applications[f]) +
                        '</h5><p class="text-muted">' +
                        temp[0].AppDesc +
                        "</p></div></a></div>";
                    }
                    blocLemon += "</div></div></div></div></div></div>";
                    }
                    
                    
                    // récupère le nombre de div enfante de l'element blocLemonCustom
                    // Le bureau = frontpage = 'node' url; on gère les blocs/portlets Pléiade  que sur la frontpage
                    if (drupalSettings.path.currentPath === "node") {
                    document.getElementById("blocLemonCustom").innerHTML += blocLemon; // ajout du html dans la div avec l'id blocLemonCustom
                    const htmlDoc = document.getElementById("blocLemonCustom");
                    const nbObjinBlocLemon = htmlDoc.children.length;
                    for (var f = 0; f < nbObjinBlocLemon; f++) {
                        // récup des éléments du bloc dont l'id contient row-n
                        var nbBloc = document.getElementById("row-" + f);
                        Sortable.create(nbBloc, {
                        animation: 150,
                        store: {
                            // ajout de la sauvegarde des emplacements de chaque blocs au rafraichissement
                            /**
                             * Get the order of elements. Called once during initialization.
                             * @param   {Sortable}  sortable
                             * @returns {Array}
                             */
                            get: function (sortable) {
                            var order = localStorage.getItem(
                                sortable.options.group
                            );
                            return order ? order.split("|") : [];
                            },

                            /**
                             * Save the order of elements. Called onEnd (when the item is dropped).
                             * @param {Sortable}  sortable
                             */
                            set: function (sortable) {
                            var order = sortable.toArray();
                            localStorage.setItem(
                                sortable.options.group,
                                order.join("|")
                            );
                            },
                        },
                        });
                        var recupBlocForDragAndDrop = document.getElementById("blocLemonCustom");

                        new Sortable.create(recupBlocForDragAndDrop, {
                            animation: 150,
                            store: {
                              // ajout de la sauvegarde des emplacement de chaque blocs au rafraichissement
                              /**
                               * Get the order of elements. Called once during initialization.
                               * @param   {Sortable}  sortable
                               * @returns {Array}
                               */
                              get: function (sortable) {
                                  var order = localStorage.getItem(
                                  sortable.options.group
                                  );
                                  return order ? order.split("|") : [];
                              },
                  
                              /**
                               * Save the order of elements. Called onEnd (when the item is dropped).
                               * @param {Sortable}  sortable
                               */
                              set: function (sortable) {
                                  var order = sortable.toArray();
                                  localStorage.setItem(
                                  sortable.options.group,
                                  order.join("|")
                                  );
                              },
                            },
                        });
                    }
                    
                }
              },
              complete: function () {
                $("#spinner-div-lemon_apps").hide();
                
              },
            });
          }
        ); // fin once
      } // fin exlude admin pages
    },
  };
})(jQuery, Drupal, once);
