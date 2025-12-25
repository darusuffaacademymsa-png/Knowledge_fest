import React, { useState, useMemo } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { useTimer } from '../store/TimerContext';
import { PerformanceType } from '../types';
import { 
    Play, Pause, RotateCcw, Search, ChevronRight, 
    ArrowRightLeft, Clock, AlertTriangle, 
    Volume2, VolumeX, Bell, Layers
} from 'lucide-react';

const formatTime = (totalSeconds: number) => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// --- Color Logic ---
const CATEGORY_COLORS = ['#006994', '#d4a574', '#1b5e20', '#80deea'];

const getCategoryHex = (categoryId: string) => {
    if (!categoryId) return '#6366f1'; // Default indigo
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
        hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

// --- Reusable Section Header ---
const SectionTitle = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]"></div>
        <h3 className="text-xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">
            {title}
        </h3>
        {Icon && <Icon className="text-zinc-400 ml-1" size={18} />}
    </div>
);

const ItemTimerPage: React.FC = () => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const { 
        activeItem, timeLeft, isRunning, isMuted, initialDuration,
        startTimer, togglePause, resetTimer, clearTimer, toggleMute, triggerManualBell
    } = useTimer();
    
    // Filter Items Logic using Global State
    const filteredItems = useMemo(() => {
        if (!state) return { onStage: [], offStage: [] };
        
        let items = state.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesCat = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const matchesPerf = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(item.performanceType) : true;
            return matchesSearch && matchesCat && matchesPerf;
        });

        items.sort((a,b) => a.name.localeCompare(b.name));

        return {
            onStage: items.filter(i => i.performanceType === PerformanceType.ON_STAGE),
            offStage: items.filter(i => i.performanceType === PerformanceType.OFF_STAGE)
        };
    }, [state, globalSearchTerm, globalFilters]);

    const handleSwitchItem = () => {
        if (isRunning) {
            if (!confirm("Timer is currently running. Are you sure you want to switch items?")) return;
        }
        clearTimer();
    };

    // Determine visual state
    const isWarning = timeLeft <= 60 && timeLeft > 0;
    const isEnded = timeLeft <= 0;
    const isOvertimeCritical = timeLeft <= -60;

    const activeCategoryHex = activeItem ? getCategoryHex(activeItem.categoryId) : '#6366f1';

    const getStatusColor = () => {
        if (isOvertimeCritical) return 'text-rose-600 dark:text-rose-500';
        if (isEnded) return 'text-amber-600 dark:text-amber-500';
        if (isWarning) return 'text-amber-500 dark:text-amber-400';
        return ''; // Handled by style prop for custom hex
    };

    const getBgTint = () => {
        if (isOvertimeCritical) return 'bg-rose-50/50 dark:bg-rose-900/10';
        if (isEnded || isWarning) return 'bg-amber-50/50 dark:bg-amber-900/10';
        return ''; // Handled by style prop for custom hex
    };

    if (!state) return <div className="p-20 text-center italic text-zinc-500">Synchronizing...</div>;

    // --- VIEW: ITEM SELECTION ---
    if (!activeItem) {
        return (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {[
                        { label: 'On Stage', items: filteredItems.onStage, color: 'bg-indigo-500' },
                        { label: 'Off Stage', items: filteredItems.offStage, color: 'bg-zinc-400' }
                    ].map((section) => {
                        if (section.items.length === 0) return null;
                        return (
                            <div key={section.label} className="space-y-6">
                                <div className="flex items-center gap-2.5 px-2">
                                    <div className={`w-2 h-2 rounded-full ${section.color} shadow-[0_0_8px_currentColor]`}></div>
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em]">{section.label} Items</h3>
                                </div>
                                <div className="space-y-3">
                                    {section.items.map(item => {
                                        const catHex = getCategoryHex(item.categoryId);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => startTimer(item)}
                                                className="w-full flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-3xl border-l-4 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group text-left shadow-sm overflow-hidden relative"
                                                style={{ borderLeftColor: catHex }}
                                            >
                                                {/* Background accent glow on hover */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" style={{ backgroundColor: catHex }}></div>
                                                
                                                <div className="min-w-0 pr-4 relative z-10">
                                                    <h4 className="font-black text-amazio-primary dark:text-zinc-100 text-lg uppercase tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span 
                                                            className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                                                            style={{ 
                                                                backgroundColor: `${catHex}15`, 
                                                                color: catHex, 
                                                                borderColor: `${catHex}40` 
                                                            }}
                                                        >
                                                            {state.categories.find(c => c.id === item.categoryId)?.name}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                            <Clock size={12} className="opacity-50" /> {item.duration}m
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white transition-all relative z-10" style={{ '--hover-bg': catHex } as any}>
                                                    <ChevronRight size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {filteredItems.onStage.length === 0 && filteredItems.offStage.length === 0 && (
                    <div className="py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-30">
                        <Clock size={64} strokeWidth={1} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">No matching events in queue</p>
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW: TIMER ACTIVE ---
    return (
        <div className={`flex flex-col h-[calc(100vh-140px)] rounded-[3rem] overflow-hidden transition-all duration-700 bg-white dark:bg-[#121412] shadow-glass-light dark:shadow-2xl border border-amazio-primary/5 dark:border-white/5 relative`}>
            
            {/* Ambient Background Glow matching category state */}
            <div 
                className={`absolute inset-0 transition-colors duration-1000 ${getBgTint() || 'opacity-10'}`} 
                style={!getBgTint() ? { backgroundColor: activeCategoryHex } : {}}
            ></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply pointer-events-none"></div>

            {/* Header Toolbar */}
            <div className="relative z-10 p-8 flex justify-between items-start">
                <button 
                    onClick={handleSwitchItem}
                    className="flex items-center gap-2.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all bg-white/60 dark:bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-zinc-100 dark:border-white/10 shadow-sm"
                >
                    <ArrowRightLeft size={16} strokeWidth={3} /> Switch Item
                </button>
                <button 
                    onClick={toggleMute}
                    className={`p-4 rounded-2xl transition-all shadow-sm border ${isMuted ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200' : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-white/10 hover:bg-zinc-50'}`}
                >
                    {isMuted ? <VolumeX size={20} strokeWidth={2.5} /> : <Volume2 size={20} strokeWidth={2.5} />}
                </button>
            </div>

            {/* Timer Display Body */}
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center relative z-10">
                
                <div className="mb-8">
                    <div 
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm mb-4"
                        style={{ 
                            backgroundColor: `${activeCategoryHex}15`, 
                            color: activeCategoryHex, 
                            borderColor: `${activeCategoryHex}40` 
                        }}
                    >
                        <Layers size={12} /> {state.categories.find(c => c.id === activeItem?.categoryId)?.name}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-serif text-amazio-primary dark:text-white leading-none tracking-tight uppercase">
                        {activeItem?.name}
                    </h1>
                </div>

                <div className="relative">
                    <div 
                        className={`text-[10rem] sm:text-[12rem] md:text-[14rem] font-black font-mono leading-none tracking-tighter transition-all duration-500 tabular-nums drop-shadow-sm ${getStatusColor()}`}
                        style={!getStatusColor() ? { color: activeCategoryHex } : {}}
                    >
                        {formatTime(timeLeft)}
                    </div>
                    
                    {/* Visual Status Alerts */}
                    <div className="absolute -bottom-10 left-0 right-0 h-10 flex flex-col items-center justify-center">
                        {isOvertimeCritical ? (
                            <span className="bg-rose-600 text-white px-6 py-2 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl flex items-center gap-2 animate-bounce">
                                <AlertTriangle size={18} strokeWidth={3}/> Time Exceeded
                            </span>
                        ) : isEnded ? (
                            <span className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Session Time Up</span>
                        ) : isWarning ? (
                            <span className="text-amber-500 dark:text-amber-400 font-black uppercase tracking-[0.3em] text-xs animate-pulse">Final Minute</span>
                        ) : (
                            <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Timing in Progress</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Control Station */}
            <div className="relative z-10 flex flex-col items-center gap-10 pb-16 px-8 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-black/95 dark:via-black/80 dark:to-transparent pt-12">
                
                {/* Manual Signal Controls */}
                <div className="flex gap-4 p-1.5 bg-zinc-100 dark:bg-white/5 rounded-[1.5rem] border border-zinc-200 dark:border-white/10 shadow-inner">
                    {[
                        { count: 1, label: 'Warning', style: 'text-amber-600 bg-white dark:bg-zinc-800' },
                        { count: 2, label: 'Time Up', style: 'text-amber-700 bg-white dark:bg-zinc-800' },
                        { count: 4, label: 'Critical', style: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800' }
                    ].map(bell => (
                        <button 
                            key={bell.count}
                            onClick={() => triggerManualBell(bell.count)}
                            className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 border border-transparent ${bell.style}`}
                        >
                            <Bell size={12} fill="currentColor" /> {bell.count} Bell{bell.count > 1 ? 's' : ''}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-10">
                    <button 
                        onClick={resetTimer}
                        className="p-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 border border-zinc-200 dark:border-white/5 shadow-sm"
                        title="Reset Timeline"
                    >
                        <RotateCcw size={32} strokeWidth={2.5} />
                    </button>

                    <button 
                        onClick={togglePause}
                        className={`w-32 h-32 rounded-[3.5rem] shadow-2xl transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center border-4 border-white dark:border-zinc-800 ${
                            isRunning 
                            ? 'bg-amber-500 text-white shadow-amber-500/30' 
                            : 'bg-indigo-600 text-white shadow-indigo-600/30'
                        }`}
                        style={!isRunning ? { backgroundColor: activeCategoryHex, shadowColor: `${activeCategoryHex}40` } : {}}
                    >
                        {isRunning ? <Pause size={56} fill="currentColor" /> : <Play size={56} fill="currentColor" className="ml-3" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemTimerPage;