// src/components/LandingChatbot.jsx
import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, MapPin, Star, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function LandingChatbot({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Generate a stable conversation_id for this session
  const conversationIdRef = useRef(crypto.randomUUID());

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

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
      const response = await api.post("/api/landing/chat", {
        message: text.trim(),
        conversation_id: conversationIdRef.current,
        language: "en",
      });

      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.data.response,
        sender: "bot",
        timestamp: new Date(),
        suggestedRestaurants: response.data.suggested_restaurants || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Landing chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          text: "Sorry, I'm having trouble right now. Please try again!",
          sender: "bot",
          timestamp: new Date(),
          isError: true,
          suggestedRestaurants: [],
        },
      ]);
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

  // Matches RestaurantCard navigation and App.jsx route definition
  const handleRestaurantClick = (restaurant) => {
    onClose();
    navigate(`/restaurant/${restaurant.id}/menu`);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40%           { transform: scale(1.1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .landing-restaurant-card:hover {
          background-color: #fff7ed !important;
          border-color: #f97316 !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
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
              Find your perfect restaurant!
            </p>
          </div>

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
          {/* Welcome message */}
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
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Hi! I'm your dining concierge
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                  Tell me your budget, location, or cuisine and I'll find the perfect spot!
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    backgroundColor: msg.sender === "user" ? "#fef3c7" : msg.isError ? "#fee2e2" : "white",
                    border: msg.sender === "user"
                      ? "none"
                      : msg.isError
                      ? "1px solid #fca5a5"
                      : "1px solid #e5e7eb",
                    borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
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
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Suggested Restaurant Cards */}
              {msg.suggestedRestaurants?.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {msg.suggestedRestaurants.map((r) => (
                    <div
                      key={r.id}
                      className="landing-restaurant-card"
                      onClick={() => handleRestaurantClick(r)}
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                            {r.name}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>
                            {r.category}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Star size={11} style={{ color: "#f97316" }} />
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                            {r.rating}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <MapPin size={11} style={{ color: "#9ca3af" }} />
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>{r.location}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <DollarSign size={11} style={{ color: "#9ca3af" }} />
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>{r.avg_price_range}</span>
                        </div>
                      </div>

                      {r.reason && (
                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#f97316", fontStyle: "italic" }}>
                          {r.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
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
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    style={{
                      width: "8px", height: "8px",
                      backgroundColor: "#9ca3af",
                      borderRadius: "50%",
                      animation: `bounce 1.4s infinite ease-in-out ${delay}s`,
                    }}
                  />
                ))}
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
              placeholder="Ask me anything..."
              disabled={isSending}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "14px",
                color: "#111827",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
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
                <Loader2 size={20} style={{ color: "#f97316", animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={20} style={{ color: inputText.trim() ? "#f97316" : "#d1d5db" }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}