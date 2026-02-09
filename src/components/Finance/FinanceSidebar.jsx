import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, ArrowRightLeft, FileText, CreditCard, PieChart, TrendingUp } from 'lucide-react';

const FinanceSidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/finance', end: true },
        { icon: Wallet, label: 'Minha Carteira', path: '/finance/wallet' },
        { icon: ArrowRightLeft, label: 'Transações', path: '/finance/transactions' },
        { icon: CreditCard, label: 'Contas', path: '/finance/accounts' },
        { icon: FileText, label: 'Relatórios', path: '/finance/reports' },
        { icon: TrendingUp, label: 'Business Plan', path: '/finance/business-plan' },
    ];

    return (
        <div className="w-64 bg-[#18181b] border-r border-white/5 flex flex-col h-full hidden lg:flex">
            <div className="p-6">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Módulo Financeiro</h2>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-[#22C55E] text-black font-bold shadow-lg shadow-green-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Helper Card */}
            <div className="mt-auto p-6">
                <div className="bg-gradient-to-br from-[#22C55E]/20 to-transparent border border-[#22C55E]/20 rounded-2xl p-4">
                    <p className="text-xs text-[#22C55E] font-bold mb-1">Dica Pro</p>
                    <p className="text-xs text-gray-300 mb-3">Mantenha suas contas reconciliadas diariamente.</p>
                    <button className="text-xs bg-[#22C55E] text-black px-3 py-1.5 rounded-lg font-bold w-full hover:bg-[#16a34a] transition-colors">
                        Novo Lançamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinanceSidebar;
