

import React from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Settings } from '../types';

export const getGlobalFontCSS = (settings: Settings | undefined) => {
    if (!settings) return '';

    const MALAYALAM_RANGE = "U+0D00-0D7F";
    const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";
    
    let fontFaces = '';

    // Language-specific fonts (GlobalAutoFont uses unicode-range)
    if (settings.customFonts?.malayalam?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${settings.customFonts.malayalam.url}');
                unicode-range: ${MALAYALAM_RANGE};
                font-display: swap;
            }
        `;
    }

    if (settings.customFonts?.arabic?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${settings.customFonts.arabic.url}');
                unicode-range: ${ARABIC_RANGE};
                font-display: swap;
            }
        `;
    }

    // General Custom Fonts (for explicit selection, using their defined family names)
    if (settings.generalCustomFonts && settings.generalCustomFonts.length > 0) {
        settings.generalCustomFonts.forEach(font => {
            if (font.url && font.family) {
                fontFaces += `
                    @font-face {
                        font-family: '${font.family}';
                        src: url('${font.url}');
                        font-display: swap;
                    }
                `;
            }
        });
    }

    if (fontFaces) {
        return `
            ${fontFaces}
            
            /* Apply GlobalAutoFont first so it catches the ranges */
            body, .font-sans, .font-serif, h1, h2, h3, h4, h5, h6, p, span, div, a, input, button, textarea, select, table, td, th {
                font-family: 'GlobalAutoFont', 'Inter', 'Roboto Slab', system-ui, -apple-system, sans-serif !important;
            }
            
            /* Helper classes for manual override if needed */
            .font-malayalam { font-family: 'GlobalAutoFont', sans-serif !important; }
            .font-arabic { font-family: 'GlobalAutoFont', serif !important; direction: rtl; }
        `;
    }
    
    return '';
};

const GlobalFontManager: React.FC = () => {
    const { state } = useFirebase();
    const css = getGlobalFontCSS(state?.settings);
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default GlobalFontManager;