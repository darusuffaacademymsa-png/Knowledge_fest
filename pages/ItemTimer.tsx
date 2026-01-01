import React, { useState, useMemo } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { useTimer } from '../store/TimerContext';
import { PerformanceType } from '../types';
import { 
    Play, Pause, RotateCcw, Search, ChevronRight, 
    ArrowRightLeft, Clock, AlertTriangle, 
    Volume2, VolumeX, Bell, Layers, X
} from 'lucide-react';

const formatTime = (totalSeconds: number) => {
    const isNegative = totalSeconds < 0;
    const absSeconds = Math.abs(totalSeconds);
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;
    return `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const CATEGORY_COLORS = ['#006994', '#d4a574', '#1b5e20', '#80deea'];

const getCategoryHex = (categoryId: string) => {
    if (!categoryId) return '#6366f1'; 
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
        hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

const ItemTimerPage: React.FC = () => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const { 
        activeItem, timeLeft, isRunning, isMuted,
        startTimer, togglePause, resetTimer, clearTimer, toggleMute, triggerManualBell
    } = useTimer();
    
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

    const isWarning = timeLeft <= 60 && timeLeft > 0;
    const isEnded = timeLeft <= 0;
    const isOvertimeCritical = timeLeft <= -60;
    const activeCategoryHex = activeItem ? getCategoryHex(activeItem.categoryId) : '#6366f1';

    if (!state) return null;

    if (!activeItem) {
        return (
            <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {[
                        { label: 'On Stage', items: filteredItems.onStage, color: 'bg-indigo-500' },
                        { label: 'Off Stage', items: filteredItems.offStage, color: 'bg-zinc-400' }
                    ].map((section) => {
                        if (section.items.length === 0) return null;
                        return (
                            <div key={section.label} className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{section.label}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                    {section.items.map(item => {
                                        const catHex = getCategoryHex(item.categoryId);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => startTimer(item)}
                                                className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group shadow-sm"
                                            >
                                                <div className="min-w-0 pr-4">
                                                    <h4 className="font-black text-black dark:text-zinc-100 text-sm uppercase tracking-tight truncate leading-tight">
                                                        {item.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black text-zinc-400 uppercase">{state.categories.find(c => c.id === item.categoryId)?.name}</span>
                                                        <span className="text-[8px] font-bold text-zinc-300">•</span>
                                                        <span className="text-[8px] font-black text-zinc-400 uppercase">{item.duration}m</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-zinc-300 group-hover:text-indigo-500" strokeWidth={3} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col transition-all duration-700 bg-white dark:bg-[#0F1210] relative overflow-hidden">
            <div 
                className={`absolute inset-0 transition-colors duration-1000 opacity-[0.03] dark:opacity-[0.06]`} 
                style={{ backgroundColor: activeCategoryHex }}
            ></div>

            {/* Header */}
            <div className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-zinc-50 dark:border-white/5">
                <button 
                    onClick={() => { if(!isRunning || confirm("Switch item?")) clearTimer(); }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white transition-all font-black uppercase text-[9px] tracking-widest"
                >
                    <ArrowRightLeft size={14} strokeWidth={3} /> <span className="hidden sm:inline">Switch Event</span>
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleMute}
                        className={`p-2 rounded-xl transition-all border ${isMuted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100 dark:bg-white/5 dark:border-white/10'}`}
                    >
                        {isMuted ? <VolumeX size={16} strokeWidth={2.5} /> : <Volume2 size={16} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* Timer Core */}
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center relative z-10">
                <div className="mb-4">
                    <span 
                        className="inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border mb-2"
                        style={{ backgroundColor: `${activeCategoryHex}10`, color: activeCategoryHex, borderColor: `${activeCategoryHex}30` }}
                    >
                        {state.categories.find(c => c.id === activeItem?.categoryId)?.name}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black font-serif text-black dark:text-white leading-none tracking-tight uppercase max-w-2xl px-4">
                        {activeItem?.name}
                    </h1>
                </div>

                <div className="relative">
                    <div 
                        className={`text-[8rem] sm:text-[12rem] md:text-[15rem] font-black font-mono leading-none tracking-tighter transition-all duration-500 tabular-nums ${isOvertimeCritical ? 'text-rose-600' : isEnded ? 'text-amber-600' : 'text-black dark:text-white'}`}
                        /* Fixed Error: Removed redundant style prop that used undefined 'theme' variable; colors are already handled by Tailwind classes above. */
                    >
                        {formatTime(timeLeft)}
                    </div>
                    <div className="absolute -bottom-6 left-0 right-0">
                         {isOvertimeCritical ? (
                            <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Critical Overtime</span>
                        ) : isEnded ? (
                            <span className="text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Session Over</span>
                        ) : isWarning ? (
                            <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Final Minute</span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 flex flex-col items-center gap-6 pb-12 px-6">
                <div className="flex gap-2 p-1 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/10">
                    {[
                        { count: 1, label: 'Wait', style: 'text-amber-600' },
                        { count: 2, label: 'End', style: 'text-amber-700' },
                        { count: 4, label: 'Ex.', style: 'text-rose-600' }
                    ].map(bell => (
                        <button 
                            key={bell.count}
                            onClick={() => triggerManualBell(bell.count)}
                            className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all flex items-center gap-1.5 hover:bg-white dark:hover:bg-zinc-800 ${bell.style}`}
                        >
                            <Bell size={10} fill="currentColor" /> {bell.label}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-8">
                    <button onClick={resetTimer} className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-black transition-all active:scale-90 border border-zinc-100 shadow-sm"><RotateCcw size={24} strokeWidth={3} /></button>
                    <button 
                        onClick={togglePause}
                        className={`w-24 h-24 rounded-[2.5rem] shadow-2xl transform transition-all active:scale-95 flex items-center justify-center border-4 border-white dark:border-zinc-800 ${isRunning ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}
                    >
                        {isRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                    </button>
                    {/* Fixed Error: Added missing X icon to imports from lucide-react */}
                    <button onClick={clearTimer} className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-600 transition-all active:scale-90 border border-zinc-100 shadow-sm"><X size={24} strokeWidth={3} /></button>
                </div>
            </div>
        </div>
    );
};

export default ItemTimerPage;