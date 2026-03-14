import React from "react";
import { Link } from "react-router-dom";
import "../../styles/Footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="trackcodex-footer">
      <div className="footer-content">
        <div className="footer-copyright">© 2026 TrackCodex, Inc.</div>

        <nav className="footer-links">
          <a href="https://docs.trackcodex.com/governance/policies/terms" className="footer-link" target="_blank" rel="noopener noreferrer">Terms</a>
          <a href="https://docs.trackcodex.com/governance/policies/privacy" className="footer-link" target="_blank" rel="noopener noreferrer">Privacy</a>
          <a href="https://docs.trackcodex.com/governance/security" className="footer-link" target="_blank" rel="noopener noreferrer">Security</a>
          <a href="https://status.trackcodex.com" className="footer-link" target="_blank" rel="noopener noreferrer">Status</a>
          <a href="https://docs.trackcodex.com/governance/policies/community" className="footer-link" target="_blank" rel="noopener noreferrer">Community</a>
          <button 
            type="button" 
            className="footer-link" 
            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
          >
            Manage cookies
          </button>
          <a
            href="https://docs.trackcodex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Docs
          </a>
          <a
            href="https://support.trackcodex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Support
          </a>
          <Link to="/contact" className="footer-link">Contact</Link>
          <button className="footer-link footer-cookie-btn">
            Manage cookies
          </button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;


