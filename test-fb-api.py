import urllib.request
import json

TOKEN = "EAATcxfSscZBEBR2sapZBZBmZAxNZA1KyWWW9MNJWDKDQKQo91GPIbkj1em0i3DEH7VoUXE2WtZC8IfcBrpZBl6QRnZBjOC7ZA5sORgf72cS349pBkn8kMMn79N4lWJvaeQK8p4Fd8GOW6UFOPJ0QeeHvDS4stkjZBNIbJLrXstQ9xNUsfmlpmMkuOyvzSjJR2PshGFMZAK9cD1qaWzROiUZCDcAFjGOGrcwn823oZAJQP83K0QESRXLU0hDbwaEdZB0DDPfUP41Ui6Tv8yDBeZB1QZCuBOePBGob"

# Test 1: Get user info
print("--- Test 1: User Info ---")
url1 = f"https://graph.facebook.com/v19.0/me?fields=name,id&access_token={TOKEN}"
with urllib.request.urlopen(url1) as r:
    data = json.loads(r.read())
    print(json.dumps(data, indent=2))

# Test 2: Get pages
print("\n--- Test 2: Pages List ---")
url2 = f"https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token&access_token={TOKEN}"
with urllib.request.urlopen(url2) as r:
    data = json.loads(r.read())
    print(json.dumps(data, indent=2))

# Test 3: Get IG accounts (via pages)
print("\n--- Test 3: Instagram Accounts ---")
if data.get("data"):
    page_id = data["data"][0]["id"]
    page_token = data["data"][0]["access_token"]
    url3 = f"https://graph.facebook.com/v19.0/{page_id}?fields=instagram_business_account&access_token={page_token}"
    with urllib.request.urlopen(url3) as r:
        ig = json.loads(r.read())
        print(json.dumps(ig, indent=2))
else:
    print("No pages found")
