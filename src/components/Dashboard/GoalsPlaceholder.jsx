import React from 'react';
import { Target } from 'lucide-react';

const GoalsPlaceholder = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 bg-lime-500/10 rounded-2xl flex items-center justify-center text-lime-400 mb-6 relative z-10 border border-lime-500/20">
                <Target size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Metas Financeiras</h2>
            <p className="text-zinc-400 text-center max-w-md relative z-10">
                Em breve você poderá definir e acompanhar suas metas financeiras diretamente por aqui.
            </p>
        </div>
    );
};

export default GoalsPlaceholder;
