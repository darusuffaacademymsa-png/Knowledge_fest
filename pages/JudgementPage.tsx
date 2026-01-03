
import { AlertTriangle, ArrowLeft, Award, Calculator, CheckCircle2, ChevronDown, ClipboardEdit, Clock, Edit3, Eye, FileText, Filter, LayoutGrid, Lock, LockOpen, Medal, Megaphone, Save, Search, ShieldAlert, Tag, Trash2, Trophy, UserCheck, Users, User, Star, RefreshCw, UploadCloud } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
    onUnlock?: (item: Item) => void;
    onDeclare?: (item: Item) => void;
    onUpdateTally?: (item: Item) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ item, result, status, categoryName, onEdit, onUnlock, onDeclare, onUpdateTally }) => {
    const isDeclared = status === ResultStatus.DECLARED;
    const isUpdated = status === ResultStatus.UPDATED;
    const isDraft = status === ResultStatus.UPLOADED;
    
    const catColor = getCategoryColor(categoryName);
    const typeColor = getTypeColor(item.type);
    const perfColor = getPerformanceColor(item.performanceType);

    const getStatusInfo = () => {
        if (isDeclared) return {
            label: 'Declared',
            icon: <CheckCircle2 size={10} strokeWidth={3} />,
            class: 'bg-emerald-500 text-white border-emerald-400'
        };
        if (isUpdated) return {
            label: 'Updated',
            icon: <RefreshCw size={10} strokeWidth={3} />,
            class: 'bg-indigo-500 text-white border-indigo-400'
        };
        if (isDraft) return {
            label: 'Drafted',
            icon: <ClipboardEdit size={10} strokeWidth={3} />,
            class: 'bg-amber-500 text-white border-amber-400'
        };
        return {
            label: 'Pending',
            icon: <Clock size={10} strokeWidth={3} />,
            class: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
        };
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={`group relative flex flex-col h-full rounded-[1rem] sm:rounded-[1.5rem] border-2 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#121412] ${isDeclared ? 'border-emerald-500/20' : isUpdated ? 'border-indigo-500/20' : 'border-zinc-100 dark:border-white/5 hover:border-zinc-200'}`}>
            <div className="p-3 sm:p-4 pb-1 sm:pb-1.5 flex justify-between items-center">
                <div className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 transition-all ${statusInfo.class}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                </div>
                {isDeclared && onUnlock && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUnlock(item); }} 
                        className="p-1.5 rounded-lg text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 transition-all hover:scale-105 active:scale-95"
                    >
                        <LockOpen size={12} strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className="p-3 sm:p-4 pt-1 sm:pt-1 flex-grow flex flex-col">
                <div className="mb-2">
                    <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-0.5`} style={{ color: catColor }}>
                        {categoryName}
                    </p>
                    <h3 className="text-sm sm:text-base font-black font-serif uppercase tracking-tight leading-tight text-amazio-primary dark:text-zinc-100 line-clamp-2">
                        {item.name}
                    </h3>
                </div>

                <div className="flex flex-wrap gap-1 mt-auto">
                    <span 
                        className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border"
                        style={{ backgroundColor: perfColor + '10', color: perfColor, borderColor: perfColor + '20' }}
                    >
                        {item.performanceType}
                    </span>
                    <span 
                        className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border"
                        style={{ backgroundColor: typeColor + '10', color: typeColor, borderColor: typeColor + '20' }}
                    >
                        {item.type}
                    </span>
                </div>
            </div>

            <div className="p-3 sm:p-4 pt-0 mt-1 border-t border-zinc-50 dark:border-white/5 pt-3 sm:pt-4">
                <div className="flex gap-1.5">
                    <button 
                        onClick={onEdit}
                        className="flex-grow py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[8px] sm:text-[9px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 bg-amazio-primary text-white"
                    >
                        {isDeclared ? <Eye size={12}/> : <Edit3 size={12}/>}
                        {isDeclared ? 'View' : 'Score'}
                    </button>
                    {isDraft && onUpdateTally && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateTally(item); }}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all"
                            title="Push to Updated Status"
                        >
                            <UploadCloud size={14} strokeWidth={3} />
                        </button>
                    )}
                    {(isDraft || isUpdated) && onDeclare && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeclare(item); }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all ${isUpdated ? 'bg-emerald-600' : 'bg-amber-500'}`}
                            title="Declare Result"
                        >
                            <Megaphone size={14} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ScoringTable Component ---
const ScoringTable: React.FC<{
    participants: ScoredParticipant[];
    judgeIds: string[];
    isLocked: boolean;
    isJudge: boolean;
    isManager: boolean;
    currentJudgeId?: string;
    onMarkChange: (pid: string, jid: string, val: string) => void;
    state: any;
}> = ({ participants, judgeIds, isLocked, isJudge, isManager, currentJudgeId, onMarkChange, state }) => {
    return (
        <div className={`bg-white dark:bg-[#121412] rounded-[2rem] border border-zinc-100 dark:border-white/5 shadow-glass-light dark:shadow-2xl overflow-hidden animate-in fade-in duration-500`}>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/80 dark:bg-black/40 backdrop-blur-md border-b border-zinc-100 dark:border-white/5">
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center w-24">Entry</th>
                            {!isJudge && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Chest#</th>}
                            {!isJudge && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity</th>}
                            {isJudge && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Anonymous Entry Reference</th>}
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
                                {!isJudge && (
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-black text-zinc-500 dark:text-zinc-400">
                                            #{sp.chestNumber}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 min-w-[200px]">
                                    {!isJudge ? (
                                        <>
                                            <div className="font-black text-sm uppercase text-amazio-primary dark:text-zinc-100 truncate">{sp.participantName}</div>
                                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">{sp.teamName}</div>
                                        </>
                                    ) : (
                                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Registry ID: {sp.codeLetter}</div>
                                    )}
                                </td>
                                {judgeIds.map(jid => (
                                    <td key={jid} className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <input 
                                                type="number"
                                                inputMode="decimal"
                                                min="0" max="100" step="0.1"
                                                disabled={(isLocked && !isManager) || (isJudge && jid !== currentJudgeId)}
                                                value={sp.marks[jid] ?? ''}
                                                onChange={e => onMarkChange(sp.participantId, jid, e.target.value)}
                                                className={`w-20 h-10 text-center font-black rounded-xl border transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${(isLocked && !isManager) || (isJudge && jid !== currentJudgeId) ? 'bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 border-transparent' : 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-300'}`}
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
                                            <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm ${sp.rank === 1 ? 'bg-amber-400 text-amber-950' : sp.rank === 2 ? 'bg-slate-200 text-slate-700' : sp.rank === 3 ? 'bg-orange-200 text-orange-800' : ''}`}>
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
    const { state, currentUser, globalFilters, globalSearchTerm, updateTabulationEntry, deleteEventTabulation, saveResult } = useFirebase();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isJudge = currentUser?.role === UserRole.JUDGE;
    const isManager = currentUser?.role === UserRole.MANAGER;
    const judgeId = currentUser?.judgeId;

    const selectedItem = useMemo(() => state?.items.find(i => i.id === selectedItemId), [state, selectedItemId]);
    const selectedItemResult = useMemo(() => state?.results.find(r => r.itemId === selectedItemId), [state, selectedItemId]);
    const isDeclared = selectedItemResult?.status === ResultStatus.DECLARED;
    const isUpdated = selectedItemResult?.status === ResultStatus.UPDATED;
    const isDraft = selectedItemResult?.status === ResultStatus.UPLOADED;
    
    // UPDATED: Judges are only locked if a manager has DECLARED or UPDATED the result.
    // They can still edit their own column in UPLOADED (Draft) mode.
    const isLocked = isDeclared || isUpdated;

    const filteredItems = useMemo(() => {
        if (!state) return [];
        let list = state.items.filter(item => {
            const result = state.results.find(r => r.itemId === item.id);
            const currentStatus = result?.status || ResultStatus.NOT_UPLOADED;
            const matchesSearch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesCat = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const matchesPerf = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(item.performanceType) : true;
            const matchesStatus = globalFilters.status.length > 0 ? globalFilters.status.includes(currentStatus) : true;
            const assignment = state.judgeAssignments.find(a => a.itemId === item.id);
            const isAssigned = isJudge ? assignment?.judgeIds.includes(judgeId!) : true;
            return matchesSearch && matchesCat && matchesPerf && matchesStatus && isAssigned;
        });
        return list.sort((a,b) => a.name.localeCompare(b.name));
    }, [state, globalSearchTerm, globalFilters, isJudge, judgeId]);

    const getScoringForItem = useCallback((item: Item, currentTabulation: TabulationEntry[]) => {
        if (!state) return [];
        const gradesConfig = item.type === ItemType.SINGLE ? (state.gradePoints?.single || []) : (state.gradePoints?.group || []);
        const enrolled = state.participants.filter(p => p.itemIds.includes(item.id));
        
        let entities: { id: string, name: string, chestNumber: string, teamId: string, isGroup: boolean }[] = [];
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
                    isGroup: true
                };
            });
        } else {
            entities = enrolled.map(p => ({
                id: p.id,
                name: p.name,
                chestNumber: p.chestNumber,
                teamId: p.teamId,
                isGroup: false
            }));
        }

        const scores = entities.map(entity => {
            const tab = currentTabulation.find(t => t.itemId === item.id && t.participantId === entity.id);
            const team = state.teams.find(t => t.id === entity.teamId);
            const marks = tab?.marks || {};
            const validMarks = Object.values(marks).filter(m => m !== null) as number[];
            const finalMark = validMarks.length > 0 ? validMarks.reduce((a,b) => a+b,0) / validMarks.length : 0;
            const grade = gradesConfig.find(g => finalMark >= g.lowerLimit && finalMark <= g.upperLimit);
            const gradePoints = grade ? (item.gradePointsOverride?.[grade.id] ?? (grade.points || 0)) : 0;
            return {
                participantId: entity.id,
                participantName: entity.name,
                chestNumber: entity.chestNumber,
                teamName: team?.name || 'N/A',
                marks: marks,
                finalMark: finalMark,
                grade: grade,
                gradePoints: gradePoints,
                isGroup: entity.isGroup,
                codeLetter: tab?.codeLetter || '?',
                rank: 0, prizePoints: 0, totalPoints: 0
            };
        });

        const sorted = [...scores].sort((a,b) => b.finalMark - a.finalMark);
        const uniqueMarks = [...new Set(sorted.map(s => s.finalMark).filter(m => m > 0))].sort((a,b) => b-a);
        
        return sorted.map(score => {
            let rank = 0;
            let prizePoints = 0;
            if (score.finalMark > 0) {
                const markRank = uniqueMarks.indexOf(score.finalMark) + 1;
                if (markRank <= 3) {
                    rank = markRank;
                    if (rank === 1) prizePoints = item.points?.first || 0;
                    else if (rank === 2) prizePoints = item.points?.second || 0;
                    else if (rank === 3) prizePoints = item.points?.third || 0;
                }
            }
            /**
             * Fixed: Added contributesToIndividualTally to satisfy ScoredParticipant interface requirements.
             */
            return { ...score, rank, prizePoints, totalPoints: prizePoints + score.gradePoints, contributesToIndividualTally: !score.isGroup };
        }).sort((a,b) => a.codeLetter.localeCompare(b.codeLetter));
    }, [state]);

    const scoredParticipants = useMemo(() => {
        if (!selectedItem || !state) return [];
        return getScoringForItem(selectedItem, state.tabulation);
    }, [selectedItem, state, getScoringForItem]);

    const handleMarkChange = async (participantId: string, judgeKey: string, val: string) => {
        if (!selectedItem || (isLocked && !isManager) || (isJudge && judgeKey !== judgeId)) return;
        const mark = val === '' ? null : parseFloat(val);
        if (mark !== null && (mark < 0 || mark > 100)) return;
        const entryId = `${selectedItem.id}-${participantId}`;
        const existing = state?.tabulation.find(t => t.id === entryId);
        const marks = { ...(existing?.marks || {}), [judgeKey]: mark };
        
        const nextTab: TabulationEntry = {
            id: entryId, itemId: selectedItem.id, categoryId: selectedItem.categoryId,
            participantId: participantId, marks: marks, codeLetter: existing?.codeLetter || '',
            finalMark: null, position: null, gradeId: null
        };

        await updateTabulationEntry(nextTab);

        // Auto-update declared/updated results if manager edits
        if ((isDeclared || isUpdated) && isManager && state) {
            const simulatedTabs = state.tabulation.map(t => t.id === entryId ? nextTab : t);
            const foundInSim = simulatedTabs.find(t => t.id === entryId);
            if (foundInSim) foundInSim.marks = marks;

            const scoring = getScoringForItem(selectedItem, simulatedTabs);
            const winners = scoring.map(sp => ({
                participantId: sp.participantId, position: sp.rank, mark: sp.finalMark, gradeId: sp.grade?.id || null
            }));
            await saveResult({ itemId: selectedItem.id, categoryId: selectedItem.categoryId, status: selectedItemResult?.status || ResultStatus.DECLARED, winners });
        }
    };

    const handleSaveDraft = async (itemOverride?: Item) => {
        const item = itemOverride || selectedItem;
        if (!item || !state) return;
        if (isJudge && !confirm("Results will be submitted for review. Proceed?")) return;
        const scoring = itemOverride ? getScoringForItem(itemOverride, state.tabulation) : scoredParticipants;
        setIsSaving(true);
        try {
            const winners = scoring.map(sp => ({
                participantId: sp.participantId, position: sp.rank, mark: sp.finalMark, gradeId: sp.grade?.id || null
            }));
            await saveResult({ itemId: item.id, categoryId: item.categoryId, status: ResultStatus.UPLOADED, winners });
        } catch (e) { alert("Failed to save draft."); }
        finally { setIsSaving(false); }
    };

    const handlePushUpdate = async (itemOverride?: Item) => {
        const item = itemOverride || selectedItem;
        if (!item || !state) return;
        if (!confirm(`Push Update for ${item.name}? This will make scores visible internally.`)) return;
        const scoring = itemOverride ? getScoringForItem(itemOverride, state.tabulation) : scoredParticipants;
        setIsSaving(true);
        try {
            const winners = scoring.map(sp => ({
                participantId: sp.participantId, position: sp.rank, mark: sp.finalMark, gradeId: sp.grade?.id || null
            }));
            await saveResult({ itemId: item.id, categoryId: item.categoryId, status: ResultStatus.UPDATED, winners });
        } catch (e) { alert("Failed to push update."); }
        finally { setIsSaving(false); }
    };

    const handleDeclare = async (itemOverride?: Item) => {
        const item = itemOverride || selectedItem;
        if (!item || !state) return;
        if (!confirm(`FINAL DECLARATION for ${item.name}? This will publish results to all screens.`)) return;
        const scoring = itemOverride ? getScoringForItem(itemOverride, state.tabulation) : scoredParticipants;
        setIsSaving(true);
        try {
            const winners = scoring.map(sp => ({
                participantId: sp.participantId, position: sp.rank, mark: sp.finalMark, gradeId: sp.grade?.id || null
            }));
            await saveResult({ itemId: item.id, categoryId: item.categoryId, status: ResultStatus.DECLARED, winners });
        } catch (e) { alert("Failed to declare."); }
        finally { setIsSaving(false); }
    };

    const handleUnlock = async (itemOverride?: Item) => {
        const item = itemOverride || selectedItem;
        if (!item || !state) return;
        if (!confirm(`Unlock ${item.name}?`)) return;
        setIsSaving(true);
        try {
            const existingResult = state.results.find(r => r.itemId === item.id);
            await saveResult({ 
                itemId: item.id, 
                categoryId: item.categoryId, 
                status: ResultStatus.UPLOADED, 
                winners: existingResult?.winners || [] 
            });
        } catch (e) { alert("Failed to unlock."); }
        finally { setIsSaving(false); }
    };

    if (!state) return <div className="p-8 text-center text-zinc-500">Loading scoring modules...</div>;

    if (selectedItemId && selectedItem) {
        const category = state.categories.find(c => c.id === selectedItem.categoryId);
        const validJudgeIds = new Set(state.judges.map(j => j.id));
        const assignedJudges = (state.judgeAssignments.find(a => a.itemId === selectedItem.id)?.judgeIds || [])
            .filter(id => validJudgeIds.has(id));
        const activeJudgeInputs = isJudge ? [judgeId!] : [...assignedJudges, MANUAL_OVERRIDE_ID];

        return (
            <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right duration-500 pb-24">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <button onClick={() => setSelectedItemId(null)} className="flex items-center gap-2 text-zinc-400 hover:text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 sm:mb-4">
                            <ArrowLeft size={14} /> Back
                        </button>
                        <h2 className="text-xl sm:text-3xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">{selectedItem.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">{category?.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest border" style={{ backgroundColor: getPerformanceColor(selectedItem.performanceType) + '15', color: getPerformanceColor(selectedItem.performanceType), borderColor: getPerformanceColor(selectedItem.performanceType) + '40' }}>{selectedItem.performanceType}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                         {isDeclared ? (
                            !isJudge && <button onClick={() => handleUnlock()} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-amazio-primary dark:text-white rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-zinc-50 transition-all"><LockOpen size={14}/> Unlock</button>
                         ) : (
                            <>
                                {(isManager || isJudge) && (
                                    <button onClick={() => handleSaveDraft()} disabled={scoredParticipants.length === 0 || isSaving} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm transition-all disabled:opacity-50 ${isJudge ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-amazio-primary dark:text-white hover:bg-zinc-50'}`}>
                                        <Save size={14}/> {isSaving ? '...' : (isJudge ? 'Submit' : 'Draft')}
                                    </button>
                                )}
                                {isManager && isDraft && (
                                    <button onClick={() => handlePushUpdate()} disabled={scoredParticipants.length === 0 || isSaving} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"><UploadCloud size={14} strokeWidth={3}/> {isSaving ? '...' : 'Update'}</button>
                                )}
                                {isManager && (isDraft || isUpdated) && (
                                    <button onClick={() => handleDeclare()} disabled={scoredParticipants.length === 0 || isSaving} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"><Calculator size={14} strokeWidth={3}/> {isSaving ? '...' : 'Declare'}</button>
                                )}
                            </>
                         )}
                    </div>
                </div>
                
                {isLocked && (
                    <div className={`p-3 sm:p-4 border rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-sm ${isDeclared ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-200'}`}>
                        {isDeclared ? <CheckCircle2 size={16} className="shrink-0" /> : <RefreshCw size={16} className="shrink-0" />}
                        <p className="text-[10px] sm:text-xs font-bold leading-tight">
                            {isDeclared ? 'Live Points Active. Modifications will sync in real-time.' : 'Updated Status. Points are calculated internally but hidden from public.'}
                        </p>
                    </div>
                )}

                {!isMobile ? (
                    <ScoringTable participants={scoredParticipants} judgeIds={activeJudgeInputs} isLocked={isLocked && !isManager} isJudge={isJudge} isManager={isManager} currentJudgeId={judgeId} onMarkChange={handleMarkChange} state={state} />
                ) : (
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3`}>
                        {scoredParticipants.map(sp => (
                            <div key={sp.participantId} className={`bg-white dark:bg-zinc-900 rounded-[1.2rem] sm:rounded-[2.5rem] border transition-all ${sp.rank === 1 ? 'border-amber-500 shadow-xl ring-2 ring-amber-500/5' : 'border-zinc-100 dark:border-white/5 shadow-sm'}`}>
                                <div className="p-3 border-b border-zinc-100 dark:border-white/8 flex justify-between items-center bg-zinc-50/50 dark:bg-black/20 rounded-t-[1.2rem]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{sp.codeLetter}</span>
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Entry</span>
                                    </div>
                                    {!isJudge && <div className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-black">#{sp.chestNumber}</div>}
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            {!isJudge ? (
                                                <>
                                                    <h4 className="font-black text-amazio-primary dark:text-white uppercase tracking-tight text-sm leading-tight truncate">{sp.participantName}</h4>
                                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide truncate mt-0.5">{sp.teamName}</p>
                                                </>
                                            ) : (
                                                <h4 className="font-black text-zinc-400 uppercase tracking-widest text-xs italic">Anonymous Entry</h4>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-black text-zinc-900 dark:text-white leading-none tabular-nums">{sp.finalMark.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeJudgeInputs.map(jid => (
                                            <div key={jid} className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-zinc-400 pointer-events-none">{jid === MANUAL_OVERRIDE_ID ? 'Adm' : state.judges.find((j: Judge)=>j.id===jid)?.name.substring(0,3) || 'Jdg'}</div>
                                                <input type="number" inputMode="decimal" min="0" max="100" step="0.1" disabled={(isLocked && !isManager) || (isJudge && jid !== judgeId)} value={sp.marks[jid] ?? ''} onChange={e => handleMarkChange(sp.participantId, jid, e.target.value)} className={`w-full h-10 pl-10 pr-3 text-right font-black rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${(isLocked && !isManager) || (isJudge && jid !== judgeId) ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent' : 'bg-zinc-50 dark:bg-black/40 border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-300'}`} placeholder="--" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 bg-zinc-50/50 dark:bg-black/20 rounded-b-[1.2rem] border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {sp.rank > 0 && <div className={`flex items-center gap-1 px-2 py-1 rounded-md font-black text-[8px] uppercase tracking-widest shadow-md ${sp.rank === 1 ? 'bg-amber-400 text-amber-950' : sp.rank === 2 ? 'bg-slate-200 text-slate-700' : sp.rank === 3 ? 'bg-orange-200 text-orange-800' : ''}`}>Rank {sp.rank}</div>}
                                        {sp.grade && <div className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">Tier {sp.grade.name}</div>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">+{sp.totalPoints}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-24">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Scoring Terminal</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">Manage competition verdicts and global standings.</p>
                </div>
                <div className="flex items-center gap-3 pb-1">
                    <div className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Registry:</span>
                        <span className="ml-2 text-sm font-black text-amazio-primary dark:text-white tabular-nums">{filteredItems.length}</span>
                        <span className="ml-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Events</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map(item => (
                    <ResultCard 
                        key={item.id} item={item} result={state.results.find(r => r.itemId === item.id)}
                        status={state.results.find(r => r.itemId === item.id)?.status || ResultStatus.NOT_UPLOADED}
                        categoryName={state.categories.find(c => c.id === item.categoryId)?.name || 'N/A'}
                        onEdit={() => setSelectedItemId(item.id)}
                        onDeclare={!isJudge ? (item) => handleDeclare(item) : undefined}
                        onUpdateTally={!isJudge ? (item) => handlePushUpdate(item) : undefined}
                        onUnlock={!isJudge ? (item) => handleUnlock(item) : undefined}
                    />
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full py-16 sm:py-24 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] sm:rounded-[2rem] opacity-30"><Award size={48} sm:size={64} strokeWidth={1} className="mx-auto mb-4" /><p className="font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs">No matching events in queue</p></div>
                )}
            </div>
        </div>
    );
};

export default JudgementPage;
