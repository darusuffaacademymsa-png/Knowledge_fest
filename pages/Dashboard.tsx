import { Activity, ArrowRight, Award, Calendar, ClipboardList, Clock, Crown, ExternalLink, Flag, Monitor, Sparkles, TrendingUp, Trophy, Users, CheckCircle2, Circle, ListFilter, BookOpen, MapPin } from 'lucide-react';
import React, { useMemo } from 'react';
import Card from '../components/Card';
import { TABS } from '../constants';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, ResultStatus, UserRole } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  theme: string;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, colorClass: string, onClick?: () => void, delay?: number }> = ({ icon: Icon, title, value, colorClass, onClick, delay = 0 }) => (
  <div 
    onClick={onClick} 
    className={`relative group p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-white/5 border border-amazio-primary/10 dark:border-white/5 hover:border-amazio-secondary/30 dark:hover:border-amazio-accent/30 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-[80px] pointer-events-none opacity-20 dark:opacity-40 transition-colors duration-500 ${colorClass}`}></div>
    <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2 sm:mb-4">
             <div className={`p-2 sm:p-3 rounded-lg sm:rounded-2xl bg-zinc-50 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/5 group-hover:text-white transition-all duration-300 shadow-sm ${colorClass.replace('bg-', 'text-').replace('-500', '-600')} group-hover:${colorClass}`}>
                <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400">
                <ArrowRight size={12} />
            </div>
        </div>
        <div>
            <p className="text-2xl sm:text-4xl font-black text-amazio-primary dark:text-white tracking-tighter mb-0.5 sm:mb-1 transition-colors">{value}</p>
            <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-700 dark:group-hover:text-zinc-300">Total {title}</p>
        </div>
    </div>
  </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, theme }) => {
  const { state, currentUser } = useFirebase();

  const logoUrl = useMemo(() => {
    if (!state?.settings.branding) return null;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const { typographyUrl, typographyUrlLight, typographyUrlDark } = state.settings.branding;
    if (isDark) return typographyUrlDark || typographyUrl;
    return typographyUrlLight || typographyUrl;
  }, [state?.settings.branding, theme]);

  const hasJudgeAccess = useMemo(() => {
      if (!state || !currentUser || currentUser.role !== UserRole.JUDGE || !currentUser.judgeId) return () => true;
      const myItemIds = new Set(state.judgeAssignments.filter(a => a.judgeIds.includes(currentUser.judgeId!)).map(a => a.itemId));
      return (itemId: string) => myItemIds.has(itemId);
  }, [state?.judgeAssignments, currentUser]);

  const upcomingEvents = useMemo(() => {
    if (!state) return [];
    return [...state.schedule].filter(s => hasJudgeAccess(s.itemId)).slice(0, 6);
  }, [state?.schedule, hasJudgeAccess]);
  
  const recentResult = useMemo(() => {
    if (!state) return null;
    const validDeclaredResults = state.results.filter(r => r.status === ResultStatus.DECLARED && hasJudgeAccess(r.itemId));
    const lastDeclared = validDeclaredResults[validDeclaredResults.length - 1]; 
    if (!lastDeclared) return null;
    const item = state.items.find(i => i.id === lastDeclared.itemId);
    const category = state.categories.find(c => c.id === lastDeclared.categoryId);
    if (!item || !category) return null;
    const winners = lastDeclared.winners.sort((a, b) => (a.position || 99) - (b.position || 99)).slice(0, 5).map(winner => {
        const p = state.participants.find(part => part.id === winner.participantId);
        const t = p ? state.teams.find(tm => tm.id === p.teamId) : null;
        return { ...winner, participantName: p?.name || 'N/A', teamName: t?.name || 'N/A' };
    });
    return { itemName: item.name, categoryName: category.name, winners };
  }, [state, hasJudgeAccess]);

  const stats = useMemo(() => {
    if (!state) return { participants: 0, teams: 0, items: 0, resultsDeclared: 0 };
    const activeItemIds = new Set(state.items.map(i => i.id));
    return {
      participants: state.participants.length,
      teams: state.teams.length,
      items: state.items.filter(i => hasJudgeAccess(i.id)).length,
      resultsDeclared: state.results.filter(r => 
        r.status === ResultStatus.DECLARED && 
        activeItemIds.has(r.itemId) && 
        hasJudgeAccess(r.itemId)
      ).length
    };
  }, [state, hasJudgeAccess]);

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto">
       <div className="relative w-full rounded-[1.5rem] sm:rounded-[3.5rem] bg-[#F1F5E9] dark:bg-[#1A1F1B] border border-amazio-primary/10 shadow-2xl overflow-hidden group transition-all duration-700">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center p-4 sm:p-12 gap-6 sm:gap-8">
              <div className="lg:col-span-7 flex flex-col items-start gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-full border border-amazio-primary/10 dark:border-white/10 shadow-sm">
                     <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-50"></span></span>
                     <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-amazio-primary/80 dark:text-zinc-400">Terminal Operational</span>
                  </div>
                  <div className="py-1">
                      {logoUrl ? (
                          <img src={logoUrl} alt={state.settings.heading} className="h-auto max-h-16 sm:max-h-32 w-auto object-contain filter drop-shadow-xl" />
                      ) : (
                          <h1 className="text-3xl sm:text-7xl font-black font-serif tracking-tighter leading-tight text-amazio-primary dark:text-white uppercase">{state?.settings.heading || 'AMAZIO 2026'}</h1>
                      )}
                  </div>
                  <p className="text-sm sm:text-lg text-amazio-moss-green dark:text-zinc-500 font-bold italic tracking-wide max-lg">"{state?.settings.description || "The official management terminal."}"</p>
                  <div className="mt-2 sm:mt-6 flex flex-wrap gap-2 sm:gap-4">
                     <button onClick={() => setActiveTab(TABS.SCHEDULE)} className="flex items-center gap-2 px-4 py-2.5 sm:px-8 sm:py-4 bg-amazio-primary text-white font-black rounded-lg sm:rounded-2xl shadow-xl hover:scale-[1.05] transition-all text-[8px] sm:text-xs uppercase tracking-widest">Global Timeline <ArrowRight size={12}/></button>
                     <button onClick={() => setActiveTab(TABS.PROJECTOR)} className="flex items-center gap-2 px-4 py-2.5 sm:px-8 sm:py-4 bg-emerald-600 text-white font-black rounded-lg sm:rounded-2xl shadow-xl hover:scale-[1.05] transition-all text-[8px] sm:text-xs uppercase tracking-widest">Projector Mode <Monitor size={12}/></button>
                  </div>
              </div>
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <div className="relative group cursor-default">
                      <div className="relative w-32 h-32 sm:w-56 sm:h-56 rounded-[1.5rem] sm:rounded-[3.5rem] border border-amazio-primary/10 bg-white dark:bg-black/20 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center transition-all group-hover:scale-105">
                          <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-1">Disciplines</p>
                          <p className="text-5xl sm:text-8xl font-black text-amazio-primary dark:text-white leading-none tracking-tighter tabular-nums">{stats.items}</p>
                          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500 text-white rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg"><Activity size={16} sm:size={20} strokeWidth={2.5} /></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard icon={Users} title="Participants" value={stats.participants} colorClass="bg-emerald-500" onClick={() => setActiveTab(TABS.DATA_ENTRY)} />
          <StatCard icon={Flag} title="Units" value={stats.teams} colorClass="bg-amazio-primary" onClick={() => setActiveTab(TABS.TEAMS_CATEGORIES)} delay={100} />
          <StatCard icon={BookOpen} title="Events" value={stats.items} colorClass="bg-amber-500" onClick={() => setActiveTab(TABS.ITEMS)} delay={200} />
          <StatCard icon={Trophy} title="Declared" value={stats.resultsDeclared} colorClass="bg-rose-500" onClick={() => setActiveTab(TABS.SCORING_RESULTS)} delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
          <div className="lg:col-span-8">
              <Card title="Program Timeline" action={<button onClick={() => setActiveTab(TABS.SCHEDULE)} className="text-[8px] sm:text-[10px] font-black text-amazio-moss-green dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">Full Schedule <ArrowRight size={12}/></button>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => (
                        <div key={ev.id} className="flex items-start gap-3 sm:gap-5 p-4 sm:p-6 bg-[#F9FAF6] dark:bg-black/20 rounded-[1.2rem] sm:rounded-[2.5rem] border border-zinc-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all hover:bg-white dark:hover:bg-black/40">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] bg-amazio-primary dark:bg-indigo-900/30 flex items-center justify-center text-white sm:text-white shrink-0 shadow-lg transition-transform group-hover:scale-105">
                                <Clock size={20} sm:size={28} strokeWidth={2.5} />
                            </div>
                            <div className="min-w-0 flex-grow">
                                <h4 className="font-black text-amazio-moss-green dark:text-indigo-400 text-[10px] sm:text-sm uppercase tracking-widest mb-0.5 sm:mb-1 group-hover:translate-x-1 transition-transform">
                                    {ev.time}
                                </h4>
                                <div className="font-black text-amazio-primary dark:text-white text-sm sm:text-lg uppercase tracking-tight truncate leading-tight mb-2 sm:mb-3">
                                    {state.items.find(i => i.id === ev.itemId)?.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-[7px] sm:text-[9px] font-black text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 uppercase tracking-widest">
                                        {state.categories.find(c => c.id === ev.categoryId)?.name}
                                    </span>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/20 text-[7px] sm:text-[9px] font-black text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 uppercase tracking-widest">
                                        <MapPin size={8} sm:size={10} strokeWidth={3} /> {ev.stage}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : <div className="col-span-full py-10 sm:py-16 text-center opacity-30 italic text-[10px] sm:text-xs uppercase font-bold tracking-[0.2em] flex flex-col items-center gap-2 sm:gap-4"><Calendar size={32} sm:size={48} strokeWidth={1}/> Awaiting scheduled events</div>}
                </div>
              </Card>
          </div>
          <div className="lg:col-span-4 space-y-4 sm:space-y-8">
               <Card title="Latest Verdict">
                {recentResult ? (
                  <div className="space-y-3 sm:space-y-5">
                    <div className="text-center mb-2 sm:mb-6">
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em]">{recentResult.categoryName}</span>
                      <h3 className="text-xl sm:text-3xl font-black text-amazio-primary dark:text-white mt-2 sm:mt-4 uppercase tracking-tighter leading-none">{recentResult.itemName}</h3>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                        {recentResult.winners.map((winner, idx) => (
                            <div key={idx} className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-3xl bg-[#FBFBFA] dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all group/winner">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-lg ${winner.position === 1 ? 'bg-amber-400 text-amber-950 shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-100 dark:border-zinc-700 shadow-sm'}`}>{winner.position}</div>
                                <div className="min-w-0 flex-grow">
                                    <p className="font-black text-[11px] sm:text-sm text-amazio-primary dark:text-zinc-100 truncate uppercase group-hover/winner:text-indigo-500 transition-colors">{winner.participantName}</p>
                                    <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{winner.teamName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setActiveTab(TABS.SCORING_RESULTS)} className="w-full py-3.5 sm:py-5 mt-2 sm:mt-6 bg-amazio-primary text-white rounded-lg sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 shadow-xl shadow-amazio-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"><Trophy size={12}/> All Declared Results</button>
                  </div>
                ) : <div className="text-center py-10 sm:py-16 opacity-30 italic text-[10px] sm:text-xs uppercase font-bold tracking-[0.2em] flex flex-col items-center gap-2 sm:gap-4"><Award size={48} sm:size={64} strokeWidth={1}/> No results yet</div>}
              </Card>
          </div>
      </div>
      <div className="text-center pt-4 sm:pt-8">
          <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-[0.4em]">© 2026 AMAZIO • ART FEST TERMINAL v6.5</p>
      </div>
    </div>
  );
};

export default DashboardPage;