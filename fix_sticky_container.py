import re

# To make sticky headers work when the parent is not the body,
# the parent container MUST be the scrolling one, OR we fix the body scroll.
# Another way is to make the table-container have a max-height and overflow-y: auto.

with open('index.html', 'r') as f:
    idx = f.read()

# Try giving the table container a max-height and internal scrolling
# This is often safer for sticky headers in complex layouts.
idx = idx.replace('<div class="table-container">', '<div class="table-container" style="max-height: 80vh; overflow-y: auto;">')
# Change top-16 to top-0 because it now sticks to its scrolling parent
idx = re.sub(r'top-16', 'top-0', idx)

with open('index.html', 'w') as f:
    f.write(idx)

# Same for predictor
with open('predictor.html', 'r') as f:
    pred = f.read()

pred = pred.replace('<div class="table-container">', '<div class="table-container" style="max-height: 60vh; overflow-y: auto;">')

with open('predictor.html', 'w') as f:
    f.write(pred)
