// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import Dashboard from "./components/Dashboard.tsx";
import PodcasterProfile from './components/podcasterProfile.tsx';
//import NewEpisodeUpload from "./components/NewEpisodeUpload.tsx";
import Callback from "./components/CallBack.tsx";
import ProtectedRoute from "../src/components/protectedRoute.tsx";
import VideoPage from "./VideoPage.tsx";
import {useEffect} from "react";
import {supabase} from "./supabaseClient.ts";


function App() {

    useEffect(() => {
        const handleUnload = () => {
            // Fire-and-forget sign-out
            supabase.auth.signOut();

            // Force-remove session from localStorage (works even if signOut fails)
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith("sb-")) {
                    localStorage.removeItem(key);
                }
            });
        };

        window.addEventListener("unload", handleUnload);
        return () => {
            window.removeEventListener("unload", handleUnload);
        };
    }, []);
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route
                path="/onboarding"
                element={
                    <OnboardingFlow
                    />
                }
            />
            <Route path="/Dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            }/>
            <Route path="/podcasters/:user_id" element={<PodcasterProfile />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/videos/:slug" element={<VideoPage />} />
        </Routes>
    );
}

export default App;
