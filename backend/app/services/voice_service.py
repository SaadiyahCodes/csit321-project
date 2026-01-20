# app/services/voice_service.py
import speech_recognition as sr
from gtts import gTTS
import io
import base64
from typing import Dict
from pydub import AudioSegment  # ← ADD THIS


class VoiceService:
    def __init__(self):
        """Initialize speech services"""
        self.recognizer = sr.Recognizer()
        print("✅ Voice service initialized")

    def speech_to_text(self, audio_data: bytes, language: str = "en") -> Dict:
        """
        Convert speech to text
        NOW SUPPORTS MP3 (for testing with /tts output)
        """
        try:
            # Convert MP3 (from gTTS) to WAV first
            try:
                audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
                wav_io = io.BytesIO()
                audio_segment.export(wav_io, format="wav")
                wav_io.seek(0)
                audio_file = sr.AudioFile(wav_io)
            except:
                # Fallback for already-WAV files
                audio_file = sr.AudioFile(io.BytesIO(audio_data))

            with audio_file as source:
                audio = self.recognizer.record(source)

            text = self.recognizer.recognize_google(audio, language=language)

            return {
                "text": text,
                "language": language,
                "success": True
            }

        except sr.UnknownValueError:
            return {
                "error": "Could not understand audio",
                "success": False
            }
        except sr.RequestError as e:
            return {
                "error": f"Speech recognition service error: {e}",
                "success": False
            }
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }

    def text_to_speech(self, text: str, language: str = "en") -> Dict:
        """Text to speech - returns MP3"""
        try:
            tts = gTTS(text=text, lang=language, slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")

            return {
                "audio": audio_base64,
                "format": "mp3",
                "language": language,
                "success": True
            }
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }


voice_service = VoiceService()
