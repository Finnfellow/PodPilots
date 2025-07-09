// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import Dashboard from "./components/Dashboard.tsx";
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
                        onComplete={() => {
                            throw new Error("Function not implemented.");
                        }}
                    />
                }
            />
            <Route path="/Dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            }/>
            <Route path="/callback" element={<Callback />} />
            <Route path="/videos/:slug" element={<VideoPage />} />
        </Routes>
    );
}

export default App;
