import {supabase} from "./database.ts";
import {sanitizeForStorage} from "../utils/sanatizefortorage.ts";

export const uploadAvatar = async (file: File,) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
        console.error('Auth session error:', sessionError);
        throw new Error('User not authenticated');
    }

    const userId = session.user.id;

    // Sanitize the ID for use in a storage file path
    const sanitizeForStorage = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeId = sanitizeForStorage(userId);
    const path = `avatars/${safeId}_${Date.now()}`;

    const { error: uploadError } = await supabase.storage
        .from('avatar.bucket')
        .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('avatar.bucket')
        .getPublicUrl(path);

    const { error: updateError } = await supabase
        .from('user_profile')
        .update({ avatar_url: publicUrl }) // ✅ ensure correct column name
        .eq('user_id', userId);

    if (updateError) throw updateError;

    return publicUrl;
};
export const uploadPodcastLogo = async (file: File, userId: string | undefined) => {
    const safeId = sanitizeForStorage(userId);
    const path = `logos/${safeId}_${Date.now()}`;

    // Upload file to logo.bucket in Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('logo.bucket')
        .upload(path, file, { upsert: true })

    if (uploadError) throw uploadError

    // Get public URL of uploaded logo
    const { data: { publicUrl } } = supabase.storage
        .from('logo.bucket')
        .getPublicUrl(path)

    // Update podcast_metadata table with new logo URL for this user
    const { error: updateError } = await supabase
        .from('podcast_metadata')
        .update({ logo_url: publicUrl })
        .eq('user_id', userId)

    if (updateError) throw updateError

    return publicUrl
}