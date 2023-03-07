(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraUserInfoBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      if (drupalSettings.path.isFront) {
        once("APIzimbraUserInfoBehavior", "body", context).forEach(function () {
          // requete
          
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/api_user_pleiade/user_infos_query"));
          xhr.responseType = "json";
          xhr.onload = function () {
            if (xhr.status === 200) {

              var donnees = xhr.response;
              //console.log(donnees);
              // get the current datetime
              var now = Math.floor(Date.now() / 1000);  
              // add one hour to current datetime
              var oneHourAgo = now + (60 * 60);
              // get notification_alert div  
              const div = document.querySelector('#notification_alert'); 
              //console.log(oneHourAgo);
              if(donnees){  
                
                var myDiv = document.querySelector('.alert_popup svg'); // if notifictation hide svg bell 
                myDiv.style.display = "none";
                const div_alert = document.querySelector('.alert_popup'); // add svg with red point
                div_alert.innerHTML += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="25" height="25" viewBox="0 0 24 24" fill="none"stroke="currentColor" stroke-width="2" xml:space="preserve" style="cursor: pointer;"><defs></defs><g transform="matrix(1 0 0 1 12 12)"  ><g style=""><g transform="matrix(1 0 0 1 0 -2.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -9.5)" d="M 18 8 A 6 6 0 0 0 6 8 c 0 7 -3 9 -3 9 h 18 s -3 -2 -3 -9" stroke-linecap="round" /></g><g transform="matrix(1 0 0 1 0 9.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -21.5)" d="M 13.73 21 a 2 2 0 0 1 -3.46 0" stroke-linecap="round" /></g></g></g><g transform="matrix(0.07 0 0 0.07 19.5 3.33)"  ><circle style="stroke: rgb(255,0,0); stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-rule: nonzero; opacity: 1;" vector-effect="non-scaling-stroke"  cx="0" cy="0" r="40" /></g></svg>';
                
                for (var i = 0; i < donnees.length; i++) {

                  var timestamp_task = donnees[i].start_task;

                  if(donnees[i].hasOwnProperty("haveMail")){ // if notification type is for the mails

                    let count_mail = donnees[i].count_mail;
                    // console.log(count_mail) 
                    if (count_mail > 1 ){ // if many mails

                      div.innerHTML += '<a class="dropdown-item" href="#" id="scrollToMails">\
                      <span class="d-flex my-1 text-decoration-underline"><strong>Notification Zimbra</strong></span>\
                      <i data-feather="mail" class="feather-sm text-info me-1 ms-1"></i>\
                        Vous avez <strong>'+ count_mail +'</strong> mails non lus.\
                      </div>\
                      <div class="dropdown-divider"></a>';
                    }
                    else if (count_mail == 1){ // if one mail 

                      div.innerHTML += '<a class="dropdown-item" href="#" id="scrollToMails">\
                      <span class="d-flex my-1 text-decoration-underline"><strong>Notification Zimbra</strong></span>\
                      <i data-feather="mail" class="feather-sm text-info me-1 ms-1"></i>\
                        Vous avez 1 mail non lu.\
                      </div>\
                      <div class="dropdown-divider"></a>';
                    }
                  }
                  // if norification is soon tasks, and if task is between now and now +1 hour 
                  else if( donnees[i].hasOwnProperty("name_task") && now < timestamp_task && timestamp_task < oneHourAgo) { 

                    div.innerHTML += '<a class="dropdown-item" href="#" id="scrollToTasks">\
                    <span class="d-flex my-1 text-decoration-underline" ><strong>Notification Zimbra</strong></span>\
                    <i data-feather="alert-circle" class="feather-sm text-info me-1 ms-1"></i>\
                      Nouvel évènement à venir: ' + donnees[i].name_task + '\
                    </div>\
                    <div class="dropdown-divider"></a';
                  }
                  else if( donnees[i].hasOwnProperty("haveDocs") ) { // if notification is iparapheur 
                    
                    div.innerHTML += '<a class="dropdown-item"  href="#" id="scrollToSign">\
                    <span class="d-flex my-1 text-decoration-underline" ><strong>Notification IParapheur</strong></span>\
                    <i data-feather="alert-circle" class="feather-sm text-info me-1 ms-1"></i>\
                      Vous avez <b>' + donnees[i].count_bureaux + '</b> documents en attente de signature.\
                    </div>\
                    <div class="dropdown-divider"></a>';
                  }
                }
              }
              else // if no notification
              {
                div.innerHTML += '<div class="dropdown-item">\
                <div class="d-flex justify-content-center">Aucune nouvelle notification</div>';
              }
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