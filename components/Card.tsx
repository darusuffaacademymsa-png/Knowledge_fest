
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, action }) => {
  return (
    <div className={`relative bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] shadow-sm md:shadow-md border border-zinc-200 dark:border-zinc-800 group overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-glass-hover hover:bg-white dark:hover:bg-zinc-900/80 hover:-translate-y-1 ${className}`}>
      
      {/* Rim Light Gradient on Top Border - Adapts to Theme */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amazio-secondary/30 dark:via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/[0.3] dark:bg-white/[0.01]">
        <div className="flex items-center gap-3">
             <div className="h-4 w-1 bg-emerald-600 dark:bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
             <h3 className="text-lg font-black font-serif text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
            </h3>
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
