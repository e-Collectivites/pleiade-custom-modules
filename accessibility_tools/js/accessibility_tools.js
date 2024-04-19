(function ($, Drupal, drupalSettings) {
  "use strict";
  Drupal.behaviors.AccessibilityBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
        function increaseFontSize() {
          var elements = $('#menuLemon .sidebar-link, .sidebar-nav ul .nav-small-cap, .sidebar-nav ul .sidebar-item .sidebar-link, #mes_applications .sidebar-link', context);
          elements.each(function () {
            var computedFontSize = window.getComputedStyle(this).fontSize;
            var currentFontSize = parseInt(computedFontSize) || 16;
            var newFontSize = currentFontSize + 2;
            this.style.fontSize = newFontSize + 'px';
          });
          var currentBodyFontSize = parseInt(document.body.style.fontSize) || 16;
          var newBodyFontSize = currentBodyFontSize + 2;
          document.body.style.fontSize = newBodyFontSize + 'px';
        }

        function decreaseFontSize() {
          var elements = $('#menuLemon .sidebar-link, .sidebar-nav ul .nav-small-cap, .sidebar-nav ul .sidebar-item .sidebar-link, #mes_applications .sidebar-link', context);
          elements.each(function () {
            var computedFontSize = window.getComputedStyle(this).fontSize;
            var currentFontSize = parseInt(computedFontSize) || 16;
            var newFontSize = currentFontSize - 2;
            this.style.fontSize = newFontSize + 'px';
          });
          var currentBodyFontSize = parseInt(document.body.style.fontSize) || 16;
          var newBodyFontSize = currentBodyFontSize - 2;
          document.body.style.fontSize = newBodyFontSize + 'px';
        }

        function resetFontSize() {
          var elements = $('#menuLemon .sidebar-link, .sidebar-nav ul .nav-small-cap, .sidebar-nav ul .sidebar-item .sidebar-link, #mes_applications .sidebar-link', context);
          elements.each(function () {
            this.style.fontSize = '18px'; // Réinitialiser à la taille par défaut
          });
          document.body.style.fontSize = '16px';
        }

        // Variable pour stocker l'espacement courant
        let currentSpacing = 0;

        function increaseSpaces() {
          currentSpacing += 1;
          document.body.style.letterSpacing = `${currentSpacing}px`;
        }

        function decreaseSpaces() {
          currentSpacing -= 1;
          if (currentSpacing < 0) {
            currentSpacing = 0;
          }
          document.body.style.letterSpacing = `${currentSpacing}px`;
        }

        function resetSpaces() {
          currentSpacing = 0;
          document.body.style.letterSpacing = 'normal';
        }

        // Gestionnaire d'événements pour le bouton d'augmentation de l'espacement
        $('#increaseSpaces', context).on('click', increaseSpaces);

        // Gestionnaire d'événements pour le bouton de diminution de l'espacement
        $('#decreaseSpaces', context).on('click', decreaseSpaces);

        // Gestionnaire d'événements pour le bouton de réinitialisation de l'espacement
        $('#resetSpaces', context).on('click', resetSpaces);

        var checkbox = document.getElementById('mode-loupe');
        // Fonction pour gérer le changement d'état de la case à cocher

        // Fonction pour créer la div d'info sur la souris
        function createMouseInfoDiv() {
          // Crée une nouvelle div
          var mouseInfoDiv = document.createElement('div');

          // Applique les styles CSS
          mouseInfoDiv.style.position = 'fixed';
          mouseInfoDiv.style.padding = '5px 10px';
          mouseInfoDiv.style.fontSize = '2rem';
          mouseInfoDiv.style.borderRadius = '5px';
          mouseInfoDiv.style.backgroundColor = 'rgba(0,0,0,.8)';
          mouseInfoDiv.style.border = '1px solid rgba(0,0,0,.8)';
          mouseInfoDiv.style.color = '#fff';
          mouseInfoDiv.style.display = 'none';
          mouseInfoDiv.style.zIndex = '9999999999999';
          mouseInfoDiv.style.lineHeight = '1.2';
          mouseInfoDiv.style.pointerEvents = 'none';
          mouseInfoDiv.style.userSelect = 'none';

          // Ajoute la div au document
          document.body.appendChild(mouseInfoDiv);

          return mouseInfoDiv;
        }

        // Crée la div pour les informations sur la souris
        var mouseInfoDiv = createMouseInfoDiv();
        function handleCheckboxChange() {
          if (checkbox.checked) {
            console.log("La case à cocher est cochée :", checkbox.checked);
            var body = document.body;
            body.addEventListener('mousemove', handleMouseMove);
          } else {
            // Cache la div lorsque la case à cocher est désactivée
            mouseInfoDiv.style.display = 'none';
            // Supprime l'écouteur d'événements 'mousemove'
            var body = document.body;
            body.removeEventListener('mousemove', handleMouseMove);
          }
        }
        function handleMouseMove(event) {
          const element = event.target;
          if (element.tagName === 'SPAN' || element.tagName === 'A' || element.tagName === 'TD' || element.tagName === 'TH' || element.tagName === 'BUTTON' || element.tagName === 'P' || (element.tagName >= 'H1' && element.tagName <= 'H6')) {
            const posX = event.clientX + 50;
            const posY = event.clientY + 50;

            // Met à jour la position de la div
            mouseInfoDiv.style.left = posX + 'px';
            mouseInfoDiv.style.top = posY + 'px';

            // Met à jour le contenu de la div avec les coordonnées de la souris
            mouseInfoDiv.textContent = element.textContent;

            // Affiche la div
            mouseInfoDiv.style.display = 'block';
          }
        }
        // Ajouter un écouteur d'événement sur le changement de la case à cocher
        checkbox.addEventListener('change', handleCheckboxChange);


        const contrastCheckbox = document.getElementById('contraste');
        const bwCheckbox = document.getElementById('black_and_white');

        function updateFilter() {
          let filter = '';

          if (contrastCheckbox.checked) {
            filter += 'contrast(200%) ';
          }

          if (bwCheckbox.checked) {
            filter += 'grayscale(100%) ';
          }

          document.body.style.filter = filter.trim();
        }

        contrastCheckbox.addEventListener('change', updateFilter);
        bwCheckbox.addEventListener('change', updateFilter);


        // Assurez-vous que les gestionnaires d'événements sont attachés aux éléments corrects.
        $('.btn-group button', context).on('click', function () {
          if ($(this).is('#increaseFontSize')) {
            increaseFontSize();
          } else if ($(this).is('#decreaseFontSize')) {
            decreaseFontSize();
          } else if ($(this).is('#resetFontSize')) {
            resetFontSize();
          }
          // Ajoutez d'autres conditions pour d'autres boutons si nécessaire.
        });

        // Gestionnaire d'événements pour le bouton du thème sombre
        $('#theme-view', context).on('change', function () {
          if ($(this).is(':checked')) {
            // Logique pour activer le thème sombre

            // Sauvegardez l'état de la case à cocher dans le stockage local
            localStorage.setItem('themeViewChecked', 'true');
          } else {
            // Logique pour désactiver le thème sombre

            // Supprimez l'état de la case à cocher du stockage local
            localStorage.removeItem('themeViewChecked');
          }
        });

        // Vérifiez si l'état de la case à cocher est sauvegardé dans le stockage local
        var themeViewChecked = localStorage.getItem('themeViewChecked');
        if (themeViewChecked === 'true') {
          // Si oui, cochez la case à cocher et déclenchez le gestionnaire d'événements 'change'
          $('#theme-view', context).prop('checked', true).trigger('change');
        }


        $('#contraste', context).on('change', function () {
          if ($(this).is(':checked')) {
            // Logique pour activer le thème sombre

            // Sauvegardez l'état de la case à cocher dans le stockage local
            localStorage.setItem('contrasteChange', 'true');
          } else {
            // Logique pour désactiver le thème sombre

            // Supprimez l'état de la case à cocher du stockage local
            localStorage.removeItem('contrasteChange');
          }
        });

        // Vérifiez si l'état de la case à cocher est sauvegardé dans le stockage local
        var themeViewChecked = localStorage.getItem('contrasteChange');
        if (themeViewChecked === 'true') {
          // Si oui, cochez la case à cocher et déclenchez le gestionnaire d'événements 'change'
          $('#contraste', context).prop('checked', true);
          updateFilter();
        }
        $('#black_and_white', context).on('change', function () {
          if ($(this).is(':checked')) {
            // Logique pour activer le thème sombre

            // Sauvegardez l'état de la case à cocher dans le stockage local
            localStorage.setItem('black_and_whiteChange', 'true');
          } else {
            // Logique pour désactiver le thème sombre

            // Supprimez l'état de la case à cocher du stockage local
            localStorage.removeItem('black_and_whiteChange');
          }
        });

        // Vérifiez si l'état de la case à cocher est sauvegardé dans le stockage local
        var themeViewChecked = localStorage.getItem('black_and_whiteChange');
        if (themeViewChecked === 'true') {
          // Si oui, cochez la case à cocher et déclenchez le gestionnaire d'événements 'change'
          $('#black_and_white', context).prop('checked', true);
          updateFilter();
        }
        

      }, 2000); // 1000 millisecondes = 1 seconde
    }

  };
})(jQuery, Drupal, drupalSettings);
