import JSZip from 'jszip';
import { AlignJustify, Book, CheckSquare, Calendar, Download, File, FileCheck, FileDown, FileText, Grid3X3, Layers, Printer, Square, Stamp, Trophy, UserSquare2, Crown } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import Card from '../components/Card';
import ReportViewer from '../components/ReportViewer';
import { useFirebase } from '../hooks/useFirebase';
import { Item, ItemType, Participant, PerformanceType, ResultStatus, ScheduledEvent } from '../types';

// Simple Arrow Component for internal usage
const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

const CountBadge = ({ count, label = '' }: { count: number, label?: string }) => (
    <div className="absolute top-2 right-2 bg-amazio-secondary dark:bg-amazio-accent text-white dark:text-amazio-bg text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 border border-white dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
        {count} {label}
    </div>
);

const ReportsPage: React.FC = () => {
  const { state, globalFilters } = useFirebase();
  const [reportContent, setReportContent] = useState<{ title: string; content: string; isSearchable: boolean; hideHeader?: boolean; hideFooter?: boolean } | null>(null);
  const [isPaginated, setIsPaginated] = useState(true);
  const [showEnrollmentMarks, setShowEnrollmentMarks] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  
  const getTeamName = (id: string) => state?.teams.find(t => t.id === id)?.name || 'N/A';
  const getCategoryName = (id: string) => state?.categories.find(c => c.id === id)?.name || 'N/A';
  
  // --- Memoized Data for Reports & Badges ---

  const filteredParticipants = useMemo(() => {
      if (!state) return [];
      return state.participants.filter(p => {
            const teamMatch = globalFilters.teamId.length === 0 || globalFilters.teamId.includes(p.teamId);
            const categoryMatch = globalFilters.categoryId.length === 0 || globalFilters.categoryId.includes(p.categoryId);
            if (!teamMatch || !categoryMatch) return false;

            if (globalFilters.itemId.length > 0 && !p.itemIds.some(id => globalFilters.itemId.includes(id))) return false;

            if (globalFilters.performanceType.length > 0) {
                return p.itemIds.some(itemId => {
                    const item = state.items.find(i => i.id === itemId);
                    return item && globalFilters.performanceType.includes(item.performanceType);
                });
            }
            return true;
        }).sort((a, b) => a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true }));
  }, [state, globalFilters]);

  const filteredItems = useMemo(() => {
      if (!state) return [];
      return state.items.filter(item => 
            (globalFilters.categoryId.length === 0 || globalFilters.categoryId.includes(item.categoryId)) &&
            (globalFilters.performanceType.length === 0 || globalFilters.performanceType.includes(item.performanceType)) &&
            (globalFilters.itemId.length === 0 || globalFilters.itemId.includes(item.id))
          );
  }, [state, globalFilters]);

  const filteredSchedule = useMemo(() => {
      if (!state) return [];
      return state.schedule.filter(event => {
          const item = state.items.find(i => i.id === event.itemId);
          const category = state.categories.find(c => c.id === event.categoryId);
          
          if (!item) return false; // Filter out orphaned schedule entries

          if (globalFilters.categoryId.length > 0 && !globalFilters.categoryId.includes(category?.id || '')) return false;
          if (globalFilters.performanceType.length > 0 && !globalFilters.performanceType.includes(item?.performanceType || '')) return false;
          if (globalFilters.itemId.length > 0 && !globalFilters.itemId.includes(item.id)) return false;
          return true;
      });
  }, [state, globalFilters]);

  const filteredResults = useMemo(() => {
      if (!state) return [];
      return state.results.filter(r => {
           if (r.status !== ResultStatus.DECLARED) return false;
           const item = state.items.find(i => i.id === r.itemId);
           const category = state.categories.find(c => c.id === r.categoryId);
           
           if (!item || !category) return false; // Filter out orphaned results

           if (globalFilters.categoryId.length > 0 && !globalFilters.categoryId.includes(category?.id || '')) return false;
           if (globalFilters.performanceType.length > 0 && !globalFilters.performanceType.includes(item?.performanceType || '')) return false;
           if (globalFilters.itemId.length > 0 && !globalFilters.itemId.includes(item.id)) return false;
           return true;
      });
  }, [state, globalFilters]);

  // --- Report Generators ---

  const getStyles = () => `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Roboto+Slab:wght@400;500;600;700;800&display=swap');
      
      :root {
        --primary: #1F2B1B;
        --secondary: #6A7B45;
        --text-primary: #2C3628;
        --text-muted: #6D7568;
        --border: #E0E2D9;
        --table-header: #F4F6F0;
        --brand-green: #283E25;
      }
      
      h1, h2, h3, h4, h5, h6 { font-family: 'Roboto Slab', serif; color: var(--primary) !important; }
      table, tr, td, p, li, div, span, a { color: var(--text-primary); font-family: 'Plus Jakarta Sans', sans-serif; }

      table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 13px; border: 1px solid var(--border); table-layout: fixed; }
      th, td { border: 1px solid var(--border); padding: 6px 8px; text-align: left; word-wrap: break-word; overflow: hidden; } 
      thead { background-color: var(--table-header) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
      th { font-weight: 700; color: var(--primary) !important; font-size: 11px; text-transform: uppercase; }
      tr:nth-child(even) { background-color: #FBFBFA !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      
      .page-break-before-always { page-break-before: always; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }
    </style>
  `;

  const getWatermarkHTML = () => {
    if (!showWatermark) return '';
    const text = state?.settings.heading || 'Event Name';
    const typographyUrl = state?.settings.branding?.typographyUrl;

    return `
    <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-family: 'Roboto Slab', serif;
        font-weight: 900;
        color: #1F2B1B;
        opacity: 0.06;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
        user-select: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 15px;
    " class="watermark-layer">
        ${typographyUrl ? `<img src="${typographyUrl}" style="max-width: 600px; width: 50vw; height: auto; object-fit: contain; filter: grayscale(100%); opacity: 0.8;" />` : ''}
        <div style="font-size: 6vw; line-height: 1; text-transform: uppercase;">${text}</div>
    </div>
    <style>
        @media print {
            .watermark-layer {
                display: flex !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
    `;
  };
  
  const generateParticipantProfiles = (paginated: boolean) => {
    if (!state) return;
    if (filteredParticipants.length === 0) { alert("No participants found for current filters."); return; }
    const profileStyles = ` <style> .profile-wrapper { page-break-inside: avoid; margin-bottom: 2rem; border: 2px solid #1F2B1B; border-radius: 12px; padding: 1.5rem; background: #FFFFFF; position: relative; overflow: hidden; z-index: 1; } .profile-header { text-align: center; border-bottom: 1px solid #E0E2D9; padding-bottom: 1rem; margin-bottom: 1rem; } .profile-name { font-family: 'Roboto Slab', serif; font-size: 1.75rem; font-weight: 700; color: #1F2B1B; margin: 0; text-transform: uppercase; } .profile-chest { font-family: 'Roboto Slab', serif; font-size: 1.5rem; font-weight: 800; color: #6A7B45; margin-top: 5px; } .profile-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 1rem; } .profile-details div { background: #F9F9F6; padding: 0.5rem; border-radius: 6px; } .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; } .schedule-table th { background-color: #6A7B45 !important; color: white; padding: 4px; } .schedule-table td { border: 1px solid #ddd; padding: 4px; } </style> `;
    let html = `${getStyles()}${profileStyles}${getWatermarkHTML()}<h3>Participant Profiles</h3>`;
    filteredParticipants.forEach((p, index) => {
      const team = getTeamName(p.teamId); const category = getCategoryName(p.categoryId);
      const participantScheduledItems = p.itemIds.map(itemId => { const item = state.items.find(i => i.id === itemId); const schedule = state.schedule.find(s => s.itemId === itemId && s.categoryId === p.categoryId); return { item, schedule }; }).filter(si => si.item).sort((a, b) => { if (a.schedule && b.schedule) { const dateComp = (a.schedule as ScheduledEvent).date.localeCompare((b.schedule as ScheduledEvent).date); if (dateComp !== 0) return dateComp; return (a.schedule as ScheduledEvent).time.localeCompare((b.schedule as ScheduledEvent).time); } return (a.item?.name || '').localeCompare(b.item?.name || ''); });
      const wrapperClass = (paginated && index > 0) ? 'profile-wrapper page-break-before-always' : 'profile-wrapper';
      html += ` <div class="${wrapperClass}"> <div class="profile-header"> <div class="profile-name">${p.name}</div> ${p.place ? `<div style="text-align:center; font-size:0.9rem; font-weight:700; color:#666; text-transform:uppercase; margin-top:4px;">${p.place}</div>` : ''} <div class="profile-chest">Chest No: ${p.chestNumber}</div> </div> <div class="profile-details"> <div><strong>Team:</strong> ${team}</div> <div><strong>Category:</strong> ${category}</div> </div> ${participantScheduledItems.length > 0 ? ` <h4>Registered Items</h4> <table class="schedule-table"> <thead><tr><th>Item</th><th>Date</th><th>Time</th><th>Stage</th></tr></thead> <tbody> ${participantScheduledItems.map(si => ` <tr> <td>${si.item?.name}</td> <td>${si.schedule?.date || '-'}</td> <td>${si.schedule?.time || '-'}</td> <td>${si.schedule?.stage || '-'}</td> </tr> `).join('')} </tbody> </table> ` : '<p>No items registered.</p>'} </div> `;
    });
    setReportContent({ title: 'Participant Profiles', content: html, isSearchable: true });
  };

  const generateIDCards = () => {
    if (!state) return;
    if (filteredParticipants.length === 0) { alert("No participants found for current filters."); return; }
    const idCardStyles = ` <style> @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto+Slab:wght@700;800&display=swap'); :root { --card-border: #e2e8f0; --card-shadow: rgba(0, 0, 0, 0.05); --header-bg: #f8fafc; --primary-text: #1e293b; --secondary-text: #64748b; --accent-color: #4D5A2A; --accent-light: #9AA86A; } body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; margin: 0; padding: 20px; } .id-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: flex-start; z-index: 1; position: relative; } .id-card { width: 320px; border: 1px solid var(--card-border); border-radius: 12px; background: #fff; box-shadow: 0 4px 6px -1px var(--card-shadow); overflow: hidden; display: flex; flex-direction: column; page-break-inside: avoid; position: relative; margin-bottom: 10px; } .id-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--accent-color), var(--accent-light)); } .id-header { padding: 16px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(to bottom, #ffffff, #fafaf9); } .id-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; } .id-chest { font-family: 'Roboto Slab', serif; font-size: 1.5rem; font-weight: 800; color: var(--primary-text); line-height: 1; background: #f1f5f9; padding: 6px 10px; border-radius: 8px; letter-spacing: -0.5px; } .id-name { font-family: 'Roboto Slab', serif; font-size: 1.1rem; font-weight: 700; color: var(--primary-text); line-height: 1.2; margin-bottom: 6px; text-transform: uppercase; } .id-details { display: flex; flex-wrap: wrap; gap: 6px; } .id-badge { background: #fff; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 0.65rem; letter-spacing: 0.5px; display: inline-flex; align-items: center; } .id-badge.team { background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; } .id-badge.category { background-color: #eff6ff; border-color: #bfdbfe; color: #1e40af; } .id-body { padding: 12px 16px; flex-grow: 1; display: flex; flex-direction: column; gap: 12px; } .section-header { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--accent-color); margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; letter-spacing: 0.5px; } .category-block { margin-bottom: 8px; } .category-title { font-size: 0.65rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; display: flex; align-items: center; } .category-title::before { content: '•'; margin-right: 4px; color: #cbd5e1; } .item-list { display: flex; flex-wrap: wrap; gap: 4px; } .item-chip { font-size: 0.75rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; font-weight: 500; line-height: 1.3; } .empty-state { font-size: 0.75rem; color: #cbd5e1; font-style: italic; text-align: center; padding: 4px; } .divider { height: 1px; background: repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 4px, transparent 4px, transparent 8px); margin: 0 16px; } @media print { body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .id-grid { display: block; } .id-card { display: inline-block; width: 46%; margin: 1%; vertical-align: top; box-shadow: none; border: 1px solid #94a3b8; page-break-inside: avoid; } } </style> `;
    let html = `${idCardStyles}${getWatermarkHTML()} <div style="text-align:center; margin-bottom: 20px;"> <h2 style="margin:0; color:#1F2B1B; font-family:'Roboto Slab', serif;">Participant ID Cards</h2> <p style="margin:0; color:#64748b; font-size:0.9rem;">${filteredParticipants.length} Participants • Generated on ${new Date().toLocaleDateString()}</p> </div> <div class="id-grid"> `;
    filteredParticipants.forEach((p) => {
      const team = getTeamName(p.teamId); const categoryName = getCategoryName(p.categoryId); const items = p.itemIds.map(id => state.items.find(i => i.id === id)).filter(Boolean) as Item[]; const onStageItems = items.filter(i => i.performanceType === PerformanceType.ON_STAGE); const offStageItems = items.filter(i => i.performanceType === PerformanceType.OFF_STAGE);
      const groupByCategory = (itemList: Item[]) => { const groups: Record<string, Item[]> = {}; itemList.forEach(i => { const cat = state.categories.find(c => c.id === i.categoryId)?.name || 'General'; if (!groups[cat]) groups[cat] = []; groups[cat].push(i); }); return groups; };
      const onStageGroups = groupByCategory(onStageItems); const offStageGroups = groupByCategory(offStageItems);
      const renderGroups = (groups: Record<string, Item[]>) => { return Object.entries(groups).map(([cat, catItems]) => ` <div class="category-block"> <div class="category-title">${cat}</div> <div class="item-list"> ${catItems.sort((a,b) => a.name.localeCompare(b.name)).map(i => ` <div class="item-chip">${i.name}</div> `).join('')} </div> </div> `).join(''); };
      html += ` <div class="id-card"> <div class="id-header"> <div class="id-top-row"> <div class="id-chest">${p.chestNumber}</div> ${state.categories.find(c => c.id === p.categoryId)?.isGeneralCategory ? '<span class="id-badge" style="background:#fefce8; border-color:#fef9c3; color:#a16207;">Gen Category</span>' : ''} </div> <div class="id-name">${p.name}</div> ${p.place ? `<div style="font-size:0.7rem; font-weight:800; color:#4D5A2A; text-transform:uppercase; letter-spacing:0.5px; margin-top:-4px; margin-bottom:8px;">${p.place}</div>` : ''} <div class="id-details"> <span class="id-badge team">${team}</span> <span class="id-badge category">${categoryName}</span> </div> </div> <div class="id-body"> ${onStageItems.length > 0 ? ` <div class="section"> <div class="section-header"><span>🎤 On-Stage Events</span></div> ${renderGroups(onStageGroups)} </div> ` : ''} ${onStageItems.length > 0 && offStageItems.length > 0 ? '<div class="divider"></div>' : ''} ${offStageItems.length > 0 ? ` <div class="section"> <div class="section-header"><span>📝 Off-Stage Events</span></div> ${renderGroups(onStageGroups)} </div> ` : ''} ${items.length === 0 ? '<div class="empty-state">No events registered</div>' : ''} </div> </div> `;
    });
    html += `</div>`;
    setReportContent({ title: 'Participant ID Cards', content: html, isSearchable: true });
  };

  const generateItemsChecklist = () => {
      if (!state) return;
      const items = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));

      let html = `${getStyles()}${getWatermarkHTML()}<h3>Reporting List</h3>`;
      
      items.forEach((item, index) => {
          const category = state.categories.find(c => c.id === item.categoryId)?.name;
          const participants = state.participants
            .filter(p => p.itemIds.includes(item.id))
            .filter(p => globalFilters.teamId.length === 0 || globalFilters.teamId.includes(p.teamId))
            .sort((a,b) => a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true }));
            
          if (participants.length === 0) return;

          // Group logic for Group Items
          let displayEntries = [];
          if (item.type === ItemType.GROUP) {
              const groups: { [key: string]: Participant[] } = {};
              participants.forEach(p => {
                  const key = `${p.teamId}_${p.itemGroups?.[item.id] || 1}`;
                  if(!groups[key]) groups[key] = [];
                  groups[key].push(p);
              });
              displayEntries = Object.values(groups).map(members => {
                  let leader = members.find(p => p.groupLeaderItemIds?.includes(item.id));
                  if (!leader) leader = members.sort((a,b) => a.name.localeCompare(b.name))[0];
                  // Use Group Chest Number
                  const groupChest = leader.groupChestNumbers?.[item.id] || leader.chestNumber;
                  return {
                      id: leader.id,
                      chestNumber: groupChest,
                      name: `${leader.name} & Party`,
                      place: leader.place,
                      teamId: leader.teamId,
                      isGroup: true
                  };
              }).sort((a,b) => a.chestNumber.localeCompare(b.chestNumber, undefined, {numeric: true}));
          } else {
              displayEntries = participants.map(p => ({
                  id: p.id,
                  chestNumber: p.chestNumber,
                  name: p.name,
                  place: p.place,
                  teamId: p.teamId,
                  isGroup: false
              }));
          }

          html += `
            <div style="margin-bottom: 2rem; position: relative; z-index: 1; ${index > 0 && isPaginated ? 'page-break-before: always;' : ''}">
                <div style="background: var(--table-header); padding: 10px; border: 1px solid #E0E2D9; margin-bottom: 10px;">
                    <h3 style="margin:0;">${item.name}</h3>
                    <p style="margin:0; font-size: 0.9rem;">Category: ${category} | Type: ${item.type} | Duration: ${item.duration} min</p>
                </div>
                <table style="background: white;">
                    <thead><tr><th>Sl</th><th>Chest No</th><th>Name</th><th>Team</th><th>Code Letter</th><th>Signature</th></tr></thead>
                    <tbody>
                        ${displayEntries.map((p, i) => {
                            // Find tabulation using leader/participant ID for code letter
                            const tabEntry = state.tabulation.find(t => t.itemId === item.id && t.participantId === p.id);
                            const codeLetter = tabEntry?.codeLetter || '';
                            const teamName = getTeamName(p.teamId);
                            
                            return `
                            <tr>
                                <td style="width: 50px;">${i + 1}</td>
                                <td style="font-weight: bold; font-family: monospace; font-size: 1.1em;">${p.chestNumber}</td>
                                <td>
                                    <div style="font-weight:bold;">${p.name}</div>
                                    ${p.place ? `<div style="font-size:0.7rem; font-weight:700; color:#666; text-transform:uppercase; margin-top:2px;">${p.place}</div>` : ''}
                                </td>
                                <td>${teamName}</td>
                                <td style="text-align:center; font-weight:bold;">${codeLetter}</td>
                                <td style="width: 150px;"></td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 20px; text-align: right;">
                    <p>Judge's Signature: __________________________</p>
                </div>
            </div>
          `;
      });
      setReportContent({ title: 'Reporting List', content: html, isSearchable: true });
  };

  const generateResultsReport = () => {
      if (!state) return;
      
      let html = `${getStyles()}${getWatermarkHTML()}<h3>Declared Results</h3>`;
      
      if (filteredResults.length === 0) {
          html += `<p>No results have been declared yet.</p>`;
      } else {
          filteredResults.forEach((result, index) => {
             const item = state.items.find(i => i.id === result.itemId);
             const category = state.categories.find(c => c.id === result.categoryId);
             
             if (!item || !category) return;

             html += `
                <div style="margin-bottom: 2rem; position: relative; z-index: 1; border-bottom: 1px dashed #ccc; padding-bottom: 1rem; ${index > 0 && isPaginated ? 'page-break-before: always;' : ''}">
                    <h4>${item?.name} (${category?.name})</h4>
                    <table style="background: white;">
                        <thead><tr><th>Rank</th><th>Chest No</th><th>Name</th><th>Team</th><th>Mark</th><th>Grade</th></tr></thead>
                        <tbody>
                            ${result.winners.sort((a,b) => {
                                // Primary sort by position (1, 2, 3, then 0s)
                                if (a.position > 0 && b.position > 0) return a.position - b.position;
                                if (a.position > 0) return -1;
                                if (b.position > 0) return 1;
                                // Secondary sort by mark descending
                                return (b.mark || 0) - (a.mark || 0);
                            }).map(w => {
                                const p = state.participants.find(p => p.id === w.participantId);
                                const grade = w.gradeId ? (item?.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group).find(g => g.id === w.gradeId)?.name : '-';
                                return `
                                    <tr>
                                        <td style="font-weight: ${w.position > 0 ? 'bold' : 'normal'};">${w.position > 0 ? w.position : '-'}</td>
                                        <td>${p?.chestNumber}</td>
                                        <td>
                                            <div style="font-weight:bold;">${item?.type === ItemType.GROUP ? p?.name + ' & Party' : p?.name}</div>
                                            ${p?.place ? `<div style="font-size:0.7rem; font-weight:700; color:#666; text-transform:uppercase; margin-top:2px;">${p.place}</div>` : ''}
                                        </td>
                                        <td>${getTeamName(p?.teamId || '')}</td>
                                        <td>${w.mark?.toFixed(2)}</td>
                                        <td>${grade}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
             `;
          });
      }
      setReportContent({ title: 'Declared Results', content: html, isSearchable: true });
  };
  
  const generateValuationSheet = () => {
    if (!state) return;
    const items = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));

    let html = `${getStyles()}${getWatermarkHTML()}<h3>Valuation Sheet</h3>`;
    
    items.forEach((item, index) => {
        const category = state.categories.find(c => c.id === item.categoryId)?.name;
        const tabulation = state.tabulation
          .filter(t => t.itemId === item.id)
          .sort((a, b) => a.codeLetter.localeCompare(b.codeLetter));
          
        if (tabulation.length === 0) return;

        html += `
          <div style="margin-bottom: 2rem; position: relative; z-index: 1; ${index > 0 && isPaginated ? 'page-break-before: always;' : ''}">
              <div style="background: var(--table-header); padding: 10px; border: 1px solid #E0E2D9; margin-bottom: 10px;">
                  <h3 style="margin:0;">${item.name}</h3>
                  <p style="margin:0; font-size: 0.9rem;">Category: ${category} | Performance: ${item.performanceType}</p>
              </div>
              <table style="background: white;">
                  <thead><tr><th>Sl</th><th>Code Letter</th><th>Criteria 1</th><th>Criteria 2</th><th>Criteria 3</th><th>Total Mark</th></tr></thead>
                  <tbody>
                      ${tabulation.map((t, i) => `
                          <tr>
                              <td style="width: 50px;">${i + 1}</td>
                              <td style="font-weight: bold; text-align: center; font-size: 1.2em;">${t.codeLetter}</td>
                              <td style="width: 100px;"></td>
                              <td style="width: 100px;"></td>
                              <td style="width: 100px;"></td>
                              <td style="width: 120px; background: #fafafa;"></td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
              <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                  <p>Judge 1: ___________________</p>
                  <p>Judge 2: ___________________</p>
                  <p>Judge 3: ___________________</p>
              </div>
          </div>
        `;
    });
    setReportContent({ title: 'Valuation Sheet', content: html, isSearchable: true });
  };

  const generateParticipantItemChecklist = () => {
    if (!state) return;
    
    // Group filtered items by category
    const itemsByCategory: Record<string, Item[]> = {};
    filteredItems.forEach(item => {
        if (!itemsByCategory[item.categoryId]) itemsByCategory[item.categoryId] = [];
        itemsByCategory[item.categoryId].push(item);
    });

    const participants = [...filteredParticipants];
    let html = `${getStyles()}${getWatermarkHTML()}<h3>Checklist Matrix Report</h3>`;
    
    const sortedCategoryIds = Object.keys(itemsByCategory).sort((a, b) => 
        (getCategoryName(a)).localeCompare(getCategoryName(b))
    );

    sortedCategoryIds.forEach((catId, catIndex) => {
        const catItems = itemsByCategory[catId].sort((a, b) => a.name.localeCompare(b.name));
        const catName = getCategoryName(catId);
        
        // Find participants relevant to this category (enrolled in at least one item here)
        const relevantParticipants = participants.filter(p => 
            catItems.some(item => p.itemIds.includes(item.id))
        );

        if (relevantParticipants.length === 0) return;

        html += `
          <div style="position: relative; z-index: 1; ${catIndex > 0 ? 'page-break-before: always;' : ''}">
            <h4 style="margin-top: 20px; padding-bottom: 5px; border-bottom: 2px solid var(--secondary);">${catName} Checklist</h4>
            <div style="overflow-x: auto; margin-bottom: 2rem;">
                <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                    <thead>
                        <tr>
                            <th style="width: 150px; background: var(--table-header) !important; color: var(--primary) !important;">Participant / Chest No</th>
                            ${catItems.map(item => `
                                <th style="writing-mode: vertical-rl; transform: rotate(180deg); padding: 12px 4px; font-size: 8px; width: 25px; background: var(--table-header) !important; color: var(--primary) !important;">
                                    ${item.name}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${relevantParticipants.map(p => `
                            <tr>
                                <td style="font-weight: bold; background: white; white-space: nowrap; border-right: 2px solid var(--border);">
                                    ${p.chestNumber} - ${p.name.substring(0, 20)}
                                </td>
                                ${catItems.map(item => {
                                    const isEnrolled = p.itemIds.includes(item.id);
                                    return `
                                        <td style="text-align: center; ${isEnrolled ? 'background: #f0fdf4;' : ''}">
                                            ${isEnrolled && showEnrollmentMarks ? '<span style="color: #16a34a; font-weight: bold;">&#10003;</span>' : ''}
                                        </td>
                                    `;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
          </div>
        `;
    });

    setReportContent({ title: 'Checklist Matrix', content: html, isSearchable: true });
  };

  const generateTemplatePage = (withLines: boolean) => {
    if (!state) return;
    const header = state.settings.heading;
    const watermark = getWatermarkHTML();
    
    const lineStyles = withLines ? `
        background-image: linear-gradient(#e5e7eb 1px, transparent 1px);
        background-size: 100% 1.5rem;
        line-height: 1.5rem;
    ` : '';

    let html = `
        <div style="height: 1000px; padding: 50px; position: relative; ${lineStyles}">
            ${watermark}
            <div style="text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-family: 'Roboto Slab', serif;">${header}</h1>
            </div>
            <div style="height: 100%;"></div>
        </div>
    `;
    setReportContent({ title: 'Writing Template', content: html, isSearchable: false, hideHeader: true });
  };

  const generateProgramManual = () => {
    if (!state) return;
    const cats = [...state.categories].sort((a,b) => a.name.localeCompare(b.name));
    
    // Header & Brand
    const headerText = state.settings.heading;
    const orgTeam = state.settings.organizingTeam;
    const logoUrl = state.settings.institutionDetails?.logoUrl;
    
    const manualStyles = `
        <style>
            .handbook-page { 
                padding: 40px; 
                position: relative; 
                z-index: 1; 
                background: white;
            }
            .cover-page { 
                height: 1000px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                text-align: center; 
                border: 15px double var(--brand-green); 
                margin: 20px;
                padding: 40px;
                background: #fdfdfb;
            }
            .cover-title { font-size: 4rem; font-weight: 800; margin-bottom: 10px; color: var(--brand-green) !important; text-transform: uppercase; line-height: 1; }
            .cover-subtitle { font-size: 1.5rem; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 40px; }
            .cover-org { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin-top: auto; }
            
            .index-page { padding: 50px; }
            .index-title { font-size: 2.5rem; text-align: center; margin-bottom: 30px; border-bottom: 2px solid var(--border); padding-bottom: 10px; }
            .index-list { list-style: none; padding: 0; font-size: 1.2rem; }
            .index-item { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 15px; }
            .index-item::after { content: ""; flex: 1; border-bottom: 1px dotted #ccc; margin: 0 10px; }
            
            .category-section { page-break-before: always; }
            .category-header { 
                background: var(--brand-green); 
                color: white !important; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .category-header h2 { color: white !important; margin: 0; font-size: 2rem; }
            
            .item-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
            .item-card { 
                border: 1px solid var(--border); 
                border-radius: 12px; 
                padding: 20px; 
                background: #fff; 
                page-break-inside: avoid; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                display: flex;
                flex-direction: column;
            }
            .item-card h4 { margin: 0 0 10px 0; font-size: 1.3rem; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
            .item-desc { font-size: 11px; color: #555; line-height: 1.5; margin-bottom: 15px; flex-grow: 1; }
            .item-meta { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid #f9f9f9; pt: 10px; }
            .badge { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; border: 1px solid #eee; background: #fcfcfc; }
            .badge-accent { background: var(--secondary); color: white; border-color: var(--secondary); }
        </style>
    `;

    let html = `${getStyles()}${manualStyles}${getWatermarkHTML()}`;

    // --- Cover Page ---
    html += `
        <div class="cover-page">
            ${logoUrl ? `<img src="${logoUrl}" style="height: 150px; margin-bottom: 30px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" />` : ''}
            <div class="cover-title">${headerText}</div>
            <div class="cover-subtitle">Program Manual & Guidelines</div>
            <div style="margin: 40px 0; width: 60px; height: 3px; background: var(--brand-green);"></div>
            <p style="font-size: 1.1rem; max-width: 500px; color: #555; line-height: 1.6;">
                A comprehensive guide to events, rules, and technical specifications for the upcoming festival.
            </p>
            <div class="cover-org">
                Presented by<br/>
                <span style="font-size: 1.5rem; color: var(--brand-green);">${orgTeam}</span>
            </div>
            <div style="margin-top: 40px; font-weight: bold; color: var(--secondary);">EST. ${new Date().getFullYear()}</div>
        </div>
    `;

    // --- Index Page ---
    html += `
        <div class="handbook-page index-page page-break-before-always">
            <h1 class="index-title">Table of Contents</h1>
            <ul class="index-list">
                ${cats.filter(cat => state.items.some(i => i.categoryId === cat.id)).map((cat, i) => `
                    <li class="index-item">
                        <span style="font-weight: bold;">${cat.name}</span>
                        <span style="color: var(--secondary);">0${i + 1}</span>
                    </li>
                `).join('')}
            </ul>
            <div style="margin-top: 100px; border: 1px solid var(--border); padding: 20px; border-radius: 8px;">
                <h4 style="margin-top:0;">General Instructions</h4>
                <p style="font-size: 0.9rem; line-height: 1.5;">${state.settings.generalInstructions || 'All participants must report 30 minutes before the scheduled time. Decisions of the judges will be final.'}</p>
            </div>
        </div>
    `;

    // --- Category Content ---
    cats.forEach(cat => {
        const items = state.items.filter(i => i.categoryId === cat.id).sort((a,b) => a.name.localeCompare(b.name));
        if (items.length === 0) return;

        html += `
            <div class="handbook-page category-section">
                <div class="category-header">
                    <h2>${cat.name}</h2>
                    <span style="font-weight: 800; font-size: 0.8rem; opacity: 0.8;">${items.length} EVENTS</span>
                </div>
                
                <div class="item-grid">
                    ${items.map(item => `
                        <div class="item-card">
                            <h4>${item.name}</h4>
                            <div class="item-desc">${item.description || 'Individual talent showcase adhering to specified guidelines.'}</div>
                            <div class="item-meta">
                                <span class="badge badge-accent">${item.type}</span>
                                <span class="badge">${item.performanceType}</span>
                                <span class="badge">🕒 ${item.duration} MIN</span>
                                <span class="badge">🌐 ${item.medium}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    setReportContent({ title: 'Program Manual', content: html, isSearchable: true, hideHeader: true });
  };

  const generateScheduleReport = () => {
    if (!state) return;
    const schedule = [...filteredSchedule].sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return a.time.localeCompare(b.time);
    });

    let html = `${getStyles()}${getWatermarkHTML()}<h3>Event Schedule</h3>`;
    
    if (schedule.length === 0) {
        html += `<p>No events scheduled for the current selection.</p>`;
    } else {
        const groupedByDate: Record<string, ScheduledEvent[]> = {};
        schedule.forEach(s => {
            if (!groupedByDate[s.date]) groupedByDate[s.date] = [];
            groupedByDate[s.date].push(s);
        });

        Object.entries(groupedByDate).forEach(([date, events]) => {
            html += `
                <h4 style="background: var(--secondary); color: white !important; padding: 8px 15px; border-radius: 6px; margin-top: 20px;">${date}</h4>
                <table>
                    <thead>
                        <tr><th>Time</th><th>Item</th><th>Category</th><th>Venue / Stage</th></tr>
                    </thead>
                    <tbody>
                        ${events.map(ev => {
                            const item = state.items.find(i => i.id === ev.itemId);
                            const cat = state.categories.find(c => c.id === ev.categoryId);
                            return `
                                <tr>
                                    <td style="font-weight: bold; white-space: nowrap;">${ev.time}</td>
                                    <td><div style="font-weight: bold;">${item?.name}</div><div style="font-size: 10px; color: #666;">${item?.performanceType}</div></td>
                                    <td>${cat?.name}</td>
                                    <td><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${ev.stage}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        });
    }
    setReportContent({ title: 'Event Schedule', content: html, isSearchable: true });
  };

  const generatePrizeWinnersReport = () => {
    if (!state) return;

    // Helper to calc points
    const getPoints = (w: any, item: Item) => {
        let pts = 0;
        if (w.position === 1) pts += item.points.first;
        else if (w.position === 2) pts += item.points.second;
        else if (w.position === 3) pts += item.points.third;

        if (w.gradeId) {
            const gradeConfig = item.type === ItemType.SINGLE ? state.gradePoints.single : state.gradePoints.group;
            const g = gradeConfig.find(grad => grad.id === w.gradeId);
            if (g) {
                const override = item.gradePointsOverride?.[g.id];
                pts += (override !== undefined ? override : g.points);
            }
        }
        return pts;
    };

    // --- Data Prep for Item Wise ---
    const itemWiseData = filteredResults.map(res => {
        const item = state.items.find(i => i.id === res.itemId);
        const cat = state.categories.find(c => c.id === res.categoryId);
        // Helper to get text for a specific position
        const getW = (pos: number) => res.winners.filter(w => w.position === pos).map(w => {
            const p = state.participants.find(part => part.id === w.participantId);
            const t = state.teams.find(tm => tm.id === p?.teamId);
            const pts = item ? getPoints(w, item) : 0;
            return `<b>${item?.type === ItemType.GROUP ? p?.name + ' & Party' : p?.name}</b> <span style="font-size:0.8em; color:#4D5A2A; font-weight:bold">(${pts} pts)</span><br/><span style="font-size:0.8em; color:#666">${t?.name}</span>`;
        }).join('<br/><hr style="margin:2px 0; border:0; border-top:1px dashed #ccc"/>');

        return {
            itemName: item?.name,
            catName: cat?.name,
            first: getW(1),
            second: getW(2),
            third: getW(3)
        };
    }).sort((a,b) => (a.itemName || '').localeCompare(b.itemName || ''));

    // --- Data Prep for Participant Wise ---
    const partStats: Record<string, {name: string | undefined, chest: string | undefined, team: string | undefined, firsts: string[], seconds: string[], thirds: string[], totalPts: number}> = {};
    filteredResults.forEach(res => {
        const item = state.items.find(i => i.id === res.itemId);
        if (!item) return;
        res.winners.forEach(w => {
            if (w.position > 0 && w.position <= 3) {
                if (!partStats[w.participantId]) {
                    const p = state.participants.find(part => part.id === w.participantId);
                    const t = state.teams.find(tm => tm.id === p?.teamId);
                    partStats[w.participantId] = {
                        name: p?.name,
                        chest: p?.chestNumber,
                        team: t?.name,
                        firsts: [], seconds: [], thirds: [],
                        totalPts: 0
                    };
                }
                
                const pts = getPoints(w, item);
                partStats[w.participantId].totalPts += pts;

                const entryName = item.type === ItemType.GROUP ? `${item.name} (Group)` : item.name;
                const entryDisplay = `${entryName} <b>(${pts})</b>`;
                
                if (w.position === 1) partStats[w.participantId].firsts.push(entryDisplay);
                if (w.position === 2) partStats[w.participantId].seconds.push(entryDisplay);
                if (w.position === 3) partStats[w.participantId].thirds.push(entryDisplay);
            }
        });
    });
    // Sort by Total Points descending, then Chest Number
    const partWiseData = Object.values(partStats).sort((a,b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        return (a.chest || '').localeCompare(b.chest || '', undefined, {numeric:true});
    });

    // --- HTML Construction ---
    let html = `${getStyles()}${getWatermarkHTML()}`;
    
    // SECTION 1: Item-Wise Winners
    html += `<h3>Item-wise Prize Winners</h3>`;
    html += `
        <table>
            <thead><tr><th style="width:25%">Item</th><th style="width:25%">First Place</th><th style="width:25%">Second Place</th><th style="width:25%">Third Place</th></tr></thead>
            <tbody>
                ${itemWiseData.map(d => `
                    <tr>
                        <td><b>${d.itemName}</b><br/><span style="font-size:0.8em; color:#666">${d.catName}</span></td>
                        <td>${d.first || '-'}</td>
                        <td>${d.second || '-'}</td>
                        <td>${d.third || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    html += `<div class="page-break-before-always"></div>`;

    // SECTION 2: Participant-Wise Winners
    html += `<h3>Participant-wise Prize Winners</h3>`;
    html += `
        <table>
            <thead><tr><th style="width:25%">Participant</th><th style="width:20%">First Prizes</th><th style="width:20%">Second Prizes</th><th style="width:20%">Third Prizes</th><th style="width:15%">Total Points</th></tr></thead>
            <tbody>
                ${partWiseData.map(p => `
                    <tr>
                        <td><b>${p.name}</b><br/><span style="font-size:0.8em;">Chest: ${p.chest}</span><br/><span style="font-size:0.8em; color:#666">${p.team}</span></td>
                        <td>${p.firsts.length > 0 ? `<ul style="margin:0; padding-left:15px; font-size:0.9em;">${p.firsts.map(i => `<li>${i}</li>`).join('')}</ul>` : '-'}</td>
                        <td>${p.seconds.length > 0 ? `<ul style="margin:0; padding-left:15px; font-size:0.9em;">${p.seconds.map(i => `<li>${i}</li>`).join('')}</ul>` : '-'}</td>
                        <td>${p.thirds.length > 0 ? `<ul style="margin:0; padding-left:15px; font-size:0.9em;">${p.thirds.map(i => `<li>${i}</li>`).join('')}</ul>` : '-'}</td>
                        <td style="text-align:center; font-weight:bold; font-size:1.2em; color:#4D5A2A;">${p.totalPts}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    setReportContent({ title: 'Prize / Place Winners', content: html, isSearchable: true });
  };

  if (!state) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="hidden md:flex justify-between items-center">
             <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Reports</h2>
             <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 mr-2">
                    <button
                        onClick={() => setShowEnrollmentMarks(!showEnrollmentMarks)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${showEnrollmentMarks ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}
                        title="Show/Hide enrollment checkmarks in Matrix Report"
                    >
                        {showEnrollmentMarks ? <CheckSquare size={14} /> : <Square size={14} />}
                        <span className="hidden sm:inline">Show Checks</span>
                    </button>
                </div>
                <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 mr-2">
                    <button
                        onClick={() => setShowWatermark(!showWatermark)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${showWatermark ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}
                        title="Show Event Watermark on Print / Export"
                    >
                        <Stamp size={14} />
                        <span className="hidden sm:inline">Watermark</span>
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button onClick={() => setIsPaginated(true)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isPaginated ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}>Paginated</button>
                    <button onClick={() => setIsPaginated(false)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!isPaginated ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'}`}>Continuous</button>
                </div>
             </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card title="Prize Holders" action={<button onClick={generatePrizeWinnersReport} className="text-indigo-600 hover:text-indigo-800"><Printer size={20}/></button>}> <div className="text-center p-4"> <Crown className="h-12 w-12 mx-auto text-yellow-600 mb-2" /> <p className="text-sm text-zinc-500">List of 1st, 2nd, 3rd place winners by Item & Participant.</p> </div> </Card>
             <Card title="Declared Results" action={<button onClick={generateResultsReport} className="text-indigo-600 hover:text-indigo-800"><Trophy size={20}/></button>}> {filteredResults.length > 0 && <CountBadge count={filteredResults.length} />} <div className="text-center p-4"> <Trophy className="h-12 w-12 mx-auto text-rose-400 mb-2" /> <p className="text-sm text-zinc-500">Published results and winner lists.</p> </div> </Card>
             <Card title="Participants" action={<button onClick={() => generateParticipantProfiles(isPaginated)} className="text-indigo-600 hover:text-indigo-800"><Printer size={20}/></button>}> {filteredParticipants.length > 0 && <CountBadge count={filteredParticipants.length} />} <div className="text-center p-4"> <FileText className="h-12 w-12 mx-auto text-indigo-400 mb-2" /> <p className="text-sm text-zinc-500">Generate profiles for participants.</p> </div> </Card>
             <Card title="ID Cards" action={<button onClick={generateIDCards} className="text-indigo-600 hover:text-indigo-800"><UserSquare2 size={20}/></button>}> {filteredParticipants.length > 0 && <CountBadge count={filteredParticipants.length} />} <div className="text-center p-4"> <UserSquare2 className="h-12 w-12 mx-auto text-purple-400 mb-2" /> <p className="text-sm text-zinc-500">Printable ID cards for all participants.</p> </div> </Card>
             <Card title="Reporting List" action={<button onClick={generateItemsChecklist} className="text-indigo-600 hover:text-indigo-800"><CheckSquare size={20}/></button>}> {filteredItems.length > 0 && <CountBadge count={filteredItems.length} />} <div className="text-center p-4"> <Layers className="h-12 w-12 mx-auto text-emerald-400 mb-2" /> <p className="text-sm text-zinc-500">Item-wise checklists for judges and tabulators.</p> </div> </Card>
             <Card title="Valuation Sheet" action={<button onClick={generateValuationSheet} className="text-indigo-600 hover:text-indigo-800"><FileCheck size={20}/></button>}> {filteredItems.length > 0 && <CountBadge count={filteredItems.length} />} <div className="text-center p-4"> <FileCheck className="h-12 w-12 mx-auto text-amber-500 mb-2" /> <p className="text-sm text-zinc-500">Anonymous scoring sheets for judges.</p> </div> </Card>
             <Card title="Checklist Matrix" action={<button onClick={generateParticipantItemChecklist} className="text-indigo-600 hover:text-indigo-800"><Grid3X3 size={20}/></button>}> {filteredItems.length > 0 && <CountBadge count={filteredItems.length} />} <div className="text-center p-4"> <Grid3X3 className="h-12 w-12 mx-auto text-teal-400 mb-2" /> <p className="text-sm text-zinc-500">Cross-reference grid of participants vs items.</p> </div> </Card>
             <Card title="Writing Template" action={ <div className="flex gap-2"> <button onClick={() => generateTemplatePage(false)} className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded" title="Blank Page"> <File size={20}/> </button> <button onClick={() => generateTemplatePage(true)} className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded" title="Lined Page"> <AlignJustify size={20}/> </button> </div> }> <div className="text-center p-4"> <File className="h-12 w-12 mx-auto text-slate-400 mb-2" /> <p className="text-sm text-zinc-500">Blank or lined pages with event watermark.</p> </div> </Card>
             <Card title="Program Manual" action={<div className="flex gap-2"><button onClick={() => {}} className="text-indigo-600 hover:text-indigo-800" title="Download EPUB"><Download size={20}/></button><button onClick={generateProgramManual} className="text-indigo-600 hover:text-indigo-800" title="View Manual"><Book size={20}/></button></div>}> {filteredItems.length > 0 && <CountBadge count={filteredItems.length} />} <div className="text-center p-4"> <Book className="h-12 w-12 mx-auto text-orange-400 mb-2" /> <p className="text-sm text-zinc-500">Complete handbook with rules, index, and details.</p> </div> </Card>
             <Card title="Schedule" action={<button onClick={generateScheduleReport} className="text-indigo-600 hover:text-indigo-800"><Calendar size={20}/></button>}> {filteredSchedule.length > 0 && <CountBadge count={filteredSchedule.length} />} <div className="text-center p-4"> <Calendar className="h-12 w-12 mx-auto text-amber-400 mb-2" /> <p className="text-sm text-zinc-500">Detailed event schedule and timeline.</p> </div> </Card>
        </div>
        <ReportViewer isOpen={!!reportContent} onClose={() => setReportContent(null)} title={reportContent?.title || ''} content={reportContent?.content || ''} isSearchable={reportContent?.isSearchable} hideHeader={reportContent?.hideHeader} hideFooter={reportContent?.hideFooter} />
    </div>
  );
};

export default ReportsPage;