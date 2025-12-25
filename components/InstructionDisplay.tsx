import React, { useState, useEffect } from 'react';
// FIX: Replaced useAppState with useFirebase to resolve module import error.
import { useFirebase } from '../hooks/useFirebase';
import { Info, X } from 'lucide-react';

interface InstructionDisplayProps {
    pageTitle: string;
}

const InstructionDisplay: React.FC<InstructionDisplayProps> = ({ pageTitle }) => {
    const { state } = useFirebase();
    const [isVisible, setIsVisible] = useState(false);

    const instructionText = state?.settings.instructions?.[pageTitle];

    useEffect(() => {
        if (instructionText && instructionText.trim() !== '') {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [instructionText, pageTitle]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mb-0 md:mb-6 p-4 border-l-4 border-sky-500 bg-sky-50 dark:bg-sky-900/30 rounded-r-lg shadow-sm flex items-start gap-4 transition-opacity duration-300 animate-fade-in">
            <Info className="h-6 w-6 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
                <h4 className="font-semibold text-sky-800 dark:text-sky-200">Instructions for this Page</h4>
                <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-wrap">{instructionText}</p>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 rounded-full text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                aria-label="Dismiss instruction"
            >
                <X className="h-4 w-4" />
            </button>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InstructionDisplay;