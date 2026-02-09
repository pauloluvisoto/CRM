import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FinanceLayout from '../components/Finance/FinanceLayout';
import FinancialDashboard from '../components/Finance/FinancialDashboard';
import WalletView from '../components/Finance/WalletView';
import FinanceTransactions from '../components/Finance/FinanceTransactions';

import FinanceAccounts from '../components/Finance/FinanceAccounts';
import FinanceReports from '../components/Finance/FinanceReports';
import FinanceBusinessPlan from '../components/Finance/FinanceBusinessPlan';

const Finance = () => {
    console.log("Finance Page Rendering...");
    return (
        <Routes>
            <Route element={<FinanceLayout />}>
                <Route index element={<FinancialDashboard />} />
                <Route path="wallet" element={<WalletView />} />
                <Route path="transactions" element={<FinanceTransactions />} />
                <Route path="accounts" element={<FinanceAccounts />} />
                <Route path="reports" element={<FinanceReports />} />
                <Route path="business-plan" element={<FinanceBusinessPlan />} />
                <Route path="*" element={<Navigate to="/finance" replace />} />
            </Route>
        </Routes>
    );
};

export default Finance;
