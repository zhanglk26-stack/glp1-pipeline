import os
import re

def strip_emojis(text):
    # A simple but effective way without external libraries is to just remove specific characters
    # Or characters in the surrogate range/emoji ranges.
    # We'll remove common emojis found in this project.
    emojis = ['🧮', '🏆', '🇨🇳', '🌐', '🎯', '🚀', '✅', '📊', '📝', '🤝', '📄', '📧', '🐛', '🔴', '🟠', '🟡', '🔵', '💡', '⚠️', '📋', '⚡', '💊', '✨']
    for e in emojis:
        text = text.replace(e, '')
    return text

def fix_app_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Darker colors for text
    color_replacements = {
        'text-gray-300': 'text-gray-900',
        'text-gray-400': 'text-gray-900',
        'text-gray-500': 'text-gray-900',
        'text-white': 'text-gray-900',
        'text-neon-orange': 'text-gray-900 font-bold',
        'text-neon-green': 'text-gray-900 font-bold',
        'text-neon-blue': 'text-gray-900',
        'bg-dark-600': 'bg-white border border-gray-900 text-gray-900',
        'bg-dark-700': 'bg-white border text-gray-900',
        'border-dark-500': 'border-gray-900',
        'bg-neon-blue': 'bg-gray-900', # Checkboxes and active items
        'focus:ring-neon-blue': 'focus:ring-gray-900',
        'border-gray-300': 'border-gray-900 border-2',
    }
    
    for old, new in color_replacements.items():
        content = content.replace(old, new)
        
    content = strip_emojis(content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed app.js")

def fix_html_files(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = strip_emojis(content)
    
    # Rebuild overview section in index.html for black/white icon + title
    if 'id="overview"' in content:
        overview_html = """
        <section id="overview" class="mb-12">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <!-- Data Card 1 -->
                <div class="card p-5 border-2 border-gray-900">
                    <div class="flex items-center gap-2 mb-4 text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                        </svg>
                        <span class="font-bold text-base">总产品数</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-4xl font-black text-gray-900" id="totalProducts">--</div>
                        <span class="text-gray-900 font-bold text-sm">款</span>
                    </div>
                </div>
                
                <!-- Data Card 2 -->
                <div class="card p-5 border-2 border-gray-900">
                    <div class="flex items-center gap-2 mb-4 text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="font-bold text-base">已上市</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-4xl font-black text-gray-900" id="approvedCount">--</div>
                        <span class="text-gray-900 font-bold text-sm">款</span>
                    </div>
                </div>

                <!-- Data Card 3 -->
                <div class="card p-5 border-2 border-gray-900">
                    <div class="flex items-center gap-2 mb-4 text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        <span class="font-bold text-base">多靶点</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-4xl font-black text-gray-900" id="multiTargetCount">--</div>
                        <span class="text-gray-900 font-bold text-sm">款</span>
                    </div>
                </div>

                <!-- Data Card 4 -->
                <div class="card p-5 border-2 border-gray-900">
                    <div class="flex items-center gap-2 mb-4 text-gray-900">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="font-bold text-base">中国产品</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-4xl font-black text-gray-900" id="chinaCount">--</div>
                        <span class="text-gray-900 font-bold text-sm">款</span>
                    </div>
                </div>
            </div>
        </section>
        """
        # We need to carefully replace the existing overview section
        content = re.sub(r'<section id="overview" class="mb-12">.*?</section>', overview_html, content, flags=re.DOTALL)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

base_dir = r"d:\Programs\AI-Workspace\glp1-pipeline"
fix_app_js(os.path.join(base_dir, 'js', 'app.js'))
fix_html_files(os.path.join(base_dir, 'index.html'))
fix_html_files(os.path.join(base_dir, 'about.html'))
fix_html_files(os.path.join(base_dir, 'predictor.html'))
