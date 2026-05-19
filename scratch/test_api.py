import urllib.request, json
url = "https://inputtools.google.com/request?text=hello%20world&itc=ta-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test"
req = urllib.request.urlopen(url)
res = json.loads(req.read())
print(json.dumps(res, indent=2))
