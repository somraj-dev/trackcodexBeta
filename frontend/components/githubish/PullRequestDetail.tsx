import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GitPullRequest, GitMerge, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PullRequestDetail() {
    const { repoId, prId } = useParams();
    const [pr, setPr] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getSessionToken } = useAuth();

    useEffect(() => {
        const fetchPR = async () => {
            setLoading(true);
            try {
                const token = getSessionToken();
                const res = await fetch(`/api/v1/github/pull-requests/${prId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setPr(await res.json());
                else setError("Failed to load PR details.");
            } catch (err) {
                setError("Network error fetching PR.");
            } finally {
                setLoading(false);
            }
        };
        fetchPR();
    }, [prId]);

    const handleMerge = async () => {
        setMerging(true);
        setError(null);
        try {
            const token = getSessionToken();
            const res = await fetch(`/api/v1/github/pull-requests/${prId}/merge`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setPr({ ...pr, status: 'MERGED' });
            } else {
                setError(data.error || "Merge failed due to conflicts.");
            }
        } catch (err) {
            setError("Network error during merge.");
        } finally {
            setMerging(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Pull Request...</div>;
    if (!pr) return <div className="p-8 text-center text-red-500">{error || "Pull Request not found."}</div>;

    const isMerged = pr.status === 'MERGED';
    const isOpen = pr.status === 'OPEN';

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white mb-2">
                            {pr.title} <span className="text-gray-400 font-normal">#{pr.number}</span>
                        </h1>
                        <div className="flex items-center gap-3 text-sm flex-wrap text-gray-600 dark:text-gray-400">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${isMerged ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800' : isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-100 text-red-700 dark:border-red-200 border'}`}>
                                {isMerged ? <GitMerge className="w-4 h-4" /> : <GitPullRequest className="w-4 h-4" />}
                                {isMerged ? 'Merged' : isOpen ? 'Open' : 'Closed'}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">user</span>
                            <span>wants to merge into</span>
                            <span className="font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-100 dark:border-blue-800">{pr.base}</span>
                            <span>from</span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">{pr.head}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Merge Box */}
            <div className="bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className={`p-4 border-b ${isOpen ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/50' : isMerged ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-900/50' : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`mt-0.5 p-1.5 rounded-full ${isOpen ? 'bg-green-100 text-green-600 dark:bg-green-800/50' : 'bg-purple-100 text-purple-600 dark:bg-purple-800/50'}`}>
                            {isMerged ? <GitMerge className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                {isMerged ? 'Pull request successfully merged and closed' : isOpen ? 'This branch has no conflicts with the base branch' : 'Pull request is closed'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {isMerged ? "You're all set—the PR was merged into the base branch." : isOpen ? "Merging can be performed automatically." : ""}
                            </p>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-md text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {isOpen && (
                                <button 
                                    onClick={handleMerge}
                                    disabled={merging}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-md shadow-sm transition-colors text-sm flex items-center gap-2"
                                >
                                    <GitMerge className="w-4 h-4" />
                                    {merging ? 'Merging...' : 'Merge pull request'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Diff View */}
            <div className="bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1c23] flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Files Changed</h2>
                </div>
                <div className="p-0 overflow-x-auto">
                    {pr.diff ? (
                        <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-300 w-full min-w-max">
                            {pr.diff.split('\n').map((line: string, i: number) => {
                                let className = "";
                                if (line.startsWith('+') && !line.startsWith('+++')) className = "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 block px-2";
                                else if (line.startsWith('-') && !line.startsWith('---')) className = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 block px-2";
                                else if (line.startsWith('@@')) className = "text-blue-500 bg-blue-50 dark:bg-blue-900/20 block p-2 my-2 rounded font-semibold";
                                
                                return <span key={i} className={className || "block px-2"}>{line}</span>;
                            })}
                        </pre>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No diff available or exact same files.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
