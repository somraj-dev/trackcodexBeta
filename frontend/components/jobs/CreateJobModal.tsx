import React, { useState } from "react";
import { api } from "../../services/infra/api";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    type: "Full-time",
    techStack: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        type: formData.type as any, // Cast to fix type mismatch
        techStack: formData.techStack.split(",").map((s) => s.trim()).filter(Boolean),
      };

      await api.jobs.create(payload);
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        budget: "",
        type: "Full-time",
        techStack: "",
      });
    } catch (err: any) {
      console.error("Failed to create job:", err);
      setError(err.message || "Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl p-8 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gh-text tracking-tight">Post a New Opportunity</h2>
          <button onClick={onClose} className="text-gh-text-secondary hover:text-gh-text transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="job-title" className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">Job Title</label>
            <input
              id="job-title"
              required
              type="text"
              placeholder="e.g. Senior Backend Engineer (Node.js)"
              className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-gh-text focus:border-primary outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="job-budget" className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">Budget / Salary</label>
              <input
                id="job-budget"
                required
                type="text"
                placeholder="e.g. $120k - $160k"
                className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-gh-text focus:border-primary outline-none transition-all"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="job-type" className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">Job Type</label>
              <select
                id="job-type"
                title="Select job type"
                className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-gh-text focus:border-primary outline-none transition-all appearance-none"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Gig">Gig</option>
                <option value="Bounty">Bounty</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="job-description" className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">Description</label>
            <textarea
              id="job-description"
              required
              rows={4}
              placeholder="Tell us about the role, challenges, and what you're looking for..."
              className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-gh-text focus:border-primary outline-none transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="job-tech-stack" className="text-xs font-bold text-gh-text-secondary uppercase tracking-widest">Tech Stack (comma separated)</label>
            <input
              id="job-tech-stack"
              required
              type="text"
              placeholder="React, Node.js, TypeScript, PostgreSQL"
              className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-gh-text focus:border-primary outline-none transition-all"
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gh-bg border border-gh-border text-gh-text rounded-xl font-bold text-sm hover:bg-gh-bg-tertiary transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  Posting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  Post Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobModal;


