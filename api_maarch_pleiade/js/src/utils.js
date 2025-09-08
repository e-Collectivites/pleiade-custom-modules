// FILE: utils.js

/**
 * Formats an ISO date string into a more readable format (e.g., "18 Aug 2025").
 * @param {string} dateString The ISO date string to format.
 * @returns {string} The formatted date.
 */
export function formatDate(dateString) {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    return new Date(dateString).toLocaleDateString('en-GB', options);
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Escapes HTML to prevent XSS attacks when inserting text into the DOM.
 * @param {string} str The string to escape.
 * @returns {string} The sanitized string.
 */
export function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}