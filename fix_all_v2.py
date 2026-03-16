import re

# 1. Fix js/app.js
with open('js/app.js', 'r') as f:
    app = f.read()

# Make updateFilterCount more robust
new_update_count = '''function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = (state.filteredProducts || []).length;
    const total = (state.products || []).length;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}'''
app = re.sub(r'function updateFilterCount\(\) \{.*?\}', new_update_count, app, flags=re.DOTALL)

with open('js/app.js', 'w') as f:
    f.write(app)

# 2. Fix index.html
with open('index.html', 'r') as f:
    idx = f.read()

# Remove the max-height and overflow styles I added
idx = idx.replace(' style="max-height: 80vh; overflow-y: auto;"', '')
idx = idx.replace(' style="overflow: visible;"', '')

# Fix sticky headers in index.html
# Use top-[64px] to match the h-16 (64px) nav bar
idx = re.sub(r'sticky top-0', 'sticky top-[64px]', idx)

with open('index.html', 'w') as f:
    f.write(idx)

# 3. Fix predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

# Remove the max-height and overflow styles
pred = pred.replace(' style="max-height: 60vh; overflow-y: auto;"', '')
pred = pred.replace(' style="overflow: visible;"', '')

# For predictor, top-0 is likely correct if there's no fixed nav,
# but let's check if it has a nav.
# Predictor also has the same nav: <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
# So it ALSO needs top-[64px] if it's supposed to stick below the nav.
pred = re.sub(r'sticky top-0', 'sticky top-[64px]', pred)

with open('predictor.html', 'w') as f:
    f.write(pred)

# 4. Clean up style.css
with open('css/style.css', 'r') as f:
    css = f.read()

# Ensure no conflicting sticky styles
css = re.sub(r'\.data-table thead th \{[^}]*\}', '', css)
css = re.sub(r'\.predictor-view \.data-table thead th \{[^}]*\}', '', css)

with open('css/style.css', 'w') as f:
    f.write(css)
