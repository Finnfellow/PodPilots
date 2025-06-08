import React, { useState, useEffect } from 'react';

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

interface PodcastMetadata {
    name: string;
    description: string;
    tags: string[];
    logo: string | null;
    createdAt: string;
    updatedAt?: string;
}

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview');
    const [podcastMetadata, setPodcastMetadata] = useState<PodcastMetadata | null>(null);
    const [isEditingMetadata, setIsEditingMetadata] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        tags: [] as string[]
    });
    const [tagInput, setTagInput] = useState('');

    // Define recentEpisodes first
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

    // Load podcast metadata on component mount
    useEffect(() => {
        const storedMetadata = localStorage.getItem('podcastMetadata');
        if (storedMetadata) {
            const metadata = JSON.parse(storedMetadata);
            setPodcastMetadata(metadata);
            setEditForm({
                name: metadata.name,
                description: metadata.description,
                tags: metadata.tags
            });
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
            logo: podcastMetadata?.logo || null,
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

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
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
                        <button style={{
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
                        }}>
                            Upload Episode
                        </button>

                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: '#000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}>
                            U
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
                                <h2 style={{
                                    fontFamily: 'Satoshi, sans-serif',
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    color: '#212529',
                                    margin: 0
                                }}>
                                    Welcome back! 👋
                                </h2>
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

                            {isEditingMetadata ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                    <p style={{
                                        color: '#6C757D',
                                        margin: '0 0 1rem 0',
                                        fontFamily: 'Satoshi, sans-serif'
                                    }}>
                                        {podcastMetadata?.description || 'Upload episodes, manage your RSS feed, and let listeners discover your content.'}
                                    </p>

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
                            <button style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#000000',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontFamily: 'Satoshi, sans-serif',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}>
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
        </div>
    );
};

export default Dashboard;