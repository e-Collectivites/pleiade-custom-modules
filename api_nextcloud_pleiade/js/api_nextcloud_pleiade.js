(function (Drupal, $, drupalSettings) {
    // we use Jquery '$' just...for Datatables plugin :/ Whatever it's included and needed in our custom Bootstrap theme.
    "use strict";
    Drupal.behaviors.DatatableNCBehavior = {
        attach: function (context, settings) {

            // only on frontpage
            if (drupalSettings.path.isFront && !drupalSettings.api_pastell_pleiade) {
                once("DatatableNCBehavior", "#collectiviteChoice", context).forEach(
                    function () {
                    // console.log('id_e call : ' + id_e);
                    // show spinner while ajax is loading
                    var userGroupsTempstore = drupalSettings.api_lemon_pleiade.user_groups;
                    document.getElementById("document_recent_id").innerHTML = drupalSettings.api_lemon_pleiade.spinner;
                    // console.log('Pastell Documents target function called...');
                    // console.log('Retrieve localStorage collectivite id : '+localStorage.getItem('collectivite_id'));
                    var xhr = new XMLHttpRequest();
                    // Pass collectivite ID to our PHP endpoint as a param as server side, it can not access cookie set on client side
                    xhr.open("GET", Drupal.url("v1/datatable_pleiade/documents_recents"));
                    // Pastell pas en UTF8 :/
                    // xhr.overrideMimeType('text/xml; charset=iso-8859-1');
                    xhr.responseType = "json"; 
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                    var donnees = xhr.response;
                    // debug
                    //console.log(donnees); 
                    if(donnees && userGroupsTempstore.includes('pastell')){
                      var document_coll =
                      '\
                      <div class="col-lg-12" id="pastell_block"> \
                      <div class="mb-2 shadow-sm">\
                        <div class="card mb-2">\
                          <div class="card-header rounded-top bg-white border-bottom rounded-top">\
                            <h4 class="card-title text-dark py-2">\
                              Documents récents <span></span>\
                            </h4>\
                          </div>\
                          <div class="card-body">\
                            <table class="table table-striped" id="tablealldocs">\
                              <thead>\
                                <tr>\
                                  <th scope="col">Titre</th>\
                                  <th scope="col">Type</th>\
                                  <th scope="col">Dernière modification</th>\
                                  <th scope="col">Statut</th>\
                                  <th></th>\
                                  </tr>\
                              </thead>\
                              <tbody>';
                              for (var i = 0; i < donnees.length; i++) {
                            
  
                              if (donnees[i].type === 'Nextcloud' && donnees[i].titre && donnees[i].creation && donnees[i].status && donnees[i].fileUrl) {
                                var titre = donnees[i].titre;
                                var type = 'Nextcloud'; // Assuming 'Nextcloud' is the type for this item
                                var objectDate = donnees[i].creation;
  
                                // Split the input string into date and time parts
                                const [datePart, timePart] = objectDate.split(" ");
  
                                // Split the date part into day, month, and year
                                const [day, month, year] = datePart.split("/");
  
                                // Split the time part into hours and minutes
                                const [hours, minutes] = timePart.split(":");
  
                                // Create a new Date object using the extracted values
                                const dateObj = new Date(year, month - 1, day, hours, minutes);
  
                                // Format the date object to the desired format: "YYYY-MM-DD HH:mm:ss"
                                const formattedDate = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj
                                  .getDate()
                                  .toString()
                                  .padStart(2, "0")} ${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}:${dateObj.getSeconds().toString().padStart(2, "0")}`;
  
                                var etat = '<span class="badge py-2 px-4 bg-primary">' + donnees[i].status + '</span>';
                                var lien_pastell_detail = '<a target="_blank" href="' + donnees[i].fileUrl + '"><i data-feather="search" class="feather-icon"></i></a>';
                                var document_row = "\
                                <tr>\
                                  <td>" + titre + "</td>\
                                  <td>" + type + "</td>\
                                  <td>" + formattedDate + "</td>\
                                  <td>" + etat + "</td>\
                                  <td><div class='btn-group dropend'>\
                                    <button type='button' class='btn dropdown-toggle' data-bs-toggle='dropdown' aria-expanded='false'>\
                                    <i data-feather='more-horizontal' class='feather-icon' id='dropdown-icon'></i>\
                                    </button>\
                                    <ul class='dropdown-menu'>\
                                    " + lien_pastell_detail + "\</ul>\
                                  </div></td>\
                                  </tr>\
                                ";
  
                                document_coll += document_row;
                              }
                              
                        }
                          document_coll += "\
                          </tbody>\
                        </table>\
                      </div>\
                    </div>\
                  </div>\
                </div>\
                "
                document.getElementById("document_recent_id").innerHTML = document_coll;
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
        xhr.onloadend = function () {
            // feather icon for doc links
            feather.replace();
            // Datatables effect on doc list
            $("#tablealldocs").DataTable(
                {
                  "columns": [
  
                    { "data": "titre" },
                    { "data": "type" },
                    {
                      "data": "objectDate", "render": function (data, type) {
                        
                        return type === 'sort' ? data : moment(data).format('DD/MM/YYYY HH:mm');
                      }
                    },
                    { "data": "etat" },
                  ],
  
                  "aoColumnDefs": [
                    { "bSortable": false, "aTargets": [ 4 ] }, 
                    { "width": "20%", "targets": 3 },
                    { "width": "22%", "targets": 2 },
                    { "width": "25%", "targets": 1 },
                    { "width": "25%", "targets": 0 },
                    
                  ],
                  "order": [[2, 'desc']],  
                  "paging": true,
                  "language": {
                    "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/French.json"
                  },
                  "responsive": true,
                  "lengthMenu": [[5, 10, 25], [5, 10, 25]],           
                });
                
              };
        
              xhr.send();  
            });
            }
          }
        }
    })(Drupal, jQuery, drupalSettings);