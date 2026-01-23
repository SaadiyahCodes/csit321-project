# app/services/voice_service.py
import speech_recognition as sr
from gtts import gTTS
import io
import base64
from typing import Dict
from pydub import AudioSegment
import tempfile
import os


class VoiceService:
    def __init__(self):
        """Initialize speech services"""
        self.recognizer = sr.Recognizer()
        print("✅ Voice service initialized")

    def speech_to_text(self, audio_data: bytes, language: str = "en") -> Dict:
        """
        Convert speech to text
        Supports WebM, MP3, WAV formats
        """
        try:
            print(f"🎤 Received audio data: {len(audio_data)} bytes")
            
            # Use system temp directory (works on Windows/Mac/Linux)
            temp_dir = tempfile.gettempdir()
            
            # Save original audio for debugging
            debug_path = os.path.join(temp_dir, f"debug_audio_{len(audio_data)}.webm")
            with open(debug_path, "wb") as f:
                f.write(audio_data)
            print(f"💾 Saved debug audio to: {debug_path}")
            
            # Create temporary file to store audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_audio:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
            
            try:
                # Convert to WAV using pydub (supports WebM/MP3/etc.)
                print("🔄 Converting audio to WAV...")
                audio_segment = AudioSegment.from_file(temp_audio_path)
                
                # Print audio info
                duration = len(audio_segment) / 1000.0
                print(f"📊 Audio duration: {duration:.2f} seconds")
                print(f"📊 Sample rate: {audio_segment.frame_rate} Hz")
                print(f"📊 Channels: {audio_segment.channels}")
                
                # Check if audio is too short
                if duration < 0.5:
                    return {
                        "error": "Audio too short. Please speak for at least 1 second.",
                        "success": False
                    }
                
                # Export as WAV for speech recognition
                wav_io = io.BytesIO()
                audio_segment.export(
                    wav_io, 
                    format="wav",
                    parameters=["-ar", "16000", "-ac", "1"]  # 16kHz, mono
                )
                wav_io.seek(0)
                
                # Save WAV for debugging
                wav_debug_path = os.path.join(temp_dir, f"debug_audio_{len(audio_data)}.wav")
                with open(wav_debug_path, "wb") as f:
                    f.write(wav_io.getvalue())
                print(f"💾 Saved WAV to: {wav_debug_path}")
                wav_io.seek(0)
                
                print("✅ Audio converted to WAV")
                
                # Use speech recognition
                with sr.AudioFile(wav_io) as source:
                    # Adjust for ambient noise
                    print("🎧 Adjusting for ambient noise...")
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio = self.recognizer.record(source)
                    print(f"📝 Running speech recognition... (audio data size: {len(audio.get_wav_data())} bytes)")

                # Recognize using Google Speech Recognition
                print("🌐 Calling Google Speech API...")
                text = self.recognizer.recognize_google(audio, language=language)
                print(f"✅ Recognized text: '{text}'")

                return {
                    "text": text,
                    "language": language,
                    "success": True
                }

            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)

        except sr.UnknownValueError:
            print("❌ Could not understand audio (UnknownValueError)")
            return {
                "error": "Could not understand audio. Please speak louder and clearer.",
                "success": False
            }
        except sr.RequestError as e:
            print(f"❌ Speech recognition service error: {e}")
            return {
                "error": f"Speech recognition service error: {e}",
                "success": False
            }
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": f"Audio processing error: {str(e)}",
                "success": False
            }

    def text_to_speech(self, text: str, language: str = "en") -> Dict:
        """Text to speech - returns MP3"""
        try:
            print(f"🔊 Converting text to speech: '{text[:50]}...'")
            tts = gTTS(text=text, lang=language, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

            print("✅ Text-to-speech conversion successful")
            return {
                "audio": audio_base64,
                "format": "mp3",
                "language": language,
                "success": True
            }
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return {
                "error": str(e),
                "success": False
            }


voice_service = VoiceService()