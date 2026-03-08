
import React, { useState } from 'react';
import { socialService } from "../../services/social/socialService";

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await socialService.createPost(content, title);
      onPostCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A1B] border border-[#343536] w-full max-w-[750px] rounded-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-[#343536]">
          <h2 className="text-[#D7DADC] text-[16px] font-bold">Create a post</h2>
          <button onClick={onClose} className="text-[#818384] hover:text-[#D7DADC] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4">
          <input
            autoFocus
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1A1A1B] border border-[#343536] rounded-md px-4 py-2.5 text-[14px] text-[#D7DADC] placeholder-[#818384] focus:outline-none focus:border-[#D7DADC] mb-4 transition-colors"
          />
          <textarea
            placeholder="Text (optional)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#1A1A1B] border border-[#343536] rounded-md px-4 py-2.5 text-[14px] text-[#D7DADC] placeholder-[#818384] focus:outline-none focus:border-[#D7DADC] min-h-[120px] resize-y transition-colors mb-4"
          />

          <div className="flex gap-2 mb-4">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#343536] text-[#D7DADC] text-[12px] font-bold hover:bg-[#272729] transition-colors">
              <span className="material-symbols-outlined !text-[18px]">image</span>
              Images
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#343536] text-[#D7DADC] text-[12px] font-bold hover:bg-[#272729] transition-colors">
              <span className="material-symbols-outlined !text-[18px]">link</span>
              Link
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#343536] text-[#D7DADC] text-[12px] font-bold hover:bg-[#272729] transition-colors">
              <span className="material-symbols-outlined !text-[18px]">poll</span>
              Poll
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#343536]">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-[#D7DADC] text-[#D7DADC] text-[14px] font-bold hover:bg-[#272729] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="px-6 py-2 rounded-full bg-[#D7DADC] hover:bg-[#ebedef] text-[#1A1A1B] text-[14px] font-bold transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
