import { 
    ArrowLeft, Award, Crown, Maximize, Minimize, Trophy, Star, 
    ShieldCheck, Activity, Users, ClipboardList, Calendar, Clock, 
    ChevronRight, Play, Pause, Layers, Zap, 
    MapPin, TrendingUp, Timer, Presentation, Info,
    Hash, BarChart2, CheckCircle2, ChevronUp, ChevronLeft,
    Monitor, Radio
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { TABS } from '../constants';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, ResultStatus, PerformanceType } from '../types';

interface ProjectorViewProps {
    onNavigate: (tab: string) => void;
}

// --- Cinematic Constants ---
const SPEEDS = [
    { label: 'Fluid', value: 8000 },
    { label: 'Standard', value: 14000 },
    { label: 'Cinematic', value: 25000 }
];

const REVEAL_DELAY = 1200; 
const RACE_DURATION = 3500; 

type SlideType = string;

// --- Shared Components ---

const CountUp: React.FC<{ start?: number; end: number; duration?: number; onFinish?: () => void }> = ({ start = 0, end, duration = 2000, onFinish }) => {
    const [count, setCount] = useState(start);
    const finishedRef = useRef(false);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            const current = Math.floor(start + (easeOutExpo(progress) * (end - start)));
            setCount(current);
            
            if (progress < 1) {
                animationFrame = window.requestAnimationFrame(step);
            } else if (!finishedRef.current) {
                finishedRef.current = true;
                if (onFinish) onFinish();
            }
        };
        animationFrame = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrame);
    }, [start, end, duration, onFinish]);
    return <>{count.toLocaleString()}</>;
};

// --- Slide Components ---

const ResultSlide: React.FC<{ result: any; revealStep: number }> = ({ result, revealStep }) => {
    const rank3 = result.winners.find((w: any) => w.position === 3);
    const rank2 = result.winners.find((w: any) => w.position === 2);
    const rank1 = result.winners.find((w: any) => w.position === 1);

    const PodiumCard = ({ rank, winner, isVisible, isChampion }: any) => {
        if (!isVisible || !winner) return <div className="hidden lg:block w-full max-w-[280px] h-1"></div>;
        
        const config = {
            1: { 
                cardBg: 'bg-gradient-to-b from-[#422006] via-[#2D1B0A] to-black border-[#EAB308]',
                badgeBg: 'bg-[#EAB308] text-black shadow-[#EAB308]/50',
                icon: <Crown className="w-12 h-12 md:w-20 lg:w-24 text-[#EAB308]" fill="currentColor"/>,
                label: 'CHAMPION',
                glow: 'shadow-[0_0_120px_rgba(234,179,8,0.4)]',
                textColor: 'text-[#FEF08A]', // Yellow 100
                numberColor: '#EAB308' 
            },
            2: { 
                cardBg: 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-black border-[#94a3b8]',
                badgeBg: 'bg-[#94a3b8] text-black shadow-[#94a3b8]/50',
                icon: <Star className="w-10 h-10 md:w-16 lg:w-20 text-[#94a3b8]" fill="currentColor"/>,
                label: 'RUNNER UP',
                glow: 'shadow-[0_0_80px_rgba(148,163,184,0.3)]',
                textColor: 'text-[#F1F5F9]', // Slate 100
                numberColor: '#94a3b8'
            },
            3: { 
                cardBg: 'bg-gradient-to-b from-[#431407] via-[#250802] to-black border-[#D97706]',
                badgeBg: 'bg-[#D97706] text-black shadow-[#D97706]/50',
                icon: <Trophy className="w-10 h-10 md:w-14 lg:w-16 text-[#D97706]" fill="currentColor"/>,
                label: 'THIRD PLACE',
                glow: 'shadow-[0_0_60px_rgba(217,119,6,0.3)]',
                textColor: 'text-[#FFEDD5]', // Orange 100
                numberColor: '#D97706'
            }
        }[rank as 1|2|3]!;

        return (
            <div className={`
                relative flex flex-col items-center p-6 md:p-8 lg:p-12 rounded-[3rem] border-2 md:border-4
                animate-in zoom-in-95 slide-in-from-bottom-10 duration-1000 backdrop-blur-3xl 
                ${config.cardBg} ${config.glow} 
                ${isChampion ? 'scale-100 lg:scale-110 z-20 lg:mx-2 w-full order-1' : 'scale-90 z-10 opacity-90 w-full order-2'}
            `}>
                <div 
                    className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full font-black uppercase text-[10px] md:text-sm tracking-[0.3em] shadow-2xl ${config.badgeBg}`}
                >
                    {config.label}
                </div>
                
                <div className="mb-6 md:mb-8 lg:mb-10 mt-4">
                    {config.icon}
                </div>

                <div className="text-center space-y-2 md:space-y-4 mb-6 md:mb-10 w-full">
                    <h3 className={`text-2xl md:text-4xl lg:text-5xl font-black font-serif uppercase tracking-tighter leading-tight line-clamp-2 ${config.textColor}`}>
                        {winner.participantName}
                    </h3>
                    <p className={`text-sm md:text-2xl font-black uppercase tracking-[0.2em] opacity-60 ${config.textColor}`}>{winner.teamName}</p>
                </div>

                <div className="w-full text-center p-6 md:p-8 lg:p-10 rounded-[2.5rem] bg-black/20 border-2 border-white/5 relative group">
                    <div className="text-4xl md:text-6xl lg:text-8xl font-black tabular-nums leading-none tracking-tighter" style={{ color: config.numberColor }}>
                        <CountUp end={winner.totalPoints} duration={2500} />
                    </div>
                    <div className="mt-4 md:mt-5 flex flex-col items-center">
                         <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.4em] text-white/40">FESTIVAL POINTS</span>
                         <div className="mt-3 flex items-center gap-3">
                             <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{winner.prizePts} Prize</div>
                             <div className="text-white/20 text-xs">+</div>
                             <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{winner.gradePts} Grade</div>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-10 lg:p-16 relative">
            <div className="text-center mb-8 md:mb-16 relative z-20 max-w-7xl">
                <div className="inline-flex items-center gap-3 px-8 py-3 bg-white/5 rounded-full border border-white/10 mb-6">
                    <Radio size={22} className="text-emerald-500 animate-pulse" />
                    <span className="text-sm md:text-2xl lg:text-3xl font-black uppercase tracking-[0.6em] text-zinc-400">{result.categoryName}</span>
                </div>
                <h1 className="text-4xl md:text-7xl lg:text-[10vh] font-black font-serif uppercase tracking-tighter leading-[0.95] text-white mb-4 text-balance px-4">
                    {result.itemName}
                </h1>
                <div className="flex items-center justify-center gap-6 md:gap-12">
                    <div className="h-[2px] w-16 md:w-48 lg:w-64 bg-gradient-to-r from-transparent to-white/20"></div>
                    <span className="text-[10px] md:text-lg font-black uppercase tracking-[1.2em] text-emerald-500 ml-[1.2em]">VERDICT DECLARED</span>
                    <div className="h-[2px] w-16 md:w-48 lg:w-64 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center w-full max-w-[98vw] gap-8 lg:gap-6 relative z-20 pb-20">
                <div className="order-2 lg:order-1 flex justify-center w-full lg:w-1/3">
                    <PodiumCard rank={2} winner={rank2} isVisible={revealStep >= 2} />
                </div>
                <div className="order-1 lg:order-2 flex justify-center w-full lg:w-1/3">
                    <PodiumCard rank={1} winner={rank1} isVisible={revealStep >= 3} isChampion />
                </div>
                <div className="order-3 lg:order-3 flex justify-center w-full lg:w-1/3">
                    <PodiumCard rank={3} winner={rank3} isVisible={revealStep >= 1} />
                </div>
            </div>
        </div>
    );
};

const LeaderboardSlide: React.FC<{ teams: any[]; active: boolean; declaredCount: number }> = ({ teams, active, declaredCount }) => {
    const [animateBars, setAnimateBars] = useState(false);
    const topTeams = useMemo(() => teams.slice(0, 8), [teams]);
    const maxPoints = Math.max(...teams.map(t => t.points), 1);

    useEffect(() => {
        if (active) {
            setAnimateBars(false);
            const timer = setTimeout(() => setAnimateBars(true), 600);
            return () => clearTimeout(timer);
        }
    }, [active]);

    return (
        <div className="h-full w-full flex flex-col p-8 md:p-16 lg:p-24 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 md:mb-16 lg:mb-20 relative z-10 gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_15px_#0ea5e9] animate-pulse"></div>
                        <h2 className="text-xs md:text-xl lg:text-3xl font-black uppercase tracking-[0.8em] text-sky-500">LIVE UNIT STANDINGS</h2>
                    </div>
                    <h1 className="text-5xl md:text-8xl lg:text-[14vh] font-black font-serif uppercase tracking-tighter leading-none text-white">LEADERBOARD</h1>
                    <p className="text-xs md:text-lg font-bold uppercase tracking-[0.4em] text-zinc-600 mt-4 md:mt-6">CALCULATED FROM {declaredCount} RESULTS</p>
                </div>
                
                <div className="flex items-center gap-6 md:gap-10 p-6 md:p-10 lg:p-12 rounded-[3rem] md:rounded-[4rem] bg-indigo-600 text-white shadow-2xl border-4 border-white/10 shrink-0 max-w-full">
                    <div className="w-16 h-16 md:w-24 lg:w-32 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Crown size={40} className="md:w-16 md:h-16" fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] md:text-sm lg:text-lg font-black uppercase tracking-[0.5em] opacity-80 mb-2">FESTIVAL TOPPER</div>
                        <div className="text-2xl md:text-5xl lg:text-7xl font-black uppercase tracking-tight truncate max-w-[15ch] md:max-w-2xl">{topTeams[0]?.name || '---'}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 md:gap-5 relative z-10 px-2 overflow-hidden pb-10">
                {topTeams.map((team, i) => {
                    const percentage = (team.points / maxPoints) * 100;
                    
                    const isWinner = i === 0;
                    const isSilver = i === 1;
                    const isBronze = i === 2;

                    const medalColor = isWinner ? 'text-[#FFD700]' : isSilver ? 'text-[#C0C0C0]' : isBronze ? 'text-[#CD7F32]' : 'text-zinc-800';
                    const barColor = isWinner ? 'bg-[#FFD700]' : isSilver ? 'bg-[#C0C0C0]' : isBronze ? 'bg-[#CD7F32]' : 'bg-sky-600';

                    return (
                        <div key={team.id} className="relative flex items-center h-16 md:h-20 lg:h-24">
                            <div className={`w-12 md:w-24 lg:w-32 shrink-0 flex items-center justify-center font-black text-2xl md:text-5xl lg:text-8xl font-mono ${medalColor}`}>
                                {(i + 1).toString().padStart(2, '0')}
                            </div>

                            <div className="flex-grow flex flex-col justify-center px-6 md:px-12 lg:px-16 bg-zinc-950 border-2 border-white/10 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group hover:bg-zinc-900 transition-all">
                                <div className="flex justify-between items-center relative z-10">
                                    <span className={`text-lg md:text-3xl lg:text-5xl font-black uppercase tracking-tight truncate pr-6 ${isWinner ? 'text-white' : 'text-zinc-300'}`}>
                                        {team.name}
                                    </span>
                                    <div className={`text-2xl md:text-5xl lg:text-8xl font-black tabular-nums tracking-tighter leading-none ${medalColor}`}>
                                        {/* Force key update to restart animation on slide change */}
                                        <CountUp key={active ? 'active' : 'inactive'} end={team.points} duration={2500} />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-2 md:h-3 bg-white/5 w-full"></div>
                                <div 
                                    className={`absolute bottom-0 left-0 h-2 md:h-3 transition-all duration-[4000ms] ease-out ${barColor} ${isWinner ? 'shadow-[0_0_20px_rgba(255,215,0,0.6)]' : ''}`}
                                    style={{ width: animateBars ? `${Math.max(percentage, 1)}%` : '0%' }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="absolute bottom-[-10%] right-[-5%] opacity-[0.03] pointer-events-none">
                <Trophy size={800} strokeWidth={1} />
            </div>
        </div>
    );
};

const StatsSlide: React.FC<{ stats: any }> = ({ stats }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 overflow-hidden">
        <div className="text-center mb-12 md:mb-16 lg:mb-24">
            <h2 className="text-xs md:text-3xl lg:text-4xl font-black uppercase tracking-[1em] text-indigo-500 mb-4 md:mb-6 ml-[1em]">SYSTEM TELEMETRY</h2>
            <h1 className="text-5xl md:text-8xl lg:text-[18vh] font-black font-serif uppercase tracking-tighter leading-none text-white drop-shadow-2xl">FESTIVAL DATA</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 lg:gap-16 w-full max-w-[90vw]">
            {[
                { icon: Users, label: 'TOTAL DELEGATES', value: stats.participants, color: 'text-emerald-500' },
                { icon: Trophy, label: 'VERDICTS DECLARED', value: stats.declared, color: 'text-amber-500' },
                { icon: Star, label: 'POINTS REGISTERED', value: stats.totalPoints, color: 'text-indigo-500' },
                { icon: ClipboardList, label: 'LEVELS ACTIVE', value: stats.categories, color: 'text-rose-500' },
                { icon: Layers, label: 'DISCIPLINES', value: stats.items, color: 'text-sky-500' },
                { icon: Calendar, label: 'TIMELINE SLOTS', value: stats.scheduled, color: 'text-purple-500' }
            ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center p-6 md:p-12 lg:p-16 rounded-[3rem] md:rounded-[5rem] bg-zinc-950/80 border-4 border-white/10 backdrop-blur-3xl shadow-2xl transition-all hover:bg-zinc-900 group">
                    <stat.icon size={32} className={`${stat.color} mb-6 md:mb-10 lg:mb-12 md:w-16 md:h-16 group-hover:scale-125 transition-transform duration-500`} />
                    <div className="text-3xl md:text-6xl lg:text-9xl font-black mb-2 md:mb-4 tabular-nums leading-none text-white tracking-tighter">
                        <CountUp end={stat.value} duration={3000} />
                    </div>
                    <p className="text-[9px] md:text-sm lg:text-xl font-black uppercase tracking-[0.4em] text-zinc-600 text-center ml-[0.4em] truncate w-full">{stat.label}</p>
                </div>
            ))}
        </div>
    </div>
);

const UpcomingSlide: React.FC<{ events: any[] }> = ({ events }) => (
    <div className="h-full w-full flex flex-col p-6 md:p-12 lg:p-20 overflow-hidden bg-black relative">
         <div className="mb-8 md:mb-10 lg:mb-14 flex justify-between items-end gap-8 px-2 z-10 relative">
            <div>
                <h2 className="text-[10px] md:text-xl lg:text-2xl font-black uppercase tracking-[0.8em] text-amber-500 mb-2 flex items-center gap-4">
                    <Clock className="w-4 h-4 md:w-8 md:h-8" /> STAGE TIMELINE
                </h2>
                <h1 className="text-4xl md:text-7xl lg:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none text-white text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                    UPCOMING
                </h1>
            </div>
            <div className="px-6 py-2 md:px-10 md:py-4 rounded-[1.5rem] md:rounded-[2.5rem] bg-emerald-600 text-white text-[8px] md:text-lg font-black uppercase tracking-[0.5em] animate-pulse whitespace-nowrap shadow-2xl border-2 md:border-4 border-white/10 hidden sm:block">
                LIVE NOW
            </div>
         </div>

         <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 overflow-y-auto no-scrollbar pb-20 z-10 relative pr-2">
            {events.slice(0, 6).map((ev, i) => {
                const colors = [
                    'from-purple-500 to-indigo-500',
                    'from-emerald-500 to-teal-500',
                    'from-rose-500 to-orange-500',
                    'from-blue-500 to-cyan-500',
                    'from-amber-500 to-yellow-500',
                    'from-pink-500 to-fuchsia-500',
                ];
                const gradient = colors[i % colors.length];
                const delay = i * 100;

                return (
                    <div 
                        key={i} 
                        className={`relative overflow-hidden rounded-[2.5rem] bg-zinc-950/80 border border-white/10 p-6 md:p-8 lg:p-10 flex flex-col justify-between group hover:border-white/20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards`}
                        style={{ animationDelay: `${delay}ms` }}
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradient} opacity-[0.05] blur-[80px] rounded-full group-hover:opacity-[0.12] transition-opacity duration-500`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6 md:mb-8">
                                <div className={`px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-white/70`}>
                                    {ev.categoryName}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-none tracking-tight">{ev.time}</div>
                                    <div className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{ev.date}</div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl md:text-4xl lg:text-5xl font-black font-serif text-white uppercase tracking-tighter leading-[1] mb-6 md:mb-10 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                                {ev.itemName}
                            </h3>
                        </div>

                        <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-4 md:pt-6 mt-auto">
                            <div className="flex items-center gap-2 text-zinc-400 group-hover:text-white transition-colors">
                                <MapPin size={18} className={`text-zinc-500 group-hover:text-white transition-colors`} />
                                <span className="text-xs md:text-sm font-bold uppercase tracking-widest">{ev.stage}</span>
                            </div>
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border border-white/10 bg-white/5 group-hover:bg-white group-hover:text-black transition-all duration-500`}>
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {events.length === 0 && (
                <div className="col-span-full h-full flex flex-col items-center justify-center opacity-20 py-20">
                    <Presentation size={120} strokeWidth={1} />
                    <p className="text-2xl font-black uppercase tracking-[0.5em] mt-8 text-white">Queue Empty</p>
                </div>
            )}
         </div>
    </div>
);

// --- Main View ---

const ProjectorView: React.FC<ProjectorViewProps> = ({ onNavigate }) => {
    const { state } = useFirebase();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [revealStep, setRevealStep] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [slideTempo, setSlideTempo] = useState(SPEEDS[1]);

    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<number>(0);
    const lastTickRef = useRef<number>(Date.now());

    // --- Helper to calculate score for an item ---
    const calculateItemScores = useCallback((item: any, winners: any[]) => {
        if (!state) return [];
        const gradesConfig = item.type === ItemType.SINGLE ? (state.gradePoints?.single || []) : (state.gradePoints?.group || []);
        
        return winners.map(w => {
            const p = state.participants.find(part => part.id === w.participantId);
            const t = p ? state.teams.find(tm => tm.id === p.teamId) : null;
            let prizePts = 0;
            if (w.position === 1) prizePts += item.points.first || 0;
            else if (w.position === 2) prizePts += item.points.second || 0;
            else if (w.position === 3) prizePts += item.points.third || 0;
            
            let gradePts = 0;
            if (w.gradeId) {
                const grade = gradesConfig.find(g => g.id === w.gradeId);
                if (grade) {
                    gradePts += (item.gradePointsOverride?.[grade.id] ?? (grade.points || 0));
                }
            }
            
            return {
                ...w,
                participantName: item.type === ItemType.GROUP ? `${p?.name || '---'} & Party` : (p?.name || '---'),
                teamId: p?.teamId,
                teamName: t?.name || '---',
                prizePts,
                gradePts,
                totalPoints: prizePts + gradePts
            };
        });
    }, [state]);

    const data = useMemo(() => {
        if (!state) return null;
        
        const declared = state.results.filter(r => r.status === ResultStatus.DECLARED);
        const rotationLimit = state.settings.projector?.resultsLimit || 3;
        const recentDeclared = declared.slice(-rotationLimit).reverse();

        const resultsSlidesData = recentDeclared.map(r => {
            const item = state.items.find(i => i.id === r.itemId);
            const category = state.categories.find(c => c.id === item?.categoryId);
            if (!item || !category) return null;
            
            return {
                id: r.itemId,
                itemName: item.name,
                categoryName: category.name,
                winners: calculateItemScores(item, r.winners).sort((a,b) => (a.position || 99) - (b.position || 99))
            };
        }).filter(Boolean);

        // Updated Logic: Use ALL declared results for the leaderboard calculation
        // to ensure it reflects total points, not just the first N results.
        const resultsForTallies = declared; 

        const teamPointsMap: Record<string, number> = {};
        state.teams.forEach(t => teamPointsMap[t.id] = 0);
        
        resultsForTallies.forEach(r => {
            const item = state.items.find(i => i.id === r.itemId);
            if (!item) return;
            const winnersWithPoints = calculateItemScores(item, r.winners);
            winnersWithPoints.forEach(w => {
                if (w.teamId) {
                    teamPointsMap[w.teamId] = (teamPointsMap[w.teamId] || 0) + w.totalPoints;
                }
            });
        });

        const leaderboardData = state.teams.map(t => ({ ...t, points: teamPointsMap[t.id] })).sort((a,b) => b.points - a.points);

        return { 
            results: resultsSlidesData,
            leaderboard: leaderboardData, 
            stats: {
                participants: state.participants.length,
                items: state.items.length,
                declared: declared.length, // Display total count of declared results
                categories: state.categories.length,
                totalPoints: Object.values(teamPointsMap).reduce((a, b) => a + b, 0),
                scheduled: state.schedule.length
            },
            upcoming: state.schedule.map(ev => ({ 
                ...ev, 
                itemName: state.items.find(i => i.id === ev.itemId)?.name, 
                categoryName: state.categories.find(c => c.id === ev.categoryId)?.name 
            }))
        };
    }, [state, calculateItemScores]);

    const SLIDE_ORDER: SlideType[] = useMemo(() => {
        const config = state?.settings.projector;
        const slides: SlideType[] = [];
        
        if (config?.showResults !== false && data?.results) {
            data.results.forEach((_, i) => slides.push(`RESULT_${i}`));
        }
        if (config?.showLeaderboard !== false) slides.push('LEADERBOARD');
        if (config?.showStats !== false) slides.push('STATS');
        if (config?.showUpcoming !== false) slides.push('UPCOMING');
        
        return slides.length > 0 ? slides : ['STATS'];
    }, [state?.settings.projector, data?.results]);

    // Master Rotation Loop
    useEffect(() => {
        const tick = () => {
            if (isPaused) {
                lastTickRef.current = Date.now();
                return;
            }

            const now = Date.now();
            const delta = now - lastTickRef.current;
            lastTickRef.current = now;

            const speed = slideTempo.value;
            progressRef.current += (delta / speed) * 100;

            if (progressRef.current >= 100) {
                progressRef.current = 0;
                setCurrentSlideIndex(prev => (prev + 1) % SLIDE_ORDER.length);
            }

            const bar = document.getElementById('active-slide-progress');
            if (bar) bar.style.width = `${progressRef.current}%`;
        };

        const interval = setInterval(tick, 30);
        return () => clearInterval(interval);
    }, [isPaused, slideTempo.value, SLIDE_ORDER.length]);

    // Handle Result Reveal Sequence
    useEffect(() => {
        if (SLIDE_ORDER[currentSlideIndex]?.startsWith('RESULT')) {
            setRevealStep(0);
            const t1 = setTimeout(() => setRevealStep(1), REVEAL_DELAY);
            const t2 = setTimeout(() => setRevealStep(2), REVEAL_DELAY * 2);
            const t3 = setTimeout(() => setRevealStep(3), REVEAL_DELAY * 3);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
    }, [currentSlideIndex, SLIDE_ORDER]);

    const handleSkip = (direction: 'next' | 'prev') => {
        progressRef.current = 0;
        if (direction === 'next') setCurrentSlideIndex(p => (p + 1) % SLIDE_ORDER.length);
        else setCurrentSlideIndex(p => (p - 1 + SLIDE_ORDER.length) % SLIDE_ORDER.length);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (!state || !data) return null;

    return (
        <div ref={containerRef} className={`h-screen w-screen overflow-hidden relative font-sans select-none bg-[#030403] text-white flex flex-col`}>
            
            {/* Mesh Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-emerald-500/20 rounded-full blur-[160px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-500/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* Slide Layer - Constrained for visibility */}
            <main className="relative z-10 flex-grow w-full overflow-hidden">
                {SLIDE_ORDER.map((key, index) => {
                    const isActive = index === currentSlideIndex;
                    
                    if (key.startsWith('RESULT_')) {
                        const resultIdx = parseInt(key.split('_')[1]);
                        const result = data.results[resultIdx];
                        return (
                            <div key={key} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                {result ? <ResultSlide result={result} revealStep={revealStep} /> : <StatsSlide stats={data.stats} />}
                            </div>
                        );
                    }

                    if (key === 'LEADERBOARD') {
                        return (
                            <div key={key} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                                <LeaderboardSlide teams={data.leaderboard} active={isActive} declaredCount={data.stats.declared} />
                            </div>
                        );
                    }

                    if (key === 'STATS') {
                        return (
                            <div key={key} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
                                <StatsSlide stats={data.stats} />
                            </div>
                        );
                    }

                    if (key === 'UPCOMING') {
                        return (
                            <div key={key} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                                <UpcomingSlide events={data.upcoming} />
                            </div>
                        );
                    }

                    return null;
                })}
            </main>

            {/* --- Control Console Overlay --- */}
            {/* Hidden by default, visible on hover/group */}
            <div className="absolute inset-0 z-[60] pointer-events-none group">
                
                {/* Visual Status Indicator */}
                <div className="absolute top-6 left-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="px-5 py-2 bg-black/80 backdrop-blur-3xl rounded-full border border-white/20 flex items-center gap-3 shadow-2xl">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                         <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white">CINEMATIC BROADCAST ACTIVE</span>
                    </div>
                </div>

                {/* Master Console */}
                <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-[95vw] md:w-auto pointer-events-auto opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700">
                    <div className="bg-black border-2 border-white/15 p-4 md:p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col gap-6 md:gap-8 overflow-hidden backdrop-blur-3xl">
                        
                        {/* Slide Nav */}
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-2">
                             {SLIDE_ORDER.map((s, i) => (
                                <button 
                                    key={s}
                                    onClick={() => { setCurrentSlideIndex(i); progressRef.current = 0; }}
                                    className={`px-6 py-3 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${currentSlideIndex === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-110' : 'text-zinc-600 border-white/5 hover:text-white hover:bg-white/5'}`}
                                >
                                    {s.startsWith('RESULT') ? 'RESULT REVEAL' : s}
                                </button>
                             ))}
                        </div>

                        {/* Control Deck */}
                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16 px-4">
                            <div className="flex items-center gap-3 md:gap-8">
                                <button onClick={() => handleSkip('prev')} className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"><ChevronLeft size={36} md:size={48} /></button>
                                <button 
                                    onClick={() => setIsPaused(!isPaused)} 
                                    className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isPaused ? 'bg-emerald-600 text-white' : 'bg-white text-black'}`}
                                >
                                    {isPaused ? <Play size={24} md:size={40} fill="currentColor" className="ml-1" /> : <Pause size={24} md:size={40} fill="currentColor" />}
                                </button>
                                <button onClick={() => handleSkip('next')} className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"><ChevronRight size={36} md:size={48} /></button>
                            </div>

                            <div className="hidden md:block h-12 w-[1px] bg-white/10"></div>

                            {/* Tempo */}
                            <div className="flex items-center gap-3">
                                <Timer size={20} className="text-zinc-600 mr-1" />
                                {SPEEDS.map(s => (
                                    <button 
                                        key={s.label}
                                        onClick={() => setSlideTempo(s)}
                                        className={`px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border-2 ${slideTempo.value === s.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl' : 'border-white/5 text-zinc-600 hover:text-white'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="hidden lg:block h-12 w-[1px] bg-white/10"></div>

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                                <button onClick={toggleFullscreen} className="p-3 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all">
                                    {isFullscreen ? <Minimize size={28} md:size={36}/> : <Maximize size={28} md:size={36}/>}
                                </button>
                                <button onClick={() => onNavigate(TABS.DASHBOARD)} className="p-3 bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-full transition-all border border-rose-500/20">
                                    <ArrowLeft size={28} md:size={36} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div id="active-slide-progress" className="h-full bg-emerald-500 transition-all duration-300 linear shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .text-balance { text-wrap: balance; }
            `}</style>
        </div>
    );
};

export default ProjectorView;