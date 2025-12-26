//frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await api.get("/api/auth/me");
            setUser(res.data);
        } catch {
            setUser(null);
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("token")) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post(
            "/api/auth/login",
            new URLSearchParams({username: email, password})
        );
        localStorage.setItem("token", res.data.access_token);
        await fetchUser();
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => useContext(AuthContext);