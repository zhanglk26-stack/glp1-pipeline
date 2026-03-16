import re

# The issue is that the sticky header is stuck inside its container if the container is too tall,
# OR it's being pushed out.
# In index.html, we have:
# <main>
#   <section id="stats">
#   <section id="filters">
#   <section id="table">  <-- Sticky happens HERE.
#
# If we want the header to stay at the top of the VIEWPORT (top-16), it MUST be able to scroll
# relative to the body, OR its container must be the scrolling one.
# Currently the body/window is scrolling.

with open('index.html', 'r') as f:
    idx = f.read()

# 1. Ensure the section and div don't have overflow: visible which I added (actually visible is default)
# But we need to make sure nothing has overflow: hidden or auto.
idx = re.sub(r'style="overflow: visible;"', '', idx)

# 2. Add bg-white and z-index to THEAD as well to make it opaque
idx = idx.replace('<thead>', '<thead class="bg-white z-20">')

# 3. Check if there are any parents with overflow: hidden
# section card etc.

with open('index.html', 'w') as f:
    f.write(idx)

# In predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

pred = re.sub(r'style="overflow: visible;"', '', pred)
pred = pred.replace('<thead>', '<thead class="bg-white z-20">')

with open('predictor.html', 'w') as f:
    f.write(pred)
