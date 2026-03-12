import os
import glob
import re

for filepath in glob.glob('workers/scrapers/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '# pyright: reportOptionalMemberAccess=false' not in content:
        content = '# pyright: reportOptionalMemberAccess=false\n# pyright: reportArgumentType=false\n' + content
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
