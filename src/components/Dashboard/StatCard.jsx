import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeftRight, Settings, Maximize2, Minimize2, Info, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ id, title, value, trend, trendValue, icon: Icon, badge = null, color = 'text-white', onBadgeClick, className = '', isHex = false, goal = null, subValue = null, sideBySide = false, trendLabel = 'vs. período anterior', mode = 'data', size = '1x1', onConfigChange, numericValue = null, previousValue = '0', compact = false }) => {
  const [showSettings, setShowSettings] = React.useState(false);

  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';
  const isNegative = trend === 'down';

  // Calculate Numeric Value First (Temporal safety)
  const finalNumericValue = numericValue !== null ? numericValue :
    (typeof value === 'string' ? parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, '')) : (Number(value) || 0));

  // Dynamic Goal Coloring Logic
  let performanceColor = color;
  let statusIconColor = 'rgba(255,255,255,0.4)';

  if (goal && goal > 0) {
    const achievement = (finalNumericValue / goal) * 100;
    if (achievement >= 110) performanceColor = '#10b981'; // Green
    else if (achievement >= 90) performanceColor = '#f59e0b'; // Amber
    else performanceColor = '#ef4444'; // Red
  }

  const cardStyle = isHex ? {
    borderColor: `${color}66`,
    boxShadow: `0 10px 30px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05), 0 0 20px ${color}15`,
    background: `linear-gradient(145deg, color-mix(in srgb, ${color}, transparent 97%) 0%, rgba(15, 15, 25, 0.95) 100%)`
  } : {};

  const valueStyle = isHex ? { color: performanceColor, textShadow: `0 0 20px ${performanceColor}22` } : {};
  const iconStyle = isHex ? { color: color, backgroundColor: `${color}11` } : {};


  const goalPercent = goal && goal > 0 ? Math.min(Math.round((finalNumericValue / goal) * 100), 100) : 0;

  return (
    <div
      className={`stat-card ${compact ? 'compact' : ''} ${!isHex && color.includes('red') ? 'danger' : !isHex && (color.includes('lime') || color.includes('green')) ? 'success' : 'neutral'} ${className} ${sideBySide ? 'side-by-side' : ''} mode-${mode} size-${size.replace('.', '-')}`}
      style={cardStyle}
    >

      {/* SETTINGS MENU */}
      <button className="settings-btn" onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}>
        <Settings size={14} />
      </button>

      {showSettings && (
        <div className="card-settings-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="settings-group">
            <span className="group-label">Visualização</span>
            <div className="settings-options">
              <button className={mode === 'data' ? 'active' : ''} onClick={() => onConfigChange({ mode: 'data' })}>Dados</button>
              <button className={mode === 'didactic' ? 'active' : ''} onClick={() => onConfigChange({ mode: 'didactic' })}>Didático</button>
            </div>
          </div>
          <div className="settings-group">
            <span className="group-label">Largura (Colunas)</span>
            <div className="settings-options sizing-grid">
              <button className={size === '1x1' ? 'active' : ''} onClick={() => onConfigChange({ size: '1x1' })}>1x</button>
              <button className={size === '1.3x1' ? 'active' : ''} onClick={() => onConfigChange({ size: '1.3x1' })}>1/3 Row</button>
              <button className={size === '2x1' ? 'active' : ''} onClick={() => onConfigChange({ size: '2x1' })}>1/2 Row</button>
              <button className={size === '4x1' ? 'active' : ''} onClick={() => onConfigChange({ size: '4x1' })}>Full</button>
              <button className={size === '8x1' ? 'active' : ''} onClick={() => onConfigChange({ size: '8x1' })}>Full</button>
            </div>
          </div>
          <button className="close-settings" onClick={() => setShowSettings(false)}>Fechar</button>
        </div>
      )}

      <div className="card-top">
        <span className="stat-title">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {badge && (
            <span
              className={`alert-badge ${badge.color} ${onBadgeClick ? 'clickable' : ''}`}
              onClick={onBadgeClick}
              style={{ cursor: onBadgeClick ? 'pointer' : 'default' }}
            >
              {badge.text}
            </span>
          )}
          {Icon && <Icon size={24} className="stat-icon" style={iconStyle} />}
        </div>
      </div>

      <div className="value-container">
        {mode === 'didactic' && <div className="didactic-intro">Resultado atual:</div>}
        <div className={`stat-value ${!isHex ? color : ''}`} style={valueStyle}>{value}</div>
        {sideBySide && subValue && <div className="value-divider" style={{ backgroundColor: isHex ? `${color}44` : 'rgba(255,255,255,0.1)' }}></div>}
        {subValue && <div className="stat-subvalue">{subValue}</div>}
      </div>

      {mode === 'didactic' && trendValue && (
        <div className="didactic-insight">
          {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : <ArrowLeftRight size={14} />}
          <span>Você está <strong>{trendValue}</strong> {isPositive ? 'acima' : isNegative ? 'abaixo' : 'estável'} em relação ao {trendLabel.replace('vs. ', '')}.</span>
        </div>
      )}

      {/* GOAL PROGRESS BAR - ALWAYS VISIBLE OR MORE DETAILED IN DIDACTIC */}
      {goal && goal > 0 && (
        <div className={`goal-container ${mode === 'didactic' ? 'detailed' : ''}`}>
          <div className="goal-info">
            <span>{goalPercent}% alcançado</span>
            {mode === 'didactic' && <span>Restam {goal - finalNumericValue > 0 ? (goal - finalNumericValue).toFixed(0) : 0} para o alvo</span>}
            <span>Alvo: {goal}</span>
          </div>
          <div className="goal-bar-bg">
            <div className="goal-bar-fill" style={{ width: `${goalPercent}%`, backgroundColor: performanceColor }}></div>
          </div>
          {mode === 'didactic' && goalPercent >= 100 && (
            <div className="goal-celebration">
              <CheckCircle2 size={12} color="#10b981" /> Meta batida!
            </div>
          )}
        </div>
      )}

      {(trendValue !== undefined && trendValue !== null) || (previousValue !== undefined && previousValue !== null) ? (
        <div className="stat-footer">
          <div className="previous-period">
            <div className="prev-info">
              {isPositive ? <ArrowUp size={14} color="#10b981" strokeWidth={3} /> : isNegative ? <ArrowDown size={14} color="#ef4444" strokeWidth={3} /> : <ArrowLeftRight size={14} color="#f59e0b" strokeWidth={3} />}
              <span className="prev-label">Mês Anterior:</span>
              <span className="prev-value">{previousValue || '0'}</span>
            </div>
          </div>
          {trendValue !== undefined && trendValue !== null && (
            <div className="trend-info">
              <span className={`trend-badge ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                {isPositive && <ArrowUp size={12} />}
                {isNegative && <ArrowDown size={12} />}
                {isNeutral && <ArrowLeftRight size={12} />}
                {trendValue}
              </span>
              <span className="trend-label">{trendLabel}</span>
            </div>
          )}
        </div>
      ) : null}

      <style>{`
        .stat-card {
          background: linear-gradient(145deg, rgba(35, 35, 50, 0.7) 0%, rgba(15, 15, 25, 0.95) 100%);
          padding: 1.75rem;
          border-radius: 24px; 
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
          overflow: visible;
          backdrop-filter: blur(12px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 240px;
          height: 100%;
        }

        /* COMPACT MODE */
        .stat-card.compact {
          min-height: 0;
          height: 100%;
          padding: 0.75rem 1.25rem;
          gap: 0;
          justify-content: center;
        }

        .stat-card.compact .stat-value {
          font-size: 1.5rem;
          margin: 0;
        }

        .stat-card.compact .stat-title {
          font-size: 0.7rem;
          opacity: 0.7;
        }

        .stat-card.compact .value-container {
          flex: 0;
          padding: 0;
          align-items: flex-start;
        }

        .stat-card.compact .card-top {
          margin-bottom: 2px;
          width: 100%;
          align-items: center;
        }
        
        .stat-card.compact .stat-icon {
            padding: 6px;
            width: 32px;
            height: 32px;
        }

        .stat-card.compact .stat-footer, 
        .stat-card.compact .settings-btn,
        .stat-card.compact .goal-container {
          display: none !important;
        }

        .stat-card.size-2x1, .stat-card.size-3x1, .stat-card.size-4x1 {
          /* Classes kept for potential inner styling, but span is handled by parent grid item */
        }

        .settings-btn {
          position: absolute;
          top: 0.75rem;
          right: 3rem;
          background: rgba(255,255,255,0.05);
          border: none;
          color: rgba(255,255,255,0.3);
          padding: 4px;
          border-radius: 6px;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-card:hover .settings-btn {
          opacity: 1;
        }

        .settings-btn:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }

        .card-settings-overlay {
          position: absolute;
          top: 2.5rem;
          right: 1rem;
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1rem;
          z-index: 100;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          width: 180px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .group-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }

        .settings-options {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.2);
          padding: 2px;
          border-radius: 8px;
        }

        .settings-options.sizing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .settings-options button {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 4px 8px;
          font-size: 0.7rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .settings-options button.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .close-settings {
          background: white;
          color: black;
          border: none;
          border-radius: 6px;
          padding: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        .didactic-intro {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: -0.5rem;
          font-weight: 500;
        }

        .didactic-insight {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          border-left: 2px solid rgba(255,255,255,0.1);
        }

        .didactic-insight strong {
          color: white;
        }

        .goal-container.detailed {
          background: rgba(0,0,0,0.2);
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .goal-celebration {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: #34d399;
          font-weight: 700;
        }

        /* VARIANTS FOR SPECIFIC COLORED CARDS */
        .stat-card.success {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
        }

        .stat-card.danger {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.05);
        }

        .stat-card.success:hover {
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
        }

        .stat-card.danger:hover {
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
        }

        /* Accent Lines */
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            opacity: 0.5;
        }

        .stat-card.success::before {
            background: linear-gradient(90deg, transparent, #10b981, transparent);
            opacity: 0.8;
            height: 2px;
            width: 100%; /* Top accent instead of side */
        }

        .stat-card.danger::before {
            background: linear-gradient(90deg, transparent, #ef4444, transparent);
            opacity: 0.8;
            height: 2px;
            width: 100%;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        /* GLOBAL BASE SIZES (Size 1x1) - REVERTED TO ORIGINAL */
        .stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -1px;
          line-height: 1;
          white-space: nowrap;
        }

        .stat-title {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-icon {
          color: var(--text-muted);
          opacity: 0.9;
          background: rgba(255,255,255,0.03);
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          flex-shrink: 0;
        }
        
        .stat-card.success .stat-icon { color: #34d399; background: rgba(16, 185, 129, 0.08); box-shadow: 0 0 15px rgba(16, 185, 129, 0.1); }
        .stat-card.danger .stat-icon { color: #f87171; background: rgba(239, 68, 68, 0.08); box-shadow: 0 0 15px rgba(239, 68, 68, 0.1); }

        .stat-value.text-green-400, .stat-value.text-emerald-500 { color: #34d399 !important; text-shadow: 0 0 20px rgba(52, 211, 153, 0.3); }
        .stat-value.text-red-400 { color: #f87171 !important; text-shadow: 0 0 20px rgba(248, 113, 113, 0.3); }
        .stat-value.text-lime-400 { color: #bef264 !important; text-shadow: 0 0 20px rgba(190, 242, 100, 0.3); }
        .stat-value.text-blue-400 { color: #60a5fa !important; }

        .stat-subvalue {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
          margin-top: -2px;
          white-space: nowrap;
        }

        .value-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 0;
          flex: 1;
        }

        .stat-card.side-by-side .value-container {
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          width: 100%;
        }

        .value-divider {
          width: 2px;
          height: 2.5rem;
          border-radius: 1px;
          opacity: 0.5;
          box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }

        .stat-card.side-by-side .stat-subvalue {
          font-size: 1.15rem;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 0;
          font-weight: 600;
        }
        
        .mode-didactic .stat-value {
          font-size: 2.5rem;
        }

        .stat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 0.75rem;
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: var(--text-secondary);
        }

        .previous-period {
          display: flex;
          align-items: center;
        }

        .prev-info {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          padding: 4px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
        }

        .prev-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        .prev-value {
          font-weight: 800;
          color: rgba(255,255,255,0.8);
          font-size: 0.85rem;
        }

        .trend-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .trend-badge.positive {
          background-color: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .trend-badge.negative {
          background-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .trend-badge.neutral {
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4); 
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .alert-badge {
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 700;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .alert-badge.warning {
          background-color: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .alert-badge.danger {
          background-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .alert-badge.clickable {
            transition: all 0.2s;
        }

        .alert-badge.clickable:hover {
            transform: scale(1.05);
            background-color: rgba(239, 68, 68, 0.25);
            cursor: pointer;
        }

        /* GOAL PROGRESS STYLES */
        .goal-container {
            margin-top: 0.25rem;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .goal-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.65rem;
            font-weight: 700;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            white-space: nowrap;
        }
        .goal-bar-bg {
            height: 4px;
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        .goal-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }

        /* RESPONSIVE SCALING - ONLY FOR LARGER CARDS */
        .stat-card.size-1-3x1 .stat-value { font-size: 2.5rem; }
        .stat-card.size-2x1 .stat-value, .stat-card.size-3x1 .stat-value { font-size: 4rem; letter-spacing: -2px; }
        .stat-card.size-4x1 .stat-value, .stat-card.size-8x1 .stat-value { font-size: 5rem; letter-spacing: -3px; }

        /* Proportionally scale everything else ONLY on larger cards */
        .stat-card.size-1-3x1 .stat-title { font-size: 0.9rem; }
        .stat-card.size-2x1 .stat-title, .stat-card.size-3x1 .stat-title { font-size: 1.4rem; }
        .stat-card.size-4x1 .stat-title, .stat-card.size-8x1 .stat-title { font-size: 2rem; }

        /* The specific "tiny texts" the user complained about */
        .stat-card.size-2x1 .didactic-intro, .stat-card.size-3x1 .didactic-intro { font-size: 1rem; margin-bottom: 0 !important; white-space: nowrap; }
        .stat-card.size-4x1 .didactic-intro, .stat-card.size-8x1 .didactic-intro { font-size: 1.25rem; margin-bottom: 0.25rem !important; }
        
        /* Updated this to ensure nowrap too */
        .didactic-intro {
            white-space: nowrap;
        }

        .stat-card.size-2x1 .stat-subvalue, .stat-card.size-3x1 .stat-subvalue { font-size: 1.25rem; }
        .stat-card.size-4x1 .stat-subvalue, .stat-card.size-8x1 .stat-subvalue { font-size: 1.75rem; }
        
        .stat-card.size-2x1 .goal-info, .stat-card.size-3x1 .goal-info { font-size: 1.1rem; }
        .stat-card.size-4x1 .goal-info, .stat-card.size-8x1 .goal-info { font-size: 1.4rem; }

        /* Remaining elements scaling */
        .stat-card.size-2x1 .prev-label, .stat-card.size-3x1 .prev-label { font-size: 1rem; }
        .stat-card.size-4x1 .prev-label, .stat-card.size-8x1 .prev-label { font-size: 1.25rem; }

        .stat-card.size-2x1 .prev-value, .stat-card.size-3x1 .prev-value { font-size: 1.25rem; }
        .stat-card.size-4x1 .prev-value, .stat-card.size-8x1 .prev-value { font-size: 1.75rem; }
        
        .stat-card.size-2x1 .stat-footer, .stat-card.size-3x1 .stat-footer { font-size: 1.1rem; }
        .stat-card.size-4x1 .stat-footer, .stat-card.size-8x1 .stat-footer { font-size: 1.4rem; }

        .stat-card.size-2x1 .stat-icon, .stat-card.size-3x1 .stat-icon { transform: scale(1.5); }
        .stat-card.size-4x1 .stat-icon, .stat-card.size-8x1 .stat-icon { transform: scale(2.0); }

        .stat-card.size-2x1 .value-container, 
        .stat-card.size-3x1 .value-container, 
        .stat-card.size-4x1 .value-container, 
        .stat-card.size-8x1 .value-container {
             justify-content: center;
             gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default StatCard;
