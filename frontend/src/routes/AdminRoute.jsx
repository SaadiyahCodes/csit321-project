//frontend/src/routes/AdminRoute.jsx
import {Navigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({children}) {
    const {user, loading} = useAuth();

    if(loading) return <p>Loading...</p>
    if (!user || !user.is_admin) {
        return <Navigate to="/login" replace />;
    }

    return children;
}