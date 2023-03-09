(function (Drupal, once, drupalSettings) {
    "use strict";
    Drupal.behaviors.APIzimbraUserImgBehavior = {
      attach: function (context, settings) {
        // Load on front page only,
        if (drupalSettings.path.isFront && drupalSettings.api_zimbra_pleiade.field_zimbra_mail) {
           
          once("APIzimbraUserImgBehavior", "body", context).forEach(
            
            function () {
                    
                // spinner
                    // document.getElementById("profile-picture").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
                    
                // requete
                    
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", Drupal.url("v1/api_user_pleiade/user_list_query"));
                    xhr.responseType = "json";
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            var donnees = xhr.response;
                            if(donnees){
                                const divs = document.getElementsByClassName("mail_content"); // get list of mails
                                for (let i = 0; i < divs.length; i++) {
                                    // console.log(divs[i].getAttribute("mail-expe"));
                                    for (let j = 0; j < donnees.length; j++) { // for every mail check expeditor e-mail 
                                        if(donnees[j].email == divs[i].getAttribute("mail-expe")){
                                            if(donnees[j].picture_url)
                                            {
                                                divs[i].querySelector(".profile-picture").insertAdjacentHTML("afterbegin", '<img src="'+ donnees[j].picture_url +'" alt="user" width="30" height="30" class="profile-pic rounded-circle" />')
                                            }                                  
                                        }   
                                    }
                                    if( divs[i].querySelector(".profile-picture").innerHTML === ""){
                                        divs[i].querySelector(".profile-picture").insertAdjacentHTML("afterbegin", '<img src="sites/default/files/default_images/img_user.png" alt="user" width="30" height="30" class="profile-pic rounded-circle" />')
                                    }
                                }
                            }
                            // console.log(donnees);
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

                    
                      
                    // feather icons
                    feather.replace();
                    };

                    xhr.send();

                    
                }); // fin once function
            }
          },
        };
      })(Drupal, once, drupalSettings);
      