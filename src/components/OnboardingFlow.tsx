import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {supabase} from "../supabaseClient.ts";
import {sanitizeForStorage} from "../utils/sanatizefortorage.ts";

type FormData = {
    podcastName: string;
    description: string;
    tags: string[];
    logo: File | null;
    youtubeConnected: boolean;
    instagramConnected: boolean;
};

const OnboardingFlow: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(4);
    const [formData, setFormData] = useState<FormData>({
        podcastName: '',
        description: '',
        tags: [],
        logo: null,
        youtubeConnected: false,
        instagramConnected: false
    });
    const [tagInput, setTagInput] = useState('');
    const navigate = useNavigate();

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            updateFormData('tags', [...formData.tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            const {
                podcastName,
                description,
                tags,
                logo,
            } = formData;

            const { data: authData } = await supabase.auth.getUser();
            const userId = authData.user?.id;
            if (!userId) throw new Error('User not authenticated');

            let logoUrl: string | null = null;
            let logoPublicId: string | null = null;

            if (logo) {
                const fileName = sanitizeForStorage(logo.name);
                const path = `logos/${Date.now()}-${fileName}`;

                const { error: uploadError } = await supabase
                    .storage
                    .from('logo.bucket')
                    .upload(path, logo, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase
                    .storage
                    .from('logo.bucket')
                    .getPublicUrl(path);

                logoUrl = publicData?.publicUrl ?? null;
                logoPublicId = path; // optional but useful
            }

            const { error: insertError } = await supabase
                .from('podcast_metadata')
                .upsert([{
                    name: podcastName,
                    display_name: podcastName,
                    description,
                    tag: tags,
                    logo_url: logoUrl,
                    logo_public_id: logoPublicId,
                    updated_at: new Date().toISOString(),
                    user_id: userId
                }], {
                    onConflict: 'user_id' // so it replaces if already exists
                });

            if (insertError) throw insertError;

            // Store locally if needed
            localStorage.setItem('justCompletedOnboarding', 'true');
            localStorage.setItem('podcastMetadata', JSON.stringify({
                name: podcastName,
                display_name: podcastName,
                description,
                tag: tags,
                logo_url: logoUrl,
                logo_public_id: logoPublicId
            }));

            console.log("✅ Podcast metadata saved");
            navigate('/dashboard');

        } catch (err) {
            console.error("❌ Failed to save onboarding data:", err);
            alert("There was an error saving your podcast setup.");
        }
    };

    // Step 4
    const renderStep4 = () => (
        <div className="onboarding-card">
            {/* header */}
            <div className="logo-section"><div className="logo"><span className="logo-text">PodPilot</span></div></div>
            <h2 className="step-title">Tell Us About Your Podcast</h2>
            <p className="step-subtitle">Set up your podcast details to get started</p>
            <div className="step-indicator"><div className="step-circle active">{currentStep}</div></div>

            {/* form */}
            <div className="podcast-setup">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Podcast Name"
                        value={formData.podcastName}
                        onChange={e => updateFormData('podcastName', e.target.value)}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
          <textarea
              placeholder="Podcast Description"
              value={formData.description}
              onChange={e => updateFormData('description', e.target.value)}
              className="form-textarea"
              rows={4}
              required
          />
                </div>

                <div className="form-group">
                    <div className="tag-input-container">
                        <input
                            type="text"
                            placeholder="Add tags (press Enter or click Add)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                            className="form-input"
                        />
                        <button
                            type="button"
                            onClick={addTag}
                            className="add-tag-btn"
                            disabled={!tagInput.trim()}
                        >
                            Add Tag
                        </button>
                    </div>

                    {formData.tags.length > 0 && (
                        <div className="tags-container">
                            {formData.tags.map((tag, index) => (
                                <span key={index} className="tag">
                  {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="remove-tag">×</button>
                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="navigation-buttons">
                <button onClick={prevStep} className="nav-btn secondary" disabled={currentStep === 1}>Previous</button>
                <button onClick={nextStep} className="nav-btn primary" disabled={!formData.podcastName.trim() || !formData.description.trim()}>Next</button>
            </div>
        </div>
    );

    // Step 5
    const renderStep5 = () => (
        <div className="onboarding-card">
            <div className="logo-section"><div className="logo"><span className="logo-text">PodPilot</span></div></div>
            <h2 className="step-title">Upload Your Podcast Logo</h2>
            <p className="step-subtitle">Add a logo to make your podcast stand out (optional)</p>
            <div className="step-indicator"><div className="step-circle active">{currentStep}</div></div>

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

                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6C757D', marginTop: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>You can upload your logo now or later in your dashboard</p>
                    <p style={{ margin: 0, fontSize: '0.75rem' }}>Recommended size: 1400x1400px, Max: 5MB</p>
                </div>
            </div>

            <div className="navigation-buttons">
                <button onClick={prevStep} className="nav-btn secondary">Previous</button>
                <button onClick={nextStep} className="nav-btn primary">Next</button>
            </div>
        </div>
    );

    // Step 6
    const renderStep6 = () => (
        <div className="onboarding-card">
            <div className="logo-section"><div className="logo"><span className="logo-text">PodPilot</span></div></div>
            <h2 className="step-title">Connect Your Platforms</h2>
            <p className="step-subtitle">Link your social accounts for easy publishing (optional)</p>
            <div className="step-indicator"><div className="step-circle active">{currentStep}</div></div>

            <div className="podcast-setup">
                <div className="social-connections">
                    {['youtubeConnected', 'instagramConnected'].map((platform) => {
                        const label = platform === 'youtubeConnected' ? 'YouTube' : 'Instagram';
                        const desc = platform === 'youtubeConnected'
                            ? 'Publish audio with generated visuals'
                            : 'Share podcast clips as Reels';
                        const connected = formData[platform as keyof FormData] as boolean;

                        return (
                            <div key={platform} className="connection-item">
                                <div>
                                    <span>{platform === 'youtubeConnected' ? '📺' : '📸'} {label}</span>
                                    <p className="connection-desc">{desc}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateFormData(platform as keyof FormData, !connected)}
                                    className={`connection-btn ${connected ? 'connected' : ''}`}
                                >
                                    {connected ? '✓ Connected' : 'Connect'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="skip-text">You can connect these later in your dashboard</p>

                <div style={{ backgroundColor: '#F8F9FF', border: '1px solid #4285F4', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🚀</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#212529' }}>Ready for Takeoff!</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6C757D', margin: 0 }}>Your podcast setup is complete. Let's launch your dashboard!</p>
                </div>
            </div>

            <div className="navigation-buttons">
                <button onClick={prevStep} className="nav-btn secondary">Previous</button>
                <button onClick={handleSubmit} className="nav-btn primary" style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 100%)', fontWeight: '600' }}>
                    Launch Dashboard 🚀
                </button>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 4: return renderStep4();
            case 5: return renderStep5();
            case 6: return renderStep6();
            default: return renderStep4();
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
            </div>
            <style>{`
  .onboarding-card {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    max-width: 480px;
    width: 100%;
    border: 1px solid #E8E8E8;
  }

  /* ... rest of your styles ... */
`}</style>
        </>
    );
};


export default OnboardingFlow;
