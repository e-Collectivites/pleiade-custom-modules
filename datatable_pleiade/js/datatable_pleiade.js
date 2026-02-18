(function (Drupal, once, $, drupalSettings) {
    "use strict";

    function applyCompleteAccessibilityFixes(table, label) {
        const fix = () => {
            const el = table.element;
            if (!el) return;

            el.setAttribute('role', 'grid');
            el.setAttribute('aria-label', label || 'Tableau de données');

            const header = el.querySelector('.tabulator-header');
            if (header) {
                header.setAttribute('role', 'rowgroup');

                const headerContents = header.querySelector('.tabulator-header-contents');
                if (headerContents) {
                    headerContents.setAttribute('role', 'presentation');
                }

                const hRow = header.querySelector('.tabulator-headers');
                if (hRow) hRow.setAttribute('role', 'row');

                header.querySelectorAll('.tabulator-col').forEach(col => {
                    col.setAttribute('role', 'columnheader');
                    if (col.classList.contains('tabulator-sortable')) {
                        if (!col.hasAttribute('aria-sort')) {
                            col.setAttribute('aria-sort', 'none');
                        }
                    }
                });
            }

            const tableHolder = el.querySelector('.tabulator-tableholder');
            if (tableHolder) {
                tableHolder.setAttribute('role', 'presentation');
                tableHolder.removeAttribute('tabindex');
            }

            const actualTable = el.querySelector('.tabulator-table');
            if (actualTable) {
                actualTable.setAttribute('role', 'rowgroup');
                actualTable.removeAttribute('aria-label');
            }

            el.querySelectorAll('.tabulator-row').forEach(row => {
                row.setAttribute('role', 'row');
                row.querySelectorAll('.tabulator-cell').forEach(cell => {
                    cell.setAttribute('role', 'gridcell');
                });
            });

            const footer = el.querySelector('.tabulator-footer');
            if (footer) {
                footer.setAttribute('role', 'row');
                footer.removeAttribute('aria-label');

                const footerContents = footer.querySelector('.tabulator-footer-contents') || footer.querySelector('.tabulator-paginator');
                if (footerContents) {
                    footerContents.setAttribute('role', 'gridcell');
                }

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

                footer.querySelectorAll('select').forEach(select => {
                    if (!select.hasAttribute('aria-label')) {
                        select.setAttribute('aria-label', 'Nombre d\'éléments par page');
                    }
                });
            }
        };

        table.on("tableBuilt", fix);
        table.on("renderComplete", fix);
    }

    function parseToIsoDate(dateStr) {
        if (!dateStr) return '';
        let str = String(dateStr).trim();
        let separator = str.includes('/') ? '/' : (str.includes('-') ? '-' : (str.includes('.') ? '.' : null));
        if (!separator) return '';
        let parts = str.split(separator);
        if (parts.length === 3) {
            let day = parts[0], month = parts[1], year = parts[2];
            if (year.includes(' ')) year = year.split(' ')[0];
            if (day.includes(' ')) day = day.split(' ')[0];
            if (year.length === 2) year = "20" + year;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return '';
    }

    Drupal.behaviors.DatatableDocBehavior = {
        attach: function (context, settings) {
            const $elements = $(context).find("#document_recent_id").not('.js-datatable-processed').addClass('js-datatable-processed');

            $elements.each(function () {
                const containerElement = this;
                const pastell_url = drupalSettings.api_pastell_pleiade ? drupalSettings.api_pastell_pleiade.field_pastell_url : '';
                const pID = "datatable-documents-v4";
                let documentsTable;

                // --- STATE MANAGEMENT ---
                let currentExercice = "";
                let currentBudget = "";
                let activeFilters = { application: "", type_doc: "", status_display: "", titre: "" };

                $(containerElement).on('click', '#reloadDatatable', function (e) {
                    e.preventDefault();
                    currentExercice = "";
                    currentBudget = "";
                    reloadDataTable();
                });

                function reloadDataTable(exercice = "2026", budget = "") {
                    if (exercice !== currentExercice) currentExercice = exercice;
                    if (budget !== currentBudget) currentBudget = budget;

                    const effectiveExercice = currentExercice || "2026";
                    const effectiveBudget = currentBudget || 'all';

                    let url = Drupal.url(`v1/datatable_pleiade/documents_recents/${effectiveExercice}/${effectiveBudget}`);
                    const finalUrl = url;

                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", finalUrl);
                    xhr.responseType = "json";
                    xhr.onload = function () {
                        if (xhr.status === 200 && xhr.response?.docs) {
                            const apiResponse = xhr.response;
                            const donnees = apiResponse.docs;
                            const tableData = [];

                            const exercisesList = apiResponse.exercises || [];
                            const budgetsList = apiResponse.budgets || [];

                            if (documentsTable) {
                                documentsTable.destroy();
                            }

                            containerElement.setAttribute('data-id', 'widget-recent-docs');
                            containerElement.classList.add("col-12");

                            containerElement.innerHTML = `
                             <div class="card close border-0 shadow-sm mb-0">
                                <div class="card-header close-icon rounded-top bg-white border-bottom rounded-top d-flex">
                                    <h5 class="card-title h5 text-dark mb-0 py-2">Activités récentes</h5>
                                    <button type="button" class="btn btn-secondary reload-btn" id="reloadDatatable" aria-label="Actualiser les documents">
                                        <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <div class="close-div"> 
                                    <div class="card-body">
                                        <div id="external-filters-container" class="mb-4"></div>
                                        <div id="action-buttons-container" class="mb-3 d-flex gap-2 flex-wrap"></div>
                                        <div id="tabulator-documents" role="grid" aria-label="Tableau des activités récentes"></div>
                                    </div>
                                </div>
                            </div>`;

                            if (typeof initializeCloseElement === 'function') {
                                initializeCloseElement(containerElement);
                            }

                            let counts = { maarch: 0, parapheur: 0, nextcloud: 0, ciril: 0 };

                            donnees.forEach(item => {
                                let row = {
                                    application: (item.type === 'civilrh' || item.type === 'Ciril') ? 'Ciril' : item.type,
                                    titre: item.titre || "Sans titre",
                                    objectDate: parseToIsoDate(item.creation || item.last_action_date || item.date),
                                    status_display: item.status || item.last_action_display || "",
                                    type_doc: item.type_dossier || item.type || "",
                                    exercice: item.exercice || "",
                                    budget: item.budget || ""
                                };

                                const btnClass = "btn btn-xs btn-outline-info";
                                if (item.type === "Nextcloud") {
                                    counts.nextcloud++;
                                    row.actions_html = `<a target="_blank" href="${item.fileUrl}" class="${btnClass}" aria-label="Voir le document Nextcloud : ${row.titre}" title="Voir"><i class="fa fa-eye" aria-hidden="true"></i></a>`;
                                } else if (item.type === "Parapheur") {
                                    counts.parapheur++;
                                    row.actions_html = `<a target="_blank" href="${item.fileUrl}" class="${btnClass}" aria-label="Signer dans le Parapheur : ${row.titre}" title="Signer"><i class="fa fa-signature" aria-hidden="true"></i></a>`;
                                } else if (item.type === "Maarch") {
                                    counts.maarch++;
                                    row.actions_html = `<a target="_blank" href="${item.fileUrl}" class="${btnClass}" aria-label="Consulter dans Maarch : ${row.titre}" title="Consulter"><i class="fa fa-newspaper" aria-hidden="true"></i></a>`;
                                } else if (row.application === "Ciril") {
                                    counts.ciril++;
                                    row.actions_html = `<a target="_blank" href="https://ciril.sitiv.fr" class="${btnClass}" aria-label="Ouvrir dans Ciril pour : ${row.titre}" title="Voir"><i class="fa fa-file-invoice-dollar" aria-hidden="true"></i></a>`;
                                } else {
                                    row.application = "Pastell";
                                    let download = (row.status_display === "termine" && item.last_type?.includes("actes")) ? `<a target="_blank" href="${pastell_url}Document/RecuperationFichier?id_d=${item.id_d}&id_e=${item.id_e}&field=acte_tamponne&num=0" class="btn btn-xs btn-outline-secondary" aria-label="Télécharger l'acte : ${row.titre}" title="Télécharger"><i class="fa fa-download" aria-hidden="true"></i></a>` : '';
                                    let detail = `<a target="_blank" href="${pastell_url}Document/detail?id_d=${item.id_d}&id_e=${item.id_e}" class="${btnClass}" aria-label="Voir les détails Pastell : ${row.titre}" title="Détails"><i class="fa fa-newspaper" aria-hidden="true"></i></a>`;
                                    row.actions_html = `<div class='d-flex gap-1'>${download}${detail}</div>`;
                                }
                                tableData.push(row);
                            });

                            if (typeof setNotificationCount === 'function') {
                                setNotificationCount('iparapheur', counts.parapheur);
                                setNotificationCount('nextcloud', counts.nextcloud);
                                setNotificationCount('maarch', counts.maarch);
                                setNotificationCount('ciril_testsitiv', counts.ciril);
                            }

                            documentsTable = new Tabulator(containerElement.querySelector("#tabulator-documents"), {
                                data: tableData,
                                height: "500px", // Set a height for virtual DOM
                                renderVertical: "virtual",
                                layout: "fitDataFill",
                                pagination: "local",
                                paginationSize: 5,
                                paginationSizeSelector: [5, 10, 20, 50, 100],
                                persistence: false, // Temporarily disable persistence
                                persistenceID: pID,
                                movableColumns: true,
                                initialSort: [{ column: "objectDate", dir: "desc" }],
                                textDirection: "ltr", // Explicitly set LTR direction
                                columns: [
                                    { title: "Application", field: "application", vertAlign: "middle", headerSort: true, widthGrow: 1 },
                                    {
                                        title: "Titre",
                                        field: "titre",
                                        minWidth: 300,
                                        vertAlign: "middle",
                                        headerSort: true,
                                        formatter: "textarea",
                                        variableHeight: true,
                                        widthGrow: 3
                                    },
                                    { title: "Type", field: "type_doc", vertAlign: "middle", headerSort: true, widthGrow: 1 },
                                    // Modified: Hidden by default, toggled in JS
                                    { title: "Exercice", field: "exercice", vertAlign: "middle", headerSort: true, widthGrow: 1, visible: false },
                                    { title: "Budget", field: "budget", vertAlign: "middle", headerSort: true, widthGrow: 1, visible: false },
                                    {
                                        title: "Date",
                                        field: "objectDate",
                                        vertAlign: "middle",
                                        headerSort: true,
                                        formatter: (c) => c.getValue()?.split('-').reverse().join('/') || "",
                                        widthGrow: 1
                                    },
                                    {
                                        title: "Statut",
                                        field: "status_display",
                                        vertAlign: "middle",
                                        headerSort: true,
                                        tooltip: (e, cell) => cell.getValue(),
                                        formatter: (c) => c.getValue() ? `<span class="badge" style="background-color: #0b5ed7 !important; color: #fff;" title="${c.getValue()}">${c.getValue()}</span>` : '',
                                        widthGrow: 2
                                    },
                                    { title: "Actions", field: "actions_html", vertAlign: "middle", formatter: "html", headerSort: false, movable: false, widthGrow: 1 }
                                ]
                            });

                            documentsTable.on("pageLoaded", function () {
                                documentsTable.redraw(true);
                            });

                            documentsTable.on("dataFiltered", function () {
                                documentsTable.redraw(true);
                            });

                            documentsTable.on("tableBuilt", function() {
                                applyCompleteAccessibilityFixes(documentsTable, 'Tableau des activités récentes');
                                
                                const filtersToApply = Object.keys(activeFilters).filter(f => activeFilters[f]).map(f => ({
                                    field: f, 
                                    type: (f === 'titre' || f === 'status_display') ? 'like' : '=', 
                                    value: activeFilters[f]
                                }));
                                
                                if (filtersToApply.length > 0) {
                                    documentsTable.setFilter(filtersToApply);
                                }
                                
                                setupActionButtons(documentsTable, containerElement, pID);
                                setupDependentFilters(documentsTable, tableData, containerElement, exercisesList, budgetsList);
                            });
                        }
                    };
                    xhr.send();
                }

                function setupDependentFilters(table, data, scope, exercisesList, budgetsList) {
                    const filtersContainer = scope.querySelector("#external-filters-container");
                    if (!filtersContainer) return;

                    const selects = {};
                    const selectFields = {
                        "application": "Application",
                        "type_doc": "Type",
                        "status_display": "Statut",
                        "exercice": "Exercice",
                        "budget": "Budget"
                    };
                    const uid = Date.now();

                    const getCirilVisibility = () => {
                        const hasSelection = activeFilters.application || activeFilters.type_doc || activeFilters.status_display;
                        if (!hasSelection) return false;

                        const filtered = data.filter(item => {
                            if (activeFilters.application && item.application !== activeFilters.application) return false;
                            if (activeFilters.type_doc && item.type_doc !== activeFilters.type_doc) return false;
                            if (activeFilters.status_display && !item.status_display.includes(activeFilters.status_display)) return false;
                            return true;
                        });

                        const hasCirilRow = filtered.some(item => item.application === 'Ciril');
                        return hasCirilRow;
                    };

                    const updateAllSelects = () => {
                        const showCirilFilters = getCirilVisibility();
                        const exWrapper = scope.querySelector(`[id^='wrapper-exercice']`);
                        const bgWrapper = scope.querySelector(`[id^='wrapper-budget']`);
                        
                        if (exWrapper) exWrapper.style.display = showCirilFilters ? 'block' : 'none';
                        if (bgWrapper) bgWrapper.style.display = showCirilFilters ? 'block' : 'none';

                        // ADDED: Logic to toggle Column Visibility based on filter
                        if (activeFilters.application === 'Ciril') {
                            table.showColumn('exercice');
                            table.showColumn('budget');
                        } else {
                            // If we aren't explicitly on Ciril, hide them (unless you want them persistent once shown, but 'selected' implies active filter)
                            table.hideColumn('exercice');
                            table.hideColumn('budget');
                        }

                        Object.keys(selectFields).forEach(field => {
                            const currentVal = (field === 'exercice') ? currentExercice : (field === 'budget' ? currentBudget : activeFilters[field]);
                            let optionsHtml = `<option value="">${selectFields[field]}</option>`;
                            
                            if (field === 'exercice') {
                                if (showCirilFilters) {
                                    exercisesList.forEach(ex => {
                                        optionsHtml += `<option value="${ex.id}" ${String(ex.id) === String(currentExercice) ? 'selected' : ''}>${ex.label}</option>`;
                                    });
                                }
                            } else if (field === 'budget') {
                                if (showCirilFilters) {
                                    budgetsList.forEach(bg => {
                                        optionsHtml += `<option value="${bg.budgetCode}" ${String(bg.budgetCode) === String(currentBudget) ? 'selected' : ''}>${bg.budgetLabel}</option>`;
                                    });
                                }
                            } else {
                                let filteredData = data;
                                Object.keys(activeFilters).forEach(f => {
                                    if (f !== field && activeFilters[f]) {
                                        filteredData = filteredData.filter(item => {
                                            if (f === 'titre') return item[f].toLowerCase().includes(activeFilters[f].toLowerCase());
                                            if (f === 'status_display') return item[f].includes(activeFilters[f]);
                                            return item[f] === activeFilters[f];
                                        });
                                    }
                                });

                                let rawValues = filteredData.map(item => item[field]).filter(Boolean);
                                if (field === 'status_display') {
                                    rawValues = rawValues.flatMap(val => val.split(' / '));
                                }
                                const uniqueValues = [...new Set(rawValues)].sort();

                                uniqueValues.forEach(val => {
                                    optionsHtml += `<option value="${val}" ${val === currentVal ? 'selected' : ''}>${val}</option>`;
                                });
                            }
                            if (selects[field]) {
                                selects[field].innerHTML = optionsHtml;
                                selects[field].value = currentVal || "";
                            }
                        });
                    };

                    const filterRow = document.createElement("div");
                    filterRow.className = "row g-3 align-items-end";

                    Object.keys(selectFields).forEach(field => {
                        const wrapper = document.createElement("div");
                        wrapper.id = `wrapper-${field}-${uid}`;
                        wrapper.className = "col-6 col-md-4 col-lg-2";
                        
                        if (field === 'exercice' || field === 'budget') {
                            wrapper.style.display = 'none';
                        }

                        const label = document.createElement("label");
                        label.setAttribute("for", `filter-${field}-${uid}`);
                        label.className = "form-label small fw-bold mb-1";
                        label.textContent = selectFields[field];

                        const select = document.createElement("select");
                        select.id = `filter-${field}-${uid}`;
                        select.className = "form-select form-select-sm";

                        if (field !== 'exercice' && field !== 'budget' && activeFilters[field]) {
                            select.value = activeFilters[field];
                        }

                        select.onchange = (e) => {
                            const val = e.target.value;
                            
                            if (field === 'exercice') {
                                reloadDataTable(val, currentBudget);
                            } else if (field === 'budget') {
                                reloadDataTable(currentExercice, val);
                            } else {
                                activeFilters[field] = val;
                                table.setFilter(Object.keys(activeFilters).filter(f => activeFilters[f]).map(f => ({
                                    field: f, type: (f === 'titre' || f === 'status_display') ? 'like' : '=', value: activeFilters[f]
                                })));
                                
                                updateAllSelects();

                                setTimeout(() => table.redraw(true), 10);
                            }
                        };
                        selects[field] = select;
                        wrapper.appendChild(label);
                        wrapper.appendChild(select);
                        filterRow.appendChild(wrapper);
                    });

                    const searchWrapper = document.createElement("div");
                    searchWrapper.className = "col-12 col-lg-4";

                    const searchLabel = document.createElement("label");
                    searchLabel.setAttribute("for", `search-titre-${uid}`);
                    searchLabel.className = "form-label small fw-bold mb-1";
                    searchLabel.textContent = "Recherche par titre";

                    const searchInput = document.createElement("input");
                    searchInput.id = `search-titre-${uid}`;
                    searchInput.className = "form-control form-control-sm";
                    searchInput.placeholder = "Saisir un titre...";
                    
                    if (activeFilters['titre']) {
                        searchInput.value = activeFilters['titre'];
                    }

                    searchInput.onkeyup = () => {
                        activeFilters['titre'] = searchInput.value;
                        table.setFilter(Object.keys(activeFilters).filter(f => activeFilters[f]).map(f => ({
                            field: f, type: (f === 'titre' || f === 'status_display') ? 'like' : '=', value: activeFilters[f]
                        })));
                        updateAllSelects();
                        setTimeout(() => table.redraw(true), 10);
                    };
                    searchWrapper.appendChild(searchLabel);
                    searchWrapper.appendChild(searchInput);
                    filterRow.appendChild(searchWrapper);

                    const resetBtnWrapper = document.createElement("div");
                    resetBtnWrapper.className = "col-12 col-lg-auto ms-lg-auto";

                    const resetBtn = document.createElement("button");
                    resetBtn.className = "btn btn-sm btn-secondary w-100";
                    resetBtn.innerHTML = `<i class="fa fa-eraser me-2" aria-hidden="true"></i>Réinitialiser`;
                    resetBtn.onclick = () => {
                        currentExercice = "";
                        currentBudget = "";
                        activeFilters = { application: "", type_doc: "", status_display: "", titre: "" };
                        reloadDataTable();
                    };
                    resetBtnWrapper.appendChild(resetBtn);
                    filterRow.appendChild(resetBtnWrapper);

                    filtersContainer.appendChild(filterRow);
                    
                    updateAllSelects();
                }

                function setupActionButtons(table, scope, pID) {
                    const container = scope.querySelector("#action-buttons-container");
                    if (!container) return;
                    
                    container.innerHTML = `
                        <button id="print-docs" class="btn btn-sm btn-outline-secondary" aria-label="Imprimer"><i class="fa-solid fa-print me-1" aria-hidden="true"></i>Imprimer</button>
                        <button id="reset-docs-layout" class="btn btn-sm btn-outline-secondary">Réinitialiser colonnes</button>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Exporter les données">Exporter</button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" id="export-csv-doc" href="#" aria-label="Exporter au format CSV">CSV</a></li>
                                <li><a class="dropdown-item" id="export-xlsx-doc" href="#" style="color: #495057 !important;" aria-label="Exporter au format Excel">Excel</a></li>
                            </ul>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Choisir les colonnes">Colonnes</button>
                            <ul id="docs-columns-menu" class="dropdown-menu p-3" style="min-width: 250px; max-height: 400px; overflow-y: auto;"></ul>
                        </div>`;

                    container.querySelector("#print-docs").onclick = () => {
                        const tableHtml = table.getHtml(true);
                        const win = window.open('', '_blank');
                        win.document.write(`<html><head><title>Impression</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;font-size:12px;}</style></head><body>${tableHtml}</body></html>`);
                        win.document.close();
                        win.print();
                    };

                    container.querySelector("#reset-docs-layout").onclick = () => {
                        localStorage.removeItem("tabulator-datatable-documents-v4-columns");
                        location.reload();
                    };

                    container.querySelector("#export-csv-doc").onclick = (e) => { e.preventDefault(); table.download("csv", "activites.csv"); };
                    container.querySelector("#export-xlsx-doc").onclick = (e) => { e.preventDefault(); table.download("xlsx", "activites.xlsx"); };

                    const menu = container.querySelector("#docs-columns-menu");
                    if (menu) {
                        menu.innerHTML = "";
                        table.getColumns().forEach(col => {
                            const def = col.getDefinition();
                            if (!def.title || def.field === "actions_html") return;
                            const li = document.createElement("li");
                            li.className = "mb-2 d-flex align-items-center";
                            const chkId = `chk-${def.field}-${Date.now()}`;
                            li.innerHTML = `
                                <input type="checkbox" class="form-check-input me-2" id="${chkId}" ${col.isVisible() ? 'checked' : ''}>
                                <label class="form-check-label small mb-0" for="${chkId}" style="cursor:pointer;">${def.title}</label>`;
                            li.querySelector('input').onchange = (e) => { e.target.checked ? col.show() : col.hide(); };
                            menu.appendChild(li);
                        });
                    }
                }

                reloadDataTable();
            });
        },
    };
})(Drupal, once, jQuery, drupalSettings);