import { Settings, Users, ClipboardList, Medal, Hash, LayoutDashboard, UserPlus, Calendar, Edit3, BarChart2, FileText, Home, Scale, Gavel, Palette, Timer, Monitor } from 'lucide-react';
import { UserRole } from './types';

export const TABS = {
  LANDING: 'Home',
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

// Search keywords for sub-pages and deep content
export const TAB_SEARCH_INDEX: { [key: string]: string[] } = {
    [TABS.DASHBOARD]: ['overview', 'stats', 'summary', 'latest', 'recent', 'terminal status', 'recent verdict'],
    [TABS.PROJECTOR]: ['live', 'display', 'screen', 'broadcast', 'scoreboard', 'cinematic', 'announcement'],
    [TABS.GENERAL_SETTINGS]: [
        'event details', 'display', 'layout', 'users', 'access', 'instructions', 'data', 'continuity', 
        'backup', 'restore', 'institution', 'logo', 'fonts', 'malayalam', 'arabic', 'permissions', 
        'branding', 'typography', 'export', 'import', 'reset'
    ],
    [TABS.TEAMS_CATEGORIES]: ['houses', 'levels', 'groups', 'scopes', 'categories', 'team leader', 'assistant coordinator'],
    [TABS.ITEMS]: ['registry', 'participants', 'list', 'disciplines', 'entries', 'enrollment', 'performance type', 'medium', 'duration'],
    [TABS.GRADE_POINTS]: [
        'codes', 'grades', 'lots', 'mapping', 'results logic', 'prizes', 'scoring rules', 
        'lot machine', 'spin', 'batch assign', 'overrides', 'point tiers', 'range'
    ],
    [TABS.JUDGES_MANAGEMENT]: ['assignments', 'registry', 'coverage', 'officials', 'evaluators', 'adjudicators', 'assign items'],
    [TABS.DATA_ENTRY]: ['items', 'participants', 'registry', 'list', 'delegates', 'chest number', 'enrollment'],
    [TABS.SCHEDULE]: ['timeline', 'stage', 'venue', 'calendar', 'dates', 'time', 'slots', 'ai schedule', 'optimize', 'manual scheduling'],
    [TABS.ITEM_TIMER]: ['clock', 'stopwatch', 'bell', 'warning', 'stage control', 'mute', 'overtime', 'resonant bell'],
    [TABS.SCORING_RESULTS]: ['terminal', 'judgement', 'verdict', 'declaration', 'marks', 'points', 'scoring', 'mean mark', 'standing', 'unlock'],
    [TABS.POINTS]: ['analytics', 'leaderboard', 'standing', 'tally', 'rank', 'merit', 'contributors', 'toppers', 'individual ranking'],
    [TABS.REPORTS]: [
        'print', 'pdf', 'export', 'documents', 'checklist', 'profiles', 'cards', 'id cards', 
        'valuation sheet', 'matrix', 'manual', 'program manual', 'prize winners'
    ],
    [TABS.CREATIVE_STUDIO]: ['poster', 'certificate', 'design', 'graphics', 'visual', 'e-poster', 'templates', 'canvas', 'background', 'download image'],
};

// Pages accessible without authentication
export const GUEST_PERMISSIONS = [
  TABS.LANDING,
  TABS.DASHBOARD,
  TABS.CREATIVE_STUDIO,
];

// Map each tab to a Tailwind color base
export const TAB_COLORS: { [key: string]: string } = {
    [TABS.LANDING]: 'emerald',
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
    [TABS.LANDING]: 'Welcome Home',
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

export const DEFAULT_PAGE_PERMISSIONS: { [key in UserRole]: string[] } = {
    [UserRole.MANAGER]: Object.values(TABS),
    [UserRole.TEAM_LEADER]: [
        TABS.LANDING,
        TABS.DASHBOARD,
        TABS.DATA_ENTRY,
        TABS.SCHEDULE,
        TABS.POINTS,
        TABS.REPORTS,
        TABS.CREATIVE_STUDIO,
    ],
    [UserRole.THIRD_PARTY]: [
        TABS.LANDING,
        TABS.DASHBOARD,
        TABS.REPORTS,
        TABS.CREATIVE_STUDIO,
        TABS.SCHEDULE
    ],
    [UserRole.JUDGE]: [
        TABS.LANDING,
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
        title: 'Core',
        tabs: [
            TABS.DASHBOARD,
            TABS.PROJECTOR
        ]
    },
    {
        title: 'Setup & Registry',
        tabs: [
            TABS.GENERAL_SETTINGS,
            TABS.TEAMS_CATEGORIES,
            TABS.ITEMS,
            TABS.DATA_ENTRY,
            TABS.GRADE_POINTS,
            TABS.JUDGES_MANAGEMENT
        ]
    },
    {
        title: 'Live Operations',
        tabs: [
            TABS.SCHEDULE,
            TABS.ITEM_TIMER,
            TABS.SCORING_RESULTS
        ]
    },
    {
        title: 'Analytics & Media',
        tabs: [
            TABS.POINTS, 
            TABS.REPORTS, 
            TABS.CREATIVE_STUDIO
        ]
    }
];