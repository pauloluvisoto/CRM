import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const FinanceHeader = () => {
    const { user } = useAuth();
    const userName = user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Bem-vindo de volta <span className="text-2xl">👋</span>
                </h1>
                <p className="text-2xl font-semibold text-white mt-1 capitalize">{userName}</p>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell size={24} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#141414]"></span>
                </button>

                <div className="flex items-center gap-3 bg-[#1E1E1E] border border-white/5 rounded-full pl-2 pr-4 py-1.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-black font-bold text-xs uppercase">
                        {userName[0]}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight capitalize">{userName}</span>
                        <span className="text-[10px] text-gray-400 leading-tight">{user?.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceHeader;
