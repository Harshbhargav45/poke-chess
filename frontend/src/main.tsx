import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App";
import "./index.css";
import "./App.css";

// Polyfill Buffer for Solana/Anchor compatibility
globalThis.Buffer = Buffer;

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
