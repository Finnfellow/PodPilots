// src/components/Settings.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from './ImageUpload';
import { uploadImage } from '../utils/uploadImages';
import { sanitizeForStorage } from '../utils/sanatizefortorage';
import { useNavigate } from 'react-router-dom';

type MetaRow = {
    user_id: string;
    name?: string | null;           // You’ve been using `name` in Dashboard
    display_name?: string | null;   // PodcasterProfile uses `display_name`
    description?: string | null;
    avatar_url?: string | null;
    logo_url?: string | null;
    updated_at?: string | null;
};

const Settings: React.FC = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form fields
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // dark mode (persisted; you’ll style it later)
    const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('pp_dark') === '1');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('pp_dark', darkMode ? '1' : '0');
    }, [darkMode]);

    useEffect(() => {
        (async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const u = sessionData?.session?.user ?? null;
            setUser(u);

            if (u?.id) {
                const { data, error } = await supabase
                    .from('podcast_metadata')
                    .select('*')
                    .eq('user_id', u.id)
                    .single();

                if (!error && data) {
                    const m = data as MetaRow;
                    setDisplayName(m.name || m.display_name || '');
                    setDescription(m.description || '');
                    setAvatarUrl(m.avatar_url || null);
                    setLogoUrl(m.logo_url || null);
                }
            }

            setLoading(false);
        })();
    }, []);
    useEffect(() => {
        (async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const u = sessionData?.session?.user;
            if (!u) {
                // change to your auth route if different
                navigate('/');
            }
        })();
    }, [navigate]);
    // Upload handlers (same pattern you used in Dashboard)
    const handleAvatarUpload = async (file: File) => {
        try {
            if (!user?.id) throw new Error('Not authenticated');
            const safeName = sanitizeForStorage(file.name);
            const path = `avatars/${Date.now()}-${safeName}`;
            const url = await uploadImage(file, 'avatar.bucket', path);

            const { error } = await supabase
                .from('podcast_metadata')
                .update({ avatar_url: url, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);

            if (error) throw error;
            setAvatarUrl(url);
            localStorage.setItem('avatarPath', path);
        } catch (e) {
            console.error('❌ Avatar upload failed:', (e as any)?.message);
        }
    };

    const handleLogoUpload = async (file: File) => {
        try {
            if (!user?.id) throw new Error('Not authenticated');
            const safeName = sanitizeForStorage(file.name);
            const path = `logos/${Date.now()}-${safeName}`;
            const url = await uploadImage(file, 'logo.bucket', path);

            const { error } = await supabase
                .from('podcast_metadata')
                .update({ logo_url: url, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);

            if (error) throw error;
            setLogoUrl(url);
            localStorage.setItem('logoPath', path);
        } catch (e) {
            console.error('❌ Logo upload failed:', (e as any)?.message);
        }
    };
    const handleLogoutClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            navigate('/'); // or '/login' if you prefer
        }
    };
    const save = async () => {
        if (!user?.id) return;
        const name = displayName.trim();
        setSaving(true);
        try {
            // Update both `name` and `display_name` to keep your two pages in sync
            const { error } = await supabase
                .from('podcast_metadata')
                .upsert(
                    {
                        user_id: user.id,
                        name,
                        display_name: name,
                        description,
                        avatar_url: avatarUrl,
                        logo_url: logoUrl,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                );

            if (error) throw error;
            navigate('/dashboard'); // go back after save (optional)
        } catch (e) {
            console.error('❌ Failed to save settings:', (e as any)?.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 24 }}>Loading settings…</div>;

    return (
        <div className="mainSec" style={{ maxWidth: 820 }}>
            <div className="welcomeSec">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>Settings</h2>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                        <label className="form-label">Display name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>

                    <div>
                        <label className="form-label">Podcast description</label>
                        <textarea
                            className="form-control"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your podcast"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="form-label">Avatar</label>
                            <ImageUpload
                                currentImage={avatarUrl || undefined}
                                onImageUpload={handleAvatarUpload}
                                type="avatar"
                                size="sm"
                            />
                        </div>
                        <div>
                            <label className="form-label">Logo</label>
                            <ImageUpload
                                currentImage={logoUrl || undefined}
                                onImageUpload={handleLogoUpload}
                                type="podcast"
                                size="sm"
                            />
                        </div>
                    </div>

                    <div className="form-check form-switch" style={{ paddingTop: 6 }}>
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="pp-darkmode"
                            checked={darkMode}
                            onChange={(e) => setDarkMode(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="pp-darkmode">
                            Enable dark mode (coming soon)
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={save}
                            disabled={!displayName.trim() || saving}
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                    <hr style={{ margin: '24px 0' }} />
                    <div style={{ textAlign: 'center' }}>
                        <a href="/logout" onClick={handleLogoutClick}>
                            Click here to log out
                        </a>
                    </div>

                </div>
            </div>
        </div>

    );

};

export default Settings;
