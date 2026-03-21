import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/infra/api';
import { cacheService } from '../../services/infra/cacheService';

const ORG_LIST = [
  "Madhav Institute of Technology and Science (MITS), Gwalior",
  "Amrita Sai Institute of Science and Technology",
  "Anil Neerukonda Institute of Technology and Sciences",
  "Godavari Institute of Engineering and Technology, AP",
  "Hyderabad Institute of Technology and Management (HITM), Hyderabad",
  "Sreenidhi Institute of Science and Technology (SNIST)",
  "Acropolis Institute of Technology and Research, Indore",
  "Balaji Institute of Technology and Science, Warangal"
];

const DEFAULT_FESTIVAL_LIST = [
  "Unstop Awards 2024",
  "Flipkart GRiD 6.0",
  "Tata Imagination Challenge",
  "Google Solution Challenge",
  "Amazon ML Summer School"
];

const CreateMissionView = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<any>({
    title: '',
    genderFilter: 'Default : Everyone can apply',
    registrationPlatform: 'TrackCodex',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    type: 'General & Case Competitions',
    subType: 'General Competition',
    participationType: 'Individual',
    mode: 'Online',
    minTeamSize: '1',
    maxTeamSize: '2',
    allowedRegister: ['Everyone can apply'],
    allowedClasses: ['All'],
    educationalYears: ['Allow All'],
    educationalDegrees: [],
    passoutYears: ['Allow All'],
    experienceMode: 'Allow all',
    experienceYears: 0,
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

  const [activeStep, setActiveStep] = useState(1);
  const [step1Complete, setStep1Complete] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGenderConfig, setShowGenderConfig] = useState(false);
  const [showCollegeConfig, setShowCollegeConfig] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [activeFieldMenu, setActiveFieldMenu] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'startDate' | 'endDate' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [orgSuggestions, setOrgSuggestions] = useState<string[]>([]);
  const [showOrgSuggestions, setShowOrgSuggestions] = useState(false);
  const [festivalSuggestions, setFestivalSuggestions] = useState<string[]>([]);
  const [showFestivalSuggestions, setShowFestivalSuggestions] = useState(false);
  const [isPlatformExpanded, setIsPlatformExpanded] = useState(true);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  // Merge custom festivals from localStorage
  const [festivalList, setFestivalList] = useState<string[]>(DEFAULT_FESTIVAL_LIST);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('customFestivals');
      if (stored) {
        const custom: string[] = JSON.parse(stored);
        setFestivalList([...DEFAULT_FESTIVAL_LIST, ...custom.filter(f => !DEFAULT_FESTIVAL_LIST.includes(f))]);
      }
    } catch { /* ignore */ }
  }, []);

  // Re-check localStorage when window regains focus (user returns from CreateEventView)
  useEffect(() => {
    const handleFocus = () => {
      try {
        const stored = localStorage.getItem('customFestivals');
        if (stored) {
          const custom: string[] = JSON.parse(stored);
          setFestivalList([...DEFAULT_FESTIVAL_LIST, ...custom.filter(f => !DEFAULT_FESTIVAL_LIST.includes(f))]);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModeChange = (mode: string) => setFormData({ ...formData, mode });
  const handleParticipationChange = (type: string) => setFormData({ ...formData, participationType: type });
  
  const handleWhoCanRegister = (type: string) => {
    setFormData((prev: any) => {
      let current = prev.allowedRegister || ['Everyone can apply'];
      if (type === 'Everyone can apply') {
        current = ['Everyone can apply'];
      } else {
        current = current.filter((t: string) => t !== 'Everyone can apply');
        if (current.includes(type)) {
          current = current.filter((t: string) => t !== type);
          if (current.length === 0) current = ['Everyone can apply'];
        } else {
          current = [...current, type];
        }
      }
      return { ...prev, allowedRegister: current };
    });
  };

  const handleClassSelect = (cls: string) => {
    setFormData((prev: any) => {
      let current = prev.allowedClasses || ['All'];
      if (cls === 'All') {
        current = ['All'];
      } else {
        current = current.filter((c: string) => c !== 'All');
        if (current.includes(cls)) {
          current = current.filter((c: string) => c !== cls);
          if (current.length === 0) current = ['All'];
        } else {
          current = [...current, cls];
        }
      }
      return { ...prev, allowedClasses: current };
    });
  };

  const handleEduYearSelect = (year: string) => {
    setFormData((prev: any) => {
      let current = prev.educationalYears || ['Allow All'];
      if (year === 'Allow All') {
        current = ['Allow All'];
      } else {
        current = current.filter((y: string) => y !== 'Allow All');
        if (current.includes(year)) {
          current = current.filter((y: string) => y !== year);
          if (current.length === 0) current = ['Allow All'];
        } else {
          current = [...current, year];
        }
      }
      return { ...prev, educationalYears: current };
    });
  };

  const handleDegreeToggle = (degree: string) => {
    setFormData((prev: any) => {
      const current = prev.educationalDegrees || [];
      if (current.includes(degree)) {
        return { ...prev, educationalDegrees: current.filter((d: string) => d !== degree) };
      }
      return { ...prev, educationalDegrees: [...current, degree] };
    });
  };

  const handlePassoutYearSelect = (year: string) => {
    setFormData((prev: any) => {
      let current = prev.passoutYears || ['Allow All'];
      if (year === 'Allow All') {
        current = ['Allow All'];
      } else {
        current = current.filter((y: string) => y !== 'Allow All');
        if (current.includes(year)) {
          current = current.filter((y: string) => y !== year);
          if (current.length === 0) current = ['Allow All'];
        } else {
          current = [...current, year];
        }
      }
      return { ...prev, passoutYears: current };
    });
  };

  const handleFieldStatusUpdate = (fieldId: string, status: string) => {
    setFormData((prev: any) => ({
      ...prev,
      formFields: prev.formFields.map((f: any) => 
        f.id === fieldId ? { ...f, status, required: status === 'Required' } : f
      )
    }));
    setActiveFieldMenu(null);
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDateSave = (field: 'startDate' | 'endDate', date: Date) => {
    // Format to YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    setFormData({ ...formData, [field]: formatted });
    setShowDatePicker(null);
  };

  const handleOrgSearch = (val: string) => {
    setFormData({ ...formData, organization: val });
    if (val.trim().length > 0) {
      const matches = ORG_LIST.filter(org => org.toLowerCase().includes(val.toLowerCase()));
      setOrgSuggestions(matches);
      setShowOrgSuggestions(true);
    } else {
      setShowOrgSuggestions(false);
    }
  };

  const handleFestivalSearch = (val: string) => {
    setFormData({ ...formData, link: val });
    if (val.trim().length > 0) {
      const matches = festivalList.filter(fest => fest.toLowerCase().includes(val.toLowerCase()));
      setFestivalSuggestions(matches);
      setShowFestivalSuggestions(true);
    } else {
      setShowFestivalSuggestions(false);
    }
  };
  const handleGenderSelect = (gender: string) => {
    setFormData((prev: any) => {
      let newGenders = prev.allowedGenders || ['Allow All'];
      if (gender === 'Allow All') {
        newGenders = ['Allow All'];
      } else {
        newGenders = newGenders.filter((g: string) => g !== 'Allow All');
        if (newGenders.includes(gender)) {
          newGenders = newGenders.filter((g: string) => g !== gender);
          if (newGenders.length === 0) newGenders = ['Allow All'];
        } else {
          newGenders = [...newGenders, gender];
        }
      }
      return { ...prev, allowedGenders: newGenders };
    });
  };

  const handleCollegeSelect = (college: string) => {
    setFormData((prev: any) => {
      let newColleges = prev.eligibleColleges || ['Allow All'];
      if (college === 'Allow All') {
        newColleges = ['Allow All'];
      } else {
        newColleges = newColleges.filter((c: string) => c !== 'Allow All');
        if (newColleges.includes(college)) {
          newColleges = newColleges.filter((c: string) => c !== college);
          if (newColleges.length === 0) newColleges = ['Allow All'];
        } else {
          newColleges = [...newColleges, college];
        }
      }
      return { ...prev, eligibleColleges: newColleges };
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData({ ...formData, logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => fileInputRef.current?.click();

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
      // Validate Step 1
      const requiredFields = [
        { key: 'title', label: 'Opportunity Title' },
        { key: 'organization', label: 'Organisation Name' },
        { key: 'type', label: 'Opportunity Type' },
        { key: 'subType', label: 'Opportunity Sub-type' },
        { key: 'description', label: 'Opportunity Description' },
        { key: 'participationType', label: 'Participation Type' },
        { key: 'mode', label: 'Mode of Opportunity' }
      ];

      const missingFields = requiredFields.filter(f => !formData[f.key] || formData[f.key].trim() === '');
      const logoMissing = !logoPreview;
      const registerMissing = !formData.allowedRegister || formData.allowedRegister.length === 0;

      if (missingFields.length > 0 || logoMissing || registerMissing) {
        setShowValidationErrors(true);
        // Scroll to the first error or the top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setShowValidationErrors(false);
      setStep1Complete(true);
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
      cacheService.invalidate('missions_list');
      navigate('/marketplace/missions');
    } catch (error) {
      console.error('Failed to create mission:', error);
      alert('Failed to post the opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gh-bg font-sans pb-32 text-gh-text">
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <h1 className="text-xl font-bold text-gh-text">Post an Opportunity</h1>
          
          <div className="border border-gh-border rounded-2xl bg-gh-bg-secondary overflow-hidden shadow-sm">
            <button 
              onClick={() => setActiveStep(1)}
              className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${activeStep === 1 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step1Complete ? 'bg-emerald-500 text-white' : activeStep === 1 ? 'bg-blue-600 text-white' : 'bg-gh-bg-tertiary text-gh-text-secondary'}`}>
                {step1Complete ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
              </div>
              <div>
                <div className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-wider mb-0.5">Step 1</div>
                <div className={`text-sm font-semibold ${activeStep === 1 ? 'text-blue-500' : 'text-gh-text'}`}>Opportunity details</div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                if (!step1Complete) {
                  setShowValidationErrors(true);
                  return;
                }
                setActiveStep(2);
              }}
              className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${!step1Complete ? 'opacity-50 cursor-not-allowed' : activeStep === 2 ? 'bg-blue-500/10' : 'hover:bg-gh-bg-tertiary'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === 2 ? 'bg-blue-600 text-white' : 'bg-gh-bg-tertiary text-gh-text-secondary'}`}>2</div>
              <div>
                <div className="text-[10px] text-gh-text-secondary font-bold uppercase tracking-wider mb-0.5">Step 2</div>
                <div className={`text-sm font-semibold ${activeStep === 2 ? 'text-blue-500' : 'text-gh-text'}`}>Registration Form</div>
                {!step1Complete && <div className="text-[10px] text-amber-500 mt-0.5">Complete Step 1 first</div>}
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
              Reach us at <a href="mailto:support@trackcodex.com" className="text-blue-600 font-semibold">support@trackcodex.com</a>
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
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  title="Upload Logo"
                />
                <div 
                  onClick={triggerLogoUpload}
                  className={`flex items-start gap-6 border-2 border-dashed rounded-xl p-6 mb-8 cursor-pointer transition-all ${
                    !logoPreview && showValidationErrors 
                      ? 'border-red-500 bg-red-500/5' 
                      : logoPreview 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
                  }`}
                >
                  <div className={`w-16 h-16 bg-gh-bg border ${!logoPreview && showValidationErrors ? 'border-red-500' : 'border-gh-border'} rounded-xl flex flex-col items-center justify-center shadow-sm overflow-hidden text-blue-500`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                        <span className="text-[10px] font-bold mt-1">Add Logo</span>
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gh-text">Supported logo image: JPG, JPEG, or PNG. Max 1 MB.</h4>
                    {logoPreview ? (
                      <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span> Logo uploaded successfully
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 font-medium mt-1">Logo required</p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gh-text mb-2">
                      Opportunity Title <span className="text-red-500">*</span>
                    </label>
                     <input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter Opportunity Title."
                      className={`w-full bg-gh-bg-tertiary border-2 ${!formData.title?.trim() && showValidationErrors ? 'border-red-500' : 'border-gh-border'} focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm`}
                    />
                    <p className="text-xs text-gh-text-secondary mt-2">Max 100 characters</p>
                  </div>

                  <div className="relative">
                    <label htmlFor="organization" className="block text-sm font-semibold text-gh-text mb-2">
                      Organisation Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                       <input
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={(e) => handleOrgSearch(e.target.value)}
                        onFocus={() => formData.organization?.trim().length > 0 && setShowOrgSuggestions(true)}
                        placeholder="e.g. Madhav Institute of Technology and Science (MITS), Gwalior"
                        className={`w-full bg-gh-bg-tertiary border ${!formData.organization?.trim() && showValidationErrors ? 'border-red-500' : 'border-gh-border'} focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm`}
                      />
                      {formData.organization?.trim().length > 0 && orgSuggestions.length === 0 && (
                        <button 
                          onClick={() => setShowOrgSuggestions(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500/10 text-blue-500 text-[11px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all animate-in fade-in zoom-in-95 duration-200"
                        >
                          Create New
                        </button>
                      )}
                    </div>

                    {showOrgSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gh-bg border border-gh-border rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {orgSuggestions.length > 0 ? (
                          orgSuggestions.map((org) => (
                            <button
                              key={org}
                              onClick={() => {
                                setFormData({ ...formData, organization: org });
                                setShowOrgSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-[13px] border-b border-gh-border last:border-0 hover:bg-gh-bg-tertiary transition-colors text-gh-text font-medium"
                            >
                              {org}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-[13px] text-gh-text-secondary bg-gh-bg-secondary rounded-xl">
                            Cannot Find <span className="font-bold text-gh-text">{formData.organization}</span>, 
                            <button 
                              onClick={() => setShowOrgSuggestions(false)}
                              className="text-blue-500 font-bold ml-1 hover:underline text-[13px]"
                            >
                              Create New
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                        <option>Quizzes</option>
                        <option>Hackathons & Coding Challenges</option>
                        <option>Scholarships</option>
                        <option>Workshops & Webinar</option>
                        <option>Conferences</option>
                        <option>Creative & Cultural Events</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subType" className="block text-sm font-semibold text-gh-text mb-2">
                        Opportunity Sub-type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subType"
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

                  <div className="relative">
                    <label className="block text-sm font-semibold text-gh-text mb-2">
                      Link Festival/Campaign <span className="text-gh-text-secondary font-normal">(Optional)</span>
                    </label>
                    <input
                      name="link"
                      value={formData.link}
                      onChange={(e) => handleFestivalSearch(e.target.value)}
                      onFocus={() => formData.link?.trim().length > 0 && setShowFestivalSuggestions(true)}
                      placeholder="Enter Festival/Campaign name"
                      className="w-full bg-gh-bg-tertiary border border-gh-border focus:border-blue-500 focus:bg-gh-bg rounded-xl px-4 py-3 text-sm text-gh-text outline-none transition-colors shadow-sm"
                    />
                    
                    {showFestivalSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gh-bg border border-gh-border rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {festivalSuggestions.length > 0 ? (
                          festivalSuggestions.map((fest) => (
                            <button
                              key={fest}
                              onClick={() => {
                                setFormData({ ...formData, link: fest });
                                setShowFestivalSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 text-[13px] border-b border-gh-border last:border-0 hover:bg-gh-bg-tertiary transition-colors text-gh-text font-medium"
                            >
                              {fest}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-[13px] text-gh-text-secondary bg-gh-bg-secondary rounded-xl">
                            Cannot Find <span className="font-bold text-gh-text">{formData.link}</span>, 
                            <button 
                              onClick={() => navigate('/marketplace/missions/new/event')}
                              className="text-blue-500 font-bold ml-1 hover:underline text-[13px]"
                            >
                              Create One
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
                      className={`w-full p-4 h-64 text-sm text-gh-text bg-gh-bg outline-none resize-y border ${!formData.description?.trim() && showValidationErrors ? 'border-red-500 rounded-xl' : 'border-transparent'}`}
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
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gh-text">Who can register? <span className="text-red-500">*</span></h4>
                        <p className="text-[12px] text-gh-text-secondary mt-0.5">Select the candidate type(s) eligible to register</p>
                        {(!formData.allowedRegister || formData.allowedRegister.length === 0) && showValidationErrors && (
                          <p className="text-[11px] text-red-500 font-bold mt-1 animate-in fade-in slide-in-from-top-1">Please select at least one candidate type</p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleWhoCanRegister('Everyone can apply')}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gh-bg-tertiary hover:bg-gh-bg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {['Everyone can apply', 'College Students', 'Freshers', 'Professionals', 'School Students'].map((type) => (
                        <button
                          key={type}
                          onClick={() => handleWhoCanRegister(type)}
                          type="button"
                          className={`px-5 py-2.5 rounded-full border text-[13px] font-medium transition-all ${
                            (formData.allowedRegister || ['Everyone can apply']).includes(type) 
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm' 
                              : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Section: Class/Grade for School Students */}
                  {(formData.allowedRegister || []).includes('School Students') && (
                    <div className="border border-gh-border rounded-2xl p-6 bg-gh-bg/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-gh-text">Class/Grade</h4>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Restrict applicants based on class/grade.</p>
                        </div>
                        <button 
                          onClick={() => handleClassSelect('All')}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gh-bg-tertiary hover:bg-gh-bg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {['All', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => (
                          <button
                            key={cls}
                            onClick={() => handleClassSelect(cls)}
                            className={`px-4 py-2 rounded-full border text-[12px] font-medium transition-all ${
                              (formData.allowedClasses || ['All']).includes(cls)
                                ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                                : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Section: Experience for Professionals */}
                  {(formData.allowedRegister || []).includes('Professionals') && !(formData.allowedRegister || []).includes('School Students') && (
                    <div className="border border-gh-border rounded-2xl p-6 bg-gh-bg/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-gh-text">Experience Required</h4>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Set the required prior work experience (in years) for applicants.</p>
                        </div>
                        <button 
                          onClick={() => setFormData({ ...formData, experienceMode: 'Allow all', experienceYears: 0 })}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gh-bg-tertiary hover:bg-gh-bg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setFormData({ ...formData, experienceMode: 'Allow all' })}
                          className={`px-4 py-2 rounded-full border text-[12px] font-medium transition-all ${
                            formData.experienceMode === 'Allow all'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                              : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                          }`}
                        >
                          Allow all
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, experienceMode: 'Specify' })}
                          className={`px-4 py-2 rounded-full border text-[12px] font-medium transition-all ${
                            formData.experienceMode === 'Specify'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                              : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                          }`}
                        >
                          Specify working experience
                        </button>
                      </div>
                      
                      {formData.experienceMode === 'Specify' && (
                        <div className="mb-4 animate-in fade-in zoom-in-95 duration-200">
                          <input 
                            type="number"
                            value={formData.experienceYears}
                            onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                            placeholder="Enter years of experience..."
                            className="w-full bg-gh-bg-tertiary border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                        <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
                        <p className="text-[11px] text-gh-text-secondary leading-relaxed">
                          By default, candidates of all experience level can register. To include those with 0 years of experience, select 'Freshers' under 'Who can register'
                        </p>
                      </div>
                      <button className="mt-4 flex items-center gap-2 text-blue-500 text-[13px] font-bold hover:underline transition-all">
                        <span className="material-symbols-outlined text-[18px]">add</span> Add Educational Criteria for Professionals
                      </button>
                    </div>
                  )}

                  {/* Dynamic Section: Educational Background for College/Freshers/Professionals */}
                  {((formData.allowedRegister || []).some((t: string) => ['College Students', 'Freshers', 'Professionals'].includes(t))) && !(formData.allowedRegister || []).includes('School Students') && (
                    <div className="border border-gh-border rounded-2xl p-6 bg-gh-bg/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-gh-text">Educational Background</h4>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Specify the required academic background for this Opportunity.</p>
                        </div>
                        <button 
                          onClick={() => setFormData({ ...formData, educationalYears: ['Allow All'], educationalDegrees: [] })}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gh-bg-tertiary hover:bg-gh-bg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-[13px] font-bold text-gh-text mb-3">Specify passing/graduating year</h5>
                          <div className="flex flex-wrap items-center gap-2.5">
                            {['Allow All', '2026', '2027', '2028', '2029', '2030', '2031'].map((year) => (
                              <button
                                key={year}
                                onClick={() => handleEduYearSelect(year)}
                                className={`px-4 py-2 rounded-full border text-[12px] font-medium transition-all ${
                                  (formData.educationalYears || ['Allow All']).includes(year)
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                                    : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                                }`}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[13px] font-bold text-gh-text mb-3">Specify degree(s), course(s), or specialization if required</h5>
                          <div className="flex flex-wrap items-center gap-2.5">
                            {['Management', 'Engineering', 'Arts & Science', 'Medicine', 'Law'].map((degree) => (
                              <button
                                key={degree}
                                onClick={() => handleDegreeToggle(degree)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[13px] font-medium transition-all ${
                                  (formData.educationalDegrees || []).includes(degree)
                                    ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                                    : 'border-gh-border text-gh-text hover:border-gh-text-secondary'
                                }`}
                              >
                                {degree} <span className="material-symbols-outlined text-[16px]">{(formData.educationalDegrees || []).includes(degree) ? 'close' : 'add'}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Section: Passout Year for College/Freshers */}
                  {((formData.allowedRegister || []).some((t: string) => ['College Students', 'Freshers'].includes(t))) && !(formData.allowedRegister || []).includes('School Students') && (
                    <div className="border border-gh-border rounded-2xl p-6 bg-gh-bg/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-[15px] font-bold text-gh-text">Passout Year</h4>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Select the passout year range for candidates eligible to apply for this Opportunity.</p>
                        </div>
                        <button 
                          onClick={() => handlePassoutYearSelect('Allow All')}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gh-bg-tertiary hover:bg-gh-bg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {['Allow All', '2021', '2022', '2023', '2024', '2025'].map((year) => (
                          <button
                            key={year}
                            onClick={() => handlePassoutYearSelect(year)}
                            className={`px-4 py-2 rounded-full border text-[12px] font-medium transition-all ${
                              (formData.passoutYears || ['Allow All']).includes(year)
                                ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-sm'
                                : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* College/Organization Section */}
                  <div className={`border border-gh-border rounded-xl transition-all ${showCollegeConfig ? 'p-0 overflow-hidden' : 'p-4'}`}>
                    {!showCollegeConfig ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gh-text mb-1">College/Organization</h4>
                          <p className="text-xs text-gh-text-secondary">Default : {(formData.eligibleColleges || ['Allow All']).join(', ')}</p>
                          <p className="text-[11px] text-gh-text-secondary mt-0.5 opacity-70">Restrict applicants based on their College/Organization</p>
                        </div>
                        <button 
                          onClick={() => setShowCollegeConfig(true)}
                          className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold px-4 py-2 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span> Change
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gh-bg-secondary p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[16px] font-bold text-gh-text">College/Organization</h4>
                            <p className="text-[13px] text-gh-text-secondary">Restrict applicants by college/organization</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleCollegeSelect('Allow All')}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-gh-bg border border-gh-border hover:bg-gh-bg-tertiary transition-colors"
                              title="Reset"
                            >
                              <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                            <button 
                              onClick={() => setShowCollegeConfig(false)}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/5 text-red-500 border border-red-500/20 text-sm font-semibold hover:bg-red-500/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span> Cancel
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleCollegeSelect('Allow All')}
                            className={`px-5 py-2 rounded-full border text-[13px] font-medium transition-all ${
                              (formData.eligibleColleges || []).includes('Allow All')
                                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                            }`}
                          >
                            Allow All
                          </button>
                          <button
                            onClick={() => {
                              const current = formData.eligibleColleges || ['Allow All'];
                              if (current.includes('Allow All')) {
                                setFormData({ ...formData, eligibleColleges: [] });
                              }
                            }}
                            className={`px-5 py-2 rounded-full border border-dashed text-[13px] font-medium transition-all ${(formData.eligibleColleges || []).length > 0 && !formData.eligibleColleges.includes('Allow All') ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-gh-border text-gh-text-secondary hover:border-gh-text-secondary'}`}
                          >
                            Eligible College/Organization(s)
                          </button>
                        </div>

                        {(formData.eligibleColleges || []).length > 0 && !formData.eligibleColleges.includes('Allow All') && (
                          <div className="animate-in fade-in zoom-in-95 duration-200">
                            <input
                              type="text"
                              placeholder="Type college/organization name and press Enter..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val && !formData.eligibleColleges.includes(val)) {
                                    setFormData({ ...formData, eligibleColleges: [...formData.eligibleColleges, val] });
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                              className="w-full bg-gh-bg-tertiary border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text outline-none focus:border-blue-500"
                            />
                            <div className="flex flex-wrap gap-2 mt-3">
                              {formData.eligibleColleges.map((c: string) => (
                                <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-medium">
                                  {c}
                                  <button onClick={() => setFormData({ ...formData, eligibleColleges: formData.eligibleColleges.filter((item: string) => item !== c) })}>
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gh-border">
                          <h5 className="text-[14px] font-bold text-gh-text mb-3">Team composition by organization</h5>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={formData.teamSameOrg}
                              onChange={(e) => setFormData({ ...formData, teamSameOrg: e.target.checked })}
                              className="w-5 h-5 rounded border-gh-border bg-gh-bg-tertiary text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-[13px] text-gh-text group-hover:text-blue-500 transition-colors">Member of a team should be from same organizations.</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gender Section */}
                  <div className={`border border-gh-border rounded-xl transition-all ${showGenderConfig ? 'p-0 overflow-hidden' : 'p-4'}`}>
                    {!showGenderConfig ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gh-text mb-1">Gender</h4>
                          <p className="text-xs text-gh-text-secondary">Default : {(formData.allowedGenders || ['Allow All']).join(', ')}</p>
                          <p className="text-[11px] text-gh-text-secondary mt-0.5 opacity-70">Restrict applicants based on their Gender</p>
                        </div>
                        <button 
                          onClick={() => setShowGenderConfig(true)}
                          className="flex items-center gap-1.5 text-blue-500 text-sm font-semibold px-4 py-2 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span> Change
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gh-bg-secondary p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[16px] font-bold text-gh-text">Gender</h4>
                            <p className="text-[13px] text-gh-text-secondary">Restrict applicants based on their gender</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleGenderSelect('Allow All')}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-gh-bg border border-gh-border hover:bg-gh-bg-tertiary transition-colors"
                              title="Reset"
                            >
                              <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                            <button 
                              onClick={() => setShowGenderConfig(false)}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/5 text-red-500 border border-red-500/20 text-sm font-semibold hover:bg-red-500/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span> Cancel
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {['Allow All', 'Female', 'Male', 'Transgender', 'Intersex', 'Non-binary', 'Prefer not to say', 'Others'].map((gender) => (
                            <button
                              key={gender}
                              onClick={() => handleGenderSelect(gender)}
                              className={`px-5 py-2 rounded-full border text-[13px] font-medium transition-all ${
                                (formData.allowedGenders || ['Allow All']).includes(gender)
                                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                                  : 'border-gh-border border-dashed text-gh-text-secondary hover:border-gh-text-secondary'
                              }`}
                            >
                              {gender}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                      className="bg-gh-bg-secondary border border-gh-border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group relative"
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-gh-text-secondary text-[20px] group-hover:text-blue-500 transition-colors">{field.icon}</span>
                        <span className="text-[15px] font-semibold text-gh-text">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          {!field.locked ? (
                            <button
                              onClick={() => setActiveFieldMenu(activeFieldMenu === field.id ? null : field.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 transition-all text-[13px] font-bold ${
                                field.status === 'Required' 
                                  ? 'text-gh-text-secondary hover:text-gh-text' 
                                  : 'text-orange-500 hover:text-orange-600'
                              }`}
                            >
                              {field.status}
                              <span className={`material-symbols-outlined text-[18px] transition-transform ${activeFieldMenu === field.id ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>
                          ) : (
                            <span className="text-[13px] font-bold text-gh-text-secondary px-2 py-1">
                              {field.status}
                            </span>
                          )}

                          {activeFieldMenu === field.id && (
                            <div className="absolute right-0 top-full mt-2 w-32 bg-gh-bg border border-gh-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              {['Required', 'Off'].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleFieldStatusUpdate(field.id, s)}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gh-bg-tertiary transition-colors ${field.status === s ? 'text-blue-500' : 'text-gh-text-secondary'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {field.locked && (
                          <span className="material-symbols-outlined text-gh-text-secondary text-[18px] opacity-40">lock</span>
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
                  <button 
                    onClick={() => setShowAddQuestionModal(true)}
                    className="w-10 h-10 rounded-full border border-gh-border flex items-center justify-center hover:bg-gh-bg-tertiary transition-colors shadow-sm"
                  >
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
                      <input type="checkbox" className="sr-only peer" title="Eliminatory Questions" />
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
              <div className="space-y-6">
                {/* Platform Section */}
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                  <div 
                    onClick={() => setIsPlatformExpanded(!isPlatformExpanded)}
                    className="flex items-center justify-between mb-6 cursor-pointer group"
                  >
                    <h3 className="text-[15px] font-bold text-blue-500 flex items-center gap-2 group-hover:underline">
                      Platform <span className="material-symbols-outlined text-[18px] transition-transform duration-300" style={{ transform: isPlatformExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </h3>
                  </div>

                  {isPlatformExpanded && (
                    <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <button 
                        onClick={() => setFormData({ ...formData, registrationPlatform: 'TrackCodex' })}
                        className={`flex-1 flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${formData.registrationPlatform === 'TrackCodex' ? 'border-blue-500 bg-blue-500/5' : 'border-gh-border hover:border-gh-border-secondary'}`}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-semibold text-[12px]">TC</span>
                        </div>
                        <div>
                          <h4 className="text-[14px] font-bold text-gh-text">TrackCodex</h4>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Manage and receive applications on TrackCodex.</p>
                        </div>
                      </button>

                      <button 
                        className="flex-1 flex items-center gap-4 p-5 rounded-xl border-2 border-dashed border-gh-border transition-all text-left opacity-60 cursor-not-allowed group"
                      >
                        <div className="w-10 h-10 bg-gh-bg-tertiary rounded-full flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-gh-text-secondary text-[20px]">link</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[14px] font-bold text-gh-text">Other platform</h4>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
                              <span className="material-symbols-outlined text-[12px]">star</span> Contact Sales
                            </span>
                          </div>
                          <p className="text-[12px] text-gh-text-secondary mt-0.5">Redirect candidates to an external website.</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline Section */}
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 shadow-sm">
                  <div 
                    onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                    className="flex items-center justify-between mb-6 cursor-pointer group"
                  >
                    <h3 className="text-[15px] font-bold text-blue-500 flex items-center gap-2 group-hover:underline">
                      Registration Timeline <span className="material-symbols-outlined text-[18px] transition-transform duration-300" style={{ transform: isTimelineExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </h3>
                  </div>

                  {isTimelineExpanded && (
                    <div className="relative pl-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Vertical Line */}
                      <div className="absolute left-[7px] top-2 bottom-8 border-l-2 border-dashed border-blue-500/30"></div>
                      
                      {/* Live Section */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-2 w-4 h-4 rounded-full bg-blue-500 border-4 border-gh-bg-secondary z-10"></div>
                        <div className="flex items-center gap-4">
                          <span className="text-[14px] font-bold text-gh-text w-12 text-left">Live</span>
                          <div className="flex-1 relative">
                          <button 
                              onClick={() => {
                                const d = formData.startDate ? new Date(formData.startDate) : new Date();
                                setTempDate(isNaN(d.getTime()) ? new Date() : d);
                                setShowDatePicker('startDate');
                              }}
                              className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text text-left hover:border-blue-500 transition-all flex items-center justify-between"
                            >
                              {formData.startDate && !isNaN(new Date(formData.startDate).getTime())
                                ? new Date(formData.startDate).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                : 'Select start date'}
                              <span className="material-symbols-outlined text-gh-text-secondary">calendar_month</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Close Section */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-2 w-4 h-4 rounded-full border-2 border-blue-500 bg-gh-bg-secondary z-10"></div>
                        <div className="flex items-center gap-4">
                          <span className="text-[14px] font-bold text-gh-text w-12 text-left">Close</span>
                          <div className="flex-1 relative">
                          <button 
                              onClick={() => {
                                const d = formData.endDate ? new Date(formData.endDate) : new Date();
                                setTempDate(isNaN(d.getTime()) ? new Date() : d);
                                setShowDatePicker('endDate');
                              }}
                              className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm text-gh-text text-left hover:border-blue-500 transition-all flex items-center justify-between"
                            >
                              {formData.endDate && !isNaN(new Date(formData.endDate).getTime())
                                ? new Date(formData.endDate).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                : 'Select end date'}
                              <span className="material-symbols-outlined text-gh-text-secondary">calendar_month</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Summary Message */}
                      <div className="pt-6 border-t border-gh-border/50 flex items-start gap-3">
                        <span className="material-symbols-outlined text-gh-text-secondary text-[20px]">calendar_month</span>
                        <p className="text-[12px] text-gh-text-secondary leading-normal">
                          {(() => {
                            const start = new Date(formData.startDate);
                            const end = new Date(formData.endDate);
                            const validStart = !isNaN(start.getTime());
                            const validEnd = !isNaN(end.getTime());
                            if (!validStart || !validEnd) return 'Please select both Live and Close dates to see the registration window.';
                            const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                            return (
                              <>
                                Candidates will be able to apply for this Opportunity from{' '}
                                <span className="font-bold text-gh-text mx-1">
                                  {start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}, {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                to{' '}
                                <span className="font-bold text-gh-text mx-1">
                                  {end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}, {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>{' '}
                                for a period of <span className="font-bold text-gh-text">{days} Days</span>.
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gh-bg-secondary/95 backdrop-blur-md px-8 py-2 border-t border-gh-border flex items-center justify-between z-50 shadow-[0_-1px_15px_rgba(0,0,0,0.08)]">
        <button 
          onClick={() => activeStep > 1 && setActiveStep(1)}
          className="text-gh-text-secondary font-bold text-[13px] hover:text-gh-text transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </button>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className="px-6 py-2 rounded-lg border border-gh-border text-gh-text font-bold text-[13px] hover:bg-gh-bg-tertiary transition-all"
          >
            Save as Draft
          </button>
          <button 
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : (activeStep === 1 ? 'Save and next' : 'Publish')}
            {!isSubmitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </div>
      </div>
      {/* Add Questions Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gh-bg border border-gh-border w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gh-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gh-text">Add Questions</h2>
                <p className="text-[13px] text-gh-text-secondary mt-1">Ask candidates custom questions when they register.</p>
              </div>
              <button 
                onClick={() => setShowAddQuestionModal(false)}
                className="text-gh-text-secondary hover:text-gh-text transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8">
              <h3 className="text-[15px] font-bold text-gh-text mb-6">Custom</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Few Words (Text Box)', icon: 'short_text' },
                  { label: 'Paragraph (Text Area)', icon: 'subject' },
                  { label: 'Radio Button', icon: 'radio_button_checked' },
                  { label: 'Check Box', icon: 'check_box' },
                  { label: 'Dropdown', icon: 'arrow_drop_down_circle' },
                  { label: 'File', icon: 'upload_file' },
                  { label: 'Accept Box (E.g. Accept Te...', icon: 'task_alt' }
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-4 p-4 bg-gh-bg-secondary border border-gh-border rounded-xl hover:bg-gh-bg-tertiary hover:border-blue-500/50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                    </div>
                    <span className="text-[13px] font-bold text-gh-text group-hover:text-blue-500 transition-colors">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Premium Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gh-bg border border-gh-border w-full max-w-[320px] rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Calendar Header */}
            <div className="px-4 py-3 border-b border-gh-border flex items-center justify-between">
              <button 
                onClick={() => setTempDate(new Date(tempDate.setMonth(tempDate.getMonth() - 1)))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gh-bg-tertiary transition-colors"
                title="Prev Month"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_left</span>
              </button>
              <h3 className="text-sm font-bold text-gh-text">
                {tempDate.toLocaleString('default', { month: 'short' })} {tempDate.getFullYear()}
              </h3>
              <button 
                onClick={() => setTempDate(new Date(tempDate.setMonth(tempDate.getMonth() + 1)))}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gh-bg-tertiary transition-colors"
                title="Next Month"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_right</span>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-[11px] font-bold text-gh-text-secondary text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  const firstDay = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1).getDay();
                  const date = new Date(tempDate.getFullYear(), tempDate.getMonth(), i - firstDay + 1);
                  const isCurrentMonth = date.getMonth() === tempDate.getMonth();
                  const isSelected = date.toDateString() === tempDate.toDateString();

                  return (
                    <button
                      key={i}
                      onClick={() => setTempDate(new Date(tempDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())))}
                      className={`h-9 w-9 flex items-center justify-center rounded-full text-[12px] transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-bold' 
                          : isCurrentMonth 
                            ? 'text-gh-text hover:bg-gh-bg-tertiary' 
                            : 'text-gh-text-secondary/30'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Picker Section */}
            <div className="px-4 py-6 bg-gh-bg-secondary border-t border-gh-border flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => setTempDate(new Date(tempDate.setHours(tempDate.getHours() + 1)))}
                    className="material-symbols-outlined text-gh-text-secondary hover:text-gh-text"
                    title="Inc Hour"
                  >
                    keyboard_arrow_up
                  </button>
                  <span className="text-xl font-bold text-gh-text">{tempDate.getHours().toString().padStart(2, '0')}</span>
                  <button 
                    onClick={() => setTempDate(new Date(tempDate.setHours(tempDate.getHours() - 1)))}
                    className="material-symbols-outlined text-gh-text-secondary hover:text-gh-text"
                    title="Dec Hour"
                  >
                    keyboard_arrow_down
                  </button>
                </div>
                <span className="text-xl font-bold text-gh-text mb-4">:</span>
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => setTempDate(new Date(tempDate.setMinutes(tempDate.getMinutes() + 1)))}
                    className="material-symbols-outlined text-gh-text-secondary hover:text-gh-text"
                    title="Inc Min"
                  >
                    keyboard_arrow_up
                  </button>
                  <span className="text-xl font-bold text-gh-text">{tempDate.getMinutes().toString().padStart(2, '0')}</span>
                  <button 
                    onClick={() => setTempDate(new Date(tempDate.setMinutes(tempDate.getMinutes() - 1)))}
                    className="material-symbols-outlined text-gh-text-secondary hover:text-gh-text"
                    title="Dec Min"
                  >
                    keyboard_arrow_down
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 divide-x divide-gh-border border-t border-gh-border bg-gh-bg-secondary">
              <button 
                onClick={() => setShowDatePicker(null)}
                className="py-3 text-[13px] font-bold text-gh-text-secondary hover:bg-gh-bg-tertiary transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handleDateSave(showDatePicker, tempDate)}
                className="py-3 text-[13px] font-bold text-blue-500 hover:bg-gh-bg-tertiary transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMissionView;
