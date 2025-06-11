
import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import { userService, type UserProfile, type PodcastMetadata } from '../utils/cloudStorage';

import { useState } from 'react';


interface Episode {
    id: string;
    title: string;
    description: string;
    publishDate: string;
    duration: string;
    status: 'draft' | 'published';
    audioFile?: string;
}

interface PodcastStats {
    totalEpisodes: number;
    totalPlays: number;
    rssUrl: string;
}

interface DashboardProps {
    onNavigateToUpload?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToUpload }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview');

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [podcastMetadata, setPodcastMetadata] = useState<PodcastMetadata | null>(null);
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        tags: [] as string[]


    // Mock data - replace with real data from your backend
    const [stats] = useState<PodcastStats>({
        totalEpisodes: 5,
        totalPlays: 247,
        rssUrl: 'https://podpilot.com/feeds/your-podcast.xml'

    });
    const [tagInput, setTagInput] = useState('');

    // Define recentEpisodes
    const [recentEpisodes] = useState<Episode[]>([
        {
            id: '1',
            title: 'Welcome to My Podcast',
            description: 'Introduction episode where I talk about what to expect',
            publishDate: '2025-05-28',
            duration: '12:34',
            status: 'published',
            audioFile: 'welcome-episode.mp3'
        },
        {
            id: '2',
            title: 'Episode 2: Getting Started',
            description: 'Tips for new podcasters and content creators',
            publishDate: '2025-06-01',
            duration: '18:22',
            status: 'published',
            audioFile: 'episode-2.mp3'
        },
        {
            id: '3',
            title: 'Upcoming Episode',
            description: 'Working on the next episode...',
            publishDate: '',
            duration: '0:00',
            status: 'draft'

        }
    ]);

    // Load data on component mount
    useEffect(() => {
        const profile = userService.getUserProfile();
        const metadata = userService.getPodcastMetadata();

        setUserProfile(profile);
        setPodcastMetadata(metadata);

        if (metadata) {
            setEditForm({
                name: metadata.name,
                description: metadata.description,
                tags: metadata.tags
            });

        }

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
        rssUrl: `https://podpilot.com/feeds/${podcastMetadata?.name?.toLowerCase().replace(/\s+/g, '-') || 'your-podcast'}.xml`
    };

    const handleAvatarUpload = async (file: File, _previewUrl: string) => {
        try {
            await userService.uploadUserAvatar(file);
            const updatedProfile = userService.getUserProfile();
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error('Avatar upload failed:', error);
            throw error;
        }
    };

    const handleLogoUpload = async (file: File, _previewUrl: string) => {
        try {
            await userService.uploadPodcastLogo(file);
            const updatedMetadata = userService.getPodcastMetadata();
            setPodcastMetadata(updatedMetadata);
        } catch (error) {
            console.error('Logo upload failed:', error);
            throw error;
        }
    };

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

    const saveMetadata = () => {
        const updatedMetadata: PodcastMetadata = {
            name: editForm.name,
            description: editForm.description,
            tags: editForm.tags,
            logoUrl: podcastMetadata?.logoUrl || undefined,
            logoPublicId: podcastMetadata?.logoPublicId || undefined,
            createdAt: podcastMetadata?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('podcastMetadata', JSON.stringify(updatedMetadata));
        setPodcastMetadata(updatedMetadata);
        setIsEditingMetadata(false);
    };

    const cancelEdit = () => {
        if (podcastMetadata) {
            setEditForm({
                name: podcastMetadata.name,
                description: podcastMetadata.description,
                tags: podcastMetadata.tags
            });
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

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
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
            <header style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #E8E8E8',
                padding: '1rem 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2rem'
                    }}>
                        <h1 style={{
                            fontFamily: 'Recoleta, serif',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#212529',
                            margin: 0
                        }}>
                            {podcastMetadata?.name || 'PodPilot'}
                        </h1>

                        <nav style={{ display: 'flex', gap: '1.5rem' }}>
                            {['overview', 'episodes'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as 'overview' | 'episodes')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontWeight: '500',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        color: activeTab === tab ? '#4285F4' : '#6C757D',
                                        backgroundColor: activeTab === tab ? '#F8F9FF' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={onNavigateToUpload}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#000000',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontFamily: 'Satoshi, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Upload Episode
                        </button>

                        {/* User Avatar */}
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: userProfile?.avatarUrl ? 'transparent' : '#000000',
                            backgroundImage: userProfile?.avatarUrl ? `url(${userProfile.avatarUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}>
                            {!userProfile?.avatarUrl && (
                                userProfile?.username ? getInitials(userProfile.username) : 'U'
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '2rem'
            }}>
                {activeTab === 'overview' && (
                    <div>
                        {/* Welcome Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '2rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1rem'
                            }}>
                                <div>
                                    <h2 style={{
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '1.5rem',
                                        fontWeight: '600',
                                        color: '#212529',
                                        margin: '0 0 0.5rem 0'
                                    }}>
                                        Welcome back, {userProfile?.username || 'Creator'}! 👋
                                    </h2>
                                    <p style={{
                                        color: '#6C757D',
                                        margin: 0,
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        {podcastMetadata?.description || 'Upload episodes, manage your RSS feed, and let listeners discover your content.'}
                                    </p>
                                </div>
                                <button
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
                                </button>
                            </div>

                            {/* Profile and Podcast Images */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '2rem',
                                marginTop: '2rem'
                            }}>

                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '1rem'
                                    }}>
                                        Your Profile
                                    </h3>
                                    <ImageUpload
                                        currentImage={userProfile?.avatarUrl}
                                        onImageUpload={handleAvatarUpload}
                                        type="avatar"
                                        size="md"
                                    />
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <h3 style={{
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        color: '#495057',
                                        marginBottom: '1rem'
                                    }}>
                                        Podcast Logo
                                    </h3>
                                    <ImageUpload
                                        currentImage={podcastMetadata?.logoUrl}
                                        onImageUpload={handleLogoUpload}
                                        type="podcast"
                                        size="md"
                                    />
                                </div>
                            </div>

                            {isEditingMetadata ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Podcast Name"
                                        value={editForm.name}
                                        onChange={(e) => updateMetadata('name', e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '6px',
                                            fontFamily: 'Satoshi, sans-serif'
                                        }}
                                    />
                                    <textarea
                                        placeholder="Podcast Description"
                                        value={editForm.description}
                                        onChange={(e) => updateMetadata('description', e.target.value)}
                                        rows={3}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid #E8E8E8',
                                            borderRadius: '6px',
                                            fontFamily: 'Satoshi, sans-serif',
                                            resize: 'vertical'
                                        }}
                                    />

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                border: '1px solid #E8E8E8',
                                                borderRadius: '6px',
                                                fontFamily: 'Satoshi, sans-serif'
                                            }}
                                        />
                                        <button
                                            onClick={addTag}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                backgroundColor: '#4285F4',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontFamily: 'Satoshi, sans-serif',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {editForm.tags.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem'
                                        }}>
                                            {editForm.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#4285F4',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'Satoshi, sans-serif'
                                                    }}
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => removeTag(tag)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '1rem',
                                                            padding: 0
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={saveMetadata}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: '#000000',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontFamily: 'Satoshi, sans-serif',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: 'white',
                                                color: '#495057',
                                                border: '1px solid #CED4DA',
                                                borderRadius: '6px',
                                                fontFamily: 'Satoshi, sans-serif',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {podcastMetadata?.tags && podcastMetadata.tags.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem',
                                            marginTop: '1rem'
                                        }}>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                color: '#495057',
                                                fontFamily: 'Satoshi, sans-serif',
                                                fontWeight: '500',
                                                marginRight: '0.5rem'
                                            }}>
                                                Tags:
                                            </span>
                                            {podcastMetadata.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#F8F9FF',
                                                        color: '#4285F4',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'Satoshi, sans-serif',
                                                        fontWeight: '500',
                                                        border: '1px solid #E8F0FE'
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                                Upload episodes, manage your RSS feed, and let listeners discover your content.
                            </p>

                        </div>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}>
                                <h3 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#6C757D',
                                    margin: '0 0 0.5rem 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Total Episodes
                                </h3>
                                <p style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#212529',
                                    margin: 0,
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>
                                    {stats.totalEpisodes}
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}>
                                <h3 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#6C757D',
                                    margin: '0 0 0.5rem 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Total Plays
                                </h3>
                                <p style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#212529',
                                    margin: 0,
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>
                                    {stats.totalPlays.toLocaleString()}
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}>
                                <h3 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#6C757D',
                                    margin: '0 0 0.5rem 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    RSS Feed
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: '#212529',
                                        fontFamily: 'Satoshi, sans-serif',
                                        fontWeight: '500'
                                    }}>
                                        Active
                                    </span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(stats.rssUrl);
                                            } catch (err) {
                                                console.error('Failed to copy RSS URL:', err);
                                            }
                                        }}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            fontSize: '0.75rem',
                                            backgroundColor: '#F8F9FF',
                                            color: '#4285F4',
                                            border: '1px solid #4285F4',
                                            borderRadius: '6px',
                                            fontFamily: 'Satoshi, sans-serif',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Episodes */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <h2 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 1.5rem 0'
                            }}>
                                Your Episodes
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentEpisodes.map((episode: Episode) => (
                                    <div
                                        key={episode.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            backgroundColor: '#FAFAFA',
                                            borderRadius: '8px',
                                            border: '1px solid #E8E8E8'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                fontFamily: 'Satoshi, sans-serif',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: '#212529',
                                                margin: '0 0 0.25rem 0'
                                            }}>
                                                {episode.title}
                                            </h3>
                                            <p style={{
                                                fontFamily: 'Satoshi, sans-serif',
                                                fontSize: '0.875rem',
                                                color: '#6C757D',
                                                margin: '0 0 0.5rem 0'
                                            }}>
                                                {episode.description}
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                alignItems: 'center'
                                            }}>

                        <span style={{
                            fontSize: '0.8rem',
                            color: '#6C757D',
                            fontFamily: 'Satoshi, sans-serif'
                        }}>
                          {episode.publishDate || 'Not published'}
                        </span>

                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: '#6C757D',
                                                    fontFamily: 'Satoshi, sans-serif'
                                                }}>

                                                    {episode.publishDate || 'Not published'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: '#6C757D',
                                                    fontFamily: 'Satoshi, sans-serif'
                                                }}>
                                                    {episode.duration}
                                                </span>

                          {episode.duration}
                        </span>

                                                {episode.status === 'published' && episode.audioFile && (
                                                    <audio
                                                        controls
                                                        style={{
                                                            height: '30px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <source src={`/audio/${episode.audioFile}`} type="audio/mpeg" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '0.5rem'
                                        }}>

                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                fontFamily: 'Satoshi, sans-serif',
                                                backgroundColor: getStatusColor(episode.status) + '20',
                                                color: getStatusColor(episode.status)
                                            }}>
                                                {getStatusText(episode.status)}
                                            </span>

                      <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          fontFamily: 'Satoshi, sans-serif',
                          backgroundColor: getStatusColor(episode.status) + '20',
                          color: getStatusColor(episode.status)
                      }}>
                        {getStatusText(episode.status)}
                      </span>


                                            <button style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1.2rem',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                color: '#6C757D'
                                            }}>
                                                ⋯
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'episodes' && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: 0
                            }}>
                                Manage Episodes
                            </h2>
                            <button
                                onClick={onNavigateToUpload}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#000000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Upload Episode
                            </button>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            border: '1px solid #E8E8E8',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentEpisodes.map((episode: Episode) => (
                                    <div
                                        key={episode.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1.5rem',
                                            backgroundColor: '#FAFAFA',
                                            borderRadius: '8px',
                                            border: '1px solid #E8E8E8'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                fontFamily: 'Satoshi, sans-serif',
                                                fontSize: '1.1rem',
                                                fontWeight: '600',
                                                color: '#212529',
                                                margin: '0 0 0.5rem 0'
                                            }}>
                                                {episode.title}
                                            </h3>
                                            <p style={{
                                                fontFamily: 'Satoshi, sans-serif',
                                                fontSize: '0.9rem',
                                                color: '#6C757D',
                                                margin: '0 0 1rem 0'
                                            }}>
                                                {episode.description}
                                            </p>

                                            {episode.status === 'published' && episode.audioFile && (
                                                <div style={{ marginBottom: '0.5rem' }}>
                                                    <audio
                                                        controls
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: '400px',
                                                            height: '40px'
                                                        }}
                                                    >
                                                        <source src={`/audio/${episode.audioFile}`} type="audio/mpeg" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}

                                            <div style={{
                                                display: 'flex',
                                                gap: '1.5rem',
                                                alignItems: 'center',
                                                fontSize: '0.85rem',
                                                color: '#6C757D',
                                                fontFamily: 'Satoshi, sans-serif'
                                            }}>
                                                <span>Duration: {episode.duration}</span>
                                                <span>{episode.publishDate ? `Published: ${episode.publishDate}` : 'Unpublished'}</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: '500',
                                                fontFamily: 'Satoshi, sans-serif',
                                                backgroundColor: getStatusColor(episode.status) + '20',
                                                color: getStatusColor(episode.status)
                                            }}>
                                                {getStatusText(episode.status)}
                                            </span>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button style={{
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: 'white',
                                                    color: '#495057',
                                                    border: '1px solid #CED4DA',
                                                    borderRadius: '6px',
                                                    fontFamily: 'Satoshi, sans-serif',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}>
                                                    Edit
                                                </button>
                                                <button style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    fontSize: '1.2rem',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    color: '#6C757D'
                                                }}>
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