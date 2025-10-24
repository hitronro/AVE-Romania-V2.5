import React from 'react';
import { View, User } from '../types';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, currentUser, setCurrentUser, allUsers }) => {
  const views: View[] = [View.JUDGE, View.LEADERBOARD, View.ADMIN, View.DOCUMENTATION];

  return (
    <header className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200/80 dark:border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-extrabold text-ave-dark-blue dark:text-slate-100">
              Gala <span className="text-ave-blue">Directorii Anului</span>
            </h1>
            <span className="ml-3 text-xs font-semibold text-gray-400 dark:text-slate-500 hidden md:block border-l pl-3 border-gray-300 dark:border-slate-600">Platformă Jurizare</span>
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-full">
                {views.map(view => (
                    <button
                    key={view}
                    onClick={() => setView(view)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                        currentView === view
                        ? 'bg-white dark:bg-ave-blue text-ave-blue dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200/70 dark:hover:bg-slate-700/70'
                    }`}
                    >
                    {view}
                    </button>
                ))}
            </div>
             <div className="hidden sm:flex items-center space-x-3">
                 <div className="w-9 h-9 rounded-full bg-ave-blue text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.nume.charAt(0)}
                </div>
                <select 
                    value={currentUser.id} 
                    onChange={e => {
                        const selectedUser = allUsers.find(u => u.id === e.target.value);
                        if(selectedUser) setCurrentUser(selectedUser);
                    }}
                    className="text-sm font-semibold text-ave-dark-blue dark:text-slate-100 border-none bg-transparent focus:ring-0 dark:[color-scheme:dark]"
                >
                    {allUsers.map(user => (
                        <option 
                            key={user.id} 
                            value={user.id}
                            className="bg-white text-black dark:bg-slate-800 dark:text-slate-200"
                        >
                            {user.nume} ({user.rol})
                        </option>
                    ))}
                </select>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;