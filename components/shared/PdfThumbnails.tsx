import React, { useEffect, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';

interface Props {
  url: string;
  maxPages?: number;
}

const PdfThumbnails: React.FC<Props> = ({ url, maxPages = 6 }) => {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let mounted = true;
    const run = async () => {
      try {
        const pdf = await getDocument(url).promise;
        const pageCount = Math.min(pdf.numPages, maxPages);
        const images: string[] = [];
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          images.push(canvas.toDataURL('image/png'));
        }
        if (!mounted) return;
        setThumbs(images);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError('Nu s-au putut genera miniaturi.');
      }
    };
    run();
    return () => { mounted = false; };
  }, [url, maxPages]);

  if (error) return <div className="text-sm text-gray-500 dark:text-slate-400">{error}</div>;
  if (thumbs.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {thumbs.map((src, idx) => (
        <div key={idx} className="border rounded-md overflow-hidden bg-white dark:bg-slate-800">
          <img src={src} alt={`Pagina ${idx + 1}`} className="w-full h-24 object-cover" />
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400">Pagina {idx + 1}</div>
        </div>
      ))}
    </div>
  );
};

export default PdfThumbnails;