
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useFirebase } from '../hooks/useFirebase';
import { X, Printer } from 'lucide-react';
import { getGlobalFontCSS } from './GlobalFontManager';

interface ReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isSearchable?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ isOpen, onClose, title, content, isSearchable = false, hideHeader = false, hideFooter = false }) => {
  const { state } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setSearchTerm(''); // Reset search on open
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isSearchable || !reportContentRef.current) return;

    const tables = reportContentRef.current.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const rowText = (row as HTMLElement).innerText.toLowerCase();
            if (rowText.includes(searchTerm.toLowerCase())) {
                (row as HTMLElement).style.display = '';
            } else {
                (row as HTMLElement).style.display = 'none';
            }
        });
    });
  }, [searchTerm, isSearchable, content]);

  useEffect(() => {
    if (!isOpen || !reportContentRef.current) return;

    const tables = reportContentRef.current.querySelectorAll('table');
    if (tables.length === 0) return;

    const clickHandler = (e: Event) => {
      const header = e.currentTarget as HTMLElement;
      const table = header.closest('table');
      if (!table) return;

      const columnIndex = parseInt(header.dataset.columnIndex || '0', 10);
      const currentDirection = header.dataset.sortDirection;
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      
      table.querySelectorAll('thead th[data-sortable="true"]').forEach(th => {
        if (th !== header) {
          delete (th as HTMLElement).dataset.sortDirection;
          const indicator = th.querySelector('.sort-indicator');
          if (indicator) indicator.innerHTML = ' &#x2195;'; // Changed from \u2195
        }
      });

      header.dataset.sortDirection = newDirection;
      const indicator = header.querySelector('.sort-indicator');
      if (indicator) {
        indicator.innerHTML = newDirection === 'asc' ? ' &#x2191;' : ' &#x2193;'; // Changed from \u2191, \u2193
      }

      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      const rows = Array.from(tbody.querySelectorAll('tr'));
      const sortedRows = rows.sort((a, b) => {
        const aVal = a.cells[columnIndex]?.innerText || '';
        const bVal = b.cells[columnIndex]?.innerText || '';
        const aNum = parseFloat(aVal.replace(/,/g, ''));
        const bNum = parseFloat(bVal.replace(/,/g, ''));

        let comparison = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
        }
        
        return newDirection === 'asc' ? comparison : -comparison;
      });

      sortedRows.forEach(row => tbody.appendChild(row));
    };
    
    const headers: NodeListOf<HTMLElement>[] = [];
    tables.forEach(table => {
      const tableHeaders = table.querySelectorAll('thead th[data-sortable="true"]') as NodeListOf<HTMLElement>;
      tableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        if (!header.querySelector('.sort-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator';
            indicator.style.display = 'inline-block';
            indicator.innerHTML = ' &#x2195;'; // Changed from \u2195
            header.appendChild(indicator);
        }
        header.addEventListener('click', clickHandler);
      });
      headers.push(tableHeaders);
    });
    
    return () => {
      headers.forEach(tableHeaders => {
          tableHeaders.forEach(header => {
              header.removeEventListener('click', clickHandler);
          });
      });
    };
  }, [isOpen, content]);


  const handlePrint = () => {
    // Open a new tab
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        alert('Could not open print window. Please ensure pop-up blockers are disabled for this site.');
        return;
    }
    
    const contentToPrint = reportContentRef.current?.innerHTML || content;
    const reportSettings = state?.settings.reportSettings;
    const globalFontCss = getGlobalFontCSS(state?.settings);

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Roboto+Slab:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style> 
            /* Inject Custom Fonts */
            ${globalFontCss}

            @page {
                /* size: auto;  Removed fixed size to allow user to choose orientation */
                margin: 0.5in;
                @top-left {
                    content: "${hideHeader ? '' : (reportSettings?.header || '').replace(/"/g, "'")}";
                    font-family: 'GlobalAutoFont', 'Roboto Slab', serif;
                    font-size: 9pt;
                    color: #5F6B45;
                }
                @bottom-center {
                    content: ${hideFooter ? '""' : `"${(reportSettings?.footer || '').replace(/"/g, "'")} - Page " counter(page)`};
                    font-family: 'GlobalAutoFont', 'Inter', sans-serif;
                    font-size: 9pt;
                    color: #666;
                }
            }
            body { 
                -webkit-font-smoothing: antialiased; 
                -moz-osx-font-smoothing: grayscale; 
                font-family: 'GlobalAutoFont', 'Inter', sans-serif; 
                color: #1a1a1a;
                margin: 0;
                padding: 20px;
                background-color: #ffffff;
            }
            
            /* Print Button Styles */
            .print-ui-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                gap: 12px;
            }
            .print-btn {
                background-color: #283E25; /* Amazio Primary */
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-family: 'Inter', sans-serif;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .print-btn:hover {
                background-color: #1a2e18;
            }
            .print-btn svg {
                width: 16px;
                height: 16px;
            }
            
            .print-btn.back-btn {
                background-color: #f4f4f5; /* Zinc-100 */
                color: #18181b; /* Zinc-900 */
                border: 1px solid #e4e4e7; /* Zinc-200 */
            }
            .print-btn.back-btn:hover {
                background-color: #e4e4e7;
            }

            /* Report Styles */
            h1, h2, h3, h4, h5, h6 { font-family: 'GlobalAutoFont', 'Roboto Slab', serif; color: #283E25; }
            .report-container { max-width: 100%; margin: 0 auto; }
            .sort-indicator { display: none !important; } 
            .no-wrap { white-space: nowrap; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; border: 1px solid #e5e7eb; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background-color: #283E25 !important; color: white !important; font-weight: 600; font-family: 'GlobalAutoFont', 'Roboto Slab', serif; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) { background-color: #F9FAF9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            @media print {
                .print-ui-container { display: none !important; }
                body { padding: 0; background-color: white; }
                .report-container { width: 100%; }
                .page-break-before-always { page-break-before: always; }
                th, td { padding: 4px 6px !important; }
                table { margin-bottom: 0.75rem !important; }
                h1,h2,h3,h4 { margin-bottom: 0.5rem !important; }
                th { background-color: #283E25 !important; color: white !important; }
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <div class="print-ui-container">
            <button class="print-btn back-btn" onclick="window.close()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                Back
            </button>
            <button class="print-btn" onclick="window.print()">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Report
            </button>
          </div>
          
          <div class="report-container">
            ${!hideHeader ? `
            <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #D4AF37; padding-bottom: 1rem;">
              <h1 style="font-size: 1.75rem; font-weight: bold; margin:0; color: #283E25; text-transform: uppercase;">${reportSettings?.heading || state?.settings.heading}</h1>
              <p style="font-size: 1rem; color: #5F6B45; margin:0; margin-top: 0.25rem; font-weight: 500;">${reportSettings?.description || state?.settings.description}</p>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #283E25; text-align: center; margin-bottom: 1.5rem;">${title}</h2>
            ` : ''}
            <div>
              ${contentToPrint}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  if (!isOpen) {
    return null;
  }
  
  const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
      >
        <div
          className="relative flex flex-col w-full h-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 gap-4">
             {isSearchable ? (
                <div className="flex-grow">
                    <input
                        type="text"
                        placeholder={`Find in ${title}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border-zinc-300 bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            ) : <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>}

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-amazio-primary hover:bg-amazio-primary/90 text-white rounded-md transition-colors"
                aria-label="Export report"
              >
                <Printer className="h-4 w-4" /> <span>Open & Print</span>
              </button>
              <button onClick={onClose} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Close report viewer">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          {/* Force white background for report content area for document accuracy */}
          <div 
            className="flex-grow overflow-y-auto p-6 text-zinc-900 scroll-smooth custom-scrollbar" 
            ref={reportContentRef}
            style={{ backgroundColor: 'white', color: '#18181b' }}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ReportViewer;
