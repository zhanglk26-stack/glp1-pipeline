import json

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for p in data['products']:
    name = p.get('name_cn', '')
    admin = p.get('administration', '')
    if not admin:  # If it somehow got wiped or wasn't set
        admin = '注射'
        
    if '口服' in name or '片' in name or '胶囊' in name or 'SYH2086' in name:
        p['administration'] = '口服'
        count += 1
    elif '鼻喷' in name:
        p['administration'] = '其他'

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Fixed {count} oral products.")
