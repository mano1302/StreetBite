import urllib.request, json, sys

base = 'http://localhost:5000'

def req(method, path, body=None, headers={}):
    data = json.dumps(body).encode() if body else None
    h = {'Content-Type': 'application/json', **headers}
    r = urllib.request.Request(f'{base}{path}', data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

passed = 0
failed = 0

def check(label, condition, detail=''):
    global passed, failed
    if condition:
        print(f'  PASS  {label}')
        passed += 1
    else:
        print(f'  FAIL  {label}  {detail}')
        failed += 1

print('=== StreetBite Backend Security Tests ===')
print()

# --- Issue #3: Contact stripped from public stalls list ---
status, stalls = req('GET', '/api/stalls')
has_contact = isinstance(stalls, list) and any('contact' in s for s in stalls)
check('GET /api/stalls - contact field absent', not has_contact, f'status={status}')

# --- Issue #3: Contact stripped from single stall (no auth) ---
if isinstance(stalls, list) and len(stalls) > 0:
    sid = stalls[0]['id']
    status, stall = req('GET', f'/api/stalls/{sid}')
    check('GET /api/stalls/<id> - contact absent without token',
          status == 200 and 'contact' not in stall)
else:
    print('  SKIP  GET /api/stalls/<id> (no stalls in DB)')

# --- Issue #2: Protected PUT /status without token -> 401 ---
status, body = req('PUT', '/api/stalls/1/status', {'status': 'open'})
check('PUT /status without token -> 401', status == 401, f'got {status}')

# --- Issue #2: Protected DELETE without token -> 401 ---
status, body = req('DELETE', '/api/stalls/1')
check('DELETE /api/stalls/<id> without token -> 401', status == 401, f'got {status}')

# --- Issue #2: Protected PUT /discount without token -> 401 ---
status, body = req('PUT', '/api/stalls/1/discount', {'discount': '10% off'})
check('PUT /discount without token -> 401', status == 401, f'got {status}')

# --- Issue #2: POST /api/stalls (internal) without token -> 401 ---
status, body = req('POST', '/api/stalls', {'name': 'x', 'category': 'Biryani',
    'area': 'Test', 'contact': '1234567890', 'password': 'test1234', 'status': 'auto'})
check('POST /api/stalls (internal) without token -> 401', status == 401, f'got {status}')

# --- Issue #4: Signup bad data -> 400 + details list ---
status, body = req('POST', '/api/stalls/signup', {
    'name': 'X',
    'category': 'INVALID_CAT',
    'contact': '123',
    'password': 'ab',
    'menu': []
})
check('Signup bad data -> 400', status == 400, f'got {status}')
check('Signup response has details list', isinstance(body.get('details'), list),
      f'body={body}')
if isinstance(body.get('details'), list):
    print(f'         Errors: {body["details"]}')

# --- Issue #4: Signup missing required fields -> 400 ---
status, body = req('POST', '/api/stalls/signup', {})
check('Signup empty body -> 400', status == 400, f'got {status}')

# --- Review validation: rating out of range ---
status, body = req('POST', '/api/stalls/1/review', {'rating': 99, 'comment': 'great'})
check('Review rating=99 -> 400', status == 400, f'got {status}, msg={body.get("error")}')

# --- Review validation: rating below range ---
status, body = req('POST', '/api/stalls/1/review', {'rating': 0})
check('Review rating=0 -> 400', status == 400, f'got {status}')

# --- Review validation: no rating ---
status, body = req('POST', '/api/stalls/1/review', {'comment': 'no rating here'})
check('Review missing rating -> 400', status == 400, f'got {status}')

# --- Review validation: comment too long ---
long_comment = 'x' * 501
status, body = req('POST', '/api/stalls/1/review', {'rating': 3, 'comment': long_comment})
check('Review comment >500 chars -> 400', status == 400, f'got {status}')

# --- Invalid token -> 401 ---
status, body = req('PUT', '/api/stalls/1/status', {'status': 'open'},
                   {'Authorization': 'Bearer totally.invalid.token'})
check('Invalid token -> 401', status == 401, f'got {status}')

print()
print(f'Results: {passed} passed, {failed} failed out of {passed+failed} tests')
sys.exit(0 if failed == 0 else 1)
