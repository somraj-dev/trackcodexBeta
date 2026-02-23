import React from "react";
import { useNavigate } from "react-router-dom";

const ImportRepo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Import Repository</h1>
      <p className="text-gray-400 mb-6">
        Import an existing repository from GitHub, GitLab, or other providers.
      </p>
      <button
        onClick={() => navigate("/repositories")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
      >
        ← Back to Repositories
      </button>
    </div>
  );
};

export default ImportRepo;
