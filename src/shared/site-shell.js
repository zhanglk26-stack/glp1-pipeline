// Shared site shell: navigation header + footer
import { escapeHtml } from './utils.js';

const NAV_ITEMS = [
  { key: 'index', href: '/', label: '概览与数据库' },
  { key: 'visualization', href: '/visualization', label: '靶点矩阵' },
  { key: 'competitor-analysis', href: '/competitor-analysis', label: '竞品分析' },
  { key: 'predictor', href: '/predictor', label: '智能匹配' },
  { key: 'about', href: '/about', label: '关于' },
];

function renderNavLinks(activePage, mobile = false) {
  return NAV_ITEMS.map(({ key, href, label }) => {
    const active = key === activePage;
    if (mobile) {
      return `<a href="${href}" class="block px-3 py-2 rounded-lg ${active ? 'text-slate-900 font-semibold bg-slate-50' : 'text-slate-600 font-semibold hover:bg-slate-50'}">${label}</a>`;
    }
    return `<a href="${href}" class="${active ? 'text-slate-900' : 'text-slate-600'} hover:text-blue-600 font-semibold transition-colors">${label}</a>`;
  }).join('');
}

function renderHeader(activePage, tagline = '') {
  const taglineHtml = tagline
    ? `<span class="hidden lg:block text-xs border-l border-slate-200 pl-4 py-1 font-bold" style="color: #1e293b !important;">${escapeHtml(tagline)}</span>`
    : '';

  return `
<nav class="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 sticky top-0 z-50">
  <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16 items-center">
      <div class="flex items-center gap-4">
        <a href="/" class="font-bold text-xl tracking-tight text-slate-900 hover:text-blue-600 transition-colors">GLP-1 <span class="text-blue-600">Pipeline</span></a>
        ${taglineHtml}
      </div>
      <div class="hidden md:flex items-center space-x-8">${renderNavLinks(activePage)}</div>
      <div class="md:hidden">
        <button id="mobileMenuBtn" class="p-2 text-slate-600" type="button" aria-expanded="false" aria-controls="mobileMenu" aria-label="切换导航菜单">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</nav>
<div id="mobileMenu" class="hidden md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">${renderNavLinks(activePage, true)}</div>`;
}

function renderFooter(type = 'simple') {
  if (type === 'data') {
    return `
<footer class="bg-white border-t border-slate-200 mt-12 py-8">
  <div class="max-w-[1400px] mx-auto px-4 text-center">
    <p class="text-slate-400 text-xs">&copy; 2026 GLP-1 Pipeline Tracker. 数据最后更新: <span id="lastUpdated">--</span></p>
    <p class="text-slate-300 text-[10px] mt-2">数据来源于公开披露信息，仅供学术交流与参考，不作为医疗或投资依据。</p>
  </div>
</footer>`;
  }

  return `
<footer class="bg-white border-t border-slate-200 mt-12 py-8">
  <div class="max-w-[1400px] mx-auto px-4 text-center">
    <p class="text-slate-400 text-xs">&copy; 2026 GLP-1 Pipeline Tracker. All rights reserved.</p>
  </div>
</footer>`;
}

function bindMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('hidden');
  });
}

export function mountSiteShell() {
  const body = document.body;
  const activePage = body?.dataset?.page || 'index';
  const footerType = body?.dataset?.footer || 'simple';
  const tagline = body?.dataset?.tagline || '';

  const headerHost = document.getElementById('siteHeader');
  const footerHost = document.getElementById('siteFooter');

  if (headerHost) headerHost.innerHTML = renderHeader(activePage, tagline);
  if (footerHost) footerHost.innerHTML = renderFooter(footerType);

  bindMobileMenu();
}
