/**
 * GLP-1 Pipeline Tracker - Main Application
 */

// 全局状态
const state = {
    products: [],
    filteredProducts: [],
    selectedProducts: new Set(),
    sortField: null,
    sortDirection: 'asc',
    viewMode: 'table', // 'table' | 'card'
    charts: {}
};

// 阶段排序权重
const stageWeights = {
    '已上市': 8,
    'NDA审评中': 7,
    'NDA申报中': 7,
    'NDA申请中': 7,
    'III期临床': 6,
    'III期完成': 6,
    'III期临床(注射剂)/II期(口服)': 6,
    'II期临床': 5,
    'I期临床': 4,
    '临床前': 3,
    '临床阶段': 3,
    '发现阶段': 2,
    '终止开发': 1
};

// 初始化
async function init() {
    try {
        const response = await fetch('data/pipeline.json');
        const data = await response.json();
        state.products = data.products;
        state.filteredProducts = [...state.products];
        
        // 更新最后更新时间
        document.getElementById('lastUpdated').textContent = data.last_updated || '--';
        
        // 初始化所有组件
        updateStats();
        renderTimeline();
        renderChinaMultiBreakthrough();
        renderTable();
        renderCards();
        initCharts();
        setupEventListeners();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        showError('数据加载失败，请刷新页面重试');
    }
}

// 更新统计数据
function updateStats() {
    const products = state.products;
    
    // 总产品数
    animateNumber('totalProducts', products.length);
    
    // 已上市
    const approved = products.filter(p => p.stage === '已上市').length;
    animateNumber('approvedCount', approved);
    
    // III期临床
    const phase3 = products.filter(p => p.stage === 'III期临床').length;
    animateNumber('phase3Count', phase3);
    
    // 中国公司
    const china = products.filter(p => p.country === 'CN').length;
    animateNumber('chinaCount', china);
    
    // 多靶点产品
    const multiTarget = products.filter(p => p.is_multi_target).length;
    animateNumber('multiTargetCount', multiTarget);
    
    // GCG靶点产品
    const gcgTarget = products.filter(p => p.targets.includes('GCG')).length;
    animateNumber('gcgCount', gcgTarget);
    
    // 国产多靶点
    const chinaMulti = products.filter(p => p.is_china_multi).length;
    document.getElementById('chinaMultiCount').textContent = chinaMulti;
}

// 数字动画
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 800;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (targetValue - start) * easeProgress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 渲染时间线
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    
    // 收集所有最新动态并按时间排序
    const updates = [];
    state.products.forEach(product => {
        if (product.latest_update) {
            updates.push({
                product: product.product_name,
                company: product.company,
                update: product.latest_update,
                date: extractDate(product.latest_update)
            });
        }
    });
    
    // 按日期倒序排列
    updates.sort((a, b) => b.date.localeCompare(a.date));
    
    // 取前5条
    const recentUpdates = updates.slice(0, 5);
    
    container.innerHTML = recentUpdates.map((item, index) => `
        <div class="timeline-item ${index === 0 ? '' : 'completed'}">
            <div class="flex items-start gap-4">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${item.product} - ${item.company}</p>
                    <p class="text-sm text-gray-600 mt-1">${item.update}</p>
                </div>
                <span class="text-xs text-gray-400 whitespace-nowrap">${item.date || '近期'}</span>
            </div>
        </div>
    `).join('');
}

// 从更新文本中提取日期
function extractDate(text) {
    const match = text.match(/(\d{4}[-/](\d{1,2})?)/);
    return match ? match[1].replace('/', '-') : '';
}

// 渲染国产多靶点突破板块
function renderChinaMultiBreakthrough() {
    const container = document.getElementById('chinaMultiContainer');
    const chinaMultiProducts = state.products.filter(p => p.is_china_multi);
    
    if (chinaMultiProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">暂无数据</p>';
        return;
    }
    
    // 按阶段排序（已上市优先）
    chinaMultiProducts.sort((a, b) => {
        const stageOrder = { '已上市': 0, 'NDA审评中': 1, 'III期临床': 2, 'II期临床': 3 };
        return (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99);
    });
    
    container.innerHTML = chinaMultiProducts.map(product => `
        <div class="china-multi-highlight rounded-lg p-4 hover:shadow-lg transition cursor-pointer" onclick="showProductDetail('${product.id}')">
            <div class="flex items-start justify-between mb-2">
                <div>
                    <span class="multi-target-badge mb-1">🏆 ${product.target_count}靶点</span>
                    ${product.targets.includes('GCG') ? '<span class="gcg-badge ml-1">GCG</span>' : ''}
                </div>
                <span class="stage-badge ${getStageClass(product.stage)}">${product.stage}</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">${product.product_name}</h3>
            <p class="text-sm text-gray-600 mb-2">${product.company}</p>
            <div class="target-tags mb-2">
                ${product.targets.map(t => {
                    const classes = t === 'GLP-1' ? 'target-tag-glp1' : t === 'GIP' ? 'target-tag-gip' : 'target-tag-gcg';
                    return `<span class="target-tag ${classes}">${t}</span>`;
                }).join('')}
            </div>
            ${product.efficacy_data?.weight_loss?.week48 ? `
                <div class="efficacy-highlight multi-target-efficacy mt-2">
                    <span class="text-xs text-gray-600">48周减重</span>
                    <span class="text-lg font-bold text-amber-700 ml-2">${product.efficacy_data.weight_loss.week48}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 渲染表格
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    const products = state.filteredProducts;
    
    if (products.length === 0) {
        document.getElementById('tableView').classList.add('hidden');
        document.getElementById('noResults').classList.remove('hidden');
        return;
    }
    
    document.getElementById('tableView').classList.remove('hidden');
    document.getElementById('noResults').classList.add('hidden');
    
    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-3">
                <input type="checkbox" class="product-checkbox rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                    value="${product.id}" ${state.selectedProducts.has(product.id) ? 'checked' : ''}>
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-col">
                    <span class="font-medium text-gray-900">${product.product_name}</span>
                    <span class="text-xs text-gray-500">${product.code_name || ''}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="company-flag">
                    <span class="text-lg">${getCountryFlag(product.country)}</span>
                    <span class="text-sm text-gray-700">${product.company}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="stage-badge ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${product.indications.map(ind => `<span class="indication-tag">${ind}</span>`).join('')}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${product.molecule_type}</td>
            <td class="px-4 py-3">
                <span class="font-semibold text-biotech-600">
                    ${product.efficacy_data?.weight_loss?.week48 || product.efficacy_data?.weight_loss?.week36 || '-'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title="${product.latest_update || ''}">
                ${product.latest_update || '-'}
            </td>
            <td class="px-4 py-3">
                <button class="view-detail-btn text-primary-600 hover:text-primary-800 text-sm font-medium" data-id="${product.id}">
                    详情
                </button>
            </td>
        </tr>
    `).join('');
    
    // 绑定复选框事件
    tbody.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => toggleProductSelection(e.target.value, e.target.checked));
    });
    
    // 绑定详情按钮事件
    tbody.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showProductDetail(e.target.dataset.id));
    });
}

// 渲染卡片视图
function renderCards() {
    const container = document.getElementById('cardView');
    const products = state.filteredProducts;
    
    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-xl p-6 ${state.selectedProducts.has(product.id) ? 'selected' : ''}" data-id="${product.id}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                    <input type="checkbox" class="product-checkbox rounded border-gray-300 text-primary-600" 
                        value="${product.id}" ${state.selectedProducts.has(product.id) ? 'checked' : ''}>
                    <span class="text-lg">${getCountryFlag(product.country)}</span>
                </div>
                <span class="stage-badge ${getStageClass(product.stage)}">${product.stage}</span>
            </div>
            
            <h3 class="text-lg font-bold text-gray-900 mb-1">${product.product_name}</h3>
            <p class="text-sm text-gray-500 mb-3">${product.code_name || ''} · ${product.company}</p>
            
            <div class="flex flex-wrap gap-1 mb-4">
                ${product.indications.map(ind => `<span class="indication-tag">${ind}</span>`).join('')}
            </div>
            
            <div class="bg-gray-50 rounded-lg p-3 mb-4">
                <p class="text-xs text-gray-500 mb-1">分子类型</p>
                <p class="text-sm font-medium text-gray-700">${product.molecule_type}</p>
            </div>
            
            ${product.efficacy_data?.weight_loss ? `
                <div class="efficacy-grid mb-4">
                    ${product.efficacy_data.weight_loss.week48 ? `
                        <div class="efficacy-item">
                            <div class="value">${product.efficacy_data.weight_loss.week48}</div>
                            <div class="label">48周减重</div>
                        </div>
                    ` : ''}
                    ${product.efficacy_data.weight_loss.week52 ? `
                        <div class="efficacy-item">
                            <div class="value">${product.efficacy_data.weight_loss.week52}</div>
                            <div class="label">52周减重</div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <button class="view-detail-btn w-full btn-primary btn-sm" data-id="${product.id}">
                查看详情
            </button>
        </div>
    `).join('');
    
    // 绑定事件
    container.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => toggleProductSelection(e.target.value, e.target.checked));
    });
    
    container.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showProductDetail(e.target.dataset.id));
    });
}

// 获取国家国旗emoji
function getCountryFlag(country) {
    const flags = {
        'CN': '🇨🇳',
        'US': '🇺🇸',
        'DK': '🇩🇰',
        'DE': '🇩🇪',
        'JP': '🇯🇵',
        'UK': '🇬🇧',
        'FR': '🇫🇷',
        'CH': '🇨🇭'
    };
    return flags[country] || '🏳️';
}

// 获取阶段样式类
function getStageClass(stage) {
    if (stage === '已上市') return 'stage-approved';
    if (stage.includes('NDA')) return 'stage-nda';
    if (stage.includes('III期') || stage.includes('III期')) return 'stage-phase3';
    if (stage.includes('II期')) return 'stage-phase2';
    if (stage.includes('I期')) return 'stage-phase1';
    return 'stage-preclinical';
}

// 切换产品选择
function toggleProductSelection(productId, selected) {
    if (selected) {
        state.selectedProducts.add(productId);
    } else {
        state.selectedProducts.delete(productId);
    }
    
    updateCompareButton();
    
    // 更新卡片选中状态
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        card.classList.toggle('selected', selected);
    }
}

// 更新对比按钮
function updateCompareButton() {
    const count = state.selectedProducts.size;
    document.getElementById('compareCount').textContent = count;
    
    const btn = document.getElementById('compareBtn');
    if (count >= 2) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('animate-pulse');
        setTimeout(() => btn.classList.remove('animate-pulse'), 500);
    } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// 筛选功能
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const stageFilter = document.getElementById('stageFilter').value;
    const indicationFilter = document.getElementById('indicationFilter').value;
    const moleculeFilter = document.getElementById('moleculeFilter').value;
    const chinaOnly = document.getElementById('chinaFilter').classList.contains('china-active');
    
    state.filteredProducts = state.products.filter(product => {
        // 搜索匹配
        const searchMatch = !searchTerm || 
            product.product_name.toLowerCase().includes(searchTerm) ||
            product.company.toLowerCase().includes(searchTerm) ||
            (product.code_name && product.code_name.toLowerCase().includes(searchTerm));
        
        // 阶段匹配（支持部分匹配）
        const stageMatch = !stageFilter || product.stage.includes(stageFilter);
        
        // 适应症匹配
        const indicationMatch = !indicationFilter || product.indications.includes(indicationFilter);
        
        // 分子类型匹配
        const moleculeMatch = !moleculeFilter || product.molecule_type === moleculeFilter;
        
        // 中国专区
        const chinaMatch = !chinaOnly || product.country === 'CN';
        
        return searchMatch && stageMatch && indicationMatch && moleculeMatch && chinaMatch;
    });
    
    // 应用排序
    if (state.sortField) {
        sortProducts(state.sortField, false);
    }
    
    renderTable();
    renderCards();
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

// 显示产品详情
function showProductDetail(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const content = document.getElementById('modalContent');
    
    document.getElementById('modalTitle').textContent = `${product.product_name} - 产品详情`;
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-500 mb-1">公司</p>
                    <p class="font-medium text-gray-900">${product.company}</p>
                    <p class="text-xs text-gray-400">${product.company_en || ''}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-500 mb-1">代号</p>
                    <p class="font-medium text-gray-900">${product.code_name || '-'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-500 mb-1">给药途径</p>
                    <p class="font-medium text-gray-900">${product.route || '-'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-500 mb-1">开发阶段</p>
                    <span class="stage-badge ${getStageClass(product.stage)}">${product.stage}</span>
                </div>
            </div>
            
            <!-- 疗效数据 -->
            ${product.efficacy_data ? `
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">疗效数据</h4>
                    
                    ${product.efficacy_data.weight_loss ? `
                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-2">减重数据</h5>
                            <div class="bg-gradient-to-r from-biotech-50 to-biotech-100 rounded-lg p-4">
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    ${product.efficacy_data.weight_loss.week24 ? `
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-biotech-600">${product.efficacy_data.weight_loss.week24}</p>
                                            <p class="text-xs text-gray-600">24周</p>
                                        </div>
                                    ` : ''}
                                    ${product.efficacy_data.weight_loss.week36 ? `
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-biotech-600">${product.efficacy_data.weight_loss.week36}</p>
                                            <p class="text-xs text-gray-600">36周</p>
                                        </div>
                                    ` : ''}
                                    ${product.efficacy_data.weight_loss.week48 ? `
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-biotech-600">${product.efficacy_data.weight_loss.week48}</p>
                                            <p class="text-xs text-gray-600">48周</p>
                                        </div>
                                    ` : ''}
                                    ${product.efficacy_data.weight_loss.week52 ? `
                                        <div class="text-center">
                                            <p class="text-2xl font-bold text-biotech-600">${product.efficacy_data.weight_loss.week52}</p>
                                            <p class="text-xs text-gray-600">52周</p>
                                        </div>
                                    ` : ''}
                                </div>
                                ${product.efficacy_data.weight_loss.note ? `
                                    <p class="text-xs text-gray-500 mt-2 text-center">${product.efficacy_data.weight_loss.note}</p>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${product.efficacy_data.nash ? `
                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-2">NASH/MASH数据</h5>
                            <div class="grid grid-cols-2 gap-4">
                                ${product.efficacy_data.nash.nash_resolution ? `
                                    <div class="bg-orange-50 rounded-lg p-4 text-center">
                                        <p class="text-2xl font-bold text-orange-600">${product.efficacy_data.nash.nash_resolution}</p>
                                        <p class="text-xs text-gray-600">NASH缓解率</p>
                                    </div>
                                ` : ''}
                                ${product.efficacy_data.nash.fibrosis_improvement ? `
                                    <div class="bg-orange-50 rounded-lg p-4 text-center">
                                        <p class="text-2xl font-bold text-orange-600">${product.efficacy_data.nash.fibrosis_improvement}</p>
                                        <p class="text-xs text-gray-600">纤维化改善</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- 安全性数据 -->
            ${product.safety_data ? `
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">安全性数据</h4>
                    <div class="bg-red-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${product.safety_data.discontinuation_rate ? `
                                <div>
                                    <p class="text-xs text-gray-500">停药率</p>
                                    <p class="text-lg font-semibold text-red-600">${product.safety_data.discontinuation_rate}</p>
                                </div>
                            ` : ''}
                            ${product.safety_data.common_ae ? `
                                <div>
                                    <p class="text-xs text-gray-500 mb-1">常见不良事件</p>
                                    <div class="flex flex-wrap gap-1">
                                        ${product.safety_data.common_ae.map(ae => `
                                            <span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">${ae}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- 临床试验 -->
            ${product.clinical_trials && product.clinical_trials.length > 0 ? `
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">临床试验</h4>
                    <div class="space-y-2">
                        ${product.clinical_trials.map(trial => `
                            <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                    <p class="font-medium text-gray-900">${trial.name}</p>
                                    <p class="text-xs text-gray-500">${trial.nct} · ${trial.phase}</p>
                                </div>
                                <a href="${trial.url}" target="_blank" class="link-external text-sm">
                                    查看
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- 获批情况 -->
            ${product.approvals && product.approvals.length > 0 ? `
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">获批情况</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${product.approvals.map(approval => `
                            <div class="border rounded-lg p-3 text-center ${approval.status === '已批准' ? 'border-biotech-500 bg-biotech-50' : 'border-blue-300 bg-blue-50'}">
                                <p class="font-medium ${approval.status === '已批准' ? 'text-biotech-700' : 'text-blue-700'}">${approval.region}</p>
                                <p class="text-xs text-gray-500">${approval.date}</p>
                                <span class="text-xs ${approval.status === '已批准' ? 'text-biotech-600' : 'text-blue-600'}">${approval.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- 开发时间线 -->
            ${product.timeline && product.timeline.length > 0 ? `
                <div>
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">开发历程</h4>
                    <div class="relative">
                        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        <div class="space-y-4">
                            ${product.timeline.map((event, idx) => `
                                <div class="timeline-item ${idx === product.timeline.length - 1 ? 'completed' : ''}">
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-medium text-gray-500 w-16">${event.date}</span>
                                        <span class="text-sm text-gray-700">${event.event}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.querySelector('div > div').classList.add('modal-enter');
}

// 显示对比弹窗
function showCompareModal() {
    const selectedIds = Array.from(state.selectedProducts);
    if (selectedIds.length < 2) {
        alert('请至少选择2个产品进行对比');
        return;
    }
    
    const selectedProducts = selectedIds.map(id => state.products.find(p => p.id === id));
    const modal = document.getElementById('compareModal');
    const content = document.getElementById('compareContent');
    
    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th class="text-left">对比项目</th>
                        ${selectedProducts.map(p => `
                            <th class="product-header">
                                <div class="text-center">
                                    <p class="font-bold">${p.product_name}</p>
                                    <p class="text-xs font-normal text-gray-500">${p.company}</p>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="font-medium">开发阶段</td>
                        ${selectedProducts.map(p => `
                            <td><span class="stage-badge ${getStageClass(p.stage)}">${p.stage}</span></td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">分子类型</td>
                        ${selectedProducts.map(p => `<td>${p.molecule_type}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">给药途径</td>
                        ${selectedProducts.map(p => `<td>${p.route || '-'}</td>`).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">适应症</td>
                        ${selectedProducts.map(p => `
                            <td>
                                <div class="flex flex-wrap gap-1 justify-center">
                                    ${p.indications.map(ind => `<span class="indication-tag">${ind}</span>`).join('')}
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">48周减重</td>
                        ${selectedProducts.map(p => `
                            <td class="font-bold text-biotech-600">
                                ${p.efficacy_data?.weight_loss?.week48 || '-'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">52周减重</td>
                        ${selectedProducts.map(p => `
                            <td class="font-bold text-biotech-600">
                                ${p.efficacy_data?.weight_loss?.week52 || '-'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">NASH缓解率</td>
                        ${selectedProducts.map(p => `
                            <td class="font-bold text-orange-600">
                                ${p.efficacy_data?.nash?.nash_resolution || '-'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">纤维化改善</td>
                        ${selectedProducts.map(p => `
                            <td class="font-bold text-orange-600">
                                ${p.efficacy_data?.nash?.fibrosis_improvement || '-'}
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td class="font-medium">停药率</td>
                        ${selectedProducts.map(p => `
                            <td class="text-red-600">
                                ${p.safety_data?.discontinuation_rate || '-'}
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="mt-6 flex justify-end gap-3">
            <button onclick="clearComparison()" class="btn-secondary">清除选择</button>
            <button onclick="document.getElementById('compareModal').classList.add('hidden')" class="btn-primary">关闭</button>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// 清除对比选择
function clearComparison() {
    state.selectedProducts.clear();
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateCompareButton();
    document.getElementById('compareModal').classList.add('hidden');
}

// 初始化图表
function initCharts() {
    // 阶段分布图
    const stageData = {};
    state.products.forEach(p => {
        stageData[p.stage] = (stageData[p.stage] || 0) + 1;
    });
    
    new Chart(document.getElementById('stageChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(stageData),
            datasets: [{
                data: Object.values(stageData),
                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#6b7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // 适应症分布
    const indicationData = {};
    state.products.forEach(p => {
        p.indications.forEach(ind => {
            indicationData[ind] = (indicationData[ind] || 0) + 1;
        });
    });
    
    new Chart(document.getElementById('indicationChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(indicationData),
            datasets: [{
                label: '产品数量',
                data: Object.values(indicationData),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
    
    // 公司管线数量
    const companyData = {};
    state.products.forEach(p => {
        companyData[p.company] = (companyData[p.company] || 0) + 1;
    });
    
    const sortedCompanies = Object.entries(companyData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    new Chart(document.getElementById('companyChart'), {
        type: 'bar',
        data: {
            labels: sortedCompanies.map(c => c[0]),
            datasets: [{
                label: '管线数量',
                data: sortedCompanies.map(c => c[1]),
                backgroundColor: '#22c55e'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
    
    // 分子类型分布
    const moleculeData = {};
    state.products.forEach(p => {
        const simplified = p.molecule_type.replace(/受体激动剂|激动剂/g, '');
        moleculeData[simplified] = (moleculeData[simplified] || 0) + 1;
    });
    
    new Chart(document.getElementById('moleculeChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(moleculeData),
            datasets: [{
                data: Object.values(moleculeData),
                backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12 } }
            }
        }
    });
}

// 设置事件监听
function setupEventListeners() {
    // 搜索
    document.getElementById('searchInput').addEventListener('input', debounce(filterProducts, 300));
    
    // 筛选器
    ['stageFilter', 'indicationFilter', 'moleculeFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', filterProducts);
    });
    
    // 中国专区按钮
    document.getElementById('chinaFilter').addEventListener('click', (e) => {
        e.target.classList.toggle('china-active');
        filterProducts();
    });
    
    // 清除筛选
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('stageFilter').value = '';
        document.getElementById('indicationFilter').value = '';
        document.getElementById('moleculeFilter').value = '';
        document.getElementById('chinaFilter').classList.remove('china-active');
        filterProducts();
    });
    
    // 视图切换
    document.getElementById('viewToggle').addEventListener('click', () => {
        state.viewMode = state.viewMode === 'table' ? 'card' : 'table';
        document.getElementById('tableView').classList.toggle('hidden', state.viewMode === 'card');
        document.getElementById('cardView').classList.toggle('hidden', state.viewMode === 'table');
        document.getElementById('viewToggle').innerHTML = state.viewMode === 'table' 
            ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> 卡片视图`
            : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> 表格视图`;
    });
    
    // 排序
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortProducts(th.dataset.sort));
    });
    
    // 全选
    document.getElementById('selectAll').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            toggleProductSelection(cb.value, e.target.checked);
        });
    });
    
    // 对比按钮
    document.getElementById('compareBtn').addEventListener('click', showCompareModal);
    
    // 关闭弹窗
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('productModal').classList.add('hidden');
    });
    
    document.getElementById('closeCompareModal').addEventListener('click', () => {
        document.getElementById('compareModal').classList.add('hidden');
    });
    
    // 点击弹窗外部关闭
    ['productModal', 'compareModal'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            if (e.target === document.getElementById(id)) {
                document.getElementById(id).classList.add('hidden');
            }
        });
    });
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('productModal').classList.add('hidden');
            document.getElementById('compareModal').classList.add('hidden');
        }
    });
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

// 显示错误
function showError(message) {
    alert(message);
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
