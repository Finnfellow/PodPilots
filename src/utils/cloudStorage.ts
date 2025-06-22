// src/utils/cloudStorage.ts
import { supabase } from '../config/database';

export interface UploadResult {
    url: string;
    publicId: string;
    fileName: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    avatarPublicId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface PodcastMetadata {
    user_id: string;
    name: string;
    description: string;
    tag: string[];
    logo_url?: string;
    logo_public_id?: string;
    created_at: string;
    updated_at?: string;
    avatar_url?: string;
    avatar_public_id?: string;
}

// Cloud storage service using Supabase
export class CloudStorageService {
    private static instance: CloudStorageService;

    static getInstance(): CloudStorageService {
        if (!CloudStorageService.instance) {
            CloudStorageService.instance = new CloudStorageService();
        }
        return CloudStorageService.instance;
    }

    async uploadImage(file: File, folder: 'avatars' | 'podcasts' | 'episodes'): Promise<UploadResult> {
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('podcast-assets')
                .upload(fileName, file);

            if (error) {
                console.error('Storage upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('podcast-assets')
                .getPublicUrl(fileName);

            return {
                url: publicUrl,
                publicId: data.path,
                fileName: data.path
            };
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('Upload failed');
        }
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            const { error } = await supabase.storage
                .from('podcast-assets')
                .remove([publicId]);

            if (error) {
                console.error('Storage delete error:', error);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }

    getImageUrl(publicId: string): string | null {
        if (!publicId) return null;

        const { data } = supabase.storage
            .from('podcast-assets')
            .getPublicUrl(publicId);

        return data.publicUrl;
    }
}

// User service class with PostgreSQL integration
export class UserService {
    private static instance: UserService;
    private storageService = CloudStorageService.getInstance();

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async createUserProfile(username: string, email: string): Promise<UserProfile> {
        try {
            const profile: UserProfile = {
                id: Math.random().toString(36).substring(2, 15),
                username,
                email,
                createdAt: new Date().toISOString()
            };

            // Save to database
            const { error } = await supabase
                .from('user_profiles')
                .insert([{
                    id: profile.id,
                    username: profile.username,
                    email: profile.email,
                    created_at: profile.createdAt
                }]);

            if (error) {
                console.error('Database insert error:', error);
                // Fallback to localStorage only
            }

            // Also save to localStorage for immediate access
            localStorage.setItem('userProfile', JSON.stringify(profile));
            return profile;
        } catch (error) {
            console.error('Failed to create user profile:', error);

            // Fallback: create profile locally only
            const profile: UserProfile = {
                id: Math.random().toString(36).substring(2, 15),
                username,
                email,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('userProfile', JSON.stringify(profile));
            return profile;
        }
    }

    async uploadUserAvatar(file: File): Promise<string> {
        try {
            const result = await this.storageService.uploadImage(file, 'avatars');

            const userProfile = this.getUserProfile();
            if (userProfile) {
                // Delete old avatar if exists
                if (userProfile.avatarPublicId) {
                    await this.storageService.deleteImage(userProfile.avatarPublicId);
                }

                // Update profile
                userProfile.avatarUrl = result.url;
                userProfile.avatarPublicId = result.publicId;
                userProfile.updatedAt = new Date().toISOString();

                // Try to update database
                try {
                    await supabase
                        .from('user_profiles')
                        .update({
                            avatar_url: result.url,
                            avatar_public_id: result.publicId,
                            updated_at: userProfile.updatedAt
                        })
                        .eq('id', userProfile.id);
                } catch (dbError) {
                    console.error('Database update failed, using localStorage only:', dbError);
                }

                // Update localStorage
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
            }

            return result.url;
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            throw error;
        }
    }

    async uploadPodcastLogo(file: File): Promise<string> {
        try {
            const result = await this.storageService.uploadImage(file, 'podcasts');

            const podcastMetadata = this.getPodcastMetadata();
            if (podcastMetadata) {
                // Delete old logo if exists
                if (podcastMetadata.logo_public_id) {
                    await this.storageService.deleteImage(podcastMetadata.logo_public_id);
                }

                // Update metadata
                podcastMetadata.logo_url = result.url;
                podcastMetadata.logo_public_id = result.publicId;
                podcastMetadata.updated_at = new Date().toISOString();

                // Try to update database
                try {
                    await supabase
                        .from('podcast_metadata')
                        .update({
                            logo_url: result.url,
                            logo_public_id: result.publicId,
                            updated_at: podcastMetadata.updated_at
                        })
                        .eq('name', podcastMetadata.name); // Using name as identifier since id might not exist
                } catch (dbError) {
                    console.error('Database update failed, using localStorage only:', dbError);
                }

                // Update localStorage
                localStorage.setItem('podcastMetadata', JSON.stringify(podcastMetadata));
            }

            return result.url;
        } catch (error) {
            console.error('Failed to upload podcast logo:', error);
            throw error;
        }
    }

    getUserProfile(): UserProfile | null {
        // For now, using localStorage for immediate access
        // In production, you might want to fetch from database and sync
        const stored = localStorage.getItem('userProfile');
        return stored ? JSON.parse(stored) : null;
    }

    getPodcastMetadata(): PodcastMetadata | null {
        // For now, using localStorage for immediate access
        // In production, you might want to fetch from database and sync
        const stored = localStorage.getItem('podcastMetadata');
        return stored ? JSON.parse(stored) : null;
    }

    async savePodcastMetadata(metadata: PodcastMetadata): Promise<void> {
        try {
            // Save to database
            const { error } = await supabase
                .from('podcast_metadata')
                .insert([{
                    name: metadata.name,
                    description: metadata.description,
                    tags: metadata.tag,
                    logo_url: metadata.logo_url,
                    logo_public_id: metadata.logo_public_id,
                    created_at: metadata.created_at
                }]);

            if (error) {
                console.error('Database insert error:', error);
                // Continue with localStorage save
            }

            // Save to localStorage
            localStorage.setItem('podcastMetadata', JSON.stringify(metadata));
        } catch (error) {
            console.error('Failed to save podcast metadata:', error);
            // Fallback to localStorage only
            localStorage.setItem('podcastMetadata', JSON.stringify(metadata));
        }
    }

    updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
        const current = this.getUserProfile();
        if (!current) return null;

        const updated = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Update database (async, don't wait to avoid blocking UI)
        supabase
            .from('user_profiles')
            .update({
                username: updated.username,
                email: updated.email,
                avatar_url: updated.avatarUrl,
                avatar_public_id: updated.avatarPublicId,
                updated_at: updated.updatedAt
            })
            .eq('id', current.id)
            .then(({ error }) => {
                if (error) {
                    console.error('Database update failed:', error);
                }
            });

        // Update localStorage immediately
        localStorage.setItem('userProfile', JSON.stringify(updated));
        return updated;
    }

    // Utility method to sync data from database (for future use)
    async syncFromDatabase(): Promise<void> {
        try {
            const userProfile = this.getUserProfile();
            if (userProfile) {
                const { data: dbProfile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', userProfile.id)
                    .single();

                if (dbProfile) {
                    const syncedProfile: UserProfile = {
                        id: dbProfile.id,
                        username: dbProfile.username,
                        email: dbProfile.email,
                        avatarUrl: dbProfile.avatar_url,
                        avatarPublicId: dbProfile.avatar_public_id,
                        createdAt: dbProfile.created_at,
                        updatedAt: dbProfile.updated_at
                    };
                    localStorage.setItem('userProfile', JSON.stringify(syncedProfile));
                }
            }
        } catch (error) {
            console.error('Failed to sync from database:', error);
        }
    }
}

// Export singleton instances
export const cloudStorage = CloudStorageService.getInstance();
export const userService = UserService.getInstance();