import React from "react";
import { useNavigate } from "react-router-dom";
import { Auth0Provider, User } from "@auth0/auth0-react";




export const Auth0ProviderWithNavigate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    const onRedirectCallback = (appState?: unknown, _user?: User) => {

        console.log("⚡ onRedirectCallback fired");
        console.log("   appState:", appState);
        const state = appState as { returnTo?: string } | undefined;
        navigate(state?.returnTo ?? "/dashboard", { replace: true });
    };

    return (
        <Auth0Provider
            domain="dev-mjg510tdbbueg8qt.us.auth0.com"
            clientId="WSeoW6Af9QTzEnSrYaKnheYFICzmgol0"
            authorizationParams={{
                redirect_uri: window.location.origin,
            }}
            onRedirectCallback={onRedirectCallback}
        >
            {children}
        </Auth0Provider>
    );
};
