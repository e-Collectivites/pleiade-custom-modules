
import { formatDate, escapeHtml } from './utils.js';

export class EmailUI {
  constructor() {
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

  bindEvents({ onBack, onRetry }) {
    this.backBtn.addEventListener('click', onBack);
    this.retryBtn.addEventListener('click', onRetry);
  }

  renderFolders(folders, onFolderClick) {
    this.folderList.innerHTML = ''; 

    if (folders.length === 0) {
      this.folderList.innerHTML = this.emptyFolders.outerHTML;
      return;
    }

    folders.forEach(folder => {
    
     
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.innerHTML = `
          <div class="folder-info">
            <div class="folder-icon"><i class="fa fa-solid fa-envelope-open-text"></i></div>
            <div class="folder-details">
              <h4>${escapeHtml(folder.name)}</h4>
              <p>${escapeHtml(folder.description) || 'Email folder'}</p>
            </div>
          </div>
          <div class="notification-badge">
            ${folder.unreadCount}
          </div>
        `;
        folderItem.addEventListener('click', () => onFolderClick(folder));
        this.folderList.appendChild(folderItem);
      
    });

    if (this.folderList.childElementCount === 0) {
        this.folderList.innerHTML = this.emptyFolders.outerHTML;
    }
  }

 
  renderEmails(basketData, onEmailClick) {
    this.emailList.innerHTML = ''; 

    if (typeof basketData !== 'object' || basketData === null) {
      this.emailList.innerHTML = this.emptyEmails.outerHTML;
      return;
    }

    const emails = Object.values(basketData).filter(item => 
      typeof item === 'object' && item !== null && item.res_id 
    );

    if (emails.length === 0) {
      this.emailList.innerHTML = this.emptyEmails.outerHTML;
      return;
    }

    emails.forEach(email => {
      const emailItem = document.createElement(email.redirection_link ? 'a' : 'div');
      emailItem.className = 'email-item';

      if (email.redirection_link) {
        emailItem.href = email.redirection_link;
        emailItem.target = 'maarchTab'; 
      }
      
      emailItem.innerHTML = `
        <div class="email-left">
          <div class="email-status-icon" style="background-color: ${email.priorityColor || '#ccc'};" title="${escapeHtml(email.statusLabel || '')}">
            <i class="fa fa-envelope"></i>
          </div>
          <div class="email-details">
            <div class="email-subject">${escapeHtml(email.subject || 'No Subject')}</div>
          </div>
        </div>
        <div class="email-date">${formatDate(email.creation_date)}</div>
        <div class="email-right">
        ${email.countNotes > 0 ? `<div class="email-action-icon has-badge" title="${email.countNotes} note(s)"><i class="fa fa-comments"></i><span class="badge">${email.countNotes}</span></div>` : ''}
        ${email.countAttachments > 0 ? `<div class="email-action-icon" title="${email.countAttachments} pièce(s) jointe(s)"><i class="fa fa-paperclip"></i></div>` : ''}
          <div class="email-action-icon" title="Collaborateurs"><i class="fa fa-users"></i></div>
          ${email.hasDocument ? `<div class="email-action-icon" title="Voir le document"><i class="fa fa-eye"></i></div>` : ''}
        </div>
      `;

      if (onEmailClick) {
          emailItem.addEventListener('click', () => onEmailClick(email.id));
      }
      
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
        error: this.errorState,
    };
    Object.values(views).forEach(view => view.classList.add('hidden'));
    if(views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
  }

  displayError(message) {
    this.errorMessage.textContent = message;
    this.showView('error');
  }
}