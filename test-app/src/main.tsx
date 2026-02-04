import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from 'axios'
import './index.css';
import App from "./App";

axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 401 errors to console as they're expected for unauthenticated requests
    if (error.response?.status === 401) {
      // Handle 401 silently
      return Promise.reject(error);
    }
    // Log other errors
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
