// src/utils/uploadImage.ts
import { supabase } from '../config/database.ts';

export const uploadImage = async (
    file: File,
    bucket: string,
    path: string
): Promise<string | null> => {
    const cleanPath = path.replace(/\s+/g, "_");

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(cleanPath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || null;
};
