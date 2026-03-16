import re

with open('js/app.js', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'function updateFilterCount()' in line:
        new_lines.append('function updateFilterCount() {\n')
        new_lines.append("    const el = document.getElementById('filterCount');\n")
        new_lines.append('    if (!el) return;\n')
        new_lines.append('    const current = state.filteredProducts ? state.filteredProducts.length : 0;\n')
        new_lines.append('    const total = state.products ? state.products.length : 0;\n')
        new_lines.append('    el.textContent = `正在显示 ${current} / ${total} 款产品`;\n')
        new_lines.append('}\n')
        skip = True
        continue
    if skip:
        if 'function getStageClass' in line:
            new_lines.append('\n')
            new_lines.append(line)
            skip = False
        continue
    new_lines.append(line)

with open('js/app.js', 'w') as f:
    f.writelines(new_lines)
