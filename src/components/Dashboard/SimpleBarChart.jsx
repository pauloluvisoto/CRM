import React from 'react';

const SimpleBarChart = ({ data = [] }) => {
    if (!data || data.length === 0) return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Sem dados para exibir no período.</div>;
    const maxValue = Math.max(...data.map(d => d.value)) || 1;

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3>Funil de Vendas</h3>
            </div>
            <div className="bars-wrapper">
                {data.map((item) => (
                    <div key={item.id} className="bar-group">
                        <div
                            className="bar"
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                            title={`R$ ${item.value}`}
                        ></div>
                        <span className="bar-label">{item.label}</span>
                    </div>
                ))}
            </div>

            <style>{`
        .chart-container {
            background-color: var(--bg-secondary);
            padding: var(--spacing-lg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            height: 300px;
            display: flex;
            flex-direction: column;
        }

        .chart-header {
            margin-bottom: var(--spacing-lg);
        }

        .chart-header h3 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .bars-wrapper {
            flex: 1;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: var(--spacing-sm);
            padding-bottom: var(--spacing-sm);
            border-bottom: 1px solid var(--border-color);
        }

        .bar-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            height: 100%;
            justify-content: flex-end;
            gap: var(--spacing-sm);
        }

        .bar {
            width: 100%;
            max-width: 40px;
            background-color: var(--primary);
            border-radius: 4px 4px 0 0;
            transition: height 0.5s ease;
            opacity: 0.8;
        }

        .bar:hover {
            opacity: 1;
            filter: brightness(1.2);
        }

        .bar-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
      `}</style>
        </div>
    );
};

export default SimpleBarChart;
