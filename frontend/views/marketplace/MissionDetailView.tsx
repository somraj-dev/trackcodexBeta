import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Job } from "../../types";
import JobRatingModal from "../../components/jobs/JobRatingModal";
import ShareModal from "../../components/modals/ShareModal";
import { directMessageBus } from "../../services/social/directMessageBus";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/infra/api";
import { format } from "date-fns";
import { MOCK_JOBS } from "../../constants";

/* ───── Unstop-style section header with blue accent bar ───── */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[17px] font-bold text-slate-800 mb-4 flex items-center">
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-lg">
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ─── breadcrumb ─── */}
      <div className="max-w-[850px] mx-auto px-4 pt-5 pb-2 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
        <span className="material-symbols-outlined text-[14px]">home</span>
        <span>/</span>
        <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate("/marketplace")}>Hackathon</span>
        <span>/</span>
        <span className="font-bold text-slate-700 truncate max-w-[200px]">{localJob.title}</span>
      </div>

      {/* ════════════════════════════════════════════════════════════
          HERO CARD — white card with badge, title, org, location
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-white shadow-sm border border-slate-200 overflow-hidden">

        {/* top row: ONLINE badge + action icons */}
        <div className="flex justify-between items-center px-6 pt-5 pb-2">
          <div className="flex items-center gap-1.5 bg-red-50 text-red-500 border border-red-100 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm">
            <span className="material-symbols-outlined text-[10px] font-bold">
              {metadata.participationType === "Offline" ? "location_off" : "wifi"}
            </span>
            {metadata.participationType === "Offline" ? "Offline" : "Online"}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
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
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-snug mb-0.5">
              {localJob.title}
            </h1>
            <p className="text-[14px] font-bold text-slate-500 tracking-wider uppercase mb-6">
              {orgName}
            </p>

            {/* location + team size row */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 flex justify-center text-slate-400 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-800 leading-none mb-1">Location</p>
                  <p className="text-[13px] text-slate-500">
                    {metadata.participationType === "Offline" ? "On Campus, TBD" : "Global / Remote"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 flex justify-center text-slate-400 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-800 leading-none mb-1">Team Size</p>
                  <p className="text-[13px] text-slate-500">
                    1 - {metadata.registrationLimit || 1} Members
                  </p>
                </div>
              </div>
            </div>

            {/* tag */}
            <div className="mt-6">
              <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded min-w-[60px] justify-center items-center">
                Others
              </span>
            </div>
          </div>

          {/* org logo on right */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border border-slate-200 p-2 shrink-0 flex items-center justify-center bg-white shadow-sm overflow-hidden mt-2 mr-2">
            <img src={localJob.creator?.avatar || "https://github.com/shadcn.png"} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          BODY — each section sits inside the same 850 px column
          ════════════════════════════════════════════════════════════ */}
      <div className="max-w-[850px] w-full mx-auto bg-white border-l border-r border-slate-200 p-8 space-y-12">

        {/* ── Eligibility ── */}
        {metadata.allowedRegister && metadata.allowedRegister.length > 0 && (
          <div>
            <SectionTitle>Eligibility</SectionTitle>
            <div className="text-[13px] text-slate-600 font-medium px-4">
              {metadata.allowedRegister.join("  •  ")}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        <div>
          <SectionTitle>All that you need to know about {localJob.title}</SectionTitle>
          <div className="text-[14px] text-slate-600 whitespace-pre-wrap leading-relaxed px-4">
            {description}
          </div>
        </div>

        {/* ── Important dates & deadlines ── */}
        {(metadata.startDate || metadata.endDate) && (
          <div>
            <SectionTitle>Important dates & deadlines</SectionTitle>
            <div className="px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {metadata.startDate && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col gap-1 items-start">
                  <div className="text-blue-600 bg-blue-100 rounded-lg w-9 h-9 flex items-center justify-center shrink-0 mb-1">
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  </div>
                  <p className="text-[13px] font-black text-slate-800 leading-tight">{fmt(metadata.startDate)}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Start Date</p>
                </div>
              )}
              {metadata.endDate && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col gap-1 items-start">
                  <div className="text-white bg-blue-600 rounded-lg w-9 h-9 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">av_timer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full">1</div>
                    <p className="text-[13px] font-black text-slate-800 leading-tight">{fmt(metadata.endDate)}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium ml-1">Registration Deadline</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contact the organisers ── */}
        <div>
          <SectionTitle>Contact the organisers</SectionTitle>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-[13px] shrink-0">
                {(localJob.creator?.name || "O").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-[13px] font-bold text-slate-800 truncate leading-snug">{localJob.creator?.name || "Organizer"}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 hover:text-blue-600 cursor-pointer transition-colors leading-snug">organizer@trackcodex.dev</p>
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
                className="w-8 h-8 rounded-md hover:bg-slate-200 flex items-center justify-center transition-colors"
                title="Message"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">chat_bubble_outline</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Download attachments ── */}
        <div>
          <SectionTitle>Download attachments</SectionTitle>
          <div className="px-4">
            <div className="inline-flex items-center justify-between min-w-[260px] bg-slate-50 border border-slate-100 rounded-lg p-3 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-blue-500 bg-blue-100/50 p-1 rounded">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <span className="text-[12px] font-bold text-slate-700">
                  {localJob.title.replace(/\s+/g, "_")}_details.pdf
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-slate-400 ml-3">download</span>
            </div>
          </div>
        </div>

        {/* ── Rewards and Prizes ── */}
        <div>
          <SectionTitle>Rewards and Prizes</SectionTitle>
          <div className="px-4">
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
              Winner, Achievement (Trophies) & Participation Certification & Overall Cash Prize is{" "}
              <span className="font-bold text-slate-800">{localJob.budget}</span>
            </p>
          </div>
        </div>

        {/* ── Related Opportunities ── */}
        <div>
          <SectionTitle>Related Opportunities</SectionTitle>
          <div className="px-4 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[200px] border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
              <div className="w-[45px] h-[45px] bg-slate-50 rounded border border-slate-200 flex items-center justify-center mb-4">
                <span className="font-bold text-slate-800 text-[10px]">IIMA</span>
              </div>
              <p className="text-[13px] font-bold text-slate-800 mb-0.5 line-clamp-1">AI Summer Residency</p>
              <p className="text-[11px] text-slate-500 truncate">IIMA Ventures</p>
            </div>
            <div className="min-w-[200px] border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
              <div className="w-[45px] h-[45px] bg-slate-100 rounded border border-slate-200 flex items-center justify-center mb-4 overflow-hidden p-1">
                <img src="https://github.com/shadcn.png" className="w-full h-full opacity-50 grayscale" alt="" />
              </div>
              <p className="text-[13px] font-bold text-slate-800 mb-0.5 line-clamp-1">Think Like a Compiler</p>
              <p className="text-[11px] text-slate-500 truncate">Malla Reddy College...</p>
            </div>
            <div className="min-w-[200px] border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
              <div className="w-[45px] h-[45px] bg-slate-100 rounded border border-slate-200 flex items-center justify-center mb-4 overflow-hidden p-1">
                <img src="https://github.com/shadcn.png" className="w-full h-full opacity-50 grayscale" alt="" />
              </div>
              <p className="text-[13px] font-bold text-slate-800 mb-0.5 line-clamp-1">Insomnia</p>
              <p className="text-[11px] text-slate-500 truncate">Visvesvaraya National Institu...</p>
            </div>
          </div>
        </div>

        {/* ── Feedback & Rating ── */}
        <div>
          <SectionTitle>Feedback & Rating</SectionTitle>
          <div className="px-4">
            <div
              className="bg-slate-50 border border-slate-100 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-100 cursor-pointer transition-colors"
              onClick={() => setIsRatingModalOpen(true)}
            >
              <span className="material-symbols-outlined text-slate-400 mb-2">edit_square</span>
              <p className="text-[13px] font-bold text-slate-800">Write a review</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Register for this opportunity to give your feedback and review.
              </p>
            </div>
          </div>
        </div>

        {/* ── Frequently Asked Questions / Discussions ── */}
        <div>
          <SectionTitle>Frequently Asked Questions/Discussions</SectionTitle>
          <div className="px-4 space-y-4">
            <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center pb-8 border border-slate-100">
              <span className="material-symbols-outlined text-slate-400 text-3xl mb-1 mt-2">forum</span>
              <p className="text-[12px] font-bold text-slate-700">No post yet! Start a new discussion.</p>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <textarea
                placeholder="Ask a question (be specific)"
                className="w-full p-4 h-[85px] outline-none resize-none text-[13px] text-slate-800 placeholder-slate-400 bg-white"
              />
              <div className="bg-white border-t border-slate-100 p-3 py-2 flex justify-end">
                <button className="px-6 py-1 border border-blue-600 text-blue-600 rounded text-[13px] font-bold hover:bg-blue-50 transition-colors">
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Banner ad (visual parity with Unstop) ── */}
        <div className="w-full mt-8 rounded-xl overflow-hidden cursor-pointer relative shadow-sm border border-indigo-100">
          <div className="w-full h-[110px] bg-indigo-50 flex flex-col justify-center px-10 relative overflow-hidden text-left">
            <div className="z-10 relative">
              <h2 className="text-[20px] font-black text-indigo-900 tracking-tight leading-none mb-1">
                TrackCodex PRO
              </h2>
              <p className="text-[11px] text-indigo-800 font-semibold mb-3 max-w-[250px] leading-snug">
                Exclusive mentorship, certification prep & more...
              </p>
              <button className="bg-indigo-900 text-white rounded-full px-5 py-1.5 text-[10px] font-bold hover:bg-indigo-800 shadow-xl">
                Go Pro Now
              </button>
            </div>
          </div>
        </div>

        {/* ── TrackCodex Mission Actions ── */}
        <div className="px-4 py-6 mt-2 flex justify-center border-t border-slate-200 pt-8">
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
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
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
              className="max-w-xs w-full py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-[13px] font-bold uppercase tracking-wide transition-all"
            >
              Mark Complete & Rate
            </button>
          )}
        </div>
      </div>

      {/* ═══════ footer info ═══════ */}
      <div className="max-w-[850px] w-full mx-auto bg-slate-50 border border-t-0 border-slate-200 p-6 pt-5 flex items-start gap-4 text-[10px] text-slate-500 font-medium md:rounded-b-2xl mb-8">
        <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5 shrink-0">info</span>
        <div className="leading-relaxed">
          <p>
            Updated On: <span className="text-slate-700 font-bold">{fmt(localJob.updatedAt)}</span>
          </p>
          <p className="mt-1">The data on this page gets updated in every 15 minutes.</p>
          <p className="mt-2 text-[9px] text-slate-400">
            This opportunity has been listed by <span className="uppercase text-slate-600">{orgName}</span>.
            TrackCodex is not liable for any content mentioned in this opportunity or the process followed by
            the organisers for this opportunity. However, please raise a complaint if you want TrackCodex to
            look into the matter.
          </p>
          <div className="mt-4 space-y-1">
            <p className="text-blue-500 cursor-pointer flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-[14px]">flag</span> Raise a Complaint
            </p>
            <p className="text-red-500 cursor-pointer flex items-center gap-1 hover:underline">
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
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-[20px] font-bold text-slate-900 mb-2">How was your experience?</h3>
            <p className="text-slate-500 mb-6 text-[14px]">Please rate the organizer and provide your feedback.</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="material-symbols-outlined text-[32px] text-amber-400 cursor-pointer hover:scale-110 transition-transform">star</span>
              ))}
            </div>

            <textarea 
              placeholder="Write your feedback here..."
              className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none text-[14px] mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsRatingModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
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
    </div>
  );
};

export default MissionDetailView;
