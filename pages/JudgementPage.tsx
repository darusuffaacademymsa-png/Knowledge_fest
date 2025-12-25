import { AlertTriangle, ArrowLeft, Award, Calculator, CheckCircle2, ChevronDown, ClipboardEdit, Clock, Edit3, Eye, FileText, Filter, LayoutGrid, Lock, LockOpen, Medal, Megaphone, Save, Search, ShieldAlert, Tag, Trash2, Trophy, UserCheck, Users, User, Star } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/Card';
import { useFirebase } from '../hooks/useFirebase';
import { Grade, Item, ItemType, Participant, PerformanceType, Result, ResultStatus, TabulationEntry, UserRole, Judge } from '../types';

interface ScoredParticipant {
    participantId: string;
    participantName: string;
    chestNumber: string;
    place?: string;
    teamName: string;
    marks: { [judgeId: string]: number | null };
    finalMark: number;
    rank: number;
    prizePoints: number;
    grade: Grade | undefined;
    gradePoints: number;
    totalPoints: number;
    isGroup: boolean;
    members?: Participant[];
    contributesToIndividualTally: boolean; 
    codeLetter: string;
}

const MANUAL_OVERRIDE_ID = 'manual_admin_override';

// --- Color Helpers ---
const ART_FEST_PALETTE = ['#006994', '#d4a574', '#1b5e20', '#80deea'];

const getCategoryColor = (str: string) => {
    if (!str) return ART_FEST_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return ART_FEST_PALETTE[Math.abs(hash) % ART_FEST_PALETTE.length];
};

const getTypeColor = (type: ItemType) => type === ItemType.SINGLE ? '#d4a574' : '#1b5e20';
const getPerformanceColor = (perf: PerformanceType) => perf === PerformanceType.ON_STAGE ? '#006994' : '#80deea';

// --- ResultCard Component ---
interface ResultCardProps {
    item: Item;
    result: Result | undefined;
    status: ResultStatus;
    categoryName: string;
    onEdit: () => void;
    onRemove?: () => void;
    onDeclare?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ item, result, status, categoryName, onEdit, onRemove, onDeclare }) => {
    const isDeclared = status === ResultStatus.DECLARED;
    const isDraft = status === ResultStatus.UPLOADED;
    
    const catColor = getCategoryColor(categoryName);
    const typeColor = getTypeColor(item.type);
    const perfColor = getPerformanceColor(item.performanceType);

    const getStatusInfo = () => {
        if (isDeclared) return {
            label: 'Declared',
            icon: <CheckCircle2 size={12} strokeWidth={3} />,
            class: 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
        };
        if (isDraft) return {
            label: 'Drafted',
            icon: <ClipboardEdit size={12} strokeWidth={3} />,
            class: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
        };
        return {
            label: 'Not Uploaded',
            icon: <Clock size={12} strokeWidth={3} />,
            class: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
        };
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={`group relative flex flex-col h-full rounded-[2.5rem] border-2 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#121412] ${isDeclared ? 'border-zinc-200 dark:border-white/10 opacity-40 grayscale-[0.6]' : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200'}`}>
            
            {/* Status Header */}
            <div className="p-6 pb-2 flex justify-between items-start">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 transition-all duration-300 ${statusInfo.class}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                </div>
                {onRemove && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                        className="p-2 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>

            {/* Item Details */}
            <div className="p-6 pt-2 flex-grow flex flex-col">
                <div className="mb-4">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 transition-colors`} style={{ color: catColor }}>
                        {categoryName}
                    </p>
                    <h3 className="text-2xl font-black font-serif uppercase tracking-tighter leading-tight text-amazio-primary dark:text-zinc-100">
                        {item.name}
                    </h3>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                    <span 
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                        style={{ backgroundColor: perfColor + '15', color: perfColor, borderColor: perfColor + '40' }}
                    >
                        {item.performanceType}
                    </span>
                    <span 
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                        style={{ backgroundColor: typeColor + '15', color: typeColor, borderColor: typeColor + '40' }}
                    >
                        {item.type}
                    </span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 pt-0 mt-2 border-t border-zinc-50 dark:border-white/5 pt-6">
                <div className="flex gap-2">
                    <button 
                        onClick={onEdit}
                        className="flex-grow py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 bg-amazio-primary text-white shadow-amazio-primary/20"
                    >
                        {isDeclared ? <Eye size={14}/> : <Edit3 size={14}/>}
                        {isDeclared ? 'View Results' : 'Score Item'}
                    </button>
                    {isDraft && onDeclare && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeclare(); }}
                            className="w-14 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                            title="Declare Final"
                        >
                            <Megaphone size={18} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ScoringTable Component for Large Screens ---
const ScoringTable: React.FC<{
    participants: ScoredParticipant[];
    judgeIds: string[];
    isDeclared: boolean;
    isJudge: boolean;
    currentJudgeId?: string;
    onMarkChange: (pid: string, jid: string, val: string) => void;
    state: any;
}> = ({ participants, judgeIds, isDeclared, isJudge, currentJudgeId, onMarkChange, state }) => {
    return (
        <div className={`bg-white dark:bg-[#121412] rounded-[2rem] border border-zinc-100 dark:border-white/5 shadow-glass-light dark:shadow-2xl overflow-hidden animate-in fade-in duration-500 ${isDeclared ? 'opacity-40 grayscale-[0.6]' : ''}`}>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/80 dark:bg-black/40 backdrop-blur-md border-b border-zinc-100 dark:border-white/5">
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center w-24">Entry</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Chest#</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity</th>
                            {judgeIds.map(jid => (
                                <th key={jid} className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center w-32">
                                    {jid === MANUAL_OVERRIDE_ID ? 'Admin Override' : (state.judges.find((j: Judge)=>j.id===jid)?.name || 'Judge')}
                                </th>
                            ))}
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center w-28">Mean %</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right w-40">Standing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                        {participants.map(sp => (
                            <tr key={sp.participantId} className={`group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors ${sp.rank === 1 ? 'bg-amber-50/30 dark:bg-amber-500/[0.03]' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{sp.codeLetter}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-black text-zinc-500 dark:text-zinc-400">
                                        #{sp.chestNumber}
                                    </span>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <div className="font-black text-sm uppercase text-amazio-primary dark:text-zinc-100 truncate">{sp.participantName}</div>
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">{sp.teamName}</div>
                                </td>
                                {judgeIds.map(jid => (
                                    <td key={jid} className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <input 
                                                type="number"
                                                inputMode="decimal"
                                                min="0" max="100" step="0.1"
                                                disabled={isDeclared || (isJudge && jid !== currentJudgeId)}
                                                value={sp.marks[jid] ?? ''}
                                                onChange={e => onMarkChange(sp.participantId, jid, e.target.value)}
                                                className={`w-20 h-10 text-center font-black rounded-xl border transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDeclared ? 'bg-transparent text-zinc-400 border-transparent' : 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-300'}`}
                                                placeholder="--"
                                            />
                                        </div>
                                    </td>
                                ))}
                                <td className="px-6 py-4">
                                    <div className="text-center font-black text-lg text-zinc-900 dark:text-white tabular-nums">
                                        {sp.finalMark.toFixed(1)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end items-center gap-2">
                                        {sp.grade && (
                                            <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[9px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                                                Tier {sp.grade.name}
                                            </span>
                                        )}
                                        {sp.rank > 0 && (
                                            <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm ${sp.rank === 1 ? 'bg-amber-400 text-amber-950' : sp.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-200 text-orange-800'}`}>
                                                Rank {sp.rank}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Page Component ---

const JudgementPage: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const { state, currentUser, globalFilters, globalSearchTerm, updateTabulationEntry, deleteEventTabulation, updateResultStatus, declareResult } = useFirebase();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isJudge = currentUser?.role === UserRole.JUDGE;
    const judgeId = currentUser?.judgeId;

    // --- Core View Selection Logic ---

    const selectedItem = useMemo(() => state?.items.find(i => i.id === selectedItemId), [state, selectedItemId]);
    const selectedItemResult = useMemo(() => state?.results.find(r => r.itemId === selectedItemId), [state, selectedItemId]);
    const isDeclared = selectedItemResult?.status === ResultStatus.DECLARED;

    // Filtered Items List for Overview - Consuming Global State
    const filteredItems = useMemo(() => {
        if (!state) return [];
        
        let list = state.items.filter(item => {
            const result = state.results.find(r => r.itemId === item.id);
            const currentStatus = result?.status || ResultStatus.NOT_UPLOADED;

            const matchesSearch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesCat = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const matchesPerf = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(item.performanceType) : true;
            const matchesStatus = globalFilters.status.length > 0 ? globalFilters.status.includes(currentStatus) : true;
            
            // Judge assignment check
            const assignment = state.judgeAssignments.find(a => a.itemId === item.id);
            const isAssigned = isJudge ? assignment?.judgeIds.includes(judgeId!) : true;

            return matchesSearch && matchesCat && matchesPerf && matchesStatus && isAssigned;
        });

        return list.sort((a,b) => a.name.localeCompare(b.name));
    }, [state, globalSearchTerm, globalFilters, isJudge, judgeId]);

    // Data for Scoring View
    const scoredParticipants = useMemo(() => {
        if (!selectedItem || !state) return [];
        const item = selectedItem;
        const category = state.categories.find(c => c.id === item.categoryId);
        const gradesConfig = item.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group;
        
        // Find all enrolled participants
        const enrolled = state.participants.filter(p => p.itemIds.includes(item.id));
        
        // Grouping Logic (Identical to DataEntry)
        let entities: { id: string, name: string, chestNumber: string, teamId: string, place?: string, isGroup: boolean }[] = [];
        
        if (item.type === ItemType.GROUP) {
            const groups: Record<string, Participant[]> = {};
            enrolled.forEach(p => {
                const groupIdx = p.itemGroups?.[item.id] || 1;
                const key = `${p.teamId}_${groupIdx}`;
                if(!groups[key]) groups[key] = [];
                groups[key].push(p);
            });
            entities = Object.values(groups).map(members => {
                let leader = members.find(p => p.groupLeaderItemIds?.includes(item.id)) || members[0];
                return {
                    id: leader.id,
                    name: `${leader.name} & Party`,
                    chestNumber: leader.groupChestNumbers?.[item.id] || leader.chestNumber,
                    teamId: leader.teamId,
                    place: leader.place,
                    isGroup: true
                };
            });
        } else {
            entities = enrolled.map(p => ({
                id: p.id,
                name: p.name,
                chestNumber: p.chestNumber,
                teamId: p.teamId,
                place: p.place,
                isGroup: false
            }));
        }

        // Map to scoring data
        const scores = entities.map(entity => {
            const tab = state.tabulation.find(t => t.itemId === item.id && t.participantId === entity.id);
            const team = state.teams.find(t => t.id === entity.teamId);
            const marks = tab?.marks || {};
            
            // Calculate Marks
            const validMarks = Object.values(marks).filter(m => m !== null) as number[];
            const finalMark = validMarks.length > 0 ? validMarks.reduce((a,b) => a+b,0) / validMarks.length : 0;
            
            // Determine Grade
            const grade = gradesConfig.find(g => finalMark >= g.lowerLimit && finalMark <= g.upperLimit);
            const gradePoints = grade ? (item.gradePointsOverride?.[grade.id] ?? grade.points) : 0;

            return {
                participantId: entity.id,
                participantName: entity.name,
                chestNumber: entity.chestNumber,
                place: entity.place,
                teamName: team?.name || 'N/A',
                marks: marks,
                finalMark: finalMark,
                grade: grade,
                gradePoints: gradePoints,
                isGroup: entity.isGroup,
                codeLetter: tab?.codeLetter || '?',
                rank: 0, prizePoints: 0, totalPoints: 0 // Placeholder
            };
        });

        // Sorting by Mark to determine Ranks
        const sorted = [...scores].sort((a,b) => b.finalMark - a.finalMark);
        const uniqueMarks = [...new Set(sorted.map(s => s.finalMark).filter(m => m > 0))].sort((a,b) => b-a);
        
        const rankThresholds = [item.points.first > 0 ? 1 : 0, item.points.second > 0 ? 2 : 0, item.points.third > 0 ? 3 : 0].filter(r => r > 0);

        return sorted.map(score => {
            let rank = 0;
            let prizePoints = 0;
            
            if (score.finalMark > 0) {
                const markRank = uniqueMarks.indexOf(score.finalMark) + 1;
                if (rankThresholds.includes(markRank)) {
                    rank = markRank;
                    if (rank === 1) prizePoints = item.points.first;
                    else if (rank === 2) prizePoints = item.points.second;
                    else if (rank === 3) prizePoints = item.points.third;
                }
            }

            return {
                ...score,
                rank,
                prizePoints,
                totalPoints: prizePoints + score.gradePoints
            };
        }).sort((a,b) => a.codeLetter.localeCompare(b.codeLetter));

    }, [selectedItem, state]);

    // --- Actions ---

    const handleMarkChange = async (participantId: string, judgeKey: string, val: string) => {
        if (!selectedItem || isDeclared) return;
        const mark = val === '' ? null : parseFloat(val);
        if (mark !== null && (mark < 0 || mark > 100)) return;

        const entryId = `${selectedItem.id}-${participantId}`;
        const existing = state?.tabulation.find(t => t.id === entryId);
        
        const marks = { ...(existing?.marks || {}), [judgeKey]: mark };
        
        await updateTabulationEntry({
            id: entryId,
            itemId: selectedItem.id,
            categoryId: selectedItem.categoryId,
            participantId: participantId,
            marks: marks,
            codeLetter: existing?.codeLetter || '',
            finalMark: null, position: null, gradeId: null
        });
    };

    const handleSaveDraft = async () => {
        if (!selectedItem) return;
        setIsSaving(true);
        try {
            await updateResultStatus({ 
                itemId: selectedItem.id, 
                categoryId: selectedItem.categoryId, 
                status: ResultStatus.UPLOADED 
            });
            alert("Results saved as draft.");
        } catch (e) { alert("Failed to save draft."); }
        finally { setIsSaving(false); }
    };

    const handleDeclare = async () => {
        if (!selectedItem) return;
        if (!confirm("Are you sure you want to declare results? This will finalize rankings and notify all users.")) return;
        setIsSaving(true);
        try {
            await declareResult({ itemId: selectedItem.id, categoryId: selectedItem.categoryId });
            alert("Results declared successfully!");
        } catch (e) { alert("Failed to declare results."); }
        finally { setIsSaving(false); }
    };

    const handleReset = async () => {
        if (!selectedItem) return;
        if (!confirm("CRITICAL ACTION: This will completely DELETE all marks and standings for this event. Continue?")) return;
        
        setIsSaving(true);
        try {
            // 1. Reset Status
            await updateResultStatus({ itemId: selectedItem.id, categoryId: selectedItem.categoryId, status: ResultStatus.NOT_UPLOADED });
            // 2. Clear Marks (Tabulation)
            await deleteEventTabulation(selectedItem.id);
            alert("Event data purged successfully.");
        } catch (e) {
            alert("Failed to purge data.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!state) return <div className="p-12 text-center text-zinc-500">Loading scoring modules...</div>;

    // --- SCORING VIEW ---
    if (selectedItemId && selectedItem) {
        const category = state.categories.find(c => c.id === selectedItem.categoryId);
        
        // Ensure only currently existing judges are displayed
        const validJudgeIds = new Set(state.judges.map(j => j.id));
        const assignedJudges = (state.judgeAssignments.find(a => a.itemId === selectedItem.id)?.judgeIds || [])
            .filter(id => validJudgeIds.has(id));
            
        const activeJudgeInputs = isJudge ? [judgeId!] : [...assignedJudges, MANUAL_OVERRIDE_ID];

        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-24">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <button onClick={() => setSelectedItemId(null)} className="flex items-center gap-2 text-zinc-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">
                            <ArrowLeft size={16} /> Back to Overview
                        </button>
                        <h2 className="text-2xl md:text-3xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">{selectedItem.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">{category?.name}</span>
                            <span 
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border`}
                                style={{ backgroundColor: getPerformanceColor(selectedItem.performanceType) + '15', color: getPerformanceColor(selectedItem.performanceType), borderColor: getPerformanceColor(selectedItem.performanceType) + '40' }}
                            >
                                {selectedItem.performanceType}
                            </span>
                        </div>
                    </div>
                    
                    {!isJudge && (
                        <div className="flex gap-2 w-full sm:w-auto">
                             {isDeclared ? (
                                <button onClick={handleReset} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-amazio-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-zinc-50 transition-all">
                                    <LockOpen size={16}/> Purge & Unlock
                                </button>
                             ) : (
                                <>
                                    <button 
                                        onClick={handleSaveDraft}
                                        disabled={scoredParticipants.length === 0 || isSaving}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-amazio-primary dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-zinc-50 transition-all disabled:opacity-50"
                                    >
                                        <Save size={18}/> {isSaving ? '...' : 'Save Draft'}
                                    </button>
                                    <button 
                                        onClick={handleDeclare}
                                        disabled={scoredParticipants.length === 0 || isSaving}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Calculator size={18} strokeWidth={3}/> {isSaving ? 'Calculating...' : 'Declare Result'}
                                    </button>
                                    {scoredParticipants.some(p => Object.keys(p.marks).length > 0) && (
                                        <button onClick={handleReset} className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl border border-rose-100 dark:border-rose-900/30 transition-all hover:bg-rose-100" title="Discard All Marks">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </>
                             )}
                        </div>
                    )}
                </div>

                {isDeclared && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-2xl flex items-center gap-3 shadow-sm">
                        <Lock size={20} className="shrink-0" />
                        <p className="text-xs font-bold leading-tight">Results for this item are locked and published. Resetting is required to modify marks.</p>
                    </div>
                )}

                {/* PC Table View / Mobile Card View Switch */}
                {!isMobile ? (
                    <ScoringTable 
                        participants={scoredParticipants} 
                        judgeIds={activeJudgeInputs} 
                        isDeclared={isDeclared} 
                        isJudge={isJudge} 
                        currentJudgeId={judgeId} 
                        onMarkChange={handleMarkChange} 
                        state={state}
                    />
                ) : (
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isDeclared ? 'opacity-40 grayscale-[0.6]' : ''}`}>
                        {scoredParticipants.map(sp => (
                            <div key={sp.participantId} className={`bg-white dark:bg-zinc-900 rounded-[2.5rem] border transition-all ${sp.rank === 1 ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-4 ring-amber-500/5' : 'border-zinc-100 dark:border-white/5 shadow-sm'}`}>
                                <div className="p-4 border-b border-zinc-100 dark:border-white/8 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20 rounded-t-[2.5rem]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{sp.codeLetter}</span>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entry Ref</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-black">
                                        #{sp.chestNumber}
                                    </div>
                                </div>
                                
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-black text-amazio-primary dark:text-white uppercase tracking-tight text-lg leading-tight truncate">{sp.participantName}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {sp.isGroup ? <Users size={12} className="text-zinc-400" /> : <User size={12} className="text-zinc-400" />}
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide truncate">{sp.teamName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-3xl font-black text-zinc-900 dark:text-white leading-none tabular-nums">{sp.finalMark.toFixed(1)}%</div>
                                            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Mean</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {activeJudgeInputs.map(jid => (
                                            <div key={jid} className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-zinc-400 pointer-events-none">
                                                    {jid === MANUAL_OVERRIDE_ID ? 'Adm' : state.judges.find((j: Judge)=>j.id===jid)?.name.substring(0,3) || 'Jdg'}
                                                </div>
                                                <input 
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0" max="100" step="0.1"
                                                    disabled={isDeclared || (isJudge && jid !== judgeId)}
                                                    value={sp.marks[jid] ?? ''}
                                                    onChange={e => handleMarkChange(sp.participantId, jid, e.target.value)}
                                                    className={`w-full h-14 pl-12 pr-4 text-right font-black rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDeclared ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent' : 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-300'}`}
                                                    placeholder="--"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 bg-zinc-50/50 dark:bg-black/20 rounded-b-[2.5rem] border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {sp.rank > 0 ? (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md ${sp.rank === 1 ? 'bg-amber-400 text-amber-950' : sp.rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-200 text-orange-800'}`}>
                                                <Trophy size={14}/> Rank {sp.rank}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 py-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">Audit Status</div>
                                        )}
                                        {sp.grade && (
                                            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                                                Tier {sp.grade.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">+{sp.totalPoints}</div>
                                        <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Points Tally</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- OVERVIEW VIEW (REDESIGNED AS CARDS) ---
    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-24">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Scoring & Results</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">Adjudication terminal for point entry and declaration.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map(item => {
                    const result = state.results.find(r => r.itemId === item.id);
                    const status = result?.status || ResultStatus.NOT_UPLOADED;
                    const catName = state.categories.find(c => c.id === item.categoryId)?.name || 'N/A';
                    
                    return (
                        <ResultCard 
                            key={item.id}
                            item={item}
                            result={result}
                            status={status}
                            categoryName={catName}
                            onEdit={() => setSelectedItemId(item.id)}
                            onDeclare={!isJudge ? () => { setSelectedItemId(item.id); handleDeclare(); } : undefined}
                            onRemove={!isJudge ? () => { setSelectedItemId(item.id); handleReset(); } : undefined}
                        />
                    );
                })}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] opacity-30">
                        <Award size={64} strokeWidth={1} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">No matching events in queue</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JudgementPage;