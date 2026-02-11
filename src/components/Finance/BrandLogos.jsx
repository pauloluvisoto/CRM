import React from 'react';

// --- Card Brands ---
const VisaLogo = (props) => (
    <svg viewBox="0 0 32 10" fill="currentColor" {...props}>
        <path d="M12.6 8.5L10.9 0H9c-.2 0-.4.1-.5.3L4.9 9.6h2l.4-1.1h2.5l.2 1.1h2.6zm-2.4-4.8l.6 2.8h-1.6l1-2.8zM14.8 0h-1.7l-1.1 9.6h2.1L14.8 0zm5.1 3.5c.3-.1.6-.2.9-.2.8 0 1.2.4 1.2.9 0 1.6-2.2 1.7-2.1 2.4 0 .3.3.5.9.5.4 0 .9-.1 1.2-.3l.2 1.4c-.4.2-1 .4-1.6.4-1.6 0-2.4-.8-2.4-2 0-2.1 2.9-2.2 2.8-3-.1-.1-.3-.2-.7-.2-.6 0-1 .2-1.4.5L18.4 2c.5-.3 1.1-.5 1.5-.5zM22 0h-1.6l2.8 9.6h1.7L29.3 1.6l-1.2 6.1c-.2.9-.7 1.9-1.8 1.9h-1l.1-.9c.4 0 .8-.2.9-.5l.2-.9.5-2.6L24.6 0h2l1.6 4.3L29.5 0h1.7L26 12.6h-2.1l-1.9-9.1z" />
    </svg>
);

const MastercardLogo = (props) => (
    <svg viewBox="0 0 24 18" fill="none" {...props}>
        <circle cx="7" cy="9" r="7" fill="currentColor" fillOpacity="0.6" />
        <circle cx="17" cy="9" r="7" fill="currentColor" fillOpacity="0.6" />
        <path d="M12 4.4a7 7 0 0 0-2.6 11.2A7 7 0 0 0 12 13.6a7 7 0 0 0 2.6 2 7 7 0 0 0-2.6-11.2z" fill="currentColor" />
    </svg>
);

const EloLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="40 20" transform="rotate(-45 12 12)" />
        <path d="M8 12h8M16 12l-3-3M16 12l-3 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Abstract representation */}
    </svg>
);

const GenericCardLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);

// --- Banks ---
const NubankLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6 18V9.5c0-.8.7-1.5 1.5-1.5S9 8.7 9 9.5v5l3-5.5c.3-.5.8-.8 1.4-.8.8 0 1.5.7 1.5 1.5v8.5c0 .8-.7 1.5-1.5 1.5S12 18.8 12 18v-5l-3 5.5c-.3.5-.8.8-1.4.8-.8 0-1.5-.7-1.5-1.5z" />
    </svg>
);

const InterLogo = (props) => (
    <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
        <path d="M10 5h5v20h-5V5zm10 0h15v5h-10v5h8v5h-8v5h10v5h-15V5zm20 0h5v20h-5V5zm10 0h5l10 20h-6l-2-4h-9l-2 4h-6l10-20zm20 0h12c4 0 8 4 8 8v1c0 3-2 5-5 6l6 5h-6l-5-5h-5v5h-5V5z" />
    </svg>
);

const ItauLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 3h4v18H3V3zm7 0h4l3 6-3 6h-4l3-6-3-6zm8 0h3v18h-3V3z" />
        {/* Simple abstract Itaú - Text is safer normally, but shapes work for recognition */}
    </svg>
);

const BradescoLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 18l8-14 8 14H4zm8-10l-4 7h8l-4-7z" />
    </svg>
);

const SantanderLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="6" cy="12" r="3" />
        <path d="M11 9h10v6H11z" />
        {/* Flame simplified */}
        <path d="M12 4c2-2 5-2 5 0 2 2-1 4-3 5-2-1-2-3-2-5z" />
    </svg>
);

const BBLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 4h7c4 0 7 3 7 7s-3 7-7 7H4V4zm7 11c2 0 4-1 4-4s-2-4-4-4H7v8h4zM16 4h4v16h-4V4z" />
    </svg>
);

const CaixaLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2 12l10-10 10 10-10 10L2 12zm10 5l5-5-5-5-5 5 5 5z" />
    </svg>
);

const GenericBankLogo = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm19-19L12 2 2 10h19V3z" />
    </svg>
);

const LOGO_MAP = {
    // Banks
    'NUBANK': NubankLogo,
    'INTER': InterLogo,
    'ITAU': ItauLogo,
    'BRADESCO': BradescoLogo,
    'SANTANDER': SantanderLogo,
    'CAIXA': CaixaLogo,
    'BB': BBLogo,

    // Cards
    'VISA': VisaLogo,
    'MASTERCARD': MastercardLogo,
    'ELO': EloLogo,
    'AMEX': GenericCardLogo, // Placeholder
    'HIPERCARD': GenericCardLogo, // Placeholder

    // Fallbacks
    'C6': GenericBankLogo,
    'BTG': GenericBankLogo,
    'XP': GenericBankLogo,
    'SICOOB': GenericBankLogo,
    'SICREDI': GenericBankLogo,
    'NEON': GenericBankLogo,
    'ORIGINAL': GenericBankLogo,
};

export const getBrandLogo = (provider) => {
    if (!provider) return null;
    const key = provider.toUpperCase().trim();
    return LOGO_MAP[key] || null;
};
