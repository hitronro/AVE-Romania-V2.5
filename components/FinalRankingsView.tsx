import React from 'react';
import { Candidat, Category, Assignment, Status } from '../types';
import Card from './shared/Card';
import { CrownIcon } from './shared/icons';

interface FinalRankingsViewProps {
    categoryWinners: Candidat[];
    directorOfTheYear: Candidat | undefined;
    categories: Category[];
    assignments: Assignment[];
}

// Internal component for displaying a winner card
const WinnerCard: React.FC<{ candidate: Candidat; isBig?: boolean; category?: Category }> = ({ candidate, isBig = false, category }) => {
    const imageSizeClass = isBig ? 'w-32 h-32' : 'w-24 h-24';
    const nameSizeClass = isBig ? 'text-2xl' : 'text-lg';

    return (
        <Card className={`p-0 flex flex-col text-center ${isBig ? '' : 'h-full'} overflow-hidden`}>
            {category && (
                <div className="bg-ave-blue/10 dark:bg-ave-blue/20 p-2 border-b border-ave-blue/20 dark:border-ave-blue/30">
                    <p className="text-xs font-bold text-ave-blue uppercase tracking-wider">{category.nume}</p>
                </div>
            )}
            <div className="p-6 flex-grow flex flex-col justify-center items-center">
                <img src={candidate.pozaUrl} alt={candidate.nume} className={`${imageSizeClass} rounded-full object-cover mx-auto ring-4 ring-white dark:ring-slate-800 shadow-lg`}/>
                <h4 className={`mt-4 font-bold text-ave-dark-blue dark:text-slate-100 ${nameSizeClass}`}>{candidate.nume}</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">{candidate.scoala}</p>
            </div>
        </Card>
    );
};

/**
 * Renders the final results of the competition, showing the "Director of the Year"
 * and the winners for each category.
 */
const FinalRankingsView: React.FC<FinalRankingsViewProps> = ({ categoryWinners, directorOfTheYear, categories, assignments }) => {
    const getWinningCategoryForDisplay = (candidate: Candidat): Category | undefined => {
        // For the overall winner, we stored the category
        if (candidate.isWinner && candidate.winningCategoryId) {
            return categories.find(c => c.id === candidate.winningCategoryId);
        }
        
        // For category winners, we must calculate it based on their best performance in the national stage
        const nationalStageAssignments = assignments.filter(a =>
            a.etapaId === 'etapa4' &&
            a.candidatId === candidate.id &&
            a.status === Status.FINALIZAT &&
            a.scorFinal !== undefined
        );
        if (nationalStageAssignments.length === 0) {
            // As a fallback, return the first category listed for the candidate
            return categories.find(c => c.id === candidate.categorieIds[0]);
        }
    
        const scoresByCategory: Record<string, { total: number; count: number }> = {};
        nationalStageAssignments.forEach(a => {
            scoresByCategory[a.categorieId] = scoresByCategory[a.categorieId] || { total: 0, count: 0 };
            scoresByCategory[a.categorieId].total += a.scorFinal!;
            scoresByCategory[a.categorieId].count++;
        });
    
        const bestCategory = Object.entries(scoresByCategory).reduce((best, [catId, data]) => {
            const avg = data.total / data.count;
            if (avg > best.avg) return { catId, avg };
            return best;
        }, { catId: '', avg: -1 });
        
        return categories.find(c => c.id === bestCategory.catId);
    };

    return (
        <div className="space-y-12">
            {/* Section for the Director of the Year */}
            {directorOfTheYear ? (
                <section aria-labelledby="director-anului-heading" className="bg-gray-100 dark:bg-slate-800/50 py-12 rounded-xl">
                    <div className="text-center space-y-4">
                        <h3 id="director-anului-heading" className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100 flex items-center justify-center gap-3">
                            <CrownIcon className="w-8 h-8 text-ave-gold"/>
                            Directorul Anului {new Date().getFullYear() + 1}
                        </h3>
                        <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">Câștigătorul titlului suprem, selectat dintre finaliștii pe categorii.</p>
                    </div>
                    <div className="mt-8 max-w-sm mx-auto">
                        <WinnerCard 
                            candidate={directorOfTheYear} 
                            isBig={true} 
                            category={getWinningCategoryForDisplay(directorOfTheYear)}
                        />
                    </div>
                </section>
            ) : (
                <Card className="p-8 text-center">
                    <h3 className="text-xl font-bold text-ave-dark-blue dark:text-slate-100">Directorul Anului nu a fost încă desemnat.</h3>
                    <p className="mt-2 text-gray-500 dark:text-slate-400">Accesați "Etapa 5 - Finala" pentru a selecta câștigătorul.</p>
                </Card>
            )}

            {/* Section for Category Winners */}
            <section aria-labelledby="laureati-heading">
                <div className="text-center space-y-2">
                    <h3 id="laureati-heading" className="text-2xl font-bold text-ave-dark-blue dark:text-slate-100">
                        Laureații pe Categorii
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400">Câștigătorii finali pentru fiecare categorie de premiere.</p>
                </div>
                
                {categoryWinners.length === 0 ? (
                     <div className="text-center text-gray-500 dark:text-slate-400 py-8">
                        <p>Câștigătorii pe categorii vor fi afișați după desemnarea Directorului Anului.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                        {categoryWinners.map(candidate => (
                            <WinnerCard 
                                key={candidate.id} 
                                candidate={candidate} 
                                category={getWinningCategoryForDisplay(candidate)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default FinalRankingsView;