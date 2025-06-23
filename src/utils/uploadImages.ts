import { supabase } from "../supabaseClient";

/**
 * Uploads an image to the specified Supabase storage bucket and returns a public URL.
 * @param file - The image file to upload.
 * @param bucket - The Supabase storage bucket name ("avatar" or "logo").
 * @param path - The path inside the bucket (e.g. "avatars/filename.png").
 */
export async function uploadImage(
    file: File,
    bucket: "avatar" | "logo",
    path: string
): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
    });

    if (error) {
        console.error("Upload failed:", error.message);
        return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
}
