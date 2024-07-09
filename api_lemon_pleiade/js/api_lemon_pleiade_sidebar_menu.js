(function ($, Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APIlemonMenuBehavior = {
    attach: function (context, settings) {
      // All normal pages but not admin pages
      if (!drupalSettings.path.currentPath.includes("admin") && drupalSettings.api_lemon_pleiade.field_lemon_myapps_url && drupalSettings.api_lemon_pleiade.field_lemon_url) {
        once("APIlemonMenuBehavior", "body", context).forEach(function () {
          var xhr = new XMLHttpRequest();
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
  
          const userGroupsTempstore = decodeURIComponent(getCookie('groups'));
          
          xhr.open("POST", Drupal.url("v1/api_lemon_pleiade/lemon_myapps_query"));
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = JSON.parse(xhr.responseText);
              
              // Check if xhr response is not null
              if (!donnees || donnees === null) {
                // Redirect to /user/logout URL
                window.location.href = "/user/logout";
                return;
              }
              var menuHtml = '';
              if (donnees.myapplications) {
                for (var i = 0; i < donnees.myapplications.length; i++) {
                  // on récupère la longueur du json pour boucler sur le nombre afin de créer tout nos liens du menu
                  var iconCategory = ''
                  switch (donnees.myapplications[i].Category) {
			case 'E-administration':
                      iconCategory = '<i class="fa-solid fa-people-arrows"></i>'
                      break;
                    case 'Documents':
                      iconCategory = '<i class="fa-solid fa-folder-open"></i>'
                      break;
                    case 'Collaboratif':
                      iconCategory = '<i class="fa-solid fa-users"></i>'
                      break;
                    case 'Support et formation':
                      iconCategory = '<i class="fa-solid fa-circle-info"></i>'
                      break;
                    case 'Mes applications':
                      iconCategory = '<i class="fa-solid fa-star"></i>'
                      break;
                    case 'Territoire Numérique Ouvert - Prod':
                      iconCategory = '<i class="fa-solid fa-people-group"></i>'
                      break;
                    case 'Territoire Numérique Ouvert - Test':
                      iconCategory = '<i class="fa-solid fa-people-group"></i>'
                      break;
                    case 'Applications PROD':
                      iconCategory = '<i class="fa-solid fa-list"></i>'
                      break;
                    case 'Applications TEST':
                      iconCategory = '<i class="fa-solid fa-list"></i>'
                      break;
                    case 'Documentation':
                      iconCategory = '<i class="fa-solid fa-file"></i>'
                      break;
                    case 'Sécurité':
                      iconCategory = '<i class="fa-solid fa-shield-halved"></i>'
                      break;
	            case 'Nos services':
                      iconCategory = '<i class="fa-regular fa-handshake"></i>'
                      break;
		case 'Administration':
		iconCategory = '<i class="fa-regular fa-gear"></i>'
                    default:
                      break;
                  }
                  var categorie =  donnees.myapplications[i].Category
                  menuHtml +=
                    '<div id="'
                    + ( categorie ? categorie.replace(/[^\w]/gi, '').toLowerCase() : "") + '" class="nav-small-cap has-arrow collapsed ' 
                     + (categorie == "E-administration" ? "e_admin" : "") +
                    '" data-bs-toggle="collapse" data-bs-target="#collapse' +
                    i +
                    '" aria-expanded=" false" aria-controls="collapse' +
                    i +
                    '">' + iconCategory + '<span class="hide-menu d-flex align-items-center">' +
                    categorie +
                    (categorie == "E-administration" ? "<span class='pastille_eadministration'></span>" : "") +
                    (categorie == "Collaboratif" ? "<span class='pastille_collab'></span>" : "") +
                    '</span></div><div id="collapse' +
                    i +
                    '" class="accordion-collapse collapse" aria-labelledby="headingOne"><div class="accordion-body">';

                  for (var f = 0; f < donnees.myapplications[i].Applications.length; f++) {
                    // Pour chaque catégories, on récupère le nombre d'applications de la catégorie puis on boucle dessus
                    const temp = Object.values(donnees.myapplications[i].Applications[f]);
                    const appLogo = temp[0].AppIcon;
                    const hasImageExtension = appLogo && (appLogo.endsWith(".png") || appLogo.endsWith(".jpg") || appLogo.endsWith(".jpeg") || appLogo.endsWith(".gif"));
                    let Icon;
                    var target;
                    if (appLogo && !hasImageExtension) {
                      Icon = '<i class="fa fa-solid fa-' + appLogo + '"></i>';
                    } else {
                      Icon = '';
                    }
                    if (temp[0].AppDesc == "Consulter nos solutions" || 
                    temp[0].AppDesc == "Consulter nos formations" || 
                    temp[0].AppDesc == "Consulter nos guides utilisateurs" ||
                    temp[0].AppDesc == "Demander une visio") {
                      target = ''
                    }
                    else {
                      target = '_blank'
                    }

                    if (categorie == "E-administration") {
                      if (temp[0].AppUri) {
                        if (temp[0].AppDesc == "Gestion des users/collectivités") {
                          menuHtml += '<a href="'+ temp[0].AppUri +'"target="_blank" class="sidebar-link"><span class="ps-2">'+temp[0].AppDesc+'</span></a>'
                        }
                        else {
                        menuHtml += '<a class="sidebar-link waves-effect waves-dark has-arrow" id="' + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + '" title="' +
                          temp[0].AppDesc +
                          '" href="' +
                          temp[0].AppUri +
                          '" aria-expanded="true" target="' + target + '" data-bs-toggle="collapse" data-bs-target="#collapse' + temp[0].AppTip + '" aria-controls="collapse' + temp[0].AppTip + '">' +
                          Icon +
                          '<span class="hide-menu px-2">' +
                          Object.keys(donnees.myapplications[i].Applications[f]) +
                          "</span></a>";
                        }
                      } else {
                        menuHtml += '<span class="sidebar-link waves-effect waves-dark has-arrow" id="' + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + '" title="' +
                          temp[0].AppDesc +
                          '" aria-expanded="false" data-bs-toggle="collapse" data-bs-target="#collapse' + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + '" aria-controls="collapse' + temp[0].AppTip + '">' +
                          Icon +
                          '<span class="hide-menu px-2 d-flex align-items-center">' +
                          Object.keys(donnees.myapplications[i].Applications[f]) +
                          "<span id='pastille_" + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + "'></span></span></span>";
                      }
                    } else {
                      if (temp[0].AppUri) {
                        menuHtml += '<a class="sidebar-link waves-effect waves-dark" id="' + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + '" title="' +
                          temp[0].AppDesc +
                          '" href="' +
                          temp[0].AppUri +
                          '" aria-expanded="false" target="' + target + '">' +
                          Icon +
                          '<span class="hide-menu px-2">' +
                          Object.keys(donnees.myapplications[i].Applications[f]) +
                          " </span></a>";
                      } else {
                        menuHtml += '<span class="sidebar-link waves-effect waves-dark" id="' + temp[0].AppTip.replace(/[^\w]/gi, '').toLowerCase() + '" title="' +
                          temp[0].AppDesc +
                          '" aria-expanded="false">' +
                          Icon +
                          '<span class="hide-menu px-2">' +
                          Object.keys(donnees.myapplications[i].Applications[f]) +
                          " </span></span>";
                      }
                    }

                  }

                  menuHtml += "</div></div>";
                }
              }

              menuHtml += "";

              document.getElementById("menuLemon").innerHTML += menuHtml; // on récupère l'entièreté du menu créé puis on le stocke dans la div contenant l'id menuLemon
              

            }
            else {
              window.location.href = "/user/logout";
              return;
            }
           
          };

          xhr.onloadend = function () {
          };
          xhr.send(JSON.stringify({}));

        }); // fin once
      } // fin exlude admin pages
      $(document).ready(function () {
        setTimeout(function () {
          /*if (
          || $('body').hasClass('path-nos-guides-utilisateurs')
          || $('body').hasClass('page-node-type-guide-utilisateur')
          ||($('body').hasClass('path-webform') && $('form').hasClass('webform-submission-demande-d-information-sur-une-so-form'))) {
            $('#collapse3').addClass('show');
          }

          if ($('body').hasClass('path-webform') && $('form').hasClass('webform-submission-demande-de-visio-form')) {
            $('#collapse2').addClass('show');
          }
*/
	if ($('body').hasClass('path-nos-formations') || $('body').hasClass('path-nos-solutions')
	|| $('body').hasClass('page-node-type-formations')|| $('body').hasClass('page-node-type-solutions') ||
        ($('body').hasClass('path-webform') && $('form').hasClass('webform-submission-demande-d-information-sur-une-so-form'))) 
{
$('#collapse6').addClass('show');
}
        }, 1100);
        $('#sidebarnav').on('click', '.nav-small-cap', function () {
          var target = $(this).attr('data-bs-target');
          var collapses = $('#sidebarnav').find('.collapse');

          collapses.each(function () {
            var collapse = $(this);
            var collapseId = collapse.attr('id');

            if ('#' + collapseId !== target) {
              collapse.collapse('hide');
            }
          });
        });
        $('#sidebarnav').on('click', '.sidebar-link.has-arrow', function () {
          var target = $(this).attr('data-bs-target');
          var collapses = $('#sidebarnav').find('.sub_menu_eadmin');

          collapses.each(function () {
            var collapse = $(this);
            var collapseId = collapse.attr('id');

            if ('#' + collapseId !== target) {
              collapse.collapse('hide');
            }
          });
        });

      });

    },
  };
})(jQuery, Drupal, drupalSettings, once);
