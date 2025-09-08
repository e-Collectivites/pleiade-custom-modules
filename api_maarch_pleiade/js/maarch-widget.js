// FILE: maarch_unified.js (or your Drupal JS file)
// FILE: api.js
class $483d053f6957138a$export$164559914c7abdf4 {
    constructor(apiUrl){
        this.apiUrl = apiUrl;
    }
    async fetchData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API Fetch Error:", error);
            throw error; // Re-throw to be handled by the calling component
        }
    }
}


// FILE: utils.js
/**
 * Formats an ISO date string into a more readable format (e.g., "18 Aug 2025").
 * @param {string} dateString The ISO date string to format.
 * @returns {string} The formatted date.
 */ function $4559ecf940edc78d$export$3ae94a2503e890a1(dateString) {
    const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    try {
        return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (e) {
        return 'Invalid Date';
    }
}
function $4559ecf940edc78d$export$4cf11838cdc2a8a8(str) {
    if (str === null || typeof str === 'undefined') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}


class $9bf1eecf7fc48f06$export$bcbcbc8aff10cc1f {
    constructor(){
        this.initializeDOMElements();
    }
    initializeDOMElements() {
        this.folderView = document.getElementById('folderView');
        this.emailView = document.getElementById('emailView');
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.folderList = document.getElementById('folderList');
        this.emailList = document.getElementById('emailList');
        this.currentFolderName = document.getElementById('currentFolderName');
        this.backBtn = document.getElementById('backBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.emptyFolders = document.getElementById('emptyFolders');
        this.emptyEmails = document.getElementById('emptyEmails');
        this.errorMessage = document.getElementById('errorMessage');
    }
    bindEvents({ onBack: onBack, onRetry: onRetry }) {
        this.backBtn.addEventListener('click', onBack);
        this.retryBtn.addEventListener('click', onRetry);
    }
    renderFolders(folders, onFolderClick) {
        this.folderList.innerHTML = '';
        if (folders.length === 0) {
            this.folderList.innerHTML = this.emptyFolders.outerHTML;
            return;
        }
        folders.forEach((folder)=>{
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            folderItem.innerHTML = `
          <div class="folder-info">
            <div class="folder-icon"><i class="fa fa-solid fa-envelope-open-text"></i></div>
            <div class="folder-details">
              <h4>${(0, $4559ecf940edc78d$export$4cf11838cdc2a8a8)(folder.name)}</h4>
              <p>${(0, $4559ecf940edc78d$export$4cf11838cdc2a8a8)(folder.description) || 'Email folder'}</p>
            </div>
          </div>
          <div class="notification-badge">
            ${folder.unreadCount}
          </div>
        `;
            folderItem.addEventListener('click', ()=>onFolderClick(folder));
            this.folderList.appendChild(folderItem);
        });
        if (this.folderList.childElementCount === 0) this.folderList.innerHTML = this.emptyFolders.outerHTML;
    }
    renderEmails(basketData, onEmailClick) {
        this.emailList.innerHTML = '';
        if (typeof basketData !== 'object' || basketData === null) {
            this.emailList.innerHTML = this.emptyEmails.outerHTML;
            return;
        }
        const emails = Object.values(basketData).filter((item)=>typeof item === 'object' && item !== null && item.res_id);
        if (emails.length === 0) {
            this.emailList.innerHTML = this.emptyEmails.outerHTML;
            return;
        }
        emails.forEach((email)=>{
            const emailItem = document.createElement(email.redirection_link ? 'a' : 'div');
            emailItem.className = 'email-item';
            if (email.redirection_link) {
                emailItem.href = email.redirection_link;
                emailItem.target = 'maarchTab';
            }
            emailItem.innerHTML = `
        <div class="email-left">
          <div class="email-status-icon" style="background-color: ${email.priorityColor || '#ccc'};" title="${(0, $4559ecf940edc78d$export$4cf11838cdc2a8a8)(email.statusLabel || '')}">
            <i class="fa fa-envelope"></i>
          </div>
          <div class="email-details">
            <div class="email-subject">${(0, $4559ecf940edc78d$export$4cf11838cdc2a8a8)(email.subject || 'No Subject')}</div>
          </div>
        </div>
        <div class="email-date">${(0, $4559ecf940edc78d$export$3ae94a2503e890a1)(email.creation_date)}</div>
        <div class="email-right">
          ${email.countNotes > 0 ? `<div class="email-action-icon has-badge" title="${email.countNotes} note(s)"><i class="fa fa-comments"></i><span class="badge">${email.countNotes}</span></div>` : ''}
          ${email.countAttachments > 0 ? `<div class="email-action-icon" title="${email.countAttachments} pi\xe8ce(s) jointe(s)"><i class="fa fa-paperclip"></i></div>` : ''}
          <div class="email-action-icon" title="Collaborateurs"><i class="fa fa-users"></i></div>
          ${email.hasDocument ? `<div class="email-action-icon" title="Voir le document"><i class="fa fa-eye"></i></div>` : ''}
        </div>
      `;
            if (onEmailClick) emailItem.addEventListener('click', ()=>onEmailClick(email.id));
            this.emailList.appendChild(emailItem);
        });
    }
    updateCurrentFolderName(name) {
        this.currentFolderName.textContent = name;
    }
    showView(viewName) {
        const views = {
            folders: this.folderView,
            emails: this.emailView,
            loading: this.loadingState,
            error: this.errorState
        };
        Object.values(views).forEach((view)=>view.classList.add('hidden'));
        if (views[viewName]) views[viewName].classList.remove('hidden');
    }
    displayError(message) {
        this.errorMessage.textContent = message;
        this.showView('error');
    }
}


class $95930220612465e5$export$2a9cf35d68358c6d {
    constructor(apiUrl){
        this.apiUrl = apiUrl;
        this.api = new (0, $483d053f6957138a$export$164559914c7abdf4)(apiUrl);
        this.ui = new (0, $9bf1eecf7fc48f06$export$bcbcbc8aff10cc1f)();
        this.ui.bindEvents({
            onBack: ()=>this.showFolderView(),
            onRetry: ()=>this.initialize()
        });
    }
    async initialize() {
        this.ui.showView('loading');
        try {
            const maarchData = await this.api.fetchData();
            if (!maarchData || typeof maarchData !== 'object') throw new Error("Invalid data received from the API.");
            const folders = Object.keys(maarchData).map((folderName)=>{
                const folderData = maarchData[folderName];
                return {
                    name: folderName,
                    unreadCount: folderData.count,
                    emails: folderData.mails,
                    description: folderData.basket_desc
                };
            });
            this.ui.renderFolders(folders, (folder)=>this.openFolder(folder));
            this.showFolderView();
        } catch (error) {
            this.ui.displayError('Failed to load data. Please check the connection and try again.');
            console.error('Email widget initialization error:', error);
        }
    }
    openFolder(folder) {
        this.ui.updateCurrentFolderName(folder.name);
        this.ui.renderEmails(folder.emails, (emailId)=>this.openEmail(emailId));
        this.showEmailView();
    }
    openEmail(emailId) {
        console.log('Opening email:', emailId);
    }
    showFolderView() {
        this.ui.showView('folders');
    }
    showEmailView() {
        this.ui.showView('emails');
    }
}


(function(Drupal1, once1, drupalSettings1) {
    "use strict";
    Drupal1.behaviors.MaarchUnifiedBehavior = {
        attach: function(context) {
            const container = document.getElementById("maarch_div_id");
            if (!container) return;
            once1("MaarchUnifiedBehavior", container, context).forEach((el)=>{
                const maarchUrl = drupalSettings1.api_maarch_pleiade?.maarch_url;
                if (!maarchUrl) {
                    console.error("Maarch URL is not defined in drupalSettings.");
                    return;
                }
                // Pass the complete data object to the widget
                const app = new (0, $95930220612465e5$export$2a9cf35d68358c6d)(maarchUrl);
                app.initialize();
            });
        }
    };
})(Drupal, once, drupalSettings);


//# sourceMappingURL=maarch-widget.js.map
