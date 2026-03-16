import re

def fix_html(filename, sticky_top):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Update the table classes to include border-separate and border-spacing-0
    # In index.html it is already there: <table class="w-full border-separate border-spacing-0 table-fixed text-left">

    # 2. Change sticky top-[64px] on thead to be on each th instead for better reliability
    # find the thead and its contents
    thead_pattern = re.compile(r'<thead class="sticky top-\[?(\w+)\]? bg-white z-30 shadow-\[0_1px_0_rgba\(0,0,0,0\.05\)\]">(.*?)</thead>', re.DOTALL)

    def replace_thead(match):
        top_val = match.group(1)
        inner_content = match.group(2)
        # Remove sticky from thead
        new_thead = f'<thead class="bg-white z-30 shadow-[0_1px_0_rgba(0,0,0,0.05)]">{inner_content}</thead>'
        # Add sticky to each th
        new_thead = re.sub(r'<th (class="[^"]*")', f'<th \1 style="position: sticky; top: {sticky_top}px; background: white; z-index: 20;"', new_thead)
        return new_thead

    # Actually let's just use CSS for the sticky th to avoid inline styles if possible,
    # but the user said it was messed up after deploy, maybe due to CSS purging or something.
    # I'll stick to Tailwind classes if possible or very explicit CSS.

    # Re-evaluating: The user's screenshot shows the header is shifted DOWN and covers the first row.
    # This often happens if the container is relative and has some weird padding/margin,
    # or if the top offset is too large.
    # The nav is h-16 (64px). So top-16 or top-[64px] should be correct.

    return content

# Let's just do a direct replacement in the file for simplicity and safety.
