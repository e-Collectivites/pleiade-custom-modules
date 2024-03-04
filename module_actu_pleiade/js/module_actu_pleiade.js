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
              const div = document.querySelector('.actualites');
              var blocActu = ""
              
              if (donnees && div) {

                blocActu += 
                '<div class="col-lg-12">\
                  <div>\
                    <div class="card">\
                      <div class="card-header rounded-top bg-white rounded-top">\
                        <h4 class="card-title text-dark py-2">Dernières actualités</h4></div>\
                          <div class="" id="carousel_actualites">\
                  '
                for (var i = 0; i < donnees.length; i++) {
                 
                  if (
                    donnees[i].title &&
                    donnees[i].view_node
                ) {
                  var tag = '';
                  if (Array.isArray(donnees[i].field_tags)) {
                      tag = '<h5 class="tag_btn position-absolute w-auto p-2 text-uppercase">' + donnees[i].field_tags.join(', ') + '</h5>';
                  } else {
                      tag = '<h5 class="tag_btn position-absolute w-auto p-2 text-uppercase">' + donnees[i].field_tags + '</h5>';
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
                blocActu += "</div></div></div></div>";
              }
              else 
              {

              }
              var moodleCoursesElement = document.querySelector('.actualites');

              if (moodleCoursesElement) {
               
                moodleCoursesElement.innerHTML = blocActu;
              } else {
                
                console.error("Element with class 'actualites' not found.");
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
                // variableWidth: true,
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
