import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/infra/api';

const CreateMissionView = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    genderFilter: 'Default : Everyone can apply',
    startDate: '2026-03-18T00:00',
    endDate: '2026-04-01T00:00',
    registrationLimit: '',
    formFields: [
      { label: 'Name', required: true, id: 'name', status: 'Required', locked: true, icon: 'person' },
      { label: 'Email', required: true, id: 'email', status: 'Required', locked: true, icon: 'mail' },
      { label: 'Mobile number', required: true, id: 'phone', status: 'Required', icon: 'call' },
      { label: 'CV/Resume', required: false, id: 'cv', status: 'Off', icon: 'description' },
      { label: 'Gender', required: true, id: 'gender', status: 'Required', icon: 'group' },
      { label: 'Current College/Organization', required: true, id: 'college', status: 'Required', icon: 'corporate_fare' },
      { label: 'User Type', required: true, id: 'userType', status: 'Required', icon: 'person_search' },
      { label: 'Applicant\'s location', required: true, id: 'location', status: 'Required', icon: 'location_on' },
      { label: 'Differently abled', required: true, id: 'differentlyAbled', status: 'Required', icon: 'accessibility' },
    ],
  });

  const [activeStep, setActiveStep] = useState(2);
  const [showAllFields, setShowAllFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModeChange = (mode: string) => setFormData({ ...formData, mode });
  const handleParticipationChange = (type: string) => setFormData({ ...formData, participationType: type });
  const handleWhoCanRegister = (type: string) => setFormData({ ...formData, allowedRegister: type });
  
  const toggleFormField = (id: string) => {
    setFormData((prev: any) => ({
      ...prev,
      formFields: prev.formFields.map((f: any) => 
        f.id === id ? { ...f, required: !f.required } : f
      )
    }));
  };

  const handleSaveAndNext = async () => {
    if (activeStep === 1) {
      setActiveStep(2);
      return;
    }

    // Submit the form
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: 'Gig',
        techStack: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
        budget: '$0',
        repoId: '',
        status: 'Open',
        metadata: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationLimit: formData.registrationLimit,
          participationType: formData.participationType,
          organization: formData.organization,
          website: formData.website,
          allowedRegister: formData.allowedRegister,
          formFields: formData.formFields.filter((f: any) => f.required),
        }
      };

      await api.post('/jobs', payload);
      navigate('/marketplace/missions');
    } catch (error) {
      console.error('Failed to create mission:', error);
      alert('Failed to post the opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gh-bg font-sans pb-24 text-gh-text">
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <h1 className="text-xl font-bold text-gh-text">Post an Opportunity</h1>
          
          <div className="border border-gh-border rounded-2xl bg-gh-bg-secondary overflow-hidden shadow-sm">
            <button 
              onClick={() => setActiveStep(1)}
              className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${activeStep === 1 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                {activeStep > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
              </div>
              <div>
                <div className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-wider mb-0.5">Step 1</div>
                <div className={`text-sm font-semibold ${activeStep === 1 ? 'text-blue-500' : 'text-gh-text'}`}>Opportunity details</div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveStep(2)}
              className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${activeStep === 2 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === 2 ? 'bg-blue-600 text-white' : 'bg-gh-bg-tertiary text-gh-text-secondary'}`}>2</div>
              <div>
                <div className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-wider mb-0.5">Step 2</div>
                <div className={`text-sm font-semibold ${activeStep === 2 ? 'text-blue-500' : 'text-gh-text'}`}>Registration Form</div>
              </div>
            </button>
          </div>

          <div className="border border-gh-border rounded-2xl bg-gh-bg-secondary p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gh-bg-tertiary flex items-center justify-center">
                <img src="https://unstop.com/assets/images/support-icon.png" alt="Support" className="w-4 h-4 opacity-50 contrast-0" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Support</span>
            </div>
            <p className="text-[11px] text-gh-text-secondary leading-relaxed">
              Facing any issues or need any help? <br/>
              Reach us at <a href="mailto:support@unstop.com" className="text-blue-600 font-semibold">support@unstop.com</a>
            </p>
            <button className="text-[11px] text-blue-600 font-bold underline mt-2 block">Get in touch with us here</button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 max-w-3xl">
          {activeStep === 1 ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Opportunity Details Block */}
              <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8">
                <div className="flex items-start gap-6 border border-dashed border-blue-500/30 bg-blue-500/5 rounded-xl p-6 mb-8 cursor-pointer hover:bg-blue-500/10 transition-colors">
                  <div className="w-16 h-16 bg-gh-bg border border-gh-border rounded-xl flex flex-col items-center justify-center shadow-sm text-blue-500">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                    <span className="text-[10px] font-bold mt-1">Add Logo</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gh-text">Supported logo image: JPG, JPEG, or PNG. Max 1 MB.</h4>
                    <p className="text-xs text-red-500 font-medium mt-1">Logo required</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Opportunity Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter Opportunity Title."
                      className="w-full bg-gh-bg-tertiary border-2 border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                    <p className="text-xs text-gh-text-secondary mt-2">Max 100 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="e.g. Madhav Institute of Technology and Science (MITS), Gwalior"
                      className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gh-text mb-2">
                        Opportunity Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        title="Opportunity Type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none appearance-none shadow-sm"
                      >
                        <option>General & Case Competitions</option>
                        <option>Hackathons</option>
                        <option>Hiring Challenges</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gh-text mb-2">
                        Opportunity Sub-type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="subType"
                        title="Opportunity Sub-type"
                        value={formData.subType}
                        onChange={handleChange}
                        className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none appearance-none shadow-sm"
                      >
                        <option>General Competition</option>
                        <option>Coding Challenge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Link Festival/Campaign <span className="text-gh-text-secondary font-normal">(Optional)</span>
                    </label>
                    <input
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="Enter Festival/Campaign name"
                      className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Company Website URL <span className="text-gh-text-secondary font-normal">(Optional)</span>
                    </label>
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://trackcodex.com"
                      className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* About the Opportunity */}
              <div>
                <h3 className="text-lg font-bold text-gh-text mb-4 px-1">About the Opportunity</h3>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gh-text">
                      Opportunity Description <span className="text-red-500">*</span>
                      <p className="text-xs text-gh-text-secondary font-normal mt-0.5">Include Rules, Eligibility, Process, Format, etc.</p>
                    </label>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Generate with AI
                    </button>
                  </div>
                  
                  {/* Fake Editor Toolbar */}
                  <div className="border border-gh-border rounded-xl overflow-hidden mt-4">
                    <div className="bg-gh-bg-tertiary border-b border-gh-border px-3 py-2 flex items-center gap-1 overflow-x-auto">
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_underlined</span></button>
                      <div className="w-px h-4 bg-gh-border mx-1" />
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_align_left</span></button>
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_align_center</span></button>
                      <div className="w-px h-4 bg-gh-border mx-1" />
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                      <div className="w-px h-4 bg-gh-border mx-1" />
                      <button className="p-1.5 hover:bg-gh-bg-secondary rounded text-gh-text-secondary"><span className="material-symbols-outlined text-[18px]">link</span></button>
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Write your description here..."
                      className="w-full p-4 h-64 text-sm text-gh-text bg-gh-bg outline-none resize-y"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Skills to be assessed <span className="text-gh-text-secondary font-normal">(Optional)</span>
                      <p className="text-xs text-gh-text-secondary font-normal mt-0.5">List required skills to attract participants with matching abilities.</p>
                    </label>
                    <input
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Example: Photoshop, MS Office, etc..."
                      className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mode & Participation */}
              <div>
                <h3 className="text-lg font-bold text-gh-text mb-4 px-1">Opportunity Mode & Participation Type</h3>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8 space-y-6">
                  
                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-3">Participation Type <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleParticipationChange('Individual')}
                        type="button"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.participationType === 'Individual' 
                            ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                            : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        Individual
                      </button>
                      <button
                        onClick={() => handleParticipationChange('Team Participation')}
                        type="button"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.participationType === 'Team Participation' 
                            ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                            : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        Team Participation
                      </button>
                    </div>
                  </div>

                  {formData.participationType === 'Team Participation' && (
                    <div>
                      <label className="block text-sm font-semibold text-gh-text mb-3">Set team size <span className="text-red-500">*</span></label>
                      <div className="flex items-center gap-4 max-w-sm">
                        <select
                          name="minTeamSize"
                          title="Minimum Team Size"
                          value={formData.minTeamSize}
                          onChange={handleChange}
                          className="w-full bg-gh-bg-tertiary border border-gh-border rounded-xl px-4 py-2 text-sm text-gh-text outline-none"
                        >
                          <option value="1">Min: 1</option>
                          <option value="2">Min: 2</option>
                          <option value="3">Min: 3</option>
                        </select>
                        <select
                          name="maxTeamSize"
                          title="Maximum Team Size"
                          value={formData.maxTeamSize}
                          onChange={handleChange}
                          className="w-full bg-gh-bg-tertiary border border-gh-border rounded-xl px-4 py-2 text-sm text-gh-text outline-none"
                        >
                          <option value="2">Max: 2</option>
                          <option value="3">Max: 3</option>
                          <option value="4">Max: 4</option>
                          <option value="5">Max: 5</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gh-text mb-3">Mode of Opportunity <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleModeChange('Online')}
                        type="button"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.mode === 'Online' 
                            ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                            : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">public</span>
                        Online
                      </button>
                      <button
                        onClick={() => handleModeChange('Offline')}
                        type="button"
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.mode === 'Offline' 
                            ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                            : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">apartment</span>
                        Offline
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Registration Criteria */}
              <div>
                <h3 className="text-lg font-bold text-gh-text mb-4 px-1">Registration Criteria</h3>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8 space-y-6">
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gh-text">
                        Who can register? <span className="text-red-500">*</span>
                        <p className="text-xs text-gh-text-secondary font-normal mt-0.5">Select the candidate type(s) eligible to register.</p>
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {['Everyone can apply', 'College Students', 'Freshers', 'Professionals', 'School Students'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleWhoCanRegister(type)}
                          type="button"
                          className={`px-5 py-2.5 rounded-full border border-dashed transition-all text-sm font-medium ${
                            formData.allowedRegister === type 
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm' 
                              : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gh-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gh-text mb-1">College/Organization</h4>
                      <p className="text-xs text-gh-text-secondary">Default : Everyone can apply</p>
                      <p className="text-[11px] text-gh-text-secondary mt-0.5 opacity-70">Restrict applicants based on their College/Organization</p>
                    </div>
                    <button className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold px-4 py-2 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Change
                    </button>
                  </div>

                  <div className="border border-gh-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gh-text mb-1">Gender</h4>
                      <p className="text-xs text-gh-text-secondary">Default : Everyone can apply</p>
                      <p className="text-[11px] text-gh-text-secondary mt-0.5 opacity-70">Restrict applicants based on their Gender</p>
                    </div>
                    <button className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold px-4 py-2 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Change
                    </button>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              <div className="px-1">
                <h2 className="text-2xl font-bold text-gh-text">Registration Form</h2>
                <p className="text-[13px] text-gh-text-secondary mt-1">Customize the form candidates fill out when applying for this role.</p>
              </div>

              {/* Basic Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gh-text px-1">Basic Details (Filled by all team members)</h3>
                <div className="space-y-3">
                  {formData.formFields.slice(0, showAllFields ? formData.formFields.length : 3).map((field: any) => (
                    <div 
                      key={field.id}
                      className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-gh-text-secondary text-[20px] group-hover:text-blue-500 transition-colors">{field.icon}</span>
                        <span className="text-[15px] font-semibold text-gh-text">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${field.status === 'Required' ? 'text-gh-text-secondary' : 'text-orange-500 bg-orange-500/5'}`}>
                          {field.status}
                        </span>
                        {field.locked ? (
                          <span className="material-symbols-outlined text-gh-text-secondary text-[18px] opacity-40">lock</span>
                        ) : (
                          <span className="material-symbols-outlined text-gh-text-secondary text-[20px] cursor-pointer hover:text-gh-text">unfold_more</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="w-full py-4 text-sm font-bold text-gh-text-secondary hover:text-gh-text transition-colors flex items-center justify-center gap-2"
                  >
                    {showAllFields ? 'Show less' : 'Show more'} 
                    <span className={`material-symbols-outlined transition-transform duration-300 ${showAllFields ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>
              </div>

              {/* Screening Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gh-text">Screening Questions/Additional Info (Filled by team leader only)</h3>
                    <p className="text-[12px] text-gh-text-secondary mt-1">Add custom questions in registration form and use responses to shortlist candidates</p>
                  </div>
                  <button className="w-10 h-10 rounded-full border border-gh-border flex items-center justify-center hover:bg-gh-bg-tertiary transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-gh-text-secondary">add</span>
                  </button>
                </div>

                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 cursor-pointer text-gh-text hover:text-blue-500 transition-colors">
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                    <span className="text-[13px] font-bold">Suggested screening question(s)</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {['+ Cover Letter', '+ Highest Qualification', '+ Portfolio/Work Samples'].map(p => (
                      <button key={p} className="px-4 py-2 border border-gh-border rounded-full text-[13px] font-semibold text-gh-text hover:border-blue-500 hover:text-blue-500 transition-all">
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gh-border flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-gh-text-secondary mt-1">filter_alt</span>
                      <div>
                        <h4 className="text-[14px] font-bold text-gh-text leading-tight">Make additional questions eliminatory</h4>
                        <p className="text-[12px] text-gh-text-secondary mt-1 max-w-sm font-medium">These "Additional Questions" will determine whether candidate(s) move forward in the opportunity.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gh-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="mt-6 bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]">info</span>
                    <p className="text-[12px] text-gh-text-secondary font-medium leading-relaxed">
                      When eliminatory screening is enabled, you can mark additional questions as mandatory and set auto-shortlisting criteria. Candidate(s) who meet the criteria(s) will be automatically shortlisted
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Platform & Timeline Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gh-text leading-tight">Registration Platform & Timeline</h3>
                  <p className="text-[12px] text-gh-text-secondary mt-1">Specify the registration platform and registration window for this Opportunity</p>
                </div>

                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm space-y-8">
                  <div className="space-y-2">
                    <h4 className="text-[14px] font-bold text-gh-text">Registration Timeline</h4>
                    <p className="text-[13px] text-gh-text-secondary font-medium">
                      Registrations will be open from <span className="text-gh-text font-bold">18 Mar 26, 12:00 AM</span> to <span className="text-gh-text font-bold">01 Apr 26, 12:00 AM</span>
                      <button className="text-blue-500 font-bold ml-2 inline-flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-[14px]">edit</span> Change
                      </button>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[14px] font-bold text-gh-text tracking-wide">Platform</h4>
                    <p className="text-[13px] text-gh-text-secondary font-medium flex items-center gap-2">
                      This Opportunity is set to receive applications on 
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">verified</span> TrackCodex
                      </span>
                      <button className="text-blue-500 font-bold ml-1 inline-flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-[14px]">edit</span> Change
                      </button>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gh-bg px-12 py-4 border-t border-gh-border flex items-center justify-between z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => activeStep > 1 && setActiveStep(1)}
          className="text-gh-text-secondary font-bold text-[14px] hover:text-gh-text transition-colors"
        >
          Back
        </button>
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            className="px-8 py-2.5 rounded-full border border-gh-border text-gh-text font-bold text-[14px] hover:bg-gh-bg-secondary transition-all"
          >
            Save as Draft
          </button>
          <button 
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="px-10 py-2.5 bg-blue-600 text-white rounded-full font-bold text-[14px] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (activeStep === 1 ? 'Save and next' : 'Publish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMissionView;
