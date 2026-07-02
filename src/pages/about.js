// About page — minimal, just mounts site shell
import '../../css/style.css';
import { mountSiteShell } from '../shared/site-shell.js';
import { escapeHtml } from '../shared/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  mountSiteShell();
});
