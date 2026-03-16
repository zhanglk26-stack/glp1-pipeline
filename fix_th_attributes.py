import re

def clean_th(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Pattern to match the messy th tags
    # <th class="... " sticky top-[64px] z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]"
    # Note the extra double quotes and attributes outside the class

    def replacer(match):
        base_classes = match.group(1).strip()
        # Clean up any trailing quotes in the base classes
        base_classes = base_classes.rstrip('"')

        # New classes to add
        new_classes = "sticky top-[64px] z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]"

        return f'<th class="{base_classes} {new_classes}"'

    # This regex is a bit specific to the mess I made
    pattern = r'<th class="([^"]*?)"\s+sticky top-\[64px\] z-20 bg-white shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]"'
    content = re.sub(pattern, replacer, content)

    with open(filename, 'w') as f:
        f.write(content)

clean_th('index.html')
clean_th('predictor.html')
