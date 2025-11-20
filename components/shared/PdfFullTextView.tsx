import React, { useEffect, useMemo, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

interface Props {
  url: string;
}

type PageText = { page: number; lines: string[] };
type Section = { id: string; title?: string; bullets: string[]; kv: { label: string; value: string }[]; paragraphs: string[]; rawLines: string[] };

const PdfFullTextView: React.FC<Props> = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageText[]>([]);
  const [mode, setMode] = useState<'table' | 'structured' | 'raw'>('table');

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const pdf = await getDocument(url).promise;
        const collected: PageText[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const items = tc.items as any[];
          const linesMap: Record<string, { y: number; items: { x: number; str: string }[] }> = {};
          items.forEach(it => {
            const str = 'str' in it ? it.str : '';
            const x = Array.isArray(it.transform) ? it.transform[4] : 0;
            const y = Array.isArray(it.transform) ? it.transform[5] : 0;
            const key = Math.round(y / 2).toString();
            if (!linesMap[key]) linesMap[key] = { y, items: [] };
            linesMap[key].items.push({ x, str });
          });
          const lines = Object.values(linesMap)
            .sort((a, b) => b.y - a.y)
            .map(l => l.items.sort((a, b) => a.x - b.x).map(s => s.str).join(' ').replace(/\s{2,}/g, ' ').trim())
            .filter(txt => txt.length > 0);
          collected.push({ page: i, lines });
        }
        if (!mounted) return;
        setPages(collected);
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

  const totalLines = useMemo(() => pages.reduce((acc, p) => acc + p.lines.length, 0), [pages]);
  const isHeading = (line: string) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    if (/[:：]\s*$/.test(trimmed)) return true; // explicit heading ending with colon
    const startsWithKeywords = /^(descriere|detaliază|detaliaza|obiectiv|obiective|metodologie|plan|activități|activitati|indicatori|rezultate|strategia|comunicare|grup\s*tintă|grup\s*tinta|buget|calendar|concluzii|contact|date|identificare|riscul|obstacol)/i;
    return startsWithKeywords.test(trimmed);
  };
  const isBullet = (line: string) => /^\s*(•|\-|–|\*|\d+[\.\)])\s+/.test(line);
  const kvMatch = (line: string) => {
    const m = line.match(/^\s*([^:–\-]{2,}?)\s*[:–\-]\s*(.+)$/);
    if (!m) return null;
    const label = m[1].trim();
    const value = m[2].trim();
    return { label, value };
  };
  const buildSections = (lines: string[], pageIndex: number): Section[] => {
    const sections: Section[] = [];
    let current: Section = { id: `p${pageIndex}-s0`, bullets: [], kv: [], paragraphs: [], rawLines: [] };
    let count = 0;
    lines.forEach(l => {
      const line = l.replace(/\s{2,}/g, ' ').trim();
      if (line.length === 0) return;
      const kv = kvMatch(line);
      if (isHeading(line)) {
        if (current.title || current.bullets.length || current.kv.length || current.paragraphs.length) sections.push(current);
        count += 1;
        current = { id: `p${pageIndex}-s${count}`, title: line, bullets: [], kv: [], paragraphs: [], rawLines: [] };
      } else if (kv) {
        current.kv.push(kv);
        current.rawLines.push(`${kv.label}: ${kv.value}`);
      } else if (isBullet(line)) {
        const cleaned = line.replace(/^(•|\-|–|\*|\d+[\.\)])\s+/, '');
        current.bullets.push(cleaned);
        current.rawLines.push(`• ${cleaned}`);
      } else {
        if (current.paragraphs.length > 0 && current.paragraphs[current.paragraphs.length - 1].length < 120) {
          current.paragraphs[current.paragraphs.length - 1] = `${current.paragraphs[current.paragraphs.length - 1]} ${line}`.trim();
        } else {
          current.paragraphs.push(line);
        }
        current.rawLines.push(line);
      }
    });
    if (current.title || current.bullets.length || current.kv.length || current.paragraphs.length) sections.push(current);
    return sections;
  };
  const structured = useMemo(() => pages.map((p, idx) => ({ page: p.page, sections: buildSections(p.lines, idx) })), [pages]);

  const allLines = useMemo(() => pages.flatMap(p => p.lines), [pages]);
  const legalRefs = useMemo(() => {
    const rx = /(Legea|Ordin|Hotărâre|HG|OMEN|OMEC|OUG)\s+[^\n]*?\s+(nr\.|numărul)\s*[\d\/.-]+[^\n]*/gi;
    const set = new Set<string>();
    allLines.forEach(l => {
      const m = l.match(rx);
      if (m) m.forEach(item => set.add(item.trim()));
    });
    return Array.from(set);
  }, [allLines]);

  const priority = ['titlu', 'proiect', 'intervenție', 'descriere', 'obiectiv', 'obiective', 'metodologie', 'plan', 'activități', 'indicatori', 'rezultate', 'parteneri', 'parteneriate', 'buget', 'calendar', 'concluzii'];
  const sortSections = (secs: Section[]) => {
    return [...secs].sort((a, b) => {
      const ta = (a.title || '').toLowerCase();
      const tb = (b.title || '').toLowerCase();
      const ia = priority.findIndex(k => ta.includes(k));
      const ib = priority.findIndex(k => tb.includes(k));
      const sa = ia === -1 ? 999 : ia;
      const sb = ib === -1 ? 999 : ib;
      if (sa !== sb) return sa - sb;
      return a.id.localeCompare(b.id);
    });
  };

  const categoriesSpec = [
    { id: 'date', title: 'Date / Identificare', matchers: ['contact', 'instituție', 'institutie', 'date', 'identificare'] },
    { id: 'descriere', title: 'Descriere intervenție', matchers: ['descriere', 'intervenție', 'interventie', 'titlu', 'proiect'] },
    { id: 'obiective', title: 'Obiective', matchers: ['obiectiv', 'obiective'] },
    { id: 'metodologie', title: 'Metodologie / Plan / Activități', matchers: ['metodologie', 'plan', 'activități', 'activitati'] },
    { id: 'indicatori', title: 'Indicatori', matchers: ['indicatori'] },
    { id: 'rezultate', title: 'Rezultate', matchers: ['rezultate'] },
    { id: 'parteneriate', title: 'Parteneriate', matchers: ['parteneri', 'parteneriate'] },
    { id: 'buget', title: 'Buget', matchers: ['buget'] },
    { id: 'calendar', title: 'Calendar', matchers: ['calendar'] },
    { id: 'concluzii', title: 'Concluzii', matchers: ['concluzii'] },
  ];

  const getCategoryIdForSection = (title?: string) => {
    const t = (title || '').toLowerCase();
    const found = categoriesSpec.find(c => c.matchers.some(m => t.includes(m)));
    return found ? found.id : 'altele';
  };

  type Row = { key: string; value: string };
  type CategoryTable = { id: string; title: string; rows: Row[] };

  const buildTables = useMemo(() => {
    const buckets: Record<string, Row[]> = {};
    categoriesSpec.forEach(c => { buckets[c.id] = []; });
    buckets['altele'] = [];

    structured.forEach(p => {
      sortSections(p.sections).forEach(s => {
        const catId = getCategoryIdForSection(s.title);
        const label = s.title ? s.title : 'Secțiune';
        const text = s.rawLines.length > 0
          ? s.rawLines.join(' ')
          : [
              ...s.kv.map(kv => `${kv.label}: ${kv.value}`),
              ...s.paragraphs,
              ...s.bullets.map(b => `• ${b}`)
            ].join(' ');
        buckets[catId].push({ key: label, value: text });
      });
    });

    if (legalRefs.length > 0) {
      buckets['referinte'] = legalRefs.map((r, i) => ({ key: `Referință ${i + 1}`, value: r }));
    }

    const result: CategoryTable[] = [];
    categoriesSpec.forEach(c => {
      if (buckets[c.id] && buckets[c.id].length > 0) result.push({ id: c.id, title: c.title, rows: buckets[c.id] });
    });
    if (buckets['referinte'] && buckets['referinte'].length > 0) result.push({ id: 'referinte', title: 'Referințe juridice', rows: buckets['referinte'] });
    if (buckets['altele'] && buckets['altele'].length > 0) result.push({ id: 'altele', title: 'Alte informații', rows: buckets['altele'] });
    return result;
  }, [structured, legalRefs]);

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-slate-400">Se procesează conținutul PDF-ului...</div>;
  if (error) return <div className="p-6 text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="max-h-[55vh] overflow-y-auto">
      <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-xl mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-700 dark:text-slate-200">Pagini: {pages.length} • Linii: {totalLines}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('table')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${mode === 'table' ? 'bg-ave-blue text-white' : 'bg-white dark:bg-slate-600 border dark:border-slate-500'}`}>Tabel</button>
          <button onClick={() => setMode('structured')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${mode === 'structured' ? 'bg-ave-blue text-white' : 'bg-white dark:bg-slate-600 border dark:border-slate-500'}`}>Secțiuni</button>
          <button onClick={() => setMode('raw')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${mode === 'raw' ? 'bg-ave-blue text-white' : 'bg-white dark:bg-slate-600 border dark:border-slate-500'}`}>Brut</button>
        </div>
      </div>
      {mode === 'raw' ? (
        <div className="space-y-8">
          {pages.map(p => (
            <section key={p.page} aria-label={`Pagina ${p.page}`}>
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-1 border-b dark:border-slate-700">
                <h6 className="text-xs font-semibold text-gray-500 dark:text-slate-400">Pagina {p.page}</h6>
              </div>
              <article className="prose max-w-none dark:prose-invert">
                {p.lines.map((line, idx) => (
                  <p key={idx} className="text-sm leading-7 text-gray-800 dark:text-slate-100">{line}</p>
                ))}
              </article>
            </section>
          ))}
        </div>
      ) : mode === 'structured' ? (
        <div className="space-y-8">
          {(structured.some(p => p.sections.some(s => s.title)) || legalRefs.length > 0) && (
            <div className="border rounded-xl p-4 dark:border-slate-700">
              {structured.some(p => p.sections.some(s => s.title)) && (
                <div className="mb-4">
                  <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Cuprins</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {structured.flatMap(p => sortSections(p.sections).filter(s => s.title).map(s => (
                      <li key={s.id}><a href={`#${s.id}`} className="text-ave-blue hover:underline">{s.title}</a></li>
                    )))}
                  </ul>
                </div>
              )}
              {legalRefs.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-500 dark:text-slate-400">Referințe juridice identificate</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {legalRefs.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="w-2 h-2 bg-ave-blue rounded-full mt-1" />{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {structured.map(p => (
            <section key={p.page} aria-label={`Pagina ${p.page}`}>
              <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-1 border-b dark:border-slate-700">
                <h6 className="text-xs font-semibold text-gray-500 dark:text-slate-400">Pagina {p.page}</h6>
              </div>
              <div className="space-y-6">
                {sortSections(p.sections).map((s, idx) => (
                  <div key={idx} id={s.id} className="border rounded-xl p-4 dark:border-slate-700">
                    {s.title && <h5 className="text-base font-bold text-ave-dark-blue dark:text-slate-100">{s.title}</h5>}
                    {s.kv.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                        {s.kv.map((kv, i) => (
                          <p key={i} className="text-sm"><span className="font-semibold">{kv.label}:</span> {kv.value}</p>
                        ))}
                      </div>
                    )}
                    {s.bullets.length > 0 && (
                      <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                        {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                    {s.paragraphs.length > 0 && (
                      <div className="prose max-w-none dark:prose-invert mt-3">
                        {s.paragraphs.map((par, i) => (
                          <p key={i} className="text-sm leading-7 text-gray-800 dark:text-slate-100">{par}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {buildTables.map(cat => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <div className="flex items-center justify-between mb-2">
                <h5 id={`cat-${cat.id}`} className="text-base font-bold text-ave-dark-blue dark:text-slate-100">{cat.title}</h5>
              </div>
              <div className="overflow-x-auto bg-white dark:bg-slate-800 border rounded-xl dark:border-slate-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-slate-700/80">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Element</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Conținut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row, idx) => (
                      <tr key={idx} className="border-t last:border-b dark:border-slate-700">
                        <td className="py-2 px-3 font-semibold text-gray-700 dark:text-slate-300 align-top">{row.key}</td>
                        <td className="py-2 px-3 text-gray-800 dark:text-slate-100 whitespace-pre-wrap">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfFullTextView;