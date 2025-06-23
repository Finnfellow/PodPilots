import { useEffect } from 'react';
import {supabase} from "../../config/database.ts"; // adjust path as needed
import { useAuth0 } from '@auth0/auth0-react';

export const SupabaseAuthBridge = () => {
    const { isAuthenticated, getIdTokenClaims, isLoading } = useAuth0();

    useEffect(() => {
        const syncSupabaseSession = async () => {
            if (!isAuthenticated || isLoading) return;

            const claims = await getIdTokenClaims();
            const id_token = claims?.__raw;

            if (!id_token) {
                console.error('No ID token from Auth0');
                return;
            }

            const { error, data } = await supabase.auth.signInWithIdToken({
                provider: 'auth0',
                token: id_token,
            });

            if (error) {
                console.error('🔴 Supabase signInWithIdToken failed:', error.message);
            } else {
                console.log('✅ Supabase session established:', data.session);
            }
        };

        syncSupabaseSession();
    }, [isAuthenticated, isLoading, getIdTokenClaims]);

    return null;
};