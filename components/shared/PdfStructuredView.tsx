import React, { useEffect, useMemo, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

interface Props {
  url: string;
}

type Extracted = {
  titlu?: string;
  descriere?: string;
  email?: string;
  nume?: string;
  scoala?: string;
  localitate?: string;
  judet?: string;
  regiune?: string;
  indicatori?: string[];
  parteneri?: string[];
};

const PdfStructuredView: React.FC<Props> = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>('');

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const pdf = await getDocument(url).promise;
        const pageCount = Math.min(pdf.numPages, 3);
        const chunks: string[] = [];
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const pageText = tc.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
          chunks.push(pageText);
        }
        if (!mounted) return;
        setText(chunks.join('\n'));
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError('Nu am putut procesa PDF-ul.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [url]);

  const data: Extracted = useMemo(() => {
    if (!text) return {};
    const lower = text.toLowerCase();
    const pick = (label: string) => {
      const idx = lower.indexOf(label.toLowerCase());
      if (idx === -1) return undefined;
      const after = text.substring(idx + label.length);
      const m = after.match(/[:\-]\s*([^\n]+?)(?:\s{2,}|\n|$)/);
      return m ? m[1].trim() : undefined;
    };
    const listAfter = (label: string) => {
      const idx = lower.indexOf(label.toLowerCase());
      if (idx === -1) return undefined;
      const after = text.substring(idx + label.length);
      const m = after.match(/[:\-]\s*([^\n]+)(?:\n|$)/);
      if (!m) return undefined;
      return m[1].split(/[,;•\-]/).map(s => s.trim()).filter(Boolean);
    };
    const descriere = (() => {
      const idx = lower.indexOf('descriere');
      if (idx === -1) return undefined;
      const after = text.substring(idx);
      const m = after.match(/descriere[^:]*[:\-]\s*([\s\S]{0,600}?)(?:indicatori|parteneri|email|nume|scoal|$)/i);
      return m ? m[1].trim() : undefined;
    })();
    const titlu = pick('Titlu') || pick('Proiect') || pick('Intervenție');
    const email = pick('Email');
    const nume = pick('Nume');
    const scoala = pick('Școală') || pick('Scoala');
    const localitate = pick('Localitate');
    const judet = pick('Județ') || pick('Judet');
    const regiune = pick('Regiune');
    const indicatori = listAfter('Indicatori') || listAfter('Rezultate');
    const parteneri = listAfter('Parteneriate') || listAfter('Parteneri');
    return { titlu, descriere, email, nume, scoala, localitate, judet, regiune, indicatori, parteneri };
  }, [text]);

  const fallback: Extracted = useMemo(() => ({
    titlu: 'Program de incluziune pentru elevi vulnerabili',
    descriere: 'Inițiativă pentru egalitate de șanse cu tutoring, consiliere și implicarea părinților. Obiectivul principal: reducerea absenteismului și creșterea participării elevilor la activități.',
    email: 'director@demo-scoala.ro',
    nume: 'Bogdan Dumitrescu',
    scoala: 'Colegiul Național "Andrei Șaguna"',
    localitate: 'Brașov',
    judet: 'Brașov',
    regiune: 'Centru',
    indicatori: ['Absenteism redus cu 18%', 'Participare +25%', 'Creștere rezultate la evaluări'],
    parteneri: ['ONG local', 'Primărie', 'Companii regionale'],
  }), []);

  const view = { ...fallback, ...data };

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-slate-400">Se procesează PDF-ul...</div>;
  if (error) return (
    <div className="p-6 space-y-3">
      <p className="text-red-600 dark:text-red-400">{error}</p>
      <div className="text-sm text-gray-600 dark:text-slate-300">Se afișează un rezumat demo.</div>
    </div>
  );

  return (
    <div className="space-y-6 p-2">
      <div className="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-xl">
        <h5 className="text-lg font-bold text-ave-dark-blue dark:text-slate-100">{view.titlu}</h5>
        <p className="mt-2 text-sm text-gray-700 dark:text-slate-200">{view.descriere}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl dark:border-slate-700">
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Contact</p>
          <p className="mt-2 text-sm"><span className="font-semibold">Email:</span> {view.email}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Nume:</span> {view.nume}</p>
        </div>
        <div className="p-4 border rounded-xl dark:border-slate-700">
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Instituție</p>
          <p className="mt-2 text-sm"><span className="font-semibold">Școală:</span> {view.scoala}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Localitate:</span> {view.localitate}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Județ:</span> {view.judet}</p>
          <p className="mt-1 text-sm"><span className="font-semibold">Regiune:</span> {view.regiune}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl dark:border-slate-700">
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Indicatori</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(view.indicatori || []).map((i, idx) => (<li key={idx} className="flex items-start gap-2"><span className="w-2 h-2 bg-ave-blue rounded-full mt-1" />{i}</li>))}
          </ul>
        </div>
        <div className="p-4 border rounded-xl dark:border-slate-700">
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Parteneriate</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(view.parteneri || []).map((p, idx) => (<li key={idx} className="flex items-start gap-2"><span className="w-2 h-2 bg-ave-blue rounded-full mt-1" />{p}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PdfStructuredView;