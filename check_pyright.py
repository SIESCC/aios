import json
import subprocess

r = subprocess.run(['python', '-m', 'pyright', '--outputjson', 'workers'], capture_output=True, text=True)
data = json.loads(r.stdout).get('generalDiagnostics', [])
with open('py_errors.txt', 'w', encoding='utf-8') as f:
    for x in data:
        line = f"{x['file']}:{x['range']['start']['line']+1}:{x['range']['start']['character']+1} - {x['message']}\n"
        f.write(line)
