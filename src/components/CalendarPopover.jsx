import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CalendarPopover.css';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CalendarPopover = ({ selectedDate, onSelect, onClose }) => {
    // Initial selection
    const initialDate = selectedDate ? new Date(selectedDate) : new Date();

    // State for navigation (view year/month)
    const [viewDate, setViewDate] = useState(initialDate);

    // State for temporary selection (before saving)
    const [tempSelectedDate, setTempSelectedDate] = useState(initialDate);

    const popoverRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setTempSelectedDate(newDate);
    };

    const handleSave = () => {
        onSelect(tempSelectedDate.toISOString());
    };

    // Calculate projected date (15 days after selected)
    const projectedDate = new Date(tempSelectedDate);
    projectedDate.setDate(projectedDate.getDate() + 15);

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const slots = [];

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            slots.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const currentDateString = currentDate.toDateString();

            const isSelected = tempSelectedDate.toDateString() === currentDateString;
            const isToday = new Date().toDateString() === currentDateString;
            const isProjected = projectedDate.toDateString() === currentDateString;

            let className = "calendar-day";
            if (isSelected) className += " selected";
            if (isToday) className += " today";
            if (isProjected) className += " projected";

            slots.push(
                <div
                    key={day}
                    className={className}
                    onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
                >
                    {day}
                </div>
            );
        }

        return slots;
    };

    return (
        <div className="calendar-popover" ref={popoverRef} onClick={(e) => e.stopPropagation()}>
            <div className="calendar-header">
                <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}>
                    <ChevronLeft size={16} />
                </button>
                <span className="current-month">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button className="nav-btn" onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}>
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="calendar-weekdays">
                {DAYS.map(d => <div key={d} className="weekday">{d}</div>)}
            </div>

            <div className="calendar-grid">
                {renderDays()}
            </div>

            <button className="calendar-save-btn" onClick={(e) => { e.stopPropagation(); handleSave(); }}>
                salvar
            </button>
        </div>
    );
};

export default CalendarPopover;
