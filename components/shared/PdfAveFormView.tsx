import React, { useEffect, useMemo, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

interface Props {
  url: string;
}

type AveFieldId = 'date_generale' | 'unitate' | 'statistici' | 'referinte_personale' | 'proceduri' | 'limitari' | 'grup_tinta' | 'resurse' | 'comunicare' | 'risc' | 'indicatori' | 'buget' | 'alte';

type AveField = { id: AveFieldId; title: string; patterns: RegExp[] };

const AVE_FIELDS: AveField[] = [
  { id: 'date_generale', title: 'A. Date generale', patterns: [/^A\.?\s*date\s+generale/i, /^date\s+generale/i] },
  { id: 'unitate', title: 'B. Date despre unitatea de învățământ', patterns: [/^B\.?\s*date\s+despre\s+unitatea/i, /date\s+despre\s+unitatea\s+de\s+învățământ/i] },
  { id: 'statistici', title: 'C. Date statistice (ianuarie 2024 – iulie 2025)', patterns: [/^C\.?\s*pentru\s+perioada/i, /pentru\s+perioada\s+ianuarie\s+2024/i] },
  { id: 'referinte_personale', title: 'D. Referințe personale', patterns: [/referințe\s+personale/i, /referinte\s+personale/i] },
  {
    id: 'proceduri',
    title: 'Proceduri de lucru modificate',
    patterns: [/procedurile\s+de\s+lucru\s+curente/i, /modificat\s+în\s+cadrul\s+proiectului|intervenției/i],
  },
  {
    id: 'limitari',
    title: 'Limitări, inechități și soluția propusă',
    patterns: [/principalele\s+limitări|inechități|probleme/i, /idee\s+care\s+a\s+stat\s+la\s+baza\s+schimbării/i, /modul\s+de\s+acțiune\s+a\s+directorului/i],
  },
  {
    id: 'grup_tinta',
    title: 'Grup țintă și vulnerabilități',
    patterns: [/grupul\s+țintă|grupul\s+tinta/i, /vulnerabilități|vulnerabilitati/i],
  },
  {
    id: 'resurse',
    title: 'Gestionarea resurselor (buget, personal, infrastructură)',
    patterns: [/gestionat\s+resursele/i, /alocare\s+a\s+bugetului/i, /gestionarea\s+personalului|voluntarilor/i, /infrastructurii/i],
  },
  {
    id: 'comunicare',
    title: 'Strategia de comunicare',
    patterns: [/strategia\s+de\s+comunicare/i, /comunicarea\s+cu\s+toate\s+părțile\s+interesate/i],
  },
  {
    id: 'risc',
    title: 'Risc major / obstacol și soluție',
    patterns: [/riscul\s+major/i, /obstacolul\s+care\s+a\s+necesitat\s+reorganizare/i],
  },
  {
    id: 'indicatori',
    title: 'Indicatori și evoluția rezultatelor',
    patterns: [/indicatori\s+pentru\s+a\s+măsura|masura\s+impactul/i, /evoluția|evolutia\s+acestora/i],
  },
  {
    id: 'buget',
    title: 'Buget (Da/Nu și detalii)',
    patterns: [/intervenția\s+.*\s+a\s+avut\s+identificată\s+o\s+alocare\s+de\s+buget/i, /buget\s*[:]/i],
  },
];
const findInlinePairs = (line: string, field: AveFieldId): { key: string; value: string }[] => {
  const items: { key: string; value: string }[] = [];
  const src = ' ' + line + ' ';
  type KeyDef = { id: string; label: string; rx: RegExp };
  const KEYS_A: KeyDef[] = [
    { id: 'email', label: 'Email', rx: /\bemail\b/i },
    { id: 'email_confirm', label: 'Confirmare e-mail', rx: /confirmare\s+e-?mail/i },
    { id: 'nume', label: 'Nume', rx: /\bnume\b/i },
    { id: 'prenume', label: 'Prenume', rx: /\bprenume\b/i },
    { id: 'telefon', label: 'Telefon', rx: /\btelefon\b/i },
    { id: 'director_an', label: 'Data funcției (Anul)', rx: /\b\(anul\)\b/i },
    { id: 'director_luna', label: 'Data funcției (Luna)', rx: /\b\(luna\)\b/i },
    { id: 'decizie', label: 'Decizie de numire', rx: /\bdecizie\b/i },
    { id: 'ani_total', label: 'Ani activitate total', rx: /c[aă]ți\s+ani\s+de\s+activitate\s+ai\s+în\s+sistemul/i },
    { id: 'ani_conducere', label: 'Ani activitate conducere', rx: /c[aă]ți\s+ani\s+de\s+activitate\s+de\s+conducere/i },
  ];
  const KEYS_B: KeyDef[] = [
    { id: 'denumire', label: 'Denumirea unității', rx: /denumirea\s+unit[ăa]tii?/i },
    { id: 'adresa', label: 'Adresa unității', rx: /adresa\s+unit[ăa]tii?/i },
    { id: 'website', label: 'Website', rx: /\bwebsite\b/i },
    { id: 'localitate', label: 'Localitatea unității', rx: /localitatea\s+unit[ăa]tii?/i },
    { id: 'judet', label: 'Județul unității', rx: /judetul\s+unit[ăa]tii?/i },
    { id: 'regiune', label: 'Regiunea unității', rx: /regiunea\s+unit[ăa]tii?/i },
    { id: 'personalitate_juridica', label: 'Personalitate juridică', rx: /personalitate\s+juridic[ăa]?/i },
    { id: 'asigura_gimnazial', label: 'Asigură învățământ gimnazial', rx: /învățământ\s+gimnazial|invatamant\s+gimnazial/i },
  ];
  const KEYS = field === 'date_generale' ? KEYS_A : field === 'unitate' ? KEYS_B : [];
  if (KEYS.length === 0) return items;
  const matches: { idx: number; def: KeyDef }[] = [];
  KEYS.forEach(def => {
    const m = src.match(def.rx);
    if (m && m.index !== undefined) matches.push({ idx: m.index, def });
  });
  matches.sort((a, b) => a.idx - b.idx);
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].idx + (src.slice(matches[i].idx).match(matches[i].def.rx)?.[0].length || 0);
    const end = i + 1 < matches.length ? matches[i + 1].idx : src.length;
    const value = src.slice(start, end).replace(/\s{2,}/g, ' ').trim();
    if (value) items.push({ key: matches[i].def.label, value });
  }
  return items;
};

const PdfAveFormView: React.FC<Props> = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compact, setCompact] = useState<boolean>(false);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const pdf = await getDocument(url).promise;
        const collected: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          const items = (tc.items as any[]).filter(it => 'str' in it);
          const glyphs = items.map(it => ({
            str: it.str as string,
            x: Array.isArray(it.transform) ? it.transform[4] : (it.x ?? 0),
            y: Array.isArray(it.transform) ? it.transform[5] : (it.y ?? 0),
          }));
          glyphs.sort((a, b) => b.y - a.y || a.x - b.x);
          const linesPage: { y: number; parts: { x: number; str: string }[] }[] = [];
          const yTol = 2;
          for (const g of glyphs) {
            let line = linesPage.find(l => Math.abs(l.y - g.y) <= yTol);
            if (!line) { line = { y: g.y, parts: [] }; linesPage.push(line); }
            line.parts.push({ x: g.x, str: g.str });
          }
          const pageLines = linesPage
            .sort((a, b) => b.y - a.y)
            .map(l => l.parts.sort((p1, p2) => p1.x - p2.x).map(p => p.str).join(' '))
            .map(l => l.replace(/\s{2,}/g, ' ').trim())
            .filter(Boolean);
          collected.push(...pageLines);
        }
        const initialLines = collected
          .map(l => l.replace(/\s{2,}/g, ' ').trim())
          .filter(Boolean);
        const expanded = initialLines.flatMap(l => {
          if (/•|\s[-–—]\s/.test(l) && !/:/.test(l)) {
            const parts = l.split(/(?:^|\s)[•\-–—]\s+/).map(p => p.trim()).filter(Boolean);
            if (parts.length > 1) return parts;
          }
          return [l];
        });
        let filtered = expanded.filter(l => {
          if (/fișiere\s+deja\s+încărcate|fisier(e)?\s+deja\s+incarcate/i.test(l)) return false;
          if (/fișiere\s+încărcate|fisiere\s+incarcate|fișiere\s+neîncărcate|fisiere\s+neincarcate/i.test(l)) return false;
          if (/reguli\s+de\s+încărcare\s+fișiere|reguli\s+de\s+incarcare\s+fisiere/i.test(l)) return false;
          if (/încarcă\s+grafice|fotografii|testimoniale|video/i.test(l)) return false;
          if (/\.(jpg|jpeg|png|gif|mp4|avi|mov|pdf)$/i.test(l)) return false;
          if (/\bfi[șs]ier(e)?\s*[-–—]\s*\d+/i.test(l)) return false;
          return true;
        });
        filtered = filtered
          .map(l => l
            .replace(/\b[\w-]+\.(jpg|jpeg|png|gif|mp4|avi|mov|pdf)\b/ig, '')
            .replace(/\bfi[șs]ier(e)?\s*[-–—]\s*\d+\b/ig, '')
            .replace(/\s{2,}/g, ' ').trim()
          )
          .filter(Boolean);
        if (!mounted) return;
        setLines(filtered);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError('Nu am putut procesa PDF-ul.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [url]);

  const sections = useMemo(() => {
    const kvByField: Record<AveFieldId, { key: string; value: string }[]> = {
      date_generale: [],
      unitate: [],
      statistici: [],
      referinte_personale: [],
      proceduri: [],
      limitari: [],
      grup_tinta: [],
      resurse: [],
      comunicare: [],
      risc: [],
      indicatori: [],
      buget: [],
      alte: [],
    };

    const narratives: Record<AveFieldId, string[]> = {
      date_generale: [],
      unitate: [],
      statistici: [],
      referinte_personale: [],
      proceduri: [],
      limitari: [],
      grup_tinta: [],
      resurse: [],
      comunicare: [],
      risc: [],
      indicatori: [],
      buget: [],
      alte: [],
    };

    type Person = { nume: string; rol: string; functie: string; email: string; telefon: string };
    const people: Person[] = [];

    const isFieldStart = (line: string): AveField | null => {
      for (const f of AVE_FIELDS) {
        if (f.patterns.some(rx => rx.test(line))) return f;
      }
      return null;
    };

    const pairRegex = /(\b[^:]+?)\s*:\s*([^:]+?)(?=\s+\b[^:]+?\s*:\s*|$)/g;
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const phoneRegex = /(\+?\d[\d\s]{6,})/;
    const personRegex = /^(.+?)\s+(subordonat[ăa]?|nesubordonat[ăa]?)\s+(.+?)\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\s+(\+?\d[\d\s]{6,})$/i;

    let current: AveFieldId = 'alte';

    lines.forEach(line => {
      if (/^\s*Întrebare\s+Răspuns/i.test(line)) return;
      const start = isFieldStart(line);
      if (start) { current = start.id; return; }

      if (/date\s+generale/i.test(line)) { current = 'date_generale'; return; }
      if (/date\s+despre\s+unitatea/i.test(line)) { current = 'unitate'; return; }
      if (/pentru\s+perioada\s+ianuarie\s+2024/i.test(line)) { current = 'statistici'; return; }
      if (/referințe\s+personale|referinte\s+personale/i.test(line)) { current = 'referinte_personale'; return; }

      if (current === 'referinte_personale') {
        const m = line.match(personRegex);
        if (m) {
          people.push({ nume: m[1].trim(), rol: m[2].trim(), functie: m[3].trim(), email: m[4].trim(), telefon: m[5].trim() });
          return;
        }
      }

      let matchedPairs = false;
      for (;;) {
        const mm = pairRegex.exec(line);
        if (!mm) break;
        matchedPairs = true;
        const key = mm[1].trim();
        const val = mm[2].trim();
        if (/email|nume|prenume|telefon|data\s+de\s+la\s+care/i.test(key)) kvByField['date_generale'].push({ key, value: val });
        else if (/denumirea\s+unității|adresa\s+unității|website|localitatea\s+unității|județul\s+unității|regiunea\s+unității|asigură/i.test(key)) kvByField['unitate'].push({ key, value: val });
        else if (/^nr\.|numărul|numarul/i.test(key)) kvByField['statistici'].push({ key, value: val });
        else if (/buget/i.test(key)) kvByField['buget'].push({ key, value: val });
        else kvByField[current].push({ key, value: val });
      }

      if (!matchedPairs) {
        if (emailRegex.test(line) || phoneRegex.test(line)) {
          const email = (line.match(emailRegex) || [''])[0];
          const tel = (line.match(phoneRegex) || [''])[0];
          if (email || tel) narratives['date_generale'].push(line);
          else narratives[current].push(line);
        } else {
          const inline = findInlinePairs(line, current);
          if (inline.length > 0) inline.forEach(p => kvByField[current].push(p));
          else narratives[current].push(line);
        }
      }
    });

    if (kvByField['date_generale'].length === 0) {
      lines.forEach(l => {
        const pairs = findInlinePairs(l, 'date_generale');
        if (pairs.length > 0) kvByField['date_generale'].push(...pairs);
      });
    }
    if (kvByField['unitate'].length === 0) {
      lines.forEach(l => {
        const pairs = findInlinePairs(l, 'unitate');
        if (pairs.length > 0) kvByField['unitate'].push(...pairs);
      });
    }

    const result: { id: AveFieldId; title: string; rows?: { key: string; value: string }[]; value?: string; people?: Person[]; subsections?: { title: string; value: string }[] }[] = [];

    const ORDER_A = ['email','email_confirm','nume','prenume','telefon','director_an','director_luna','decizie','ani_total','ani_conducere'];
    const ORDER_B = ['denumire','adresa','website','localitate','judet','regiune','personalitate_juridica','asigura_prescolar','asigura_primar','asigura_secundar','asigura_gimnazial','asigura_liceal_teoretic','asigura_liceal_tehnologic','asigura_postliceal','asigura_special','asigura_integrat'];
    const ORDER_C = ['total_elevi','primar','primar_burse','primar_masa','familii_monoparentale','familii_3plus','ces','risc_abandon','abandon','naveta_microbuze','naveta_decont','angajati','cadre_didactice','finalizat_gimnaziu','eval_nat_min5','finalizat_liceu','bac_min5'];

    const normalizeGeneralKey = (k: string) => {
      const key = k.toLowerCase();
      if (/email/.test(key)) return { id: 'email', label: 'Email' };
      if (/confirmare\s+e-?mail/.test(key)) return { id: 'email_confirm', label: 'Confirmare e-mail' };
      if (/^nume(\b|\s)/.test(key)) return { id: 'nume', label: 'Nume' };
      if (/prenume/.test(key)) return { id: 'prenume', label: 'Prenume' };
      if (/telefon/.test(key)) return { id: 'telefon', label: 'Telefon' };
      if (/\(anul\)/.test(key)) return { id: 'director_an', label: 'Data funcției (Anul)' };
      if (/\(luna\)/.test(key)) return { id: 'director_luna', label: 'Data funcției (Luna)' };
      if (/decizie/.test(key)) return { id: 'decizie', label: 'Decizie de numire' };
      if (/ani\s+activitate\s+total/.test(key) || /c[aă]ți\s+ani\s+de\s+activitate\s+ai\s+în\s+sistemul/.test(key)) return { id: 'ani_total', label: 'Ani activitate total' };
      if (/ani\s+activitate\s+de\s+conducere/.test(key) || /c[aă]ți\s+ani\s+de\s+activitate\s+de\s+conducere/.test(key)) return { id: 'ani_conducere', label: 'Ani activitate conducere' };
      return { id: key, label: k };
    };

    const normalizeUnitKey = (k: string) => {
      const key = k.toLowerCase();
      if (/denumirea\s+unității|denumirea\s+unitatii/.test(key)) return { id: 'denumire', label: 'Denumirea unității' };
      if (/adresa\s+unității|adresa\s+unitatii/.test(key)) return { id: 'adresa', label: 'Adresa unității' };
      if (/website/.test(key)) return { id: 'website', label: 'Website' };
      if (/localitatea\s+unității|localitatea\s+unitatii/.test(key)) return { id: 'localitate', label: 'Localitatea unității' };
      if (/județul\s+unității|judetul\s+unitatii/.test(key)) return { id: 'judet', label: 'Județul unității' };
      if (/regiunea\s+unității|regiunea\s+unitatii/.test(key)) return { id: 'regiune', label: 'Regiunea unității' };
      if (/personalitate\s+juridic[ăa]?/.test(key)) return { id: 'personalitate_juridica', label: 'Personalitate juridică' };
      if (/invatamant\s+prescolar|învățământ\s+preșcolar/.test(key)) return { id: 'asigura_prescolar', label: 'Asigură învățământ preșcolar' };
      if (/invatamant\s+primar|învățământ\s+primar/.test(key)) return { id: 'asigura_primar', label: 'Asigură învățământ primar' };
      if (/invatamant\s+secundar|învățământ\s+secundar/.test(key)) return { id: 'asigura_secundar', label: 'Asigură învățământ secundar' };
      if (/învățământ\s+gimnazial|invatamant\s+gimnazial/.test(key)) return { id: 'asigura_gimnazial', label: 'Asigură învățământ gimnazial' };
      if (/liceal\s+teoretic/.test(key)) return { id: 'asigura_liceal_teoretic', label: 'Asigură liceal teoretic' };
      if (/liceal\s+tehnologic|profesional/.test(key)) return { id: 'asigura_liceal_tehnologic', label: 'Asigură liceal tehnologic/profesional' };
      if (/postliceal/.test(key)) return { id: 'asigura_postliceal', label: 'Asigură postliceal' };
      if (/invatamant\s+special|învățământ\s+special/.test(key)) return { id: 'asigura_special', label: 'Asigură învățământ special' };
      if (/invatamant\s+integrat|învățământ\s+integrat/.test(key)) return { id: 'asigura_integrat', label: 'Asigură învățământ integrat' };
      return { id: key, label: k };
    };

    const normalizeStatKey = (k: string) => {
      const key = k.toLowerCase();
      if (/nr\.?\s*total\s+al\s+elevilor/.test(key)) return { id: 'total_elevi', label: 'Nr. total elevi înmatriculați' };
      if (/nr\.?\s*elevi\s+învățământ\s+primar(?!.*burse|mas[aă])|nr\.?\s*elevi\s+invatamant\s+primar(?!.*burse|mas[aă])/.test(key)) return { id: 'primar', label: 'Nr. elevi învățământ primar' };
      if (/nr\.?\s*elevi.*burse\s+sociale/.test(key)) return { id: 'primar_burse', label: 'Nr. elevi burse sociale (primar)' };
      if (/nr\.?\s*elevi.*mas[aă]\s+(sănătoasă|caldă)/.test(key)) return { id: 'primar_masa', label: 'Nr. elevi „Masă sănătoasă/caldă” (primar)' };
      if (/familii\s+monoparentale/.test(key)) return { id: 'familii_monoparentale', label: 'Nr. elevi familii monoparentale' };
      if (/3\s+sau\s+mai\s+mulți|3\s+sau\s+mai\s+multi/.test(key)) return { id: 'familii_3plus', label: 'Nr. elevi familii cu 3+ copii' };
      if (/ces\s*\(|cerințe|cerinte\s+educaționale\s+speciale/.test(key)) return { id: 'ces', label: 'Nr. elevi CES integrați' };
      if (/risc\s+de\s+abandon/.test(key)) return { id: 'risc_abandon', label: 'Nr. elevi în risc de abandon' };
      if (/au\s+abandonat\s+școala|au\s+abandonat\s+scoala/.test(key)) return { id: 'abandon', label: 'Nr. elevi care au abandonat' };
      if (/microbuzele\s+școlare|microbuzele\s+scolare/.test(key)) return { id: 'naveta_microbuze', label: 'Nr. elevi cu naveta (microbuze)' };
      if (/decontează\s+naveta|deconteaza\s+naveta/.test(key)) return { id: 'naveta_decont', label: 'Nr. elevi cu naveta decontată' };
      if (/nr\.?\s*angajați|nr\.?\s*angajati/.test(key)) return { id: 'angajati', label: 'Nr. angajați unitate' };
      if (/nr\.?\s*cadre\s+didactice/.test(key)) return { id: 'cadre_didactice', label: 'Nr. cadre didactice' };
      if (/finalizat\s+studiile\s+gimnaziale/.test(key)) return { id: 'finalizat_gimnaziu', label: 'Nr. elevi finalizat gimnaziu' };
      if (/media\s*5.*evaluarea\s+națională|media\s*5.*evaluarea\s+nationala/.test(key)) return { id: 'eval_nat_min5', label: 'Nr. elevi ≥ 5 la Evaluarea Națională' };
      if (/finalizat\s+studiile\s+liceale/.test(key)) return { id: 'finalizat_liceu', label: 'Nr. elevi finalizat liceu' };
      if (/media\s*5.*examenul/.test(key)) return { id: 'bac_min5', label: 'Nr. elevi ≥ 5 la examen' };
      return { id: key, label: k };
    };
    const ordered: AveFieldId[] = ['date_generale', 'unitate', 'statistici', 'referinte_personale'];
    const subsOrder: AveFieldId[] = ['proceduri','limitari','grup_tinta','resurse','comunicare','risc','indicatori','buget'] as any;
    const subsections: { title: string; value: string }[] = subsOrder.map((fid: any) => {
      const title = AVE_FIELDS.find(f => f.id === fid)?.title || '';
      const text = narratives[fid]?.join(' ') || '';
      return text.trim().length > 0 ? { title, value: text } : null;
    }).filter(Boolean) as { title: string; value: string }[];
    ordered.forEach(fid => {
      const field = AVE_FIELDS.find(f => f.id === fid);
      const title = field ? field.title : 'Alte informații';
      const kv = kvByField[fid];
      const text = narratives[fid].join(' ');
      if (fid === 'referinte_personale') {
        if (people.length > 0 || subsections.length > 0 || text.trim().length > 0) {
          result.push({ id: fid, title, people: people.length > 0 ? people : undefined, subsections: subsections.length > 0 ? subsections : undefined, value: text.trim().length > 0 ? text : undefined });
        }
      } else if (kv.length > 0 || text.trim().length > 0) {
        let rows = kv.length > 0 ? kv : undefined;
        if (rows) {
          const mapped = rows.map(r => {
            if (fid === 'date_generale') {
              const m = normalizeGeneralKey(r.key);
              return { key: m.label, value: r.value, _id: m.id } as any;
            } else if (fid === 'unitate') {
              const m = normalizeUnitKey(r.key);
              const valNorm = /^(da|nu)$/i.test(r.value.trim()) ? r.value.trim().toUpperCase() : r.value;
              return { key: m.label, value: valNorm, _id: m.id } as any;
            } else if (fid === 'statistici') {
              const m = normalizeStatKey(r.key);
              return { key: m.label, value: r.value, _id: m.id } as any;
            }
            return { key: r.key, value: r.value, _id: r.key.toLowerCase() } as any;
          });
          const order = fid === 'date_generale' ? ORDER_A : fid === 'unitate' ? ORDER_B : fid === 'statistici' ? ORDER_C : [];
          mapped.sort((a: any, b: any) => {
            const ia = order.indexOf(a._id);
            const ib = order.indexOf(b._id);
            if (ia === -1 && ib === -1) return a.key.localeCompare(b.key);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
          });
          rows = mapped.map((x: any) => ({ key: x.key, value: x.value }));
        }
        result.push({ id: fid, title, rows, value: text.trim().length > 0 ? text : undefined });
      }
    });
    return result;
  }, [lines]);

  const kpis = useMemo(() => {
    const findRow = (fid: AveFieldId, keyStarts: RegExp) => {
      const sec = sections.find(s => s.id === fid && s.rows);
      const rows = (sec?.rows || []);
      const r = rows.find(rr => keyStarts.test(rr.key));
      return r ? parseInt((r.value || '0').replace(/[^0-9]/g, ''), 10) || 0 : 0;
    };
    return [
      { label: 'Elevi total', value: findRow('statistici', /nr\.?\s*total\s+al\s+elevilor/i) },
      { label: 'Elevi în risc', value: findRow('statistici', /nr\.?\s+elevi\s+.*\s+risc\s+de\s+abandon/i) },
      { label: 'Elevi CES integrați', value: findRow('statistici', /nr\.?\s+elevi\s+cu\s+ces/i) },
      { label: 'Cadre didactice', value: findRow('statistici', /nr\.?\s+cadre\s+didactice/i) },
    ];
  }, [sections]);

  useEffect(() => {
    if (sections.length > 0) setSelectedId(sections[0].id);
  }, [sections]);

  if (loading) return <div className="p-6 text-center text-gray-500 dark:text-slate-400">Se procesează PDF-ul...</div>;
  if (error) return <div className="p-6 text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <aside className="md:col-span-1">
        {sections.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-slate-300">Nu s-a putut structura conținutul conform rubricilor AVE.</div>
        ) : (
          <div className="sticky top-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-slate-400">Secțiuni</p>
              <button onClick={() => setCompact(v => !v)} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-slate-700 text-ave-dark-blue dark:text-slate-100">{compact ? 'Complet' : 'Compact'}</button>
            </div>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedId(s.id);
                  const el = document.getElementById(`ave-sec-${s.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${selectedId === s.id ? 'bg-ave-blue text-white' : 'bg-gray-100 dark:bg-slate-700 text-ave-dark-blue dark:text-slate-100'}`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </aside>
      <div className="md:col-span-3 max-h-[60vh] overflow-y-auto pr-1" onScroll={(e) => {
        const container = e.currentTarget;
        const ids = sections.map(s => s.id);
        for (const id of ids) {
          const el = document.getElementById(`ave-sec-${id}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const parentRect = container.getBoundingClientRect();
          if (rect.top >= parentRect.top && rect.top <= parentRect.top + parentRect.height / 3) {
            setSelectedId(id);
            break;
          }
        }
      }}>
        {sections.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-slate-300">Se recomandă vizualizarea PDF-ului.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {kpis.map((k, i) => (
                <div key={i} className="p-3 rounded-lg bg-ave-blue/10 text-ave-dark-blue dark:bg-slate-700/50 dark:text-slate-100">
                  <p className="text-xs">{k.label}</p>
                  <p className="text-xl font-bold">{k.value}</p>
                </div>
              ))}
            </div>
            {sections.map(sec => (
              <section id={`ave-sec-${sec.id}`} key={sec.id} className="border rounded-xl p-4 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h5 className="text-base font-bold text-ave-dark-blue dark:text-slate-100">{sec.title}</h5>
                {sec.rows && (
                  <div className="mt-2 overflow-x-auto">
                    <table className={`min-w-full ${compact ? 'text-xs' : 'text-sm'}`}>
                      <thead className="sticky top-0 z-10 bg-white dark:bg-slate-800">
                        <tr className="text-left text-gray-500 dark:text-slate-400">
                          <th className="py-2 pr-4">Întrebare</th>
                          <th className="py-2">Răspuns</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.rows.map((r, i) => (
                          <tr key={i} className={`border-t dark:border-slate-700 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-slate-700/30' : ''}`}>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1 pr-2' : 'py-2 pr-4'}`}>{r.key}</td>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1' : 'py-2'}`}>{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {sec.people && (
                  <div className="mt-2 overflow-x-auto">
                    <table className={`min-w-full ${compact ? 'text-xs' : 'text-sm'}`}>
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-slate-400">
                          <th className="py-2 pr-4">Nume</th>
                          <th className="py-2 pr-4">Rol</th>
                          <th className="py-2 pr-4">Funcție</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2">Telefon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.people.map((p, i) => (
                          <tr key={i} className={`border-t dark:border-slate-700 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-slate-700/30' : ''}`}>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1 pr-2' : 'py-2 pr-4'}`}>{p.nume}</td>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1 pr-2' : 'py-2 pr-4'}`}>{p.rol}</td>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1 pr-2' : 'py-2 pr-4'}`}>{p.functie}</td>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1 pr-2' : 'py-2 pr-4'}`}>{p.email}</td>
                            <td className={`align-top text-gray-800 dark:text-slate-100 ${compact ? 'py-1' : 'py-2'}`}>{p.telefon}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {sec.subsections && sec.subsections.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {sec.subsections.map((sub, idx) => (
                      <div key={idx} className="rounded-lg bg-gray-50 dark:bg-slate-700/30 p-3">
                        <h6 className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} text-ave-dark-blue dark:text-slate-100`}>{sub.title}</h6>
                        <p className={`${compact ? 'text-xs leading-6' : 'text-sm leading-7'} text-gray-800 dark:text-slate-100 whitespace-pre-wrap mt-1`}>{sub.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {sec.value && (
                  <p className={`mt-2 ${compact ? 'text-xs leading-6' : 'text-sm leading-7'} text-gray-800 dark:text-slate-100 whitespace-pre-wrap`}>{sec.value}</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfAveFormView;