(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraUserImgBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_mail
      ) {
        setTimeout(function () {
          once("APIzimbraUserImgBehavior", "body", context).forEach(
            function () {
              // spinner
              // document.getElementById("profile-picture").innerHTML = drupalSettings.api_lemon_pleiade.spinner;

              // requete

              var xhr = new XMLHttpRequest();
              xhr.open(
                "GET",
                Drupal.url("v1/api_user_pleiade/user_list_query")
              );
              xhr.responseType = "json";
              xhr.onload = function () {
                if (xhr.status === 200) {
                  var donnees = xhr.response;
                  if (donnees) {
                    const divs =
                      document.getElementsByClassName("mail_content"); // get list of mails
                    setTimeout(function () {
                      const divs = document.getElementsByClassName("scroll_on_table"); // get list of divs with class "scroll_on_table"
                      if (divs.length > 0) {
                        // Access the first div with the class "scroll_on_table"
                        const div = divs[0];

                        // Get the table element within the div
                        const table = div.querySelector("table");

                        // Now, you can work with 'table' as needed
                        const tbody = table.querySelector("tbody"); // Select the tbody within the table
                        // Check if tbody exists
                        const trElements = tbody.querySelectorAll("tr"); // Select all tr elements within tbody
                        const numberOfTr = trElements.length; // Get the number of tr elements

                        for (let i = 0; i < numberOfTr; i++) {
                          //console.log(divs[i].getAttribute("mail-expe"));
                          for (let j = 0; j < donnees.length; j++) {
                            // for every mail check expeditor e-m>
                            if (
                              donnees[j].email ==
                              trElements[i].getAttribute("mail-expe")
                            ) {
                              if (donnees[j].picture_url) {
                                trElements[i]
                                  .querySelector(".profile-picture")
                                  .insertAdjacentHTML(
                                    "afterbegin",
                                    '<img src="' +
                                      donnees[j].picture_url +
                                      '" alt="user" width="30" height="30" class="profile-pic rounded-circle" />'
                                  );
                              }
                            }
                          }
                          if (
                            trElements[i].querySelector(".profile-picture")
                              .innerHTML === ""
                          ) {
                            trElements[i]
                              .querySelector(".profile-picture")
                              .insertAdjacentHTML(
                                "afterbegin",
                                '<img src="/themes/custom/pleiadebv/assets/images/users/img_user.png" alt="user" width="30" height="30" class="profile-pic rounded-circle" />'
                              );
                          }
                        }
                      } else {
                        console.log(
                          "No divs with class 'scroll_on_table' found."
                        );
                      }
                    }, 2000);
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
              xhr.onloadend = function () {};

              xhr.send();
            }
          ); // fin once function
        }, 1000); // 1000 millisecondes = 1 seconde
      }
    },
  };
})(Drupal, once, drupalSettings);
