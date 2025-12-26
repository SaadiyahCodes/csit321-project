// src/routes/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

export default function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
        navigate("/admin");
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
        </form>
    );

}