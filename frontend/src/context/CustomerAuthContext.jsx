//src/context/CustomerAuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const CustomerAuthContext = createContext(null);

export const CustomerAuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    const fetchCustomer = async () => {
        try {
            const res = await api.get("/api/customer/auth/me");
            setCustomer(res.data);
            //fetch profile for allergens/dietary prefs
            try {
                const profileRes = await api.get("/api/customer/profile/");
                setProfile(profileRes.data);
            } catch {
                setProfile(null);
            }
        } catch (err) {
            setCustomer(null);
            setProfile(null);
            if (err.response?.status !== 401) {
                localStorage.removeItem("token");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Decode JWT to check type without a library
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.type === 'customer') {
                    fetchCustomer();
                } else {
                    // Admin token — skip customer auth entirely
                    setLoading(false);
                }
            } catch {
                // Malformed token
                setLoading(false);
            }
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
        setProfile(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, profile, login, register, logout, loading, fetchCustomer }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);