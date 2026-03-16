import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Remove the corrupted line and the duplicate function parts
pattern = re.compile(r'function updateFilterCount\(\) \{.*?\}[\s\n]*/ \$\{state\.products\.length\} 款产品`;\n\}', re.DOTALL)
content = pattern.sub('''function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = state.filteredProducts ? state.filteredProducts.length : 0;
    const total = state.products ? state.products.length : 0;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}''', content)

with open('js/app.js', 'w') as f:
    f.write(content)
