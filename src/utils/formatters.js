/**
 * Formata valores monetários para o padrão brasileiro
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} Valor formatado como moeda brasileira
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

/**
 * Formata números com separadores de milhar
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} Valor formatado com separadores
 */
export const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata porcentagens
 * @param {number} value - Valor numérico (0-100)
 * @returns {string} Valor formatado como percentual
 */
export const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }

    return `${value.toFixed(2)}%`;
};

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada como dd/mm/yyyy
 */
export const formatDate = (date) => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('pt-BR');
};

/**
 * Formata data e hora para padrão brasileiro
 * @param {string|Date} date - Data/hora a ser formatada
 * @returns {string} Data/hora formatada
 */
export const formatDateTime = (date) => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleString('pt-BR');
};
