import { Job } from "../../types";
import { profileService } from "../activity/profile";

const JOB_STORAGE_KEY = "trackcodex_offered_jobs";

export const jobOfferService = {
  createOffer(jobData: Partial<Job>) {
    const jobs = this.getOfferedJobs();
    const currentUser = profileService.getProfile();

    const newJob: Job = {
      id: `job-offer-${Date.now()}`,
      title: jobData.title || "Untitled Offer",
      description: jobData.description || "",
      techStack: jobData.techStack || [],
      budget: jobData.budget || "$0",
      type: jobData.type || "Contract",
      status: "Pending",
      repoId: jobData.repoId || "trackcodex-backend",
      creator: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      postedDate: "Just now",
      targetUserId: jobData.targetUserId,
      personalNote: jobData.personalNote,
      offerDetails: jobData.offerDetails, // Persist rich offer details
    };

    const updatedJobs = [newJob, ...jobs];
    localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(updatedJobs));

    // Send a Direct Message to the recipient via API
    if (jobData.targetUserGuid) {
      import("../infra/api").then(({ api }) => {
        api.post<{ id: string }>("/messages/conversations", { targetUserId: jobData.targetUserGuid })
          .then(conv => {
            const offerPayload = {
              type: "JOB_OFFER",
              jobId: newJob.id,
              title: newJob.title,
              salary: newJob.budget,
              from: currentUser.name
            };
            return api.post(`/messages/conversations/${conv.id}/messages`, { 
              content: `TRACKCODEX_OFFER_V1:${JSON.stringify(offerPayload)}` 
            });
          })
          .then(() => {
            // Also trigger backend notification (for Notification Box & Email)
            return api.post("/jobs/offer", {
              targetUserId: jobData.targetUserGuid,
              jobTitle: newJob.title,
              salary: newJob.budget,
              fromName: currentUser.name
            });
          })
          .catch(err => console.error("[JobOfferService] Failed to send notification suite", err));
      });
    }

    return newJob;
  },

  getOfferedJobs(): Job[] {
    const saved = localStorage.getItem(JOB_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },
};


