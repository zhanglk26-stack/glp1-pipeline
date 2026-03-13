import json
import re

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for product in data['products']:
    stage = product.get('stage', '')
    if not product.get('approval_date') or product.get('approval_date') == '-':
        if stage == 'NDA审评中':
            product['approval_date'] = "预计2025年-2026年"
        elif stage == 'III期临床':
            product['approval_date'] = "预计2026年-2027年"
        elif stage == 'II期临床':
            product['approval_date'] = "预计2028年以后"
        elif stage == 'I期临床':
            product['approval_date'] = "预计2029年以后"
        elif stage == '临床前':
            product['approval_date'] = "预计2030年以后"

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Update CSS for latest update text (app.js limits it with truncate instead of line-clamp)
app_js_path = r"d:\Programs\AI-Workspace\glp1-pipeline\js\app.js"
with open(app_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change 'truncate' to 'line-clamp-3 hover:line-clamp-none'
# Replace specific row rendering block
content = content.replace('max-w-xs truncate" title="${product.latest_update', 'max-w-xs overflow-hidden display-webkit-box webkit-box-orient-vertical webkit-line-clamp-3 hover:webkit-line-clamp-none" style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; cursor: help;" title="${product.latest_update')

# Update sorting logic in app.js
# The current extractEarliestDateStr returns 999999 when there are no digits
# For "预计2026年预计2026年", matchAll will catch 2026 and default to month 12. So returning '202612'
# This works! But we must make sure all standard values are evaluated correctly against the sort.
# A small tweak to ensure stages matter first
sort_block_old = """    state.filteredProducts.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (field === 'stage') {
            valA = stageWeights[valA] || 0;
            valB = stageWeights[valB] || 0;
        } else if (field === 'efficacy_data.weight_loss.week48') {
            valA = a.efficacy_data?.weight_loss?.week48 ? parseFloat(a.efficacy_data.weight_loss.week48) : 0;
            valB = b.efficacy_data?.weight_loss?.week48 ? parseFloat(b.efficacy_data.weight_loss.week48) : 0;
        } else if (field === 'approval_date') {
            // First sort by stage (已上市 at the top)
            const stageA = stageWeights[a.stage] || 0;
            const stageB = stageWeights[b.stage] || 0;
            if (stageA !== stageB) {"""

sort_block_new = """    state.filteredProducts.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        if (field === 'stage') {
            valA = stageWeights[valA] || 0;
            valB = stageWeights[valB] || 0;
        } else if (field === 'efficacy_data.weight_loss.week48') {
            valA = a.efficacy_data?.weight_loss?.week48 ? parseFloat(a.efficacy_data.weight_loss.week48) : 0;
            valB = b.efficacy_data?.weight_loss?.week48 ? parseFloat(b.efficacy_data.weight_loss.week48) : 0;
        } else if (field === 'approval_date') {
            // For general sorting, prioritize stage hierarchy
            const stageA = stageWeights[a.stage] || 0;
            const stageB = stageWeights[b.stage] || 0;
            if (stageA !== stageB) {"""
            
content = content.replace(sort_block_old, sort_block_new)

with open(app_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Projected approval dates added and CSS layout modified.")
