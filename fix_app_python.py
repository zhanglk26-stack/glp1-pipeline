import os

def fix_app_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Inject isChineseCompany
    chinese_logic = """
// 辅助判断是否为中国企业
function isChineseCompany(company) {
    if (!company) return false;
    const foreign = ['诺和诺德', '礼来', '阿斯利康', '赛诺菲', '勃林格殷格翰', '强生', '默沙东', '葛兰素史克', '诺华', 'Ionis', 'Alnylam', 'Altimmune', '安进', 'vTv', '百特'];
    return !foreign.some(fc => company.includes(fc));
}
"""
    if "isChineseCompany" not in content:
        content = content.replace("// 阶段排序权重", chinese_logic + "\n// 阶段排序权重")
        
    # Replace china count logic
    content = content.replace("const china = products.filter(p => p.country === 'CN').length;", "const china = products.filter(p => isChineseCompany(p.company)).length;")
    content = content.replace("const isChina = product.country === 'CN';", "const isChina = isChineseCompany(product.company);")
    content = content.replace("const chinaMatch = !chinaOnly || product.country === 'CN';", "const chinaMatch = !chinaOnly || isChineseCompany(product.company);")
    
    # Remove old button listeners logic
    old_buttons = """    // 中国专区按钮
    document.getElementById('chinaFilter')?.addEventListener('click', (e) => {
        e.target.classList.toggle('china-active');
        filterProducts();
    });
    
    // 多靶点筛选按钮
    document.getElementById('multiTargetFilter')?.addEventListener('click', (e) => {
        filterState.multiTarget = !filterState.multiTarget;
        e.target.classList.toggle('active', filterState.multiTarget);
        filterProducts();
    });
    
    // GCG靶点筛选按钮
    document.getElementById('gcgFilter')?.addEventListener('click', (e) => {
        filterState.gcgTarget = !filterState.gcgTarget;
        e.target.classList.toggle('active', filterState.gcgTarget);
        filterProducts();
    });"""
    content = content.replace(old_buttons, "")
    
    # Update clear filter logic
    clear_logic_old = """    // 清除筛选
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('stageFilter').value = '';
        document.getElementById('indicationFilter').value = '';
        document.getElementById('moleculeFilter').value = '';
        document.getElementById('chinaFilter').classList.remove('china-active');
        document.getElementById('multiTargetFilter').classList.remove('active');
        document.getElementById('gcgFilter').classList.remove('active');
        filterState.multiTarget = false;
        filterState.gcgTarget = false;
        filterProducts();
    });"""
    
    clear_logic_new = """    // 清除筛选
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const stageFilter = document.getElementById('stageFilter');
        if (stageFilter) stageFilter.value = '';
        const indicationFilter = document.getElementById('indicationFilter');
        if (indicationFilter) indicationFilter.value = '';
        const moleculeFilter = document.getElementById('moleculeFilter');
        if (moleculeFilter) moleculeFilter.value = '';
        filterProducts();
    });"""
    content = content.replace(clear_logic_old, clear_logic_new)
    
    # Fix filters failing to read chinaOnly
    content = content.replace("const chinaOnly = document.getElementById('chinaFilter').classList.contains('china-active');", "const chinaOnly = false;")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_app_js(r"d:\Programs\AI-Workspace\glp1-pipeline\js\app.js")
