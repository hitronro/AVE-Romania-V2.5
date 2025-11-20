import React, { useMemo, useState, useEffect } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { Assignment, Candidat, Category, Jurat, Status, Criterion } from '../../types';
import { XMarkIcon } from './icons';
import FullTextView from './PdfFullTextView';
import AveFormView from './PdfAveFormView';
import Thumbnails from './PdfThumbnails';

interface Props {
  open: boolean;
  candidate: Candidat;
  assignment: Assignment;
  category?: Category;
  currentJudge: Jurat;
  criteria: Criterion[];
  onClose: () => void;
  onUpdateAssignment: (updated: Assignment) => void;
}

const CRITERIA_DEMO = [
  { id: 'impact', label: 'Impact asupra elevilor și comunității', helper: 'Evaluează rezultatele și beneficiile vizibile.' },
  { id: 'egalitate', label: 'Egalitate de șanse și incluziune', helper: 'Măsoară accesul echitabil și sprijinul pentru grupuri vulnerabile.' },
  { id: 'inovare', label: 'Inovare și creativitate', helper: 'Gradul de noutate și originalitate al intervenției.' },
  { id: 'management', label: 'Managementul resurselor', helper: 'Eficiența utilizării resurselor umane și materiale.' },
  { id: 'sustenabilitate', label: 'Sustenabilitate și scalabilitate', helper: 'Durabilitatea și potențialul de replicare/extindere.' },
];

const pdfUrl = new URL('../../Documents/candidat_366.pdf', import.meta.url).href;

const CandidateEvaluationModal: React.FC<Props> = ({ open, candidate, assignment, category, currentJudge, criteria, onClose, onUpdateAssignment }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'images' | 'pdf'>('text');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [commentsIntern, setCommentsIntern] = useState<string>('Analiză preliminară: proiectul prezintă rezultate solide în prevenirea abandonului și implicarea comunității.');
  const [feedbackCandidat, setFeedbackCandidat] = useState<string>('Felicitări pentru efortul depus. Recomand clarificarea indicatorilor de impact și planul de scalare.');
  const [dynamicCriteria, setDynamicCriteria] = useState<{ id: string; label: string; helper: string }[]>(CRITERIA_DEMO);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasAny = Object.values(scores).some(v => typeof v === 'number');
    if (hasAny && assignment.status === Status.NEINCEPUT) {
      onUpdateAssignment({ ...assignment, status: Status.IN_CURS, lastModified: new Date() });
    }
  }, [scores, assignment, onUpdateAssignment]);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let mounted = true;
    const run = async () => {
      try {
        const pdf = await getDocument(pdfUrl).promise;
        const collected: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const pageText = (tc.items as any[]).map(it => ('str' in it ? it.str : '')).join(' ');
          collected.push(pageText);
        }
        if (!mounted) return;
        const fullText = collected.join('\n').replace(/\s{2,}/g, ' ');
        const derive = (txt: string) => {
          const has = (rx: RegExp) => rx.test(txt);
          const snippet = (rx: RegExp) => {
            const m = txt.match(rx);
            if (!m) return '';
            const idx = m.index ?? 0;
            return txt.slice(idx, idx + 300).replace(/\s{2,}/g, ' ').trim();
          };
          const derived: { id: string; label: string; helper: string }[] = [];
          if (has(/indicatori\s+pentru\s+a\s+m[ăa]sura|evolu[țt]ia\s+acestora/i)) {
            derived.push({ id: 'impact', label: 'Impact asupra elevilor și comunității', helper: `Indicatori: ${snippet(/indicatori/i)}` });
          }
          if (has(/grupul\s+țint[ăa]|vulnerabilit[ăa]ți/i)) {
            derived.push({ id: 'egalitate', label: 'Egalitate de șanse și incluziune', helper: `Grup țintă și vulnerabilități: ${snippet(/grupul\s+țint[ăa]|vulnerabilit[ăa]ți/i)}` });
          }
          if (has(/procedurile\s+de\s+lucru|modificat(\s|\b)|limit[ăa]ri|inechit[ăa]ți|solu[țt]ia\s+propus[ăa]/i)) {
            derived.push({ id: 'inovare', label: 'Inovare și creativitate', helper: `Schimbări/Proceduri/Limitări: ${snippet(/procedurile|limit[ăa]ri|solu[țt]ia/i)}` });
          }
          if (has(/gestionarea\s+resurselor|alocare\s+a\s+bugetului|personalului|infrastructurii/i)) {
            derived.push({ id: 'management', label: 'Managementul resurselor', helper: `Resurse și alocare: ${snippet(/resurse|buget|personalului|infrastructurii/i)}` });
          }
          if (has(/strategia\s+de\s+comunicare|p[ăa]r[țt]ile\s+interesate/i)) {
            derived.push({ id: 'comunicare', label: 'Strategia de comunicare', helper: `Comunicare: ${snippet(/strategia\s+de\s+comunicare|p[ăa]r[țt]ile\s+interesate/i)}` });
          }
          if (has(/riscul\s+major|obstacolul\s+care\s+a\s+necesitat/i)) {
            derived.push({ id: 'risc', label: 'Gestionarea riscurilor', helper: `Risc/obstacole: ${snippet(/riscul\s+major|obstacolul/i)}` });
          }
          if (has(/alocare\s+de\s+buget|buget\s*[:]/i)) {
            derived.push({ id: 'buget', label: 'Buget și eficiență', helper: `Buget: ${snippet(/buget/i)}` });
          }
          return derived.length > 0 ? derived : CRITERIA_DEMO;
        };
        setDynamicCriteria(derive(fullText));
      } catch (e) {
        setDynamicCriteria(CRITERIA_DEMO);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const relevantCriteria = useMemo(() => {
    return (Array.isArray(criteria)) ? criteria.filter(c => c.etapaId === assignment.etapaId && c.categorieId === assignment.categorieId) : [];
  }, [criteria, assignment.etapaId, assignment.categorieId]);

  const helpersById = useMemo(() => {
    const map: Record<string, string> = {};
    dynamicCriteria.forEach(dc => { map[dc.id] = dc.helper; });
    return map;
  }, [dynamicCriteria]);

  const finalAverage = useMemo(() => {
    if (!relevantCriteria || relevantCriteria.length === 0) {
      const values = Object.values(scores).filter(v => typeof v === 'number');
      if (values.length === 0) return 0;
      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    }
    const totalWeight = relevantCriteria.reduce((acc, c) => acc + (scores[c.id] !== undefined ? c.pondere : 0), 0);
    if (totalWeight === 0) return 0;
    return relevantCriteria.reduce((acc, c) => acc + ((scores[c.id] ?? 0) * c.pondere), 0);
  }, [scores, relevantCriteria]);

  const gallery = useMemo(() => {
    const base = candidate.pozaUrl || 'https://picsum.photos';
    return [
      base,
      'https://picsum.photos/seed/ave1/800/600',
      'https://picsum.photos/seed/ave2/800/600',
      'https://picsum.photos/seed/ave3/800/600',
      'https://picsum.photos/seed/ave4/800/600',
      'https://picsum.photos/seed/ave5/800/600',
    ];
  }, [candidate.pozaUrl]);

  const handleScore = (id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveDraft = () => {
    const updated: Assignment = { ...assignment, status: Status.IN_CURS, scorFinal: finalAverage, lastModified: new Date() };
    onUpdateAssignment(updated);
  };

  const handleSubmitFinal = () => {
    const updated: Assignment = { ...assignment, status: Status.FINALIZAT, scorFinal: finalAverage, lastModified: new Date() };
    onUpdateAssignment(updated);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-start justify-center p-0 sm:p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-6xl h-[92vh] sm:max-h-[90vh] bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <img src={candidate.pozaUrl} alt={candidate.nume} className="w-14 h-14 rounded-full object-cover" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-ave-dark-blue dark:text-slate-100 truncate">Evaluare candidat – Directorul Anului pentru Egalitate de Șanse</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{candidate.nume} • {candidate.scoala} • {category?.nume || 'Categorie'} • {candidate.regiune}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Jurizat de: {currentJudge.nume}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${assignment.status === Status.FINALIZAT ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : assignment.status === Status.IN_CURS ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>{assignment.status}</span>
              <button onClick={onClose} aria-label="Închide evaluarea" className="p-2 rounded-md text-gray-600 dark:text-slate-300"><XMarkIcon className="w-6 h-6" /></button>
            </div>
          </div>
        </header>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
          <div className="border-r dark:border-slate-700 flex flex-col min-h-0">
            <div className="p-4 border-b dark:border-slate-700 sticky top-0 z-10 bg-white dark:bg-slate-800">
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-full sm:hidden" />
              <h4 className="text-base font-bold text-ave-dark-blue dark:text-slate-100">Lucrarea candidatului</h4>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setActiveTab('text')} className={`px-3 py-1.5 text-sm rounded-md font-semibold ${activeTab === 'text' ? 'bg-ave-blue text-white' : 'bg-gray-100 dark:bg-slate-700 text-ave-dark-blue dark:text-slate-100'}`}>Text complet</button>
                <button onClick={() => setActiveTab('images')} className={`px-3 py-1.5 text-sm rounded-md font-semibold ${activeTab === 'images' ? 'bg-ave-blue text-white' : 'bg-gray-100 dark:bg-slate-700 text-ave-dark-blue dark:text-slate-100'}`}>Imagini</button>
                <button onClick={() => setActiveTab('pdf')} className={`px-3 py-1.5 text-sm rounded-md font-semibold ${activeTab === 'pdf' ? 'bg-ave-blue text-white' : 'bg-gray-100 dark:bg-slate-700 text-ave-dark-blue dark:text-slate-100'}`}>PDF</button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto min-h-0">
              <div className="p-4 space-y-4">
                {activeTab === 'text' && (
                  <div className="border rounded-none sm:rounded-lg">
                    <AveFormView url={pdfUrl} />
                  </div>
                )}
                {activeTab === 'images' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {gallery.slice(0, 12).map((src, idx) => (
                        <button key={idx} onClick={() => setLightboxIndex(idx)} className="block">
                          <img src={src} alt={`Img ${idx + 1}`} className="w-full h-24 object-cover rounded-md" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'pdf' && (
                  <>
                    <div className="h-[55vh] w-full border rounded-lg overflow-hidden">
                      <iframe src={pdfUrl} title="Lucrare candidat" className="w-full h-full border-0" />
                    </div>
                    <div className="mt-3">
                      <Thumbnails url={pdfUrl} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <a href={pdfUrl} download className="px-3 py-2 text-sm font-semibold bg-gray-100 dark:bg-slate-700 rounded-lg text-ave-dark-blue dark:text-slate-100">Descarcă PDF</a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <div className="p-4 border-b dark:border-slate-700">
              <h4 className="text-base font-bold text-ave-dark-blue dark:text-slate-100">Grilă de evaluare</h4>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
              {(relevantCriteria.length > 0 ? relevantCriteria : dynamicCriteria).map(c => (
                <div key={c.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">{'nume' in c ? c.nume : c.label}{'pondere' in c && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ave-blue/10 text-ave-blue">{Math.round(c.pondere * 100)}%</span>}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{'descriere' in c && c.descriere ? c.descriere : helpersById[c.id]}</p>
                    </div>
                    <div className="text-ave-blue font-bold text-xl w-16 text-right">{scores[c.id] ?? 0}</div>
                  </div>
                  <input
                    aria-describedby={`help-${c.id}`}
                    type="range"
                    min={'scorMin' in c ? c.scorMin : 1}
                    max={'scorMax' in c ? c.scorMax : 10}
                    value={scores[c.id] ?? ('scorMin' in c ? c.scorMin : 0)}
                    onChange={e => {
                      const raw = parseInt(e.target.value, 10);
                      const min = 'scorMin' in c ? c.scorMin : 1;
                      const max = 'scorMax' in c ? c.scorMax : 10;
                      const val = isNaN(raw) ? min : Math.max(min, Math.min(max, raw));
                      setScores(prev => ({ ...prev, [c.id]: val }));
                      setErrors(prev => ({ ...prev, [c.id]: val < min || val > max ? `Valoarea trebuie între ${min} și ${max}.` : '' }));
                    }}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600 accent-ave-blue"
                  />
                  <div id={`help-${c.id}`} className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">Interval permis: {'scorMin' in c ? c.scorMin : 1}–{'scorMax' in c ? c.scorMax : 10}</span>
                    {errors[c.id] && <span className="text-[11px] text-red-600 dark:text-red-400">{errors[c.id]}</span>}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-400">Scor final:</span>
                <p className="text-3xl font-extrabold text-ave-blue">{finalAverage.toFixed(1)} / 10</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-slate-200 mb-2">Comentarii pentru juriu (intern)</p>
                <textarea rows={4} value={commentsIntern} onChange={e => setCommentsIntern(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-slate-200 mb-2">Feedback pentru candidat (opțional)</p>
                <textarea rows={3} value={feedbackCandidat} onChange={e => setFeedbackCandidat(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" />
              </div>
            </div>
            <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row gap-3 justify-end">
              <button onClick={handleSaveDraft} className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-gray-300 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Salvează draft</button>
              <button onClick={handleSubmitFinal} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-ave-blue hover:bg-ave-dark-blue">Trimite scorul final</button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold border dark:border-slate-600">Înapoi la lista de candidați</button>
            </div>
          </div>
        </div>

        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxIndex(null)}>
            <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={gallery[lightboxIndex]} alt="Preview" className="w-full h-auto rounded-lg" />
              <div className="mt-3 flex items-center justify-between">
                <button onClick={() => setLightboxIndex(i => (i !== null ? Math.max(0, i - 1) : 0))} className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-sm">Prev</button>
                <button onClick={() => setLightboxIndex(null)} className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-sm">Închide</button>
                <button onClick={() => setLightboxIndex(i => (i !== null ? Math.min(gallery.length - 1, i + 1) : 0))} className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-slate-700 text-sm">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateEvaluationModal;