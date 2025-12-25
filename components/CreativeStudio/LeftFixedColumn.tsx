
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Ensure this is imported
import {
    Type, Image as ImageIcon, Upload, Square, Circle, Plus, ChevronDown,
    Settings2, Save, LayoutDashboard, Palette, Layout, HomeIcon, ArrowLeft,
    Trash2, Edit3, Wand2, User, Trophy, FileText, Check
} from 'lucide-react';
import { CollapsibleCard } from '../../components/CollapsibleCard'; // Ensure correct import for CollapsibleCard
import { Template } from '../../types';

// PRESET_SIZES constant (moved from CreativeStudioEditor to be accessible by LeftFixedColumn)
const PRESET_SIZES = [
    { label: 'A4', w: 210, h: 297 },
    { label: 'Letter', w: 216, h: 279 },
    { label: 'Insta Post', w: 108, h: 108 },
    { label: 'Insta Story', w: 108, h: 192 },
    { label: 'Certificate', w: 297, h: 210 }, // A4 Landscape
];


interface LeftFixedColumnProps {
    onAddText: (type: 'heading' | 'subheading' | 'body' | 'footer') => void;
    onAddImage: (content: string) => void;
    onAddPlaceholderImage: () => void;
    onAddShape: (shapeType: 'rectangle' | 'circle') => void;

    // Props for Canvas Settings
    canvasWidth: number;
    setCanvasWidth: (width: number) => void;
    canvasHeight: number;
    setCanvasHeight: (height: number) => void;
    orientation: 'portrait' | 'landscape';
    toggleOrientation: () => void;
    setPresetSize: (w: number, h: number) => void;

    // Props for Save Current Design
    templateName: string;
    setTemplateName: (name: string) => void;
    saveAsTemplate: () => Promise<void>;
    isSavingTemplate: boolean;

    // Props for Load Data
    selectedItemId: string;
    setSelectedItemId: (id: string) => void;
    declaredItems: { id: string; result: any; name: string; }[];
    
    // New Props for Data Population Mode
    populateMode: 'RESULT' | 'PARTICIPANT';
    setPopulateMode: (mode: 'RESULT' | 'PARTICIPANT') => void;
    selectedParticipantId: string;
    setSelectedParticipantId: (id: string) => void;
    availableParticipants: { id: string; name: string; chestNumber: string; }[];

    // Props for Background
    bgColor: string;
    setBgColor: (color: string) => void;
    bgImage: string;
    setBgImage: (image: string) => void;

    // New Props for Templates Integration
    allTemplates: Template[];
    loadNewDesign: (template: Template | null) => void;
    currentTemplateId: string | null;
    onCreateBlankCanvas: () => void;
    deleteCustomTemplate: (templateId: string) => Promise<void>;
}

const LeftFixedColumn: React.FC<LeftFixedColumnProps> = ({ 
    onAddText, 
    onAddImage, 
    onAddPlaceholderImage, 
    onAddShape,
    canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight,
    orientation, toggleOrientation, setPresetSize,
    templateName, setTemplateName, saveAsTemplate, isSavingTemplate,
    selectedItemId, setSelectedItemId, declaredItems,
    populateMode, setPopulateMode, selectedParticipantId, setSelectedParticipantId, availableParticipants,
    bgColor, setBgColor, bgImage, setBgImage,
    allTemplates, loadNewDesign, currentTemplateId, onCreateBlankCanvas, deleteCustomTemplate
}) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const bgImageInputRef = useRef<HTMLInputElement>(null);
    
    // Dropdown states for Add elements
    const [showTextDropdown, setShowTextDropdown] = useState(false);
    const [showImageDropdown, setShowImageDropdown] = useState(false);
    const [showShapeDropdown, setShowShapeDropdown] = useState(false);

    // Dropdown states for the new config panels
    const [showCanvasSettingsDropdown, setShowCanvasSettingsDropdown] = useState(false);
    const [showSaveDesignDropdown, setShowSaveDesignDropdown] = useState(false);
    const [showLoadDataDropdown, setShowLoadDataDropdown] = useState(false);
    const [showBackgroundDropdown, setShowBackgroundDropdown] = useState(false);
    const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false); // New: Templates Dropdown


    // Refs for the buttons/labels themselves acting as anchors
    const textBtnRef = useRef<HTMLButtonElement>(null);
    const imageBtnRef = useRef<HTMLLabelElement>(null); 
    const shapeBtnRef = useRef<HTMLButtonElement>(null);
    const canvasSettingsBtnRef = useRef<HTMLButtonElement>(null);
    const saveDesignBtnRef = useRef<HTMLButtonElement>(null);
    const loadDataBtnRef = useRef<HTMLButtonElement>(null);
    const backgroundBtnRef = useRef<HTMLButtonElement>(null);
    const templatesBtnRef = useRef<HTMLButtonElement>(null); // New: Templates Button Ref

    // Refs for the dropdown content itself (portals)
    const textDropdownContentRef = useRef<HTMLDivElement>(null);
    const imageDropdownContentRef = useRef<HTMLDivElement>(null);
    const shapeDropdownContentRef = useRef<HTMLDivElement>(null);
    const canvasSettingsDropdownContentRef = useRef<HTMLDivElement>(null);
    const saveDesignDropdownContentRef = useRef<HTMLDivElement>(null);
    const loadDataDropdownContentRef = useRef<HTMLDivElement>(null);
    const backgroundDropdownContentRef = useRef<HTMLDivElement>(null);
    const templatesDropdownContentRef = useRef<HTMLDivElement>(null); // New: Templates Dropdown Content Ref


    const closeAllDropdowns = useCallback(() => {
        setShowTextDropdown(false);
        setShowImageDropdown(false);
        setShowShapeDropdown(false);
        setShowCanvasSettingsDropdown(false);
        setShowSaveDesignDropdown(false);
        setShowLoadDataDropdown(false);
        setShowBackgroundDropdown(false);
        setShowTemplatesDropdown(false); // New: Templates Dropdown
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdownsAndRefs: Array<{ isOpen: boolean; anchorRef: React.RefObject<HTMLElement>; contentRef: React.RefObject<HTMLDivElement>; }> = [
                { isOpen: showTextDropdown, anchorRef: textBtnRef, contentRef: textDropdownContentRef },
                { isOpen: showImageDropdown, anchorRef: imageBtnRef, contentRef: imageDropdownContentRef },
                { isOpen: showShapeDropdown, anchorRef: shapeBtnRef, contentRef: shapeDropdownContentRef },
                { isOpen: showCanvasSettingsDropdown, anchorRef: canvasSettingsBtnRef, contentRef: canvasSettingsDropdownContentRef },
                { isOpen: showSaveDesignDropdown, anchorRef: saveDesignBtnRef, contentRef: saveDesignDropdownContentRef },
                { isOpen: showLoadDataDropdown, anchorRef: loadDataBtnRef, contentRef: loadDataDropdownContentRef },
                { isOpen: showBackgroundDropdown, anchorRef: backgroundBtnRef, contentRef: backgroundDropdownContentRef },
                { isOpen: showTemplatesDropdown, anchorRef: templatesBtnRef, contentRef: templatesDropdownContentRef }, // New: Templates Dropdown
            ];
            
            // Check if the click occurred inside any active dropdown's anchor or content
            const isClickInsideActiveDropdown = dropdownsAndRefs.some(dr => 
                dr.isOpen && (
                    (dr.anchorRef.current && dr.anchorRef.current.contains(event.target as Node)) ||
                    (dr.contentRef.current && dr.contentRef.current.contains(event.target as Node))
                )
            );
            
            // If the click was not inside any active dropdown's anchor or content, close all
            if (!isClickInsideActiveDropdown) {
                closeAllDropdowns();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [
        showTextDropdown, showImageDropdown, showShapeDropdown,
        showCanvasSettingsDropdown, showSaveDesignDropdown, showLoadDataDropdown, showBackgroundDropdown, showTemplatesDropdown,
        closeAllDropdowns
    ]);

    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onAddImage(reader.result as string);
                closeAllDropdowns();
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Clear input for next selection
        }
    };

    const handleBgImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setBgImage(reader.result as string);
                setBgColor('transparent'); // Clear solid color when image is set
                // No immediate close, as user might want to adjust other background settings.
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Clear input for next selection
        }
    };

    const handleSaveTemplateAndClose = async () => {
        await saveAsTemplate();
        closeAllDropdowns();
    }

    const handleSelectedItemIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedItemId(e.target.value);
    }

    const handleTemplateClick = (template: Template | null) => {
        loadNewDesign(template);
        closeAllDropdowns(); // Keep this, as loading a new design usually means closing the menu
    };


    // Corrected DropdownMenu Component for portal rendering
    const DropdownMenu: React.FC<{
        children: React.ReactNode;
        isOpen: boolean;
        onClose: () => void; // Keep onClose for explicit calls if needed, but not strictly used for click outside anymore
        anchorRef: React.RefObject<HTMLElement>;
        contentRef: React.RefObject<HTMLDivElement>; // Added contentRef
        widthClass?: string; // Optional width class
    }> = ({ children, isOpen, onClose, anchorRef, contentRef, widthClass = 'w-40' }) => {
        if (!isOpen || !anchorRef.current) return null;

        const anchorRect = anchorRef.current.getBoundingClientRect();

        const style: React.CSSProperties = {
            position: 'fixed', // Position relative to the viewport
            top: anchorRect.top, // Align top with the anchor
            zIndex: 999, // Set a high z-index to ensure it's on top
            transform: `translateY(-${(anchorRect.height / 2) - 16}px)` // Vertically center next to the button
        };

        // Position to the right of the anchor
        style.left = anchorRect.right + 8; // 8px margin from the anchor

        return ReactDOM.createPortal(
            <div 
                ref={contentRef} // Apply ref to the outermost div
                className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-left duration-200 ${widthClass}`}
                style={style}
            >
                {children}
            </div>,
            document.body // Render directly into body
        );
    };

    const DropdownItem: React.FC<{
        icon: React.ElementType;
        label: string;
        onClick: () => void;
        description?: string; // Added description prop
    }> = ({ icon: Icon, label, onClick, description }) => (
        <button
            onClick={onClick}
            className="w-full flex flex-col items-start gap-1 p-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-md transition-colors"
        >
            <div className="flex items-center gap-2">
                <Icon size={16} /> <span className="font-medium">{label}</span>
            </div>
            {description && <p className="text-[10px] text-zinc-500 pl-7">{description}</p>}
        </button>
    );

    return (
        <div className="hidden lg:flex flex-col flex-shrink-0 w-12 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full overflow-y-auto custom-scrollbar">
            <div className="flex flex-col p-1.5 gap-1.5 pt-4">
                <h3 className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Add</h3>
                
                {/* Add Text Dropdown */}
                <button 
                    ref={textBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowTextDropdown(true); }}
                    title="Add Text"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <Type size={18} />
                    {showTextDropdown && (
                        <DropdownMenu isOpen={showTextDropdown} onClose={closeAllDropdowns} anchorRef={textBtnRef} contentRef={textDropdownContentRef} >
                            <DropdownItem icon={Type} label="Heading" onClick={() => { onAddText('heading'); closeAllDropdowns(); }} />
                            <DropdownItem icon={Type} label="Subheading" onClick={() => { onAddText('subheading'); closeAllDropdowns(); }} />
                            <DropdownItem icon={Type} label="Body Text" onClick={() => { onAddText('body'); closeAllDropdowns(); }} />
                            <DropdownItem icon={FileText} label="Footer Text" onClick={() => { onAddText('footer'); closeAllDropdowns(); }} />
                        </DropdownMenu>
                    )}
                </button>

                {/* Add Image Dropdown */}
                <label 
                    ref={imageBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowImageDropdown(true); }}
                    title="Add Image"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                >
                    <ImageIcon size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} ref={imageInputRef} />
                    {showImageDropdown && (
                        <DropdownMenu isOpen={showImageDropdown} onClose={closeAllDropdowns} anchorRef={imageBtnRef} contentRef={imageDropdownContentRef} >
                            <DropdownItem icon={Upload} label="Upload Image" onClick={() => { imageInputRef.current?.click(); closeAllDropdowns(); }} />
                            <DropdownItem icon={ImageIcon} label="Placeholder" onClick={() => { onAddPlaceholderImage(); closeAllDropdowns(); }} />
                        </DropdownMenu>
                    )}
                </label>

                {/* Add Shape Dropdown */}
                <button 
                    ref={shapeBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowShapeDropdown(true); }}
                    title="Add Shape"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <Square size={18} /> {/* Using Square as a generic shape icon */}
                    {showShapeDropdown && (
                        <DropdownMenu isOpen={showShapeDropdown} onClose={closeAllDropdowns} anchorRef={shapeBtnRef} contentRef={shapeDropdownContentRef} >
                            <DropdownItem icon={Square} label="Rectangle" onClick={() => { onAddShape('rectangle'); closeAllDropdowns(); }} />
                            <DropdownItem icon={Circle} label="Circle" onClick={() => { onAddShape('circle'); closeAllDropdowns(); }} />
                        </DropdownMenu>
                    )}
                </button>

                {/* Separator */}
                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>

                {/* --- TOOLS SECTION --- */}
                <h3 className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Tools</h3>

                {/* Canvas Settings Dropdown */}
                <button
                    ref={canvasSettingsBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowCanvasSettingsDropdown(true); }}
                    title="Canvas Settings"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <Settings2 size={18} />
                    {showCanvasSettingsDropdown && (
                        <DropdownMenu isOpen={showCanvasSettingsDropdown} onClose={closeAllDropdowns} anchorRef={canvasSettingsBtnRef} contentRef={canvasSettingsDropdownContentRef} widthClass="w-64">
                            <CollapsibleCard title="Canvas Settings" defaultOpen={true} className='!rounded-none !border-none !shadow-none !bg-transparent !dark:bg-transparent'>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Preset Sizes</label>
                                        <select
                                            className="w-full p-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium"
                                            onChange={(e) => {
                                                const preset = PRESET_SIZES.find(p => p.label === e.target.value);
                                                if (preset) setPresetSize(preset.w, preset.h);
                                            }}
                                            value={PRESET_SIZES.find(p => p.w === canvasWidth && p.h === canvasHeight)?.label || ''}
                                        >
                                            <option value="">-- Custom --</option>
                                            {PRESET_SIZES.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Width (mm)</label>
                                            <input type="number" value={canvasWidth} onChange={e => setCanvasWidth(+e.target.value)} className="w-full p-2 text-xs border rounded bg-white dark:bg-zinc-900" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Height (mm)</label>
                                            <input type="number" value={canvasHeight} onChange={e => setCanvasHeight(+e.target.value)} className="w-full p-2 text-xs border rounded bg-white dark:bg-zinc-900" />
                                        </div>
                                    </div>
                                    <button onClick={toggleOrientation} className="w-full py-1.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                                        <Layout size={14} /> Toggle Orientation ({orientation})
                                    </button>
                                </div>
                            </CollapsibleCard>
                        </DropdownMenu>
                    )}
                </button>

                {/* Background Dropdown */}
                <button
                    ref={backgroundBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowBackgroundDropdown(true); }}
                    title="Background"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <Palette size={18} />
                    {showBackgroundDropdown && (
                        <DropdownMenu isOpen={showBackgroundDropdown} onClose={closeAllDropdowns} anchorRef={backgroundBtnRef} contentRef={backgroundDropdownContentRef} widthClass="w-64">
                            <CollapsibleCard title="Background" defaultOpen={true} className='!rounded-none !border-none !shadow-none !bg-transparent !dark:bg-transparent'>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Solid Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setBgImage(''); }} className="w-8 h-8 rounded cursor-pointer border-none" />
                                            <span className="text-xs text-zinc-500 self-center">{bgColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Upload Image</label>
                                        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                                            <Upload size={14} />
                                            <span className="text-xs text-zinc-500">Choose File...</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleBgImageFileSelect} ref={bgImageInputRef} />
                                        </label>
                                        {bgImage && (
                                            <div className="mt-2 flex items-center justify-between">
                                                <img src={bgImage} alt="Background" className="h-12 w-auto object-contain rounded-md" />
                                                <button onClick={() => setBgImage('')} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleCard>
                        </DropdownMenu>
                    )}
                </button>

                {/* Separator */}
                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>

                {/* --- TEMPLATES & DATA SECTION --- */}
                <h3 className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Templates</h3>

                {/* Templates Dropdown */}
                <button
                    ref={templatesBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowTemplatesDropdown(true); }}
                    title="Load Template"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <LayoutDashboard size={18} />
                    {showTemplatesDropdown && (
                        <DropdownMenu isOpen={showTemplatesDropdown} onClose={closeAllDropdowns} anchorRef={templatesBtnRef} contentRef={templatesDropdownContentRef} widthClass="w-72">
                            <CollapsibleCard title="Load Design" defaultOpen={true} className='!rounded-none !border-none !shadow-none !bg-transparent !dark:bg-transparent'>
                                <div className="space-y-4">
                                    <div className="pt-2">
                                        <button onClick={onCreateBlankCanvas} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                            <Plus size={16}/> New Blank Canvas
                                        </button>
                                    </div>
                                    
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
                                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Preset Templates</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {allTemplates.filter(t => !t.isCustom).map(template => (
                                                <div 
                                                    key={template.id} 
                                                    onClick={() => handleTemplateClick(template)}
                                                    className={`p-2 rounded-lg text-xs cursor-pointer border flex justify-between items-center group
                                                        ${currentTemplateId === template.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
                                                    `}
                                                >
                                                    <span className="font-medium">{template.name}</span>
                                                    <Wand2 size={14} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                                </div>
                                            ))}
                                        </div>

                                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 mt-4 mb-2 border-t border-zinc-100 dark:border-zinc-700/50 pt-2">My Custom Templates</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {allTemplates.filter(t => t.isCustom).map(template => (
                                                <div 
                                                    key={template.id} 
                                                    onClick={() => handleTemplateClick(template)}
                                                    className={`p-2 rounded-lg text-xs cursor-pointer border flex justify-between items-center group
                                                        ${currentTemplateId === template.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' : 'bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}
                                                    `}
                                                >
                                                    <span className="font-medium">{template.name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(template.id); closeAllDropdowns(); }} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Template">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {allTemplates.filter(t => t.isCustom).length === 0 && <p className="text-xs italic text-zinc-400">No custom templates saved.</p>}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleCard>
                        </DropdownMenu>
                    )}
                </button>

                {/* Load Data Dropdown */}
                <button
                    ref={loadDataBtnRef}
                    onClick={(e) => { e.stopPropagation(); closeAllDropdowns(); setShowLoadDataDropdown(true); }}
                    title="Auto-Populate with Data"
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    <Wand2 size={18} />
                    {showLoadDataDropdown && (
                        <DropdownMenu isOpen={showLoadDataDropdown} onClose={closeAllDropdowns} anchorRef={loadDataBtnRef} contentRef={loadDataDropdownContentRef} widthClass="w-64">
                            <CollapsibleCard title="Populate with Data" defaultOpen={true} className='!rounded-none !border-none !shadow-none !bg-transparent !dark:bg-transparent'>
                                <div className="space-y-4">
                                    {/* Mode Toggle */}
                                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                        <button 
                                            onClick={() => setPopulateMode('RESULT')} 
                                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center justify-center gap-1 transition-all ${populateMode === 'RESULT' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                        >
                                            <Trophy size={12} /> Results
                                        </button>
                                        <button 
                                            onClick={() => setPopulateMode('PARTICIPANT')} 
                                            className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center justify-center gap-1 transition-all ${populateMode === 'PARTICIPANT' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                        >
                                            <User size={12} /> Participant
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Select Item</label>
                                        <p className="text-[9px] text-zinc-500 mb-2">Choose the event/item to pull data from.</p>
                                        <div className="relative">
                                            <select
                                                value={selectedItemId}
                                                onChange={handleSelectedItemIdChange}
                                                className="w-full p-2 pl-3 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium appearance-none"
                                            >
                                                <option value="">-- Choose Item --</option>
                                                {declaredItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                                        </div>
                                    </div>

                                    {populateMode === 'PARTICIPANT' && selectedItemId && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Select Participant</label>
                                            <p className="text-[9px] text-zinc-500 mb-2">Select a specific participant for a participation certificate.</p>
                                            <div className="relative">
                                                <select
                                                    value={selectedParticipantId}
                                                    onChange={(e) => setSelectedParticipantId(e.target.value)}
                                                    className="w-full p-2 pl-3 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium appearance-none"
                                                >
                                                    <option value="">-- Choose Person --</option>
                                                    {availableParticipants.map(p => <option key={p.id} value={p.id}>{p.chestNumber} - {p.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={12} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CollapsibleCard>
                        </DropdownMenu>
                    )}
                </button>

                {/* Separator */}
                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700 my-1"></div>

                {/* Global Save Button - Visible when not saving and templateName is set*/}
                {templateName.trim() && !isSavingTemplate && (
                    <button 
                        onClick={handleSaveTemplateAndClose} 
                        disabled={isSavingTemplate} 
                        title="Save Current Canvas as New Custom Template" 
                        className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-white bg-amazio-secondary hover:bg-amazio-secondary/90 shadow-md"
                    >
                        <Save size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LeftFixedColumn;
