import re

# Fix style.css
with open('css/style.css', 'r') as f:
    css = f.read()

# Update .data-table thead th for better sticky behavior
css = re.sub(r'\.data-table thead th \{[^}]*\}', '''
.data-table thead th {
    position: sticky;
    top: 64px;
    background: white;
    z-index: 20;
    padding: 0.75rem 1rem;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
    box-shadow: inset 0 -2px 0 0 #f1f5f9; /* Better than border-bottom for sticky */
}
''', css)

# Fix predictor specific sticky top
css += '''
.predictor-view .data-table thead th {
    top: 0;
}
'''

with open('css/style.css', 'w') as f:
    f.write(css)

# Fix index.html
with open('index.html', 'r') as f:
    idx = f.read()

# Clean up table header and add data-table class
idx = re.sub(r'<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block">',
             '<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block">', idx)
idx = re.sub(r'<div class="table-container">', '<div class="table-container">', idx)
idx = re.sub(r'<table class="w-full border-separate border-spacing-0 table-fixed text-left">',
             '<table class="w-full border-separate border-spacing-0 table-fixed text-left data-table">', idx)

# Remove all sticky classes from th in index.html that I added before (if any)
idx = re.sub(r'sticky top-16 z-20 bg-white shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\] ', '', idx)
# Remove the inline styles and thead sticky class
idx = re.sub(r'<thead class="sticky top-\[64px\] bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">', '<thead>', idx)
idx = re.sub(r'<thead class="bg-white">', '<thead>', idx)

# Ensure filterCount initial text
idx = idx.replace('正在显示全部数据...', '正在加载数据...')

with open('index.html', 'w') as f:
    f.write(idx)

# Fix predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

pred = re.sub(r'<body class="bg-slate-50 min-h-screen font-sans">', '<body class="bg-slate-50 min-h-screen font-sans predictor-view">', pred)
pred = re.sub(r'<table class="w-full border-separate border-spacing-0 table-fixed text-left">',
              '<table class="w-full border-separate border-spacing-0 table-fixed text-left data-table">', pred)
pred = re.sub(r'sticky top-0 z-20 bg-white shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\] ', '', pred)
pred = re.sub(r'<thead class="sticky top-0 bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">', '<thead>', pred)
pred = re.sub(r'<thead class="bg-white">', '<thead>', pred)

with open('predictor.html', 'w') as f:
    f.write(pred)

# Fix js/app.js
with open('js/app.js', 'r') as f:
    app = f.read()

# Make updateFilterCount more robust
app = re.sub(r'function updateFilterCount\(\) \{.*?\}', '''
function updateFilterCount() {
    const el = document.getElementById('filterCount');
    if (!el) return;
    const current = state.filteredProducts ? state.filteredProducts.length : 0;
    const total = state.products ? state.products.length : 0;
    el.textContent = `正在显示 ${current} / ${total} 款产品`;
}
''', app, flags=re.DOTALL)

with open('js/app.js', 'w') as f:
    f.write(app)
