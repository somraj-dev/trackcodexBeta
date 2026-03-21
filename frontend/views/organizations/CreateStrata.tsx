import React from "react";
import { useNavigate } from "react-router-dom";

const CreateStrata: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Create Strata Organization</h1>
      <p className="text-[#a1a1aa] mb-6">
        Set up a new organization to collaborate with your team.
      </p>
      <button
        onClick={() => navigate("/strata")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
      >
        ← Back to Strata
      </button>
    </div>
  );
};

export default CreateStrata;


