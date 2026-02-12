import React from "react";
import ReactDOM from "react-dom/client";
import App from "./studio_app";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = ReactDOM.createRoot(document.getElementById("root")!);

if (!PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY. Rendering fallback UI.");
  root.render(
    <React.StrictMode>
      <div className="h-full w-full flex items-center justify-center text-white">
        Missing VITE_CLERK_PUBLISHABLE_KEY
      </div>
    </React.StrictMode>,
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>,
  );
}

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
