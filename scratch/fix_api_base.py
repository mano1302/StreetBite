import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace fetch('/api/
    content = content.replace("fetch('/api/", "fetch(API_BASE + '/api/")
    
    # Replace fetch(`/api/
    content = content.replace("fetch(`/api/", "fetch(API_BASE + `/api/")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Fixed {filepath}')

fix_file('script.js')
fix_file('static/script.js')
