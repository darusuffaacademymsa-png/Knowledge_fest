import { AlertTriangle, ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle, ChevronDown, ChevronUp, Crown, Edit3, Filter, LayoutGrid, LayoutList, Layers, ListPlus, Mic, PenTool, Plus, RefreshCw, Save, Search, ShieldAlert, Sparkles, Tag, Trash2, User as UserIcon, Users as UsersIcon, X, Shield, MapPin, UserCheck, SortAsc, ClipboardList } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Card from '../components/Card';
import { useFirebase } from '../hooks/useFirebase';
import { Category, Item, ItemType, Participant, PerformanceType, Settings, User, UserRole } from '../types';

// --- VISUALIZERS & DETERMINISTIC COLORS ---

const getThemeColor = (str: string) => {
    if (!str) return { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', light: 'bg-zinc-50 dark:bg-zinc-900/30', shadow: 'shadow-zinc-500/10' };
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; 
    }
    const themes = [
        { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', light: 'bg-indigo-50 dark:bg-indigo-900/20', shadow: 'shadow-indigo-500/10' },
        { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', light: 'bg-emerald-50 dark:bg-indigo-900/20', shadow: 'shadow-emerald-500/10' },
        { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', light: 'bg-amber-50 dark:bg-amber-900/10', shadow: 'shadow-amber-500/10' },
        { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', light: 'bg-rose-50 dark:bg-rose-900/20', shadow: 'shadow-rose-500/10' },
        { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', light: 'bg-purple-50 dark:bg-fuchsia-900/20', shadow: 'shadow-purple-500/10' },
        { bg: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', light: 'bg-sky-50 dark:bg-sky-900/20', shadow: 'shadow-sky-500/10' },
        { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', light: 'bg-teal-50 dark:bg-teal-900/20', shadow: 'shadow-teal-500/10' },
        { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', light: 'bg-orange-50 dark:bg-orange-900/20', shadow: 'shadow-orange-500/10' },
    ];
    return themes[Math.abs(hash) % themes.length];
};

const TypeBadge = ({ type }: { type: ItemType }) => {
    const isGroup = type === ItemType.GROUP;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            isGroup 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' 
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
        }`}>
            {isGroup ? <UsersIcon size={10} className="mr-1.5"/> : <UserIcon size={10} className="mr-1.5"/>}
            {type}
        </span>
    );
};

// --- Limit Logic ---
const checkLimits = (
    participant: Participant, 
    newItem: Item | null, 
    allItems: Item[], 
    categories: Category[], 
    settings: Settings,
    pendingChanges?: { [itemId: string]: boolean } 
): string | null => {
    let currentItemIds = [...participant.itemIds];
    if (pendingChanges) {
        Object.entries(pendingChanges).forEach(([id, isAdded]) => {
            if (isAdded && !currentItemIds.includes(id)) currentItemIds.push(id);
            if (!isAdded && currentItemIds.includes(id)) currentItemIds = currentItemIds.filter(cid => cid !== id);
        });
    }
    if (newItem && !pendingChanges && !participant.itemIds.includes(newItem.id)) currentItemIds.push(newItem.id);
    const items = currentItemIds.map(id => allItems.find(i => i.id === id)).filter((i): i is Item => !!i);

    const globalOnStageCount = items.filter(i => i.performanceType === PerformanceType.ON_STAGE).length;
    const globalOffStageCount = items.filter(i => i.performanceType === PerformanceType.OFF_STAGE).length;
    const globalTotalCount = items.length;
    const globalTotalLimit = settings.maxTotalItemsPerParticipant;
    const globalOnLimit = settings.maxItemsPerParticipant.onStage;
    const globalOffLimit = settings.maxItemsPerParticipant.offStage;

    if (globalTotalLimit !== null && globalTotalLimit !== undefined && globalTotalCount > globalTotalLimit) return `Global total limit reached (${globalTotalLimit}).`;
    if (globalOnLimit !== undefined && globalOnStageCount > globalOnLimit) return `Global On-Stage limit reached (${globalOnLimit}).`;
    if (globalOffLimit !== undefined && globalOffStageCount > globalOffLimit) return `Global Off-Stage limit reached (${globalOffLimit}).`;

    const itemsPerCategory: Record<string, {on: number, off: number, total: number}> = {};
    items.forEach(i => {
        if (!itemsPerCategory[i.categoryId]) itemsPerCategory[i.categoryId] = {on: 0, off: 0, total: 0};
        itemsPerCategory[i.categoryId].total++;
        if (i.performanceType === PerformanceType.ON_STAGE) itemsPerCategory[i.categoryId].on++;
        else itemsPerCategory[i.categoryId].off++;
    });

    for (const catId in itemsPerCategory) {
        const cat = categories.find(c => c.id === catId);
        if (!cat) continue;
        const counts = itemsPerCategory[catId];
        if (cat.maxCombined !== undefined && cat.maxCombined !== null && counts.total > cat.maxCombined) return `${cat.name}: Combined limit reached (${cat.maxCombined}).`;
        if (cat.maxOnStage !== undefined && cat.maxOnStage !== null && counts.on > cat.maxOnStage) return `${cat.name}: On-stage limit reached (${cat.maxOnStage}).`;
        if (cat.maxOffStage !== undefined && cat.maxOffStage !== null && counts.off > cat.maxOffStage) return `${cat.name}: Off-stage limit reached (${cat.maxOffStage}).`;
    }
    return null;
};

// --- MODALS ---

const ItemEnrollmentModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    item: Item; 
    groupIndex: number;
}> = ({ isOpen, onClose, item, groupIndex }) => {
    const { state, updateMultipleParticipants, globalFilters } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [newlySelectedIds, setNewlySelectedIds] = useState<Set<string>>(new Set());
    const [idsToRemove, setIdsToRemove] = useState<Set<string>>(new Set());
    const [leadershipChanges, setLeadershipChanges] = useState<{ [participantId: string]: boolean }>({});
    const [pendingGroupChestNumbers, setPendingGroupChestNumbers] = useState<{ [participantId: string]: string }>({});

    useEffect(() => { 
        if (isOpen) {
            setNewlySelectedIds(new Set()); 
            setIdsToRemove(new Set()); 
            setLeadershipChanges({}); 
            setPendingGroupChestNumbers({}); 
            setSearchQuery('');
        }
    }, [isOpen, item, groupIndex]);

    const eligibleParticipants = useMemo(() => {
        if (!state || !item) return [];
        const itemCategory = state.categories.find(c => c.id === item.categoryId);
        return state.participants.filter(p => {
            if (globalFilters.teamId.length > 0 && !globalFilters.teamId.includes(p.teamId)) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!p.name.toLowerCase().includes(query) && !p.chestNumber.toLowerCase().includes(query)) return false;
            }
            if (itemCategory?.isGeneralCategory) return true; 
            return p.categoryId === item.categoryId;
        }).sort((a,b) => {
             const aEnrolled = a.itemIds.includes(item.id);
             const bEnrolled = b.itemIds.includes(item.id);
             if (aEnrolled !== bEnrolled) return aEnrolled ? -1 : 1;
             return a.chestNumber.localeCompare(b.chestNumber, 'en', { numeric: true });
        });
    }, [state, item, globalFilters.teamId, searchQuery]);

    const validationStatus = useMemo(() => {
        if (!item || !state) return { isValid: true, warnings: [] };
        const warnings: string[] = []; let isValid = true; const teamCounts: {[teamId: string]: number} = {}; const teamLeaders: {[teamId: string]: number} = {};
        state.participants.forEach(p => {
            const isAlreadyEnrolled = p.itemIds.includes(item.id);
            const isNewlySelected = newlySelectedIds.has(p.id);
            const isMarkedForRemoval = idsToRemove.has(p.id);
            let isActive = false;
            if (isNewlySelected) isActive = true;
            else if (isAlreadyEnrolled) { if (isMarkedForRemoval) isActive = false; else { if (item.type === ItemType.SINGLE) isActive = true; else { if ((p.itemGroups?.[item.id] || 1) === groupIndex) isActive = true; } } }
            if (isActive) {
                teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
                const isLeaderInDB = p.groupLeaderItemIds?.includes(item.id);
                const override = leadershipChanges[p.id];
                if (override !== undefined ? override : isLeaderInDB) teamLeaders[p.teamId] = (teamLeaders[p.teamId] || 0) + 1;
                const error = checkLimits(p, isNewlySelected ? item : null, state.items, state.categories, state.settings);
                if (error) { warnings.push(`${p.name}: ${error}`); if (isNewlySelected) isValid = false; }
            }
        });
        Object.entries(teamCounts).forEach(([teamId, count]) => {
            const teamName = state.teams.find(t => t.id === teamId)?.name || 'Unknown Team';
            if (count > item.maxParticipants) { warnings.push(`${teamName}: ${count}/${item.maxParticipants} (Exceeded)`); isValid = false; }
            if (item.type === ItemType.GROUP && count > 0) {
                const leaderCount = teamLeaders[teamId] || 0;
                if (leaderCount === 0) { warnings.push(`${teamName}: No leader selected.`); isValid = false; }
                else if (leaderCount > 1) { warnings.push(`${teamName}: Multiple leaders selected (${leaderCount}).`); isValid = false; }
            }
        });
        return { isValid, warnings, teamCounts };
    }, [state, item, newlySelectedIds, groupIndex, idsToRemove, leadershipChanges]);

    const handleToggleParticipant = (participantId: string, isAlreadyEnrolled: boolean, enrolledGroupIndex?: number) => {
        if (isAlreadyEnrolled && enrolledGroupIndex && enrolledGroupIndex !== groupIndex) { alert(`Already enrolled in Group ${enrolledGroupIndex}.`); return; }
        if (isAlreadyEnrolled) setIdsToRemove(prev => { const n = new Set(prev); if (n.has(participantId)) n.delete(participantId); else n.add(participantId); return n; });
        else setNewlySelectedIds(prev => { const n = new Set(prev); if (n.has(participantId)) n.delete(participantId); else n.add(participantId); return n; });
    };

    const handleSave = async () => {
        if (!state || !item) return; const participantsToUpdate: Participant[] = []; const processedIds = new Set<string>();
        const allIds = new Set([...newlySelectedIds, ...idsToRemove, ...Object.keys(leadershipChanges), ...Object.keys(pendingGroupChestNumbers)]);
        allIds.forEach(id => {
            if (processedIds.has(id)) return; const p = state.participants.find(part => part.id === id); if (!p) return;
            let newItemIds = [...p.itemIds]; let newItemGroups = { ...p.itemGroups };
            if (newlySelectedIds.has(id)) { if (!newItemIds.includes(item.id)) newItemIds.push(item.id); newItemGroups[item.id] = groupIndex; }
            else if (idsToRemove.has(id)) { newItemIds = newItemIds.filter(iid => iid !== item.id); delete newItemGroups[item.id]; }
            let newLeaderIds = [...(p.groupLeaderItemIds || [])]; const leadershipOverride = leadershipChanges[id]; const willBeEnrolled = (p.itemIds.includes(item.id) && !idsToRemove.has(id)) || newlySelectedIds.has(id);
            if (willBeEnrolled) { if (leadershipOverride === true) { if (!newLeaderIds.includes(item.id)) newLeaderIds.push(item.id); } else if (leadershipOverride === false) newLeaderIds = newLeaderIds.filter(lid => lid !== item.id); }
            else newLeaderIds = newLeaderIds.filter(lid => lid !== item.id);
            let newGroupChestNumbers = { ...(p.groupChestNumbers || {}) };
            if (willBeEnrolled && pendingGroupChestNumbers[id] !== undefined) newGroupChestNumbers[item.id] = pendingGroupChestNumbers[id]; else if (!willBeEnrolled) delete newGroupChestNumbers[item.id];
            participantsToUpdate.push({ ...p, itemIds: newItemIds, itemGroups: newItemGroups, groupLeaderItemIds: newLeaderIds, groupChestNumbers: newGroupChestNumbers }); processedIds.add(id);
        });
        if (participantsToUpdate.length > 0) await updateMultipleParticipants(participantsToUpdate);
        onClose();
    };

    if (!isOpen || !state) return null;
    const categoryName = state.categories.find(c => c.id === item.categoryId)?.name || 'N/A';
    const catTheme = getThemeColor(categoryName);
    const { isValid, warnings } = validationStatus;
    const pendingCount = newlySelectedIds.size + idsToRemove.size + Object.keys(leadershipChanges).length + Object.keys(pendingGroupChestNumbers).length;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] rounded-[2.5rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className={`p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center shrink-0 ${catTheme.light}`}>
                    <div>
                        <h3 className="font-serif font-black text-2xl text-amazio-primary dark:text-white uppercase tracking-tighter leading-none mb-1">{item.name}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${catTheme.text}`}>{categoryName} • Group {groupIndex}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><X size={24} className="text-zinc-400" /></button>
                </div>

                <div className="p-6 bg-zinc-50/50 dark:bg-black/20 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 shadow-inner">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input type="text" placeholder="Find delegates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-none ring-1 ring-zinc-200 dark:ring-white/10 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amazio-secondary/30 transition-all"/>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{pendingCount} Changes Pending</div>
                        <button onClick={handleSave} disabled={pendingCount === 0 || !isValid} className={`px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all flex items-center gap-2 ${pendingCount === 0 || !isValid ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : 'bg-amazio-primary text-white hover:scale-105 active:scale-95 shadow-amazio-primary/20'}`}><Save size={16}/> Apply Changes</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    {warnings.length > 0 && <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-[10px] rounded-2xl border border-rose-100 dark:border-rose-900/30 space-y-1 font-black uppercase tracking-wider animate-in slide-in-from-top-2"><div className="flex items-center gap-2 mb-1"><AlertTriangle size={14}/> Validation Notices:</div>{warnings.map((w,i)=><div key={i} className="pl-5">• {w}</div>)}</div>}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {eligibleParticipants.map(p => {
                            const isEnrolled = p.itemIds.includes(item.id); const isActive = newlySelectedIds.has(p.id) || (isEnrolled && !idsToRemove.has(p.id));
                            const isLeader = leadershipChanges[p.id] !== undefined ? leadershipChanges[p.id] : (isEnrolled && p.groupLeaderItemIds?.includes(item.id));
                            const teamTheme = getThemeColor(state.teams.find(t => t.id === p.teamId)?.name || '');
                            return (
                                <div key={p.id} onClick={() => handleToggleParticipant(p.id, isEnrolled, p.itemGroups?.[item.id])} className={`p-4 rounded-3xl border-2 cursor-pointer flex justify-between items-start transition-all duration-300 ${isActive ? `${teamTheme.border} ${teamTheme.light} shadow-md scale-[1.01]` : 'bg-white dark:bg-[#151816] border-zinc-100 dark:border-white/5 hover:border-zinc-200'}`}>
                                    <div className="min-w-0 pr-2">
                                        <p className={`font-black text-sm uppercase tracking-tight truncate ${isActive ? 'text-amazio-primary dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {p.name} {p.place && <span className="opacity-50 font-medium text-[0.8em]">, {p.place}</span>}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${isActive ? teamTheme.bg + ' text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>#{p.chestNumber}</span>
                                            {isActive && <CheckCircle size={10} className={teamTheme.text} />}
                                        </div>
                                    </div>
                                    {isActive && item.type === ItemType.GROUP && (
                                        <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setLeadershipChanges(prev => ({ ...prev, [p.id]: !isLeader }))} className={`p-2 rounded-xl transition-all ${isLeader ? 'bg-amber-400 text-white shadow-md' : 'text-zinc-300 bg-white dark:bg-zinc-800 border'}`} title="Mark as Leader"><Crown size={14}/></button>
                                            {isLeader && <input type="text" placeholder="ID" value={pendingGroupChestNumbers[p.id] || p.groupChestNumbers?.[item.id] || ''} onChange={(e) => setPendingGroupChestNumbers(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-12 p-1 text-[10px] border border-amber-200 rounded-lg text-center font-bold"/>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ParticipantEnrollmentModal: React.FC<{ isOpen: boolean; onClose: () => void; participant: Participant; }> = ({ isOpen, onClose, participant }) => {
    const { state, updateParticipant } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(participant.itemIds));
    const [error, setError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'ASSIGNED' | 'ALL' | 'OWN' | 'GENERAL'>('ASSIGNED');

    useEffect(() => { if(isOpen) setSelectedItemIds(new Set(participant.itemIds)); setSearchQuery(''); setFilterMode('ASSIGNED'); }, [isOpen, participant]);

    const validateSelections = (newSet: Set<string>) => {
        if (!state) return null;
        const tempParticipant = { ...participant, itemIds: Array.from(newSet) };
        return checkLimits(tempParticipant, null, state.items, state.categories, state.settings);
    };

    const handleToggle = (itemId: string) => {
        setError(null);
        const newSet = new Set<string>(selectedItemIds);
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        const validationError = validateSelections(newSet);
        if (validationError) { setError(validationError); return; }
        setSelectedItemIds(newSet);
    };

    const handleSave = async () => {
        const validationError = validateSelections(selectedItemIds);
        if (validationError) { setError(validationError); return; }
        await updateParticipant({ ...participant, itemIds: Array.from(selectedItemIds) });
        onClose();
    };

    const eligibleItems = useMemo(() => {
        if (!state) return [];
        return state.items.filter(i => {
            if (i.type === ItemType.GROUP) return false;
            if (filterMode === 'ASSIGNED') return participant.itemIds.includes(i.id) && i.name.toLowerCase().includes(searchQuery.toLowerCase());
            const itemCat = state.categories.find(c => c.id === i.categoryId);
            const isOwn = i.categoryId === participant.categoryId;
            const isGeneral = itemCat?.isGeneralCategory;
            if (!isOwn && !isGeneral) return false;
            if (filterMode === 'OWN' && !isOwn) return false;
            if (filterMode === 'GENERAL' && !isGeneral) return false;
            return i.name.toLowerCase().includes(searchQuery.toLowerCase());
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [state, participant, searchQuery, filterMode]);

    if (!isOpen || !state) return null;
    const participantCategory = state.categories.find(c => c.id === participant.categoryId);
    const catTheme = getThemeColor(participantCategory?.name || '');

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className={`p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center shrink-0 ${catTheme.light}`}>
                    <div>
                        <h3 className="font-serif font-black text-2xl text-amazio-primary dark:text-white uppercase tracking-tighter leading-none mb-1">{participant.name}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${catTheme.text}`}>#{participant.chestNumber} • {participantCategory?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><X size={24} className="text-zinc-400" /></button>
                </div>
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900/50 shrink-0 space-y-4 shadow-inner">
                    <div className="flex gap-3">
                        <div className="relative flex-grow"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" /><input type="text" placeholder="Find items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-black/40 border-none ring-1 ring-zinc-200 dark:ring-white/10 text-sm font-bold transition-all shadow-inner"/></div>
                        <div className="relative"><select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="appearance-none pl-4 pr-10 py-3 rounded-2xl bg-zinc-50 dark:bg-black/40 border-none ring-1 ring-zinc-200 dark:ring-white/10 text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 h-full"><option value="ASSIGNED">Assigned Only</option><option value="ALL">All Eligible</option><option value="OWN">Own</option><option value="GENERAL">General</option></select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" /></div>
                    </div>
                    {error && <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-100 dark:border-rose-900/30 shadow-sm flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
                </div>
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-zinc-50/50 dark:bg-black/20">
                    <div className="grid grid-cols-1 gap-2">
                        {eligibleItems.map(item => {
                            const isSelected = selectedItemIds.has(item.id);
                            const itemTheme = getThemeColor(state.categories.find(c => c.id === item.categoryId)?.name || '');
                            return (
                                <div key={item.id} onClick={() => handleToggle(item.id)} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${isSelected ? `${itemTheme.border} ${itemTheme.light} shadow-md scale-[1.01]` : 'bg-white dark:bg-white/[0.02] border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'}`}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected ? `${itemTheme.bg} border-transparent` : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}>{isSelected && <Check size={16} className="text-white" strokeWidth={4} />}</div>
                                        <div className="min-w-0"><div className={`text-sm font-black uppercase tracking-tight truncate ${isSelected ? itemTheme.text : 'text-amazio-primary dark:text-zinc-200'}`}>{item.name}</div><div className="flex items-center gap-2 mt-1"><span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{item.type}</span><span className="text-zinc-400 opacity-40">•</span><span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{item.performanceType}</span></div></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0"><div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{selectedItemIds.size} Enrolled</div><button onClick={handleSave} className="px-8 py-4 bg-amazio-primary text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-amazio-primary/20 transition-all hover:scale-105 active:scale-95">Apply Registry</button></div>
            </div>
        </div>,
        document.body
    );
};

// --- SECTION VIEWS ---

const ItemEntryView: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const [selectedItemAndGroup, setSelectedItemAndGroup] = useState<{item: Item, groupIndex: number} | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'type'>('name');

    const displayItems = useMemo(() => {
        if (!state) return [];
        let items = state.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesCat = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const matchesPerf = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(item.performanceType) : true;
            return matchesSearch && matchesCat && matchesPerf;
        });

        const list: { item: Item, groupIndex: number, key: string, displayName: string, categoryName: string, enrollCount: number }[] = [];
        items.forEach(item => {
            const maxGroups = item.type === ItemType.GROUP ? (item.maxGroupsPerTeam || 1) : 1;
            const categoryName = state.categories.find(c => c.id === item.categoryId)?.name || 'N/A';
            const enrolledParticipants = state.participants.filter(p => p.itemIds.includes(item.id));
            for (let i = 1; i <= maxGroups; i++) {
                const groupParticipants = enrolledParticipants.filter(p => (p.itemGroups?.[item.id] || 1) === i);
                list.push({ item, groupIndex: i, key: `${item.id}_${i}`, displayName: maxGroups > 1 ? `${item.name} (G${i})` : item.name, categoryName, enrollCount: groupParticipants.length });
            }
        });

        return list.sort((a, b) => {
            if (sortBy === 'name') return a.displayName.localeCompare(b.displayName);
            if (sortBy === 'category') return a.categoryName.localeCompare(b.categoryName);
            if (sortBy === 'type') return a.item.type.localeCompare(b.item.type);
            return 0;
        });
    }, [state, globalSearchTerm, globalFilters, sortBy]);

    if (!state) return null;

    return (
        <Card title="By Items" action={
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-black/40 rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                    <ClipboardList size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{displayItems.length} Items</span>
                </div>
            </div>
        }>
            <div className="space-y-6">
                <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar border-b border-zinc-50 dark:border-zinc-800">
                    <div className="flex items-center gap-2 px-2 shrink-0">
                        <SortAsc size={14} className="text-zinc-400" />
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Sort:</span>
                    </div>
                    {[
                        { id: 'name', label: 'Title' },
                        { id: 'category', label: 'Category' },
                        { id: 'type', label: 'Type' }
                    ].map(opt => (
                        <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${sortBy === opt.id ? 'bg-amazio-primary text-white shadow-md' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-700'}`}>{opt.label}</button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayItems.map(di => {
                        const catTheme = getThemeColor(di.categoryName);
                        return (
                            <div key={di.key} className="p-5 rounded-[2rem] border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] transition-all group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${catTheme.border} ${catTheme.light} ${catTheme.text}`}>{di.categoryName}</div>
                                        <button 
                                            onClick={() => setSelectedItemAndGroup({item: di.item, groupIndex: di.groupIndex})} 
                                            className="p-2 rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-amazio-secondary hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                    </div>
                                    <h4 className="font-black text-amazio-primary dark:text-white text-lg uppercase tracking-tight truncate leading-tight mb-2">{di.displayName}</h4>
                                    <div className="flex items-center gap-3"><TypeBadge type={di.item.type} /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{di.item.performanceType}</span></div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${di.enrollCount > 0 ? 'bg-indigo-500 shadow-glow' : 'bg-zinc-200'}`}></span>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{di.enrollCount} Assigned</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedItemAndGroup && (
                <ItemEnrollmentModal 
                    isOpen={!!selectedItemAndGroup} 
                    onClose={() => setSelectedItemAndGroup(null)} 
                    item={selectedItemAndGroup.item}
                    groupIndex={selectedItemAndGroup.groupIndex}
                />
            )}
        </Card>
    );
};

const ParticipantEntryView: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [sortBy, setSortBy] = useState<'chest' | 'name' | 'category' | 'team'>('chest');

    const filteredParticipants = useMemo(() => {
        if (!state) return [];
        let list = state.participants.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                                 p.chestNumber.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesTeam = globalFilters.teamId.length > 0 ? globalFilters.teamId.includes(p.teamId) : true;
            const matchesCategory = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(p.categoryId) : true;
            return matchesSearch && matchesTeam && matchesCategory;
        });

        return list.sort((a, b) => {
            if (sortBy === 'chest') return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true });
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'category') {
                const catA = state.categories.find(c => c.id === a.categoryId)?.name || '';
                const catB = state.categories.find(c => c.id === b.categoryId)?.name || '';
                return catA.localeCompare(catB);
            }
            if (sortBy === 'team') {
                const teamA = state.teams.find(t => t.id === a.teamId)?.name || '';
                const teamB = state.teams.find(t => t.id === b.teamId)?.name || '';
                return teamA.localeCompare(teamB);
            }
            return 0;
        });
    }, [state, globalSearchTerm, globalFilters, sortBy]);

    if (!state) return null;

    return (
        <Card title="By Participants" action={
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-black/40 rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                    <UsersIcon size={14} className="text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{state.participants.length} Census</span>
                </div>
            </div>
        }>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2 border-b border-zinc-50 dark:border-zinc-800">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                        <div className="flex items-center gap-2 px-2 shrink-0">
                            <SortAsc size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Sort:</span>
                        </div>
                        {[
                            { id: 'chest', label: 'ID/Reg#' },
                            { id: 'name', label: 'Name' },
                            { id: 'category', label: 'Category' },
                            { id: 'team', label: 'Team' }
                        ].map(opt => (
                            <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${sortBy === opt.id ? 'bg-amazio-primary text-white shadow-md' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'}`}>{opt.label}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredParticipants.map(p => {
                        const teamName = state.teams.find(t => t.id === p.teamId)?.name || 'N/A';
                        const categoryName = state.categories.find(c => c.id === p.categoryId)?.name || 'N/A';
                        const teamTheme = getThemeColor(teamName);
                        return (
                            <div key={p.id} className="p-5 rounded-[2rem] border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] hover:border-amazio-secondary/30 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${teamTheme.bg} text-white`}>#{p.chestNumber}</div>
                                    <button 
                                        onClick={() => setSelectedParticipant(p)}
                                        className="p-2 rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-400 group-hover:text-amazio-secondary transition-colors"
                                    >
                                        <ListPlus size={18} />
                                    </button>
                                </div>
                                <div className="mb-1"><h4 className="font-black text-amazio-primary dark:text-white text-lg uppercase tracking-tight truncate leading-tight">{p.name}</h4>{p.place && <div className="flex items-center gap-1 mt-0.5 text-zinc-500 dark:text-zinc-400"><MapPin size={10} className="shrink-0" /><span className="text-[10px] font-bold uppercase tracking-widest truncate italic">{p.place}</span></div>}</div>
                                <div className="flex flex-wrap gap-2 mt-3"><span className={`text-[10px] font-bold uppercase tracking-wide ${teamTheme.text}`}>{teamName}</span><span className="text-zinc-300">•</span><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{categoryName}</span></div>
                                <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between"><div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${p.itemIds.length > 0 ? 'bg-emerald-500 shadow-glow' : 'bg-zinc-200'}`}></span><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{p.itemIds.length} Items</span></div></div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedParticipant && <ParticipantEnrollmentModal isOpen={!!selectedParticipant} onClose={() => setSelectedParticipant(null)} participant={selectedParticipant} />}
        </Card>
    );
};

// --- PAGE WRAPPER ---

const DataEntryPage: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
    const { dataEntryView: view } = useFirebase();

    return (
        <div className="space-y-6 md:space-y-10 pb-24 animate-in fade-in duration-700 relative">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Data Entry</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">Manage registry and enrollments.</p>
                </div>
            </div>

            {view === 'ITEMS' ? (
                <div className="animate-in slide-in-from-left duration-500">
                    <ItemEntryView currentUser={currentUser} />
                </div>
            ) : (
                <div className="animate-in slide-in-from-right duration-500">
                    <ParticipantEntryView currentUser={currentUser} />
                </div>
            )}
        </div>
    );
};

export default DataEntryPage;