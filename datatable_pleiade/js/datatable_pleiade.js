(function (Drupal, $, drupalSettings) {
  "use strict";
  Drupal.behaviors.DatatableDocBehavior = {
    attach: function (context, settings) {
      setTimeout(function () {
        once("DatatableDocBehavior", "body", context).forEach(function () {

          if (localStorage.getItem("collectivite_id")) {
            var previousValue = localStorage.getItem("collectivite_id");
          }
          if (drupalSettings.api_pastell_pleiade) {
            var pastell_url = drupalSettings.api_pastell_pleiade.field_pastell_url;
          }

          var documentsTable;

          $('#document_recent_id', context).on('click', '#reloadDatatable', function() {
            if (documentsTable) {
                try {
                    documentsTable.destroy();
                } catch(e) {
                    console.warn("Could not destroy table instance.");
                }
            }
            reloadDataTable();
          });

     function reloadDataTable() {
        var xhr = new XMLHttpRequest();
        if (previousValue == undefined) previousValue = '';
        xhr.open("GET", Drupal.url("v1/datatable_pleiade/documents_recents?id_e=" + previousValue));
        xhr.responseType = "json";

        xhr.onload = function () {
            if (xhr.status === 200) {
                var apiResponse = xhr.response;
                var tableData = [];

                if (apiResponse && apiResponse.docs && apiResponse.docs.length > 0) {
                    var donnees = apiResponse.docs;

                    var tabulatorHtmlStructure = `
                    <div class="col-lg-12" id="pastell_block">
                        <div class="card close mb-0">
                            <div class="card-header close-icon d-flex align-items-center rounded-top bg-white rounded-top">
                            <h4 class="card-title text-dark py-2">Activités récentes<span></span></h4>
                            <button type="button" class="btn btn-secondary reload-btn" id="reloadDatatable">
                                <i class="fa-solid fa-rotate"></i>
                            </button>
                            </div>
                            <div class="card-body close-div">
                                <div class="mb-3 rounded">
                                    <div id="external-filters-container" class="mb-3"></div>
                                    <div id="action-buttons-container"></div>
                                </div>
                                <div id="tabulator-documents"></div>
                                <div id="go_to_pastell" class="w-auto"></div>
                            </div>
                        </div>
                    </div>`;

                    if (drupalSettings.path.isFront && document.getElementById("document_recent_id")) {
                        document.getElementById("document_recent_id").innerHTML = tabulatorHtmlStructure;
                    }

                    for (var i = 0; i < donnees.length; i++) {
                        let row = {};
                        row.application = donnees[i].type;
                        row.titre = donnees[i].titre || "Sans titre";
                        row.actions_html = "";

                        let dateStr = donnees[i].creation || donnees[i].last_action_date || '';
                        row.objectDate = ''; 

                        if (dateStr) {
                            const parts = dateStr.split('/');
                            if (parts.length === 3) {
                                let day = String(parts[0]).padStart(2, '0');
                                let month = String(parts[1]).padStart(2, '0');
                                let year = parseInt(parts[2], 10);
                                year += (year < 100) ? 2000 : 0;
                                row.objectDate = `${year}-${month}-${day}`;
                            }
                        }
                        
                        if (donnees[i].type === "Nextcloud") {
                            row.type_doc = "Notification"; row.status_display = "Actif";
                            row.actions_html = `<a target="nextCloudView" href="${donnees[i].fileUrl}"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>`;
                        } else if (donnees[i].type === "Parapheur") {
                            row.type_doc = donnees[i].type_dossier; row.status_display = donnees[i].status;
                            row.actions_html = `<a target="parapheurView" href="${donnees[i].fileUrl}"><i class="fa fa-2x fa-signature" aria-hidden="true"></i></a>`;
                        } else if (donnees[i].type === "Maarch") {
                            row.type_doc = donnees[i].type_dossier; row.status_display = donnees[i].status;
                            row.actions_html = `<a target="maarchView" href="${donnees[i].fileUrl}"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>`;
                        } else {
                            row.application = "Pastell";
                            let supp_yes = false, edit_yes = false;
                            row.type_doc = donnees[i].type;
                            let last_etat = donnees[i].last_action_display;
                            let download_doc = "";

                            switch (last_etat) {
                                case "creation": row.status_display = "Créé"; supp_yes = true; edit_yes = true; break;
                                case "send-ged": row.status_display = "Versé en GED"; break;
                                case "send-cdg": row.status_display = "Transmis au CDG"; break;
                                case "termine":
                                    row.status_display = "Traitement terminé";
                                    if (donnees[i].last_type && donnees[i].last_type.includes("actes")) {
                                    download_doc = `<a target="_blank" href="${pastell_url}Document/RecuperationFichier?id_d=${donnees[i].id_d}&id_e=${donnees[i].id_e}&field=acte_tamponne&num=0"><i class="fa fa-2x fa-download" aria-hidden="true"></i></a>`;
                                    }
                                    supp_yes = true; edit_yes = false; break;
                                case "info-tdt": row.status_display = "Traitement terminé"; supp_yes = true; edit_yes = true; break;
                                default: row.status_display = last_etat;
                            }
                            let lien_pastell_detail = `<a target="_blank" href="${pastell_url}Document/detail?id_d=${donnees[i].id_d}&id_e=${donnees[i].id_e}"><i class="fa fa-2x fa-eye" aria-hidden="true"></i></a>`;
                            let lien_pastell_edition = edit_yes ? `<a class="d-flex" target="_blank" href="${pastell_url}Document/edition?id_d=${donnees[i].id_d}&id_e=${donnees[i].id_e}"><i class="fa fa-2x fa-pencil-square" aria-hidden="true"></i></a>` : '';
                            let lien_pastell_supp = supp_yes ? `<a target="_blank" href="${pastell_url}Document/warning?id_d=${donnees[i].id_d}&id_e=${donnees[i].id_e}&action=supression"><i class="fa fa-2x fa-trash" aria-hidden="true"></i></a>` : '';
                            row.actions_html = `<div class='action_rapides d-flex justify-content-around align-items-center'>${download_doc}${lien_pastell_detail}${lien_pastell_edition}${lien_pastell_supp}</div>`;
                        }
                        tableData.push(row);
                    }
                    
                    var statusFormatter = function(cell){ return cell.getValue() ? `<span class="badge bg-info text-dark">${cell.getValue()}</span>` : ''; };
                    var actionsFormatter = function(cell){ return cell.getValue(); };

                    documentsTable = new Tabulator("#tabulator-documents", {
                        data: tableData,
                        layout: "fitColumns",
                        pagination: "local",
                        paginationSize: 10,
                        locale: "fr",
                        movableColumns: true,
                        persistence: true,
                        persistenceID: "datatable-documents-state",
                        // =================== TRI PAR DATE (PLUS RÉCENT AU PLUS ANCIEN) ===================
                        initialSort:[
                            {column:"objectDate", dir:"desc"}, 
                        ],
                        // =================== FIN DU TRI ===================
                        columns:[
                            {title:"Application", field:"application"},
                            {title:"Titre", field:"titre", formatter:"textarea"},
                            {title:"Type", field:"type_doc"},
                            {
                                title:"Date", 
                                field:"objectDate",
                                sorter:"date", // Changé de "string" à "date" pour un tri plus précis
                                formatter:function(cell){
                                    const dateValue = cell.getValue();
                                    if(dateValue){
                                        const parts = dateValue.split('-');
                                        if(parts.length === 3) {
                                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                        }
                                    }
                                    return ""; 
                                }
                            },
                            {title:"Statut", field:"status_display", hozAlign:"center", formatter:statusFormatter},
                            {title:"Actions", field:"actions_html", hozAlign:"center", formatter:actionsFormatter, headerSort:false},
                        ]
                    });
                    
                    setupExternalFilters(documentsTable, tableData);
                    setupActionButtons(documentsTable);

                } else {
                    document.getElementById("document_recent_id").innerHTML = `<div class="col-lg-12"><div class="card mb-0"><div class="card-header bg-white"><h4 class="card-title py-2">Activités récentes</h4></div><div class="card-body"><h5>Aucun document disponible</h5></div></div></div>`;
                }
            }
        };
        xhr.onerror = function () { console.error("Error making AJAX call"); };
        xhr.send();
    }
    
    function setupExternalFilters(table, data) {
        const filtersContainer = document.getElementById("external-filters-container");
        if (!filtersContainer) return;
        filtersContainer.innerHTML = "";
        const filterRow = document.createElement("div");
        filterRow.className = "row g-3 align-items-center";
        const activeFilters = {};

        const applyFilters = () => {
            const filters = Object.keys(activeFilters).filter(field => activeFilters[field])
                .map(field => ({field: field, type: field === 'titre' ? 'like' : '=', value: activeFilters[field]}));
            table.setFilter(filters);
        };

        const selectFields = {"application": "Filtrer par application...", "type_doc": "Filtrer par type...", "status_display": "Filtrer par statut..."};
        for (const field in selectFields) {
            const placeholder = selectFields[field];
            const uniqueValues = ["", ...new Set(data.map(item => item[field]).filter(Boolean))].sort();
            const wrapper = document.createElement("div"); wrapper.className = "col-md";
            const select = document.createElement("select"); select.className = "form-select";
            uniqueValues.forEach(value => {
                const option = document.createElement("option");
                option.value = value; option.text = value === "" ? placeholder : value;
                select.appendChild(option);
            });
            select.addEventListener("change", (e) => { activeFilters[field] = e.target.value; applyFilters(); });
            wrapper.appendChild(select); filterRow.appendChild(wrapper);
        }

        const searchWrapper = document.createElement("div"); searchWrapper.className = "col-md";
        const searchInput = document.createElement("input"); searchInput.type = "text";
        searchInput.className = "form-control"; searchInput.placeholder = "Rechercher par titre...";
        searchInput.addEventListener("keyup", () => { activeFilters['titre'] = searchInput.value; applyFilters(); });
        searchWrapper.appendChild(searchInput); filterRow.appendChild(searchWrapper);
        
        const resetWrapper = document.createElement("div"); resetWrapper.className = "col-md-auto";
        const resetButton = document.createElement("button"); resetButton.className = "btn btn-secondary"; resetButton.textContent = "Réinitialiser";
        resetButton.addEventListener("click", () => {
            table.clearFilter();
            Object.keys(activeFilters).forEach(key => activeFilters[key] = "");
            filterRow.querySelectorAll("select, input").forEach(el => el.value = "");
        });
        resetWrapper.appendChild(resetButton); filterRow.appendChild(resetWrapper);
        filtersContainer.appendChild(filterRow);
    }
    
    function printFilteredTable(table) {
        const visibleCols = table.getColumns().filter(col => col.isVisible() && col.getField() !== 'actions_html');
        const headersHtml = '<tr>' + visibleCols.map(col => `<th>${col.getDefinition().title}</th>`).join('') + '</tr>';
        const filteredData = table.getData("active");
        const rowsHtml = filteredData.map(rowData => {
            return '<tr>' + visibleCols.map(col => {
              let value = rowData[col.getField()];
              if (col.getField() === 'objectDate' && value) {
                  const parts = value.split('-');
                  if(parts.length === 3) value = `${parts[2]}/${parts[1]}`;
              }
              return `<td>${value !== undefined && value !== null ? value : ''}</td>`;
            }).join('') + '</tr>';
          }).join('');

        const printHtml = `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
                           <thead>${headersHtml}</thead>
                           <tbody>${rowsHtml}</tbody>
                         </table>`;

        const printWindow = window.open('', '', 'width=900,height=600');
        printWindow.document.write('<html><head><title>Impression</title></head><body>' + printHtml + '</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
    
    function setupActionButtons(table) {
        const container = document.getElementById("action-buttons-container");
        if (!container) return;
        container.innerHTML = `
            <div class="d-flex flex-wrap gap-2">
                <button id="print-table" class="btn btn-outline-secondary">Imprimer</button>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Exporter</button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" id="export-csv" href="#">Exporter CSV</a></li>
                        <li><a class="dropdown-item" id="export-json" href="#">Exporter JSON</a></li>
                        <li><a class="dropdown-item" id="export-xlsx" href="#">Exporter XLSX</a></li>
                    </ul>
                </div>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Colonnes</button>
                    <ul id="columns-menu" class="dropdown-menu p-2" style="max-height: 300px; overflow-y: auto;"></ul>
                </div>
            </div>`;

        document.getElementById("print-table").addEventListener("click", () => printFilteredTable(table));

        document.getElementById("export-csv").addEventListener("click", () => table.download("csv", "documents.csv"));
        document.getElementById("export-json").addEventListener("click", () => table.download("json", "documents.json"));
        document.getElementById("export-xlsx").addEventListener("click", () => table.download("xlsx", "documents.xlsx", {sheetName:"Documents"}));

        setTimeout(function() {
            const columnsMenu = document.getElementById("columns-menu");
            if (!columnsMenu) return;
            columnsMenu.innerHTML = ''; 
            table.getColumns().forEach(column => {
                const definition = column.getDefinition();
                const field = column.getField();
                if (!definition.title || !field) return;

                const li = document.createElement("li"); li.className = "form-check mx-2";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox"; checkbox.className = "form-check-input";
                checkbox.value = field; checkbox.checked = column.isVisible();
                checkbox.id = `col-toggle-${field}`;
                
                const label = document.createElement("label");
                label.className = "form-check-label";
                label.setAttribute("for", checkbox.id);
                label.textContent = definition.title;
                
                checkbox.addEventListener("change", (e) => {
                    if (e.target.checked) { table.showColumn(field); } 
                    else { table.hideColumn(field); }
                });
                li.appendChild(checkbox); li.appendChild(label); columnsMenu.appendChild(li);
            });
        }, 100);
    }
       
    reloadDataTable();
        });
      }, 0);
    },
  };
})(Drupal, jQuery, drupalSettings);