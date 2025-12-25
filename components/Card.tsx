
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, action }) => {
  return (
    <div className={`relative bg-amazio-light-surface/60 dark:bg-amazio-surface/60 backdrop-blur-xl rounded-2xl shadow-glass-light dark:shadow-glass border border-amazio-primary/5 dark:border-white/5 group overflow-hidden transition-all duration-300 hover:shadow-glass-light-hover dark:hover:shadow-glass-hover hover:bg-amazio-light-surface/80 dark:hover:bg-amazio-surface/80 hover:-translate-y-1 ${className}`}>
      
      {/* Rim Light Gradient on Top Border - Adapts to Theme */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amazio-secondary/30 dark:via-amazio-accent/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-center border-b border-amazio-primary/5 dark:border-white/5 bg-amazio-primary/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
             <div className="h-4 w-1 bg-amazio-secondary dark:bg-amazio-accent rounded-full shadow-[0_0_8px_rgba(77,90,42,0.3)] dark:shadow-[0_0_8px_rgba(154,168,106,0.5)]"></div>
             <h3 className="text-lg font-bold font-serif text-amazio-primary dark:text-white tracking-wide">
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
