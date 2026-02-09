import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPlaceholder = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-6 relative z-10 border border-zinc-700">
                <Settings size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Configurações Financeiras</h2>
            <p className="text-zinc-400 text-center max-w-md relative z-10">
                Em breve: Categorias, formas de pagamento, e outras configurações avançadas.
            </p>
        </div>
    );
};

export default SettingsPlaceholder;
