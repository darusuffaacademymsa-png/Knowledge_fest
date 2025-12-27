import { ArrowUpRight, Award, BarChart2, CheckCircle2, ChevronDown, ChevronRight, Filter, GraduationCap, Info, Layers, Layout, ListFilter, Loader2, Mic, PenTool, PieChart, Search, SearchX, Trophy, User, Users, Zap, Check, TrendingUp } from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import { useFirebase } from '../hooks/useFirebase';
import { ItemType, PerformanceType, ResultStatus } from '../types';

// --- Types ---

interface ContributorDetail {
    participantId: string;
    participantName: string;
    chestNumber: string;
    place?: string;
    teamId: string;
    rank: number;
    rankPoints: number;
    gradeName: string;
    gradePoints: number;
    total: number;
}

interface ItemContribution {
    itemId: string;
    itemName: string;
    itemType: ItemType;
    performanceType: PerformanceType;
    categoryId: string;
    categoryName: string;
    rankTotal: number;
    gradeTotal: number;
    total: number;
    contributors: ContributorDetail[];
}

interface CategoryBreakdown {
    categoryId: string;
    categoryName: string;
    rankTotal: number;
    gradeTotal: number;
    total: number;
    items: { [itemId: string]: ItemContribution };
}

interface TeamAnalytics {
    teamId: string;
    teamName: string;
    totalPoints: number;
    totalRankPoints: number;
    totalGradePoints: number;
    rankCount: number;
    participantCount: number;
    categories: { [catId: string]: CategoryBreakdown };
}

interface TopperData {
    participantId: string;
    name: string;
    chestNumber: string;
    place?: string;
    teamName: string;
    categoryName: string;
    points: number;
    breakdown: {
        itemName: string;
        rank: number;
        rankPoints: number;
        grade: string;
        gradePoints: number;
        total: number;
    }[];
}

// --- Helper Components ---

const StatBox = ({ label, value, icon: Icon, colorClass }: { label: string, value: number | string, icon: any, colorClass: string }) => (
    <div className={`p-4 rounded-2xl border bg-white dark:bg-zinc-900/50 flex items-center gap-4 transition-all hover:shadow-md ${colorClass}`}>
        <div className="p-3 rounded-xl bg-white dark:bg-black/20 shadow-sm">
            <Icon size={20} />
        </div>
        <div>
            <div className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</div>
            <div className="text-2xl font-black tabular-nums">{value}</div>
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
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${styles[type]}`} title={label}>
            <Icon size={10} />
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

const SearchableDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    icon: Icon 
}: { 
    options: { id: string; label: string; subLabel?: string; group?: string }[]; 
    value: string; 
    onChange: (val: string) => void; 
    placeholder: string;
    icon?: any;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch(''); 
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        if (!search) return options;
        const lower = search.toLowerCase();
        return options.filter(o => 
            o.label.toLowerCase().includes(lower) || 
            o.subLabel?.toLowerCase().includes(lower) ||
            o.group?.toLowerCase().includes(lower)
        );
    }, [options, search]);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div 
                onClick={() => { setIsOpen(true); }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-text shadow-sm group ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500/50 bg-white dark:bg-black' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30'}`}
            >
                <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-white/5 text-zinc-400 group-hover:text-indigo-500'}`}>
                    {Icon ? <Icon size={16} /> : <Search size={16} />}
                </div>
                <input 
                    type="text"
                    className="w-full bg-transparent outline-none text-sm font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                    placeholder={selectedOption ? selectedOption.label : placeholder}
                    value={isOpen ? search : (selectedOption ? selectedOption.label : '')}
                    onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filtered.length > 0 ? (
                        filtered.map(opt => (
                            <div 
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }}
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${opt.id === value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'}`}
                            >
                                <div>
                                    <div className="text-xs font-bold">{opt.label}</div>
                                    {(opt.subLabel || opt.group) && (
                                        <div className="text-[10px] text-zinc-400 font-medium mt-0.5 flex gap-1">
                                            {opt.group && <span className="uppercase tracking-wider opacity-75 bg-zinc-100 dark:bg-white/10 px-1 rounded">{opt.group}</span>}
                                            {opt.subLabel}
                                        </div>
                                    )}
                                </div>
                                {opt.id === value && <Check size={14} strokeWidth={3} />}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center flex flex-col items-center opacity-50">
                            <SearchX size={20} className="mb-2" />
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wide">No matches found</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Page Component ---

const PointsPage: React.FC = () => {
    const { state, globalSearchTerm } = useFirebase();
    
    // UI State
    const [viewFilter, setViewFilter] = useState<'BOTH' | 'RANK' | 'GRADE'>('BOTH');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    
    // Split Topper Filters
    const [topperTypeFilter, topperTypeFilterSet] = useState<'ALL' | PerformanceType.ON_STAGE | PerformanceType.OFF_STAGE>('ALL');
    const [topperCategoryFilter, topperCategoryFilterSet] = useState<string>('ALL');

    const [insightsMode, setInsightsMode] = useState<'ITEM' | 'PARTICIPANT'>('ITEM');
    const [itemInsightsId, setItemInsightsId] = useState('');
    const [participantInsightsId, setParticipantInsightsId] = useState('');

    const { teams, categories, participants, results, items, gradePoints } = state || {};

    // --- Core Analytics Engine ---
    const analytics = useMemo(() => {
        if (!teams || !results || !items || !participants || !gradePoints || !categories) return null;

        const teamData: { [teamId: string]: TeamAnalytics } = {};
        teams.forEach(t => {
            teamData[t.id] = {
                teamId: t.id, teamName: t.name, totalPoints: 0, totalRankPoints: 0, totalGradePoints: 0,
                rankCount: 0, participantCount: 0, categories: {}
            };
        });

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

                let gradePts = 0;
                let gradeName = '-';
                if (winner.gradeId) {
                    const gradeConfig = item.type === ItemType.SINGLE ? gradePoints.single : gradePoints.group;
                    const grade = gradeConfig.find(g => g.id === winner.gradeId);
                    if (grade) {
                        gradeName = grade.name;
                        gradePts = (item.gradePointsOverride && item.gradePointsOverride[grade.id] !== undefined)
                            ? item.gradePointsOverride[grade.id]
                            : grade.points;
                    }
                }

                if (!team.categories[category.id]) {
                    team.categories[category.id] = { categoryId: category.id, categoryName: category.name, rankTotal: 0, gradeTotal: 0, total: 0, items: {} };
                }
                const catData = team.categories[category.id];

                if (!catData.items[item.id]) {
                    catData.items[item.id] = {
                        itemId: item.id, itemName: item.name, itemType: item.type, performanceType: item.performanceType,
                        categoryId: category.id, categoryName: category.name, rankTotal: 0, gradeTotal: 0, total: 0, contributors: []
                    };
                }
                const itemData = catData.items[item.id];

                const entryTotal = rankPts + gradePts;
                itemData.rankTotal += rankPts;
                itemData.gradeTotal += gradePts;
                itemData.total += entryTotal;
                catData.rankTotal += rankPts;
                catData.gradeTotal += gradePts;
                catData.total += entryTotal;
                team.totalRankPoints += rankPts;
                team.totalGradePoints += gradePts;
                team.totalPoints += entryTotal;
                if (rankPts > 0) team.rankCount++;
                team.participantCount++;

                const detail: ContributorDetail = {
                    participantId: p.id, participantName: item.type === ItemType.GROUP ? `${p.name} & Party` : p.name,
                    chestNumber: p.chestNumber, place: p.place, teamId: p.teamId, rank: winner.position, rankPoints: rankPts,
                    gradeName: gradeName, gradePoints: gradePts, total: entryTotal
                };
                itemData.contributors.push(detail);

                participantRawEntries.push({
                    participant: p,
                    item: item,
                    category: category,
                    rank: winner.position,
                    rankPoints: rankPts,
                    gradeName: gradeName,
                    gradePoints: gradePts,
                    total: entryTotal
                });
            });
        });

        const contributorsCount = new Set(participantRawEntries.map(e => e.participant.id)).size;

        return {
            teamData,
            participantRawEntries,
            stats: {
                declaredCount: declaredItemsSet.size,
                contributorsCount,
                totalEntries: totalEntryCombinations
            }
        };
    }, [teams, categories, participants, results, items, gradePoints]);

    const sortedTeams = useMemo(() => {
        if (!analytics) return [];
        return (Object.values(analytics.teamData) as TeamAnalytics[]).sort((a, b) => {
            const valA = viewFilter === 'RANK' ? a.totalRankPoints : viewFilter === 'GRADE' ? a.totalGradePoints : a.totalPoints;
            const valB = viewFilter === 'RANK' ? b.totalRankPoints : viewFilter === 'GRADE' ? b.totalGradePoints : b.totalPoints;
            return valB - valA;
        });
    }, [analytics, viewFilter]);

    const topperInsights = useMemo(() => {
        if (!analytics) return [];
        const tally: Record<string, TopperData> = {};
        analytics.participantRawEntries.forEach(entry => {
            const matchesType = topperTypeFilter === 'ALL' || entry.item.performanceType === topperTypeFilter;
            const matchesCategory = topperCategoryFilter === 'ALL' || entry.category.id === topperCategoryFilter;
            if (!matchesType || !matchesCategory) return;
            if (entry.item.type !== ItemType.SINGLE) return;
            const pid = entry.participant.id;
            if (!tally[pid]) {
                tally[pid] = {
                    participantId: pid, name: entry.participant.name, chestNumber: entry.participant.chestNumber, place: entry.participant.place,
                    teamName: teams?.find(t => t.id === entry.participant.teamId)?.name || 'N/A',
                    categoryName: categories?.find(c => c.id === entry.participant.categoryId)?.name || 'N/A',
                    points: 0, breakdown: []
                };
            }
            tally[pid].points += entry.total;
            tally[pid].breakdown.push({
                itemName: entry.item.name, rank: entry.rank, rankPoints: entry.rankPoints,
                grade: entry.gradeName, gradePoints: entry.gradePoints, total: entry.total
            });
        });
        return Object.values(tally).sort((a, b) => b.points - a.points).slice(0, 3);
    }, [analytics, topperTypeFilter, topperCategoryFilter, teams, categories]);

    const handleToggleTeam = (id: string) => setExpandedTeams(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const handleToggleCategory = (id: string) => setExpandedCategories(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

    const itemOptions = useMemo(() => {
        if (!items || !categories) return [];
        return items.map(item => ({ id: item.id, label: item.name, group: categories.find(c => c.id === item.categoryId)?.name })).sort((a, b) => a.label.localeCompare(b.label));
    }, [items, categories]);

    const participantOptions = useMemo(() => {
        if (!participants) return [];
        return participants.map(p => ({ id: p.id, label: p.name, subLabel: `#${p.chestNumber}` })).sort((a, b) => a.label.localeCompare(b.label));
    }, [participants]);

    if (!state || !analytics) return <div className="p-12 text-center text-zinc-500"><Loader2 className="animate-spin mx-auto mb-4" /> Calculating point distributions...</div>;

    const topTeamScore = sortedTeams.length > 0 ? (viewFilter === 'RANK' ? sortedTeams[0].totalRankPoints : viewFilter === 'GRADE' ? sortedTeams[0].totalGradePoints : sortedTeams[0].totalPoints) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black font-serif text-amazio-primary dark:text-white tracking-tight uppercase">Leaderboard Analytics</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Traceable point tracking and contribution mapping.</p>
                </div>
                <div className="flex items-center gap-3 p-1.5 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-inner w-full lg:w-auto">
                    {[
                        { id: 'BOTH', label: 'Overall', icon: Layers },
                        { id: 'RANK', label: 'Prize Pts', icon: Trophy },
                        { id: 'GRADE', label: 'Grade Pts', icon: GraduationCap }
                    ].map(f => (
                        <button key={f.id} onClick={() => setViewFilter(f.id as any)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${viewFilter === f.id ? 'bg-white dark:bg-zinc-700 text-amazio-primary dark:text-white shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><f.icon size={14} /> {f.label}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Declared Results" value={analytics.stats.declaredCount} icon={CheckCircle2} colorClass="text-emerald-700 border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/20" />
                <StatBox label="Contributing Students" value={analytics.stats.contributorsCount} icon={Users} colorClass="text-indigo-700 border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/20" />
                <StatBox label="Total Scoring Entries" value={analytics.stats.totalEntries} icon={PieChart} colorClass="text-amber-700 border-amber-100 bg-amber-50/50 dark:border-amber-900/20" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-6">
                    <Card title="Team Ranking Breakdowns">
                        <div className="space-y-4">
                            {sortedTeams.map((team, idx) => {
                                const isExpanded = expandedTeams.has(team.teamId);
                                const currentPoints = viewFilter === 'RANK' ? team.totalRankPoints : viewFilter === 'GRADE' ? team.totalGradePoints : team.totalPoints;
                                const progress = topTeamScore > 0 ? (currentPoints / topTeamScore) * 100 : 0;
                                return (
                                    <div key={team.teamId} className="group flex flex-col gap-1">
                                        <div onClick={() => handleToggleTeam(team.teamId)} className={`relative overflow-hidden cursor-pointer p-4 rounded-3xl border transition-all duration-500 hover:scale-[1.01] ${isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-lg' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-zinc-300 text-zinc-800' : idx === 2 ? 'bg-orange-300 text-orange-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{idx + 1}</div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{team.teamName}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest"><Trophy size={10} /> {team.rankCount} Ranks</div>
                                                            <div className="flex items-center gap-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest"><Users size={10} /> {team.participantCount} Entries</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 self-end sm:self-center">
                                                    <div className="flex gap-2">
                                                        {viewFilter !== 'GRADE' && <PointChip type="rank" value={team.totalRankPoints} label="Total Rank Points" />}
                                                        {viewFilter !== 'RANK' && <PointChip type="grade" value={team.totalGradePoints} label="Total Grade Points" />}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{currentPoints}</div>
                                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Subtotal</div>
                                                    </div>
                                                    <ChevronRight size={20} className={`text-zinc-400 transition-transform duration-500 ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div></div>
                                        </div>
                                        {isExpanded && (
                                            <div className="ml-4 sm:ml-12 mt-1 space-y-3 animate-in slide-in-from-top-4 duration-500">
                                                {(Object.values(team.categories) as CategoryBreakdown[]).map(cat => {
                                                    const catId = `${team.teamId}-${cat.categoryId}`;
                                                    const isCatExpanded = expandedCategories.has(catId);
                                                    const itemsInCat = (Object.values(cat.items) as ItemContribution[]).filter(item => item.itemName.toLowerCase().includes(globalSearchTerm.toLowerCase()) || item.contributors.some(c => c.participantName.toLowerCase().includes(globalSearchTerm.toLowerCase())));
                                                    if (itemsInCat.length === 0 && globalSearchTerm) return null;
                                                    return (
                                                        <div key={cat.categoryId} className="bg-white/40 dark:bg-white/[0.01] rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                                            <button onClick={() => handleToggleCategory(catId)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"><div className="flex items-center gap-3"><Layers size={14} className="text-zinc-400" /><span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{cat.categoryName}</span></div><div className="flex items-center gap-4"><div className="flex gap-1.5"><PointChip type="rank" value={cat.rankTotal} /><PointChip type="grade" value={cat.gradeTotal} /></div><ChevronDown size={14} className={`text-zinc-400 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} /></div></button>
                                                            {isCatExpanded && (
                                                                <div className="p-2 space-y-2 bg-zinc-50/50 dark:bg-black/20 animate-in fade-in duration-300">
                                                                    {itemsInCat.map(item => (
                                                                        <div key={item.itemId} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                                            <div className="flex justify-between items-start mb-3 border-b border-zinc-50 dark:border-zinc-800 pb-2"><div><h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{item.itemName}</h4><div className="flex items-center gap-2 mt-0.5"><span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.performanceType === PerformanceType.ON_STAGE ? 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:border-emerald-900/20 dark:border-emerald-800'}`}>{item.performanceType}</span><span className="text-[8px] text-zinc-400 uppercase font-black tracking-widest">{item.itemType}</span></div></div><div className="flex gap-2"><PointChip type="rank" value={item.rankTotal} /><PointChip type="grade" value={item.gradeTotal} /></div></div>
                                                                            <div className="space-y-1.5">{item.contributors.map((p, pIdx) => (
                                                                                    <div key={`${p.participantId}-${pIdx}`} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group/row"><div className="flex items-center gap-3 min-w-0"><div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${p.rank === 1 ? 'bg-amber-400 text-amber-950' : p.rank === 2 ? 'bg-zinc-300 text-zinc-800' : p.rank === 3 ? 'bg-orange-300 text-orange-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>{p.rank || '-'}</div><div className="truncate"><p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{p.participantName} {p.place && <span className="opacity-50 font-medium text-[0.8em]">, {p.place}</span>}</p><div className="flex items-center gap-1.5"><p className="text-[9px] text-zinc-500 font-mono">#{p.chestNumber}</p></div></div></div><div className="flex items-center gap-4"><div className="flex gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">{p.rankPoints > 0 && <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-500"><Trophy size={10}/> +{p.rankPoints}</span>}{p.gradePoints > 0 && <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-500"><GraduationCap size={10}/> {p.gradeName} (+{p.gradePoints})</span>}</div><div className="text-xs font-black text-indigo-600 dark:text-indigo-400">+{p.total}</div></div></div>
                                                                                ))}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title={`Quick ${insightsMode === 'ITEM' ? 'Item' : 'Participant'} Insights`} action={<div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl"><button onClick={() => { setInsightsMode('ITEM'); setItemInsightsId(''); }} className={`p-1.5 rounded-lg transition-all ${insightsMode === 'ITEM' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} title="Item Mode"><Layout size={16} /></button><button onClick={() => { setInsightsMode('PARTICIPANT'); setParticipantInsightsId(''); }} className={`p-1.5 rounded-lg transition-all ${insightsMode === 'PARTICIPANT' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} title="Participant Mode"><User size={16} /></button></div>}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative"><label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Select {insightsMode === 'ITEM' ? 'Event' : 'Student'}</label>{insightsMode === 'ITEM' ? <SearchableDropdown options={itemOptions} value={itemInsightsId} onChange={setItemInsightsId} placeholder="Find event item..." icon={Layout} /> : <SearchableDropdown options={participantOptions} value={participantInsightsId} onChange={setParticipantInsightsId} placeholder="Find student..." icon={User} />}</div>
                                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3"><Zap size={18} className="text-indigo-600 shrink-0 mt-0.5" /><p className="text-[10px] text-indigo-800 dark:text-indigo-200 leading-relaxed">{insightsMode === 'ITEM' ? "Instantly audit how points were distributed for this specific event." : "View detailed point breakdown for a specific student across all their registered items."}</p></div>
                            </div>
                            {(insightsMode === 'ITEM' ? itemInsightsId : participantInsightsId) ? (
                                <div className="p-4 bg-zinc-50 dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">{insightsMode === 'ITEM' ? (() => {
                                            const itemRes = analytics.participantRawEntries.filter(e => e.item.id === itemInsightsId);
                                            if (itemRes.length === 0) return <div className="text-center py-4 text-xs text-zinc-500 italic">No declared results for this item yet.</div>;
                                            return <div className="space-y-3">{itemRes.sort((a,b) => (a.rank || 99) - (b.rank || 99)).map((e, idx) => (
                                                        <div key={idx} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-bold shadow-sm">{e.rank || '-'}</div><div><div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{e.participant.name}</div><div className="text-[9px] text-zinc-500 uppercase">{state.teams.find(t => t.id === e.participant.teamId)?.name}</div></div></div><div className="text-xs font-black text-indigo-600 dark:text-indigo-400">+{e.total} Pts</div></div>
                                                    ))}</div>;
                                        })() : (() => {
                                            const partRes = analytics.participantRawEntries.filter(e => e.participant.id === participantInsightsId);
                                            if (partRes.length === 0) return <div className="text-center py-4 text-xs text-zinc-500 italic">No points earned by this student yet.</div>;
                                            return <div className="space-y-3">{partRes.map((e, idx) => (
                                                        <div key={idx} className="flex items-center justify-between"><div><div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{e.item.name}</div><div className="text-[9px] text-zinc-500 uppercase">{e.gradeName} Grade • Rank {e.rank || '-'}</div></div><div className="text-xs font-black text-indigo-600 dark:text-indigo-400">+{e.total} Pts</div></div>
                                                    ))}<div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center"><div className="text-[10px] font-black uppercase text-zinc-400">Total Accumulation</div><div className="text-sm font-black text-indigo-600 dark:text-indigo-400">{partRes.reduce((sum, e) => sum + e.total, 0)} Pts</div></div></div>;
                                        })()}</div>
                            ) : <div className="py-10 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl opacity-40"><ListFilter size={32} className="mx-auto mb-3 text-zinc-400" /><p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select an entry to audit points</p></div>}
                        </div>
                    </Card>
                </div>

                <div className="xl:col-span-4 space-y-6">
                    <Card title="Individual Toppers" action={<div className="flex gap-2"><select value={topperTypeFilter} onChange={(e) => topperTypeFilterSet(e.target.value as any)} className="bg-transparent border-none text-[10px] font-black uppercase tracking-wider text-zinc-500 focus:ring-0 cursor-pointer outline-none"><option value="ALL">All Modes</option><option value={PerformanceType.ON_STAGE}>On-Stage</option><option value={PerformanceType.OFF_STAGE}>Off-Stage</option></select><select value={topperCategoryFilter} onChange={(e) => topperCategoryFilterSet(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase tracking-wider text-zinc-500 focus:ring-0 cursor-pointer outline-none"><option value="ALL">All Levels</option>{state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}>
                        <div className="space-y-4">{topperInsights.length > 0 ? topperInsights.map((topper, idx) => (
                                    <div key={topper.participantId} className={`relative p-4 rounded-3xl border transition-all ${idx === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-lg' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{idx + 1}</div><div className="min-w-0 flex-grow"><h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{topper.name}</h4><div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{topper.teamName}</span><span className="text-[9px] text-zinc-300">•</span><span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{topper.categoryName}</span></div></div><div className="text-right"><div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{topper.points}</div><div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Total</div></div></div></div>
                                )) : <div className="py-12 text-center opacity-30"><Trophy size={48} className="mx-auto mb-3" /><p className="text-xs font-black uppercase tracking-[0.2em]">No Data in Range</p></div>}</div>
                    </Card>
                    <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group"><div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div><div className="flex items-center gap-3 mb-6 relative z-10"><div className="h-5 w-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.4)]"></div><h3 className="text-xl font-black font-serif uppercase tracking-tighter">Live Status</h3></div><div className="space-y-4 relative z-10"><div className="flex justify-between items-center pb-3 border-b border-white/10"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Completion</span><span className="text-sm font-black">{Math.round((analytics.stats.declaredCount / Math.max(state.items.length, 1)) * 100)}%</span></div><div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-white h-full rounded-full" style={{ width: `${(analytics.stats.declaredCount / Math.max(state.items.length, 1)) * 100}%` }}></div></div><p className="text-[10px] leading-relaxed opacity-80 font-medium">Data is synchronized across all judicial endpoints in real-time. Calculations follow Art Fest point distribution heuristics.</p></div></div>
                </div>
            </div>
        </div>
    );
};

export default PointsPage;