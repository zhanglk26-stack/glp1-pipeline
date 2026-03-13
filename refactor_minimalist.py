import os
import re

def refactor_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove custom tailwind config script block entirely
    content = re.sub(r'<script>\s*tailwind\.config\s*=\s*\{.*?</script>', '', content, flags=re.DOTALL)
    
    # 2. Replace body tag
    content = re.sub(r'<body[^>]*>', '<body class="bg-white text-gray-900 font-sans min-h-screen">', content)
    
    # 3. Replace all colorful text with either gray-900 (black) or blue-600
    color_replacements = {
        'text-gray-500': 'text-gray-900',
        'text-gray-400': 'text-gray-900',
        'text-gray-600': 'text-gray-900',
        'text-gray-700': 'text-gray-900',
        'bg-gray-50': 'bg-white',
        'bg-gray-100': 'bg-white',
        'bg-gray-200': 'bg-white',
        'text-primary-600': 'text-blue-600',
        'text-primary-700': 'text-blue-600',
        'text-primary-500': 'text-blue-600',
        'bg-primary-50': 'bg-white',
        'bg-primary-100': 'bg-white',
        'bg-biotech-50': 'bg-white',
        'bg-biotech-100': 'bg-white',
        'text-biotech-600': 'text-gray-900',
        'border-primary-600': 'border-blue-600',
        'border-primary-200': 'border-gray-200',
    }
    
    for old, new in color_replacements.items():
        content = content.replace(old, new)

    # 4. Remove all gradients and shadows
    content = re.sub(r'bg-gradient-to-[a-z]+', '', content)
    content = re.sub(r'from-[a-z]+-[0-9]+(/[0-9]+)?', '', content)
    content = re.sub(r'via-[a-z]+-[0-9]+(/[0-9]+)?', '', content)
    content = re.sub(r'to-[a-z]+-[0-9]+(/[0-9]+)?', '', content)
    content = re.sub(r'shadow-[a-z]+', '', content)
    content = re.sub(r'hover:shadow-[a-z]+', '', content)
    content = re.sub(r'blur-[0-9a-z]+', '', content)
    content = re.sub(r'bg-opacity-[0-9]+', '', content)
    content = re.sub(r'backdrop-blur-[a-z]+', '', content)
    
    # Clean up double spaces created by regex replacements
    content = re.sub(r'\s{2,}', ' ', content)
    
    # 5. Replace Navigation exactly
    nav_pattern = r'<nav.*?</nav>'
    
    # Navigation HTML (minimalist)
    nav_html = """
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-xl text-gray-900">GLP-1 <span class="text-blue-600">Pipeline</span></span>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    <a href="index.html" class="text-gray-900 hover:text-blue-600 font-bold transition-colors">概览与数据库</a>
                    <a href="predictor.html" class="text-gray-900 hover:text-blue-600 font-bold transition-colors">智能匹配</a>
                    <a href="about.html" class="text-gray-900 hover:text-blue-600 font-bold transition-colors">关于</a>
                </div>
                """
    
    if "index.html" in filepath:
        nav_html += """
                <button id="compareBtn" class="hidden md:flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded hover:bg-blue-600 hover:text-white transition-colors">
                    对比 (<span id="compareCount">0</span>)
                </button>
        """
    else:
        nav_html += """
                <div class="w-24"></div> <!-- Placeholder for alignment -->
        """
        
    nav_html += """
            </div>
        </div>
    </nav>
    """
    
    content = re.sub(nav_pattern, nav_html, content, flags=re.DOTALL)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Minimalist refactored {filepath}")

base_dir = r"d:\Programs\AI-Workspace\glp1-pipeline"
refactor_html(os.path.join(base_dir, 'index.html'))
refactor_html(os.path.join(base_dir, 'about.html'))
refactor_html(os.path.join(base_dir, 'predictor.html'))
