(function (Drupal, once) {
    "use strict";
    Drupal.behaviors.APIlemonMenuBehavior = {
      attach: function (context, settings) {
        // All normal pages but not admin pages
        if (!drupalSettings.path.currentPath.includes("admin")) {
          once("APIlemonMenuBehavior", "body", context).forEach(function () {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", Drupal.url("v1/api_lemon_pleiade/lemon-myapps-query"));
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = JSON.parse(xhr.responseText);
                var menuHtml = '<div class="accordion" id="accordionExample">';
  
                for (var i = 0; i < donnees.myapplications.length; i++) {
                  // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos liens du menu
                  menuHtml +=
                    '<div style="max-width: 240px;"><div class="nav-small-cap has-arrow collapsed" data-bs-toggle="collapse" data-bs-target="#collapse' +
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
              }
              document.getElementById('spinner-div-sidebar').style.display = 'none';
            };
            xhr.send(JSON.stringify({}));
          }); // fin once
        } // fin exlude admin pages
      },
    };
  })(Drupal, once);