
import ReactDOM from "react-dom/client";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Auth0Provider
        domain="dev-mjg510tdbbueg8qt.us.auth0.com"
        clientId="WSeoW6Af9QTzEnSrYaKnheYFICzmgol0"
        authorizationParams={{ redirect_uri:"http://localhost:4173/onboarding"  }}
    >
        <App />
    </Auth0Provider>
);
