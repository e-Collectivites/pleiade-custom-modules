(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APImessageBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (
        drupalSettings.path.isFront &&
        drupalSettings.message_module_pleiade
      ) {
        once(
          "APImessageBlocksBehavior",
          ".message_avertissement",
          context
        ).forEach(function () {
          // make ajax call
          var xhr = new XMLHttpRequest();
          xhr.open(
            "POST",
            Drupal.url("v1/message_module_pleiade/message_fields")
          );
          xhr.setRequestHeader(
            "Content-Type",
            "application/x-www-form-urlencoded"
          );
          xhr.responseType = "json";
          xhr.onload = function () {
            // if (xhr.status === 200) {
            //   var donnees = xhr.response;
            //   if(donnees[0]){

            //         const div_alert = document.querySelector('.message_avertissement');
            //         switch (donnees[0].gravite) {
            //             case "info":
            //                 div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-success opacity-75 d-flex align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
            //               break;
            //             case "warning":
            //                 div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-warning d-flex opacity-75 align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
            //               break;
            //             case "danger":
            //                 div_alert.innerHTML += '<div class="py-3 px-5 text-white bg-danger d-flex opacity-75 align-items-center justify-content-center text-capitalize">'+ donnees[0].message +'</div>'
            //               break;
            //             default:
            //               break;
            //         }
            //   }
            // };

            if (xhr.status === 200) {
              var donnees = xhr.response;
              const div = document.querySelector("#notification_alert");
              if (donnees.length > 0 && div) {
                window.onload = function () {
                  var displayNotif =
                    document.getElementById("notification_alert"); // replace "myDiv" with the actual id of your div
                  displayNotif.style.display = "block";
                };
                var svg_bell = document.querySelector(".alert_popup svg"); // if notifictation hide svg bell
                if (svg_bell) {
                  svg_bell.style.display = "none";
                }
                const div_alert = document.querySelector(".alert_popup"); // add svg with red point
                if (div_alert) {
                  div_alert.classList.add("notification_scale");
                  div_alert.innerHTML +=
                    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="25" height="25" viewBox="0 0 24 24" fill="none"stroke="currentColor" stroke-width="2" xml:space="preserve" style="cursor: pointer;"><defs></defs><g transform="matrix(1 0 0 1 12 12)"  ><g style=""><g transform="matrix(1 0 0 1 0 -2.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -9.5)" d="M 18 8 A 6 6 0 0 0 6 8 c 0 7 -3 9 -3 9 h 18 s -3 -2 -3 -9" stroke-linecap="round" /></g><g transform="matrix(1 0 0 1 0 9.5)"  ><path style="stroke: #1f3889; stroke-width: 2; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"  transform=" translate(-12, -21.5)" d="M 13.73 21 a 2 2 0 0 1 -3.46 0" stroke-linecap="round" /></g></g></g><g transform="matrix(0.07 0 0 0.07 19.5 3.33)"  ><circle style="stroke: rgb(255,0,0); stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(255,0,0); fill-rule: nonzero; opacity: 1;" vector-effect="non-scaling-stroke"  cx="0" cy="0" r="40" /></g></svg>';
                }
                for (var i = 0; i < donnees.length; i++) {
//<span class="d-flex my-1 "> Le '+ dateStr +'</span>\
                  div.innerHTML += '<div class="dropdown-item" id="notifications_alert">\
                           '+ donnees[i].message +'\
                           </div>\
                           <div class="dropdown-divider"></div>';

                }
              } // if no notification
              else {
                div.innerHTML +=
                  '<div class="dropdown-item">\
                              <div class="d-flex justify-content-center">Aucune nouvelle notification</div>';
              }
            }
            xhr.onerror = function () {
              console.log("Error making AJAX call");
            };
            xhr.onabort = function () {
              console.log("AJAX call aborted");
            };
            xhr.ontimeout = function () {
              console.log("AJAX call timed out");
            };
            xhr.onloadend = function () {};
          };
          xhr.send();
        }); // end once
      } // fin only on frontpage
    },
  };
})(Drupal, drupalSettings, once);
