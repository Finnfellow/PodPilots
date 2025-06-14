// src/pages/Callback.tsx
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const Callback = () => {
    const { user, isAuthenticated, isLoading } = useAuth0();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            const isNewUser = user?.updated_at === user?.created_at;
            navigate(isNewUser ? "/onboarding" : "/dashboard");
        }
    }, [isLoading, isAuthenticated, user, navigate]);

    return <div>Loading...</div>;
};

export default Callback;
