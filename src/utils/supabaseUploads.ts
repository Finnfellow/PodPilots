// src/utils/supabaseUploads.ts
import { supabase } from '../supabaseClient.ts';

/**
 * Uploads an image to Supabase Storage and returns its public URL
 */
export const uploadImageToSupabase = async (
    bucket: 'avatar' | 'logo',
    userId: string,
    file: File
): Promise<string> => {
    const filePath = `${userId}/${file.name}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600',
        });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
};
