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
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest border ${
            isGroup 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' 
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
        }`}>
            {isGroup ? <UsersIcon size={8} className="mr-1 sm:mr-1.5"/> : <UserIcon size={8} className="mr-1 sm:mr-1.5"/>}
            {type}
        </span>
    );
};

// --- Modals ---

/* FIX: Added ItemEnrollmentModal to resolve "Cannot find name" error */
const ItemEnrollmentModal: React.FC<{ isOpen: boolean; onClose: () => void; item: Item; groupIndex: number }> = ({ isOpen, onClose, item, groupIndex }) => {
    const { state, updateParticipant } = useFirebase();
    const [search, setSearch] = useState('');

    if (!isOpen || !state) return null;

    const enrolledParticipants = state.participants.filter(p => 
        p.itemIds.includes(item.id) && (p.itemGroups?.[item.id] || 1) === groupIndex
    );

    const availableParticipants = state.participants.filter(p => 
        p.categoryId === item.categoryId && 
        (!p.itemIds.includes(item.id) || (p.itemGroups?.[item.id] || 1) !== groupIndex)
    );

    const filteredAvailable = availableParticipants.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.chestNumber.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (p: Participant) => {
        const newItemIds = [...p.itemIds, item.id];
        const newItemGroups = { ...(p.itemGroups || {}), [item.id]: groupIndex };
        await updateParticipant({ ...p, itemIds: newItemIds, itemGroups: newItemGroups });
    };

    const handleRemove = async (p: Participant) => {
        const newItemIds = p.itemIds.filter(id => id !== item.id);
        const newItemGroups = { ...(p.itemGroups || {}) };
        delete newItemGroups[item.id];
        await updateParticipant({ ...p, itemIds: newItemIds, itemGroups: newItemGroups });
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">Enrollment: {item.name} {item.type === ItemType.GROUP ? `(Group ${groupIndex})` : ''}</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">Assign Participants</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>
                <div className="p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Enrolled ({enrolledParticipants.length})</h4>
                        <div className="space-y-2">
                            {enrolledParticipants.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">{p.chestNumber}</div>
                                        <span className="font-bold text-sm dark:text-zinc-200">{p.name}</span>
                                    </div>
                                    <button onClick={() => handleRemove(p)} className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input type="text" placeholder="Find available participants..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredAvailable.map(p => (
                                <button key={p.id} onClick={() => handleAdd(p)} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-all text-left">
                                    <div className="min-w-0">
                                        <div className="font-bold text-xs truncate dark:text-zinc-300">{p.name}</div>
                                        <div className="text-[10px] text-zinc-400">#{p.chestNumber}</div>
                                    </div>
                                    <Plus size={16} className="text-emerald-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* FIX: Added ParticipantEnrollmentModal to resolve "Cannot find name" error */
const ParticipantEnrollmentModal: React.FC<{ isOpen: boolean; onClose: () => void; participant: Participant }> = ({ isOpen, onClose, participant }) => {
    const { state, updateParticipant } = useFirebase();
    const [search, setSearch] = useState('');

    if (!isOpen || !state) return null;

    const availableItems = state.items.filter(i => i.categoryId === participant.categoryId);
    const filteredItems = availableItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    const toggleEnrollment = async (item: Item) => {
        const isEnrolled = participant.itemIds.includes(item.id);
        let newItemIds: string[];
        let newItemGroups = { ...(participant.itemGroups || {}) };

        if (isEnrolled) {
            newItemIds = participant.itemIds.filter(id => id !== item.id);
            delete newItemGroups[item.id];
        } else {
            newItemIds = [...participant.itemIds, item.id];
            newItemGroups[item.id] = 1; // Default to Group 1
        }
        await updateParticipant({ ...participant, itemIds: newItemIds, itemGroups: newItemGroups });
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{participant.name}</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">Enrollment Portfolio</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>
                <div className="p-6 bg-zinc-50 dark:bg-black/20 flex items-center gap-4">
                     <div className="px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase text-indigo-500">#{participant.chestNumber}</div>
                     <div className="px-3 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase text-zinc-500">{state.categories.find(c => c.id === participant.categoryId)?.name}</div>
                </div>
                <div className="p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input type="text" placeholder="Find items..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {filteredItems.map(item => {
                            const isEnrolled = participant.itemIds.includes(item.id);
                            return (
                                <button key={item.id} onClick={() => toggleEnrollment(item)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isEnrolled ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                                    <div>
                                        <div className={`font-black text-sm uppercase tracking-tight ${isEnrolled ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{item.name}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-50 dark:bg-black/20 px-1 rounded">{item.type}</span>
                                            <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-50 dark:bg-black/20 px-1 rounded">{item.performanceType}</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isEnrolled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                        {isEnrolled && <Check size={16} strokeWidth={4} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Views ---

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
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-zinc-100 dark:bg-black/40 rounded-lg sm:rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                    <ClipboardList size={10} sm:size={14} className="text-zinc-400" />
                    <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{displayItems.length}</span>
                </div>
            </div>
        }>
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full pb-1.5 no-scrollbar border-b border-zinc-50 dark:border-zinc-800">
                    {[ { id: 'name', label: 'Title' }, { id: 'category', label: 'Cat' }, { id: 'type', label: 'Type' } ].map(opt => (
                        <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase transition-all shrink-0 ${sortBy === opt.id ? 'bg-amazio-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>{opt.label}</button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {displayItems.map(di => {
                        const catTheme = getThemeColor(di.categoryName);
                        return (
                            <div key={di.key} className="p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2 sm:mb-4">
                                        <div className={`px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-widest border ${catTheme.border} ${catTheme.light} ${catTheme.text}`}>{di.categoryName}</div>
                                        <button onClick={() => setSelectedItemAndGroup({item: di.item, groupIndex: di.groupIndex})} className="p-1.5 rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-400 hover:text-amazio-secondary transition-colors"><Edit3 size={16} /></button>
                                    </div>
                                    <h4 className="font-black text-amazio-primary dark:text-white text-base sm:text-lg uppercase tracking-tight truncate leading-tight mb-1.5 sm:mb-2">{di.displayName}</h4>
                                    <div className="flex items-center gap-2 sm:gap-3"><TypeBadge type={di.item.type} /><span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{di.item.performanceType}</span></div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${di.enrollCount > 0 ? 'bg-indigo-500 shadow-glow' : 'bg-zinc-200'}`}></span>
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{di.enrollCount} Assigned</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedItemAndGroup && (
                <ItemEnrollmentModal isOpen={!!selectedItemAndGroup} onClose={() => setSelectedItemAndGroup(null)} item={selectedItemAndGroup.item} groupIndex={selectedItemAndGroup.groupIndex} />
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
        <Card title="By Delegates" action={
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-zinc-100 dark:bg-black/40 rounded-lg sm:rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                <UsersIcon size={10} sm:size={14} className="text-zinc-400" />
                <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{state.participants.length}</span>
            </div>
        }>
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full pb-1.5 no-scrollbar border-b border-zinc-50 dark:border-zinc-800">
                    {[ { id: 'chest', label: 'ID' }, { id: 'name', label: 'Name' }, { id: 'team', label: 'Team' } ].map(opt => (
                        <button key={opt.id} onClick={() => setSortBy(opt.id as any)} className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase transition-all shrink-0 ${sortBy === opt.id ? 'bg-amazio-primary text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>{opt.label}</button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredParticipants.map(p => {
                        const teamName = state.teams.find(t => t.id === p.teamId)?.name || 'N/A';
                        const categoryName = state.categories.find(c => c.id === p.categoryId)?.name || 'N/A';
                        const teamTheme = getThemeColor(teamName);
                        return (
                            <div key={p.id} className="p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] border border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] hover:border-amazio-secondary/30 transition-all group">
                                <div className="flex justify-between items-start mb-2 sm:mb-4">
                                    <div className={`px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-widest ${teamTheme.bg} text-white`}>#{p.chestNumber}</div>
                                    <button onClick={() => setSelectedParticipant(p)} className="p-1.5 rounded-lg bg-zinc-50 dark:bg-white/5 text-zinc-400 group-hover:text-amazio-secondary transition-colors"><ListPlus size={16} /></button>
                                </div>
                                <div className="mb-1"><h4 className="font-black text-amazio-primary dark:text-white text-base sm:text-lg uppercase tracking-tight truncate leading-tight">{p.name}</h4>{p.place && <div className="flex items-center gap-1 mt-0.5 text-zinc-500"><MapPin size={9} /><span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest truncate italic">{p.place}</span></div>}</div>
                                <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-3"><span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wide ${teamTheme.text}`}>{teamName}</span><span className="text-zinc-300">•</span><span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{categoryName}</span></div>
                                <div className="mt-4 pt-3 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between"><div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${p.itemIds.length > 0 ? 'bg-emerald-500 shadow-glow' : 'bg-zinc-200'}`}></span><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{p.itemIds.length} Items</span></div></div>
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
        <div className="space-y-4 sm:space-y-10 pb-24 animate-in fade-in duration-700 relative">
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