# create_test_wav.py
from gtts import gTTS
import io

tts = gTTS("Hello this is a test", lang='en')
tts.save("test_audio.wav")  # Actually saves as MP3!

# Convert to proper WAV:
from pydub import AudioSegment
audio = AudioSegment.from_mp3("test_audio.wav")
audio.export("test_audio_real.wav", format="wav")
print("✅ Created test_audio_real.wav")