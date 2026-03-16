import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Replace the whole corrupted area
# Find the start of updateFilterCount and the end of the corrupted line
pattern = re.compile(r'function updateFilterCount\(\) \{.*?/ \$\{total\} 款产品`;\n\}', re.DOTALL)
clean_func = '''function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = state.filteredProducts ? state.filteredProducts.length : 0;
    const total = state.products ? state.products.length : 0;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}'''

content = pattern.sub(clean_func, content)

with open('js/app.js', 'w') as f:
    f.write(content)
