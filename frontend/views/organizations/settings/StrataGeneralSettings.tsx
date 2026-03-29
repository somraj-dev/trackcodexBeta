import React, { useState } from "react";
import { Strata } from "../../../types";
import { useOutletContext } from "react-router-dom";
import "../../../styles/StrataDashboard.css";

const Switch: React.FC<{ 
  checked: boolean; 
  onChange: (val: boolean) => void; 
  label?: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="switch-container">
    <div className="flex flex-col gap-0.5">
      {label && <span className="settings-card-title">{label}</span>}
      {description && <span className="settings-card-description">{description}</span>}
    </div>
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label || 'Toggle settings'} />
      <span className="slider"></span>
    </label>
  </div>
);

const FooterLinkRow: React.FC<{
  index: number;
  title: string;
  url: string;
  onUpdate: (index: number, field: "title" | "url", val: string) => void;
  onRemove: (index: number) => void;
}> = ({ index, title, url, onUpdate, onRemove }) => (
  <div className="footer-link-row">
    <div className="flex-1">
      <label className="settings-form-label text-[12px]">Link {index + 1} title</label>
      <input 
        className="settings-form-input" 
        value={title} 
        onChange={(e) => onUpdate(index, "title", e.target.value)}
        placeholder="e.g., About Us"
        aria-label={`Link ${index + 1} title`}
      />
    </div>
    <div className="flex-[2]">
      <label className="settings-form-label text-[12px]">Link {index + 1} URL</label>
      <input 
        className="settings-form-input" 
        value={url} 
        onChange={(e) => onUpdate(index, "url", e.target.value)}
        placeholder="https://example.com/about"
        aria-label={`Link ${index + 1} URL`}
      />
    </div>
    <button 
      className="btn-remove-link"
      onClick={() => onRemove(index)}
      aria-label="Remove link"
    >
      <span className="material-symbols-outlined !text-[20px]">delete</span>
      <span className="text-[12px] font-semibold ml-1">Remove</span>
    </button>
  </div>
);

const StrataGeneralSettings = () => {
  const { strata: org } = useOutletContext<{ strata: Strata }>();
  
  // Enterprise Profile State
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description);
  const [website, setWebsite] = useState(org.website || "");
  const [location, setLocation] = useState(org.location || "");
  const [securityEmail, setSecurityEmail] = useState("");
  
  // Member Appearance State
  const [visibility, setVisibility] = useState("Let organizations decide");

  // Footer Links State
  const [footerLinks, setFooterLinks] = useState([
    { title: "", url: "" },
    { title: "", url: "" },
    { title: "", url: "" },
    { title: "", url: "" },
    { title: "", url: "" }
  ]);

  // In-product messages State
  const [promotions, setPromotions] = useState(true);
  const [tips, setTips] = useState(true);

  const handleFooterUpdate = (index: number, field: "title" | "url", val: string) => {
    const newLinks = [...footerLinks];
    newLinks[index] = { ...newLinks[index], [field]: val };
    setFooterLinks(newLinks);
  };

  const handleRemoveFooterLink = (index: number) => {
    const newLinks = [...footerLinks];
    newLinks[index] = { title: "", url: "" };
    setFooterLinks(newLinks);
  };

  return (
    <div className="animate-in fade-in duration-500 pt-6 pb-20 max-w-[900px]">
      <header className="mb-6 border-b border-gh-border pb-4">
        <h2 className="text-xl font-bold text-gh-text mb-1">General</h2>
        <p className="text-sm text-gh-text-secondary">
          Your enterprise URL is <a href={`https://github.com/enterprises/${org.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{`https://github.com/enterprises/${org.id}`}</a>
        </p>
      </header>

      {/* Enterprise Profile Section */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
          <div className="space-y-6">
            <div className="settings-form-group">
              <label className="settings-form-label">Enterprise display name <span className="required">*</span></label>
              <input 
                className="settings-form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                aria-label="Enterprise display name"
              />
              <p className="settings-form-hint">Required name used to refer to your enterprise around GitHub.</p>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">Description</label>
              <input 
                className="settings-form-input" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                aria-label="Enterprise description"
              />
              <p className="settings-form-hint">Optional description of your enterprise.</p>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">Website URL</label>
              <input 
                className="settings-form-input" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)} 
                placeholder="https://example.com"
              />
              <p className="settings-form-hint">Optional URL of your enterprise website.</p>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">Location</label>
              <input 
                className="settings-form-input" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                aria-label="Enterprise location"
              />
              <p className="settings-form-hint">Optional location of your enterprise.</p>
            </div>

            <div className="settings-form-group">
              <label className="settings-form-label">Security contact email</label>
              <input 
                className="settings-form-input" 
                value={securityEmail} 
                onChange={(e) => setSecurityEmail(e.target.value)} 
                aria-label="Security contact email"
              />
              <p className="settings-form-hint text-[11px]">Optional additional email address for security incident notifications. Notifications will also be sent to relevant technical stakeholders as determined by GitHub.</p>
            </div>

            <button className="px-3 py-1.5 bg-gh-bg-tertiary hover:bg-gh-bg-secondary text-gh-text border border-gh-border rounded-md text-[13px] font-semibold transition-all">
              Update enterprise profile
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="settings-form-label">Profile picture</label>
            <div className="size-44 bg-gh-bg-secondary border border-gh-border rounded-lg overflow-hidden flex items-center justify-center p-2">
              <img src={org.avatar} alt="Profile" className="size-full object-cover rounded" />
            </div>
            <button className="w-full px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-md text-[13px] font-semibold transition-all">
              Upload new picture
            </button>
          </div>
        </div>
      </section>

      {/* Member Appearance */}
      <section className="mb-10">
        <h3 className="text-base font-bold text-gh-text mb-4">Member appearance</h3>
        <div className="settings-card">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 max-w-[500px]">
              <span className="settings-card-title">Profile name visibility</span>
              <span className="settings-card-description">If enabled, members' profile names will be visible with their handles in places like repositories, issues, pull requests, and discussions. <a href="#" className="text-primary hover:underline">Learn more about showing member profile names.</a></span>
            </div>
            <select 
              className="settings-form-select w-auto min-w-[200px]" 
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              aria-label="Profile name visibility"
            >
              <option>Let organizations decide</option>
              <option>Always show full names</option>
              <option>Always show only handles</option>
            </select>
          </div>
        </div>
      </section>

      {/* Custom Footer */}
      <section className="mb-10">
        <h3 className="text-base font-bold text-gh-text mb-4">Custom footer</h3>
        <div className="footer-links-list">
          {footerLinks.map((link, i) => (
            <FooterLinkRow 
              key={i} 
              index={i} 
              title={link.title} 
              url={link.url} 
              onUpdate={handleFooterUpdate}
              onRemove={handleRemoveFooterLink}
            />
          ))}
        </div>
        <button className="px-3 py-1.5 bg-gh-bg-tertiary hover:bg-gh-bg-secondary text-gh-text border border-gh-border rounded-md text-[13px] font-semibold transition-all">
          Update footer
        </button>
      </section>

      {/* In-product messages */}
      <section className="mb-10">
        <h3 className="text-base font-bold text-gh-text mb-4">In-product messages</h3>
        <div className="settings-card space-y-6">
          <Switch 
            label="Promotions"
            description="Get solutions and exclusive offers from GitHub about products, services, and events we think you might find interesting."
            checked={promotions}
            onChange={setPromotions}
          />
          <div className="border-t border-gh-border pt-6">
            <Switch 
              label="Tips"
              description="Get tips for developers working in your repositories about products and features your enterprise has enabled."
              checked={tips}
              onChange={setTips}
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mb-10">
        <h3 className="text-base font-bold text-gh-text mb-4">Danger zone</h3>
        <div className="danger-zone">
          <div className="danger-zone-item">
            <div className="danger-item-content">
              <span className="danger-item-title">Change enterprise URL slug</span>
              <span className="danger-item-description">Changing the enterprise URL slug can have unintended side effects.</span>
            </div>
            <button className="btn-danger">Change enterprise URL slug</button>
          </div>
          <div className="danger-zone-item">
            <div className="danger-item-content">
              <span className="danger-item-title">Cancel trial</span>
              <span className="danger-item-description">Once you cancel this trial there is no going back. Please be certain.</span>
            </div>
            <button className="btn-danger">Cancel trial</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StrataGeneralSettings;
