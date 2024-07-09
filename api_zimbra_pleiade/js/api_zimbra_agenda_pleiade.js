(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraAgendaBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      if (drupalSettings.path.isFront && drupalSettings.api_zimbra_pleiade.field_zimbra_agenda) {
        //if (drupalSettings.path.isFront && drupalSettings.api_zimbra_pleiade.field_zimbra_agenda && drupalSettings.api_zimbra_pleiade.field_zimbra_for_demo ) { Mode Démo
        once("APIzimbraAgendaBehavior", "#zimbra_block_agenda_id", context).forEach(

          function () {
            // spinner
            document.getElementById("zimbra_block_agenda_id").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
            // requete
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query"));
            xhr.responseType = "json";

            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = xhr.response;
                if (donnees && donnees.userData.Body.SearchResponse.appt) {
                  var event_array = [];
                  document.cookie = "nbOfTasks=" + donnees.userData.Body.SearchResponse.appt.length;
                  for (var i = 0; i < donnees.userData.Body.SearchResponse.appt.length; i++) {

                    //                                var start_task = donnees.userData.Body.SearchResponse.appt[i].inst[0].s /1000;
                    var start_task;
                    if (donnees.userData.Body.SearchResponse.appt[i].alarmData) {
                      start_task = donnees.userData.Body.SearchResponse.appt[i].alarmData[0].alarmInstStart / 1000;
                    } else {
                      start_task = donnees.userData.Body.SearchResponse.appt[i].inst[0].s / 1000;
                    }

                    var end_task = start_task + donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                    var endDate = new Date(end_task * 1000 + 3600 * 1000 * 2);
                    var startDate = new Date(start_task * 1000 + 3600 * 1000 * 2);
			
                    event_array[i] = {
                      title: donnees.userData.Body.SearchResponse.appt[i].name, // titre court
                      //title: '<b>'+donnees.userData.Body.SearchResponse.appt[i].name + '</b>, <br><strong>Lieu : </strong>'+ donnees.userData.Body.SearchResponse.appt[i].loc,
                      start: startDate.toISOString().replace('.000Z', ''),
                      end: endDate.toISOString().replace('.000Z', ''),
                      url: donnees.domainEntry.url + 'modern/calendar/event/details/' + donnees.userData.Body.SearchResponse.appt[i].invId + '?utcRecurrenceId=' + donnees.userData.Body.SearchResponse.appt[i].inst[0].ridZ + '&start=' + donnees.userData.Body.SearchResponse.appt[i].inst[0].s + '&end=' + end_task * 1000,
                      extendedProps: { // titre long avec du html pour te faire plaiz ;)
                        longTitle: '<b>' + donnees.userData.Body.SearchResponse.appt[i].name + '</b>, <br><strong>Lieu : </strong>' + donnees.userData.Body.SearchResponse.appt[i].loc
                      }
                    }
                  }
                }

                  var calendarEl = document.getElementById("zimbra_block_agenda_id");
                  var currentDateObj = new Date();

                  var numberOfMlSeconds = currentDateObj.getTime();

                  var addMlSeconds = 60 * 60 * 1000 * 2;
                  var newDateObj = new Date(numberOfMlSeconds + addMlSeconds);
                  //console.log(newDateObj)
                  var calendar = new FullCalendar.Calendar(calendarEl, {
                    timeZone: "UTC",
                    locale: "fr",
                    customButtons: {
                      EventButton: {
                        text: "Voir la semaine",
                        click: function (event, jsEvent, view) {
                          window.location.href = "/calendar";
                        },
                      },
                    },
                    headerToolbar: {
                      start: 'title', // will normally be on the left. if RTL, will be on the right
                      today: false,
                      end: "EventButton",
                      //right: 'prev,next',
                    },
                    nowIndicator: true,
                    now: newDateObj,

                    initialView: "timeGridDay",
                    slotMinTime: "07:00:00",
                    slotMaxTime: "19:00:00",
                    themeSystem: "bootstrap",
                    slotLabelInterval: "01:00:00",
                    events: event_array,
                    eventClick: function (event) {
                      if (event.event.url) {
                        event.jsEvent.preventDefault()
                        window.open(event.event.url, "_blank");
                      }
                    }
                  });
                  calendar.render();
                
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
            xhr.onloadend = function () {

            };

            xhr.send();


          }); // fin once function
      }
    },
  };
})(Drupal, once, drupalSettings);
