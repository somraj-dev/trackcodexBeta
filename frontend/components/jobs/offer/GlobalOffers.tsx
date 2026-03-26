import React, { useState, useEffect } from "react";
import { jobOfferService } from "../../../services/hiring/jobOfferService";
import JobAcceptanceModal from "./JobAcceptanceModal";
import { Job } from "../../../types/job";

export const GlobalOffers: React.FC = () => {
  const [viewingOffer, setViewingOffer] = useState<Job | null>(null);

  useEffect(() => {
    const handleViewOffer = (e: CustomEvent<{ jobId: string }>) => {
      const { jobId } = e.detail;
      const jobs = jobOfferService.getOfferedJobs();
      const job = jobs.find((j: Job) => j.id === jobId);
      if (job) {
        setViewingOffer(job);
      }
    };

    window.addEventListener("trackcodex-view-offer", handleViewOffer as EventListener);
    return () => window.removeEventListener("trackcodex-view-offer", handleViewOffer as EventListener);
  }, []);

  if (!viewingOffer) return null;

  return (
    <JobAcceptanceModal
      isOpen={true}
      onClose={() => setViewingOffer(null)}
      offer={viewingOffer}
    />
  );
};
