import re

with open('css/style.css', 'r') as f:
    css = f.read()

# Define the common style for sticky headers
sticky_th_style = '''
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
    box-shadow: inset 0 -2px 0 0 #f1f5f9;
    white-space: nowrap;
}
'''

# Replace any existing .data-table thead th definitions
css = re.sub(r'\.data-table thead th \{[^}]*\}', '', css)
css += sticky_th_style

# Add the predictor override
css += '''
.predictor-view .data-table thead th {
    top: 0;
}
'''

# Clean up multiple newlines
css = re.sub(r'\n{3,}', '\n\n', css)

with open('css/style.css', 'w') as f:
    f.write(css)
