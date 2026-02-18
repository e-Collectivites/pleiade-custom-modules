/**
 * @file
 * Behaviors for the GLPI Unified Datatable as a Closable Widget.
 */

(function (Drupal, once, $, drupalSettings) {
    "use strict";

    /**
     * Injects ARIA roles and labels for accessibility.
     */
    /**
  * Applies strict ARIA hierarchy fixes to Tabulator tables.
  * Fixes "aria-required-parent" and "aria-required-children" errors.
  * * Hierarchy enforced: 
  * Grid -> RowGroup (Header) -> Row -> ColumnHeader
  * Grid -> RowGroup (Body)   -> Row -> GridCell
  * Grid -> Row (Footer)      -> GridCell -> [Controls]
  */
    function applyCompleteAccessibilityFixes(table, label) {
        const fix = () => {
            const el = table.element;
            if (!el) return;

            // 1. GRID CONTAINER
            // The root element must be the grid container.
            el.setAttribute('role', 'grid');
            el.setAttribute('aria-label', label || 'Tableau de données');

            // 2. HEADER FIXES
            const header = el.querySelector('.tabulator-header');
            if (header) {
                header.setAttribute('role', 'rowgroup');

                // The container inside header must be 'presentation' so rows are seen as direct children of RowGroup
                const headerContents = header.querySelector('.tabulator-header-contents');
                if (headerContents) {
                    headerContents.setAttribute('role', 'presentation');
                }

                // The actual header row
                const hRow = header.querySelector('.tabulator-headers');
                if (hRow) hRow.setAttribute('role', 'row');

                // Columns
                header.querySelectorAll('.tabulator-col').forEach(col => {
                    col.setAttribute('role', 'columnheader');
                    // Ensure sortable columns have a valid ARIA state
                    if (col.classList.contains('tabulator-sortable')) {
                        if (!col.hasAttribute('aria-sort')) {
                            col.setAttribute('aria-sort', 'none');
                        }
                    }
                });
            }

            // 3. SCROLL HOLDER FIXES
            // This acts as a wrapper, so we mark it presentation to let the inner table (RowGroup) be seen by the Grid.
            const tableHolder = el.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                tableHolder.setAttribute('role', 'presentation');
                tableHolder.removeAttribute('tabindex'); // Prevent keyboard focus on non-interactive container
            }

            // 4. BODY FIXES
            // The actual container of rows is a RowGroup
            const actualTable = el.querySelector('.tabulator-table');
            if (actualTable) {
                actualTable.setAttribute('role', 'rowgroup');
                actualTable.removeAttribute('aria-label'); // Label belongs on the parent Grid
            }

            // 5. ROW & CELL FIXES
            el.querySelectorAll('.tabulator-row').forEach(row => {
                row.setAttribute('role', 'row');
                row.querySelectorAll('.tabulator-cell').forEach(cell => {
                    cell.setAttribute('role', 'gridcell');
                });
            });

            // 6. FOOTER FIXES (Critical)
            // To contain interactive elements (buttons/selects), the footer must be part of the grid structure.
            // We define the Footer as a 'row' and its inner container as a 'gridcell'.
            const footer = el.querySelector('.tabulator-footer');
            if (footer) {
                footer.setAttribute('role', 'row');
                footer.removeAttribute('aria-label');

                // The inner wrapper (either footer-contents or paginator) acts as the cell holding the controls
                const footerContents = footer.querySelector('.tabulator-footer-contents') || footer.querySelector('.tabulator-paginator');
                if (footerContents) {
                    footerContents.setAttribute('role', 'gridcell');
                }

                // Fix Buttons missing labels
                footer.querySelectorAll('button').forEach(button => {
                    if (!button.hasAttribute('aria-label') && !button.innerText) {
                        const page = button.getAttribute('data-page');
                        if (page) {
                            button.setAttribute('aria-label', `Aller à la page ${page}`);
                        } else {
                            button.setAttribute('aria-label', 'Pagination');
                        }
                    }
                });

                // Fix Selects missing labels
                footer.querySelectorAll('select').forEach(select => {
                    if (!select.hasAttribute('aria-label')) {
                        select.setAttribute('aria-label', 'Nombre d\'éléments par page');
                    }
                });
            }
        };

        // Apply on build and re-apply on every render (sorting, filtering, paging)
        table.on("tableBuilt", fix);
        table.on("renderComplete", fix);
    }

    Drupal.behaviors.GLPIUnifiedBehavior = {
        attach: function (context) {
            const container = document.getElementById("glpi_tickets_id");
            if (!container) return;

            once("GLPIUnifiedBehavior", container, context).forEach((el) => {
                const glpiUrl = drupalSettings.api_glpi_pleiade?.glpi_url;
                const isFront = drupalSettings.path?.isFront;
                if (!glpiUrl) return;

                let glpiTable;
                const pID = "glpi-table-v7";
                const statusOrder = { "Nouveau": 1, "En cours (attribué)": 2, "En cours (planifié)": 3, "En attente": 4, "Résolu": 5, "Clos": 6 };
                const urgencyOrder = { 'Très basse': 1, 'Basse': 2, 'Moyenne': 3, 'Haute': 4, 'Très haute': 5 };
                const priorityOrder = { 'Basse': 2, 'Moyenne': 3, 'Haute': 4, 'Très Haute': 5, 'Majeure': 6 };

                const customSorter = (orderMap) => (a, b) => (orderMap[a] || 99) - (orderMap[b] || 99);
                const dateSorter = (a, b) => (a ? new Date(a) : 0) - (b ? new Date(b) : 0);

                function reloadGlpiTickets() {
                    if (glpiTable) {
                        try {
                            glpiTable.clearFilter(true);
                            glpiTable.destroy();
                        } catch (e) { }
                    }

                    el.innerHTML = `
                        <div class="card shadow-sm border-0">
                            <div class="card-body text-center py-4">
                                <div class="spinner-border text-primary me-2" role="status">
                                    <span class="visually-hidden">Chargement...</span>
                                </div>
                                Chargement des tickets...
                            </div>
                        </div>`;

                    fetch(Drupal.url("v1/api_glpi_pleiade/glpi_list_tickets?t=" + Date.now()))
                        .then((response) => response.json())
                        .then((data) => {
                            el.setAttribute('data-id', 'widget-glpi-tickets');
                            const titleText = isFront ? "Derniers tickets GLPI" : "Mes derniers tickets GLPI";

                            if (!data || data.length === 0) {
                                el.innerHTML = `
                                    <div class="card border-0 shadow-sm mb-0">
                                        <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex">
                                            <h4 class="card-title h6 text-dark mb-0 py-2">${titleText}</h4>
                                            <button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi" aria-label="Actualiser les tickets">
                                                <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <div class="close-div">
                                            <div class="card-body">
                                                <p class="text-muted mb-0">Aucun ticket GLPI en cours</p>
                                            </div>
                                        </div>
                                    </div>`;
                                if (typeof initializeCloseElement === 'function') initializeCloseElement(el);
                                return;
                            }

                            const count = data.filter(elem => (elem.roles.includes("Responsable") && !elem.roles.includes("(Groupe) Responsable")) || (elem.roles.includes("Responsable, (Groupe) Responsable"))).length;
                            if (typeof setNotificationCount === 'function') setNotificationCount('assistancesupporthotline', count);

                            el.innerHTML = `
                                <div class="card border-0 shadow-sm mb-0">
                                    <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex">
                                        <h4 class="card-title h6 text-dark mb-0 py-2">${titleText}</h4>
                                        <button type="button" class="btn btn-secondary reload-btn" id="reloadGlpi" aria-label="Actualiser les tickets GLPI">
                                            <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                    <div class="close-div">
                                        <div class="card-body">
                                            <div id="glpi-filters-container" class="mb-4"></div>
                                            <div id="glpi-actions-container" class="mb-3 d-flex gap-2 flex-wrap"></div>
                                            <div id="glpi-tabulator-table" role="grid" aria-label="GLPI Tickets Table">
   </div>
                                        </div>
                                    </div>
                                </div>`;

                            if (typeof initializeCloseElement === 'function') initializeCloseElement(el);

                            const initialColumnDefinitions = [
                                {
                                    title: "Nom du ticket",
                                    field: "name",
                                    minWidth: 250,
                                    // IMPORTANT: Prevent infinite width expansion so text wraps
                                    maxWidth: 600,
                                    formatter: "textarea",
                                    widthGrow: 3,
                                    // IMPORTANT: Allow row to grow taller
                                    variableHeight: true
                                },
                                { title: "Statut", field: "status", sorter: customSorter(statusOrder), minWidth: 150, widthGrow: 1 },
                                { title: "Date d'ouverture", field: "start_date", sorter: dateSorter, minWidth: 160 },
                                { title: "Dernière modification", field: "last_modification_date", sorter: dateSorter, minWidth: 160 },
                                { title: "Urgence", field: "urgency", sorter: customSorter(urgencyOrder), minWidth: 110, widthGrow: 1 },
                                { title: "Priorité", field: "priority", sorter: customSorter(priorityOrder), minWidth: 110, widthGrow: 1 },
                                { title: "Je suis", field: "roles", sorter: "string", minWidth: 120, widthGrow: 2 },
                                {
                                    title: "Action", field: "id", hozAlign: "center", headerSort: false, width: 70, print: false, download: false,
                                    formatter: (cell) => `<a href="${glpiUrl}/front/ticket.form.php?id=${cell.getValue()}" target="_blank" rel="noopener" class="btn btn-xs btn-outline-info" aria-label="Voir le ticket #${cell.getValue()} : ${cell.getData().name}" title="Voir"><i class="fa-solid fa-magnifying-glass"></i></a>`
                                }
                            ];

                            glpiTable = new Tabulator("#glpi-tabulator-table", {
                                data: data,
                                height: "400px",
                                renderVertical: "virtual",
                                layout: "fitDataFill",
                                pagination: "local",
                                paginationSize: isFront ? 5 : 10,
                                paginationSizeSelector: [5, 10, 20, 50, 100],
                                locale: "fr",
                                movableColumns: true,
                                persistence: false,
                                persistenceID: pID,
                                initialSort: [{ column: "start_date", dir: "desc" }],
                                textDirection: "ltr",
                                columns: initialColumnDefinitions,
                                aria: true
                            });

                            // CHANGE 2: Force redraws to fix layout on interaction
                            glpiTable.on("pageLoaded", function () {
                                glpiTable.redraw(true);
                            });

                            glpiTable.on("dataFiltered", function () {
                                glpiTable.redraw(true);
                            });

                            applyCompleteAccessibilityFixes(glpiTable, 'Liste des tickets GLPI');
                            setupDependentFilters(glpiTable, data, statusOrder, urgencyOrder, priorityOrder);
                            setupActionButtons(glpiTable, initialColumnDefinitions, pID);
                        })
                        .catch((err) => {
                            console.error(err);
                            el.innerHTML = `<div class="alert alert-danger">Erreur de chargement GLPI.</div>`;
                        });
                }

                function setupDependentFilters(table, data, sOrder, uOrder, pOrder) {
                    const container = document.getElementById("glpi-filters-container");
                    if (!container) return;

                    const activeFilters = { status: "", urgency: "", priority: "", roles: "" };
                    const selects = {};
                    const fields = { "status": "Statut", "urgency": "Urgence", "priority": "Priorité", "roles": "Rôle" };
                    const uid = Date.now();

                    const updateSelectOptions = () => {
                        Object.keys(fields).forEach(field => {
                            const currentVal = activeFilters[field];
                            let subData = data;
                            Object.keys(activeFilters).forEach(f => {
                                if (f !== field && activeFilters[f]) {
                                    if (f === 'roles') {
                                        subData = subData.filter(item => item[f] && item[f].split(',').map(r => r.trim()).includes(activeFilters[f]));
                                    } else {
                                        subData = subData.filter(item => item[f] === activeFilters[f]);
                                    }
                                }
                            });

                            let values = [...new Set(field === 'roles' ?
                                subData.flatMap(item => item.roles ? item.roles.split(',').map(r => r.trim()) : []).filter(Boolean) :
                                subData.map(item => item[field]).filter(Boolean))];

                            values.sort((a, b) => {
                                if (field === 'status') return (sOrder[a] || 99) - (sOrder[b] || 99);
                                if (field === 'urgency') return (uOrder[a] || 99) - (uOrder[b] || 99);
                                if (field === 'priority') return (pOrder[a] || 99) - (pOrder[b] || 99);
                                return a.localeCompare(b);
                            });

                            selects[field].innerHTML = `<option value="">Filtrer par ${fields[field]}</option>`;
                            values.forEach(v => {
                                const opt = document.createElement("option");
                                opt.value = v; opt.text = v;
                                if (v === currentVal) opt.selected = true;
                                selects[field].appendChild(opt);
                            });
                        });
                    };

                    const applyFilters = () => {
                        table.setFilter((rowData) => {
                            return Object.keys(activeFilters).every(field => {
                                if (!activeFilters[field]) return true;
                                if (field === 'roles') return rowData.roles && rowData.roles.split(',').map(r => r.trim()).includes(activeFilters[field]);
                                return rowData[field] === activeFilters[field];
                            });
                        });
                        updateSelectOptions();
                    };

                    const filterRow = document.createElement("div");
                    filterRow.className = "row g-2 align-items-end";

                    Object.keys(fields).forEach(field => {
                        const col = document.createElement("div");
                        col.className = "col-md-2";

                        const labelId = `glpi-label-${field}-${uid}`;
                        const label = document.createElement("label");
                        label.className = "visually-hidden";
                        label.id = labelId;
                        label.textContent = `Filtrer par ${fields[field]}`;

                        const select = document.createElement("select");
                        select.id = `glpi-filter-${field}-${uid}`;
                        select.className = "form-select form-select-sm";
                        select.setAttribute("aria-labelledby", labelId);
                        select.addEventListener("change", (e) => {
                            activeFilters[field] = e.target.value;
                            applyFilters();
                        });

                        selects[field] = select;
                        col.appendChild(label);
                        col.appendChild(select);
                        filterRow.appendChild(col);
                    });

                    const resetCol = document.createElement("div");
                    resetCol.className = "col-md-2 ms-auto";
                    const resetBtn = document.createElement("button");
                    resetBtn.className = "btn btn-sm btn-secondary w-100";
                    resetBtn.innerHTML = '<i class="fa fa-eraser me-2" aria-hidden="true"></i>Réinitialiser';
                    resetBtn.onclick = () => {
                        Object.keys(activeFilters).forEach(f => activeFilters[f] = "");
                        table.clearFilter();
                        updateSelectOptions();
                    };
                    resetCol.appendChild(resetBtn);
                    filterRow.appendChild(resetCol);

                    container.innerHTML = "";
                    container.appendChild(filterRow);
                    updateSelectOptions();
                }

                function setupActionButtons(table, initialColumns, pID) {
                    const container = document.getElementById("glpi-actions-container");
                    if (!container) return;
                    container.innerHTML = `
                        <div class="d-flex flex-wrap gap-2">
                            <button id="glpi-print-table" class="btn btn-sm btn-outline-secondary" aria-label="Imprimer la liste GLPI"><i class="fa-solid fa-print me-1" aria-hidden="true"></i>Imprimer</button>
                            <button id="glpi-reset-layout" class="btn btn-sm btn-outline-secondary">Réinitialiser colonnes</button>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Exporter les données">Exporter</button>
                                <ul class="dropdown-menu">
                                   

                                                       <li>
    <a class="dropdown-item" 
       id="glpi-export-csv" 
       href="#" 
       style="color: #212529 !important;" 
       aria-label="Exporter le tableau des tickets GLPI au format CSV (.csv)">
       CSV
    </a>
</li>



                   <li>
    <a class="dropdown-item" 
       id="glpi-export-json" 
       href="#" 
       style="color: #212529 !important;" 
       aria-label="Exporter le tableau des tickets GLPI au format JSON (.json)">
       JSON
    </a>
</li>


                                    
                                <li>
    <a class="dropdown-item" 
       id="glpi-export-xlsx" 
       href="#" 
       style="color: #212529 !important;" 
       aria-label="Exporter le tableau des tickets GLPI au format Excel (.xlsx)">
       Excel
    </a>
</li>



                                </ul>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Gérer l'affichage des colonnes">Colonnes</button>
                                <ul id="glpi-columns-menu" class="dropdown-menu p-3" style="min-width: 250px; max-height: 400px; overflow-y: auto;"></ul>
                            </div>
                        </div>`;

                    document.getElementById("glpi-print-table").onclick = () => {
                        const tableHtml = table.getHtml(true);
                        const win = window.open('', '_blank');
                        win.document.write(`<html><head><title>Impression GLPI</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;font-size:12px;}</style></head><body><h2>Tickets GLPI</h2>${tableHtml}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
                        win.document.close();
                    };

                    document.getElementById("glpi-reset-layout").onclick = () => {
                        localStorage.removeItem("tabulator-glpi-table-v7-columns");
                        location.reload();
                    };

                    document.getElementById("glpi-export-csv").onclick = (e) => { e.preventDefault(); table.download("csv", "glpi.csv"); };
                    document.getElementById("glpi-export-json").onclick = (e) => { e.preventDefault(); table.download("json", "glpi.json"); };
                    document.getElementById("glpi-export-xlsx").onclick = (e) => { e.preventDefault(); table.download("xlsx", "glpi.xlsx"); };

                    const buildColumnMenu = () => {
                        const menu = document.getElementById("glpi-columns-menu");
                        if (!menu) return;
                        menu.innerHTML = "";
                        table.getColumns().forEach(column => {
                            const def = column.getDefinition();
                            if (!def.title || column.getField() === "id") return;
                            const li = document.createElement("li");
                            li.className = "mb-2 d-flex align-items-center";
                            const chkId = `chk-glpi-${column.getField()}-${pID}`;
                            li.innerHTML = `
                                <input type="checkbox" class="form-check-input me-2" id="${chkId}" ${column.isVisible() ? 'checked' : ''}>
                                <label class="form-check-label small flex-grow-1 mb-0" for="${chkId}" style="cursor:pointer;">${def.title}</label>`;
                            li.onclick = (e) => e.stopPropagation();
                            li.querySelector('input').onchange = (e) => { e.target.checked ? column.show() : column.hide(); };
                            menu.appendChild(li);
                        });
                    };
                    table.on("tableBuilt", buildColumnMenu);
                }

                el.addEventListener('click', (e) => { if (e.target.closest('#reloadGlpi')) reloadGlpiTickets(); });
                reloadGlpiTickets();
            });
        },
    };
})(Drupal, once, jQuery, drupalSettings);