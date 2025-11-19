import React, { useState, useMemo } from 'react';
import { Assignment, Candidat, Criterion, Status } from '../../types';
import { InformationCircleIcon, XMarkIcon, UserGroupIcon, ChatBubbleLeftIcon } from './icons';
import Tooltip from './Tooltip';

interface ScoringPanelProps {
    assignment: Assignment;
    candidate: Candidat;
    criteria: Criterion[];
    allAssignments: Assignment[];
    onClose: () => void;
    onSave: (updatedAssignment: Assignment, reason?: string) => void;
    isReadOnly?: boolean;
    isAdmin?: boolean;
}

const ScoringPanel: React.FC<ScoringPanelProps> = ({ assignment, candidate, criteria, allAssignments, onClose, onSave, isReadOnly = false, isAdmin = false }) => {
    const [localScores, setLocalScores] = useState(assignment.scoruri);
    const [localObservations, setLocalObservations] = useState(assignment.observatii);
    const [reason, setReason] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const hasChanges = useMemo(() => {
        return JSON.stringify(localScores) !== JSON.stringify(assignment.scoruri) ||
               JSON.stringify(localObservations) !== JSON.stringify(assignment.observatii);
    }, [localScores, localObservations, assignment.scoruri, assignment.observatii]);

    const relevantCriteria = criteria.filter(c => c.etapaId === assignment.etapaId && c.categorieId === assignment.categorieId);
    
    const finalScore = useMemo(() => {
        const totalWeight = relevantCriteria.reduce((acc, crit) => {
            // Calculează ponderea totală doar pentru criteriile care au note
            return acc + (localScores[crit.id] !== undefined ? crit.pondere : 0);
        }, 0);

        if (totalWeight === 0) return 0; // Dacă nu există note, scorul final este 0

        return relevantCriteria.reduce((acc, crit) => {
            // Folosește doar scorurile existente în calcul
            const score = localScores[crit.id];
            return acc + (score !== undefined ? score * crit.pondere : 0);
        }, 0);
    }, [localScores, relevantCriteria]);

    const averageScores = useMemo(() => {
        const otherFinalizedAssignments = allAssignments.filter(a => 
            a.candidatId === candidate.id && 
            a.etapaId === assignment.etapaId && 
            a.categorieId === assignment.categorieId &&
            a.status === Status.FINALIZAT &&
            a.id !== assignment.id
        );

        if (otherFinalizedAssignments.length === 0) {
            return null;
        }

        const avgScores: Record<string, number> = {};
        relevantCriteria.forEach(criterion => {
            const scoresForCriterion = otherFinalizedAssignments
                .map(a => a.scoruri[criterion.id])
                .filter(score => typeof score === 'number') as number[];

            if (scoresForCriterion.length > 0) {
                const sum = scoresForCriterion.reduce((acc, score) => acc + score, 0);
                avgScores[criterion.id] = sum / scoresForCriterion.length;
            }
        });

        return avgScores;
    }, [allAssignments, candidate.id, assignment.etapaId, assignment.id, relevantCriteria, assignment.categorieId]);

    const handleScoreChange = (criterionId: string, score: number) => {
        setLocalScores(prev => ({ ...prev, [criterionId]: score }));
    };
    
    const handleObservationChange = (criterionId: string, text: string) => {
        setLocalObservations(prev => ({ ...prev, [criterionId]: text }));
    };
    
    const handleSave = (newStatus: Status) => {
        if (Object.keys(validationErrors).length > 0) {
            alert("Vă rugăm să corectați erorile înainte de a salva.");
            return;
        }

        if (isAdmin && hasChanges && !reason.trim()) {
            alert('Vă rugăm să oferiți un motiv pentru modificarea scorurilor.');
            return;
        }

        const updatedAssignment = { 
            ...assignment, 
            scoruri: localScores,
            observatii: localObservations, 
            status: isAdmin ? assignment.status : newStatus, // Admin doesn't change status, just scores
            scorFinal: finalScore,
            lastModified: new Date() 
        };

        onSave(updatedAssignment, reason);
        
        if (!isAdmin && newStatus === Status.FINALIZAT) {
            onClose();
        } else if (isAdmin) {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-end sm:justify-center overflow-hidden" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="scoring-panel-title">
            <div 
                className="w-full max-w-full sm:max-w-2xl max-h-[90vh] bg-white dark:bg-slate-800 shadow-2xl flex flex-col rounded-t-3xl sm:rounded-lg animate-slide-up sm:animate-none overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="relative p-3 sm:px-6 sm:py-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 flex-shrink-0">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full sm:hidden"></div>
                    <div className="flex justify-between items-center w-full pt-3 sm:pt-0">
                        <div className="min-w-0 flex-1">
                            <h3 id="scoring-panel-title" className="text-lg sm:text-2xl font-bold text-ave-dark-blue dark:text-slate-100 truncate">{candidate.nume}</h3>
                            <p className="text-sm text:md text-gray-500 dark:text-slate-400 truncate">{candidate.scoala}</p>
                        </div>
                        <button onClick={onClose} className="p-3 -m-3 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100 flex-shrink-0 ml-4">
                            <span className="sr-only">Închide</span>
                            <XMarkIcon className="w-8 h-8" />
                        </button>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {relevantCriteria.map(criterion => (
                        <div key={criterion.id} className="overflow-x-hidden w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-gray-800 dark:text-slate-200 truncate">{criterion.nume} <span className="font-normal text-gray-500 dark:text-slate-400">({(criterion.pondere * 100)}%)</span></h4>
                                <Tooltip content="Ponderea acestui criteriu în calculul scorului final. Totalul ponderilor pentru o categorie/etapă trebuie să fie 100%.">
                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 cursor-help" />
                                </Tooltip>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 mb-2">{criterion.descriere}</p>
                            
                            {averageScores && averageScores[criterion.id] !== undefined && (
                                <div className="mb-3 flex items-center text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/50 p-2 rounded-md">
                                    <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>Media evaluărilor finalizate: <span className="font-bold text-gray-700 dark:text-slate-200">{averageScores[criterion.id].toFixed(2)}</span></span>
                                    <Tooltip content="Acesta este scorul mediu acordat de alți jurați care au finalizat evaluarea pentru acest candidat, pentru același criteriu. Este afișat doar în scop informativ.">
                                        <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 cursor-help ml-2" />
                                    </Tooltip>
                                </div>
                            )}

                           <div className="space-y-4">
                                <div className="flex flex-col gap-4 bg-gray-100 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                                            <button 
                                                onClick={() => handleScoreChange(criterion.id, criterion.scorMin)}
                                                disabled={isReadOnly}
                                                className="px-3 py-2.5 text-sm sm:text-base font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-500 active:scale-95 disabled:opacity-50 transition-all touch-manipulation"
                                            >
                                                Minim: {criterion.scorMin}
                                            </button>
                                            <button 
                                                onClick={() => handleScoreChange(criterion.id, criterion.scorMax)}
                                                disabled={isReadOnly}
                                                className="px-3 py-2.5 text-sm sm:text-base font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-500 active:scale-95 disabled:opacity-50 transition-all touch-manipulation"
                                            >
                                                Maxim: {criterion.scorMax}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-center w-full sm:w-auto">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min={criterion.scorMin}
                                                max={criterion.scorMax}
                                                value={localScores[criterion.id] === undefined ? '' : localScores[criterion.id]}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        setLocalScores(prev => {
                                                            const newScores = { ...prev };
                                                            delete newScores[criterion.id];
                                                            return newScores;
                                                        });
                                                    } else {
                                                        const num = parseInt(value, 10);
                                                        if (!isNaN(num)) {
                                                            handleScoreChange(criterion.id, Math.max(criterion.scorMin, Math.min(criterion.scorMax, num)));
                                                        }
                                                    }
                                                }}
                                                onFocus={e => e.target.select()}
                                                onClick={e => (e.target as HTMLInputElement).select()}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        const value = (e.target as HTMLInputElement).value.trim();
                                                        if (value === '') {
                                                            setLocalScores(prev => {
                                                                const newScores = { ...prev };
                                                                delete newScores[criterion.id];
                                                                return newScores;
                                                            });
                                                        } else {
                                                            const num = parseInt(value, 10);
                                                            if (!isNaN(num)) {
                                                                handleScoreChange(criterion.id, Math.max(criterion.scorMin, Math.min(criterion.scorMax, num)));
                                                            }
                                                        }
                                                        (e.target as HTMLInputElement).blur();
                                                    }
                                                }}
                                                onBlur={e => {
                                                    const value = e.target.value.trim();
                                                    if (value === '') {
                                                        setLocalScores(prev => {
                                                            const newScores = { ...prev };
                                                            delete newScores[criterion.id];
                                                            return newScores;
                                                        });
                                                    } else {
                                                        const num = parseInt(value, 10);
                                                        if (!isNaN(num)) {
                                                            handleScoreChange(criterion.id, Math.max(criterion.scorMin, Math.min(criterion.scorMax, num)));
                                                        }
                                                    }
                                                }}
                                                disabled={isReadOnly}
                                                className="w-20 sm:w-28 h-14 sm:h-24 text-center text-2xl sm:text-4xl font-bold text-ave-blue bg-white dark:bg-slate-600 border-2 border-gray-300 dark:border-slate-500 rounded-xl focus:ring-2 focus:ring-ave-blue focus:border-ave-blue active:ring-2 cursor-text touch-manipulation"
                                                aria-label={`Scor pentru ${criterion.nume}`}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={criterion.scorMin}
                                        max={criterion.scorMax}
                                        value={localScores[criterion.id] ?? 0}
                                        onChange={e => handleScoreChange(criterion.id, parseInt(e.target.value, 10))}
                                        disabled={isReadOnly}
                                        className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 accent-ave-blue touch-manipulation"
                                        aria-label={`Score slider for ${criterion.nume}`}
                                        style={{ touchAction: 'manipulation' }}
                                    />
                                </div>
                                <div className="relative w-full">
                                    <ChatBubbleLeftIcon className="absolute left-4 top-4 text-gray-400 dark:text-slate-400 w-6 h-6"/>
                                    <textarea
                                        rows={3}
                                        placeholder="Adaugă observații..."
                                        value={localObservations[criterion.id] || ''}
                                        onChange={e => handleObservationChange(criterion.id, e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-ave-blue focus:border-ave-blue dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400 disabled:opacity-50 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <footer className="p-4 sm:p-5 border-t dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 z-10 flex flex-col gap-4 flex-shrink-0 w-full overflow-x-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm sm:text-base text-gray-600 dark:text-slate-400 flex-shrink-0">Scor Final:</span>
                        <p className="text-2xl sm:text-4xl font-extrabold text-ave-blue flex-shrink-0">{finalScore.toFixed(2)}</p>
                    </div>
                    {isReadOnly ? (
                         <p className="text-base font-semibold text-center text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50 px-4 py-3 rounded-xl">Evaluare Finalizată</p>
                    ) : isAdmin ? (
                        <div className="flex flex-col gap-3 w-full">
                            <input
                                type="text"
                                placeholder="Motivul modificării (obligatoriu)"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-ave-blue focus:border-ave-blue dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                             <button 
                                onClick={() => handleSave(assignment.status)} 
                                className="w-full py-4 rounded-xl text-base font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue active:bg-ave-dark-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                                disabled={hasChanges && !reason.trim()}>
                                Salvează Modificări
                             </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <button 
                                onClick={() => handleSave(Status.IN_CURS)} 
                                className="flex-1 py-4 rounded-xl text-base font-semibold border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                                disabled={Object.keys(validationErrors).length > 0}>
                                Salvează Progres
                            </button>
                            <button 
                                onClick={() => handleSave(Status.FINALIZAT)} 
                                className="flex-1 py-4 rounded-xl text-base font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue active:bg-ave-dark-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                                disabled={Object.keys(validationErrors).length > 0}>
                                Trimite Final
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default ScoringPanel;
