import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Look for the updateFilterCount function and remove the trailing garbage
pattern = re.compile(r'function updateFilterCount\(\) \{.*?\}[\s\n]*/ \$\{total\} 款产品`;\n\}', re.DOTALL)
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
    # If the above fails, try a more direct line-by-line replacement for that specific area
    lines = content.split('\n')
    new_lines = []
    skip = False
    for i, line in enumerate(lines):
        if 'function updateFilterCount()' in line:
            new_lines.append('function updateFilterCount() {')
            new_lines.append("    const el = document.getElementById('filterCount');")
            new_lines.append('    if (!el) return;')
            new_lines.append('    const current = state.filteredProducts ? state.filteredProducts.length : 0;')
            new_lines.append('    const total = state.products ? state.products.length : 0;')
            new_lines.append('    el.textContent = `正在显示 ${current} / ${total} 款产品`;')
            new_lines.append('}')
            skip = True
            continue
        if skip:
            if 'function getStageClass' in line:
                new_lines.append('')
                new_lines.append(line)
                skip = False
            continue
        new_lines.append(line)
    content = '\n'.join(new_lines)

with open('js/app.js', 'w') as f:
    f.write(content)
