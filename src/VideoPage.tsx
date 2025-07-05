import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase} from "./supabaseClient.ts";

const VideoPage: React.FC = () => {
    const { slug } = useParams();
    const [videoData, setVideoData] = useState<{
        title: string;
        description: string;
        public_url: string;
        uploaded_at: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            const { data, error } = await supabase
                .from('media_files')
                .select('file_name, public_url, uploaded_at, ep_title, ep_description')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error fetching video:', error.message);
                setLoading(false);
                return;
            }

            setVideoData({
                title: data.ep_title || data.file_name,
                description: data.ep_description || '',
                public_url: data.public_url,
                uploaded_at: data.uploaded_at,
            });
            setLoading(false);
        };

        if (slug) fetchVideo();
    }, [slug]);

    if (loading) return <div>Loading video...</div>;

    if (!videoData) return <div>Video not found.</div>;

    return (
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
            <h1>{videoData.title}</h1>
            <p><em>Uploaded on {new Date(videoData.uploaded_at).toLocaleDateString()}</em></p>
            <video controls width="100%">
                <source src={videoData.public_url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            {videoData.description && (
                <p style={{ marginTop: '1rem' }}>{videoData.description}</p>
            )}
            <button
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('🔗 Link copied to clipboard!');
                }}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                }}
            >
                📋 Copy Shareable Link
            </button>
        </div>
    );
};

export default VideoPage;