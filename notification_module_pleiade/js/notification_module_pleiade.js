(function (Drupal, drupalSettings, once) {
  "use strict";
  Drupal.behaviors.APInotificationBlocksBehavior = {
    attach: function (context, settings) {
      // only on frontpage (desktop)
      if (drupalSettings.path.isFront) {
        once(
          "APInotificationBlocksBehavior",
          "body",
          context
        ).forEach(function () {
          // make ajax call
          var xhr = new XMLHttpRequest();
          xhr.open("GET", Drupal.url("v1/notification_module_pleiade/notification_fields"));
          xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          xhr.responseType = "json"; 
          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response;
//              console.log(donnees)
              const div = document.querySelector("#notification_alert");
              if (donnees.length > 0 && div) {
                window.onload = function () {
                  var displayNotif =
                    document.getElementById("notification_alert"); // replace "myDiv" with the actual id of your div
                  displayNotif.style.display = "block";
                };
                var svg_bell = document.querySelector(".alert_popup i"); // if notifictation hide svg bell
                if (svg_bell) {
                  svg_bell.style.display = "none";
                }
                const div_alert = document.querySelector(".alert_popup"); // add svg with red point
                if (div_alert) {
                  div_alert.classList.add("notification_scale");
                  div_alert.innerHTML +=
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="32" height="32">\
                    <path d="M224 0c-17.7 0-32 14.3-32 32V49.9C119.5 61.4 64 124.2 64 200v33.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416H424c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4V200c0-75.8-55.5-138.6-128-150.1V32c0-17.7-14.3-32-32-32zm0 96h8c57.4 0 104 46.6 104 104v33.4c0 47.9 13.9 94.6 39.7 134.6H72.3C98.1 328 112 281.3 112 233.4V200c0-57.4 46.6-104 104-104h8zm64 352H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"/>\
                    <ellipse style="fill: rgb(255, 0, 0);" cx="387.29" cy="61.608" rx="54.131" ry="53.832"/>\
                  </svg>';
                }
                for (var i = 0; i < donnees.length; i++) {
                  var date_creation = donnees[i].creation_date;
                  var minutesAgo = Math.floor((Date.now() / 1000 - date_creation) / 60); // Calculate minutes ago
                  var notification;
                  
                  if (minutesAgo <= 1) {
                    notification = "Maintenant";
                  } else if (minutesAgo <= 60) {
                    notification = "Il y a " + minutesAgo + " minutes";
                  } else if (minutesAgo <= 1440) { // 1440 minutes = 24 hours
                    var hoursAgo = Math.floor(minutesAgo / 60);
                    notification = "Il y a " + hoursAgo + " heure" + (hoursAgo > 1 ? "s" : "");
                  } else {
                    var daysAgo = Math.floor(minutesAgo / 1440);
                    notification = "Il y a " + daysAgo + " jour" + (daysAgo > 1 ? "s" : "");
                  }
                  div.innerHTML += '<div class="dropdown-item" id="notifications_alert">\
                  <span class="application">' + donnees[i].application + '</span>\
                  <span class="body">' + donnees[i].field_description + '</span>\
                  <span class="date_creation">' + notification + '</span>\
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
      }
    },
  };
})(Drupal, drupalSettings, once);
