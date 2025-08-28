// src/components/Settings.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from './ImageUpload';
import { uploadImage } from '../utils/uploadImages';
import { sanitizeForStorage } from '../utils/sanatizefortorage';
import {Link, useNavigate} from 'react-router-dom';

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

    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');

    type SearchResult =
        | {
        type: 'creator';
        id: string;
        user_id: string;
        display_name: string | null;
        avatar_url: string | null;
        description: string | null;
    }
        | {
        type: 'video';
        slug: string;
        title: string;
        description: string | null;
        public_url: string | null;
    };

    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const [viewer, setViewer] = useState<any>(null);
    const [viewerMeta, setViewerMeta] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);


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

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show navbar if user is scrolling up or near the top
            if (currentScrollY < 100) {
                // Hide navbar near top
                setShowNavbar(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down
                setShowNavbar(true);
            } else {
                // Scrolling up
                setShowNavbar(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    useEffect(() => {
        (async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const me = sessionData?.session?.user ?? null;
            setViewer(me);

            if (me?.id) {
                const { data: myMeta, error } = await supabase
                    .from('podcast_metadata')
                    .select('display_name, avatar_url')
                    .eq('user_id', me.id)
                    .single();

                if (!error) {
                    setViewerMeta({
                        display_name: myMeta?.display_name ?? null,
                        avatar_url: myMeta?.avatar_url ?? null,
                    });
                }
            }
        })();
    }, []);


    const handleSearch = async () => {
        try {
            const term = searchTerm.trim();
            if (!term) {
                setResults([]);
                return;
            }

            setSearching(true);
            const like = `%${term}%`;

            const [creatorsRes, videosRes] = await Promise.all([
                // Creators: display_name OR name OR description
                supabase
                    .from('podcast_metadata')
                    .select('id, user_id, display_name, name, avatar_url')
                    .or(`display_name.ilike.${like},name.ilike.${like}`)
                    .limit(20),

                // Videos: title OR filename OR description (type = 'video')
                supabase
                    .from('media_files')
                    .select('slug, ep_title, file_name, public_url, type')
                    .eq('type', 'video')
                    .or(`ep_title.ilike.${like},file_name.ilike.${like}`)
                    .limit(20),
            ]);

            if (creatorsRes.error) throw creatorsRes.error;
            if (videosRes.error) throw videosRes.error;

            const creators: SearchResult[] = (creatorsRes.data ?? []).map((c: any) => ({
                type: 'creator',
                id: c.id,
                user_id: c.user_id,
                display_name: c.display_name ?? c.name ?? null,
                avatar_url: c.avatar_url ?? null,
                description: c.description ?? null,
            }));

            const videos: SearchResult[] = (videosRes.data ?? []).map((v: any) => ({
                type: 'video',
                slug: v.slug,
                title: v.ep_title || v.file_name || 'Untitled Video',
                description: v.ep_description ?? null,
                public_url: v.public_url ?? null,
            }));

            setResults([...creators, ...videos]); // ✅ single unified list
        } catch (err) {
            console.error('❌ Search error:', err);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

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
    const logoutAndResetTheme = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        try {
            await supabase.auth.signOut();
        } finally {
            // Force light theme for logged-out visitors
            document.documentElement.setAttribute('data-theme', 'light');
            navigate('/');
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
        <div className={"mainReturn post_bannerLM"}>

            {/* Header */}
            <header className={'dashboard_header'}>
                <nav className={`navbar navbar-expand-xl sticky-top lightMode transition-navbar ${showNavbar ? 'visible' : 'hidden'}`}>
                    <div className="container-fluid px-3">
                        <Link className="navbar-brand" to="/dashboard?tab=Home">
                            <img className="img-fluid" src="/Drawable/PodPilot-Logo-web.png" alt="PodPilot Logo" />
                        </Link>

                        <Link className="navbar-brand logoDM" to="/dashboard?tab=Home">
                            <img className="img-fluid" src="/Drawable/PodPilot-Logo-web_light.png" alt="PodPilot Logo" />
                        </Link>

                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarScroll"
                            aria-controls="navbarScroll"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon" />
                        </button>

                        <div className="collapse navbar-collapse" id="navbarScroll">
                            <div className="d-flex p-1" />

                            <div className="d-flex p-1">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSearch();
                                    }}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <input
                                        id="searchInput"
                                        type="search"
                                        placeholder="Search creators or videos"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'Satoshi, sans-serif',
                                        }}
                                    />

                                    {results.length > 0 && (
                                        <div className="search-dropdown">
                                            {results.map((item) =>
                                                item.type === 'creator' ? (
                                                    <div
                                                        key={`creator-${item.user_id}`}
                                                        className="search-result-item"
                                                        onClick={() => navigate(`/podcasters/${item.user_id}`)}
                                                    >
                                                        <img src={item.avatar_url || '/default-avatar.png'} alt="avatar" className="search-avatar" />
                                                        <div>
                                                            <div className="search-name">{item.display_name || 'Creator'}</div>
                                                            {item.description && <div className="search-description">{item.description.slice(0, 60)}...</div>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={`video-${item.slug}`}
                                                        className="search-result-item"
                                                        onClick={() => navigate(`/videos/${item.slug}`)}
                                                    >
                                                        <div className="search-thumb" />
                                                        <div>
                                                            <div className="search-name">{item.title}</div>
                                                            {item.description && <div className="search-description">{item.description.slice(0, 60)}...</div>}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <button className="searchBtn" type="submit" disabled={searching}>
                                        {searching ? 'Searching…' : 'Search'}
                                    </button>
                                </form>
                            </div>

                            <div className="d-flex p-1">
                                {/* User Avatar */}
                                <button
                                    type="button"
                                    className="dash_avatar"
                                    onClick={() => navigate('/settings')}
                                    title="Open settings"
                                    aria-label="Open settings"
                                    style={{
                                        backgroundImage: `url(${viewerMeta?.avatar_url || viewer?.user_metadata?.avatar_url || '/default-avatar.png'})`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </nav>
            </header>

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
                        <hr style={{ margin: '16px 0', opacity: 0.25 }} />

                        <p style={{ fontSize: '.95rem' }}>
                            Want to sign out?{' '}
                            <a href="#" onClick={logoutAndResetTheme}>
                                Click here to log out
                            </a>
                        </p>

                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="container-fluid footer lightMode">
                <div className="row p-2">
                    <div className="col-12 text-center p-1">
                        <img src="/Drawable/PodPilot-Logo-web.png"
                             alt="PodPilot Logo"/>
                        <p className={'p-1'}>
                            &#169; Copy Right 2025, Presented by PodPilot
                        </p>

                    </div>
                </div>
            </footer>
        </div>
    );

};

export default Settings;
