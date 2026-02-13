import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LandingPage.css";

const LandingPage = () => {
    const { user, loading } = useAuth();

    // Redirect authenticated users to dashboard
    if (!loading && user) {
        return <Navigate to="/dashboard/home" replace />;
    }

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-brand">TrackCodex</div>
                <div className="nav-links">
                    <Link to="/login" className="nav-link">
                        Log In
                    </Link>
                    <Link to="/signup" className="btn-pill">
                        Try Now
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="hero-section">
                <h1 className="hero-title">
                    Bold Ideas That Start With Vision.
                </h1>
                <p className="hero-subtitle">
                    The all-in-one workspace for developers, designers, and creators to build the future.
                </p>

                <div className="hero-cta-group">
                    <Link to="/signup" className="btn-pill btn-large">
                        Get In Touch
                    </Link>
                </div>
            </main>

            {/* Hero Illustration */}
            <div className="illustration-container">
                <img
                    src="/assets/landing_page_hands_illustration.png"
                    alt="Visionary Interface"
                    className="hero-image"
                />
            </div>
        </div>
    );
};

export default LandingPage;
