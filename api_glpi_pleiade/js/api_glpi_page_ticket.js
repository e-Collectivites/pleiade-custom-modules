(function (Drupal, once, $, drupalSettings) {
  "use strict";

  Drupal.behaviors.GLPIUnifiedBehavior = {
    attach: function (context) {
      const container = document.getElementById("glpi_tickets_id");
      if (!container) return;

      once("GLPIUnifiedBehavior", container, context).forEach((el) => {
        const glpiUrl = drupalSettings.api_glpi_pleiade?.glpi_url;
        const isFront = drupalSettings.path?.isFront;
        if (!glpiUrl) return;
        
        var glpiTable; // Make table accessible in the scope

        // Custom sorters (these are compatible and will remain)
        const statusOrder = { "Nouveau": 1, "En cours (attribué)": 2, "En cours (planifié)": 3, "En attente": 4, "Résolu": 5, "Clos": 6 };
        const urgencyOrder = { 'Très basse': 1, 'Basse': 2, 'Moyenne': 3, 'Haute': 4, 'Très haute': 5 };
        const priorityOrder = { 'Basse': 2, 'Moyenne': 3, 'Haute': 4, 'Très Haute': 5, 'Majeure': 6 };
        
        const customSorter = (orderMap) => (a, b, aRow, bRow, column, dir, sorterParams) => {
            return (orderMap[a] || 99) - (orderMap[b] || 99);
        };

        function reloadGlpiTickets() {
          if (glpiTable) {
            try {
              glpiTable.destroy();
            } catch(e) { console.warn("Could not destroy GLPI table."); }
          }
          el.innerHTML = `<div class="card shadow-sm"><div class="card-body">Chargement des tickets...</div></div>`;

          fetch(Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets"))
            .then((response) => response.json())
            .then((data) => {
              if (!data || data.length === 0) {
                  el.innerHTML = `<div class="card shadow-sm"><div class="card-header d-flex justify-content-between align-items-center"><h4 class="card-title text-dark py-2 mb-0">Derniers tickets GLPI</h4><button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi"><i class="fa-solid fa-rotate"></i></button></div><div class="card-body"><h5>Aucun ticket GLPI en cours</h5></div></div>`;
                  return;
              }
              
              const htmlStructure = `
                <div class="card close" style="height: 100%;">
                  <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex">
                    <h4 class="card-title text-dark py-2 mb-0">${isFront ? "Derniers tickets GLPI" : "Mes derniers tickets GLPI"}</h4>
                    <button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi"><i class="fa-solid fa-rotate"></i></button>
                  </div>
                  <div class="card-body close-div">
                    <div class="mb-3 rounded">
                      <div id="glpi-filters-container" class="mb-3"></div>
                      <div id="glpi-actions-container"></div>
                    </div>
                    <div id="glpi-tabulator-table"></div>
                  </div>
                </div>`;
              el.innerHTML = htmlStructure;

              glpiTable = new Tabulator("#glpi-tabulator-table", {
                data: data,
                layout: "fitColumns",
                pagination: "local",
                paginationSize: isFront ? 5 : 10,
                paginationSizeSelector: [5, 10, 20, 50],
                locale: "fr",
                    initialSort:[
                            {column:"start_date", dir:"desc"}, 
                        ],
                columns: [
                  {title: "Nom du ticket", field: "name", minWidth: 200, formatter: "textarea"},
                  {title: "Statut", field: "status", sorter: customSorter(statusOrder)},
                  {title: "Date d'ouverture", field: "start_date", sorter: "date", sorterParams:{ format:"DD/MM/YYYY" }},
                  {title: "Dernière modification", field: "last_modification_date", sorter: "date", sorterParams:{ format:"DD/MM/YYYY" }},
                  {title: "Urgence", field: "urgency", sorter: customSorter(urgencyOrder)},
                  {title: "Priorité", field: "priority", sorter: customSorter(priorityOrder)},
                  {title: "Je suis", field: "roles", sorter: "string"},
                  // **FIX**: Removed invalid 'sortable:false' property
                  {title: "", field: "id", hozAlign: "center", headerSort:false,
                    formatter: (cell) => `<a href="${glpiUrl}/front/ticket.form.php?id=${cell.getValue()}" target="glpiticket"><i class="fa-solid fa-magnifying-glass"></i></a>`
                  }
                ]
              });

              // Call setup functions immediately to ensure UI is always visible
              setupExternalFilters(glpiTable, data);
              setupActionButtons(glpiTable);
            })
            .catch((error) => {
              console.error("Erreur GLPI:", error);
              el.innerHTML = `<div class="alert alert-danger">Erreur de chargement des tickets GLPI.</div>`;
            });
        }

        function setupExternalFilters(table, data) {
            // This filter function is well-written and should be compatible. No changes needed.
            const filtersContainer = document.getElementById("glpi-filters-container");
            filtersContainer.innerHTML = "";
            const filterRow = document.createElement("div");
            filterRow.className = "row g-3 align-items-center";
            const activeFilters = {};

            const applyFilters = () => {
                const filters = Object.keys(activeFilters).filter(field => activeFilters[field])
                    .map(field => ({
                        field: field,
                        type: field === 'name' ? 'like' : (field === 'roles' ? 'like' : '='),
                        value: activeFilters[field]
                    }));
                table.setFilter(filters);
            };

            const selectFields = {
                "status": "Filtrer par statut...",
                "urgency": "Filtrer par urgence...",
                "priority": "Filtrer par priorité...",
                "roles": "Filtrer par rôle..."
            };

            for (const field in selectFields) {
                const placeholder = selectFields[field];
                const uniqueValues = ["", ...new Set(
                    field === 'roles' ? data.flatMap(item => item.roles ? item.roles.split(',').map(r => r.trim()) : []).filter(Boolean) :
                    data.map(item => item[field]).filter(Boolean)
                )];

                uniqueValues.sort((a, b) => {
                    if (field === 'status') return (statusOrder[a] || 99) - (statusOrder[b] || 99);
                    if (field === 'urgency') return (urgencyOrder[a] || 99) - (urgencyOrder[b] || 99);
                    if (field === 'priority') return (priorityOrder[a] || 99) - (priorityOrder[b] || 99);
                    return a.localeCompare(b);
                });

                const wrapper = document.createElement("div"); wrapper.className = "col-md";
                const select = document.createElement("select"); select.className = "form-select";
                select.dataset.field = field;

                uniqueValues.forEach(value => {
                    const option = document.createElement("option");
                    option.value = value; option.text = value === "" ? placeholder : value;
                    select.appendChild(option);
                });

                select.addEventListener("change", (e) => { activeFilters[field] = e.target.value; applyFilters(); });
                wrapper.appendChild(select); filterRow.appendChild(wrapper);
            }
            const resetWrapper = document.createElement("div"); resetWrapper.className = "col-md-auto";
            const resetButton = document.createElement("button"); resetButton.className = "btn btn-secondary"; resetButton.textContent = "Réinitialiser";
            resetButton.addEventListener("click", () => {
                table.clearFilter();
                Object.keys(activeFilters).forEach(key => activeFilters[key] = "");
                filterRow.querySelectorAll("select").forEach(el => el.value = "");
                const roleSelect = filterRow.querySelector('select[data-field="roles"]');
                if (roleSelect) { roleSelect.value = "Responsable"; activeFilters['roles'] = 'Responsable'; applyFilters(); }
            });
            resetWrapper.appendChild(resetButton); filterRow.appendChild(resetWrapper);
            filtersContainer.appendChild(filterRow);
            
            const roleSelect = filterRow.querySelector('select[data-field="roles"]');
            if (roleSelect && [...roleSelect.options].some(opt => opt.value === 'Responsable')) {
                roleSelect.value = 'Responsable';
                activeFilters['roles'] = 'Responsable';
                applyFilters();
            }
        }
        
        // **NEW FUNCTION**: Custom print logic that works with filtered data in old Tabulator
        function printGlpiFilteredTable(table) {
            const visibleCols = table.getColumns().filter(col => col.isVisible() && col.getDefinition().title); // Get only columns with a title
            const headersHtml = '<tr>' + visibleCols.map(col => `<th>${col.getDefinition().title}</th>`).join('') + '</tr>';
            const filteredData = table.getData("active"); // "active" gets filtered data
            const rowsHtml = filteredData.map(rowData => {
                return '<tr>' + visibleCols.map(col => {
                  let value = rowData[col.getField()];
                  return `<td>${value !== undefined && value !== null ? value : ''}</td>`;
                }).join('') + '</tr>';
              }).join('');

            const printHtml = `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
                               <thead>${headersHtml}</thead>
                               <tbody>${rowsHtml}</tbody>
                             </table>`;

            const printWindow = window.open('', '', 'width=900,height=600');
            printWindow.document.write('<html><head><title>Impression - Tickets GLPI</title></head><body>' + printHtml + '</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }

        function setupActionButtons(table) {
            const container = document.getElementById("glpi-actions-container");
            container.innerHTML = `
                <div class="d-flex flex-wrap gap-2">
                    <button id="glpi-print-table" class="btn btn-outline-secondary">Imprimer</button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Exporter</button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" id="glpi-export-csv" href="#">Exporter CSV</a></li>
                            <li><a class="dropdown-item" id="glpi-export-json" href="#">Exporter JSON</a></li>
                            <li><a class="dropdown-item" id="glpi-export-xlsx" href="#">Exporter XLSX</a></li>
                        </ul>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Colonnes</button>
                        <ul id="glpi-columns-menu" class="dropdown-menu p-2" style="max-height: 300px; overflow-y: auto;"></ul>
                    </div>
                </div>`;

            // **FIX**: Call the new custom print function
            document.getElementById("glpi-print-table").addEventListener("click", () => printGlpiFilteredTable(table));

            document.getElementById("glpi-export-csv").addEventListener("click", () => table.download("csv", "tickets-glpi.csv"));
            document.getElementById("glpi-export-json").addEventListener("click", () => table.download("json", "tickets-glpi.json"));
            document.getElementById("glpi-export-xlsx").addEventListener("click", () => table.download("xlsx", "tickets-glpi.xlsx", {sheetName:"Tickets GLPI"}));

            // **FIX**: Populate the columns menu inside a short timeout to prevent a race condition
            setTimeout(function() {
                const columnsMenu = document.getElementById("glpi-columns-menu");
                if (!columnsMenu) return;
                columnsMenu.innerHTML = '';
                table.getColumns().forEach(column => {
                    const def = column.getDefinition();
                    const field = column.getField();
                    if (!def.title || !field) return; // Only add columns with a title and field
                    const li = document.createElement("li"); li.className = "form-check mx-2";
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox"; checkbox.className = "form-check-input";
                    checkbox.value = field; checkbox.checked = column.isVisible();
                    checkbox.id = `glpi-col-toggle-${field}`;
                    const label = document.createElement("label"); label.className = "form-check-label";
                    label.setAttribute("for", checkbox.id); label.textContent = def.title;
                    checkbox.addEventListener("change", (e) => {
                        if (e.target.checked) { table.showColumn(field); } 
                        else { table.hideColumn(field); }
                    });
                    li.appendChild(checkbox); li.appendChild(label); columnsMenu.appendChild(li);
                });
            }, 100); // 100ms delay
        }
        
        el.addEventListener('click', (event) => {
          if (event.target.closest('#reloadGlpi')) {
            reloadGlpiTickets();
          }
        });

        reloadGlpiTickets();
      });
    },
  };
})(Drupal, once, jQuery, drupalSettings);