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

function App() {

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

        </Routes>
    );
}

export default App;
