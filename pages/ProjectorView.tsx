import { 
    ArrowLeft, Award, Crown, Maximize, Minimize, Sparkles, Trophy, Star, 
    ShieldCheck, Activity, Users, ClipboardList, Calendar, Clock, 
    ChevronRight, Moon, Sun, Play, Pause, Layers, Plus, Zap, 
    MapPin, Sparkle, TrendingUp, ChevronUp, ChevronLeft, FastForward, Rewind,
    Timer, BarChart3, Presentation
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TABS } from '../constants';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, ResultStatus, PerformanceType } from '../types';

interface ProjectorViewProps {
    onNavigate: (tab: string) => void;
}

// --- Cinematic Constants ---
const SPEEDS = [
    { label: 'Cinematic', value: 20000 },
    { label: 'Standard', value: 12000 },
    { label: 'Rapid', value: 6000 }
];

const REVEAL_DELAY = 1500; 
const RACE_DURATION = 4000; 

type SlideType = 'RESULT' | 'LEADERBOARD' | 'STATS' | 'UPCOMING';

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

const ResultSlide: React.FC<{ result: any; revealStep: number; isDark: boolean }> = ({ result, revealStep, isDark }) => {
    const rank3 = result.winners.find((w: any) => w.position === 3);
    const rank2 = result.winners.find((w: any) => w.position === 2);
    const rank1 = result.winners.find((w: any) => w.position === 1);

    const RankCard = ({ rank, winner, isVisible, isChampion }: any) => {
        if (!isVisible || !winner) return null;
        
        const config = {
            1: { 
                bg: 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600', 
                border: 'border-yellow-300 shadow-[0_0_100px_rgba(234,179,8,0.4)]', 
                text: 'text-white', 
                subText: 'text-amber-100',
                points: 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]',
                icon: <Crown className="w-full h-full text-white" fill="currentColor"/>
            },
            2: { 
                bg: 'bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600', 
                border: 'border-slate-300 shadow-[0_0_50px_rgba(148,163,184,0.3)]', 
                text: 'text-white', 
                subText: 'text-slate-100',
                points: 'text-white',
                icon: <Star className="w-full h-full text-white" fill="currentColor"/>
            },
            3: { 
                bg: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600', 
                border: 'border-orange-300 shadow-[0_0_50px_rgba(249,115,22,0.3)]', 
                text: 'text-white', 
                subText: 'text-orange-100',
                points: 'text-white',
                icon: <Trophy className="w-full h-full text-white" fill="currentColor"/>
            }
        }[rank as 1|2|3]!;

        return (
            <div className={`
                relative flex flex-col items-center p-8 md:p-12 rounded-[4rem] border-4 
                animate-in zoom-in-50 slide-in-from-bottom-24 duration-1000 
                ${config.bg} ${config.border} 
                ${isChampion ? 'scale-110 z-20 md:mx-10' : 'scale-90 z-10 opacity-90'}
            `}>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay rounded-[3.8rem]"></div>
                
                <div className="relative mb-8">
                    <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center p-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.2)]">
                        {config.icon}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white flex items-center justify-center font-black text-2xl text-zinc-900 border-4 border-zinc-900/10">
                        {rank}
                    </div>
                </div>

                <div className="text-center space-y-2 mb-8">
                    <h3 className={`text-4xl md:text-6xl font-black font-serif uppercase tracking-tighter leading-none ${config.text}`}>
                        {winner.participantName}
                    </h3>
                    <p className={`text-xl md:text-2xl font-black uppercase tracking-[0.3em] ${config.subText}`}>{winner.teamName}</p>
                </div>

                <div className="w-full h-px bg-white/20 mb-8"></div>

                <div className="text-center">
                    <p className={`text-sm font-black uppercase tracking-[0.5em] mb-2 ${config.subText} opacity-80`}>TOTAL POINTS</p>
                    <div className={`text-6xl md:text-8xl font-black tabular-nums leading-none ${config.points}`}>
                        <CountUp end={winner.totalPoints} duration={2500} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-12 overflow-hidden relative">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vh] font-black font-serif uppercase tracking-tighter opacity-[0.03] select-none pointer-events-none transition-all duration-1000 ${revealStep >= 3 ? 'scale-110 opacity-[0.05]' : 'scale-90'}`}>
                WINNER
            </div>

            <div className="text-center mb-12 relative z-20">
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-emerald-500/10 rounded-full border-2 border-emerald-500/20 mb-4 animate-pulse">
                    <Sparkles size={24} className="text-emerald-500" />
                    <span className="text-xl font-black uppercase tracking-[0.5em] text-emerald-500">{result.categoryName}</span>
                </div>
                <h1 className="text-6xl md:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none drop-shadow-2xl mb-4">{result.itemName}</h1>
                <div className="flex items-center justify-center gap-6">
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent to-zinc-500/30"></div>
                    <span className="text-sm font-black uppercase tracking-[0.8em] text-zinc-500">Official Verdict</span>
                    <div className="h-1 w-24 bg-gradient-to-l from-transparent to-zinc-500/30"></div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-end justify-center w-full max-w-[95vw] gap-8 md:gap-0 flex-1 relative z-20">
                <div className="order-2 md:order-1">
                    <RankCard rank={2} winner={rank2} isVisible={revealStep >= 2} />
                </div>
                <div className="order-1 md:order-2">
                    <RankCard rank={1} winner={rank1} isVisible={revealStep >= 3} isChampion />
                </div>
                <div className="order-3 md:order-3">
                    <RankCard rank={3} winner={rank3} isVisible={revealStep >= 1} />
                </div>
            </div>
        </div>
    );
};

const LeaderboardSlide: React.FC<{ teams: any[]; active: boolean }> = ({ teams, active }) => {
    const [animate, setAnimate] = useState(false);
    const topTeams = useMemo(() => teams.slice(0, 10), [teams]);
    const maxPoints = Math.max(...teams.map(t => t.points), 1);

    useEffect(() => {
        if (active) {
            setAnimate(false);
            const timer = setTimeout(() => setAnimate(true), 500);
            return () => clearTimeout(timer);
        }
    }, [active]);

    return (
        <div className="h-full w-full flex flex-col p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-10">
                <Trophy size={400} strokeWidth={1} />
            </div>

            <div className="flex justify-between items-end mb-16 relative z-10">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981] animate-pulse"></div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-indigo-500">Global Scoreboard</h2>
                    </div>
                    <h1 className="text-8xl md:text-[12vh] font-black font-serif uppercase tracking-tighter leading-none drop-shadow-lg">Point Tally</h1>
                </div>
                <div className="px-10 py-5 rounded-[2rem] bg-indigo-500 text-white shadow-2xl animate-bounce">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Leading Unit</div>
                    <div className="text-3xl font-black uppercase">{topTeams[0]?.name || '---'}</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 relative z-10 overflow-y-auto no-scrollbar pb-20">
                {topTeams.map((team, i) => {
                    const percentage = (team.points / maxPoints) * 100;
                    const isWinner = i === 0;
                    
                    return (
                        <div key={team.id} className="group relative flex items-center h-20 md:h-24">
                            <div className={`w-20 md:w-24 shrink-0 flex items-center justify-center font-black text-3xl md:text-5xl ${isWinner ? 'text-amber-500' : 'text-zinc-500/50'}`}>
                                {(i + 1).toString().padStart(2, '0')}
                            </div>

                            <div className="flex-grow h-full flex flex-col justify-center px-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className={`text-xl md:text-3xl font-black uppercase tracking-tight ${isWinner ? 'text-white' : 'text-zinc-400'}`}>
                                        {team.name}
                                    </span>
                                    <div className={`text-3xl md:text-5xl font-black tabular-nums leading-none ${isWinner ? 'text-amber-400' : 'text-emerald-500'}`}>
                                        {animate ? <CountUp end={team.points} duration={RACE_DURATION} /> : '0'}
                                    </div>
                                </div>
                                <div className="h-3 md:h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-[4000ms] ease-out relative
                                            ${isWinner ? 'bg-gradient-to-r from-amber-600 to-yellow-400' : 'bg-gradient-to-r from-indigo-600 to-emerald-400'}
                                        `}
                                        style={{ width: animate ? `${Math.max(percentage, 5)}%` : '0%' }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-shimmer-sweep"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatsSlide: React.FC<{ stats: any }> = ({ stats }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-20 animate-in zoom-in-95 duration-1000">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-[0.8em] text-indigo-500 mb-4">Art Fest Ecosystem</h2>
            <h1 className="text-8xl md:text-[14vh] font-black font-serif uppercase tracking-tighter leading-none drop-shadow-2xl">Festival Pulse</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full max-w-7xl">
            {[
                { icon: Users, label: 'Delegates', value: stats.participants, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { icon: Trophy, label: 'Results Ready', value: stats.declared, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: Star, label: 'Global Points', value: stats.totalPoints, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { icon: ClipboardList, label: 'Categories', value: stats.categories, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { icon: Layers, label: 'Competitions', value: stats.items, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                { icon: Calendar, label: 'Scheduled', value: stats.scheduled, color: 'text-purple-500', bg: 'bg-purple-500/10' }
            ].map((stat, i) => (
                <div key={i} className={`flex flex-col items-center p-12 rounded-[4rem] ${stat.bg} border-4 border-white/5 backdrop-blur-3xl shadow-2xl transition-transform hover:scale-105 duration-500`}>
                    <stat.icon size={64} className={`${stat.color} mb-6`} />
                    <div className="text-6xl md:text-8xl font-black mb-2 tabular-nums leading-none">
                        <CountUp end={stat.value} />
                    </div>
                    <p className="text-lg font-black uppercase tracking-[0.5em] text-zinc-500 opacity-60 text-center">{stat.label}</p>
                </div>
            ))}
        </div>
    </div>
);

const UpcomingSlide: React.FC<{ events: any[] }> = ({ events }) => (
    <div className="h-full w-full flex flex-col p-16 animate-in slide-in-from-right-24 duration-1000">
        <div className="mb-16 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-amber-500 mb-2 flex items-center gap-4">
                    <Clock size={32} /> LIVE TIMELINE
                </h2>
                <h1 className="text-8xl md:text-[12vh] font-black font-serif uppercase tracking-tighter leading-none drop-shadow-xl">Program Flow</h1>
            </div>
            <div className="px-10 py-5 rounded-full bg-emerald-500 text-black text-xl font-black uppercase tracking-[0.5em] animate-pulse">
                Next Up
            </div>
        </div>
        <div className="flex-1 flex flex-col gap-6 overflow-hidden pr-4">
            {events.slice(0, 4).map((ev, i) => (
                <div key={i} className="flex items-center gap-12 p-8 md:p-12 bg-white/5 rounded-[5rem] border-4 border-white/5 backdrop-blur-3xl relative overflow-hidden group hover:bg-white/10 transition-all duration-700">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[4rem] bg-zinc-950 border-4 border-emerald-500/20 flex flex-col items-center justify-center text-center shrink-0 shadow-2xl transition-transform group-hover:scale-105">
                        <span className="text-lg font-black uppercase text-zinc-500 mb-2">{ev.date}</span>
                        <span className="text-4xl md:text-6xl font-black text-white leading-none">{ev.time}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-6 mb-4">
                            <span className="px-6 py-2 rounded-2xl bg-indigo-500 text-white text-sm font-black uppercase tracking-[0.4em] shadow-lg">{ev.categoryName}</span>
                            <span className="text-2xl font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest"><MapPin size={24} className="text-rose-500" /> {ev.stage}</span>
                        </div>
                        <h3 className="text-5xl md:text-7xl font-black font-serif uppercase tracking-tighter truncate leading-none text-white drop-shadow-lg">{ev.itemName}</h3>
                    </div>
                    <ChevronRight size={100} className="text-white opacity-10 group-hover:opacity-100 transition-all transform group-hover:translate-x-6" strokeWidth={4} />
                </div>
            ))}
            {events.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 border-4 border-dashed border-white/10 rounded-[5rem]">
                    <Calendar size={120} strokeWidth={1} />
                    <p className="text-2xl font-black uppercase tracking-[0.5em] mt-8">Timeline Complete</p>
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
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [slideTempo, setSlideTempo] = useState(SPEEDS[1]); // Standard
    
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<number>(0);
    const lastTickRef = useRef<number>(Date.now());

    const SLIDE_ORDER: SlideType[] = ['RESULT', 'LEADERBOARD', 'STATS', 'UPCOMING'];

    const data = useMemo(() => {
        if (!state) return null;
        
        const declared = state.results.filter(r => r.status === ResultStatus.DECLARED);
        const lastResult = declared[declared.length - 1];
        let resultSlideData = null;
        if (lastResult) {
            const item = state.items.find(i => i.id === lastResult.itemId);
            const category = state.categories.find(c => c.id === lastResult.categoryId);
            const winners = lastResult.winners.map(w => {
                const p = state.participants.find(part => part.id === w.participantId);
                const t = state.teams.find(team => team.id === p?.teamId);
                let pts = 0;
                if (w.position === 1) pts += item?.points.first || 0;
                else if (w.position === 2) pts += item?.points.second || 0;
                else if (w.position === 3) pts += item?.points.third || 0;
                const gConfig = item?.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group;
                const g = w.gradeId ? gConfig.find(grade => grade.id === w.gradeId) : null;
                if (g) pts += (item?.gradePointsOverride?.[g.id] ?? g.points);
                return { ...w, participantName: item?.type === ItemType.GROUP ? `${p?.name} & Party` : (p?.name || '---'), place: p?.place, teamName: t?.name || '---', totalPoints: pts };
            }).sort((a,b) => (a.position || 99) - (b.position || 99));
            resultSlideData = { itemName: item?.name, categoryName: category?.name, winners };
        }

        const teamPointsMap: Record<string, number> = {};
        state.teams.forEach(t => teamPointsMap[t.id] = 0);
        declared.forEach(r => {
            const item = state.items.find(i => i.id === r.itemId);
            r.winners.forEach(w => {
                const p = state.participants.find(part => part.id === w.participantId);
                if (!p) return;
                let pts = 0;
                if (w.position === 1) pts += item?.points.first || 0;
                else if (w.position === 2) pts += item?.points.second || 0;
                else if (w.position === 3) pts += item?.points.third || 0;
                const gConfig = item?.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group;
                const g = w.gradeId ? gConfig.find(grade => grade.id === w.gradeId) : null;
                if (g) pts += (item?.gradePointsOverride?.[g.id] ?? g.points);
                teamPointsMap[p.teamId] = (teamPointsMap[p.teamId] || 0) + pts;
            });
        });
        const leaderboardData = state.teams.map(t => ({ ...t, points: teamPointsMap[t.id] })).sort((a,b) => b.points - a.points);

        return { 
            result: resultSlideData, 
            leaderboard: leaderboardData, 
            stats: {
                participants: state.participants.length,
                items: state.items.length,
                declared: declared.length,
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
    }, [state]);

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

            progressRef.current += (delta / slideTempo.value) * 100;

            if (progressRef.current >= 100) {
                progressRef.current = 0;
                setCurrentSlideIndex(prev => (prev + 1) % SLIDE_ORDER.length);
            }

            const bar = document.getElementById('active-slide-progress');
            if (bar) bar.style.width = `${progressRef.current}%`;
        };

        const interval = setInterval(tick, 30);
        return () => clearInterval(interval);
    }, [isPaused, slideTempo, SLIDE_ORDER.length]);

    // Handle Result Reveal Sequence
    useEffect(() => {
        if (SLIDE_ORDER[currentSlideIndex] === 'RESULT') {
            setRevealStep(0);
            const t3 = setTimeout(() => setRevealStep(1), REVEAL_DELAY);
            const t2 = setTimeout(() => setRevealStep(2), REVEAL_DELAY * 2);
            const t1 = setTimeout(() => setRevealStep(3), REVEAL_DELAY * 3);
            return () => { clearTimeout(t3); clearTimeout(t2); clearTimeout(t1); };
        }
    }, [currentSlideIndex, data?.result?.itemName]);

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

    const currentSlide = SLIDE_ORDER[currentSlideIndex];

    return (
        <div ref={containerRef} className={`h-screen w-screen overflow-hidden relative font-sans select-none transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#030403] text-white' : 'bg-[#FAF8F4] text-zinc-900'}`}>
            
            {/* Ambient Lighting */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-30%] left-[-20%] w-[100vw] h-[100vw] rounded-full blur-[400px] animate-blob-pulse-1 opacity-20 ${theme === 'dark' ? 'bg-indigo-900/50' : 'bg-indigo-300/40'}`}></div>
                <div className={`absolute bottom-[-30%] right-[-20%] w-[100vw] h-[100vw] rounded-full blur-[400px] animate-blob-pulse-2 opacity-20 ${theme === 'dark' ? 'bg-emerald-900/50' : 'bg-emerald-300/40'}`}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay"></div>
            </div>

            {/* Slide Layer */}
            <main className="relative z-10 h-full w-full overflow-hidden">
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentSlide === 'RESULT' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                   {data.result ? <ResultSlide result={data.result} revealStep={revealStep} isDark={theme === 'dark'} /> : <StatsSlide stats={data.stats} />}
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentSlide === 'LEADERBOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32 pointer-events-none'}`}>
                    <LeaderboardSlide teams={data.leaderboard} active={currentSlide === 'LEADERBOARD'} />
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentSlide === 'STATS' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
                    <StatsSlide stats={data.stats} />
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${currentSlide === 'UPCOMING' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                    <UpcomingSlide events={data.upcoming} />
                </div>
            </main>

            {/* --- Control Console Overlay --- */}
            <div className="absolute inset-0 z-50 pointer-events-none group">
                
                {/* Header Badge */}
                <div className="absolute top-10 left-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="px-6 py-2 bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/10 flex items-center gap-3">
                         <Presentation size={18} className="text-emerald-500" />
                         <span className="text-xs font-black uppercase tracking-[0.4em] text-white">Live Broadcast Mode</span>
                    </div>
                </div>

                {/* Floating Master Console */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-auto max-w-[90vw] pointer-events-auto opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl flex flex-col gap-3">
                        
                        {/* Slide Nav & Direct Jump */}
                        <div className="flex items-center gap-3 px-2">
                             {SLIDE_ORDER.map((s, i) => (
                                <button 
                                    key={s}
                                    onClick={() => { setCurrentSlideIndex(i); progressRef.current = 0; }}
                                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${currentSlideIndex === i ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    {s}
                                </button>
                             ))}
                        </div>

                        <div className="h-px bg-white/5 mx-4"></div>

                        {/* Transport Controls */}
                        <div className="flex items-center justify-between gap-8 px-4">
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleSkip('prev')} className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"><ChevronLeft size={24} /></button>
                                <button 
                                    onClick={() => setIsPaused(!isPaused)} 
                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isPaused ? <Play size={28} fill="currentColor" className="ml-1"/> : <Pause size={28} fill="currentColor"/>}
                                </button>
                                <button onClick={() => handleSkip('next')} className="p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"><ChevronRight size={24} /></button>
                            </div>

                            <div className="h-10 w-px bg-white/10"></div>

                            {/* Speed / Tempo */}
                            <div className="flex items-center gap-2">
                                <Timer size={16} className="text-zinc-500 mr-2" />
                                {SPEEDS.map(s => (
                                    <button 
                                        key={s.label}
                                        onClick={() => setSlideTempo(s)}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${slideTempo.value === s.value ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-white/10 text-zinc-500 hover:text-white'}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-10 w-px bg-white/10"></div>

                            {/* Settings */}
                            <div className="flex items-center gap-3">
                                <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-3 text-zinc-400 hover:text-white rounded-full transition-all">
                                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                                </button>
                                <button onClick={toggleFullscreen} className="p-3 text-zinc-400 hover:text-white rounded-full transition-all">
                                    {isFullscreen ? <Minimize size={20}/> : <Maximize size={20}/>}
                                </button>
                                <button onClick={() => onNavigate(TABS.DASHBOARD)} className="p-3 text-rose-400 hover:bg-rose-500 hover:text-white rounded-full transition-all">
                                    <ArrowLeft size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Master Progress */}
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                            <div id="active-slide-progress" className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-300 linear"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
                .animate-shimmer-sweep { animation: shimmer-sweep 2s infinite ease-in-out; }
                @keyframes blob-pulse-1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(5vw, 5vh) scale(1.1); } 66% { transform: translate(-5vw, 10vh) scale(0.9); } }
                @keyframes blob-pulse-2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-10vw, -5vh) scale(1.2); } 66% { transform: translate(5vw, -10vh) scale(0.8); } }
                .animate-blob-pulse-1 { animation: blob-pulse-1 20s infinite ease-in-out; }
                .animate-blob-pulse-2 { animation: blob-pulse-2 25s infinite ease-in-out; }
                .ease-out-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default ProjectorView;