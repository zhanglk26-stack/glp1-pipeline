import sys

with open('css/style.css', 'r') as f:
    content = f.read()

# Fix .data-table thead th to use sticky
# And ensure background is white and z-index is correct
# Remove position sticky from thead if it exists in html (it's in the html file, not css mostly, but let's check css)

content = content.replace('.data-table thead th {', '.data-table thead th {\n    position: sticky;\n    top: 64px;\n    background: white;\n    z-index: 10;')

# Actually the user complained about misalignment and shifting.
# In the image, the header is shifted DOWN.
# This often happens with border-collapse: collapse and sticky.
# Using border-separate and border-spacing: 0 is better.

with open('css/style.css', 'w') as f:
    f.write(content)
