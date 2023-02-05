(function ($, Drupal, drupalSettings) {
    Drupal.behaviors.APIlemonDataPleiadeBehavior = {
      attach: function (context, settings) {
        // var field_lemon_url = drupalSettings.api_lemon_pleiade.field_lemon_url;
        // var field_lemon_myapplications_url = drupalSettings.api_lemon_pleiade.field_lemon_myapplications_url;
        // var field_pastell_url = drupalSettings.api_lemon_pleiade.field_pastell_url;
        // var field_parapheur_url = drupalSettings.api_lemon_pleiade.field_parapheur_url;
        // var field_ged_url = drupalSettings.api_lemon_pleiade.field_ged_url;
  
        $(document).ready(function () {
          // TEST JS custom module init +
  
          // $( "#blocLemonCustom" ).sortable();
  
          console.log("Module Pléiade API/Lemon --> hello :))");
  
          $.ajax({
            url: Drupal.url("api_lemon_pleiade/pleiade-data-autocomplete"), // on appelle le script JSON
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "POST",
            data: {
              //variable envoyé avec la requête vers le serveur
              myapplications: "", // pour le moment on recupere tout ce que renvoie myapplications de lemon
            },
            success: function (donnees) {
              //donnees est le reçu du serveur avec les résultats
              // console.log(donnees);
  
              // on l'affiche dans une tab des settings du theme pour voir (et pour le fun :))
              const obj = JSON.stringify(donnees);
              document.getElementById("lemonApps").innerHTML =
                "<pre>" + obj + "</pre>";
  
              // div #menuTestLemon
              var menuHtml = "<ul>";
  
              for (var i = 0; i < donnees.myapplications.length; i++) { // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos lien du menu 
                menuHtml +=
                  '<li class="nav-small-cap"><i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' +
                  donnees.myapplications[i].Category + // on récupère toute les catégories du json qu'on stocke dans une liste 
                  "</span></li>";
                for ( var f = 0; f < donnees.myapplications[i].Applications.length; f++) { // Pour chaque catégories, on récupère le nombre d'applications de la catégorie puis on boucle dessus 
                  const temp = Object.values(donnees.myapplications[i].Applications[f]);
  
                  menuHtml +=                 // on créé ensuite le lien avec le title du lien et le la description, pour créer le bloc
                    '<a class="sidebar-link waves-effect waves-dark" title="' +
                    temp[0].AppDesc +
                    '" href="' +
                    temp[0].AppUri +
                    '" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-corner-down-right"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg><span class="hide-menu">' +
                    Object.keys(donnees.myapplications[i].Applications[f]) +
                    " </span></a>";
                }
                menuHtml += '<li class="nav-devider"></li>';
              }
              menuHtml += "</ul>";
  
              document.getElementById("menuTestLemon2").innerHTML = menuHtml; // on récupère l'entièreté du menu créé puis on le stocke dans la div contenant l'id menuTestLemon2
  
              // Ajout du bloc a la page accueil
  
              var blocLemon = "";
  
              for (var i = 0; i < donnees.myapplications.length; i++) {
  
                // nommage id div pour boucle du bloc i pour drag and drop 
                var id = 'row-'+i;
              
                blocLemon +=
                  `<div class="col-lg-12"><div class="mb-2 shadow-lg"><div class="card my-2"><div class="card-header rounded-top" style="background-color: #1f3889"><h4 class="card-title text-light">` +
                  donnees.myapplications[i].Category +
                  `<span></span></h4></div><div class="card-body"><div class="row px-4" id="${id}">`; // ajout de le l'id dans le html avec le numéro de boucle
                for ( var f = 0; f < donnees.myapplications[i].Applications.length; f++) {
                  const temp = Object.values(
                    donnees.myapplications[i].Applications[f]
                  );
  
                  blocLemon +=
                    '<div class="col-md-4 my-3"><a class="border-dark text-center row py-3 h-100 shadow-lg" title="' +
                    temp[0].AppDesc +
                    '" href="' +
                    temp[0].AppUri +
                    '"><div class="col-4 align-items-center justify-content-center d-flex"><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><div class="col-8 "><h5 class="card-title">' +
                    Object.keys(donnees.myapplications[i].Applications[f]) +
                    '</h5><p class="text-muted">' +
                    temp[0].AppDesc +
                    '</p></div></a></div>';
                }
                blocLemon += "</div></div></div></div></div></div>";
  
              }
              
  
              document.getElementById("blocLemonCustom").innerHTML = blocLemon; // ajout du html dans la div avec l'id blocLemonCustom
  
              // récupère le nombre de div enfante de l'element blocLemonCustom
                const htmlDoc = document.getElementById("blocLemonCustom");
                const box = htmlDoc.children.length;
                for ( var f = 0; f < box; f++){
                  // récup des éléments du bloc dont l'id contient row-n
                  var temps = document.getElementById("row-"+f);
                  Sortable.create(temps, {
                    animation: 150,
                    store: { // ajout de la sauvegarde des emplacements de chaque blocs au rafraichissement
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
                }
  
              var el = document.getElementById("blocLemonCustom");
              
              new Sortable.create(el, {
                animation: 150,
                store: { // ajout de la sauvegarde des emplacement de chaque blocs au rafraichissement
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
          });
        });
      },
    };
  })(jQuery, Drupal, drupalSettings);
  