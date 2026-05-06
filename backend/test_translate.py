# test_translate.py

import os

print(f"🔍 CREDENTIALS PATH: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")
print(f"🔍 FILE EXISTS: {os.path.exists(os.getenv('GOOGLE_APPLICATION_CREDENTIALS', ''))}")

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './gusto-sa-translation.json'  # update path

from google.cloud import translate_v2 as translate

client = translate.Client()
result = client.translate('Hello', target_language='ar')
print("✅ Success:", result['translatedText'])