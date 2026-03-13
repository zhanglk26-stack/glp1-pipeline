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
        renderTable();

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
    // 跑马灯数字动画
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
    
    // 总产品数
    animateNumber('totalProducts', products.length);
    
    // 已上市
    const approved = products.filter(p => p.stage === '已上市').length;
    animateNumber('approvedCount', approved);
    
    // III期临床
    const phase3 = products.filter(p => p.stage === 'III期临床' || p.stage === 'III期完成' || p.stage === 'III期临床(注射剂)/II期(口服)').length;
    if (document.getElementById('phase3Count')) {
        animateNumber('phase3Count', phase3);
    }
    
    // 中国公司
    const china = products.filter(p => isChineseCompany(p.company)).length;
    animateNumber('chinaCount', china);
    
    // 多靶点产品
    const multiTarget = products.filter(p => (p.targets && p.targets.length >= 2)).length;
    if (document.getElementById('multiTargetCount')) {
        animateNumber('multiTargetCount', multiTarget);
    }
    
    // GCG靶点产品
    const gcgTarget = products.filter(p => (p.targets && p.targets.includes('GCGR'))).length;
    if (document.getElementById('gcgCount')) {
        animateNumber('gcgCount', gcgTarget);
    }
}

// 渲染表格
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    const products = state.filteredProducts;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500 font-medium">未找到符合条件的产品</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const isMultiTarget = (product.targets && product.targets.length >= 2);
        const isChina = isChineseCompany(product.company);
        
        // 确定行样式
        let rowClass = '';
        if (isChina && isMultiTarget) {
            rowClass = 'china-multi-highlight';
        } else if (isMultiTarget) {
            rowClass = 'multi-target-row';
        }
        
        // 动态生成真实的靶点标签
        let targetTagsHtml = '';
        if (product.targets && product.targets.length > 0) {
            targetTagsHtml = product.targets.map(t => `<span class="border border-gray-200 text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded text-xs font-normal uppercase tracking-wider">${t.replace('R', '')}</span>`).join('<span class="w-[2px]"></span>');
        }
        
        return `
        <tr class="${rowClass}">
            <td class="px-4 py-3">
                <div class="flex flex-col">
                    <div class="flex items-center flex-wrap gap-1">
                        <span class="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mr-1 transition-colors" onclick="showNewsModal(${product.id})">${product.name_cn}</span>
                        ${targetTagsHtml}
                    </div>
                    <span class="text-sm font-bold text-gray-900 mt-1">${product.code_name || ''}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="text-gray-900 font-bold">${product.company}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span class="text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50/50">${product.administration || '-'}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span class="text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50/50">${product.frequency}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
                ${product.approval_date || '-'}
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${(product.indications || []).slice(0, 2).map(ind => `<span class="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${ind}</span>`).join('')}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
                <div class="line-clamp-3 hover:line-clamp-none cursor-help" style="word-break: break-all; min-width: 200px;" title="${product.latest_update || ''}">
                    ${product.latest_update || '-'}
                </div>
            </td>
        </tr>
    `}).join('');
}

// 获取阶段样式类
function getStageClass(stage) {
    if (stage === '已上市') return 'stage-approved';
    if (stage.includes('NDA')) return 'stage-nda';
    if (stage.includes('III') || stage.includes('3')) return 'stage-phase3';
    if (stage.includes('II') || stage.includes('2')) return 'stage-phase2';
    if (stage.includes('I') || stage.includes('1')) return 'stage-phase1';
    return 'stage-preclinical';
}

// 全局筛选状态
const filterState = {
    multiTarget: false,
    gcgTarget: false
};

// 筛选功能
function filterProducts() {
    window.location.hash = '';
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // 获取多选框数组
    const stageFilter = Array.from(document.querySelectorAll('.stage-cb:checked')).map(cb => cb.value);
    const indicationFilter = Array.from(document.querySelectorAll('.ind-cb:checked')).map(cb => cb.value);
    const selectedTargets = Array.from(document.querySelectorAll('.target-cb:checked')).map(cb => cb.value.toUpperCase());
    const frequencyFilter = Array.from(document.querySelectorAll('.freq-cb:checked')).map(cb => cb.value);
    
    state.filteredProducts = state.products.filter(product => {
        // 搜索匹配
        const searchMatch = !searchTerm || 
            product.name_cn.toLowerCase().includes(searchTerm) ||
            product.company.toLowerCase().includes(searchTerm) ||
            (product.code_name && product.code_name.toLowerCase().includes(searchTerm));
        
        // 阶段匹配（支持多选）
        const stageMatch = stageFilter.length === 0 || stageFilter.some(stage => product.stage.includes(stage));
        
        // 适应症匹配（支持多选）
        const indicationMatch = indicationFilter.length === 0 || indicationFilter.some(ind => product.indications && product.indications.includes(ind));
        
        // 靶点多选匹配 (产品必须包含所有勾选的靶点)
        // 给药周期过滤
        const freqMatch = frequencyFilter.length === 0 || frequencyFilter.includes(product.frequency);
        
        // 给药途径过滤
        const routeFilter = Array.from(document.querySelectorAll('.route-cb:checked')).map(cb => cb.value);
        let routeMatch = false;
        if (routeFilter.length === 0) {
            routeMatch = true;
        } else {
            const admin = product.administration || '注射';
            if (admin.includes('口服') && routeFilter.includes('口服')) routeMatch = true;
            else if (admin.includes('注射') && routeFilter.includes('注射')) routeMatch = true;
            else if (admin.includes('鼻喷') && routeFilter.includes('其他')) routeMatch = true;
            else if (admin === '其他' && routeFilter.includes('其他')) routeMatch = true;
        }
        
        const targetMatch = selectedTargets.length === 0 || selectedTargets.every(t => {
            return product.targets && product.targets.some(pt => pt.toUpperCase().includes(t));
        });
        
        return searchMatch && stageMatch && indicationMatch && targetMatch && freqMatch && routeMatch;
    });
    
    // 应用排序
    if (state.sortField) {
        sortProducts(state.sortField, false);
    }
    
    renderTable();
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
        } else if (field.includes('.')) {
            const keys = field.split('.');
            valA = keys.reduce((obj, key) => obj?.[key], a) || '';
            valB = keys.reduce((obj, key) => obj?.[key], b) || '';
        } else {
            valA = a[field] || '';
            valB = b[field] || '';
        }
        
        // 处理百分比字符串
        if (typeof valA === 'string' && valA.includes('%')) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }
        
        // Handle special cases
        if (field === 'approval_date') {
            const parseDate = (d) => {
                if (!d || d === '-' || d.includes('预计') || d.includes('以后')) return 'ZZZZZ'; // Sort to bottom
                const match = d.match(/(\d{4})年(\d{2})月/);
                if (match) return `${match[1]}${match[2]}`;
                return d;
            };
            
            const dateA = parseDate(valA);
            const dateB = parseDate(valB);
            
            // Empty dates always go to the bottom
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
    
    // 更新排序图标
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sorted');
        if (th.dataset.sort === field) {
            th.classList.add('sorted');
            th.querySelector('.sort-icon').textContent = state.sortDirection === 'asc' ? '↑' : '↓';
        } else {
            th.querySelector('.sort-icon').textContent = '↕';
        }
    });
    
    renderTable();
}


// 设置事件监听
function setupEventListeners() {
    // 搜索
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));
    
    // 筛选器
    document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .freq-cb, .route-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    
    // 清除筛选
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.stage-cb, .ind-cb, .target-cb, .freq-cb, .route-cb').forEach(cb => cb.checked = false);
        filterProducts();
    });
    
    // 排序
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortProducts(th.dataset.sort));
    });

    // 关闭弹窗
    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('productModal').classList.add('hidden');
    });
    
    document.getElementById('closeNewsModal')?.addEventListener('click', () => {
        document.getElementById('newsModal').classList.add('hidden');
    });
    
    // 点击弹窗外部关闭
    ['productModal', 'newsModal'].forEach(id => {
        const modal = document.getElementById(id);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('productModal')?.classList.add('hidden');
            document.getElementById('newsModal')?.classList.add('hidden');
        }
    });
}

// 显示新闻模态框
function showNewsModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const newsTitleEl = document.getElementById('newsModalTitle');
    if (newsTitleEl) newsTitleEl.textContent = `${product.name_cn} - 最新相关新闻`;
    
    const content = document.getElementById('newsModalContent');
    if (!content) return;
    
    if (!product.news || product.news.length === 0) {
        content.innerHTML = '<div class="py-8 text-center text-gray-500"><p>暂无相关新闻...</p></div>';
    } else {
        content.innerHTML = product.news.map(n => `
            <a href="${n.url}" target="_blank" class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <h4 class="font-semibold text-blue-700 mb-1">${n.title}</h4>
                <div class="flex items-center text-xs text-gray-500">
                    <span class="mr-3">${n.source || '未知来源'}</span>
                    <span>${n.date || ''}</span>
                </div>
            </a>
        `).join('');
    }
    
    document.getElementById('newsModal')?.classList.remove('hidden');
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

// 启动应用
document.addEventListener('DOMContentLoaded', init);
