import { AlertTriangle, ArrowRight, CheckCircle, ChevronDown, ChevronUp, ClipboardList, Clock, Edit2, FileDown, Image as ImageIcon, LayoutList, Layers, MapPin, Plus, RefreshCw, Save, Search, ShieldAlert, Sparkles, Tag, Trash2, Upload, UserPlus, Users, User as UserIcon, X, XCircle, BookOpen, Mic, PenTool, Hash, Info, ListTree, PackageSearch, Settings2, CheckSquare, Square, Check, Contact, Crown, ShieldCheck } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Card from '../../components/Card';
import { useFirebase } from '../../hooks/useFirebase';
import { Category, Item, ItemType, Participant, PerformanceType, User, UserRole, Team, AppState } from '../../types';

// --- Constants & Palette ---

const ART_FEST_PALETTE = {
  BLUE: '#006994',
  GOLD: '#d4a574',
  GREEN: '#1b5e20',
  CYAN: '#80deea'
};

const STANDARD_ITEM_TEMPLATES = [
  { name: 'Elocution', description: 'Public speaking competition', type: ItemType.SINGLE, performanceType: PerformanceType.ON_STAGE, medium: 'English/Malayalam', duration: 5, maxParticipants: 1, maxGroupsPerTeam: 1 },
  { name: 'Pencil Drawing', description: 'Artistic sketch competition', type: ItemType.SINGLE, performanceType: PerformanceType.OFF_STAGE, medium: 'Pencil', duration: 60, maxParticipants: 1, maxGroupsPerTeam: 1 },
  { name: 'Group Song', description: 'Vocals music in group', type: ItemType.GROUP, performanceType: PerformanceType.ON_STAGE, medium: 'Vocals', duration: 7, maxParticipants: 7, maxGroupsPerTeam: 1 },
  { name: 'Essay Writing', description: 'Creative writing competition', type: ItemType.SINGLE, performanceType: PerformanceType.OFF_STAGE, medium: 'English/Malayalam', duration: 45, maxParticipants: 1, maxGroupsPerTeam: 1 },
  { name: 'Duffmuttu', description: 'Traditional group performance', type: ItemType.GROUP, performanceType: PerformanceType.ON_STAGE, medium: 'Duff', duration: 10, maxParticipants: 10, maxGroupsPerTeam: 1 },
];

// --- Types for Sorting ---

type ItemSortKey = 'name' | 'type' | 'performance' | 'category' | 'duration' | 'maxParticipants';
type ParticipantSortKey = 'chestNumber' | 'name' | 'team' | 'category';

// --- Utils ---

const getThemeColor = (str: string) => {
    if (!str) return { bg: 'bg-zinc-500', text: 'text-zinc-600', border: 'border-zinc-200', light: 'bg-zinc-50 dark:bg-zinc-900/30', hex: '#71717a' };
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; 
    }
    const themes = [
        { hex: ART_FEST_PALETTE.BLUE, text: 'text-[#006994]', border: 'border-[#006994]', light: 'bg-[#006994]/10' },
        { hex: ART_FEST_PALETTE.GOLD, text: 'text-[#d4a574]', border: 'border-[#d4a574]', light: 'bg-[#d4a574]/10' },
        { hex: ART_FEST_PALETTE.GREEN, text: 'text-[#1b5e20]', border: 'border-[#1b5e20]', light: 'bg-[#1b5e20]/10' },
        { hex: ART_FEST_PALETTE.CYAN, text: 'text-[#80deea]', border: 'border-[#80deea]', light: 'bg-[#80deea]/10' },
    ];
    return themes[Math.abs(hash) % themes.length];
};

// --- Styled Components ---

const SortButton = <T extends string>({ label, sortKey, currentSortKey, currentSortDir, onSort }: { 
    label: string, 
    sortKey: T, 
    currentSortKey: string,
    currentSortDir: 'asc' | 'desc',
    onSort: (key: T) => void 
}) => (
  <button 
    onClick={() => onSort(sortKey)}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
      currentSortKey === sortKey 
      ? 'bg-amazio-primary text-white border-amazio-primary shadow-md' 
      : 'bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-amazio-primary'
    }`}
  >
    {label}
    <div className="flex flex-col space-y-[1px]">
        <ChevronUp size={8} className={`${currentSortKey === sortKey && currentSortDir === 'asc' ? 'text-white' : 'text-zinc-400'}`} />
        <ChevronDown size={8} className={`${currentSortKey === sortKey && currentSortDir === 'desc' ? 'text-white' : 'text-zinc-400'} -mt-[2px]`} />
    </div>
  </button>
);

const TypeBadge = ({ type }: { type: ItemType }) => {
    const isGroup = type === ItemType.GROUP;
    const color = isGroup ? ART_FEST_PALETTE.GREEN : ART_FEST_PALETTE.GOLD;
    return (
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors"
          style={{ backgroundColor: `${color}10`, color: color, borderColor: `${color}30` }}
        >
            {isGroup ? <Users size={10} className="mr-1.5"/> : <UserIcon size={10} className="mr-1.5"/>}
            {type}
        </span>
    );
};

const PerformanceBadge = ({ type }: { type: PerformanceType }) => {
    const isOnStage = type === PerformanceType.ON_STAGE;
    const color = isOnStage ? ART_FEST_PALETTE.BLUE : ART_FEST_PALETTE.CYAN;
    return (
        <span 
          className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
          style={{ backgroundColor: `${color}10`, color: color, borderColor: `${color}30` }}
        >
          {type}
        </span>
    );
};

// --- MODALS ---

const ItemFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    editingItem: Item | null; 
}> = ({ isOpen, onClose, editingItem }) => {
    const { state, addItem, updateItem } = useFirebase();
    const [formData, setFormData] = useState<Partial<Item>>({
        name: '', description: '', categoryId: '', type: ItemType.SINGLE,
        performanceType: PerformanceType.ON_STAGE, maxParticipants: 1, maxGroupsPerTeam: 1, duration: 5,
        medium: 'Any', points: { first: 5, second: 3, third: 1 }
    });

    useEffect(() => {
        if (editingItem) setFormData(editingItem);
        else setFormData({
            name: '', description: '', categoryId: '', type: ItemType.SINGLE,
            performanceType: PerformanceType.ON_STAGE, maxParticipants: 1, maxGroupsPerTeam: 1, duration: 5,
            medium: 'Any', points: { first: 5, second: 3, third: 1 }
        });
    }, [editingItem, isOpen]);

    if (!isOpen || !state) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.categoryId) return alert("Please fill Title and Category.");
        if (editingItem) await updateItem(formData as Item);
        else await addItem(formData as Omit<Item, 'id'>);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="font-serif font-black text-2xl text-amazio-primary dark:text-white uppercase tracking-tighter leading-none">{editingItem ? 'Edit Entry' : 'Add New Item'}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">Configure competition scope</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><X size={24} className="text-zinc-400" /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Item Title</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. English Elocution" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Category</label>
                            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none appearance-none">
                                <option value="">Select Level</option>
                                {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Medium</label>
                            <input value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. English" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Type</label>
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ItemType, maxParticipants: e.target.value === ItemType.SINGLE ? 1 : 7})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none">
                                <option value={ItemType.SINGLE}>Single</option>
                                <option value={ItemType.GROUP}>Group</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Venue</label>
                            <select value={formData.performanceType} onChange={e => setFormData({...formData, performanceType: e.target.value as PerformanceType})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none">
                                <option value={PerformanceType.ON_STAGE}>On-Stage</option>
                                <option value={PerformanceType.OFF_STAGE}>Off-Stage</option>
                            </select>
                        </div>

                        <div className="bg-zinc-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Duration (Min)</label>
                                <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: +e.target.value})} className="w-20 p-2 bg-white dark:bg-zinc-900 border rounded-xl text-center font-black" />
                            </div>
                            {formData.type === ItemType.SINGLE ? (
                                <div className="flex justify-between items-center animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#d4a574]">Max Participants (Per Team)</label>
                                    <input type="number" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: +e.target.value})} className="w-20 p-2 bg-white dark:bg-zinc-900 border border-[#d4a574]/20 rounded-xl text-center font-black text-[#d4a574]" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Teams Slots</label>
                                        <input type="number" value={formData.maxGroupsPerTeam} onChange={e => setFormData({...formData, maxGroupsPerTeam: +e.target.value})} className="w-20 p-2 bg-white dark:bg-zinc-900 border rounded-xl text-center font-black" />
                                    </div>
                                    <div className="flex justify-between items-center animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1b5e20]">Group Size</label>
                                        <input type="number" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: +e.target.value})} className="w-20 p-2 bg-white dark:bg-zinc-900 border border-[#1b5e20]/20 rounded-xl text-center font-black text-[#1b5e20]" />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-zinc-50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Point Weightage</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <span className="block text-[8px] font-black uppercase text-[#d4a574] mb-1 text-center">1st</span>
                                    <input type="number" value={formData.points?.first} onChange={e => setFormData({...formData, points: {...formData.points!, first: +e.target.value}})} className="w-full p-2 bg-white dark:bg-zinc-900 border rounded-xl text-center font-bold" />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-[8px] font-black uppercase text-slate-500 mb-1 text-center">2nd</span>
                                    <input type="number" value={formData.points?.second} onChange={e => setFormData({...formData, points: {...formData.points!, second: +e.target.value}})} className="w-full p-2 bg-white dark:bg-zinc-900 border rounded-xl text-center font-bold" />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-[8px] font-black uppercase text-orange-600 mb-1 text-center">3rd</span>
                                    <input type="number" value={formData.points?.third} onChange={e => setFormData({...formData, points: {...formData.points!, third: +e.target.value}})} className="w-full p-2 bg-white dark:bg-zinc-900 border rounded-xl text-center font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Description</label>
                            <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none" placeholder="Detailed rules or context..." />
                        </div>
                    </div>
                </div>

                <div className="p-7 border-t border-zinc-100 dark:border-white/5 flex justify-end gap-4 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <button onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amazio-primary transition-colors">Discard</button>
                    <button onClick={handleSave} className="px-10 py-4 bg-amazio-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amazio-primary/20 hover:scale-105 active:scale-95 transition-all">Save Registry</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ParticipantFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    editingParticipant: Participant | null;
    currentUser: User | null;
}> = ({ isOpen, onClose, editingParticipant, currentUser }) => {
    const { state, addParticipant, updateParticipant } = useFirebase();
    const [formData, setFormData] = useState<Partial<Participant>>({
        name: '', chestNumber: '', teamId: '', categoryId: '', itemIds: []
    });

    useEffect(() => {
        if (editingParticipant) setFormData(editingParticipant);
        else setFormData({
            name: '', chestNumber: '', teamId: '', categoryId: '', itemIds: []
        });
    }, [editingParticipant, isOpen]);

    if (!isOpen || !state) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.teamId || !formData.categoryId) return alert("Please fill Name, Team and Category.");
        if (editingParticipant) await updateParticipant(formData as Participant);
        else await addParticipant(formData as Omit<Participant, 'id'>);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="font-serif font-black text-2xl text-amazio-primary dark:text-white uppercase tracking-tighter leading-none">{editingParticipant ? 'Edit Profile' : 'Register Delegate'}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">Manage individual identity</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><X size={24} className="text-zinc-400" /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Full Name</label>
                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. John Doe" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Chest Number / ID</label>
                            <input value={formData.chestNumber} onChange={e => setFormData({...formData, chestNumber: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. 101" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Place / Location</label>
                            <input value={formData.place || ''} onChange={e => setFormData({...formData, place: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Malappuram" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Team / House</label>
                                <select value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none appearance-none">
                                    <option value="">Select Team</option>
                                    {state.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Level / Category</label>
                                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none appearance-none">
                                    <option value="">Select Level</option>
                                    {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-7 border-t border-zinc-100 dark:border-white/5 flex justify-end gap-4 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <button onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amazio-primary transition-colors">Discard</button>
                    <button onClick={handleSave} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amazio-primary/20 hover:scale-105 active:scale-95 transition-all">Save Profile</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Main Components ---

const ItemsManagement: React.FC = () => {
    const { state, currentUser, deleteMultipleItems, deleteMultipleParticipants, globalFilters, globalSearchTerm, itemsSubView: activeTab } = useFirebase();
    
    // Items State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    
    const [itemSort, setItemSort] = useState<{ 
        sortKey: ItemSortKey;
        dir: 'asc' | 'desc';
    }>({ sortKey: 'name', dir: 'asc' });
    
    // Participants State
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
    
    const [participantSort, setParticipantSort] = useState<{ 
        sortKey: ParticipantSortKey;
        dir: 'asc' | 'desc';
    }>({ sortKey: 'chestNumber', dir: 'asc' });

    // Touch & Long Press Logic for Mobile
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressActive = useRef(false);
    const touchStartPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    const handleTouchStart = useCallback((id: string, type: 'ITEM' | 'PARTICIPANT', e: React.TouchEvent) => {
        if (window.innerWidth >= 768) return;
        
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        hasMoved.current = false;
        isLongPressActive.current = false;

        longPressTimer.current = setTimeout(() => {
            if (hasMoved.current) return;
            isLongPressActive.current = true;
            const updateSet = type === 'ITEM' ? setSelectedItems : setSelectedParticipants;
            updateSet(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        
        // Threshold of 10px to distinguish between a tap and a scroll
        if (dx > 10 || dy > 10) {
            hasMoved.current = true;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    }, []);

    const handleTouchEnd = useCallback((id: string, type: 'ITEM' | 'PARTICIPANT') => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // If it was a short tap (not a long press and not a scroll)
        if (window.innerWidth < 768 && !isLongPressActive.current && !hasMoved.current) {
            const updateSet = type === 'ITEM' ? setSelectedItems : setSelectedParticipants;
            
            // Refined Logic: Tapping anywhere on the card toggles selection ONLY IF at least one item is already selected.
            updateSet(prev => {
                if (prev.size === 0) return prev; 
                
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        }
    }, []);

    const handleRegistryClick = useCallback((id: string, type: 'ITEM' | 'PARTICIPANT') => {
        // Desktop only: standard click toggles selection
        if (window.innerWidth >= 768) {
            const updateSet = type === 'ITEM' ? setSelectedItems : setSelectedParticipants;
            updateSet(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        }
    }, []);

    // --- Items Logic ---
    const filteredAndSortedItems = useMemo<Item[]>(() => {
        const s = state;
        if (!s) return [];
        
        const { sortKey, dir } = itemSort;
        const multiplier = dir === 'asc' ? 1 : -1;
        const { items, categories } = s;

        return items.filter((item: Item) => {
            const searchMatch = item.name.toLowerCase().includes(globalSearchTerm.toLowerCase());
            const categoryMatch = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(item.categoryId) : true;
            const pt = String(item.performanceType);
            const performanceTypeMatch = globalFilters.performanceType.length > 0 ? globalFilters.performanceType.includes(pt) : true;
            return searchMatch && categoryMatch && performanceTypeMatch;
        }).sort((a: Item, b: Item) => {
            switch (sortKey) {
                case 'category': {
                    const catA = categories.find(c => c.id === a.categoryId)?.name || '';
                    const catB = categories.find(c => c.id === b.categoryId)?.name || '';
                    return catA.localeCompare(catB) * multiplier;
                }
                case 'type':
                    return String(a.type).localeCompare(String(b.type)) * multiplier;
                case 'performance':
                    return String(a.performanceType).localeCompare(String(b.performanceType)) * multiplier;
                case 'name':
                    return a.name.localeCompare(b.name) * multiplier;
                case 'duration':
                    return (a.duration - b.duration) * multiplier;
                case 'maxParticipants':
                    return (a.maxParticipants - b.maxParticipants) * multiplier;
                default:
                    return 0;
            }
        });
    }, [state, globalSearchTerm, globalFilters, itemSort]);

    const handleItemSort = (newKey: ItemSortKey) => { 
        setItemSort(prev => ({ sortKey: newKey, dir: prev.sortKey === newKey && prev.dir === 'asc' ? 'desc' : 'asc' })); 
    };
    const isAllItemsVisibleSelected = useMemo(() => filteredAndSortedItems.length > 0 && filteredAndSortedItems.every(i => selectedItems.has(i.id)), [filteredAndSortedItems, selectedItems]);
    const toggleAllItemsSelect = () => setSelectedItems(isAllItemsVisibleSelected ? new Set() : new Set(filteredAndSortedItems.map(i => i.id)));

    // --- Participants Logic ---
    const filteredAndSortedParticipants = useMemo<Participant[]>(() => {
        const s = state;
        if (!s) return [];

        const { sortKey, dir } = participantSort;
        const multiplier = dir === 'asc' ? 1 : -1;
        const { participants, teams, categories } = s;

        return participants.filter((p: Participant) => {
            const searchMatch = p.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || p.chestNumber.includes(globalSearchTerm);
            const categoryMatch = globalFilters.categoryId.length > 0 ? globalFilters.categoryId.includes(p.categoryId) : true;
            const teamMatch = globalFilters.teamId.length > 0 ? globalFilters.teamId.includes(p.teamId) : true;
            return searchMatch && categoryMatch && teamMatch;
        }).sort((a: Participant, b: Participant) => {
            switch (sortKey) {
                case 'chestNumber':
                    return a.chestNumber.localeCompare(b.chestNumber, 'en', { numeric: true }) * multiplier;
                case 'name':
                    return a.name.localeCompare(b.name) * multiplier;
                case 'team': {
                    const teamA = teams.find(t => t.id === a.teamId)?.name || '';
                    const teamB = teams.find(t => t.id === b.teamId)?.name || '';
                    return teamA.localeCompare(teamB) * multiplier;
                }
                case 'category': {
                    const catA = categories.find(c => c.id === a.categoryId)?.name || '';
                    const catB = categories.find(c => c.id === b.categoryId)?.name || '';
                    return catA.localeCompare(catB) * multiplier;
                }
                default:
                    return 0;
            }
        });
    }, [state, globalSearchTerm, globalFilters, participantSort]);

    const handleParticipantSort = (newKey: ParticipantSortKey) => { 
        setParticipantSort(prev => ({ sortKey: newKey, dir: prev.sortKey === newKey && prev.dir === 'asc' ? 'desc' : 'asc' })); 
    };
    const isAllParticipantsVisibleSelected = useMemo(() => filteredAndSortedParticipants.length > 0 && filteredAndSortedParticipants.every(p => selectedParticipants.has(p.id)), [filteredAndSortedParticipants, selectedParticipants]);
    const toggleAllParticipantsSelect = () => setSelectedParticipants(isAllParticipantsVisibleSelected ? new Set() : new Set(filteredAndSortedParticipants.map(p => p.id)));

    if (!state) return <div className="p-8 text-center text-zinc-500">Loading data...</div>;

    return (
        <div className="space-y-6 sm:space-y-10 pb-10 animate-in fade-in duration-700 relative">
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Items & Participants</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">System configuration for events and delegacy.</p>
                </div>
            </div>

            {activeTab === 'ITEMS' && (
                <div className="animate-in slide-in-from-left duration-500">
                    <Card title="Item Registry" action={
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-zinc-100 dark:bg-black/40 rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{state.items.length} Records</span>
                            </div>
                        </div>
                    }>
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <SortButton label="Name" sortKey="name" currentSortKey={itemSort.sortKey} currentSortDir={itemSort.dir} onSort={handleItemSort} />
                                    <SortButton label="Type" sortKey="type" currentSortKey={itemSort.sortKey} currentSortDir={itemSort.dir} onSort={handleItemSort} />
                                    <SortButton label="Performance" sortKey="performance" currentSortKey={itemSort.sortKey} currentSortDir={itemSort.dir} onSort={handleItemSort} />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amazio-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amazio-primary/20 hover:scale-105 active:scale-95 transition-all"><Plus size={16}/> New Record</button>
                                </div>
                            </div>

                            {/* Enhanced Floating Multi-Select Action Bar */}
                            {selectedItems.size > 0 && ReactDOM.createPortal(
                                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl animate-in slide-in-from-bottom-8 duration-500">
                                    <div className="p-2 bg-[#090A0C]/90 backdrop-blur-xl rounded-[2rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
                                        <div className="flex items-center gap-3 pl-4">
                                            <button 
                                                onClick={toggleAllItemsSelect} 
                                                className={`p-2.5 rounded-xl transition-all flex items-center gap-2.5 ${isAllItemsVisibleSelected ? 'bg-[#006994] text-white' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                {isAllItemsVisibleSelected ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                                <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest">{isAllItemsVisibleSelected ? 'Release All' : 'Select All'}</span>
                                            </button>
                                            <div className="h-8 w-px bg-white/10 mx-1"></div>
                                            <div className="flex flex-col">
                                                <span className="text-white text-xs font-black uppercase tracking-widest">{selectedItems.size} Selected</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pr-2">
                                            {selectedItems.size === 1 && (
                                                <button 
                                                    onClick={() => { const id = Array.from(selectedItems)[0]; setEditingItem(state.items.find(i=>i.id===id)||null); setIsModalOpen(true); }} 
                                                    className="px-6 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <Edit2 size={12} strokeWidth={3}/> Edit
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => { if(confirm(`Confirm deletion of ${selectedItems.size} registry records?`)) { deleteMultipleItems(Array.from(selectedItems)); setSelectedItems(new Set()); } }} 
                                                className="px-6 py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Trash2 size={14} strokeWidth={3}/> <span className="hidden xs:inline">Delete</span>
                                            </button>
                                            <button 
                                                onClick={() => setSelectedItems(new Set())} 
                                                className="p-3 text-zinc-500 hover:text-white rounded-2xl hover:bg-white/10 transition-all"
                                                title="Clear Selection"
                                            >
                                                <X size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedItems.map(item => {
                                    const isSelected = selectedItems.has(item.id);
                                    const cat = state.categories.find(c => c.id === item.categoryId);
                                    const isSingle = item.type === ItemType.SINGLE;
                                    const theme = getThemeColor(cat?.name || 'N/A');
                                    
                                    return (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleRegistryClick(item.id, 'ITEM')}
                                            onTouchStart={(e) => handleTouchStart(item.id, 'ITEM', e)}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={() => handleTouchEnd(item.id, 'ITEM')}
                                            className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden
                                                ${isSelected 
                                                    ? `border-[#d4a574] bg-zinc-50 dark:bg-zinc-800/50 shadow-lg scale-[1.01] z-10` 
                                                    : 'bg-white dark:bg-[#121412] border-zinc-100 dark:border-white/5 hover:border-zinc-200 shadow-sm'
                                                }`}
                                        >
                                            {/* Dim Effect Layer */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none rounded-[2.5rem]"></div>
                                            )}

                                            <div className="space-y-4 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div 
                                                      className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all"
                                                      style={{ backgroundColor: `${theme.hex}15`, color: theme.hex, borderColor: `${theme.hex}30` }}
                                                    >
                                                        {cat?.name || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onTouchStart={(e) => e.stopPropagation()}
                                                            onTouchEnd={(e) => e.stopPropagation()}
                                                            onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsModalOpen(true); }} 
                                                            className={`p-2 rounded-xl transition-all ${isSelected ? 'text-zinc-600 dark:text-zinc-300 bg-white/50' : 'text-zinc-300 group-hover:text-amazio-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {isSelected && (
                                                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl text-[#d4a574] shadow-md animate-in zoom-in-50 duration-300 border border-zinc-100 dark:border-zinc-700">
                                                                <CheckCircle size={20} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-black uppercase tracking-tight leading-tight mb-2 transition-colors ${isSelected ? 'text-amazio-primary dark:text-white' : 'text-amazio-primary dark:text-zinc-100'}`}>
                                                        {item.name}
                                                    </h3>
                                                    {item.description && (
                                                        <p className={`text-[11px] line-clamp-2 leading-relaxed italic text-zinc-500`}>
                                                            "{item.description}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <TypeBadge type={item.type} />
                                                    <PerformanceBadge type={item.performanceType} />
                                                </div>
                                            </div>
                                            <div className={`mt-6 pt-5 border-t grid grid-cols-2 gap-4 transition-colors border-zinc-100 dark:border-white/5`}>
                                                <div className="space-y-1">
                                                    <div className={`text-[8px] font-black uppercase tracking-widest text-zinc-400`}>{isSingle ? 'Max Participants' : 'Max Team Entries'}</div>
                                                    <div className={`flex items-center gap-2 text-sm font-black text-amazio-primary dark:text-zinc-200`}>
                                                        <PackageSearch size={14} className="text-zinc-400" />
                                                        {isSingle ? item.maxParticipants : (item.maxGroupsPerTeam || 1)} {isSingle ? 'Spots' : 'Entries'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <div className={`text-[8px] font-black uppercase tracking-widest text-zinc-400`}>Standard Time</div>
                                                    <div className={`flex items-center justify-end gap-2 text-sm font-black text-amazio-primary dark:text-zinc-200`}>
                                                        <Clock size={14} className="text-zinc-400" />
                                                        {item.duration} Min
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'PARTICIPANTS' && (
                <div className="animate-in slide-in-from-right duration-500">
                    <Card title="Participants Registry" action={
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-zinc-100 dark:bg-black/40 rounded-xl border border-amazio-primary/5 dark:border-white/10 shadow-inner">
                                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">{state.participants.length} Records</span>
                            </div>
                        </div>
                    }>
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <SortButton label="Reg#" sortKey="chestNumber" currentSortKey={participantSort.sortKey} currentSortDir={participantSort.dir} onSort={handleParticipantSort} />
                                    <SortButton label="Name" sortKey="name" currentSortKey={participantSort.sortKey} currentSortDir={participantSort.dir} onSort={handleParticipantSort} />
                                    <SortButton label="Team" sortKey="team" currentSortKey={participantSort.sortKey} currentSortDir={participantSort.dir} onSort={handleParticipantSort} />
                                    <SortButton label="Category" sortKey="category" currentSortKey={participantSort.sortKey} currentSortDir={participantSort.dir} onSort={handleParticipantSort} />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button onClick={() => { setEditingParticipant(null); setIsParticipantModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#1b5e20] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#1b5e20]/20 hover:scale-105 active:scale-95 transition-all"><UserPlus size={16}/> Register</button>
                                </div>
                            </div>

                            {selectedParticipants.size > 0 && ReactDOM.createPortal(
                                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl animate-in slide-in-from-bottom-8 duration-500">
                                    <div className="p-2 bg-[#090A0C]/90 backdrop-blur-xl rounded-[2rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
                                        <div className="flex items-center gap-3 pl-4">
                                            <button 
                                                onClick={toggleAllParticipantsSelect} 
                                                className={`p-2.5 rounded-xl transition-all flex items-center gap-2.5 ${isAllParticipantsVisibleSelected ? 'bg-[#1b5e20] text-white' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                {isAllParticipantsVisibleSelected ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                                <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest">{isAllParticipantsVisibleSelected ? 'Release All' : 'Select All'}</span>
                                            </button>
                                            <div className="h-8 w-px bg-white/10 mx-1"></div>
                                            <div className="flex flex-col">
                                                <span className="text-white text-xs font-black uppercase tracking-widest">{selectedParticipants.size} Selected</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pr-2">
                                            {selectedParticipants.size === 1 && (
                                                <button 
                                                    onClick={() => { const id = Array.from(selectedParticipants)[0]; setEditingParticipant(state.participants.find(p=>p.id===id)||null); setIsParticipantModalOpen(true); }} 
                                                    className="px-6 py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <Edit2 size={12} strokeWidth={3}/> Edit
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => { if(confirm(`Confirm deletion of ${selectedParticipants.size} participants?`)) { deleteMultipleParticipants(Array.from(selectedParticipants)); setSelectedParticipants(new Set()); } }} 
                                                className="px-6 py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Trash2 size={14} strokeWidth={3}/> <span className="hidden xs:inline">Delete</span>
                                            </button>
                                            <button 
                                                onClick={() => setSelectedParticipants(new Set())} 
                                                className="p-3 text-zinc-500 hover:text-white rounded-2xl hover:bg-white/10 transition-all"
                                                title="Clear Selection"
                                            >
                                                <X size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </div>,
                                document.body
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                {filteredAndSortedParticipants.map(p => {
                                    const isSelected = selectedParticipants.has(p.id);
                                    const team = state.teams.find(t => t.id === p.teamId);
                                    const category = state.categories.find(c => c.id === p.categoryId);
                                    const teamTheme = getThemeColor(team?.name || 'Unknown');
                                    const catTheme = getThemeColor(category?.name || 'None');
                                    
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => handleRegistryClick(p.id, 'PARTICIPANT')} 
                                            onTouchStart={(e) => handleTouchStart(p.id, 'PARTICIPANT', e)}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={() => handleTouchEnd(p.id, 'PARTICIPANT')}
                                            className={`relative p-5 rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer group flex flex-col ${isSelected ? 'border-[#1b5e20] bg-zinc-50 dark:bg-zinc-800/50 shadow-lg scale-[1.01] z-10' : 'bg-white dark:bg-[#121412] border-zinc-100 dark:border-white/5 hover:border-zinc-200'}`}
                                        >
                                            {/* Dim Effect Layer */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none rounded-[2.5rem]"></div>
                                            )}

                                            <div className="space-y-2.5 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div 
                                                          className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all"
                                                          style={isSelected ? { backgroundColor: '#1b5e20', color: 'white', borderColor: '#1b5e20' } : { backgroundColor: '#f4f4f5', color: '#71717a', borderColor: '#e4e4e7' }}
                                                        >
                                                            Reg# {p.chestNumber}
                                                        </div>
                                                        {p.role === 'leader' && (
                                                            <div className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[8px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800/50 flex items-center gap-1 shadow-sm">
                                                                <Crown size={10} strokeWidth={3} /> Team Leader
                                                            </div>
                                                        )}
                                                        {p.role === 'assistant' && (
                                                            <div className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[8px] font-black uppercase tracking-widest border border-sky-200 dark:border-strong-900/50 flex items-center gap-1 shadow-sm">
                                                                <ShieldCheck size={10} strokeWidth={3} /> Assistant
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onTouchStart={(e) => e.stopPropagation()}
                                                            onTouchEnd={(e) => e.stopPropagation()}
                                                            onClick={(e) => { e.stopPropagation(); setEditingParticipant(p); setIsParticipantModalOpen(true); }} 
                                                            className={`p-2 rounded-xl transition-colors ${isSelected ? 'text-zinc-600 dark:text-zinc-300 bg-white/50' : 'text-zinc-300 group-hover:text-amazio-primary hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        {isSelected && <div className="p-2 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[#1b5e20] shadow-md"><CheckCircle size={20} strokeWidth={3} /></div>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className={`text-xl font-black uppercase tracking-tight leading-tight mb-1 transition-colors ${isSelected ? 'text-amazio-primary dark:text-white' : 'text-amazio-primary dark:text-zinc-100'}`}>{p.name}</h3>
                                                    {p.place && <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider italic text-zinc-500`}><MapPin size={10}/> {p.place}</div>}
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <span 
                                                      className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border transition-colors"
                                                      style={{ backgroundColor: `${teamTheme.hex}10`, color: teamTheme.hex, borderColor: `${teamTheme.hex}30` }}
                                                    >
                                                        {team?.name || 'No Team'}
                                                    </span>
                                                    <span 
                                                      className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border transition-colors"
                                                      style={{ backgroundColor: `${catTheme.hex}10`, color: catTheme.hex, borderColor: `${catTheme.hex}30` }}
                                                    >
                                                        {category?.name || 'No Category'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredAndSortedParticipants.length === 0 && (
                                <div className="py-24 text-center opacity-30">
                                    <UserIcon size={64} className="mx-auto mb-4" />
                                    <p className="font-black uppercase tracking-[0.3em] text-xs">Awaiting registry records</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <ItemFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingItem={editingItem} />
            <ParticipantFormModal isOpen={isParticipantModalOpen} onClose={() => setIsParticipantModalOpen(false)} editingParticipant={editingParticipant} currentUser={currentUser} />
        </div>
    );
};

export default ItemsManagement;