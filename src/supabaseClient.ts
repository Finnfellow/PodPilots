import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY!;


export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImageToSupabase(file: File, bucket: "avatar" | "logo", path: string) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
    });

    if (error) throw error;

    return getPublicUrl(bucket, path); // ✅ Returns public URL
}

export function getPublicUrl(bucket: string, path: string): string {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}