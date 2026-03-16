import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Fix the corrupted updateFilterCount function and any other duplicates
# We'll search for the whole block and replace it cleanly.
pattern = re.compile(r'function updateFilterCount\(\) \{.*?\}[\s\n]*/ \$\{state\.products\.length\} 款产品`;\n\}', re.DOTALL)
clean_func = '''function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = state.filteredProducts ? state.filteredProducts.length : 0;
    const total = state.products ? state.products.length : 0;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}'''

if pattern.search(content):
    content = pattern.sub(clean_func, content)
else:
    # If not found exactly like that, try a simpler replace for the corrupted part
    content = re.sub(r'function updateFilterCount\(\) \{.*?\}', clean_func, content, count=1, flags=re.DOTALL)
    content = re.sub(r'/ \$\{state\.products\.length\} 款产品`;\n\}', '', content)

with open('js/app.js', 'w') as f:
    f.write(content)
