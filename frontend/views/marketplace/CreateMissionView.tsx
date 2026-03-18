import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/infra/api';

const CreateMissionView = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    organization: '',
    type: 'General & Case Competitions',
    subType: 'General Competition',
    link: '',
    website: '',
    description: '',
    skills: '',
    participationType: 'Team Participation',
    minTeamSize: '1',
    maxTeamSize: '2',
    mode: 'Online',
    allowedRegister: 'Everyone can apply',
    collegeFilter: 'Default : Everyone can apply',
    genderFilter: 'Default : Everyone can apply',
    startDate: '',
    endDate: '',
    registrationLimit: '',
    formFields: [
      { label: 'Full Name', required: true, id: 'name' },
      { label: 'Email Address', required: true, id: 'email' },
      { label: 'Mobile Number', required: true, id: 'phone' },
      { label: 'College/Organization', required: false, id: 'college' },
      { label: 'Year of Graduation', required: false, id: 'gradYear' },
      { label: 'City', required: false, id: 'city' },
    ],
  });

  const [activeStep, setActiveStep] = useState(1);
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
              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${activeStep === 1 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === 1 ? 'bg-blue-600 text-white' : 'bg-gh-bg-tertiary text-gh-text-secondary'}`}>1</div>
              <div>
                <div className="text-xs text-gh-text-secondary font-medium">Step 1</div>
                <div className={`font-semibold ${activeStep === 1 ? 'text-blue-500' : 'text-gh-text-secondary'}`}>Opportunity details</div>
              </div>
            </button>
            
            <div className="h-px bg-gh-border mx-4" />
            
            <button 
              onClick={() => setActiveStep(2)}
              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${activeStep === 2 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === 2 ? 'bg-blue-600 text-white' : 'bg-gh-bg-tertiary text-gh-text-secondary'}`}>2</div>
              <div>
                <div className="text-xs text-gh-text-secondary font-medium">Step 2</div>
                <div className={`font-semibold ${activeStep === 2 ? 'text-blue-500' : 'text-gh-text-secondary'}`}>Registration Form</div>
              </div>
            </button>
          </div>

          <div className="border border-gh-border rounded-2xl bg-gh-bg-secondary p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gh-bg-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-gh-text-secondary text-sm">support_agent</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Support</span>
            </div>
            <p className="text-xs text-gh-text-secondary leading-relaxed">
              Facing any issues or need any help? <br/>
              Reach us at <a href="mailto:support@trackcodex.com" className="text-blue-600 font-semibold">support@trackcodex.com</a>
            </p>
            <button className="text-xs text-blue-600 font-semibold underline mt-2">Get in touch with us here</button>
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
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Registration Schedule */}
              <div>
                <h3 className="text-lg font-bold text-gh-text mb-4 px-1">Registration Schedule</h3>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-gh-text mb-2">
                        Registration Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gh-text mb-2">
                        Registration End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-8">
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Max No. of Registrations <span className="text-gh-text-secondary font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="registrationLimit"
                      value={formData.registrationLimit}
                      onChange={handleChange}
                      placeholder="e.g. 500"
                      className="w-full max-w-xs bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                    <p className="text-xs text-gh-text-secondary mt-2">Leave blank for unlimited registrations.</p>
                  </div>
                </div>
              </div>

              {/* Registration Form Builder */}
              <div>
                <h3 className="text-lg font-bold text-gh-text mb-4 px-1">Registration Form Fields</h3>
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl shadow-sm p-8">
                  <p className="text-sm text-gh-text-secondary mb-6 leading-relaxed">
                    Select the information you want to collect from participants. Required fields are pre-filled based on TrackCodex core requirements.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.formFields.map((field) => (
                      <div 
                        key={field.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          field.required ? 'border-blue-500/50 bg-blue-500/5' : 'border-gh-border hover:border-gh-text-secondary'
                        }`}
                        onClick={() => !['name', 'email', 'phone'].includes(field.id) && toggleFormField(field.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-[20px] ${field.required ? 'text-blue-500' : 'text-gh-text-secondary opacity-50'}`}>
                            {field.required ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span className={`text-sm font-semibold ${field.required ? 'text-gh-text' : 'text-gh-text-secondary'}`}>
                            {field.label}
                          </span>
                        </div>
                        {['name', 'email', 'phone'].includes(field.id) && (
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">Mandatory</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gh-border">
                    <button className="flex items-center gap-2 text-blue-500 font-bold text-sm hover:underline">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Custom Question
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setActiveStep(1)}
                  className="flex items-center gap-2 text-gh-text-secondary text-sm font-semibold hover:text-gh-text transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Go back to edit Opportunity Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gh-bg-secondary border-t border-gh-border shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-50">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-end gap-4">
          <button 
            type="button" 
            className="px-6 py-2.5 rounded-xl border border-gh-border text-gh-text font-semibold text-sm hover:bg-gh-bg-tertiary transition-colors"
          >
            Save as Draft
          </button>
          <button 
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (activeStep === 1 ? 'Save and next' : 'Publish Opportunity')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMissionView;
