/**
 * Business Plan Service
 * Reads and processes data from schema_financeiro.json
 */

import fs from 'fs';
import path from 'path';

class BusinessPlanService {
    constructor() {
        // Fetch directly from backend (bypass proxy to avoid potential issues)
        // Use 127.0.0.1 to avoid IPv6 localhost resolution issues
        // In local development, Vite handles the proxy. In production (Vercel), it handles the relative path.
        this.schemaPath = '/api/kpis';
    }

    /**
     * Fetch business plan schema
     */
    async getSchema() {
        try {
            const response = await fetch(this.schemaPath);
            if (!response.ok) {
                throw new Error('Failed to fetch schema');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading business plan schema:', error);
            throw error;
        }
    }

    /**
     * Get aggregated metrics from schema
     */
    async getMetrics() {
        const schema = await this.getSchema();

        // Safe helper to get value
        const getVal = (obj, path) => {
            return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : 0, obj);
        };

        // Extract simplified metrics directly from the new schema structure
        const receitaFixaBP = getVal(schema, 'receitas.fixa.bp');
        const receitaFixaReal = getVal(schema, 'receitas.fixa.real');

        const receitaVariavelBP = getVal(schema, 'receitas.variavel.bp');
        const receitaVariavelReal = getVal(schema, 'receitas.variavel.real');

        const receitaTotalBP = getVal(schema, 'receitas.total.bp');       // or sum above
        const receitaTotalReal = getVal(schema, 'receitas.total.real');   // or sum above

        // Costs (Simplificado)
        // Note: The schema has 'custos' top level key based on the file content I saw
        const cogsBP = getVal(schema, 'custos.cogs.bp');
        const cogsReal = getVal(schema, 'custos.cogs.real');

        const impostosBP = getVal(schema, 'custos.impostos.bp');
        const impostosReal = getVal(schema, 'custos.impostos.real');

        const salariosBP = getVal(schema, 'custos.salarios.bp');
        const salariosReal = getVal(schema, 'custos.salarios.real');

        const administrativoBP = getVal(schema, 'custos.administrativo.bp');
        const administrativoReal = getVal(schema, 'custos.administrativo.real');

        const marketingBP = getVal(schema, 'custos.marketing.bp');
        const marketingReal = getVal(schema, 'custos.marketing.real');

        const softwareBP = getVal(schema, 'custos.software.bp');
        const softwareReal = getVal(schema, 'custos.software.real');

        // Derived or direct
        const despesasFixasBP = getVal(schema, 'custos.despesasFixas.bp');
        const despesasFixasReal = getVal(schema, 'custos.despesasFixas.real');

        const resultadoBrutoBP = getVal(schema, 'margens.resultadoBruto.bp');


        // Specific breakdown for logic (Hardcoded values or safe defaults if not in schema)
        // In this simplified schema, we don't have itemized lists, so we use 0 or derive from totals

        // This logic was looking for specific items like "Servidor", "Tokens GPT". 
        // Since the new schema is aggregated, we can't extract these individual real costs accurately 
        // without changing the schema structure again. For now, we will assume 0 or use a placeholder.
        const itCostsReal = 0;

        const inadimplenciaReal = schema.inadimplencia_total || 0;

        // Recalculate margins based on the totals we extracted
        const calculadoResultadoBrutoBP = receitaTotalBP - cogsBP;
        const calculadoResultadoBrutoReal = receitaTotalReal - cogsReal;

        const calculadoLucroLiquidoBP = calculadoResultadoBrutoBP - impostosBP - despesasFixasBP;
        const calculadoLucroLiquidoReal = calculadoResultadoBrutoReal - impostosReal - despesasFixasReal;

        return {
            receitas: {
                total: { bp: receitaTotalBP, real: receitaTotalReal },
                fixa: { bp: receitaFixaBP, real: receitaFixaReal },
                variavel: { bp: receitaVariavelBP, real: receitaVariavelReal }
            },
            custos: {
                cogs: { bp: cogsBP, real: cogsReal },
                impostos: { bp: impostosBP, real: impostosReal },
                despesasFixas: { bp: despesasFixasBP, real: despesasFixasReal },
                salarios: { bp: salariosBP, real: salariosReal },
                administrativo: { bp: administrativoBP, real: administrativoReal }
            },
            margens: {
                resultadoBruto: { bp: calculadoResultadoBrutoBP, real: calculadoResultadoBrutoReal },
                lucroLiquido: { bp: calculadoLucroLiquidoBP, real: calculadoLucroLiquidoReal }
            },
            delinquency: {
                value: inadimplenciaReal,
                rate: receitaTotalReal > 0 ? (inadimplenciaReal / (receitaTotalReal + inadimplenciaReal)) * 100 : 0
            },
            commercial: {
                leads: schema.metas_comerciais?.leads || 0,
                meetings: schema.metas_comerciais?.reunioes || 0,
                sales: schema.metas_comerciais?.vendas || 0,
                ticket: schema.metas_comerciais?.ticket_medio || 0
            },
            breakdown: {
                receitas: [
                    { label: 'Recorrente (Fixa)', BP_2026: receitaFixaBP, REAL_2026: receitaFixaReal },
                    { label: 'Nova (Variável)', BP_2026: receitaVariavelBP, REAL_2026: receitaVariavelReal }
                ],
                despesasVariaveis: [
                    { label: 'COGS', BP_2026: cogsBP, REAL_2026: cogsReal }
                ],
                despesasFixas: [
                    { label: 'Salários', BP_2026: salariosBP, REAL_2026: salariosReal },
                    { label: 'Administrativo', BP_2026: administrativoBP, REAL_2026: administrativoReal }
                ]
            }
        };
    }
}

export const businessPlanService = new BusinessPlanService();
