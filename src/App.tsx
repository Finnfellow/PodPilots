

// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import Dashboard from "./components/Dashboard.tsx";
import NewEpisodeUpload from "./components/NewEpisodeUpload.tsx";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/onboarding" element={<OnboardingFlow onComplete={function(): void {
                    throw new Error("Function not implemented.");
                } } />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/NewEpisodeUpload" element={<NewEpisodeUpload />} />
            </Routes>
        </Router>
    );
}

export default App;

