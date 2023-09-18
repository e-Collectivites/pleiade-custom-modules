(function (Drupal, once, drupalSettings) {
  "use strict";
  Drupal.behaviors.APIzimbraFullAgendaBehavior = {
    attach: function (context, settings) {
      // Load on front page only,
      if (
drupalSettings.path &&
      drupalSettings.path.currentPath &&
      drupalSettings.path.currentPath.includes("calendar") &&
        drupalSettings.api_zimbra_pleiade.field_zimbra_agenda
      ) {
        once(
          "APIzimbraFullAgendaBehavior",
          "#zimbra_full_calendar",
          context
        ).forEach(function () {
          // spinner
          document.getElementById("zimbra_full_calendar").innerHTML =
            drupalSettings.api_lemon_pleiade.spinner;
          // requete
          var xhr = new XMLHttpRequest();
          xhr.open(
            "GET",
            Drupal.url("v1/api_zimbra_pleiade/zimbra_tasks_query")
          );
          xhr.responseType = "json";

          xhr.onload = function () {
            if (xhr.status === 200) {
              var donnees = xhr.response;
              //            console.log(donnees);
              if (donnees && donnees != "0") {
                var event_array = [];
                document.cookie =
                  "nbOfTasks=" +
                  donnees.userData.Body.SearchResponse.appt.length;
                for (
                  var i = 0;
                  i < donnees.userData.Body.SearchResponse.appt.length;
                  i++
                ) {

		if(donnees.userData.Body.SearchResponse.appt[i].recur){
 			var start_task = donnees.userData.Body.SearchResponse.appt[i].inst[0].s / 1000;
                    var startDate = new Date(start_task * 1000 + 3600 * 1000 * 2);
			var end_task = start_task + donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                    var endDate = new Date(end_task * 1000 + 3600 * 1000 * 2);

                    var interval = donnees.userData.Body.SearchResponse.appt[i].recur[0].add[0].rule[0].interval[0].ival                   
                    var frequenceAppt = donnees.userData.Body.SearchResponse.appt[i].recur[0].add[0].rule[0].freq
                    switch (frequenceAppt) {
			 case 'DAI':
                        var frequence = 'daily'
                        break;
                      case 'YEA':
                        var frequence = 'yearly'
                        break;
                      case 'MON':
                        var frequence = 'monthly'
                        break;
			case 'WEE':
                          var frequence = 'weekly'
                          break;
                      default:
                        break;
                    }
                    event_array[i] = {
                      title: donnees.userData.Body.SearchResponse.appt[i].name, // titre court
                      start: startDate.toISOString().replace(".000Z", ""),
                      end: endDate.toISOString().replace(".000Z", ""),
                      url:
                        donnees.domainEntry +
                        "modern/calendar/event/details/" +
                        donnees.userData.Body.SearchResponse.appt[i].invId +
                        "?utcRecurrenceId=" +
                        donnees.userData.Body.SearchResponse.appt[i].inst[0]
                          .ridZ +
                        "&start=" +
                        donnees.userData.Body.SearchResponse.appt[i].inst[0].s +
                        "&end=" +
                        end_task * 1000,
		      rrule: {
                        freq: frequence,
                        interval: interval,
                        dtstart: startDate.toISOString().replace(".000Z", ""),
                      }
                    };
		}
else
{
var start_task = donnees.userData.Body.SearchResponse.appt[i].inst[0].s / 1000;
                    var startDate = new Date(start_task * 1000 + 3600 * 1000 * 2);
                    var end_task = start_task + donnees.userData.Body.SearchResponse.appt[i].dur / 1000;
                    var endDate = new Date(end_task * 1000 + 3600 * 1000 * 2);

                    event_array[i] = {
                      title: donnees.userData.Body.SearchResponse.appt[i].name, // titre court
                      start: startDate.toISOString().replace(".000Z", ""),
                      end: endDate.toISOString().replace(".000Z", ""),
                      url: 
                        donnees.domainEntry +
                        "modern/calendar/event/details/" +
                        donnees.userData.Body.SearchResponse.appt[i].invId +
                        "?utcRecurrenceId=" +
                        donnees.userData.Body.SearchResponse.appt[i].inst[0]
                          .ridZ +
                        "&start=" +
                        donnees.userData.Body.SearchResponse.appt[i].inst[0].s +
                        "&end=" +
                        end_task * 1000,
                      
                    };
		}

                  }
                console.log(event_array);
                var calendarEl = document.getElementById(
                  "zimbra_full_calendar"
                );
                var currentDateObj = new Date();

                var numberOfMlSeconds = currentDateObj.getTime();

                var addMlSeconds = 60 * 60 * 1000 * 2;
                var newDateObj = new Date(numberOfMlSeconds + addMlSeconds);
                //console.log(newDateObj)
                var calendar = new FullCalendar.Calendar(calendarEl, {
		  timeZone: "UTC",
                  locale: "fr",
                  buttonText: {
			today: 'Cette semaine',
		  },
		  headerToolbar: {
			left: 'prev,next today',
      			center: 'title',
			right: false
                  },
                  nowIndicator: true,
                  now: newDateObj,
		slotMinTime: "08:00:00",
                  slotMaxTime: "20:00:00",
                  initialView: "timeGridWeek",
		weekends: false,
		themeSystem: "bootstrap",
        	slotDuration: "00:15:00",          
                events: event_array,
		eventClick: function (event) {
                    if (event.event.url) {
                      event.jsEvent.preventDefault();
                      window.open(event.event.url, "_blank");
                    }
                  },
                });
                calendar.render();
document.getElementById('spinner-history').style.display = 'none'; 
              } else {
                var linkEntitie =
                  '<div id="zimbra_agenda" class="col-lg-12 ">\
                    <div>\
                      <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                        <h4 class="card-title text-dark py-2"><span>Agenda du jour</span></h4>\
                        </div>\
                            <div class="card-body">\
                              <h2> Erreur lors de la récupération de l\'agenda </h2></div>\
                            </div>\
                        </div>\
                      </div>\
          ';
                document.getElementById("zimbra_full_calendar").innerHTML =
                  linkEntitie;
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
      }
    },
  };
})(Drupal, once, drupalSettings);
