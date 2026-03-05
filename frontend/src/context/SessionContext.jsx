// src/context/SessionContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useCustomerAuth } from "./CustomerAuthContext";

export const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { restaurantId } = useParams();
  const {customer} = useCustomerAuth();
  const [sessionId, setSessionId] = useState(null);
  const [selectionId, setSelectionId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, [restaurantId, customer?.id]);

  //Call this any time cart changes (add, remove, update)
  const fetchCartCount = useCallback(async (sid = selectionId, ssid = sessionId) => {
    if (!sid || !ssid) return;
    try {
      const res = await api.get(`/api/selections/${sid}?session_id=${ssid}`);
      setCartCount(res.data.item_count ?? 0);
    } catch {
      setCartCount(0);
    }
  }, [selectionId, sessionId]);

  //Re-fetch count whenever selectionId/sessionId are ready
  useEffect(() => {
    if (selectionId && sessionId) fetchCartCount(selectionId, sessionId);
  }, [selectionId, sessionId]);

  const initializeSession = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      // Get or create session_id from localStorage
      let storedSessionId = localStorage.getItem(`session_${restaurantId}`);

      //clear old session if customer changed
      const storedCustomerId = sessionStorage.getItem('last_customer_id');
      if (customer?.id && storedCustomerId && customer.id !== parseInt(storedCustomerId)) {
        // Customer changed - clear this restaurant's session
        localStorage.removeItem(`session_${restaurantId}`);
        storedSessionId = null;
      }
      // Track current customer
      sessionStorage.setItem('last_customer_id', customer?.id || '');
      
      if (!storedSessionId) {
        // Generate new session ID (you can use UUID library or simple timestamp)
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`session_${restaurantId}`, storedSessionId);
      }

      // Create or get session from backend
      const sessionResponse = await api.post("/api/sessions/", {
        session_id: storedSessionId,
        restaurant_id: parseInt(restaurantId),
        customer_id: customer?.id || null,
        language: "en"
      });

      const newSessionId = sessionResponse.data.session_id;
      setSessionId(newSessionId);

      // Get or create selection (cart)
      const selectionResponse = await api.post(
        `/api/selections/?session_id=${newSessionId}`
      );
      const newSelectionId = selectionResponse.data.id;
      setSelectionId(newSelectionId);
      // Fetch initial cart count with the fresh IDs directly
      // (state updates are async so pass them explicitly)
      await fetchCartCount(newSelectionId, newSessionId);

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
        cartCount,
        fetchCartCount,
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