import React from 'react';
import { Candidat } from '../../types';
import { XMarkIcon } from './icons';

interface Props {
  candidate: Candidat;
  open: boolean;
  onClose: () => void;
}

const SubmissionModal: React.FC<Props> = ({ candidate, open, onClose }) => {
  if (!open) return null;

  const hasUrl = !!candidate.submissionUrl;
  const hasHtml = !!candidate.submissionHtml;
  const hasText = !!candidate.submissionText;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-ave-dark-blue dark:text-slate-100 truncate">Vizualizare candidat</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{candidate.nume} — {candidate.scoala}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasUrl && (
              <a href={candidate.submissionUrl} target="_blank" rel="noreferrer" className="text-sm px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-md text-ave-dark-blue">Deschide în fereastră nouă</a>
            )}
            <button onClick={onClose} className="p-2 rounded-md text-gray-600 dark:text-slate-300">
              <span className="sr-only">Închide</span>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 prose max-w-none dark:prose-invert">
          {hasHtml ? (
            <div dangerouslySetInnerHTML={{ __html: candidate.submissionHtml! }} />
          ) : hasText ? (
            <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-slate-100">{candidate.submissionText}</div>
          ) : hasUrl ? (
            <div className="h-[70vh] w-full">
              <iframe src={candidate.submissionUrl} title={`Submission ${candidate.nume}`} className="w-full h-full border-0" />
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-slate-400">Nu există lucrare atașată pentru acest candidat.</div>
          )}
        </div>

        <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm">Închide</button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
