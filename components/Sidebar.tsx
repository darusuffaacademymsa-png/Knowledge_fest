import React, { useState } from 'react';
import { TABS, SIDEBAR_GROUPS, INITIALIZATION_SUB_PAGE_ICONS, TAB_DISPLAY_NAMES, TAB_COLORS, TAB_SEARCH_INDEX } from '../constants';
import { User } from '../types';
import { Search, LayoutDashboard, UserPlus, Calendar, Edit3, BarChart2, FileText, LogOut, ChevronLeft, ChevronRight, Palette, Timer, Settings, Medal, PanelLeftOpen, PanelLeftClose, Home, Monitor } from 'lucide-react';
import { useFirebase } from '../hooks/useFirebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isExpanded: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  handleLogout: () => void;
  currentUser: User;
  hasPermission: (tab: string) => boolean;
}

const iconMap: { [key: string]: React.ElementType } = {
    [TABS.LANDING]: Home,
    [TABS.DASHBOARD]: LayoutDashboard,
    [TABS.PROJECTOR]: Monitor,
    [TABS.GENERAL_SETTINGS]: Settings,
    [TABS.TEAMS_CATEGORIES]: INITIALIZATION_SUB_PAGE_ICONS['Teams & Categories'],
    [TABS.ITEMS]: INITIALIZATION_SUB_PAGE_ICONS['Items'],
    [TABS.GRADE_POINTS]: Medal,
    [TABS.JUDGES_MANAGEMENT]: INITIALIZATION_SUB_PAGE_ICONS['Judges & Assignments'],
    [TABS.DATA_ENTRY]: UserPlus,
    [TABS.SCHEDULE]: Calendar,
    [TABS.SCORING_RESULTS]: Edit3,
    [TABS.POINTS]: BarChart2,
    [TABS.REPORTS]: FileText,
    [TABS.CREATIVE_STUDIO]: Palette,
    [TABS.ITEM_TIMER]: Timer,
};

const Sidebar: React.FC<SidebarProps> = ({ 
    activeTab, 
    setActiveTab, 
    isExpanded,
    isOpen,
    toggleSidebar, 
    isMobile,
    handleLogout, 
    currentUser, 
    hasPermission 
}) => {
  const { state, updateSettings } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  
  const isStickyMode = isMobile && state?.settings.mobileSidebarMode === 'sticky';
  
  const toggleMobileMode = () => {
      const newMode = isStickyMode ? 'floating' : 'sticky';
      updateSettings({ mobileSidebarMode: newMode });
  };

  let widthClass = isExpanded ? 'w-72' : 'w-[88px]';
  if (isStickyMode) {
      widthClass = 'w-[50px]'; 
  }
  
  const mobileTransform = isMobile 
    ? (isExpanded || isStickyMode ? 'translate-x-0' : '-translate-x-full') 
    : 'translate-x-0';

  const containerClasses = isStickyMode 
    ? `fixed left-0 top-0 h-full z-40 bg-white dark:bg-[#0F1210] border-r border-amazio-primary/5 dark:border-white/5 shadow-none flex flex-col transition-all duration-300 ${widthClass}`
    : `${widthClass} ${mobileTransform} fixed md:relative z-[999] h-screen transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col transform-gpu will-change-transform`;

  const innerContainerClasses = isStickyMode 
    ? `flex flex-col h-full overflow-hidden`
    : `absolute inset-0 m-3 rounded-2xl bg-[#FAF8F3] dark:bg-[#0F1210] md:bg-glass-gradient-light md:dark:bg-glass-gradient md:backdrop-blur-xl border border-amazio-primary/5 dark:border-white/5 shadow-xl md:shadow-glass-light md:dark:shadow-glass flex flex-col overflow-hidden transition-all duration-300 ease-in-out`;

  return (
    <aside className={containerClasses}>
      <div className={innerContainerClasses}>
        
        {!isStickyMode && (
            <div className={`flex items-center ${isExpanded ? 'px-6 py-6' : 'justify-center py-6'} transition-all duration-300 min-h-[88px]`}>
                 <div className="relative flex items-center justify-center cursor-pointer" onClick={() => handleTabClick(TABS.LANDING)}>
                    <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 blur-lg rounded-full"></div>
                    <div className={`absolute left-0 transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-10 scale-90 pointer-events-none'}`}>
                        <h1 className="text-2xl font-black font-serif tracking-tight text-amazio-primary dark:text-white drop-shadow-sm whitespace-nowrap">
                            AMAZIO <span className="text-emerald-500">2026.</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600/70 dark:text-emerald-500/60 font-bold mt-1 whitespace-nowrap">Knowledge Fest Edition</p>
                    </div>
                    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}>
                        <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 dark:from-emerald-600 dark:to-emerald-900 rounded-xl border border-white/10 flex items-center justify-center font-serif text-xl font-bold text-white shadow-lg">
                            A
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {isStickyMode && (
            <div className="py-4 flex justify-center border-b border-zinc-100 dark:border-white/5 cursor-pointer" onClick={() => handleTabClick(TABS.LANDING)}>
                 <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-700 dark:from-emerald-600 dark:to-emerald-900 rounded-lg flex items-center justify-center font-serif text-sm font-bold text-white shadow-md">
                    A
                </div>
            </div>
        )}

        {!isStickyMode && (
            <div className="px-3 mb-2 relative" onClick={(e) => e.stopPropagation()}>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="relative group px-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find features..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/40 dark:bg-black/20 border border-amazio-primary/5 dark:border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-sm text-zinc-800 dark:text-zinc-300 placeholder-zinc-500 dark:placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-400/50 focus:bg-white/60 dark:focus:bg-black/40 transition-all"
                        />
                    </div>
                </div>
                <div className={`absolute top-0 left-0 right-0 flex justify-center transition-all duration-300 ease-in-out ${!isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                     <button onClick={toggleSidebar} className="p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-white transition-colors">
                         <Search className="h-5 w-5" />
                     </button>
                </div>
            </div>
        )}

        {isStickyMode && (
             <div className="py-2 flex justify-center" onClick={(e) => e.stopPropagation()}>
                 <button className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors">
                     <Search className="h-4 w-4" />
                 </button>
             </div>
        )}

        <nav className={`flex-1 overflow-y-auto scroll-smooth custom-scrollbar ${isStickyMode ? 'px-1 py-2 space-y-4' : 'px-3 py-2 space-y-6'} scrollbar-hide overflow-x-hidden`}>
             {SIDEBAR_GROUPS.map((group, gIdx) => {
                const visibleTabsInGroup = group.tabs.filter(tab => {
                    if (!hasPermission(tab)) return false;
                    if (!lowerCaseSearchTerm) return true;

                    const display = (TAB_DISPLAY_NAMES[tab] || tab).toLowerCase();
                    const keywords = TAB_SEARCH_INDEX[tab] || [];
                    
                    // Check tab name OR any keywords associated with its subpages/content
                    return display.includes(lowerCaseSearchTerm) || 
                           keywords.some(k => k.toLowerCase().includes(lowerCaseSearchTerm));
                });

                if (visibleTabsInGroup.length === 0) return null;

                const groupColor = gIdx === 0 ? 'text-sky-500' : gIdx === 1 ? 'text-emerald-500' : 'text-amber-500';

                return (
                    <div key={group.title} className={isStickyMode ? 'flex flex-col gap-1 items-center' : ''}>
                        {!isStickyMode && (
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-8 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}`}>
                                <h3 className={`px-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-60 ${groupColor}`}>
                                    {group.title}
                                </h3>
                            </div>
                        )}
                        <div className={`space-y-1 ${isStickyMode ? 'w-full flex flex-col items-center' : ''}`}>
                            {visibleTabsInGroup.map(tab => {
                                const Icon = iconMap[tab];
                                const isActive = activeTab === tab;
                                const colorKey = TAB_COLORS[tab] || 'emerald';
                                const displayName = TAB_DISPLAY_NAMES[tab] || tab;

                                const textClass = isActive ? `text-${colorKey}-600 dark:text-${colorKey}-400` : `group-hover:text-${colorKey}-500`;
                                const bgClass = `bg-${colorKey}-500/5`;
                                const barClass = `bg-${colorKey}-500`;
                                
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabClick(tab)}
                                        title={(!isExpanded || isStickyMode) ? displayName : ''}
                                        className={`group relative flex items-center w-full p-3 rounded-xl transition-all duration-200 ease-out overflow-hidden
                                            ${isActive 
                                                ? 'text-amazio-primary dark:text-white shadow-sm bg-white/60 dark:bg-white/5' 
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5'}
                                            ${(!isExpanded || isStickyMode) ? 'justify-center !p-2.5 !w-9 !h-9 !rounded-lg' : ''}
                                        `}
                                    >
                                        {isActive && !isStickyMode && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full shadow-sm ${barClass}`}></div>
                                        )}
                                        {isActive && isStickyMode && (
                                            <div className={`absolute inset-0 rounded-lg border border-${colorKey}-500/30 bg-${colorKey}-500/10`}></div>
                                        )}
                                        
                                        {Icon && (
                                            <div className={`transition-all duration-300 flex-shrink-0 ${isExpanded && !isStickyMode ? 'mr-3' : 'mr-0'}`}>
                                                <Icon 
                                                    className={`h-5 w-5 transition-transform duration-300 ${textClass} ${isActive ? 'scale-110' : ''} ${isStickyMode ? 'h-4 w-4' : ''}`} 
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                />
                                            </div>
                                        )}
                                        
                                        {!isStickyMode && (
                                            <span 
                                                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${isExpanded 
                                                        ? 'opacity-100 max-w-[200px] translate-x-0' 
                                                        : 'opacity-0 max-w-0 -translate-x-4'} 
                                                    text-sm font-medium tracking-wide 
                                                    ${isActive ? 'text-amazio-primary dark:text-white font-bold' : `text-zinc-600 dark:text-zinc-400 group-hover:text-${colorKey}-700 dark:group-hover:text-${colorKey}-300`}
                                                `}
                                            >
                                                {displayName}
                                            </span>
                                        )}

                                        <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 ${bgClass} ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
             })}
        </nav>

        <div className={`p-4 border-t border-amazio-primary/5 dark:border-white/5 bg-white/30 dark:bg-black/20 ${isStickyMode ? '!p-2' : ''}`}>
            <div className={`flex items-center ${isExpanded && !isStickyMode ? 'justify-between' : 'flex-col gap-4'}`}>
                {!isStickyMode && (
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 p-[1px] flex-shrink-0">
                             <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                                <span className="font-bold text-xs text-emerald-600 dark:text-teal-400">{currentUser.username.substring(0,2).toUpperCase()}</span>
                             </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-amazio-primary dark:text-white truncate">{currentUser.username}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{currentUser.role}</p>
                        </div>
                    </div>
                )}

                <div className={`flex items-center ${isStickyMode ? 'flex-col gap-3 w-full' : 'gap-1'}`}>
                    {isMobile && (
                        <button 
                            onClick={toggleMobileMode}
                            title={isStickyMode ? "Switch to Floating" : "Switch to Sticky"}
                            className={`p-2 rounded-lg transition-colors ${isStickyMode ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'text-zinc-500 hover:text-indigo-600 hover:bg-white/40 dark:hover:bg-white/5'}`}
                        >
                            {isStickyMode ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                        </button>
                    )}

                    <button 
                        onClick={handleLogout}
                        title="Sign Out"
                        className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                    
                    {!isStickyMode && (
                        <button 
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-zinc-500 hover:text-emerald-600 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-colors hidden md:block"
                        >
                            {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </button>
                    )}
                </div>
            </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;