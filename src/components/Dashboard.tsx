
import { useState } from 'react';

import React, { useState } from 'react';


interface Episode {
    id: string;
    title: string;
    description: string;
    publishDate: string;
    duration: string;

    status: 'draft' | 'published';
    audioFile?: string;

    status: 'draft' | 'scheduled' | 'published';
    platforms: string[];

}

interface PodcastStats {
    totalEpisodes: number;
    totalPlays: number;

    rssUrl: string;
}

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview');

    // Mock data - replace with real data from your backend
    const [stats] = useState<PodcastStats>({
        totalEpisodes: 5,
        totalPlays: 247,
        rssUrl: 'https://podpilot.com/feeds/your-podcast.xml'

    totalDownloads: number;
    monthlyGrowth: number;
}

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'analytics'>('overview');

    // Mock data - replace with real data from your backend
    const [stats] = useState<PodcastStats>({
        totalEpisodes: 24,
        totalPlays: 15420,
        totalDownloads: 8932,
        monthlyGrowth: 12.5

    });

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

            title: 'Getting Started with Podcasting',
            description: 'A beginner\'s guide to starting your first podcast',
            publishDate: '2025-05-28',
            duration: '24:31',
            status: 'published',
            platforms: ['YouTube', 'Instagram']
        },
        {
            id: '2',
            title: 'Advanced Audio Editing Techniques',
            description: 'Professional tips for editing your podcast audio',
            publishDate: '2025-05-30',
            duration: '18:45',
            status: 'scheduled',
            platforms: ['YouTube']
        },
        {
            id: '3',
            title: 'Building Your Audience',
            description: 'Strategies for growing your podcast listener base',
            publishDate: '',
            duration: '0:00',
            status: 'draft',
            platforms: []

        }
    ]);

    const getStatusColor = (status: Episode['status']) => {
        switch (status) {
            case 'published': return '#1A8C67';

            case 'scheduled': return '#4285F4';

            case 'draft': return '#6C757D';
            default: return '#6C757D';
        }
    };

    const getStatusText = (status: Episode['status']) => {
        switch (status) {
            case 'published': return 'Published';

            case 'scheduled': return 'Scheduled';

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
                            PodPilot
                        </h1>

                        <nav style={{ display: 'flex', gap: '1.5rem' }}>

                            {['overview', 'episodes'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as 'overview' | 'episodes')}

                            {['overview', 'episodes', 'analytics'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}

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
                            <h2 style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#212529',
                                margin: '0 0 0.5rem 0'
                            }}>
                                Welcome back! 👋
                            </h2>
                            <p style={{
                                color: '#6C757D',
                                margin: 0,
                                fontFamily: 'Satoshi, sans-serif'
                            }}>

                                Upload episodes, manage your RSS feed, and let listeners discover your content.

                                Ready to create your next episode? Your podcast is looking great!

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

                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid #E5E7EB'

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

                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid #E5E7EB'

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
                                    <button style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#F8F9FF',
                                        color: '#4285F4',
                                        border: '1px solid #4285F4',
                                        borderRadius: '6px',
                                        fontFamily: 'Satoshi, sans-serif',
                                        cursor: 'pointer'
                                    }}>
                                        Copy URL
                                    </button>
                                </div>

                                    Downloads
                                </h3>
                                <p style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#212529',
                                    margin: 0,
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>
                                    {stats.totalDownloads.toLocaleString()}
                                </p>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                border: '1px solid #E5E7EB'
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
                                    Monthly Growth
                                </h3>
                                <p style={{
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#1A8C67',
                                    margin: 0,
                                    fontFamily: 'Satoshi, sans-serif'
                                }}>
                                    +{stats.monthlyGrowth}%
                                </p>

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

                                Recent Episodes
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentEpisodes.map((episode) => (

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

                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB'

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

                          {episode.publishDate || 'Not scheduled'}

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


                                            {episode.platforms.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    {episode.platforms.map((platform) => (
                                                        <span
                                                            key={platform}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                padding: '0.125rem 0.5rem',
                                                                backgroundColor: '#F8F9FF',
                                                                color: '#4285F4',
                                                                borderRadius: '12px',
                                                                fontFamily: 'Satoshi, sans-serif'
                                                            }}
                                                        >
                              {platform}
                            </span>
                                                    ))}
                                                </div>
                                            )}


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

                                All Episodes

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

                                New Episode

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

                            borderRadius: '16px',
                            padding: '2rem',
                            border: '1px solid #E5E7EB'
                        }}>
                            <p style={{
                                color: '#6C757D',
                                textAlign: 'center',
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1rem'
                            }}>
                                Episodes management interface would go here
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div>
                        <h2 style={{
                            fontFamily: 'Satoshi, sans-serif',
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#212529',
                            marginBottom: '2rem'
                        }}>
                            Analytics & Insights
                        </h2>

                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '2rem',
                            border: '1px solid #E5E7EB'
                        }}>
                            <p style={{
                                color: '#6C757D',
                                textAlign: 'center',
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: '1rem'
                            }}>
                                Detailed analytics and charts would go here
                            </p>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;