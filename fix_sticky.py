import re

def fix_file(filename, sticky_top):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Remove sticky from thead and its shadow/bg classes that should be on th
    # index.html has: <thead class="sticky top-[64px] bg-white z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
    # predictor.html has: <thead class="sticky top-0 bg-white z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">

    # First, simplify the thead
    content = re.sub(r'<thead class="sticky top-\[?\w+\]? bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">', '<thead>', content)

    # Second, add the necessary classes to each th
    # We use Tailwind classes for sticky and top.
    # top-16 is 64px.
    top_class = f"top-{sticky_top // 4}" if sticky_top > 0 else "top-0"

    # We'll find each <tr> inside <thead> and add the classes to its <th> children
    # This is a bit tricky with regex, so let's do it per file or more simply.

    return content

# Manual fix for index.html
with open('index.html', 'r') as f:
    idx = f.read()

idx = idx.replace('<thead class="sticky top-[64px] bg-white z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">', '<thead>')
idx = idx.replace('<th class="w-[20%] px-4 py-3', '<th class="sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] w-[20%] px-4 py-3')
idx = idx.replace('<th class="w-[15%] px-4 py-3', '<th class="sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] w-[15%] px-4 py-3')
idx = idx.replace('<th class="w-[10%] px-4 py-3', '<th class="sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] w-[10%] px-4 py-3')
idx = idx.replace('<th class="w-[8%] px-4 py-3', '<th class="sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] w-[8%] px-4 py-3')
idx = idx.replace('<th class="w-[12%] px-4 py-3', '<th class="sticky top-16 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] w-[12%] px-4 py-3')

with open('index.html', 'w') as f:
    f.write(idx)

# Manual fix for predictor.html
with open('predictor.html', 'r') as f:
    pred = f.read()

pred = pred.replace('<thead class="sticky top-0 bg-white z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">', '<thead>')
# predictor.html th don't have widths mostly
pred = pred.replace('<th class="px-4 py-3', '<th class="sticky top-0 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] px-4 py-3')

with open('predictor.html', 'w') as f:
    f.write(pred)
