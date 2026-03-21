import React, { useState, useRef, useEffect } from 'react';

interface DatePickerCalendarProps {
    value: string;
    onChange: (dateStr: string) => void;
    id?: string;
    placeholder?: string;
    label?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({ value, onChange, id, placeholder = 'Select date' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value) : null;
    const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? new Date().getMonth());

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const selectDay = (day: number) => {
        const d = new Date(viewYear, viewMonth, day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
        setIsOpen(false);
    };

    const isToday = (day: number) => {
        const now = new Date();
        return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
    };

    const formattedValue = selectedDate
        ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getFullYear()}`
        : '';

    // Build calendar grid cells
    const cells: { day: number; inMonth: boolean }[] = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        cells.push({ day: daysInPrevMonth - i, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, inMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
        cells.push({ day: i, inMonth: false });
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Input trigger */}
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gh-bg border border-gh-border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner hover:border-primary/50"
            >
                <span className={formattedValue ? 'text-gh-text font-semibold' : 'text-gh-text-secondary'}>
                    {formattedValue || placeholder}
                </span>
                <span className="material-symbols-outlined text-gh-text-secondary !text-[18px]">calendar_month</span>
            </button>

            {/* Dropdown Calendar */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[300px] bg-gh-bg-secondary border border-gh-border rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    {/* Header: Month navigation */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border bg-gh-bg-tertiary">
                        <button type="button" onClick={prevMonth} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gh-bg-secondary text-gh-text-secondary hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-sm font-semibold text-gh-text tracking-wide">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gh-bg-secondary text-gh-text-secondary hover:text-white transition-colors">
                            <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gh-text-secondary uppercase tracking-widest py-1">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                        {cells.map((cell, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!cell.inMonth}
                                onClick={() => cell.inMonth && selectDay(cell.day)}
                                className={`
                                    h-8 w-full rounded-lg text-[12px] font-medium transition-all
                                    ${!cell.inMonth
                                        ? 'text-gh-text-secondary/30 cursor-default'
                                        : isSelected(cell.day)
                                            ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30'
                                            : isToday(cell.day)
                                                ? 'bg-primary/15 text-primary font-bold ring-1 ring-primary/30'
                                                : 'text-gh-text hover:bg-gh-bg-tertiary hover:text-white cursor-pointer'
                                    }
                                `}
                            >
                                {cell.day}
                            </button>
                        ))}
                    </div>

                    {/* Footer: Today shortcut */}
                    <div className="border-t border-gh-border px-4 py-2 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                setViewMonth(now.getMonth());
                                setViewYear(now.getFullYear());
                                selectDay(now.getDate());
                            }}
                            className="text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="text-[11px] text-gh-text-secondary hover:text-rose-400 font-medium transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePickerCalendar;
