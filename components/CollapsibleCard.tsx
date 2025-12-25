
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children, defaultOpen = false, className }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-50/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            >
                {title}
                {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            {isOpen && <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">{children}</div>}
        </div>
    );
};
