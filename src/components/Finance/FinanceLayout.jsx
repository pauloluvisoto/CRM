import React from 'react';
import { Outlet } from 'react-router-dom';
import FinanceSidebar from './FinanceSidebar';

const FinanceLayout = () => {
    return (
        <div className="flex h-full w-full bg-[#141414]">
            <FinanceSidebar />
            <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6">
                <Outlet />
            </div>
        </div>
    );
};

export default FinanceLayout;
