// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import Dashboard from "./components/Dashboard.tsx";
import NewEpisodeUpload from "./components/NewEpisodeUpload.tsx";
import Callback from "./components/CallBack.tsx";

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
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/NewEpisodeUpload" element={<NewEpisodeUpload />} />
            <Route path="/callback" element={<Callback />} />
        </Routes>
    );
}

export default App;
