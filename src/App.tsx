
import { useState } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
    const [showOnboarding, setShowOnboarding] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Handle onboarding completion
    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        setIsAuthenticated(true);
    };

    if (showOnboarding) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return (
        <div className="app">
            <h1>PodPilot is cleared for takeoff 🛫</h1>
        </div>
    );
}

export default App;

import {useAuth0} from "@auth0/auth0-react";
import TempLoginClass from "./main/TempLoginClass.tsx";
import {useEffect,useState} from "react";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
function App() {
    const { isAuthenticated, isLoading } = useAuth0();
    const path = window.location.pathname;
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (isAuthenticated && path === '/onboarding') {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000); // Hide toast after 3s
        }
    }, [isAuthenticated, path]);

    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <style>{toastAnimation}</style>
            {showToast && <div style={toastStyle}>✅ Login successful!</div>}

            {path === '/onboarding' ? <OnboardingFlow /> : <TempLoginClass />}
        </>
    );
}

export default App;



const toastStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    zIndex: 9999,
    fontSize: '1.2rem',
    opacity: 0,
    animation: 'fadeInOut 3s ease-in-out forwards',
};

const toastAnimation = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -60%); }
  10% { opacity: 1; transform: translate(-50%, -50%); }
  90% { opacity: 1; transform: translate(-50%, -50%); }
  100% { opacity: 0; transform: translate(-50%, -40%); }
}
`;

