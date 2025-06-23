//import React from "react";
// import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.ts";

/**
 * Home/Landing page.
 * – Uses Auth0 React SDK hooks only.
 * – `loginWithRedirect` stores `appState.targetUrl`;
 *   `Auth0ProviderWithNavigate` handles the redirect and navigation for us.
 */
const HomePage: React.FC = () => {
    /*const {
        loginWithRedirect,
        logout,
        isAuthenticated,
        isLoading,
        user,
    } = useAuth0();*/

        const [user, setUser] = useState<any>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const getSession = async () => {
                const { data } = await supabase.auth.getSession();
                setUser(data.session?.user ?? null);
                setLoading(false);
            };
            getSession();

            const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
                setUser(session?.user ?? null);
            });

            return () => {
                listener.subscription.unsubscribe();
            };
        }, []);


        /* OPTIONAL: show nothing until SDK finishes booting */
    //if (isLoading) return null;
    if (loading) return null;

    return (
        <div className="container-fluid" style={{ ["--bs-gutter-x" as any]: 0 }}>
            {/* ---------- Navbar (sample) ---------- */}
            <nav className="navbar navbar-expand-xl sticky-top bg-body-tertiary px-3">
                <a className="navbar-brand fw-bold" href="/">
                    PodPilot
                </a>

                <div className="ms-auto d-flex gap-2">
                    {!user ? (
                        <>
                            <button
                                className="btn btn-outline-primary"
                                onClick={async () => {
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo: window.location.origin + '/Dashboard' }
                                    });
                                }}
                            >
                                Log&nbsp;in
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={async () => {
                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: { redirectTo: window.location.origin + '/OnboardingFlow' }
                                    });
                                }}
                            >
                                Sign&nbsp;up
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline-secondary"
                            onClick={async () => {
                                await supabase.auth.signOut();
                            }}
                        >
                            Log&nbsp;out
                        </button>
                    )}


                    {/*{!isAuthenticated ? (
                        <>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() =>
                                    loginWithRedirect({ appState: { returnTo: "/Dashboard" } })
                                }
                            >
                                Log&nbsp;in
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={() =>
                                    loginWithRedirect({
                                        authorizationParams: { screen_hint: "signup" },
                                        appState: { returnTo: "/OnboardingFlow" },
                                    })
                                }
                            >
                                Sign&nbsp;up
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                logout({ logoutParams: { returnTo: window.location.origin } })
                            }
                        >
                            Log&nbsp;out
                        </button>
                    )}*/}
                </div>
            </nav>

            {/* ---------- Hero / Banner ---------- */}
            <div className="banner position-relative">
                <img
                    className="opacity-25 img-fluid w-100"
                    src="resources/Drawable/banner.jpg"
                    alt="Main Banner"
                />
                <div className="slogan position-absolute top-50 start-50 translate-middle text-center">
                    <img
                        className="img-fluid mb-3"
                        src="resources/Drawable/PodPilot-Wordmark_black_banner.png"
                        alt="PodPilot Slogan"
                    />
                    <h3 className="fw-semibold">Discover True Podcasting Freedom</h3>
                </div>
            </div>

            {/* ---------- Debug (remove in production) ---------- */}
            {user && (
                <pre className="mt-3 small text-muted">
                Logged in as {user.email}
            </pre>
            )}

                {/*/*{isAuthenticated && (
                <pre className="mt-3 small text-muted">
                    Logged in as {user?.email || user?.name}
                </pre>
            )*/}
        </div>
    );
};

export default HomePage;
