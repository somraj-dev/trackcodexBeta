import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MOCK_JOBS } from "../../constants";
import { Job } from "../../types";
import JobRatingModal from "../../components/jobs/JobRatingModal";
import { directMessageBus } from "../../services/social/directMessageBus";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../services/infra/api";

const MissionDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [localJob, setLocalJob] = useState<Job | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!id) return;

    // Check local mocks first for immediate display (Search results mainly return mocks)
    const localMock = MOCK_JOBS.find((j) => j.id === id);
    if (localMock) {
      setLocalJob(localMock as Job);
      return;
    }

    api.get(`/jobs/${id}`)
      .then((data: any) => {
        setLocalJob(data);
      })
      .catch((err) => {
        console.warn("Failed to fetch job", err);
      });
  }, [id]);

  if (!localJob)
    return (
      <div className="p-8 text-center text-slate-400">Mission not found.</div>
    );

  const handleStartWork = () => navigate(`/workspace/${localJob.repoId}`);
  const handleMessageClient = () => {
    directMessageBus.openChat({
      id: localJob.creator.name.replace(/\s+/g, "").toLowerCase(),
      name: localJob.creator.name,
      avatar: localJob.creator.avatar,
      context: `Mission: ${localJob.title}`,
    });
  };
  // Determine if current user is creator (Mock: assuming yes for demo or check against first user)
  // For 'Real', we should check auth context.
  // Assuming we are logged in as 'johndoe' (creator of many mock jobs) or similar.

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!localJob || !user) return;

    try {
      // Find the accepted applicant ID (or fallback to test user)
      const freelancerId = localJob.applications?.find((app: any) => app.status === 'Accepted')?.applicantId || "test-user-id-for-demo";

      await api.post(`/jobs/${localJob.id}/complete`, {
        rating,
        feedback,
        freelancerId,
      });

      // Refresh
      setLocalJob({ ...localJob, status: "Completed" }); // Optimistic update
      setIsRatingModalOpen(false);
      addNotification({
        type: "success",
        title: "Mission Completed",
        message: "Your feedback has been submitted.",
      } as any);
    } catch (e) {
      console.error("Failed to complete job", e);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to mark mission as complete.",
      } as any);
    }
  };

  const isCompleted = localJob?.status === "Completed";
  const hasApplied = localJob?.applications?.some((app: any) => app.applicantId === user?.id) || false;
  const isCreator = localJob?.creator.name === user?.name || localJob?.creator.id === user?.id;

  return (
    <div className="p-10 max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16">
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-semibold text-gh-text-secondary uppercase tracking-widest">
                Mission Briefing
              </h2>
              {isCompleted && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                  COMPLETED
                </span>
              )}
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gh-text-secondary leading-relaxed font-medium">
              </p>
            </div>
          </section>
          <section>
            <h3 className="text-[11px] font-semibold text-gh-text-secondary uppercase tracking-widest mb-6">
              Required Capabilities
            </h3>
            <div className="flex flex-wrap gap-3">
              {localJob.techStack.map((skill) => (
                <span
                  key={skill}
                  className="px-5 py-2.5 bg-gh-bg border border-gh-border rounded-xl text-[13px] font-bold text-gh-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-10">
          <div className="p-8 rounded-3xl bg-gh-bg-secondary border border-gh-border shadow-2xl">
            <h3 className="text-[10px] font-semibold text-gh-text-secondary uppercase tracking-widest mb-8">
              Mission Value
            </h3>
            <div>
              <p className="text-2xl font-semibold text-gh-text tracking-tighter mb-1">
                {localJob.budget}
              </p>
              <p className="text-[11px] text-gh-text-secondary uppercase font-semibold tracking-widest">
                Total Contract Payout
              </p>
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-gh-bg-secondary border border-gh-border shadow-xl">
            <h3 className="text-[10px] font-semibold text-gh-text-secondary uppercase tracking-widest mb-8">
              Contracting Client
            </h3>
            <div className="flex items-center gap-5 mb-8">
              <img
                src={localJob.creator.avatar}
                className="size-16 rounded-2xl border-2 border-primary/20 object-cover"
                alt="Client"
              />
              <div>
                <p className="text-sm font-semibold text-gh-text leading-tight uppercase">
                  {localJob.creator.name}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleMessageClient}
                className="flex-1 py-3 bg-gh-bg border border-gh-border text-gh-text-secondary hover:text-gh-text rounded-xl text-[10px] font-medium uppercase transition-colors"
              >
                Send DM
              </button>
              <button className="flex-1 py-3 bg-gh-bg border border-gh-border text-gh-text-secondary hover:text-gh-text rounded-xl text-[10px] font-medium uppercase transition-colors">
                Profile
              </button>
            </div>

            {/* Financial Actions (Escrow) */}
            {localJob.status === "Open" && !isCreator && (
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    if (!user) {
                      alert("Please login to apply");
                      return;
                    }
                    if (hasApplied) {
                      addNotification({ type: "info", title: "Already Applied", message: "You have already applied for this mission." } as any);
                      return;
                    }
                    try {
                      await api.post(`/jobs/${localJob.id}/apply`, { applicantId: user.id });
                      addNotification({ type: "success", title: "Application Sent!", message: "Your application has been submitted successfully." } as any);
                      // Optimistic Update
                      setLocalJob({
                        ...localJob,
                        applications: [...(localJob.applications || []), { applicantId: user.id, status: 'Pending' }]
                      } as any);
                    } catch (err) {
                      console.error(err);
                      addNotification({ type: "error", title: "Application Failed", message: "Could not submit application." } as any);
                    }
                  }}
                  disabled={hasApplied}
                  className={`w-full mt-4 py-3 rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all shadow-lg ${hasApplied ? 'bg-gh-bg-tertiary text-gh-text-secondary cursor-not-allowed shadow-none' : 'bg-primary text-gh-bg shadow-primary/20 hover:opacity-90'}`}
                >
                  {hasApplied ? "Application Submitted" : "Apply for Mission"}
                </button>
              </div>
            )}

            {localJob.status === "Open" && isCreator && (
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    if (!confirm(`Fund ${localJob.budget} for this mission?`))
                      return;
                    try {
                      await api.post(`/jobs/${localJob.id}/fund`, {});
                      addNotification({ type: "success", title: "Funds Secured", message: "Funds have been placed into Escrow." } as any);
                      // Mock update status for UI
                      setLocalJob({ ...localJob, status: "In Progress" });
                    } catch (err) {
                      addNotification({ type: "error", title: "Funding Failed", message: "Failed to secure funds. Please check wallet balance." } as any);
                    }
                  }}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  Secure Funding (Escrow)
                </button>
              </div>
            )}

            {localJob.status === "In Progress" && isCreator && (
              <button
                onClick={async () => {
                  try {
                    const freelancerId = localJob.applications?.find((app: any) => app.status === 'Accepted')?.applicantId || "test-user-id-for-demo";
                    await api.post(`/jobs/${localJob.id}/release`, { freelancerId });
                    addNotification({ type: "success", title: "Payment Released", message: "Funds released to the freelancer." } as any);

                    // Proceed to rating after release
                    setIsRatingModalOpen(true);
                  } catch (err) {
                    addNotification({ type: "error", title: "Release Failed", message: "Failed to release payment." } as any);
                  }
                }}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
              >
                <span className="material-symbols-outlined text-sm align-bottom mr-2">
                  payments
                </span>
                Release Payment & Complete
              </button>
            )}

            {/* Complete Job Action (Fallback if not going through Escrow flow) */}
            {!isCompleted && isCreator && localJob.status !== 'In Progress' && (
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-medium uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
              >
                Mark Complete & Rate
              </button>
            )}
          </div>
        </aside>
      </div>
      <JobRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default MissionDetailView;


