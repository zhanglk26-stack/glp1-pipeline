import json

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

changes = []

for product in data['products']:
    name = product.get('name_cn', '')
    
    # 1. BGM0504 target correction
    if "BGM0504" in name:
        old_targets = product.get('targets', [])
        if "GIPR" not in old_targets:
            product['targets'] = ["GLP-1R", "GIPR"]
            changes.append(f"- 【靶点修正】{name}: 补充了缺失的 GIPR 靶点 (现为 GLP-1R, GIPR 双靶点)")
            
    # 2. SYH9017 frequency correction
    if "SYH9017" in name:
        if product.get('frequency') != "月":
            product['frequency'] = "月"
            changes.append(f"- 【给药周期修正】{name}: 从'周'修正为'月' (该产品为每月一次长效制剂)")
            
    # 3. SYH2086 frequency correction
    if "SYH2086" in name:
        if product.get('frequency') != "天":
            product['frequency'] = "天"
            changes.append(f"- 【给药周期修正】{name}: 从'周'修正为'天' (该产品为小分子口服每日一次)")

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n".join(changes))
