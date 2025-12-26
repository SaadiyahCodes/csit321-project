// src/routes/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

export default function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        
        try {
            console.log("Attempting login with:", email);
            await login(email, password);
            console.log("Login successful!");
            navigate("/admin");
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-orange-500 overflow-hidden">
            {/* Background circles */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-300 opacity-40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 opacity-40 rounded-full blur-3xl"></div>

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mx-4 z-10">
                <h2 className="text-center text-2xl font-semibold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-center text-sm text-gray-600 mb-6">
                    Sign in to your restaurant admin portal
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            required
                            type="email"
                            placeholder="admin@restaurant.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            required
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:bg-gray-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition-colors mt-6 disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}