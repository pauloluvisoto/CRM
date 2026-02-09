
/**
 * Synchronizes colors between Pipeline stages and Dashboard cards based on name patterns.
 * Ensures visual identity even if database records are inconsistent.
 */
export const getSyncColor = (name, currentColor) => {
    if (!name) return currentColor || '#3b82f6';

    const n = name.toUpperCase();

    // GREEN: Success and Won (Highest priority for composite names like "Meeting -> Won")
    if (n.includes('FECHADO') || n.includes('FECHAMENTO') || n.includes('GANHO') || n.includes('ONBOARDING')) {
        return '#10b981';
    }

    // BLUE: Leads and Initial Approach
    if (n.includes('NOVO LEAD') || n.includes('PROSPECTO') || n.includes('ABORDAGEM') || n.includes('PROPOSTA') || n.includes('CONTRATO')) {
        return '#3b82f6';
    }

    // AMBER: Qualification and Waiting (Value in Pipeline)
    if (n.includes('QUALIFICA') || n.includes('AGUARDANDO') || n.includes('DIAGN')) {
        return '#f59e0b';
    }

    // INDIGO: Meetings and Solutions
    if (n.includes('AGENDADA') || n.includes('REUNI') || n.includes('RVP')) {
        return '#6366f1';
    }

    // PURPLE: Conversions and Decisions
    if (n.includes('FOLLOW UP') || n.includes('FOLLOW-UP') || n.includes('DECIS')) {
        return '#a855f7';
    }

    // RED: Lost and No-Show
    if (n.includes('NO SHOW') || n.includes('PERDIDO') || n.includes('PERDA')) {
        return '#ef4444';
    }

    return currentColor || '#3b82f6';
};
