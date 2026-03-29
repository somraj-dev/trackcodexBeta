import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/StrataHub.css";

const CreateStrata: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    enterpriseName: "",
    urlSlug: "",
    industry: "",
    employees: "",
    existingOrg: "",
    adminName: "",
    adminEmail: "",
    region: "",
    termsAccepted: false,
    agreementsAccepted: false,
    communicationPreferences: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to create enterprise would go here
    console.log("Creating enterprise:", formData);
    navigate("/strata/trackcodex");
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gh-bg">
      <div className="enterprise-form-container">
        <header className="mb-8">
          <button 
            onClick={() => navigate("/stratahub")}
            className="flex items-center gap-2 text-gh-text-secondary hover:text-gh-text text-sm mb-4 transition-colors"
          >
            <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
            Back to selection
          </button>
          <h1 className="text-2xl font-bold text-gh-text">Create your enterprise</h1>
          <p className="text-gh-text-secondary mt-1">
            Build and manage your organizations with enterprise-grade security and administration.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Basic Info */}
          <div className="enterprise-form-section">
            <div className="form-group">
              <label className="form-label">
                Enterprise name <span className="required">*</span>
              </label>
              <input 
                type="text" 
                name="enterpriseName"
                value={formData.enterpriseName}
                onChange={handleChange}
                placeholder="e.g. Acme, Inc."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Enterprise URL slug <span className="required">*</span>
              </label>
              <input 
                type="text" 
                name="urlSlug"
                value={formData.urlSlug}
                onChange={handleChange}
                placeholder="e.g. acme-inc"
                className="form-input"
                required
              />
              <p className="form-hint">This will be your enterprise profile URL.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Industry <span className="required">*</span>
                </label>
                <select 
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="form-select"
                  aria-label="Industry"
                  required
                >
                  <option value="">Select an option</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Number of employees <span className="required">*</span>
                </label>
                <select 
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  className="form-select"
                  aria-label="Number of employees"
                  required
                >
                  <option value="">Select an option</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organization</label>
              <select 
                name="existingOrg"
                value={formData.existingOrg}
                onChange={handleChange}
                className="form-select"
                aria-label="Select existing organization"
              >
                <option value="">Choose an existing organization to include in the new Enterprise account</option>
                <option value="org1">My First Org</option>
                <option value="org2">Dev Team</option>
              </select>
              <p className="form-hint">
                Note: Billing for any selected organization will be delegated to the enterprise account. 
                <a href="#" className="text-primary ml-1">Learn about changes to your billing during trial</a>.
              </p>
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="enterprise-form-section">
            <h2 className="enterprise-section-title">Contact information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Admin name <span className="required">*</span>
                </label>
                <input 
                  type="text" 
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="form-input"
                  required
                />
                <p className="form-hint">User responsible for configuring this enterprise.</p>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Admin work email <span className="required">*</span>
                </label>
                <input 
                  type="email" 
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="form-input"
                  required
                />
                <p className="form-hint">This email should send and receive emails.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Country/Region <span className="required">*</span>
              </label>
              <select 
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="form-select"
                aria-label="Country or Region"
                required
              >
                <option value="">Choose your country/region</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="IN">India</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>

          {/* Section 3: Terms */}
          <div className="enterprise-form-section">
            <h2 className="enterprise-section-title">Trial terms <span className="required text-sm">*</span></h2>
            <div className="form-checkbox-group">
              <div className="form-checkbox-item">
                <input 
                  type="checkbox" 
                  id="termsAccepted"
                  name="termsAccepted" 
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="termsAccepted" className="form-checkbox-label">
                  I understand that <a href="#">certain features</a> are unavailable during the trial experience.
                </label>
              </div>

              <div className="form-checkbox-item">
                <input 
                  type="checkbox" 
                  id="agreementsAccepted"
                  name="agreementsAccepted"
                  checked={formData.agreementsAccepted}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agreementsAccepted" className="form-checkbox-label">
                  If my organization does not already have a customer agreement for GitHub services, I hereby accept the <a href="#">GitHub Customer Agreement</a> and confirm that I have the authority to do so on behalf of my organization.
                </label>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gh-text text-sm mb-2">Communication preferences</h3>
              <div className="form-checkbox-item">
                <input 
                  type="checkbox" 
                  id="communicationPreferences"
                  name="communicationPreferences"
                  checked={formData.communicationPreferences}
                  onChange={handleChange}
                />
                <label htmlFor="communicationPreferences" className="form-checkbox-label">
                  Yes please, I'd like GitHub and affiliates to use my information for personalized communications, targeted advertising and campaign effectiveness. See the <a href="#">GitHub Privacy Statement</a> for more details.
                </label>
              </div>
              <p className="text-xs text-gh-text-secondary mt-2 ml-7">
                If you change your mind, you can <a href="#" className="text-primary">unsubscribe</a> at any time.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-create-enterprise"
              disabled={!formData.enterpriseName || !formData.urlSlug || !formData.termsAccepted || !formData.agreementsAccepted}
            >
              Create enterprise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStrata;
