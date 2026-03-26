import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Folder, FileCode, Box, GitBranch } from 'lucide-react';
import { gitOpsService } from '../../services/git/gitOperationsService';

interface TreeEntry {
    type: string;
    path: string;
    name: string;
    children?: TreeEntry[];
}

export 
function RepoTree() {
    const { repoId } = useParams();
    const [tree, setTree] = useState<TreeEntry[]>([]);
    const [branch, setBranch] = useState("master");
    const [branches, setBranches] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!repoId) return;
            setLoading(true);
            try {
                const branchData = await gitOpsService.getBranches(repoId);
                setBranches(branchData.branches || ["master"]);

                const treeData = await gitOpsService.getTree(repoId, branch);
                
                // Transform native TreeEntry (type: "dir"|"file") to the component's format (type: "tree"|"blob") if needed
                // The native service returns 'dir' and 'file'. Let's map it so the component renders it properly.
                const formattedTree = (treeData.tree || []).map((node: any) => ({
                    ...node,
                    type: node.type === 'dir' ? 'tree' : 'blob'
                }));
                
                setTree(formattedTree);
            } catch (err) {
                console.error("Failed to load repo data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [repoId, branch]);

    const renderNode = (node: TreeEntry) => (
        <div key={node.path} className="ml-4 py-1">
            {node.type === 'tree' ? (
                <div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                        <Folder className="w-4 h-4 mr-2 text-blue-500" />
                        {node.name}
                    </div>
                    <div>{node.children?.map(renderNode)}</div>
                </div>
            ) : (
                <div className="flex items-center text-sm font-mono text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                    <FileCode className="w-4 h-4 mr-2 text-gray-500" />
                    <Link to={`/github/${repoId}/blob/${encodeURIComponent(branch)}/${encodeURIComponent(node.path)}`} className="truncate">
                        {node.name}
                    </Link>
                </div>
            )}
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Repository Explorer...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 w-full">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
               <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                   <Box className="w-5 h-5" /> 
                   Files
               </h2>
               <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-md px-3 py-1.5 border border-gray-200 dark:border-gray-700">
                    <GitBranch className="w-4 h-4 text-gray-500 mr-2" />
                    <select 
                        value={branch} 
                        onChange={(e) => setBranch(e.target.value)}
                        className="bg-transparent border-none text-sm outline-none text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
               </div>
            </div>
            {tree.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No files found or empty repository.</div>
            ) : (
                <div className="overflow-auto max-h-[600px] bg-slate-50 dark:bg-slate-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                    {tree.map(renderNode)}
                </div>
            )}
        </div>
    );
}
