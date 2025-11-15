import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { initializeErrorHandlers } from "./lib/errorHandler";
import { initializePerformanceMonitoring } from "./lib/performance";

// Initialize global error handlers and performance monitoring
initializeErrorHandlers();
initializePerformanceMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
