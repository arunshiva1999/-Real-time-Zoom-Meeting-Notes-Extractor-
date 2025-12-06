# clipboard_autopost.py
import time
import pyperclip
import requests

SERVER = "http://localhost:8000"  # or your server URL (ngrok) if remote
_last = ""

print("Clipboard autopost running. Copies will POST to", SERVER)
while True:
    try:
        text = pyperclip.paste()
        if text and text != _last and len(text.strip()) > 15:
            _last = text
            resp = requests.post(f"{SERVER}/upload", json={"text": text})
            print("Posted clipboard, server response:", resp.status_code)
        time.sleep(0.8)
    except KeyboardInterrupt:
        break
    except Exception as e:
        print("Error:", e)
        time.sleep(1)
