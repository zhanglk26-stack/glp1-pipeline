import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Fix the specific corrupted function
pattern = r'function updateFilterCount\(\) \{.*?\} / \$\{total\} 款产品`;\s*\}'
replacement = '''function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = (state.filteredProducts || []).length;
    const total = (state.products || []).length;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}'''

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('js/app.js', 'w') as f:
    f.write(content)
