
import React, { useState, useEffect} from 'react';
import {supabase} from '../supabaseClient.ts';
import { userService, type UserProfile, type PodcastMetadata } from '../utils/cloudStorage';
import {useLocation, useNavigate, Link} from "react-router-dom";
import {sanitizeForStorage} from "../utils/sanatizefortorage.ts";
import '../main/style.css';
import AvatarDropdown from './AvatarDropdown';


interface Episode {
    id: string;
    slug: string;
    title: string;
    description: string;
    publishDate: string;
    duration: string;
    status: 'draft' | 'published';
    audioFile?: string;
    videoUrl?: string;
    likeCount?: number;
}

interface PodcastStats {
    totalEpisodes: number;
    totalPlays: number;
    rssUrl: string;
}

interface DashboardProps {
    onNavigateToUpload?: () => void;
}
interface CommentWithMetadata {
    id: string;
    slug: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    podcast_metadata?: {
        name?: string;
        avatar_url?: string; // or logo_url if that's what you store
    };

}
interface NotificationRow {
    id: string;
    type: string;              // e.g. 'reply'
    data: any;                 // expects { slug?: string, parent_id?: string, ... }
    read_at: string | null;
    created_at: string;        // ISO
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
    const [comments, setComments] = useState<Record<string, CommentWithMetadata[]>>({});
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string>('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [, setDeletingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [openReply, setOpenReply] = useState<Record<string, boolean>>({});
    const [replyText, setReplyText] = useState<Record<string, string>>({});
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    /*const [searchResults, setSearchResults] = useState<PodcastMetadata[]>([]);*/
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
    const notifRef = React.useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!showNotifPanel) return;
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifPanel(false);
            }
        };
        document.addEventListener('pointerdown', onDocClick);
        return () => document.removeEventListener('pointerdown', onDocClick);
    }, [showNotifPanel]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);


    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);

    const location = useLocation();
    const [loading, setLoading] = useState(true);

    // ADD: modal & pending upload state
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingTitle, setPendingTitle] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);



    const openEditTitle = (ep: Episode) => {
        setEditingEpisode(ep);
        setEditingTitle(ep.title);
        setEditModalOpen(true);
    };

    const saveEditedTitle = async () => {
        if (!editingEpisode) return;
        const newTitle = editingTitle.trim();
        if (!newTitle) return;

        try {
            setSavingTitle(true);

            // Optional: if you keep updated_at in the table, leave it.
            // If you don't have that column, REMOVE updated_at from the update payload.
            const updatePayload: Record<string, any> = { ep_title: newTitle };
            // If your media_files table DOES have updated_at, keep this:
            // updatePayload.updated_at = new Date().toISOString();

            // Make sure you have access only to your own rows:
            const { data, error, status } = await supabase
                .from('media_files')
                .update(updatePayload)
                .eq('slug', editingEpisode.slug)
                .eq('type', 'video')         // remove this line if your rows don’t set type='video'
                .eq('user_id', user?.id)     // important for RLS & correctness
                .select('slug, ep_title')    // force PostgREST to return the row (helps with no-match debugging)
                .single();

            if (error) {
                console.error('[saveEditedTitle] Supabase error:', { status, error });
                throw error;
            }
            if (!data) {
                console.error('[saveEditedTitle] No row returned (likely no match). Filters used:', {
                    slug: editingEpisode.slug,
                    type: 'video',
                    user_id: user?.id,
                });
                throw new Error('No matching row found. Check filters.');
            }

            // Update local state
            setEpisodes(prev =>
                prev.map(ep => (ep.slug === editingEpisode.slug ? { ...ep, title: newTitle } : ep))
            );
            setRecentVideos(prev =>
                prev.map(v => (v.slug === editingEpisode.slug ? { ...v, name: newTitle } : v))
            );

            setEditModalOpen(false);
            setEditingEpisode(null);
        } catch (e: any) {
            // Shows readable alert, with details in console
            alert('Could not save title. See console for details.');
        } finally {
            setSavingTitle(false);
        }
    };



    useEffect(() => {
        // ✅ STEP 2: Fetch the latest podcast metadata on mount
        const fetchMetadata = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('podcast_metadata')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('❌ Failed to fetch podcast metadata:', error.message);
            } else {
                setPodcast_metadata(data);
            }
        };

        fetchMetadata();
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
    const markOneRead = async (id: string) => {
        if (!user?.id) return;

        const target = notifications.find((n) => n.id === id);
        if (!target || target.read_at) return; // already read or not found

        const now = new Date().toISOString();

        // Optimistic UI
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: now } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));

        // Persist
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: now })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('markOneRead failed:', error.message);
            // Roll back optimistic update if you want
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
            );
            setUnreadCount((c) => c + 1);
        }
    };

    // REPLACE: handleVideoUpload to accept epTitle
    const handleVideoUpload = async (file: File, epTitle: string) => {
        try {
            setUploading(true);

            const userId = user?.id;
            if (!userId) throw new Error("User not authenticated");

            const safeName = sanitizeForStorage(file.name);
            const path = `videos/${Date.now()}-${safeName}`;
            const slug = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-_]/g, "");

            // 1) Upload to storage
            const { error: uploadError } = await supabase.storage
                .from("video.bucket")
                .upload(path, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2) Get public URL
            const { data: publicData } = supabase.storage
                .from("video.bucket")
                .getPublicUrl(path);

            const url = publicData?.publicUrl;

            // 3) Save to local state / storage
            setVideoUrl(url);
            localStorage.setItem("videoPath", path);

            // 4) Insert metadata with ep_title
            const { error: insertError } = await supabase
                .from("media_files")
                .insert([
                    {
                        user_id: userId,
                        file_name: file.name,
                        ep_title: epTitle,                      // 👈 store the title
                        storage_path: path,
                        public_url: url,
                        file_size: file.size,
                        uploaded_at: new Date().toISOString(),
                        slug: slug,
                        type: "video",
                    },
                ]);

            if (insertError) throw insertError;

            console.log("✅ Video uploaded and metadata saved");
            await fetchRecentVideos(userId);
            await fetchUserEpisodes(userId);
        } catch (err) {
            console.error("❌ Video upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    // ADD: start the flow by asking for title first
    const startVideoUploadFlow = (file: File) => {
        if (!file) return;
        setPendingFile(file);
        // default title = filename (no extension)
        setPendingTitle(file.name.replace(/\.[^/.]+$/, ""));
        setShowTitleModal(true);
    };

    const fetchRecentVideos = async (userId: string) => {
        const { data, error } = await supabase
            .from("media_files")
            .select("ep_title, ep_description, public_url, uploaded_at, slug, like_count")
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
            name: file.ep_title,
            createdAt: file.uploaded_at,
            publicUrl: file.public_url,
            slug: file.slug,
            likeCount: file.like_count ?? 0
        }));

        setRecentVideos(recent);
        console.log("✅ Recent videos loaded:", recent);
    };
    const fetchComments = async (slugs: string[]) => {
        const { data, error } = await supabase
            .from("video_comments")
            .select(`
      id,
      slug,
      content,
      created_at,
      user_id,
      parent_id,
      podcast_metadata (
        name,
        avatar_url
      )
    `)
            .in("slug", slugs)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("❌ Failed to fetch comments:", error.message);
            return;
        }

        const grouped: Record<string, CommentWithMetadata[]> = {};
        (data ?? []).forEach((c) => {
            if (!grouped[c.slug]) grouped[c.slug] = [];
            grouped[c.slug].push(c as CommentWithMetadata);
        });

        setComments(grouped);
    };
    // keep fetchComments(...) defined just above this

    useEffect(() => {
        const channel = supabase
            .channel('comments-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'video_comments' },
                (payload) => {
                    const slug =
                        (payload.new as any)?.slug ??
                        (payload.old as any)?.slug;
                    if (!slug) return;
                    // re-fetch ONLY the affected slug so we get podcast_metadata join
                    fetchComments([slug]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchUserEpisodes = async (userId: string) => {
        try {
            setLoadingEpisodes(true);

            // Only select columns that actually exist in media_files.
            // (Your logs showed `media_files.id` doesn't exist.)
            const { data, error } = await supabase
                .from('media_files')
                .select('file_name, ep_title, ep_description, public_url, uploaded_at, slug, type, like_count')
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
                slug: row.slug ?? String(row.file_name ?? `row-${idx}`),
                title: row.ep_title?.replace(/\.[^/.]+$/, '') || `Episode ${idx + 1}`,
                description: row.ep_description ||'Uploaded video',
                publishDate: (row.uploaded_at ?? '').split('T')[0] || '',
                duration: 'N/A',
                status: 'published',
                videoUrl: row.public_url ?? '',
                likeCount: row.like_count ?? 0, // 👈
            }));

            setEpisodes(mapped);
            console.log('🎬 Episodes loaded:', mapped.length, mapped);
        } finally {
            setLoadingEpisodes(false);
        }
    };

    const handleLike = async (slug: string) => {
        const { error } = await supabase.rpc("increment_like_count", { slug_input: slug });
        if (error) { console.error("❌ Failed to like video:", error.message); return; }

        // ✅ snappy UI
        setEpisodes(prev => prev.map(e => e.slug === slug ? { ...e, likeCount: (e.likeCount ?? 0) + 1 } : e));
        setRecentVideos(prev => prev.map(v => v.slug === slug ? { ...v, likeCount: (v.likeCount ?? 0) + 1 } : v));

        // ✅ then refetch to stay accurate
        if (user?.id) await Promise.all([fetchRecentVideos(user.id), fetchUserEpisodes(user.id)]);
    };
    const handleCommentSubmit = async (slug: string) => {
        const text = newComment[slug]?.trim();
        if (!text || !user?.id) return;

        const { error } = await supabase
            .from("video_comments")
            .insert({ slug, content: text, user_id: user.id });

        if (error) {
            console.error("❌ Failed to submit comment:", error.message);
            return;
        }

        // Clear the input; realtime will refresh the list
        setNewComment((prev) => ({ ...prev, [slug]: "" }));
    };
    const handleReplySubmit = async (slug: string, parentId: string) => {
        const text = (replyText[parentId] || '').trim();
        if (!text || !user?.id) return;

        // Insert the reply
        const { error } = await supabase
            .from('video_comments')
            .insert({ slug, content: text, user_id: user.id, parent_id: parentId });

        if (error) {
            console.error('❌ Failed to post reply:', error.message);
            return;
        }

        // Optional: notify parent comment author
        const { data: parentRow } = await supabase
            .from('video_comments')
            .select('user_id, slug')
            .eq('id', parentId)
            .single();

        const parentAuthorId = parentRow?.user_id;
        if (parentAuthorId && parentAuthorId !== user.id) {
            await supabase.from('notifications').insert({
                user_id: parentAuthorId,
                type: 'reply',
                data: { slug, parent_id: parentId },
                created_at: new Date().toISOString(),
            });
        }

        setReplyText(prev => ({ ...prev, [parentId]: '' }));
        setOpenReply(prev => ({ ...prev, [parentId]: false }));
        // realtime on video_comments will refresh thread
    };
    // --- Notifications helpers ---
      const fetchNotifications = async () => {
           if (!user?.id) return;
           setNotifLoading(true);
           const { data, error } = await supabase
             .from('notifications')
             .select('*')
             .eq('user_id', user.id)
             .order('created_at', { ascending: false })
             .limit(50);
           if (!error && data) setNotifications(data as NotificationRow[]);
           setNotifLoading(false);
      };

         const markAllRead = async () => {
           if (!user?.id) return;
           const now = new Date().toISOString();
           await supabase
             .from('notifications')
             .update({ read_at: now })
             .eq('user_id', user.id)
             .is('read_at', null);
           setUnreadCount(0);
           setNotifications(prev => prev.map(n => n.read_at ? n : ({ ...n, read_at: now })));
         };

    const beginEdit = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditingText(currentText);
    };
    const saveEdit = async (slug: string, commentId: string) => {
        const text = editingText.trim();
        if (!text || !user?.id) return;
        try {
            setSavingEdit(true);
            const { error } = await supabase
                .from('video_comments')
                .update({ content: text })
                .eq('id', commentId)
                .eq('user_id', user.id);
            if (error) throw error;

            // optimistic local update (faster UI)…
            setComments(prev => {
                const copy = { ...prev };
                copy[slug] = (copy[slug] || []).map(c =>
                    c.id === commentId ? { ...c, content: text } : c
                );
                return copy;
            });

            setEditingCommentId(null);
            setEditingText('');
            // Or do a precise refetch if you prefer source of truth:
            // await fetchComments([slug]);
        } catch (e) {
            console.error('❌ Failed to save edit:', (e as any)?.message);
        } finally {
            setSavingEdit(false);
        }
    };
    const cancelCommentEdit = () => {
        setEditingCommentId(null);
        setEditingText('');
    };
    const deleteComment = async (slug: string, commentId: string) => {
        if (!user?.id) return;
        try {
            setDeletingId(commentId);
            const { error } = await supabase
                .from('video_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id);
            if (error) throw error;

            // optimistic local removal
            setComments(prev => {
                const copy = { ...prev };
                copy[slug] = (copy[slug] || []).filter(c => c.id !== commentId);
                return copy;
            });

            // Or refetch:
            // await fetchComments([slug]);
        } catch (e) {
            console.error('❌ Failed to delete comment:', (e as any)?.message);
        } finally {
            setDeletingId(null);
        }
    };
// Lightweight ellipsis menu – no extra libs required
    const CommentActions = ({
                                visible,
                                onEdit,
                                onDelete,
                                menuKey,
                            }: {
        visible: boolean;
        onEdit: () => void;
        onDelete: () => void;
        menuKey: string;
    }) => {
        if (!visible) return null;
        return (
            <div
                className="ellipsis-wrap"
                tabIndex={0}
                onBlur={() => setOpenMenuId(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpenMenuId(null);
                }}
                style={{ position: 'relative', display: 'inline-block'}}
            >
                <button
                    className="ellipsis-btn"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === menuKey ? 'true' : 'false'}
                    aria-label="Comment actions"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === menuKey ? null : menuKey);
                    }}
                    style={{
                        background: 'transparent',
                        border: '0',
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

    //end of new code
    useEffect(() => {
        if (!user?.id) return;
        // Initial unread count
        supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .is('read_at', null)
            .then(({ count }) => setUnreadCount(count || 0));

        // Realtime new notifications
        const channel = supabase
            .channel('notif')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    setUnreadCount(c => c + 1);
                    if (showNotifPanel) {
                        setNotifications(prev => [payload.new as NotificationRow, ...prev]);
                    }
                }
            )
            .subscribe();
        return () => {
            void supabase.removeChannel(channel); // ignore the returned Promise
        };
    }, [user?.id, showNotifPanel]);

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
            if (currentUser?.id) {
                const { data: slugs } = await supabase
                    .from("media_files")
                    .select("slug")
                    .eq("user_id", currentUser.id);
                if (slugs) {
                    await fetchComments(slugs.map(v => v.slug));
                }
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

    useEffect(() => {
        if (activeTab !== 'episodes') return;
        const slugs = episodes.map(e => e.slug).filter(Boolean);
        if (slugs.length) fetchComments(slugs);
    }, [activeTab, episodes]);
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

    /*const getStatusColor = (status: Episode['status']) => {
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
    };*/

    console.log("✅ Recent videos loaded:", recentVideos);

    return (
        <div className={"mainReturn post_bannerLM"}>
            {/* Welcome Toast */}
            {showWelcome && (
                <div
                    style={{
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
                        gap: '0.75rem',
                    }}
                    >
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
                            marginLeft: '0.5rem',
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
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
                                {(['Home', 'episodes'] as Tab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        className={`navi_buttons ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            navigate(`?tab=${tab}`, { replace: false });
                                        }}
                                        >
                                        {tab}
                                    </button>
                                ))}
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
                                                            <div className="search-name">
                                                                {item.display_name || 'Creator'}
                                                            </div>
                                                            {item.description && (
                                                                <div className="search-description">
                                                                    {item.description.slice(0, 60)}...
                                                                </div>
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
                                                                <div className="search-description">
                                                                    {item.description.slice(0, 60)}...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <button
                                        className="searchBtn"
                                        type="submit"
                                        disabled={searching}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#1A8C67',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                        }}
                                        >
                                        {searching ? 'Searching…' : 'Search'}
                                    </button>
                                </form>
                            </div>


                            <div className="d-flex p-1" style={{ position: 'relative', alignItems: 'center', gap: '0.75rem' }}>
                                {/* Bell */}
                                <button
                                    type="button"
                                    title="Notifications"
                                    onClick={async () => {
                                        const next = !showNotifPanel;
                                        setShowNotifPanel(next);
                                        if (next) await fetchNotifications();
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 0,
                                        position: 'relative',
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        borderRadius: 8,
                                    }}
                                    >
                                    <span style={{ fontSize: 20 }}>🔔</span>
                                    {unreadCount > 0 && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 2,
                                                right: 2,
                                                minWidth: 18,
                                                height: 18,
                                                lineHeight: '18px',
                                                borderRadius: 9,
                                                background: '#dc3545',
                                                color: '#fff',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                display: 'inline-block',
                                                textAlign: 'center',
                                                padding: '0 4px',
                                            }}
                                            >
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Panel */}
                                {showNotifPanel && (
                                    <div
                                        ref={notifRef}
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 'calc(100% + 8px)',
                                            width: 360,
                                            maxHeight: 420,
                                            overflowY: 'auto',
                                            background: '#fff',
                                            border: '1px solid #e5e5e5',
                                            borderRadius: 12,
                                            boxShadow: '0 8px 28px rgba(0,0,0,.12)',
                                            zIndex: 2000,
                                        }}
                                        >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                borderBottom: '1px solid #eee',
                                            }}
                                            >
                                            <strong>Notifications</strong>
                                            <button
                                                onClick={markAllRead}
                                                className="btn btn-link btn-sm"
                                                style={{ textDecoration: 'none', color: '#1A8C67' }}
                                                >
                                                Mark all read
                                            </button>
                                        </div>

                                        <div style={{ padding: 8 }}>
                                            {notifLoading && <div style={{ padding: 12 }}>Loading…</div>}
                                            {!notifLoading && notifications.length === 0 && (
                                                <div style={{ padding: 12, color: '#666' }}>No notifications yet.</div>
                                            )}
                                            {notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        if (!n.read_at) markOneRead(n.id);
                                                        setShowNotifPanel(false);
                                                        const data = n.data || {};
                                                        if (n.type === 'reply' && data.slug) {
                                                            navigate(`/videos/${data.slug}${data.parent_id ? `#comment-${data.parent_id}` : ''}`);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderBottom: '1px solid #f2f2f2',
                                                        cursor: 'pointer',
                                                        background: n.read_at ? '#fff' : '#f7fbf9',
                                                        opacity: n.read_at ? 0.8 : 1,
                                                        borderRadius: 8,
                                                        margin: '6px 4px',
                                                    }}
                                                    >
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                        {n.type === 'reply' ? 'New reply to your comment' : 'Notification'}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#666' }}>
                                                        {new Date(n.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
            </header>

            <div className="container">
                <div className="row">
                    <div className="col-6">
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
                                                <p className="podcast-desc">
                                                    {podcast_metadata?.description || 'Upload episodes, and let listeners discover your content.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Unknown what's below */}
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
                                                    <button onClick={addTag}>Add</button>
                                                </div>

                                                {editForm.tags.length > 0 && (
                                                    <div className={'editFormContent'}>
                                                        {editForm.tags.map((tag, index) => (
                                                            <span key={index}>
                                                    {tag}
                                                                <button onClick={() => removeTag(tag)}>×</button>
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
                                                {/*{podcast_metadata?.tag && podcast_metadata.tag.length > 0 && (
                                                    <div className={'podCastMetaContent'}>
                                                        <span className={'podSpan0'}>Tags:</span>
                                                        {podcast_metadata.tag.map((tag, index) => (
                                                            <span className={'podSpan1'} key={index}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}*/}
                                            </>
                                        )}
                                    </div>

                                    <div className={'welcomeSec'}>
                                        <div>
                                            <h5><em>Upload Preview</em></h5>

                                            {videoUrl && (
                                                <div className={'vidPreHolder'}>
                                                    <video className={'videoContent'} controls width="100%">
                                                        <source src={videoUrl} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editModalOpen && (
                                <div
                                    className="modal fade show"
                                    role="dialog"
                                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                                    aria-modal="true"
                                >
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Edit Episode Title</h5>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    aria-label="Close"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                />
                                            </div>

                                            <div className="modal-body">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditedTitle();
                                                    }}
                                                    autoFocus
                                                    disabled={savingTitle}
                                                />
                                            </div>

                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                    disabled={savingTitle}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={saveEditedTitle}
                                                    disabled={savingTitle || !editingTitle.trim()}
                                                >
                                                    {savingTitle ? 'Saving…' : 'Save Title'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                        </main>
                    </div>
                    <div className="col-6">
                        <main className={'mainSec'}>
                            {activeTab === 'Home' && (
                                <div>
                                    {/* ADD: Title confirmation modal */}
                                    {showTitleModal && (
                                        <div
                                            className="modal fade show"
                                            role="dialog"
                                            style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                                            aria-modal="true"
                                        >
                                            <div className="modal-dialog">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h5 className="modal-title">Name your episode</h5>
                                                        <button
                                                            type="button"
                                                            className="btn-close"
                                                            aria-label="Close"
                                                            onClick={() => {
                                                                if (!uploading) {
                                                                    setShowTitleModal(false);
                                                                    setPendingFile(null);
                                                                    setPendingTitle('');
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="modal-body">
                                                        <label className="form-label">Episode title</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={pendingTitle}
                                                            onChange={(e) => setPendingTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key === 'Enter' &&
                                                                    pendingFile &&
                                                                    pendingTitle.trim()
                                                                ) {
                                                                    handleVideoUpload(
                                                                        pendingFile,
                                                                        pendingTitle.trim()
                                                                    );
                                                                    setShowTitleModal(false);
                                                                    setPendingFile(null);
                                                                    setPendingTitle('');
                                                                }
                                                            }}
                                                            autoFocus
                                                            placeholder="e.g., My First Episode"
                                                            disabled={uploading}
                                                        />
                                                        <small className="text-muted">
                                                            You can update this later from the Episodes tab.
                                                        </small>
                                                    </div>

                                                    <div className="modal-footer">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => {
                                                                if (!uploading) {
                                                                    setShowTitleModal(false);
                                                                    setPendingFile(null);
                                                                    setPendingTitle('');
                                                                }
                                                            }}
                                                            disabled={uploading}
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            onClick={() => {
                                                                if (pendingFile && pendingTitle.trim()) {
                                                                    handleVideoUpload(
                                                                        pendingFile,
                                                                        pendingTitle.trim()
                                                                    );
                                                                    setShowTitleModal(false);
                                                                    setPendingFile(null);
                                                                    setPendingTitle('');
                                                                }
                                                            }}
                                                            disabled={
                                                                !pendingTitle.trim() || !pendingFile || uploading
                                                            }
                                                        >
                                                            {uploading ? 'Uploading…' : 'Confirm & Upload'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="welcomeSec" >
                                        {/* Profile and Podcast Images */}
                                        <div className={'profileUploadSec'} style={{justifyContent: "space-around",marginTop: '0rem'}}>
                                            <div className={'txtC'}>
                                                <img
                                                    src={podcast_metadata?.avatar_url || '/default-avatar.png'}
                                                    alt="Profile avatar"
                                                    className="avatarPreview"
                                                />
                                                <div className="muted small">Profile photo</div>
                                            </div>

                                            <div className={'txtC'}>
                                                <img
                                                    src={podcast_metadata?.logo_url || '/placeholder-logo.png'}
                                                    alt="Podcast logo"
                                                    className="logoPreview"
                                                />
                                                <div className="muted small">Podcast logo</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className={'statContent'}>
                                        <div className={'statHolder'}>
                                            <h3>Total Episodes</h3>
                                            <p>{stats.totalEpisodes}</p>
                                        </div>
                                    </div>

                                    <div className={'welcomeSec'}>
                                        <div className={'txtC'}>
                                            <h3>Ready for your next <strong>Upload!</strong></h3>

                                            <div
                                                className={'videoDragDrop'}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    e.preventDefault();
                                                    const file = e.target.files?.[0];
                                                    if (file) startVideoUploadFlow(file);
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onClick={() =>
                                                    document.getElementById('videoInput')?.click()
                                                }
                                            >
                                                <p>Drag and drop your video file here, or click to select</p>

                                                <input
                                                    id="videoInput"
                                                    type="file"
                                                    accept="video/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) startVideoUploadFlow(file);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editModalOpen && (
                                <div
                                    className="modal fade show"
                                    role="dialog"
                                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                                    aria-modal="true"
                                    >
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Edit Episode Title</h5>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    aria-label="Close"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                />
                                            </div>

                                            <div className="modal-body">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditedTitle();
                                                    }}
                                                    autoFocus
                                                    disabled={savingTitle}
                                                />
                                            </div>

                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                    disabled={savingTitle}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={saveEditedTitle}
                                                    disabled={savingTitle || !editingTitle.trim()}
                                                >
                                                    {savingTitle ? 'Saving…' : 'Save Title'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <main className={'mainSec'} style={{maxWidth: 'inherit'}}>
                            {activeTab === 'Home' && (
                                <div>
                                    {/* Recent Episodes */}
                                    <div className={'recentEpisodeContent'}>
                                        <h2>Your Episodes</h2>
                                        <p>
                                            <em>
                                                Episodes with the most likes will automatically show towards the
                                                top of this list!
                                            </em>
                                        </p>

                                        <div
                                            className={'episodeContent'}
                                            >
                                            {recentVideos.map((video) => (
                                                <div className={'recentVid'} key={video.slug}>
                                                    <video width="100%" height="auto" controls src={video.publicUrl} />
                                                    <span className={'vidSpan0'}>{video.name}</span>
                                                    <span className={'vidSpan1'}>
                                                        Uploaded on {new Date(video.createdAt).toLocaleDateString()}
                                                    </span>

                                                    {/* Like Button */}
                                                    <div
                                                        style={{
                                                            marginTop: '0.5rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                        }}
                                                    >
                                                        <span>❤️ {video.likeCount ?? 0} Likes</span>
                                                        {/*<button className="likeBtn" onClick={() => handleLike(video.slug)}>
                                                             Like
                                                        </button>*/}
                                                    </div>

                                                    {/* Comments Section */}
                                                    <div className={'video-comments'} style={{ marginTop: '1rem',display:'none' }}>
                                                        {/*<h4>Comments</h4>*/}

                                                        {(() => {
                                                            const list = comments[video.slug] ?? [];
                                                            // Build children map for threaded replies
                                                            const childrenMap: Record<string, CommentWithMetadata[]> = {};
                                                            for (const c of list) {
                                                                if (c.parent_id) (childrenMap[c.parent_id] ||= []).push(c);
                                                            }
                                                            const roots = list.filter(c => !c.parent_id);
                                                            const needsScroll = list.length > 3;

                                                            return (
                                                                <div
                                                                    className={`comments-list ${needsScroll ? 'scrollable' : ''}`}
                                                                    style={{
                                                                        marginBottom: '0.5rem',
                                                                        maxHeight: needsScroll ? 280 : 'none',
                                                                        overflowY: needsScroll ? 'auto' : 'visible',
                                                                        paddingRight: needsScroll ? 16 : 0, // keep scrollbar off the ⋮
                                                                    }}
                                                                >
                                                                    {roots.map((c) => (
                                                                        <div
                                                                            id={'comment-' + String(c.id)}
                                                                            key={c.id}
                                                                            style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}
                                                                        >
                                                                            {/* HEADER */}
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

                                                                                {user?.id === c.user_id && editingCommentId !== c.id && (
                                                                                    <CommentActions
                                                                                        visible
                                                                                        onEdit={() => beginEdit(c.id, c.content)}
                                                                                        onDelete={() => deleteComment(video.slug, c.id)}
                                                                                        menuKey={`home-${c.id}`}
                                                                                    />
                                                                                )}
                                                                            </div>

                                                                            {/* BODY / EDIT */}
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
                                                                                        <button className="btn btn-outline-secondary btn-sm" onClick={cancelCommentEdit}>
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

                                                                            {/* Reply toggle + input */}
                                                                            <div style={{ marginTop: 6 }}>
                                                                                <button
                                                                                    onClick={() => setOpenReply((p) => ({ ...p, [c.id]: !p[c.id] }))}
                                                                                    style={{
                                                                                        background: 'transparent',
                                                                                        border: 0,
                                                                                        color: '#1A8C67',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 600,
                                                                                    }}
                                                                                >
                                                                                    {openReply[c.id] ? 'Cancel reply' : 'Reply'}
                                                                                </button>
                                                                            </div>

                                                                            {openReply[c.id] && (
                                                                                <div style={{ marginTop: 8, paddingLeft: 36 }}>
                                                                        <textarea
                                                                            placeholder="Write a reply…"
                                                                            value={replyText[c.id] || ''}
                                                                            onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                                            rows={2}
                                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
                                                                        />
                                                                                    <button
                                                                                        onClick={() => handleReplySubmit(video.slug, c.id)}
                                                                                        className="btn btn-success btn-sm"
                                                                                        style={{ marginTop: 6 }}
                                                                                        disabled={!(replyText[c.id] || '').trim()}
                                                                                    >
                                                                                        Reply
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            {/* CHILD REPLIES */}
                                                                            {(childrenMap[c.id] || []).map((rep) => (
                                                                                <div
                                                                                    id={'comment-' + String(rep.id)}
                                                                                    key={rep.id}
                                                                                    style={{ marginTop: 10, marginLeft: 36 }}
                                                                                >
                                                                                    <div
                                                                                        style={{
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'space-between',
                                                                                            gap: '0.5rem',
                                                                                        }}
                                                                                    >
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                            {rep.podcast_metadata?.avatar_url && (
                                                                                                <img
                                                                                                    src={rep.podcast_metadata.avatar_url}
                                                                                                    alt="avatar"
                                                                                                    style={{ width: 24, height: 24, borderRadius: '50%' }}
                                                                                                />
                                                                                            )}
                                                                                            <strong>{rep.podcast_metadata?.name || 'User'}:</strong>
                                                                                        </div>

                                                                                        {user?.id === rep.user_id && editingCommentId !== rep.id && (
                                                                                            <CommentActions
                                                                                                visible
                                                                                                onEdit={() => beginEdit(rep.id, rep.content)}
                                                                                                onDelete={() => deleteComment(video.slug, rep.id)}
                                                                                                menuKey={`home-${rep.id}`}
                                                                                            />
                                                                                        )}
                                                                                    </div>

                                                                                    {editingCommentId === rep.id ? (
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
                                                                                                    onClick={() => saveEdit(video.slug, rep.id)}
                                                                                                >
                                                                                                    {savingEdit ? 'Saving…' : 'Save'}
                                                                                                </button>
                                                                                                <button className="btn btn-outline-secondary btn-sm" onClick={cancelCommentEdit}>
                                                                                                    Cancel
                                                                                                </button>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <div style={{ marginTop: '0.25rem' }}>{rep.content}</div>
                                                                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                                                                {new Date(rep.created_at).toLocaleString()}
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ))}

                                                                </div>
                                                            );
                                                        })()}
                                                        <textarea
                                                            placeholder="Add a comment..."
                                                            value={newComment[video.slug] || ''}
                                                            onChange={(e) =>
                                                                setNewComment((prev) => ({
                                                                    ...prev,
                                                                    [video.slug]: e.target.value,
                                                                }))
                                                            }
                                                            rows={2}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                borderRadius: '6px',
                                                                border: '1px solid #ccc',
                                                                marginBottom: '0.25rem',
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleCommentSubmit(video.slug)}
                                                            className={'btn'}
                                                        >
                                                            Post Comment
                                                        </button>
                                                    </div>

                                                    {/* Shareable Link */}
                                                    {video.slug && (
                                                        <div className={'vidShare'}>
                                                            <a
                                                                href={`/videos/${video.slug}`}
                                                                target="_self"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <img
                                                                    className={'img-fluid'}
                                                                    src="/Drawable/share.png"
                                                                    alt="Share by Pexel Perfect"
                                                                />{' '}
                                                                Share
                                                            </a>
                                                        </div>
                                                    )}

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editModalOpen && (
                                <div
                                    className="modal fade show"
                                    role="dialog"
                                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                                    aria-modal="true"
                                >
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Edit Episode Title</h5>
                                                <button
                                                    type="button"
                                                    className="btn-close"
                                                    aria-label="Close"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                />
                                            </div>

                                            <div className="modal-body">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditedTitle();
                                                    }}
                                                    autoFocus
                                                    disabled={savingTitle}
                                                />
                                            </div>

                                            <div className="modal-footer">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => !savingTitle && setEditModalOpen(false)}
                                                    disabled={savingTitle}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={saveEditedTitle}
                                                    disabled={savingTitle || !editingTitle.trim()}
                                                >
                                                    {savingTitle ? 'Saving…' : 'Save Title'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>

                <div className="row px-5">
                    <div className="col-12">
                        {activeTab === 'episodes' && (
                            <div className={'actEpisodeContent'}>
                                <div className={'actEpisodeItem0'}>
                                    <h2>Your Collection of Episodes</h2>
                                </div>

                                <div className={'actEpisodeItem1'} >
                                    <div className={'actEpiSubItem0'}>
                                        {loadingEpisodes && (
                                            <div className={'aeSubItem0'}>Loading your episodes…</div>
                                        )}
                                        {!loadingEpisodes && episodes.length === 0 && (
                                            <div className={'aeSubItem0'}>No episodes yet. Try uploading a video!</div>
                                        )}

                                        {!loadingEpisodes &&
                                            episodes.map((episode: Episode) => (
                                                <div className={'aeSubItem0'} key={episode.id}>
                                                    <div className={'aeSubItemContent'}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <h3 style={{ margin: 0 }}>{episode.title}</h3>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => openEditTitle(episode)}
                                                                title="Edit episode title"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </div>
                                                        <p>{episode.description}</p>

                                                        {/* Show video if present */}
                                                        {episode.videoUrl && (
                                                            <div className={'aeSubItem1'}>
                                                                <video
                                                                    controls
                                                                    width="100%"
                                                                    style={{ maxWidth: 600, borderRadius: 8 }}
                                                                >
                                                                    <source src={episode.videoUrl} type="video/mp4" />
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            </div>
                                                        )}

                                                        <div className={'aeSubItem2'}>
                                                            <span>
                                                              {episode.publishDate
                                                                  ? `Published: ${episode.publishDate}`
                                                                  : 'Unpublished'}
                                                            </span>
                                                        </div>

                                                        {/* Likes */}
                                                        <div
                                                            style={{
                                                                marginTop: '0.5rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                            }}
                                                        >
                                                            <span>❤️ {episode.likeCount ?? 0} Likes</span>
                                                            <button
                                                                style={{
                                                                    background: 'rgba(240,79,79,0)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    padding: '0.25rem 0.5rem',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => handleLike(episode.slug)}
                                                            >
                                                                Like
                                                            </button>
                                                        </div>

                                                        {/* Comments */}
                                                        <div className="video-comments" style={{ marginTop: '1rem' }}>
                                                            <h4>Comments</h4>

                                                            {(() => {
                                                                const list = comments[episode.slug] ?? [];
                                                                const needsScroll = list.length > 3;

                                                                return (
                                                                    <div
                                                                        className={`comments-list ${needsScroll ? 'scrollable' : ''}`}
                                                                        style={{
                                                                            marginBottom: '0.5rem',
                                                                            maxHeight: needsScroll ? 120 : 'none',
                                                                            overflowY: needsScroll ? 'auto' : 'visible',
                                                                        }}
                                                                    >

                                                                        {list.map((comment) => (
                                                                            <div key={comment.id} style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                                                                {/* HEADER: avatar/name left, ⋮ right */}
                                                                                <div
                                                                                    style={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'space-between',
                                                                                        gap: '0.5rem',
                                                                                    }}
                                                                                >
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                        {comment.podcast_metadata?.avatar_url && (
                                                                                            <img
                                                                                                src={comment.podcast_metadata.avatar_url}
                                                                                                alt="avatar"
                                                                                                style={{ width: 28, height: 28, borderRadius: '50%' }}
                                                                                            />
                                                                                        )}
                                                                                        <strong>{comment.podcast_metadata?.name || 'User'}:</strong>
                                                                                    </div>

                                                                                    <CommentActions
                                                                                        visible={user?.id === comment.user_id && editingCommentId !== comment.id}
                                                                                        onEdit={() => beginEdit(comment.id, comment.content)}
                                                                                        onDelete={() => deleteComment(episode.slug, comment.id)}
                                                                                        menuKey={`episodes-${comment.id}`}
                                                                                    />
                                                                                </div>

                                                                                {/* BODY */}
                                                                                {editingCommentId === comment.id ? (
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
                                                                                                onClick={() => saveEdit(episode.slug, comment.id)}
                                                                                            >
                                                                                                {savingEdit ? 'Saving…' : 'Save'}
                                                                                            </button>
                                                                                            <button className="btn btn-outline-secondary btn-sm" onClick={cancelCommentEdit}>
                                                                                                Cancel
                                                                                            </button>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <div style={{ marginTop: '0.25rem' }}>{comment.content}</div>
                                                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                                                            {new Date(comment.created_at).toLocaleString()}
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
                                                                value={newComment[episode.slug] || ''}
                                                                onChange={(e) => setNewComment((prev) => ({ ...prev, [episode.slug]: e.target.value }))}
                                                                rows={2}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.5rem',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #ccc',
                                                                    marginBottom: '0.25rem',
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleCommentSubmit(episode.slug)}
                                                                className="btn"
                                                                style={{ borderRadius: '6px' }}
                                                            >
                                                                Post Comment
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/*<div className={'aeSubItemContent0 pt-2'}>
                                                          <span
                                                              style={{
                                                                  backgroundColor: getStatusColor(episode.status) + '20',
                                                                  color: getStatusColor(episode.status),
                                                              }}
                                                            >
                                                            {getStatusText(episode.status)}
                                                          </span>
                                                    </div>*/}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                  @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                  }
            `}</style>

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

export default Dashboard;
