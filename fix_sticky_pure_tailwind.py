import re

# 1. Clean up css/style.css - remove our previous custom sticky th styles
with open('css/style.css', 'r') as f:
    css = f.read()

css = re.sub(r'\.data-table thead th \{[^}]*\}', '', css)
css = re.sub(r'\.predictor-view \.data-table thead th \{[^}]*\}', '', css)
css = re.sub(r'\.cost-table thead th \{[^}]*\}', '', css)
css = re.sub(r'white-space: nowrap;', '', css) # remove the one I added at bottom too

with open('css/style.css', 'w') as f:
    f.write(css)

# 2. Fix index.html
with open('index.html', 'r') as f:
    idx = f.read()

# Ensure parent has no overflow-hidden that breaks sticky
idx = idx.replace('<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block">',
                  '<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block">')

# Add sticky classes to each TH in the thead
# Pattern to match TH tags and add classes
idx = re.sub(r'<th (class="[^"]*")', r'<th \1 sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]"', idx)

with open('index.html', 'w') as f:
    f.write(idx)

# 3. Fix predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

# Remove overflow-hidden from the section that breaks sticky
pred = pred.replace('<section class="card overflow-hidden">', '<section class="card">')

# Add sticky classes to each TH in predictor.html
# Predictor has no fixed nav so top-0 is correct
pred = re.sub(r'<th (class="[^"]*")', r'<th \1 sticky top-0 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]"', pred)

with open('predictor.html', 'w') as f:
    f.write(pred)
