(function (Drupal, once, drupalSettings) {
  "use strict";

  Drupal.behaviors.APIzimbraFullAgendaBehavior = {
    attach: function (context, settings) {
      if (
        drupalSettings.path &&
        drupalSettings.path.currentPath &&
        drupalSettings.path.currentPath.includes("calendar") &&
        drupalSettings.api_zimbra_pleiade?.field_zimbra_agenda
      ) {
        once(
          "APIzimbraFullAgendaBehavior",
          "#zimbra_full_calendar",
          context
        ).forEach(function () {
          const calendarEl = document.getElementById("zimbra_full_calendar");
          calendarEl.innerHTML = drupalSettings.api_lemon_pleiade.spinner;

          const xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query")
          );
          xhr.responseType = "json";

          xhr.onload = function () {
            if (xhr.status !== 200) {
              calendarEl.innerHTML = "<h2>Erreur lors de la récupération de l'agenda</h2>";
              return;
            }

            const donnees = xhr.response;
            let theme = donnees.theme;
            const appts = donnees?.userData?.Body?.SearchResponse?.appt || [];
            document.cookie = "nbOfTasks=" + appts.length;

            const events = [];

            appts.forEach((appt) => {
              const fbValue = appt.ptst;
              const colorMap = {
                AC: "#008020",
                DE: "#32acff",
                NE: "#ff3b31",
                WA: "#ffae3e",
              };
              const eventColor = colorMap[fbValue] || "#117ca0";

              const durationMs = appt.dur;
              const hours = Math.floor(durationMs / (1000 * 60 * 60)).toString().padStart(2, "0");
              const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");

              appt.inst.forEach((instance) => {
                if (instance.ex && instance.ptst === "DE") return;

                const startDate = new Date(instance.s);
                const endDate = new Date(instance.s + appt.dur);
                const name = instance.name ?? appt.name;
                const invId = instance.invId ?? appt.invId;
                const dur = instance.dur ?? appt.dur;

                let eventUrl = '';
                if (theme === 'modern') {
                  const endTime = instance.s + dur;
                  eventUrl = `${donnees.domainEntry}modern/calendar/event/details/${invId}?utcRecurrenceId=${instance.ridZ}&start=${instance.s}&end=${endTime}`;
                } else {
                  eventUrl = `${donnees.domainEntry}#?action=s&sq=${encodeURIComponent(`uid:"${appt.uid}"`)}`;
                }

                const videoKeywords = ["teams.microsoft.com", "zoom.us", "meet.google.com", "webex.com", "territoirenumeriqueouvert.org", "nextcloud.adullact.org","arawa.fr"];
                const extractVideoUrl = (text, keywords) => {
                  if (!text) return null;
                  const regex = /https?:\/\/[^\s"'<>]+/g;
                  const matches = text.match(regex);
                  if (!matches) return null;
                  return matches.find(url => keywords.some(k => url.toLowerCase().includes(k.toLowerCase()))) || null;
                };

                const contentToSearch = `${instance.loc ?? appt.loc ?? ""} ${appt.desc || ""}`;
                const extractedUrl = extractVideoUrl(contentToSearch, videoKeywords);

                events.push({
                  title: name,
                  isAllDay: appt.allDay,
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                  backgroundColor: eventColor,
                  url: eventUrl,
                  extendedProps: {
                    uid: appt.uid,
                    hasLinkIcon: !!extractedUrl,
                    locationLink: extractedUrl,
                    description: appt.fr || ""
                  }
                });
              });
            });

            const calendar = new FullCalendar.Calendar(calendarEl, {
              timeZone: "local",
              locale: "fr",
              dayHeaderFormat: { weekday: 'long', day: 'numeric' },
              buttonText: { today: "Cette semaine" },
              headerToolbar: { left: "prev,next today", center: "title", right: false },
              nowIndicator: true,
              expandRows: true,
              scrollTime: "07:00:00",
              initialView: "timeGridWeek",
              weekends: false,
              themeSystem: "bootstrap",
              events: events,
              eventContent: function (arg) {
                const event = arg.event;
                const props = event.extendedProps;
                const startTime = event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const endTime = event.end?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "";

                const wrapper = document.createElement("div");
                wrapper.classList.add("fc-event-main-container");

                // Contenu de la cellule
                wrapper.innerHTML = `
                  <div class="fw-bold text-truncate" style="font-size: 0.85rem;">${event.title}</div>
                  ${!props.isAllDay ? `<div class="small">${startTime}</div>` : ""}
                `;

                // Icône vidéo cliquable directement
                if (props.hasLinkIcon) {
                  const videoBtn = document.createElement("a");
                  videoBtn.href = props.locationLink;
                  videoBtn.target = "_blank";
                  videoBtn.className = "visio-direct-link";
                  videoBtn.innerHTML = '<i class="fa-solid fa-video"></i>';
                  videoBtn.onclick = (e) => e.stopPropagation();
                  wrapper.appendChild(videoBtn);
                }

                // Configuration de la Popover
                const popContent = `
                  <div class="p-1">
                    <div class="fw-bold border-bottom mb-1 pb-1">${event.title}</div>
                    <div class="small mb-2 text-muted">${startTime} - ${endTime}</div>
                    ${props.hasLinkIcon ? `
                      <a href="${props.locationLink}" target="_blank" class="btn btn-sm btn-primary w-100 text-white">
                        <i class="fa-solid fa-video"></i> Rejoindre la Visio
                      </a>` : ''}
                  </div>
                `;

                setTimeout(() => {
                  const pop = new bootstrap.Popover(wrapper, {
                    content: popContent,
                    html: true,
                    trigger: 'manual', // Manuel pour éviter les clignotements
                    placement: 'top',
                    container: 'body',
                    animation: true
                  });

                  let timer;
                  wrapper.onmouseenter = () => {
                    clearTimeout(timer);
                    // Fermer les autres popovers ouvertes
                    document.querySelectorAll('.popover').forEach(p => p.remove());
                    pop.show();
                  };

                  wrapper.onmouseleave = () => {
                    timer = setTimeout(() => {
                      // Ne ferme pas si la souris est sur la popover
                      if (!document.querySelector('.popover:hover')) {
                        pop.hide();
                      }
                    }, 300);
                  };
                }, 0);

                return { domNodes: [wrapper] };
              },
              eventClick: function (info) {
                info.jsEvent.preventDefault();
                if (theme === 'modern') {
                  if (info.event.url) window.open(info.event.url, "_blank");
                } else {
                  const uid = info.event.extendedProps.uid;
                  window.open(donnees.domainEntry, '_blank');
                  navigator.clipboard.writeText(uid).then(() => {
                    alert('ID copié. Collez-le dans la recherche Zimbra.');
                  });
                }
              }
            });

            calendar.render();
            const spinner = document.getElementById("spinner-history");
            if (spinner) spinner.style.display = "none";
          };
          xhr.send();
        });
      }
    },
  };
})(Drupal, once, drupalSettings);