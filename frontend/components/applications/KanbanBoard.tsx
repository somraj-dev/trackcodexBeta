import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { CandidateCard } from './CandidateCard'; // For overlay
import { api } from '../../services/infra/api';

const STAGES = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Hired', 'Rejected'];

const KanbanBoard = ({ jobId }: { jobId: string }) => {
    const [columns, setColumns] = useState<Record<string, any[]>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeApp, setActiveApp] = useState<any>(null);

    // Fetch Data
    useEffect(() => {
        api.get(`/applications/kanban/${jobId}`)
            .then(data => setColumns(data as any))
            .catch(err => console.error("[Kanban] Fetch failed", err));
    }, [jobId]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        setActiveApp(event.active.data.current.application);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveApp(null);

        if (!over) return;

        const appId = active.id;
        const newStage = over.id; // Droppable ID is the stage name

        // Optimistic Update
        let sourceStage = null;
        let application = null;

        const newColumns = { ...columns };

        // Locate and remove from source
        for (const stage of Object.keys(newColumns)) {
            const foundIndex = newColumns[stage].findIndex((a: any) => a.id === appId);
            if (foundIndex !== -1) {
                sourceStage = stage;
                application = newColumns[stage][foundIndex];
                newColumns[stage].splice(foundIndex, 1);
                break;
            }
        }

        if (!sourceStage || sourceStage === newStage) return;

        // Add to dest
        application.stage = newStage;
        if (!newColumns[newStage]) newColumns[newStage] = [];
        newColumns[newStage].push(application);

        setColumns(newColumns);

        // Call API
        try {
            await api.patch(`/applications/${appId}/move`, { stage: newStage });
        } catch (e) {
            console.error("[Kanban] Move failed", e);
            // Revert logic would go here
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {STAGES.map(stage => (
                    <KanbanColumn
                        key={stage}
                        id={stage}
                        title={stage}
                        applications={columns[stage] || []}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeApp ? <CandidateCard application={activeApp} onClick={() => { }} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
