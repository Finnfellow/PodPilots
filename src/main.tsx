import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";


// Early theme init (no React needed)
(() => {
    const saved = localStorage.getItem('pp_dark');
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === '1' || (saved == null && prefers);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
})();


ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

