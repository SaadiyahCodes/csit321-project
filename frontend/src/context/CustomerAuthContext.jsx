//src/context/CustomerAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCustomer = async () => {
        try {
            const res = await api.get("/api/customer/auth/me");
            setCustomer(res.data);
        } catch {
            setCustomer(null);
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            fetchCustomer();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password, sessionId = null) => {
        // Create form data for OAuth2PasswordRequestForm
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        // Add session_id as query parameter if provided
        const url = sessionId 
            ? `/api/customer/auth/login?session_id=${sessionId}`
            : "/api/customer/auth/login";

        const res = await api.post(url, formData);
        localStorage.setItem("token", res.data.access_token);
        await fetchCustomer();
    };

    const register = async (name, email, password, phoneNumber = null) => {
        const res = await api.post("/api/customer/auth/signup", {
            name,
            email,
            password,
            phone_number: phoneNumber
        });
        
        // Auto-login after registration
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem("token");
        // Clear all sessions
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('session_')) {
            localStorage.removeItem(key);
            }
        });
        setCustomer(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, login, register, logout, loading }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);