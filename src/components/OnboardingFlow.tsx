import React, { useState } from 'react';

interface FormData {

    podcastName: string;
    description: string;
    logo: File | null;

    username: string;
    password: string;
    verifyPassword: string;
    email: string;
    podcastName: string;
    description: string;
    logo: File | null;
    youtubeConnected: boolean;
    instagramConnected: boolean;

}

interface OnboardingFlowProps {
    onComplete?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState<FormData>({
        podcastName: '',
        description: '',
        logo: null,

    const [verificationCode, setVerificationCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const correctCode = '123456'; // In real app, this would come from backend
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        verifyPassword: '',
        email: '',
        podcastName: '',
        description: '',
        logo: null,
        youtubeConnected: false,
        instagramConnected: false,

    });

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };


    const nextStep = () => {
        if (currentStep < 2) {

    const handleVerification = () => {
        if (verificationCode === correctCode) {
            setIsVerified(true);
            // Auto advance to next step after successful verification
            setTimeout(() => {
                nextStep();
            }, 500);
        } else {
            alert('Incorrect verification code. Please try again.');
        }
    };

    const nextStep = () => {
        // For step 3, check if verification is complete
        if (currentStep === 3 && !isVerified) {
            return; // Don't allow progression without verification
        }

        if (currentStep < 6) {

            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        console.log('Onboarding complete:', formData);
        if (onComplete) {
            onComplete();
        }
    };

    const renderStep1 = () => (
        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>


            <h2 className="step-title">Create Your Podcast</h2>
            <p className="step-subtitle">Set up your podcast details to get started</p>

            <h2 className="step-title">Create Your Account</h2>
            <p className="step-subtitle">Let's get started with your basic information</p>

            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="auth-section">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => updateFormData('username', e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    className="nav-btn primary"
                >
                    Next
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>

            <h2 className="step-title">Secure Your Account</h2>
            <p className="step-subtitle">Create a strong password to protect your account</p>

            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="auth-section">
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Verify Password"
                        value={formData.verifyPassword}
                        onChange={(e) => updateFormData('verifyPassword', e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}
                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    className="nav-btn primary"
                >
                    Next
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>

            <h2 className="step-title">Verify Your Email</h2>
            <p className="step-subtitle">We've sent a verification code to {formData.email}</p>

            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="auth-section">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="form-input"
                    />
                </div>

                <button type="button" className="secondary-btn">
                    Resend Code
                </button>

                <button
                    type="button"
                    onClick={handleVerification}
                    className="primary-btn"
                    disabled={!verificationCode.trim()}
                >
                    Verify
                </button>

                {isVerified && (
                    <div className="verification-success">
                        ✅ Email verified successfully!
                    </div>
                )}
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}
                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    className={`nav-btn primary ${currentStep === 3 && !isVerified ? 'disabled' : ''}`}
                    disabled={currentStep === 3 && !isVerified}
                >
                    Next
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>

            <h2 className="step-title">Tell Us About Your Podcast</h2>
            <p className="step-subtitle">Let's set up your podcast details</p>


            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="podcast-setup">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Podcast Name"
                        value={formData.podcastName}
                        onChange={(e) => updateFormData('podcastName', e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
          <textarea
              placeholder="Podcast Description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="form-textarea"
              rows={4}
          />
                </div>
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}

                    disabled={currentStep === 1}

                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    className="nav-btn primary"
                >
                    Next
                </button>
            </div>
        </div>
    );


    const renderStep2 = () => (

    const renderStep5 = () => (

        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>


            <h2 className="step-title">Add Your Podcast Logo</h2>
            <p className="step-subtitle">Upload a logo for your podcast (optional)</p>

            <h2 className="step-title">Upload Your Podcast Logo</h2>
            <p className="step-subtitle">Add a logo to make your podcast stand out</p>


            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="podcast-setup">
                <div className="form-group">
                    <label className="file-upload-label">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => updateFormData('logo', e.target.files?.[0] || null)}
                            className="file-input"
                            style={{ display: 'none' }}
                        />
                        <div className="upload-area">
                            <span className="upload-icon">📁</span>
                            {formData.logo ? formData.logo.name : 'Upload Logo (PNG, JPG, SVG)'}
                        </div>
                    </label>
                </div>

                {formData.logo && (
                    <div className="file-preview">
                        <p>✅ Logo uploaded: {formData.logo.name}</p>
                    </div>
                )}
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}
                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button

                    onClick={handleSubmit}
                    className="nav-btn primary"
                >
                    Create Podcast

                    onClick={nextStep}
                    className="nav-btn primary"
                >
                    Next
                </button>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="onboarding-card">
            <div className="logo-section">
                <div className="logo">
                    <span className="logo-text">PodPilot</span>
                </div>
            </div>

            <h2 className="step-title">Connect Your Platforms</h2>
            <p className="step-subtitle">Link your social media accounts for easy publishing</p>

            <div className="step-indicator">
                <div className="step-circle active">{currentStep}</div>
            </div>

            <div className="podcast-setup">
                <div className="social-connections">
                    <div className="connection-item">
                        <div>
                            <span>📺 YouTube</span>
                            <p className="connection-desc">Publish audio with generated visuals</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateFormData('youtubeConnected', !formData.youtubeConnected)}
                            className={`connection-btn ${formData.youtubeConnected ? 'connected' : ''}`}
                        >
                            {formData.youtubeConnected ? '✓ Connected' : 'Connect'}
                        </button>
                    </div>

                    <div className="connection-item">
                        <div>
                            <span>📸 Instagram</span>
                            <p className="connection-desc">Share podcast clips as Reels</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateFormData('instagramConnected', !formData.instagramConnected)}
                            className={`connection-btn ${formData.instagramConnected ? 'connected' : ''}`}
                        >
                            {formData.instagramConnected ? '✓ Connected' : 'Connect'}
                        </button>
                    </div>
                </div>

                <p className="skip-text">You can connect these later in your dashboard</p>
            </div>

            <div className="navigation-buttons">
                <button
                    onClick={prevStep}
                    className="nav-btn secondary"
                >
                    Previous
                </button>
                <button
                    onClick={handleSubmit}
                    className="nav-btn primary"
                >
                    Finish

                </button>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();

            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            case 5:
                return renderStep5();
            case 6:
                return renderStep6();

            default:
                return renderStep1();
        }
    };

    return (
        <>
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    {renderCurrentStep()}
                </div>

                <footer style={{
                    backgroundColor: '#ffffff',
                    borderTop: '1px solid #E5E7EB',
                    padding: '3rem 2rem',
                    marginTop: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '4rem',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{ fontSize: '2rem' }}>🎙️</div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4rem',
                            flex: 1
                        }}>
                            <div>
                                <h4 style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>Use cases</h4>
                                {['UI design', 'UX design', 'Wireframing', 'Diagramming', 'Brainstorming', 'Online whiteboard', 'Team collaboration'].map((link) => (
                                    <div key={link} style={{
                                        margin: '0.5rem 0',
                                        fontSize: '0.875rem',
                                        color: '#6C757D',
                                        cursor: 'pointer',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        {link}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h4 style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>Explore</h4>
                                {['Design', 'Prototyping', 'Development features', 'Design systems', 'Collaboration features', 'Design process', 'FigJam'].map((link) => (
                                    <div key={link} style={{
                                        margin: '0.5rem 0',
                                        fontSize: '0.875rem',
                                        color: '#6C757D',
                                        cursor: 'pointer',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        {link}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h4 style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>Resources</h4>
                                {['Blog', 'Best practices', 'Colors', 'Color wheel', 'Support', 'Developers', 'Resource library'].map((link) => (
                                    <div key={link} style={{
                                        margin: '0.5rem 0',
                                        fontSize: '0.875rem',
                                        color: '#6C757D',
                                        cursor: 'pointer',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        {link}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@300;400;500;600;700&display=swap');

        .onboarding-card {
          background: white;
          border-radius: 16px;
          padding: 3rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          max-width: 480px;
          width: 100%;
          border: 1px solid #E8E8E8;
        }

        .logo-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .logo-text {
          font-family: 'Recoleta', serif;
          font-weight: bold;
          font-size: 1.75rem;
          color: #212529;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #212529 0%, #495057 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .step-title {
          text-align: center;
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 500;
          color: #495057;
          font-family: 'Satoshi', sans-serif;
        }

        .step-subtitle {
          text-align: center;
          margin: 0 0 2rem 0;
          font-size: 0.9rem;
          color: #6C757D;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .step-circle {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: #4285F4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-family: 'Satoshi', sans-serif;
          font-size: 1rem;
        }

        .auth-section, .podcast-setup {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 1px solid #E8E8E8;
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: 'Satoshi', sans-serif;
          font-weight: 400;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: #FAFAFA;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #4285F4;
          background: white;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #6C757D;
          font-weight: 400;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
        }

        .file-upload-label {
          display: block;
          cursor: pointer;
        }

        .upload-area {
          padding: 1.25rem;
          border: 2px dashed #CED4DA;
          border-radius: 12px;
          text-align: center;
          color: #6C757D;
          transition: all 0.2s ease;
          background: #FAFAFA;
          font-family: 'Satoshi', sans-serif;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .upload-area:hover {
          border-color: #4285F4;
          color: #4285F4;
          background: #F8F9FF;
        }

        .upload-icon {
          font-size: 1.25rem;
        }

        .social-connections {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 0.5rem 0 1rem 0;
        }

        .connection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #FAFAFA;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
        }

        .connection-item span {
          font-family: 'Satoshi', sans-serif;
          font-weight: 500;
          color: #495057;
        }

        .connection-btn {
          padding: 0.625rem 1.25rem;
          border: 1.5px solid #CED4DA;
          border-radius: 8px;
          background: white;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Satoshi', sans-serif;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .connection-btn:hover {
          border-color: #4285F4;
          color: #4285F4;
        }

        .connection-btn.connected {
          background: #1A8C67;
          color: white;
          border-color: #1A8C67;
        }

        .connection-btn.connected:hover {
          background: #158B5A;
          border-color: #158B5A;
        }

        .primary-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          background: #000000;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-family: 'Satoshi', sans-serif;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .primary-btn:hover {
          background: #333333;
          transform: translateY(-1px);
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #CED4DA;
        }

        .primary-btn:disabled:hover {
          background: #CED4DA;
          transform: none;
        }

        .secondary-btn {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #495057;
          border: 1.5px solid #CED4DA;
          border-radius: 12px;
          font-weight: 500;
          font-family: 'Satoshi', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }

        .secondary-btn:hover {
          background: #F8F9FA;
          border-color: #ADB5BD;
        }

        .verification-success {
          background: #F0F9F0;
          border: 1px solid #1A8C67;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          color: #1A8C67;
          font-family: 'Satoshi', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        .file-preview {
          background: #F8F9FF;
          border: 1px solid #4285F4;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .file-preview p {
          margin: 0;
          color: #4285F4;
          font-family: 'Satoshi', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .connection-desc {
          font-size: 0.8rem;
          color: #6C757D;
          margin: 0.25rem 0 0 0;
          font-family: 'Satoshi', sans-serif;
        }

        .skip-text {
          text-align: center;
          font-size: 0.85rem;
          color: #6C757D;
          margin: 1rem 0;
          font-family: 'Satoshi', sans-serif;
        }

        .navigation-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .nav-btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-weight: 500;
          font-family: 'Satoshi', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-btn.primary {
          background: #000000;
          color: white;
          border: none;
        }

        .nav-btn.primary:hover {
          background: #333333;
          transform: translateY(-1px);
        }

        .nav-btn.secondary {
          background: white;
          color: #495057;
          border: 1.5px solid #CED4DA;
        }

        .nav-btn.secondary:hover {
          background: #F8F9FA;
          border-color: #ADB5BD;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .nav-btn:disabled:hover {
          transform: none;
        }

        .nav-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
        </>
    );
};

export default OnboardingFlow;