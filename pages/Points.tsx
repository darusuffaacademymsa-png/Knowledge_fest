import { ArrowUpRight, Award, BarChart2, CheckCircle2, ChevronDown, ChevronRight, Filter, GraduationCap, Info, Layers, Layout, ListFilter, Loader2, Mic, PenTool, PieChart, Search, SearchX, Trophy, User, Users, Zap, Check, TrendingUp } from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, PerformanceType, ResultStatus } from '../types';

// --- Helper Components ---

const StatBox = ({ label, value, icon: Icon, colorClass }: { label: string, value: number | string, icon: any, colorClass: string }) => (
    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-white dark:bg-zinc-900/50 flex items-center gap-3 sm:gap-4 transition-all hover:shadow-md ${colorClass}`}>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-black/20 shadow-sm shrink-0">
            <Icon size={16} sm:size={20} />
        </div>
        <div>
            <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider opacity-60">{label}</div>
            <div className="text-xl sm:text-2xl font-black tabular-nums leading-none">{value}</div>
        </div>
    </div>
);

const PointChip = ({ type, value, label }: { type: 'rank' | 'grade' | 'total', value: number, label?: string }) => {
    if (value === 0 && type !== 'total') return null;
    const styles = {
        rank: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        grade: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        total: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    };
    const Icon = type === 'rank' ? Trophy : type === 'grade' ? GraduationCap : Layers;
    return (
        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[7px] sm:text-[10px] font-bold ${styles[type]}`} title={label}>
            <Icon size={8} sm:size={10} />
            <span>{value}</span>
        </div>
    );
};

const getGradeColor = (name: string) => {
    const n = name.toLowerCase().trim();
    if (n.startsWith('a')) return 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    if (n.startsWith('b')) return 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    return 'border-zinc-200 text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
};

const PointsPage: React.FC = () => {
    const { state, globalSearchTerm } = useFirebase();
    const [viewFilter, setViewFilter] = useState<'BOTH' | 'RANK' | 'GRADE'>('BOTH');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [topperTypeFilter, topperTypeFilterSet] = useState<'ALL' | PerformanceType.ON_STAGE | PerformanceType.OFF_STAGE>('ALL');
    const [topperCategoryFilter, topperCategoryFilterSet] = useState<string>('ALL');
    const [insightsMode, setInsightsMode] = useState<'ITEM' | 'PARTICIPANT'>('ITEM');
    const [itemInsightsId, setItemInsightsId] = useState('');
    const [participantInsightsId, setParticipantInsightsId] = useState('');

    const { teams, categories, participants, results, items, gradePoints } = state || {};

    const analytics = useMemo(() => {
        if (!teams || !results || !items || !participants || !gradePoints || !categories) return null;
        const teamData: { [teamId: string]: any } = {};
        teams.forEach(t => { teamData[t.id] = { teamId: t.id, teamName: t.name, totalPoints: 0, totalRankPoints: 0, totalGradePoints: 0, rankCount: 0, participantCount: 0, categories: {} }; });
        const declaredItemsSet = new Set<string>();
        let totalEntryCombinations = 0;
        const participantRawEntries: any[] = [];
        results.forEach(result => {
            if (result.status !== ResultStatus.DECLARED) return;
            const item = items.find(i => i.id === result.itemId);
            const category = categories.find(c => c.id === result.categoryId);
            if (!item || !category) return;
            declaredItemsSet.add(item.id);
            result.winners.forEach(winner => {
                const p = participants.find(part => part.id === winner.participantId);
                if (!p) return;
                totalEntryCombinations++;
                const team = teamData[p.teamId];
                if (!team) return;
                let rankPts = 0;
                if (winner.position === 1) rankPts = item.points.first;
                else if (winner.position === 2) rankPts = item.points.second;
                else if (winner.position === 3) rankPts = item.points.third;
                let gradePts = 0; let gradeName = '-';
                if (winner.gradeId) {
                    const gradeConfig = item.type === ItemType.SINGLE ? (gradePoints.single || []) : (gradePoints.group || []);
                    const grade = gradeConfig.find(g => g.id === winner.gradeId);
                    if (grade) { gradeName = grade.name; gradePts = (item.gradePointsOverride && item.gradePointsOverride[grade.id] !== undefined) ? item.gradePointsOverride[grade.id] : (grade.points || 0); }
                }
                if (!team.categories[category.id]) team.categories[category.id] = { categoryId: category.id, categoryName: category.name, rankTotal: 0, gradeTotal: 0, total: 0, items: {} };
                const catData = team.categories[category.id];
                if (!catData.items[item.id]) catData.items[item.id] = { itemId: item.id, itemName: item.name, itemType: item.type, performanceType: item.performanceType, categoryId: category.id, categoryName: category.name, rankTotal: 0, gradeTotal: 0, total: 0, contributors: [] };
                const itemData = catData.items[item.id];
                const entryTotal = rankPts + gradePts;
                itemData.rankTotal += rankPts; itemData.gradeTotal += gradePts; itemData.total += entryTotal;
                catData.rankTotal += rankPts; catData.gradeTotal += gradePts; catData.total += entryTotal;
                team.totalRankPoints += rankPts; team.totalGradePoints += gradePts; team.totalPoints += entryTotal;
                if (rankPts > 0) team.rankCount++; team.participantCount++;
                itemData.contributors.push({ participantId: p.id, participantName: item.type === ItemType.GROUP ? `${p.name} & Party` : p.name, chestNumber: p.chestNumber, place: p.place, teamId: p.teamId, rank: winner.position, rankPoints: rankPts, gradeName: gradeName, gradePoints: gradePts, total: entryTotal });
                participantRawEntries.push({ participant: p, item: item, category: category, rank: winner.position, rankPoints: rankPts, gradeName: gradeName, gradePoints: gradePts, total: entryTotal });
            });
        });
        return { teamData, participantRawEntries, stats: { declaredCount: declaredItemsSet.size, contributorsCount: new Set(participantRawEntries.map(e => e.participant.id)).size, totalEntries: totalEntryCombinations } };
    }, [teams, categories, participants, results, items, gradePoints]);

    const sortedTeams = useMemo(() => {
        if (!analytics) return [];
        return Object.values(analytics.teamData).sort((a: any, b: any) => {
            const valA = viewFilter === 'RANK' ? a.totalRankPoints : viewFilter === 'GRADE' ? a.totalGradePoints : a.totalPoints;
            const valB = viewFilter === 'RANK' ? b.totalRankPoints : viewFilter === 'GRADE' ? b.totalGradePoints : b.totalPoints;
            return valB - valA;
        });
    }, [analytics, viewFilter]);

    const topperInsights = useMemo(() => {
        if (!analytics) return [];
        const tally: Record<string, any> = {};
        analytics.participantRawEntries.forEach(entry => {
            if ((topperTypeFilter === 'ALL' || entry.item.performanceType === topperTypeFilter) && (topperCategoryFilter === 'ALL' || entry.category.id === topperCategoryFilter) && entry.item.type === ItemType.SINGLE) {
                const pid = entry.participant.id;
                if (!tally[pid]) tally[pid] = { participantId: pid, name: entry.participant.name, chestNumber: entry.participant.chestNumber, teamName: teams?.find(t => t.id === entry.participant.teamId)?.name || 'N/A', categoryName: categories?.find(c => c.id === entry.participant.categoryId)?.name || 'N/A', points: 0 };
                tally[pid].points += entry.total;
            }
        });
        return Object.values(tally).sort((a: any, b: any) => b.points - a.points).slice(0, 3);
    }, [analytics, topperTypeFilter, topperCategoryFilter, teams, categories]);

    if (!state || !analytics) return <div className="p-12 text-center text-zinc-500">Calculating...</div>;

    const topTeamScore = sortedTeams.length > 0 ? (viewFilter === 'RANK' ? (sortedTeams[0] as any).totalRankPoints : viewFilter === 'GRADE' ? (sortedTeams[0] as any).totalGradePoints : (sortedTeams[0] as any).totalPoints) : 0;

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in duration-500 pb-24">
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black font-serif text-amazio-primary dark:text-white tracking-tight uppercase">Leaderboard</h2>
                </div>
                <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 shadow-inner">
                    {[ { id: 'BOTH', label: 'Overall', icon: Layers }, { id: 'RANK', label: 'Prize', icon: Trophy }, { id: 'GRADE', label: 'Grade', icon: GraduationCap } ].map(f => (
                        <button key={f.id} onClick={() => setViewFilter(f.id as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${viewFilter === f.id ? 'bg-white text-amazio-primary shadow-sm' : 'text-zinc-500'}`}>{f.label}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <StatBox label="Results" value={analytics.stats.declaredCount} icon={CheckCircle2} colorClass="text-emerald-700 border-emerald-100 bg-emerald-50/50" />
                <StatBox label="Contributing" value={analytics.stats.contributorsCount} icon={Users} colorClass="text-indigo-700 border-indigo-100 bg-indigo-50/50" />
                <div className="hidden md:block">
                  <StatBox label="Scoring Entries" value={analytics.stats.totalEntries} icon={PieChart} colorClass="text-amber-700 border-amber-100 bg-amber-50/50" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-8 items-start">
                <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                    <Card title="Team Standings">
                        <div className="space-y-2.5 sm:space-y-4">
                            {sortedTeams.map((team: any, idx) => {
                                const isExpanded = expandedTeams.has(team.teamId);
                                const currentPoints = viewFilter === 'RANK' ? team.totalRankPoints : viewFilter === 'GRADE' ? team.totalGradePoints : team.totalPoints;
                                const progress = topTeamScore > 0 ? (currentPoints / topTeamScore) * 100 : 0;
                                return (
                                    <div key={team.teamId} className="group flex flex-col gap-1">
                                        <div onClick={() => setExpandedTeams(prev => { const n = new Set(prev); if(n.has(team.teamId)) n.delete(team.teamId); else n.add(team.teamId); return n; })} className={`relative overflow-hidden cursor-pointer p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all ${isExpanded ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white dark:bg-zinc-900 border-zinc-100 shadow-sm'}`}>
                                            <div className="flex items-center justify-between gap-3 relative z-10">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl ${idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-zinc-300 text-zinc-800' : 'bg-zinc-100 text-zinc-400'}`}>{idx + 1}</div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm sm:text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{team.teamName}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-zinc-400 uppercase"><Trophy size={8} /> {team.rankCount}</div>
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-zinc-400 uppercase"><Users size={8} /> {team.participantCount}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-6">
                                                    <div className="flex gap-1">
                                                        {viewFilter !== 'GRADE' && <PointChip type="rank" value={team.totalRankPoints} />}
                                                        {viewFilter !== 'RANK' && <PointChip type="grade" value={team.totalGradePoints} />}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl sm:text-3xl font-black text-indigo-600 leading-none">{currentPoints}</div>
                                                    </div>
                                                    <ChevronRight size={16} className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    <Card title="Toppers">
                        <div className="space-y-3 sm:space-y-4">
                            {topperInsights.map((topper: any, idx: number) => (
                                <div key={topper.participantId} className={`relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all ${idx === 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white dark:bg-zinc-900 border-zinc-100 shadow-sm'}`}>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-lg ${idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-100 text-zinc-500'}`}>{idx + 1}</div>
                                        <div className="min-w-0 flex-grow">
                                            <h4 className="text-[11px] sm:text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase truncate leading-tight">{topper.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[8px] font-bold text-zinc-400 uppercase truncate">{topper.teamName}</span></div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-base sm:text-xl font-black text-indigo-600 leading-none">{topper.points}</div>
                                            <div className="text-[7px] font-bold text-zinc-400 uppercase">Pts</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PointsPage;