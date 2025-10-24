import React, { useState, useEffect } from 'react';
import Card from './shared/Card';
import { UserGroupIcon, SlidersIcon, TrophyIcon, PencilSquareIcon } from './shared/icons';
import { DocumentationContent, User, UserRole } from '../types';

interface DocumentationViewProps {
  docContent: DocumentationContent;
  setDocContent: React.Dispatch<React.SetStateAction<DocumentationContent>>;
  currentUser: User;
}

const EditableField: React.FC<{
    isEditing: boolean;
    value: string;
    onChange: (newValue: string) => void;
    as?: 'input' | 'textarea';
    className?: string;
    textClassName?: string;
}> = ({ isEditing, value, onChange, as = 'textarea', className, textClassName }) => {
    if (isEditing) {
        if (as === 'input') {
            return (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full bg-blue-50 dark:bg-slate-700 p-2 rounded-md border border-ave-blue ${className}`}
                />
            );
        }
        return (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-blue-50 dark:bg-slate-700 p-2 rounded-md border border-ave-blue resize-y min-h-[60px] ${className}`}
                rows={Math.max(2, value.split('\n').length)}
            />
        );
    }
    return <span className={textClassName}>{value}</span>;
};


const DocumentationView: React.FC<DocumentationViewProps> = ({ docContent, setDocContent, currentUser }) => {
    const isAdmin = currentUser.rol === UserRole.ADMIN;
    const [isEditing, setIsEditing] = useState(false);
    const [localContent, setLocalContent] = useState(docContent);

    useEffect(() => {
        setLocalContent(docContent);
    }, [docContent]);

    const handleContentChange = (key: string, value: string) => {
        setLocalContent(prev => ({...prev, [key]: value}));
    };

    const handleSave = () => {
        setDocContent(localContent);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalContent(docContent);
        setIsEditing(false);
    };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100">
                <EditableField isEditing={isEditing} value={localContent.mainTitle} onChange={(v) => handleContentChange('mainTitle', v)} as="input" textClassName='text-3xl font-extrabold text-ave-dark-blue dark:text-slate-100' />
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
                 <EditableField isEditing={isEditing} value={localContent.mainSubtitle} onChange={(v) => handleContentChange('mainSubtitle', v)} as="input" textClassName='text-gray-500 dark:text-slate-400' />
            </p>
        </div>
        {isAdmin && (
            <div className="flex space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700">Salvează</button>
                        <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-sm font-semibold border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">Anulează</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">
                        <PencilSquareIcon className="w-4 h-4"/>
                        <span>Editează Pagina</span>
                    </button>
                )}
            </div>
        )}
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-ave-blue mb-4">
             <EditableField isEditing={isEditing} value={localContent.overviewTitle} onChange={(v) => handleContentChange('overviewTitle', v)} as="input" textClassName="text-xl font-bold text-ave-blue" />
        </h3>
        <p className="text-gray-600 dark:text-slate-300 space-y-4">
             <EditableField isEditing={isEditing} value={localContent.overviewText} onChange={(v) => handleContentChange('overviewText', v)} textClassName="text-gray-600 dark:text-slate-300" />
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-ave-blue mb-4 flex items-center gap-2">
            <SlidersIcon className="w-6 h-6" />
             <EditableField isEditing={isEditing} value={localContent.stagesTitle} onChange={(v) => handleContentChange('stagesTitle', v)} as="input" textClassName="text-xl font-bold" />
          </h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-slate-300">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <li key={i}>
                    <strong><EditableField isEditing={isEditing} value={localContent[`stage${i}_title`]} onChange={(v) => handleContentChange(`stage${i}_title`, v)} as="input" /></strong>
                    <EditableField isEditing={isEditing} value={localContent[`stage${i}_desc`]} onChange={(v) => handleContentChange(`stage${i}_desc`, v)} as="input" />
                </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-ave-blue mb-4 flex items-center gap-2">
            <TrophyIcon className="w-6 h-6" />
            <EditableField isEditing={isEditing} value={localContent.criteriaTitle} onChange={(v) => handleContentChange('criteriaTitle', v)} as="input" textClassName="text-xl font-bold" />
          </h3>
          <div className="space-y-4 text-gray-600 dark:text-slate-300">
            <p><EditableField isEditing={isEditing} value={localContent.criteriaP1} onChange={(v) => handleContentChange('criteriaP1', v)} /></p>
            <p><strong><EditableField isEditing={isEditing} value={localContent.criteriaP2} onChange={(v) => handleContentChange('criteriaP2', v)} /></strong></p>
            <div className="text-sm bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg">
              <p className="font-semibold"><EditableField isEditing={isEditing} value={localContent.criteriaExampleTitle} onChange={(v) => handleContentChange('criteriaExampleTitle', v)} as="input" /></p>
              <ul className="list-disc list-inside mt-1">
                 <li><strong><EditableField isEditing={isEditing} value={localContent.criteriaExampleLi1_title} onChange={(v) => handleContentChange('criteriaExampleLi1_title', v)} as="input"/></strong> <EditableField isEditing={isEditing} value={localContent.criteriaExampleLi1_desc} onChange={(v) => handleContentChange('criteriaExampleLi1_desc', v)} as="input" /></li>
                 <li><strong><EditableField isEditing={isEditing} value={localContent.criteriaExampleLi2_title} onChange={(v) => handleContentChange('criteriaExampleLi2_title', v)} as="input"/></strong> <EditableField isEditing={isEditing} value={localContent.criteriaExampleLi2_desc} onChange={(v) => handleContentChange('criteriaExampleLi2_desc', v)} as="input" /></li>
              </ul>
              <p className="mt-2"><strong><EditableField isEditing={isEditing} value={localContent.criteriaExampleResult} onChange={(v) => handleContentChange('criteriaExampleResult', v)} as="input" /></strong></p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold text-ave-blue mb-4 flex items-center gap-2">
          <UserGroupIcon className="w-6 h-6" />
           <EditableField isEditing={isEditing} value={localContent.rolesTitle} onChange={(v) => handleContentChange('rolesTitle', v)} as="input" textClassName="text-xl font-bold" />
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-lg text-gray-800 dark:text-slate-200"><EditableField isEditing={isEditing} value={localContent.roleJudgeTitle} onChange={(v) => handleContentChange('roleJudgeTitle', v)} as="input" /></h4>
            <p className="mt-1 text-gray-600 dark:text-slate-300">
                <EditableField isEditing={isEditing} value={localContent.roleJudgeP1} onChange={(v) => handleContentChange('roleJudgeP1', v)} />
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-slate-300 pl-4">
              {[1, 2, 3, 4, 5].map(i => <li key={i}><EditableField isEditing={isEditing} value={localContent[`roleJudgeLi${i}`]} onChange={(v) => handleContentChange(`roleJudgeLi${i}`, v)} /></li>)}
            </ul>
          </div>
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <h4 className="font-bold text-lg text-gray-800 dark:text-slate-200"><EditableField isEditing={isEditing} value={localContent.roleAdminTitle} onChange={(v) => handleContentChange('roleAdminTitle', v)} as="input" /></h4>
            <p className="mt-1 text-gray-600 dark:text-slate-300">
                <EditableField isEditing={isEditing} value={localContent.roleAdminP1} onChange={(v) => handleContentChange('roleAdminP1', v)} />
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-slate-300 pl-4">
               {[1, 2, 3, 4, 5, 6, 7].map(i => <li key={i}><EditableField isEditing={isEditing} value={localContent[`roleAdminLi${i}`]} onChange={(v) => handleContentChange(`roleAdminLi${i}`, v)} /></li>)}
            </ul>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default DocumentationView;