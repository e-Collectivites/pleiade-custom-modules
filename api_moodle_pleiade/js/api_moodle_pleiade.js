(function (Drupal, once, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIMoodleBehavior = {
      attach: function (context, settings) {

        if (drupalSettings.path.isFront) {
          once("APIMoodleBehavior", "body", context).forEach(function () {
            
            var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_moodle_pleiade/moodle_entities"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {

              var donnees = (xhr.response);
              const div = document.querySelector('#moodle_courses'); 
              var blocMoodle = ""
              if(donnees && div)
              {  
                
                blocMoodle += '<div class="col-lg-12">\
                                <div>\
                                  <div class="card mb-2">\
                                    <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                                      <h4 class="card-title text-dark py-2">Cours E-Learning d\'E-collectivités</h4></div>\
                                        <div class="d-flex justify-content-evenly mx-2">\
                  '
                var count_entities = donnees.length - 1
                var usedNumbers = [1];
                for (var i = 0; i < 3; i++) {
                    var number = Math.floor(Math.random() * count_entities  + 1);
                    if (usedNumbers.includes(number)) {
                        // Number is already used, decrement the loop index to try again
                        i--;
                    } 
                    else 
                    {
                      usedNumbers.push(number);
                      
                      if(donnees[number].overviewfiles[0])
                      {
                        if(donnees[number].overviewfiles[0].fileurl)
                        {
                            var imageurl = donnees[number].overviewfiles[0].fileurl
                        }
                      }
                      else
                      {
                          var imageurl = "https://ecollectivites.fr/sites/default/files/inline-images/logo-ecollectivites.jpg"
                      }
                      if(donnees[number].categoryname)
                      {
                          var categoryCourse = donnees[number].categoryname
                      }
                      else
                      {
                          var categoryCourse= ""
                      }
                      
                     
                      if(number !== 0){
                      blocMoodle += 
                      '<a href="https://preprod.ecollectivites.fr/moodle/course/view.php?id='+ donnees[number].id +'?authCAS=CAS">\
                        <div class="mt-3 d-flex justify-content-center">\
                          <div class="card">\
                            <img src="'+ imageurl +'" class="card-img-top" alt="Course Image">\
                            <div class="card-body d-flex flex-column">\
                              <h5 class="card-title d-flex justify-content-center">'+ categoryCourse +'</h5>\
                              <p class="d-flex align-items-center justify-content-center btn mt-auto btn-e-coll text-white w-100">Voir ce cours</p>\
                            </div>\
                          </div>\
                        </div>\
                        </a>';
                    }
                    
                   
                  }
                }
                blocMoodle += "</div></div></div></div>";
              }
              else // if no notification
              {

              }
              document.getElementById("moodle_courses").innerHTML =
              blocMoodle;
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
            
          };

          xhr.send();
          });
        }
      }
    }
})(Drupal, once, drupalSettings);