import React, { useState, useMemo, useEffect } from 'react';
import { Candidat, Assignment, Stage, Category, Criterion, Jurat, Status, User, UserRole } from '../types';
import Card from './shared/Card';
import { TrophyIcon, AlertTriangleIcon, TableIcon, GridIcon, SectionsIcon, DownloadIcon, UserGroupIcon, ClipboardDocumentCheckIcon, ChevronUpDownIcon, CheckBadgeIcon, CrownIcon } from './shared/icons';
import FinalRankingsView from './FinalRankingsView';

type LeaderboardViewProps = {
    candidates: Candidat[];
    assignments: Assignment[];
    stages: Stage[];
    categories: Category[];
    criteria: Criterion[];
    judges: Jurat[];
    currentUser: User;
    setCandidates: React.Dispatch<React.SetStateAction<Candidat[]>>;
};

type ViewMode = 'sections' | 'cards' | 'table';

type EnhancedLeaderboardEntry = Candidat & {
    scorMediu: number | null;
    evaluariFinalizate: number;
    totalAsignari: number;
    scoruriPerCriteriu: Record<string, number | null>;
    evaluatedCategoryId: string; // The category for which this entry is calculated
};


const LeaderboardView: React.FC<LeaderboardViewProps> = (props) => {
    const { currentUser, setCandidates, assignments } = props;
    
    const activeStages = useMemo(() => props.stages.filter(s => s.activ), [props.stages]);

    // Find the last active stage to be selected by default
    const lastActiveStageId = useMemo(() => {
        return activeStages.length > 0 ? activeStages[activeStages.length - 1].id : (props.stages[0]?.id || '');
    }, [activeStages, props.stages]);

    const [selectedStageId, setSelectedStageId] = useState<string>(lastActiveStageId);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedCandidate, setSelectedCandidate] = useState<EnhancedLeaderboardEntry | null>(null);
    const isAdmin = currentUser.rol === UserRole.ADMIN;
    const directorOfTheYear = useMemo(() => props.candidates.find(c => c.isWinner), [props.candidates]);

     useEffect(() => {
        // This effect ensures that if the `lastActiveStageId` changes (e.g. from props update),
        // we reset the state. This is especially important for the initial render.
        setSelectedStageId(lastActiveStageId);
    }, [lastActiveStageId]);

    useEffect(() => {
        // This effect ensures that if the currently selected stage is deactivated,
        // we fall back to the last active stage.
        if (selectedStageId && !activeStages.some(s => s.id === selectedStageId)) {
            setSelectedStageId(lastActiveStageId);
        }
    }, [activeStages, selectedStageId, lastActiveStageId]);
    
    const handlePromoteCandidate = (candidateId: string, fromStageId: string) => {
        setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, promotions: { ...(c.promotions || {}), [fromStageId]: true } } : c));
    };

    const handleSetWinner = (candidateId: string, winnerCategoryId: string) => {
        if (!window.confirm("Sunteți sigur că doriți să desemnați acest candidat drept Directorul Anului? Această acțiune este finală și va promova automat locul 2 din categoria sa.")) {
            return;
        }
    
        const winner = props.candidates.find(c => c.id === candidateId);
        if (!winner) return;
    
        const nationalStageId = 'etapa4';
    
        const stageAssignments = props.assignments.filter(a => a.etapaId === nationalStageId && a.status === Status.FINALIZAT);
        const participantIds = new Set(stageAssignments.map(a => a.candidatId));
    
        const candidatesInCategory = props.candidates
            .filter(c => c.categorieIds.includes(winnerCategoryId) && participantIds.has(c.id))
            .map(cand => {
                const finalizatAssignments = stageAssignments.filter(a => a.candidatId === cand.id && a.categorieId === winnerCategoryId && a.scorFinal !== undefined);
                if (finalizatAssignments.length === 0) return { ...cand, scorMediu: -1 };
                const scorMediu = finalizatAssignments.reduce((acc, a) => acc + (a.scorFinal || 0), 0) / finalizatAssignments.length;
                return { ...cand, scorMediu };
            })
            .sort((a, b) => b.scorMediu - a.scorMediu);
    
        const secondPlaceCandidate = candidatesInCategory.find(c => c.id !== candidateId);
    
        setCandidates(prevCandidates => {
            let updatedCandidates = prevCandidates.map(c => ({
                ...c,
                isWinner: c.id === candidateId,
                winningCategoryId: c.id === candidateId ? winnerCategoryId : c.winningCategoryId
            }));
    
            if (secondPlaceCandidate) {
                updatedCandidates = updatedCandidates.map(c =>
                    c.id === secondPlaceCandidate.id
                        ? { ...c, promotions: { ...(c.promotions || {}), [nationalStageId]: true } }
                        : c
                );
            }
            return updatedCandidates;
        });
    };

    const highLevelStats = useMemo(() => {
        const totalCandidates = props.candidates.length;
        const completedAssignments = props.assignments.filter(a => a.status === Status.FINALIZAT && typeof a.scorFinal === 'number');
        const totalCompletedEvaluations = completedAssignments.length;
        let overallAverageScore = 0;
        if (totalCompletedEvaluations > 0) {
            const totalScoreSum = completedAssignments.reduce((sum, a) => sum + a.scorFinal!, 0);
            overallAverageScore = totalScoreSum / totalCompletedEvaluations;
        }
        return { totalCandidates, totalCompletedEvaluations, overallAverageScore };
    }, [props.candidates, props.assignments]);
    
    const visibleCandidates = useMemo(() => {
        const stageIndex = props.stages.findIndex(s => s.id === selectedStageId);
        if (stageIndex < 0) return [];
        
        // For 'Finala' (etapa5), show candidates promoted from the previous stage ('etapa4')
        if (props.stages[stageIndex].id === 'etapa5') {
            const prevStageId = 'etapa4';
            return props.candidates.filter(c => c.promotions?.[prevStageId]);
        }

        // For early stages, show all candidates.
        if (stageIndex <= 2) { // Etapa 1, 2, 3
            return props.candidates;
        }

        // For other later stages, show promoted candidates from previous stage
        if (stageIndex > 2) { 
            const prevStageId = props.stages[stageIndex - 1]?.id;
            if (prevStageId) {
                return props.candidates.filter(c => c.promotions?.[prevStageId]);
            }
        }
        return props.candidates;
    }, [props.candidates, selectedStageId, props.stages]);

    const enhancedEntries = useMemo((): EnhancedLeaderboardEntry[] => {
        const entries: EnhancedLeaderboardEntry[] = [];
        
        // Logic for Finala (Etapa 5) - scores are based on Etapa 4 results
        if (selectedStageId === 'etapa5') {
            // `visibleCandidates` are already filtered to be the finalists (promoted from etapa4)
            visibleCandidates.forEach(candidate => {
                const nationalStageAssignments = props.assignments.filter(a =>
                    a.etapaId === 'etapa4' &&
                    a.candidatId === candidate.id &&
                    a.status === Status.FINALIZAT &&
                    a.scorFinal !== undefined
                );
    
                if (nationalStageAssignments.length === 0) return;
    
                // Find the category in which they achieved their highest score to be considered a finalist
                const scoresByCategory: Record<string, { total: number; count: number }> = {};
                nationalStageAssignments.forEach(a => {
                    scoresByCategory[a.categorieId] = scoresByCategory[a.categorieId] || { total: 0, count: 0 };
                    scoresByCategory[a.categorieId].total += a.scorFinal!;
                    scoresByCategory[a.categorieId].count++;
                });
    
                const bestCategory = Object.entries(scoresByCategory).reduce((best, [catId, data]) => {
                    const avg = data.total / data.count;
                    return avg > best.avg ? { catId, avg } : best;
                }, { catId: '', avg: -1 });
    
                if (bestCategory.catId) {
                    entries.push({
                        ...candidate,
                        evaluatedCategoryId: bestCategory.catId,
                        scorMediu: bestCategory.avg, // This is their score from etapa4
                        evaluariFinalizate: scoresByCategory[bestCategory.catId].count,
                        totalAsignari: props.assignments.filter(a => a.candidatId === candidate.id && a.etapaId === 'etapa4' && a.categorieId === bestCategory.catId).length,
                        scoruriPerCriteriu: {}, // Not needed for the finalist card view
                    });
                }
            });
        } else { // Logic for all other stages
            visibleCandidates.forEach(candidate => {
                candidate.categorieIds.forEach(catId => {
                    const stageAssignments = props.assignments.filter(a =>
                        a.etapaId === selectedStageId &&
                        a.candidatId === candidate.id &&
                        a.categorieId === catId
                    );
                    
                    const finalizatAssignments = stageAssignments.filter(a => a.status === 'Finalizat' && a.scorFinal !== undefined);
                    const scorMediu = finalizatAssignments.length > 0
                        ? finalizatAssignments.reduce((acc, a) => acc + (a.scorFinal!), 0) / finalizatAssignments.length
                        : null;
                    
                    const relevantCriteria = props.criteria.filter(c => c.etapaId === selectedStageId && c.categorieId === catId);
                    const scoruriPerCriteriu: Record<string, number | null> = {};
                    relevantCriteria.forEach(crit => {
                        const scoresForCrit = finalizatAssignments.map(a => a.scoruri[crit.id]).filter(s => s !== undefined) as number[];
                        scoruriPerCriteriu[crit.id] = scoresForCrit.length > 0 ? scoresForCrit.reduce((a, b) => a + b, 0) / scoresForCrit.length : null;
                    });
                    
                    entries.push({
                        ...candidate,
                        evaluatedCategoryId: catId,
                        scorMediu,
                        evaluariFinalizate: finalizatAssignments.length,
                        totalAsignari: stageAssignments.length,
                        scoruriPerCriteriu,
                    });
                });
            });
        }
        
        return entries.sort((a, b) => (b.scorMediu ?? -1) - (a.scorMediu ?? -1));
    }, [visibleCandidates, props.assignments, selectedStageId, props.criteria]);

    const candidatesByCategory = useMemo(() => {
        return props.categories.map(category => ({
            ...category,
            candidates: enhancedEntries.filter(c => c.evaluatedCategoryId === category.id)
        })).filter(c => c.candidates.length > 0);
    }, [props.categories, enhancedEntries]);
    
    const relevantCriteria = useMemo(() => {
        const categoryIdsInView = new Set(enhancedEntries.map(c => c.evaluatedCategoryId));
        return props.criteria.filter(c => c.etapaId === selectedStageId && categoryIdsInView.has(c.categorieId));
    }, [props.criteria, selectedStageId, enhancedEntries]);


    const renderContent = () => {
        if (selectedStageId === 'etapa5') {
            const finalisti = enhancedEntries;
            return <WinnerSelectionView 
                candidates={finalisti} 
                onSetWinner={handleSetWinner} 
                isAdmin={isAdmin} 
                directorOfTheYear={directorOfTheYear}
                categories={props.categories}
            />;
        }
        
        if (selectedStageId === 'etapa_finala') {
            const finalCategoryWinners = props.candidates.filter(c => c.promotions?.['etapa4'] && c.id !== directorOfTheYear?.id);
            return <FinalRankingsView 
                categoryWinners={finalCategoryWinners} 
                directorOfTheYear={directorOfTheYear}
                categories={props.categories}
                assignments={assignments}
            />;
        }

        if (candidatesByCategory.length === 0) {
            return (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-slate-400">Nu există candidați de afișat pentru etapa selectată.</p>
                </Card>
            );
        }


        if (candidatesByCategory.length === 0) {
            return (
                <Card className="p-8 text-center">
                    <p className="text-gray-500 dark:text-slate-400">Nu există candidați de afișat pentru etapa selectată.</p>
                </Card>
            );
        }

        return (
            <div className="space-y-12">
                {candidatesByCategory.map(category => {
                    const categoryCriteria = relevantCriteria.filter(c => c.categorieId === category.id);
                    const topScoreInCategory = category.candidates.length > 0 ? Math.max(...category.candidates.map(c => c.scorMediu ?? -1)) : null;

                    return (
                        <div key={category.id}>
                            <h3 className="text-2xl font-bold text-ave-dark-blue dark:text-slate-100 border-b-2 border-ave-blue pb-2 mb-4">{category.nume}</h3>
                            <TableView 
                                candidates={category.candidates} 
                                categories={props.categories} 
                                relevantCriteria={categoryCriteria} 
                                onRowClick={setSelectedCandidate}
                                highlightTopScoreForRow={topScoreInCategory}
                                isAdmin={isAdmin}
                                onPromote={handlePromoteCandidate}
                                selectedStageId={selectedStageId}
                                directorOfTheYear={directorOfTheYear}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100 flex items-center gap-3">
                        <TrophyIcon className="w-8 h-8 text-ave-gold"/>
                        Clasament General
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Vizualizare de ansamblu a procesului de jurizare.</p>
                </div>
            </div>

            {directorOfTheYear && (
                <Card className="p-5 bg-gradient-to-r from-ave-gold/80 to-amber-400 text-white shadow-lg">
                    <div className="flex items-center justify-center space-x-4">
                        <CrownIcon className="w-12 h-12 text-white drop-shadow-lg"/>
                        <div className="text-center">
                            <p className="font-bold text-2xl drop-shadow-md">DIRECTORUL ANULUI {new Date().getFullYear() + 1}</p>
                            <p className="text-xl font-semibold text-white/90 drop-shadow-sm">{directorOfTheYear.nume}</p>
                            <p className="text-sm text-white/80">{directorOfTheYear.scoala}</p>
                        </div>
                    </div>
                </Card>
            )}
            
            <Card className="p-4">
                <div className="flex justify-around items-center divide-x divide-gray-200 dark:divide-slate-700">
                    <div className="px-4 text-center w-1/3 flex flex-col items-center">
                        <UserGroupIcon className="w-8 h-8 text-ave-blue mb-2"/>
                        <p className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">{highLevelStats.totalCandidates}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Total Candidați</p>
                    </div>
                    <div className="px-4 text-center w-1/3 flex flex-col items-center">
                        <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-500 mb-2"/>
                        <p className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">{highLevelStats.totalCompletedEvaluations}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Evaluări Finalizate</p>
                    </div>
                    <div className="px-4 text-center w-1/3 flex flex-col items-center">
                        <TrophyIcon className="w-8 h-8 text-ave-gold mb-2"/>
                        <p className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">{highLevelStats.overallAverageScore.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Scor Mediu General</p>
                    </div>
                </div>
            </Card>

            <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2 overflow-x-auto">
                {activeStages.map(stage => (
                    <button 
                        key={stage.id} 
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${selectedStageId === stage.id ? 'bg-ave-blue text-white' : 'text-gray-700 hover:bg-gray-200 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        {stage.nume}
                    </button>
                ))}
            </div>

            {renderContent()}

            {selectedCandidate && (
                <CandidateDetailModal 
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    assignments={props.assignments}
                    judges={props.judges}
                    criteria={props.criteria}
                    stageId={selectedStageId}
                    categories={props.categories}
                />
            )}
        </div>
    );
};

const WinnerSelectionView: React.FC<{ 
    candidates: EnhancedLeaderboardEntry[], 
    onSetWinner: (candidateId: string, categoryId: string) => void, 
    isAdmin: boolean, 
    directorOfTheYear: Candidat | undefined,
    categories: Category[]
}> = ({ candidates, onSetWinner, isAdmin, directorOfTheYear, categories }) => {

    const FinalistCard: React.FC<{ candidate: EnhancedLeaderboardEntry }> = ({ candidate }) => {
        const category = categories.find(c => c.id === candidate.evaluatedCategoryId);
        return (
             <Card className="p-0 flex flex-col text-center h-full overflow-hidden">
                {category && (
                    <div className="bg-ave-blue/10 dark:bg-ave-blue/20 p-2 border-b border-ave-blue/20 dark:border-ave-blue/30">
                        <p className="text-xs font-bold text-ave-blue uppercase tracking-wider">{category.nume}</p>
                    </div>
                )}
                <div className="p-6 flex-grow">
                    <img src={candidate.pozaUrl} alt={candidate.nume} className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-white dark:ring-slate-800 shadow-lg"/>
                    <h4 className="mt-4 font-bold text-ave-dark-blue dark:text-slate-100 text-lg">{candidate.nume}</h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{candidate.scoala}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 border-t border-gray-200 dark:border-slate-700">
                    {isAdmin && !directorOfTheYear && (
                        <button
                            onClick={() => onSetWinner(candidate.id, candidate.evaluatedCategoryId)}
                            className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-gold hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <CrownIcon className="w-5 h-5"/>
                            <span>Desemnează Directorul Anului</span>
                        </button>
                    )}
                    {directorOfTheYear && (
                         <p className={`text-sm font-bold ${directorOfTheYear.id === candidate.id ? 'text-ave-gold' : 'text-gray-500 dark:text-slate-400'}`}>
                            {directorOfTheYear.id === candidate.id ? 'Câștigător' : 'Finalist'}
                        </p>
                    )}
                    {!isAdmin && !directorOfTheYear && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Finalist</p>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <section aria-labelledby="finalisti-heading">
            <div className="text-center space-y-2">
                <h3 id="finalisti-heading" className="text-2xl font-bold text-ave-dark-blue dark:text-slate-100">
                    {`Finaliștii pentru titlul de Directorul Anului ${new Date().getFullYear() + 1}`}
                </h3>
                <p className="text-gray-600 dark:text-slate-400">Câștigătorii etapei naționale pentru fiecare categorie de premiere.</p>
            </div>
            
            {candidates.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-slate-400 py-8">Câștigătorii etapei naționale nu au fost încă promovați.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {candidates.map(candidate => (
                        <div key={`${candidate.id}-${candidate.evaluatedCategoryId}`}>
                            <FinalistCard candidate={candidate} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// Table View Component
type TableViewProps = { 
    candidates: EnhancedLeaderboardEntry[], 
    categories: Category[], 
    relevantCriteria: Criterion[], 
    onRowClick: (candidate: EnhancedLeaderboardEntry) => void, 
    highlightTopScoreForRow: number | null,
    isAdmin: boolean,
    onPromote: (candidateId: string, fromStageId: string) => void,
    selectedStageId: string,
    directorOfTheYear: Candidat | undefined
};
const TableView: React.FC<TableViewProps> = ({ candidates, categories, relevantCriteria, onRowClick, highlightTopScoreForRow = null, isAdmin, onPromote, selectedStageId, directorOfTheYear }) => {
    
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'scorMediu', direction: 'desc' });

    const sortedCandidates = useMemo(() => {
        let sortableCandidates = [...candidates];
        if (sortConfig !== null) {
            sortableCandidates.sort((a, b) => {
                let aValue: any, bValue: any;

                if (sortConfig.key === 'candidat') aValue = a.nume;
                else if (sortConfig.key === 'categorie') aValue = categories.find(c => c.id === a.evaluatedCategoryId)?.nume || '';
                else if (sortConfig.key === 'scorMediu') aValue = a.scorMediu ?? -1;
                else aValue = a.scoruriPerCriteriu[sortConfig.key] ?? -1;

                if (sortConfig.key === 'candidat') bValue = b.nume;
                else if (sortConfig.key === 'categorie') bValue = categories.find(c => c.id === b.evaluatedCategoryId)?.nume || '';
                else if (sortConfig.key === 'scorMediu') bValue = b.scorMediu ?? -1;
                else bValue = b.scoruriPerCriteriu[sortConfig.key] ?? -1;
                
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                if (a.scorMediu !== null && b.scorMediu !== null) return b.scorMediu - a.scorMediu;
                return 0;
            });
        }
        return sortableCandidates;
    }, [candidates, categories, sortConfig]);
    
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
             setSortConfig({ key: 'scorMediu', direction: 'desc' });
             return;
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ChevronUpDownIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 ml-1 opacity-50 group-hover:opacity-100" />;
        if (sortConfig.direction === 'asc') return <svg className="w-4 h-4 ml-1 text-ave-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path></svg>;
        return <svg className="w-4 h-4 ml-1 text-ave-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>;
    };

    const minMaxPerCriterion = useMemo(() => {
        const result: Record<string, { min: number; max: number }> = {};
        relevantCriteria.forEach(crit => {
            const scores = candidates.map(c => c.scoruriPerCriteriu[crit.id]).filter((s): s is number => s !== null && s !== undefined);
            if (scores.length > 1) result[crit.id] = { min: Math.min(...scores), max: Math.max(...scores) };
        });
        return result;
    }, [candidates, relevantCriteria]);
    
    const nationalStageId = 'etapa4';
    
    const getCellClass = (critId: string, score: number | null, isWinnerRow: boolean): string => {
        if (score === null || !minMaxPerCriterion[critId]) return '';
        const { min, max } = minMaxPerCriterion[critId];
        if (min === max) return '';
        if (score === max) return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 font-bold';
        if (score === min && !isWinnerRow) return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
        return '';
    };

    return (
         <Card className="p-0 overflow-hidden">
            <div className="max-h-[75vh] overflow-auto">
                <table className="min-w-full text-sm align-middle">
                    <thead className="bg-gray-100/95 dark:bg-slate-700/95 backdrop-blur-sm sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">#</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                <button onClick={() => requestSort('candidat')} className="flex items-center group">Candidat {getSortIndicator('candidat')}</button>
                            </th>
                             {candidates.some(c => c.evaluatedCategoryId !== candidates[0]?.evaluatedCategoryId) && (
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    <button onClick={() => requestSort('categorie')} className="flex items-center group">Categorie {getSortIndicator('categorie')}</button>
                                </th>
                            )}
                            {relevantCriteria.map(c => <th key={c.id} className="py-3 px-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                <button onClick={() => requestSort(c.id)} className="flex items-center justify-center w-full group">{c.nume} {getSortIndicator(c.id)}</button>
                            </th>)}
                            <th className="py-3 px-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                <button onClick={() => requestSort('scorMediu')} className="flex items-center justify-center w-full group">Scor Mediu Final {getSortIndicator('scorMediu')}</button>
                            </th>
                            {isAdmin && <th className="py-3 px-4 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Acțiuni</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {sortedCandidates.map((candidate, index) => {
                            const isCategoryWinner = highlightTopScoreForRow !== null && candidate.scorMediu !== null && candidate.scorMediu >= highlightTopScoreForRow;
                            const isOverallWinner = directorOfTheYear?.id === candidate.id;
                            const isPromoted = candidate.promotions?.[selectedStageId];
                            
                            let rowClassName = 'transition-all duration-150 ease-in-out hover:shadow-md hover:-translate-y-px cursor-pointer';
                            const isGreenWinnerRow = isCategoryWinner || (isPromoted && selectedStageId === nationalStageId);

                            if (isOverallWinner && selectedStageId === nationalStageId) rowClassName += ' ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-ave-gold bg-amber-100/70 dark:bg-amber-400/20 text-amber-800 dark:text-amber-100 font-semibold';
                            else if (isGreenWinnerRow) rowClassName += ' bg-green-100 dark:bg-green-900/50 font-semibold';
                            else rowClassName += ' hover:bg-gray-50 dark:hover:bg-slate-800/50';

                            return (
                            <tr key={`${candidate.id}-${candidate.evaluatedCategoryId}`} onClick={() => onRowClick(candidate)} className={rowClassName}>
                                <td className="py-4 px-4 font-bold text-gray-700 dark:text-slate-300">{index + 1}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center space-x-3">
                                        <img src={candidate.pozaUrl} alt={candidate.nume} className="w-10 h-10 rounded-full object-cover"/>
                                        <div>
                                            <p className="font-bold text-ave-dark-blue dark:text-slate-100 flex items-center gap-1.5">{candidate.nume}{isOverallWinner && <CrownIcon title="Directorul Anului" className="w-5 h-5 text-ave-gold" />}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{candidate.scoala}</p>
                                        </div>
                                    </div>
                                </td>
                                {candidates.some(c => c.evaluatedCategoryId !== candidates[0]?.evaluatedCategoryId) && (
                                    <td className="py-4 px-4 text-gray-600 dark:text-slate-300">{categories.find(c => c.id === candidate.evaluatedCategoryId)?.nume}</td>
                                )}
                                {relevantCriteria.map(c => (
                                    <td key={c.id} className={`py-4 px-4 text-center font-mono text-gray-800 dark:text-slate-200 transition-colors ${getCellClass(c.id, candidate.scoruriPerCriteriu[c.id], isGreenWinnerRow)}`}>
                                        {candidate.scoruriPerCriteriu[c.id]?.toFixed(2) ?? '-'}
                                    </td>
                                ))}
                                <td className="py-4 px-4 text-center font-bold text-lg text-ave-blue font-mono">
                                    {candidate.scorMediu !== null ? candidate.scorMediu.toFixed(2) : 'N/A'}
                                </td>
                                {isAdmin && (
                                    <td className="py-4 px-4 text-center">
                                        {isPromoted ? (
                                            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 font-semibold">
                                                <CheckBadgeIcon className="w-5 h-5"/>
                                                <span>Promovat</span>
                                            </div>
                                        ) : (
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); onPromote(candidate.id, selectedStageId); }}
                                                className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!isCategoryWinner}
                                            >Promovează</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

interface CandidateDetailModalProps {
    candidate: EnhancedLeaderboardEntry;
    onClose: () => void;
    assignments: Assignment[];
    judges: Jurat[];
    criteria: Criterion[];
    stageId: string;
    categories: Category[];
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ candidate, onClose, assignments, judges, criteria, stageId, categories }) => {
    const relevantCriteria = useMemo(() => criteria.filter(c => c.etapaId === stageId && c.categorieId === candidate.evaluatedCategoryId), [criteria, stageId, candidate.evaluatedCategoryId]);
    const category = useMemo(() => categories.find(c => c.id === candidate.evaluatedCategoryId), [categories, candidate.evaluatedCategoryId]);

    const scoresByCriterion = useMemo(() => {
        const data: Record<string, { juratName: string, score: number }[]> = {};
        const relevantAssignments = assignments.filter(a => a.candidatId === candidate.id && a.etapaId === stageId && a.categorieId === candidate.evaluatedCategoryId && a.status === Status.FINALIZAT);
        relevantCriteria.forEach(crit => {
            data[crit.id] = relevantAssignments.map(a => ({
                juratName: judges.find(j => j.id === a.juratId)?.nume || 'N/A',
                score: a.scoruri[crit.id]
            })).filter((s): s is { juratName: string, score: number } => s.score !== undefined);
        });
        return data;
    }, [assignments, judges, relevantCriteria, candidate.id, stageId, candidate.evaluatedCategoryId]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700 flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <img src={candidate.pozaUrl} alt={candidate.nume} className="w-16 h-16 rounded-full object-cover"/>
                        <div>
                            <h3 className="text-xl font-bold text-ave-dark-blue dark:text-slate-100">{candidate.nume}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{candidate.scoala}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2.5 py-1 rounded-full">{candidate.regiune}</span>
                                {category && <span className="text-xs font-semibold bg-ave-blue/10 dark:bg-ave-blue/20 text-ave-blue px-2.5 py-1 rounded-full">{category.nume}</span>}
                            </div>
                        </div>
                    </div>
                     <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-sm text-gray-600 dark:text-slate-300">Scor Mediu Final:</span>
                        <p className="text-3xl font-extrabold text-ave-blue">{candidate.scorMediu?.toFixed(2)}</p>
                    </div>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Distribuția Scorurilor pe Criterii</h4>
                    {relevantCriteria.map(crit => {
                        const individualScores = scoresByCriterion[crit.id] || [];
                        const averageScore = candidate.scoruriPerCriteriu[crit.id];
                        const scoreRange = crit.scorMax - crit.scorMin;
                        const scores = individualScores.map(s => s.score);
                        const minScore = scores.length > 0 ? Math.min(...scores) : null;
                        const maxScore = scores.length > 0 ? Math.max(...scores) : null;

                        return (
                            <div key={crit.id} className="pb-6 border-b dark:border-slate-700 last:border-b-0">
                                <div>
                                    <h5 className="font-bold text-lg text-gray-800 dark:text-slate-200">{crit.nume}</h5>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 mt-1">
                                        <span>Medie: <span className="font-semibold text-ave-blue">{averageScore?.toFixed(2) ?? 'N/A'}</span></span>
                                        {minScore !== null && maxScore !== null && (
                                            <>
                                                <span className="text-gray-300 dark:text-slate-600">&bull;</span>
                                                <span>Min: <span className="font-semibold text-red-500 dark:text-red-400">{minScore.toFixed(2)}</span></span>
                                                <span className="text-gray-300 dark:text-slate-600">&bull;</span>
                                                <span>Max: <span className="font-semibold text-green-500 dark:text-green-400">{maxScore.toFixed(2)}</span></span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="mt-4 space-y-6">
                                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg" role="figure" aria-label={`Grafic bare pentru ${crit.nume}`}>
                                        <div className="relative w-full h-40 flex items-end justify-center gap-x-2 sm:gap-x-4 pl-8 pr-12">
                                            <div className="absolute top-0 w-full h-px bg-gray-300 dark:bg-slate-600 left-0"><span className="absolute -left-8 text-xs text-gray-400 -translate-y-1/2">{crit.scorMax}</span></div>
                                            <div className="absolute bottom-0 w-full h-px bg-gray-300 dark:bg-slate-600 left-0"><span className="absolute -left-8 text-xs text-gray-400 -translate-y-1/2">{crit.scorMin}</span></div>
                                            {individualScores.map((s, idx) => (
                                                <div key={idx} className="relative group w-full max-w-[30px] bg-ave-blue/30 dark:bg-ave-blue/50 hover:bg-ave-blue transition-colors duration-200 rounded-t" style={{ height: `${Math.max(0, (s.score - crit.scorMin) / scoreRange) * 100}%` }}>
                                                    <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg z-20 pointer-events-none">
                                                        <p className="font-semibold">{s.juratName}</p><p>Scor: {s.score.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {averageScore !== null && averageScore !== undefined && (
                                                <div className="absolute w-full border-t border-dashed border-ave-blue left-0" style={{ bottom: `calc(${Math.max(0, (averageScore - crit.scorMin) / scoreRange) * 100}%)` }} title={`Medie: ${averageScore.toFixed(2)}`}>
                                                    <span className="absolute -right-12 -translate-y-1/2 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-xs font-bold text-ave-blue rounded shadow-sm">Medie: {averageScore.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                 <footer className="p-4 border-t dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">Închide</button>
                </footer>
            </div>
        </div>
    )
}

export default LeaderboardView;