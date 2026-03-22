import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import JobCard from '../../components/jobs/JobCard';

import { cacheService } from '../../services/infra/cacheService';
import { api } from '../../services/infra/api';
import { MOCK_JOBS } from '../../constants';

const MissionsView = () => {
  const navigate = useNavigate();
  const [localJobs, setLocalJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Jobs from Real Backend with Cache
  useEffect(() => {
    cacheService.getOrFetch('missions_list', async () => {
      const data = await api.get<Job[]>('/jobs');
      return Array.isArray(data) ? data : [];
    }).then(data => {
      // Prioritize real jobs from database over mock jobs
      const realJobs = Array.isArray(data) ? data : [];
      const merged = [...realJobs, ...MOCK_JOBS];
      setLocalJobs(merged);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch jobs", err);
      setLocalJobs(MOCK_JOBS);
      setLoading(false);
    });
  }, []);



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
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gh-text-secondary text-lg group-focus-within:text-primary">search</span>
            <input
              className="bg-gh-bg-secondary border border-gh-border rounded-full pl-12 pr-6 py-3 text-sm text-gh-text focus:ring-1 focus:ring-primary w-96 outline-none transition-all duration-300"
              placeholder="Search missions by title, skill, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => navigate('/marketplace/missions/new')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-gh-bg rounded-xl font-medium uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/30"
          >
            Create New Mission
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gh-text-secondary flex flex-col items-center">
              <span className="material-symbols-outlined animate-spin text-3xl mb-4 text-primary">autorenew</span>
              <p>Loading active missions...</p>
            </div>
          ) : displayJobs.length > 0 ? (
            displayJobs.map(job => (
              <JobCard key={job.id} job={job} onClick={() => navigate(`/marketplace/missions/${job.id}`)} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gh-text-secondary border border-dashed border-gh-border rounded-2xl bg-gh-bg-secondary">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">search_off</span>
              <h3 className="text-lg font-bold text-gh-text mb-2">No missions found.</h3>
              <p className="text-sm">Try adjusting your search criteria or explore other categories.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MissionsView;


