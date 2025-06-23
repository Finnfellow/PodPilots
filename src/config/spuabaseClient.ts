// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Auth0Client }       from '@auth0/auth0-spa-js';

export const auth0 = new Auth0Client({
    domain:        import.meta.env.VITE_AUTH0_DOMAIN!,
    clientId:      import.meta.env.VITE_AUTH0_CLIENT_ID!,
    authorizationParams: {
        redirect_uri: window.location.origin,
    },
});

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
        /**
         * Supabase will call this before every request and attach
         * the Auth0 JWT it receives.
         */
        accessToken: async () => {
            try {
                return await auth0.getTokenSilently();
                // or: (await auth0.getIdTokenClaims()).__raw
            } catch (e) {
                console.error('Auth0 token fetch failed', e);
                return null;             // Supabase falls back to anon
            }
        },
    },
);
