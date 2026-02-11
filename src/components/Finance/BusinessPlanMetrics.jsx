import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { businessPlanService } from '../../services/businessPlanService';

const BusinessPlanMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState({});

    useEffect(() => {
        loadMetrics(true);
        const interval = setInterval(() => {
            loadMetrics(false);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const data = await businessPlanService.getMetrics();

            // Check for updates to trigger glow
            if (metrics) {
                const newUpdates = {};
                // Helper to compare nested values
                const checkUpdate = (path, newVal) => {
                    const oldVal = path.split('.').reduce((obj, key) => obj?.[key], metrics);
                    if (oldVal !== undefined && newVal > oldVal) {
                        newUpdates[path] = true;
                    }
                };

                checkUpdate('receitas.total.real', data.receitas.total.real);
                checkUpdate('custos.cogs.real', data.custos.cogs.real);
                checkUpdate('margens.resultadoBruto.real', data.margens.resultadoBruto.real);
                checkUpdate('custos.impostos.real', data.custos.impostos.real);
                checkUpdate('margens.lucroLiquido.real', data.margens.lucroLiquido.real);

                if (Object.keys(newUpdates).length > 0) {
                    setLastUpdated(newUpdates);
                    setTimeout(() => setLastUpdated({}), 2000);
                }
            }

            setMetrics(data);
        } catch (err) {
            setError(err.message);
            console.error('Error loading business plan metrics:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const calculatePercentage = (real, bp) => {
        if (bp === 0) return 0;
        return ((real / bp) * 100).toFixed(1);
    };

    const MetricCard = ({ title, bpValue, realValue, icon: Icon, color = 'green', updateKey }) => {
        const percentage = calculatePercentage(realValue, bpValue);
        const isPositive = realValue >= 0;
        const isUpdating = lastUpdated[updateKey];

        return (
            <div className={`bg-[#1E1E1E] border ${isUpdating ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/5'} rounded-2xl p-6 hover:border-white/10 transition-all duration-500`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-${color}-500/10`}>
                            <Icon className={`text-${color}-500`} size={20} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                        Meta: {formatCurrency(bpValue)} | Real: {formatCurrency(realValue)}
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Planejado (BP)</div>
                        <div className="text-lg font-bold text-white">{formatCurrency(bpValue)}</div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-500 mb-1">Realizado</div>
                        <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'} ${isUpdating ? 'animate-pulse' : ''}`}>
                            {formatCurrency(realValue)}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Execução</span>
                            <span className={`text-sm font-semibold ${percentage >= 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                                {percentage}%
                            </span>
                        </div>
                        <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${percentage >= 100 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-500`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-8 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-green-500 rounded-full mb-4"></div>
                <div className="text-gray-400">Carregando métricas em tempo real...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1E1E1E] border border-red-500/20 rounded-2xl p-8">
                <div className="text-red-500 font-bold mb-2">Erro de Conexão</div>
                <div className="text-red-400/80 text-sm">Não foi possível conectar ao servidor de KPIs. Certifique-se de que o backend está rodando.</div>
                <button
                    onClick={() => loadMetrics(true)}
                    className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (!metrics) return null;

    // Specific logic for API Oficial (R$ 200 per sale)
    const apiOficialItem = metrics.breakdown.despesasVariaveis.find(i => i.label === 'API Oficial Whatsapp');
    const apiOficialReal = apiOficialItem ? apiOficialItem.REAL_2026 : 0;
    const apiOficialBP = apiOficialItem ? apiOficialItem.BP_2026 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Business Plan 2026</h2>
                    <p className="text-sm text-gray-400 mt-1">Dados em Tempo Real • Atualização a cada 5s</p>
                </div>
                <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Engine Ativo</span>
                </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Receita Total"
                    bpValue={metrics.receitas.total.bp}
                    realValue={metrics.receitas.total.real}
                    icon={DollarSign}
                    color="green"
                    updateKey="receitas.total.real"
                />

                <MetricCard
                    title="COGS (Custos Variáveis)"
                    bpValue={metrics.custos.cogs.bp}
                    realValue={metrics.custos.cogs.real}
                    icon={TrendingDown}
                    color="orange"
                    updateKey="custos.cogs.real"
                />

                <MetricCard
                    title="Resultado Bruto"
                    bpValue={metrics.margens.resultadoBruto.bp}
                    realValue={metrics.margens.resultadoBruto.real}
                    icon={TrendingUp}
                    color="blue"
                    updateKey="margens.resultadoBruto.real"
                />

                <MetricCard
                    title="Impostos (16%)"
                    bpValue={metrics.custos.impostos.bp}
                    realValue={metrics.custos.impostos.real}
                    icon={DollarSign}
                    color="red"
                    updateKey="custos.impostos.real"
                />

                <MetricCard
                    title="Despesas Fixas"
                    bpValue={metrics.custos.despesasFixas.bp}
                    realValue={metrics.custos.despesasFixas.real}
                    icon={TrendingDown}
                    color="purple"
                    updateKey="custos.despesasFixas.real"
                />

                <MetricCard
                    title="Margem Líquida"
                    bpValue={metrics.margens.lucroLiquido.bp}
                    realValue={metrics.margens.lucroLiquido.real}
                    icon={TrendingUp}
                    color="green"
                    updateKey="margens.lucroLiquido.real"
                />
            </div>

            {/* Sub-KPIs Grid (e.g., API Oficial, Inadimplência) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`bg-[#1A1A1A] border ${lastUpdated['custos.api_oficial.real'] ? 'border-blue-500 animate-pulse' : 'border-white/5'} rounded-xl p-4`}>
                    <div className="text-xs text-gray-500 mb-1">API Oficial (Realizado)</div>
                    <div className="text-xl font-bold text-blue-400">{formatCurrency(apiOficialReal)}</div>
                    <div className="text-[10px] text-gray-600 mt-1">Custo Acumulado (Vendas)</div>
                </div>

                <div className={`bg-[#1A1A1A] border ${lastUpdated['delinquency.value'] ? 'border-red-500 animate-pulse' : 'border-white/5'} rounded-xl p-4`}>
                    <div className="flex justify-between items-start mb-1">
                        <div className="text-xs text-gray-500">Inadimplência</div>
                        <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            {metrics.delinquency.rate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-xl font-bold text-red-400">{formatCurrency(metrics.delinquency.value)}</div>
                    <div className="text-[10px] text-gray-600 mt-1">Total Pendente Atrasado</div>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricCard
                    title="Receita Total"
                    bpValue={metrics.receitas.total.bp}
                    realValue={metrics.receitas.total.real}
                    icon={DollarSign}
                    color="green"
                />

                <MetricCard
                    title="COGS (Custos Variáveis)"
                    bpValue={metrics.custos.cogs.bp}
                    realValue={metrics.custos.cogs.real}
                    icon={TrendingDown}
                    color="orange"
                />

                <MetricCard
                    title="Resultado Bruto"
                    bpValue={metrics.margens.resultadoBruto.bp}
                    realValue={metrics.margens.resultadoBruto.real}
                    icon={TrendingUp}
                    color="blue"
                />

                <MetricCard
                    title="Impostos (16%)"
                    bpValue={metrics.custos.impostos.bp}
                    realValue={metrics.custos.impostos.real}
                    icon={DollarSign}
                    color="red"
                />

                <MetricCard
                    title="Despesas Fixas"
                    bpValue={metrics.custos.despesasFixas.bp}
                    realValue={metrics.custos.despesasFixas.real}
                    icon={TrendingDown}
                    color="purple"
                />

                <MetricCard
                    title="Lucro Líquido"
                    bpValue={metrics.margens.lucroLiquido.bp}
                    realValue={metrics.margens.lucroLiquido.real}
                    icon={TrendingUp}
                    color="green"
                />
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Receitas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Receita Fixa</span>
                            <div className="text-right">
                                <div className="text-white font-semibold">{formatCurrency(metrics.receitas.fixa.real)}</div>
                                <div className="text-xs text-gray-500">de {formatCurrency(metrics.receitas.fixa.bp)}</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Receita Variável</span>
                            <div className="text-right">
                                <div className="text-white font-semibold">{formatCurrency(metrics.receitas.variavel.real)}</div>
                                <div className="text-xs text-gray-500">de {formatCurrency(metrics.receitas.variavel.bp)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Costs Breakdown */}
                <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Custos</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Salários</span>
                            <div className="text-right">
                                <div className="text-white font-semibold">{formatCurrency(metrics.custos.salarios.real)}</div>
                                <div className="text-xs text-gray-500">de {formatCurrency(metrics.custos.salarios.bp)}</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Administrativo</span>
                            <div className="text-right">
                                <div className="text-white font-semibold">{formatCurrency(metrics.custos.administrativo.real)}</div>
                                <div className="text-xs text-gray-500">de {formatCurrency(metrics.custos.administrativo.bp)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessPlanMetrics;
