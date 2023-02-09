(function ($, Drupal, once) {
  "use strict";
  Drupal.behaviors.APIlemonMenuBehavior = {
    attach: function (context, settings) {
      // exclude admin pages
      if (!drupalSettings.path.currentPath.includes("admin")) {
        once("APIlemonMenuBehavior", "body", context).forEach(function () {
          
          $.ajax({
            url: Drupal.url("v1/api_lemon_pleiade/lemon-myapps-query"), // on appelle l'API de notre module LemonDataApiManager.php
            dataType: "json", // on spécifie bien que le type de données est en JSON
            type: "POST",
            data: {},
            success: function (donnees) {
              var menuHtml = '<div class="accordion" id="accordionExample">';

              for (var i = 0; i < donnees.myapplications.length; i++) {
                // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos liens du menu
                menuHtml +=
                  '<div><div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapse' +
                  i +
                  '" aria-expanded="false" aria-controls="collapse' +
                  i +
                  '"><i class="mdi mdi-dots-horizontal"></i><span class="hide-menu">' +
                  donnees.myapplications[i].Category + // on récupère toute les catégories du json qu'on stocke dans une liste
                  '</span></div><ul><div id="collapse' +
                  i +
                  '" class="accordion-collapse collapse" aria-labelledby="headingOne" ><div class="accordion-body">';
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
                menuHtml += "</div></div></div>";
              }
             
              menuHtml += "</div>";

              document.getElementById("menuTestLemon2").innerHTML = menuHtml; // on récupère l'entièreté du menu créé puis on le stocke dans la div contenant l'id menuTestLemon2
              feather.replace();
            },
            complete: function () {
              $("#spinner-div-menu").hide();
              $("#spinner-div").hide(); //Request is complete so hide spinner
            },
          });
        }); // fin once
      } // fin exlude admin pages
    },
  };
})(jQuery, Drupal, once);
