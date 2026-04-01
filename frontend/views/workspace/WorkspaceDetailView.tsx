import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/infra/api';
import { Workspace } from '../../types';
import Spinner from '../../components/ui/Spinner';
import EditorView from '../editor/Editor';

const WorkspaceDetailView = () => {
    const { id } = useParams();
    const [workspace, setWorkspace] = useState<Workspace | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkspace = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await api.workspaces.get(id);
                setWorkspace(data);
            } catch (error) {
                console.error("Failed to fetch workspace:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkspace();
    }, [id]);

    if (isLoading || !workspace) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full overflow-hidden">
            <EditorView />
        </div>
    );
};

export default WorkspaceDetailView;



