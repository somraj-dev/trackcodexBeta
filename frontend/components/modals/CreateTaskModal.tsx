import React, { useState } from "react";
import { auth } from "../../lib/firebase";
import "../../styles/CreateProjectModal.css";

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: {
    name: string;
    description: string;
    estimation: string;
    type: string;
    status: string;
    userId: string;
    createdAt: string;
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onSave }) => {
  const [taskName, setTaskName] = useState("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("rocket");
  const [progress, setProgress] = useState("Completing action items");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const handleDateSave = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
    setEndDate(formatted);
    setShowDatePicker(false);
  };

  const resetAll = () => {
    setTaskName("");
    setEndDate("");
    setSelectedIcon("rocket");
    setShowDatePicker(false);
  };

  const handleSave = () => {
    const newTask = {
      name: taskName,
      description: "", // Can be expanded
      estimation: endDate,
      type: "Dashboard",
      status: "To-do",
      userId: auth.currentUser?.uid || "guest",
      createdAt: new Date().toISOString(),
    };
    onSave(newTask);
    onClose();
    resetAll();
  };

  const icons = [
    { id: "flag", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id: "rocket", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/></svg> },
    { id: "suitcase", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    { id: "heart", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { id: "coin", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg> },
    { id: "bolt", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
    { id: "mail", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect x="2" y="5" width="20" height="14" rx="2"/></svg> },
    { id: "star", svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  ];

  if (!isOpen) return null;

  return (
    <div className="cpm-overlay">
      <div onClick={onClose} className="cpm-backdrop" aria-hidden="true" />
      <div className="cpm-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="cpm-header flex justify-between items-center px-6 py-6 border-b border-gh-border relative">
          <div className="flex items-center gap-3">
            <div className="cpm-header-icon step-1"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></div>
            <h2 id="modal-title" className="text-[18px] font-bold tracking-tight">Create Task</h2>
          </div>
          <button onClick={onClose} className="cpm-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="cpm-body no-scrollbar" style={{ padding: '24px 24px 0', paddingBottom: showDatePicker ? '320px' : '0', transition: 'padding 0.2s' }}>
          <div className="space-y-6">
            <div className="cpm-form-group">
              <label className={`cpm-label ${!taskName ? 'error' : ''}`} htmlFor="task-name">Task name *</label>
              <input id="task-name" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="e.g. Launch marketing site" className="cpm-input" />
            </div>

            <div className="cpm-assign-row">
              <div className="cpm-assign-item">
                <label className="cpm-label" htmlFor="task-assign">Assign</label>
                <div id="task-assign" className="cpm-select-box">
                  <div className="cpm-git-header-row">
                    <div className="cpm-avatar">Y</div>
                    <span className="text-[14px]">You</span>
                  </div>
                  <span className="text-[12px] text-gh-text-secondary">▾</span>
                </div>
              </div>
              <div className="cpm-assign-item">
                <label className={`cpm-label ${!endDate ? 'error' : ''}`} htmlFor="task-date">Task end date *</label>
                <button id="task-date" type="button" onClick={() => setShowDatePicker(!showDatePicker)} className={`cpm-select-box ${showDatePicker ? 'active' : ''}`}>
                  <span className="text-[14px]">{endDate || "dd-mm-yyyy"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>

                {showDatePicker && (
                  <div className="cpm-date-picker">
                    <div className="cpm-calendar-header">
                      <button type="button" className="cpm-calendar-header-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>‹</button>
                      <span className="cpm-calendar-header-title">{calendarMonth.toLocaleString('default', { month: 'long' })} {calendarMonth.getFullYear()}</span>
                      <button type="button" className="cpm-calendar-header-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>›</button>
                    </div>
                    <div className="p-4 pt-2">
                      <div className="cpm-calendar-grid mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="cpm-calendar-weekday">{d}</div>)}
                      </div>
                      {(() => {
                        const cells = [];
                        const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
                        const lastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
                        const prevMonthLastDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
                        for (let i = firstDay - 1; i >= 0; i--) cells.push(<div key={`prev-${i}`} className="cpm-calendar-day-prev">{prevMonthLastDate - i}</div>);
                        for (let d = 1; d <= lastDate; d++) {
                          const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                          const isSelectedDate = endDate === `${d.toString().padStart(2, '0')}-${(calendarMonth.getMonth() + 1).toString().padStart(2, '0')}-${calendarMonth.getFullYear()}`;
                          cells.push(<button key={d} type="button" onClick={() => handleDateSave(date)} className={`cpm-day-cell ${isSelectedDate ? 'selected' : ''}`}>{d}</button>);
                        }
                        const rows = [];
                        for (let i = 0; i < cells.length; i += 7) rows.push(<div key={`row-${i}`} className="cpm-calendar-grid">{cells.slice(i, i + 7)}</div>);
                        return rows;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="cpm-form-group">
              <label className="cpm-label">Choose icon</label>
              <div className="cpm-icon-picker">
                {icons.map(icon => <button key={icon.id} onClick={() => setSelectedIcon(icon.id)} className={`cpm-icon-btn ${selectedIcon === icon.id ? 'selected' : ''}`}>{icon.svg}</button>)}
              </div>
            </div>

            <div className="cpm-form-group">
              <label className="cpm-label" htmlFor="task-desc">Task description</label>
              <textarea id="task-desc" placeholder="Add more detail about this task" className="cpm-textarea" />
            </div>

            <div>
              <label className="cpm-label">Measurement Method *</label>
              <div className="cpm-radio-group">
                {["Completing sub-goals", "Completing action items", "Tracking a metric"].map(label => (
                  <button key={label} type="button" className={`cpm-radio-item ${progress === label ? 'selected' : ''}`} onClick={() => setProgress(label)}>
                    <div className="cpm-radio-circle">{progress === label && <div className="cpm-radio-dot" />}</div>
                    <span className="text-[14px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cpm-footer">
          <button onClick={onClose} className="cpm-btn cpm-btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!taskName || !endDate} className="cpm-btn cpm-btn-primary">
            Next <span className="ml-1">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
