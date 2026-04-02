import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/StrataHub.css";

const StrataHubSelectionView: React.FC = () => {
  const navigate = useNavigate();

  const handleSelection = (type: "personal" | "managed") => {
    // Navigate to create strata with the selected type
    navigate(`/strata/new?type=${type}`);
  };

  return (
    <div className="strata-selection-container custom-scrollbar">
      <div className="strata-selection-content">
        <header className="strata-selection-header">
          <button 
            onClick={() => navigate("/strata")}
            className="flex items-center gap-2 text-gh-text-secondary hover:text-gh-text text-sm mb-4 transition-colors relative -left-4"
          >
            <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
            Back to Strata Main
          </button>
          <h1 className="strata-selection-title">Start by choosing an enterprise type</h1>
          <p className="strata-selection-description">
            Your enterprise type determines whether members can contribute to public repositories and if they can use their personal TrackCodex accounts.
            <a 
              href="https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-enterprise-accounts" 
              target="_blank" 
              rel="noopener noreferrer"
              className="strata-selection-link"
            >
              Learn more about enterprise types
              <span className="material-symbols-outlined !text-[14px]">open_in_new</span>
            </a>
          </p>
        </header>

        <div className="strata-cards-grid">
          {/* Card 1: Enterprise with personal accounts */}
          <div className="strata-selection-card">
            <div className="strata-card-badge">
              Recommended for public and private work
            </div>
            <div className="strata-card-body">
              <h2 className="strata-card-title">Enterprise with personal accounts</h2>
              <p className="strata-card-text">
                For public, open source and private work, that allows members to access your repositories with their personal accounts.
              </p>
            </div>
            <button 
              className="strata-btn-primary"
              onClick={() => handleSelection("personal")}
            >
              Get started with personal accounts
            </button>
          </div>

          {/* Card 2: Enterprise with managed users */}
          <div className="strata-selection-card">
            <div className="strata-card-badge">
              Recommended for internal work
            </div>
            <div className="strata-card-body">
              <h2 className="strata-card-title">Enterprise with managed users</h2>
              <p className="strata-card-text">
                For private and internal work only, with member accounts provisioned from your identity provider.
              </p>
            </div>
            
            <div className="strata-choice-option">
              <span className="material-symbols-outlined">language</span>
              Choose which geographical location to store your data
            </div>

            <button 
              className="strata-btn-dark"
              onClick={() => handleSelection("managed")}
            >
              Get started with managed users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrataHubSelectionView;
