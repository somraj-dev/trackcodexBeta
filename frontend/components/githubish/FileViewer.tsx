import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileCode, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// We use a simple pre tag for rendering initially, can upgrade to react-syntax-highlighter
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import darcula from 'react-syntax-highlighter/dist/esm/styles/hljs/darcula';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('json', json);

export function FileViewer() {
    const { repoId, branch = 'master', '*': filePath } = useParams();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { getSessionToken } = useAuth();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchFile = async () => {
            setLoading(true);
            try {
                const token = getSessionToken();
                const res = await fetch(`/api/v1/github/${repoId}/blob?branch=${encodeURIComponent(branch)}&filepath=${encodeURIComponent(filePath || '')}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const text = await res.text();
                    setContent(text);
                } else {
                    setContent(`Error fetching file: ${res.statusText}`);
                }
            } catch (err) {
                console.error(err);
                setContent("Communication Error.");
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [repoId, branch, filePath]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading file content...</div>;

    const extension = filePath?.split('.').pop()?.toLowerCase();
    const isCode = ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'sql', 'md'].includes(extension || '');

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link to={`/github/${repoId}`} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500 mb-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center font-mono text-sm">
                        <span className="text-gray-400 dark:text-gray-500">{branch} / </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1 truncate max-w-[300px]">{filePath}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white dark:bg-gray-900 border border-gray-200 shadow-sm rounded-md hover:bg-gray-50 transition-colors">
                        {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`} download={filePath?.split('/').pop()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 shadow-sm rounded-md hover:bg-blue-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-[#1e1e1e] shadow-sm">
                {isCode ? (
                    <SyntaxHighlighter 
                        language={extension === 'js' || extension === 'jsx' ? 'javascript' : extension === 'ts' || extension === 'tsx' ? 'typescript' : extension}
                        style={document.documentElement.classList.contains('dark') ? darcula : docco}
                        showLineNumbers
                        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                    >
                        {content}
                    </SyntaxHighlighter>
                ) : (
                    <pre className="p-6 text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">{content}</pre>
                )}
            </div>
        </div>
    );
}
