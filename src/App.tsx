// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./main/Home.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
            </Routes>
        </Router>
    );
}

export default App;
