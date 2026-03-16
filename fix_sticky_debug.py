import re

# In index.html, the main table is inside several containers.
# section -> div.table-container -> table -> thead -> tr -> th
# None of the parents should have overflow: hidden or auto if we want it to stick to the body.
# BUT, div.table-container usually has overflow-x: auto for mobile.

with open('index.html', 'r') as f:
    idx = f.read()

# Let's check the container
idx = idx.replace('<div class="table-container">', '<div class="table-container" style="overflow: visible;">')
# And the section
idx = idx.replace('<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block">',
                  '<section class="bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:block" style="overflow: visible;">')

with open('index.html', 'w') as f:
    f.write(idx)

# In predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

pred = pred.replace('<div class="table-container">', '<div class="table-container" style="overflow: visible;">')

with open('predictor.html', 'w') as f:
    f.write(pred)
