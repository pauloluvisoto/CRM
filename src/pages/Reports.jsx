import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';

const Reports = () => {
  const reportList = [
    { id: 'sales_rep', title: 'Vendas por Responsável', icon: UsersIcon, desc: 'Performance individual do time' },
    { id: 'loss_reason', title: 'Motivos de Perda', icon: PieChart, desc: 'Por que estamos perdendo negócios?' },
    { id: 'velocity', title: 'Velocidade do Funil', icon: TrendingUp, desc: 'Tempo médio de fechamento' },
    { id: 'forecast', title: 'Previsão de Receita', icon: Calendar, desc: 'Fluxo de caixa projetado' }
  ];

  function UsersIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    )
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Relatórios</h1>
      </div>

      <div className="reports-grid">
        {reportList.map(rep => (
          <div key={rep.id} className="report-card">
            <div className="icon-wrapper">
              <rep.icon size={24} />
            </div>
            <h3>{rep.title}</h3>
            <p>{rep.desc}</p>
            <button className="btn-view" onClick={() => alert('Relatório em desenvolvimento!')}>
              Visualizar
            </button>
          </div>
        ))}
      </div>

      <style>{`
                .reports-page {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    padding-bottom: 2rem;
                }
                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .report-card {
                    background: linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .report-card:hover {
                    border-color: rgba(190, 242, 100, 0.3);
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }
                .icon-wrapper {
                    background: linear-gradient(135deg, rgba(190, 242, 100, 0.2) 0%, rgba(163, 230, 53, 0.1) 100%);
                    padding: 0.875rem;
                    border-radius: 12px;
                    color: #bef264;
                    margin-bottom: 0.5rem;
                    border: 1px solid rgba(190, 242, 100, 0.3);
                    box-shadow: 0 0 12px rgba(190, 242, 100, 0.2);
                }
                .report-card h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
                .report-card p {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    flex: 1;
                }
                .btn-view {
                    width: 100%;
                    padding: 0.875rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-top: 1rem;
                }
                .btn-view:hover {
                    background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
                    color: #1a1a1a;
                    border-color: transparent;
                    box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
                    transform: translateY(-2px);
                }
            `}</style>
    </div>
  );
};

export default Reports;
