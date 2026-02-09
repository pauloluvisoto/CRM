import React from 'react';
import { Calendar } from 'lucide-react';

const PeriodFilter = ({ selectedPeriod, onPeriodChange, customDates, onCustomDateChange }) => {
    const periods = [
        { value: '7d', label: 'Últimos 7 dias' },
        { value: 'thisMonth', label: 'Mês Atual' },
        { value: 'thisYear', label: 'Ano Atual' },
        { value: 'custom', label: 'Período Personalizado' }
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="period-filter">
                <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                <select
                    value={selectedPeriod}
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="period-dropdown"
                >
                    {periods.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {selectedPeriod === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="date"
                        value={customDates?.start || ''}
                        onChange={(e) => onCustomDateChange('start', e.target.value)}
                        className="custom-date-input"
                    />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>até</span>
                    <input
                        type="date"
                        value={customDates?.end || ''}
                        onChange={(e) => onCustomDateChange('end', e.target.value)}
                        className="custom-date-input"
                    />
                </div>
            )}

            <style>{`
                /* ... existing styles ... */
                .custom-date-input {
                    background: rgba(30,30,40,0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 0.4rem 0.6rem;
                    color: white;
                    font-size: 0.8rem;
                    outline: none;
                }
                .custom-date-input:focus {
                    border-color: var(--primary);
                }
            `}</style>

            <style>{`
                .period-filter {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: var(--bg-secondary);
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                
                .period-dropdown {
                    background-color: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    padding: 0;
                }
                
                .period-dropdown:hover {
                    color: var(--primary);
                }
            `}</style>
        </div>
    );
};

export default PeriodFilter;
