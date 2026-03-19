import React from "react";
import CreateJobModal from "../jobs/CreateJobModal";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Map "Task" creation to "Job" creation for now to satisfy the UI
  return (
    <CreateJobModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={() => {
        console.log("Task/Job created successfully");
      }}
    />
  );
};

export default CreateTaskModal;
