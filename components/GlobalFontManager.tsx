import React from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Settings } from '../types';

export const getGlobalFontCSS = (settings: Settings | undefined) => {
    if (!settings) return '';

    const MALAYALAM_RANGE = "U+0D00-0D7F";
    const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";
    const LATIN_RANGE = "U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F"; // Expanded basic & extended latin
    
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

    // Default global English (Latin) font
    if (settings.customFonts?.english?.url) {
        fontFaces += `
            @font-face {
                font-family: 'GlobalAutoFont';
                src: url('${settings.customFonts.english.url}');
                unicode-range: ${LATIN_RANGE};
                font-display: swap;
            }
        `;
    }

    // Primary English
    if (settings.customFonts?.englishPrimary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishPrimary';
                src: url('${settings.customFonts.englishPrimary.url}');
                font-display: swap;
            }
        `;
    }

    // Secondary English
    if (settings.customFonts?.englishSecondary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishSecondary';
                src: url('${settings.customFonts.englishSecondary.url}');
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
    const css = getGlobalFontCSS(state?.settings);
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default GlobalFontManager;