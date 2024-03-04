(function ($, once, Drupal, interact) { // Add 'interact' as a parameter
  Drupal.behaviors.postitBehavior = {
    attach: function (context, settings) {

      if (drupalSettings.path.isFront) {
        once("postitBehavior", "body", context).forEach(() => {
          document
            .getElementById("delete-button")
            .addEventListener("click", deleteAllItems);
          window.addEventListener("beforeunload", saveItems);
          window.addEventListener("load", retrieveItems);

          function makeEditable(item) {
            var p = item.querySelector("p");
            p.setAttribute("contenteditable", "true");
            p.addEventListener("blur", function () {
              saveItems();
            });
          }

          function createItem(message, top, left, color) {
            var item = document.createElement("div");
            item.classList.add("item");
            item.setAttribute("data-value", message);

            item.style.background = `${color}`;

            var scotch = document.createElement("div");
            scotch.classList.add("tape");
            item.appendChild(scotch);

            var p = document.createElement("p");
            p.innerHTML = message.replace(/\n/g, '<br>'); // Remplace les sauts de ligne par des balises <br>

            var isLightColor = isLight(color);
            if (isLightColor) {
              p.style.color = "#000000";
            } else {
              p.style.color = "#FFFFFF";
            }
            p.style.width = "180px";
            p.style.height = "150px";
            p.style.overflowY = "auto";
            p.style.cursor = "grab";
            p.style.fontSize = "12px";

            item.appendChild(p);

            var removeBtn = document.createElement("span");
            removeBtn.classList.add("remove-btn");
            removeBtn.textContent = "X";
            item.appendChild(removeBtn);

            item.style.position = "absolute";
            item.style.top = top + "px";
            item.style.left = left + "px";

            // Sauvegarde l'élément dès sa création
            setTimeout(function () {
              saveItems();
            }, 500);
            return item;
          }

          function isLight(color) {
            var rgb = hexToRgb(color);
            if (rgb) {
              var luminance =
                (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
              return luminance > 0.5;
            }
            return false;
          }

          function deleteAllItems() {
            var result = confirm(
              "Etes-vous sur de vouloir supprimer tous les post-its ?"
            );
            if (result) {
              var postItDashboard =
                document.getElementById("post_it_dashboard");
              while (postItDashboard.firstChild) {
                postItDashboard.removeChild(postItDashboard.firstChild);
              }

              document.cookie = "post_it_items=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }
          }

          function hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
              return r + r + g + g + b + b;
            });
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
              ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
              }
              : null;
          }

          function saveItems() {
            var items = [];
            var postItDashboard = document.getElementById("post_it_dashboard");

            var itemElements = postItDashboard.getElementsByClassName("item");
            for (var i = 0; i < itemElements.length; i++) {
              var item = itemElements[i];

              var message = item.getElementsByTagName("p")[0].innerHTML; // Récupère le contenu HTML avec les sauts de ligne
              var color = item.style.background;
              var transform = item.style.transform;

              var left = 0;
              var top = 0;

              // Vérifier si transform est non nul et correspond au format attendu
              if (transform && transform.match(/translate\((.+)\s*,\s*(.+)\)/)) {
                var matches = transform.match(/translate\((.+)\s*,\s*(.+)\)/);
                left = parseInt(matches[1], 10);
                top = parseInt(matches[2], 10);
              }

              var itemObject = {
                message: message,
                color: color,
                transform: transform,
                top: top,
                left: left,
                text_color: item.getElementsByTagName("p")[0].style.color,
              };

              items.push(itemObject);
            }
            console.log(items);
            document.cookie = "post_it_items=" + JSON.stringify(items) + "; path=/;";
          }

          function retrieveItems() {
            var cookies = document.cookie.split(';');
            var items;
            cookies.forEach(function (cookie) {
              var parts = cookie.split('=');
              if (parts[0].trim() === 'post_it_items') {
                items = JSON.parse(decodeURIComponent(parts[1]));
              }
            });

            if (items) {
              for (var i = 0; i < items.length; i++) {
                var itemObject = items[i];
                var item = createItem(
                  itemObject.message,
                  170,
                  15,
                  itemObject.color
                );

                item.style.transform = itemObject.transform;

                item.getElementsByTagName("p")[0].style.color =
                  itemObject.text_color;
                item.getElementsByTagName("span")[0].style.color =
                  itemObject.text_color;

                makeEditable(item);
                document.getElementById("post_it_dashboard").appendChild(item);
              }
            }
          }

          function removeItem(e) {
            if (e.target.classList.contains("remove-btn")) {
              var item = e.target.closest(".item");
              item.parentNode.removeChild(item);

              var value = item.getAttribute("data-value");

              var items = JSON.parse(localStorage.getItem("items"));

              var index = items.indexOf(value);

              items.splice(index, 1);

              localStorage.setItem("items", JSON.stringify(items));
            }
          }

          document
            .getElementById("myForm")
            .addEventListener("submit", function (e) {
              e.preventDefault();
              var message = document.getElementById("message").value;
              var color = document.getElementById("color").value;

              var top = 185;
              var left = 15;

              var item = createItem(message, top, left, color);
              document.getElementById("post_it_dashboard").appendChild(item);

              document.getElementById("message").value = "";
            });

          document
            .getElementById("post_it_dashboard")
            .addEventListener("click", removeItem);

          // Initialize Interact.js for drag and drop functionality
          // Initialize Interact.js for drag and drop functionality
          interact('.item')
            .draggable({
              restrict: {
                // restriction: '#post_it_dashboard',
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                endOnly: true,
              },
              onmove: function (event) {
                var target = event.target;
                // keep the dragged position in the data-x/data-y attributes
                var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                // translate the element
                target.style.webkitTransform =
                  target.style.transform =
                  'translate(' + x + 'px, ' + y + 'px)';

                // update the position attributes
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
              },
              // call this function on every dragend event
              onend: function (event) {
                saveItems(); // Save items after dragging ends
              }
            });

          document
            .getElementById("post_it_dashboard")
            .addEventListener("click", removeItem);




          var collapseButtonSubmit = document.querySelector('#submit_post_it');
          var collapseButton = document.querySelector('.btn_collapse');
          var postItDashboard = document.getElementById('post_it_dashboard');

          var cookies = document.cookie.split(';');
          var items;
          cookies.forEach(function (cookie) {
            var parts = cookie.split('=');
            if (parts[0].trim() === 'post_it_items') {
              items = JSON.parse(decodeURIComponent(parts[1]));
            }
          });

          // Vérifie l'état de la div lors du chargement initial
          if (items.length > 0) {
            postItDashboard.classList.add('show');
            collapseButton.innerHTML = '-';
          }
          else {
            collapseButton.innerHTML = '+';
          }
          updateCollapseButton();

          // Ajoute un gestionnaire d'événement pour le clic sur le bouton de bascule
          collapseButton.addEventListener('click', function () {
            console.log('coucou')
            setTimeout(updateCollapseButton, 500);
          });
          collapseButtonSubmit.addEventListener('click', function () {
            postItDashboard.classList.add('show');
            collapseButton.innerHTML = '-';
            // Attendez un court délai pour que la div se replie ou se déplie avant de mettre à jour le bouton
          });

          function updateCollapseButton() {
            var isCollapsed = !postItDashboard.classList.contains('show');
            // Met à jour le texte du bouton en fonction de l'état de la div
            if (isCollapsed) {
              collapseButton.innerHTML = '+';
            } else {
              collapseButton.innerHTML = '-';
            }
          }
        }); // end once foreach

      }
    },
  };
})(jQuery, once, Drupal, interact); // Pass 'interact' to the function
