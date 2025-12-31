
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TABS, SIDEBAR_GROUPS } from './constants';
import { useFirebase } from './hooks/useFirebase';
import { User, UserRole } from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DataEntryPage from './pages/DataEntry';
import SchedulePage from './pages/Schedule';
import JudgementPage from './pages/JudgementPage';
import PointsPage from './pages/Points';
import ReportsPage from './pages/Reports';
import DashboardPage from './pages/Dashboard';
import CreativeStudio from './pages/CreativeStudio'; 
import ItemTimerPage from './pages/ItemTimer';
import ProjectorView from './pages/ProjectorView'; 
import LandingPage from './pages/LandingPage'; // Updated: Changed from LoginPage to LandingPage
import InstructionDisplay from './components/InstructionDisplay';
import FloatingNavRail from './components/FloatingNavRail';
import GlobalFontManager from './components/GlobalFontManager';

import GeneralSettings from './pages/initialization/GeneralSettings';
import TeamsAndCategories from './pages/initialization/TeamsAndCategories';
import ItemsManagement from './pages/initialization/ItemsManagement';
import GradePoints from './pages/initialization/GradePoints';
import JudgesManagement from './pages/initialization/JudgesManagement';

type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const { 
    state, currentUser, loading, logout, hasPermission,
    dataEntryView, setDataEntryView,
    itemsSubView, setItemsSubView,
    gradeSubView, setGradeSubView,
    judgesSubView, setJudgesSubView,
    settingsSubView, setSettingsSubView,
    setGlobalFilters, setGlobalSearchTerm
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    return hash && Object.values(TABS).includes(hash) ? hash : TABS.DASHBOARD;
  });

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainContentRef = useRef<HTMLElement>(null);

  const isProjectorMode = activeTab === TABS.PROJECTOR;

  useEffect(() => {
    // Reset filters and search when switching tabs to ensure a clean state
    setGlobalFilters({
        teamId: currentUser?.role === UserRole.TEAM_LEADER && currentUser?.teamId ? [currentUser.teamId] : [],
        categoryId: [],
        performanceType: [],
        itemId: [],
        status: [],
        date: [],
        stage: []
    });
    setGlobalSearchTerm('');

    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
      setIsHeaderVisible(true);
    }
  }, [activeTab, currentUser, setGlobalFilters, setGlobalSearchTerm]);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('theme') as Theme;
        return stored || 'dark'; 
    }
    return 'dark';
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    const applyTheme = (t: Theme) => {
        let effectiveTheme = t;
        if (t === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        if (!root.classList.contains(effectiveTheme)) {
            root.classList.remove('light', 'dark');
            root.classList.add(effectiveTheme);
        }

        if (metaThemeColor) {
            const hexColor = effectiveTheme === 'dark' ? '#0F1210' : '#FAF8F3';
            if (metaThemeColor.getAttribute('content') !== hexColor) {
                metaThemeColor.setAttribute('content', hexColor);
            }
        }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      if (width >= 1024) {
          if (!isSidebarExpanded) setIsSidebarExpanded(true);
      } else if (width < 768) {
          if (isSidebarExpanded) setIsSidebarExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarExpanded]);

  useEffect(() => {
    if (currentUser && !hasPermission(activeTab)) {
      setActiveTab(TABS.DASHBOARD);
    }
  }, [currentUser, activeTab, hasPermission]);
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = decodeURIComponent(window.location.hash.substring(1));
      if (hash && Object.values(TABS).includes(hash) && hasPermission(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [hasPermission]);

  const handleSetActiveTab = (tab: string) => {
    if (hasPermission(tab)) {
      setActiveTab(tab);
      window.location.hash = encodeURIComponent(tab);
      if (isMobile && isSidebarExpanded) setIsSidebarExpanded(false);
    }
  };

  // --- Sub-navigation Mapping for 2-finger Swipes ---
  const navigateSubView = useCallback((direction: 'next' | 'prev') => {
    const delta = direction === 'next' ? 1 : -1;
    
    switch(activeTab) {
      case TABS.DATA_ENTRY: {
        const views: ('ITEMS' | 'PARTICIPANTS')[] = ['ITEMS', 'PARTICIPANTS'];
        const idx = views.indexOf(dataEntryView);
        const nextIdx = (idx + delta + views.length) % views.length;
        setDataEntryView(views[nextIdx]);
        break;
      }
      case TABS.ITEMS: {
        const views: ('ITEMS' | 'PARTICIPANTS')[] = ['ITEMS', 'PARTICIPANTS'];
        const idx = views.indexOf(itemsSubView);
        const nextIdx = (idx + delta + views.length) % views.length;
        setItemsSubView(views[nextIdx]);
        break;
      }
      case TABS.GRADE_POINTS: {
        const views: ('CODES' | 'GRADES')[] = ['CODES', 'GRADES'];
        const idx = views.indexOf(gradeSubView);
        const nextIdx = (idx + delta + views.length) % views.length;
        setGradeSubView(views[nextIdx]);
        break;
      }
      case TABS.JUDGES_MANAGEMENT: {
        const views: ('ASSIGNMENTS' | 'REGISTRY' | 'OVERVIEW')[] = ['ASSIGNMENTS', 'REGISTRY', 'OVERVIEW'];
        const idx = views.indexOf(judgesSubView);
        const nextIdx = (idx + delta + views.length) % views.length;
        setJudgesSubView(views[nextIdx]);
        break;
      }
      case TABS.GENERAL_SETTINGS: {
        const views = ['details', 'display', 'users', 'instructions', 'data'];
        const idx = views.indexOf(settingsSubView);
        const nextIdx = (idx + delta + views.length) % views.length;
        setSettingsSubView(views[nextIdx]);
        break;
      }
    }
  }, [activeTab, dataEntryView, itemsSubView, gradeSubView, judgesSubView, settingsSubView, setDataEntryView, setItemsSubView, setGradeSubView, setJudgesSubView, setSettingsSubView]);

  // --- Main Navigation Mapping for 3-finger Swipes ---
  const navigateMainTab = useCallback((direction: 'next' | 'prev') => {
    const flatTabs = SIDEBAR_GROUPS.flatMap(g => g.tabs).filter(t => hasPermission(t));
    const idx = flatTabs.indexOf(activeTab);
    const delta = direction === 'next' ? 1 : -1;
    const nextIdx = (idx + delta + flatTabs.length) % flatTabs.length;
    handleSetActiveTab(flatTabs[nextIdx]);
  }, [activeTab, hasPermission, handleSetActiveTab]);

  // Unified Multi-finger Gesture Listener
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let fingerCount = 0;

    const handleTouchStart = (e: TouchEvent) => {
      fingerCount = e.touches.length;
      // We only care about horizontal gestures for these triggers
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Ensure it's mostly a horizontal movement
      if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 50) return;

      if (fingerCount === 1) {
        // Feature 1: Swipe right anywhere to show sidebar
        if (!isSidebarExpanded && deltaX > 70) {
          setIsSidebarExpanded(true);
        }
        // Swipe left to close sidebar
        else if (isSidebarExpanded && deltaX < -70) {
          setIsSidebarExpanded(false);
        }
      } 
      else if (fingerCount === 2) {
        // Feature 2: Two finger swipe for sections
        if (deltaX < -70) navigateSubView('next');
        else if (deltaX > 70) navigateSubView('prev');
      }
      else if (fingerCount === 3) {
        // Feature 3: Three finger swipe for main pages
        if (deltaX < -70) navigateMainTab('next');
        else if (deltaX > 70) navigateMainTab('prev');
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isSidebarExpanded, navigateSubView, navigateMainTab]);

  const toggleSidebarExpansion = () => {
      setIsSidebarExpanded(prev => !prev);
  };

  const handleBackdropClick = () => {
      setIsSidebarExpanded(false);
  };

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!isMobile) return;
    
    const currentScrollY = e.currentTarget.scrollTop;
    const deltaY = currentScrollY - lastScrollY.current;

    // To get a "full screen experience", we hide the header on any scroll 
    // unless we are near the very top of the page.
    if (currentScrollY > 60) {
        if (Math.abs(deltaY) > 5) {
            if (isHeaderVisible) setIsHeaderVisible(false);
        }
    } else {
        if (!isHeaderVisible) setIsHeaderVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (!isMobile) return;

    const target = e.target as HTMLElement;
    const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
    if (interactive) return;

    setIsHeaderVisible(prev => !prev);
  };

  const renderContent = () => {
    if (!hasPermission(activeTab)) {
      return (
        <div className="p-8 text-center bg-red-50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-red-500/20 m-8">
          <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">Permission Denied</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">You do not have access to this page.</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case TABS.GENERAL_SETTINGS: return <GeneralSettings />;
      case TABS.TEAMS_CATEGORIES: return <TeamsAndCategories />;
      case TABS.ITEMS: return <ItemsManagement />;
      case TABS.GRADE_POINTS: return <GradePoints />;
      case TABS.JUDGES_MANAGEMENT: return <JudgesManagement />;
      case TABS.DATA_ENTRY: return <DataEntryPage currentUser={currentUser} />;
      case TABS.SCHEDULE: return <SchedulePage />;
      case TABS.SCORING_RESULTS: return <JudgementPage isMobile={isMobile} />;
      case TABS.ITEM_TIMER: return <ItemTimerPage />;
      case TABS.POINTS: return <PointsPage />;
      case TABS.REPORTS: return <ReportsPage />;
      case TABS.CREATIVE_STUDIO: return <CreativeStudio isMobile={isMobile} />;
      case TABS.PROJECTOR: return <ProjectorView onNavigate={handleSetActiveTab} />;
      case TABS.DASHBOARD: return <DashboardPage setActiveTab={handleSetActiveTab} />;
      default: return <DashboardPage setActiveTab={handleSetActiveTab} />;
    }
  };

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amazio-light-bg dark:bg-amazio-bg transition-colors">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-amazio-neon/20 blur-xl rounded-full"></div>
          <svg className="animate-spin h-12 w-12 text-amazio-secondary dark:text-amazio-accent mx-auto relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-6 text-amazio-primary dark:text-amazio-muted font-medium tracking-wide relative z-10">INITIALIZING AMAZIO OS...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Updated: Changed from LoginPage to LandingPage
    return <LandingPage theme={theme} toggleTheme={(t) => toggleTheme(t)} settings={state.settings} />;
  }

  if (isProjectorMode) {
    return (
        <div className="min-h-screen bg-black overflow-hidden relative">
            <GlobalFontManager />
            {renderContent()}
        </div>
    );
  }

  const isMobileSticky = isMobile && state.settings.mobileSidebarMode === 'sticky';

  return (
    <div className="relative min-h-screen flex font-sans overflow-hidden text-amazio-primary dark:text-zinc-100">
      
      <GlobalFontManager />

      {isMobile && state.settings.enableFloatingNav !== false && !isSidebarExpanded && !isMobileSticky && (
        <FloatingNavRail 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            hasPermission={hasPermission} 
        />
      )}

      {isMobile && !isMobileSticky && (
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] transition-opacity duration-500 ease-in-out ${
            isSidebarExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab} 
        isExpanded={isSidebarExpanded}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebarExpansion}
        isMobile={isMobile}
        handleLogout={logout}
        currentUser={currentUser}
        hasPermission={hasPermission}
      />

      <div className={`
        flex-1 flex flex-col h-screen max-w-full overflow-hidden relative transition-all duration-500 ease-in-out
        ${state.settings.enableFloatingNav !== false && isMobile && !isSidebarExpanded && !isMobileSticky ? 'pl-0' : ''}
        ${isMobileSticky ? 'pl-[50px]' : ''}
      `}>
        <Header 
            pageTitle={activeTab} 
            onMenuClick={toggleSidebarExpansion}
            handleLogout={logout}
            currentUser={currentUser}
            theme={theme}
            toggleTheme={toggleTheme}
            isVisible={isHeaderVisible}
        />
        <main 
            ref={mainContentRef} 
            onScroll={handleMainScroll}
            onClick={handleContentClick}
            className={`flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar ${activeTab === TABS.CREATIVE_STUDIO ? 'p-0' : 'px-2 py-0 sm:px-4 sm:py-3 lg:p-4'} transition-all duration-300`}
        >
            <div className={`
                ${activeTab === TABS.CREATIVE_STUDIO ? 'flex-1 h-full flex flex-col' : 'max-w-7xl mx-auto md:space-y-4 sm:space-y-6'}
                transition-all
            `}>
                {/* Header spacer for fixed position on mobile */}
                <div className="md:hidden">
                    <div className="h-[env(safe-area-inset-top)]"></div>
                    <div className="h-14"></div>
                </div>

                {activeTab !== TABS.CREATIVE_STUDIO && <InstructionDisplay pageTitle={activeTab} />}
                {renderContent()}
            </div>
            {activeTab !== TABS.CREATIVE_STUDIO && <div className="h-12"></div>}
        </main>
      </div>
    </div>
  );
};

export default App;
