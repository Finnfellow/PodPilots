// PodcasterProfile.tsx
import React, { useState, useEffect} from 'react';
import { useParams,useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AvatarDropdown from "./AvatarDropdown";
import '../main/style.css';


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

interface CommentWithMetadata {
    id: string;
    slug: string;
    content: string;
    created_at: string;
    user_id: string;
    podcast_metadata?: {
        name?: string;
        avatar_url?: string;
    };
}

const PodcasterProfile: React.FC = () => {
    const { user_id } = useParams<{ user_id: string }>();
    const [viewer, setViewer] = useState<any>(null); // current logged-in user
    const [metadata, setMetadata] = useState<PodcastMetadata | null>(null);
    const [videos, setVideos] = useState<MediaFile[]>([]);
    const [comments, setComments] = useState<Record<string, CommentWithMetadata[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const navigate = useNavigate();

    // Header visibility on scroll
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

// Unified search state (creators + videos)
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

    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);



// Sign-out
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };


    // ---- fetch creator + videos ----
    useEffect(() => {
        const fetchData = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            setViewer(sessionData?.session?.user ?? null);

            // metadata
            const { data: meta, error: metaError } = await supabase
                .from('podcast_metadata')
                .select('display_name, description, avatar_url')
                .eq('user_id', user_id)
                .single();
            if (metaError) {
                console.error('❌ Failed to fetch metadata:', metaError);
                return;
            }
            setMetadata(meta);

            // videos
            const { data: videoData, error: videoError } = await supabase
                .from('media_files')
                .select('file_name, public_url, uploaded_at, slug, like_count')
                .eq('user_id', user_id)
                .eq('type', 'video')
                .order('uploaded_at', { ascending: false });
            if (videoError) {
                console.error('❌ Failed to fetch videos:', videoError);
                return;
            }
            setVideos(videoData ?? []);
        };

        if (user_id) fetchData();
    }, [user_id]);

    // ---- fetch comments whenever videos change ----
    useEffect(() => {
        const slugs = videos.map(v => v.slug).filter(Boolean);
        if (!slugs.length) return;

        const fetchComments = async (s: string[]) => {
            const { data, error } = await supabase
                .from('video_comments')
                .select(`
          id,
          slug,
          content,
          created_at,
          user_id,
          podcast_metadata (
            name,
            avatar_url
          )
        `)
                .in('slug', s)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('❌ Failed to fetch comments:', error.message);
                return;
            }

            const grouped: Record<string, CommentWithMetadata[]> = {};
            (data ?? []).forEach(c => {
                if (!grouped[c.slug]) grouped[c.slug] = [];
                grouped[c.slug].push(c as CommentWithMetadata);
            });
            setComments(grouped);
        };

        fetchComments(slugs);
    }, [videos]);

    // ---- realtime comments for the visible slugs ----
    useEffect(() => {
        const slugs = new Set(videos.map(v => v.slug).filter(Boolean));
        if (!slugs.size) return;

        const channel = supabase
            .channel('podcaster-profile-comments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'video_comments' }, async payload => {
                const slug = (payload.new as any)?.slug ?? (payload.old as any)?.slug;
                if (!slug || !slugs.has(slug)) return;

                // precise refresh for this slug
                const { data, error } = await supabase
                    .from('video_comments')
                    .select(`
            id,
            slug,
            content,
            created_at,
            user_id,
            podcast_metadata (
              name,
              avatar_url
            )
          `)
                    .eq('slug', slug)
                    .order('created_at', { ascending: true });

                if (error) return;
                setComments(prev => ({ ...prev, [slug]: (data ?? []) as CommentWithMetadata[] }));
            })
            .subscribe();

        return () => void supabase.removeChannel(channel);
    }, [videos]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // If you want it hidden at the very top, set false when < 100.
            // For now we keep it visible always (same as your Dashboard code).
            if (currentScrollY < 100) {
                setShowNavbar(true);
            } else if (currentScrollY > lastScrollY) {
                setShowNavbar(true);
            } else {
                setShowNavbar(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);


    // ---- likes ----
    const handleLike = async (slug: string, index: number) => {
        try {
            const { data, error } = await supabase
                .from('media_files')
                .update({ like_count: (videos[index].like_count ?? 0) + 1 })
                .eq('slug', slug)
                .select('like_count')
                .single();
            if (error) throw error;

            setVideos(prev => {
                const copy = [...prev];
                copy[index] = { ...copy[index], like_count: data.like_count };
                return copy;
            });
        } catch (err) {
            console.error('❌ Failed to like video:', err);
        }
    };

    // ---- comments: add / edit / delete ----
    const handleCommentSubmit = async (slug: string) => {
        const text = newComment[slug]?.trim();
        if (!text || !viewer?.id) return;

        const { error } = await supabase.from('video_comments').insert({ slug, content: text, user_id: viewer.id });
        if (error) {
            console.error('❌ Failed to submit comment:', error.message);
            return;
        }
        setNewComment(prev => ({ ...prev, [slug]: '' }));
    };

    const beginEdit = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditingText(currentText);
    };

    const saveEdit = async (slug: string, commentId: string) => {
        const text = editingText.trim();
        if (!text || !viewer?.id) return;
        try {
            setSavingEdit(true);
            const { error } = await supabase
                .from('video_comments')
                .update({ content: text })
                .eq('id', commentId)
                .eq('user_id', viewer.id);
            if (error) throw error;

            // optimistic update
            setComments(prev => {
                const copy = { ...prev };
                copy[slug] = (copy[slug] || []).map(c => (c.id === commentId ? { ...c, content: text } : c));
                return copy;
            });

            setEditingCommentId(null);
            setEditingText('');
        } catch (e) {
            console.error('❌ Failed to save edit:', (e as any)?.message);
        } finally {
            setSavingEdit(false);
        }
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditingText('');
    };

    const deleteComment = async (slug: string, commentId: string) => {
        if (!viewer?.id) return;
        try {
            setDeletingId(commentId);
            const { error } = await supabase
                .from('video_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', viewer.id);
            if (error) throw error;

            setComments(prev => {
                const copy = { ...prev };
                copy[slug] = (copy[slug] || []).filter(c => c.id !== commentId);
                return copy;
            });
        } catch (e) {
            console.error('❌ Failed to delete comment:', (e as any)?.message);
        } finally {
            setDeletingId(null);
        }
    };
    const CommentActions: React.FC<{
        visible: boolean;
        menuKey: string;
        onEdit: () => void;
        onDelete: () => void;
        deleting?: boolean;
    }> = ({ visible, menuKey, onEdit, onDelete }) => {
        if (!visible) return null;
        return (
            <div
                className="ellipsis-wrap"
                tabIndex={0}
                onBlur={() => setOpenMenuId(null)}
                onKeyDown={(e) => e.key === 'Escape' && setOpenMenuId(null)}
                style={{ position: 'relative', display: 'inline-block' }}
            >
                <button
                    className="ellipsis-btn"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === menuKey}
                    aria-label="Comment actions"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === menuKey ? null : menuKey);
                    }}
                    style={{
                        background: 'transparent',
                        border: 0,
                        fontSize: 18,
                        lineHeight: 1,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 6,
                    }}
                    title="More actions"
                >
                    ⋮
                </button>

                {openMenuId === menuKey && (
                    <div
                        role="menu"
                        className="ellipsis-menu"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#fff',
                            border: '1px solid #e5e5e5',
                            borderRadius: 8,
                            boxShadow: '0 6px 20px rgba(0,0,0,.1)',
                            padding: 6,
                            minWidth: 140,
                            zIndex: 30,
                        }}
                    >
                        <button
                            role="menuitem"
                            onClick={() => {
                                setOpenMenuId(null);
                                onEdit();
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 0,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                borderRadius: 6,
                            }}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            role="menuitem"
                            onClick={() => {
                                setOpenMenuId(null);
                                onDelete();
                            }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                background: 'transparent',
                                border: 0,
                                padding: '8px 10px',
                                cursor: 'pointer',
                                borderRadius: 6,
                                color: '#b42318',
                            }}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Unified search (creators + videos)
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
                supabase
                    .from('podcast_metadata')
                    .select('id, user_id, display_name, name, description, avatar_url')
                    .or(`display_name.ilike.${like},name.ilike.${like},description.ilike.${like}`)
                    .limit(20),

                supabase
                    .from('media_files')
                    .select('slug, ep_title, file_name, ep_description, public_url, type')
                    .eq('type', 'video')
                    .or(`ep_title.ilike.${like},file_name.ilike.${like},ep_description.ilike.${like}`)
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

            setResults([...creators, ...videos]);
        } catch (err) {
            console.error('❌ Search error:', err);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };


    return (

        <div className={'mainReturn post_bannerLM'}>
            {metadata ? (
                <>
                    {/* Header */}
                    <header className={'dashboard_header'}>
                        <nav
                            className={`navbar navbar-expand-xl sticky-top lightMode transition-navbar ${
                                showNavbar ? 'visible' : 'hidden'
                            }`}
                            >
                            <div className="container-fluid px-3">
                                <Link className="navbar-brand" to="/dashboard?tab=Home">
                                    <img
                                        className="img-fluid"
                                        src="/Drawable/PodPilot-Logo-web.png"
                                        alt="PodPilot Logo"
                                    />
                                </Link>

                                <Link className="navbar-brand logoDM" to="/dashboard?tab=Home">
                                    <img
                                        className="img-fluid"
                                        src="/Drawable/PodPilot-Logo-web_light.png"
                                        alt="PodPilot Logo"
                                    />
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

                                    </div>

                                    <div className="d-flex p-1">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSearch();
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                            <input
                                                type="text"
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
                                                                <img
                                                                    src={item.avatar_url || '/default-avatar.png'}
                                                                    alt="avatar"
                                                                    className="search-avatar"
                                                                />
                                                                <div>
                                                                    <div className="search-name">{item.display_name || 'Creator'}</div>
                                                                    {item.description && (
                                                                        <div className="search-description">{item.description.slice(0, 60)}...</div>
                                                                    )}
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
                                                                    {item.description && (
                                                                        <div className="search-description">{item.description.slice(0, 60)}...</div>
                                                                    )}
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
                                        <AvatarDropdown
                                            avatarUrl={metadata?.avatar_url}
                                            displayName={metadata?.display_name || 'User'}
                                            onLogout={handleLogout}
                                        />
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </header>

                    <div className="container">
                        <div className="row pt-3">
                            <div className="col-12">
                                <div className={'welcomeSec px-3'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', 'width': 'fit-content', padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src={metadata.avatar_url || '/default-avatar.png'}
                                            alt="Avatar"
                                            style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                                        />
                                        <h2 style={{ margin: 0 }}>{metadata.display_name}</h2>
                                    </div>
                                </div>

                                {videos.length > 0 ? (
                                    <div className={'welcomeSec'}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                            gap: '1rem'
                                        }}
                                    >
                                        {videos.map((video, index) => (
                                            <div key={video.slug} style={{ border: '1px solid #eee', borderRadius: 10, padding: '12px 12px 0 12px'}}>
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
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleLike(video.slug, index)}
                                                    >
                                                        Like
                                                    </button>
                                                </div>

                                                {/* Comments */}
                                                <div className={''} style={{ marginTop: '1rem' }}>
                                                    <h6>Comments</h6>

                                                    {(() => {
                                                        const list = comments[video.slug] ?? [];
                                                        const needsScroll = list.length > 3;

                                                        return (
                                                            <div
                                                                className={`comments-list ${needsScroll ? 'scrollable' : ''}`}
                                                                style={{
                                                                    marginBottom: '0.5rem',
                                                                    maxHeight: needsScroll ? 120 : 'none',
                                                                    overflowY: needsScroll ? 'auto' : 'visible',
                                                                    paddingRight: needsScroll ? 16 : 0, // <-- extra space so scrollbar doesn't cover the ⋮
                                                                }}
                                                            >
                                                                {list.map((c) => (
                                                                    <div key={c.id} style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                                                        {/* HEADER: avatar + author on the left, ellipsis on the right */}
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                gap: '0.5rem',
                                                                            }}
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                {c.podcast_metadata?.avatar_url && (
                                                                                    <img
                                                                                        src={c.podcast_metadata.avatar_url}
                                                                                        alt="avatar"
                                                                                        style={{ width: 28, height: 28, borderRadius: '50%' }}
                                                                                    />
                                                                                )}
                                                                                <strong>{c.podcast_metadata?.name || 'User'}:</strong>
                                                                            </div>

                                                                            {/* owner-only actions */}
                                                                            {viewer?.id === c.user_id && editingCommentId !== c.id && (
                                                                                <CommentActions
                                                                                    visible
                                                                                    onEdit={() => beginEdit(c.id, c.content)}
                                                                                    onDelete={() => deleteComment(video.slug, c.id)}
                                                                                    menuKey={`profile-${c.id}`}
                                                                                    deleting={deletingId === c.id}
                                                                                />
                                                                            )}
                                                                        </div>

                                                                        {/* BODY */}
                                                                        {editingCommentId === c.id ? (
                                                                            <>
                                                                    <textarea
                                                                        value={editingText}
                                                                        onChange={(e) => setEditingText(e.target.value)}
                                                                        rows={2}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '0.5rem',
                                                                            borderRadius: 6,
                                                                            border: '1px solid #ccc',
                                                                            marginTop: 8,
                                                                        }}
                                                                    />
                                                                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                                                    <button
                                                                                        className="btn btn-success btn-sm"
                                                                                        disabled={savingEdit || !editingText.trim()}
                                                                                        onClick={() => saveEdit(video.slug, c.id)}
                                                                                    >
                                                                                        {savingEdit ? 'Saving…' : 'Save'}
                                                                                    </button>
                                                                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEdit}>
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div style={{ marginTop: '0.25rem' }}>{c.content}</div>
                                                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                                                    {new Date(c.created_at).toLocaleString()}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}

                                                    <textarea
                                                        placeholder="Add a comment..."
                                                        value={newComment[video.slug] || ''}
                                                        onChange={(e) => setNewComment((prev) => ({ ...prev, [video.slug]: e.target.value }))}
                                                        rows={2}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ccc',
                                                            marginBottom: '0.25rem',
                                                            height: '5vh'
                                                        }}
                                                    />
                                                    <button className={'btn'}
                                                        onClick={() => handleCommentSubmit(video.slug)}
                                                        >
                                                        Post Comment
                                                    </button>
                                                </div>


                                                {/* Share */}
                                                {video.slug && (
                                                    <div className={'vidShare'} style={{ marginTop: 8 }}>
                                                        <a href={`/videos/${video.slug}`} target="_self" rel="noopener noreferrer">
                                                            <img className={'img-fluid'} src="/Drawable/share.png" alt="Share" /> Share
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No videos uploaded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            ) : (
                <p>Loading podcaster info...</p>
            )}
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

export default PodcasterProfile;
