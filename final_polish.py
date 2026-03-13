import os
import re

def final_polish(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if filepath.endswith('app.js'):
        # 1. Remove empty spans left over from emoji removal
        content = re.sub(r'<span class="multi-target-badge"></span>', '', content)
        content = re.sub(r'<span class="multi-target-badge mb-2 inline-block">\s*多靶点</span>', '<span class="multi-target-badge mb-2 inline-block">多靶点</span>', content)
        
        # 2. Fix table typography to be extremely dark and readable
        # In renderTable, force text-gray-900 and font-bold where needed
        content = content.replace('text-gray-900 font-bold', 'text-gray-900 font-black')
        content = content.replace('text-gray-900 font-medium', 'text-gray-900 font-black text-base')
        content = content.replace('<span class="text-xs text-gray-900">', '<span class="text-sm font-bold text-gray-900 mt-1">')
        content = content.replace('<span class="text-gray-900">', '<span class="text-gray-900 font-bold">')
        
    if filepath.endswith('index.html'):
        # 1. Group Title and Icon together in Data Cards
        # This replaces the previous separate flex layout
        card_pattern = r'<div class="flex items-center gap-2 mb-4 text-gray-900">(.*?)<span class="font-bold text-base">(.*?)</span>\s*</div>'
        
        # Use regex to find and replace the card headers to ensure title and icon are tight
        def card_replacer(match):
            svg = match.group(1).strip()
            title = match.group(2).strip()
            return f'<div class="flex items-center gap-2 mb-4 text-gray-900">\n{svg}\n<span class="font-bold text-base">{title}</span>\n</div>'
            
        content = re.sub(card_pattern, card_replacer, content, flags=re.DOTALL)
        
        # 2. Refactor filters to text only (no emojis, no spans)
        filter_replacements = {
            '<button class="filter-btn" data-filter="multi">\n <span class="text-orange-500"></span> 多靶点\n </button>': '<button class="filter-btn" data-filter="multi">多靶点</button>',
            '<button class="filter-btn" data-filter="gcg">\n <span class="text-orange-500"></span> GCG靶点\n </button>': '<button class="filter-btn" data-filter="gcg">GCG靶点</button>',
            '<button class="filter-btn" data-filter="china">\n <span class="text-pink-500"></span> 中国\n </button>': '<button class="filter-btn" data-filter="china">中国产品</button>'
        }
        
        # To be safe with spacing, use regex for replacing the filter buttons
        content = re.sub(r'<button class="filter-btn" data-filter="multi">\s*<span class="[^"]*"></span>\s*多靶点\s*</button>', '<button class="filter-btn" data-filter="multi">多靶点</button>', content)
        content = re.sub(r'<button class="filter-btn" data-filter="gcg">\s*<span class="[^"]*"></span>\s*GCG靶点\s*</button>', '<button class="filter-btn" data-filter="gcg">GCG靶点</button>', content)
        content = re.sub(r'<button class="filter-btn" data-filter="china">\s*<span class="[^"]*"></span>\s*中国\s*</button>', '<button class="filter-btn" data-filter="china">中国产品</button>', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Polished {filepath}")

base_dir = r"d:\Programs\AI-Workspace\glp1-pipeline"
final_polish(os.path.join(base_dir, 'js', 'app.js'))
final_polish(os.path.join(base_dir, 'index.html'))
