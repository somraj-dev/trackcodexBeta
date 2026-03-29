import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/infra/api";
import { format } from "date-fns";
import { MOCK_MARKETPLACE_JOBS } from "../../constants";
import JobActionModal from "../../components/modals/JobActionModal";

/* ───── Unstop-style section header with blue accent bar ───── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[17px] font-bold text-gh-text mb-4 flex items-center">
    <div className="w-[5px] h-5 bg-blue-600 rounded-lg mr-3 -ml-[1px]" />
    {children}
  </h3>
);

/* ═══════════════════════════════════════════════════════════════
   JobDetailView — Unstop-style 1-to-1 screenshot clone for Jobs
   ═══════════════════════════════════════════════════════════════ */
const JobDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHeartFilled, setIsHeartFilled] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Try finding in mock data first for instant loading
    const mockJob = MOCK_MARKETPLACE_JOBS.find(j => j.id === id);
    if (mockJob) {
      setJob(mockJob);
      setLoading(false);
      return;
    }

    api.get(`/jobs/${id}`)
      .then((data: any) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to fetch job", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gh-bg flex flex-col items-center justify-center text-gh-text-secondary">
        <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">autorenew</span>
        <p className="text-lg font-medium">Fetching job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center text-gh-text-secondary text-lg">
        Job not found.
      </div>
    );
  }

  const metadata = job.metadata || {};
  const description = job.description || "No description provided.";
  const orgName = job.org?.name || job.creator?.name || "Unknown Organization";
  
  // Dynamic details based on job title/metadata
  const responsibilities = metadata.responsibilities || [
    "Provide exceptional service via phone, email, and chat.",
    "Resolve customer inquiries and complaints promptly and efficiently.",
    "Build and maintain positive relationships with customers.",
    "Process customer orders and transactions accurately.",
    "Identify and escalate customer issues to the appropriate team.",
    "Contribute to a positive and productive team environment.",
    "Stay up-to-date on company policies and procedures.",
    "Adhere to all company safety and security protocols."
  ];

  const requirements = metadata.requirements || [
    "High school diploma or equivalent.",
    "Freshers can apply.",
    "Excellent communication and interpersonal skills.",
    "Strong problem-solving and decision-making abilities.",
    "Ability to work independently and as a team member."
  ];

  const recruitmentProcess = metadata.recruitmentProcess || [
    { name: "Interview", detail: "Interview round", type: "Online", icon: "video_call" }
  ];

  const additionalInfo = metadata.additionalInfo || {
    salary: { min: "₹ 2,40,000", max: "₹ 2,60,000", period: "/Year" },
    workDetail: "Working Days: 5 Days",
    jobType: { type: "In Office", timing: "Full Time" }
  };

  const fmt = (dateString?: string) => {
    if (!dateString) return "08 Apr 23, 12:00 AM IST";
    try { return format(new Date(dateString), "dd MMM yy, hh:mm a 'IST'"); } catch { return "08 Apr 23, 12:00 AM IST"; }
  };

  const relatedJobs = MOCK_MARKETPLACE_JOBS
    .filter(j => j.id !== id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gh-bg font-sans text-gh-text pb-12">
      
      {/* ════════════════════════════════════════════════════════════
          HERO CARD
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg-secondary shadow-sm border border-gh-border overflow-hidden">
        
        {/* Top toolbar */}
        <div className="flex justify-between items-center px-6 pt-5 pb-2">
          <div className="flex items-center gap-1.5 text-gh-text-secondary text-[12px] font-bold">
            <span className="material-symbols-outlined text-[16px]">apartment</span>
            {additionalInfo.jobType?.type || "In Office"}
          </div>
          <div className="flex items-center gap-4 text-gh-text-secondary/50">
            <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-blue-500 transition-colors">calendar_today</span>
            <span 
              className={`material-symbols-outlined text-[18px] cursor-pointer transition-colors ${isHeartFilled ? 'text-red-500 fill-current' : 'hover:text-red-500'}`}
              onClick={() => setIsHeartFilled(!isHeartFilled)}
            >
              {isHeartFilled ? 'favorite' : 'favorite_border'}
            </span>
            <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-blue-600 transition-colors">share</span>
          </div>
        </div>

        {/* Title & Info Wrapper */}
        <div className="px-6 pb-6 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-gh-text tracking-tight leading-tight mb-1">
              {job.title}
            </h1>
            <p className="text-[14px] font-bold text-gh-text-secondary mb-6">
              {orgName}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-gh-bg p-2 rounded-lg border border-gh-border">
                <span className="material-symbols-outlined text-gh-text-secondary text-[20px]">location_on</span>
                <span className="text-[13px] font-bold text-gh-text">{metadata.location || "Location"}</span>
              </div>
              
              <div className="flex items-center gap-2 pl-4 border-l-2 border-gh-border h-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gh-text-secondary">Salary</span>
                  <span className="text-[14px] font-black text-gh-text">
                    {additionalInfo.salary?.min} - {additionalInfo.salary?.max}
                  </span>
                </div>
                <div className="bg-gh-bg p-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-gh-text text-[24px]">payments</span>
                </div>
              </div>
            </div>

            {/* Tech Tags */}
            <div className="flex flex-wrap gap-2">
              {(job.techStack || ["Voice / Blended", "Customer Support"]).map((tech: string) => (
                <span key={tech} className="bg-gh-bg text-gh-text-secondary px-3 py-1 rounded text-[11px] font-bold border border-gh-border">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="w-24 h-24 rounded-2xl border border-gh-border p-3 shrink-0 flex items-center justify-center bg-gh-bg shadow-sm overflow-hidden mt-1">
            <img 
              src={job.creator?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=" + orgName} 
              alt={orgName} 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BODY CONTENT
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg-secondary border-l border-r border-gh-border p-8 space-y-12">
        
        {/* Recruitment Process */}
        <div>
          <SectionTitle>Recruitment Process</SectionTitle>
          <div className="px-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-blue-600 bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">event</span>
              </div>
              <div className="text-[13px] font-bold text-gh-text-secondary mt-2">
                {fmt(job.createdAt)} → {fmt(metadata.endDate)}
              </div>
            </div>

            <div className="bg-gh-bg border border-gh-border rounded-xl p-5 ml-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[15px] font-bold text-gh-text">Interview</p>
                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">On {recruitmentProcess[0]?.type || "Online"}</span>
              </div>
              <p className="text-[12px] text-gh-text-secondary">{recruitmentProcess[0]?.detail || "Interview round"}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div>
          <SectionTitle>Details</SectionTitle>
          <div className="px-4 space-y-6">
            <p className="text-[14px] font-bold text-gh-text">
              {orgName} is looking for a {job.title} to join our growing team!
            </p>
            
            <div>
              <p className="text-[13px] font-black text-gh-text mb-3">Responsibilities of the Candidate:</p>
              <ul className="space-y-2">
                {(readMore ? responsibilities : responsibilities.slice(0, 4)).map((item: string, idx: number) => (
                  <li key={idx} className="flex gap-2 text-[13px] text-gh-text-secondary">
                    <span className="text-gh-text-secondary/50">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {readMore && (
              <div>
                <p className="text-[13px] font-black text-gh-text mb-3">Requirements:</p>
                <ul className="space-y-2">
                  {requirements.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-[13px] text-gh-text-secondary">
                      <span className="text-gh-text-secondary/50">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              onClick={() => setReadMore(!readMore)}
              className="text-blue-600 text-[13px] font-bold flex items-center gap-1 hover:underline w-full justify-center py-2"
            >
              {readMore ? "Read Less" : "Read More"}
              <span className="material-symbols-outlined text-[18px]">
                {readMore ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>

            <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">lightbulb</span>
              <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed font-medium italic">
                If an employer asks you to pay any kind of fee, please notify us immediately. TrackCodex does not charge any fee from the applicants and we do not allow other companies also to do so.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <SectionTitle>Additional Information</SectionTitle>
          <div className="px-4 grid grid-cols-1 gap-4">
            {/* Salary */}
            <div className="bg-gh-bg border border-gh-border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gh-bg-secondary flex items-center justify-center rounded-xl border border-gh-border">
                 <span className="material-symbols-outlined text-blue-600">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-gh-text mb-0.5">Salary</p>
                <p className="text-[11px] text-gh-text-secondary">Min Salary: <span className="font-bold text-gh-text">{additionalInfo.salary?.min}{additionalInfo.salary?.period}</span></p>
                <p className="text-[11px] text-gh-text-secondary">Max Salary: <span className="font-bold text-gh-text">{additionalInfo.salary?.max}{additionalInfo.salary?.period}</span></p>
              </div>
            </div>

            {/* Work Detail */}
            <div className="bg-gh-bg border border-gh-border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gh-bg-secondary flex items-center justify-center rounded-xl border border-gh-border">
                 <span className="material-symbols-outlined text-blue-600">assignment</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-gh-text mb-0.5">Work Detail</p>
                <p className="text-[11px] text-gh-text-secondary font-bold">{additionalInfo.workDetail}</p>
              </div>
            </div>

            {/* Job Type/Timing */}
            <div className="bg-gh-bg border border-gh-border rounded-2xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gh-bg-secondary flex items-center justify-center rounded-xl border border-gh-border">
                 <span className="material-symbols-outlined text-blue-600">schedule</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-gh-text mb-0.5">Job Type/Timing</p>
                <p className="text-[11px] text-gh-text-secondary">Job Type: <span className="font-bold text-gh-text">{additionalInfo.jobType?.type}</span></p>
                <p className="text-[11px] text-gh-text-secondary">Job Timing: <span className="font-bold text-gh-text">{additionalInfo.jobType?.timing}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Opportunities */}
        <div>
          <SectionTitle>Related Opportunities</SectionTitle>
          <div className="px-4 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {relatedJobs.length > 0 ? (
              relatedJobs.map(relatedJob => (
                <div 
                  key={relatedJob.id} 
                  onClick={() => {
                    navigate(`/marketplace/jobs/${relatedJob.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="min-w-[240px] border border-gh-border rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer bg-gh-bg group"
                >
                  <div 
                    className="w-12 h-12 rounded-xl border border-gh-border flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: relatedJob.iconBg || "var(--gh-bg-secondary)" }}
                  >
                    <span className="material-symbols-outlined text-[24px]">{relatedJob.icon || "business"}</span>
                  </div>
                  <p className="text-[14px] font-bold text-gh-text mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {relatedJob.title}
                  </p>
                  <p className="text-[11px] text-gh-text-secondary font-medium">TrackCodex Corp</p>
                </div>
              ))
            ) : (
              <div className="py-4 text-gh-text-secondary text-[13px] italic">No related opportunities found</div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-gh-border/50 flex justify-center">
            <button 
              onClick={() => {
                if (job.applicationUrl) {
                  window.open(job.applicationUrl, "_blank");
                } else {
                  addNotification({
                    type: "info",
                    title: "Coming Soon",
                    message: "Applications for this role will open shortly."
                  });
                }
              }}
              className="max-w-md w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
               Apply Now
            </button>
        </div>

      </div>

      {/* ─── Footer Details ─── */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg-secondary border border-t-0 border-gh-border p-8 flex flex-col gap-4 text-[10px] text-gh-text-secondary font-medium md:rounded-b-2xl">
         <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">update</span>
            <span>Updated On: <span className="text-gh-text font-bold">{fmt(job.updatedAt)}</span></span>
         </div>
         <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">query_stats</span>
            <span>The data on this page gets updated in every 15 minutes.</span>
         </div>
         <p className="mt-2 text-[9px] text-gh-text-secondary leading-relaxed">
            This opportunity has been listed by <span className="uppercase text-gh-text font-bold">{orgName}</span>. TrackCodex is not liable for any content mentioned in this opportunity or the process followed by the organisers for this opportunity. However, please raise a complaint if you want TrackCodex to look into the matter.
         </p>
         <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setComplaintModalOpen(true)}
              className="flex items-center gap-1 text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
            >
               <span className="material-symbols-outlined text-[14px]">flag</span> Raise a Complaint
            </button>
            <button 
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 text-red-500 hover:underline font-bold bg-transparent border-none cursor-pointer"
            >
               <span className="material-symbols-outlined text-[14px]">report</span> Report An Issue
            </button>
         </div>
      </div>

      {/* ─── MODALS ─── */}
      <JobActionModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report an Issue"
        subtitle="Select / describe what is the issue?"
        options={["Page Loading", "Publish Opportunity", "Registration", "Others"]}
        jobTitle={job.title}
      />

      <JobActionModal
        isOpen={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        title="Raise a Complaint"
        subtitle="Please select the issue from the list below."
        options={[
          "Not received any update for the Job/Internship", 
          "Charging money/fee for the Job/Internship", 
          "Salary/Stipend reduced", 
          "Organization/Recruiter seems suspicious", 
          "Hiring for a different organization than mentioned", 
          "Other unfair practice"
        ]}
        jobTitle={job.title}
      />

    </div>
  );
};

export default JobDetailView;
