
/*import React from "react";
import { useAuth0 } from "@auth0/auth0-react";*/
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.ts";
import './style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';


function Home() {
    console.log("✅ Home.tsx rendered");
    // const { loginWithRedirect } = useAuth0();

    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showNavbar, setShowNavbar] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);


    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user ?? null;
            setUser(sessionUser);
            setLoading(false);
/*
            if (sessionUser) {
                navigate("/dashboard");
            }*/
        };
        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            const sessionUser = session?.user ?? null;
            setUser(sessionUser);

            // ✅ only redirect AFTER login event
            if (event === 'SIGNED_IN' && sessionUser) {
                navigate("/dashboard");
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [navigate]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show navbar if user is scrolling up or near the top
            if (currentScrollY < 100) {
                // Hide navbar near top
                setShowNavbar(false);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down
                setShowNavbar(true);
            } else {
                // Scrolling up
                setShowNavbar(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    if (loading) return null;

    return (
        <div className="container-fluid" style={{ "--bs-gutter-x": 0 } as React.CSSProperties}>
            {/* Navbar */}
            <nav className={`navbar navbar-expand-xl sticky-top bg-body-tertiary transition-navbar ${showNavbar ? 'visible' : 'hidden'}`}>
                <div className="container-fluid px-3">
                    <a className="navbar-brand" href="#">
                        <img
                            className="img-fluid"
                            src="/Drawable/PodPilot-Logo-web.png"
                            alt="PodPilot Logo"
                        />
                    </a>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarScroll"
                        aria-controls="navbarScroll"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div className="collapse navbar-collapse" id="navbarScroll">
                        {/*<ul
                            className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll"
                            style={{ "--bs-scroll-height": "100px" } as React.CSSProperties}
                        >
                            <li className="nav-item">
                                <a className="nav-link" aria-current="page" href="#">Products</a>
                            </li>
                            <li className="nav-item"><a className="nav-link" href="#">Solutions</a></li>
                            <li className="nav-item"><a className="nav-link" href="#">Pricing</a></li>
                            <li className="nav-item"><a className="nav-link" href="#">Contact</a></li>
                        </ul>*/}
                        <div className="d-flex">
                            {!user ? (
                                <>
                                    <button
                                        id="loginButton"
                                        className="btn btn-outline-success m-1"
                                        onClick={async () => {
                                            await supabase.auth.signInWithOAuth({
                                                provider: 'google',
                                                options: {
                                                    redirectTo: window.location.origin + '/dashboard',
                                                },
                                            });
                                        }}
                                    >
                                        Login
                                    </button>

                                    <button
                                        id="signUpButton"
                                        className="btn btn-outline-success m-1"
                                        onClick={async () => {
                                            await supabase.auth.signInWithOAuth({
                                                provider: 'google',
                                                options: {
                                                    redirectTo: window.location.origin + '/onboarding',
                                                },
                                            });
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="me-2 small text-muted">Logged in as {user.email}</span>
                                    <button
                                        className="btn btn-outline-secondary m-1"
                                        onClick={async () => {
                                            await supabase.auth.signOut();
                                        }}
                                    >
                                        Log&nbsp;out
                                    </button>
                                </>
                            )}

                            {/*<button
                                id="loginButton"
                                className="btn btn-outline-success m-1"
                                onClick={() => loginWithRedirect()}
                            >
                                Login
                            </button>
                            <button
                                id="signUpButton"
                                className="btn btn-outline-success m-1"
                                onClick={() => loginWithRedirect({
                                    authorizationParams: { screen_hint: "signup" },
                                    appState: { returnTo: "/onboarding" }
                                })}
                            >
                                Sign Up
                            </button>*/}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Banner Section */}
            <div className="banner position-relative">
                <video
                    className="videoBanner w-100"
                    autoPlay
                    muted
                    playsInline
                >
                    <source src="/Drawable/video_opening_homepg.mp4" type="video/mp4"  />
                    Your browser does not support the video tag.
                </video>

                <div className="overlay position-absolute top-0 start-0 w-100 h-100" />
                <div className="slogan text-center position-absolute top-50 start-50 translate-middle text-white transition-in">
                    <img className="img-fluid mb-3" src="/Drawable/PodPilot-Wordmark_black_banner.png" alt="PodPilot Slogan" />
                    <h3 className="text-shadow">Discover True Podcasting Freedom</h3>
                </div>
            </div>

            {/* Call-to-Action Section */}
            <div className="container my-5 text-center">
                {!user && (
                    <>
                        <h2 className="mb-3">Start Growing Your Podcast Today</h2>
                        <p className="mb-4">Join PodPilot and simplify how you publish and manage your episodes.</p>
                        <button
                            className="btn btn-success btn-lg px-4"
                            onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: window.location.origin + '/onboarding',
                                    },
                                });
                            }}
                        >
                            Get Started Free
                        </button>
                    </>
                )}
            </div>

             {/*Post Banner Section*/}
            <div className="container-fluid p-3 post_banner">
                <div className="row" >
                    <div className="col-5" style={{margin:'auto'}}>
                        <h3>
                            Share and Grow
                        </h3>
                        <p style={{textAlign: 'left'}}>
                            Share your favorite video content and Podcasters on <strong>PodPilot</strong>.
                            Enlighten yourself and others with unique ideas or views!
                            PodPilot will increase your social reach as a Podcaster.
                        </p>
                        <button
                            className="btn btn-success btn-lg px-4 txtC"
                            onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: window.location.origin + '/onboarding',
                                    },
                                });
                            }}
                        >
                            Get Started Free
                        </button>
                    </div>
                    <div className="col-5" style={{margin:'auto'}}>
                        <img src="/Drawable/sharing_content.jpg" alt="Friends sharing social podcast content." className="img-fluid txtC" />
                    </div>

                </div>
            </div>




            {/* Extra Info Section */}
            <div className="container extra_info p-3">
                <div className="row p-2">
                    <div className="col-md-4 mb-4">
                        <div className="card h-100 shadow-sm text-center">
                            <img src="/Drawable/one_click.png" className="card-img-top" alt="Upload" />
                            <div className="card-body">
                                {/*<h5 className="card-title">One-Click Publishing</h5>*/}
                                <p className="card-text">Distribute your podcast to all major platforms instantly from one place.</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mb-4">
                        <div className="card h-100 shadow-sm text-center">
                            <img src="/Drawable/analytics.png" className="card-img-top" alt="Analytics" />
                            <div className="card-body">
                                {/*<h5 className="card-title">Real-Time Analytics</h5>*/}
                                <p className="card-text">Track listener trends, platform performance, and audience engagement.</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mb-4">
                        <div className="card h-100 shadow-sm text-center">
                            <img src="/Drawable/monetize.png" className="card-img-top" alt="Monetize" />
                            <div className="card-body">
                                {/*<h5 className="card-title">Monetize Effortlessly</h5>*/}
                                <p className="card-text">Easily connect sponsors, run ads, and monetize your content directly.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className="container-fluid footer">
                <div className="row p-2">
                    <div className="col-12 text-center p-1">
                        <img src="/Drawable/PodPilot-Logo-web.png"
                             alt="PodPilot Logo"/>
                        <p className={'p-1'}>
                            &#169; Copy Right 2025, Presented by PodPilot
                        </p>

                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
