import React, { useState } from "react";
import { ResumeTemplate } from "./ResumeTemplate";
import { UserProfile } from "../../services/activity/profile";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({ isOpen, onClose, profile }) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    const element = document.getElementById("resume-content");
    if (!element) return;

    setDownloading(true);
    try {
      // Capture the element as a canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: "#030014",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [canvas.width * 0.75, canvas.height * 0.75], // Convert to points
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width * 0.75, canvas.height * 0.75);
      const filename = `${profile.username.replace("@", "")}_trackcodex.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-full bg-gh-bg border border-gh-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 scale-in-center animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gh-border bg-gh-bg-secondary">
          <div className="flex items-center gap-4">
             <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <span className="material-symbols-outlined">description</span>
             </div>
             <div>
               <h2 className="text-xl font-bold text-white leading-none">Resume Preview</h2>
               <p className="text-xs text-gh-text-secondary mt-1">Generated from your TrackCodex vault info</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(139,92,246,0.3)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined !text-[18px]">
                {downloading ? "downloading" : "download"}
              </span>
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="size-10 flex items-center justify-center bg-gh-bg border border-gh-border rounded-full hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar bg-gh-bg-tertiary">
          <div className="transform origin-top scale-[0.9] md:scale-100">
             <ResumeTemplate profile={profile} isEditable={true} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-[#0A0A0A] border-t border-gh-border text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              💡 <strong>Pro Tip:</strong> This resume includes your verified TrackCodex metrics, GitHub contributions, and verified job history.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;
