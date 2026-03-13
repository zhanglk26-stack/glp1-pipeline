import os

def fix_app_js_approval(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Table Render
    table_render_old = """            <td class="px-4 py-3">
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3">
                <span class="font-bold ${isMultiTarget ? 'text-gray-900 font-black' : 'text-gray-900 font-black'}">${bestWL}</span>
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${(product.indications || []).slice(0, 2).map(ind => `<span class="text-xs bg-white border border-gray-900 text-gray-900 px-2 py-0.5 rounded">${ind}</span>`).join('')}
                </div>
            </td>"""
    
    table_render_new = """            <td class="px-4 py-3">
                <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
            </td>
            <td class="px-4 py-3">
                <span class="font-bold text-gray-900 font-black">${bestWL}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">
                ${product.stage === '已上市' ? (product.approval_date || '-') : '-'}
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${(product.indications || []).slice(0, 2).map(ind => `<span class="text-xs bg-white border border-gray-900 text-gray-900 px-2 py-0.5 rounded">${ind}</span>`).join('')}
                </div>
            </td>"""
            
    content = content.replace(table_render_old, table_render_new)

    # 2. Add custom Date Sorting Logic and Set Default Sort
    # The default state at the top.
    content = content.replace("sortField: null,", "sortField: 'approval_date',\n    sortDirection: 'asc',")

    # 3. Modify Sort functionality to support default oldest approval date.
    sort_old = """function sortProducts(field, toggle = true) {
    if (toggle) {
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = 'desc'; // 默认降序
        }
    }
    
    // 更新表头图标
    document.querySelectorAll('th[data-sort] .sort-icon').forEach(icon => {
        icon.textContent = '↕';
    });
    const currentTh = document.querySelector(`th[data-sort="${field}"]`);
    if (currentTh) {
        currentTh.querySelector('.sort-icon').textContent = state.sortDirection === 'asc' ? '↑' : '↓';
    }
    
    state.filteredProducts.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (field === 'stage') {
            valA = stageWeights[valA] || 0;
            valB = stageWeights[valB] || 0;
        } else if (field === 'efficacy_data.weight_loss.week48') {
            valA = valA ? parseFloat(valA) : 0;
            valB = valB ? parseFloat(valB) : 0;
        }
        
        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}"""

    sort_new = """function sortProducts(field, toggle = true) {
    if (toggle) {
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = field === 'approval_date' ? 'asc' : 'desc'; // 默认降序，上市时间默认升序(最早的在前面)
        }
    }
    
    // 更新表头图标
    document.querySelectorAll('th[data-sort] .sort-icon').forEach(icon => {
        icon.textContent = '↕';
    });
    const currentTh = document.querySelector(`th[data-sort="${field}"]`);
    if (currentTh) {
        currentTh.querySelector('.sort-icon').textContent = state.sortDirection === 'asc' ? '↑' : '↓';
    }
    
    state.filteredProducts.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (field === 'stage') {
            valA = stageWeights[valA] || 0;
            valB = stageWeights[valB] || 0;
        } else if (field === 'efficacy_data.weight_loss.week48') {
            valA = a.efficacy_data?.weight_loss?.week48 ? parseFloat(a.efficacy_data.weight_loss.week48) : 0;
            valB = b.efficacy_data?.weight_loss?.week48 ? parseFloat(b.efficacy_data.weight_loss.week48) : 0;
        } else if (field === 'approval_date') {
            // First sort by stage (已上市 at the top)
            const stageA = stageWeights[a.stage] || 0;
            const stageB = stageWeights[b.stage] || 0;
            if (stageA !== stageB) {
                return stageA > stageB ? -1 : 1; 
            }
            // For 已上市, sort by approval year/date
            const dateA = a.approval_date ? parseInt(a.approval_date.match(/\d{4}/)?.[0] || '9999') : 9999;
            const dateB = b.approval_date ? parseInt(b.approval_date.match(/\d{4}/)?.[0] || '9999') : 9999;
            valA = dateA;
            valB = dateB;
        }
        
        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}"""
    content = content.replace(sort_old, sort_new)
    
    # Run sort initially when displaying the table.
    content = content.replace("state.filteredProducts = [...state.products];", "state.filteredProducts = [...state.products];\n        sortProducts('approval_date', false);")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_app_js_approval(r"d:\Programs\AI-Workspace\glp1-pipeline\js\app.js")
