
import React from 'react';
import { useFirebase } from '../hooks/useFirebase';
// Use AppState instead of Settings as custom fonts are stored at the top level of the state
import { AppState } from '../types';

// Updated to accept AppState to access customFonts and generalCustomFonts
export const getGlobalFontCSS = (state: AppState | null | undefined) => {
    if (!state) return '';

    const MALAYALAM_RANGE = "U+0D00-0D7F";
    const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";
    const LATIN_RANGE = "U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F"; // Expanded basic & extended latin
    
    let fontFaces = '';

    // Language-specific fonts (GlobalAutoFont uses unicode-range)
    // Fix: access customFonts from AppState instead of Settings
    if (state.customFonts?.malayalam?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${state.customFonts.malayalam.url}');
                unicode-range: ${MALAYALAM_RANGE};
                font-display: swap;
            }
        `;
    }

    // Fix: access customFonts from AppState instead of Settings
    if (state.customFonts?.arabic?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${state.customFonts.arabic.url}');
                unicode-range: ${ARABIC_RANGE};
                font-display: swap;
            }
        `;
    }

    // Default global English (Latin) font
    // Fix: access customFonts from AppState instead of Settings
    if (state.customFonts?.english?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${state.customFonts.english.url}');
                unicode-range: ${LATIN_RANGE};
                font-display: swap;
            }
        `;
    }

    // Primary English
    // Fix: access customFonts from AppState instead of Settings
    if (state.customFonts?.englishPrimary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishPrimary';
                src: url('${state.customFonts.englishPrimary.url}');
                font-display: swap;
            }
        `;
    }

    // Secondary English
    // Fix: access customFonts from AppState instead of Settings
    if (state.customFonts?.englishSecondary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishSecondary';
                src: url('${state.customFonts.englishSecondary.url}');
                font-display: swap;
            }
        `;
    }

    // General Custom Fonts (for explicit selection, using their defined family names)
    // Fix: access generalCustomFonts from AppState instead of Settings
    if (state.generalCustomFonts && state.generalCustomFonts.length > 0) {
        state.generalCustomFonts.forEach(font => {
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
            
            /* Apply GlobalAutoFont across the entire application ecosystem */
            body, html, 
            .font-sans, .font-serif, .font-slab, .font-mono,
            h1, h2, h3, h4, h5, h6, 
            p, span, div, a, li, blockquote,
            input, button, textarea, select, 
            table, td, th, thead, tbody, 
            label, legend,
            [class*="text-"], [class*="font-"] {
                font-family: 'GlobalAutoFont', 'Inter', 'Roboto Slab', system-ui, -apple-system, sans-serif !important;
            }
            
            /* Special handling for form elements which often ignore inheritance */
            input::placeholder, textarea::placeholder {
                font-family: 'GlobalAutoFont', sans-serif !important;
            }
            
            /* Helper classes for manual override if needed */
            .font-malayalam { font-family: 'GlobalAutoFont', sans-serif !important; }
            .font-arabic { font-family: 'GlobalAutoFont', serif !important; direction: rtl; }
            .font-english { font-family: 'GlobalAutoFont', sans-serif !important; }
            .font-english-primary { font-family: 'EnglishPrimary', 'GlobalAutoFont', sans-serif !important; }
            .font-english-secondary { font-family: 'EnglishSecondary', 'GlobalAutoFont', sans-serif !important; }
        `;
    }
    
    return '';
};

const GlobalFontManager: React.FC = () => {
    const { state } = useFirebase();
    // Fix: Pass the whole state instead of state.settings
    const css = getGlobalFontCSS(state);
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default GlobalFontManager;
