import React, { useState } from "react";
import { Download, Shield, Database, FileJson, AlertTriangle } from "lucide-react";
import { apiInstance } from "../../services/infra/api";

const DataManagementView: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            // Use the existing export endpoint
            const response = await apiInstance.get("/users/me/export", {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `trackcodex-data-export-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data. Please try again later.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gh-text flex items-center gap-2">
                    <Database className="text-primary" /> Data & Privacy
                </h2>
                <p className="text-gh-text-secondary mt-1">
                    Manage your personal data, exports, and account privacy settings.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Export Data Section */}
                <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6 hover:border-primary/30 transition-all group">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <FileJson size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gh-text">Export Your Data</h3>
                                <p className="text-gh-text-secondary text-sm mt-1 max-w-md">
                                    Download a copy of all your TrackCodex data, including repositories, posts, comments, and profile information in JSON format.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="btn-glow bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            {isExporting ? (
                                <span className="animate-spin text-lg">sync</span>
                            ) : (
                                <Download size={18} />
                            )}
                            {isExporting ? "Exporting..." : "Export Data"}
                        </button>
                    </div>
                </div>

                {/* Asset Management */}
                <div className="bg-gh-bg-secondary border border-gh-border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gh-text flex items-center gap-2 mb-4">
                        <Shield size={20} className="text-emerald-500" /> Security & Assets
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gh-bg rounded-lg border border-gh-border">
                            <div>
                                <p className="font-bold text-sm">Active Sessions</p>
                                <p className="text-xs text-gh-text-secondary mt-1">Review and manage your active logins across devices.</p>
                            </div>
                            <button className="text-sm font-bold text-primary hover:underline">View All</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gh-bg rounded-lg border border-gh-border">
                            <div>
                                <p className="font-bold text-sm">Uploaded Assets</p>
                                <p className="text-xs text-gh-text-secondary mt-1">Manage resumes, portfolio items, and media uploads.</p>
                            </div>
                            <button className="text-sm font-bold text-primary hover:underline">Manage</button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-gh-bg-secondary/50 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} /> Danger Zone
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm text-gh-text">Delete account</p>
                            <p className="text-xs text-gh-text-secondary mt-1">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                        </div>
                        <button className="px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-all">
                            Delete your account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementView;
