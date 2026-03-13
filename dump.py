import json
data = json.load(open('d:/Programs/AI-Workspace/glp1-pipeline/data/pipeline.json', encoding='utf-8'))
lines = []
for p in data['products']:
    targets = ','.join(p.get('targets', []))
    freq = p.get('frequency', '未知')
    lines.append(f"{p['name_cn']} ({p['company']}): 靶点:{targets}, 频率:{freq}")
open('d:/Programs/AI-Workspace/glp1-pipeline/dump_drugs.txt', 'w', encoding='utf-8').write('\n'.join(lines))
