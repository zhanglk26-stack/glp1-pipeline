// Main database page — refactored to ES modules
import { mountSiteShell } from '../shared/site-shell.js';
import { escapeHtml, sanitizeUrl, debounce, animateNumber } from '../shared/utils.js';
import {
  normalizeStage, getStageClass, isApprovedStage, isChineseCompany,
  getLastUpdated, getSearchableFields, normalizeIndications, normalizeIndicationValue,
  getStageWeight, compareProductsByApprovalDate, compareValues,
} from '../shared/constants.js';

const state = {
  products: [],
  filteredProducts: [],
  sortField: 'approval_date',
  sortDirection: 'asc',
};

function updateStats() {
  const products = state.products;
  animateNumber('totalProducts', products.length);
  animateNumber('approvedCount', products.filter((p) => isApprovedStage(p.stage)).length);
  animateNumber('chinaCount', products.filter((p) => isChineseCompany(p.company)).length);
  animateNumber('multiTargetCount', products.filter((p) => (p.targets || []).length >= 2).length);
}

function renderTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;

  const products = state.filteredProducts;
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-12 text-center text-slate-400 font-medium">未找到符合条件的产品</td></tr>';
    return;
  }

  tbody.innerHTML = products.map((p) => {
    const targetsHtml = (p.targets || [])
      .map((t) => `<span class="target-badge mr-1">${escapeHtml(t.replace(/R$/, ''))}</span>`)
      .join('');

    return `
<tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
  <td class="px-4 py-4 text-sm">
    <div class="flex flex-col">
      <div class="flex items-center flex-wrap gap-1 mb-1">
        <span class="font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" onclick="window.__showNews(${p.id})">${escapeHtml(p.name_cn)}</span>
      </div>
      <div class="flex flex-wrap">${targetsHtml}</div>
    </div>
  </td>
  <td class="px-4 py-4"><span class="text-slate-900 font-semibold text-sm">${escapeHtml(p.company)}</span></td>
  <td class="px-4 py-4"><span class="stage-pill ${getStageClass(p.stage)}">${escapeHtml(p.stage)}</span></td>
  <td class="px-4 py-4 text-sm text-slate-600">${escapeHtml(p.administration || '-')}</td>
  <td class="px-4 py-4 text-sm text-slate-600">${escapeHtml(p.frequency || '-')}</td>
  <td class="px-4 py-4 text-sm text-slate-900 font-medium">${escapeHtml(p.approval_date || '-')}</td>
  <td class="px-4 py-4">
    <div class="flex flex-wrap gap-1">
      ${(p.indications || []).slice(0, 2).map((ind) =>
        `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">${escapeHtml(ind)}</span>`
      ).join('')}
    </div>
  </td>
  <td class="px-4 py-4">
    <p class="text-xs text-slate-500 line-clamp-2" title="${escapeHtml(p.latest_update || '')}">${escapeHtml(p.latest_update || '-')}</p>
  </td>
</tr>`;
  }).join('');
}

function renderCards() {
  const container = document.getElementById('productCardList');
  if (!container) return;

  const products = state.filteredProducts;
  if (products.length === 0) {
    container.innerHTML = '<div class="py-12 text-center text-slate-400">未找到符合条件的产品</div>';
    return;
  }

  container.innerHTML = products.map((p) => `
<div class="card p-5 cursor-pointer active:scale-[0.98] transition-all" onclick="window.__showNews(${p.id})">
  <div class="flex justify-between items-start mb-3">
    <div class="flex-1">
      <h3 class="font-bold text-blue-600 text-lg leading-tight mb-1">${escapeHtml(p.name_cn)}</h3>
      <div class="text-xs font-semibold text-slate-900">${escapeHtml(p.company)}</div>
    </div>
    <div class="flex flex-col items-end gap-2">
      <span class="stage-pill ${getStageClass(p.stage)}">${escapeHtml(p.stage)}</span>
    </div>
  </div>
  <div class="flex flex-wrap gap-1 mb-4">
    ${(p.targets || []).map((t) => `<span class="target-badge">${escapeHtml(t.replace(/R$/, ''))}</span>`).join('')}
  </div>
  <div class="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
    <div>
      <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药途径</span>
      <span class="text-slate-900 font-semibold">${escapeHtml(p.administration || '-')}</span>
    </div>
    <div>
      <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药频率</span>
      <span class="text-slate-900 font-semibold">${escapeHtml(p.frequency || '-')}</span>
    </div>
  </div>
</div>`).join('');
}

function updateFilterCount() {
  const el = document.getElementById('filterCount');
  if (!el) return;
  el.textContent = `正在显示 ${state.filteredProducts.length} / ${state.products.length} 款产品`;
}

function renderData() {
  renderTable();
  renderCards();
  updateFilterCount();
}

function matchesSearch(product, term) {
  if (!term) return true;
  return getSearchableFields(product).includes(term);
}

function matchesStage(product, filter) {
  if (filter.length === 0) return true;
  const ns = normalizeStage(product.stage);
  return filter.some((s) => s === 'NDA' ? ns === 'nda' : String(product.stage || '').includes(s));
}

function matchesIndication(product, filter) {
  if (filter.length === 0) return true;
  const ni = normalizeIndications(product.indications);
  return filter.some((ind) => ni.includes(normalizeIndicationValue(ind)));
}

function matchesRoute(product, filter) {
  if (filter.length === 0) return true;
  const admin = product.administration || '注射';
  if (admin.includes('口服') && filter.includes('口服')) return true;
  if (admin.includes('注射') && filter.includes('注射')) return true;
  if ((admin.includes('鼻喷') || admin.includes('吸入') || admin.includes('透皮')) && filter.includes('其他')) return true;
  return false;
}

function matchesTarget(product, selected) {
  if (selected.length === 0) return true;
  return selected.every((t) => (product.targets || []).some((pt) => pt.toUpperCase().includes(t)));
}

function filterProducts() {
  const term = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const stageFilter = Array.from(document.querySelectorAll('.stage-cb:checked')).map((c) => c.value);
  const indFilter = Array.from(document.querySelectorAll('.ind-cb:checked')).map((c) => c.value);
  const targets = Array.from(document.querySelectorAll('.target-cb:checked')).map((c) => c.value.toUpperCase());
  const routeFilter = Array.from(document.querySelectorAll('.route-cb:checked')).map((c) => c.value);

  state.filteredProducts = state.products.filter((p) =>
    matchesSearch(p, term) && matchesStage(p, stageFilter) &&
    matchesIndication(p, indFilter) && matchesRoute(p, routeFilter) && matchesTarget(p, targets)
  );

  if (state.sortField) {
    sortProducts(state.sortField, false);
    return;
  }
  renderData();
}

function sortProducts(field, toggleDirection = true) {
  if (toggleDirection) {
    if (state.sortField === field) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortField = field;
      state.sortDirection = 'desc';
    }
  } else {
    state.sortField = field;
  }

  state.filteredProducts.sort((a, b) => {
    if (field === 'stage') {
      const result = getStageWeight(a.stage) - getStageWeight(b.stage);
      return state.sortDirection === 'asc' ? result : -result;
    }
    if (field === 'approval_date') {
      return compareProductsByApprovalDate(a, b, state.sortDirection);
    }
    const result = compareValues(a[field], b[field]);
    return state.sortDirection === 'asc' ? result : -result;
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (th.dataset.sort === field) {
      icon.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
      icon.classList.replace('text-slate-300', 'text-blue-600');
      th.classList.add('text-blue-600');
    } else {
      icon.textContent = '↕';
      icon.classList.replace('text-blue-600', 'text-slate-300');
      th.classList.remove('text-blue-600');
    }
  });

  renderData();
}

function setupStickyHeader() {
  const section = document.getElementById('tableSection');
  const header = document.getElementById('tableHeader');
  if (!section || !header) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'table-header-placeholder';
  section.insertBefore(placeholder, section.firstChild);

  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const navH = 64;
    if (rect.top < navH && rect.bottom > navH + 100) {
      if (!header.classList.contains('table-header-sticky')) {
        header.classList.add('table-header-sticky');
        placeholder.classList.add('visible');
        const table = header.closest('table');
        if (table) header.style.width = `${table.offsetWidth}px`;
      }
    } else if (header.classList.contains('table-header-sticky')) {
      header.classList.remove('table-header-sticky');
      placeholder.classList.remove('visible');
      header.style.width = '';
    }
  });

  window.addEventListener('resize', () => {
    if (!header.classList.contains('table-header-sticky')) return;
    const table = header.closest('table');
    if (table) header.style.width = `${table.offsetWidth}px`;
  });
}

function showNewsModal(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  document.getElementById('newsModalTitle').textContent = `${product.name_cn} - 最新相关进展`;
  const content = document.getElementById('newsModalContent');

  if (!product.news || product.news.length === 0) {
    content.innerHTML = '<div class="py-12 text-center text-slate-400">暂无相关新闻进展</div>';
  } else {
    content.innerHTML = product.news.map((n) => `
<a href="${sanitizeUrl(n.url)}" target="_blank" rel="noopener noreferrer" class="block p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all hover:border-blue-200">
  <h4 class="font-bold text-slate-900 mb-2">${escapeHtml(n.title)}</h4>
  <div class="flex items-center text-xs text-slate-400">
    <span class="mr-3 font-semibold text-blue-500">${escapeHtml(n.source || '新闻来源')}</span>
    <span>${escapeHtml(n.date || '')}</span>
  </div>
</a>`).join('');
  }

  document.getElementById('newsModal').classList.remove('hidden');
}

function setupEventListeners() {
  document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));
  document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb')
    .forEach((cb) => cb.addEventListener('change', filterProducts));

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb').forEach((cb) => { cb.checked = false; });
    filterProducts();
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => sortProducts(th.dataset.sort));
  });

  document.getElementById('closeNewsModal')?.addEventListener('click', () => {
    document.getElementById('newsModal')?.classList.add('hidden');
  });

  document.getElementById('newsModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  setupStickyHeader();
}

// Expose for inline onclick handlers
window.__showNews = showNewsModal;

async function init() {
  mountSiteShell();
  try {
    const resp = await fetch('/data/pipeline.json');
    const data = await resp.json();

    state.products = data.products || [];
    state.filteredProducts = [...state.products];

    updateStats();
    setupEventListeners();
    sortProducts('approval_date', false);

    const lastEl = document.getElementById('lastUpdated');
    if (lastEl) lastEl.textContent = getLastUpdated(data);
  } catch (err) {
    console.error('Failed to load data:', err);
    const tbody = document.getElementById('productTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400">数据加载失败，请刷新页面重试</td></tr>';
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
