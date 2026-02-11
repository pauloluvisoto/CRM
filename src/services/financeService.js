import { supabase } from '../lib/supabaseClient';

const financeService = {

    // --- Categories ---
    async getCategories() {
        const { data, error } = await supabase
            .from('transaction_categories')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    async createCategory(category) {
        const { data, error } = await supabase
            .from('transaction_categories')
            .insert([category])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateCategory(id, updates) {
        const { data, error } = await supabase
            .from('transaction_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCategory(id) {
        const { error } = await supabase
            .from('transaction_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // --- Automation Rules ---
    async getAutomationRules() {
        const { data, error } = await supabase
            .from('finance_automation_rules')
            .select('*, transaction_categories(name)')
            .order('name');
        if (error) throw error;
        return data;
    },

    async createAutomationRule(rule) {
        const { data, error } = await supabase
            .from('finance_automation_rules')
            .insert([rule])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateAutomationRule(id, updates) {
        const { data, error } = await supabase
            .from('finance_automation_rules')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteAutomationRule(id) {
        const { error } = await supabase
            .from('finance_automation_rules')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // --- Receivables ---
    async getReceivables() {
        const { data, error } = await supabase
            .from('accounts_receivable')
            .select('*, transaction_categories(id, name, group)')
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },


    async createReceivable(receivable) {
        const { data, error } = await supabase
            .from('accounts_receivable')
            .insert([receivable])
            .select()
            .single();

        if (error) throw error;

        // Trigger Automation Rules
        try {
            const { data: rules } = await supabase
                .from('finance_automation_rules')
                .select('*')
                .eq('active', true)
                .eq('trigger_source', 'income');

            if (rules && rules.length > 0) {
                const expenses = rules.map(rule => {
                    let expenseAmount = 0;
                    if (rule.calculation_type === 'fixed') {
                        expenseAmount = Number(rule.fixed_amount);
                    } else {
                        // Default to percentage
                        expenseAmount = (Number(receivable.amount) * Number(rule.percentage)) / 100;
                    }

                    return {
                        description: `[Auto] ${rule.name} - ${receivable.description}`,
                        amount: expenseAmount,
                        due_date: receivable.due_date,
                        status: 'pending',
                        category: rule.name, // Legacy text field
                        category_id: rule.target_category_id,
                        wallet_id: receivable.wallet_id
                    };
                });

                if (expenses.length > 0) {
                    await supabase.from('accounts_payable').insert(expenses);
                }
            }
        } catch (autoError) {
            console.error("Automation Error:", autoError);
        }

        return data;
    },

    async updateReceivable(id, receivable) {
        const { data, error } = await supabase
            .from('accounts_receivable')
            .update(receivable)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateReceivableStatus(id, status) {
        const { data, error } = await supabase
            .from('accounts_receivable')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteReceivable(id) {
        const { error } = await supabase
            .from('accounts_receivable')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // --- Payables ---
    async getPayables() {
        const { data, error } = await supabase
            .from('accounts_payable')
            .select('*, transaction_categories(id, name, group)')
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createPayable(payable) {
        const { data, error } = await supabase
            .from('accounts_payable')
            .insert([payable])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePayable(id, payable) {
        const { data, error } = await supabase
            .from('accounts_payable')
            .update(payable)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },


    async updatePayableStatus(id, status) {
        const { data, error } = await supabase
            .from('accounts_payable')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async payCreditCardBill(walletId) {
        // 1. Get all pending expenses for this wallet
        const { data: expenses, error: fetchError } = await supabase
            .from('accounts_payable')
            .select('id')
            .eq('wallet_id', walletId)
            .eq('status', 'pending');

        if (fetchError) throw fetchError;
        if (!expenses || expenses.length === 0) return { count: 0 };

        const ids = expenses.map(e => e.id);

        // 2. Mark them as paid
        // We set paid_date to TODAY (User is paying the bill now)
        const { error: updateError } = await supabase
            .from('accounts_payable')
            .update({
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0]
            })
            .in('id', ids);

        if (updateError) throw updateError;

        return { count: ids.length };
    },

    async deletePayable(id) {
        const { error } = await supabase
            .from('accounts_payable')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // --- Recurring Operations ---
    async deleteRecurringReceivable(recurrenceId, fromDate) {
        const { error } = await supabase
            .from('accounts_receivable')
            .delete()
            .eq('recurrence_id', recurrenceId)
            .gte('due_date', fromDate);

        if (error) throw error;
        return true;
    },

    async deleteRecurringPayable(recurrenceId, fromDate) {
        const { error } = await supabase
            .from('accounts_payable')
            .delete()
            .eq('recurrence_id', recurrenceId)
            .gte('due_date', fromDate);

        if (error) throw error;
        return true;
    },

    async updateRecurringReceivable(recurrenceId, fromDate, payload) {
        const { error } = await supabase
            .from('accounts_receivable')
            .update(payload)
            .eq('recurrence_id', recurrenceId)
            .gte('due_date', fromDate);

        if (error) throw error;
        return true;
    },

    async updateRecurringPayable(recurrenceId, fromDate, payload) {
        const { error } = await supabase
            .from('accounts_payable')
            .update(payload)
            .eq('recurrence_id', recurrenceId)
            .gte('due_date', fromDate);

        if (error) throw error;
        return true;
    },

    // --- Wallets ---
    async getWallets() {
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createWallet(wallet) {
        const { data, error } = await supabase
            .from('wallets')
            .insert([wallet])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateWallet(id, wallet) {
        const { data, error } = await supabase
            .from('wallets')
            .update(wallet)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteWallet(id) {
        const { error } = await supabase
            .from('wallets')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // --- Dashboard Aggregation ---
    async getDashboardMetrics() {
        // Fetch specific fields to minimize data transfer
        const { data: incomeData, error: incomeError } = await supabase
            .from('accounts_receivable')
            .select('amount, status, due_date');

        const { data: expenseData, error: expenseError } = await supabase
            .from('accounts_payable')
            .select('amount, status, due_date, category');

        if (incomeError) throw incomeError;
        if (expenseError) throw expenseError;

        // Calculate Totals
        const totalIncome = incomeData
            .filter(i => i.status === 'received') // Or 'pending' depending on logic (usually realized income)
            .reduce((sum, item) => sum + Number(item.amount), 0);

        const totalExpense = expenseData
            .filter(e => e.status === 'paid') // Or 'pending' for projected
            .reduce((sum, item) => sum + Number(item.amount), 0);

        const projectedIncome = incomeData.reduce((sum, item) => sum + Number(item.amount), 0);
        const projectedExpense = expenseData.reduce((sum, item) => sum + Number(item.amount), 0);

        const balance = totalIncome - totalExpense;
        const projectedBalance = projectedIncome - projectedExpense;

        return {
            totalIncome,
            totalExpense,
            balance,
            projectedIncome,
            projectedExpense,
            projectedBalance
        };
    },

    async getExpenseBreakdown() {
        const { data, error } = await supabase
            .from('accounts_payable')
            .select('amount, category')
            .eq('status', 'paid'); // Only count paid expenses for breakdown

        if (error) throw error;

        // Group by category
        const breakdown = data.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
            return acc;
        }, {});

        // Format for Chart (Sort by valid categories from SQL if known, or just amount)
        return Object.entries(breakdown)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    },

    async getRecentTransactions(limit = 5) {
        // We can't easily UNION diverse tables with simple Supabase client query
        // So we fetch latest from both and merge in JS
        const { data: recentIncome, error: incomeError } = await supabase
            .from('accounts_receivable')
            .select('id, description, amount, due_date, status, category')
            .order('created_at', { ascending: false })
            .limit(limit);

        const { data: recentExpense, error: expenseError } = await supabase
            .from('accounts_payable')
            .select('id, description, amount, due_date, status, category')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (incomeError) throw incomeError;
        if (expenseError) throw expenseError;

        const combined = [
            ...recentIncome.map(i => ({ ...i, type: 'income', date: i.due_date })),
            ...recentExpense.map(e => ({ ...e, type: 'expense', date: e.due_date }))
        ];

        // Sort by Date DESC and take top N
        return combined
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    },

    async getBusinessPlanRealData() {
        // Fetch raw transactions
        const { data: income, error: incomeError } = await supabase
            .from('accounts_receivable')
            .select('amount, due_date, category_id, transaction_categories(group)');

        const { data: expense, error: expenseError } = await supabase
            .from('accounts_payable')
            .select('amount, due_date, category_id, transaction_categories(group)');

        if (incomeError) throw incomeError;
        if (expenseError) throw expenseError;

        // Bucket by Month
        const monthlyData = {};

        // Helper to init month
        const getMonthKey = (dateStr) => {
            if (!dateStr) return null;
            return dateStr.substring(0, 7); // YYYY-MM
        };

        const addToMonth = (date, field, value) => {
            const key = getMonthKey(date);
            if (!key) return;
            if (!monthlyData[key]) {
                monthlyData[key] = { revenue: 0, cogs: 0, opex: 0, marketing: 0, taxes: 0, netIncome: 0, ebitda: 0, grossMargin: 0 };
            }
            monthlyData[key][field] += Number(value);
        };

        // Process Income (Revenue)
        income.forEach(item => {
            addToMonth(item.due_date, 'revenue', item.amount);
        });

        // Process Expenses
        expense.forEach(item => {
            const amount = Number(item.amount);
            const group = item.transaction_categories?.group || 'opex'; // Default to OpEx if uncategorized

            // Map groups to fields
            let targetField = 'opex';
            if (group === 'cogs') targetField = 'cogs';
            if (group === 'marketing') targetField = 'marketing';
            if (group === 'taxes') targetField = 'taxes';

            addToMonth(item.due_date, targetField, amount);
        });

        // Calculate Derived Metrics for each month
        Object.keys(monthlyData).forEach(key => {
            const m = monthlyData[key];
            m.grossMargin = m.revenue - m.cogs;
            m.ebitda = m.grossMargin - m.opex - m.marketing; // Simplified EBITDA
            m.netIncome = m.ebitda - m.taxes; // Deduct taxes
        });

        return monthlyData;
    },

    // --- Tax Rates ---
    async getMonthlyTaxRates() {
        const { data, error } = await supabase.from('finance_monthly_tax_rates').select('*');
        if (error) throw error;
        return data.reduce((acc, item) => {
            acc[item.month] = Number(item.rate);
            return acc;
        }, {});
    },

    async upsertMonthlyTaxRate(month, rate) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('finance_monthly_tax_rates')
            .upsert({ month, rate, user_id: user.id }, { onConflict: 'month,user_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- CRM Integration ---
    async registerLocalSale(commission = 0) {
        try {
            const response = await fetch('http://localhost:3001/api/sales/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commission })
            });
            return await response.json();
        } catch (error) {
            console.error("Local Sync Error (JSON):", error);
            return null;
        }
    },

    async syncSaleFromDeal(deal) {
        console.log(`%c 💰 [FINANCE] Starting sync for deal: ${deal.title || deal.empresa_cliente}`, 'color: #10b981; font-weight: bold;');

        try {
            // 0. Get Auth User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado no Supabase");

            const amount = Number(deal.faturamento_mensal) || Number(deal.value) || 597;
            const commission = amount > 597 ? (amount - 597) : 0;

            // 1. Check Wallets
            const wallets = await this.getWallets();
            console.log(`  Found ${wallets.length} wallets`);
            if (wallets.length === 0) {
                console.error("  ❌ No wallets found. Cannot create financial records without a wallet.");
                return { success: false, error: "No wallets found" };
            }

            const defaultWalletId = wallets[0].id;

            // 2. Create Receivable (Realized income)
            // WE ADD A UNIQUE TAG IN DESCRIPTION TO ALLOW ROLLBACK: [CRM-ID:XXX]
            const syncTag = `[CRM-ID:${deal.id || 'NO-ID'}]`;
            console.log(`[SYNC DEBUG] Generated Tag: ${syncTag}`);

            const receivable = {
                description: `TAG-V4 ${syncTag} Venda - ${deal.company || deal.title || deal.empresa_cliente}`,

                amount: amount,
                due_date: new Date().toISOString().split('T')[0],
                status: 'received',
                category: 'Venda CRM',
                wallet_id: defaultWalletId,
                created_by: user.id
            };

            console.log("  Creating receivable...", receivable);
            const createdReceivable = await this.createReceivable(receivable);
            console.log("  ✅ Receivable created:", createdReceivable?.id);

            // 3. Create COGS (Fixed costs per sale)
            const cogs = [
                { name: 'Servidor', value: 10 },
                { name: 'Tokens GPT', value: 10 },
                { name: 'API e Telefonia', value: 230 }
            ];

            const payables = cogs.map(c => ({
                description: `TAG-V4 ${syncTag} [COGS] ${c.name} - ${deal.company || deal.title || deal.empresa_cliente}`,

                amount: c.value,
                due_date: new Date().toISOString().split('T')[0],
                status: 'paid',
                category: c.name,
                wallet_id: defaultWalletId,
                created_by: user.id
            }));

            console.log("  Creating payables...", payables.length);
            const { error: payError } = await supabase.from('accounts_payable').insert(payables);
            if (payError) throw payError;
            console.log("  ✅ Payables created");

            // 4. Update Local JSON Dashboard
            console.log("  Updating local KPI server...");
            const localResult = await this.registerLocalSale(commission);
            console.log("  ✅ Local sync result:", localResult);

            return { success: true, receivable: createdReceivable };
        } catch (error) {
            console.error("  ❌ Finance Sync Error:", error);
            throw error;
        }
    },

    async rollbackSaleSync(dealId) {
        console.log(`%c 🔄 [FINANCE] Rolling back sync for deal ID: ${dealId}`, 'color: #f59e0b; font-weight: bold;');
        const syncTag = `[CRM-ID:${dealId}]`;

        try {
            // 1. Delete Receivables
            const { error: recError } = await supabase
                .from('accounts_receivable')
                .delete()
                .ilike('description', `%${syncTag}%`);

            if (recError) throw recError;
            console.log("  ✅ Receivables rolled back");

            // 2. Delete Payables
            const { error: payError } = await supabase
                .from('accounts_payable')
                .delete()
                .ilike('description', `%${syncTag}%`);

            if (payError) throw payError;
            console.log("  ✅ Payables rolled back");

            return { success: true };
        } catch (error) {
            console.error("  ❌ Rollback Error:", error);
            throw error;
        }
    }


};

export default financeService;
