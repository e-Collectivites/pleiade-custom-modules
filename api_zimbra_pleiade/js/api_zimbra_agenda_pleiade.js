(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraAgendaBehavior = {
    attach: function (context, settings) {
      //helper Fonction timezone
      function formatDateWithZone(date, tz) {
        var s = date.toLocaleString("en-GB", { timeZone: tz });
        var a = s.split(/\D/);
        return (
          a[2] + "-" + a[1] + "-" + a[0] + " " + a[4] + ":" + a[5] + ":" + a[6]
        );
      }
      function formatDateWithZoneHHmm(date, tz) {
        var s = date.toLocaleString("en-GB", { timeZone: tz });
        var a = s.split(/\D/);
        return a[4] + ":" + a[5];
      }
      if (
        drupalSettings.path.isFront &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_agenda
      ) {
        setTimeout(function () {
          once(
            "APIzimbraAgendaBehavior",
            "#zimbra_block_agenda_id",
            context
          ).forEach(function () {
            // spinner
            document.getElementById("zimbra_block_agenda_id").innerHTML =
              drupalSettings.api_lemon_pleiade.spinner;
            var xhr = new XMLHttpRequest();
            xhr.open("GET",Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query"));
            xhr.responseType = "json";
            xhr.onload = function () {
              if (xhr.status === 200) {
                var donnees = xhr.response;
                //console.log(donnees);
                if (donnees != "0") {
                  var event_array = [];
                  for (
                    var i = 0;
                    i < donnees.userData.Body.SearchResponse.appt.length;
                    i++
                  ) {
                    //console.log( donnees.userData.Body.SearchResponse.appt[i].name);
                    if (donnees.userData.Body.SearchResponse.appt[i].recur) {
                      var start_task =
                        donnees.userData.Body.SearchResponse.appt[i].inst[0].s /
                        1000;
                      var startDate = formatDateWithZone(
                        new Date(start_task * 1000),
                        "Europe/Paris"
                      );
                      var end_task =
                        start_task +
                        donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                      var endDate = formatDateWithZone(
                        new Date(end_task * 1000),
                        "Europe/Paris"
                      );
                      //console.log(start_task);
                      //console.log("date de début :" + startDate);
                      //console.log(end_task);
                      //console.log("date de fin :" + endDate);
                      if (
                        donnees.userData.Body.SearchResponse.appt[i].recur[0]
                          .add[0].rule[0].until
                      ) {
                        var endRecur =
                          donnees.userData.Body.SearchResponse.appt[i].recur[0]
                            .add[0].rule[0].until[0].d;
                        var dateString = endRecur.slice(0, -1);
                        var year = dateString.substring(0, 4);
                        var month = dateString.substring(4, 6);
                        var day = dateString.substring(6, 8);
                        var formattedDate = `${year}-${month}-${day}`;
                        var until = formattedDate;
                      } else {
                        var until = "2122-01-01";
                      }
                      if (
                        donnees.userData.Body.SearchResponse.appt[i].recur[0]
                          .add[0].rule[0].interval
                      ) {
                        var interval =
                          donnees.userData.Body.SearchResponse.appt[i].recur[0]
                            .add[0].rule[0].interval[0].ival;
                      }

                      var timestamp =
                        donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                      var date = formatDateWithZoneHHmm(
                        new Date(timestamp * 1000 - 3600 * 1000),
                        "Europe/Paris"
                      );
                      //console.log("format date : " + date);
                      var frequenceAppt =
                        donnees.userData.Body.SearchResponse.appt[i].recur[0]
                          .add[0].rule[0].freq;
                      switch (frequenceAppt) {
                        case "DAI":
                          var frequence = "daily";
                          break;
                        case "YEA":
                          var frequence = "yearly";
                          break;
                        case "MON":
                          var frequence = "monthly";
                          break;
                        case "WEE":
                          var frequence = "weekly";
                          break;
                        default:
                          break;
                      }
                      event_array[i] = {
                        title:
                          donnees.userData.Body.SearchResponse.appt[i].name, // titre court
                        start: startDate,
                        end: endDate,
                        url:
                          donnees.domainEntry +
                          "modern/calendar/event/details/" +
                          donnees.userData.Body.SearchResponse.appt[i].invId +
                          "?utcRecurrenceId=" +
                          donnees.userData.Body.SearchResponse.appt[i].inst[0]
                            .ridZ +
                          "&start=" +
                          donnees.userData.Body.SearchResponse.appt[i].inst[0]
                            .s +
                          "&end=" +
                          end_task * 1000,
                        rrule: {
                          freq: frequence,
                          interval: interval,
                          dtstart: startDate,
                          until: until,
                        },
                        duration: date,
                      };
                      if (
                        donnees.userData.Body.SearchResponse.appt[i].recur[0]
                          .add[0].rule[0].byday
                      ) {
                        var byWeekDay =
                          donnees.userData.Body.SearchResponse.appt[i].recur[0]
                            .add[0].rule[0].byday[0].wkday;
                        const jours = [];

                        for (const item of byWeekDay) {
                          if (item.day) {
                            jours.push(item.day.toLowerCase());
                            event_array[i].rrule.byweekday = jours;
                          }
                        }
                      }

                      if (
                        donnees.userData.Body.SearchResponse.appt[i].recur[0]
                          .add[0].rule[0].count
                      ) {
                        var count =
                          donnees.userData.Body.SearchResponse.appt[i].recur[0]
                            .add[0].rule[0].count[0].num;
                        event_array[i].rrule.count = count;
                      }
                    } else {
                      var start_task =
                        donnees.userData.Body.SearchResponse.appt[i].inst[0].s /
                        1000;
                      var startDate = new Date(start_task * 1000 + 3600 * 1000);
                      var end_task =
                        start_task +
                        donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                      var endDate = new Date(end_task * 1000 + 3600 * 1000);

                      event_array[i] = {
                        title:
                          donnees.userData.Body.SearchResponse.appt[i].name, // titre court
                        start: startDate,
                        end: endDate,
                        url:
                          donnees.domainEntry +
                          "modern/calendar/event/details/" +
                          donnees.userData.Body.SearchResponse.appt[i].invId +
                          "?utcRecurrenceId=" +
                          donnees.userData.Body.SearchResponse.appt[i].inst[0]
                            .ridZ +
                          "&start=" +
                          donnees.userData.Body.SearchResponse.appt[i].inst[0]
                            .s +
                          "&end=" +
                          end_task * 1000,
                      };
                    }
                  }
                  //console.log(event_array);
                  var calendarEl = document.getElementById(
                    "zimbra_block_agenda_id"
                  );
                  var currentDateObj = new Date();
                  var numberOfMlSeconds = currentDateObj.getTime();
                  var newDateObj = new Date(numberOfMlSeconds);
                  //console.log(newDateObj);
                  var calendar = new FullCalendar.Calendar(calendarEl, {
                    timeZone: "Europe/Paris",
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
                      start: "title", // will normally be on the left. if RTL, will be on the right
                      today: false,
                      end: "EventButton",
                    },
                    nowIndicator: true,
                    now: newDateObj,
                    initialView: "timeGridDay",
                    slotMinTime: "07:00:00",
                    slotMaxTime: "19:00:00",
                    themeSystem: "bootstrap",
                    slotLabelInterval: "00:30:00",
                    events: event_array,
                    eventClick: function (event) {
                      if (event.event.url) {
                        event.jsEvent.preventDefault();
                        window.open(event.event.url, "_blank");
                      }
                    },
                  });
                  calendar.render();
                } else {
                  var linkEntitie =
                    '<div id="zimbra_agenda" class="col-lg-12">\
                    <div class="card mb-0">\
                      <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                        <h4 class="card-title text-dark py-2"><span>Agenda du jour</span></h4>\
                        </div>\
                            <div class="card-body">\
                              <h2> Erreur lors de la récupération de l\'agenda </h2></div>\
                            </div>\
                        </div>\
                      </div>\
                    ';
                  document.getElementById("zimbra_block_agenda_id").innerHTML = linkEntitie;
                }
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
          }); // fin once function
        }, 1000); // 1000 millisecondes = 1 seconde
      }
    },
  };
})(Drupal, once, drupalSettings);
