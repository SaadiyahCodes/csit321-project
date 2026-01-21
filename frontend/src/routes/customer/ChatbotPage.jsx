// src/routes/customer/ChatbotPage.jsx
import { useState, useEffect, useRef } from "react";
import { Send, Mic, X, Loader2, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import BottomNav from "../../components/BottomNav";
import api from "../../api";

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { sessionId, restaurantId, loading: sessionLoading } = useSession();
  const [activeNav, setActiveNav] = useState("chat");

  // UI State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Voice Recording
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

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

  // Load chat history on mount
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/api/chatbot/history/${sessionId}`);
      const history = response.data.messages || [];

      // Convert backend history to UI format
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
        language: "en", // TODO: Make this dynamic based on user preference
        allergies: [], // TODO: Get from user profile
      });

      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.data.response,
        sender: "bot",
        timestamp: new Date(),
        intent: response.data.intent,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Show notification if items were added to cart
      if (response.data.intent?.items_added_to_cart?.length > 0) {
        const itemNames = response.data.intent.items_added_to_cart.join(", ");
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

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Please allow microphone access to use voice chat");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setIsTyping(true);
    setIsSending(true);

    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(",")[1];

        const response = await api.post("/api/voice/chat", {
          audio_base64: base64Audio,
          session_id: sessionId,
          language: "en",
          allergies: [],
        });

        if (response.data.success) {
          // Add user's transcribed message
          const userMessage = {
            id: `user-voice-${Date.now()}`,
            text: response.data.user_text,
            sender: "user",
            timestamp: new Date(),
            isVoice: true,
          };

          // Add bot's response
          const botMessage = {
            id: `bot-voice-${Date.now()}`,
            text: response.data.bot_text,
            sender: "bot",
            timestamp: new Date(),
            audioData: response.data.bot_audio,
          };

          setMessages((prev) => [...prev, userMessage, botMessage]);

          // Play audio response
          if (response.data.bot_audio) {
            const audio = new Audio(`data:audio/mp3;base64,${response.data.bot_audio}`);
            audio.play();
          }

          // Notify about items added to cart
          if (response.data.items_added_to_cart?.length > 0) {
            const itemNames = response.data.items_added_to_cart.join(", ");
            alert(`✅ Added to cart: ${itemNames}`);
          }
        }
      };
    } catch (error) {
      console.error("Voice chat error:", error);
      alert("Voice message failed. Please try typing instead.");
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const clearChat = async () => {
    if (!confirm("Clear all messages?")) return;

    try {
      await api.delete(`/api/chatbot/clear/${sessionId}`);
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/restaurant/${restaurantId}/menu`)}
              className="text-white text-2xl font-bold"
            >
              ←
            </button>
            <div>
              <h1 className="text-white font-extrabold text-lg">AI Assistant</h1>
              <p className="text-orange-100 text-xs">Ask me anything about the menu!</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-white hover:bg-white/20 p-2 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-3xl p-6 shadow-sm inline-block">
                <p className="text-gray-600 font-semibold mb-2">
                  👋 Hi! I'm your AI assistant
                </p>
                <p className="text-gray-500 text-sm">
                  Ask me about dishes, ingredients, or allergies!
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.sender === "user"
                    ? "bg-yellow-100 text-gray-900 rounded-br-none"
                    : msg.isError
                    ? "bg-red-50 text-red-800 border border-red-200 rounded-bl-none"
                    : "bg-white text-gray-900 shadow-sm rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                {msg.isVoice && (
                  <span className="text-xs text-gray-500 mt-1 block">🎤 Voice</span>
                )}
                <span className="text-xs text-gray-500 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isSending}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          {/* Voice Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending}
            className={`p-3 rounded-full transition ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-orange-600 text-white hover:bg-orange-700"
            } disabled:opacity-50`}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  );
}