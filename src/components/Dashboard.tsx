
import React, { useState, useEffect} from 'react';
import {supabase} from '../supabaseClient.ts';
import ImageUpload from './ImageUpload.tsx';
import { uploadImage } from "../utils/uploadImages.ts";
import { userService, type UserProfile, type PodcastMetadata } from '../utils/cloudStorage';
import {useLocation, useNavigate, Link} from "react-router-dom";
import {sanitizeForStorage} from "../utils/sanatizefortorage.ts";
import '../main/style.css';
import AvatarDropdown from './AvatarDropdown';




interface Episode {
    id: string;
    title: string;
    description: string;
    publishDate: string;
    duration: string;
    status: 'draft' | 'published';
    audioFile?: string;
    videoUrl?: string;
}

interface PodcastStats {
    totalEpisodes: number;
    totalPlays: number;
    rssUrl: string;
}

interface DashboardProps {
    onNavigateToUpload?: () => void;
}

const getAvatarPublicUrl = (path: string): string => {
    const { data } = supabase.storage.from("avatar.bucket").getPublicUrl(path);
    return data?.publicUrl ?? "";
};

export const getLogoPublicUrl = (path: string): string => {
    const { data } = supabase.storage.from("logo.bucket").getPublicUrl(path);
    return data?.publicUrl ?? "";
};

const Dashboard: React.FC<DashboardProps> = ({ }) => {
    type Tab = 'Home' | 'episodes';
    const [activeTab, setActiveTab] = useState<'Home' | 'episodes'>('Home');
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [podcast_metadata, setPodcast_metadata] = useState<PodcastMetadata | null>(null);
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', tags: [] as string[] });
    const [tagInput, setTagInput] = useState('');
    const [user, setUser] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [logoUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [recentVideos, setRecentVideos] = useState<
        { name: string; createdAt: string; publicUrl: string; slug: string; likeCount: number }[]
    >([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<PodcastMetadata[]>([]);
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    const location = useLocation();
    const [loading, setLoading] = useState(true);



    const handleSearch = async () => {
        try {
            const term = searchTerm.trim();
            if (!term) return;

            console.log(`🧪 Final trimmed search term: '${term}'`);

            const { data, error } = await supabase
                .from('podcast_metadata')
                .select(`
                id,
                name,
                description,
                avatar_url,
                user_id,
                tag,
                created_at,
                display_name
            `);

            if (error) throw error;

            console.log("🧠 Supabase full metadata:", data);

            // Perform filtering client-side just to confirm what's being searched
            const filtered = data?.filter((entry) =>
                entry.display_name?.toLowerCase().includes(term.toLowerCase())
            ) || [];

            console.log("🔍 Filtered search results:", filtered);
            setSearchResults(filtered);
        } catch (err) {
            console.error('❌ Search error:', err);
        }
    };

    const loadImages = async () => {
        const avatarPath = localStorage.getItem('avatarPath');
        const logoPath = localStorage.getItem('logoPath');
        const videoPath = localStorage.getItem('videoPath');
        if (avatarPath) {
            const url = getAvatarPublicUrl(avatarPath); // ✅ Using improved helper
            setAvatarUrl(url);
            setPodcast_metadata((prev) =>
                prev ? { ...prev, avatar_url: url } : prev
            );
        }

        if (logoPath) {
            const url = getLogoPublicUrl(logoPath);
            setPodcast_metadata(prev => prev ? { ...prev, logo_url: url } : prev);
        }
        if (videoPath) {
            const { data } = supabase.storage.from("video.bucket").getPublicUrl(videoPath);
            setVideoUrl(data?.publicUrl ?? null);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };
0
   /* // Define recentEpisodes
    const [recentEpisodes] = useState<Episode[]>([]);*/

    const handleVideoUpload = async (file: File) => {
        try {
            const userId = user?.id;

            if (!userId) throw new Error("User not authenticated");

            const safeName = sanitizeForStorage(file.name);
            const path = `videos/${Date.now()}-${safeName}`;
            const slug = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-_]/g, "");


            // ✅ Upload to the correct bucket
            const { error: uploadError } = await supabase.storage
                .from("video.bucket")
                .upload(path, file, { upsert: true });

            if (uploadError) throw uploadError;

            // ✅ Get public URL
            const { data: publicData } = supabase.storage
                .from("video.bucket")
                .getPublicUrl(path);

            const url = publicData?.publicUrl;

            // ✅ Save to local state and localStorage
            setVideoUrl(url);
            localStorage.setItem("videoPath", path);

            // ✅ Save metadata to video_uploads table
            const { error: insertError } = await supabase
                .from("media_files")
                .insert([
                    {
                        user_id: userId,           // 👈 now it will match
                        file_name: file.name,
                        storage_path: path,
                        public_url: url,
                        file_size: file.size,
                        uploaded_at: new Date().toISOString(),
                        slug: slug,       // e.g. "my-first-episode"
                        type: "video"
                    }
                ]);

            if (insertError) throw insertError;

            console.log("✅ Video uploaded and metadata saved");
            await fetchRecentVideos(userId);
            await fetchUserEpisodes(userId);
        } catch (err) {
            console.error("❌ Video upload failed:", err);
        }


    };
    //new code
    const handleAvatarUpload = async (file: File) => {
        try {
            const userId = user?.id || user?.sub;
            if (!userId) throw new Error("User not authenticated");

            const safeName = sanitizeForStorage(file.name);
            const path = `avatars/${Date.now()}-${safeName}`;
            const url = await uploadImage(file, "avatar.bucket", path);

            // ✅ Store the actual path in localStorage so it can be resolved later
            localStorage.setItem("avatarPath", path); // <-- this is new

            // ✅ Update state for immediate display
            setUserProfile((prev) =>
                prev ? { ...prev, avatarUrl: url ?? undefined } : prev
            );
            // ✅ Update the Supabase table
            const { error } = await supabase
                .from("podcast_metadata")
                .update({
                    avatar_url: url,
                    updated_at: new Date().toISOString()
                })
                .eq("user_id", userId);

            if (error) throw error;

            console.log("✅ Avatar uploaded and saved successfully");
        } catch (err) {
            console.error("❌ Avatar upload failed:", err);
        }
    };



    const handleLogoUpload = async (file: File) => {
        try {
            const safeName = sanitizeForStorage(file.name);
            const path = `logos/${Date.now()}-${safeName}`;  // ✅ Safe + unique
            const url = await uploadImage(file, "logo.bucket", path);

            // ✅ Save path in localStorage for future retrieval
            localStorage.setItem("logoPath", path);

            // ✅ Update state
            setPodcast_metadata((prev) => ({
                ...prev!,
                logo_url: url ?? undefined,
            }));

            // ✅ Update full metadata in localStorage
            localStorage.setItem(
                "podcastMetadata",
                JSON.stringify({
                    ...podcast_metadata,
                    logo_url: url,
                })
            );

            // ✅ Optional: Update Supabase
            const { error } = await supabase
                .from("podcast_metadata")
                .update({ logo_url: url, updated_at: new Date().toISOString() })
                .eq("user_id", user?.id);

            if (error) throw error;

            console.log("✅ Logo uploaded and saved");
        } catch (error) {
            console.error("❌ Logo upload failed:", error);
        }
    };

    const fetchRecentVideos = async (userId: string) => {
        const { data, error } = await supabase
            .from("media_files")
            .select("file_name, public_url, uploaded_at, slug, like_count")
            .eq("user_id", userId)
            .order("like_count", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error fetching recent videos:", error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log("📭 No recent videos found.");
            return;
        }

        const recent = data.map((file) => ({
            name: file.file_name,
            createdAt: file.uploaded_at,
            publicUrl: file.public_url,
            slug: file.slug,
            likeCount: file.like_count ?? 0
        }));

        setRecentVideos(recent);
        console.log("✅ Recent videos loaded:", recent);
    };

    const fetchUserEpisodes = async (userId: string) => {
        try {
            setLoadingEpisodes(true);

            // Only select columns that actually exist in media_files.
            // (Your logs showed `media_files.id` doesn't exist.)
            const { data, error } = await supabase
                .from('media_files')
                .select('file_name, public_url, uploaded_at, slug, type')
                .eq('user_id', userId)
                .eq('type', 'video')
                .order('uploaded_at', { ascending: false });

            if (error) {
                console.error('media_files error:', error.message);
                setEpisodes([]);
                return;
            }

            const mapped: Episode[] = (data ?? []).map((row, idx) => ({
                // fabricate a stable id using slug or filename+index
                id: String(row.slug ?? `${row.file_name}-${idx}`),
                title: row.file_name?.replace(/\.[^/.]+$/, '') || `Episode ${idx + 1}`,
                description: 'Uploaded video',
                publishDate: (row.uploaded_at ?? '').split('T')[0] || '',
                duration: 'N/A',
                status: 'published',
                videoUrl: row.public_url ?? '',
            }));

            setEpisodes(mapped);
            console.log('🎬 Episodes loaded:', mapped.length, mapped);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    const handleLike = async (slug: string) => {
        const { error } = await supabase.rpc("increment_like_count", { slug_input: slug });

        if (error) {
            console.error("❌ Failed to like video:", error.message);
            return;
        }

        console.log("✅ Video liked!");
        if (user?.id) await fetchRecentVideos(user.id); // Refresh likes
    };



    //end of new code

    useEffect(() => {
        const q = new URLSearchParams(location.search);
        const tab = (q.get('tab') as Tab) || 'Home';
        setActiveTab(tab);
    }, [location.search]);

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


    // Load data on component mount
    useEffect(() => {

        const profile = userService.getUserProfile();
        const metadata = userService.getPodcastMetadata();

        setUserProfile(profile);
        setPodcast_metadata(metadata);

        if (metadata) {
            setEditForm({
                name: metadata.name,
                description: metadata.description,
                tags: metadata.tag
            });

        }

        // ✅ NEW: Fetch user from Supabase and store in local state
        const fetchUser = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = sessionData?.session?.user;
            setUser(sessionData?.session?.user ?? null);


            console.log('🔁 Session after refresh:', sessionData?.session);

            if (currentUser?.id) {
                await fetchRecentVideos(currentUser.id);
                await fetchUserEpisodes(currentUser.id);
            }


            // ✅ Load avatar/logo from localStorage once user is known
            await loadImages();
            setLoading(false);
        };

        fetchUser();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });




        // Check if this is a fresh login (show welcome)
        const justCompletedOnboarding = localStorage.getItem('justCompletedOnboarding');
        if (justCompletedOnboarding === 'true') {
            setShowWelcome(true);
            localStorage.removeItem('justCompletedOnboarding');
            // Auto-hide welcome after 5 seconds
            setTimeout(() => setShowWelcome(false), 5000);
        }
        return () => {
            listener?.subscription?.unsubscribe?.();
        };
    }, []);
    if (loading) {
        return <div>Loading...</div>; // Or show a fancy spinner here
    }


    // Calculate dynamic stats
    const stats: PodcastStats = {
        totalEpisodes: episodes.length,
        totalPlays: episodes.reduce((total, episode) =>
            total + (episode.status === 'published' ? Math.floor(Math.random() * 100) + 10 : 0), 0
        ),
        rssUrl: `https://podpilot.com/feeds/${podcast_metadata?.name?.toLowerCase().replace(/\s+/g, '-') || 'your-podcast'}.xml`
    };
    //



    const updateMetadata = (field: keyof typeof editForm, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const addTag = () => {
        if (tagInput.trim() && !editForm.tags.includes(tagInput.trim())) {
            updateMetadata('tags', [...editForm.tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        updateMetadata('tags', editForm.tags.filter(tag => tag !== tagToRemove));
    };

    const saveMetadata = async () => {
        if (!user?.id) {
            console.error('User not authenticated');
            return;
        }

        // 1️⃣ Build the object you use in React-state / localStorage
        const updatedMetadata: PodcastMetadata = {
            id:           podcast_metadata?.id || '',
            name:        editForm.name,
            description: editForm.description,
            tag:         editForm.tags,
            logo_url:    logoUrl || podcast_metadata?.logo_url || '',
            logo_public_id: podcast_metadata?.logo_public_id || '',
            avatar_url:  avatarUrl || podcast_metadata?.avatar_url || '',
            created_at:  podcast_metadata?.created_at || new Date().toISOString(),
            updated_at:  new Date().toISOString(),
            user_id:     user.id// <- camelCase for frontend
        };

        try {
            // ✅ Type-safe snake_case transform
            const { user_id, ...rest } = updatedMetadata;
            const supabasePayload = {
                ...rest,
                user_id: user_id
            };

            // 3️⃣ Upsert using the DB column names
            const { error } = await supabase
                .from('podcast_metadata')
                .upsert([supabasePayload], { onConflict: 'user_id' });
            console.log('Payload sent to Supabase:', supabasePayload);

            if (error) throw error;

            // 4️⃣ Persist locally & update UI state
            localStorage.setItem('podcastMetadata', JSON.stringify(updatedMetadata));
            setPodcast_metadata(updatedMetadata);
            setIsEditingMetadata(false);
        } catch (err) {
            console.error('Failed to save podcast metadata:', err);
        }
    };

    const cancelEdit = () => {
        if (podcast_metadata) {
            setEditForm({
                name: podcast_metadata.name,
                description: podcast_metadata.description,
                tags: podcast_metadata.tag
            });
        } else {
            setEditForm({ name: '', description: '', tags: [] });
        }
        setIsEditingMetadata(false);
    };

    const getStatusColor = (status: Episode['status']) => {
        switch (status) {
            case 'published': return '#1A8C67';
            case 'draft': return '#6C757D';
            default: return '#6C757D';
        }
    };

    const getStatusText = (status: Episode['status']) => {
        switch (status) {
            case 'published': return 'Published';
            case 'draft': return 'Draft';
            default: return 'Unknown';
        }
    };

    console.log("✅ Recent videos loaded:", recentVideos);

    return (
        <div className={"mainReturn"}>
            {/* Welcome Toast */}
            {showWelcome && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    backgroundColor: '#1A8C67',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    animation: 'slideInRight 0.5s ease-out',
                    fontFamily: 'Satoshi, sans-serif',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>🎉</span>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                Welcome to PodPilot, {userProfile?.username || 'Creator'}!
                            </div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                Your podcast is ready for takeoff
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWelcome(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                padding: '0.25rem',
                                marginLeft: '0.5rem'
                            }}
                        >
                            ×
                        </button>
                </div>
            )}

            {/* Header */}
            <header className={'dashboard_header'}>

                <nav className={`navbar navbar-expand-xl sticky-top transition-navbar ${showNavbar ? 'visible' : 'hidden'}`}>
                    <div className="container-fluid px-3">
                        <Link className="navbar-brand" to="/dashboard?tab=Home">
                            <img className="img-fluid" src="/Drawable/PodPilot-Logo-web.png" alt="PodPilot Logo" />
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
                            <div className="d-flex p-1">
                                {(['Home', 'episodes'] as Tab[]).map((tab) => (
                                    <button  key={tab}
                                             className={`navi_buttons ${activeTab === tab ? 'active' : ''}`}
                                             onClick={() => {
                                                 setActiveTab(tab);
                                                 navigate(`?tab=${tab}`, { replace: false });
                                             }}>
                                        {tab}
                                    </button>


                                ))}
                            </div>

                            <div className="d-flex p-1">
                                <form
                                      onSubmit={(e) => {
                                          e.preventDefault();
                                          handleSearch(); // this will be defined later
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Search podcasters"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'Satoshi, sans-serif'
                                        }}
                                    />

                                    {searchResults.length > 0 && (
                                        <div className="search-dropdown">
                                            {searchResults.map((result) => (
                                                <div
                                                    key={result.id}
                                                    className="search-result-item"
                                                    onClick={() => {
                                                        // Example: navigate to a podcaster page
                                                        navigate(`/podcasters/${result.user_id}`);
                                                    }}
                                                >
                                                    <img
                                                        src={result.avatar_url || '/default-avatar.png'}
                                                        alt="avatar"
                                                        className="search-avatar"
                                                    />
                                                    <div>
                                                        <div className="search-name">{result.display_name}</div>
                                                        <div className="search-description">
                                                            {result.description?.slice(0, 60)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#1A8C67',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Search
                                    </button>
                                </form>
                            </div>


                            <div className="d-flex p-1">
                                {/* User Avatar */}
                                <AvatarDropdown
                                    avatarUrl={avatarUrl}
                                    displayName={podcast_metadata?.name || 'User'}
                                    onLogout={handleLogout}
                                />

                            </div>
                        </div>
                    </div>
                </nav>

                {/* old nav below */}

                {/*<div className={'dash_nav'}>

                    <div className={'dash_opt_0'}>

                        <a className={'dashboard_nav'} href="./Dashboard.tsx">
                            <img className="img-fluid" src="/Drawable/PodPilot-Logo-web.png" alt="PodPilot Logo"/>
                        </a>

                        <h1>
                            {podcast_metadata?.name || 'PodPilot'}
                        </h1>

                        <nav className={'navi'}>
                            {['Home', 'episodes'].map((tab) => (
                                <button className={`navi_buttons ${activeTab === tab ? 'active' : ''}`}
                                        key={tab}
                                        onClick={() => setActiveTab(tab as 'Home' | 'episodes')}>
                                    {tab}
                                </button>


                            ))}
                        </nav>

                    </div>

                    <div className={'dash_opt_1'}>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch(); // this will be defined later
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <input
                                type="text"
                                placeholder="Search podcasters"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    fontFamily: 'Satoshi, sans-serif'
                                }}
                            />

                            {searchResults.length > 0 && (
                                <div className="search-dropdown">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="search-result-item"
                                            onClick={() => {
                                                // Example: navigate to a podcaster page
                                                navigate(`/podcasters/${result.user_id}`);
                                            }}
                                        >
                                            <img
                                                src={result.avatar_url || '/default-avatar.png'}
                                                alt="avatar"
                                                className="search-avatar"
                                            />
                                            <div>
                                                <div className="search-name">{result.display_name}</div>
                                                <div className="search-description">
                                                    {result.description?.slice(0, 60)}...
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#1A8C67',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Search
                            </button>
                        </form>

                        <button className={'upload'} onClick={() => navigate('/NewEpisodeUpload')}>
                            Upload Episode
                        </button>

                         User Avatar
                        <AvatarDropdown
                            avatarUrl={avatarUrl}
                            displayName={podcast_metadata?.name || 'User'}
                            onLogout={handleLogout}
                        />



                    </div>
                </div>*/}

                {/* old nav ends */}

            </header>

            {/*{searchResults.length > 0 && (
                <section className="search-results">
                    <h2>Search Results</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                        {searchResults.map((podcaster) => (
                            <div
                                key={podcaster.id}
                                style={{
                                    padding: '1rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '10px',
                                    width: '250px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                    {podcaster.name}
                                </div>
                                <div style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                                    {podcaster.description}
                                </div>
                                {podcaster.avatar_url && (
                                    <img
                                        src={podcaster.avatar_url}
                                        alt="Avatar"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            borderRadius: '6px',
                                            marginTop: '0.5rem'
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}*/}


            {/* Main Content */}
            <main className={'mainSec'}>

                {activeTab === 'Home' && (
                    <div>
                        {/* Welcome, Section */}
                        <div className={'welcomeSec'}>
                            <div className={'welcomeBackContent'}>
                                <div className={'contentHolder'}>
                                    <h2>
                                        Welcome back, {podcast_metadata?.name || 'Creator'}! 👋
                                    </h2>
                                    <p>
                                        {podcast_metadata?.description || 'Upload episodes, and let listeners discover your content.'}
                                    </p>
                                </div>
                                {/*<button
                                    onClick={() => setIsEditingMetadata(true)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#F8F9FF',
                                        color: '#4285F4',
                                        border: '1px solid #4285F4',
                                        borderRadius: '6px',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Edit Details
                                </button>*/}
                            </div>

                            {/* Profile and Podcast Images */}
                            <div className={'profileUploadSec'}>

                                <div className={'txtC'}>
                                    <h3>
                                        Your Profile
                                    </h3>
                                    <ImageUpload
                                        currentImage={podcast_metadata?.avatar_url}
                                        onImageUpload={handleAvatarUpload}
                                        type="avatar"
                                        size="sm"
                                    />
                                </div>

                                <div className={'txtC'}>
                                    <h3>
                                        Podcast Logo
                                    </h3>
                                    <ImageUpload
                                        currentImage={podcast_metadata?.logo_url}
                                        onImageUpload={handleLogoUpload}
                                        type="podcast"
                                        size="md"
                                    />
                                </div>

                                {videoUrl && (

                                    <div className={'vidPreHolder'}>
                                        <h3>
                                            Uploaded Video Preview
                                        </h3>
                                        <video className={'videoContent'} controls width="100%">
                                            <source src={videoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}
                            </div>
                            <div className={'txtC'}>
                                <h3>
                                    Upload a Promo Video
                                </h3>

                                <div className={'videoDragDrop'}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleVideoUpload(file);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    style={{

                                    }}
                                    onClick={() => document.getElementById('videoInput')?.click()}
                                    >

                                    <p>
                                        Drag and drop your video file here, or click to select
                                    </p>

                                    <input
                                        id="videoInput"
                                        type="file"
                                        accept="video/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleVideoUpload(file);
                                        }}
                                    />
                                </div>
                            </div>

                            {/*Unknown what's below*/}
                            {isEditingMetadata ? (
                                <div className={'editMetaContent'}>
                                    <input
                                        type="text"
                                        placeholder="Podcast Name"
                                        value={editForm.name}
                                        onChange={(e) => updateMetadata('name', e.target.value)}
                                    />

                                    <textarea
                                        placeholder="Podcast Description"
                                        value={editForm.description}
                                        onChange={(e) => updateMetadata('description', e.target.value)}
                                        rows={3}
                                    />

                                    <div className={'inputButtonHolder'}>
                                        <input
                                            type="text"
                                            placeholder="Add tag"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                        />
                                        <button onClick={addTag}>
                                            Add
                                        </button>
                                    </div>

                                    {editForm.tags.length > 0 && (
                                        <div className={'editFormContent'}>
                                            {editForm.tags.map((tag, index) => (
                                                <span key={index}>
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)}>
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={'saveMetaContent'}>
                                        <button className={'saveBtn'} onClick={saveMetadata}>
                                            Save Changes
                                        </button>
                                        <button className={'cancelBtn'} onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {podcast_metadata?.tag && podcast_metadata.tag.length > 0 && (
                                        <div className={'podCastMetaContent'}>
                                            <span className={'podSpan0'}>
                                                Tags:
                                            </span>
                                            {podcast_metadata.tag.map((tag, index) => (
                                                <span className={'podSpan1'} key={index}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {/*/*Unknown what's below ends*/}
                            {/*<p>
                                Upload episodes, manage , and let listeners discover your content.
                            </p>*/}

                        </div>

                        {/* Stats Grid */}
                        <div className={'statContent'}>
                            <div className={'statHolder'}>
                                <h3>
                                    Total Episodes
                                </h3>
                                <p >
                                    {stats.totalEpisodes}
                                </p>
                            </div>

                            {/*<div className={'statHolder'}>
                                <h3>
                                    Total Plays
                                </h3>
                                <p>
                                    {stats.totalPlays.toLocaleString()}
                                </p>
                            </div>*/}


                        </div>

                        {/* Recent Episodes */}
                        <div className={'recentEpisodeContent'}>
                            <h2>
                                Your Episodes
                            </h2>
                            <p>
                                <em>Episodes with the most likes will automatically show towards the top of this list!</em>
                            </p>

                            <div className={'episodeContent'} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentVideos.map((video) => (
                                    <div className={'recentVid'} key={video.slug}>
                                        <video width="100%" height="auto" controls src={video.publicUrl} />
                                        <span className={'vidSpan0'}>{video.name}</span>
                                        <span className={'vidSpan1'}>
                                            Uploaded on {new Date(video.createdAt).toLocaleDateString()}
                                        </span>

                                        {/* Like Button */}
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>❤️ {video.likeCount ?? 0} Likes</span>
                                            <button
                                                style={{
                                                    background: 'rgba(240,79,79,0)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleLike(video.slug)}
                                            >
                                                Like
                                            </button>
                                        </div>
                                        {/* Shareable Link */}
                                        {video.slug && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <a
                                                    href={`/videos/${video.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.85rem', color: '#4285F4' }}
                                                >
                                                    🔗 Share this video
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}

                            </div>

                        </div>
                    </div>
                )}

                {activeTab === 'episodes' && (
                    <div className={'actEpisodeContent'}>
                        <div className={'actEpisodeItem0'}>
                            <h2>
                                Your Collection of Episodes
                            </h2>
                            {/*<button onClick={onNavigateToUpload}>
                                Upload Episode
                            </button>*/}
                        </div>

                        <div className={'actEpisodeItem1'}>
                            <div className={'actEpiSubItem0'}>
                                {loadingEpisodes && <div className={'aeSubItem0'}>Loading your episodes…</div>}
                                {!loadingEpisodes && episodes.length === 0 && (
                                    <div className={'aeSubItem0'}>No episodes yet. Try uploading a video!</div>
                                )}

                                {!loadingEpisodes && episodes.map((episode: Episode) => (
                                    <div className={'aeSubItem0'} key={episode.id}>
                                        <div className={'aeSubItemContent'}>
                                            <h3>{episode.title}</h3>
                                            <p>{episode.description}</p>

                                            {/* Show video if present */}
                                            {episode.videoUrl && (
                                                <div className={'aeSubItem1'}>
                                                    <video controls width="100%" style={{ maxWidth: 600, borderRadius: 8 }}>
                                                        <source src={episode.videoUrl} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            )}

                                            <div className={'aeSubItem2'}>
                                                {/*<span>Duration: {episode.duration}</span>*/}
                                                <span>{episode.publishDate ? `Published: ${episode.publishDate}` : 'Unpublished'}</span>
                                            </div>
                                        </div>

                                        <div className={'aeSubItemContent0'}>
                                            <span style={{
                                              backgroundColor: getStatusColor(episode.status) + '20',
                                              color: getStatusColor(episode.status)
                                                }}>
                                                {getStatusText(episode.status)}
                                            </span>

                                            {/*<div className={'aeSubItem00'}>
                                                <button className={'btn0'}>Edit</button>
                                                <button className={'btn1'}>⋯</button>
                                            </div>*/}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
