import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { sanitizeForStorage } from '../utils/sanatizefortorage';
import "./onboardingFlow.css"


type FormData = {
    podcastName: string;
    description: string;
    tags: string[];
    logo: File | null;
    avatar: File | null;
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
        avatar:null,
        youtubeConnected: false,
        instagramConnected: false,
    });
    const [tagInput, setTagInput] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const navigate = useNavigate();


    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            updateFormData('tags', [...formData.tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        updateFormData('tags', formData.tags.filter((tag) => tag !== tagToRemove));
    };

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            const { podcastName, description, tags, logo } = formData;

            const { data: authData } = await supabase.auth.getUser();
            const userId = authData.user?.id;
            if (!userId) throw new Error('User not authenticated');

            let logoUrl: string | null = null;
            let logoPublicId: string | null = null;
            let avatarUrl: string | null = null;
            let avatarPublicId: string | null = null;

            if (logo) {
                const fileName = sanitizeForStorage(logo.name);
                const path = `logos/${Date.now()}-${fileName}`;

                const { error: uploadError } = await supabase.storage.from('logo.bucket').upload(path, logo, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage.from('logo.bucket').getPublicUrl(path);

                logoUrl = publicData?.publicUrl ?? null;
                logoPublicId = path;
            }
            if (formData.avatar) {
                const avatarName = sanitizeForStorage(formData.avatar.name);
                const avatarPath = `avatars/${Date.now()}-${avatarName}`;

                const { error: avatarUploadError } = await supabase.storage
                    .from('avatar.bucket')
                    .upload(avatarPath, formData.avatar, { upsert: true });

                if (avatarUploadError) throw avatarUploadError;

                const { data: avatarPublicData } = supabase.storage
                    .from('avatar.bucket')
                    .getPublicUrl(avatarPath);

                avatarUrl = avatarPublicData?.publicUrl ?? null;
                avatarPublicId = avatarPath;
            }

            const { error: insertError } = await supabase.from('podcast_metadata').upsert([
                {
                    name: podcastName,
                    display_name: podcastName,
                    description,
                    tag: tags,
                    logo_url: logoUrl,
                    logo_public_id: logoPublicId,
                    avatar_url: avatarUrl,
                    avatar_public_id: avatarPublicId,
                    updated_at: new Date().toISOString(),
                    user_id: userId,
                },
            ], {
                onConflict: 'user_id'
            });

            if (insertError) throw insertError;

            localStorage.setItem('justCompletedOnboarding', 'true');
            localStorage.setItem('podcastMetadata', JSON.stringify({
                name: podcastName,
                display_name: podcastName,
                description,
                tag: tags,
                logo_url: logoUrl,
                logo_public_id: logoPublicId
            }));

            console.log('✅ Podcast metadata saved');
            navigate('/dashboard');
        } catch (err) {
            console.error('❌ Failed to save onboarding data:', err);
            alert('There was an error saving your podcast setup.');
        }
    };

    const renderStep4 = () => (
        <div className="onboarding-card">
            <h2>🎙️ Tell Us About Your Podcast</h2>
            <p>Set up your podcast details to get started</p>

            <input
                type="text"
                className="form-input"
                placeholder="Podcast Name"
                value={formData.podcastName}
                onChange={(e) => updateFormData('podcastName', e.target.value)}
            />

            <textarea
                className="form-textarea"
                placeholder="Podcast Description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
            />

            <div className="tag-input-container">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Add tags (press Enter or click Add)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                        }
                    }}
                />
                <button className="add-tag-btn" onClick={addTag} disabled={!tagInput.trim()}>
                    Add
                </button>
            </div>

            {formData.tags.length > 0 && (
                <div className="tags-container">
                    {formData.tags.map((tag, index) => (
                        <span className="tag" key={index}>
              {tag}
                            <button className="remove-tag" onClick={() => removeTag(tag)}>
                ×
              </button>
            </span>
                    ))}
                </div>
            )}

            <div className="navigation-buttons">
                <button onClick={prevStep} className="nav-btn secondary" disabled={currentStep === 1}>Previous</button>
                <button onClick={nextStep} className="nav-btn primary" disabled={!formData.podcastName.trim() || !formData.description.trim()}>Next</button>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="onboarding-card">
            <h2>📸 Upload Branding</h2>
            <p>Enhance your podcast's identity with a logo and avatar</p>

            {/* Logo Upload */}
            <label className="file-upload-label">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        updateFormData("logo", file);
                        setLogoPreview(file ? URL.createObjectURL(file) : null);
                    }}
                    style={{ display: "none" }}
                />
                <div className="upload-area">
                    {formData.logo ? formData.logo.name : "Upload Logo (PNG, JPG, SVG)"}
                </div>
            </label>

            {logoPreview && (
                <div className="preview-container">
                    <p className="small text-muted">Logo Preview:</p>
                    <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="img-fluid"
                        style={{ maxHeight: "120px", marginTop: "8px" }}
                    />
                </div>
            )}

            {/* Avatar Upload */}
            <label className="file-upload-label mt-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        updateFormData("avatar", file);
                        setAvatarPreview(file ? URL.createObjectURL(file) : null);
                    }}
                    style={{ display: "none" }}
                />
                <div className="upload-area">
                    {formData.avatar ? formData.avatar.name : "Upload Avatar (PNG, JPG)"}
                </div>
            </label>

            {avatarPreview && (
                <div className="preview-container d-flex align-items-center mt-2">
                    <p className="small text-muted me-2">Avatar Preview:</p>
                    <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="rounded-circle"
                        style={{ width: "64px", height: "64px", objectFit: "cover" }}
                    />
                </div>
            )}

            <div className="navigation-buttons mt-4">
                <button onClick={prevStep} className="nav-btn secondary">Previous</button>
                <button onClick={nextStep} className="nav-btn primary">Next</button>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="onboarding-card">
            <h2>🔗 Connect Your Platforms</h2>
            <p>Link your social accounts for easy publishing (optional)</p>

            <div className="social-connections">
                {["youtubeConnected", "instagramConnected"].map((platform) => {
                    const label = platform === 'youtubeConnected' ? 'YouTube' : 'Instagram';
                    const connected = formData[platform as keyof FormData] as boolean;
                    return (
                        <div key={platform} className="connection-item">
                            <span>{label}</span>
                            <button
                                className={`connection-btn ${connected ? 'connected' : ''}`}
                                onClick={() => updateFormData(platform as keyof FormData, !connected)}
                            >
                                {connected ? '✓ Connected' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="launch-box">
                <div className="rocket-icon">🚀</div>
                <h3>You're ready for takeoff!</h3>
                <p>Everything’s set up. Launch your dashboard to get started.</p>
            </div>

            <div className="navigation-buttons">
                <button onClick={prevStep} className="nav-btn secondary">Previous</button>
                <button onClick={handleSubmit} className="nav-btn primary">Launch Dashboard 🚀</button>
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
        <div className="onboarding-container">
            <div className="top-step-indicator">
                Step {currentStep - 3} of 3
            </div>
            {renderCurrentStep()}
        </div>
    );
};

export default OnboardingFlow;
