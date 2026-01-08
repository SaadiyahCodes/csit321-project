import speech_recognition as sr
from gtts import gTTS
import io
import base64
from typing import Dict

class VoiceService:
    def __init__(self):
        """Initialize speech services"""
        self.recognizer = sr.Recognizer()
        print("✅ Voice service initialized")
    
    def speech_to_text(self, audio_data: bytes, language: str = "en") -> Dict:
        """
        Convert speech to text using Google Speech Recognition
        
        Args:
            audio_data: Audio file bytes (WAV, FLAC, etc.)
            language: Language code (en, ar, ur, etc.)
        """
        try:
            # Create AudioData from bytes
            audio_file = sr.AudioFile(io.BytesIO(audio_data))
            
            with audio_file as source:
                audio = self.recognizer.record(source)
            
            # Recognize speech
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
        """
        Convert text to speech using Google TTS
        
        Returns base64 encoded audio
        """
        try:
            # Language mapping
            lang_map = {
                'en': 'en',
                'ar': 'ar',
                'ur': 'ur',
                'hi': 'hi',
                'fr': 'fr',
                'es': 'es'
            }
            
            tts_lang = lang_map.get(language, 'en')
            
            # Generate speech
            tts = gTTS(text=text, lang=tts_lang, slow=False)
            
            # Save to bytes
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Encode to base64 for transfer
            audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
            
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

# Global instance
voice_service = VoiceService()