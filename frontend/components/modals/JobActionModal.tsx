import React, { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";

interface JobActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  options: string[];
  jobTitle: string;
}

const JobActionModal: React.FC<JobActionModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  options, 
  jobTitle 
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const { addNotification } = useNotifications();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    // Simulation of submission
    console.log("Submitting job action:", { title, selectedOption, details, jobTitle });
    
    addNotification({
      type: "success",
      title: "Success",
      message: `${title} has been submitted successfully.`
    });
    
    // Reset and close
    setSelectedOption(null);
    setDetails("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[500px] bg-gh-bg border border-gh-border rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gh-border">
          <h2 className="text-[18px] font-bold text-gh-text">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gh-text-secondary hover:text-gh-text p-1 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-[14px] font-medium text-gh-text-secondary">{subtitle}</p>
            
            <div className="space-y-3">
              {options.map((option) => (
                <label 
                  key={option}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="radio" 
                      name="job-action-option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={() => setSelectedOption(option)}
                      className="peer h-5 w-5 appearance-none rounded-full border border-gh-border bg-gh-bg checked:border-blue-600 checked:border-[5px] transition-all cursor-pointer"
                    />
                  </div>
                  <span className={`text-[13px] font-medium transition-colors ${selectedOption === option ? 'text-gh-text' : 'text-gh-text-secondary group-hover:text-gh-text'}`}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full min-h-[120px] bg-gh-bg-secondary border border-gh-border rounded-xl p-4 text-[13px] text-gh-text placeholder:text-gh-text-secondary/50 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Footer Action */}
          <button 
            type="submit"
            disabled={!selectedOption}
            className={`w-full py-4 rounded-full text-[14px] font-black uppercase tracking-widest transition-all ${
              selectedOption 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95 hover:bg-blue-700' 
                : 'bg-gh-bg-secondary text-gh-text-secondary/30 cursor-not-allowed border border-gh-border shadow-inner'
            }`}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobActionModal;
