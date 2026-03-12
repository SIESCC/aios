import os
import glob

fixes = [
    ('entry.get("entries")', 'entry.get("entries", [])'),
    ('feed.get("entries")', 'feed.get("entries", [])'),
    ('entry.get("links")', 'entry.get("links", [])'),
    ('entry.get("tags")', 'entry.get("tags", [])'),
    ('entry.get("title", "")', 'str(entry.get("title", ""))'),
    ('entry.get("link", "")', 'str(entry.get("link", ""))'),
    ('entry.get("description", "")', 'str(entry.get("description", ""))'),
]

for filepath in glob.glob('workers/scrapers/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix feed.get("entries")
    content = content.replace('.get("entries", [])', '.get("entries")')
    content = content.replace('.get("entries")', '.get("entries", [])')
    content = content.replace('] or []', ']')
    
    # Fix entry.get("links")
    content = content.replace('.get("links")', '.get("links", [])')
    content = content.replace(', [])', ', [])') # prevent double add
    
    # Fix published_parsed
    content = content.replace('p = entry.get("published_parsed")', 'p = entry.get("published_parsed")\n                    if not p: continue')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Fixed Pyright bugs")
