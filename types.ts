export enum ItemType {
  SINGLE = 'Single',
  GROUP = 'Group',
}

export enum PerformanceType {
  ON_STAGE = 'On Stage',
  OFF_STAGE = 'Off Stage',
}

export enum ResultStatus {
  NOT_UPLOADED = 'Not Uploaded',
  UPLOADED = 'Uploaded',
  DECLARED = 'Declared',
}

export enum UserRole {
    MANAGER = 'Manager',
    TEAM_LEADER = 'Team Leader',
    THIRD_PARTY = 'Third Party',
    JUDGE = 'Judge',
}

export interface User {
    id: string; // This will be the Firestore document ID
    username: string;
    // Password removed. Auth is handled via Firebase Authentication.
    role: UserRole;
    teamId?: string; // Only for Team Leaders
    judgeId?: string; // Only for Judges
}

export interface Judge {
  id: string;
  name: string;
  place?: string;
  profession?: string;
}

export interface FontConfig {
    url: string; // Base64 Data URI or URL
    name: string; // File name
    family: string; // CSS Font Family name
}

// Custom Font with ID for lists like generalCustomFonts
export interface GeneralFontConfig extends FontConfig {
    id: string;
}

// Canvas Element definition for Creative Studio
export interface CanvasElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    content: string; // Text content or Image URL
    x: number; // Percent 0-100
    y: number; // Percent 0-100
    width?: number; // Percent 0-100 (for all types)
    height?: number; // Percent 0-100 (for all types)
    
    // Text specific
    fontSize?: number; // px
    color?: string;
    fontWeight?: string; // 'normal', 'bold', '900'
    fontStyle?: string; // 'normal', 'italic'
    textDecoration?: 'none' | 'underline' | 'line-through'; // 'none', 'underline', 'line-through'
    textTransform?: 'none' | 'uppercase' | 'lowercase'; // 'none', 'uppercase', 'lowercase'
    textAlign?: 'left' | 'center' | 'right';
    fontFamily?: string; // Custom font family for text elements
    backgroundColor?: string; // For text background
    backgroundPadding?: number; // Padding for text background
    textStroke?: { color: string; width: number }; // For text outline (simulated)
    textShadow?: { color: string; blur: number; offsetX: number; offsetY: number }; // For text shadow
    lineHeight?: number; // Added: e.g., 1.2
    letterSpacing?: number; // Added: e.g., 0 (normal), 1 (1px)

    // Image/Shape specific
    borderRadius?: number; // px or %
    borderColor?: string; // For shapes, or image border
    borderWidth?: number; // px, for shapes or image border

    // Shape specific
    shapeType?: 'rectangle' | 'circle'; // For shape elements

    // General
    zIndex: number;
    locked?: boolean;
    opacity?: number; // 0-1
    rotation?: number; // 0-360 degrees
}

export interface Template {
    id: string;
    name: string;
    bg: string;
    bgImage?: string; // Optional background image
    text: string;
    accent: string;
    border: string;
    description: string;
    isCustom?: boolean;
    elements?: CanvasElement[]; // Stored design elements
    canvasConfig?: { // Stored dimensions
        width: number; 
        height: number;
        orientation: 'portrait' | 'landscape';
    };
}

export interface Settings {
  organizingTeam: string;
  heading: string;
  description: string;
  eventDates?: string[]; // Official dates of the festival
  maxItemsPerParticipant: {
    onStage: number;
    offStage: number;
  };
  maxTotalItemsPerParticipant?: number | null; // Global total limit
  defaultParticipantsPerItem: number;
  instructions: { [page: string]: string };
  generalInstructions: string;
  rankingStrategy?: string; // 'highest_mark' | 'share_points'
  autoCodeAssignment?: boolean;
  enableFloatingNav?: boolean; // New setting for Mobile Floating Rail
  mobileSidebarMode?: 'floating' | 'sticky'; // New setting for Mobile Sidebar Style
  lotEligibleCodes?: string[]; // Array of code strings enabled for Lot System
  
  // Schedule Configuration
  eventDays?: string[];
  stages?: string[];
  timeSlots?: string[];

  defaultPoints: {
    single: {
      first: number;
      second: number;
      third: number;
    };
    group: {
      first: number;
      second: number;
      third: number;
    };
  };
  reportSettings: {
    heading: string;
    description: string;
    header: string;
    footer: string;
  };
  // New Branding Fields
  institutionDetails?: {
      name: string;
      address: string;
      email: string;
      contactNumber: string;
      description?: string;
      logoUrl?: string; // Base64 string
  };
  branding?: {
      typographyUrl?: string; // Legacy Fallback
      typographyUrlLight?: string; // Theme Light
      typographyUrlDark?: string; // Theme Dark
      teamLogoUrl?: string; // Base64 string for Organizing Team
  };
  // Custom Fonts
  customFonts?: {
      malayalam?: FontConfig;
      arabic?: FontConfig;
  };
  generalCustomFonts?: GeneralFontConfig[]; // New: For Creative Studio explicit font selection
  // Custom Templates for Creative Studio
  customTemplates?: Template[];
  // Multi-device synced assets for Creative Studio
  customFooters?: string[]; // Footers (Base64)
  customBackgrounds?: string[]; // Backgrounds (Base64)
}

export interface Category {
  id: string;
  name: string;
  // Legacy/Alternative structure kept for compatibility if needed, but flattened preferred for UI
  maxItemsPerParticipant?: {
    onStage?: number;
    offStage?: number;
  };
  // New specific limits
  maxOnStage?: number;
  maxOffStage?: number;
  maxCombined?: number; // Total items allowed for this category
  isGeneralCategory?: boolean;
}

export interface Team {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  code?: string; // Unique Item Code (e.g. A1, 105)
  description: string;
  categoryId: string;
  type: ItemType;
  performanceType: PerformanceType;
  points: {
    first: number;
    second: number;
    third: number;
  };
  gradePointsOverride?: { [gradeId: string]: number }; // Map gradeId -> Custom Points
  maxParticipants: number;
  maxGroupsPerTeam?: number; // New field: How many groups a team can field (default 1)
  medium: string;
  duration: number; // in minutes
}

export interface Grade {
  id: string;
  name: string;
  lowerLimit: number;
  upperLimit: number;
  points: number;
}

export interface GradePointConfig {
  single: Grade[];
  group: Grade[];
}

export interface CodeLetter {
  id: string;
  code: string;
  type?: 'General' | 'On-Stage' | 'Off-Stage';
}

export interface Participant {
  id: string;
  chestNumber: string;
  name: string;
  place?: string; // Location or Place name
  teamId: string;
  categoryId: string;
  itemIds: string[];
  groupLeaderItemIds?: string[]; // IDs of items where this participant is the leader
  itemGroups?: { [itemId: string]: number }; // Map itemId -> Group Number (1, 2, etc.)
  groupChestNumbers?: { [itemId: string]: string }; // Map itemId -> Custom Chest Number for the group led by this participant
  role?: 'leader' | 'assistant';
}

export interface ScheduledEvent {
  id: string;
  itemId: string;
  categoryId: string;
  date: string;
  time: string;
  stage: string;
}

export interface JudgeAssignment {
  id: string; // Composite key: `${itemId}-${categoryId}`
  itemId: string;
  categoryId: string;
  judgeIds: string[];
}

export interface TabulationEntry {
  id: string; // Composite key: `${itemId}-${participantId}`
  itemId: string;
  categoryId: string;
  participantId: string;
  codeLetter: string;
  customChestNumber?: string; // Specific chest number for group items
  marks: { [judgeId: string]: number | null };
  finalMark: number | null;
  position: number | null;
  gradeId: string | null;
}

export interface Result {
    itemId: string;
    categoryId: string;
    status: ResultStatus;
    winners: {
        participantId: string;
        position: number;
        mark: number | null;
        gradeId: string | null;
    }[];
}

export interface AppState {
  settings: Settings;
  categories: Category[];
  teams: Team[];
  items: Item[];
  gradePoints: GradePointConfig;
  codeLetters: CodeLetter[];
  participants: Participant[];
  schedule: ScheduledEvent[];
  judgeAssignments: JudgeAssignment[];
  tabulation: TabulationEntry[];
  results: Result[];
  judges: Judge[];
  users: User[];
  permissions: { [key in UserRole]: string[] };
}