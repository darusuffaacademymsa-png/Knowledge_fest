
import React from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { AppState } from '../types';

export const getGlobalFontCSS = (state: AppState | null | undefined) => {
    if (!state) return '';

    const MALAYALAM_RANGE = "U+0D00-0D7F";
    const ARABIC_RANGE = "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF";
    const LATIN_RANGE = "U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F";
    
    let fontFaces = '';

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

    if (state.customFonts?.englishPrimary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishPrimary';
                src: url('${state.customFonts.englishPrimary.url}');
                font-display: swap;
            }
        `;
    }

    if (state.customFonts?.englishSecondary?.url) {
        fontFaces += `
            @font-face {
                font-family: 'EnglishSecondary';
                src: url('${state.customFonts.englishSecondary.url}');
                font-display: swap;
            }
        `;
    }

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
            
            html, body {
                font-family: 'GlobalAutoFont', 'Inter', sans-serif;
            }

            /* Apply to UI elements without using !important everywhere to allow canvas overrides */
            h1, h2, h3, h4, h5, h6, p, span, div, a, li, input, button, textarea, select {
                font-family: 'GlobalAutoFont', inherit;
            }

            /* Specific class for the Creative Studio canvas to force font override */
            .studio-canvas-root * {
                font-family: inherit !important;
            }
            
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
    const css = getGlobalFontCSS(state);
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export default GlobalFontManager;
