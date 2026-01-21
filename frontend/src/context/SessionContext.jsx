// src/context/SessionContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { restaurantId } = useParams();
  const [sessionId, setSessionId] = useState(null);
  const [selectionId, setSelectionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, [restaurantId]);

  const initializeSession = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      // Get or create session_id from localStorage
      let storedSessionId = localStorage.getItem(`session_${restaurantId}`);
      
      if (!storedSessionId) {
        // Generate new session ID (you can use UUID library or simple timestamp)
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`session_${restaurantId}`, storedSessionId);
      }

      // Create or get session from backend
      const sessionResponse = await api.post("/api/sessions/", {
        session_id: storedSessionId,
        restaurant_id: parseInt(restaurantId),
        language: "en"
      });

      setSessionId(sessionResponse.data.session_id);

      // Get or create selection (cart)
      const selectionResponse = await api.post(
        `/api/selections/?session_id=${sessionResponse.data.session_id}`
      );

      setSelectionId(selectionResponse.data.id);
      setLoading(false);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      setLoading(false);
    }
  };

  const refreshSelection = async () => {
    if (!sessionId) return null;
    
    try {
      const response = await api.post(`/api/selections/?session_id=${sessionId}`);
      setSelectionId(response.data.id);
      return response.data;
    } catch (error) {
      console.error("Failed to refresh selection:", error);
      return null;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        selectionId,
        restaurantId,
        loading,
        refreshSelection
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}