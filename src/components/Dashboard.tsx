
import React, { useState, useEffect } from 'react';
import {supabase} from '../supabaseClient.ts';
import ImageUpload from './ImageUpload.tsx';
import { uploadImage } from "../utils/uploadImages.ts";
import { userService, type UserProfile, type PodcastMetadata } from '../utils/cloudStorage';
import {useNavigate} from "react-router-dom";
import {sanitizeForStorage} from "../utils/sanatizefortorage.ts";
import '../main/style.css';






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

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToUpload }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview');
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
        { name: string; createdAt: string; publicUrl: string; slug: string}[]
    >([]);


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

    // Define recentEpisodes
    const [recentEpisodes] = useState<Episode[]>([]);

    /*const [recentEpisodes] = useState<Episode[]>([
        {
            id: '1',
            title: 'Welcome to My Podcast',
            description: 'Introduction episode where I talk about what to expect',
            publishDate: '2025-05-28',
            duration: '12:34',
            status: 'published',
            //audioFile: 'welcome-episode.mp3',
            videoUrl: "https://dxdshzscuxeqmhugilxt.supabase.co/storage/v1/object/public/video.bucket/videos/1750891296067-1750890286432-vecteezy_countdown-one-minute-animation-from-60-to-0-seconds_8976744.mp4"
        },
        {
            id: '2',
            title: 'Episode 2: Getting Started',
            description: 'Tips for new podcasters and content creators',
            publishDate: '2025-06-01',
            duration: '18:22',
            status: 'published',
            //audioFile: 'episode-2.mp3',
            videoUrl: "https://dxdshzscuxeqmhugilxt.supabase.co/storage/v1/object/public/video.bucket/videos/1750891296067-1750890286432-vecteezy_countdown-one-minute-animation-from-60-to-0-seconds_8976744.mp4"
        },
        /!*{
            id: '3',
            title: 'Upcoming Episode',
            description: 'Working on the next episode...',
            publishDate: '',
            duration: '0:00',
            status: 'draft'

        }*!/
    ]);*/

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

    const fetchRecentVideos = async () => {
        const { data, error } = await supabase
            .from("media_files")
            .select("file_name, public_url, uploaded_at, slug")
            .order("uploaded_at", { ascending: false })
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
        }));

        setRecentVideos(recent);
        console.log("✅ Recent videos loaded:", recent);
    };






    //end of new code

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
            const { data } = await supabase.auth.getUser();
            setUser(data.user);

            if (data.user?.id) {
                await fetchRecentVideos();
            }


            // ✅ Load avatar/logo from localStorage once user is known
            await loadImages();
        };

        fetchUser();


        // Check if this is a fresh login (show welcome)
        const justCompletedOnboarding = localStorage.getItem('justCompletedOnboarding');
        if (justCompletedOnboarding === 'true') {
            setShowWelcome(true);
            localStorage.removeItem('justCompletedOnboarding');
            // Auto-hide welcome after 5 seconds
            setTimeout(() => setShowWelcome(false), 5000);
        }
    }, []);

    // Calculate dynamic stats
    const stats: PodcastStats = {
        totalEpisodes: recentEpisodes.length,
        totalPlays: recentEpisodes.reduce((total, episode) =>
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
            name:        editForm.name,
            description: editForm.description,
            tag:         editForm.tags,
            logo_url:    logoUrl || podcast_metadata?.logo_url || '',
            logo_public_id: podcast_metadata?.logo_public_id || '',
            avatar_url:  avatarUrl || podcast_metadata?.avatar_url || '',
            created_at:  podcast_metadata?.created_at || new Date().toISOString(),
            updated_at:  new Date().toISOString(),
            user_id:     user.id                   // <- camelCase for frontend
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

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
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

                <div className={'dash_nav'}>

                    <div className={'dash_opt_0'}>

                        <h1>
                            {podcast_metadata?.name || 'PodPilot'}
                        </h1>

                        <nav className={'navi'}>
                            {['overview', 'episodes'].map((tab) => (
                                <button className={`navi_buttons ${activeTab === tab ? 'active' : ''}`}
                                    key={tab}
                                    onClick={() => setActiveTab(tab as 'overview' | 'episodes')}>
                                    {tab}
                                </button>
                            ))}
                        </nav>

                    </div>

                    <div className={'dash_opt_1'}>

                        <button className={'upload'} onClick={() => navigate('/NewEpisodeUpload')}>
                            Upload Episode
                        </button>

                        {/* User Avatar */}
                        <div className={'dash_avatar'} style={{
                            backgroundColor: avatarUrl ? 'transparent' : '#000000',
                            backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                            }}>
                            {!podcast_metadata?.avatar_url && (
                                podcast_metadata?.name ? getInitials(podcast_metadata.name) : 'U'
                            )}
                        </div>

                    </div>
                </div>

                <button className={'logout'} onClick={handleLogout}>
                    Log&nbsp;out
                </button>

            </header>

            {/* Main Content */}
            <main className={'mainSec'}>

                {activeTab === 'overview' && (
                    <div>
                        {/* Welcome, Section */}
                        <div className={'welcomeSec'}>
                            <div className={'welcomeBackContent'}>
                                <div className={'contentHolder'}>
                                    <h2>
                                        Welcome back, {userProfile?.username || 'Creator'}! 👋
                                    </h2>
                                    <p>
                                        {podcast_metadata?.description || 'Upload episodes, manage your RSS feed, and let listeners discover your content.'}
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

                            <div className={'statHolder'}>
                                <h3>
                                    Total Plays
                                </h3>
                                <p>
                                    {stats.totalPlays.toLocaleString()}
                                </p>
                            </div>


                        </div>

                        {/* Recent Episodes */}
                        <div className={'recentEpisodeContent'}>
                            <h2>
                                Your Episodes
                            </h2>

                            <div className={'episodeContent'} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentVideos.map((video) => (
                                    <div className={'recentVid'} key={video.name}>
                                        <video
                                            width="100%"
                                            height="auto"
                                            controls
                                            src={video.publicUrl}
                                        />
                                        <span className={'vidSpan0'}>{video.name}</span>
                                        <span className={'vidSpan1'}>
      Uploaded on {new Date(video.createdAt).toLocaleDateString()}
    </span>

                                        {/* ✅ Add shareable link */}
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
                                Manage Episodes
                            </h2>
                            <button onClick={onNavigateToUpload}>
                                Upload Episode
                            </button>
                        </div>

                        <div className={'actEpisodeItem1'}>
                            <div className={'actEpiSubItem0'}>
                                {recentEpisodes.map((episode: Episode) => (
                                    <div className={'aeSubItem0'} key={episode.id}>
                                        <div className={'aeSubItemContent'}>
                                            <h3>
                                                {episode.title}
                                            </h3>
                                            <p>
                                                {episode.description}
                                            </p>

                                            {episode.status === 'published' && episode.audioFile && (
                                                <div className={'aeSubItem1'}>
                                                    <audio controls>
                                                        <source src={`/audio/${episode.audioFile}`} type="audio/mpeg" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}

                                            <div className={'aeSubItem2'}>
                                                <span>Duration: {episode.duration}</span>
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

                                            <div className={'aeSubItem00'}>
                                                <button className={'btn0'}>
                                                    Edit
                                                </button>
                                                <button className={'btn1'}>
                                                    ⋯
                                                </button>
                                            </div>
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
