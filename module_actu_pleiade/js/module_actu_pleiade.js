(function ($, Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.ActuBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      setTimeout(function () {
      once("ActuBlocksBehavior", ".actualites", context).forEach(
        function () {
          // make ajax call
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/module_actu_pleiade/actu_list"));
          
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = (xhr.response);
              console.log(donnees)
              const div = document.querySelector('.actualites');
              var blocActu = ""
              blocActu += 
                '<div class="col-lg-12">\
                  <div>\
                    <div class="card">\
                      <div class="card-header rounded-top bg-white rounded-top">\
                        <span class="card-title text-dark py-2">Dernières actualités</span></div>\
                          <div class="" id="carousel_actualites">\
                  '
              if (donnees && div) {

                
                for (var i = 0; i < donnees.length; i++) {
                 
                  if (
                    donnees[i].title &&
                    donnees[i].view_node
                ) {
                  var tag = '';
                  if (Array.isArray(donnees[i].field_tags)) {
                      tag = '<span class="tag_btn position-absolute w-auto p-2 text-uppercase">' + donnees[i].field_tags.join(', ') + '</span>';
                  } else {
                      tag = '<span class="tag_btn position-absolute w-auto p-2 text-uppercase">' + donnees[i].field_tags + '</span>';
                  }
            
                    // Tronquer la description à 50 caractères
                    blocActu +=
                        '<a href="' + donnees[i].view_node + '" class="d-flex mb-2 justify-content-center" target="_blank">\
                            <div class="card" style="height: 230px; width: 250px;">\
                                <img src="' + donnees[i].field_image + '" class="card-img-top" alt="Course Image">\
                                <div class="card-body d-flex flex-column" >' +
                                    tag + '\
                                    <h5 class="created_date position-absolute w-auto">le ' + donnees[i].created + '</h5>\
                                    <h5 class="card-title d-flex justify-content-start text-black">' + donnees[i].title + '</h5>\
                                </div>\
                            </div>\
                        </a>';
                }
                }
                
                if (div) {
                  blocActu += "</div></div></div></div>";
                  div.innerHTML = blocActu;
                } else {
                  
                  console.error("Element with class 'actualites' not found.");
                }

              }
              else 
              {
                blocActu += "<h5>Erreur lors de la récupération des actus... Veuillez contacter l'administrateur</h5>"
                blocActu += "</div></div></div></div>";
                div.innerHTML = blocActu
                console.error("Erreur lors de la récupération des actus..");
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
              
              $('#carousel_actualites').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                arrows: true,
                dots: true,
                autoplay: true,
                autoplaySpeed: 4000,
                customPaging: function (slider, i) {
                  // this example would render "tabs" with titles
                  return '<i class="fa-solid fa-circle"></i>';
                },
              });
            }
          };
          xhr.send();
        }); // end once
      }, 2000); // 1000 millisecondes = 1 seconde
    },
  };
})(jQuery, Drupal, drupalSettings, once);
