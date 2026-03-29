import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Job } from "../../types";
import JobRatingModal from "../../components/jobs/JobRatingModal";
import ShareModal from "../../components/modals/ShareModal";
import JobActionModal from "../../components/modals/JobActionModal";
import { directMessageBus } from "../../services/social/directMessageBus";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/infra/api";
import { format } from "date-fns";
import { MOCK_JOBS } from "../../constants";

/* ───── Unstop-style section header with blue accent bar ───── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[17px] font-bold text-gh-text mb-4 flex items-center">
    <div className="w-[5px] h-5 bg-blue-600 rounded-lg mr-3 -ml-[1px]" />
    {children}
  </h3>
);

/* ═══════════════════════════════════════════════════════════════
   MissionDetailView — exact 1-to-1 Unstop screenshot clone
   ═══════════════════════════════════════════════════════════════ */
const MissionDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [localJob, setLocalJob] = useState<any>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHeartFilled, setIsHeartFilled] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  /* ── fetch ── */
  useEffect(() => {
    if (!id) return;
    const localMock = MOCK_JOBS.find((j) => j.id === id);
    if (localMock) { setLocalJob(localMock as Job); return; }
    api.get(`/jobs/${id}`)
      .then((data: any) => setLocalJob(data))
      .catch((err) => console.warn("Failed to fetch job", err));
  }, [id]);

  if (!localJob)
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center text-gh-text-secondary text-lg">
        Mission not found.
      </div>
    );

  /* ── helpers ── */
  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!localJob || !user) return;
    try {
      const freelancerId =
        localJob.applications?.find((app: any) => app.status === "Accepted")?.applicantId ||
        "test-user-id-for-demo";
      await api.post(`/jobs/${localJob.id}/complete`, { rating, feedback, freelancerId });
      setLocalJob({ ...localJob, status: "Completed" });
      setIsRatingModalOpen(false);
      addNotification({ type: "success", title: "Mission Completed", message: "Your feedback has been submitted." } as any);
    } catch (e) {
      console.error("Failed to complete job", e);
    }
  };

  const hasApplied = localJob?.applications?.some((app: any) => app.applicantId === user?.id) || false;
  const isCreator = localJob?.creator?.name === user?.name || localJob?.creator?.id === user?.id;

  const metadata = localJob?.metadata || {};
  const description = localJob?.description || "No description provided.";
  const orgName = metadata.organization || localJob?.creator?.name || "Unknown Organization";

  const fmt = (dateString?: string) => {
    if (!dateString) return "TBD";
    try { return format(new Date(dateString), "dd MMM yy, hh:mm a"); } catch { return dateString; }
  };

  /* ══════════════════════════════════════════
     RENDER — matches the Unstop screenshot
     from top → bottom, section by section
     ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gh-bg font-sans text-gh-text">

      {/* ─── breadcrumb ─── */}
      <div className="max-w-[850px] mx-auto px-4 pt-5 pb-2 flex items-center gap-2 text-[11px] text-gh-text-secondary font-medium">
        <span className="material-symbols-outlined text-[14px]">home</span>
        <span>/</span>
        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate("/marketplace")}>Hackathon</span>
        <span>/</span>
        <span className="font-bold text-gh-text truncate max-w-[200px]">{localJob.title}</span>
      </div>

      {/* ════════════════════════════════════════════════════════════
          HERO CARD — theme card with badge, title, org, location
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg-secondary shadow-sm border border-gh-border overflow-hidden">

        {/* top row: ONLINE badge + action icons */}
        <div className="flex justify-between items-center px-6 pt-5 pb-2">
          <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
            <span className="material-symbols-outlined text-[10px] font-bold">
              {metadata.participationType === "Offline" ? "location_off" : "wifi"}
            </span>
            {metadata.participationType === "Offline" ? "Offline" : "Online"}
          </div>
          <div className="flex items-center gap-4 text-gh-text-secondary">
            <span 
              className="material-symbols-outlined text-[18px] cursor-pointer hover:text-blue-500 transition-colors"
              onClick={() => {
                if (localJob.website) {
                  window.open(localJob.website.startsWith('http') ? localJob.website : `https://${localJob.website}`, '_blank');
                } else {
                  addNotification({ type: 'info', title: 'Website Unavailable', message: 'The organiser has not provided a website link.' } as any);
                }
              }}
              title="Visit Website"
            >
              public
            </span>
            <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-slate-600">calendar_today</span>
            <span 
              className={`material-symbols-outlined text-[18px] cursor-pointer transition-colors ${isHeartFilled ? 'text-red-500 fill-current' : 'hover:text-red-500'}`}
              onClick={() => setIsHeartFilled(!isHeartFilled)}
            >
              {isHeartFilled ? 'favorite' : 'favorite_border'}
            </span>
            <span 
              className="material-symbols-outlined text-[18px] cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => setIsShareModalOpen(true)}
            >
              share
            </span>
          </div>
        </div>

        {/* title + org + meta + logo */}
        <div className="px-6 pb-6 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-[28px] font-bold text-gh-text tracking-tight leading-snug mb-0.5">
              {localJob.title}
            </h1>
            <p className="text-[14px] font-bold text-gh-text-secondary tracking-wider uppercase mb-6">
              {orgName}
            </p>

            {/* location + team size row */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 flex justify-center text-gh-text-secondary mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gh-text leading-none mb-1">Location</p>
                  <p className="text-[13px] text-gh-text-secondary">
                    {metadata.participationType === "Offline" ? "On Campus, TBD" : "Global / Remote"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 flex justify-center text-gh-text-secondary mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gh-text leading-none mb-1">Team Size</p>
                  <p className="text-[13px] text-gh-text-secondary">
                    1 - {metadata.registrationLimit || 1} Members
                  </p>
                </div>
              </div>
            </div>

            {/* tag */}
            <div className="mt-6">
              <span className="inline-flex px-3 py-1 bg-gh-bg text-gh-text-secondary text-[11px] font-bold rounded min-w-[60px] justify-center items-center border border-gh-border">
                Others
              </span>
            </div>
          </div>

          {/* org logo on right */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border border-gh-border p-2 shrink-0 flex items-center justify-center bg-gh-bg shadow-sm overflow-hidden mt-2 mr-2">
            <img src={localJob.creator?.avatar || "https://github.com/shadcn.png"} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BODY — each section sits inside the same 850 px column
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg-secondary border-l border-r border-gh-border p-8 space-y-12">

        {/* ── Eligibility ── */}
        {metadata.allowedRegister && metadata.allowedRegister.length > 0 && (
          <div>
            <SectionTitle>Eligibility</SectionTitle>
            <div className="text-[13px] text-gh-text-secondary font-medium px-4">
              {metadata.allowedRegister.join("  •  ")}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        <div>
          <SectionTitle>All that you need to know about {localJob.title}</SectionTitle>
          <div className="text-[14px] text-gh-text-secondary whitespace-pre-wrap leading-relaxed px-4">
            {description}
          </div>
        </div>

        {/* ── Important dates & deadlines ── */}
        {(metadata.startDate || metadata.endDate) && (
          <div>
            <SectionTitle>Important dates & deadlines</SectionTitle>
            <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {metadata.startDate && (
                <div className="bg-gh-bg border border-gh-border rounded-lg p-4 flex flex-col gap-1 items-start">
                  <div className="text-blue-500 bg-blue-500/10 rounded-lg w-9 h-9 flex items-center justify-center shrink-0 mb-1">
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  </div>
                  <p className="text-[13px] font-black text-gh-text leading-tight">{fmt(metadata.startDate)}</p>
                  <p className="text-[11px] text-gh-text-secondary font-medium">Start Date</p>
                </div>
              )}
              {metadata.endDate && (
                <div className="bg-gh-bg border border-gh-border rounded-lg p-4 flex flex-col gap-1 items-start">
                  <div className="text-white bg-blue-600 rounded-lg w-9 h-9 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">av_timer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full">1</div>
                    <p className="text-[13px] font-black text-gh-text leading-tight">{fmt(metadata.endDate)}</p>
                  </div>
                  <p className="text-[11px] text-gh-text-secondary font-medium ml-1">Registration Deadline</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contact the organisers ── */}
        <div>
          <SectionTitle>Contact the organisers</SectionTitle>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gh-bg border border-gh-border rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-[13px] shrink-0">
                {(localJob.creator?.name || "O").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-[13px] font-bold text-gh-text truncate leading-snug">{localJob.creator?.name || "Organizer"}</p>
                <p className="text-[11px] text-gh-text-secondary truncate mt-0.5 hover:text-blue-600 cursor-pointer transition-colors leading-snug">organizer@trackcodex.dev</p>
              </div>
              <button
                onClick={() => {
                  directMessageBus.openChat({
                    id: localJob.creator?.name?.replace(/\s+/g, "").toLowerCase() || "unknown",
                    name: localJob.creator?.name || "Organizer",
                    avatar: localJob.creator?.avatar || "",
                    context: `Mission: ${localJob.title}`,
                  });
                }}
                className="w-8 h-8 rounded-md hover:bg-gh-bg-secondary flex items-center justify-center transition-colors"
                title="Message"
              >
                <span className="material-symbols-outlined text-[18px] text-gh-text-secondary">chat_bubble_outline</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Download attachments ── */}
        <div>
          <SectionTitle>Download attachments</SectionTitle>
          <div className="px-4">
            <div className="inline-flex items-center justify-between min-w-[260px] bg-gh-bg border border-gh-border rounded-lg p-3 cursor-pointer hover:bg-gh-bg-secondary transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-blue-500 bg-blue-500/10 p-1 rounded">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <span className="text-[12px] font-bold text-gh-text">
                  {localJob.title.replace(/\s+/g, "_")}_details.pdf
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-gh-text-secondary ml-3">download</span>
            </div>
          </div>
        </div>

        {/* ── Rewards and Prizes ── */}
        <div>
          <SectionTitle>Rewards and Prizes</SectionTitle>
          <div className="px-4">
            <p className="text-[13px] text-gh-text-secondary font-medium leading-relaxed">
              Winner, Achievement (Trophies) & Participation Certification & Overall Cash Prize is{" "}
              <span className="font-bold text-gh-text">{localJob.budget}</span>
            </p>
          </div>
        </div>

        {/* ── Related Opportunities ── */}
        <div>
          <SectionTitle>Related Opportunities</SectionTitle>
          <div className="px-4 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[200px] border border-gh-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gh-bg">
              <div className="w-[45px] h-[45px] bg-gh-bg-secondary rounded border border-gh-border flex items-center justify-center mb-4">
                <span className="font-bold text-gh-text text-[10px]">IIMA</span>
              </div>
              <p className="text-[13px] font-bold text-gh-text mb-0.5 line-clamp-1">AI Summer Residency</p>
              <p className="text-[11px] text-gh-text-secondary truncate">IIMA Ventures</p>
            </div>
            <div className="min-w-[200px] border border-gh-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gh-bg">
              <div className="w-[45px] h-[45px] bg-gh-bg-secondary rounded border border-gh-border flex items-center justify-center mb-4 overflow-hidden p-1">
                <img src="https://github.com/shadcn.png" className="w-full h-full opacity-50 grayscale" alt="" />
              </div>
              <p className="text-[13px] font-bold text-gh-text mb-0.5 line-clamp-1">Think Like a Compiler</p>
              <p className="text-[11px] text-gh-text-secondary truncate">Malla Reddy College...</p>
            </div>
            <div className="min-w-[200px] border border-gh-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gh-bg">
              <div className="w-[45px] h-[45px] bg-gh-bg-secondary rounded border border-gh-border flex items-center justify-center mb-4 overflow-hidden p-1">
                <img src="https://github.com/shadcn.png" className="w-full h-full opacity-50 grayscale" alt="" />
              </div>
              <p className="text-[13px] font-bold text-gh-text mb-0.5 line-clamp-1">Insomnia</p>
              <p className="text-[11px] text-gh-text-secondary truncate">Visvesvaraya National Institu...</p>
            </div>
          </div>
        </div>

        {/* ── Feedback & Rating ── */}
        <div>
          <SectionTitle>Feedback & Rating</SectionTitle>
          <div className="px-4">
            <div
              className="bg-gh-bg border border-gh-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gh-bg-secondary cursor-pointer transition-colors"
              onClick={() => setIsRatingModalOpen(true)}
            >
              <span className="material-symbols-outlined text-gh-text-secondary mb-2">edit_square</span>
              <p className="text-[13px] font-bold text-gh-text">Write a review</p>
              <p className="text-[11px] text-gh-text-secondary mt-0.5">
                Register for this opportunity to give your feedback and review.
              </p>
            </div>
          </div>
        </div>

        {/* ── TrackCodex Mission Actions ── */}
        <div className="px-4 py-6 mt-2 flex justify-center border-t border-gh-border pt-8">
          {localJob.status === "Open" && !isCreator && (
            <button
              onClick={() => {
                if (!user) {
                  alert("Please login to apply");
                  return;
                }
                if (hasApplied) {
                  addNotification({
                    type: "info",
                    title: "Already Applied",
                    message: "You have already applied for this mission.",
                  } as any);
                  return;
                }
                navigate(`/marketplace/missions/${localJob.id}/register`);
              }}
              disabled={hasApplied}
              className={`max-w-xs w-full py-3.5 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all ${
                hasApplied
                  ? "bg-gh-bg-secondary text-gh-text-secondary cursor-not-allowed border border-gh-border"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              }`}
            >
              {hasApplied ? "Application Submitted" : "Apply for Mission"}
            </button>
          )}

          {localJob.status === "Open" && isCreator && (
            <button
              onClick={async () => {
                if (!confirm(`Fund ${localJob.budget} for this mission?`)) return;
                try {
                  await api.post(`/jobs/${localJob.id}/fund`, {});
                  addNotification({ type: "success", title: "Funds Secured", message: "Funds have been placed into Escrow." } as any);
                  setLocalJob({ ...localJob, status: "In Progress" });
                } catch {
                  addNotification({ type: "error", title: "Funding Failed", message: "Failed to secure funds." } as any);
                }
              }}
              className="max-w-xs w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all shadow-lg shadow-blue-500/20"
            >
              Secure Funding (Escrow)
            </button>
          )}

          {localJob.status === "In Progress" && isCreator && (
            <button
              onClick={async () => {
                try {
                  const freelancerId =
                    localJob.applications?.find((app: any) => app.status === "Accepted")?.applicantId ||
                    "test-user-id-for-demo";
                  await api.post(`/jobs/${localJob.id}/release`, { freelancerId });
                  addNotification({ type: "success", title: "Payment Released", message: "Funds released to the freelancer." } as any);
                  setIsRatingModalOpen(true);
                } catch {
                  addNotification({ type: "error", title: "Release Failed", message: "Failed to release payment." } as any);
                }
              }}
              className="max-w-xs w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20"
            >
              Release Payment & Complete
            </button>
          )}

          {localJob.status !== "Completed" && isCreator && localJob.status !== "In Progress" && (
            <button
              onClick={() => setIsRatingModalOpen(true)}
              className="max-w-xs w-full py-3 bg-gh-bg border border-gh-border text-gh-text hover:bg-gh-bg-secondary rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all"
            >
              Mark Complete & Rate
            </button>
          )}
        </div>
      </div>

      {/* ═══════ footer info ═══════ */}
      <div className="max-w-[850px] w-full mx-auto bg-gh-bg border border-t-0 border-gh-border p-6 pt-5 flex items-start gap-4 text-[10px] text-gh-text-secondary font-medium md:rounded-b-2xl mb-8">
        <span className="material-symbols-outlined text-[16px] text-gh-text-secondary mt-0.5 shrink-0">info</span>
        <div className="leading-relaxed">
          <p>
            Updated On: <span className="text-gh-text font-bold">{fmt(localJob.updatedAt)}</span>
          </p>
          <p className="mt-1">The data on this page gets updated in every 15 minutes.</p>
          <p className="mt-2 text-[9px] text-gh-text-secondary">
            This opportunity has been listed by <span className="uppercase text-gh-text font-bold">{orgName}</span>.
            TrackCodex is not liable for any content mentioned in this opportunity or the process followed by
            the organisers for this opportunity. However, please raise a complaint if you want TrackCodex to
            look into the matter.
          </p>
          <div className="mt-4 space-y-1">
            <p 
              onClick={() => setComplaintModalOpen(true)}
              className="text-blue-500 cursor-pointer flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[14px]">flag</span> Raise a Complaint
            </p>
            <p 
              onClick={() => setReportModalOpen(true)}
              className="text-red-500 cursor-pointer flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[14px]">warning</span> Report An Issue
            </p>
          </div>
        </div>
      </div>

      {/* ── Share Modal ── */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        job={localJob}
      />

      {/* ── Rating Modal ── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRatingModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gh-bg border border-gh-border rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-gh-text mb-2">How was your experience?</h3>
            <p className="text-gh-text-secondary mb-6 text-[14px]">Please rate the organizer and provide your feedback.</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[32px] text-amber-400 cursor-pointer hover:scale-110 transition-transform">star</span>
              ))}
            </div>

            <textarea 
              placeholder="Write your feedback here..."
              className="w-full h-32 p-4 rounded-xl bg-gh-bg-secondary border border-gh-border focus:border-blue-500 outline-none resize-none text-[14px] mb-6 text-gh-text"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsRatingModalOpen(false)}
                className="flex-1 py-3 bg-gh-bg-secondary hover:bg-gh-bg-tertiary text-gh-text font-bold rounded-xl transition-colors border border-gh-border"
              >
                Skip
              </button>
              <button 
                onClick={() => {
                  addNotification({ type: "success", title: "Success", message: "Thank you for your feedback!" } as any);
                  setIsRatingModalOpen(false);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Integration ── */}
      <JobActionModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report an Issue"
        subtitle="Select / describe what is the issue?"
        options={["Page Loading", "Publish Opportunity", "Registration", "Others"]}
        jobTitle={localJob.title}
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
        jobTitle={localJob.title}
      />
    </div>
  );
};

export default MissionDetailView;
