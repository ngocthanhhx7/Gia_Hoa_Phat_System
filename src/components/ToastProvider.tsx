import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1e293b",
          color: "#f8fafc",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          fontSize: "14px",
        },
        success: {
          iconTheme: { primary: "#22c55e", secondary: "#f8fafc" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
        },
      }}
    />
  );
}
