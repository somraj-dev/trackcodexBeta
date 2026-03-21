import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../context/AuthContext";

const MyApplicationsView = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await api.get('/jobs/applications/me');
                if (response.data.success) {
                    setApplications(response.data.applications);
                }
            } catch (err) {
                console.error("Failed to fetch applications:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    return (
        <div className="p-10 max-w-[1200px] mx-auto text-gh-text">
            <h1 className="text-xl font-semibold mb-2 tracking-tight">My Applications</h1>
            <p className="text-slate-500 font-medium mb-10">Track the status of your active proposals.</p>

            {loading ? (
                <div className="text-gh-text-secondary">Loading...</div>
            ) : (
                <div className="bg-gh-bg-secondary border border-gh-border rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gh-bg text-gh-text-secondary font-medium uppercase text-xs">
                            <tr>
                                <th className="p-4 pl-6">Mission</th>
                                <th className="p-4">Applied</th>
                                <th className="p-4">Budget</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gh-border">
                            {applications.length > 0 ? applications.map(app => (
                                <tr key={app.id} className="hover:bg-gh-bg-tertiary transition-colors group">
                                    <td className="p-4 pl-6 font-bold text-gh-text group-hover:text-blue-400 cursor-pointer" onClick={() => navigate(`/marketplace/missions/${app.jobId}`)}>
                                        {app.job?.title || 'Unknown Mission'}
                                    </td>
                                    <td className="p-4 text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono text-slate-300">${app.bidAmount}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${app.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-500' :
                                                app.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                                                    app.status === 'INTERVIEW' ? 'bg-amber-500/20 text-amber-500' :
                                                        'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => navigate(`/marketplace/missions/${app.jobId}`)} className="text-slate-500 hover:text-white font-bold text-xs">View Details</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No applications found. Start applying to missions!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyApplicationsView;


