
import { AlertTriangle, ArrowLeft, Award, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Edit3, Filter, LayoutGrid, Layers, ListPlus, Plus, Search, ShieldCheck, Tag, Trash2, User as UserIcon, Users as UsersIcon, X, MapPin, UserPlus, Info, Crown } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Card from '../components/Card';
import { useFirebase } from '../hooks/useFirebase';
import { Item, ItemType, Participant, Team, User, AppState } from '../types';
import { ItemFormModal, ParticipantFormModal } from './initialization/ItemsManagement';

// --- Visual Helpers ---

const getCategoryTheme = (name: string) => {
    if (!name) return { text: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-200' };
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const themes = [
        { text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800' },
        { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
        { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800' },
        { text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800' },
    ];
    return themes[hash % themes.length];
};

const getTeamColor = (name: string) => {
    if (!name) return 'bg-zinc-500';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500'];
    return colors[hash % colors.length];
};

// --- Modals ---

const ItemManagementModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    item: Item;
}> = ({ isOpen, onClose, item }) => {
    const { state, updateParticipant, updateMultipleParticipants } = useFirebase();
    const [search, setSearch] = useState('');

    if (!isOpen || !state) return null;

    const category = state.categories.find(c => c.id === item.categoryId);
    const isGeneralItem = category?.isGeneralCategory;
    
    // For SINGLE: item.maxParticipants is the number of individual slots a team can fill.
    // For GROUP: item.maxGroupsPerTeam is the number of groups, item.maxParticipants is the size of each group.
    const maxSlots = item.type === ItemType.GROUP ? (item.maxGroupsPerTeam || 1) : item.maxParticipants;
    const isGroup = item.type === ItemType.GROUP;

    const handleAssign = async (p: Participant, groupIndex: number) => {
        const newItemIds = Array.from(new Set([...p.itemIds, item.id]));
        const newItemGroups = { ...(p.itemGroups || {}), [item.id]: groupIndex };
        let updates: Participant[] = [{ ...p, itemIds: newItemIds, itemGroups: newItemGroups }];

        if (isGroup) {
            const teamParticipants = state.participants.filter(tp => tp.teamId === p.teamId && tp.itemIds.includes(item.id) && (tp.itemGroups?.[item.id] || 1) === groupIndex);
            const hasLeader = teamParticipants.some(tp => tp.groupLeaderItemIds?.includes(item.id));
            if (!hasLeader) {
                updates[0].groupLeaderItemIds = Array.from(new Set([...(p.groupLeaderItemIds || []), item.id]));
            }
        }

        await updateMultipleParticipants(updates);
    };

    const handleRemove = async (p: Participant) => {
        const newItemIds = p.itemIds.filter(id => id !== item.id);
        const newItemGroups = { ...(p.itemGroups || {}) };
        delete newItemGroups[item.id];
        
        const nextLeaders = (p.groupLeaderItemIds || []).filter(id => id !== item.id);
        const nextChests = { ...(p.groupChestNumbers || {}) };
        delete nextChests[item.id];

        await updateParticipant({ 
            ...p, 
            itemIds: newItemIds, 
            itemGroups: newItemGroups, 
            groupLeaderItemIds: nextLeaders,
            groupChestNumbers: nextChests
        });
    };

    const handleToggleLeader = async (targetParticipant: Participant, groupIndex: number) => {
        if (!isGroup) return;

        const members = state.participants.filter(p => 
            p.teamId === targetParticipant.teamId && 
            p.itemIds.includes(item.id) && 
            (p.itemGroups?.[item.id] || 1) === groupIndex
        );

        const updates: Participant[] = members.map(m => {
            const isTarget = m.id === targetParticipant.id;
            let currentLeaders = m.groupLeaderItemIds || [];
            let nextLeaders = isTarget 
                ? Array.from(new Set([...currentLeaders, item.id]))
                : currentLeaders.filter(id => id !== item.id);
            
            let nextChests = { ...(m.groupChestNumbers || {}) };
            if (!isTarget) delete nextChests[item.id];

            return { ...m, groupLeaderItemIds: nextLeaders, groupChestNumbers: nextChests };
        });

        await updateMultipleParticipants(updates);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="text-2xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{item.name}</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-400 mt-2 tracking-widest">{category?.name} • {item.type} • {item.performanceType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Team Matrix */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <UsersIcon size={14}/> Unit-Wise Slots
                            </h4>
                            <div className="space-y-4">
                                {state.teams.map(team => {
                                    const teamParticipants = state.participants.filter(p => p.teamId === team.id && p.itemIds.includes(item.id));
                                    
                                    return (
                                        <div key={team.id} className="p-5 rounded-3xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-2 h-4 rounded-full ${getTeamColor(team.name)}`}></div>
                                                <span className="text-xs font-black uppercase tracking-tight text-zinc-700 dark:text-zinc-300">{team.name}</span>
                                                <span className="text-[9px] font-bold text-zinc-400 ml-auto">{teamParticipants.length} Participants</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {Array.from({ length: maxSlots }).map((_, idx) => {
                                                    const groupIdx = idx + 1;
                                                    const assigned = teamParticipants.filter(p => (p.itemGroups?.[item.id] || 1) === groupIdx);
                                                    
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-zinc-100 dark:border-zinc-800">
                                                            <div className="flex justify-between items-center mb-2 px-1">
                                                                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                                                                    {isGroup ? `Group Slot ${groupIdx}` : `Participant Slot ${groupIdx}`}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-zinc-400">{assigned.length} / {isGroup ? item.maxParticipants : 1}</span>
                                                            </div>
                                                            {assigned.length > 0 ? (
                                                                <div className="space-y-1.5">
                                                                    {assigned.map(p => {
                                                                        const isLeader = p.groupLeaderItemIds?.includes(item.id);
                                                                        return (
                                                                            <div key={p.id} className={`flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border transition-all rounded-xl shadow-sm ${isLeader ? 'border-amber-400 ring-2 ring-amber-400/5' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    <span className="text-[10px] font-black font-mono text-indigo-500 shrink-0">#{p.chestNumber}</span>
                                                                                    <span className="text-xs font-bold truncate dark:text-zinc-200">{p.name}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {isGroup && (
                                                                                        <button 
                                                                                            onClick={() => handleToggleLeader(p, groupIdx)}
                                                                                            title={isLeader ? "Group Leader" : "Set as Leader"}
                                                                                            className={`p-1.5 rounded-lg transition-all ${isLeader ? 'text-amber-500 bg-amber-50' : 'text-zinc-300 hover:text-amber-400 hover:bg-amber-50/50'}`}
                                                                                        >
                                                                                            <Crown size={14} fill={isLeader ? "currentColor" : "none"} />
                                                                                        </button>
                                                                                    )}
                                                                                    <button onClick={() => handleRemove(p)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
                                                                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Available</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Assignable Participants */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <UserPlus size={14}/> Available Delegates
                            </h4>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or ID..." 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {state.participants
                                    .filter(p => (isGeneralItem || p.categoryId === item.categoryId) && !p.itemIds.includes(item.id))
                                    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.chestNumber.toLowerCase().includes(search.toLowerCase()))
                                    .sort((a,b) => a.chestNumber.localeCompare(b.chestNumber, undefined, {numeric: true}))
                                    .map(p => {
                                        const team = state.teams.find(t => t.id === p.teamId);
                                        
                                        return (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                                <div className="min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black font-mono text-zinc-400">#{p.chestNumber}</span>
                                                        <h5 className="text-sm font-black uppercase tracking-tight dark:text-white truncate">{p.name}</h5>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{team?.name}</p>
                                                </div>
                                                <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
                                                    {Array.from({ length: maxSlots }).map((_, i) => {
                                                        const gIdx = i + 1;
                                                        const teamParticipantsInSlot = state.participants.filter(tp => tp.teamId === p.teamId && tp.itemIds.includes(item.id) && (tp.itemGroups?.[item.id] || 1) === gIdx);
                                                        
                                                        // Capacity: 1 for Single Items, item.maxParticipants for Group Items
                                                        const slotCapacity = isGroup ? item.maxParticipants : 1;
                                                        const isSlotFull = teamParticipantsInSlot.length >= slotCapacity;

                                                        if (isSlotFull) return null;

                                                        return (
                                                            <button 
                                                                key={i}
                                                                onClick={() => handleAssign(p, gIdx)}
                                                                className="px-2 py-1 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                                            >
                                                                Add to S{gIdx}
                                                            </button>
                                                        );
                                                    })}
                                                    {state.participants.filter(tp => tp.teamId === p.teamId && tp.itemIds.includes(item.id)).length >= (isGroup ? (maxSlots * item.maxParticipants) : maxSlots) && (
                                                        <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-1 rounded">No Slots Available</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ParticipantManagementModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    participant: Participant;
}> = ({ isOpen, onClose, participant }) => {
    const { state, updateParticipant } = useFirebase();
    const [search, setSearch] = useState('');

    if (!isOpen || !state) return null;

    const team = state.teams.find(t => t.id === participant.teamId);
    const category = state.categories.find(c => c.id === participant.categoryId);
    const theme = getCategoryTheme(category?.name || '');
    const generalCategoryIds = useMemo(() => new Set(state.categories.filter(c => c.isGeneralCategory).map(c => c.id)), [state.categories]);

    const availableItems = useMemo(() => {
        return state.items
            .filter(i => i.categoryId === participant.categoryId || generalCategoryIds.has(i.categoryId))
            .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [state.items, participant.categoryId, generalCategoryIds, search]);

    const toggleEnrollment = async (item: Item) => {
        const isEnrolled = participant.itemIds.includes(item.id);
        if (isEnrolled) {
            const newItemIds = participant.itemIds.filter(id => id !== item.id);
            const newItemGroups = { ...(participant.itemGroups || {}) };
            delete newItemGroups[item.id];
            
            const nextLeaders = (participant.groupLeaderItemIds || []).filter(id => id !== item.id);
            const nextChests = { ...(participant.groupChestNumbers || {}) };
            delete nextChests[item.id];

            await updateParticipant({ 
                ...participant, 
                itemIds: newItemIds, 
                itemGroups: newItemGroups, 
                groupLeaderItemIds: nextLeaders,
                groupChestNumbers: nextChests
            });
        } else {
            // Addition: Identify the next free slot for this specific team/unit
            const isGroup = item.type === ItemType.GROUP;
            const maxSlots = isGroup ? (item.maxGroupsPerTeam || 1) : item.maxParticipants;
            const slotCapacity = isGroup ? item.maxParticipants : 1;
            
            const teamEnrolled = state.participants.filter(p => p.teamId === participant.teamId && p.itemIds.includes(item.id));
            
            let targetIdx = -1;
            for (let i = 1; i <= maxSlots; i++) {
                const occupants = teamEnrolled.filter(p => (p.itemGroups?.[item.id] || 1) === i);
                if (occupants.length < slotCapacity) {
                    targetIdx = i;
                    break;
                }
            }

            if (targetIdx === -1) {
                alert(`The unit "${team?.name}" has already occupied all available slots (${maxSlots}) for "${item.name}".`);
                return;
            }

            const newItemIds = [...participant.itemIds, item.id];
            const newItemGroups = { ...(participant.itemGroups || {}), [item.id]: targetIdx };
            
            const nextLeaders = [...(participant.groupLeaderItemIds || [])];
            if (isGroup) {
                const occupants = teamEnrolled.filter(p => (p.itemGroups?.[item.id] || 1) === targetIdx);
                if (occupants.length === 0) {
                    nextLeaders.push(item.id);
                }
            }

            await updateParticipant({ 
                ...participant, 
                itemIds: newItemIds, 
                itemGroups: newItemGroups,
                groupLeaderItemIds: nextLeaders
            });
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg ${getTeamColor(team?.name || '')}`}>
                            {participant.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{participant.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{team?.name}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${theme.border} ${theme.bg} ${theme.text}`}>{category?.name}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>

                <div className="p-8 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find items in assigned categories..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {availableItems.map(item => {
                                const isEnrolled = participant.itemIds.includes(item.id);
                                const itemCat = state.categories.find(c => c.id === item.categoryId);
                                const isGeneral = itemCat?.isGeneralCategory;
                                const teamEnrolled = state.participants.filter(p => p.teamId === participant.teamId && p.itemIds.includes(item.id));
                                
                                const isGroup = item.type === ItemType.GROUP;
                                const maxSlots = isGroup ? (item.maxGroupsPerTeam || 1) : item.maxParticipants;
                                const slotCapacity = isGroup ? item.maxParticipants : 1;
                                const totalCapacity = maxSlots * slotCapacity;
                                
                                const isFull = !isEnrolled && teamEnrolled.length >= totalCapacity;

                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => toggleEnrollment(item)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isEnrolled ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md' : isFull ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'}`}
                                    >
                                        <div className="min-w-0 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`font-black text-sm uppercase tracking-tight ${isEnrolled ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'}`}>{item.name}</div>
                                                {isGeneral && (
                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm bg-amber-500 text-white`}>General</span>
                                                )}
                                                {isFull && (
                                                    <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                                        <AlertTriangle size={8}/> Unit Limit Reached
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex gap-1">
                                                    <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-black/40 px-1.5 py-0.5 rounded">{item.type}</span>
                                                    <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-black/40 px-1.5 py-0.5 rounded">{item.performanceType}</span>
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${isFull ? 'text-rose-500' : 'text-zinc-400'}`}>
                                                    {teamEnrolled.length} / {totalCapacity} Individual Slots Filled
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isEnrolled ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : isFull ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                            {isEnrolled && <Check size={16} strokeWidth={4} />}
                                        </div>
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

// --- Views ---

const ItemEntryView: React.FC<{ onAddItem: () => void }> = ({ onAddItem }) => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const filteredItems = useMemo(() => {
        if (!state) return [];
        return state.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesCat = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const matchesPerf = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(item.performanceType) : true;
            return matchesSearch && matchesCat && matchesPerf;
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [state, globalSearchTerm, globalFilters]);

    if (!state) return null;

    return (
        <Card title="Enrollment by Events" action={
            <button 
                onClick={onAddItem}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
            >
                <Plus size={14} strokeWidth={3}/> New Event
            </button>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                    const category = state.categories.find(c => c.id === item.categoryId);
                    const theme = getCategoryTheme(category?.name || '');
                    const enrolledCount = state.participants.filter(p => p.itemIds.includes(item.id)).length;
                    
                    const isGroup = item.type === ItemType.GROUP;
                    const maxPossiblePerTeam = isGroup ? ((item.maxGroupsPerTeam || 1) * item.maxParticipants) : item.maxParticipants;
                    const maxPossible = state.teams.length * maxPossiblePerTeam;

                    return (
                        <div key={item.id} className="relative p-5 rounded-[2rem] border-2 border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] transition-all hover:border-indigo-500/20 group cursor-default text-zinc-900 dark:text-zinc-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${theme.border} ${theme.bg} ${theme.text}`}>{category?.name}</div>
                                    {category?.isGeneralCategory && (
                                        <span className="bg-amber-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">General</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setSelectedItem(item)}
                                    className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all hover:scale-110"
                                >
                                    <ListPlus size={18} />
                                </button>
                            </div>
                            <h4 className="font-black text-amazio-primary dark:text-white text-lg uppercase tracking-tight leading-tight mb-2 line-clamp-1">{item.name}</h4>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[9px] font-black uppercase text-zinc-400">{item.type}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                                <span className="text-[9px] font-black uppercase text-zinc-400">{item.performanceType}</span>
                            </div>
                            <div className="pt-4 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${enrolledCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-200'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{enrolledCount} / {maxPossible} Slots Filled</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedItem && <ItemManagementModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} />}
        </Card>
    );
};

const ParticipantEntryView: React.FC<{ onAddParticipant: () => void }> = ({ onAddParticipant }) => {
    const { state, globalSearchTerm, globalFilters } = useFirebase();
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

    const filteredParticipants = useMemo(() => {
        if (!state) return [];
        return state.participants.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
                                 p.chestNumber.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const matchesTeam = globalFilters.teamId.length > 0 ? globalFilters.teamId.includes(p.teamId) : true;
            const matchesCategory = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(p.categoryId) : true;
            return matchesSearch && matchesTeam && matchesCategory;
        }).sort((a,b) => a.chestNumber.localeCompare(b.chestNumber, undefined, {numeric: true}));
    }, [state, globalSearchTerm, globalFilters]);

    if (!state) return null;

    return (
        <Card title="Enrollment by Delegates" action={
            <button 
                onClick={onAddParticipant}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all active:scale-95"
            >
                <Plus size={14} strokeWidth={3}/> New Delegate
            </button>
        }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParticipants.map(p => {
                    const team = state.teams.find(t => t.id === p.teamId);
                    const category = state.categories.find(c => c.id === p.categoryId);
                    const theme = getCategoryTheme(category?.name || '');

                    return (
                        <div key={p.id} className="relative p-5 rounded-[2rem] border-2 border-zinc-100 dark:border-white/5 bg-white dark:bg-[#151816] transition-all hover:border-emerald-500/20 group cursor-default text-zinc-900 dark:text-zinc-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg ${getTeamColor(team?.name || '')}`}>{p.name.charAt(0)}</div>
                                    <div>
                                        <div className="text-[10px] font-black font-mono text-zinc-400">#{p.chestNumber}</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500 max-w-[100px] truncate">{team?.name}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedParticipant(p)}
                                    className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all hover:scale-110"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </div>
                            <h4 className="font-black text-amazio-primary dark:text-white text-lg uppercase tracking-tight leading-tight mb-2 truncate">{p.name}</h4>
                            <div className={`inline-block px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${theme.border} ${theme.bg} ${theme.text}`}>{category?.name}</div>
                            <div className="pt-4 mt-4 border-t border-zinc-50 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${p.itemIds.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-200'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{p.itemIds.length} Events Registry</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedParticipant && <ParticipantManagementModal isOpen={!!selectedParticipant} onClose={() => setSelectedParticipant(null)} participant={selectedParticipant} />}
        </Card>
    );
};

// --- Page Wrapper ---

const DataEntryPage: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
    const { dataEntryView: view } = useFirebase();
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);

    return (
        <div className="space-y-6 sm:space-y-10 pb-24 animate-in fade-in duration-700 relative">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Data Entry</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">Strategic enrollment and identity management.</p>
                </div>
            </div>

            <div className="space-y-10">
                {view === 'ITEMS' ? (
                    <div className="animate-in slide-in-from-left duration-500">
                        <ItemEntryView onAddItem={() => setIsItemModalOpen(true)} />
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right duration-500">
                        <ParticipantEntryView onAddParticipant={() => setIsParticipantModalOpen(true)} />
                    </div>
                )}
            </div>

            {/* Modals for creating new registry entries */}
            <ItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} editingItem={null} />
            <ParticipantFormModal isOpen={isParticipantModalOpen} onClose={() => setIsParticipantModalOpen(false)} editingParticipant={null} currentUser={currentUser} />
        </div>
    );
};

export default DataEntryPage;
