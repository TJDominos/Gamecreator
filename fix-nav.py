import re
with open('src/pages/guides/CreatorGuide.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className={`block mb-2 transition-colors \$\{activeSection === \'(.*?)\' \? \'text-\[var\(--portal-purple\)\]\' : \'hover:text-gray-600\'\}`}',
    r'className={`nav-link font-bold ${activeSection === \'\1\' ? \'active\' : \'\'}`}',
    content
)

with open('src/pages/guides/CreatorGuide.tsx', 'w') as f:
    f.write(content)
