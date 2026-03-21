import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Job } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, job }) => {
  const { addNotification } = useNotifications();
  
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/marketplace/missions/${job.id}`;
  const orgName = job.creator?.name || "Organisation";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-start gap-4 mb-8">
          <div className="size-16 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-50 flex items-center justify-center">
            {job.creator?.avatar ? (
              <img src={job.creator.avatar} alt="Org Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-slate-300 text-[32px]">corporate_fare</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-[20px] font-bold text-slate-900 leading-tight mb-1 truncate">
              {job.title}
            </h3>
            <p className="text-[14px] font-bold text-slate-500 uppercase tracking-wide truncate">
              {orgName}
            </p>
          </div>
        </div>

        <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-6">Share with</p>
        
        <div className="flex items-center justify-between gap-2">
          <button 
            title="X (formerly Twitter)"
            className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-all shadow-md group"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this mission: ${job.title}&url=${shareUrl}`, '_blank')}
          >
            <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
          
          <button 
            title="WhatsApp"
            className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center hover:scale-110 transition-all shadow-md group"
            onClick={() => window.open(`https://wa.me/?text=Check out this mission: ${job.title} ${shareUrl}`, '_blank')}
          >
            <svg className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.821 7.454c-1.679 1.68-4.4 1.68-6.08 0-1.68-1.679-1.68-4.401 0-6.08 1.68-1.679 4.401-1.679 6.08 0 1.68 1.679 1.68 4.401 0 6.08m6.726-17.212C14.154-1.05 6.44-1.05 1.213 4.177c-5.226 5.226-5.226 12.94 0 18.166l.001.001c4.545 4.545 11.536 5.122 16.712 1.731l4.085 1.071c.42.112.822-.29.71-.71l-1.071-4.085c3.391-5.176 2.814-12.167-1.731-16.712-.001-.001-.001-.001-.001-.001"/></svg>
          </button>

          <button 
            title="LinkedIn"
            className="w-12 h-12 rounded-full bg-[#0077b5] flex items-center justify-center hover:scale-110 transition-all shadow-md group"
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank')}
          >
            <svg className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.2 0-2.3.7-2.7 1.6v-1.2H10.5v7.6h2.6v-4.2a1.3 1.3 0 0 1 1.3-1.3 1.3 1.3 0 0 1 1.3 1.3v4.2h2.6M6.2 10.5h2.6v7.6H6.2v-7.6M7.5 6.2a1.4 1.4 0 0 0-1.4 1.4 1.4 1.4 0 0 0 1.4 1.4 1.4 1.4 0 0 0 1.4-1.4 1.4 1.4 0 0 0-1.4-1.4"/></svg>
          </button>

          <button 
            title="Email"
            className="w-12 h-12 rounded-full bg-[#ea4335] flex items-center justify-center hover:scale-110 transition-all shadow-md group"
            onClick={() => window.open(`mailto:?subject=Check out this mission: ${job.title}&body=Check out this mission on TrackCodex: ${shareUrl}`, '_blank')}
          >
            <span className="material-symbols-outlined text-white text-[24px] group-hover:scale-110 transition-transform">mail</span>
          </button>

          <button 
            title="Copy Link"
            className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:scale-110 transition-all shadow-md hover:bg-slate-50 group"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              addNotification({ type: 'success', title: 'Link Copied', message: 'Mission link copied to clipboard!' } as any);
              onClose();
            }}
          >
            <span className="material-symbols-outlined text-slate-700 text-[22px] group-hover:scale-110 transition-transform">content_copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
