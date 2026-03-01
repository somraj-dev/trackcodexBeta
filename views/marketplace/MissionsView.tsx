import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import JobCard from '../../components/jobs/JobCard';
import PostJobModal from '../../components/jobs/PostJobModal';
import { cacheService } from '../../services/cacheService';

const MissionsView = () => {
  const navigate = useNavigate();
  const [localJobs, setLocalJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Jobs from Real Backend with Cache
  useEffect(() => {
    cacheService.getOrFetch('missions_list', async () => {
      const res = await fetch('http://localhost:4000/api/v1/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }).then(data => {
      setLocalJobs(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch jobs", err);
      // Fallback to mock data if backend fails during development
      import('../../constants').then(module => {
        setLocalJobs(module.MOCK_JOBS);
      });
      setLoading(false);
    });
  }, []);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);

  useEffect(() => {
    const draft = localStorage.getItem('pending_job_draft');
    if (draft) {
      setDraftData(JSON.parse(draft));
      setIsPostModalOpen(true);
      localStorage.removeItem('pending_job_draft');
    }
  }, []);

  const handlePostJob = async (newJobData: Partial<Job>) => {
    // Real Post to Backend
    try {
      const res = await fetch('http://localhost:4000/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobData)
      });
      const createdJob = await res.json();
      setLocalJobs(prev => [createdJob, ...prev]);
      setIsPostModalOpen(false);
    } catch (e) {
      console.error("Failed to create job", e);
    }
  };

  const displayJobs = localJobs.filter(job => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const matchTitle = job.title?.toLowerCase().includes(lowerQuery);
    const matchCompany = job.creator?.name?.toLowerCase().includes(lowerQuery);
    const matchSkill = job.techStack?.some(skill => skill.toLowerCase().includes(lowerQuery));
    return matchTitle || matchCompany || matchSkill;
  });

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary">search</span>
            <input
              className="bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-3 text-sm text-white focus:ring-1 focus:ring-primary w-96 outline-none transition-all duration-300"
              placeholder="Search missions by title, skill, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/30"
          >
            Create New Mission
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center">
              <span className="material-symbols-outlined animate-spin text-3xl mb-4 text-primary">autorenew</span>
              <p>Loading active missions...</p>
            </div>
          ) : displayJobs.length > 0 ? (
            displayJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => navigate(`/marketplace/missions/${job.id}`)} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
              <h3 className="text-lg font-bold text-gh-text mb-2">No missions found.</h3>
              <p className="text-sm">Try adjusting your search criteria or explore other categories.</p>
            </div>
          )}
        </div>
      </div>
      <PostJobModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handlePostJob}
        initialData={draftData}
      />
    </div>
  );
};

export default MissionsView;
