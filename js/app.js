/**
 * GLP-1 Pipeline Tracker - Main Application
 */

// 全局状态
const state = {
    products: [],
    filteredProducts: [],
    sortField: 'approval_date',
    sortDirection: 'desc'
};


// 辅助判断是否为中国企业
function isChineseCompany(company) {
    if (!company) return false;
    const foreign = ['诺和诺德', '礼来', '阿斯利康', '赛诺菲', '勃林格殷格翰', '强生', '默沙东', '葛兰素史克', '诺华', 'Ionis', 'Alnylam', 'Altimmune', '安进', 'vTv', '百特'];
    return !foreign.some(fc => company.includes(fc));
}

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
        state.products = data.products || [];
        state.filteredProducts = [...state.products];
        
        // 初始渲染
        updateStats();
        sortProducts('approval_date', false);
        renderTable();
        initCharts();

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

// 数字动画
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Element ${elementId} not found`);
        return;
    }
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
    if (!container) return;
    
    // 收集所有最新动态并按时间排序
    const updates = [];
    state.products.forEach(product => {
        if (product.latest_update) {
            updates.push({
                product: product.name_cn,
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
                    <p class="text-sm text-gray-900 mt-1">${item.update}</p>
                </div>
                <span class="text-xs text-gray-900 whitespace-nowrap">${item.date || '近期'}</span>
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
    if (!container) return;
    
    const chinaMultiProducts = state.products.filter(p => 
        p.country === 'CN' && ((p.targets && p.targets.length >= 2))
    );
    
    if (chinaMultiProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-900 text-center py-4">暂无数据</p>';
        return;
    }
    
    // 按阶段排序（已上市优先）
    chinaMultiProducts.sort((a, b) => {
        const stageOrder = { '已上市': 0, 'NDA审评中': 1, 'III期临床': 2, 'II期临床': 3 };
        return (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99);
    });
    
    container.innerHTML = chinaMultiProducts.map(product => `
        <div class="bg-white border text-gray-900 border border-gray-900 rounded-lg p-4 hover:border-neon-orange/50 transition cursor-pointer" onclick="showProductDetail('${product.id}')">
            <div class="flex items-start justify-between mb-2">
                <div>
                    <span class="multi-target-badge"> 多靶点</span>
                    ${(product.targets && product.targets.includes('GCGR')) ? '<span class="gcg-badge ml-2">GCG</span>' : ''}
                </div>
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3">
                <span class="text-sm text-gray-900 border border-gray-900 px-1 rounded bg-gray-50">${product.frequency}</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">${product.name_cn}</h3>
            <p class="text-sm text-gray-900 mb-2">${product.company}</p>
            ${product.efficacy_data?.weight_loss?.week48 ? `
                <div class="mt-2 pt-2 border-t border-gray-900">
                    <span class="text-sm font-bold text-gray-900 mt-1">48周减重</span>
                    <span class="text-lg font-bold text-gray-900 font-black ml-2">${product.efficacy_data.weight_loss.week48}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
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
        const hasGCG = (product.targets && product.targets.includes('GCGR'));
        const isChina = isChineseCompany(product.company);
        
        // 确定行样式
        let rowClass = '';
        if (isChina && isMultiTarget) {
            rowClass = 'china-multi-highlight';
        } else if (isMultiTarget) {
            rowClass = 'multi-target-row';
        }
        
        // 获取最佳减重数据
        const wl = product.efficacy_data?.weight_loss;
        const bestWL = wl?.week68 || wl?.week52 || wl?.week48 || wl?.week36 || wl?.week24 || '';
        
        // 动态生成真实的靶点标签
        let targetTagsHtml = '';
        if (product.targets && product.targets.length > 0) {
            targetTagsHtml = product.targets.map(t => `<span class="border border-gray-900 text-gray-900 bg-white px-1 text-[10px] font-bold uppercase tracking-wider">${t.replace('R', '')}</span>`).join('<span class="w-[2px]"></span>');
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
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="text-sm text-gray-900 border border-gray-900 px-1 rounded bg-gray-50">${product.administration || '-'}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="text-sm text-gray-900 border border-gray-900 px-1 rounded bg-gray-50">${product.frequency}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
                ${product.approval_date || '-'}
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${(product.indications || []).slice(0, 2).map(ind => `<span class="text-xs bg-white border border-gray-900 text-gray-900 px-2 py-0.5 rounded">${ind}</span>`).join('')}
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

// 渲染卡片视图
function renderCards() {
    const container = document.getElementById('cardView');
    if (!container) return;
    
    const products = state.filteredProducts;
    
    container.innerHTML = products.map(product => {
        const isMultiTarget = (product.targets && product.targets.length >= 2);
        const hasGCG = (product.targets && product.targets.includes('GCGR'));
        const isChina = isChineseCompany(product.company);
        
        // 确定卡片样式
        let cardClass = 'bg-white border text-gray-900 border border-gray-900 rounded-xl p-5 hover:border-neon-blue/30 transition';
        if (isChina && isMultiTarget) cardClass += ' china-multi-highlight';
        else if (isMultiTarget) cardClass += ' multi-target-card';
        
        // 获取最佳减重数据
        const wl = product.efficacy_data?.weight_loss;
        const bestWL = wl?.week68 || wl?.week52 || wl?.week48 || wl?.week36 || wl?.week24 || '';
        
        // 动态生成真实的靶点标签
        let targetTagsHtml = '';
        if (product.targets && product.targets.length > 0) {
            const isOnlyGLP1 = product.targets.length === 1 && product.targets[0].toUpperCase().includes('GLP-1');
            if (!isOnlyGLP1) {
                targetTagsHtml = product.targets.map(t => `<span class="border border-gray-900 text-gray-900 bg-white px-1 text-[10px] font-bold uppercase tracking-wider">${t.replace('R', '')}</span>`).join('<span class="w-[2px]"></span>');
            }
        }
        
        return `
        <div class="${cardClass}">
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center flex-wrap gap-1">
                    ${targetTagsHtml}
                </div>
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3">
                <span class="text-sm text-gray-900 border border-gray-900 px-1 rounded bg-gray-50">${product.frequency}</span>
            </div>
            
            <h3 class="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors mb-1 inline-block" onclick="showNewsModal(${product.id})">${product.name_cn}</h3>
            <p class="text-sm text-gray-900 mb-3">${product.code_name || ''} · ${product.company}</p>
            
            <div class="mb-3">
                <span class="text-sm font-bold text-gray-900 mt-1">分子类型</span>
                <p class="text-sm text-gray-900">${product.type}</p>
            </div>
            
            ${bestWL !== '-' ? `
                <div class="bg-white border border-gray-900 text-gray-900 rounded-lg p-3 mb-3">
                    <span class="text-sm font-bold text-gray-900 mt-1">最佳减重效果</span>
                    <div class="text-2xl font-bold ${isMultiTarget ? 'text-gray-900 font-black' : 'text-gray-900 font-black'}">${bestWL}</div>
                </div>
            ` : ''}
            
            <div class="flex flex-wrap gap-1 mb-3">
                ${(product.indications || []).slice(0, 3).map(ind => `<span class="text-xs bg-white border border-gray-900 text-gray-900 text-gray-900 px-2 py-1 rounded">${ind}</span>`).join('')}
            </div>
            
            <p class="text-xs text-gray-900 truncate" title="${product.latest_update || ''}">${product.latest_update || '暂无最新进展'}</p>
        </div>
    `}).join('');
}

// 获取国家国旗emoji
function getCountryFlag(country) {
    const flags = {
        'CN': '',
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
    if (stage.includes('III期') || stage.includes('3期')) return 'stage-phase3';
    if (stage.includes('II期')) return 'stage-phase2';
    if (stage.includes('I期')) return 'stage-phase1';
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
    const chinaOnly = false;
    
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
        
        // 中国专区
        const chinaMatch = !chinaOnly || isChineseCompany(product.company);
        
        // 多靶点筛选 (保留兼容)
        const multiTargetMatch = !filterState.multiTarget || (product.targets && product.targets.length >= 2);
        const gcgMatch = !filterState.gcgTarget || (product.targets && product.targets.includes('GCGR'));
        
        return searchMatch && stageMatch && indicationMatch && targetMatch && freqMatch && routeMatch && chinaMatch && multiTargetMatch && gcgMatch;
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
            // "2024年05月..." -> extract just "2024-05" or similar for reliable comparison
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

// 显示产品详情
function showProductDetail(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const content = document.getElementById('modalContent');
    
    document.getElementById('modalTitle').textContent = `${product.name_cn} - 产品详情`;
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-900 mb-1">公司</p>
                    <p class="font-medium text-gray-900">${product.company}</p>
                    <p class="text-xs text-gray-900">${product.company_en || ''}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-900 mb-1">代号</p>
                    <p class="font-medium text-gray-900">${product.code_name || '-'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-900 mb-1">给药途径</p>
                    <p class="font-medium text-gray-900">${product.route || '-'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-xs text-gray-900 mb-1">开发阶段</p>
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
                                    <p class="text-xs text-gray-900 mt-2 text-center">${product.efficacy_data.weight_loss.note}</p>
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
                                    <p class="text-xs text-gray-900">停药率</p>
                                    <p class="text-lg font-semibold text-red-600">${product.safety_data.discontinuation_rate}</p>
                                </div>
                            ` : ''}
                            ${product.safety_data.common_ae ? `
                                <div>
                                    <p class="text-xs text-gray-900 mb-1">常见不良事件</p>
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
                                    <p class="text-xs text-gray-900">${trial.nct} · ${trial.phase}</p>
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
                                <p class="text-xs text-gray-900">${approval.date}</p>
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
                                        <span class="text-sm font-medium text-gray-900 w-16">${event.date}</span>
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

// 霓虹色系配色方案
const neonColorScheme = {
    cyan: '#00f5ff',
    purple: '#bf00ff',
    orange: '#ff9500',
    pink: '#ff00aa',
    green: '#00ff88',
    yellow: '#ffea00',
    red: '#ff3366',
    blue: '#0099ff'
};

const neonPalette = [
    neonColorScheme.cyan,
    neonColorScheme.purple,
    neonColorScheme.orange,
    neonColorScheme.pink,
    neonColorScheme.green,
    neonColorScheme.yellow,
    neonColorScheme.red,
    neonColorScheme.blue
];

// 初始化图表
function initCharts() {
    try {
    // 设置Chart.js深色主题默认值
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.backgroundColor = 'transparent';
    
    // 阶段分布图
    const stageData = {};
    state.products.forEach(p => {
        stageData[p.stage] = (stageData[p.stage] || 0) + 1;
    });
    
    document.getElementById('stageChart') && new Chart(document.getElementById('stageChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(stageData),
            datasets: [{
                data: Object.values(stageData),
                backgroundColor: neonPalette,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            },
            cutout: '60%'
        }
    });
    
    // 适应症分布
    const indicationData = {};
    state.products.forEach(p => {
        p.indications.forEach(ind => {
            indicationData[ind] = (indicationData[ind] || 0) + 1;
        });
    });
    
    document.getElementById('typeChart') && new Chart(document.getElementById('typeChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(indicationData),
            datasets: [{
                label: '产品数量',
                data: Object.values(indicationData),
                backgroundColor: neonColorScheme.cyan,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { 
                        stepSize: 1,
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
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
    
    document.getElementById('companyChart') && new Chart(document.getElementById('companyChart'), {
        type: 'bar',
        data: {
            labels: sortedCompanies.map(c => c[0]),
            datasets: [{
                label: '管线数量',
                data: sortedCompanies.map(c => c[1]),
                backgroundColor: neonColorScheme.purple
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
        const simplified = p.type.replace(/受体激动剂|激动剂/g, '');
        moleculeData[simplified] = (moleculeData[simplified] || 0) + 1;
    });
    
    document.getElementById('moleculeChart') && new Chart(document.getElementById('moleculeChart'), {
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
    
    // 靶点分布
    const targetData = { '单靶点(GLP-1)': 0, '双靶点': 0, '三靶点': 0 };
    state.products.forEach(p => {
        if ((p.target_count || (p.targets ? p.targets.length : 0)) === 1) targetData['单靶点(GLP-1)']++;
        else if ((p.target_count || (p.targets ? p.targets.length : 0)) === 2) targetData['双靶点']++;
        else if ((p.target_count || (p.targets ? p.targets.length : 0)) === 3) targetData['三靶点']++;
    });
    
    document.getElementById('targetChart') && new Chart(document.getElementById('targetChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(targetData),
            datasets: [{
                data: Object.values(targetData),
                backgroundColor: ['#3b82f6', '#f59e0b', '#ec4899']
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
    } catch(e) { console.warn('Charts init skipped:', e.message); }
}

// 设置事件监听
function setupEventListeners() {
    // 搜索
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterProducts, 300));
    
    // 筛选器
    // 阶段和适应症多选
    document.querySelectorAll('.stage-cb, .ind-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    
    // 靶点多选
    document.querySelectorAll('.target-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    
    // 给药周期多选
    document.querySelectorAll('.freq-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    
    // 给药途径多选
    document.querySelectorAll('.route-cb').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });
    
    // 清除筛选
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.stage-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.ind-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.target-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.freq-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.route-cb').forEach(cb => cb.checked = false);
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
        document.getElementById(id)?.addEventListener('click', (e) => {
            if (e.target === document.getElementById(id)) {
                document.getElementById(id).classList.add('hidden');
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
    
    document.getElementById('newsModalTitle').textContent = `${product.name_cn} - 最新相关新闻`;
    const content = document.getElementById('newsModalContent');
    
    if (!product.news || product.news.length === 0) {
        content.innerHTML = `
            <div class="py-8 text-center text-gray-500">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 2v4a2 2 0 002 2h4"></path></svg>
                <p>暂无相关新闻或正在获取中...</p>
            </div>
        `;
    } else {
        content.innerHTML = product.news.map((n, idx) => `
            <a href="${n.url}" target="_blank" rel="noopener noreferrer" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm bg-white transition group">
                <h4 class="font-semibold text-blue-700 group-hover:text-blue-800 mb-1 leading-snug">${n.title}</h4>
                <div class="flex items-center text-xs text-gray-500 mt-2">
                    <span class="mr-3 font-medium bg-gray-100 px-2 py-0.5 rounded">${n.source || '来源未知'}</span>
                    <span>${n.date || ''}</span>
                </div>
            </a>
        `).join('');
    }
    
    document.getElementById('newsModal').classList.remove('hidden');
    document.getElementById('newsModal').querySelector('div').classList.add('scale-100', 'opacity-100');
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
