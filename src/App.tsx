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