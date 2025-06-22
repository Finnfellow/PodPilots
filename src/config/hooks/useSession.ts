// hooks/useSession.ts
import { useEffect, useState } from 'react';
import {supabase} from "../database.ts";
import type { Session } from '@supabase/supabase-js';

export const useSession = () => {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        // 1️⃣  Grab any cached session on first load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // 2️⃣  React to log-ins / log-outs
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return session;
};
