# Gusto Chatbot - Complete Documentation

## Overview
AI-powered multilingual restaurant chatbot with voice support, allergen safety, and smart recommendations.

## Features
✅ Natural language understanding (Gemini AI)
✅ Multi-language support (10+ languages)
✅ Voice input/output (STT/TTS)
✅ Allergen-aware recommendations
✅ Smart menu search (RAG)
✅ Order management
✅ Conversation memory

### Quick Start
```bash
# Set API key
echo "GEMINI_API_KEY=your_key" >> .env

# Test chatbot
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","language":"en"}'
```

## Endpoints

### Chat
- `POST /api/chat` - Text conversation
- `POST /api/voice/chat` - Voice conversation (end-to-end)

### Voice
- `POST /api/voice/stt` - Speech to Text
- `POST /api/voice/tts` - Text to Speech

### Menu Intelligence
- `POST /api/menu/search` - Smart search with filters
- `GET /api/menu/safe/{allergies}` - Allergen-safe menu

### Orders
- `POST /api/order/add` - Add to cart
- `GET /api/order/{session_id}` - Get order
- `DELETE /api/order/{session_id}` - Clear cart

## Usage Examples

### Basic Chat
```json
POST /api/chat
{
  "message": "I want something spicy",
  "language": "en",
  "allergies": ["dairy"]
}
```

### Voice Chat
```json
POST /api/voice/chat
{
  "audio_base64": "base64_encoded_audio...",
  "language": "ar",
  "session_id": "abc123"
}
```

## Environment Variables
```
GEMINI_API_KEY=your_key_here
GOOGLE_APPLICATION_CREDENTIALS=./gusto-translation.json
```

## Technologies
- **AI:** Google Gemini 2.5 Flash
- **Translation:** Google Cloud Translate API
- **Voice:** Google Speech Recognition + gTTS
- **Backend:** FastAPI + Python

## Safety Features
- ⚠️ Never recommends allergen-containing dishes
- ✅ Validates all recommendations against customer allergies
- 🔍 RAG ensures menu accuracy

## Performance
- Response time: <3s (text), <8s (voice)
- Conversation memory: Last 20 messages
- Cache: In-memory (translation + menu)
