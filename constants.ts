import { Settings, Users, ClipboardList, Medal, Hash, LayoutDashboard, UserPlus, Calendar, Edit3, BarChart2, FileText, Home, Scale, Gavel, Palette, Timer, Monitor } from 'lucide-react';
import { UserRole } from './types';

export const TABS = {
  DASHBOARD: 'Dashboard',
  PROJECTOR: 'Projector Mode',
  GENERAL_SETTINGS: 'Settings',
  TEAMS_CATEGORIES: 'Teams & Categories',
  ITEMS: 'Items', 
  GRADE_POINTS: 'Codes & Grades',
  JUDGES_MANAGEMENT: 'Judges & Assignments',
  DATA_ENTRY: 'Data Entry',
  SCHEDULE: 'Schedule',
  ITEM_TIMER: 'Stage Timer',
  SCORING_RESULTS: 'Scoring & Results',
  POINTS: 'Points',
  REPORTS: 'Reports',
  CREATIVE_STUDIO: 'E-Poster & Certificate',
};

// Map each tab to a Tailwind color base
export const TAB_COLORS: { [key: string]: string } = {
    [TABS.DASHBOARD]: 'sky',
    [TABS.PROJECTOR]: 'purple',
    [TABS.DATA_ENTRY]: 'emerald',
    [TABS.ITEMS]: 'teal',
    [TABS.TEAMS_CATEGORIES]: 'emerald',
    [TABS.GRADE_POINTS]: 'amber',
    [TABS.JUDGES_MANAGEMENT]: 'indigo',
    [TABS.SCHEDULE]: 'purple',
    [TABS.ITEM_TIMER]: 'orange',
    [TABS.SCORING_RESULTS]: 'rose',
    [TABS.GENERAL_SETTINGS]: 'zinc',
    [TABS.POINTS]: 'yellow',
    [TABS.REPORTS]: 'cyan',
    [TABS.CREATIVE_STUDIO]: 'pink',
};

export const TAB_DISPLAY_NAMES: { [key: string]: string } = {
    [TABS.ITEMS]: 'Items & Participants',
    [TABS.CREATIVE_STUDIO]: 'E-Poster & Certificate',
    [TABS.ITEM_TIMER]: 'Stage Timer',
    [TABS.PROJECTOR]: 'Live Projector',
};

export const PAGES_WITH_GLOBAL_FILTERS = [
    TABS.DATA_ENTRY,
    TABS.ITEMS,
    TABS.POINTS,
    TABS.REPORTS,
    TABS.GRADE_POINTS,
    TABS.SCORING_RESULTS,
    TABS.ITEM_TIMER,
];

export const USER_ROLES = {
    MANAGER: UserRole.MANAGER,
    TEAM_LEADER: UserRole.TEAM_LEADER,
    THIRD_PARTY: UserRole.THIRD_PARTY,
    JUDGE: UserRole.JUDGE,
};

// FIX: Changed type from { [key: string]: string[] } to { [key in UserRole]: string[] } to match AppState interface
export const DEFAULT_PAGE_PERMISSIONS: { [key in UserRole]: string[] } = {
    [UserRole.MANAGER]: Object.values(TABS),
    [UserRole.TEAM_LEADER]: [
        TABS.DASHBOARD,
        TABS.DATA_ENTRY,
        TABS.SCHEDULE,
        TABS.POINTS,
        TABS.REPORTS,
        TABS.CREATIVE_STUDIO,
    ],
    [UserRole.THIRD_PARTY]: [
        TABS.DASHBOARD,
        TABS.REPORTS,
        TABS.CREATIVE_STUDIO,
        TABS.SCHEDULE
    ],
    [UserRole.JUDGE]: [
        TABS.DASHBOARD,
        TABS.SCORING_RESULTS,
        TABS.ITEM_TIMER,
    ],
};

export const INITIALIZATION_SUB_PAGE_ICONS = {
    'Settings': Settings,
    'Teams & Categories': Users,
    'Items': ClipboardList,
    'Codes & Grades': Medal,
    'Judges & Assignments': Gavel,
};

export const SIDEBAR_GROUPS = [
    {
        title: 'Overview',
        tabs: [TABS.DASHBOARD]
    },
    {
        title: 'Management',
        tabs: [
            TABS.DATA_ENTRY,
            TABS.ITEMS,
            TABS.TEAMS_CATEGORIES,
            TABS.GRADE_POINTS,
            TABS.JUDGES_MANAGEMENT,
            TABS.SCHEDULE,
            TABS.ITEM_TIMER,
            TABS.SCORING_RESULTS,
            TABS.GENERAL_SETTINGS
        ]
    },
    {
        title: 'Analytics & Output',
        tabs: [TABS.POINTS, TABS.REPORTS, TABS.CREATIVE_STUDIO]
    }
];