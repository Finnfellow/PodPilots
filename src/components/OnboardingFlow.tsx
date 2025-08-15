import React, {useEffect, useState} from 'react';
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
    const navigate = useNavigate();
    useEffect(() => {
        const checkIfUserExists = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) return;

            const { data } = await supabase
                .from('podcast_metadata')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (data) {
                alert("You already have an account. Redirecting to dashboard...");
                navigate('/dashboard'); // ✅ now safe to call
            } else {
                console.log("🆕 No metadata found. Proceed with onboarding.");
            }
        };

        checkIfUserExists();
    }, []);

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

    /*new code*/
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    /*end*/





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
            setSubmitError(null);
            setSubmitting(true);

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
            <h2>✅ Review & Launch</h2>
            <p>Double-check your podcast details before launching.</p>

            {/* Optional inline error */}
            {submitError && (
                <div style={{ color: '#b00020', margin: '0 0 12px' }}>
                    {submitError}
                </div>
            )}

            <div className="review-grid" style={{ display: 'grid', gap: '16px' }}>
                {/* Name */}
                <section className="review-section" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0 }}>Podcast name</h4>
                        <button type="button" className="link-btn" onClick={() => setCurrentStep(4)} style={{ background: 'none', border: 'none', color: '#1A8C67', cursor: 'pointer' }}>
                            Edit
                        </button>
                    </div>
                    <div className="review-value" style={{ marginTop: 8, fontWeight: 600 }}>
                        {formData.podcastName || '—'}
                    </div>
                </section>

                {/* Description */}
                <section className="review-section" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0 }}>Description</h4>
                        <button type="button" className="link-btn" onClick={() => setCurrentStep(4)} style={{ background: 'none', border: 'none', color: '#1A8C67', cursor: 'pointer' }}>
                            Edit
                        </button>
                    </div>
                    <p style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {formData.description || '—'}
                    </p>
                </section>

                {/* Tags */}
                <section className="review-section" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0 }}>Tags</h4>
                        <button type="button" className="link-btn" onClick={() => setCurrentStep(4)} style={{ background: 'none', border: 'none', color: '#1A8C67', cursor: 'pointer' }}>
                            Edit
                        </button>
                    </div>
                    {formData.tags.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            {formData.tags.map((t, i) => (
                                <span key={i} style={{ padding: '4px 10px', background: '#F0F7F4', color: '#1A8C67', border: '1px solid #D9EFE5', borderRadius: 999, fontSize: 12 }}>
                {t}
              </span>
                            ))}
                        </div>
                    ) : (
                        <div style={{ marginTop: 8 }}>—</div>
                    )}
                </section>

                {/* Logo + Avatar */}
                <section className="review-section" style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h4 style={{ margin: 0 }}>Branding</h4>
                        <button type="button" className="link-btn" onClick={() => setCurrentStep(5)} style={{ background: 'none', border: 'none', color: '#1A8C67', cursor: 'pointer' }}>
                            Edit
                        </button>
                    </div>

                    <div className="review-media" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Logo</div>
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo preview" style={{ marginTop: 8, maxHeight: 120, width: 'auto' }} />
                            ) : (
                                <div style={{ marginTop: 8, color: '#6c757d' }}>No logo selected</div>
                            )}
                        </div>

                        <div>
                            <div style={{ fontSize: 12, color: '#6c757d' }}>Avatar</div>
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    style={{ marginTop: 8, width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <div style={{ marginTop: 8, color: '#6c757d' }}>No avatar selected</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <div className="launch-box" style={{ marginTop: 16, background: '#F8FFF9', border: '1px solid #E2F5E8', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div className="rocket-icon" style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
                <h3 style={{ margin: 0 }}>You're ready for takeoff!</h3>
                <p style={{ marginTop: 6, color: '#495057' }}>Everything’s set up. Launch your dashboard to get started.</p>
            </div>

            <div className="navigation-buttons" style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={prevStep} className="nav-btn secondary">Previous</button>
                <button
                    onClick={handleSubmit}
                    className="nav-btn primary"
                    disabled={
                        submitting ||
                        !formData.podcastName.trim() ||
                        !formData.description.trim()
                    }
                >
                    {submitting ? 'Saving…' : 'Launch Dashboard 🚀'}
                </button>
            </div>
        </div>
    );



    /*const renderStep6 = () => (
        <div className="onboarding-card">
            <h2>Review</h2>
            <p>Please review your information. If you must correct a field, please click <strong>previous</strong> to go back.</p>

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
    );*/

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
