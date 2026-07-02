// Shared utility functions used across all pages

export const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}

export function sanitizeUrl(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return '#';
  return encodeURI(url);
}

export function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function animateNumber(id, target, duration = 1500) {
  const el = document.getElementById(id);
  if (!el) return;
  const inc = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
      return;
    }
    el.textContent = Math.floor(current);
  }, 16);
}
