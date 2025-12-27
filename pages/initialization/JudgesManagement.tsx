import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Card from '../../components/Card';
import { useFirebase } from '../../hooks/useFirebase';
import { 
    Search, ChevronDown, Check, X, User, Gavel, Plus, 
    Trash2, Edit2, CheckCircle2, UserPlus, ListFilter,
    Shield, Briefcase, Save, ArrowRightLeft, LayoutGrid, Layers, FileText,
    Trophy, Activity, Sparkles, RefreshCw, AlertTriangle, Clock, UserCheck, ShieldCheck,
    MapPin
} from 'lucide-react';
import { Judge, Item, ItemType, PerformanceType, JudgeAssignment } from '../../types';

// --- Color Palette & Helpers ---
const ART_FEST_PALETTE = {
    ON_STAGE: '#006994',
    OFF_STAGE: '#80deea',
    SINGLE: '#d4a574',
    GROUP: '#1b5e20'
};

const getCategoryColor = (name: string) => {
    if (!name) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#006994', '#d4a574', '#1b5e20', '#80deea'];
    return colors[Math.abs(hash) % colors.length];
};

const getAvatarTheme = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
        { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
        { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
        { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
        { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
        { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
        { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
        { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
        { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
        { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
        { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
        { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
        { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
        { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
        { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    ];
    return colors[Math.abs(hash) % colors.length];
};

// --- Judge Form Modal ---

interface JudgeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Judge;
    onSave: (data: Omit<Judge, 'id'>) => Promise<void>;
}

const JudgeFormModal: React.FC<JudgeFormModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
    const [name, setName] = useState('');
    const [place, setPlace] = useState('');
    const [profession, setProfession] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setPlace(initialData?.place || '');
            setProfession(initialData?.profession || '');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        await onSave({ name, place, profession });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{initialData ? 'Edit Official' : 'Add Official'}</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">Judicial Registry</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Full Identity</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Full Name" 
                            className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 text-sm font-bold outline-none focus:ring-2 focus:ring-amazio-primary/20 transition-all"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Location</label>
                            <input 
                                type="text" 
                                value={place} 
                                onChange={e => setPlace(e.target.value)} 
                                placeholder="Home Town / City" 
                                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 text-sm font-bold outline-none focus:ring-2 focus:ring-amazio-primary/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Profession</label>
                            <input 
                                type="text" 
                                value={profession} 
                                onChange={e => setProfession(e.target.value)} 
                                placeholder="Designation" 
                                className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 text-sm font-bold outline-none focus:ring-2 focus:ring-amazio-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-7 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amazio-primary transition-colors">Discard</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={!name.trim() || isSaving}
                        className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${name.trim() ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'}`}
                    >
                        {isSaving ? 'Saving...' : 'Save Official'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Selection Modal Component ---

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    mode: 'BY_ITEM' | 'BY_JUDGE';
    primaryId: string;
    secondaryList: any[];
    pendingSelections: Set<string>;
    onToggle: (id: string) => void;
    onSave: () => Promise<void>;
    isSaving: boolean;
    isDirty: boolean;
    state: any;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ 
    isOpen, onClose, title, subtitle, mode, primaryId, 
    secondaryList, pendingSelections, onToggle, onSave, 
    isSaving, isDirty, state 
}) => {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    // Filter and Sort List
    const filteredAndSortedList = useMemo(() => {
        const q = search.toLowerCase();
        return secondaryList
            .filter(entity => entity.name.toLowerCase().includes(q))
            .sort((a, b) => {
                const aSelected = pendingSelections.has(a.id) ? 1 : 0;
                const bSelected = pendingSelections.has(b.id) ? 1 : 0;
                if (aSelected !== bSelected) return bSelected - aSelected;
                return a.name.localeCompare(b.name);
            });
    }, [secondaryList, pendingSelections, search]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            {mode === 'BY_ITEM' ? <Layers size={24} /> : <User size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{title}</h3>
                            {subtitle && <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>

                {/* Local Search in Modal */}
                <div className="px-8 pt-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Search ${mode === 'BY_ITEM' ? 'Judges' : 'Items'}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 pt-6 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredAndSortedList.map(entity => {
                            const isSelected = pendingSelections.has(entity.id);
                            const isJudgeEntity = mode === 'BY_ITEM'; 
                            
                            return (
                                <div 
                                    key={entity.id}
                                    onClick={() => onToggle(entity.id)}
                                    className={`flex items-center justify-between p-4 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-500 shadow-md scale-[1.02]' : 'bg-white dark:bg-[#151816] border-zinc-50 dark:border-white/5 hover:border-zinc-200 dark:hover:border-zinc-800'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                            {mode === 'BY_ITEM' ? <User size={18}/> : <FileText size={18}/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`text-sm font-black uppercase tracking-tight truncate ${isSelected ? 'text-amazio-primary dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>{entity.name}</div>
                                            {isJudgeEntity && entity.place && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <MapPin size={9} className="text-zinc-400" />
                                                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                                                        {entity.place}
                                                    </div>
                                                </div>
                                            )}
                                            {mode === 'BY_JUDGE' && (
                                                <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5 truncate">
                                                    {state.categories.find((c: any) => c.id === entity.categoryId)?.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-indigo-600 border-transparent shadow-lg' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900'}`}>
                                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredAndSortedList.length === 0 && (
                            <div className="col-span-full py-12 text-center opacity-30 italic text-xs uppercase font-bold">No matches found</div>
                        )}
                    </div>
                </div>

                <div className="p-7 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amazio-primary transition-colors">Discard</button>
                    <button 
                        onClick={onSave} 
                        disabled={!isDirty || isSaving}
                        className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isDirty ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'}`}
                    >
                        {isSaving ? 'Saving...' : 'Confirm Assignments'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Selection Card Component ---

const SelectableCard: React.FC<{ 
    title: string; 
    item?: Item;
    subtitle?: string; 
    location?: string; 
    isActive: boolean; 
    count: number; 
    onClick: () => void;
    state: any;
}> = ({ title, item, subtitle, location, isActive, count, onClick, state }) => {
    const catName = item ? state.categories.find((c: any) => c.id === item.categoryId)?.name : '';
    const catColor = getCategoryColor(catName);
    const theme = !item ? getAvatarTheme(title) : null;

    return (
        <div 
            onClick={onClick}
            className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer group flex flex-col justify-between ${isActive ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-[1.03] z-10' : 'bg-white dark:bg-[#121412] border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-zinc-800'}`}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    {item ? (
                        <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all" style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
                            {catName}
                        </div>
                    ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg ${theme?.bg}`}>
                            {title.charAt(0)}
                        </div>
                    )}
                    <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg border text-[9px] font-black tracking-widest transition-all whitespace-nowrap ${count > 0 ? (isActive ? 'bg-white/20 text-white border-white/30' : 'bg-[#2B3B2A] text-white border-[#2B3B2A] shadow-sm') : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                        {count > 0 ? <UserCheck size={11} strokeWidth={3} /> : <Clock size={11} strokeWidth={3} />}
                        {count > 0 ? `${count} Assigned` : 'Unassigned'}
                    </div>
                </div>
                
                <div>
                    <h3 className={`text-xl font-black uppercase tracking-tight leading-tight transition-colors ${isActive ? 'text-white' : 'text-amazio-primary dark:text-zinc-100'}`}>
                        {title}
                    </h3>
                    {(subtitle || location) && (
                        <div className={`mt-1 flex flex-col gap-0.5 ${isActive ? 'text-indigo-200' : 'text-zinc-500'}`}>
                            {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>}
                            {location && (
                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                                    <MapPin size={10} /> {location}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {item && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-white/10 text-white border-white/20' : ''}`} style={!isActive ? { backgroundColor: item.type === ItemType.SINGLE ? ART_FEST_PALETTE.SINGLE + '15' : ART_FEST_PALETTE.GROUP + '15', color: item.type === ItemType.SINGLE ? ART_FEST_PALETTE.SINGLE : ART_FEST_PALETTE.GROUP, borderColor: item.type === ItemType.SINGLE ? ART_FEST_PALETTE.SINGLE + '30' : ART_FEST_PALETTE.GROUP + '30' } : {}}>
                            {item.type}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-white/10 text-white border-white/20' : ''}`} style={!isActive ? { backgroundColor: item.performanceType === PerformanceType.ON_STAGE ? ART_FEST_PALETTE.ON_STAGE + '15' : ART_FEST_PALETTE.OFF_STAGE + '15', color: item.performanceType === PerformanceType.ON_STAGE ? ART_FEST_PALETTE.ON_STAGE : ART_FEST_PALETTE.OFF_STAGE, borderColor: item.performanceType === PerformanceType.ON_STAGE ? ART_FEST_PALETTE.ON_STAGE + '30' : ART_FEST_PALETTE.OFF_STAGE + '30' } : {}}>
                            {item.performanceType}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---

const JudgesManagement: React.FC = () => {
    const { 
        state, addJudge, updateJudge, deleteMultipleJudges, 
        setJudgeAssignments, judgesSubView: view, 
        globalSearchTerm, globalFilters 
    } = useFirebase();

    const [assignmentMode, setAssignmentMode] = useState<'BY_ITEM' | 'BY_JUDGE'>('BY_ITEM');
    const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | null>(null);
    const [pendingSelections, setPendingSelections] = useState<Set<string>>(new Set());
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRegistryIds, setSelectedRegistryIds] = useState<Set<string>>(new Set());
    const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
    const [isEditingJudge, setIsEditingJudge] = useState<string | null>(null);

    const judges = useMemo(() => state?.judges || [], [state?.judges]);
    const items = useMemo(() => state?.items || [], [state?.items]);

    const assignmentMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        const validJudgeIds = new Set(judges.map(j => j.id));
        state?.judgeAssignments.forEach(ja => {
            const currentItemJudges = new Set<string>();
            ja.judgeIds.forEach(jid => { if (validJudgeIds.has(jid)) currentItemJudges.add(jid); });
            if (currentItemJudges.size > 0) map.set(ja.itemId, currentItemJudges);
        });
        return map;
    }, [state?.judgeAssignments, judges]);

    const totalAssignedItemsCount = useMemo(() => {
        return items.filter(i => (assignmentMap.get(i.id)?.size || 0) > 0).length;
    }, [items, assignmentMap]);

    useEffect(() => {
        if (selectedPrimaryId) {
            const initialSet = new Set<string>();
            if (assignmentMode === 'BY_ITEM') {
                const assigned = assignmentMap.get(selectedPrimaryId);
                if (assigned) assigned.forEach(jid => initialSet.add(jid));
            } else {
                items.forEach(item => {
                    const assignedJudges = assignmentMap.get(item.id);
                    if (assignedJudges && assignedJudges.has(selectedPrimaryId)) initialSet.add(item.id);
                });
            }
            setPendingSelections(initialSet);
            setIsDirty(false);
        } else {
            setPendingSelections(new Set());
            setIsDirty(false);
        }
    }, [selectedPrimaryId, assignmentMode, assignmentMap, items]);

    const filteredPrimaryList = useMemo(() => {
        const q = globalSearchTerm.toLowerCase();
        const cats = globalFilters.categoryId;
        const perfs = globalFilters.performanceType;

        if (assignmentMode === 'BY_ITEM') {
            return items.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(q);
                const matchesCat = cats.length > 0 ? cats.includes(item.categoryId) : true;
                const matchesPerf = perfs.length > 0 ? perfs.includes(item.performanceType) : true;
                return matchesSearch && matchesCat && matchesPerf;
            }).sort((a,b) => a.name.localeCompare(b.name));
        } else {
            return judges.filter(judge => judge.name.toLowerCase().includes(q)).sort((a,b) => a.name.localeCompare(b.name));
        }
    }, [items, judges, assignmentMode, globalSearchTerm, globalFilters]);

    const handleToggleSelection = (id: string) => {
        setPendingSelections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
        setIsDirty(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedPrimaryId || !state) return;
        setIsSaving(true);
        try {
            const newAssignments: JudgeAssignment[] = [];
            const processedItemIds = new Set<string>();

            if (assignmentMode === 'BY_ITEM') {
                // Updating list of judges for one item
                const targetItem = items.find(i => i.id === selectedPrimaryId);
                if (!targetItem) throw new Error("Item not found");

                // Process target item
                // Explicitly cast to string[] to resolve 'unknown[]' assignment error
                const targetJudgeIds = Array.from(pendingSelections) as string[];
                if (targetJudgeIds.length > 0) {
                    newAssignments.push({ id: `${targetItem.id}-${targetItem.categoryId}`, itemId: targetItem.id, categoryId: targetItem.categoryId, judgeIds: targetJudgeIds });
                }
                processedItemIds.add(targetItem.id);

                // Preserve other items
                state.judgeAssignments.forEach(ja => {
                    if (!processedItemIds.has(ja.itemId)) newAssignments.push(ja);
                });
            } else {
                // Updating list of items for one judge
                const judgeId = selectedPrimaryId;
                
                // Construct mapping from scratch for all items
                items.forEach(item => {
                    // Explicitly define Set type to avoid 'unknown' inference during assignment
                    const currentJudges = new Set<string>(assignmentMap.get(item.id) || []);
                    if (pendingSelections.has(item.id)) {
                        currentJudges.add(judgeId);
                    } else {
                        currentJudges.delete(judgeId);
                    }

                    if (currentJudges.size > 0) {
                        // Explicitly cast to string[] to resolve 'unknown[]' assignment error
                        newAssignments.push({ id: `${item.id}-${item.categoryId}`, itemId: item.id, categoryId: item.categoryId, judgeIds: Array.from(currentJudges) as string[] });
                    }
                });
            }

            await setJudgeAssignments(newAssignments);
            setIsDirty(false);
            setSelectedPrimaryId(null);
        } catch (error) { console.error(error); alert("Failed to save changes."); }
        finally { setIsSaving(false); }
    };

    const handleSaveJudge = async (data: Omit<Judge, 'id'>) => {
        if (isEditingJudge) await updateJudge({ id: isEditingJudge, ...data });
        else await addJudge(data);
        setIsEditingJudge(null);
        setIsJudgeModalOpen(false);
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-24 relative">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Judges & Assignments</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">Adjudicator orchestration terminal.</p>
                </div>
            </div>

            {view === 'ASSIGNMENTS' && (
                <div className="animate-in slide-in-from-right duration-500 space-y-8">
                    <div className="flex justify-between items-center bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-amazio-primary/5 dark:border-white/5 p-6 rounded-[2.5rem] shadow-glass-light dark:shadow-2xl">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">Coverage Hub</h3>
                                <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">{totalAssignedItemsCount} Items Adjudicated</p>
                            </div>
                         </div>
                         <div className="flex gap-1.5 p-1 bg-amazio-light-bg dark:bg-black/40 rounded-full border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                            <button onClick={() => { setAssignmentMode('BY_ITEM'); setSelectedPrimaryId(null); }} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full transition-all ${assignmentMode === 'BY_ITEM' ? 'bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>By Item</button>
                            <button onClick={() => { setAssignmentMode('BY_JUDGE'); setSelectedPrimaryId(null); }} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-full transition-all ${assignmentMode === 'BY_JUDGE' ? 'bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}>By Judge</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrimaryList.map(entity => {
                            const isActive = selectedPrimaryId === entity.id;
                            const item = (assignmentMode === 'BY_ITEM') ? entity as Item : undefined;
                            const judge = !item ? entity as Judge : undefined;
                            
                            let count = 0;
                            if (assignmentMode === 'BY_ITEM') count = assignmentMap.get(entity.id)?.size || 0;
                            else assignmentMap.forEach(judges => { if(judges.has(entity.id)) count++; });

                            return (
                                <SelectableCard 
                                    key={entity.id} 
                                    title={entity.name} 
                                    item={item}
                                    subtitle={judge?.profession}
                                    location={judge?.place}
                                    isActive={isActive} 
                                    count={count} 
                                    onClick={() => setSelectedPrimaryId(entity.id)} 
                                    state={state}
                                />
                            );
                        })}
                        {filteredPrimaryList.length === 0 && (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30">
                                <Search size={64} strokeWidth={1} />
                                <p className="font-black uppercase tracking-[0.3em] text-xs mt-4">No matching scope found</p>
                            </div>
                        )}
                    </div>

                    {selectedPrimaryId && (
                        <AssignmentModal 
                            isOpen={!!selectedPrimaryId}
                            onClose={() => setSelectedPrimaryId(null)}
                            title={assignmentMode === 'BY_ITEM' ? items.find(i=>i.id===selectedPrimaryId)?.name || 'Assign Judges' : judges.find(j=>j.id===selectedPrimaryId)?.name || 'Assign Items'}
                            subtitle={assignmentMode === 'BY_ITEM' ? state.categories.find(c=>c.id === items.find(i=>i.id===selectedPrimaryId)?.categoryId)?.name : 'Judge Record'}
                            mode={assignmentMode}
                            primaryId={selectedPrimaryId}
                            secondaryList={assignmentMode === 'BY_ITEM' ? judges : items}
                            pendingSelections={pendingSelections}
                            onToggle={handleToggleSelection}
                            onSave={handleSaveChanges}
                            isSaving={isSaving}
                            isDirty={isDirty}
                            state={state}
                        />
                    )}
                </div>
            )}

            {view === 'REGISTRY' && (
                <div className="animate-in slide-in-from-left duration-500">
                    <Card title="Official Registry" action={
                        <div className="flex gap-2">
                            {selectedRegistryIds.size > 0 && (
                                <button 
                                    onClick={() => { if(confirm(`Purge ${selectedRegistryIds.size} records?`)) { deleteMultipleJudges(Array.from(selectedRegistryIds)); setSelectedRegistryIds(new Set()); } }} 
                                    className="bg-rose-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={12}/> Delete ({selectedRegistryIds.size})
                                </button>
                            )}
                            <button 
                                onClick={() => { setIsEditingJudge(null); setIsJudgeModalOpen(true); }}
                                className="bg-amazio-primary text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amazio-primary/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={12} strokeWidth={3}/> New Official
                            </button>
                        </div>
                    }>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {judges.map(j => {
                                const theme = getAvatarTheme(j.name);
                                const isSelected = selectedRegistryIds.has(j.id);
                                return (
                                    <div 
                                        key={j.id} 
                                        onClick={() => setSelectedRegistryIds(prev => { const n = new Set(prev); if(n.has(j.id)) n.delete(j.id); else n.add(j.id); return n; })}
                                        className={`group relative p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer flex flex-col gap-4 ${isSelected ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-lg hover:-translate-y-1'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${theme.bg} ${theme.text}`}>
                                                {j.name.charAt(0)}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsEditingJudge(j.id); setIsJudgeModalOpen(true); }} 
                                                    className="p-2 rounded-xl text-zinc-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    <Edit2 size={16}/>
                                                </button>
                                                {isSelected && <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-md"><Check size={16} strokeWidth={3}/></div>}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-amazio-primary dark:text-white leading-tight truncate">{j.name}</h3>
                                            {j.profession && (
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 mt-1 truncate">{j.profession}</p>
                                            )}
                                        </div>
                                        {j.place && (
                                            <div className="pt-4 mt-auto border-t border-zinc-100 dark:border-white/5 flex items-center gap-2 text-zinc-400">
                                                <MapPin size={14} />
                                                <span className="text-xs font-bold uppercase tracking-wide truncate">{j.place}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {judges.length === 0 && (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
                                    <User size={48} strokeWidth={1} className="mb-4"/>
                                    <p className="font-black uppercase tracking-[0.3em] text-xs">Registry Empty</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <JudgeFormModal 
                isOpen={isJudgeModalOpen} 
                onClose={() => setIsJudgeModalOpen(false)} 
                initialData={isEditingJudge ? judges.find(j => j.id === isEditingJudge) : undefined}
                onSave={handleSaveJudge}
            />
        </div>
    );
};

export default JudgesManagement;
