/**
 * GLP-1 Pipeline Tracker - Main Application
 */

// 全局状态
const state = {
    products: [],
    filteredProducts: [],
    sortField: 'approval_date',
    sortDirection: 'asc'
};

// 辅助判断是否为中国企业
function isChineseCompany(company) {
    if (!company) return false;
    const foreign = ['诺和诺德', '礼来', '阿斯利康', '赛诺菲', '勃林格殷格翰', '强生', '默沙东', '葛兰素史克', '诺华', 'Ionis', 'Alnylam', 'Altimmune', '安进', 'vTv', '百特'];
    return !foreign.some(fc => company.includes(fc));
}

// 阶段排序权重
const stageWeights = {
    '已上市': 6,
    'NDA': 5,
    'III期': 4,
    'II期': 3,
    'I期': 2,
    '临床前': 1,
    '终止开发': 1
};

// 初始化
async function init() {
    try {
        const response = await fetch('data/pipeline.json');
        const data = await response.json();
        state.products = data.products || [];
        state.filteredProducts = [...state.products];
        
        // 初始渲染
        updateStats();
        sortProducts('approval_date', false);
        renderData();

        // 绑定事件
        setupEventListeners();
        
        // 更新最后更新时间
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = data.last_updated || '--';
        }
        
    } catch (error) {
        console.error('Failed to load data:', error);
        const tbody = document.getElementById('productTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400">数据加载失败，请刷新页面重试</td></tr>';
        }
    }
}

// 更新统计数据
function updateStats() {
    const products = state.products;
    function animateNumber(id, target, duration = 1500) {
        const el = document.getElementById(id);
        if (!el) return;
        
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    animateNumber('totalProducts', products.length);
    const approved = products.filter(p => p.stage === '已上市').length;
    animateNumber('approvedCount', approved);
    const china = products.filter(p => isChineseCompany(p.company)).length;
    animateNumber('chinaCount', china);
    const multiTarget = products.filter(p => (p.targets && p.targets.length >= 2)).length;
    animateNumber('multiTargetCount', multiTarget);
}

// 统一渲染入口
function renderData() {
    renderTable();
    renderCards();
    updateFilterCount();
}

// 渲染表格 (Desktop)
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    const products = state.filteredProducts;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-12 text-center text-slate-400 font-medium">未找到符合条件的产品</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const targetsHtml = (product.targets || []).map(t =>
            `<span class="target-badge mr-1">${t.replace('R', '')}</span>`
        ).join('');
        
        return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <div class="flex items-center flex-wrap gap-1 mb-1">
                        <span class="font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" onclick="showNewsModal(${product.id})">${product.name_cn}</span>
                    </div>
                    <div class="flex flex-wrap">${targetsHtml}</div>
                </div>
            </td>
            <td class="px-4 py-4">
                <span class="text-slate-900 font-semibold text-sm">${product.company}</span>
            </td>
            <td class="px-4 py-4">
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-4 text-sm text-slate-600">
                ${product.administration || '-'}
            </td>
            <td class="px-4 py-4 text-sm text-slate-600">
                ${product.frequency || '-'}
            </td>
            <td class="px-4 py-4 text-sm text-slate-900 font-medium">
                ${product.approval_date || '-'}
            </td>
            <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1">
                    ${(product.indications || []).slice(0, 2).map(ind => `<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">${ind}</span>`).join('')}
                </div>
            </td>
            <td class="px-4 py-4">
                <p class="text-xs text-slate-500 line-clamp-2" title="${product.latest_update || ''}">
                    ${product.latest_update || '-'}
                </p>
            </td>
        </tr>
    `;
    }).join('');
}

// 渲染卡片 (Mobile)
function renderCards() {
    const container = document.getElementById('productCardList');
    if (!container) return;

    const products = state.filteredProducts;

    if (products.length === 0) {
        container.innerHTML = '<div class="py-12 text-center text-slate-400">未找到符合条件的产品</div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="card p-5 cursor-pointer active:scale-[0.98] transition-all" onclick="showNewsModal(${product.id})">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-bold text-blue-600 text-lg leading-tight mb-1">${product.name_cn}</h3>
                    <div class="text-xs font-semibold text-slate-900">${product.company}</div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
                    <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>
            <div class="flex flex-wrap gap-1 mb-4">
                ${(product.targets || []).map(t => `<span class="target-badge">${t.replace('R', '')}</span>`).join('')}
            </div>
            <div class="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <div>
                    <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药途径</span>
                    <span class="text-slate-900 font-semibold">${product.administration}</span>
                </div>
                <div>
                    <span class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药频率</span>
                    <span class="text-slate-900 font-semibold">${product.frequency}</span>
                </div>
            </div>
        </div>
    `).join('');
}



function updateFilterCount() {
    const el = document.getElementById("filterCount");
    if (!el) return;
    const current = (state.filteredProducts || []).length;
    const total = (state.products || []).length;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}

function getStageClass(stage) {
    if (stage === '已上市') return 'stage-approved';
    if (stage.includes('NDA')) return 'stage-nda';
    if (stage.includes('III') || stage.includes('3')) return 'stage-phase3';
    if (stage.includes('II') || stage.includes('2')) return 'stage-phase2';
    if (stage.includes('I') || stage.includes('1')) return 'stage-phase1';
    return 'stage-preclinical';
}

// 筛选功能
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stageFilter = Array.from(document.querySelectorAll('.stage-cb:checked')).map(cb => cb.value);
    const indicationFilter = Array.from(document.querySelectorAll('.ind-cb:checked')).map(cb => cb.value);
    const selectedTargets = Array.from(document.querySelectorAll('.target-cb:checked')).map(cb => cb.value.toUpperCase());
    const routeFilter = Array.from(document.querySelectorAll('.route-cb:checked')).map(cb => cb.value);
    
    state.filteredProducts = state.products.filter(product => {
        const searchMatch = !searchTerm || 
            product.name_cn.toLowerCase().includes(searchTerm) ||
            product.company.toLowerCase().includes(searchTerm) ||
            (product.code_name && product.code_name.toLowerCase().includes(searchTerm));
        
        const stageMatch = stageFilter.length === 0 || stageFilter.some(stage => product.stage.includes(stage));
        const indicationMatch = indicationFilter.length === 0 || indicationFilter.some(ind => product.indications && product.indications.includes(ind));
        
        let routeMatch = false;
        if (routeFilter.length === 0) {
            routeMatch = true;
        } else {
            const admin = product.administration || '注射';
            if (admin.includes('口服') && routeFilter.includes('口服')) routeMatch = true;
            else if (admin.includes('注射') && routeFilter.includes('注射')) routeMatch = true;
            else if (admin.includes('鼻喷') && routeFilter.includes('其他')) routeMatch = true;
        }
        
        const targetMatch = selectedTargets.length === 0 || selectedTargets.every(t => {
            return product.targets && product.targets.some(pt => pt.toUpperCase().includes(t));
        });
        
        return searchMatch && stageMatch && indicationMatch && targetMatch && routeMatch;
    });
    
    if (state.sortField) {
        sortProducts(state.sortField, false);
    }
    
    renderData();
}

// 排序功能
function sortProducts(field, toggleDirection = true) {
    if (toggleDirection) {
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = 'desc';
        }
    }
    
    state.filteredProducts.sort((a, b) => {
        let valA, valB;
        if (field === 'stage') {
            valA = stageWeights[a.stage] || 0;
            valB = stageWeights[b.stage] || 0;
        } else {
            valA = a[field] || '';
            valB = b[field] || '';
        }
        
        if (field === 'approval_date') {
            const parseDate = (d) => {
                if (!d || d === '-' || d.includes('预计') || d.includes('以后')) return 'ZZZZZ';
                const match = d.match(/(\d{4})年(\d{2})月/);
                if (match) return `${match[1]}${match[2]}`;
                return d;
            };
            const dateA = parseDate(valA);
            const dateB = parseDate(valB);
            if (dateA === 'ZZZZZ' && dateB !== 'ZZZZZ') return 1;
            if (dateB === 'ZZZZZ' && dateA !== 'ZZZZZ') return -1;
            if (dateA < dateB) return state.sortDirection === 'asc' ? -1 : 1;
            if (dateA > dateB) return state.sortDirection === 'asc' ? 1 : -1;
            return 0;
        }

        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    document.querySelectorAll('th[data-sort]').forEach(th => {
        if (th.dataset.sort === field) {
            th.querySelector('.sort-icon').textContent = state.sortDirection === 'asc' ? '↑' : '↓';
            th.querySelector('.sort-icon').classList.replace('text-slate-300', 'text-blue-600');
            th.classList.add('text-blue-600');
        } else {
            th.querySelector('.sort-icon').textContent = '↕';
            th.querySelector('.sort-icon').classList.replace('text-blue-600', 'text-slate-300');
            th.classList.remove('text-blue-600');
        }
    });
    
    renderData();
}

// 设置事件监听
function setupEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));
    document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .route-cb').forEach(cb => cb.checked = false);
        filterProducts();
    });
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortProducts(th.dataset.sort));
    });
    document.getElementById('closeNewsModal')?.addEventListener('click', () => {
        document.getElementById('newsModal').classList.add('hidden');
    });
    document.getElementById('newsModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
    });
}

// 显示新闻模态框
function showNewsModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('newsModalTitle').textContent = `${product.name_cn} - 最新相关进展`;
    const content = document.getElementById('newsModalContent');
    if (!product.news || product.news.length === 0) {
        content.innerHTML = '<div class="py-12 text-center text-slate-400">暂无相关新闻进展</div>';
    } else {
        content.innerHTML = product.news.map(n => `
            <a href="${n.url}" target="_blank" class="block p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all hover:border-blue-200">
                <h4 class="font-bold text-slate-900 mb-2">${n.title}</h4>
                <div class="flex items-center text-xs text-slate-400">
                    <span class="mr-3 font-semibold text-blue-500">${n.source || '新闻来源'}</span>
                    <span>${n.date || ''}</span>
                </div>
            </a>
        `).join('');
    }
    document.getElementById('newsModal').classList.remove('hidden');
}

// 防抖函数
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
    module.exports = { isChineseCompany };
}
