import React from "react";
import "../../styles/Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="trackcodex-footer">
      <div className="footer-content">
        <div className="footer-copyright">© 2026 TrackCodex, Inc.</div>

        <nav className="footer-links">
          <a href="https://docs.trackcodex.com/governance/policies/terms" className="footer-link">Terms</a>
          <a href="https://docs.trackcodex.com/governance/policies/privacy" className="footer-link">Privacy</a>
          <a href="https://docs.trackcodex.com/governance/security" className="footer-link">Security</a>
          <a href="https://status.trackcodex.com" className="footer-link">Status</a>
          <a href="https://docs.trackcodex.com/governance/policies/community" className="footer-link">Community</a>
          <button 
            type="button" 
            className="footer-link" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
          >
            Manage cookies
          </button>
          <a
            href="https://docs.trackcodex.com"
            className="footer-link"
          >
            Docs
          </a>
          <a
            href="https://support.trackcodex.com"
            className="footer-link"
          >
            Support
          </a>
          <a href="https://support.trackcodex.com" className="footer-link">Contact</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;


