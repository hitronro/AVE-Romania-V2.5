import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JudgeView from './components/JudgeView';
import LeaderboardView from './components/LeaderboardView';
import AdminView from './components/AdminView';
import DocumentationView from './components/DocumentationView';
import { View, Candidat, Jurat, Assignment, AuditLog, Stage, Category, Criterion, User, UserRole, Admin, DocumentationContent } from './types';
import { CANDIDATI, JURATI, ASSIGNMENTS, AUDIT_LOGS, STAGES, CATEGORIES, CRITERIA, ADMINI, DEFAULT_DOCUMENTATION_CONTENT } from './constants';

const App: React.FC = () => {
  // Combined user list for dropdown
  const ALL_USERS: User[] = [...JURATI, ...ADMINI];

  // App states with mock data initialization
  const [activeView, setActiveView] = useState<View>(View.LEADERBOARD);
  const [currentUser, setCurrentUser] = useState<User>(ADMINI[0]);
  const [candidates, setCandidates] = useState<Candidat[]>(CANDIDATI);
  const [judges, setJudges] = useState<Jurat[]>(JURATI);
  const [assignments, setAssignments] = useState<Assignment[]>(ASSIGNMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AUDIT_LOGS);
  const [stages, setStages] = useState<Stage[]>(STAGES);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [criteria, setCriteria] = useState<Criterion[]>(CRITERIA);
  const [docContent, setDocContent] = useState<DocumentationContent>(DEFAULT_DOCUMENTATION_CONTENT);


  // Load initial data from localStorage with fallback to mock data
  useEffect(() => {
    const loadData = function<T>(key: string, defaultValue: T): T {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : defaultValue;
    };

    setCandidates(loadData('candidates', CANDIDATI));
    setJudges(loadData('judges', JURATI));
    setAssignments(loadData('assignments', ASSIGNMENTS)); 
    setAuditLogs(loadData('auditLogs', AUDIT_LOGS));
    setStages(loadData('stages', STAGES));
    setCategories(loadData('categories', CATEGORIES));
    setCriteria(loadData('criteria', CRITERIA));
    setDocContent(loadData('documentationContent', DEFAULT_DOCUMENTATION_CONTENT));
  }, []);

  useEffect(() => {
    // Persist state changes to localStorage
    localStorage.setItem('candidates', JSON.stringify(candidates));
    localStorage.setItem('judges', JSON.stringify(judges));
    localStorage.setItem('assignments', JSON.stringify(assignments));
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
    localStorage.setItem('stages', JSON.stringify(stages));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('criteria', JSON.stringify(criteria));
    localStorage.setItem('documentationContent', JSON.stringify(docContent));
  }, [candidates, judges, assignments, auditLogs, stages, categories, criteria, docContent]);


  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `log${Date.now()}`,
      timestamp: new Date(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleSetView = (view: View) => {
    // Only switch user role if absolutely necessary
    if (view === View.ADMIN && currentUser.rol !== UserRole.ADMIN) {
        const adminUser = ALL_USERS.find(u => u.rol === UserRole.ADMIN);
        if(adminUser) {
          setCurrentUser(adminUser);
          // Save current user preference to localStorage
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
        }
    } else if (view === View.JUDGE && currentUser.rol !== UserRole.JUDGE) {
        const judgeUser = ALL_USERS.find(u => u.rol === UserRole.JUDGE);
        if(judgeUser) {
          setCurrentUser(judgeUser);
          // Save current user preference to localStorage
          localStorage.setItem('currentUser', JSON.stringify(judgeUser));
        }
    }
    // Save active view preference to localStorage
    localStorage.setItem('activeView', view);
    setActiveView(view);
  }
  
  const renderView = () => {
    const commonProps = {
        candidates,
        judges,
        assignments,
        stages,
        categories,
        criteria,
    }

    switch (activeView) {
      case View.JUDGE:
        if (currentUser.rol !== UserRole.JUDGE) {
            return <div className="text-center p-10"><p className="text-red-600 dark:text-red-400">Nu aveți permisiuni pentru a accesa această pagină.</p></div>
        }
        return <JudgeView 
                    {...commonProps}
                    currentJudge={currentUser as Jurat} 
                    setAssignments={setAssignments}
                />;
      case View.LEADERBOARD:
        return <LeaderboardView 
                    {...commonProps}
                    setCandidates={setCandidates}
                    currentUser={currentUser}
                />;
      case View.ADMIN:
         if (currentUser.rol !== UserRole.ADMIN) {
            return <div className="text-center p-10"><p className="text-red-600 dark:text-red-400">Nu aveți permisiuni pentru a accesa această pagină.</p></div>
        }
        return <AdminView 
                    {...commonProps} 
                    auditLogs={auditLogs}
                    setCandidates={setCandidates}
                    setAssignments={setAssignments}
                    setStages={setStages}
                    setCategories={setCategories}
                    setCriteria={setCriteria}
                    setJudges={setJudges}
                    addAuditLog={addAuditLog}
                    currentUser={currentUser as Admin}
                />;
      case View.DOCUMENTATION:
        return <DocumentationView 
            docContent={docContent}
            setDocContent={setDocContent}
            currentUser={currentUser}
        />;
      default:
        return <p>Vedere invalidă</p>;
    }
  };

  return (
    <div className="bg-gray-100/50 dark:bg-slate-900 min-h-screen">
      <Header
        currentView={activeView}
        setView={handleSetView}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={ALL_USERS}
      />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
