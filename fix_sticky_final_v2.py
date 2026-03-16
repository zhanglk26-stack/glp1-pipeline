import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Ensure nav is sticky top-0
    content = re.sub(r'<nav([^>]*?)sticky top-\[64px\]', r'<nav\1sticky top-0', content)

    # 2. Ensure table headers are sticky top-[64px]
    # We look for <th class="... sticky ...">
    # Note: the previous script might have already changed them to top-[64px]
    # If they are still top-0, change them.
    content = re.sub(r'<th([^>]*?)sticky top-0', r'<th\1sticky top-[64px]', content)

    with open(filename, 'w') as f:
        f.write(content)

fix_file('index.html')
fix_file('predictor.html')

# Also fix the background color of sticky headers to ensure they aren't transparent
with open('css/style.css', 'a') as f:
    f.write('\n.data-table thead th { background-color: white; z-index: 20; }\n')
