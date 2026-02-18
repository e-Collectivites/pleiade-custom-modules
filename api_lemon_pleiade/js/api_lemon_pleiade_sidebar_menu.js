(function ($, Drupal, drupalSettings, once) {
  "use strict";

  function handleKeyboardContextMenu(e) {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      e.stopPropagation();
      const ev = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        view: window,
        buttons: 2,
        clientX: e.target.getBoundingClientRect().left,
        clientY: e.target.getBoundingClientRect().top
      });
      e.target.dispatchEvent(ev);
    }
  }

  Drupal.behaviors.APIlemonMenuBehavior = {
    attach: function (context, settings) {
      once("APIlemonMenuBehavior", "body", context).forEach((body) => {
        if (!drupalSettings.path.currentPath.includes("admin")) {
          this.initializeService();
        }
      });
    },

    async initializeService() {
      try {
        const userData = await this.fetchUserData();

        this.initializeEventListeners();
        this.initializeSortables();
        this.attachAccessibilityHandlers();

        const event = new CustomEvent('menuRendered', { detail: {} });
        document.dispatchEvent(event);
        const favEvent = new CustomEvent('favoritesMenuRendered', { detail: {} });
        document.dispatchEvent(favEvent);

        if (drupalSettings.path.isFront) {
          this.runInteractiveGuide(userData);
        }

        $(".preloader").fadeOut();

      } catch (error) {
        console.error("Error initializing the service:", error);
      }
    },

    async fetchUserData() {
      try {
        const response = await fetch(Drupal.url("v1/api_user_pleiade/user_infos"));
        if (!response.ok) throw new Error("Could not fetch user info");
        return response.json();
      } catch (e) {
        return {};
      }
    },

    async fetchSortOrder(variable) {
      try {
        const formData = new FormData();
        formData.append('var', variable);
        const response = await fetch('/v1/api_user_pleiade/getVariablesValue', { method: 'POST', body: formData });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) return null;
        const parsedOrder = JSON.parse(data);
        return Array.isArray(parsedOrder) && parsedOrder.length > 0 ? parsedOrder : null;
      } catch (error) {
        return null;
      }
    },

    attachAccessibilityHandlers() {
      document.querySelectorAll('.context-menu-item, .favoris-link').forEach(el => {
        el.removeEventListener('keydown', handleKeyboardContextMenu);
        el.addEventListener('keydown', handleKeyboardContextMenu);
      });
    },

    initializeEventListeners() {
      const addAppModalElement = document.getElementById("addAppModal");
      if (addAppModalElement) {
        const addAppModal = new bootstrap.Modal(addAppModalElement);
        const urlInput = addAppModalElement.querySelector("#uriInputFavoris");
        const titleInput = addAppModalElement.querySelector("#titleInputFavoris");

        document.body.addEventListener("contextmenu", (e) => {
          const target = e.target.closest('.context-menu-item');
          if (target) {
            e.preventDefault();
            urlInput.value = target.href;
            titleInput.value = target.dataset.text;
            addAppModal.show();
            addAppModalElement.addEventListener('shown.bs.modal', () => titleInput.focus(), { once: true });
          }
        });

        const btnAdd = addAppModalElement.querySelector("#btnAddFavoris");
        if (btnAdd) {
          btnAdd.addEventListener("click", async (e) => {
            e.preventDefault();
            const uri = urlInput.value.trim();
            const title = titleInput.value.trim();
            if (!uri || !title) return alert("L'URI et le titre sont obligatoires.");
            await this.addFavoriteApplication(uri, title);
            addAppModal.hide();
          });
        }
      }

      const deleteAppModalElement = document.getElementById("deleteAppModal");
      if (deleteAppModalElement) {
        const deleteAppModal = new bootstrap.Modal(deleteAppModalElement);
        const urlInput = deleteAppModalElement.querySelector("#uriInputFavorisModal");
        const titleInput = deleteAppModalElement.querySelector("#titleInputFavoris2");
        const originalUriInput = deleteAppModalElement.querySelector("#originalUri");
        const originalTitleInput = deleteAppModalElement.querySelector("#originalTitle");

        document.body.addEventListener("contextmenu", (e) => {
          const target = e.target.closest('.favoris-link');
          if (target) {
            e.preventDefault();
            const uri = target.dataset.uri || target.href;
            const title = target.dataset.title;
            urlInput.value = uri;
            titleInput.value = title;
            originalUriInput.value = uri;
            originalTitleInput.value = title;
            urlInput.removeAttribute('readonly');
            titleInput.removeAttribute('readonly');
            deleteAppModal.show();
            deleteAppModalElement.addEventListener('shown.bs.modal', () => titleInput.focus(), { once: true });
          }
        });

        const btnModify = deleteAppModalElement.querySelector("#btnModifyFavoris");
        if (btnModify) {
          btnModify.addEventListener("click", async () => {
            const newUri = urlInput.value.trim();
            const newTitle = titleInput.value.trim();
            const oldUri = originalUriInput.value;
            const oldTitle = originalTitleInput.value;
            if (!newUri || !newTitle) return alert("L'URI et le titre sont obligatoires.");
            if (newUri === oldUri && newTitle === oldTitle) { deleteAppModal.hide(); return; }
            await this.modifyFavoriteApplication(oldUri, oldTitle, newUri, newTitle);
            deleteAppModal.hide();
          });
        }

        const btnDelete = deleteAppModalElement.querySelector("#btnDeleteFavoris");
        if (btnDelete) {
          btnDelete.addEventListener("click", async () => {
            const uri = originalUriInput.value;
            const title = originalTitleInput.value;
            await this.deleteFavoriteApplication(uri, title);
            deleteAppModal.hide();
          });
        }
      }
      
      const logoutModalElement = document.getElementById("logoutConfirmationModal");
      const logoutButton = document.getElementById("logout");
      if (logoutModalElement && logoutButton) {
        const logoutModal = new bootstrap.Modal(logoutModalElement);
        logoutButton.addEventListener("click", (e) => { e.preventDefault(); logoutModal.show(); });
      }
    },

    initializeSortables() {
      let sortableMenu = null;
      let sortableFavoris = null;
      const desktopBreakpoint = 768;

      const handleSortableState = () => {
        const menuContainer = document.getElementById("menuLemon");
        if (window.innerWidth >= desktopBreakpoint) {
          if (menuContainer && !sortableMenu && typeof Sortable !== 'undefined') {
            sortableMenu = new Sortable(menuContainer, {
              animation: 150,
              draggable: ".sortable-item",
              onEnd: (evt) => {
                const newOrder = Array.from(menuContainer.querySelectorAll(".sortable-item")).map(el => el.dataset.categoryName);
                this.saveSortOrder(newOrder, 'field_menu_order');
              },
            });
          }
          const menuFavorisContainer = document.getElementById('favorisAppId');
          if (menuFavorisContainer && !sortableFavoris && typeof Sortable !== 'undefined') {
            sortableFavoris = new Sortable(menuFavorisContainer, {
              animation: 150,
              draggable: "li",
              ghostClass: "sortable-ghost",
              onEnd: (evt) => {
                const newOrder = Array.from(menuFavorisContainer.querySelectorAll("li .favoris-link"))
                  .map(el => el.dataset.title);
                this.saveSortOrder(newOrder, "field_favoris_menu_order");
              },
            });
          }
        } else {
          if (sortableMenu) { sortableMenu.destroy(); sortableMenu = null; }
          if (sortableFavoris) { sortableFavoris.destroy(); sortableFavoris = null; }
        }
      };
      handleSortableState();
      window.addEventListener('resize', handleSortableState);
    },

    runInteractiveGuide(userData) {
      const created = userData?.created?.[0]?.value;
      const accessed = userData?.access?.[0]?.value;
      if (!created || !accessed) return;
      const timeDifference = Math.abs(new Date(accessed) - new Date(created));
      if (timeDifference <= 60000) {
        const steps = [{ intro: "Bienvenue sur le guide interactif du Bureau Virtuel Pléiade" }];
        const addStep = (selector, intro, position = "bottom") => {
          const element = document.querySelector(selector);
          if (element) steps.push({ element, intro, position });
        };
        addStep(".fa-power-off", "Se déconnecter de Pléiade.");
        addStep(".user_card", "Accéder au profil utilisateur.");
        addStep(".alert_popup", "Ici apparaîtront les messages importants concernant les solutions d'e-Collectivités.");
        addStep("#collectiviteChoice", "Accéder aux autres entités rattachées à votre compte.");
        addStep(".sidebartoggler", "Réduire ou agrandir le menu.");
        addStep(".navbar-brand", "Revenir à la page d'accueil du bureau virtuel.");
        addStep("#menuLemon", "Retrouver toutes les rubriques et menus liés à votre profil.");
        addStep("#teamviewer", "Télécharger TeamViewer.");
        addStep("#actualites-row", "Consulter les dernières actualités.");
        addStep("#document_recent_id", "Visualiser les 50 derniers éléments ( Actes, Convocations, Documents à signer...).", "left");
        addStep(".dataTables_filter .form-control", "Rechercher un élément.", "left");
        addStep(".action_rapides", "Boutons d'actions rapides (détails, modification, suppression)");
        addStep("#postit_block_id", "Créer des post-it virtuels.", "left");
        addStep("#guide_utilisateur", "Consulter les guides utilisateurs.", "left");
        addStep(".service-panel-toggle", "Personnaliser votre bureau.", "left");

        if (steps.length > 1 && typeof introJs !== 'undefined') {
          introJs().setOptions({ steps, exitOnOverlayClick: false }).start();
        }
      }
    },

    async addFavoriteApplication(uri, title) {
      try {
        const savedOrder = await this.fetchSortOrder('field_favoris_menu_order');
        const formData = new FormData();
        formData.append('uri', uri);
        formData.append('title', title);
        const response = await fetch('/v1/api_user_pleiade/user_add_application', { method: 'POST', body: formData });
        if (!response.ok) throw new Error((await response.json()).message || 'Addition failed');

        const ul = document.getElementById("favorisAppId");
        if(ul) {
            const li = document.createElement("li");
            const safeUri = uri.replace(/[^\w-]/gi, '_');
            li.innerHTML = `<a class="favoris-link sidebar-link waves-effect waves-dark" href="${uri}" target="_blank" data-title="${title}" data-uri="${uri}" title="${title} (Clic droit pour options)" id="favorite-link-${safeUri}"><span class="hide-menu px-2">${title}</span></a>`;
            li.querySelector('a').addEventListener('keydown', handleKeyboardContextMenu);
            ul.appendChild(li);
        }

        if (savedOrder) {
          savedOrder.push(title);
          await this.saveSortOrder(savedOrder, 'field_favoris_menu_order');
        } else {
          await this.saveSortOrder([title], 'field_favoris_menu_order');
        }
      } catch (error) {
        console.error('Error adding favorite:', error);
        alert('Erreur lors de l\'ajout du favoris: ' + error.message);
      }
    },

    async modifyFavoriteApplication(oldUri, oldTitle, newUri, newTitle) {
      try {
        const savedOrder = await this.fetchSortOrder('field_favoris_menu_order');
        const formData = new FormData();
        formData.append('old_uri', oldUri);
        formData.append('old_title', oldTitle);
        formData.append('new_uri', newUri);
        formData.append('new_title', newTitle);
        const response = await fetch('/v1/api_user_pleiade/user_modify_application', { method: 'POST', body: formData });
        if (!response.ok) throw new Error((await response.json()).message || 'Modification failed');

        const link = document.querySelector(`a[data-title="${oldTitle}"]`);
        if(link) {
            link.href = newUri;
            link.dataset.uri = newUri;
            link.dataset.title = newTitle;
            link.title = `${newTitle} (Clic droit pour options)`;
            const span = link.querySelector('span');
            if(span) span.textContent = newTitle;
        }

        if (savedOrder) {
          const updatedOrder = savedOrder.map(item => item === oldTitle ? newTitle : item);
          await this.saveSortOrder(updatedOrder, 'field_favoris_menu_order');
        }
      } catch (error) {
        console.error('Error modifying favorite:', error);
        alert('Erreur lors de la modification du favoris: ' + error.message);
      }
    },

    async deleteFavoriteApplication(uri, title) {
      try {
        const savedOrder = await this.fetchSortOrder('field_favoris_menu_order');
        const formData = new FormData();
        formData.append('uri', uri);
        formData.append('title', title);
        const response = await fetch('/v1/api_user_pleiade/user_delete_application', { method: 'POST', body: formData });
        if (!response.ok) throw new Error((await response.json()).message || 'Deletion failed');

        const link = document.querySelector(`a[data-title="${title}"]`);
        if(link) {
            link.closest('li').remove();
        }

        if (savedOrder) {
          const updatedOrder = savedOrder.filter(item => item !== title);
          await this.saveSortOrder(updatedOrder, 'field_favoris_menu_order');
        }
      } catch (error) {
        console.error('Error deleting favorite:', error);
        alert('Erreur lors de la suppression du favoris: ' + error.message);
      }
    },

    async saveSortOrder(orderArray, variable) {
      const formData = new FormData();
      formData.append('var', variable);
      formData.append('value', JSON.stringify(orderArray));
      try {
        const response = await fetch('/v1/api_user_pleiade/setVariablesValue', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Network response was not ok');
        await response.json();
      } catch (error) {
        console.error(`Error saving order for "${variable}":`, error);
      }
    }
  };

})(jQuery, Drupal, drupalSettings, once);

(function (window) {
  "use strict";

  class NotificationManager {
    constructor() {
      this.counts = new Map();
      this.observers = new Map();
      this.pendingUpdates = new Map();
      this.rafHandle = null;
      this.MAX_UPDATES_PER_FRAME = 8;
    }

    setCount(elementId, count, options = {}) {
      this.counts.set(elementId, count);
      this.pendingUpdates.set(elementId, { count, options });
      
      if (!this.rafHandle) {
        this.rafHandle = requestAnimationFrame(this.flushUpdates.bind(this));
      }
      return true;
    }

    flushUpdates() {
      this.rafHandle = null;
      const updates = Array.from(this.pendingUpdates.entries());
      
      if (updates.length === 0) return;

      const batch = updates.slice(0, this.MAX_UPDATES_PER_FRAME);
      const remaining = updates.slice(this.MAX_UPDATES_PER_FRAME);

      batch.forEach(([elementId, { count, options }]) => {
        this.pendingUpdates.delete(elementId);
        
        const element = document.getElementById(elementId);
        if (!element) return;

        let hideMenuSpan = element.querySelector('.hide-menu');
        if (!hideMenuSpan) return;

        const existingBadge = hideMenuSpan.querySelector('.notification-badge-container');
        if (existingBadge) existingBadge.remove();

        if (count > 0) {
          const badgeColor = options.badgeColor || 'danger';
          const badgeClass = options.badgeClass || '';
          const badgeContainer = document.createElement('span');
          badgeContainer.className = 'notification-badge-container ms-3';
          const accessibleRed = "#c3002f"; 
          const accessibleGray = "#595959"; 
          const finalColor = badgeColor === 'danger' ? accessibleRed : (badgeColor === 'secondary' ? accessibleGray : '');

          badgeContainer.innerHTML = `
            <span class="position-absolute start-75 translate-middle badge top-50 rounded-pill ${badgeClass}" 
                  style="background-color: ${finalColor} !important; color: #ffffff !important;">
              ${count}
              <span class="visually-hidden">notifications</span>
            </span>`;
          hideMenuSpan.appendChild(badgeContainer);
        }
        
        this.notifyObservers(elementId, count);
      });

      if (remaining.length > 0) {
         this.rafHandle = requestAnimationFrame(this.flushUpdates.bind(this));
      }
    }

    getCount(elementId) { return this.counts.get(elementId) || 0; }
    incrementCount(elementId, increment = 1, options = {}) { return this.setCount(elementId, this.getCount(elementId) + increment, options); }
    decrementCount(elementId, decrement = 1, options = {}) { return this.setCount(elementId, Math.max(0, this.getCount(elementId) - decrement), options); }
    clearCount(elementId) { return this.setCount(elementId, 0); }
    clearAll() { this.counts.forEach((count, elementId) => { this.clearCount(elementId); }); }
    
    observe(elementId, callback) {
      if (!this.observers.has(elementId)) this.observers.set(elementId, new Set());
      this.observers.get(elementId).add(callback);
      return () => { const callbacks = this.observers.get(elementId); if (callbacks) callbacks.delete(callback); };
    }

    notifyObservers(elementId, newCount) {
      const callbacks = this.observers.get(elementId);
      if (callbacks) callbacks.forEach(cb => { try { cb(elementId, newCount); } catch (e) { console.error(e); } });
    }
    getAllCounts() { return Object.fromEntries(this.counts); }
  }

  window.NotificationManager = new NotificationManager();

  let isMenuFullyRendered = false;
  const commandQueue = [];

  document.addEventListener('menuRendered', () => {
    isMenuFullyRendered = true;
    while (commandQueue.length > 0) {
      const command = commandQueue.shift();
      command.fn(...command.args);
    }
  });

  const performSmartOperation = (elementId, value, options, operation) => {
    if (!elementId) return false;
    const exactElement = document.getElementById(elementId);
    if (exactElement) return operation(elementId, value, options);

    const potentialMatches = document.querySelectorAll(`.sidebar-link[id^="${elementId}"]`);
    const filteredMatches = Array.from(potentialMatches).filter(el => !el.id.toLowerCase().includes('test'));
    if (filteredMatches.length === 1) return operation(filteredMatches[0].id, value, options);
    
    return false;
  };

  const executeOrQueue = (fn, args) => {
    if (document.getElementById('menuLemon')) {
        return fn(...args);
    } else {
        commandQueue.push({ fn, args });
        return null;
    }
  };

  window.setNotificationCount = (elementId, count, options) => executeOrQueue((id, c, opts) => performSmartOperation(id, c, opts, (rid, v, o) => window.NotificationManager.setCount(rid, v, o)), [elementId, count, options]);
  window.incrementNotificationCount = (elementId, i = 1, options = {}) => executeOrQueue((id, inc, opts) => performSmartOperation(id, inc, opts, (rid, v, o) => window.NotificationManager.incrementCount(rid, v, o)), [elementId, i, options]);
  window.decrementNotificationCount = (elementId, d = 1, options = {}) => executeOrQueue((id, dec, opts) => performSmartOperation(id, dec, opts, (rid, v, o) => window.NotificationManager.decrementCount(rid, v, o)), [elementId, d, options]);
  window.clearNotificationCount = (elementId) => executeOrQueue((id) => performSmartOperation(id, 0, {}, (rid, v, o) => window.NotificationManager.clearCount(rid)), [elementId]);

})(window);


(function ($, Drupal, once) {
  "use strict";
  const CategoryNotificationAggregator = {
    categoryMap: {},
    initialize: function () {
      this.buildCategoryMap();
      this.subscribeToAppChanges();
    },
    buildCategoryMap: function () {
      const menuContainer = document.getElementById("menuLemon");
      if (!menuContainer) return;
      const categoryContainers = menuContainer.querySelectorAll(".sortable-item");
      categoryContainers.forEach(container => {
        const header = container.querySelector(".nav-small-cap");
        const appLinks = container.querySelectorAll(".sidebar-link[id]");
        if (header && header.id && appLinks.length > 0) {
          this.categoryMap[header.id] = Array.from(appLinks).map(link => link.id);
        }
      });
    },
    subscribeToAppChanges: function () {
      if (!window.NotificationManager) return;
      Object.keys(this.categoryMap).forEach(categoryHeaderId => {
        const appIds = this.categoryMap[categoryHeaderId];
        appIds.forEach(appId => {
          window.NotificationManager.observe(appId, () => {
            this.updateCategoryTotal(categoryHeaderId);
          });
        });
      });
    },
    updateCategoryTotal: function (categoryHeaderId) {
      if (!window.NotificationManager || !this.categoryMap[categoryHeaderId]) return;
      const appIds = this.categoryMap[categoryHeaderId];
      const total = appIds.reduce((sum, currentAppId) => sum + window.NotificationManager.getCount(currentAppId), 0);
      window.NotificationManager.setCount(categoryHeaderId, total, { badgeColor: 'secondary', badgeClass: 'category-total-badge' });
    }
  };
  Drupal.behaviors.categoryNotificationAggregator = {
    attach: function (context, settings) {
      once('category-aggregator-init', 'body', context).forEach(() => {
        CategoryNotificationAggregator.initialize();
      });
    }
  };
})(jQuery, Drupal, once);


(function ($, Drupal, once) {
  "use strict";
  const FavoritesNotificationSynchronizer = {
    appIdToUriMap: new Map(),
    uriToFavoriteIdMap: new Map(),
    favoritesHeaderId: null,
    
    tryInitialize: function () {
        const header = document.querySelector('[data-bs-target="#collapse10"]');
        if (header) {
          if (!header.id) header.id = 'menu-category-mesapplications-header';
          this.favoritesHeaderId = header.id;
        }
        this.buildMaps();
        this.subscribeToAppChanges();
        this.initialSync();
    },
    buildMaps: function () {
      document.querySelectorAll('#menuLemon .sidebar-link[id][href]').forEach(appLink => {
        this.appIdToUriMap.set(appLink.id, appLink.href);
      });
      document.querySelectorAll('#collapse10 .favoris-link[id]').forEach(favLink => {
        const uri = favLink.dataset.uri || favLink.href;
        this.uriToFavoriteIdMap.set(uri, favLink.id);
      });
    },
    subscribeToAppChanges: function () {
      if (!window.NotificationManager) return;
      this.appIdToUriMap.forEach((uri, appId) => {
        if (this.uriToFavoriteIdMap.has(uri)) {
          const favoriteId = this.uriToFavoriteIdMap.get(uri);
          window.NotificationManager.observe(appId, (changedAppId, newCount) => {
            window.NotificationManager.setCount(favoriteId, newCount);
            this.updateFavoritesTotal();
          });
        }
      });
    },
    initialSync: function () {
      if (!window.NotificationManager) return;
      const allCounts = window.NotificationManager.getAllCounts();
      Object.entries(allCounts).forEach(([appId, count]) => {
        if (count > 0 && this.appIdToUriMap.has(appId)) {
          const uri = this.appIdToUriMap.get(appId);
          if (this.uriToFavoriteIdMap.has(uri)) {
            const favoriteId = this.uriToFavoriteIdMap.get(uri);
            window.NotificationManager.setCount(favoriteId, count);
          }
        }
      });
      this.updateFavoritesTotal();
    },
    updateFavoritesTotal: function () {
      if (!this.favoritesHeaderId || !window.NotificationManager) return;
      let total = 0;
      this.uriToFavoriteIdMap.forEach((favId, uri) => {
        total += window.NotificationManager.getCount(favId);
      });
      window.NotificationManager.setCount(this.favoritesHeaderId, total, { badgeColor: 'secondary', badgeClass: 'category-total-badge' });
    }
  };
  Drupal.behaviors.favoritesNotificationSynchronizer = {
    attach: function (context, settings) {
      once('favorites-sync-init', 'body', context).forEach(() => {
          FavoritesNotificationSynchronizer.tryInitialize();
      });
    }
  };
})(jQuery, Drupal, once);