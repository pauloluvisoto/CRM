import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    Target,
    Users,
    Settings2,
    Play
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

const FinanceBusinessPlan = () => {
    // Drivers (Premissas)
    const [drivers, setDrivers] = useState({
        revenueGrowth: 5, // % Month over Month
        churnRate: 2.5, // %
        costIncrease: 2, // %
        marketingBudget: 15000,
        avgTicket: 299,
    });

    const [scenario, setScenario] = useState('base'); // base, optimistic, pessimistic
    const [projections, setProjections] = useState([]);

    // Calculate projections based on drivers
    useEffect(() => {
        const months = 12;
        const startRevenue = 125000;
        const startCosts = 85000;
        let currentRevenue = startRevenue;
        let currentCosts = startCosts;

        const newProjections = [];

        for (let i = 1; i <= months; i++) {
            // Apply Growth Logic
            const growthFactor = 1 + (drivers.revenueGrowth / 100);
            const churnFactor = 1 - (drivers.churnRate / 100);

            // Net Revenue Impact
            currentRevenue = currentRevenue * growthFactor * churnFactor;

            // Costs Logic (Variable + Fixed + Marketing)
            const costFactor = 1 + (drivers.costIncrease / 100);
            currentCosts = (currentCosts * costFactor) + (drivers.marketingBudget * 0.1); // Simplified impact

            const ebitda = currentRevenue - currentCosts;
            const cashFlow = ebitda * 0.85; // After tax approx

            newProjections.push({
                month: `Mês ${i}`,
                revenue: Math.round(currentRevenue),
                costs: Math.round(currentCosts),
                ebitda: Math.round(ebitda),
                cash: Math.round(cashFlow)
            });
        }
        setProjections(newProjections);
    }, [drivers]);

    const setPresetScenario = (type) => {
        setScenario(type);
        if (type === 'base') {
            setDrivers({ revenueGrowth: 5, churnRate: 2.5, costIncrease: 2, marketingBudget: 15000, avgTicket: 299 });
        } else if (type === 'optimistic') {
            setDrivers({ revenueGrowth: 8, churnRate: 1.5, costIncrease: 1.5, marketingBudget: 25000, avgTicket: 350 });
        } else if (type === 'pessimistic') {
            setDrivers({ revenueGrowth: 2, churnRate: 4.0, costIncrease: 3.5, marketingBudget: 5000, avgTicket: 250 });
        }
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-full max-w-[1600px] mx-auto">
            {/* Sidebar Controls */}
            <div className="w-full xl:w-80 flex-shrink-0 bg-[#141414] border border-white/5 rounded-3xl p-6 flex flex-col gap-8 h-fit">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Settings2 className="text-lime-400" />
                        Simulador
                    </h2>
                    <p className="text-gray-400 text-sm">Ajuste as premissas para projetar cenários futuros.</p>
                </div>

                {/* Scenarios */}
                <div className="grid grid-cols-3 gap-2">
                    {['pessimistic', 'base', 'optimistic'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setPresetScenario(s)}
                            className={`py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${scenario === s
                                    ? s === 'optimistic' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                        : s === 'pessimistic' ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                        >
                            {s === 'pessimistic' ? 'Pessimista' : s === 'base' ? 'Realista' : 'Otimista'}
                        </button>
                    ))}
                </div>

                {/* Drivers Inputs */}
                <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Crescimento Mensal</span>
                            <span className="text-lime-400 font-bold">{drivers.revenueGrowth}%</span>
                        </div>
                        <input
                            type="range" min="0" max="20" step="0.5"
                            value={drivers.revenueGrowth}
                            onChange={(e) => {
                                setDrivers({ ...drivers, revenueGrowth: Number(e.target.value) });
                                setScenario('custom');
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Churn Rate</span>
                            <span className="text-red-400 font-bold">{drivers.churnRate}%</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="0.1"
                            value={drivers.churnRate}
                            onChange={(e) => {
                                setDrivers({ ...drivers, churnRate: Number(e.target.value) });
                                setScenario('custom');
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Aumento Custos</span>
                            <span className="text-orange-400 font-bold">{drivers.costIncrease}%</span>
                        </div>
                        <input
                            type="range" min="0" max="15" step="0.5"
                            value={drivers.costIncrease}
                            onChange={(e) => {
                                setDrivers({ ...drivers, costIncrease: Number(e.target.value) });
                                setScenario('custom');
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Investimento Mkt</span>
                            <span className="text-blue-400 font-bold">R$ {(drivers.marketingBudget / 1000).toFixed(0)}k</span>
                        </div>
                        <input
                            type="range" min="0" max="100000" step="1000"
                            value={drivers.marketingBudget}
                            onChange={(e) => {
                                setDrivers({ ...drivers, marketingBudget: Number(e.target.value) });
                                setScenario('custom');
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <button className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20">
                        <Play size={18} /> Gerar Relatório PDF
                    </button>
                </div>
            </div>

            {/* Main Content (Visualizations) */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Metrics Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><TrendingUp size={20} /></div>
                            <span className="text-gray-400 text-sm">Receita Projetada (12m)</span>
                        </div>
                        <p className="text-2xl font-bold text-white">R$ {(projections[11]?.revenue / 1000).toFixed(0)}k</p>
                        <span className="text-xs text-green-500 flex items-center gap-1">
                            +{(drivers.revenueGrowth * 12).toFixed(0)}% vs ano anterior
                        </span>
                    </div>

                    <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Target size={20} /></div>
                            <span className="text-gray-400 text-sm">EBITDA (Final)</span>
                        </div>
                        <p className="text-2xl font-bold text-white">R$ {(projections[11]?.ebitda / 1000).toFixed(0)}k</p>
                        <span className="text-xs text-gray-500">
                            Margem: {((projections[11]?.ebitda / projections[11]?.revenue) * 100).toFixed(1)}%
                        </span>
                    </div>

                    <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Users size={20} /></div>
                            <span className="text-gray-400 text-sm">Valuation (Estimado)</span>
                        </div>
                        <p className="text-2xl font-bold text-white">R$ {((projections[11]?.revenue * 12) * 4 / 1000000).toFixed(1)}M</p>
                        <span className="text-xs text-gray-500">Baseado em 4x Receita Anual</span>
                    </div>

                    <div className="bg-[#1E1E1E] border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Activity size={20} /></div>
                            <span className="text-gray-400 text-sm">Runway</span>
                        </div>
                        <p className="text-2xl font-bold text-white">18 Meses</p>
                        <span className="text-xs text-gray-500">Com caixa atual</span>
                    </div>
                </div>

                {/* Charts */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    <div className="bg-[#1E1E1E] border border-white/5 p-6 rounded-3xl flex flex-col">
                        <h3 className="text-white font-bold mb-6">Projeção de Receita vs Custos</h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projections}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="month" hide />
                                    <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#84cc16" fillOpacity={1} fill="url(#colorRevenue)" name="Receita" strokeWidth={3} />
                                    <Area type="monotone" dataKey="costs" stroke="#ef4444" fillOpacity={1} fill="url(#colorCosts)" name="Custos" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#1E1E1E] border border-white/5 p-6 rounded-3xl flex flex-col">
                        <h3 className="text-white font-bold mb-6">Evolução do EBITDA</h3>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projections}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="month" hide />
                                    <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val / 1000}k`} />
                                    <Tooltip cursor={{ fill: 'white', opacity: 0.05 }} contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px' }} />
                                    <Bar dataKey="ebitda" name="EBITDA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceBusinessPlan;
