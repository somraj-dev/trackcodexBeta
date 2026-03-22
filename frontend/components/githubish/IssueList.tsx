import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function IssueList() {
    const { repoId } = useParams();
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { getIdToken } = useAuth();

    useEffect(() => {
        const fetchIssues = async () => {
            setLoading(true);
            try {
                const token = await getIdToken();
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`/api/v1/github/${repoId}/issues`, { headers });
                if (res.ok) setIssues(await res.json());
            } catch (err) {
                console.error("Failed to fetch issues", err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, [repoId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading issues...</div>;

    return (
        <div className="bg-white dark:bg-[#1a1c23] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1c23] flex justify-between items-center rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-500" />
                    Issues
                </h2>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors text-sm">
                    New Issue
                </button>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {issues.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">There aren't any open issues.</div>
                ) : (
                    issues.map(issue => (
                        <div key={issue.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-start gap-3">
                            {issue.status === 'OPEN' ? (
                                <AlertCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <Link to={`/github/${repoId}/issues/${issue.id}`} className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 mb-1 block truncate">
                                    {issue.title}
                                </Link>
                                <div className="text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
                                    <span>#{issue.number}</span>
                                    <span>opened on {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    <span>by {issue.author?.username || 'user'}</span>
                                    {issue.labels && issue.labels.length > 0 && (
                                        <div className="flex items-center gap-1.5 ml-2">
                                            {issue.labels.map((lbl: any) => (
                                                <span key={lbl.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${lbl.color}20`, color: lbl.color, border: `1px solid ${lbl.color}40` }}>
                                                    {lbl.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center text-gray-400 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(issue.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
