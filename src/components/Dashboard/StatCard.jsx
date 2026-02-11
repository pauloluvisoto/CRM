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

  // Determine variant classes
  const isDanger = !isHex && color.includes('red');
  const isSuccess = !isHex && (color.includes('lime') || color.includes('green'));

  const baseCardClasses = `${compact ? 'p-4 min-h-0' : 'p-7 min-h-[240px]'} flex flex-col gap-3 rounded-2xl border transition-all duration-300 h-full relative overflow-visible backdrop-blur-xl group hover:shadow-2xl`;

  const variantClasses = isDanger
    ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/40 shadow-red-500/5'
    : isSuccess
      ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-500/5'
      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-brand/30 hover:shadow-neon shadow-xl shadow-black/20';

  // Responsive Text Sizes based on 'size' prop (simulated responsiveness via class logic)
  const isLarge = size === '2x1' || size === '3x1';
  const isExtraLarge = size === '4x1' || size === '8x1';

  const valueSizeClass = isExtraLarge ? 'text-7xl tracking-tighter' : isLarge ? 'text-6xl tracking-tight' : 'text-4xl tracking-tight';
  const titleSizeClass = isExtraLarge ? 'text-2xl' : isLarge ? 'text-xl' : 'text-xs';

  return (
    <div
      className={`${baseCardClasses} ${variantClasses} ${className} ${sideBySide ? 'side-by-side' : ''}`}
      style={cardStyle}
    >
      {/* Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-70 ${isDanger ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : isSuccess ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />

      {/* Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-70 ${isDanger ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : isSuccess ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />

      {compact ? (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="font-bold text-text-secondary uppercase text-[10px] tracking-widest opacity-60 mb-0.5">{title}</span>
          <div className={`font-black tracking-tighter leading-none ${isLarge ? 'text-5xl' : 'text-4xl'} ${!isHex ? color : ''}`} style={valueStyle}>{value}</div>

          {trendValue && trendValue !== '--' && (
            <div className="flex items-center gap-1 mt-1 opacity-75 scale-90">
              {trend === 'up' ? <TrendingUp size={12} className="text-emerald-400" /> : trend === 'down' ? <TrendingDown size={12} className="text-red-400" /> : <ArrowLeftRight size={12} className="text-amber-400" />}
              <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-amber-400'}`}>
                {trendValue} vs mês ant.
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <span className={`font-semibold text-text-secondary uppercase whitespace-nowrap overflow-hidden text-ellipsis ${titleSizeClass}`}>{title}</span>
            <div className="flex items-center gap-2">
              {badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 ${badge.color} ${onBadgeClick ? 'hover:scale-105 cursor-pointer transition-transform' : ''}`}
                  onClick={onBadgeClick}
                >
                  {badge.text}
                </span>
              )}
              {Icon && <Icon size={24} className={`p-1.5 rounded-xl ${isSuccess ? 'text-emerald-400 bg-emerald-500/10' : isDanger ? 'text-red-400 bg-red-500/10' : 'text-text-muted bg-white/5'} shadow-sm`} style={iconStyle} />}
            </div>
          </div>

          <div className={`flex flex-col justify-center flex-1 py-1 ${sideBySide ? 'flex-row items-center justify-between w-full' : 'items-center'}`}>
            {mode === 'didactic' && <div className="text-xs text-text-secondary font-medium mb-1 whitespace-nowrap">Resultado atual:</div>}
            <div className={`font-extrabold text-text-primary leading-none whitespace-nowrap ${valueSizeClass} ${!isHex ? color : ''}`} style={valueStyle}>{value}</div>

            {sideBySide && subValue && <div className="w-0.5 h-10 bg-white/10 rounded-full mx-2" style={{ backgroundColor: isHex ? `${color}44` : undefined }}></div>}

            {subValue && (
              <div className={`text-sm font-medium text-white/40 whitespace-nowrap ${sideBySide ? 'text-lg text-white/30' : '-mt-1'}`}>{subValue}</div>
            )}
          </div>
        </>
      )
      }

      {
        mode === 'didactic' && trendValue && (
          <div className="flex items-center gap-2 p-3 bg-white/5 border-l-2 border-white/10 rounded-xl text-xs text-text-secondary">
            {isPositive ? <TrendingUp size={14} className="text-emerald-400" /> : isNegative ? <TrendingDown size={14} className="text-red-400" /> : <ArrowLeftRight size={14} />}
            <span>Você está <strong className="text-white">{trendValue}</strong> {isPositive ? 'acima' : isNegative ? 'abaixo' : 'estável'} em relação ao {trendLabel.replace('vs. ', '')}.</span>
          </div>
        )
      }

      {/* GOAL PROGRESS BAR */}
      {
        goal && goal > 0 && (
          <div className={`flex flex-col gap-1.5 mt-1 ${mode === 'didactic' ? 'bg-black/20 p-4 rounded-2xl border border-white/5' : ''}`}>
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase whitespace-nowrap">
              <span>{goalPercent}% alcançado</span>
              {mode === 'didactic' && <span>Restam {Math.max(0, goal - finalNumericValue).toFixed(0)}</span>}
              <span>Alvo: {goal}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ width: `${goalPercent}%`, backgroundColor: performanceColor }}></div>
            </div>
            {mode === 'didactic' && goalPercent >= 100 && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1">
                <CheckCircle2 size={12} /> Meta batida!
              </div>
            )}
          </div>
        )
      }

      {
        ((trendValue !== undefined && trendValue !== null) || (previousValue !== undefined && previousValue !== null)) && !compact && (
          <div className="flex items-center justify-between w-full text-xs pt-3 mt-auto border-t border-white/5 text-text-secondary">
            <div className="flex items-center">
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 whitespace-nowrap">
                {isPositive ? <ArrowUp size={14} className="text-emerald-500" strokeWidth={3} /> : isNegative ? <ArrowDown size={14} className="text-red-500" strokeWidth={3} /> : <ArrowLeftRight size={14} className="text-amber-500" strokeWidth={3} />}
                <span className="text-[10px] font-bold text-white/30 uppercase">Mês Anterior:</span>
                <span className="font-extrabold text-white/80">{previousValue || '0'}</span>
              </div>
            </div>

            {trendValue !== undefined && trendValue !== null && (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  title={trendLabel ? trendLabel.replace('vs. ', 'Variação em relação a ') : 'Variação do período'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-help ${isPositive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : isNegative ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}
                >
                  {isPositive && <ArrowUp size={10} />}
                  {isNegative && <ArrowDown size={10} />}
                  {isNeutral && <ArrowLeftRight size={10} />}
                  {trendValue}
                </span>
                <span className="text-[10px] uppercase font-bold text-white/20">{trendLabel}</span>
              </div>
            )}
          </div>
        )
      }
    </div >
  );
};

export default StatCard;
