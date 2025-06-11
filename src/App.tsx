import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import { userService, type UserProfile } from './utils/cloudStorage';
import './App.css';

function App() {
    const [currentView, setCurrentView] = useState<'onboarding' | 'dashboard' | 'loading'>('loading');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        // Check if user has completed onboarding
        const profile = userService.getUserProfile();
        const podcastMetadata = userService.getPodcastMetadata();

        if (profile && podcastMetadata) {
            setUserProfile(profile);
            setCurrentView('dashboard');
        } else {
            setCurrentView('onboarding');
        }
    }, []);

    const handleOnboardingComplete = () => {
        const profile = userService.getUserProfile();
        setUserProfile(profile);
        setCurrentView('dashboard');
    };

    if (currentView === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '3rem',
                        marginBottom: '1rem',
                        animation: 'bounce 1s infinite'
                    }}>
                        🎙️
                    </div>
                    <h2 style={{
                        fontFamily: 'Recoleta, serif',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#212529',
                        margin: '0 0 0.5rem 0'
                    }}>
                        PodPilot
                    </h2>
                    <p style={{
                        color: '#6C757D',
                        margin: 0,
                        fontSize: '1rem'
                    }}>
                        Preparing for takeoff...
                    </p>
                </div>

                <style>{`
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0);
                        }
                        40% {
                            transform: translateY(-10px);
                        }
                        60% {
                            transform: translateY(-5px);
                        }
                    }
                `}</style>
            </div>
        );
    }

    if (currentView === 'onboarding') {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    if (currentView === 'dashboard') {
        return <Dashboard />;
    }

    return (
        <div className="app">
            <h1>PodPilot is cleared for takeoff 🛫</h1>
        </div>
    );
}

export default App;