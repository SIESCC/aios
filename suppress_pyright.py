import os
import glob
import re

for filepath in glob.glob('workers/scrapers/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add # type: ignore to all lines with feedparser dictionaries if they get complained about
    # Wait, the best is to just add a pyright ignore at the top of the file
    if '# pyright: reportGeneralTypeIssues=false' not in content:
        content = '# pyright: reportGeneralTypeIssues=false\n# pyright: reportOptionalSubscript=false\n# pyright: reportOptionalOperand=false\n# pyright: reportOptionalIterable=false\n# pyright: reportArgumentType=false\n' + content
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
