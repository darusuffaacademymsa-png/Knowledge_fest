import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { 
    Download, ChevronDown, 
    Loader2, Image as ImageIcon, Palette, 
    Plus, Check, Layers, X,
    Settings2, Leaf
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ResultStatus, ItemType } from '../types';

// --- Utils ---

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

type TemplateType = 'ROOTED_TREE';

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
    ROOTED_TREE: {
        name: 'Rooted Tree Official',
        bg: 'bg-[#E3EBD1]',
        text: 'text-[#283618]',
        accent: 'text-[#606C38]',
        fontTitle: 'font-slab',
        fontBody: 'font-slab'
    }
};

// --- Components ---

const PosterCanvas: React.FC<{ 
    data: PosterData; 
    scale?: number;
    id?: string;
    customBg?: string | null;
}> = ({ data, scale = 1, id, customBg }) => {
    const parts = data.categoryName.split(' ');
    const prefix = parts[0] || '';
    const suffix = parts.slice(1).join(' ');

    return (
        <div 
            id={id}
            className="relative flex flex-col overflow-hidden bg-[#E3EBD1] text-[#283618] font-slab"
            style={{ 
                width: '1080px', 
                height: '1080px', 
                transform: `scale(${scale})`, 
                transformOrigin: 'top left',
                flexShrink: 0 
            }}
        >
            {/* Background Layer (Image B) */}
            {customBg && (
                <img src={customBg} className="absolute inset-0 w-full h-full object-cover z-0" alt="Official Background" />
            )}

            {/* Dynamic Content Overlay */}
            <div className="relative z-10 w-full h-full flex flex-col p-0">
                
                {/* Header Zone: Category (Prefix/Suffix) & Item Name */}
                <div className="mt-[232px] ml-[82px] space-y-0">
                    <div className="flex items-center gap-3">
                         <h2 className="text-[108px] font-black tracking-tighter leading-[0.9]">
                            <span className="text-[#283618]">{prefix}</span>
                            {suffix && <span className="text-[#99AD59] ml-4">{suffix}</span>}
                         </h2>
                         <Leaf className="w-[62px] h-[62px] text-[#99AD59] fill-current -mt-4" />
                    </div>
                    <h3 className="text-[52px] font-bold tracking-tight text-[#4D5A2A] mt-[-10px] ml-2">
                        #{data.itemName}
                    </h3>
                </div>

                {/* Winners Zone */}
                {/* mt-[14px] provides approximately 0.4 cm gap from the Item Name block */}
                {/* space-y-[8px] slightly increased gap between winner rows to 8px (~0.2cm) */}
                <div className="mt-[14px] ml-[205px] space-y-[8px] pr-[110px]">
                    {data.winners.slice(0, 3).map((winner, idx) => (
                        <div key={idx} className="flex items-center justify-start gap-[20px] min-h-[115px]">
                            
                            {/* Identity Column (Name, Place, Team) */}
                            {/* w-[290px] preserves the shift of grade badges towards the right while keeping names in place. */}
                            <div className="w-[290px] shrink-0 min-w-0 pt-0">
                                <h4 className="text-[46px] font-black uppercase tracking-tighter leading-[1] mb-0 text-[#283618]">
                                    {winner.name}
                                </h4>
                                <p className="text-[21px] font-black text-[#606C38] uppercase tracking-[0.2em] leading-tight mt-0.5">
                                    {winner.place}
                                </p>
                                <p className="text-[17px] font-medium italic opacity-70 leading-tight mt-0.5">
                                    {winner.team}
                                </p>
                            </div>

                            {/* Grade Column - Centered vertically */}
                            {winner.grade && (
                                <div className="shrink-0 flex items-center">
                                    <div className="bg-[#9AAD59] text-[#283618] px-6 py-2 rounded-[4px] font-black text-[20px] shadow-sm whitespace-nowrap tracking-wider">
                                        GRADE {winner.grade.toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const CreativeStudio: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const { state, updateSettings } = useFirebase();
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [selectedBgUrl, setSelectedBgUrl] = useState<string | null>(null);
    const [scale, setScale] = useState(0.5);
    const [isControlsOpen, setIsControlsOpen] = useState(!isMobile);
    const [hasInitialized, setHasInitialized] = useState(false);

    const mainContainerRef = useRef<HTMLDivElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const toggleControls = () => setIsControlsOpen(!isControlsOpen);

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

    const declaredItems = useMemo(() => {
        if (!state) return [];
        return state.results
            .filter(r => r.status === ResultStatus.DECLARED)
            .map(r => {
                const item = state.items.find(i => i.id === r.itemId);
                return item ? {
                    id: r.itemId,
                    name: item.name,
                    result: r
                } : null;
            })
            .filter((entry): entry is { id: string; name: string; result: any } => entry !== null);
    }, [state]);

    useEffect(() => {
        if (state && !hasInitialized) {
            if (declaredItems.length > 0) {
                setSelectedItemId(declaredItems[declaredItems.length - 1].id);
            }
            if (state.settings.customBackgrounds?.length) {
                setSelectedBgUrl(state.settings.customBackgrounds[0]);
            }
            setHasInitialized(true);
        }
    }, [state, declaredItems, hasInitialized]);

    const posterData = useMemo(() => {
        if (!state || !selectedItemId) return null;
        
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
            resultNumber: String(listIndex + 1),
            winners
        } as PosterData;
    }, [state, selectedItemId, declaredItems]);

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const compressed = await compressBgImage(reader.result as string);
                const existingBgs = state?.settings.customBackgrounds || [];
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
            
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
                
                {isMobile && isControlsOpen && (
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
                        onClick={() => setIsControlsOpen(false)}
                    />
                )}

                <aside className={`
                    fixed lg:relative bottom-0 left-0 right-0 lg:right-auto lg:w-72 
                    bg-white dark:bg-zinc-900 border-t lg:border-t-0 lg:border-r border-zinc-200 dark:border-zinc-800 
                    flex flex-col z-50 transition-transform duration-300 ease-out
                    ${isMobile ? (isControlsOpen ? 'translate-y-0 h-[60vh] rounded-t-3xl shadow-2xl' : 'translate-y-full h-0') : 'h-full translate-y-0'}
                `}>
                    {isMobile && (
                        <div className="flex justify-center p-2" onClick={() => setIsControlsOpen(false)}>
                            <div className="w-8 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Layout Assets</h3>
                                <button onClick={() => bgInputRef.current?.click()} className="p-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md"><Plus size={14}/></button>
                                <input type="file" id="bg-upload-input" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                            </div>
                            
                            <div className="flex lg:grid lg:grid-cols-3 gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 no-scrollbar">
                                <button 
                                    onClick={() => setSelectedBgUrl(null)}
                                    className={`shrink-0 w-12 h-12 lg:w-auto lg:aspect-square rounded-lg border flex items-center justify-center transition-all ${!selectedBgUrl ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-100 bg-zinc-50'}`}
                                >
                                    <Layers size={14} className="text-zinc-400" />
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

                        <div>
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-3">Active Design</h3>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Rooted Tree Official</span>
                                <Check size={12} strokeWidth={4} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </div>
                </aside>

                <main ref={mainContainerRef} className="flex-grow overflow-hidden flex flex-col items-center justify-center bg-zinc-200/50 dark:bg-black relative p-2 sm:p-10">
                    {posterData ? (
                        <div className="relative flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div 
                                className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-[1rem] shadow-2xl overflow-hidden border border-white/10"
                                style={{ 
                                    width: `${1080 * scale}px`, 
                                    height: `${1080 * scale}px`,
                                    transition: 'all 0.2s ease-out'
                                }}
                            >
                                <div id="poster-canvas-el" className="w-full h-full">
                                    <PosterCanvas 
                                        data={posterData} 
                                        scale={scale} 
                                        customBg={selectedBgUrl}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center opacity-20 text-zinc-500 text-center px-6">
                            <ImageIcon size={64} strokeWidth={1} />
                            <p className="text-sm font-black uppercase tracking-widest mt-4">Registry Query Required</p>
                        </div>
                    )}
                </main>

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