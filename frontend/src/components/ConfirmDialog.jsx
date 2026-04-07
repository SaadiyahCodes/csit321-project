// src/components/ConfirmDialog.jsx
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor = "#f97316" }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
      />

      {/* Dialog */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "28px 24px",
        width: "320px",
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        animation: "popIn 0.2s ease",
      }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.92); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>

        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          backgroundColor: "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <AlertTriangle size={22} style={{ color: "#dc2626" }} />
        </div>

        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#111827", textAlign: "center" }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px",
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px", fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px",
              backgroundColor: confirmColor,
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// Hook for easy usage
export function useConfirm() {
  const [dialog, setDialog] = useState(null);

  const confirm = (message, confirmLabel = "Confirm", confirmColor = "#f97316") =>
    new Promise((resolve) => {
      setDialog({
        message,
        confirmLabel,
        confirmColor,
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel:  () => { setDialog(null); resolve(false); },
      });
    });

  const ConfirmContainer = dialog ? (
    <ConfirmDialog
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      confirmColor={dialog.confirmColor}
      onConfirm={dialog.onConfirm}
      onCancel={dialog.onCancel}
    />
  ) : null;

  return { confirm, ConfirmContainer };
}