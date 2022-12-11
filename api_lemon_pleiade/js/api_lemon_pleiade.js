(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.APIlemonDataPleiadeBehavior = {
    attach: function (context, settings) {
      // var field_lemon_url = drupalSettings.api_lemon_pleiade.field_lemon_url;
      // var field_lemon_myapplications_url = drupalSettings.api_lemon_pleiade.field_lemon_myapplications_url;
      // var field_pastell_url = drupalSettings.api_lemon_pleiade.field_pastell_url;
      // var field_parapheur_url = drupalSettings.api_lemon_pleiade.field_parapheur_url;
      // var field_ged_url = drupalSettings.api_lemon_pleiade.field_ged_url;

      $(document).ready(function () {
        // TEST JS custom module init


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

            for (var i = 0; i < donnees.myapplications.length; i++) {
              menuHtml +=
                '<li class="nav-small-cap"><i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' +
                donnees.myapplications[i].Category +
                "</span></li>";
              for (
                var f = 0;
                f < donnees.myapplications[i].Applications.length;
                f++
              ) {
                const temp = Object.values(
                  donnees.myapplications[i].Applications[f]
                );

                menuHtml +=
                  '<a class="sidebar-link waves-effect waves-dark" title="' +
                  temp[0].AppDesc +
                  +'" href="' +
                  temp[0].AppUri +
                  '" aria-expanded="false"><span class="hide-menu">' +
                  Object.keys(donnees.myapplications[i].Applications[f]) +
                  " </span></a>";
              }
              menuHtml += '<li class="nav-devider"></li>';
            }
            menuHtml += "</ul>";

            document.getElementById("menuTestLemon2").innerHTML = menuHtml;

            // Ajout du bloc a la page accueil

            var blocLemon = "";

            for (var i = 0; i < donnees.myapplications.length; i++) {
              blocLemon +=
                '<div class="col-lg-12 draggable"><div class="mb-2 shadow-lg"><div class="card  my-2"><div class="card-header rounded-top" style="background-color: #1f3889"><h4 class="card-title text-light">' +
                donnees.myapplications[i].Category +
                '<span></span></h4></div><div class="card-body"><div class="row">';
              for (
                var f = 0;
                f < donnees.myapplications[i].Applications.length;
                f++
              ) {
                const temp = Object.values(
                  donnees.myapplications[i].Applications[f]
                );

                blocLemon +=
                  '<div class="col-md-4"><div class="border-dark text-center h-100 shadow-sm "><a title="' +
                  temp[0].AppDesc +
                  '" href="' +
                  temp[0].AppUri +
                  '"><div class="col-12 pt-3"><h5 class="card-title">' +
                  Object.keys(donnees.myapplications[i].Applications[f]) +
                  '</h5><p class="text-muted">' +
                  temp[0].AppDesc +
                  "</p></div></a></div></div>";
              }
              blocLemon += "</div></div></div></div></div></div>";
            }

            document.getElementById("blocLemonCustom").innerHTML = blocLemon;
          },
        });
      });
    },
  };
})(jQuery, Drupal, drupalSettings);
