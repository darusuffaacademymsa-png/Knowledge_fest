
import { ArrowLeft, Award, Crown, Maximize, Minimize, Sparkles, Trophy, Star, ShieldCheck, Activity, Users, ClipboardList, Calendar, Clock, ChevronRight, Moon, Sun, Play, Pause, Layers, Plus, Zap, MapPin, Sparkle, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TABS } from '../constants';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, ResultStatus, PerformanceType } from '../types';

interface ProjectorViewProps {
    onNavigate: (tab: string) => void;
}

// --- Cinematic Constants ---
const SLIDE_DURATION = 20000; 
const REVEAL_DELAY = 1200; 
const RACE_DURATION = 6000; 

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
            const easeOutQuad = (t: number) => t * (2 - t);
            const current = Math.floor(start + (easeOutQuad(progress) * (end - start)));
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
    return <>{count}</>;
};

// --- Slide Components ---

const ResultSlide: React.FC<{ result: any; revealStep: number; isDark: boolean }> = ({ result, revealStep, isDark }) => {
    const rank3 = result.winners.find((w: any) => w.position === 3);
    const rank2 = result.winners.find((w: any) => w.position === 2);
    const rank1 = result.winners.find((w: any) => w.position === 1);

    const RankCard = ({ rank, winner, isVisible, isChampion }: any) => {
        if (!isVisible) return null;
        const colors = {
            1: { bg: 'from-amber-400/20 via-yellow-500/10 to-amber-600/20', border: 'border-yellow-500/50', text: 'text-yellow-500', badge: 'bg-gradient-to-br from-amber-300 to-yellow-600' },
            2: { bg: 'from-slate-400/20 via-slate-500/10 to-slate-600/20', border: 'border-slate-400/50', text: 'text-slate-400', badge: 'bg-gradient-to-br from-slate-200 to-slate-500' },
            3: { bg: 'from-orange-400/20 via-orange-500/10 to-orange-600/20', border: 'border-orange-500/50', text: 'text-orange-500', badge: 'bg-gradient-to-br from-orange-300 to-orange-600' }
        }[rank as 1|2|3]!;

        return (
            <div className={`relative flex-1 w-full md:w-auto flex flex-col items-center p-[2vh] md:p-[3vh] rounded-[2.5rem] border-2 backdrop-blur-3xl animate-in zoom-in-95 slide-in-from-bottom-12 duration-1000 bg-gradient-to-br ${colors.bg} ${colors.border} ${isChampion ? 'scale-100 md:scale-105 z-20 md:mx-[1.5vw] shadow-[0_0_60px_rgba(234,179,8,0.2)]' : 'scale-95 md:scale-90 opacity-90'}`}>
                {isChampion && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-yellow-500 text-black text-[1vh] font-black font-source uppercase tracking-[0.4em] shadow-2xl animate-pulse whitespace-nowrap">
                        Winner
                    </div>
                )}
                <div className={`w-10 h-10 md:w-[10vh] md:h-[10vh] rounded-full flex items-center justify-center font-black text-lg md:text-[4.5vh] mb-3 md:mb-[2vh] shadow-2xl border-4 border-white/20 text-white font-inter ${colors.badge}`}>
                    {rank}
                </div>
                <div className="text-center space-y-1">
                    <h3 className={`text-xl md:text-[4.5vh] font-black font-serif uppercase tracking-tighter leading-tight drop-shadow-sm ${isChampion ? (isDark ? 'text-white' : 'text-zinc-900') : colors.text}`}>
                        {winner.participantName}
                    </h3>
                    <p className="text-[1.3vh] font-bold font-montserrat text-zinc-500 uppercase tracking-[0.2em]">{winner.teamName}</p>
                </div>
                <div className="mt-3 md:mt-[2vh] flex items-center gap-3 border-t border-white/10 pt-3 md:pt-[2vh] w-full justify-center">
                    <div className="text-center">
                        <p className="text-[0.9vh] font-black font-source uppercase tracking-widest text-zinc-500 mb-1 opacity-60">Points</p>
                        <div className="text-xl md:text-[3.5vh] font-black font-inter text-emerald-500 tabular-nums">+<CountUp end={winner.totalPoints} /></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-[4vh] animate-in fade-in duration-1000">
            <div className="text-center mb-[3vh] space-y-1">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-1 animate-pulse">
                    <Zap size={12} className="text-emerald-500 fill-current" />
                    <span className="text-[1.1vh] font-black font-source uppercase tracking-[0.4em] text-emerald-500">{result.categoryName}</span>
                </div>
                <h1 className="text-3xl md:text-[7vh] font-black font-serif uppercase tracking-tighter leading-tight drop-shadow-2xl">{result.itemName}</h1>
                <div className="flex items-center justify-center gap-4 pt-1">
                    <div className="h-[1px] w-[8vw] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-30"></div>
                    <span className="text-[0.9vh] font-bold font-source uppercase tracking-[0.5em] text-zinc-500">Official Declaration</span>
                    <div className="h-[1px] w-[8vw] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-30"></div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-[85vw] gap-4 md:gap-[2vw] flex-1 overflow-hidden">
                <div className="flex flex-col md:flex-row w-full md:w-auto items-center justify-center gap-4 md:gap-[1vw]">
                    <RankCard rank={1} winner={rank1} isVisible={revealStep >= 3} isChampion />
                    <div className="flex flex-row md:flex-row w-full md:w-auto gap-3 md:gap-[1vw] justify-center">
                        <RankCard rank={2} winner={rank2} isVisible={revealStep >= 2} />
                        <RankCard rank={3} winner={rank3} isVisible={revealStep >= 1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeaderboardSlide: React.FC<{ teams: any[]; active: boolean }> = ({ teams, active }) => {
    const [animate, setAnimate] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    // REMOVED SLICE: Show all teams
    const topTeams = useMemo(() => teams, [teams]);
    const maxPoints = Math.max(...teams.map(t => t.points), 1);

    useEffect(() => {
        if (active) {
            setAnimate(false);
            setIsFinished(false);
            const timer = setTimeout(() => setAnimate(true), 800);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
            setIsFinished(false);
        }
    }, [active, teams]);

    const handleRaceFinish = () => {
        setIsFinished(true);
    };

    return (
        <div className="h-full w-full flex flex-col p-[4vh] md:p-[6vh] overflow-hidden relative">
            {/* Header Overlay */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-[3vh] gap-4 relative z-20 shrink-0">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
                        <h2 className="text-[1.6vh] font-black font-source uppercase tracking-[0.5em] text-indigo-500">Live Global Ranking</h2>
                    </div>
                    <h1 className="text-4xl md:text-[9vh] font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white drop-shadow-sm">The Tally</h1>
                </div>

                <div className="px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[1.2vh] font-black font-source uppercase tracking-[0.4em] animate-pulse backdrop-blur-xl">
                    Art Fest Standings
                </div>
            </div>

            {/* Vertical 3D Bar Race Arena - Added overflow-x-auto for large team lists */}
            <div className="flex-1 flex items-end justify-center gap-2 md:gap-[2vw] relative z-10 px-4 md:px-10 pb-[2vh] perspective-[2500px] min-h-0 overflow-x-auto no-scrollbar">
                {topTeams.map((team, i) => {
                    const isWinner = i === 0;
                    const isSilver = i === 1;
                    const isBronze = i === 2;
                    const percentage = (team.points / maxPoints) * 100;
                    
                    const barColor = isWinner 
                        ? 'from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_80px_rgba(251,191,36,0.4)]' 
                        : isSilver
                        ? 'from-slate-300 via-slate-400 to-slate-500 shadow-[0_0_30px_rgba(148,163,184,0.2)]'
                        : isBronze
                        ? 'from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_25px_rgba(249,115,22,0.2)]'
                        : 'from-indigo-600/40 via-indigo-700/30 to-indigo-900/20 border-white/10';

                    return (
                        <div key={team.id} className="flex-1 flex flex-col items-center justify-end h-full min-w-[60px] max-w-[120px]">
                            {/* Points HUD */}
                            <div 
                                className={`mb-[1.5vh] transition-all duration-1000 transform ${animate ? 'opacity-100 translate-y-0 scale-110' : 'opacity-0 translate-y-12 scale-90'}`}
                            >
                                <div className={`text-lg md:text-[5.5vh] font-black font-inter tabular-nums tracking-tighter text-center leading-none ${isWinner ? 'text-amber-400 drop-shadow-glow' : 'text-white/90'}`}>
                                    {animate ? (
                                        <CountUp 
                                            start={0} 
                                            end={team.points} 
                                            duration={RACE_DURATION} 
                                            onFinish={isWinner ? handleRaceFinish : undefined} 
                                        />
                                    ) : '0'}
                                </div>
                                <div className="text-[0.9vh] font-black font-source uppercase tracking-[0.3em] text-zinc-500 text-center mt-1 opacity-50">Points</div>
                            </div>

                            {/* 3D Vertical Bar Structure */}
                            <div className="relative w-full flex-1 flex items-end justify-center max-h-[60vh]">
                                <div 
                                    className={`relative w-[80%] md:w-[70%] transition-all duration-[6000ms] ease-out-expo rounded-t-[1rem] md:rounded-t-[1.5rem] border-t-2 border-white/20 bg-gradient-to-b ${barColor} transform-gpu origin-bottom`}
                                    style={{ 
                                        height: animate ? `${Math.max(percentage, 5)}%` : '0%',
                                        transitionDelay: `${i * 150}ms`,
                                        transform: isWinner && isFinished ? 'scaleX(1.1) translateY(-2vh) translateZ(80px)' : 'scaleX(1) translateY(0) translateZ(0)'
                                    }}
                                >
                                    {/* 3D Depth Layers */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25 rounded-t-[1rem] md:rounded-t-[1.5rem]"></div>
                                    
                                    {/* Victory Finish Sequence */}
                                    {isWinner && isFinished && (
                                        <div className="absolute inset-0 overflow-hidden rounded-t-[1rem] md:rounded-t-[1.5rem]">
                                            <div className="absolute inset-0 bg-white/30 animate-victory-pulse pointer-events-none"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-victory-shimmer"></div>
                                            <div className="absolute top-[2vh] left-1/2 -translate-x-1/2 animate-winner-pop">
                                                <div className="relative">
                                                    <Crown size={24} className="text-black drop-shadow-[0_0_20px_#fff]" fill="currentColor"/>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rotating Team Name Labels */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                        <span className={`text-[1vh] md:text-[1.8vh] font-black font-montserrat uppercase tracking-[0.3em] whitespace-nowrap -rotate-90 select-none transition-opacity duration-2000 ${animate ? 'opacity-30' : 'opacity-0'}`}>
                                            {team.name}
                                        </span>
                                    </div>

                                    {/* Rank Indicator */}
                                    <div className="absolute bottom-[1vh] left-0 right-0 text-center">
                                        <div className={`text-sm md:text-[3vh] font-black font-inter ${isWinner ? 'text-black/80' : 'text-white/20'}`}>
                                            {i + 1}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Baseline Identity */}
                            <div className="mt-[2vh] w-full text-center min-h-[4vh]">
                                <span className={`text-[1vh] md:text-[1.5vh] font-black font-montserrat uppercase tracking-[0.2em] block truncate px-1 transition-all duration-1000 ${isWinner && isFinished ? 'text-amber-400 scale-110 drop-shadow-glow' : 'text-zinc-500'}`}>
                                    {team.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Victory Confetti Blast */}
            {isFinished && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute bg-gradient-to-br from-amber-200 to-yellow-500 w-3 h-3 rounded-sm animate-confetti-fall"
                            style={{ 
                                left: `${Math.random() * 100}%`,
                                top: `-20px`,
                                animationDelay: `${Math.random() * 5}s`,
                                transform: `rotate(${Math.random() * 360}deg)`,
                                opacity: Math.random() + 0.3
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Cinematic Background Typography */}
            <div className="absolute bottom-[-5%] left-0 text-[35vh] font-black font-serif uppercase text-zinc-500/5 pointer-events-none select-none tracking-tighter z-0 leading-none">
                Art Fest
            </div>
        </div>
    );
};

const StatsSlide: React.FC<{ stats: any }> = ({ stats }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-[5vh] md:p-[6vh] animate-in zoom-in-105 duration-1000 overflow-hidden">
        <div className="text-center mb-[6vh]">
            <h2 className="text-[2vh] font-black font-source uppercase tracking-[0.6em] text-indigo-500 mb-2">Event Intelligence</h2>
            <h1 className="text-4xl md:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white drop-shadow-xl">Live Metrics</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[3vh] md:gap-[4vh] w-full max-w-[80vw]">
            {[
                { icon: Users, label: 'Delegates', value: stats.participants, color: 'text-indigo-500' },
                { icon: Trophy, label: 'Declared Results', value: stats.declared, color: 'text-amber-500' },
                { icon: Activity, label: 'Total Point Tally', value: stats.totalPoints, color: 'text-sky-500' },
                { icon: ClipboardList, label: 'Categories', value: stats.categories, color: 'text-rose-500' },
                { icon: Layers, label: 'Scopes', value: stats.items, color: 'text-emerald-500' },
                { icon: Calendar, label: 'Scheduled', value: stats.scheduled, color: 'text-purple-500' }
            ].map((stat, i) => (
                <div key={i} className="group flex flex-col items-center p-[3vh] md:p-[4vh] rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl transition-all duration-700 hover:bg-white/10">
                    <stat.icon size={36} className={`${stat.color} mb-[2vh] md:w-[7vh] md:h-[7vh]`} />
                    <div className="text-3xl md:text-[8vh] font-black font-inter mb-1 tabular-nums tracking-tighter leading-none text-white"><CountUp end={stat.value} /></div>
                    <p className="text-[1.1vh] font-bold font-source uppercase tracking-[0.6em] text-zinc-500 text-center opacity-70">{stat.label}</p>
                </div>
            ))}
        </div>
    </div>
);

const UpcomingSlide: React.FC<{ events: any[] }> = ({ events }) => (
    <div className="h-full w-full flex flex-col p-[4vh] md:p-[6vh] animate-in fade-in slide-in-from-bottom-24 duration-1000 overflow-hidden">
        <div className="mb-[4vh] flex flex-col md:flex-row justify-between items-end gap-3 shrink-0">
            <div className="space-y-0.5">
                <h2 className="text-[2vh] font-black font-source uppercase tracking-[0.5em] text-amber-500 flex items-center gap-5">
                    <Clock size={20} className="md:w-[4vh] md:h-[4vh]" /> Time Stream
                </h2>
                <h1 className="text-4xl md:text-[10vh] font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white drop-shadow-xl">Program Flow</h1>
            </div>
            <div className="text-right">
                <div className="px-8 py-3 rounded-full bg-emerald-500 text-black text-[1.4vh] font-black font-source uppercase tracking-[0.5em] animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.5)]">Live Feed</div>
            </div>
        </div>
        <div className="flex-1 flex flex-col gap-[2.5vh] overflow-y-auto pr-2 custom-scrollbar pb-[10vh]">
            {events.length > 0 ? events.map((ev, i) => (
                <div key={i} className="flex items-center gap-6 md:gap-[4vw] p-4 md:p-[3.5vh] bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-3xl relative overflow-hidden group hover:bg-white/10 transition-all duration-700 shrink-0">
                    <div className="w-20 h-20 md:w-[22vh] md:h-[22vh] rounded-[3.5rem] bg-zinc-950 border-2 border-white/10 flex flex-col items-center justify-center text-center shrink-0 shadow-2xl transition-transform group-hover:scale-105">
                        <span className="text-[1.2vh] font-black font-source uppercase text-zinc-500 mb-1">{ev.date.split(' ')[0]}</span>
                        <span className="text-2xl md:text-[9vh] font-black font-inter text-white leading-none tabular-nums tracking-tighter">{ev.time.split(' ')[0]}</span>
                        <span className="text-[1.2vh] font-black font-source uppercase text-amber-500 mt-1">{ev.time.split(' ')[1]}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex flex-wrap items-center gap-3 md:gap-[1.5vw] mb-2 md:mb-[2vh]">
                            <span className="px-4 py-1.5 rounded-2xl bg-indigo-500/20 text-indigo-400 text-[1.2vh] md:text-[2vh] font-black font-source uppercase tracking-[0.4em] border border-indigo-500/30">{ev.categoryName}</span>
                            <span className="px-4 py-1.5 rounded-2xl bg-white/5 text-zinc-400 text-[1.2vh] md:text-[2vh] font-black font-source uppercase tracking-[0.4em] border border-white/10 flex items-center gap-3"><MapPin size={18} className="text-emerald-500" /> {ev.stage}</span>
                        </div>
                        <h3 className="text-2xl md:text-[7.5vh] font-black font-montserrat uppercase tracking-tighter truncate leading-none text-zinc-100">{ev.itemName}</h3>
                    </div>
                    <ChevronRight size={64} className="text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-6 hidden md:block" strokeWidth={4} />
                </div>
            )) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                    <Calendar size={120} strokeWidth={1} className="text-zinc-500" />
                    <p className="text-[3vh] font-black font-source uppercase tracking-[0.6em] mt-10 text-zinc-400">Queue Ready</p>
                </div>
            )}
        </div>
    </div>
);

// --- Main View ---

const ProjectorView: React.FC<ProjectorViewProps> = ({ onNavigate }) => {
    const { state } = useFirebase();
    const [activeSlide, setActiveSlide] = useState<SlideType>('RESULT');
    const [revealStep, setRevealStep] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Data Aggregation ---
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
                return { ...w, participantName: item?.type === ItemType.GROUP ? `${p?.name} & Party` : (p?.name || '---'), place: p?.place, teamName: t?.name || '---', totalPoints: pts, gradeName: g?.name || '-' };
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

        const statsData = {
            participants: state.participants.length,
            items: state.items.length,
            declared: declared.length,
            categories: state.categories.length,
            totalPoints: Object.values(teamPointsMap).reduce((a, b) => a + b, 0),
            scheduled: state.schedule.length
        };

        const upcomingData = state.schedule
            .map(ev => ({ ...ev, itemName: state.items.find(i => i.id === ev.itemId)?.name, categoryName: state.categories.find(c => c.id === ev.categoryId)?.name }));
            // REMOVED SLICE: Show full list

        return { result: resultSlideData, leaderboard: leaderboardData, stats: statsData, upcoming: upcomingData };
    }, [state]);

    useEffect(() => {
        if (isPaused) return;

        const cycle = setInterval(() => {
            setActiveSlide(current => {
                if (current === 'RESULT') return 'LEADERBOARD';
                if (current === 'LEADERBOARD') return 'STATS';
                if (current === 'STATS') return 'UPCOMING';
                return 'RESULT';
            });
        }, SLIDE_DURATION);

        return () => clearInterval(cycle);
    }, [isPaused]);

    useEffect(() => {
        if (activeSlide === 'RESULT') {
            setRevealStep(0);
            const t3 = setTimeout(() => setRevealStep(1), REVEAL_DELAY);
            const t2 = setTimeout(() => setRevealStep(2), REVEAL_DELAY * 2);
            const t1 = setTimeout(() => setRevealStep(3), REVEAL_DELAY * 3.5);
            return () => { clearTimeout(t3); clearTimeout(t2); clearTimeout(t1); };
        }
    }, [activeSlide, data?.result?.itemName]); 

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
        else { document.exitFullscreen(); setIsFullscreen(false); }
    };

    if (!state || !data) return null;

    return (
        <div 
            ref={containerRef} 
            className={`h-screen w-screen overflow-hidden relative font-sans select-none transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#030403] text-white' : 'bg-[#FAF8F4] text-zinc-900'}`}
        >
            {/* Cinematic Background Orbs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-30%] left-[-20%] w-[100vw] h-[100vw] rounded-full blur-[350px] animate-pulse-slow opacity-20 ${theme === 'dark' ? 'bg-emerald-900/50' : 'bg-emerald-300/40'}`}></div>
                <div className={`absolute bottom-[-30%] right-[-20%] w-[100vw] h-[100vw] rounded-full blur-[350px] animate-pulse-slow delay-2000 opacity-20 ${theme === 'dark' ? 'bg-indigo-900/50' : 'bg-indigo-300/40'}`}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay"></div>
            </div>

            {/* Content Display Engine */}
            <main className="relative z-10 h-full w-full overflow-hidden">
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${activeSlide === 'RESULT' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                   {data.result ? <ResultSlide result={data.result} revealStep={revealStep} isDark={theme === 'dark'} /> : <StatsSlide stats={data.stats} />}
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${activeSlide === 'LEADERBOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'}`}>
                    <LeaderboardSlide teams={data.leaderboard} active={activeSlide === 'LEADERBOARD'} />
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${activeSlide === 'STATS' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
                    <StatsSlide stats={data.stats} />
                </div>
                <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${activeSlide === 'UPCOMING' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
                    <UpcomingSlide events={data.upcoming} />
                </div>
            </main>

            {/* Cinematic Brand Footer */}
            <div className="absolute bottom-[3vh] left-0 right-0 flex flex-col md:flex-row justify-between items-center px-[8vw] z-20 gap-3 md:gap-0 shrink-0">
                <div className="flex items-center gap-8 opacity-60 text-center md:text-left group transition-opacity hover:opacity-100">
                    <div className="flex flex-col">
                        <span className="text-[1vh] font-black font-source uppercase tracking-[0.7em] mb-1 text-indigo-500">Official Broadcast Center</span>
                        <span className="text-xl md:text-[3.2vh] font-black font-serif uppercase tracking-[0.3em] truncate max-w-[500px] md:max-w-none leading-none text-zinc-100 drop-shadow-md">{state.settings.heading}</span>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="text-right opacity-40 hidden sm:block">
                        <p className="text-[1vh] font-black font-source uppercase tracking-[0.5em] mb-1">State Sync 5.4</p>
                        <p className="text-[1.4vh] font-bold font-source uppercase tracking-widest text-zinc-400">Cinematic Core</p>
                    </div>
                    {state.settings.institutionDetails?.logoUrl && (
                        <img src={state.settings.institutionDetails.logoUrl} className="h-[4vh] md:h-[5vh] object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-700" alt="Logo" />
                    )}
                </div>
            </div>

            {/* Progress Visualization Bar */}
            <div className="absolute top-0 left-0 right-0 h-[4px] z-[100] flex gap-4 px-20 pt-10">
                {['RESULT', 'LEADERBOARD', 'STATS', 'UPCOMING'].map((s) => (
                    <div key={s} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden backdrop-blur-xl shadow-inner">
                        {activeSlide === s && !isPaused && (
                            <div className="h-full bg-emerald-500 animate-slide-progress shadow-[0_0_20px_#10b981]"></div>
                        )}
                        {activeSlide === s && isPaused && (
                            <div className="h-full bg-emerald-500 w-full opacity-60 shadow-[0_0_15px_#10b981]"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Invisible HUD Controls */}
            <div className="absolute top-16 right-20 flex gap-3 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-1000 z-[200]">
                <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-3 bg-white/5 backdrop-blur-3xl hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white shadow-2xl">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={() => setIsPaused(!isPaused)} className="p-3 bg-white/5 backdrop-blur-3xl hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white shadow-2xl">
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </button>
                <button onClick={toggleFullscreen} className="p-3 bg-white/5 backdrop-blur-3xl hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white shadow-2xl">
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
                <button onClick={() => onNavigate(TABS.DASHBOARD)} className="p-3 bg-white/5 backdrop-blur-3xl hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white shadow-2xl">
                    <ArrowLeft size={18} />
                </button>
            </div>

            <style>{`
                @keyframes slide-progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-slide-progress {
                    animation: slide-progress ${SLIDE_DURATION}ms linear forwards;
                }
                @keyframes shimmer-sweep {
                    from { transform: translateX(-150%) skewX(-25deg); }
                    to { transform: translateX(250%) skewX(-25deg); }
                }
                .animate-shimmer-sweep {
                    animation: shimmer-sweep 3.5s infinite linear;
                }
                .animate-pulse-slow {
                    animation: pulse 12s infinite ease-in-out;
                }
                .perspective-[2500px] {
                    perspective: 2500px;
                }
                .ease-out-expo {
                    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.08);
                    border-radius: 30px;
                }
                .drop-shadow-glow {
                    filter: drop-shadow(0 0 15px rgba(251,191,36,0.6));
                }
                @keyframes victory-pulse {
                    0% { opacity: 0.1; }
                    50% { opacity: 1; }
                    100% { opacity: 0.1; }
                }
                .animate-victory-pulse {
                    animation: victory-pulse 0.7s infinite;
                }
                @keyframes victory-shimmer {
                    0% { transform: translateX(-200%) skewX(-30deg); }
                    100% { transform: translateX(300%) skewX(-30deg); }
                }
                .animate-victory-shimmer {
                    animation: victory-shimmer 1.8s infinite linear;
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(115vh) rotate(1080deg); opacity: 0; }
                }
                .animate-confetti-fall {
                    animation: confetti-fall 4.5s ease-in forwards;
                }
                @keyframes winner-pop {
                    0% { transform: translate(-50%, 30px) scale(0.6); opacity: 0; }
                    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
                }
                .animate-winner-pop {
                    animation: winner-pop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @media (max-width: 768px) {
                    .animate-in {
                        animation-duration: 900ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProjectorView;
