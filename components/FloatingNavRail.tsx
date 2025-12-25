
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { 
    LayoutDashboard, Settings, UserPlus, Calendar, Edit3, 
    BarChart2, FileText, Palette, ClipboardList, Users, Medal, Gavel,
    ChevronDown, ChevronUp, Timer
} from 'lucide-react';
import { TABS, INITIALIZATION_SUB_PAGE_ICONS, TAB_COLORS } from '../constants';

interface FloatingNavRailProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    hasPermission: (tab: string) => boolean;
}

const FloatingNavRail: React.FC<FloatingNavRailProps> = ({ activeTab, setActiveTab, hasPermission }) => {
    const { state } = useFirebase();
    
    // Initialize position from local storage or default
    const [pos, setPos] = useState(() => {
        if (typeof window !== 'undefined') {
             const savedY = localStorage.getItem('floating_nav_y');
             const savedX = localStorage.getItem('floating_nav_x');
             // Default to right side if not set (window width - approx width - margin)
             const defaultX = window.innerWidth - 60; 
             return {
                 x: savedX ? parseFloat(savedX) : defaultX,
                 y: savedY ? parseFloat(savedY) : window.innerHeight / 2 - 200
             };
        }
        return { x: 10, y: 300 };
    });
    
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('floating_nav_collapsed');
            return saved === 'true'; 
        }
        return true; 
    });
    
    const [isDragging, setIsDragging] = useState(false);
    const posRef = useRef(pos);
    const dragStartOffset = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const railRef = useRef<HTMLDivElement>(null);
    const ignoreMouseRef = useRef(false);

    useEffect(() => {
        posRef.current = pos;
    }, [pos]);

    // Reset event listener for settings page
    useEffect(() => {
        const handleReset = () => {
            const defaultY = window.innerHeight / 2 - 250;
            const defaultX = window.innerWidth - 60;
            const newPos = { x: defaultX, y: defaultY };
            setPos(newPos);
            posRef.current = newPos;
            localStorage.removeItem('floating_nav_y');
            localStorage.removeItem('floating_nav_x');
            setIsCollapsed(true);
            localStorage.setItem('floating_nav_collapsed', 'true');
        };
        window.addEventListener('reset-floating-nav', handleReset);
        return () => window.removeEventListener('reset-floating-nav', handleReset);
    }, []);

    // Correctly mapped nav items ordered to match Sidebar Groups
    const navItems = [
        // Overview
        { id: TABS.DASHBOARD, icon: LayoutDashboard },
        
        // Management
        { id: TABS.DATA_ENTRY, icon: UserPlus },
        { id: TABS.ITEMS, icon: INITIALIZATION_SUB_PAGE_ICONS['Items'] || ClipboardList },
        { id: TABS.TEAMS_CATEGORIES, icon: INITIALIZATION_SUB_PAGE_ICONS['Teams & Categories'] || Users },
        { id: TABS.GRADE_POINTS, icon: INITIALIZATION_SUB_PAGE_ICONS['Codes & Grades'] || Medal }, 
        { id: TABS.JUDGES_MANAGEMENT, icon: INITIALIZATION_SUB_PAGE_ICONS['Judges & Assignments'] || Gavel },
        { id: TABS.SCHEDULE, icon: Calendar },
        { id: TABS.ITEM_TIMER, icon: Timer },
        { id: TABS.SCORING_RESULTS, icon: Edit3 },
        { id: TABS.GENERAL_SETTINGS, icon: Settings },

        // Analytics & Output
        { id: TABS.POINTS, icon: BarChart2 },
        { id: TABS.REPORTS, icon: FileText },
        { id: TABS.CREATIVE_STUDIO, icon: Palette },
    ].filter(item => hasPermission(item.id));

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        const clientX = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = (window.TouchEvent && e instanceof TouchEvent) ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        let newX = clientX - dragStartOffset.current.x;
        let newY = clientY - dragStartOffset.current.y;
        
        const railWidth = railRef.current?.clientWidth || 48;
        const railHeight = railRef.current?.clientHeight || 60;
        
        const maxX = window.innerWidth - railWidth - 8;
        const maxH = window.innerHeight - railHeight - 20; 
        const minH = 60;
        
        if (newX < 8) newX = 8;
        if (newX > maxX) newX = maxX;
        if (newY < minH) newY = minH;
        if (newY > maxH) newY = maxH;
        
        const newPos = { x: newX, y: newY };
        setPos(newPos);
        posRef.current = newPos;
    }, []);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchend', handleEnd);
        
        const currentX = posRef.current.x;
        const currentY = posRef.current.y;
        const startX = dragStartPos.current.x;
        const startY = dragStartPos.current.y;
        const moveDist = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        
        // Treat as click if moved very little
        if (moveDist < 10) {
            setIsCollapsed(prev => {
                const newState = !prev;
                localStorage.setItem('floating_nav_collapsed', newState.toString());
                return newState;
            });
        } else {
            // Snap to edges
            const railWidth = railRef.current?.clientWidth || 48;
            const windowWidth = window.innerWidth;
            const midpoint = windowWidth / 2;
            let finalX = 8; // Snap Left
            if (currentX + (railWidth / 2) > midpoint) finalX = windowWidth - railWidth - 8; // Snap Right
            
            const snappedPos = { x: finalX, y: currentY };
            setPos(snappedPos);
            posRef.current = snappedPos;
            localStorage.setItem('floating_nav_x', finalX.toString());
            localStorage.setItem('floating_nav_y', currentY.toString());
        }
    }, [handleMove]);

    const handleStart = (clientX: number, clientY: number, type: 'mouse' | 'touch') => {
        // Debounce touch vs mouse to prevent double firing
        if (type === 'touch') {
            ignoreMouseRef.current = true;
            setTimeout(() => { ignoreMouseRef.current = false; }, 1000);
        } else if (ignoreMouseRef.current) return;
        
        setIsDragging(true);
        dragStartOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
        dragStartPos.current = { x: pos.x, y: pos.y };
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    };

    if (state?.settings.enableFloatingNav === false) return null;

    return (
        <div 
            ref={railRef}
            style={{ 
                top: `${pos.y}px`, 
                left: `${pos.x}px`,
            }}
            className={`fixed z-[1000] flex flex-col items-center w-14 ${isDragging ? 'scale-105 cursor-grabbing' : 'cursor-grab transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'}`}
        >
            {/* Drag Handle & Toggle */}
            <div 
                style={{ touchAction: 'none' }} 
                className="w-full h-14 flex items-center justify-center cursor-grab active:cursor-grabbing group z-20"
                onMouseDown={(e) => handleStart(e.clientX, e.clientY, 'mouse')}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY, 'touch')}
            >
                <div className="transition-transform duration-300 flex flex-col items-center justify-center gap-0.5 bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-zinc-200/50 dark:border-white/10">
                    {/* Visual Grip Indicators */}
                    <div className="w-6 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full"></div>
                    <div className="transition-transform duration-300 mt-1">
                        {isCollapsed ? <ChevronDown size={20} className="text-zinc-600 dark:text-zinc-300" /> : <ChevronUp size={20} className="text-zinc-600 dark:text-zinc-300" />}
                    </div>
                </div>
            </div>

            {/* Icons List */}
            <div 
                className={`flex flex-col gap-1.5 w-full overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 pb-0 scale-y-0 origin-top' : 'max-h-[60vh] opacity-100 pb-2 pt-1 scale-y-100 origin-top'}`}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start from list area
                onTouchStart={(e) => e.stopPropagation()} // Prevent drag start from list area
                style={{ touchAction: 'pan-y' }} // Allow vertical scrolling of the list itself
            >
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    const colorKey = TAB_COLORS[item.id] || 'emerald';
                    // Construct Tailwind classes dynamically
                    const activeBgClass = `bg-${colorKey}-500`;
                    const activeShadowClass = `shadow-${colorKey}-500/40`;

                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); }}
                            className={`relative group p-2.5 rounded-full transition-all duration-200 flex items-center justify-center shrink-0 mx-auto w-10 h-10 ${
                                isActive 
                                ? `${activeBgClass} ${activeShadowClass} text-white shadow-lg scale-110` 
                                : 'bg-white/90 dark:bg-black/90 backdrop-blur-sm text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 shadow-md border border-zinc-100 dark:border-white/5'
                            }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
                            
                            {/* Tooltip Label (Optional for context) */}
                            <span className="absolute right-full mr-3 px-2 py-1 bg-black/80 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {item.id}
                            </span>
                        </button>
                    );
                })}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

export default FloatingNavRail;
