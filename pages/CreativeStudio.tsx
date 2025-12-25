
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { 
    Layout, Download, ChevronDown, 
    Loader2, Image as ImageIcon, Palette, Globe,
    Plus, Trash2, Check, Type, Award, Layers, User, MapPin, X,
    Settings2, ChevronUp, ImagePlus
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ResultStatus, ItemType, PerformanceType } from '../types';

// --- Utils ---

/**
 * Compresses a Base64 image string for background use.
 */
const compressBgImage = (base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
            } else {
                if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64Str); 
    });
};

// --- Types ---

type TemplateType = 'CLASSIC' | 'MINIMAL' | 'HERITAGE';

interface PosterData {
    itemId: string;
    itemName: string;
    categoryName: string;
    resultNumber: string; 
    winners: {
        rank: number;
        name: string;
        place?: string;
        team: string;
        grade?: string;
        points: number;
    }[];
}

// --- Templates Config ---

const TEMPLATES: Record<TemplateType, { name: string; bg: string; text: string; accent: string; fontTitle: string; fontBody: string }> = {
    CLASSIC: {
        name: 'Classic Paper',
        bg: 'bg-[#F9F7F1]',
        text: 'text-slate-900',
        accent: 'text-amber-700',
        fontTitle: 'font-serif',
        fontBody: 'font-serif'
    },
    MINIMAL: {
        name: 'Clean Minimal',
        bg: 'bg-white',
        text: 'text-zinc-900',
        accent: 'text-zinc-500',
        fontTitle: 'font-sans',
        fontBody: 'font-sans'
    },
    HERITAGE: {
        name: 'Heritage Sketch',
        bg: 'bg-white',
        text: 'text-black',
        accent: 'text-zinc-800',
        fontTitle: 'font-serif',
        fontBody: 'font-sans'
    }
};

// --- Helper Functions ---

const formatRankNum = (n: number) => {
    if (isNaN(n) || n === 0) return { num: "--", suffix: "" };
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    const suffix = s[(v - 20) % 10] || s[v] || s[0];
    return { num: n.toString().padStart(2, '0'), suffix };
};

// --- Components ---

const PosterCanvas: React.FC<{ 
    data: PosterData; 
    template: TemplateType; 
    settings: any; 
    scale?: number;
    id?: string;
    customBg?: string | null;
    showPoints?: boolean;
}> = ({ data, template, settings, scale = 1, id, customBg, showPoints = true }) => {
    const style = TEMPLATES[template];
    const footerText = settings.institutionDetails?.name || settings.organizingTeam;
    
    // Logic for rank-specific point colors
    const getPointColor = (rank: number) => {
        if (rank === 1) return 'text-emerald-500';
        if (rank === 2) return 'text-sky-500';
        if (rank === 3) return 'text-rose-500';
        return 'text-zinc-400';
    };

    const getRankAccent = (rank: number) => {
        if (rank === 1) return 'text-amber-500';
        if (rank === 2) return 'text-slate-400';
        if (rank === 3) return 'text-orange-500';
        return 'text-zinc-300';
    };

    return (
        <div 
            id={id}
            className={`relative flex flex-col overflow-hidden shadow-2xl ${style.fontBody} bg-white text-zinc-900`}
            style={{ 
                width: '1080px', 
                height: '1080px', 
                transform: `scale(${scale})`, 
                transformOrigin: 'top left',
                flexShrink: 0 
            }}
        >
            {/* Background Layer */}
            {customBg ? (
                <div className="absolute inset-0 z-0">
                    <img src={customBg} className="w-full h-full object-cover" alt="Custom Background" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40"></div>
                </div>
            ) : (
                <div className={`absolute inset-0 z-0 ${style.bg}`}></div>
            )}
            
            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full p-20">
                
                {/* Header: Item & Category */}
                <div className="flex justify-between items-start mb-16">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full shadow-lg">
                            <Layers size={16} />
                            <span className="text-sm font-black uppercase tracking-[0.3em]">{data.categoryName}</span>
                        </div>
                        <h1 className={`text-8xl font-black uppercase tracking-tighter leading-none text-zinc-900 drop-shadow-sm ${style.fontTitle}`}>
                            {data.itemName}
                        </h1>
                    </div>
                    {data.resultNumber && (
                        <div className="text-right">
                             <div className="text-6xl font-black text-indigo-600/30 font-mono tracking-tighter leading-none">#{data.resultNumber.padStart(2, '0')}</div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Result ID</div>
                        </div>
                    )}
                </div>

                {/* Main Body: Winners List */}
                <div className="flex-grow flex flex-col justify-center space-y-12">
                    {data.winners.map((winner, idx) => {
                        const rankInfo = formatRankNum(winner.rank);
                        const pointColor = getPointColor(winner.rank);
                        const rankAccent = getRankAccent(winner.rank);

                        return (
                            <div key={idx} className="flex items-center justify-between group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                                <div className="flex items-start gap-10">
                                    {/* Rank Indicator */}
                                    <div className={`flex items-start ${rankAccent}`}>
                                        <span className="text-8xl font-black leading-none tracking-tighter tabular-nums">{rankInfo.num}</span>
                                        <span className="text-3xl font-bold mt-2 ml-0.5 uppercase">{rankInfo.suffix}</span>
                                    </div>

                                    {/* Identity */}
                                    <div className="flex flex-col">
                                        <h3 className="text-5xl font-black text-zinc-900 leading-none uppercase tracking-tight mb-3">
                                            {winner.name}
                                        </h3>
                                        {winner.place && (
                                            <div className="flex items-center gap-2 text-sky-600 font-black uppercase tracking-widest text-xl opacity-90 mb-2">
                                                <MapPin size={18} strokeWidth={3} />
                                                {winner.place}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-emerald-600 uppercase tracking-widest leading-none bg-emerald-50 px-3 py-1 rounded-lg">
                                                {winner.team}
                                            </span>
                                            {winner.grade && (
                                                <span className="text-lg font-black uppercase bg-zinc-800 text-white px-3 py-1 rounded-md border border-zinc-700">
                                                    Grade {winner.grade}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Points Badge */}
                                {showPoints && (
                                    <div className="text-right flex flex-col items-end">
                                        <div className={`text-7xl font-black ${pointColor} tabular-nums leading-none tracking-tighter`}>
                                            +{winner.points}
                                        </div>
                                        <div className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-2">Points Earned</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer: Institutional Branding */}
                <div className="mt-16 pt-12 border-t border-zinc-100/50 flex justify-between items-end">
                    <div className="space-y-1">
                        <h4 className="text-3xl font-black text-zinc-800 uppercase tracking-tighter">{footerText}</h4>
                        <p className="text-lg font-bold text-zinc-500 uppercase tracking-widest">{settings.heading}</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.4em] mb-2">Event Year</p>
                             <p className="text-3xl font-black text-zinc-800 font-mono tracking-tighter">2025</p>
                        </div>
                        {settings.institutionDetails?.logoUrl ? (
                            <img src={settings.institutionDetails.logoUrl} className="h-20 w-20 object-contain grayscale opacity-80" alt="Logo" />
                        ) : (
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
                                <Globe size={40} className="text-zinc-300" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Text Glow Helper (for backgrounds) */}
            <style>{`
                .drop-shadow-sm { text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-in { animation: slide-in 0.6s ease-out forwards; }
            `}</style>
        </div>
    );
};

// --- Main Page Component ---
const CreativeStudio: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const { state, updateSettings } = useFirebase();
    const [template, setTemplate] = useState<TemplateType>('CLASSIC');
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [selectedBgUrl, setSelectedBgUrl] = useState<string | null>(null);
    const [showPoints, setShowPoints] = useState(true);
    const [scale, setScale] = useState(0.5);
    const [isControlsOpen, setIsControlsOpen] = useState(!isMobile);
    const [hasInitialized, setHasInitialized] = useState(false);

    const mainContainerRef = useRef<HTMLDivElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    // Toggle controls on mobile
    const toggleControls = () => setIsControlsOpen(!isControlsOpen);

    // Dynamic scale logic: Fits 1080px to available screen space
    useEffect(() => {
        const calculateScale = () => {
            if (mainContainerRef.current) {
                const padding = isMobile ? 24 : 100;
                const availableWidth = mainContainerRef.current.offsetWidth - padding; 
                const availableHeight = mainContainerRef.current.offsetHeight - padding;
                const widthScale = availableWidth / 1080;
                const heightScale = availableHeight / 1080;
                const newScale = Math.min(widthScale, heightScale, 1);
                setScale(newScale);
            }
        };

        const timerId = setTimeout(calculateScale, 100);
        window.addEventListener('resize', calculateScale);
        return () => {
            clearTimeout(timerId);
            window.removeEventListener('resize', calculateScale);
        };
    }, [selectedItemId, isMobile, selectedBgUrl, isControlsOpen]);

    // Sanitized Declared Items List (No Ghosts)
    const declaredItems = useMemo(() => {
        if (!state) return [];
        return state.results
            .filter(r => r.status === ResultStatus.DECLARED)
            .map(r => {
                const item = state.items.find(i => i.id === r.itemId);
                // Only return valid objects where the item data actually exists
                return item ? {
                    id: r.itemId,
                    name: item.name,
                    result: r
                } : null;
            })
            .filter((entry): entry is { id: string; name: string; result: any } => entry !== null);
    }, [state]);

    // Auto-select last declared result on mount
    useEffect(() => {
        if (state && !hasInitialized) {
            if (declaredItems.length > 0) {
                setSelectedItemId(declaredItems[declaredItems.length - 1].id);
            }
            setHasInitialized(true);
        }
    }, [state, declaredItems, hasInitialized]);

    const posterData = useMemo(() => {
        if (!state || !selectedItemId) return null;
        
        // Find result in the sanitized list to ensure indexing matches visibility
        const listIndex = declaredItems.findIndex(i => i.id === selectedItemId);
        if (listIndex === -1) return null;

        const result = declaredItems[listIndex].result;
        const item = state.items.find(i => i.id === selectedItemId);
        const category = state.categories.find(c => c.id === item?.categoryId);
        
        const winners = result.winners
            .filter((w: any) => w.position > 0)
            .sort((a: any, b: any) => a.position - b.position)
            .map((w: any) => {
                const p = state.participants.find(part => part.id === w.participantId);
                const t = state.teams.find(team => team.id === p?.teamId);
                
                let pointsWon = 0;
                if (w.position === 1) pointsWon += item?.points.first || 0;
                else if (w.position === 2) pointsWon += item?.points.second || 0;
                else if (w.position === 3) pointsWon += item?.points.third || 0;

                const gConfig = item?.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group;
                const g = w.gradeId ? gConfig.find(grade => grade.id === w.gradeId) : null;
                if (g) pointsWon += (item?.gradePointsOverride?.[g.id] ?? g.points);

                return {
                    rank: w.position,
                    name: item?.type === ItemType.GROUP ? `${p?.name} & Party` : (p?.name || 'Unknown'),
                    place: p?.place,
                    team: t?.name || 'Unknown',
                    grade: g?.name,
                    points: pointsWon
                };
            });

        return {
            itemId: selectedItemId,
            itemName: item?.name || '',
            categoryName: category?.name || '',
            // resultNumber is strictly based on the current list index + 1
            resultNumber: String(listIndex + 1),
            winners
        } as PosterData;
    }, [state, selectedItemId, declaredItems]);

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && state) {
            const reader = new FileReader();
            reader.onload = async () => {
                const compressed = await compressBgImage(reader.result as string);
                const existingBgs = state.settings.customBackgrounds || [];
                await updateSettings({ customBackgrounds: [...existingBgs, compressed] });
                setSelectedBgUrl(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteBg = async (idx: number) => {
        if (!state) return;
        const bgs = [...(state.settings.customBackgrounds || [])];
        const removed = bgs.splice(idx, 1)[0];
        if (selectedBgUrl === removed) setSelectedBgUrl(null);
        await updateSettings({ customBackgrounds: bgs });
    };

    const handleDownload = async () => {
        const canvas = document.getElementById('poster-canvas-el');
        if (!canvas) return;
        try {
            const captured = await html2canvas(canvas as HTMLElement, { 
                scale: 3, useCORS: true, backgroundColor: null, logging: false
            });
            const link = document.createElement('a');
            link.download = `artfest-poster-${selectedItemId}.png`;
            link.href = captured.toDataURL('image/png', 1.0);
            link.click();
        } catch (err) {
            console.error("Capture failed:", err);
            alert("Failed to generate image.");
        }
    };

    if (!state) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-zinc-400" size={48} /></div>;

    return (
        <div className="flex flex-col h-full bg-amazio-light-bg dark:bg-amazio-bg animate-in fade-in duration-500 overflow-hidden relative">
            
            {/* Header: Ultra-Compact */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-4 bg-amazio-light-bg dark:bg-amazio-bg z-30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                        <Palette size={16} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xs sm:text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none truncate">Studio</h2>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-none group">
                        <select 
                            value={selectedItemId} 
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="w-full appearance-none bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg pl-2 pr-6 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer sm:min-w-[160px]"
                        >
                            <option value="">-- Result --</option>
                            {declaredItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={10} />
                    </div>
                    
                    <button 
                        disabled={!selectedItemId}
                        onClick={handleDownload} 
                        className="bg-amazio-primary text-white p-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amazio-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
                    >
                        <Download size={12} strokeWidth={3} /> <span className="hidden sm:inline">Save HQ</span>
                    </button>
                </div>
            </div>
            
            {/* Workspace Wrapper */}
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                
                {/* Mobile Drawer Backdrop */}
                {isMobile && isControlsOpen && (
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
                        onClick={() => setIsControlsOpen(false)}
                    />
                )}

                {/* Sidebar: Optimized Spacing */}
                <aside className={`
                    fixed lg:relative bottom-0 left-0 right-0 lg:right-auto lg:w-72 
                    bg-white dark:bg-zinc-900 border-t lg:border-t-0 lg:border-r border-zinc-200 dark:border-zinc-800 
                    flex flex-col z-50 transition-transform duration-300 ease-out
                    ${isMobile ? (isControlsOpen ? 'translate-y-0 h-[50vh] rounded-t-3xl shadow-2xl' : 'translate-y-full h-0') : 'h-full translate-y-0'}
                `}>
                    {isMobile && (
                        <div className="flex justify-center p-2" onClick={() => setIsControlsOpen(false)}>
                            <div className="w-8 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Background Manager: Compact */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Library</h3>
                                <button onClick={() => bgInputRef.current?.click()} className="p-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md"><Plus size={14}/></button>
                                <input type="file" id="bg-upload-input" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                            </div>
                            
                            <div className="flex lg:grid lg:grid-cols-3 gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 no-scrollbar">
                                <button 
                                    onClick={() => setSelectedBgUrl(null)}
                                    className={`shrink-0 w-12 h-12 lg:w-auto lg:aspect-square rounded-lg border flex items-center justify-center transition-all ${!selectedBgUrl ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-100 bg-zinc-50'}`}
                                >
                                    <Type size={14} className="text-zinc-400" />
                                </button>
                                {(state.settings.customBackgrounds || []).map((bg, idx) => (
                                    <div key={idx} className="relative shrink-0 w-12 h-12 lg:w-auto lg:aspect-square">
                                        <img 
                                            src={bg} 
                                            onClick={() => setSelectedBgUrl(bg)}
                                            className={`w-full h-full object-cover rounded-lg cursor-pointer border transition-all ${selectedBgUrl === bg ? 'border-indigo-500' : 'border-transparent'}`} 
                                        />
                                        <button 
                                            onClick={() => handleDeleteBg(idx)}
                                            className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white p-0.5 rounded-full shadow-lg"
                                        >
                                            <X size={8} strokeWidth={4}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Display Options: NEW */}
                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Settings</h3>
                            <button 
                                onClick={() => setShowPoints(!showPoints)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${showPoints ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-transparent text-zinc-500 border-zinc-100'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Award size={14} />
                                    <span>Include Points</span>
                                </div>
                                {showPoints ? <Check size={10} strokeWidth={3}/> : <X size={10} strokeWidth={3}/>}
                            </button>
                        </div>

                        {/* Template Selection: Compact */}
                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Templates</h3>
                            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 no-scrollbar">
                                {(Object.keys(TEMPLATES) as TemplateType[]).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => { setTemplate(t); if(isMobile) setIsControlsOpen(false); }}
                                        className={`shrink-0 lg:w-full flex items-center justify-between px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${template === t ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-transparent text-zinc-500 border-zinc-100'}`}
                                    >
                                        <span className="truncate">{TEMPLATES[t].name}</span>
                                        {template === t && <Check size={10} strokeWidth={3}/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <main ref={mainContainerRef} className="flex-grow overflow-hidden flex flex-col items-center justify-center bg-zinc-200/50 dark:bg-black relative p-2 sm:p-10">
                    {posterData ? (
                        <div className="relative flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div 
                                className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
                                style={{ 
                                    width: `${1080 * scale}px`, 
                                    height: `${1080 * scale}px`,
                                    transition: 'all 0.2s ease-out'
                                }}
                            >
                                <div id="poster-canvas-el" className="w-full h-full">
                                    <PosterCanvas 
                                        data={posterData} 
                                        template={template} 
                                        settings={state.settings} 
                                        scale={scale} 
                                        customBg={selectedBgUrl}
                                        showPoints={showPoints}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center opacity-20 text-zinc-500 text-center px-6">
                            <ImageIcon size={64} strokeWidth={1} />
                            <p className="text-sm font-black uppercase tracking-widest mt-4">Select Source</p>
                        </div>
                    )}
                </main>

                {/* Mobile FAB: Smaller */}
                {isMobile && (
                    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[60]">
                        <button 
                            onClick={toggleControls}
                            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isControlsOpen ? 'bg-zinc-800 text-white' : 'bg-indigo-600 text-white'}`}
                        >
                            {isControlsOpen ? <X size={18} /> : <Settings2 size={18} />}
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default CreativeStudio;
