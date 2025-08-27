// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import Dashboard from "./components/Dashboard.tsx";
import PodcasterProfile from './components/podcasterProfile.tsx';
import Callback from "./components/CallBack.tsx";
import ProtectedRoute from "../src/components/protectedRoute.tsx";
import VideoPage from "./VideoPage.tsx";
import Settings from "./components/Settings.tsx";
import AuthFinish from "./components/common/AuthFinish.tsx";
import {useEffect} from "react";
import {supabase} from "./supabaseClient.ts";

function App() {
    useEffect(() => {
        // Apply saved preference on first paint
        const savedDark = localStorage.getItem('pp_dark') === '1';
        document.documentElement.setAttribute('data-theme', savedDark ? 'dark' : 'light');

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                // Logged out: show light theme, but DO NOT change the saved preference
                document.documentElement.setAttribute('data-theme', 'light');
                return;
            }
            // Logged in: honor saved preference
            const preferDark = localStorage.getItem('pp_dark') === '1';
            document.documentElement.setAttribute('data-theme', preferDark ? 'dark' : 'light');
        });

        return () => sub.subscription.unsubscribe();
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
            <Route path="/profile/:user_id" element={<PodcasterProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/finish" element={<AuthFinish />} />

        </Routes>
    );
}

export default App;
