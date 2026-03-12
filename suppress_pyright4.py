import os
import glob

for filepath in glob.glob('workers/scrapers/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '# pyright: reportCallIssue=false' not in content:
        content = '# pyright: reportCallIssue=false\n' + content
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
