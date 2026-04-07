// src/components/Toast.jsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

const ICONS = {
  success: <CheckCircle size={18} style={{ color: "#16a34a" }} />,
  error:   <XCircle    size={18} style={{ color: "#dc2626" }} />,
  info:    <AlertCircle size={18} style={{ color: "#f97316" }} />,
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  info:    { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
};

export function Toast({ message, type = "success", onClose }) {
  const c = COLORS[type];

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: "90px", left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: "12px",
      padding: "12px 16px",
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      zIndex: 9999,
      maxWidth: "calc(100vw - 32px)",
      minWidth: "260px",
      animation: "slideUp 0.25s ease",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {ICONS[type]}
      <span style={{ fontSize: "13px", fontWeight: 500, color: c.text, flex: 1 }}>
        {message}
      </span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <X size={14} style={{ color: c.text, opacity: 0.6 }} />
      </button>
    </div>
  );
}

// Hook for easy usage
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  const hideToast = () => setToast(null);

  const ToastContainer = toast ? (
    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, ToastContainer };
}