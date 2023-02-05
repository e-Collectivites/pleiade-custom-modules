(function ($, Drupal, drupalSettings) {

  'use strict';
      console.log("Module Pléiade API/Lemon --> hello :))");
      // Méthode temporaire pour éviter les multiples boucles js au chargement d'une page
      let flag = false;
      // Return path as it can be usefull
      console.log('Current path = ' + drupalSettings.path.currentPath);


  Drupal.behaviors.APIlemonDataPleiadeBehavior = {
    attach: function (context, settings) {


      // On peut récupérer les paramètres et les injecter dans le JS si besoin (pas utile pour l'instant)
      // var field_lemon_url = drupalSettings.api_lemon_pleiade.field_lemon_url;
      // var field_lemon_myapps_url = drupalSettings.api_lemon_pleiade.field_lemon_myapps_url;
      // var field_lemon_sessioninfo_url = drupalSettings.api_lemon_pleiade.field_lemon_sessioninfo_url;
      // var field_lemon_totp_url = drupalSettings.api_lemon_pleiade.field_lemon_totp_url;

      // Le bureau = frontpage; on lance le get myapplications que sur la frontpage 
     


      if (flag === false) { // Méthode temporaire pour éviter les multiples boucles js au chargement d'une page
        // Méthode temporaire pour éviter les multiples boucles js au chargement d'une page

        $(document).ready(function () {
          
          
          // Pour les différents appels d'API, il faudra revoir en mode séquentiel / intégrer à des fonctions
          // https://www.cognizantsoftvision.com/blog/handling-sequential-ajax-calls-using-jquery/
          $('#spinner-div').show();
          $('#spinner-div-menu').show();//Load button clicked show spinner
          $.ajax({
            url: Drupal.url("api_lemon_pleiade/lemon-myapps-query"), // on appelle l'API de notre module LemonDataApiManager.php
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "POST",
            data: {},
            success: function (donnees) {
              //donnees est le reçu du serveur avec les résultats
              // console.log(donnees);

              // on l'affiche dans une tab des settings du theme pour voir (et pour le fun :))
              // const objJsonLemon = JSON.stringify(donnees);
              // document.getElementById("lemonApps").innerHTML = 
              //   "<pre>" + objJsonLemon + "</pre>";
              
              // div #menuTestLemon
                var menuHtml = '<div class="accordion" id="accordionExample">';

                for (var i = 0; i < donnees.myapplications.length; i++) {
                  // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos liens du menu
                  menuHtml +=
                    '<div><div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapse'+ i +'" aria-expanded="false" aria-controls="collapse'+ i +'"><i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' +
                    donnees.myapplications[i].Category + // on récupère toute les catégories du json qu'on stocke dans une liste
                    '</span></div><ul><div id="collapse'+ i +'" class="accordion-collapse collapse" aria-labelledby="headingOne" ><div class="accordion-body">';
                  for (
                    var f = 0;
                    f < donnees.myapplications[i].Applications.length;
                    f++
                  ) {
                    // Pour chaque catégories, on récupère le nombre d'applications de la catégorie puis on boucle dessus
                    const temp = Object.values(
                      donnees.myapplications[i].Applications[f]
                    );

                    menuHtml += // on créé ensuite le lien avec le title du lien et le la description, pour créer le bloc
                      '<a class="sidebar-link waves-effect waves-dark" title="' +
                      temp[0].AppDesc +
                      '" href="' +
                      temp[0].AppUri +
                      '" aria-expanded="false"><i data-feather="user" class="feather-icon"></i><span class="hide-menu">' +
                      Object.keys(donnees.myapplications[i].Applications[f]) +
                      " </span></a>";
                  }
                  menuHtml += '</div></div></div>';
                }
                menuHtml += "</div>";

              

                document.getElementById("menuTestLemon2").innerHTML = menuHtml; // on récupère l'entièreté du menu créé puis on le stocke dans la div contenant l'id menuTestLemon2
                document.getElementById("droptest").innerHTML += '<li><a class="dropdown-item" href="#">Collectivité Démo</a></li>'; // Pour avoir les icones remplacées dans le innerHTML
                feather.replace();
                
                // Ajout du bloc a la page accueil

                
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
               
              if( drupalSettings.path.currentPath === 'node') { // affichage des blocs Lemon seulement si on est sur la page d'accueil 
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
                        var order = localStorage.getItem(sortable.options.group);
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
              
              // récupère le nombre de div enfante de l'element blocLemonCustom
              

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
                    var order = localStorage.getItem(sortable.options.group);
                    return order ? order.split("|") : [];
                  },

                  /**
                   * Save the order of elements. Called onEnd (when the item is dropped).
                   * @param {Sortable}  sortable
                   */
                  set: function (sortable) {
                    var order = sortable.toArray();
                    localStorage.setItem(sortable.options.group, order.join("|"));
                  },
                },
              });

              var recupBlocForDrag = document.getElementById("testdrag");

              new Sortable.create(recupBlocForDrag, {
                animation: 150,
                store: {
                  // ajout de la sauvegarde des emplacement de chaque blocs au rafraichissement
                  /**
                   * Get the order of elements. Called once during initialization.
                   * @param   {Sortable}  sortable
                   * @returns {Array}
                   */
                  get: function (sortable) {
                    var order = localStorage.getItem(sortable.options.group);
                    return order ? order.split("|") : [];
                  },

                  /**
                   * Save the order of elements. Called onEnd (when the item is dropped).
                   * @param {Sortable}  sortable
                   */
                  set: function (sortable) {
                    var order = sortable.toArray();
                    localStorage.setItem(sortable.options.group, order.join("|"));
                  },
                },
              });
            },
            complete: function () {
              $('#spinner-div-menu').hide();
              $('#spinner-div').hide();//Request is complete so hide spinner
            }
            
          });
          $("#blocLemonCustom").appendTo("#testdrag");

          
        
            // Méthode temporaire pour éviter les multiples boucles js au chargement d'une page
            flag = true;  
          // fin if false flag méthode temporaire
          // fin si frontpage

          // Si page history
            if( drupalSettings.path.currentPath === 'history') {

          console.log('We are on page : history!!');
        
          $.ajax({
          url: Drupal.url("api_lemon_pleiade/lemon-session-query"), // on appelle l'API de notre module LemonDataApiManager.php
          dataType: "json", // on spécifie bien que le type de données est en JSON
          type: "POST",
          data: {},

          success: function (history) {
            //historique en json
            //console.log(history);
            history_table = '<table class="table"><thead><tr><th scope="row">Connexions réussies</th></tr><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
            for (var i = 0; i < history._loginHistory.successLogin.length; i++) {
              
              var objectDate = new Date(history._loginHistory.successLogin[i]._utime * 1000 );

              history_table += '<tr><td>'+ String(objectDate.getDate()).padStart(2, '0')+"/"+String(objectDate.getMonth()+1).padStart(2, '0')+"/"+objectDate.getFullYear()+" "+String(objectDate.getHours()).padStart(2, '0')+":"+String(objectDate.getMinutes()).padStart(2, '0')+'</td><td>' + history._loginHistory.successLogin[i].ipAddr + '</td></tr>';
            }
            history_table += '</tbody></table><table class="table mb-5"><thead><tr><th scope="row">Connexions échouées</th></tr><tr><th scope="col">Date</th><th scope="col">Adresse IP</th></tr></thead><tbody>';
            for (var i = 0; i < history._loginHistory.failedLogin.length; i++) {
              
              var objectDate = new Date(history._loginHistory.failedLogin[i]._utime * 1000 );

              history_table += '<tr><td>'+ String(objectDate.getDate()).padStart(2, '0')+"/"+String(objectDate.getMonth()+1).padStart(2, '0')+"/"+objectDate.getFullYear()+" "+String(objectDate.getHours()).padStart(2, '0')+":"+String(objectDate.getMinutes()).padStart(2, '0')+'</td><td>' + history._loginHistory.successLogin[i].ipAddr + '</td></tr>';
            }
            
            document.getElementById("history-connexion").innerHTML = history_table;
            
          },
          complete: function () {
            $('#spinner-div').hide();//Request is complete so hide spinner
            $('#spinner-history').hide();//Request is complete so hide spinner
          }

        });
        flag = true; 
      } 
    });// fin si page history
    }
  },
    
  };
})(jQuery, Drupal, drupalSettings);