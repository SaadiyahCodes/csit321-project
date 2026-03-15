// src/components/Chatbot.jsx
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useState, useEffect, useRef } from "react";
import { Send, Mic, X, Loader2, MicOff, Volume2, VolumeX } from "lucide-react";
import { useSession } from "../context/SessionContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Chatbot({ isOpen, onClose }) {
  const { customer, profile } = useCustomerAuth();

  const navigate = useNavigate();
  const { sessionId, restaurantId } = useSession();
  const { language } = useLanguage();

  // UI State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(
    () => localStorage.getItem("voiceReplyEnabled") === "true"
  );

  // Voice Recording
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && sessionId) {
      loadChatHistory();
    }
  }, [isOpen, sessionId]);

  // Persist voice reply toggle
  useEffect(() => {
    localStorage.setItem("voiceReplyEnabled", voiceReplyEnabled);
  }, [voiceReplyEnabled]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/api/chatbot/history/${sessionId}`);
      const history = response.data.messages || [];

      const formattedMessages = history.flatMap((msg) => [
        {
          id: `user-${msg.timestamp}`,
          text: msg.user,
          sender: "user",
          timestamp: new Date(msg.timestamp),
        },
        {
          id: `bot-${msg.timestamp}`,
          text: msg.assistant,
          sender: "bot",
          timestamp: new Date(msg.timestamp),
        },
      ]);

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Shared TTS helper — used by text replies when toggle is on
  const speakText = async (text) => {
    try {
      const response = await api.post("/api/voice/tts", null, {
        params: { text, language },
      });
      if (response.data.success && response.data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audio}`);
        audio.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !sessionId) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    setIsSending(true);

    try {
      const response = await api.post("/api/chatbot/chat", {
        message: text.trim(),
        session_id: sessionId,
        language: language,
        allergies: [],
      });

      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.data.response,
        sender: "bot",
        timestamp: new Date(),
        intent: response.data.intent,
        translated: response.data.translated,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Speak the reply if voice toggle is on
      if (voiceReplyEnabled) {
        await speakText(response.data.response);
      }

      // Show notification if items were added to cart
      if (response.data.intent?.items?.length > 0) {
        const itemNames = response.data.intent.items.map((item) => item.name).join(", ");
        alert(`✅ Added to cart: ${itemNames}`);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: `bot-error-${Date.now()}`,
        text: "Sorry, I'm having trouble right now. Please try again!",
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (inputText.trim() && !isSending) {
      sendMessage(inputText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Recording - START
  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType,
          });
          await sendVoiceMessage(audioBlob);
        } else {
          alert("No audio was recorded. Please try again.");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("❌ Microphone access error:", error);
      alert("Please allow microphone access to use voice chat");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setIsSending(true);

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        setIsTyping(true); // ← moved inside onloadend, right before the API call
        const base64Audio = reader.result.split(",")[1];

        try {
          const response = await api.post("/api/voice/chat", {
            audio_base64: base64Audio,
            session_id: sessionId,
            language: language,
            allergies: [],
          });

          if (response.data.success) {
            const userMessage = {
              id: `user-voice-${Date.now()}`,
              text: response.data.user_text,
              sender: "user",
              timestamp: new Date(),
              isVoice: true,
            };

            const botMessage = {
              id: `bot-voice-${Date.now()}`,
              text: response.data.bot_text,
              sender: "bot",
              timestamp: new Date(),
              audioData: response.data.bot_audio,
            };

            setMessages((prev) => [...prev, userMessage, botMessage]);

            if (response.data.bot_audio) {
              try {
                const audio = new Audio(`data:audio/mp3;base64,${response.data.bot_audio}`);
                audio.play();
              } catch (audioError) {
                console.error("Audio playback error:", audioError);
              }
            }

            if (response.data.items_added_to_cart?.length > 0) {
              const itemNames = response.data.items_added_to_cart.join(", ");
              alert(`✅ Added to cart: ${itemNames}`);
            }
          } else {
            throw new Error(response.data.error || "Voice processing failed");
          }
        } catch (apiError) {
          console.error("❌ API call failed:", apiError);
          alert("Voice message failed. Please try typing instead.");
        } finally {
          setIsTyping(false); // ← clears after API resolves
          setIsSending(false);
        }
      };

      reader.onerror = () => {
        alert("Failed to process audio. Please try again.");
        setIsSending(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("❌ Voice message error:", error);
      alert("Voice message failed. Please try typing instead.");
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0.08); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40%           { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
      {/* Backdrop/Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 999,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Chatbot Panel */}
      <div
        style={{
          position: "fixed",
          bottom: "80px",
          right: "16px",
          width: "400px",
          maxWidth: "calc(100vw - 32px)",
          height: "600px",
          maxHeight: "calc(100vh - 120px)",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(to right, #f97316, #ea580c)",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "white", fontSize: "18px", fontWeight: "bold", margin: 0 }}>
              Gusto AI Assistant
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", margin: "2px 0 0 0" }}>
              Ask me anything about the menu!
            </p>
          </div>

          {/* Language Selector, Voice Toggle & Close Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageSelector variant="compact" />

            {/* Voice Reply Toggle */}
            <button
              onClick={() => setVoiceReplyEnabled((prev) => !prev)}
              title={voiceReplyEnabled ? "Voice replies on" : "Voice replies off"}
              style={{
                background: voiceReplyEnabled ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {voiceReplyEnabled
                ? <Volume2 size={16} style={{ color: "white" }} />
                : <VolumeX size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
              }
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <X size={18} style={{ color: "white" }} />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            backgroundColor: "#fafafa",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Allergen/Dietary Banner */}
          {customer && (profile?.allergens?.length > 0 || profile?.dietary_preferences?.length > 0) && (
            <div style={{
              backgroundColor: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "12px",
              padding: "6px 12px",
              fontSize: "13px",
              color: "#381b11",
              flexShrink: 0,
              textAlign: "center",
            }}>
              <p style={{ margin: 0 }}>
                Personalizing from your profile -{" "}
                <span
                  onClick={() => navigate("/customer/profile")}
                  style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 700 }}
                >
                  Change here
                </span>
              </p>
              {profile?.allergens?.length > 0 && (
                <p style={{ margin: "0 0 2px", color: "#5a480d" }}>
                  Allergens: {profile.allergens.join(", ")}
                </p>
              )}
              {profile?.dietary_preferences?.length > 0 && (
                <p style={{ margin: "0 0 4px", color: "#5a480d" }}>
                  Dietary preferences: {profile.dietary_preferences.join(", ")}
                </p>
              )}
              
            </div>
          )}

          {/* Voice reply indicator banner */}
          {voiceReplyEnabled && (
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "8px 14px",
              fontSize: "11px",
              color: "#166534",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Volume2 size={12} />
              Voice replies are on — I'll read my responses aloud.
            </div>
          )}

          {messages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "inline-block",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  👋{" "}
                  {language === "ar"
                    ? "مرحباً! أنا مساعدك الذكي"
                    : language === "ur"
                    ? "ہیلو! میں آپ کا AI اسسٹنٹ ہوں"
                    : language === "hi"
                    ? "नमस्ते! मैं आपका AI सहायक हूं"
                    : language === "es"
                    ? "¡Hola! Soy tu asistente de AI"
                    : language === "fr"
                    ? "Bonjour! Je suis votre assistant AI"
                    : "Hi! I'm your AI assistant"}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                  {language === "ar"
                    ? "اسألني عن الأطباق أو المكونات أو الحساسية!"
                    : language === "ur"
                    ? "مجھ سے ڈشز، اجزاء یا الرجی کے بارے میں پوچھیں!"
                    : language === "hi"
                    ? "मुझसे व्यंजन, सामग्री या एलर्जी के बारे में पूछें!"
                    : language === "es"
                    ? "¡Pregúntame sobre platos, ingredientes o alergias!"
                    : language === "fr"
                    ? "Demandez-moi des plats, ingrédients ou allergies !"
                    : "Ask me about dishes, ingredients, or allergies!"}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  backgroundColor:
                    msg.sender === "user" ? "#fef3c7" : msg.isError ? "#fee2e2" : "white",
                  border:
                    msg.sender === "user"
                      ? "none"
                      : msg.isError
                      ? "1px solid #fca5a5"
                      : "1px solid #e5e7eb",
                  borderRadius:
                    msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "12px 14px",
                  maxWidth: "85%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#111827",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    direction: language === "ar" || language === "ur" ? "rtl" : "ltr",
                  }}
                >
                  {msg.text}
                </p>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    display: "block",
                    textAlign: msg.sender === "user" ? "right" : "left",
                    marginTop: "6px",
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "12px 14px",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#9ca3af",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out",
                  }}
                ></span>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#9ca3af",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out 0.2s",
                  }}
                ></span>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#9ca3af",
                    borderRadius: "50%",
                    animation: "bounce 1.4s infinite ease-in-out 0.4s",
                  }}
                ></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #e5e7eb",
            flexShrink: 0,
            backgroundColor: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              backgroundColor: "#f3f4f6",
              borderRadius: "24px",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                language === "ar"
                  ? "اسألني أي شيء..."
                  : language === "ur"
                  ? "مجھ سے کچھ بھی پوچھیں..."
                  : language === "hi"
                  ? "मुझसे कुछ भी पूछें..."
                  : language === "es"
                  ? "Pregúntame lo que quieras..."
                  : language === "fr"
                  ? "Demandez-moi ce que vous voulez..."
                  : "Ask me anything..."
              }
              disabled={isSending || isRecording}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "14px",
                color: "#111827",
                direction: language === "ar" || language === "ur" ? "rtl" : "ltr",
              }}
            />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSending}
              style={{
                background: isRecording ? "#ef4444" : "transparent",
                border: isRecording ? "2px solid rgba(239,68,68,0.4)" : "2px solid transparent",
                borderRadius: "50%",
                width: 36, height: 36,
                cursor: isSending ? "not-allowed" : "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: isRecording ? "0 0 0 4px rgba(239,68,68,0.15)" : "none",
                animation: isRecording ? "micPulse 1.2s ease-in-out infinite" : "none",
                transition: "background 0.2s, box-shadow 0.2s, border 0.2s",
              }}
            >
              {isRecording
                ? <MicOff size={18} style={{ color: "white" }} />
                : <Mic size={18} style={{ color: isSending ? "#d1d5db" : "#f97316" }} />
              }
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending || isRecording}
              style={{
                background: "none",
                border: "none",
                cursor: inputText.trim() && !isSending ? "pointer" : "not-allowed",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {isSending ? (
                <Loader2
                  size={20}
                  style={{ color: "#f97316", animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send
                  size={20}
                  style={{
                    color: inputText.trim() && !isSending ? "#f97316" : "#d1d5db",
                  }}
                />
              )}
            </button>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div style={{
              marginTop: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "#fff1f1", borderRadius: 12, padding: "6px 14px",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                display: "inline-block",
                animation: "pulse 1s infinite",
                flexShrink: 0,
              }} />
              <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, margin: 0 }}>
                {language === "ar" ? "جاري التسجيل... انقر على الميكروفون للإيقاف"
                : language === "ur" ? "ریکارڈنگ... رکنے کے لیے مائیک پر کلک کریں"
                : language === "hi" ? "रिकॉर्डिंग... रुकने के लिए माइक पर क्लिक करें"
                : language === "es" ? "Grabando... Haz clic en el micrófono para detener"
                : language === "fr" ? "Enregistrement... Cliquez sur le micro pour arrêter"
                : "Recording — tap mic to stop"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}