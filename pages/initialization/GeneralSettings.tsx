import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Card from '../../components/Card';
import { useFirebase } from '../../hooks/useFirebase';
import { 
    X, Users, Trash2, BookText, Database, Info, FileDown, Upload, ArrowRight, 
    Building2, Briefcase, Image as ImageIcon, Check, LayoutTemplate, RotateCcw, 
    ShieldAlert, Award, Edit2, Save, Type, CheckCircle, CheckCircle2, ClipboardList, Plus, FileText, 
    MoreHorizontal, Settings, Palette, Calendar, SlidersHorizontal, MousePointer2, 
    UserCheck, Shield, LayoutDashboard, UserPlus, Medal, Gavel, Timer, Monitor,
    BarChart2, Home, Search, AlertTriangle, ShieldCheck, Download, Sparkles
} from 'lucide-react';
import { User, UserRole, AppState, FontConfig, GeneralFontConfig } from '../../types';
import { TABS, TAB_DISPLAY_NAMES } from '../../constants';
import { CollapsibleCard } from '../../components/CollapsibleCard'; 

// --- Helper Component: Image Upload ---
interface ImageUploadProps {
    label: string;
    description: string;
    currentValue: string | undefined;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, description, currentValue, onChange, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                alert("File size too large! Please upload an image smaller than 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`h-full flex flex-col justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-black/20 ${disabled ? 'opacity-60 pointer-events-none' : 'hover:border-indigo-500/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors'}`}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">{label}</label>
            <div className="flex-grow flex flex-col items-center justify-center gap-4">
                {currentValue ? (
                    <div className="relative w-full aspect-video bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden p-2 group">
                        <img src={currentValue} alt={label} className="max-w-full max-h-full object-contain" />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <span className="text-white text-xs font-bold flex items-center gap-2"><Upload size={14}/> Replace</span>
                            </div>
                        )}
                        {!disabled && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); onChange(''); }} 
                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                            >
                                <Trash2 size={12}/>
                            </button>
                        )}
                    </div>
                ) : (
                    <div 
                        onClick={() => !disabled && fileInputRef.current?.click()}
                        className="w-full aspect-video bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                        <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <ImageIcon size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">Click to Upload</span>
                    </div>
                )}
                <p className="text-[10px] text-zinc-400 text-center max-w-[200px] leading-relaxed">{description}</p>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

// --- Helper Component: New Language Font Card ---
const LanguageFontCard = ({
    title,
    subtitle,
    language,
    currentFont,
    previewText,
    onSave
}: {
    title: string;
    subtitle: string;
    language: 'malayalam' | 'arabic' | 'english';
    currentFont?: FontConfig;
    previewText: string;
    onSave: (font: FontConfig) => void;
}) => {
    const fileInputRef = useRef<HTMLDivElement>(null);
    const [tempFont, setTempFont] = useState<FontConfig | undefined>(currentFont);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setTempFont(currentFont);
        setIsDirty(false);
    }, [currentFont]);

    // Inject temporary style for live preview
    useEffect(() => {
        if (tempFont?.url && tempFont.family) {
            const styleId = `preview-font-${language}`;
            let style = document.getElementById(styleId) as HTMLStyleElement;
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.appendChild(style);
            }
            style.textContent = `
                @font-face {
                    font-family: '${tempFont.family}_Preview';
                    src: url('${tempFont.url}');
                    font-display: swap;
                }
            `;
        }
    }, [tempFont, language]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Font file too large! Please upload a file smaller than 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const newFont = {
                    name: file.name,
                    url: base64,
                    family: `Custom${language.charAt(0).toUpperCase() + language.slice(1)}`
                };
                setTempFont(newFont);
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; 
        }
    };

    return (
        <div className="bg-white dark:bg-[#121412] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col gap-6 relative overflow-hidden group shadow-sm md:shadow-xl">
             {/* Header */}
             <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-900/20 shadow-inner">
                    <Type size={24} />
                </div>
                <div>
                    <h3 className="text-amazio-primary dark:text-white font-serif text-xl font-bold tracking-tight">{title}</h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
                </div>
             </div>

             {/* Upload Button */}
             <div className="mt-2">
                <button 
                    onClick={() => (fileInputRef.current as any)?.click()} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amazio-primary dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                >
                    <Upload size={14} /> Upload Font
                </button>
                <input type="file" ref={fileInputRef as any} className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={handleFileChange} />
             </div>

             {/* Preview */}
             <div className="bg-zinc-100/50 dark:bg-[#050605] rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/50 min-h-[140px] flex flex-col justify-center relative group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
                <span className="absolute top-5 left-6 text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Live Rendering</span>
                <p className="text-3xl text-amazio-primary dark:text-white text-center leading-relaxed" style={{ fontFamily: tempFont ? `'${tempFont.family}_Preview', sans-serif` : 'inherit', direction: language === 'arabic' ? 'rtl' : 'ltr' }}>
                    {previewText}
                </p>
             </div>

             {/* Footer Action */}
             <button
                onClick={() => tempFont && onSave(tempFont)}
                disabled={!isDirty}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${isDirty ? 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-emerald-900/20 transform hover:-translate-y-0.5' : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'}`}
             >
                {isDirty ? <CheckCircle size={16} /> : <CheckCircle size={16} className="opacity-20"/>} Apply Registry
             </button>
        </div>
    );
};

// --- Helper Component: User Form Modal ---
const UserFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (user: Partial<User>) => void; 
    editingUser?: User;
    teams: any[];
    judges: any[];
}> = ({ isOpen, onClose, onSave, editingUser, teams, judges }) => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.MANAGER);
    const [assignedEntity, setAssignedEntity] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                setUsername(editingUser.username);
                setRole(editingUser.role);
                if (editingUser.role === UserRole.TEAM_LEADER) setAssignedEntity(editingUser.teamId || '');
                else if (editingUser.role === UserRole.JUDGE) setAssignedEntity(editingUser.judgeId || '');
                else setAssignedEntity('');
            } else {
                setUsername('');
                setRole(UserRole.MANAGER);
                setAssignedEntity('');
            }
        }
    }, [isOpen, editingUser]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!username) return alert('Username is required');
        
        const payload: any = { username, role };
        if (role === UserRole.TEAM_LEADER) payload.teamId = assignedEntity;
        if (role === UserRole.JUDGE) payload.judgeId = assignedEntity;
        if (editingUser) payload.id = editingUser.id;
        
        onSave(payload);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#121412] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-7 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div>
                        <h3 className="text-xl font-black font-serif uppercase tracking-tighter leading-none text-amazio-primary dark:text-white">{editingUser ? 'Edit Operator' : 'New Operator'}</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-400 mt-1.5 tracking-widest">Access Control</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors text-zinc-400"><X size={24}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Account Handle</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Username" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Role Priority</label>
                        <select value={role} onChange={e => { setRole(e.target.value as UserRole); setAssignedEntity(''); }} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 text-sm font-bold outline-none appearance-none cursor-pointer">
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {(role === UserRole.TEAM_LEADER || role === UserRole.JUDGE) && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Assigned Entity</label>
                            <select value={assignedEntity} onChange={e => setAssignedEntity(e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 text-sm font-bold outline-none appearance-none cursor-pointer">
                                <option value="">-- Select Entity --</option>
                                {role === UserRole.TEAM_LEADER && teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                {role === UserRole.JUDGE && judges.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="p-7 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amazio-primary transition-colors">Discard</button>
                    <button onClick={handleSave} className="px-10 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Save Access</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Utils ---
const SectionTitle = ({ title, icon: Icon, color = 'indigo' }: { title: string, icon?: any, color?: string }) => {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]',
        emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        amber: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
        rose: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
    };
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={`h-5 w-1.5 rounded-full ${colors[color] || colors.indigo}`}></div>
            <h3 className="text-xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">{title}</h3>
            {Icon && <Icon className="text-zinc-400 ml-1" size={18} />}
        </div>
    );
};

const ScopeItem: React.FC<{ label: string, isChecked: boolean, onChange: () => void }> = ({ label, isChecked, onChange }) => (
    <div className="flex items-center justify-between p-3.5 bg-zinc-50/50 dark:bg-black/20 rounded-xl border border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{label}</span>
        <button onClick={onChange} className={`w-5 h-5 rounded flex items-center justify-center transition-all shadow-sm ${isChecked ? 'bg-lime-500 text-black shadow-lime-500/20' : 'bg-white dark:bg-zinc-800 text-transparent border border-zinc-200 dark:border-zinc-700'}`}>
            {isChecked && <Check size={14} strokeWidth={4} />}
        </button>
    </div>
);

// Tab icon map for instructions
const TAB_ICON_MAP: Record<string, React.ElementType> = {
    [TABS.DASHBOARD]: LayoutDashboard,
    [TABS.DATA_ENTRY]: UserPlus,
    [TABS.ITEMS]: ClipboardList,
    [TABS.TEAMS_CATEGORIES]: Users,
    [TABS.GRADE_POINTS]: Medal,
    [TABS.JUDGES_MANAGEMENT]: Gavel,
    [TABS.SCHEDULE]: Calendar,
    [TABS.ITEM_TIMER]: Timer,
    [TABS.SCORING_RESULTS]: Edit2,
    [TABS.POINTS]: BarChart2,
    [TABS.REPORTS]: FileText,
    [TABS.CREATIVE_STUDIO]: Palette,
    [TABS.PROJECTOR]: Monitor,
    [TABS.GENERAL_SETTINGS]: Settings,
};

const GeneralSettings: React.FC = () => {
    const { state, updateSettings, addUser, updateUser, deleteUser, updatePermissions, updateInstruction, backupData, restoreData, settingsSubView: activeTab } = useFirebase();
    const restoreInputRef = useRef<HTMLInputElement>(null);
    const [isEditingInst, setIsEditingInst] = useState(false);
    const [instData, setInstData] = useState(state?.settings.institutionDetails || { name: '', address: '', email: '', contactNumber: '', description: '', logoUrl: '' });
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    
    // Improved data initialization for branding
    const [orgData, setOrgData] = useState({ 
        organizingTeam: state?.settings.organizingTeam || '', 
        heading: state?.settings.heading || '', 
        description: state?.settings.description || '', 
        eventDates: state?.settings.eventDates || [], 
        branding: state?.settings.branding || { typographyUrl: '', typographyUrlLight: '', typographyUrlDark: '', teamLogoUrl: '' } 
    });
    
    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    useEffect(() => { if (!isEditingInst && state?.settings.institutionDetails) setInstData(state.settings.institutionDetails); }, [state?.settings.institutionDetails, isEditingInst]);
    useEffect(() => { if (!isEditingOrg && state?.settings) setOrgData({ organizingTeam: state.settings.organizingTeam, heading: state.settings.heading, description: state.settings.description, eventDates: state.settings.eventDates || [], branding: state.settings.branding || { typographyUrl: '', typographyUrlLight: '', typographyUrlDark: '', teamLogoUrl: '' } }); }, [state?.settings, isEditingOrg]);

    if (!state) return <div>Loading...</div>;

    const handleSaveInst = async () => { await updateSettings({ institutionDetails: instData }); setIsEditingInst(false); };
    const handleSaveOrg = async () => { await updateSettings({ organizingTeam: orgData.organizingTeam, heading: orgData.heading, description: orgData.description, eventDates: orgData.eventDates, branding: orgData.branding }); setIsEditingOrg(false); };

    const handlePermissionChange = (role: UserRole, tab: string, checked: boolean) => {
        const pages = checked ? Array.from(new Set([...(state.permissions[role] || []), tab])) : (state.permissions[role] || []).filter(p => p !== tab);
        updatePermissions({ role, pages });
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        if (userData.id) {
            await updateUser(userData as User);
        } else {
            await addUser(userData as Omit<User, 'id'>);
        }
        setIsUserModalOpen(false);
        setEditingUser(undefined);
    };

    // --- Font Management Handlers ---
    const handleUpdateCustomFont = async (lang: 'malayalam' | 'arabic' | 'english', font: FontConfig | undefined) => {
        const currentFonts = state.settings.customFonts || {};
        await updateSettings({
            customFonts: {
                ...currentFonts,
                [lang]: font
            }
        });
    };

    const handleAddEventDate = (date: string) => {
        if (!date) return;
        if (!orgData.eventDates.includes(date)) {
            setOrgData(prev => ({ ...prev, eventDates: [...prev.eventDates, date] }));
        }
    };

    const handleRemoveEventDate = (date: string) => {
        setOrgData(prev => ({ ...prev, eventDates: prev.eventDates.filter(d => d !== date) }));
    };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'details':
                return (
                    <div className="space-y-10 animate-in slide-in-from-left duration-500">
                        {/* Institution Core */}
                        <Card title="Institution Core" action={isEditingInst ? <button onClick={handleSaveInst} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"><Check size={20}/></button> : <button onClick={() => setIsEditingInst(true)} className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"><Edit2 size={18}/></button>}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Legal Name</label>
                                        <input 
                                            type="text" 
                                            value={instData.name} 
                                            onChange={e => setInstData({...instData, name: e.target.value})} 
                                            disabled={!isEditingInst} 
                                            className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                            placeholder="Official Institution Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Postal Address</label>
                                        <textarea 
                                            rows={2}
                                            value={instData.address} 
                                            onChange={e => setInstData({...instData, address: e.target.value})} 
                                            disabled={!isEditingInst} 
                                            className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 resize-none"
                                            placeholder="Full Postal Address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Email</label>
                                            <input 
                                                type="email" 
                                                value={instData.email} 
                                                onChange={e => setInstData({...instData, email: e.target.value})} 
                                                disabled={!isEditingInst} 
                                                className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                                placeholder="contact@institution.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Contact No</label>
                                            <input 
                                                type="tel" 
                                                value={instData.contactNumber} 
                                                onChange={e => setInstData({...instData, contactNumber: e.target.value})} 
                                                disabled={!isEditingInst} 
                                                className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                                placeholder="+91 XXXXXXXXXX"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-1 h-full">
                                    <div className="h-full flex flex-col">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Institutional Emblem</label>
                                        <div className="flex-grow">
                                            <ImageUpload 
                                                label="" 
                                                description="Primary watermark for reports and certificates." 
                                                currentValue={instData.logoUrl} 
                                                onChange={v => setInstData({...instData, logoUrl: v})} 
                                                disabled={!isEditingInst}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Event Branding */}
                        <Card title="Event Branding" action={isEditingOrg ? <button onClick={handleSaveOrg} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"><Check size={20}/></button> : <button onClick={() => setIsEditingOrg(true)} className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"><Edit2 size={18}/></button>}>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Organizing Body</label>
                                        <input 
                                            type="text" 
                                            value={orgData.organizingTeam} 
                                            onChange={e => setOrgData({...orgData, organizingTeam: e.target.value})} 
                                            disabled={!isEditingOrg} 
                                            className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                            placeholder="e.g. Student's Union 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Festival Theme Title</label>
                                        <input 
                                            type="text" 
                                            value={orgData.heading} 
                                            onChange={e => setOrgData({...orgData, heading: e.target.value})} 
                                            disabled={!isEditingOrg} 
                                            className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                            placeholder="e.g. AMAZIO 2026"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1 flex items-center gap-2">Main Event Dates <Calendar size={12}/></label>
                                        <div className={`w-full p-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl ${!isEditingOrg ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {orgData.eventDates.map((date, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                                        {date}
                                                        {isEditingOrg && (
                                                            <button onClick={() => handleRemoveEventDate(date)} className="p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isEditingOrg && (
                                                    <input 
                                                        type="date" 
                                                        className="bg-transparent border-none text-xs font-bold text-zinc-500 focus:ring-0 outline-none h-8"
                                                        onChange={(e) => { handleAddEventDate(e.target.value); e.target.value = ''; }} 
                                                    />
                                                )}
                                            </div>
                                            {orgData.eventDates.length === 0 && <p className="text-[10px] text-zinc-400 italic px-2 pb-1">Add all main festival days to highlight them on generated posters.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Dashboard Tagline</label>
                                        <textarea 
                                            rows={2}
                                            value={orgData.description} 
                                            onChange={e => setOrgData({...orgData, description: e.target.value})} 
                                            disabled={!isEditingOrg} 
                                            className="w-full p-4 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 resize-none"
                                            placeholder="Short tagline or motto..."
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-1 h-full">
                                    <div className="h-full flex flex-col">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Logo (Light Theme)</label>
                                        <div className="flex-grow">
                                            <ImageUpload 
                                                label="" 
                                                description="Logo displayed during Light Theme mode." 
                                                currentValue={isEditingOrg ? orgData.branding?.typographyUrlLight : (orgData.branding?.typographyUrlLight || orgData.branding?.typographyUrl)} 
                                                onChange={v => setOrgData(prev => ({...prev, branding: {...(prev.branding || {}), typographyUrlLight: v}}))} 
                                                disabled={!isEditingOrg}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-1 h-full">
                                    <div className="h-full flex flex-col">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Logo (Dark Theme)</label>
                                        <div className="flex-grow">
                                            <ImageUpload 
                                                label="" 
                                                description="Logo displayed during Dark Theme mode." 
                                                currentValue={orgData.branding?.typographyUrlDark} 
                                                onChange={v => setOrgData(prev => ({...prev, branding: {...(prev.branding || {}), typographyUrlDark: v}}))} 
                                                disabled={!isEditingOrg}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            case 'display': 
                return (
                    <div className="space-y-10 animate-in slide-in-from-right duration-500">
                        {/* Language Fonts */}
                        <div>
                            <SectionTitle title="Typography & Assets" icon={Palette} color="purple"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <LanguageFontCard 
                                    title="English Layout Font"
                                    subtitle="Applied to Latin Glyphs"
                                    language="english"
                                    previewText="English Font Preview"
                                    currentFont={state.settings.customFonts?.english}
                                    onSave={(f) => handleUpdateCustomFont('english', f)}
                                />
                                <LanguageFontCard 
                                    title="Malayalam Layout Font"
                                    subtitle="Applied to Malayalam Glyphs"
                                    language="malayalam"
                                    previewText="മലയാളം ഫോണ്ട് പ്രിവ്യൂ"
                                    currentFont={state.settings.customFonts?.malayalam}
                                    onSave={(f) => handleUpdateCustomFont('malayalam', f)}
                                />
                                <LanguageFontCard 
                                    title="Arabic Layout Font"
                                    subtitle="Applied to Arabic Glyphs"
                                    language="arabic"
                                    previewText="معاينة خط اللغة العربية"
                                    currentFont={state.settings.customFonts?.arabic}
                                    onSave={(f) => handleUpdateCustomFont('arabic', f)}
                                />
                            </div>
                        </div>

                        {/* UX Preferences */}
                        <div>
                            <SectionTitle title="UX Preferences" icon={LayoutTemplate} color="emerald" />
                            <div className="bg-white dark:bg-[#121412] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm md:shadow-xl">
                                <div className="flex items-center gap-5 w-full">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-900/20 shadow-inner shrink-0">
                                        <SlidersHorizontal size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-amazio-primary dark:text-white font-black font-serif text-lg tracking-tight">FLOATING NAVIGATION RAIL</h4>
                                        <p className="text-xs text-zinc-500 mt-1 font-medium max-w-sm">Draggable floating icon menu for streamlined mobile usage.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                                     <button 
                                        onClick={() => window.dispatchEvent(new Event('reset-floating-nav'))} 
                                        className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amazio-primary dark:hover:text-white transition-all whitespace-nowrap"
                                     >
                                        Reset Anchor
                                     </button>
                                     <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={state.settings.enableFloatingNav === true} onChange={e => updateSettings({ enableFloatingNav: e.target.checked })} />
                                        <div className="w-14 h-8 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 border border-zinc-300 dark:border-zinc-700"></div>
                                     </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
                        {/* Registry Card */}
                        <Card title="Authorized Access Registry" action={
                            <button 
                                onClick={() => { setEditingUser(undefined); setIsUserModalOpen(true); }}
                                className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={14} strokeWidth={3}/> Add Operator
                            </button>
                        }>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Account Handle</th>
                                            <th className="px-6 py-4">Role Priority</th>
                                            <th className="px-6 py-4">Assigned Entity</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                                        {state.users.map(u => {
                                            const team = state.teams.find(t => t.id === u.teamId);
                                            const judge = state.judges.find(j => j.id === u.judgeId);
                                            const entityName = u.role === UserRole.TEAM_LEADER ? team?.name : u.role === UserRole.JUDGE ? judge?.name : '--';
                                            
                                            // Role Badges
                                            const roleStyle = u.role === UserRole.MANAGER 
                                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
                                                : u.role === UserRole.JUDGE
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : u.role === UserRole.TEAM_LEADER
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';

                                            return (
                                                <tr key={u.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-black text-xs uppercase text-zinc-700 dark:text-zinc-200">{u.username}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${roleStyle}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">{entityName || '--'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors"><Edit2 size={16}/></button>
                                                            <button onClick={() => deleteUser(u.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {state.users.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-[10px] uppercase font-bold text-zinc-400">No operators configured</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Scope Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[UserRole.TEAM_LEADER, UserRole.THIRD_PARTY, UserRole.JUDGE].map(role => {
                                const permissions = state.permissions[role] || [];
                                const allTabs = Object.values(TABS);
                                
                                return (
                                    <div key={role} className="bg-white dark:bg-[#121412] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm md:shadow-xl flex flex-col h-full">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="h-4 w-1 bg-emerald-500 rounded-full"></div>
                                            <h4 className="text-amazio-primary dark:text-white font-black font-serif text-lg tracking-tight capitalize">{role.replace('_', ' ')} Scopes</h4>
                                        </div>
                                        
                                        <div className="flex-grow space-y-2 overflow-y-auto custom-scrollbar max-h-[400px] pr-1">
                                            {allTabs.map(tab => {
                                                const isChecked = permissions.includes(tab);
                                                return (
                                                    <ScopeItem 
                                                        key={tab} 
                                                        label={tab} 
                                                        isChecked={isChecked} 
                                                        onChange={() => handlePermissionChange(role, tab, !isChecked)} 
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'instructions':
                return (
                    <div className="space-y-10 animate-in slide-in-from-top-4 duration-500 pb-12">
                        {/* General Master Instructions Section */}
                        <div className="group relative flex flex-col h-full bg-white dark:bg-[#121412] rounded-[2.5rem] border border-emerald-500/20 dark:border-white/5 shadow-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/40">
                            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Sparkles size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-amazio-primary dark:text-white">General Festival Instructions</h4>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Global System Broadcast</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-emerald-600/70 dark:text-emerald-500/60 hidden sm:inline">Active Registry</span>
                                    <CheckCircle2 className="text-emerald-500" size={18} />
                                </div>
                            </div>
                            <div className="p-6">
                                <textarea 
                                    rows={6} 
                                    value={state.settings.generalInstructions || ''} 
                                    onChange={e => updateSettings({ generalInstructions: e.target.value })} 
                                    className="w-full p-6 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] text-sm font-bold text-amazio-primary dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-zinc-400 resize-none shadow-inner"
                                    placeholder="Enter global rules, welcome messages, and master announcements here..."
                                />
                            </div>
                            <div className="px-6 py-4 bg-zinc-50/30 dark:bg-black/10 flex items-center justify-between border-t border-zinc-50 dark:border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Shield size={10}/> Persistent Global Meta</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase">Live Sync</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <SectionTitle title="Page-Specific Instructions" icon={BookText} color="indigo" />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                                {Object.values(TABS).map(tab => {
                                    const Icon = TAB_ICON_MAP[tab] || Info;
                                    return (
                                        <div key={tab} className="group flex flex-col h-full bg-white dark:bg-[#121412] rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-glass-light dark:shadow-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
                                            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center gap-4 bg-zinc-50/50 dark:bg-white/[0.01]">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                    <Icon size={20} strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-amazio-primary dark:text-white truncate">
                                                        {TAB_DISPLAY_NAMES[tab] || tab}
                                                    </h4>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Contextual Guide</p>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <textarea 
                                                    rows={4} 
                                                    value={state.settings.instructions[tab] || ''} 
                                                    onChange={e => updateInstruction({page: tab, text: e.target.value})} 
                                                    className="w-full p-4 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-amazio-primary dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400 resize-none"
                                                    placeholder={`Type directions for the ${TAB_DISPLAY_NAMES[tab] || tab} page here...`}
                                                />
                                            </div>
                                            <div className="px-6 py-4 bg-zinc-50/30 dark:bg-black/10 flex items-center justify-between border-t border-zinc-50 dark:border-white/5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Shield size={10}/> Local Scope</span>
                                                <CheckCircle2 size={14} className="text-emerald-500 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-12">
                        {/* Information Header */}
                        <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 flex items-start gap-4">
                            <ShieldCheck size={24} className="text-indigo-500 shrink-0" />
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Operational Continuity</h4>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed">Manage system states and portability. These operations affect the entire dataset including users, scores, and media registry.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Export Section */}
                            <div className="group relative flex flex-col h-full bg-white dark:bg-[#121412] rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:-translate-y-1">
                                <div className="p-8 pb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                                        <FileDown size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">Snapshot State</h3>
                                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Generate a comprehensive JSON archive containing all current configurations, participants, and scoring data.</p>
                                </div>
                                <div className="p-8 mt-auto">
                                    <button 
                                        onClick={backupData}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} strokeWidth={3}/> Export Production Data
                                    </button>
                                </div>
                            </div>

                            {/* Restore Section */}
                            <div className="group relative flex flex-col h-full bg-white dark:bg-[#121412] rounded-[2.5rem] border border-zinc-100 dark:border-white/5 shadow-2xl overflow-hidden transition-all duration-300 hover:border-rose-500/30 hover:-translate-y-1">
                                <div className="p-8 pb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                                        <RotateCcw size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black font-serif text-amazio-primary dark:text-white uppercase tracking-tighter">System Restore</h3>
                                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Overwrite the existing database with data from a previously generated snapshot. <span className="text-rose-500 font-bold uppercase">This action is irreversible.</span></p>
                                </div>
                                <div className="p-8 mt-auto">
                                    <input 
                                        type="file" 
                                        ref={restoreInputRef} 
                                        className="hidden" 
                                        accept=".json" 
                                        onChange={e => {
                                            if (e.target.files?.[0]) {
                                                if (confirm("CRITICAL WARNING: This will DELETE all current data and replace it with the selected backup. Proceed?")) {
                                                    restoreData(e.target.files[0]);
                                                }
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => (restoreInputRef.current as any)?.click()}
                                        className="w-full py-4 border-2 border-rose-100 dark:border-strong-900/30 text-rose-600 dark:text-rose-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} strokeWidth={3}/> Upload Snapshot
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Safety Disclaimer */}
                        <div className="flex items-center justify-center gap-2 py-4 opacity-50">
                            <AlertTriangle size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Security: User sessions are preserved during data operations</span>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col gap-6">
                <div className="hidden md:flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-5xl font-black font-serif text-amazio-primary dark:text-white tracking-tighter uppercase leading-none">Settings</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-3 font-medium text-lg italic">System orchestration console.</p>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {renderTabContent()}
            </div>

            <UserFormModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                editingUser={editingUser}
                teams={state.teams}
                judges={state.judges}
            />
        </div>
    );
};

export default GeneralSettings;