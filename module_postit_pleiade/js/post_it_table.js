(function ($, once, Drupal, interact) { // Add 'interact' as a parameter
  var newItemCreated = false;
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

           
            newItemCreated = true;
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
              var message = item.getElementsByTagName("p")[0].innerHTML;
              var color = item.style.background;
              var transform = item.style.transform;

              var left = 0;
              var top = 0;
      
              // Récupérer les coordonnées de position sans convertir en pixels
              var style = window.getComputedStyle(item);
              var transformValue = style.getPropertyValue('transform');
              var matrix = new DOMMatrixReadOnly(transformValue);
              left = matrix.e;
              top = matrix.f;

              var text_color = item.getElementsByTagName("p")[0].style.color;

              var itemObject = {
                message: message,
                color: color,
                transform: transform,
                top: top,
                left: left,
                text_color: text_color
              };

              items.push(itemObject);
            }
            if (items) {
              console.log(JSON.stringify({ items }))
              $.ajax({
                url: '/v1/module_postit_pleiade/save_postit', // Mettez à jour avec votre route Drupal
                type: 'POST',
                contentType: 'application/json', // Définir le type de contenu comme JSON
                data: JSON.stringify({ items }), // Sérialiser le tableau items en JSON
                success: function (response) {
                  console.log('Post-it items saved successfully!');
                  console.log(response); // Afficher la réponse du serveur si nécessaire
                },
                error: function (xhr, status, error) {
                  console.error('Error saving post-it items:');
                  console.error('Status:', status);
                  console.error('Error:', error);
                  console.error('Response:', xhr.responseText);
                }
              });
            }
          
          }

          function retrieveItems() {
            // Use Drupal AJAX to retrieve post-it items from user profile
            $.ajax({
              url: '/v1/module_postit_pleiade/retrieve_postit', // Update this with Drupal route
              type: 'GET',
              success: function (response) {
                response = JSON.parse(response)
                if (typeof response === 'object') { // Check if the response is a string
                  try {
                    // console.log(response.items.length)
                    var items = (response.items); // Parse the JSON string
                    
                    items.forEach(function (itemObject) {
                      var item = createItem(
                        itemObject.message,
                        0,
                        0,
                        itemObject.color
                      );
                      console.log(item)
                      item.style.transform = itemObject.transform;

                      item.getElementsByTagName("p")[0].style.color =
                        itemObject.text_color;
                      item.getElementsByTagName("span")[0].style.color =
                        itemObject.text_color;

                      makeEditable(item);
                      document.getElementById("post_it_dashboard").appendChild(item);
                    });
                  } catch (error) {
                    console.error('Error parsing JSON:', error);
                  }
                } else {
                  console.error('Invalid JSON format:', response);
                }
              },
              error: function (error) {
                console.error('Error retrieving post-it items:', error);
              }
            });
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
              makeEditable(item);
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
            });

          document
            .getElementById("post_it_dashboard")
            .addEventListener("click", removeItem);



          var collapseButtonSubmit = document.querySelector('#submit_post_it');
          var collapseButton = document.querySelector('.btn_collapse');
          var postItDashboard = document.getElementById('post_it_dashboard');

          $.ajax({
            url: '/v1/module_postit_pleiade/retrieve_postit', // Update this with Drupal route
            type: 'GET',
            success: function (response) {
              response = JSON.parse(response)
              if (typeof response === 'object') { // Check if the response is a string
                try {
                  var items = response.items;
                  if (items.length > 0) {
                    postItDashboard.classList.add('show');
                    collapseButton.innerHTML = '-';
                  }
                  else {
                    collapseButton.innerHTML = '+';
                  }
                  updateCollapseButton();
                } catch (error) {
                  console.error('Error parsing JSON:', error);
                }
              } else {
                console.error('Invalid JSON format:', response);
              }
            },
            error: function (error) {
              console.error('Error retrieving post-it items:', error);
            }
          }); // Parse the JSON string


          // Vérifie l'état de la div lors du chargement initial


          // Ajoute un gestionnaire d'événement pour le clic sur le bouton de bascule
          collapseButton.addEventListener('click', function () {
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
