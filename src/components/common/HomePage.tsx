import React, { useEffect } from 'react';

const HomePage: React.FC = () => {
    useEffect(() => {
        // Auth0 logic or JS from your HTML page
        const loadAuth0 = async () => {
            const auth0 = await (window as any).createAuth0Client({
                domain: "YOUR_AUTH0_DOMAIN",
                client_id: "YOUR_AUTH0_CLIENT_ID",
                redirect_uri: window.location.origin,
            });

            document.getElementById("loginButton")?.addEventListener("click", async () => {
                await auth0.loginWithRedirect();
            });

            document.getElementById("signUpButton")?.addEventListener("click", async () => {
                await auth0.loginWithRedirect({
                    authorizationParams: {
                        screen_hint: "signup",
                    },
                });
            });

            const query = window.location.search;
            if (query.includes("code=") && query.includes("state=")) {
                await auth0.handleRedirectCallback();
                window.history.replaceState({}, document.title, "/");
            }

            const isAuthenticated = await auth0.isAuthenticated();
            if (isAuthenticated) {
                const user = await auth0.getUser();
                console.log("User:", user);

                document.getElementById("loginButton")!.style.display = "none";
                const signUpBtn = document.getElementById("signUpButton")!;
                signUpBtn.textContent = "Logout";
                signUpBtn.replaceWith(signUpBtn.cloneNode(true)); // clean listeners
                signUpBtn.addEventListener("click", async () => {
                    await auth0.logout({ returnTo: window.location.origin });
                });
            }
        };

        loadAuth0();
    }, []);

    return (
        <div className="container-fluid" style={{ ["--bs-gutter-x" as any]: 0 }}>
            {/* Your HTML structure copied from your page goes here as JSX */}

            <nav className="navbar navbar-expand-xl sticky-top bg-body-tertiary">
                {/* ...copy over navbar JSX here ... */}
            </nav>

            <div className="banner">
                <img className="opacity-25 img-fluid" src="resources/Drawable/banner.jpg" alt="Main Banner" />
                <div className="slogan">
                    <img className="img-fluid" src="resources/Drawable/PodPilot-Wordmark_black_banner.png" alt="PodPilot Slogan" />
                    <h3>Discover True Podcasting Freedom</h3>
                </div>
            </div>

            {/* And so on — convert your HTML to JSX here */}

        </div>
    );
};

export default HomePage;
