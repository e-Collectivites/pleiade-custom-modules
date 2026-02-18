(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.APIzimbraDataHistoryBehavior = {
    attach: function (context, settings) {
      const isMailEnabled = drupalSettings.api_zimbra_pleiade?.field_zimbra_mail;

      once("APIzimbraDataHistoryBehavior", "#zimbra_block_mail_id", context).forEach(function (element) {
        const mailContainer = element.querySelector("#zimbra_mail_list");
        const scrollUpBtn = element.closest('#zimbra-row').querySelector("#slick-up");
        const scrollDownBtn = element.closest('#zimbra-row').querySelector("#slick-down");
        const reloadBtn = document.getElementById("reloadZimbraMail");

        if (!mailContainer) return;

        const handleScroll = (direction) => {
          const scrollStep = 150; 
          if (direction === 'up') {
            mailContainer.scrollTo({
              top: mailContainer.scrollTop - scrollStep,
              behavior: 'smooth'
            });
          } else {
            mailContainer.scrollTo({
              top: mailContainer.scrollTop + scrollStep,
              behavior: 'smooth'
            });
          }
        };

        const makeAccessibleButton = (btn, dir) => {
          if (!btn) return;
          btn.setAttribute('role', 'button');
          btn.setAttribute('tabindex', '0'); 
          btn.setAttribute('aria-label', dir === 'up' ? 'Défiler les emails vers le haut' : 'Défiler les emails vers le bas');
          
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleScroll(dir);
          });

          btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScroll(dir);
            }
          });
        };

        if (scrollUpBtn && scrollDownBtn) {
          makeAccessibleButton(scrollUpBtn, 'up');
          makeAccessibleButton(scrollDownBtn, 'down');
        }

        const fetchAndDisplayMails = async function () {
          mailContainer.innerHTML = `<div class="py-5" role="status" aria-live="polite"><div class="spinner-border text-primary"><span class="visually-hidden">Chargement des emails...</span></div></div>`;
          
          try {
            const response = await fetch(Drupal.url("v1/api_zimbra_pleiade/zimbra_mails_query"));
            const donnees = await response.json();
            const messages = donnees?.userData?.Body?.SearchResponse?.m || [];
            let html = "";

            if (messages.length > 0) {
              if (typeof setNotificationCount === 'function') setNotificationCount('zimbra', messages.length);
              
              messages.forEach(mail => {
                const sender = (mail.e && mail.e.length > 0) ? (mail.e[mail.e.length - 1].p || mail.e[mail.e.length - 1].a) : "Inconnu";
                const subject = mail.su || "(Sans sujet)";
                const time = new Date(parseInt(mail.d)).toLocaleString('fr-FR');
                const fragment = mail.fr || "";
                
                const domain = donnees.domainEntry || ""; 
                const hrefUrl = `${domain}modern/email/Inbox/message/${mail.id}`;

                html += `
                  <a href="${hrefUrl}" 
                     target="zimbramail" 
                     rel="noopener" 
                     aria-label="Email de ${sender}, sujet : ${subject}, reçu le ${time}. S'ouvre dans une nouvelle fenêtre."
                     class="list-group-item list-group-item-action mail_content text-decoration-none text-dark border-bottom d-block p-3">
                    <div class="d-flex justify-content-between w-100">
                        <strong>${sender}</strong> 
                        <span class="small text-dark">${time}</span>
                    </div>
                    <div class="text-truncate mt-1"><strong>${subject}</strong></div>
                    <div class="small text-dark text-truncate" style="opacity: 0.9;">${fragment}</div>
                  </a>`;
              });
            } else {
              html = `<div class="text-center my-5"><h5>Aucun mail</h5></div>`;
            }
            mailContainer.innerHTML = html;
          } catch (err) {
            console.error(err);
            mailContainer.innerHTML = `<div class="alert alert-danger" role="alert">Erreur lors du chargement des emails.</div>`;
          }
        };

        if (reloadBtn) {
            reloadBtn.onclick = (e) => {
                e.preventDefault();
                fetchAndDisplayMails();
            }
        }
        
        if (localStorage.getItem("zimbra") === "block" || isMailEnabled) {
            fetchAndDisplayMails();
        }
      });
    },
  };
})(Drupal, once, drupalSettings);