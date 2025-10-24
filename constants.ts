import { Jurat, Candidat, Assignment, Status, Regiune, Stage, Category, Criterion, AuditLog, UserRole, Admin, DocumentationContent } from './types';

export const JURATI: Jurat[] = [
  { id: 'j1', nume: 'Elena Popescu', rol: UserRole.JUDGE },
  { id: 'j2', nume: 'Mihai Ionescu', rol: UserRole.JUDGE },
  { id: 'j3', nume: 'Andreea Vasilescu', rol: UserRole.JUDGE },
  { id: 'j4', nume: 'Cristian Stan', rol: UserRole.JUDGE },
];

export const ADMINI: Admin[] = [
    { id: 'a1', nume: 'Admin Principal', rol: UserRole.ADMIN }
]

export const CANDIDATI: Candidat[] = [
  // Categoria Inovare & Antreprenoriat
  { id: 'c1', nume: 'Ana Georgescu', titlu: 'Directorul Anului pentru Inovare', scoala: 'Liceul Teoretic "Ion Creangă"', regiune: Regiune.BUCURESTI_ILFOV, categorieIds: ['cat1', 'cat3'], pozaUrl: 'https://i.pravatar.cc/150?u=c1', promotions: { 'etapa1': true, 'etapa2': true, 'etapa3': true, 'etapa4': true } },
  { id: 'c3', nume: 'Eva Matei', titlu: 'Directorul Anului pentru Inovare', scoala: 'Colegiul Economic "Octav Onicescu"', regiune: Regiune.NORD_EST, categorieIds: ['cat1'], pozaUrl: 'https://i.pravatar.cc/150?u=c3', promotions: { 'etapa1': true, 'etapa2': true } },
  { id: 'c5', nume: 'Carmen Stanciu', titlu: 'Directorul Anului pentru Inovare', scoala: 'Școala Gimnazială "Avram Iancu"', regiune: Regiune.NORD_VEST, categorieIds: ['cat1'], pozaUrl: 'https://i.pravatar.cc/150?u=c5', promotions: {} },

  // Categoria Egalitate de Sanse
  { id: 'c2', nume: 'Bogdan Dumitrescu', titlu: 'Directorul Anului pentru Egalitate de Sanse', scoala: 'Colegiul Național "Andrei Șaguna"', regiune: Regiune.CENTRU, categorieIds: ['cat2'], pozaUrl: 'https://i.pravatar.cc/150?u=c2', promotions: { 'etapa1': true, 'etapa2': true, 'etapa3': true, 'etapa4': true } },
  { id: 'c4', nume: 'David Antonescu', titlu: 'Directorul Anului pentru Egalitate de Sanse', scoala: 'Liceul Tehnologic "Constantin Brâncuși"', regiune: Regiune.SUD_VEST_OLTENIA, categorieIds: ['cat2'], pozaUrl: 'https://i.pravatar.cc/150?u=c4', promotions: { 'etapa1': true, 'etapa2': true, 'etapa3': true } },
  
  // Categoria Antreprenoriat
  { id: 'c6', nume: 'Mihai Popa', titlu: 'Directorul Anului pentru Antreprenoriat', scoala: 'Liceul de Arte "Hariclea Darclée"', regiune: Regiune.SUD_EST, categorieIds: ['cat3'], pozaUrl: 'https://i.pravatar.cc/150?u=c6', promotions: { 'etapa1': true, 'etapa2': true, 'etapa3': true, 'etapa4': true } },
];


export const CATEGORIES: Category[] = [
  { id: 'cat1', nume: 'Directorul Anului pentru Inovare' },
  { id: 'cat2', nume: 'Directorul Anului pentru Egalitate de Sanse' },
  { id: 'cat3', nume: 'Directorul Anului pentru Antreprenoriat' },
];

export const STAGES: Stage[] = [
  { id: 'etapa1', nume: 'Etapa 1 - Validarea înscrierilor', activ: true },
  { id: 'etapa2', nume: 'Etapa 2 - Etapa Preliminară', activ: true },
  { id: 'etapa3', nume: 'Etapa 3 - Jurizarea Regională', activ: true },
  { id: 'etapa4', nume: 'Etapa 4 - Jurizarea Națională', activ: true },
  { id: 'etapa5', nume: 'Etapa 5 - Finala', activ: true },
  { id: 'etapa_finala', nume: 'Clasament Final', activ: true },
];

export const CRITERIA: Criterion[] = [
  // Criterii pentru Etapa Regionala
  { id: 'crit1_reg', etapaId: 'etapa3', categorieId: 'cat1', nume: 'Viziune Strategică Regională', descriere: 'Evaluează capacitatea directorului de a dezvolta și implementa o viziune strategică adaptată contextului regional, luând în considerare specificul și nevoile comunității educaționale locale.', pondere: 0.4, scorMin: 1, scorMax: 100 },
  { id: 'crit2_reg', etapaId: 'etapa3', categorieId: 'cat1', nume: 'Impact Comunitar Local', descriere: 'Măsoară impactul inițiativelor directorului asupra comunității locale, inclusiv parteneriate cu stakeholderi locali, proiecte comunitare și implicarea părinților.', pondere: 0.6, scorMin: 1, scorMax: 100 },
  { id: 'crit3_reg', etapaId: 'etapa3', categorieId: 'cat2', nume: 'Performanță Academică Locală', descriere: 'Evaluează rezultatele academice ale elevilor și progresul școlar, inclusiv rate de promovabilitate și participare la olimpiade.', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit4_reg', etapaId: 'etapa3', categorieId: 'cat2', nume: 'Dezvoltare Profesională Cadre', descriere: 'Analizează strategiile și programele implementate pentru dezvoltarea profesională continuă a cadrelor didactice.', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit5_reg', etapaId: 'etapa3', categorieId: 'cat3', nume: 'Inițiative Antreprenoriale Locale', descriere: 'Evaluează proiectele și inițiativele care promovează spiritul antreprenorial în rândul elevilor și în comunitatea școlară.', pondere: 0.7, scorMin: 1, scorMax: 100 },
  { id: 'crit6_reg', etapaId: 'etapa3', categorieId: 'cat3', nume: 'Parteneriate cu Mediul de Afaceri', descriere: 'Măsoară eficiența și impactul parteneriatelor dezvoltate cu companii și organizații din mediul de afaceri local.', pondere: 0.3, scorMin: 1, scorMax: 100 },
  
  // Criterii pentru Etapa Nationala
  { id: 'crit1_nat', etapaId: 'etapa4', categorieId: 'cat1', nume: 'Inovație la Nivel Național', descriere: 'Evaluează potențialul de scalare și replicare a inovațiilor implementate la nivel național, precum și unicitatea și originalitatea soluțiilor propuse.', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit2_nat', etapaId: 'etapa4', categorieId: 'cat1', nume: 'Sustenabilitate Proiect', descriere: 'Analizează durabilitatea și sustenabilitatea pe termen lung a proiectelor și inițiativelor implementate, inclusiv aspecte financiare și operaționale.', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit3_nat', etapaId: 'etapa4', categorieId: 'cat2', nume: 'Leadership Educațional Național', descriere: 'Evaluează calitatea și impactul leadershipului educațional la nivel național, inclusiv contribuția la dezvoltarea sistemului educațional.', pondere: 0.6, scorMin: 1, scorMax: 100 },
  { id: 'crit4_nat', etapaId: 'etapa4', categorieId: 'cat2', nume: 'Contribuție la Politici Educaționale', descriere: 'Măsoară contribuția la dezvoltarea și implementarea politicilor educaționale la nivel național.', pondere: 0.4, scorMin: 1, scorMax: 100 },
  { id: 'crit5_nat', etapaId: 'etapa4', categorieId: 'cat3', nume: 'Scalabilitate Model Antreprenorial', descriere: 'Evaluează potențialul de scalare și replicare a modelului antreprenorial dezvoltat, precum și adaptabilitatea acestuia în diferite contexte.', pondere: 0.6, scorMin: 1, scorMax: 100 },
  { id: 'crit6_nat', etapaId: 'etapa4', categorieId: 'cat3', nume: 'Impact Economic Național', descriere: 'Analizează impactul economic la nivel național al inițiativelor antreprenoriale implementate.', pondere: 0.4, scorMin: 1, scorMax: 100 },

  // Criterii pentru Etapa Finala
  { id: 'crit1_fin_cat1', etapaId: 'etapa5', categorieId: 'cat1', nume: 'Prezentare Finală', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit2_fin_cat1', etapaId: 'etapa5', categorieId: 'cat1', nume: 'Viziune și Impact Strategic', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit1_fin_cat2', etapaId: 'etapa5', categorieId: 'cat2', nume: 'Prezentare Finală', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit2_fin_cat2', etapaId: 'etapa5', categorieId: 'cat2', nume: 'Viziune și Impact Strategic', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit1_fin_cat3', etapaId: 'etapa5', categorieId: 'cat3', nume: 'Prezentare Finală', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
  { id: 'crit2_fin_cat3', etapaId: 'etapa5', categorieId: 'cat3', nume: 'Viziune și Impact Strategic', descriere: '...', pondere: 0.5, scorMin: 1, scorMax: 100 },
];

export const ASSIGNMENTS: Assignment[] = [
  // ETAPA 3
  { id: 'a1', candidatId: 'c1', juratId: 'j1', etapaId: 'etapa3', categorieId: 'cat1', status: Status.FINALIZAT, scoruri: { 'crit1_reg': 85, 'crit2_reg': 90 }, scorFinal: 88, observatii: {'crit1_reg': 'Foarte bine!'}, lastModified: new Date() },
  { id: 'a2', candidatId: 'c1', juratId: 'j2', etapaId: 'etapa3', categorieId: 'cat1', status: Status.FINALIZAT, scoruri: { 'crit1_reg': 80, 'crit2_reg': 82 }, scorFinal: 81.2, observatii: {}, lastModified: new Date() },
  { id: 'a3', candidatId: 'c2', juratId: 'j1', etapaId: 'etapa3', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_reg': 95, 'crit4_reg': 92 }, scorFinal: 93.5, observatii: {}, lastModified: new Date() },
  { id: 'a4', candidatId: 'c2', juratId: 'j3', etapaId: 'etapa3', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_reg': 92, 'crit4_reg': 88 }, scorFinal: 90, observatii: {}, lastModified: new Date() },
  { id: 'a5', candidatId: 'c3', juratId: 'j2', etapaId: 'etapa3', categorieId: 'cat1', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a6', candidatId: 'c3', juratId: 'j4', etapaId: 'etapa3', categorieId: 'cat1', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a7', candidatId: 'c4', juratId: 'j3', etapaId: 'etapa3', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_reg': 88, 'crit4_reg': 90 }, scorFinal: 89, observatii: {}, lastModified: new Date() },
  { id: 'a8', candidatId: 'c6', juratId: 'j4', etapaId: 'etapa3', categorieId: 'cat3', status: Status.FINALIZAT, scoruri: { 'crit5_reg': 95, 'crit6_reg': 88 }, scorFinal: 92.9, observatii: {}, lastModified: new Date() },
  
  // ETAPA 4 - Nationala
  // Categoria Inovare - Ana Georgescu (câștigător)
  { id: 'a9', candidatId: 'c1', juratId: 'j1', etapaId: 'etapa4', categorieId: 'cat1', status: Status.FINALIZAT, scoruri: { 'crit1_nat': 92, 'crit2_nat': 94 }, scorFinal: 93, observatii: {}, lastModified: new Date() },
  { id: 'a10', candidatId: 'c1', juratId: 'j2', etapaId: 'etapa4', categorieId: 'cat1', status: Status.FINALIZAT, scoruri: { 'crit1_nat': 90, 'crit2_nat': 95 }, scorFinal: 92.5, observatii: {}, lastModified: new Date() },
  
  // Categoria Egalitate de Sanse - Bogdan Dumitrescu (câștigător) vs David Antonescu (locul 2)
  { id: 'a11', candidatId: 'c2', juratId: 'j3', etapaId: 'etapa4', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_nat': 98, 'crit4_nat': 95 }, scorFinal: 96.8, observatii: {}, lastModified: new Date() },
  { id: 'a12', candidatId: 'c2', juratId: 'j4', etapaId: 'etapa4', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_nat': 96, 'crit4_nat': 94 }, scorFinal: 95.2, observatii: {}, lastModified: new Date() },
  { id: 'a13', candidatId: 'c4', juratId: 'j1', etapaId: 'etapa4', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_nat': 94, 'crit4_nat': 92 }, scorFinal: 93.2, observatii: {}, lastModified: new Date() },
  { id: 'a14', candidatId: 'c4', juratId: 'j2', etapaId: 'etapa4', categorieId: 'cat2', status: Status.FINALIZAT, scoruri: { 'crit3_nat': 92, 'crit4_nat': 90 }, scorFinal: 91.2, observatii: {}, lastModified: new Date() },
  
  // Categoria Antreprenoriat - Mihai Popa (câștigător)
  { id: 'a15', candidatId: 'c6', juratId: 'j3', etapaId: 'etapa4', categorieId: 'cat3', status: Status.FINALIZAT, scoruri: { 'crit5_nat': 95, 'crit6_nat': 91 }, scorFinal: 93.4, observatii: {}, lastModified: new Date() },
  { id: 'a16', candidatId: 'c6', juratId: 'j4', etapaId: 'etapa4', categorieId: 'cat3', status: Status.FINALIZAT, scoruri: { 'crit5_nat': 94, 'crit6_nat': 90 }, scorFinal: 92.4, observatii: {}, lastModified: new Date() },
  
  // ETAPA 5 - Finala
  { id: 'a17', candidatId: 'c1', juratId: 'j1', etapaId: 'etapa5', categorieId: 'cat1', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a18', candidatId: 'c1', juratId: 'j2', etapaId: 'etapa5', categorieId: 'cat1', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a19', candidatId: 'c2', juratId: 'j3', etapaId: 'etapa5', categorieId: 'cat2', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a20', candidatId: 'c2', juratId: 'j4', etapaId: 'etapa5', categorieId: 'cat2', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a21', candidatId: 'c6', juratId: 'j1', etapaId: 'etapa5', categorieId: 'cat3', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
  { id: 'a22', candidatId: 'c6', juratId: 'j4', etapaId: 'etapa5', categorieId: 'cat3', status: Status.NEINCEPUT, scoruri: {}, observatii: {}, lastModified: new Date() },
];


export const AUDIT_LOGS: AuditLog[] = [
    {
        id: 'log1',
        timestamp: new Date('2025-10-15T10:00:00'),
        adminId: 'a1',
        actiune: 'Modificare Scor',
        detalii: {
            candidatId: 'c1',
            juratId: 'j1',
            criteriuId: 'crit1_reg',
            scorVechi: 80,
            scorNou: 85,
            motiv: 'Corecție eroare de transcriere.'
        }
    },
    {
        id: 'log2',
        timestamp: new Date('2025-10-16T14:30:00'),
        adminId: 'a1',
        actiune: 'Modificare Status',
        detalii: {
            candidatId: 'c2',
            etapaId: 'etapa3',
            statusVechi: Status.IN_CURS,
            statusNou: Status.FINALIZAT,
            motiv: 'Finalizare evaluare regională cu scor excepțional.'
        }
    },
    {
        id: 'log3',
        timestamp: new Date('2025-10-16T15:45:00'),
        adminId: 'a1',
        actiune: 'Modificare Etapă',
        detalii: {
            etapaId: 'etapa4',
            modificare: 'activare',
            valoareVeche: false,
            valoareNoua: true,
            motiv: 'Activare etapă națională conform calendar.',
            numarModificari: 1
        }
    },
    {
        id: 'log4',
        timestamp: new Date('2025-10-17T09:15:00'),
        adminId: 'a1',
        actiune: 'Modificare Etapă',
        detalii: {
            etapaId: 'etapa3',
            modificare: 'dezactivare',
            valoareVeche: true,
            valoareNoua: false,
            motiv: 'Închidere etapă regională conform calendar.',
            numarModificari: 1
        }
    },
    {
        id: 'log5',
        timestamp: new Date('2025-10-17T10:30:00'),
        adminId: 'a1',
        actiune: 'Modificare Criteriu',
        detalii: {
            criteriuId: 'crit1_nat',
            modificare: 'pondere',
            valoareVeche: 0.4,
            valoareNoua: 0.5,
            motiv: 'Ajustare pondere conform feedback juriu național.'
        }
    }
];

export const DEFAULT_DOCUMENTATION_CONTENT: DocumentationContent = {
  mainTitle: 'Documentație Platformă Jurizare',
  mainSubtitle: 'Ghid de utilizare și descrierea procesului de jurizare pentru Gala Directorii Anului.',
  overviewTitle: 'Procesul de Jurizare - O privire de ansamblu',
  overviewText: 'Platforma este concepută pentru a facilita un proces de evaluare transparent, eficient și standardizat. Procesul se desfășoară în mai multe etape, fiecare cu propriile criterii de evaluare, culminând cu desemnarea câștigătorilor pe categorii și a marelui titlu "Directorul Anului".',
  stagesTitle: 'Etapele Competiției',
  stage1_title: 'Validarea înscrierilor:',
  stage1_desc: 'Etapa inițială de verificare a eligibilității candidaților.',
  stage2_title: 'Etapa Preliminară:',
  stage2_desc: 'O primă rundă de selecție bazată pe criterii generale.',
  stage3_title: 'Jurizarea Regională:',
  stage3_desc: 'Candidații sunt evaluați în contextul regiunii lor de proveniență. Cei mai buni avansează la nivel național.',
  stage4_title: 'Jurizarea Națională:',
  stage4_desc: 'Finaliștii regionali sunt evaluați de un juriu extins pe baza unor criterii de impact național. Câștigătorii acestei etape devin finaliștii pentru marele premiu.',
  stage5_title: 'Finala:',
  stage5_desc: 'Etapa de desemnare a titlului "Directorul Anului" dintre câștigătorii pe categorii.',
  stage6_title: 'Clasament Final:',
  stage6_desc: 'Vizualizarea rezultatelor finale, inclusiv a Directorului Anului și a laureaților pe categorii.',
  criteriaTitle: 'Criterii și Pondere',
  criteriaP1: 'Pentru fiecare etapă și categorie de premiere, sunt definite criterii de evaluare specifice. Fiecare criteriu are o pondere procentuală care reflectă importanța sa în calculul scorului final pentru etapa respectivă.',
  criteriaP2: 'Scorul Final Ponderat pentru un candidat, într-o anumită etapă, se calculează ca sumă a produselor dintre scorul acordat pentru fiecare criteriu și ponderea acelui criteriu.',
  criteriaExampleTitle: 'Exemplu de calcul:',
  criteriaExampleLi1_title: 'Criteriu A (Pondere 40%):',
  criteriaExampleLi1_desc: 'Scor 85',
  criteriaExampleLi2_title: 'Criteriu B (Pondere 60%):',
  criteriaExampleLi2_desc: 'Scor 90',
  criteriaExampleResult: 'Scor Final = (85 * 0.40) + (90 * 0.60) = 34 + 54 = 88.00',
  rolesTitle: 'Rolurile Utilizatorilor',
  roleJudgeTitle: 'Jurat',
  roleJudgeP1: 'Jurații sunt responsabili pentru evaluarea candidaților care le-au fost asignați. Din Portalul Jurat, aceștia pot:',
  roleJudgeLi1: 'Vizualiza lista de candidați asignați pentru etapa curentă.',
  roleJudgeLi2: 'Filtra și căuta candidați pentru a-și organiza munca.',
  roleJudgeLi3: 'Acorda scoruri pentru fiecare criteriu de evaluare.',
  roleJudgeLi4: 'Adăuga observații textuale pentru a-și justifica deciziile.',
  roleJudgeLi5: 'Salva progresul unei evaluări (status "În curs") sau o pot trimite ca finală (status "Finalizat").',
  roleAdminTitle: 'Administrator',
  roleAdminP1: 'Administratorii au control complet asupra platformei și a desfășurării competiției. Din panoul de Administrare, aceștia pot:',
  roleAdminLi1: 'Configura etapele, categoriile și criteriile de evaluare, inclusiv ponderile acestora.',
  roleAdminLi2: 'Gestiona lista de candidați și jurați.',
  roleAdminLi3: 'Asigna manual sau automat candidați către jurați pentru fiecare etapă.',
  roleAdminLi4: 'Monitoriza și modifica scoruri (cu justificare obligatorie, înregistrată în jurnalul de audit).',
  roleAdminLi5: 'Vizualiza un jurnal de audit detaliat cu toate acțiunile critice efectuate pe platformă.',
  roleAdminLi6: 'Exporta datele competiției (liste de candidați, evaluări, rezultate) în formate JSON sau CSV.',
  roleAdminLi7: 'Promova candidații dintr-o etapă în alta și desemna câștigătorii finali.',
};