

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


    // Auth modal state (email-first)
    const [authOpen, setAuthOpen] = useState<null | 'login' | 'signup'>(null);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    //type AuthProvider = 'google' ; // add others if needed
   // const oauthProviders: AuthProvider[] = ['google'];

    const openAuth = (mode: 'login' | 'signup') => {
        setAuthError(null);
        setAuthEmail('');
        setAuthPassword('');
        setAuthOpen(mode);
    };

    const closeAuth = () => {
        if (authLoading) return;
        setAuthOpen(null);
    };

    const handleEmailAuth = async () => {
        try {
            setAuthLoading(true);
            setAuthError(null);

            if (authOpen === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;

                // confirmations OFF => you get a session
                if (data.session) {
                    navigate('/auth/finish');
                } else {
                    // confirmations ON => email sent
                    alert('Check your email to confirm your account.');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                navigate('/auth/finish');
            }

            closeAuth();
        } catch (e: any) {
            console.error('[Auth error]', e); // <- see exact message & status in console
            setAuthError(e?.message || 'Something went wrong');
        } finally {
            setAuthLoading(false);
        }
    };


// generic oAuth handler
    const signInWithOAuth = async () => {
         await supabase.auth.signOut().catch(() => {});
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/finish`,
                queryParams: {
                    prompt: 'select_account',          // force account chooser

                },
            },
        });
    };




    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            const sessionUser = data.session?.user ?? null;
            setUser(sessionUser);
            setLoading(false);
/*


            }*/
        };
        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            const u = session?.user ?? null;
            if (event === 'SIGNED_IN' && u) {
                // If we’re NOT on the decision page, you can still fall back to dashboard.
                const p = window.location.pathname;
                if (p === '/' || p === '/home') {
                    navigate('/dashboard');
                }
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
            <nav className={`navbar navbar-expand-xl sticky-top lightMode transition-navbar ${showNavbar ? 'visible' : 'hidden'}`}>
                <div className="container-fluid px-3">
                    <a className="navbar-brand logoLM" href="#">
                        <img
                            className="img-fluid"
                            src="/Drawable/PodPilot-Logo-web.png"
                            alt="PodPilot Logo"
                        />
                    </a>

                    <a className="navbar-brand logoDM" href="#">
                        <img
                            className="img-fluid"
                            src="/Drawable/PodPilot-Logo-web_light.png"
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

                        <div className="d-flex">

                            {!user ? (
                                <>
                                    <button id="loginButton" className="btn m-1" onClick={() => openAuth('login')}>
                                        Login
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
                <div className="slogan position-absolute translate-middle top-50 start-50 text-white transition-in">
                    <img className="img-fluid mb-3 translate-left" src="/Drawable/PodPilot-Wordmark_black_banner.png" alt="PodPilot Slogan" />
                    <h1 className="text-shadow text-center">Discover True Podcasting Freedom</h1>
                    <button className="btn btn-lg px-4" onClick={() => openAuth('signup')}>
                        Get Started Free
                    </button>

                </div>
            </div>

            {/* Call-to-Action Section */}
            <div className="container-fluid post_bannerLM">

                <div className="container py-4">

                    <div className="row p-4 share_section" >
                        <div className="col-5 child1">
                            <h2 className="py-2">
                                Share and Grow
                            </h2>
                            <p className="py-2">
                                Share your favorite video content and Podcasters on <strong>PodPilot</strong>.
                                Enlighten yourself and others with unique ideas or views!
                                PodPilot will increase your social reach as a Podcaster.
                            </p>
                            <button
                                className="btn btn-lg px-4 txtC"
                                onClick={() => openAuth('signup')}
                            >
                                Get Started Free
                            </button>
                        </div>
                        <div className="col-5">
                            <img src="/Drawable/sharing_content.jpg" alt="Friends sharing social podcast content." className="img-fluid" />
                        </div>

                    </div>

                    <div className="row extra_info p-4">
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

            </div>


            {authOpen && (
                <div
                    className="modal fade show"
                    role="dialog"
                    style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}
                    aria-modal="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content modalLM">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {authOpen === 'signup' ? 'Create your account' : 'Welcome back'}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeAuth} />
                            </div>

                            <div className="modal-body">
                                {authError && (
                                    <div className="alert alert-danger" role="alert">
                                        {authError}
                                    </div>
                                )}

                                {/* OAuth first */}
                                <div className="text-center my-2">Sign up with</div>
                                <button
                                    className="btn w-100 mb-2"
                                    onClick={signInWithOAuth}
                                    disabled={authLoading}
                                >
                                    Continue with Google
                                </button>

                                <div className="text-center my-2">or use email</div>

                                {/* Email / password */}
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={authEmail}
                                        onChange={(e) => setAuthEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        autoFocus
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={authPassword}
                                        onChange={(e) => setAuthPassword(e.target.value)}
                                        placeholder="Enter a strong password"
                                    />
                                </div>

                                <button
                                    className="btn w-100 mb-2"
                                    onClick={handleEmailAuth}
                                    disabled={authLoading || !authEmail || (authOpen === 'signup' && !authPassword)}
                                >
                                    {authLoading ? 'Please wait…' : (authOpen === 'signup' ? 'Create account' : 'Log in')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Footer */}
            <footer className="container-fluid footer lightMode">
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

            {/*darkmode footer below*/}

            {/*
            <footer className="container-fluid footer darkMode">
                <div className="row p-2">
                    <div className="col-12 text-center p-1">
                        <img src="/Drawable/PodPilot-Logo-web_light.png"
                             alt="PodPilot Logo"/>
                        <p className={'p-1'}>
                            &#169; Copy Right 2025, Presented by PodPilot
                        </p>

                    </div>
                </div>
            </footer>
            */}

        </div>
    );
}

export default Home;
