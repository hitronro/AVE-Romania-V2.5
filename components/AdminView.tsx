import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Candidat, Jurat, Assignment, AuditLog, Stage, Category, Criterion, Status, Admin, Regiune, UserRole } from '../types';
import Card from './shared/Card';
import { PlusIcon, TrashIcon, PencilSquareIcon, DownloadIcon, ClipboardDocumentCheckIcon, SearchIcon, ChatBubbleLeftIcon, InformationCircleIcon, AlertTriangleIcon, TableIcon, UserGroupIcon, DocumentDuplicateIcon, ClockIcon } from './shared/icons';
import { ADMINI } from '../constants';
import Tooltip from './shared/Tooltip';
import ScoringPanel from './shared/ScoringPanel';

// Helper hook for debouncing input to improve performance on large lists
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type AdminViewProps = {
    candidates: Candidat[];
    judges: Jurat[];
    assignments: Assignment[];
    stages: Stage[];
    categories: Category[];
    criteria: Criterion[];
    auditLogs: AuditLog[];
    currentUser: Admin;
    setCandidates: React.Dispatch<React.SetStateAction<Candidat[]>>;
    setJudges: React.Dispatch<React.SetStateAction<Jurat[]>>;
    setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
    setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
    addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
};

type AdminTab = 'config' | 'assignments' | 'audit';

type EditingItem =
  | { type: 'stage'; data: Stage | { nume: string; activ: boolean } }
  | { type: 'category'; data: Category | { nume: string } }
  | { type: 'criterion'; data: Criterion | { nume: string; descriere: string; pondere: number; scorMin: number; scorMax: number } };

type DeletingItem = {
    type: 'stage' | 'category' | 'criterion' | 'candidate' | 'jurat';
    id: string;
    name: string;
};

const ConfigManagement: React.FC<AdminViewProps> = (props) => {
    const { stages, setStages, categories, setCategories, criteria, setCriteria, candidates, setCandidates, assignments, setAssignments, addAuditLog, currentUser, judges, setJudges } = props;
    const [selectedStage, setSelectedStage] = useState<string | null>(stages.find(s=>s.activ)?.id || stages[0]?.id || null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(categories[0]?.id || null);
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Partial<Candidat> | null>(null);
    const [editingJurat, setEditingJurat] = useState<Partial<Jurat> | null>(null);
    const [deletingItem, setDeletingItem] = useState<DeletingItem | null>(null);


    const relevantCriteria = useMemo(() => {
        if (!selectedStage || !selectedCategory) return [];
        return criteria.filter(c => c.etapaId === selectedStage && c.categorieId === selectedCategory);
    }, [criteria, selectedStage, selectedCategory]);

    const totalWeight = useMemo(() => {
        return relevantCriteria.reduce((sum, crit) => sum + crit.pondere, 0);
    }, [relevantCriteria]);

    const handleToggleStage = (stageId: string) => {
        setStages(prevStages =>
            prevStages.map(stage =>
                stage.id === stageId ? { ...stage, activ: !stage.activ } : stage
            )
        );
    };

    const initiateDelete = (type: DeletingItem['type'], id: string, name: string) => {
        setDeletingItem({ type, id, name });
    };

    const confirmDelete = () => {
        if (!deletingItem) return;

        const { type, id, name } = deletingItem;

        if (type === 'stage') {
            setStages(prev => prev.filter(s => s.id !== id));
            setCriteria(prev => prev.filter(c => c.etapaId !== id)); // Cascade delete
            setAssignments(prev => prev.filter(a => a.etapaId !== id)); // Cascade delete
        }
        if (type === 'category') {
            setCategories(prev => prev.filter(c => c.id !== id));
            setCriteria(prev => prev.filter(c => c.categorieId !== id)); // Cascade delete
        }
        if (type === 'criterion') setCriteria(prev => prev.filter(c => c.id !== id));
        if (type === 'candidate') {
            setCandidates(prev => prev.filter(c => c.id !== id));
            setAssignments(prev => prev.filter(a => a.candidatId !== id)); // Cascade delete assignments
            addAuditLog({
                adminId: currentUser.id,
                actiune: 'Ștergere Candidat',
                detalii: {
                    candidatId: id,
                    numeCandidat: name,
                    motiv: `Candidatul "${name}" a fost șters din sistem.`
                }
            });
        }
        if (type === 'jurat') {
            const juratName = judges.find(j => j.id === id)?.nume || 'N/A';
            setJudges(prev => prev.filter(j => j.id !== id));
            setAssignments(prev => prev.filter(a => a.juratId !== id)); // Cascade delete assignments
            addAuditLog({
                adminId: currentUser.id,
                actiune: 'Ștergere Jurat',
                detalii: {
                    juratId: id,
                    numeJurat: juratName,
                    motiv: `Juratul "${juratName}" a fost șters din sistem.`
                }
            });
        }
        setDeletingItem(null);
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-ave-blue">Management Candidați</h3>
                        <button onClick={() => setEditingCandidate({ categorieIds: [] })} className="flex items-center space-x-1 text-sm font-semibold text-ave-blue hover:text-ave-dark-blue dark:hover:text-blue-400"><PlusIcon className="w-4 h-4" /><span>Adaugă Candidat</span></button>
                    </div>
                    <ul className="space-y-2 max-h-72 overflow-y-auto pr-2">
                        {candidates.length > 0 ? (
                            candidates.map(c => (
                                <li key={c.id} className="text-sm p-2 bg-gray-50 dark:bg-slate-700/50 rounded flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                        <img src={c.pozaUrl} alt={c.nume} className="w-8 h-8 rounded-full object-cover"/>
                                        <div className="min-w-0">
                                            <p className="font-semibold">{c.nume} <span className="font-mono text-xs text-gray-400 dark:text-slate-500">({c.id})</span></p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{c.scoala}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">
                                                {c.categorieIds.map(catId => categories.find(cat => cat.id === catId)?.nume || 'N/A').join(', ')}
                                            </p>
                                        </div>
                                </div>
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => setEditingCandidate(c)} className="text-gray-500 dark:text-slate-400 hover:text-ave-blue p-1 -m-1" title="Editează Candidat"><PencilSquareIcon className="w-4 h-4"/></button>
                                        <button onClick={() => initiateDelete('candidate', c.id, c.nume)} className="text-gray-500 dark:text-slate-400 hover:text-red-500 p-1 -m-1" title="Șterge Candidat"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="text-sm p-4 text-center text-gray-500 dark:text-slate-400">Niciun candidat configurat.</li>
                        )}
                    </ul>
                </Card>
                 <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-ave-blue">Management Jurați</h3>
                        <button onClick={() => setEditingJurat({})} className="flex items-center space-x-1 text-sm font-semibold text-ave-blue hover:text-ave-dark-blue dark:hover:text-blue-400"><PlusIcon className="w-4 h-4" /><span>Adaugă Jurat</span></button>
                    </div>
                    <ul className="space-y-2 max-h-72 overflow-y-auto pr-2">
                         {judges.length > 0 ? (
                            judges.map(j => {
                                const juratAssignmentsCount = assignments.filter(a => a.juratId === j.id).length;
                                return (
                                    <li key={j.id} className="text-sm p-2 bg-gray-50 dark:bg-slate-700/50 rounded flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-ave-blue/20 text-ave-blue flex items-center justify-center font-bold">
                                            {j.nume.charAt(0)}
                                        </div>
                                        <div>
                                                <p className="font-semibold">{j.nume} <span className="font-mono text-xs text-gray-400 dark:text-slate-500">({j.id})</span></p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{j.rol} - {juratAssignmentsCount} evaluări</p>
                                            </div>
                                    </div>
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => setEditingJurat(j)} className="text-gray-500 dark:text-slate-400 hover:text-ave-blue p-1 -m-1" title="Editează Jurat"><PencilSquareIcon className="w-4 h-4"/></button>
                                            <button onClick={() => initiateDelete('jurat', j.id, j.nume)} className="text-gray-500 dark:text-slate-400 hover:text-red-500 p-1 -m-1" title="Șterge Jurat"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </li>
                                );
                            })
                         ) : (
                            <li className="text-sm p-4 text-center text-gray-500 dark:text-slate-400">Niciun jurat configurat.</li>
                         )}
                    </ul>
                </Card>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-ave-blue">Etape</h3>
                        <button onClick={() => setEditingItem({ type: 'stage', data: { nume: '', activ: true } })} className="flex items-center space-x-1 text-sm font-semibold text-ave-blue hover:text-ave-dark-blue dark:hover:text-blue-400"><PlusIcon className="w-4 h-4" /><span>Adaugă</span></button>
                    </div>
                    <ul className="space-y-2 overflow-y-auto flex-grow">
                        {stages.map(s => (
                            <li key={s.id} onClick={() => setSelectedStage(s.id)} className={`text-sm p-2 rounded flex justify-between items-center cursor-pointer transition-all ${selectedStage === s.id ? 'bg-blue-100 dark:bg-ave-blue/30 font-semibold text-ave-blue dark:text-slate-100' : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'} ${!s.activ ? 'opacity-60' : ''}`}>
                                <span className={`${!s.activ ? 'text-gray-400 dark:text-slate-500' : ''}`}>{s.nume}</span>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleStage(s.id); }}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ave-blue focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${s.activ ? 'bg-ave-blue' : 'bg-gray-200 dark:bg-slate-600'}`}
                                        role="switch"
                                        aria-checked={s.activ}
                                        title={s.activ ? 'Dezactivează etapa' : 'Activează etapa'}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.activ ? 'translate-x-5' : 'translate-x-0'}`}/>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'stage', data: s }); }} className="text-gray-500 dark:text-slate-400 hover:text-ave-blue p-1 -m-1" title="Editează"><PencilSquareIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); initiateDelete('stage', s.id, s.nume); }} className="text-gray-500 dark:text-slate-400 hover:text-red-500 p-1 -m-1" title="Șterge"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-ave-blue">Categorii</h3>
                        <button onClick={() => setEditingItem({ type: 'category', data: { nume: '' } })} className="flex items-center space-x-1 text-sm font-semibold text-ave-blue hover:text-ave-dark-blue dark:hover:text-blue-400"><PlusIcon className="w-4 h-4" /><span>Adaugă</span></button>
                    </div>
                    <ul className="space-y-2 overflow-y-auto flex-grow">
                        {categories.map(c => (
                            <li key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-sm p-2 rounded flex justify-between items-center cursor-pointer transition-colors ${selectedCategory === c.id ? 'bg-blue-100 dark:bg-ave-blue/30 font-semibold text-ave-blue dark:text-slate-100' : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                <span>{c.nume}</span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'category', data: c }); }} className="text-gray-500 dark:text-slate-400 hover:text-ave-blue p-1 -m-1" title="Editează"><PencilSquareIcon className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); initiateDelete('category', c.id, c.nume); }} className="text-gray-500 dark:text-slate-400 hover:text-red-500 p-1 -m-1" title="Șterge"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-ave-blue">Criterii Evaluare</h3>
                        <button onClick={() => setEditingItem({ type: 'criterion', data: { nume: '', descriere: '', pondere: 0.1, scorMin: 1, scorMax: 100 } })} disabled={!selectedStage || !selectedCategory} className="flex items-center space-x-1 text-sm font-semibold text-ave-blue hover:text-ave-dark-blue disabled:opacity-50 disabled:cursor-not-allowed dark:hover:text-blue-400"><PlusIcon className="w-4 h-4" /><span>Adaugă</span></button>
                    </div>
                    {!selectedStage || !selectedCategory ? (
                        <div className="flex-grow flex items-center justify-center text-center text-sm text-gray-500 dark:text-slate-400">
                            <p>Selectați o etapă și o categorie pentru a vedea criteriile.</p>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col">
                            {relevantCriteria.length > 0 ? (
                                <ul className="space-y-2 overflow-y-auto flex-grow">
                                    {relevantCriteria.map(c => (
                                        <li key={c.id} className="text-sm p-2 bg-ave-blue/5 dark:bg-ave-blue/10 rounded flex justify-between items-center ring-1 ring-ave-blue/20 dark:ring-ave-blue/40 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span>{c.nume} ({(c.pondere*100)}%)</span>
                                                <Tooltip content="Ponderea criteriului în scorul final pentru această etapă/categorie. Suma ponderilor trebuie să fie 100%.">
                                                    <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 cursor-help" />
                                                </Tooltip>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => setEditingItem({ type: 'criterion', data: c })} className="text-gray-500 dark:text-slate-400 hover:text-ave-blue p-1 -m-1" title="Editează"><PencilSquareIcon className="w-4 h-4"/></button>
                                                <button onClick={() => initiateDelete('criterion', c.id, c.nume)} className="text-gray-500 dark:text-slate-400 hover:text-red-500 p-1 -m-1" title="Șterge"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex-grow flex items-center justify-center text-center text-sm text-gray-500 dark:text-slate-400">
                                    <p>Niciun criteriu definit. <br/>Apasă 'Adaugă' pentru a crea unul.</p>
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t dark:border-slate-700">
                                <p className={`flex items-center justify-end gap-2 text-sm font-semibold ${totalWeight.toFixed(2) !== '1.00' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {totalWeight.toFixed(2) !== '1.00' && <AlertTriangleIcon className="w-5 h-5" />}
                                    <span>
                                        Pondere totală: <strong>{(totalWeight * 100).toFixed(0)}%</strong>
                                        {totalWeight.toFixed(2) !== '1.00' && " (Atenție: trebuie să fie 100%)"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {editingItem && (
                <ConfigEditModal 
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    {...props}
                    selectedStageId={selectedStage!}
                    selectedCategoryId={selectedCategory!}
                />
            )}
            {editingCandidate && (
                <CandidateEditModal 
                    candidate={editingCandidate}
                    onClose={() => setEditingCandidate(null)}
                    {...props}
                />
            )}
             {editingJurat && (
                <JuratEditModal 
                    jurat={editingJurat}
                    onClose={() => setEditingJurat(null)}
                    {...props}
                />
            )}
            {deletingItem && (
                <ConfirmDeleteModal
                    item={deletingItem}
                    onClose={() => setDeletingItem(null)}
                    onConfirm={confirmDelete}
                    criteria={criteria}
                    assignments={assignments}
                />
            )}
        </>
    );
};

interface ConfirmDeleteModalProps {
    item: DeletingItem;
    onClose: () => void;
    onConfirm: () => void;
    criteria: Criterion[];
    assignments: Assignment[];
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ item, onClose, onConfirm, criteria, assignments }) => {
    const getDeletionDetails = () => {
        switch (item.type) {
            case 'stage':
                const criteriaCount = criteria.filter(c => c.etapaId === item.id).length;
                const assignmentsCount = assignments.filter(a => a.etapaId === item.id).length;
                return `Această acțiune este ireversibilă și va șterge și ${criteriaCount} criterii și ${assignmentsCount} asignări de evaluare asociate.`;
            case 'category':
                const catCriteriaCount = criteria.filter(c => c.categorieId === item.id).length;
                return `Această acțiune este ireversibilă și va șterge și ${catCriteriaCount} criterii asociate.`;
            case 'criterion':
                return 'Toate scorurile asociate acestui criteriu vor fi eliminate din evaluările existente.';
            case 'candidate':
                 const candAssignmentsCount = assignments.filter(a => a.candidatId === item.id).length;
                 return `Această acțiune este ireversibilă și va șterge și ${candAssignmentsCount} asignări de evaluare asociate.`;
            case 'jurat':
                const juratAssignmentsCount = assignments.filter(a => a.juratId === item.id).length;
                return `Această acțiune este ireversibilă și va șterge și ${juratAssignmentsCount} asignări de evaluare asociate acestui jurat.`;
            default:
                return 'Această acțiune este ireversibilă.';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <AlertTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-slate-100">Confirmare Ștergere</h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-slate-400 space-y-2">
                        <p>Sunteți sigur că doriți să ștergeți <strong className="text-gray-700 dark:text-slate-200">{`"${item.name}"`}</strong>?</p>
                        <p className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-2 rounded-md">{getDeletionDetails()}</p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end space-x-3 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">Anulează</button>
                    <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700">Da, șterge</button>
                </div>
            </div>
        </div>
    );
};


interface CandidateEditModalProps extends AdminViewProps {
    candidate: Partial<Candidat>;
    onClose: () => void;
}

const CandidateEditModal: React.FC<CandidateEditModalProps> = ({ candidate, onClose, setCandidates, categories, addAuditLog, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Candidat>>(candidate);
    const isNew = !formData.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const prevIds = prev.categorieIds || [];
            if (checked) {
                return { ...prev, categorieIds: [...prevIds, value] };
            } else {
                return { ...prev, categorieIds: prevIds.filter(id => id !== value) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { nume, scoala, categorieIds, regiune } = formData;
        if (!nume || !nume.trim() || !scoala || !scoala.trim() || !categorieIds || categorieIds.length === 0 || !regiune) {
            alert("Vă rugăm completați toate câmpurile obligatorii, inclusiv cel puțin o categorie.");
            return;
        }

        if (isNew) {
            const newCandidate: Candidat = {
                id: `c-${Date.now()}`,
                nume: formData.nume,
                titlu: formData.titlu || '',
                scoala: formData.scoala,
                regiune: formData.regiune,
                categorieIds: formData.categorieIds,
                pozaUrl: formData.pozaUrl || `https://i.pravatar.cc/150?u=${Date.now()}`
            };
            setCandidates(prev => [...prev, newCandidate]);
             addAuditLog({
                adminId: currentUser.id,
                actiune: 'Creare Candidat',
                detalii: {
                    candidatId: newCandidate.id,
                    numeCandidat: newCandidate.nume,
                    motiv: `Candidatul "${newCandidate.nume}" a fost adăugat în sistem.`
                }
            });
        } else {
            setCandidates(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } as Candidat : c));
        }
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold">{isNew ? "Adaugă Candidat Nou" : "Editează Candidat"}</h3>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label className="font-semibold text-sm">Nume Candidat</label>
                        <input type="text" name="nume" value={formData.nume || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Titlu</label>
                        <input type="text" name="titlu" value={formData.titlu || ''} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Școală</label>
                        <input type="text" name="scoala" value={formData.scoala || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="font-semibold text-sm">Regiune</label>
                            <select name="regiune" value={formData.regiune || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]">
                                <option value="" disabled>Selectează...</option>
                                {Object.values(Regiune).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                     </div>
                     <div>
                        <label className="font-semibold text-sm">Categorii</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border dark:border-slate-600 p-3 rounded-md max-h-40 overflow-y-auto">
                            {categories.map(c => (
                                <div key={c.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`cat-modal-${c.id}`}
                                        value={c.id}
                                        checked={formData.categorieIds?.includes(c.id) || false}
                                        onChange={handleCategoryChange}
                                        className="h-4 w-4 rounded border-gray-300 text-ave-blue focus:ring-ave-blue dark:bg-slate-600 dark:border-slate-500"
                                    />
                                    <label htmlFor={`cat-modal-${c.id}`} className="ml-2 text-sm text-gray-700 dark:text-slate-200">{c.nume}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                      <div>
                        <label className="font-semibold text-sm">URL Poză Profil</label>
                        <input type="text" name="pozaUrl" value={formData.pozaUrl || ''} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" placeholder="https://..." />
                    </div>
                </div>
                <footer className="p-5 border-t dark:border-slate-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anulează</button>
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue">Salvează</button>
                </footer>
            </form>
        </div>
    );
};


interface JuratEditModalProps extends AdminViewProps {
    jurat: Partial<Jurat>;
    onClose: () => void;
}

const JuratEditModal: React.FC<JuratEditModalProps> = ({ jurat, onClose, setJudges, addAuditLog, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Jurat>>(jurat);
    const isNew = !formData.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, nume: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nume = formData.nume;
        if (typeof nume !== 'string' || !nume.trim()) {
            alert("Numele juratului nu poate fi gol.");
            return;
        }

        if (isNew) {
            const newJurat: Jurat = {
                id: `j-${Date.now()}`,
                nume: nume,
                rol: UserRole.JUDGE,
            };
            setJudges(prev => [...prev, newJurat]);
            addAuditLog({
                adminId: currentUser.id,
                actiune: 'Creare Jurat',
                detalii: {
                    juratId: newJurat.id,
                    numeJurat: newJurat.nume,
                    motiv: `Juratul "${newJurat.nume}" a fost adăugat în sistem.`
                }
            });
        } else {
            setJudges(prev => prev.map(j => j.id === formData.id ? { ...j, ...formData } as Jurat : j));
        }
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold">{isNew ? "Adaugă Jurat Nou" : "Editează Jurat"}</h3>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="font-semibold text-sm">Nume Jurat</label>
                        <input type="text" name="nume" value={formData.nume || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </div>
                </div>
                <footer className="p-5 border-t dark:border-slate-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anulează</button>
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue">Salvează</button>
                </footer>
            </form>
        </div>
    );
};

interface ConfigEditModalProps extends AdminViewProps {
    item: EditingItem;
    onClose: () => void;
    selectedStageId: string;
    selectedCategoryId: string;
}

const ConfigEditModal: React.FC<ConfigEditModalProps> = ({ item, onClose, setStages, setCategories, setCriteria, selectedStageId, selectedCategoryId }) => {
    const [formData, setFormData] = useState(item.data);
    const isNew = !('id' in item.data);
    
    const titles: Record<EditingItem['type'], string> = {
        stage: isNew ? "Adaugă Etapă Nouă" : "Editează Etapă",
        category: isNew ? "Adaugă Categorie Nouă" : "Editează Categorie",
        criterion: isNew ? "Adaugă Criteriu Nou" : "Editează Criteriu",
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value);
        setFormData(prev => ({...prev, [name]: val }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ('nume' in formData) {
            const nume = (formData as { nume?: unknown }).nume;
            if (typeof nume !== 'string' || !nume.trim()) {
                alert("Numele nu poate fi gol.");
                return;
            }
        }

        switch (item.type) {
            case 'stage':
                setStages(prev => isNew 
                    ? [...prev, { ...(formData as Stage), id: `stage-${Date.now()}` }] 
                    : prev.map(s => s.id === (formData as Stage).id ? (formData as Stage) : s)
                );
                break;
            case 'category':
                 setCategories(prev => isNew 
                    ? [...prev, { ...(formData as Category), id: `cat-${Date.now()}` }] 
                    : prev.map(c => c.id === (formData as Category).id ? (formData as Category) : c)
                );
                break;
            case 'criterion':
                 setCriteria(prev => isNew 
                    ? [...prev, { ...(formData as Criterion), id: `crit-${Date.now()}`, etapaId: selectedStageId, categorieId: selectedCategoryId }] 
                    : prev.map(c => c.id === (formData as Criterion).id ? (formData as Criterion) : c)
                );
                break;
        }
        onClose();
    }

    const renderFormFields = () => {
        switch (item.type) {
            case 'stage':
                const stageData = formData as Stage;
                return (
                    <>
                        <div>
                            <label className="font-semibold text-sm">Nume Etapă</label>
                            <input type="text" name="nume" value={stageData.nume} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="activ" id="activ" checked={stageData.activ} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-ave-blue focus:ring-ave-blue dark:bg-slate-600 dark:border-slate-500" />
                            <label htmlFor="activ">Este etapa activă?</label>
                        </div>
                    </>
                );
            case 'category':
                const catData = formData as Category;
                return (
                    <div>
                        <label className="font-semibold text-sm">Nume Categorie</label>
                        <input type="text" name="nume" value={catData.nume} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                    </div>
                );
            case 'criterion':
                 const critData = formData as Criterion;
                return (
                    <>
                         <div>
                            <label className="font-semibold text-sm">Nume Criteriu</label>
                            <input type="text" name="nume" value={critData.nume} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                        </div>
                        <div>
                            <label className="font-semibold text-sm">Descriere</label>
                            <textarea name="descriere" value={critData.descriere} onChange={handleChange} rows={3} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <label className="font-semibold text-sm">Pondere (%)</label>
                                    <Tooltip content="Introduceți ponderea ca procent (ex: 30 pentru 30%). Suma ponderilor pentru toate criteriile dintr-o categorie, pentru o anumită etapă, trebuie să fie 100%.">
                                        <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 cursor-help" />
                                    </Tooltip>
                                </div>
                                <input type="number" name="pondere" value={critData.pondere * 100} onChange={e => setFormData(p => ({...p, pondere: parseFloat(e.target.value) / 100}))} step="1" min="0" max="100" required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                            </div>
                            <div>
                                <label className="font-semibold text-sm">Scor Min</label>
                                <input type="number" name="scorMin" value={critData.scorMin} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                            </div>
                            <div>
                                <label className="font-semibold text-sm">Scor Max</label>
                                <input type="number" name="scorMax" value={critData.scorMax} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                            </div>
                        </div>
                    </>
                )
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold">{titles[item.type]}</h3>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    {renderFormFields()}
                </div>
                <footer className="p-5 border-t dark:border-slate-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anulează</button>
                    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue">Salvează</button>
                </footer>
            </form>
        </div>
    )
};

const AddAssignmentModal: React.FC<AdminViewProps & {onClose: () => void}> = (props) => {
    const { onClose, candidates, judges, stages, assignments, setAssignments, categories } = props;
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
    const [selectedJudgeId, setSelectedJudgeId] = useState<string>('');
    const [selectedStageId, setSelectedStageId] = useState<string>(stages.find(s => s.activ)?.id || stages[0]?.id || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

    const candidateCategories = useMemo(() => {
        const candidate = candidates.find(c => c.id === selectedCandidateId);
        if (!candidate) return [];
        return candidate.categorieIds.map(id => categories.find(c => c.id === id)).filter(Boolean) as Category[];
    }, [selectedCandidateId, candidates, categories]);

    useEffect(() => {
        // Reset category if candidate changes and old category is no longer valid
        if (selectedCategoryId && !candidateCategories.some(c => c.id === selectedCategoryId)) {
            setSelectedCategoryId('');
        }
    }, [selectedCandidateId, selectedCategoryId, candidateCategories]);


    const handleAddAssignment = () => {
        if (!selectedCandidateId || !selectedJudgeId || !selectedStageId || !selectedCategoryId) {
            alert("Vă rugăm selectați un candidat, un jurat, o etapă și o categorie.");
            return;
        }

        const alreadyExists = assignments.some(a =>
            a.candidatId === selectedCandidateId &&
            a.juratId === selectedJudgeId &&
            a.etapaId === selectedStageId &&
            a.categorieId === selectedCategoryId
        );

        if (alreadyExists) {
            alert("Această asignare există deja.");
            return;
        }

        const newAssignment: Assignment = {
            id: `a-${selectedCandidateId}-${selectedJudgeId}-${selectedStageId}-${selectedCategoryId}-${Date.now()}`,
            candidatId: selectedCandidateId,
            juratId: selectedJudgeId,
            etapaId: selectedStageId,
            categorieId: selectedCategoryId,
            status: Status.NEINCEPUT,
            scoruri: {},
            observatii: {},
            lastModified: new Date()
        };

        setAssignments(prev => [...prev, newAssignment]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold">Adaugă Asignare Manuală</h3>
                </header>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="font-semibold text-sm">Candidat</label>
                        <select value={selectedCandidateId} onChange={e => setSelectedCandidateId(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]">
                            <option value="">Selectează un candidat...</option>
                            {candidates.map(c => <option key={c.id} value={c.id}>{c.nume} - {c.scoala}</option>)}
                        </select>
                    </div>
                    {selectedCandidateId && (
                        <div>
                            <label className="font-semibold text-sm">Categorie</label>
                            <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]" disabled={candidateCategories.length === 0}>
                                <option value="">Selectează o categorie...</option>
                                {candidateCategories.map(c => <option key={c.id} value={c.id}>{c.nume}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                        <label className="font-semibold text-sm">Jurat</label>
                        <select value={selectedJudgeId} onChange={e => setSelectedJudgeId(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]">
                             <option value="">Selectează un jurat...</option>
                            {judges.map(j => <option key={j.id} value={j.id}>{j.nume}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-semibold text-sm">Etapă</label>
                        <select value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]">
                            {stages.map(s => <option key={s.id} value={s.id}>{s.nume}</option>)}
                        </select>
                    </div>
                </div>
                <footer className="p-5 border-t dark:border-slate-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anulează</button>
                    <button type="button" onClick={handleAddAssignment} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue">Confirmă Asignarea</button>
                </footer>
            </div>
        </div>
    );
};

interface ObservationsModalProps {
    assignment: Assignment;
    candidate: Candidat;
    judge: Jurat;
    criteria: Criterion[];
    onClose: () => void;
}

const ObservationsModal: React.FC<ObservationsModalProps> = ({ assignment, candidate, judge, criteria, onClose }) => {
    const relevantCriteria = criteria.filter(c => 
        c.etapaId === assignment.etapaId && 
        c.categorieId === assignment.categorieId
    );

    const hasAnyObservations = Object.values(assignment.observatii).some(obs => obs && typeof obs === 'string' && obs.trim() !== '');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-ave-dark-blue dark:text-slate-100">Observații Jurat</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Feedback de la <strong>{judge.nume}</strong> pentru <strong>{candidate.nume}</strong>
                    </p>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    {hasAnyObservations ? (
                        relevantCriteria.map(criterion => {
                            const observation = assignment.observatii[criterion.id];
                            const score = assignment.scoruri[criterion.id];

                            if (!observation || observation.trim() === '') {
                                return null;
                            }

                            return (
                                <div key={criterion.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-800 dark:text-slate-200">{criterion.nume}</h4>
                                        {score !== undefined && (
                                            <span className="font-bold text-ave-blue text-lg">{score}</span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{observation}</p>
                                </div>
                            );
                        })
                    ) : (
                         <p className="text-center text-gray-500 dark:text-slate-400 py-4">Acest jurat nu a lăsat nicio observație scrisă pentru această evaluare.</p>
                    )}
                </div>
                <footer className="p-4 border-t dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">Închide</button>
                </footer>
            </div>
        </div>
    );
};

interface AssignmentAuditModalProps {
    assignment: Assignment;
    onClose: () => void;
    auditLogs: AuditLog[];
    criteria: Criterion[];
    candidate: Candidat;
    judge: Jurat;
}

const AssignmentAuditModal: React.FC<AssignmentAuditModalProps> = ({ assignment, onClose, auditLogs, criteria, candidate, judge }) => {
    const relevantLogs = useMemo(() => {
        return auditLogs
            .filter(log =>
                log.actiune.includes('Modificare Scor') &&
                log.detalii.candidatId === assignment.candidatId &&
                log.detalii.juratId === assignment.juratId
            )
            .map(log => {
                const criterion = criteria.find(c => c.id === log.detalii.criteriuId);
                return { ...log, criterion };
            })
            .filter(logWithCriterion =>
                logWithCriterion.criterion &&
                logWithCriterion.criterion.etapaId === assignment.etapaId &&
                logWithCriterion.criterion.categorieId === assignment.categorieId
            )
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [auditLogs, criteria, assignment]);

    const getAdminName = (adminId: string) => ADMINI.find(a => a.id === adminId)?.nume || adminId;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold text-ave-dark-blue dark:text-slate-100">Istoric Modificări Scor</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Evaluare pentru <strong>{candidate.nume}</strong> de către <strong>{judge.nume}</strong>
                    </p>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    {relevantLogs.length > 0 ? (
                        <ul className="space-y-4">
                            {relevantLogs.map(log => (
                                <li key={log.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex justify-between items-start text-xs text-gray-500 dark:text-slate-400 mb-2">
                                        <span>{log.timestamp.toLocaleString('ro-RO')}</span>
                                        <span>{getAdminName(log.adminId)}</span>
                                    </div>
                                    <p className="font-semibold text-gray-800 dark:text-slate-200">
                                        Criteriu: {log.criterion?.nume || 'N/A'}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-sm font-mono bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">{log.detalii.scorVechi}</span>
                                        <span className="font-semibold">→</span>
                                        <span className="text-sm font-mono bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{log.detalii.scorNou}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                                        <span className="font-semibold">Motiv:</span> {log.detalii.motiv}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-slate-400 py-8">Nicio modificare de scor înregistrată pentru această evaluare.</p>
                    )}
                </div>
                <footer className="p-4 border-t dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">Închide</button>
                </footer>
            </div>
        </div>
    );
};

const AssignmentCell: React.FC<{
    assignment: Assignment | undefined;
    onDelete: () => void;
    onAdd: () => void;
    onEdit: () => void;
    onViewObservations: () => void;
    onViewAudit: () => void;
}> = ({ assignment, onDelete, onAdd, onEdit, onViewObservations, onViewAudit }) => {
    if (assignment) {
        const hasObservations = Object.values(assignment.observatii).some(obs => obs && typeof obs === 'string' && obs.trim() !== '');
        return (
            <div className="flex items-center justify-center">
                <Tooltip content={
                    <div>
                        <p>Status: <span className="font-bold">{assignment.status}</span></p>
                        {assignment.status === Status.FINALIZAT && <p>Scor: <span className="font-bold">{assignment.scorFinal?.toFixed(2)}</span></p>}
                    </div>
                }>
                    <div className={`w-full py-1 px-2 rounded text-xs font-semibold truncate cursor-default ${
                        assignment.status === Status.FINALIZAT ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                        assignment.status === Status.IN_CURS ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                        'bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-200'
                    }`}>
                        {assignment.status === Status.FINALIZAT ? `${assignment.scorFinal?.toFixed(2) || 'N/A'}` : assignment.status}
                    </div>
                </Tooltip>
                {hasObservations && (
                    <button onClick={onViewObservations} className="ml-1 text-gray-400 hover:text-ave-blue p-1 flex-shrink-0" title="Vezi observații">
                        <ChatBubbleLeftIcon className="w-3 h-3" />
                    </button>
                )}
                <button onClick={onViewAudit} className="ml-1 text-gray-400 hover:text-ave-blue p-1 flex-shrink-0" title="Vezi istoric modificări"><ClockIcon className="w-3 h-3" /></button>
                <button onClick={onEdit} className="ml-1 text-gray-400 hover:text-ave-blue p-1 flex-shrink-0" title="Modifică scor"><PencilSquareIcon className="w-3 h-3" /></button>
                <button onClick={onDelete} className="ml-1 text-gray-400 hover:text-red-500 p-1 flex-shrink-0" title="Șterge asignare"><TrashIcon className="w-3 h-3" /></button>
            </div>
        );
    }
    return (
        <div className="flex justify-center">
            <button onClick={onAdd} className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-400" title="Asignează"><PlusIcon className="w-4 h-4" /></button>
        </div>
    );
};

const AssignmentManagement: React.FC<AdminViewProps> = (props) => {
    const { candidates, judges, assignments, setAssignments, stages, addAuditLog, currentUser, criteria, categories, auditLogs } = props;
    const [summaryCandidate, setSummaryCandidate] = useState<Candidat | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [judgeSearchTerm, setJudgeSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [viewingObservationsAssignment, setViewingObservationsAssignment] = useState<Assignment | null>(null);
    const [viewingAuditAssignment, setViewingAuditAssignment] = useState<Assignment | null>(null);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const debouncedJudgeSearchTerm = useDebounce(judgeSearchTerm, 300);
    
    const activeStages = useMemo(() => stages.filter(s => s.activ), [stages]);
    const [selectedStageId, setSelectedStageId] = useState<string>(activeStages.find(s => s.id === 'etapa3')?.id || activeStages[0]?.id || '');

    const assignmentCountsByJudge = useMemo(() => {
        const counts: Record<string, number> = {};
        judges.forEach(judge => {
            counts[judge.id] = assignments.filter(a => a.juratId === judge.id && a.etapaId === selectedStageId).length;
        });
        return counts;
    }, [assignments, judges, selectedStageId]);

    useEffect(() => {
        if (selectedStageId && !activeStages.some(s => s.id === selectedStageId)) {
            setSelectedStageId(activeStages[0]?.id || '');
        }
    }, [activeStages, selectedStageId]);


    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [resizingColumn, setResizingColumn] = useState<{ id: string; startX: number; startWidth: number } | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
    const [containerHeight, setContainerHeight] = useState(0);

    const ROW_HEIGHT = 68;
    const OVERSCAN = 5;

    const assignmentMatrixItems = useMemo(() => {
        const items: { candidate: Candidat; category: Category }[] = [];
        candidates.forEach(candidate => {
            candidate.categorieIds.forEach(catId => {
                const category = categories.find(c => c.id === catId);
                if (category) {
                    items.push({ candidate, category });
                }
            });
        });

        return items.filter(item =>
            item.candidate.nume.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            item.candidate.scoala.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [candidates, categories, debouncedSearchTerm]);
    
    const filteredJudges = useMemo(() => {
        return judges.filter(j =>
            j.nume.toLowerCase().includes(debouncedJudgeSearchTerm.toLowerCase())
        );
    }, [judges, debouncedJudgeSearchTerm]);

    useEffect(() => {
        setColumnWidths(prev => {
            const newWidths: Record<string, number> = { 
                candidate: prev.candidate || 320,
                averageScore: prev.averageScore || 120,
            };
            filteredJudges.forEach(j => {
                newWidths[j.id] = prev[j.id] || 140;
            });
            return newWidths;
        });
    }, [filteredJudges]);
    
    useEffect(() => {
        const currentRef = scrollContainerRef.current;
        if (!currentRef) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerHeight(entries[0].contentRect.height);
            }
        });
        
        resizeObserver.observe(currentRef);
        
        if(currentRef.clientHeight > 0 && containerHeight === 0) {
            setContainerHeight(currentRef.clientHeight);
        }

        return () => resizeObserver.unobserve(currentRef);
    }, [containerHeight]);


    const handleMouseDown = useCallback((columnId: string, e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setResizingColumn({
            id: columnId,
            startX: e.clientX,
            startWidth: columnWidths[columnId],
        });
    }, [columnWidths]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingColumn) return;
            const dx = e.clientX - resizingColumn.startX;
            const newWidth = Math.max(100, resizingColumn.startWidth + dx);
            setColumnWidths(prev => ({ ...prev, [resizingColumn.id]: newWidth }));
        };
        const handleMouseUp = () => setResizingColumn(null);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollPosition({
            top: e.currentTarget.scrollTop,
            left: e.currentTarget.scrollLeft,
        });
    }, []);

    const judgeColumns = useMemo(() => {
        let currentOffset = 0;
        return filteredJudges.map(j => {
            const width = columnWidths[j.id] || 140;
            const col = { id: j.id, judge: j, width, offset: currentOffset };
            currentOffset += width;
            return col;
        });
    }, [filteredJudges, columnWidths]);
    
    const totalTableWidth = useMemo(() => {
        const candidateWidth = columnWidths.candidate || 320;
        const averageScoreWidth = columnWidths.averageScore || 120;
        const judgesWidth = judgeColumns.reduce((sum, col) => sum + col.width, 0);
        return candidateWidth + averageScoreWidth + judgesWidth;
    }, [columnWidths, judgeColumns]);

    const { virtualRows, paddingTop, paddingBottom } = useMemo(() => {
        if (assignmentMatrixItems.length === 0 || containerHeight === 0) {
            return { virtualRows: [], paddingTop: 0, paddingBottom: 0 };
        }
        
        const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT);
        const startIndex = Math.max(0, Math.floor(scrollPosition.top / ROW_HEIGHT) - OVERSCAN);
        const endIndex = Math.min(assignmentMatrixItems.length - 1, startIndex + visibleCount + OVERSCAN * 2);

        const rows = assignmentMatrixItems.slice(startIndex, endIndex + 1).map((item, i) => ({
            ...item,
            index: startIndex + i,
        }));
        
        return {
            virtualRows: rows,
            paddingTop: startIndex * ROW_HEIGHT,
            paddingBottom: (assignmentMatrixItems.length - (endIndex + 1)) * ROW_HEIGHT,
        };
    }, [scrollPosition.top, assignmentMatrixItems, ROW_HEIGHT, OVERSCAN, containerHeight]);
    
    const visibleJudgeColumnIds = useMemo(() => {
        const ids = new Set<string>();
        const containerWidth = scrollContainerRef.current?.clientWidth || 0;
        const candidateWidth = columnWidths.candidate || 320;
        const averageScoreWidth = columnWidths.averageScore || 120;
        const stickyWidth = candidateWidth + averageScoreWidth;
        const scrollLeft = scrollPosition.left;
        
        const renderBuffer = 300; 

        judgeColumns.forEach(col => {
            const colStart = col.offset + stickyWidth;
            const colEnd = colStart + col.width;
            if (colEnd > scrollLeft - renderBuffer && colStart < scrollLeft + containerWidth + renderBuffer) {
                ids.add(col.id);
            }
        });
        return ids;
    }, [scrollPosition.left, judgeColumns, columnWidths.candidate, columnWidths.averageScore, scrollContainerRef.current?.clientWidth]);

    const handleAssignmentChange = (candidatId: string, juratId: string, isAssigned: boolean, categoryId: string) => {
        const candidate = candidates.find(c => c.id === candidatId);
        const judge = judges.find(j => j.id === juratId);
        const stage = stages.find(s => s.id === selectedStageId);
        const category = categories.find(c => c.id === categoryId);

        if(isAssigned) {
            const existing = assignments.find(a => a.candidatId === candidatId && a.juratId === juratId && a.etapaId === selectedStageId && a.categorieId === categoryId);
            if (existing) return;

            const newAssignment: Assignment = {
                id: `a-${candidatId}-${juratId}-${selectedStageId}-${categoryId}-${Date.now()}`,
                candidatId,
                juratId,
                etapaId: selectedStageId,
                categorieId: categoryId,
                status: Status.NEINCEPUT,
                scoruri: {},
                observatii: {},
                lastModified: new Date()
            };
            setAssignments(prev => [...prev, newAssignment]);
            addAuditLog({
                adminId: currentUser.id,
                actiune: 'Creare Asignare',
                detalii: {
                    candidatId,
                    numeCandidat: candidate?.nume,
                    juratId,
                    numeJurat: judge?.nume,
                    etapaId: selectedStageId,
                    motiv: `Asignare manuală a juratului ${judge?.nume} pentru ${candidate?.nume} (Cat: ${category?.nume}) în etapa "${stage?.nume}".`
                }
            });
        } else {
            const assignmentToDelete = assignments.find(a => a.candidatId === candidatId && a.juratId === juratId && a.etapaId === selectedStageId && a.categorieId === categoryId);
            if (!assignmentToDelete) return;

            const deleteAssignment = () => {
                addAuditLog({
                    adminId: currentUser.id,
                    actiune: 'Ștergere Asignare',
                    detalii: {
                        candidatId,
                        numeCandidat: candidate?.nume,
                        juratId,
                        numeJurat: judge?.nume,
                        etapaId: selectedStageId,
                        statusVechi: assignmentToDelete.status,
                        motiv: `Ștergere manuală a asignării juratului ${judge?.nume} pentru ${candidate?.nume} (Cat: ${category?.nume}) în etapa "${stage?.nume}". Status anterior: "${assignmentToDelete.status}".`
                    }
                });
                setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete.id));
            };

            if (assignmentToDelete.status === Status.NEINCEPUT) {
                deleteAssignment();
            } else {
                const confirmationMessage = `Sunteți sigur că doriți să anulați asignarea? Această acțiune va șterge permanent evaluarea (status: ${assignmentToDelete.status}) făcută de ${judge?.nume} pentru ${candidate?.nume}. Doriți să continuați?`;

                if (window.confirm(confirmationMessage)) {
                    deleteAssignment();
                }
            }
        }
    };
    
    const handleAdminSaveAssignment = (updatedAssignment: Assignment, reason: string = '') => {
        const originalAssignment = assignments.find(a => a.id === updatedAssignment.id);
        if (!originalAssignment) return;
    
        const originalScores = originalAssignment.scoruri;
        const newScores = updatedAssignment.scoruri;
    
        const changes: { critId: string, oldScore: number|undefined, newScore: number }[] = [];
        Object.keys(newScores).forEach(critId => {
            const oldScore = originalScores[critId];
            const newScore = newScores[critId];
            if(oldScore !== newScore) {
                changes.push({critId, oldScore: oldScore ?? 0, newScore});
            }
        });

        Object.keys(originalScores).forEach(critId => {
            if(!(critId in newScores)) {
                changes.push({critId, oldScore: originalScores[critId], newScore: 0 });
            }
        });
    
        if (changes.length > 0 && (typeof reason !== 'string' || reason.trim() === '')) {
            alert("Vă rugăm să oferiți un motiv pentru modificarea scorurilor.");
            return;
        }
    
        changes.forEach(change => {
            addAuditLog({
                adminId: currentUser.id,
                actiune: 'Modificare Scor (Admin)',
                detalii: {
                    candidatId: updatedAssignment.candidatId,
                    numeCandidat: candidates.find(c => c.id === updatedAssignment.candidatId)?.nume,
                    juratId: updatedAssignment.juratId,
                    numeJurat: judges.find(j => j.id === updatedAssignment.juratId)?.nume,
                    etapaId: updatedAssignment.etapaId,
                    criteriuId: change.critId,
                    scorVechi: change.oldScore,
                    scorNou: change.newScore,
                    motiv: reason,
                }
            });
        });
    
        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
        setEditingAssignment(null);
    };

    const handleDownloadTemplate = () => {
        const headers = ['candidatId', 'numeCandidat', 'juratId'];
        const csvRows = [headers.join(',')];

        candidates.forEach(candidate => {
            const row = [candidate.id, `"${candidate.nume.replace(/"/g, '""')}"`, ''];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `template_asignari_${selectedStageId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportAssignments = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').slice(1);

            const newAssignments: Assignment[] = [];
            const errors: string[] = [];
            const existingJudges = new Set(judges.map(j => j.id));
            const existingCandidates = new Set(candidates.map(c => c.id));

            rows.forEach((rowStr, index) => {
                if (typeof rowStr !== 'string' || rowStr.trim() === '') return;

                const [candidatId, _, juratId] = rowStr.split(',').map(s => s.trim().replace(/"/g, ''));

                if (!candidatId || !juratId) {
                    errors.push(`Rândul ${index + 2}: Lipsește ID-ul candidatului sau al juratului.`);
                    return;
                }
                if (!existingCandidates.has(candidatId)) {
                    errors.push(`Rândul ${index + 2}: ID candidat invalid: ${candidatId}.`);
                    return;
                }
                if (!existingJudges.has(juratId)) {
                    errors.push(`Rândul ${index + 2}: ID jurat invalid: ${juratId}.`);
                    return;
                }
                
                const candidate = candidates.find(c => c.id === candidatId);
                if (!candidate) return;

                candidate.categorieIds.forEach(catId => {
                    const alreadyExists = assignments.some(a =>
                        a.candidatId === candidatId &&
                        a.juratId === juratId &&
                        a.etapaId === selectedStageId &&
                        a.categorieId === catId
                    );

                    if (alreadyExists) return;

                    const judge = judges.find(j => j.id === juratId);
                    const stage = stages.find(s => s.id === selectedStageId);
                    const category = categories.find(c => c.id === catId);

                    const newAssignment: Assignment = {
                        id: `a-import-${candidatId}-${juratId}-${selectedStageId}-${catId}-${Date.now()}`,
                        candidatId,
                        juratId,
                        etapaId: selectedStageId,
                        categorieId: catId,
                        status: Status.NEINCEPUT,
                        scoruri: {},
                        observatii: {},
                        lastModified: new Date()
                    };
                    newAssignments.push(newAssignment);
                    
                    addAuditLog({
                        adminId: currentUser.id,
                        actiune: 'Import Asignare',
                        detalii: {
                            candidatId,
                            numeCandidat: candidate?.nume,
                            juratId,
                            numeJurat: judge?.nume,
                            etapaId: selectedStageId,
                            motiv: `Asignare creată prin import CSV pentru etapa "${stage?.nume}" (Cat: ${category?.nume}).`
                        }
                    });
                })
            });

            if (newAssignments.length > 0) {
                setAssignments(prev => [...prev, ...newAssignments]);
            }
            
            let summary = `${newAssignments.length} asignări noi au fost importate cu succes.`;
            if (errors.length > 0) {
                summary += `\n\nAu fost găsite ${errors.length} erori:\n- ${errors.slice(0, 5).join('\n- ')}`;
                if (errors.length > 5) summary += '\n... și altele.';
            }
            alert(summary);
            setIsImportModalOpen(false);
        };
        reader.readAsText(file);
    };

    return (
        <>
            <Card className="p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-lg font-bold text-ave-blue">Matrice Asignări & Scoruri</h3>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg">
                            <PlusIcon className="w-4 h-4" />
                            <span>Asignare Nouă</span>
                        </button>
                        <button 
                            onClick={() => setIsImportModalOpen(true)} 
                            className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg">
                            <DownloadIcon className="w-4 h-4" />
                            <span>Import Asignări</span>
                        </button>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Caută candidat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"/>
                            </div>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                                <input type="text" placeholder="Caută jurat..." value={judgeSearchTerm} onChange={e => setJudgeSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"/>
                            </div>
                            <select value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)} className="pr-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:[color-scheme:dark]">
                                {activeStages.map(s => <option key={s.id} value={s.id}>{s.nume}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-auto" style={{ height: '70vh', cursor: resizingColumn ? 'col-resize' : 'default' }}>
                    <table className="min-w-full text-sm" style={{ tableLayout: 'fixed', width: `${totalTableWidth}px` }}>
                        <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-2 px-4 text-left font-semibold text-gray-600 dark:text-slate-300 relative group sticky left-0 z-30 bg-gray-50 dark:bg-slate-700" style={{ width: `${columnWidths.candidate || 320}px` }}>
                                    <div className="truncate pr-4">Candidat / Categorie</div>
                                    <div onMouseDown={(e) => handleMouseDown('candidate', e)} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-gray-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </th>
                                <th className="py-2 px-4 text-center font-semibold text-gray-600 dark:text-slate-300 relative group sticky z-20 bg-gray-50 dark:bg-slate-700 border-r dark:border-slate-600" style={{ width: `${columnWidths.averageScore || 120}px`, left: `${columnWidths.candidate || 320}px` }}>
                                    <div className="truncate pr-4 flex items-center justify-center gap-1">
                                        Medie Scoruri
                                        <Tooltip content="Media scorurilor finale acordate de toți jurații care au finalizat evaluarea în etapa selectată.">
                                            <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <div onMouseDown={(e) => handleMouseDown('averageScore', e)} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-gray-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </th>
                                {judgeColumns.map(({ id, judge, width }) => (
                                    <th key={id} className="py-2 px-3 text-center font-semibold text-gray-600 dark:text-slate-300 relative group" style={{ width: `${width}px` }}>
                                        <div className="flex items-center justify-center w-full pr-4">
                                            <span className="truncate" title={judge.nume}>{judge.nume}</span>
                                            <span 
                                                className="ml-2 flex-shrink-0 text-xs font-mono bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-full px-2 py-0.5"
                                                title={`Număr de asignări în ${stages.find(s => s.id === selectedStageId)?.nume || 'etapa curentă'}`}
                                            >
                                                {assignmentCountsByJudge[id] || 0}
                                            </span>
                                        </div>
                                        <div onMouseDown={(e) => handleMouseDown(id, e)} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-gray-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="relative z-0">
                            {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }}><td colSpan={filteredJudges.length + 2}></td></tr>}
                            {virtualRows.map(({ candidate, category }) => {
                                const candidateAssignments = assignments.filter(a => a.candidatId === candidate.id && a.etapaId === selectedStageId);
                                const finalizedAssignments = candidateAssignments.filter(a => a.status === Status.FINALIZAT && typeof a.scorFinal === 'number' && a.categorieId === category.id);
                                const averageScore = finalizedAssignments.length > 0
                                    ? finalizedAssignments.reduce((acc, a) => acc + a.scorFinal!, 0) / finalizedAssignments.length
                                    : null;

                                return (
                                    <tr key={`${candidate.id}-${category.id}`} className="group border-b dark:border-slate-700" style={{ height: `${ROW_HEIGHT}px` }}>
                                        <td className="py-2 px-4 sticky left-0 z-10 bg-white dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700/50 border-r dark:border-slate-700">
                                            <div className="flex items-center space-x-2">
                                                <img src={candidate.pozaUrl} alt={candidate.nume} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                                <div className="truncate flex-grow min-w-0">
                                                    <p className="font-bold truncate">{candidate.nume}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{candidate.scoala}</p>
                                                    <p className="text-xs font-semibold text-ave-blue dark:text-blue-400 truncate">{category.nume}</p>
                                                </div>
                                                <button onClick={() => setSummaryCandidate(candidate)} className="text-gray-400 hover:text-ave-blue flex-shrink-0 p-1" title="Vezi sumar evaluări"><InformationCircleIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 sticky z-10 bg-white dark:bg-slate-800 group-hover:bg-gray-50 dark:group-hover:bg-slate-700/50 border-r dark:border-slate-700 text-center" style={{ left: `${columnWidths.candidate || 320}px` }}>
                                            <div className="font-bold text-lg text-ave-blue">
                                                {averageScore !== null ? averageScore.toFixed(2) : '-'}
                                            </div>
                                        </td>
                                        {judgeColumns.map(({ id }) => {
                                            const assignment = candidateAssignments.find(a => a.juratId === id && a.categorieId === category.id);
                                            return (
                                                <td key={id} className="py-2 px-3 text-center align-middle">
                                                    {visibleJudgeColumnIds.has(id) ? (
                                                        <AssignmentCell
                                                            assignment={assignment}
                                                            onDelete={() => handleAssignmentChange(candidate.id, id, false, category.id)}
                                                            onAdd={() => handleAssignmentChange(candidate.id, id, true, category.id)}
                                                            onEdit={() => assignment && setEditingAssignment(assignment)}
                                                            onViewObservations={() => assignment && setViewingObservationsAssignment(assignment)}
                                                            onViewAudit={() => assignment && setViewingAuditAssignment(assignment)}
                                                        />
                                                    ) : <div style={{ height: '30px' }} />}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )
                            })}
                            {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }}><td colSpan={filteredJudges.length + 2}></td></tr>}
                        </tbody>
                    </table>
                    {assignmentMatrixItems.length === 0 && (
                        <div className="text-center py-16 text-gray-500 dark:text-slate-400">Niciun candidat găsit.</div>
                    )}
                </div>
                
                {summaryCandidate && <CandidateSummaryModal 
                    candidate={summaryCandidate} 
                    onClose={() => setSummaryCandidate(null)}
                    assignments={assignments}
                    judges={judges}
                    stageId={selectedStageId}
                    categories={categories}
                />}

                {isAddModalOpen && <AddAssignmentModal {...props} onClose={() => setIsAddModalOpen(false)} />}
                
                {isImportModalOpen && <AssignmentImportModal 
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportAssignments}
                    onDownloadTemplate={handleDownloadTemplate}
                />}

                {editingAssignment && (
                    <ScoringPanel 
                        assignment={editingAssignment} 
                        candidate={candidates.find(c => c.id === editingAssignment.candidatId)!}
                        criteria={criteria}
                        allAssignments={assignments}
                        onClose={() => setEditingAssignment(null)}
                        onSave={handleAdminSaveAssignment}
                        isReadOnly={false}
                        isAdmin={true}
                    />
                )}

                {viewingObservationsAssignment && (
                    <ObservationsModal
                        assignment={viewingObservationsAssignment}
                        candidate={candidates.find(c => c.id === viewingObservationsAssignment.candidatId)!}
                        judge={judges.find(j => j.id === viewingObservationsAssignment.juratId)!}
                        criteria={criteria}
                        onClose={() => setViewingObservationsAssignment(null)}
                    />
                )}
                 {viewingAuditAssignment && (
                    <AssignmentAuditModal
                        assignment={viewingAuditAssignment}
                        onClose={() => setViewingAuditAssignment(null)}
                        auditLogs={auditLogs}
                        criteria={criteria}
                        candidate={candidates.find(c => c.id === viewingAuditAssignment.candidatId)!}
                        judge={judges.find(j => j.id === viewingAuditAssignment.juratId)!}
                    />
                )}
            </Card>
        </>
    );
};

const AssignmentImportModal: React.FC<{
    onClose: () => void;
    onImport: (file: File) => void;
    onDownloadTemplate: () => void;
}> = ({ onClose, onImport, onDownloadTemplate }) => {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImportClick = () => {
        if (file) {
            onImport(file);
        } else {
            alert("Vă rugăm selectați un fișier CSV.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700">
                    <h3 className="text-lg font-bold">Import Asignări din CSV</h3>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        Selectați un fișier CSV pentru a adăuga asignări în masă pentru etapa curentă. Fișierul trebuie să conțină coloanele `candidatId` și `juratId`. Pentru candidații cu mai multe categorii, se va crea o asignare pentru fiecare categorie.
                    </p>
                    <button 
                        onClick={onDownloadTemplate} 
                        className="w-full flex items-center justify-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-2.5 rounded-lg"
                    >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                        <span>Descarcă fișier template</span>
                    </button>
                    <div 
                        className="mt-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-ave-blue"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <DownloadIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-slate-500" />
                        {file ? (
                            <p className="mt-2 text-sm font-semibold text-ave-blue">{file.name}</p>
                        ) : (
                             <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Trageți fișierul aici sau click pentru a selecta</p>
                        )}
                    </div>
                </div>
                <footer className="p-5 border-t dark:border-slate-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anulează</button>
                    <button type="button" onClick={handleImportClick} disabled={!file} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue disabled:opacity-50 disabled:cursor-not-allowed">Importă Asignări</button>
                </footer>
            </div>
        </div>
    );
};


const AuditAndExport: React.FC<AdminViewProps> = (props) => {
    const { auditLogs } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredLogs = useMemo(() => {
        if (!debouncedSearchTerm) return auditLogs;
        return auditLogs.filter(log =>
            log.actiune.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            log.detalii.numeCandidat?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            log.detalii.numeJurat?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            log.detalii.motiv.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            log.adminId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
    }, [auditLogs, debouncedSearchTerm]);

    const exportData = (data: any[], fileName: string) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `${fileName}.json`;
        link.click();
    };

    const exportResultsToCsv = () => {
        const { candidates, assignments, categories } = props;

        const escapeCsvCell = (cellData: string | number | undefined) => {
            if (cellData === undefined || cellData === null) return '';
            const stringData = String(cellData);
            if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
                return `"${stringData.replace(/"/g, '""')}"`;
            }
            return stringData;
        };

        const FINAL_STAGE_ID = 'etapa4';
        
        const stageAssignments = assignments.filter(a => a.etapaId === FINAL_STAGE_ID);

        const enhancedCandidates = candidates.flatMap(candidate => 
            candidate.categorieIds.map(catId => {
                const relevantAssignments = stageAssignments.filter(a => a.candidatId === candidate.id && a.categorieId === catId);
                const finalizatAssignments = relevantAssignments.filter(a => a.status === Status.FINALIZAT && a.scorFinal !== undefined);

                const scorMediu = finalizatAssignments.length > 0
                    ? finalizatAssignments.reduce((acc, a) => acc + (a.scorFinal || 0), 0) / finalizatAssignments.length
                    : null;
                
                return {
                    ...candidate,
                    categorieId: catId,
                    scorMediu,
                };
            })
        ).filter(c => c.scorMediu !== null);

        const candidatesByCategory = categories.map(category => ({
            ...category,
            candidates: enhancedCandidates
                .filter(c => c.categorieId === category.id)
                .sort((a, b) => (b.scorMediu ?? -1) - (a.scorMediu ?? -1)),
        })).filter(c => c.candidates.length > 0);

        const csvRows = ['Categorie,Rank Categorie,Nume Candidat,Scoala,Regiune,Scor Mediu Final'];
        
        candidatesByCategory.forEach(category => {
            category.candidates.forEach((candidate, index) => {
                const row = [
                    escapeCsvCell(category.nume),
                    index + 1,
                    escapeCsvCell(candidate.nume),
                    escapeCsvCell(candidate.scoala),
                    escapeCsvCell(candidate.regiune),
                    candidate.scorMediu?.toFixed(2) ?? 'N/A'
                ];
                csvRows.push(row.join(','));
            });
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "rezultate-finale-gala.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportCandidatesToCsv = () => {
        const { candidates, categories } = props;

        const escapeCsvCell = (cellData: string | number | undefined | null) => {
            if (cellData === undefined || cellData === null) return '';
            const stringData = String(cellData);
            if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
                return `"${stringData.replace(/"/g, '""')}"`;
            }
            return stringData;
        };

        const headers = ['ID', 'Nume', 'Titlu', 'Scoala', 'Regiune', 'Categorii'];
        const csvRows = [headers.join(',')];

        candidates.forEach(candidate => {
            const categoryNames = candidate.categorieIds.map(id => categories.find(c => c.id === id)?.nume || id).join('; ');
            const row = [
                escapeCsvCell(candidate.id),
                escapeCsvCell(candidate.nume),
                escapeCsvCell(candidate.titlu),
                escapeCsvCell(candidate.scoala),
                escapeCsvCell(candidate.regiune),
                escapeCsvCell(categoryNames),
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "lista-candidati.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getAdminName = (adminId: string) => {
        return ADMINI.find(a => a.id === adminId)?.nume || adminId;
    }

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                 <div>
                     <h3 className="text-lg font-bold text-ave-blue">Jurnal de Audit & Export</h3>
                     <p className="text-sm text-gray-500 dark:text-slate-400">Urmăriți modificările și exportați datele competiției.</p>
                 </div>
                 <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <button onClick={exportCandidatesToCsv} className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg"><UserGroupIcon className="w-4 h-4" /><span>Candidați (CSV)</span></button>
                    <button onClick={() => exportData(props.candidates, 'candidati')} className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg"><DownloadIcon className="w-4 h-4" /><span>Candidați (JSON)</span></button>
                    <button onClick={() => exportData(props.assignments, 'evaluari')} className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg"><DownloadIcon className="w-4 h-4" /><span>Evaluări (JSON)</span></button>
                    <button onClick={() => exportData(auditLogs, 'jurnal_audit')} className="flex items-center space-x-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg"><ClipboardDocumentCheckIcon className="w-4 h-4" /><span>Jurnal (JSON)</span></button>
                    <button onClick={exportResultsToCsv} className="flex items-center space-x-2 text-sm font-semibold bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 px-3 py-1.5 rounded-lg"><TableIcon className="w-4 h-4" /><span>Rezultate (CSV)</span></button>
                 </div>
            </div>
             <div className="relative mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Caută în jurnal (acțiune, nume, motiv...)"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
                />
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                <ul className="space-y-3">
                    {filteredLogs.map(log => (
                        <li key={log.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-slate-200">
                                        {log.actiune}
                                        <span className="font-normal text-gray-500 dark:text-slate-400"> de </span> 
                                        {getAdminName(log.adminId)}
                                    </p>
                                    <p className="mt-1 text-gray-600 dark:text-slate-300">{log.detalii.motiv}</p>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">{log.timestamp.toLocaleString('ro-RO')}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                {filteredLogs.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-slate-400">Nicio înregistrare găsită.</p>}
            </div>
        </Card>
    )
}

interface CandidateSummaryModalProps {
    candidate: Candidat;
    onClose: () => void;
    assignments: Assignment[];
    judges: Jurat[];
    stageId: string;
    categories: Category[];
}
const CandidateSummaryModal: React.FC<CandidateSummaryModalProps> = ({ candidate, onClose, assignments, judges, stageId, categories }) => {
    const relevantAssignments = useMemo(() => {
        return assignments.filter(a => a.candidatId === candidate.id && a.etapaId === stageId);
    }, [assignments, candidate.id, stageId]);

    const assignmentsWithDetails = useMemo(() => {
        return relevantAssignments.map(a => {
            const judge = judges.find(j => j.id === a.juratId);
            const category = categories.find(c => c.id === a.categorieId);
            return { ...a, judgeName: judge?.nume || 'N/A', categoryName: category?.nume || 'N/A' };
        }).sort((a,b) => a.categoryName.localeCompare(b.categoryName));
    }, [relevantAssignments, judges, categories]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-ave-dark-blue dark:text-slate-100">{candidate.nume}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{candidate.scoala}</p>
                    </div>
                </header>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    <h4 className="font-semibold text-gray-700 dark:text-slate-200">Evaluări în etapa curentă</h4>
                    {assignmentsWithDetails.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                            {assignmentsWithDetails.map(a => (
                                <li key={a.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-slate-200">{a.judgeName}</p>
                                        <p className="text-xs font-semibold text-ave-blue dark:text-blue-400">{a.categoryName}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            a.status === Status.FINALIZAT ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            a.status === Status.IN_CURS ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                            'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {a.status}
                                        </span>
                                        {a.status === Status.FINALIZAT && (
                                            <p className="font-bold text-lg text-ave-blue w-20 text-right">{a.scorFinal?.toFixed(2)}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-slate-400 py-4">Nicio asignare pentru acest candidat în etapa selectată.</p>
                    )}
                </div>
                <footer className="p-4 border-t dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">Închide</button>
                </footer>
            </div>
        </div>
    );
};

const AdminView: React.FC<AdminViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('config');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'config':
                return <ConfigManagement {...props} />;
            case 'assignments':
                return <AssignmentManagement {...props} />;
            case 'audit':
                return <AuditAndExport {...props} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">Panou de Administrare</h2>
            <div className="border-b border-gray-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('assignments')} className={`${activeTab === 'assignments' ? 'border-ave-blue text-ave-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Asignări & Scoruri
                    </button>
                    <button onClick={() => setActiveTab('config')} className={`${activeTab === 'config' ? 'border-ave-blue text-ave-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Configurare Competiție
                    </button>
                     <button onClick={() => setActiveTab('audit')} className={`${activeTab === 'audit' ? 'border-ave-blue text-ave-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Jurnal de Audit & Export
                    </button>
                </nav>
            </div>
            {renderTabContent()}
        </div>
    );
};


export default AdminView;