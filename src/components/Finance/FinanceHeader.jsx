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


            </div>
        </div>
    );
};

export default FinanceHeader;
