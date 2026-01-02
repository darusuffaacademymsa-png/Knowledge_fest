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

const REVEAL_DELAY = 1000; 
const RACE_STEP_DURATION = 1500; 

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
        if (!isVisible || !winner) return <div className="hidden lg:block w-full h-1"></div>;
        
        const config = {
            1: { 
                cardBg: 'bg-gradient-to-b from-[#422006] via-[#2D1B0A] to-black border-[#EAB308]',
                badgeBg: 'bg-[#EAB308] text-black',
                icon: <Crown className="w-[10vh] h-[10vh] text-[#EAB308]" fill="currentColor"/>,
                label: 'CHAMPION',
                glow: 'shadow-[0_0_80px_rgba(234,179,8,0.2)]',
                textColor: 'text-[#FEF08A]',
                numberColor: '#EAB308' 
            },
            2: { 
                cardBg: 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-black border-[#94a3b8]',
                badgeBg: 'bg-[#94a3b8] text-black',
                icon: <Star className="w-[8vh] h-[8vh] text-[#94a3b8]" fill="currentColor"/>,
                label: 'RUNNER UP',
                glow: 'shadow-[0_0_60px_rgba(148,163,184,0.15)]',
                textColor: 'text-[#F1F5F9]',
                numberColor: '#94a3b8'
            },
            3: { 
                cardBg: 'bg-gradient-to-b from-[#431407] via-[#250802] to-black border-[#D97706]',
                badgeBg: 'bg-[#D97706] text-black',
                icon: <Trophy className="w-[7vh] h-[7vh] text-[#D97706]" fill="currentColor"/>,
                label: 'THIRD PLACE',
                glow: 'shadow-[0_0_50px_rgba(217,119,6,0.15)]',
                textColor: 'text-[#FFEDD5]',
                numberColor: '#D97706'
            }
        }[rank as 1|2|3]!;

        return (
            <div className={`
                relative flex flex-col items-center p-[2vh] lg:p-[4vh] rounded-[3vh] border-[0.3vh]
                animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 backdrop-blur-3xl 
                ${config.cardBg} ${config.glow} 
                ${isChampion ? 'scale-100 z-20 w-full' : 'scale-90 opacity-90 w-full'}
            `}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-[2vh] py-[0.5vh] rounded-full font-black uppercase text-[1vh] tracking-[0.2em] shadow-xl ${config.badgeBg}`}>
                    {config.label}
                </div>
                
                <div className="mb-[2vh] mt-[1vh]">{config.icon}</div>

                <div className="text-center space-y-[0.5vh] mb-[2vh] w-full">
                    <h3 className={`text-[2.5vh] lg:text-[4vh] font-black font-serif uppercase tracking-tighter leading-tight line-clamp-1 ${config.textColor}`}>
                        {winner.participantName}
                    </h3>
                    <p className={`text-[1.2vh] lg:text-[1.8vh] font-black uppercase tracking-[0.2em] opacity-60 ${config.textColor}`}>{winner.teamName}</p>
                </div>

                <div className="w-full text-center p-[2vh] rounded-[2vh] bg-black/20 border border-white/5">
                    <div className="text-[4vh] lg:text-[6vh] font-black tabular-nums leading-none tracking-tighter" style={{ color: config.numberColor }}>
                        <CountUp end={winner.totalPoints} duration={2000} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-[2vh] lg:p-[5vh] overflow-hidden select-none">
            <div className="text-center mb-[4vh] relative z-20 w-full">
                <div className="inline-flex items-center gap-[1vh] px-[2vh] py-[0.8vh] bg-white/5 rounded-full border border-white/10 mb-[2vh]">
                    <Radio size={16} className="text-emerald-500 animate-pulse" />
                    <span className="text-[1.5vh] lg:text-[2.2vh] font-black uppercase tracking-[0.4em] text-zinc-400">{result.categoryName}</span>
                </div>
                <h1 className="text-[5vh] lg:text-[8vh] font-black font-serif uppercase tracking-tighter leading-[0.95] text-white mb-[1vh] whitespace-nowrap overflow-hidden text-ellipsis px-[2vh]">
                    {result.itemName}
                </h1>
                <div className="flex items-center justify-center gap-[2vh]">
                    <div className="h-[1px] flex-1 max-w-[20vw] bg-gradient-to-r from-transparent to-white/20"></div>
                    <span className="text-[1vh] lg:text-[1.4vh] font-black uppercase tracking-[0.8em] text-emerald-500">VERDICT DECLARED</span>
                    <div className="h-[1px] flex-1 max-w-[20vw] bg-gradient-to-l from-transparent to-white/20"></div>
                </div>
            </div>

            <div className="flex flex-row items-end justify-center w-full max-w-[1200px] gap-[1vh] lg:gap-[3vh] relative z-20">
                <div className="flex-1 flex justify-center order-1"><PodiumCard rank={2} winner={rank2} isVisible={revealStep >= 2} /></div>
                <div className="flex-1.2 flex justify-center order-2 scale-110 mb-[2vh]"><PodiumCard rank={1} winner={rank1} isVisible={revealStep >= 3} isChampion /></div>
                <div className="flex-1 flex justify-center order-3"><PodiumCard rank={3} winner={rank3} isVisible={revealStep >= 1} /></div>
            </div>
        </div>
    );
};

interface TeamRaceState {
    id: string;
    name: string;
    points: number;
    lastGain: number;
    lastItem: string;
}

const LeaderboardSlide: React.FC<{ 
    initialTeams: any[]; 
    active: boolean; 
    timeline: any[]; 
    items: any[]; 
    calculateItemScores: any 
}> = ({ initialTeams, active, timeline, items, calculateItemScores }) => {
    const [teamStates, setTeamStates] = useState<TeamRaceState[]>([]);
    const [progressIndex, setProgressIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (active) {
            setTeamStates(initialTeams.map(t => ({ id: t.id, name: t.name, points: 0, lastGain: 0, lastItem: '' })));
            setProgressIndex(0);
            setIsFinished(false);
        }
    }, [active, initialTeams]);

    useEffect(() => {
        if (!active || isFinished) return;
        if (progressIndex < timeline.length) {
            const timer = setTimeout(() => {
                const currentResult = timeline[progressIndex];
                const item = items.find(i => i.id === currentResult.itemId);
                if (item) {
                    const winnersWithPoints = calculateItemScores(item, currentResult.winners);
                    setTeamStates(prev => prev.map(t => {
                        const teamWins = winnersWithPoints.filter((w: any) => w.teamId === t.id);
                        const gain = teamWins.reduce((sum: number, w: any) => sum + w.totalPoints, 0);
                        return gain > 0 ? { ...t, points: t.points + gain, lastGain: gain, lastItem: item.name } : { ...t, lastGain: 0, lastItem: '' };
                    }));
                }
                setProgressIndex(prev => prev + 1);
            }, RACE_STEP_DURATION);
            return () => clearTimeout(timer);
        } else {
            setIsFinished(true);
        }
    }, [active, progressIndex, timeline, items, calculateItemScores, isFinished]);

    const sortedIndices = useMemo(() => {
        return teamStates.map((_, i) => i).sort((a, b) => teamStates[b].points - teamStates[a].points);
    }, [teamStates]);

    const currentMax = Math.max(...teamStates.map(t => t.points), 1);
    const visibleCount = Math.min(8, teamStates.length);
    const ROW_HEIGHT_VH = 70 / visibleCount; // Distribute height within ~70% of viewport

    return (
        <div className="h-full w-full flex flex-col p-[4vh] lg:p-[6vh] relative overflow-hidden select-none">
            <div className="flex flex-row justify-between items-end mb-[4vh] relative z-10">
                <div>
                    <div className="flex items-center gap-[1vh] mb-[1vh]">
                        <div className="w-[1.2vh] h-[1.2vh] rounded-full bg-sky-500 shadow-[0_0_15px_#0ea5e9] animate-pulse"></div>
                        <h2 className="text-[1.2vh] lg:text-[1.8vh] font-black uppercase tracking-[0.5em] text-sky-500">LIVE POINT RACE</h2>
                    </div>
                    <h1 className="text-[5vh] lg:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none text-white">LEADERBOARD</h1>
                </div>
                
                {teamStates.length > 0 && (
                    <div className="flex items-center gap-[2vh] p-[2vh] rounded-[3vh] bg-indigo-600 text-white shadow-2xl border border-white/10 shrink-0">
                        <Crown size={32} className="hidden lg:block shrink-0" fill="currentColor" />
                        <div className="min-w-0">
                            <div className="text-[0.8vh] lg:text-[1vh] font-black uppercase tracking-[0.3em] opacity-80 mb-[0.5vh]">TOPPER</div>
                            <div className="text-[2vh] lg:text-[3vh] font-black uppercase tracking-tight truncate max-w-[12ch]">
                                {teamStates[sortedIndices[0]]?.name || '---'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 relative w-full">
                {teamStates.map((team, actualIdx) => {
                    const rankIdx = sortedIndices.indexOf(actualIdx);
                    if (rankIdx >= visibleCount) return null; 

                    const isWinner = rankIdx === 0;
                    const medalColor = isWinner ? 'text-[#FFD700]' : rankIdx === 1 ? 'text-[#C0C0C0]' : rankIdx === 2 ? 'text-[#CD7F32]' : 'text-zinc-800';
                    const barColor = isWinner ? 'bg-[#FFD700]' : rankIdx === 1 ? 'bg-[#C0C0C0]' : rankIdx === 2 ? 'bg-[#CD7F32]' : 'bg-sky-600';
                    const percentage = (team.points / currentMax) * 100;

                    return (
                        <div 
                            key={team.id}
                            className="absolute left-0 w-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center"
                            style={{ 
                                top: `${rankIdx * (ROW_HEIGHT_VH + 1.5)}vh`,
                                height: `${ROW_HEIGHT_VH}vh`,
                                zIndex: team.lastGain > 0 ? 50 : 10
                            }}
                        >
                            <div className={`w-[6vh] lg:w-[12vh] shrink-0 flex items-center justify-center font-black text-[2.5vh] lg:text-[5vh] font-mono ${medalColor}`}>
                                {(rankIdx + 1).toString().padStart(2, '0')}
                            </div>

                            <div className="flex-grow h-full bg-zinc-950 border border-white/10 rounded-[1.5vh] relative overflow-hidden flex items-center px-[2vh] lg:px-[4vh]">
                                <div className="flex justify-between items-center relative z-10 w-full">
                                    <span className={`text-[1.5vh] lg:text-[3vh] font-black uppercase tracking-tight truncate pr-[2vh] ${isWinner ? 'text-white' : 'text-zinc-300'}`}>
                                        {team.name}
                                    </span>
                                    <div className={`text-[2.2vh] lg:text-[4.5vh] font-black tabular-nums tracking-tighter leading-none ${medalColor}`}>
                                        <CountUp end={team.points} duration={1200} />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-[0.5vh] bg-white/5 w-full"></div>
                                <div 
                                    className={`absolute bottom-0 left-0 h-[0.5vh] transition-all duration-1200 ease-out ${barColor}`}
                                    style={{ width: `${Math.max(percentage, 1)}%` }}
                                ></div>

                                {team.lastGain > 0 && (
                                    <div className="absolute right-[1vh] top-1/2 -translate-y-1/2 animate-in fade-in zoom-in slide-in-from-right-4 duration-500 bg-emerald-500 text-white px-[1.5vh] py-[0.5vh] rounded-[1vh] shadow-xl flex items-center gap-[1vh] border border-emerald-400">
                                        <span className="text-[1.8vh] lg:text-[2.5vh] font-black">+{team.lastGain}</span>
                                        <div className="h-[2vh] w-[1px] bg-white/30 hidden lg:block"></div>
                                        <span className="text-[0.8vh] lg:text-[1vh] font-black uppercase tracking-widest max-w-[10vh] truncate hidden lg:block">{team.lastItem}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatsSlide: React.FC<{ stats: any }> = ({ stats }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-[4vh] lg:p-[10vh] overflow-hidden select-none">
        <div className="text-center mb-[6vh]">
            <h2 className="text-[1.5vh] lg:text-[2.5vh] font-black uppercase tracking-[1em] text-indigo-500 mb-[1vh] ml-[1em]">SYSTEM TELEMETRY</h2>
            <h1 className="text-[6vh] lg:text-[12vh] font-black font-serif uppercase tracking-tighter leading-none text-white drop-shadow-2xl">FESTIVAL DATA</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[2vh] lg:gap-[4vh] w-full max-w-[90vw]">
            {[
                { icon: Users, label: 'TOTAL DELEGATES', value: stats.participants, color: 'text-emerald-500' },
                { icon: Trophy, label: 'VERDICTS DECLARED', value: stats.declared, color: 'text-amber-500' },
                { icon: Star, label: 'POINTS REGISTERED', value: stats.totalPoints, color: 'text-indigo-500' },
                { icon: ClipboardList, label: 'LEVELS ACTIVE', value: stats.categories, color: 'text-rose-500' },
                { icon: Layers, label: 'DISCIPLINES', value: stats.items, color: 'text-sky-500' },
                { icon: Calendar, label: 'TIMELINE SLOTS', value: stats.scheduled, color: 'text-purple-500' }
            ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center p-[3vh] lg:p-[5vh] rounded-[3vh] lg:rounded-[5vh] bg-zinc-950/80 border border-white/10 backdrop-blur-3xl shadow-2xl transition-all group">
                    <stat.icon size={24} className={`${stat.color} mb-[2vh] lg:mb-[4vh] lg:w-[6vh] lg:h-[6vh] group-hover:scale-110 transition-transform`} />
                    <div className="text-[3.5vh] lg:text-[8vh] font-black mb-[0.5vh] tabular-nums leading-none text-white tracking-tighter">
                        <CountUp end={stat.value} duration={2500} />
                    </div>
                    <p className="text-[0.8vh] lg:text-[1.2vh] font-black uppercase tracking-[0.3em] text-zinc-600 text-center truncate w-full">{stat.label}</p>
                </div>
            ))}
        </div>
    </div>
);

const UpcomingSlide: React.FC<{ events: any[] }> = ({ events }) => (
    <div className="h-full w-full flex flex-col p-[4vh] lg:p-[8vh] overflow-hidden bg-black relative select-none">
         <div className="mb-[4vh] flex justify-between items-end gap-[4vh] px-[1vh] z-10 relative">
            <div>
                <h2 className="text-[1.2vh] lg:text-[2vh] font-black uppercase tracking-[0.5em] text-amber-500 mb-[0.5vh] flex items-center gap-[1.5vh]">
                    <Clock size={16} /> STAGE TIMELINE
                </h2>
                <h1 className="text-[6vh] lg:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none text-white text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                    UPCOMING
                </h1>
            </div>
            <div className="px-[3vh] py-[1vh] rounded-[1.5vh] lg:rounded-[2.5vh] bg-emerald-600 text-white text-[1vh] lg:text-[1.8vh] font-black uppercase tracking-[0.5em] animate-pulse shadow-2xl border border-white/10 hidden sm:block">
                LIVE NOW
            </div>
         </div>

         <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-[2vh] lg:gap-[3vh] pb-[4vh] z-10 relative">
            {events.slice(0, 6).map((ev, i) => {
                const gradient = ['from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-orange-500'][i % 3];
                return (
                    <div key={i} className="relative overflow-hidden rounded-[2.5vh] bg-zinc-950/80 border border-white/10 p-[2.5vh] lg:p-[4vh] flex flex-col justify-between group transition-all duration-500">
                        <div className={`absolute top-0 right-0 w-[20vh] h-[20vh] bg-gradient-to-br ${gradient} opacity-[0.05] blur-[50px] rounded-full group-hover:opacity-[0.1] transition-opacity`}></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-[2vh]">
                                <div className="px-[1.5vh] py-[0.5vh] rounded-full border border-white/10 bg-white/5 text-[0.8vh] lg:text-[1vh] font-black uppercase tracking-[0.2em] text-white/70">{ev.categoryName}</div>
                                <div className="text-right">
                                    <div className="text-[2.5vh] lg:text-[4vh] font-black text-white leading-none tracking-tight">{ev.time}</div>
                                    <div className="text-[0.8vh] font-bold text-zinc-500 uppercase tracking-widest mt-1">{ev.date}</div>
                                </div>
                            </div>
                            <h3 className="text-[2.2vh] lg:text-[3.5vh] font-black font-serif text-white uppercase tracking-tighter leading-[1.1] mb-[2vh] line-clamp-2">{ev.itemName}</h3>
                        </div>
                        <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-[2vh] mt-auto">
                            <div className="flex items-center gap-[1vh] text-zinc-400">
                                <MapPin size={12} className="text-zinc-500" />
                                <span className="text-[1vh] lg:text-[1.2vh] font-bold uppercase tracking-widest">{ev.stage}</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-600" />
                        </div>
                    </div>
                );
            })}
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
                if (grade) gradePts += (item.gradePointsOverride?.[grade.id] ?? (grade.points || 0));
            }
            return {
                ...w,
                participantName: item.type === ItemType.GROUP ? `${p?.name || '---'} & Party` : (p?.name || '---'),
                teamId: p?.teamId, teamName: t?.name || '---', prizePts, gradePts, totalPoints: prizePts + gradePts
            };
        });
    }, [state]);

    const data = useMemo(() => {
        if (!state) return null;
        const declared = state.results.filter(r => r.status === ResultStatus.DECLARED);
        const rotationLimit = state.settings.projector?.resultsLimit || 3;
        const resultsSlidesData = declared.slice(-rotationLimit).reverse().map(r => {
            const item = state.items.find(i => i.id === r.itemId);
            const category = state.categories.find(c => c.id === item?.categoryId);
            if (!item || !category) return null;
            return {
                id: r.itemId, itemName: item.name, categoryName: category.name,
                winners: calculateItemScores(item, r.winners).sort((a,b) => (a.position || 99) - (b.position || 99))
            };
        }).filter(Boolean);

        const timeline = declared.slice(0, state.settings.projector?.pointsLimit || 10);
        const teamPointsMap: Record<string, number> = {};
        state.teams.forEach(t => teamPointsMap[t.id] = 0);
        timeline.forEach(r => {
            const item = state.items.find(i => i.id === r.itemId);
            if (item) {
                calculateItemScores(item, r.winners).forEach(w => {
                    if (w.teamId) teamPointsMap[w.teamId] = (teamPointsMap[w.teamId] || 0) + w.totalPoints;
                });
            }
        });

        return { 
            results: resultsSlidesData,
            timeline: timeline,
            leaderboardInitial: state.teams.map(t => ({ id: t.id, name: t.name })),
            stats: {
                participants: state.participants.length, items: state.items.length,
                declared: declared.length, categories: state.categories.length,
                totalPoints: Object.values(teamPointsMap).reduce((a, b) => a + b, 0),
                scheduled: state.schedule.length
            },
            upcoming: state.schedule.map(ev => ({ 
                ...ev, itemName: state.items.find(i => i.id === ev.itemId)?.name, 
                categoryName: state.categories.find(c => c.id === ev.categoryId)?.name 
            }))
        };
    }, [state, calculateItemScores]);

    const SLIDE_ORDER: SlideType[] = useMemo(() => {
        const config = state?.settings.projector;
        const slides: SlideType[] = [];
        if (config?.showResults !== false && data?.results) data.results.forEach((_, i) => slides.push(`RESULT_${i}`));
        if (config?.showLeaderboard !== false) slides.push('LEADERBOARD');
        if (config?.showStats !== false) slides.push('STATS');
        if (config?.showUpcoming !== false) slides.push('UPCOMING');
        return slides.length > 0 ? slides : ['STATS'];
    }, [state?.settings.projector, data?.results]);

    useEffect(() => {
        const tick = () => {
            if (isPaused) { lastTickRef.current = Date.now(); return; }
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

    useEffect(() => {
        if (SLIDE_ORDER[currentSlideIndex]?.startsWith('RESULT')) {
            setRevealStep(0);
            const t1 = setTimeout(() => setRevealStep(1), REVEAL_DELAY);
            const t2 = setTimeout(() => setRevealStep(2), REVEAL_DELAY * 2);
            const t3 = setTimeout(() => setRevealStep(3), REVEAL_DELAY * 3);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
    }, [currentSlideIndex, SLIDE_ORDER]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); } 
        else { document.exitFullscreen(); setIsFullscreen(false); }
    };

    if (!state || !data) return null;

    return (
        <div ref={containerRef} className="h-screen w-screen overflow-hidden relative font-sans select-none bg-black text-white flex flex-col p-0 m-0">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-emerald-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-500/20 rounded-full blur-[100px]"></div>
            </div>

            <main className="relative z-10 flex-grow w-full overflow-hidden flex flex-col">
                {SLIDE_ORDER.map((key, index) => {
                    const isActive = index === currentSlideIndex;
                    return (
                        <div key={key} className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            {key.startsWith('RESULT_') && <ResultSlide result={data.results[parseInt(key.split('_')[1])]} revealStep={revealStep} />}
                            {key === 'LEADERBOARD' && <LeaderboardSlide initialTeams={data.leaderboardInitial} active={isActive} timeline={data.timeline} items={state.items} calculateItemScores={calculateItemScores} />}
                            {key === 'STATS' && <StatsSlide stats={data.stats} />}
                            {key === 'UPCOMING' && <UpcomingSlide events={data.upcoming} />}
                        </div>
                    );
                })}
            </main>

            <div className="absolute inset-0 z-[60] pointer-events-none group">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] pointer-events-auto opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl flex flex-col gap-4 overflow-hidden">
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => setIsPaused(!isPaused)} className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-black shadow-lg">
                                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                            </button>
                            <button onClick={toggleFullscreen} className="p-3 text-zinc-400 hover:text-white transition-all">
                                {isFullscreen ? <Minimize size={24}/> : <Maximize size={24}/>}
                            </button>
                            <button onClick={() => onNavigate(TABS.DASHBOARD)} className="p-3 bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white rounded-full transition-all border border-rose-500/20">
                                <ArrowLeft size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div id="active-slide-progress" className="h-full bg-emerald-500 transition-all duration-300 linear shadow-[0_0_10px_#10b981]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ProjectorView;