
import { EmailAPIService } from './api.js';
import { EmailUI } from './ui.js';

export class EmailWidget {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.api = new EmailAPIService(apiUrl);
    this.ui = new EmailUI();

    this.ui.bindEvents({
      onBack: () => this.showFolderView(),
      onRetry: () => this.initialize()
    });
  }

  async initialize() {
    this.ui.showView('loading');
    try {
      const maarchData = await this.api.fetchData();
      if (!maarchData || typeof maarchData !== 'object') {
          throw new Error("Invalid data received from the API.");
      }
      const folders = Object.keys(maarchData).map(folderName => {
        const folderData = maarchData[folderName];
        return {
          name: folderName,
          unreadCount: folderData.count,
          emails: folderData.mails, 
          description: folderData.basket_desc,

        };
      });
      this.ui.renderFolders(folders, (folder) => this.openFolder(folder));
      this.showFolderView();

    } catch (error) {
      this.ui.displayError('Failed to load data. Please check the connection and try again.'); 
      console.error('Email widget initialization error:', error);
    }
  }
  
  openFolder(folder) {
    this.ui.updateCurrentFolderName(folder.name);
    this.ui.renderEmails(folder.emails, (emailId) => this.openEmail(emailId));
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