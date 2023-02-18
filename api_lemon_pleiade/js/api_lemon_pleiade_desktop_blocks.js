(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APIlemonHomeBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (drupalSettings.path.isFront) {
        // use Drupal.once() instead of Jquery.once()
        once("APIlemonHomeBlocksBehavior", "body", context).forEach(
          function () {
            // TODO : blocks DOES NOT EXIST ??!! fix in theme ?
            var spinner = document.querySelector("#spinner-div-lemon_apps");
            // show spinner while ajax is loading
            if (spinner) {
              spinner.style.display = "block";
            }
            // make ajax call
            var xhr = new XMLHttpRequest();
            xhr.open("POST", Drupal.url("v1/api_lemon_pleiade/lemon-myapps-query"));
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = xhr.response;
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
                // ajout du html dans la div avec l'id blocLemonCustom
                document.getElementById("blocLemonCustom").innerHTML += blocLemon;
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
              // hide spinner when ajax is complete
              // if(spinner) {
              // spinner.style.display = "none";
              // }

              // Sortable here ?
              // const htmlDoc = document.getElementById("blocLemonCustom");
              // const nbObjinBlocLemon = htmlDoc.children.length;
              // for (var f = 0; f < nbObjinBlocLemon; f++) {
              //   // récup des éléments du bloc dont l'id contient row-n
              //   var nbBloc = document.getElementById("row-" + f);
              //   Sortable.create(nbBloc, {
              //     animation: 150,
              //     store: {
              //       // ajout de la sauvegarde des emplacements de chaque blocs au rafraichissement
              //       /**
              //        * Get the order of elements. Called once during initialization.
              //        * @param   {Sortable}  sortable
              //        * @returns {Array}
              //        */
              //       get: function (sortable) {
              //         var order = localStorage.getItem(
              //           sortable.options.group
              //         );
              //         return order ? order.split("|") : [];
              //       },

              //       /**
              //        * Save the order of elements. Called onEnd (when the item is dropped).
              //        * @param {Sortable}  sortable
              //        */
              //       set: function (sortable) {
              //         var order = sortable.toArray();
              //         localStorage.setItem(
              //           sortable.options.group,
              //           order.join("|")
              //         );
              //       },
              //     },
              //   });
              //   var recupBlocForDragAndDrop = document.getElementById("blocLemonCustom");

              //   new Sortable.create(recupBlocForDragAndDrop, {
              //     animation: 150,
              //     store: {
              //       // ajout de la sauvegarde des emplacement de chaque blocs au rafraichissement
              //       /**
              //        * Get the order of elements. Called once during initialization.
              //        * @param   {Sortable}  sortable
              //        * @returns {Array}
              //        */
              //       get: function (sortable) {
              //         var order = localStorage.getItem(
              //           sortable.options.group
              //         );
              //         return order ? order.split("|") : [];
              //       },

              //       /**
              //        * Save the order of elements. Called onEnd (when the item is dropped).
              //        * @param {Sortable}  sortable
              //        */
              //       set: function (sortable) {
              //         var order = sortable.toArray();
              //         localStorage.setItem(
              //           sortable.options.group,
              //           order.join("|")
              //         );
              //       },
              //     },
              //   });
              // }

            };
            xhr.send();
          }); // end once
      } // fin only on frontpage 
    },
  };
})(Drupal, drupalSettings, once);