import re

# Fix index.html
with open('index.html', 'r') as f:
    idx = f.read()

# Add data-table class to the table
idx = re.sub(r'<table class="w-full border-separate border-spacing-0 table-fixed text-left">',
             '<table class="w-full border-separate border-spacing-0 table-fixed text-left data-table">', idx)

# Remove the thead sticky classes and rely on CSS for th sticky
idx = re.sub(r'<thead class="sticky top-\[64px\] bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">', '<thead>', idx)

with open('index.html', 'w') as f:
    f.write(idx)

# Fix predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

# Add predictor-view class to body
pred = re.sub(r'<body class="bg-slate-50 min-h-screen font-sans">', '<body class="bg-slate-50 min-h-screen font-sans predictor-view">', pred)

# Add data-table class to the table
pred = re.sub(r'<table class="w-full border-separate border-spacing-0 table-fixed text-left">',
              '<table class="w-full border-separate border-spacing-0 table-fixed text-left data-table">', pred)

# Remove the thead sticky classes
pred = re.sub(r'<thead class="sticky top-0 bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">', '<thead>', pred)

with open('predictor.html', 'w') as f:
    f.write(pred)
