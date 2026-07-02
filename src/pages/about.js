// About page — minimal, just mounts site shell
import { mountSiteShell } from '../shared/site-shell.js';
import { escapeHtml } from '../shared/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  mountSiteShell();
});
