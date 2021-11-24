import requests
import json

API_KEY = "talgiving_default_key"
AUDIO_ROOMS_URL = "http://localhost:4000/api/v1/meeting"

headers = {
    "authorization": API_KEY,
    "Content-Type": "application/json",
}

response = requests.post(
    AUDIO_ROOMS_URL,
    headers=headers
)

print("Status code:", response.status_code)
data = json.loads(response.text)
print("meeting:", data["meeting"])
