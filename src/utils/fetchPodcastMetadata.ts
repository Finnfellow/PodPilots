import {supabase} from "../config/database.ts";
import type {PodcastMetadata} from "./cloudStorage.ts";

export const fetchPodcastMetadata = async (userId: string): Promise<PodcastMetadata | null> => {
    const { data, error } = await supabase
        .from('podcast_metadata')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        // Not found (PGRST116) is okay, we'll handle that
        console.error('Error fetching podcast metadata:', error);
        return null;
    }

    if (!data) {
        return null;
    }

    return {
        name: data.name,
        description: data.description,
        tag: data.tags,
        logo_url: data.logo_url,
        logo_public_id: data.logo_public_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
    };
};
