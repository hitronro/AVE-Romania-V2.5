import React, { useState, useMemo, useEffect } from 'react';
import { Candidat, Jurat, Assignment, Status, Criterion, Category, Regiune } from '../types';
import Card from './shared/Card';
import { SearchIcon, SlidersIcon, UserGroupIcon } from './shared/icons';
import ScoringPanel from './shared/ScoringPanel';
import CandidateEvaluationModal from './shared/CandidateEvaluationModal';

interface JudgeViewProps {
  candidates: Candidat[];
  judges: Jurat[];
  assignments: Assignment[];
  criteria: Criterion[];
  categories: Category[];
  currentJudge: Jurat;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
}

const JudgeView: React.FC<JudgeViewProps> = ({ candidates, assignments, criteria, categories, currentJudge, setAssignments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<Regiune | 'all'>('all');
  const [selectedAsignmentId, setSelectedAsignmentId] = useState<string | null>(null);
  const [evaluationAssignmentId, setEvaluationAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAsignmentId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedAsignmentId]);

  const myAssignments = useMemo(() => {
    return assignments.filter(a => a.juratId === currentJudge.id);
  }, [assignments, currentJudge]);

  const filteredAssignments = useMemo(() => {
    return myAssignments
      .filter(a => {
        const candidate = candidates.find(c => c.id === a.candidatId);
        if (!candidate) return false;
        
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesRegion = regionFilter === 'all' || candidate.regiune === regionFilter;
        const matchesSearch =
          candidate.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.scoala.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesRegion && matchesSearch;
      });
  }, [myAssignments, statusFilter, regionFilter, searchTerm, candidates]);

  const openScoringPanel = (assignmentId: string) => {
    setSelectedAsignmentId(assignmentId);
  };

  const closeScoringPanel = () => {
    setSelectedAsignmentId(null);
  };
  
  const selectedAssignment = useMemo(() => {
      return assignments.find(a => a.id === selectedAsignmentId);
  }, [selectedAsignmentId, assignments]);

  const selectedEvaluation = useMemo(() => {
    if (!evaluationAssignmentId) return undefined;
    const a = assignments.find(x => x.id === evaluationAssignmentId);
    if (!a) return undefined;
    const c = candidates.find(cc => cc.id === a.candidatId);
    const cat = categories.find(ct => ct.id === a.categorieId);
    return { a, c: c!, cat };
  }, [evaluationAssignmentId, assignments, candidates, categories]);

  const handleSaveAssignment = (updatedAssignment: Assignment) => {
    setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
  };


  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex justify-between items-center flex-wrap gap-y-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">Portal Jurizare</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Bine ai venit, {currentJudge.nume}. Aici poți evalua candidații.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-6 h-6" />
            <input
              type="text"
              placeholder="Caută candidat sau școală..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-ave-blue focus:border-ave-blue dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-slate-100"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative w-full">
              <SlidersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-6 h-6" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
                className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 rounded-xl appearance-none focus:ring-ave-blue focus:border-ave-blue dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:[color-scheme:dark]"
              >
                <option value="all">Toate statusurile</option>
                <option value={Status.NEINCEPUT}>Neînceput</option>
                <option value={Status.IN_CURS}>În curs</option>
                <option value={Status.FINALIZAT}>Finalizat</option>
              </select>
            </div>
            <div className="relative w-full">
              <UserGroupIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-6 h-6" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value as Regiune | 'all')}
                className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 rounded-xl appearance-none focus:ring-ave-blue focus:border-ave-blue dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:[color-scheme:dark]"
              >
                <option value="all">Toate regiunile</option>
                {Object.values(Regiune).map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map(assignment => {
            const candidate = candidates.find(c => c.id === assignment.candidatId);
            const category = categories.find(cat => cat.id === assignment.categorieId);
            if (!candidate) return null;

            return (
              <CandidateCard
                key={assignment.id}
                candidate={candidate}
                category={category}
                assignment={assignment}
                onEvaluate={() => openScoringPanel(assignment.id)}
                onViewSubmission={() => setEvaluationAssignmentId(assignment.id)}
              />
            );
          })}
        </div>
      ) : (
         <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400">Nu au fost găsiți candidați care să corespundă filtrelor selectate.</p>
        </div>
      )}

      {selectedAssignment && (
        <ScoringPanel 
            assignment={selectedAssignment} 
            candidate={candidates.find(c => c.id === selectedAssignment.candidatId)!}
            criteria={criteria}
            allAssignments={assignments}
            onClose={closeScoringPanel}
            onSave={handleSaveAssignment}
            isReadOnly={selectedAssignment.status === Status.FINALIZAT}
        />
      )}

      {selectedEvaluation && (
        <CandidateEvaluationModal
          open={!!evaluationAssignmentId}
          candidate={selectedEvaluation.c}
          assignment={selectedEvaluation.a}
          category={selectedEvaluation.cat}
          currentJudge={currentJudge}
          criteria={criteria}
          onClose={() => setEvaluationAssignmentId(null)}
          onUpdateAssignment={(updated) => {
            setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
          }}
        />
      )}
    </div>
  );
};

interface CandidateCardProps {
    candidate: Candidat;
    category?: Category;
    assignment: Assignment;
    onEvaluate: () => void;
  onViewSubmission: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, category, assignment, onEvaluate, onViewSubmission }) => {
    const statusStyles: Record<Status, string> = {
        [Status.FINALIZAT]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [Status.IN_CURS]: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-transparent',
        [Status.NEINCEPUT]: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
    <Card onClick={onEvaluate} className="p-3 sm:p-5 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-ave-blue transition-all duration-200 active:scale-[0.99] active:bg-gray-50 dark:active:bg-slate-700/50">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <img 
          src={candidate.pozaUrl} 
          alt={candidate.nume} 
          className="w-full sm:w-20 h-44 sm:h-20 rounded-xl object-cover flex-shrink-0" 
        />
        <div className="flex-grow min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <h3 className="font-bold text-lg sm:text-xl text-ave-dark-blue dark:text-slate-100 truncate pr-2">
              {candidate.nume}
            </h3>
            <div className="mt-2 sm:mt-0 flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${statusStyles[assignment.status]}`}>
                {assignment.status}
              </span>
              <p className="hidden sm:block mt-0 text-sm text-ave-blue font-semibold bg-ave-blue/10 dark:bg-ave-blue/20 px-3 py-1.5 rounded-full inline-block">
                {category?.nume || 'Categorie necunoscută'}
              </p>
            </div>
          </div>
          <p className="text-base text-gray-600 dark:text-slate-400 truncate mt-1">{candidate.scoala}</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-1 truncate">{candidate.titlu}</p>
          <p className="mt-3 text-sm text-ave-blue font-semibold bg-ave-blue/10 dark:bg-ave-blue/20 px-3 py-1.5 rounded-full inline-block sm:hidden">
            {category?.nume || 'Categorie necunoscută'}
          </p>
        </div>
      </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onViewSubmission(); }}
            className="px-3 py-2 text-sm font-semibold bg-gray-100 dark:bg-slate-700 rounded-lg text-ave-dark-blue dark:text-slate-100"
          >
            {assignment.status === Status.FINALIZAT ? 'Vezi scorul' : 'Vezi lucrarea'}
          </button>
        </div>
    </Card>
    )
}

export default JudgeView;