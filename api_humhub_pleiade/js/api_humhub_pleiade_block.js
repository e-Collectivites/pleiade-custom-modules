// (function ($, Drupal, drupalSettings, once) {
//         "use strict";
//         Drupal.behaviors.HumhubBlockBehavior = {
//                 attach: function (context, settings) {
//                         // only on frontpage (desktop)
//                         if (drupalSettings.path.isFront) {
//                                 setTimeout(function () {
//                                         once("HumhubBlockBehavior", "body", context).forEach(
//                                                 function () {
//                                                         // make ajax call
//                                                         var xhr = new XMLHttpRequest();
//                                                         xhr.open("GET", Drupal.url("v1/api_humhub_pleiade/humhub_query"));
//                                                         xhr.responseType = "json";
//                                                         xhr.onload = function () {
//                                                                 var bloc_humhub
//                                                                 if (xhr.status === 200) {
//                                                                         var donnees = (xhr.response);
//                                                                         if (donnees) {
//                                                                                 var donnees_spaces = donnees['spaces']
//                                                                                 var donnees_notif = donnees['notifs']
//                                                                                 var donnees_messages = donnees['messages']

//                                                                                 if (donnees_spaces.results.length > 6) {
//                                                                                         var overflow = 'overflow-y:scroll;'
//                                                                                 }
//                                                                                 bloc_humhub = '\
//                                                                                 <div class="mb-2">\
//                                                                                         <div class="card">\
//                                                                                                 <div class="card-header rounded-top bg-white rounded-top">\
//                                                                                                         <h4 class="card-title text-dark py-2">\
//                                                                                                                 Réseau Social Pléiade</h4>\
//                                                                                                 </div>\
//                                                                                         <div class="card-body pt-0 d-flex justify-content-between">\
//                                                                         '
//                                                                                 bloc_humhub += '<div class="col-md-5 d-flex align-content-start  row" id="col1">\
//                                                                                 <h5 class="card-title text-dark py-2">\
//                                                                                 Mes espaces</h5><div style="height:256px; '+ overflow + '" class="d-flex flex-wrap align-items-center justify-content-center">'
//                                                                                 if (donnees['spaces'].results.length > 0) {
//                                                                                         for (var i = 0; i < donnees_spaces.results.length; i++) {
//                                                                                                 var text = donnees_spaces.results[i].name;
//                                                                                                 var url = donnees_spaces.results[i].url;
//                                                                                                 bloc_humhub += '\
//                                                                                                 <a href="'+ url + '" target="_blank" class="pb-2 px-2">\
//                                                                                                         <div class="square d-flex align-items-center justify-content-center">\
//                                                                                                                 <span class="px-2 fs-4 text-uppercase text-align-center">'+ text + '</span>\
//                                                                                                         </div>\
//                                                                                                 </a>'
//                                                                                         }
//                                                                                 }
//                                                                                 else {
//                                                                                         bloc_humhub += '<h6 class="col-md-2">Aucun espace disponible ou erreur avec lors de la connexion à Humhub</h6>'
//                                                                                 }
//                                                                                 bloc_humhub += '</div></div>'
//                                                                                 bloc_humhub += '<div class="col-md-7" id="col1">\
//                                                                                 <h5 class="card-title text-dark py-2">\
//                                                                                         Mes notifications</h5><div class="d-flex flex-column" style="height:256px; overflow-y:scroll;">'
//                                                                                 if (donnees['notifs'] && donnees['notifs'].results.length > 0) {
//                                                                                         console.log('1')
//                                                                                         for (var i = 0; i < donnees_notif.results.length; i++) {
//                                                                                                 var text = donnees_notif.results[i].output;
//                                                                                                 var date = donnees_notif.results[i].createdAt;
//                                                                                                 var formattedDate = new Date(date); // Créer un objet de date
//                                                                                                 var day = formattedDate.getDate();
//                                                                                                 var month = formattedDate.getMonth() + 1; // Les mois sont indexés à partir de 0, donc ajouter 1
//                                                                                                 var year = formattedDate.getFullYear();
//                                                                                                 var hours = formattedDate.getHours();
//                                                                                                 var minutes = formattedDate.getMinutes();
//                                                                                                 // Formater la date et l'heure
//                                                                                                 var formattedString = day + '/' + (month < 10 ? '0' : '') + month + '/' + year + ' ' + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
//                                                                                                 bloc_humhub += '\
//                                                                                                 <div class="">\
//                                                                                                         <div class="d-flex justify-content-start align-items-center">\
//                                                                                                                 <span class="col-md-2 fs-2">'+ formattedString + '</span>\
//                                                                                                                 <span>'+ text + '</span>\
//                                                                                                         </div>\
//                                                                                                 </div><hr>\
//                                                                                                 '
//                                                                                         }

//                                                                                 }
//                                                                                 else if (donnees['messages'] && donnees['messages'].results.length > 0) {
//                                                                                         console.log('1')
//                                                                                         for (var i = 0; i < donnees_messages.results.length; i++) {
//                                                                                                 var text = donnees_messages.results[i].title;
//                                                                                                 var date = donnees_messages.results[i].created_at;
//                                                                                                 var href = drupalSettings.api_humhub_pleiade.humhub_url + '/mail/mail/index?id=' + donnees_messages.results[i].id;
//                                                                                                 var formattedDate = new Date(date); // Créer un objet de date
//                                                                                                 var day = formattedDate.getDate();
//                                                                                                 var month = formattedDate.getMonth() + 1; // Les mois sont indexés à partir de 0, donc ajouter 1
//                                                                                                 var year = formattedDate.getFullYear();
//                                                                                                 var hours = formattedDate.getHours();
//                                                                                                 var minutes = formattedDate.getMinutes();
//                                                                                                 // Formater la date et l'heure
//                                                                                                 var formattedString = day + '/' + (month < 10 ? '0' : '') + month + '/' + year + ' ' + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
//                                                                                                 if (donnees_messages.results[i].created_by == donnees_messages.results[i].updated_by) {
//                                                                                                         bloc_humhub += '\
//                                                                                                         <div class="">\
//                                                                                                                 <div class="d-flex justify-content-start align-items-center">\
//                                                                                                                         <span class="col-md-2 fs-2">'+ formattedString + '</span>\
//                                                                                                                         <a href="'+ href + '" target="_blank">Vous avez un nouveau message sur la conversation "' + text + '"</a>\
//                                                                                                                 </div>\
//                                                                                                         </div><hr>\
//                                                 '
//                                                                                                 }
//                                                                                         }

//                                                                                 }
//                                                                                 else {
//                                                                                         bloc_humhub += '<h6 class="col-md-2">Aucune notification</h6>'

//                                                                                 }
//                                                                                 bloc_humhub += '</div></div>'
//                                                                                 bloc_humhub += ''
//                                                                                                 "\
//                                                                                                 </div>\
//                                                                                         </div>\
//                                                                                 </div>\
//                                                                                 ";
//                                                                         }


//                                                                         document.getElementById("humhub_block").innerHTML = bloc_humhub;

//                                                                 };
//                                                                 xhr.onerror = function () {
//                                                                         console.log("Error making AJAX call");
//                                                                 };
//                                                                 xhr.onabort = function () {
//                                                                         console.log("AJAX call aborted");
//                                                                 };
//                                                                 xhr.ontimeout = function () {
//                                                                         console.log("AJAX call timed out");
//                                                                 };
//                                                                 xhr.onloadend = function () {
//                                                                 }
//                                                         };
//                                                         xhr.send();
//                                                 }); // end once
//                                 }, 2000); // 1000 millisecondes = 1 seconde
//                         }
//                 },
//         };
// })(jQuery, Drupal, drupalSettings, once);
