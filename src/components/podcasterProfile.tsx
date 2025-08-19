// PodcasterProfile.tsx
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';


interface MediaFile {
    file_name: string;
    public_url: string;
    uploaded_at: string;
    slug: string;
    like_count: number;
}

interface PodcastMetadata {
    display_name: string;
    description: string;
    avatar_url?: string;
}

const PodcasterProfile: React.FC = () => {
    const { user_id } = useParams<{ user_id: string }>();
    const [metadata, setMetadata] = useState<PodcastMetadata | null>(null);
    const [videos, setVideos] = useState<MediaFile[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            // Fetch metadata
            const { data: meta, error: metaError } = await supabase
                .from('podcast_metadata')
                .select('display_name, description, avatar_url')
                .eq('user_id', user_id)
                .single();

            if (metaError) {
                console.error("❌ Failed to fetch metadata:", metaError);
                return;
            }

            setMetadata(meta);

            // Fetch videos
            const { data: videoData, error: videoError } = await supabase
                .from('media_files')
                .select('file_name, public_url, uploaded_at, slug, like_count') // ✅ added like_count
                .eq('user_id', user_id)
                .order('like_count', { ascending: false });
            if (videoError) {
                console.error("❌ Failed to fetch videos:", videoError);
                return;
            }

            setVideos(videoData);
        };

        if (user_id) fetchData();
    }, [user_id]);
    const handleLike = async (slug: string, index: number) => {
        try {
            const { data, error } = await supabase
                .from('media_files')
                .update({ like_count: (videos[index].like_count ?? 0) + 1 })
                .eq('slug', slug)
                .select('like_count')
                .single();

            if (error) throw error;

            // Update local state
            const updatedVideos = [...videos];
            updatedVideos[index].like_count = data.like_count;
            setVideos(updatedVideos);
        } catch (err) {
            console.error("❌ Failed to like video:", err);
        }
    };
    return (
        <div style={{ padding: '2rem', fontFamily: 'Satoshi, sans-serif' }}>
            {metadata ? (
                <>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '1rem 0'
                    }}>
                        {/* Left side: Podcaster Profile Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img
                                src={metadata.avatar_url || '/default-avatar.png'}
                                alt="Avatar"
                                style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                            />
                            <h2 style={{ margin: 0 }}>{metadata.display_name}</h2>
                        </div>

                        {/* Right side: Back Button */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#1A8C67',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'Satoshi, sans-serif',
                                fontWeight: '500'
                            }}
                        >
                            Dashboard
                        </button>
                    </div>


                    <h3 style={{ marginTop: '2rem' }}>Videos</h3>
                    {videos.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {videos.map((video, index) => (
                                <div key={video.slug}>
                                    <video width="100%" controls src={video.public_url} />
                                    <div style={{ marginTop: '0.5rem' }}>{video.file_name}</div>
                                    <small>Uploaded on {new Date(video.uploaded_at).toLocaleDateString()}</small>

                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>❤️ {video.like_count ?? 0} Likes</span>
                                        <button
                                            style={{
                                                background: '#f04f4f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.25rem 0.5rem',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleLike(video.slug, index)}
                                        >
                                            Like
                                        </button>
                                    </div>

                                    {video.slug && (
                                        <div className={'vidShare'}>
                                            <a
                                                href={`/videos/${video.slug}`}
                                                target="_self"
                                                rel="noopener noreferrer"
                                            >
                                                <img className={'img-fluid'} src="/Drawable/share.png" alt="Share by Pexel Perfect"/> Share
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No videos uploaded yet.</p>
                    )}
                </>
            ) : (
                <p>Loading podcaster info...</p>
            )}
        </div>
    );
};

export default PodcasterProfile;
