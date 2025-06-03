
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';


const root = createRoot(document.getElementById('root')!);

root.render(
    <Auth0Provider
        domain="dev-mjg510tdbbueg8qt.us.auth0.com"
        clientId="WSeoW6Af9QTzEnSrYaKnheYFICzmgol0"
        authorizationParams={{
            redirect_uri:  `${window.location.origin}/onboarding`
        }}
    >
        <App />
    </Auth0Provider>,
);