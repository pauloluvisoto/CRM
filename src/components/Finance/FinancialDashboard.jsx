import React from 'react';
import FinanceHeader from './FinanceHeader';
import TotalBalanceCard from './TotalBalanceCard';
import StatCard from './StatCard';
import WalletList from './WalletList';
import ExpenseBreakdown from './ExpenseBreakdown';
import TransactionHistory from './TransactionHistory';
import RecentIncome from './RecentIncome';

const FinancialDashboard = () => {
    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#141414]">
            <FinanceHeader />

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-12 gap-8 pb-20">
                {/* LEFT COLUMN (Main Stats) - Spans 8 cols */}
                <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">

                    {/* TOP ROW: Balance + Small Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[280px]">
                        {/* Big Balance Card */}
                        <TotalBalanceCard />

                        {/* Small Chart Cards */}
                        <div className="grid grid-cols-2 gap-4 h-full">
                            <StatCard
                                title="Gasto Mensal"
                                amount="R$ 32.289,12"
                                percentage="45%"
                                chartColor="#EAB308"
                            />
                            <StatCard
                                title="Renda Mensal"
                                amount="R$ 32.289,12"
                                percentage="45%"
                                chartColor="#22C55E"
                            />
                        </div>
                    </div>

                    {/* Quick Transaction Stripe */}
                    <div className="bg-[#1E1E1E] rounded-[32px] border border-white/5 p-6">
                        <h3 className="text-white font-bold mb-4">Transação Rápida</h3>
                        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
                            <button className="flex flex-col items-center gap-2 group min-w-[60px]">
                                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400 group-hover:border-green-500 group-hover:text-green-500 transition-all bg-[#141414]">
                                    <span className="text-2xl font-light">+</span>
                                </div>
                                <span className="text-xs text-gray-400 group-hover:text-green-500 transition-colors">Add</span>
                            </button>

                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] group cursor-pointer">
                                    <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-transparent group-hover:border-green-500 transition-all overflow-hidden relative">
                                        <img className="object-cover w-full h-full" src={`https://i.pravatar.cc/150?u=${i + 20}`} alt="User" />
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Person {i}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <ExpenseBreakdown />
                        {/* We need to be careful with space here. 
                             If ExpenseBreakdown takes half, where does History go?
                             In the screenshot, History seems to be Full Width below.
                             Let's keep Expense Breakdown here next to... something? 
                             Or maybe just Transaction History below and side-by-side with something else?
                             Let's follow the User's Screenshot accurately:
                             Left Col has: Balance Row, Quick Tx, Expense Breakdown (Left), Transaction History (?)
                             Let's assume Expense Breakdown sits next to History on large screens or History is below.
                             Let's put History below for better table view.
                             Wait, Expense Breakdown needs a partner in the grid or full width?
                             Let's make Expense Breakdown half width and put a placeholder or "Loans" summary next to it?
                             Actually, let's just put Transaction History FULL WIDTH below everything else in this column.
                             And Expense Breakdown can be on the Right Sidebar?
                             NO, Figma shows Expense Breakdown with "Total Expense $74,182" text.
                             Let's leave Expense Breakdown where it is (taking full width of its container or half).
                             Let's try putting it side-by-side with something, or just full width.
                             Full width Donut is weird.
                             Let's move Expense Breakdwon to the RIGHT COLUMN (Sub-sidebar)?
                             In the screenshot, the "Donut" is in the middle?
                             Re-checking screenshot 2371:
                             The Donut is in the "Expense Breakdown" card.
                             This card is in the main grid.
                             Let's place it next to a "Transaction History" summary?
                             No, let's stick to the code structure I devised: 
                             History is Full Width. Expense Breakdown is... wait, where?
                             Let's put Expense Breakdown above History, taking full width for now (flex row inside).
                          */}
                        <ExpenseBreakdown />
                        {/* Empy slot for now, or maybe make Expense Breakdown full width? */}
                    </div>
                    <TransactionHistory />

                </div>

                {/* RIGHT COLUMN (Sidebar/Details) - Spans 4 cols */}
                <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
                    <WalletList />
                    <RecentIncome />
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
