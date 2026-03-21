import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/infra/api";
import { MOCK_JOBS } from "../../constants";
import { Job } from "../../types";

/* ── Shared Components (Outside Main View to Prevent Focus Loss) ── */
const PillGroup = ({ 
  label, 
  options, 
  value, 
  onChange, 
  required = false 
}: { 
  label: string, 
  options: string[], 
  value: string, 
  onChange: (val: string) => void,
  required?: boolean
}) => (
  <div className="mb-6">
    <label className="block text-[13px] font-bold text-slate-500 mb-3">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-5 py-2.5 rounded-full text-[13px] font-medium transition-all border ${
            value === opt 
              ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" 
              : "border-slate-200 border-dashed text-slate-500 hover:border-slate-300 bg-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const InputField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder = "", 
  required = false, 
  type = "text",
  icon = null,
  onIconClick = null,
  badge = null
}: { 
  label: string, 
  name: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  required?: boolean,
  type?: string,
  icon?: React.ReactNode,
  onIconClick?: (() => void) | null,
  badge?: React.ReactNode
}) => (
  <div className="flex-1 min-w-[300px]">
    <label className="block text-[13px] font-bold text-slate-500 mb-2">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {icon && (
        <div 
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${onIconClick ? 'cursor-pointer hover:text-blue-500 transition-colors' : ''}`}
          onClick={() => onIconClick?.()}
        >
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-[14px] text-slate-700 bg-white placeholder-slate-300 ${icon ? 'pl-10' : ''} ${badge ? 'pr-12' : ''}`}
      />
      {badge && <div className="absolute right-3 top-1/2 -translate-y-1/2">{badge}</div>}
    </div>
  </div>
);

const SelectField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options, 
  required = false 
}: { 
  label: string, 
  name: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
  options: string[],
  required?: boolean 
}) => (
  <div className="flex-1 min-w-[300px]">
    <label className="block text-[13px] font-bold text-slate-500 mb-2">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-[14px] text-slate-700 bg-white appearance-none cursor-pointer pr-10"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
         <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </div>
    </div>
  </div>
);

const MissionRegistrationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [mission, setMission] = useState<Job | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "Quantaforge",
    lastName: "",
    email: "quantaforge25@gmail.com",
    mobile: "9111847138",
    gender: "Male",
    location: "",
    institute: "Madhav Institute of Technology and Science (MITS), Gwalior",
    differentlyAbled: "No",
    userType: "College Students",
    domain: "Engineering",
    course: "B.Tech/BE (Bachelor of Technology / Bachelor of Engineering)",
    specialization: "Others",
    specializationOther: "",
    graduatingYear: "2029",
    courseDuration: "4 Years",
    agreeToShare: false,
    stayInLoop: true,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamAction, setTeamAction] = useState<"create" | "join" | null>(null);
  const [registrationStep, setRegistrationStep] = useState<"form" | "team-management">("form");
  const [isNextOpen, setIsNextOpen] = useState(true);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [teamName, setTeamName] = useState("");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      addNotification({
        type: "error",
        title: "Geolocation Not Supported",
        message: "Your browser does not support location services.",
      } as any);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use Nominatim (OpenStreetMap) for free reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown City";
          const state = data.address.state || "";
          const country = data.address.country || "";
          
          const fullAddress = [city, state, country].filter(Boolean).join(", ");
          setFormData(prev => ({ ...prev, location: fullAddress }));
          
          addNotification({
            type: "success",
            title: "Location Updated",
            message: `Found: ${fullAddress}`,
          } as any);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error("Geolocation error:", error);
        addNotification({
          type: "error",
          title: "Location Access Denied",
          message: "Please enable location permissions in your browser.",
        } as any);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    const localMock = MOCK_JOBS.find((j) => j.id === id);
    if (localMock) {
      setMission(localMock as Job);
      return;
    }
    api.get(`/jobs/${id}`)
      .then((data: any) => setMission(data))
      .catch((err) => console.warn("Failed to fetch mission", err));
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const requiredFields: (keyof typeof formData)[] = [
      "firstName", "email", "mobile", "gender", "location", "institute", 
      "differentlyAbled", "userType", "domain", "course", "specialization", 
      "graduatingYear", "courseDuration"
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);

    // Conditional Validation for 'Others'
    if (formData.specialization === "Others" && !formData.specializationOther) {
      missingFields.push("specializationOther" as any);
    }

    if (missingFields.length > 0) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: `Please fill in all required fields: ${missingFields.map(f => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(", ")}`,
      } as any);
      
      // Scroll to the first missing field's section if possible
      if (missingFields.some(f => ["firstName", "email", "mobile", "gender", "location", "institute", "differentlyAbled"].includes(f))) {
        document.getElementById("basic-details")?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById("user-details")?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (!formData.agreeToShare) {
      addNotification({
        type: "error",
        title: "Agreement Required",
        message: "Please agree to the terms and conditions to proceed.",
      } as any);
      return;
    }
    
    addNotification({
      type: "success",
      title: "Registration Success",
      message: "You have successfully registered for the mission!",
    } as any);

    // If it's a team participation, show the team selection modal
    const isTeamMission = mission?.metadata?.participationType === 'Team Participation' || 
                         (mission?.metadata?.minTeamSize && parseInt(mission.metadata.minTeamSize) > 1);

    if (isTeamMission) {
      setShowTeamModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  if (!mission) return <div className="p-8 text-center text-slate-400">Loading mission details...</div>;

  if (registrationStep === "team-management") {
    return (
      <TeamManagementView 
        mission={mission} 
        formData={formData}
        teamAction={teamAction || "create"}
        setTeamAction={setTeamAction}
        teamName={teamName}
        setTeamName={setTeamName}
        onBack={() => setRegistrationStep("form")}
        onUpdate={() => {
            addNotification({
                type: "success",
                title: "Details Updated",
                message: "Team details have been updated successfully!",
            } as any);
            setShowSuccessModal(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-20 font-sans text-slate-800 flex flex-col items-center overflow-y-auto">
      <div className="max-w-[850px] w-full bg-white shadow-lg border-t-4 border-t-blue-600 rounded-lg mb-10">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 bg-white">
          <h1 className="text-[22px] font-bold text-slate-800">Registration Form</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-12 pb-24">
          
          {/* 1. Basic Details Section */}
          <div id="basic-details" className="scroll-mt-20">
            <h2 className="text-[17px] font-bold text-slate-800 mb-6 flex items-center">
              Basic Details
            </h2>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-6">
                <InputField 
                    label="First Name" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                    required 
                />
                <InputField 
                    label="Last Name (If applicable)" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <InputField 
                    label="Email" 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    required 
                    badge={<span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>}
                />
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-[13px] font-bold text-slate-500 mb-2">
                        Mobile<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 min-w-[80px]">
                            <span className="text-sm">🇮🇳 +91</span>
                        </div>
                        <div className="relative flex-1">
                            <input
                            type="text"
                            value={formData.mobile}
                            onChange={e => setFormData({...formData, mobile: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 outline-none text-[14px]"
                            />
                            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-600 px-3 py-1 hover:bg-blue-50 rounded">Verify</button>
                        </div>
                    </div>
                </div>
              </div>

              <PillGroup 
                label="Gender" 
                options={["Female", "Male", "Transgender", "Intersex", "Non-binary", "Prefer not to say", "Others"]} 
                value={formData.gender} 
                onChange={val => setFormData({...formData, gender: val})} 
                required 
              />

              <InputField 
                label="Location" 
                name="location" 
                value={isLocating ? "Getting your location..." : formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                required 
                icon={<span className={`material-symbols-outlined text-[18px] ${isLocating ? 'animate-spin' : ''}`}>my_location</span>}
                onIconClick={handleGetLocation}
                placeholder="Enter your city or click icon for GPS"
              />

              <InputField 
                label="Institute Name" 
                name="institute" 
                value={formData.institute} 
                onChange={e => setFormData({...formData, institute: e.target.value})} 
                required 
              />

              <PillGroup 
                label="Differently Abled" 
                options={["No", "Yes"]} 
                value={formData.differentlyAbled} 
                onChange={val => setFormData({...formData, differentlyAbled: val})} 
                required 
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. User Details Section */}
          <div id="user-details" className="scroll-mt-20">
            <h2 className="text-[17px] font-bold text-slate-800 mb-6 flex items-center">
              User Details
            </h2>
            <div className="space-y-8">
              <PillGroup 
                label="Type" 
                options={["College Students", "Professional", "School Student", "Fresher"]} 
                value={formData.userType} 
                onChange={val => setFormData({...formData, userType: val})} 
                required 
              />

              <div className="flex flex-wrap gap-6">
                <SelectField 
                   label="Domain" 
                   name="domain" 
                   value={formData.domain} 
                   onChange={e => setFormData({...formData, domain: e.target.value})} 
                   options={["Engineering", "Management", "Design", "Others"]} 
                   required
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <SelectField 
                   label="Course" 
                   name="course" 
                   value={formData.course} 
                   onChange={e => setFormData({...formData, course: e.target.value})} 
                   options={["B.Tech/BE (Bachelor of Technology / Bachelor of Engineering)", "M.Tech", "MBA", "Others"]} 
                   required
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <SelectField 
                   label="Course Specialization" 
                   name="specialization" 
                   value={formData.specialization} 
                   onChange={e => setFormData({...formData, specialization: e.target.value})} 
                   options={["Others", "Computer Science", "Electrical", "Mechanical"]} 
                   required
                />
              </div>

              {formData.specialization === "Others" && (
                <InputField 
                  label="Please specify" 
                  name="specializationOther" 
                  value={formData.specializationOther} 
                  onChange={e => setFormData({...formData, specializationOther: e.target.value})} 
                  placeholder="Others"
                  required
                />
              )}

              <PillGroup 
                label="Graduating Year" 
                options={["2026", "2027", "2028", "2029", "2030"]} 
                value={formData.graduatingYear} 
                onChange={val => setFormData({...formData, graduatingYear: val})} 
                required 
              />

              <PillGroup 
                label="Course Duration" 
                options={["4 Years", "3 Years", "2 Years", "1 Year"]} 
                value={formData.courseDuration} 
                onChange={val => setFormData({...formData, courseDuration: val})} 
                required 
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. Terms & Conditions Section */}
          <div id="terms-conditions" className="scroll-mt-20">
            <h2 className="text-[17px] font-bold text-slate-800 mb-6 flex items-center">
              Terms & Conditions
            </h2>
            <div className="space-y-4 px-2">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                      type="checkbox" 
                      checked={formData.agreeToShare} 
                      onChange={e => setFormData({...formData, agreeToShare: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
                <span className="text-[12px] text-slate-500 leading-relaxed font-medium">
                  By registering for this opportunity, you agree to share the data mentioned in this form or any form henceforth on this opportunity with the organizer of this opportunity for further analysis, processing, and outreach. Your data will also be used by TrackCodex for providing you regular and constant updates on this opportunity. You also agree to the <a href="https://docs.trackcodex.com/privacy-policy" target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline">privacy policy</a> and <a href="https://docs.trackcodex.com/terms" target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline">terms</a> of TrackCodex.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                      type="checkbox" 
                      checked={formData.stayInLoop} 
                      onChange={e => setFormData({...formData, stayInLoop: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
                <span className="text-[12px] text-slate-500 leading-relaxed font-medium">
                  Stay in the loop - Get relevant updates curated just for you!
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8 w-full flex justify-center">
            <button
              type="submit"
              className="max-w-[400px] w-full py-4 bg-blue-600 text-white rounded-xl text-[16px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
            >
              Apply For Mission
            </button>
          </div>

        </form>
      </div>

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSuccessModal(false)} />
          <div className="relative w-full max-w-[520px] bg-[#e6fcf5] rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 z-10"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>

            <div className="p-8 flex flex-col items-center">
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8 pt-4">
                <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-6">
                  <span className="material-symbols-outlined text-white text-[48px] font-bold">check</span>
                </div>
                <h3 className="text-[28px] font-bold text-slate-800 mb-2">Registration Successful</h3>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed px-4">
                  Thank you for registering for this opportunity.<br />Wishing you the best of luck!
                </p>
              </div>

              {/* Mission Card */}
              <div className="w-full bg-white rounded-[32px] shadow-sm mb-6">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0">
                      {mission.creator?.avatar ? (
                        <img src={mission.creator.avatar} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-300">corporate_fare</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-[18px] font-bold text-slate-900 leading-tight mb-0.5 truncate">{mission.title}</h4>
                      <p className="text-[14px] font-bold text-slate-500 truncate">{mission.creator?.name || "Organisation"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 text-slate-600">
                      <span className="material-symbols-outlined text-[18px]">north_east</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-50 text-slate-700 font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      Add to calendar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-50 text-slate-700 font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                      Share with Friend
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center px-4">
                  <div className="absolute left-[-10px] w-5 h-5 rounded-full bg-[#e6fcf5] shadow-inner" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-50" />
                  <div className="absolute right-[-10px] w-5 h-5 rounded-full bg-[#e6fcf5] shadow-inner" />
                </div>

                <div className="p-2 pt-0">
                  <button 
                    onClick={() => setIsNextOpen(!isNextOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[14px] font-bold text-slate-700">What's Next in {mission.title}?</span>
                    <span className={`material-symbols-outlined transition-transform ${isNextOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>
              </div>

              {/* Tips & Applications */}
              <div className="w-full space-y-1">
                <button 
                  onClick={() => setIsTipsOpen(!isTipsOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 group"
                >
                  <span className="text-[15px] font-bold text-[#065f46]">Here are some tips to make an impact</span>
                  <span className={`material-symbols-outlined text-[#065f46] transition-transform ${isTipsOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                <button 
                  onClick={() => navigate("/marketplace/applications")}
                  className="w-full flex items-center justify-between px-4 py-3 group"
                >
                  <span className="text-[15px] font-bold text-[#065f46]">View All Applications</span>
                  <span className="material-symbols-outlined text-[#065f46]">north_east</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Selection Modal ── */}
      <TeamSelectionModal 
        isOpen={showTeamModal} 
        onClose={() => setShowTeamModal(false)}
        onSelect={(action) => {
          setTeamAction(action);
          setShowTeamModal(false);
          setRegistrationStep("team-management");
        }}
        minSize={mission?.metadata?.minTeamSize}
        maxSize={mission?.metadata?.maxTeamSize}
      />
    </div>
  );
};

/* ── Team Selection Modal ── */
const TeamSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelect,
  minSize = 3,
  maxSize = 5
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (action: "create" | "join") => void,
  minSize?: number,
  maxSize?: number
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[700px] bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Create Team Card */}
            <button 
              onClick={() => onSelect("create")}
              className="group flex flex-col items-center p-8 rounded-[24px] bg-[#f0f0ff] border-2 border-transparent hover:border-blue-200 transition-all text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="material-symbols-outlined text-[32px] text-slate-700">group_add</span>
              </div>
              <h4 className="text-[18px] font-bold text-slate-800 mb-2">Create A Team</h4>
              <div className="w-full border-t border-dashed border-slate-300 my-4" />
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Form a team & invite members via email or social media.
              </p>
            </button>

            {/* Join Team Card */}
            <button 
              onClick={() => onSelect("join")}
              className="group flex flex-col items-center p-8 rounded-[24px] bg-[#f0f8ff] border-2 border-transparent hover:border-blue-100 transition-all text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="material-symbols-outlined text-[32px] text-slate-700">handshake</span>
              </div>
              <h4 className="text-[18px] font-bold text-slate-800 mb-2">Join A Team</h4>
              <div className="w-full border-t border-dashed border-slate-200 my-4" />
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Join teams seeking members by join request or invitation.
              </p>
            </button>
          </div>

          {/* Important Notes */}
          <div className="bg-[#f0f9ff] border border-blue-200 border-dashed rounded-xl p-5">
            <h5 className="text-[14px] font-bold text-blue-900 mb-3">Important Notes:</h5>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-[12px] text-blue-800 font-medium leading-relaxed">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                Your team must have at least {minSize} and no more than {maxSize} members.
              </li>
              <li className="flex items-start gap-2 text-[12px] text-blue-800 font-medium leading-relaxed">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                If you select "Join A Team", your registration won't be finalized until you join a team.
              </li>
              <li className="flex items-start gap-2 text-[12px] text-blue-800 font-medium leading-relaxed">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                As one or more round(s) is live, you CANNOT delete the registration, if you select Create Team.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Team Management View ── */
const TeamManagementView = ({ 
    mission, 
    formData, 
    teamAction, 
    setTeamAction,
    teamName,
    setTeamName,
    onBack,
    onUpdate 
}: { 
    mission: Job, 
    formData: any, 
    teamAction: "create" | "join",
    setTeamAction: (action: "create" | "join") => void,
    teamName: string,
    setTeamName: (val: string) => void,
    onBack: () => void,
    onUpdate: () => void
}) => {
    const [activeRightTab, setActiveRightTab] = useState<"invitations" | "requests">("invitations");

    return (
        <div className="min-h-screen bg-white w-full flex flex-col pt-4">
            {/* Header */}
            <header className="px-8 pb-4 flex items-center gap-4 relative">
                <div className="w-12 h-12 rounded-lg border border-slate-100 flex items-center justify-center p-1 bg-white shadow-sm shrink-0">
                    {mission.creator?.avatar ? (
                        <img src={mission.creator.avatar} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <span className="material-symbols-outlined text-slate-300">corporate_fare</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-[17px] font-bold text-slate-800 leading-tight truncate">{mission.title}</h1>
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-tight truncate">{mission.creator?.name || "Organisation Name"}</p>
                </div>
                {/* Blue border-bottom line across the whole header */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
            </header>

            {/* Navigation Tabs */}
            <nav className="px-8 bg-white border-b border-slate-100">
                <div className="flex gap-10">
                    {["Create a team", "Join a team"].map((tab) => {
                        const action = tab.toLowerCase().includes("create") ? "create" : "join";
                        const active = teamAction === action;
                        return (
                            <button
                                key={tab}
                                onClick={() => setTeamAction(action as any)}
                                className={`py-4 text-[13px] font-bold transition-all border-b-[3px] -mb-[1px] ${
                                    active ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-800"
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex bg-[#f8fafc]">
                {/* Left Panel - Team Configuration */}
                <div className="flex-1 p-10 bg-white shadow-sm border-r border-slate-200 overflow-y-auto">
                    <div className="max-w-[500px] mx-auto space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-[13px] font-bold text-slate-500">Team Name</label>
                                <button className="text-[12px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                    Cancel Team
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter your team name"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border focus:ring-4 focus:ring-blue-100 outline-none transition-all text-[15px] ${
                                        !teamName ? 'border-red-200 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
                                    }`}
                                />
                                {!teamName && <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">Team name is required</p>}
                            </div>
                        </div>

                        {/* Teammates Section */}
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold text-slate-700">Teammates</span>
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
                                    <span className="text-[12px] font-bold text-slate-400">(1/{mission.metadata?.maxTeamSize || 5})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-slate-600">Looking for Teammates</span>
                                    <span className="material-symbols-outlined text-blue-500">info</span>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-red-500 font-bold mb-5">
                                Add {parseInt(mission.metadata?.minTeamSize || "3") - 1} more participant to complete the team
                            </p>

                            <div className="space-y-4">
                                {/* Leader (Current User) */}
                                <div className="p-4 rounded-xl border border-green-500 bg-white flex items-center justify-between group shadow-sm transition-all hover:shadow-md cursor-pointer border-l-[6px]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {formData.firstName?.[0] || "U"}
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-slate-800">{formData.firstName} {formData.lastName}</h4>
                                            <p className="text-[12px] text-slate-400 font-medium">+{formData.mobile || "N/A"}</p>
                                        </div>
                                    </div>
                                    <button className="material-symbols-outlined text-slate-400 hover:text-blue-500 transition-colors">edit</button>
                                </div>

                                {/* Placeholder Buttons for Members */}
                                <div className="flex gap-4">
                                    <button className="flex-1 h-[68px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all">
                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                        Add 2nd Member
                                    </button>
                                    <button className="h-[68px] px-6 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                        Invite Friends
                                    </button>
                                </div>

                                {/* Status Legend */}
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
                                    {[
                                        { color: "bg-green-500", label: "Verified" },
                                        { color: "bg-yellow-400", label: "Confirmation Pending/Unsaved Changes (Click Update Details)" },
                                        { color: "bg-red-500", label: "Not Added Yet (Click Update Details)" }
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Invitations & Requests */}
                <div className="w-full max-w-[420px] bg-white border-l border-slate-200 flex flex-col pt-6">
                    <div className="px-6 flex gap-3 mb-8">
                        <button 
                            onClick={() => setActiveRightTab("invitations")}
                            className={`flex-1 flex items-center justify-between px-5 py-3 rounded-xl text-[13px] font-bold transition-all ${
                                activeRightTab === "invitations" ? "bg-[#eef2ff] text-blue-600 ring-1 ring-blue-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[18px]">group_add</span>
                                Invitations
                            </div>
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${
                                activeRightTab === "invitations" ? "bg-orange-600 text-white" : "bg-slate-300 text-white"
                            }`}>0</span>
                        </button>
                        <button 
                            onClick={() => setActiveRightTab("requests")}
                            className={`flex-1 flex items-center justify-between px-5 py-3 rounded-xl text-[13px] font-bold transition-all ${
                                activeRightTab === "requests" ? "bg-[#eef2ff] text-blue-600 ring-1 ring-blue-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
                                Requests
                            </div>
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${
                                activeRightTab === "requests" ? "bg-orange-600 text-white" : "bg-slate-300 text-white"
                            }`}>0</span>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-64 h-64 mb-8 relative flex items-center justify-center">
                             {/* Astronaut with Magnifying Glass Illustration (Abstract SVG) */}
                             <svg viewBox="0 0 200 200" className="w-full h-full text-slate-100">
                                <rect x="40" y="120" width="120" height="20" rx="10" fill="currentColor" opacity="0.3" />
                                <rect x="60" y="140" width="80" height="15" rx="7" fill="currentColor" opacity="0.2" />
                                <path d="M100 40 C 60 40 40 80 40 120 L 160 120 C 160 80 140 40 100 40" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                                <circle cx="100" cy="80" r="25" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                                <path d="M85 75 Q 100 65 115 75" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                                <circle cx="130" cy="70" r="15" fill="white" stroke="#64748b" strokeWidth="2" />
                                <line x1="140" y1="80" x2="155" y2="95" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
                             </svg>
                        </div>
                        <h5 className="text-[15px] font-bold text-slate-700 mb-2">No friend suggestion right now.</h5>
                        <p className="text-[13px] text-slate-400 font-medium max-w-[280px]">Explore other ways to create your team.</p>
                    </div>
                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="h-[72px] border-t border-slate-100 flex items-center justify-between px-10 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
                <button 
                    onClick={onBack}
                    className="px-8 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-[14px] font-bold hover:bg-slate-50 transition-all border-dashed"
                >
                    Back
                </button>
                <button 
                  onClick={onUpdate}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  Update Details
                </button>
            </footer>
        </div>
    );
};

export default MissionRegistrationView;
