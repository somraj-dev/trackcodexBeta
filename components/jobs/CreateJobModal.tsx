import React from "react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  // include any other props necessary based on how it's called
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1c2128] border border-[#444c56] rounded-xl p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold text-white mb-4">Create Job</h2>
        <p className="text-gray-400 mb-6">
          Form to create a new job goes here.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2d333b] hover:bg-[#444c56] text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
