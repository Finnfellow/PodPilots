
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

function Home() {
    const { loginWithRedirect } = useAuth0();

    return (
        <div className="container-fluid" style={{ "--bs-gutter-x": 0 } as React.CSSProperties}>
            {/* Navbar */}
            <nav className="navbar navbar-expand-xl sticky-top bg-body-tertiary">
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
                        <ul
                            className="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll"
                            style={{ "--bs-scroll-height": "100px" } as React.CSSProperties}
                        >
                            <li className="nav-item">
                                <a className="nav-link active" aria-current="page" href="#">Products</a>
                            </li>
                            <li className="nav-item"><a className="nav-link" href="#">Solutions</a></li>
                            <li className="nav-item"><a className="nav-link" href="#">Pricing</a></li>
                            <li className="nav-item"><a className="nav-link" href="#">Contact</a></li>
                        </ul>
                        <div className="d-flex">
                            <button
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
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Banner Section */}
            <div className="banner">
                <img className="opacity-25 img-fluid" src="/Drawable/banner.jpg" alt="Main Banner" />
                <div className="slogan">
                    <img className="img-fluid" src="/Drawable/PodPilot-Wordmark_black_banner.png" alt="PodPilot Slogan" />
                    <h3>Discover True Podcasting Freedom</h3>
                </div>
            </div>

            {/* Post Banner Section */}
            <div className="container p-3 post_banner">
                <p>
                    Post your content seamlessly anywhere through one place <strong>PodPilot!</strong>
                </p>
                <div className="row">
                    <div className="col-4"><img src="/Drawable/instagram.jpg" alt="Instagram" className="img-fluid" /></div>
                    <div className="col-4"><img src="/Drawable/tiktok.jpg" alt="TikTok" className="img-fluid" /></div>
                    <div className="col-4"><img src="/Drawable/youtube.jpg" alt="YouTube" className="img-fluid" /></div>
                </div>
            </div>

            {/* Extra Info Section */}
            <div className="container extra_info p-2">
                <h4>Title</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
                <div className="row p-2">
                    <div className="col-4">
                        <div className="card" style={{ width: "18rem" }}>
                            <img src="..." className="card-img-top" alt="..." />
                            <div className="card-body">
                                <h5 className="card-title">Card title</h5>
                                <p className="card-text">Some quick example text to build on the card title...</p>
                                <a href="#" className="btn btn-primary">Go somewhere</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <hr />
            <footer className="container">
                <div className="row p-2">
                    <div className="col-3">
                        <p>footer info</p>
                        <ul>
                            <li>Something</li>
                            <li>Something</li>
                            <li>Something</li>
                            <li>Something</li>
                            <li>Something</li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
