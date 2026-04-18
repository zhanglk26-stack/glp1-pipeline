const FOREIGN_COMPANIES = [
  '诺和诺德',
  '礼来',
  '阿斯利康',
  '赛诺菲',
  '勃林格殷格翰',
  '强生',
  '默沙东',
  '葛兰素史克',
  '诺华',
  'Ionis',
  'Alnylam',
  'Altimmune',
  '安进',
  'vTv',
  '百特',
  '辉瑞',
  'Pfizer'
];

const STAGE_ORDER = {
  approved: 6,
  nda: 5,
  phase3: 4,
  phase2: 3,
  phase1: 2,
  preclinical: 1,
  discontinued: 0,
  unknown: 0
};

const INDICATION_ALIASES = {
  NASH: 'MASH',
  MASH: 'MASH',
  CKD: 'CKD',
  '慢性肾病': 'CKD'
};

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const state = {
  products: [],
  filteredProducts: [],
  sortField: 'approval_date',
  sortDirection: 'asc'
};

function isChineseCompany(company) {
  if (!company) return false;
  return !FOREIGN_COMPANIES.some((foreignCompany) => company.includes(foreignCompany));
}

function normalizeStage(stage) {
  const value = String(stage || '').trim();

  if (!value) return 'unknown';
  if (value.includes('退市') || value.includes('终止')) return 'discontinued';
  if (value.includes('已上市')) return 'approved';
  if (value.includes('NDA') || value.includes('申报')) return 'nda';
  if (/III|Ⅲ|3期/.test(value)) return 'phase3';
  if (/II|Ⅱ|2期/.test(value)) return 'phase2';
  if (/I|Ⅰ|1期/.test(value)) return 'phase1';
  if (value.includes('临床前')) return 'preclinical';

  return 'unknown';
}

function getStageWeight(stage) {
  return STAGE_ORDER[normalizeStage(stage)] ?? STAGE_ORDER.unknown;
}

function isApprovedStage(stage) {
  return normalizeStage(stage) === 'approved';
}

function getStageClass(stage) {
  const normalized = normalizeStage(stage);

  if (normalized === 'approved') return 'stage-approved';
  if (normalized === 'nda') return 'stage-nda';
  if (normalized === 'phase3') return 'stage-phase3';
  if (normalized === 'phase2') return 'stage-phase2';
  if (normalized === 'phase1') return 'stage-phase1';
  return 'stage-preclinical';
}

function getLastUpdated(data) {
  return data?.metadata?.last_updated || data?.last_updated || '--';
}

function normalizeIndicationValue(value) {
  return INDICATION_ALIASES[value] || value;
}

function normalizeIndications(indications) {
  return (indications || []).map(normalizeIndicationValue);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

function sanitizeUrl(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return '#';
  return encodeURI(url);
}

function getSearchableFields(product) {
  return [
    product.name_cn,
    product.name_en,
    product.company,
    product.company_en,
    product.commercial_name,
    product.code_name,
    ...(product.targets || []),
    ...(product.indications || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function parseApprovalDateValue(value) {
  const text = String(value || '').trim();

  if (!text || text === '-' || text.includes('预计') || text.includes('以后')) {
    return null;
  }

  const match = text.match(/(\d{4})年(?:0?(\d{1,2})月)?/);
  if (!match) return null;

  const year = match[1];
  const month = String(match[2] || '12').padStart(2, '0');
  return Number(`${year}${month}`);
}

function compareProductsByApprovalDate(productA, productB, sortDirection) {
  const dateA = parseApprovalDateValue(productA.approval_date);
  const dateB = parseApprovalDateValue(productB.approval_date);

  if (dateA === null && dateB !== null) return 1;
  if (dateB === null && dateA !== null) return -1;

  if (dateA !== null && dateB !== null) {
    const result = dateA - dateB;
    return sortDirection === 'asc' ? result : -result;
  }

  const fallback = compareValues(productA.name_cn, productB.name_cn);
  return sortDirection === 'asc' ? fallback : -fallback;
}

function animateNumber(id, target, duration = 1500) {
  const element = document.getElementById(id);
  if (!element) return;

  const increment = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
      return;
    }

    element.textContent = Math.floor(current);
  }, 16);
}

async function init() {
  try {
    const response = await fetch('data/pipeline.json');
    const data = await response.json();

    state.products = data.products || [];
    state.filteredProducts = [...state.products];

    updateStats();
    setupEventListeners();
    sortProducts('approval_date', false);

    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = getLastUpdated(data);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    const tbody = document.getElementById('productTableBody');
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center py-8 text-red-400">数据加载失败，请刷新页面重试</td></tr>';
    }
  }
}

function updateStats() {
  const products = state.products;
  animateNumber('totalProducts', products.length);
  animateNumber(
    'approvedCount',
    products.filter((product) => isApprovedStage(product.stage)).length
  );
  animateNumber(
    'chinaCount',
    products.filter((product) => isChineseCompany(product.company)).length
  );
  animateNumber(
    'multiTargetCount',
    products.filter((product) => (product.targets || []).length >= 2).length
  );
}

function renderData() {
  renderTable();
  renderCards();
  updateFilterCount();
}

function renderTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;

  const products = state.filteredProducts;
  if (products.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="px-4 py-12 text-center text-slate-400 font-medium">未找到符合条件的产品</td></tr>';
    return;
  }

  tbody.innerHTML = products
    .map((product) => {
      const targetsHtml = (product.targets || [])
        .map((target) => `<span class="target-badge mr-1">${escapeHtml(target.replace(/R$/, ''))}</span>`)
        .join('');

      return `
<tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
  <td class="px-4 py-4 text-sm">
    <div class="flex flex-col">
      <div class="flex items-center flex-wrap gap-1 mb-1">
        <span class="font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" onclick="showNewsModal(${product.id})">${escapeHtml(product.name_cn)}</span>
      </div>
      <div class="flex flex-wrap">${targetsHtml}</div>
    </div>
  </td>
  <td class="px-4 py-4">
    <span class="text-slate-900 font-semibold text-sm">${escapeHtml(product.company)}</span>
  </td>
  <td class="px-4 py-4">
    <span class="stage-pill ${getStageClass(product.stage)}">${escapeHtml(product.stage)}</span>
  </td>
  <td class="px-4 py-4 text-sm text-slate-600">${escapeHtml(product.administration || '-')}</td>
  <td class="px-4 py-4 text-sm text-slate-600">${escapeHtml(product.frequency || '-')}</td>
  <td class="px-4 py-4 text-sm text-slate-900 font-medium">${escapeHtml(product.approval_date || '-')}</td>
  <td class="px-4 py-4">
    <div class="flex flex-wrap gap-1">
      ${(product.indications || [])
        .slice(0, 2)
        .map(
          (indication) =>
            `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">${escapeHtml(indication)}</span>`
        )
        .join('')}
    </div>
  </td>
  <td class="px-4 py-4">
    <p class="text-xs text-slate-500 line-clamp-2" title="${escapeHtml(product.latest_update || '')}">
      ${escapeHtml(product.latest_update || '-')}
    </p>
  </td>
</tr>`;
    })
    .join('');
}

function renderCards() {
  const container = document.getElementById('productCardList');
  if (!container) return;

  const products = state.filteredProducts;
  if (products.length === 0) {
    container.innerHTML = '<div class="py-12 text-center text-slate-400">未找到符合条件的产品</div>';
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
<div class="card p-5 cursor-pointer active:scale-[0.98] transition-all" onclick="showNewsModal(${product.id})">
  <div class="flex justify-between items-start mb-3">
    <div class="flex-1">
      <h3 class="font-bold text-blue-600 text-lg leading-tight mb-1">${escapeHtml(product.name_cn)}</h3>
      <div class="text-xs font-semibold text-slate-900">${escapeHtml(product.company)}</div>
    </div>
    <div class="flex flex-col items-end gap-2">
      <span class="stage-pill ${getStageClass(product.stage)}">${escapeHtml(product.stage)}</span>
      <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </div>
  </div>
  <div class="flex flex-wrap gap-1 mb-4">
    ${(product.targets || [])
      .map((target) => `<span class="target-badge">${escapeHtml(target.replace(/R$/, ''))}</span>`)
      .join('')}
  </div>
  <div class="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
    <div>
      <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药途径</span>
      <span class="text-slate-900 font-semibold">${escapeHtml(product.administration || '-')}</span>
    </div>
    <div>
      <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药频率</span>
      <span class="text-slate-900 font-semibold">${escapeHtml(product.frequency || '-')}</span>
    </div>
  </div>
</div>`
    )
    .join('');
}

function updateFilterCount() {
  const element = document.getElementById('filterCount');
  if (!element) return;

  const current = state.filteredProducts.length;
  const total = state.products.length;
  element.textContent = `正在显示 ${current} / ${total} 款产品`;
}

function matchesSearch(product, searchTerm) {
  if (!searchTerm) return true;
  return getSearchableFields(product).includes(searchTerm);
}

function matchesStage(product, stageFilter) {
  if (stageFilter.length === 0) return true;

  const normalizedStage = normalizeStage(product.stage);
  return stageFilter.some((stage) => {
    if (stage === 'NDA') {
      return normalizedStage === 'nda';
    }
    return String(product.stage || '').includes(stage);
  });
}

function matchesIndication(product, indicationFilter) {
  if (indicationFilter.length === 0) return true;

  const normalizedProductIndications = normalizeIndications(product.indications);
  return indicationFilter.some((indication) =>
    normalizedProductIndications.includes(normalizeIndicationValue(indication))
  );
}

function matchesRoute(product, routeFilter) {
  if (routeFilter.length === 0) return true;

  const administration = product.administration || '注射';
  if (administration.includes('口服') && routeFilter.includes('口服')) return true;
  if (administration.includes('注射') && routeFilter.includes('注射')) return true;
  if (
    (administration.includes('鼻喷') || administration.includes('吸入') || administration.includes('透皮')) &&
    routeFilter.includes('其他')
  ) {
    return true;
  }

  return false;
}

function matchesTarget(product, selectedTargets) {
  if (selectedTargets.length === 0) return true;

  return selectedTargets.every((target) =>
    (product.targets || []).some((productTarget) => productTarget.toUpperCase().includes(target))
  );
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
  const stageFilter = Array.from(document.querySelectorAll('.stage-cb:checked')).map(
    (checkbox) => checkbox.value
  );
  const indicationFilter = Array.from(document.querySelectorAll('.ind-cb:checked')).map(
    (checkbox) => checkbox.value
  );
  const selectedTargets = Array.from(document.querySelectorAll('.target-cb:checked')).map(
    (checkbox) => checkbox.value.toUpperCase()
  );
  const routeFilter = Array.from(document.querySelectorAll('.route-cb:checked')).map(
    (checkbox) => checkbox.value
  );

  state.filteredProducts = state.products.filter(
    (product) =>
      matchesSearch(product, searchTerm) &&
      matchesStage(product, stageFilter) &&
      matchesIndication(product, indicationFilter) &&
      matchesRoute(product, routeFilter) &&
      matchesTarget(product, selectedTargets)
  );

  if (state.sortField) {
    sortProducts(state.sortField, false);
    return;
  }

  renderData();
}

function compareValues(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'zh-CN');
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

  state.filteredProducts.sort((productA, productB) => {
    let result = 0;

    if (field === 'stage') {
      result = getStageWeight(productA.stage) - getStageWeight(productB.stage);
    } else if (field === 'approval_date') {
      return compareProductsByApprovalDate(productA, productB, state.sortDirection);
    } else {
      result = compareValues(productA[field], productB[field]);
    }

    return state.sortDirection === 'asc' ? result : -result;
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;

    if (th.dataset.sort === field) {
      icon.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
      icon.classList.replace('text-slate-300', 'text-blue-600');
      th.classList.add('text-blue-600');
      return;
    }

    icon.textContent = '↕';
    icon.classList.replace('text-blue-600', 'text-slate-300');
    th.classList.remove('text-blue-600');
  });

  renderData();
}

function setupStickyHeader() {
  const tableSection = document.getElementById('tableSection');
  const tableHeader = document.getElementById('tableHeader');
  if (!tableSection || !tableHeader) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'table-header-placeholder';
  tableSection.insertBefore(placeholder, tableSection.firstChild);

  window.addEventListener('scroll', () => {
    const rect = tableSection.getBoundingClientRect();
    const navHeight = 64;

    if (rect.top < navHeight && rect.bottom > navHeight + 100) {
      if (!tableHeader.classList.contains('table-header-sticky')) {
        tableHeader.classList.add('table-header-sticky');
        placeholder.classList.add('visible');

        const table = tableHeader.closest('table');
        if (table) {
          tableHeader.style.width = `${table.offsetWidth}px`;
        }
      }
      return;
    }

    if (tableHeader.classList.contains('table-header-sticky')) {
      tableHeader.classList.remove('table-header-sticky');
      placeholder.classList.remove('visible');
      tableHeader.style.width = '';
    }
  });

  window.addEventListener('resize', () => {
    if (!tableHeader.classList.contains('table-header-sticky')) return;

    const table = tableHeader.closest('table');
    if (table) {
      tableHeader.style.width = `${table.offsetWidth}px`;
    }
  });
}

function setupEventListeners() {
  document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));

  document
    .querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb')
    .forEach((checkbox) => checkbox.addEventListener('change', filterProducts));

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    document
      .querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    filterProducts();
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => sortProducts(th.dataset.sort));
  });

  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('hidden');
  });

  document.getElementById('closeNewsModal')?.addEventListener('click', () => {
    document.getElementById('newsModal')?.classList.add('hidden');
  });

  document.getElementById('newsModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.classList.add('hidden');
    }
  });

  setupStickyHeader();
}

function showNewsModal(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  document.getElementById('newsModalTitle').textContent = `${product.name_cn} - 最新相关进展`;
  const content = document.getElementById('newsModalContent');

  if (!product.news || product.news.length === 0) {
    content.innerHTML = '<div class="py-12 text-center text-slate-400">暂无相关新闻进展</div>';
  } else {
    content.innerHTML = product.news
      .map(
        (news) => `
<a href="${sanitizeUrl(news.url)}" target="_blank" rel="noopener noreferrer" class="block p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all hover:border-blue-200">
  <h4 class="font-bold text-slate-900 mb-2">${escapeHtml(news.title)}</h4>
  <div class="flex items-center text-xs text-slate-400">
    <span class="mr-3 font-semibold text-blue-500">${escapeHtml(news.source || '新闻来源')}</span>
    <span>${escapeHtml(news.date || '')}</span>
  </div>
</a>`
      )
      .join('');
  }

  document.getElementById('newsModal').classList.remove('hidden');
}

function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getLastUpdated,
    getStageClass,
    isApprovedStage,
    isChineseCompany,
    matchesIndication,
    matchesSearch,
    normalizeIndicationValue,
    normalizeStage,
    parseApprovalDateValue,
    compareProductsByApprovalDate
  };
}
