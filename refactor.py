import os
import re

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Tailwind config replacement
    old_config = r"colors:\s*\{\s*dark:\s*\{[^}]+\},\s*neon:\s*\{[^}]+\}\s*\}"
    new_config = """colors: {
                        primary: {
                            50: '#eff6ff',
                            100: '#dbeafe',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                            900: '#1e3a8a',
                        },
                        biotech: {
                            50: '#f0fdf4',
                            100: '#dcfce7',
                            500: '#22c55e',
                            600: '#16a34a',
                            700: '#15803d',
                        }
                    }"""
    content = re.sub(old_config, new_config, content, flags=re.DOTALL)

    # Class replacements
    replacements = {
        'bg-dark-900': 'bg-gray-50',
        'bg-dark-800': 'bg-white',
        'bg-dark-700': 'bg-white',
        'bg-dark-600': 'bg-gray-100',
        'border-dark-500': 'border-gray-200',
        'text-white': 'text-gray-900',
        'text-gray-400': 'text-gray-500',
        'text-gray-300': 'text-gray-700',
        'text-neon-blue': 'text-primary-600',
        'text-neon-green': 'text-biotech-600',
        'text-neon-orange': 'text-orange-500',
        'text-neon-purple': 'text-purple-600',
        'text-neon-pink': 'text-pink-500',
        'from-neon-blue': 'from-primary-500',
        'to-neon-purple': 'to-primary-700',
        'from-neon-orange': 'from-orange-400',
        'to-yellow-500': 'to-orange-500',
        'bg-neon-blue/10': 'bg-primary-50',
        'bg-neon-green/10': 'bg-biotech-50',
        'bg-neon-orange/10': 'bg-orange-50',
        'bg-neon-pink/10': 'bg-pink-50',
        'hover:text-white': 'hover:text-primary-600',
        'shadow-neon-blue/30': 'shadow-primary-500/30'
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # Some specific fixes
    content = content.replace('text-dark-900', 'text-white') # Text on primary buttons
    content = content.replace('bg-gradient-to-r from-white via-gray-200 to-gray-400', 'text-gray-900') # Hero title 1
    content = content.replace('bg-clip-text text-transparent', '') # Remove gradient text for cleaner look
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {filepath}")

if __name__ == '__main__':
    base_dir = r"d:\Programs\AI-Workspace\glp1-pipeline"
    refactor_file(os.path.join(base_dir, 'index.html'))
    refactor_file(os.path.join(base_dir, 'predictor.html'))
