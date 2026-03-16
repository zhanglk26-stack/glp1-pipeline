import re

def fix_predictor_nav(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Ensure nav is sticky top-0
    content = re.sub(r'<nav class="([^"]*?)sticky top-\[64px\]', r'<nav class="\1sticky top-0', content)

    with open(filename, 'w') as f:
        f.write(content)

fix_predictor_nav('predictor.html')
