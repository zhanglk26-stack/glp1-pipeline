import json

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

original_len = len(data['products'])

# Remove specified products
to_remove = ["Vupanorsen", "Revusiran", "Pelacarsen", "LP-002"]
data['products'] = [p for p in data['products'] if not any(x in p.get('name_cn', '') for x in to_remove)]

removed_len = len(data['products'])

# Also make sure all products have a safe 'administration' field for the new column
for p in data['products']:
    admin = p.get('administration', '注射')
    if '口服' in admin and '注射' in admin:
        admin = '注射/口服'
    elif '口服' in admin or '片' in p.get('name_cn', '') or '胶囊' in p.get('name_cn', ''):
        admin = '口服'
    elif '鼻喷' in admin:
        admin = '鼻喷'
    else:
        admin = '注射'
    p['administration'] = admin

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Removed {original_len - removed_len} products. Normalized administration routes.")
