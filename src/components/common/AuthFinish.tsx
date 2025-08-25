import { useEffect } from 'react';
import { supabase} from "../../supabaseClient.ts";
import { useNavigate } from 'react-router-dom';

export default function AuthFinish() {
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/'); return; }

            // Is this user already onboarded?
            const { data, error } = await supabase
                .from('podcast_metadata')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('auth/finish check error:', error.message);
                navigate('/dashboard'); // safe fallback
                return;
            }

            if (data) navigate('/dashboard');     // returning
            else      navigate('/onboarding');    // new
        })();
    }, [navigate]);

    return <div style={{ padding: 24 }}>Finishing sign-in…</div>;
}
