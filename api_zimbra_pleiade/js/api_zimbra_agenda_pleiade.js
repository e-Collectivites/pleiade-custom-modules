/**
 * @file
 * Behaviors for the Zimbra Agenda API.
 */

(function (Drupal, drupalSettings, once) {
  "use strict";

  let calendarInstance = null;
  let resizeTimeout = null;

  Drupal.behaviors.APIzimbraAgendaBehavior = {
    attach: function (context) {
      // 1. Target the specific wrapper element.
      const elements = once('zimbra-agenda-init', '#zimbra_block_agenda_id', context);
      
      // Handle the reload button separately.
      this.initReloadButton(context);

      // If the element was already processed by 'once', but we need to force re-init
      const agendaEl = elements.length > 0 ? elements[0] : document.getElementById('zimbra_block_agenda_id');
      
      if (!agendaEl) return;

      const isFront = drupalSettings.path.isFront;
      const agendaSettings = drupalSettings.api_zimbra_pleiade || {};
      const agendaEnabled = agendaSettings.field_zimbra_agenda;

      // Only proceed if we are on front and it is enabled in settings.
      if (!isFront || !agendaEnabled) return;

      const initializeAgenda = async (retries = 0) => {
        // Prevent concurrent initialization attempts.
        if (agendaEl.dataset.initializing === "true") return;
        
        // 2. Safety Check: Ensure FullCalendar library is loaded.
        if (typeof FullCalendar === 'undefined') {
          if (retries < 10) {
            console.warn("FullCalendar not loaded. Retry " + (retries + 1) + "/10...");
            setTimeout(function() { initializeAgenda(retries + 1); }, 300);
          } else {
            console.error("FullCalendar failed to load after multiple attempts.");
            agendaEl.innerHTML = '<div class="alert alert-warning small">Erreur de chargement de la librairie.</div>';
          }
          return;
        }

        agendaEl.dataset.initializing = "true";

        // Clean up previous instance before rebuilding.
        if (calendarInstance) {
          calendarInstance.destroy();
          calendarInstance = null;
        }

        // Build structure based on viewport.
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
          // Use Flexbox to stack arrows and calendar without overlapping
          // FIX 8.9.1: Replaced presentation divs with semantic buttons for scrolling
          agendaEl.innerHTML = 
            '<div class="vertical-carousel-container" style="display: flex; flex-direction: column; height: 100%;">' +
              '<button type="button" id="agenda-scroll-up" aria-label="Défiler vers le haut" style="text-align: center; padding: 5px; cursor: pointer; background: #fff; border: none; border-bottom: 1px solid #eee; z-index: 2;">' +
                '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i>' +
              '</button>' +
              '<div id="zimbra-fullcalendar" style="flex-grow: 1; overflow: hidden;"></div>' +
              '<button type="button" id="agenda-scroll-down" aria-label="Défiler vers le bas" style="text-align: center; padding: 5px; cursor: pointer; background: #fff; border: none; border-top: 1px solid #eee; z-index: 2;">' +
                '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
              '</button>' +
            '</div>';
        } else {
          agendaEl.innerHTML = '<div id="zimbra-fullcalendar"></div>';
        }

        const calendarTarget = document.getElementById("zimbra-fullcalendar");
        if (!calendarTarget) {
          agendaEl.dataset.initializing = "false";
          return;
        }

        try {
          const response = await fetch(Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query"), { 
            credentials: "same-origin",
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
          });
          
          if (!response.ok) throw new Error("HTTP error! status: " + response.status);

          const data = await response.json();
          const appts = (data && data.userData && data.userData.Body && data.userData.Body.SearchResponse && data.userData.Body.SearchResponse.appt) || [];
          
          // Store count for other widgets.
          document.cookie = "nbOfTasks=" + appts.length + "; path=/; SameSite=Lax";

          const videoKeywords = ["teams.microsoft.com", "zoom.us", "meet.google.com", "webex.com", "territoirenumeriqueouvert.org", "nextcloud.adullact.org","arawa.fr"];
          const events = [];

          appts.forEach(function(appt) {
            const colorMap = { AC: "#007000", DE: "#32acff", NE: "#ff3b31", WA: "#ffae3e" };
            const eventColor = colorMap[appt.ptst] || "#117ca0";
          
            if (appt.inst) {
              appt.inst.forEach(function(instance) {
                 
                if (instance.ex && instance.ptst === "DE") return;
                
                const start = new Date(instance.s);
                const end = new Date(instance.s + appt.dur);
                const content = (instance.loc || appt.loc || "") + " " + (appt.desc || "");
               
                const matches = content.match(/https?:\/\/[^\s"'<>]+/g);
                const videoLink = matches ? matches.find(function(url) {
                  return videoKeywords.some(function(k) { return url.toLowerCase().includes(k); });
                }) : null;

                const invId = instance.invId ?? appt.invId;
                const dur = instance.dur ?? appt.dur;

                events.push({
                  title: instance.name || appt.name,
                  start: start.toISOString(),
                  end: end.toISOString(),
                  backgroundColor: eventColor,
                  allDay: !!appt.allDay,
                  url: `${data.domainEntry}modern/calendar/event/details/${invId}?utcRecurrenceId=${instance.ridZ}&start=${instance.s}&end=${instance.s + dur}`,
                  extendedProps: {
                    hasLinkIcon: !!videoLink,
                    locationLink: videoLink,
                    isAllDay: !!appt.allDay,
                    uid: appt.uid
                  }
                });
              });
            }
          });

          const now = new Date();
          const scrollTime = now.getHours().toString().padStart(2, '0') + ":00:00";

          calendarInstance = new FullCalendar.Calendar(calendarTarget, {
            locale: "fr",
            height: "100%",
            initialView: "timeGridDay",
            themeSystem: "bootstrap",
            nowIndicator: true,
            scrollTime: scrollTime,
            allDaySlot: true,
            headerToolbar: { start: "title", right: "prev,next EventButton" },
            customButtons: {
              EventButton: { text: "", click: function() { window.location.href = Drupal.url("calendar"); } }
            },
            viewDidMount: function() {
              const btn = document.querySelector(".fc-EventButton-button");
              if (btn) {
                btn.innerHTML = '<i class="fa fa-calendar-week" aria-hidden="true"></i>';
                btn.setAttribute('aria-label', 'Aller au calendrier complet');

                // Handle Right-Click
                btn.addEventListener('contextmenu', function(e) {
                  // Prevent the default browser context menu from appearing
                  e.preventDefault();
                  // Open the URL in a new tab
                  window.open('/calendar', '_blank');
                });
              }

              // FIX 8.9.1: Convert presentation anchors in headers to spans
              calendarTarget.querySelectorAll('.fc-col-header-cell-cushion').forEach(el => {
                if (!el.hasAttribute('href')) {
                  const span = document.createElement('span');
                  span.className = el.className;
                  span.innerHTML = el.innerHTML;
                  el.parentNode.replaceChild(span, el);
                }
              });

              if (isMobile) {
                // Delay slightly to ensure FullCalendar internal scrollers are mapped
                setTimeout(function() {
                  if (typeof Drupal !== 'undefined' && Drupal.behaviors.APIzimbraAgendaBehavior) {
                    Drupal.behaviors.APIzimbraAgendaBehavior.initMobileArrows(calendarTarget);
                  }
                }, 200);
              }
            },
            eventContent: function(arg) {
              const event = arg.event;
              const props = event.extendedProps;
              const startTime = event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              
              const wrapper = document.createElement("div");
              wrapper.className = "fc-event-main-container";
              wrapper.style.cursor = "pointer";
              wrapper.innerHTML = 
                '<div class="text-truncate" style="padding-right: 20px;"><strong>' + event.title + '</strong></div>' +
                (!props.isAllDay ? '<div class="small">' + startTime + '</div>' : "");

             if (props.hasLinkIcon) {
                const vBtn = document.createElement("a");
                vBtn.href = props.locationLink;
                vBtn.target = "_blank";
                // FIX 6.1.1: Contextual label including event title
                vBtn.setAttribute("aria-label", "Rejoindre la visioconférence pour " + event.title); 
                vBtn.className = "visio-direct-link-block";
                vBtn.innerHTML = '<i class="fa-solid fa-video" aria-hidden="true"></i>';
                vBtn.onclick = function(e) { e.stopPropagation(); };
                wrapper.appendChild(vBtn);
            }
              // Bootstrap Popover Integration
              setTimeout(function() {
                if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
                  const popContent = 
                    '<div class="p-1">' +
                      '<div class="fw-bold border-bottom mb-1 small">' + event.title + '</div>' +
                      '<div class="small mb-2 text-muted">' + (props.isAllDay ? 'Toute la journée' : startTime) + '</div>' +
                      (props.hasLinkIcon ? '<a href="' + props.locationLink + '" target="_blank" class="btn btn-xs btn-primary w-100 text-white" style="font-size:10px;">Rejoindre Visio</a>' : '') +
                    '</div>';

                  const pop = new bootstrap.Popover(wrapper, {
                    content: popContent,
                    html: true,
                    trigger: 'manual',
                    placement: props.isAllDay ? 'bottom' : 'top',
                    container: 'body',
                    fallbackPlacements: ['bottom', 'right']
                  });

                  let timer;
                  wrapper.onmouseenter = function() {
                    clearTimeout(timer);
                    document.querySelectorAll('.popover').forEach(function(p) { p.remove(); });
                    pop.show();
                  };
                  wrapper.onmouseleave = function() {
                    timer = setTimeout(function() {
                      if (!document.querySelector('.popover:hover')) pop.hide();
                    }, 300);
                  };
                }
              }, 0);

              return { domNodes: [wrapper] };
            },
            events: events,
            eventClick: function (info) {
              if (info.event.url) {
                info.jsEvent.preventDefault();
                window.open(info.event.url, "_blank");
              }
            },
          });

          calendarInstance.render();

        } catch (err) {
          console.error("Zimbra Agenda Error:", err);
          agendaEl.innerHTML = '<div class="alert alert-warning small">Impossible de charger l\'agenda.</div>';
        } finally {
          agendaEl.dataset.initializing = "false";
        }
      };

      // Trigger load if block is visible.
      const zimbraState = localStorage.getItem("zimbra");
      if (!zimbraState || zimbraState === "block") {
        initializeAgenda();
      }

      // Re-init on resize with debounce.
      window.addEventListener("resize", function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
          if (document.getElementById('zimbra_block_agenda_id')) {
            initializeAgenda();
          }
        }, 400);
      });
    },

    initMobileArrows: function(calendarTarget) {
      const scrollUp = document.getElementById("agenda-scroll-up");
      const scrollDown = document.getElementById("agenda-scroll-down");
      
      // Specifically target the vertical scroller within the timegrid
      const body = calendarTarget.querySelector('.fc-timegrid-body');
      const scroller = body ? body.closest('.fc-scroller') : null;

      if (scrollUp && scrollDown && scroller) {
        const scrollStep = 150;
        scrollUp.onclick = function(e) {
          e.preventDefault();
          scroller.scrollBy({ top: -scrollStep, behavior: 'smooth' });
        };
        scrollDown.onclick = function(e) {
          e.preventDefault();
          scroller.scrollBy({ top: scrollStep, behavior: 'smooth' });
        };
      }
    },

    initReloadButton: function(context) {
      once('zimbra-reload-init', '#reloadZimbraMail', context).forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const agendaBlock = document.querySelector('#zimbra_block_agenda_id');
          if (agendaBlock) {
            const initEvent = new CustomEvent('zimbra:force-reload');
            document.dispatchEvent(initEvent);
          }
        });
      });
    }
  };

  // Listener for forced reloads
  document.dispatchEvent(new CustomEvent('zimbra:force-reload-listener-init'));
  document.addEventListener('zimbra:force-reload', function() {
    const el = document.getElementById('zimbra_block_agenda_id');
    if (el) {
      el.removeAttribute('data-once-zimbra-agenda-init');
      delete el.dataset.initializing;
      Drupal.behaviors.APIzimbraAgendaBehavior.attach(document, drupalSettings);
    }
  });

})(Drupal, drupalSettings, once);