(function (Drupal, drupalSettings, once) {
  "use strict";

  Drupal.behaviors.APIMergedInformatifBehavior = {
    attach: function (context, settings) {
      
      const elements = once("APIMergedInformatifBehavior", "body", context);

      elements.forEach(function () {
        const url = Drupal.url("v1/msg_informatif_pleiade/message_fields") + "?t=" + new Date().getTime();

        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
          })
          .then(data => {
            const messages = Array.isArray(data) ? data : (data.messages || []);
            const colors = data.colors || {};

            // Initial render
            updateAlertBanner(messages, colors);
            updateNotificationDropdown(messages);

            // 1. Listen for System Preference Changes
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleMediaChange = () => updateAlertBanner(messages, colors);

            if (darkModeMediaQuery.addEventListener) {
                darkModeMediaQuery.addEventListener('change', handleMediaChange);
            } else {
                darkModeMediaQuery.addListener(handleMediaChange);
            }

            // 2. Watch for Class/Attribute Changes on HTML or BODY (for Theme Toggle Buttons)
            const observer = new MutationObserver(function(mutations) {
                updateAlertBanner(messages, colors);
            });

            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-bs-theme'] });
          })
          .catch(error => {
            console.error("Error fetching informatif messages:", error);
          });
      });

      const iconMap = {
        "Informatif": "fas fa-info-circle",       
        "Avertissement": "fas fa-exclamation-triangle", 
        "Attention": "fas fa-exclamation-circle"  
      };

      // --- HELPER: Robust Dark Mode Detection ---
      function isDarkModeActive() {
        // Check System Preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return true;
        }
        // Check standard classes or attributes on <html> or <body>
        const docEl = document.documentElement;
        const body = document.body;
        
        if (docEl.classList.contains('dark') || body.classList.contains('dark')) return true;
        if (docEl.getAttribute('data-theme') === 'dark' || body.getAttribute('data-theme') === 'dark') return true;
        if (body.getAttribute('data-bs-theme') === 'dark') return true; // Bootstrap 5
        
        return false;
      }

      function updateTabTitle(count) {
        const regex = /^[\(\[]\d+[\)\]] /;
        let currentTitle = document.title;

        if (regex.test(currentTitle)) {
          currentTitle = currentTitle.replace(regex, '');
        }

        if (count > 0) {
          document.title = `[${count}] ${currentTitle}`;
        } else {
          document.title = currentTitle;
        }
      }

      function updateAlertBanner(data, colors) {
        const bannerContainer = document.querySelector(".message_avertissement");
        if (!bannerContainer) return;

        bannerContainer.innerHTML = '';
        
        if (data && data.length > 0) {
          const fragment = document.createDocumentFragment();
          const isDarkMode = isDarkModeActive();

          data.forEach(item => {
            const alertDiv = document.createElement("div");
            
            alertDiv.innerHTML = item.field_message_a_afficher; 
            
            Array.from(alertDiv.children).forEach(child => {
                child.style.marginBottom = "0";
                child.style.marginTop = "0";
                child.style.padding = "0"; 
            });
            
            alertDiv.classList.add(
              "py-2", "px-5", "d-flex", 
              "align-items-center", "justify-content-center"
            );

            alertDiv.style.setProperty("color", "#000000", "important");

            const defaultColors = {
                "Informatif": "#006DAF",
                "Avertissement": "#ffc107",
                "Attention": "#dc3545"
            };

            let bgColor;
            const configColor = colors[item.importance];

            if (configColor && typeof configColor === 'object') {
                bgColor = isDarkMode ? (configColor.dark || configColor.light) : configColor.light;
            } else if (typeof configColor === 'string') {
                bgColor = configColor;
            } else {
                bgColor = defaultColors[item.importance] || "#6c757d";
            }
            
            alertDiv.style.setProperty("background-color", bgColor, "important");
            
            fragment.appendChild(alertDiv);
          });

          bannerContainer.appendChild(fragment);
        }
      }

      function updateNotificationDropdown(data) {
        const div = document.querySelector("#notification_alert");
        if (!div) return;

        div.innerHTML = ''; 
        const div_alert = document.querySelector(".alert_popup");

        if (data && data.length > 0) {
          
          updateTabTitle(data.length);

          if (div_alert) {
            div_alert.classList.add("notification_scale");
            
            let badge = div_alert.querySelector(".badge-count");
            if (!badge) {
              badge = document.createElement("span");
              badge.className = "position-absolute start-75 translate-middle fs-2 px-1 text-white rounded-pill bg-danger badge-count";
              div_alert.appendChild(badge);
            }
            badge.textContent = data.length;
          }

          data.forEach(item => {
            let timeString = "";
            if (item.creation_date) {
                const minutesAgo = Math.floor((Date.now() / 1000 - item.creation_date) / 60);

                if (minutesAgo <= 1) {
                  timeString = "Maintenant";
                } else if (minutesAgo <= 60) {
                  timeString = "Il y a " + minutesAgo + " minutes";
                } else if (minutesAgo <= 1440) {
                  const hoursAgo = Math.floor(minutesAgo / 60);
                  timeString = "Il y a " + hoursAgo + " heure" + (hoursAgo > 1 ? "s" : "");
                } else {
                  const daysAgo = Math.floor(minutesAgo / 1440);
                  timeString = "Il y a " + daysAgo + " jour" + (daysAgo > 1 ? "s" : "");
                }
            }

            const itemDiv = document.createElement("div");
            itemDiv.className = "dropdown-item";
            itemDiv.style.cursor = "pointer";
            
            const contentBody = item.field_message_a_afficher || item.field_description || "";
            const appName = item.application || item.importance || "Notification"; 
            const iconClass = iconMap[item.importance] || "fas fa-bell"; 

            itemDiv.innerHTML = `
              <div class="d-flex align-items-center mb-1">
                 <i class="${iconClass} me-2"></i>
                 <span class="application fw-bold" style="color: #595959;">${appName}</span>
              </div>
              <span class="body d-block mb-1">${contentBody}</span>
              <span class="date_creation text-muted small">${timeString}</span>
            `;

            const HOVER_BG = "#1f3889";

            itemDiv.addEventListener("mouseenter", function() {
              this.style.backgroundColor = HOVER_BG;
              this.style.color = "#ffffff";
              
              const allText = this.querySelectorAll("span, i, div");
              allText.forEach(el => {
                  el.style.color = "#ffffff";
                  el.classList.remove("text-muted"); 
              });
            });

            itemDiv.addEventListener("mouseleave", function() {
              this.style.backgroundColor = ""; 
              this.style.color = ""; 
              
              const allText = this.querySelectorAll("span, i, div");
              allText.forEach(el => el.style.color = "");
              
              const dateSpan = this.querySelector(".date_creation");
              if(dateSpan) dateSpan.classList.add("text-muted");
            });

            div.appendChild(itemDiv);

            const divider = document.createElement("div");
            divider.className = "dropdown-divider";
            div.appendChild(divider);
          });

        } else {
          updateTabTitle(0);

          const displayNotif = document.getElementById("notification_alert");
          if (displayNotif) displayNotif.classList.remove("show");
          
          if (div_alert) {
             div_alert.classList.remove("notification_scale");
             const badge = div_alert.querySelector(".badge-count");
             if (badge) badge.remove();
          }

          div.innerHTML = `
            <div class="dropdown-item" id="emptyNoth">
              <h6 class="d-flex justify-content-center">Aucune nouvelle notification</h6>
            </div>
          `;
        }
      }

    },
  };
})(Drupal, drupalSettings, once);