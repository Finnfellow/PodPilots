import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import {Auth0ProviderWithNavigate} from "./components/Auth0ProviderWithNavigate.tsx";
import {SupabaseAuthBridge} from "./components/common/SupabaseAuthBridge.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Auth0ProviderWithNavigate>
                <SupabaseAuthBridge />
                <App />
            </Auth0ProviderWithNavigate>
        </BrowserRouter>
    </React.StrictMode>
);
