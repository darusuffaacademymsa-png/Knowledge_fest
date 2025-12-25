import { Activity, ArrowRight, Award, Calendar, ClipboardList, Clock, Crown, ExternalLink, Flag, Monitor, Sparkles, TrendingUp, Trophy, Users, CheckCircle2, Circle } from 'lucide-react';
import React, { useMemo } from 'react';
import Card from '../components/Card';
import { TABS } from '../constants';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, ResultStatus, UserRole } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, onClick?: () => void, delay?: number }> = ({ icon: Icon, title, value, onClick, delay = 0 }) => (
  <div 
    onClick={onClick} 
    className={`relative group p-6 rounded-2xl bg-white/40 dark:bg-white/5 border border-amazio-primary/5 dark:border-white/5 hover:border-amazio-secondary/30 dark:hover:border-amazio-accent/30 backdrop-blur-md transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-1 hover:shadow-glass-light-hover dark:hover:shadow-neon cursor-pointer overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-amazio-secondary/10 dark:bg-amazio-secondary/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-amazio-secondary/20 dark:group-hover:bg-amazio-accent/20 transition-colors duration-500"></div>
    <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
             <div className="p-3 rounded-xl bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent border border-amazio-primary/5 dark:border-white/5 text-amazio-secondary dark:text-amazio-accent group-hover:text-white group-hover:bg-amazio-secondary dark:group-hover:bg-amazio-secondary/80 transition-all duration-300 shadow-sm dark:shadow-lg">
                <Icon className="h-6 w-6" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-amazio-secondary dark:text-amazio-accent">
                <Activity size={16} />
            </div>
        </div>
        <div>
            <p className="text-3xl font-black text-amazio-primary dark:text-white tracking-tight mb-1 group-hover:text-amazio-primary dark:group-hover:text-amazio-cream transition-colors">{value}</p>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-600 dark:group-hover:text-zinc-300">{title}</p>
        </div>
    </div>
  </div>
);

const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { state, currentUser } = useFirebase();

  const hasJudgeAccess = useMemo(() => {
      if (!state || !currentUser || currentUser.role !== UserRole.JUDGE || !currentUser.judgeId) return () => true;
      const myItemIds = new Set(state.judgeAssignments.filter(a => a.judgeIds.includes(currentUser.judgeId!)).map(a => a.itemId));
      return (itemId: string) => myItemIds.has(itemId);
  }, [state?.judgeAssignments, currentUser]);

  const teamPoints = useMemo(() => {
    if (!state) return [];
    const { teams, results, items, participants, gradePoints } = state;
    const tPoints: { [key: string]: number } = {};
    teams.forEach(t => tPoints[t.id] = 0);
    results.forEach(result => {
        if (result.status !== ResultStatus.DECLARED) return;
        const item = items.find(i => i.id === result.itemId);
        if (!item) return;
        result.winners.forEach(winner => {
            const participant = participants.find(p => p.id === winner.participantId);
            if (!participant) return;
            let pointsWon = 0;
            if (winner.position === 1) pointsWon += item.points.first;
            else if (winner.position === 2) pointsWon += item.points.second;
            else if (winner.position === 3) pointsWon += item.points.third;
            if (winner.gradeId) {
                const gradeConfig = item.type === ItemType.SINGLE ? gradePoints.single : gradePoints.group;
                const grade = gradeConfig.find(g => g.id === winner.gradeId);
                if (grade) {
                    if (item.gradePointsOverride && item.gradePointsOverride[grade.id] !== undefined) pointsWon += item.gradePointsOverride[grade.id];
                    else pointsWon += grade.points;
                }
            }
            if (tPoints[participant.teamId] !== undefined) tPoints[participant.teamId] += pointsWon;
        });
    });
    return teams.map(team => ({ ...team, points: tPoints[team.id] || 0 })).sort((a, b) => b.points - a.points);
  }, [state]);
  
  const upcomingEvents = useMemo(() => {
    if (!state) return [];
    return [...state.schedule].filter(s => hasJudgeAccess(s.itemId)).slice(0, 5);
  }, [state?.schedule, hasJudgeAccess]);
  
  const recentResult = useMemo(() => {
    if (!state) return null;
    const validDeclaredResults = state.results.filter(r => r.status === ResultStatus.DECLARED && hasJudgeAccess(r.itemId));
    const lastDeclared = validDeclaredResults.pop(); 
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

  const stats = {
    participants: state?.participants.length || 0,
    teams: state?.teams.length || 0,
    items: state?.items.length || 0,
    resultsDeclared: state?.results.filter(r => r.status === ResultStatus.DECLARED).length || 0
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24">
       <div className="relative w-full rounded-[2.5rem] bg-[#E8E4D5] dark:bg-[#1A1F1B] border border-amazio-primary/10 shadow-2xl overflow-hidden group transition-all duration-700">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-8 gap-6">
              <div className="lg:col-span-7 flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2.5 px-3 py-1 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-full border border-amazio-primary/10 dark:border-white/10 shadow-sm">
                     <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                     <span className="text-[9px] font-black tracking-[0.2em] uppercase text-amazio-primary/80 dark:text-zinc-400">Registry Online</span>
                  </div>
                  <div className="py-1">
                      {state?.settings.branding?.typographyUrl ? (
                          <img src={state.settings.branding.typographyUrl} alt={state.settings.heading} className="h-auto max-h-24 sm:max-h-28 w-auto object-contain filter drop-shadow-xl" />
                      ) : (
                          <h1 className="text-4xl sm:text-5xl font-black font-serif tracking-tighter leading-tight text-amazio-primary dark:text-white uppercase">{state?.settings.heading || 'AMAZIO'}</h1>
                      )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-500 font-bold italic tracking-wide max-w-lg">"{state?.settings.description || "Knowledge Fest Terminal"}"</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                     <button onClick={() => setActiveTab(TABS.SCHEDULE)} className="flex items-center gap-2 px-6 py-3 bg-amazio-primary text-white font-black rounded-xl shadow-xl hover:scale-[1.05] transition-all text-xs uppercase tracking-widest">Live Schedule <ArrowRight size={16}/></button>
                     <button onClick={() => setActiveTab(TABS.PROJECTOR)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:scale-[1.05] transition-all text-xs uppercase tracking-widest">Projector <Monitor size={16}/></button>
                  </div>
              </div>
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <div className="relative group cursor-default">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-amazio-primary/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center transition-all group-hover:scale-105">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-1">Items</p>
                          <p className="text-5xl font-black text-amazio-primary dark:text-white leading-none tracking-tighter">{stats.items}</p>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amazio-secondary text-white rounded-full flex items-center justify-center shadow-lg"><Activity size={16} /></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Users} title="Census" value={stats.participants} onClick={() => setActiveTab(TABS.DATA_ENTRY)} />
          <StatCard icon={Flag} title="Units" value={stats.teams} onClick={() => setActiveTab(TABS.TEAMS_CATEGORIES)} delay={100} />
          <StatCard icon={Award} title="Events" value={stats.items} onClick={() => setActiveTab(TABS.ITEMS)} delay={200} />
          <StatCard icon={Trophy} title="Declared" value={stats.resultsDeclared} onClick={() => setActiveTab(TABS.SCORING_RESULTS)} delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <Card title="Unit Standings">
                <div className="space-y-1">
                    {teamPoints.map((team, index) => {
                        const progress = teamPoints[0].points > 0 ? (team.points / teamPoints[0].points) * 100 : 0;
                        return (
                            <div key={team.id} className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{index + 1}</div>
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{team.name}</span>
                                        {index === 0 && team.points > 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                                    </div>
                                    <span className="font-black text-xl text-amazio-primary dark:text-white">{team.points}</span>
                                </div>
                                <div className="w-full bg-black/5 dark:bg-black/40 rounded-full h-1"><div className="h-full rounded-full bg-amazio-secondary" style={{ width: `${progress}%` }}></div></div>
                            </div>
                        )
                    })}
                </div>
              </Card>
          </div>
          <div className="lg:col-span-1 space-y-8">
               <Card title="Recent Verdict">
                {recentResult ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <span className="px-3 py-1 bg-amazio-secondary/10 text-amazio-secondary dark:text-amazio-neon rounded-full text-[10px] font-black uppercase tracking-widest">{recentResult.categoryName}</span>
                      <h3 className="text-2xl font-black text-amazio-primary dark:text-white mt-2 uppercase tracking-tighter">{recentResult.itemName}</h3>
                    </div>
                    {recentResult.winners.map((winner, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-black/5 transition-all">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${winner.position === 1 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-100 text-zinc-500'}`}>{winner.position}</div>
                            <div className="min-w-0 flex-grow">
                                <p className="font-black text-sm text-zinc-800 dark:text-zinc-200 truncate uppercase">{winner.participantName}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{winner.teamName}</p>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setActiveTab(TABS.SCORING_RESULTS)} className="w-full py-4 mt-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all">Full Results Board</button>
                  </div>
                ) : <div className="text-center py-12 opacity-30 italic text-xs uppercase font-bold">Awaiting Declaration</div>}
              </Card>
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;