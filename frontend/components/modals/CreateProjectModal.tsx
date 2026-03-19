import React from "react";
import CreateRepoModal from "../repositories/CreateRepoModal";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Map "Project" creation to "Repository" initialization for now
  return (
    <CreateRepoModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(repo) => {
        console.log("Creating project/repo:", repo);
        onClose();
      }}
    />
  );
};

export default CreateProjectModal;
