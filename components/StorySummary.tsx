import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface StorySummaryProps {
  summary: string | null;
  summaryTitle: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export const StorySummary: React.FC<StorySummaryProps> = ({ summary, summaryTitle, isLoading, error, onGenerate }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <SparklesIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
          <p className="mt-2 text-gray-400">Yapay zeka bu yolu özetliyor...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center p-6">
          <p className="text-red-400">{error}</p>
        </div>
      );
    }

    if (summary) {
      return (
        <div className="p-4">
          <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-300">
            {summary}
          </blockquote>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="my-6 bg-gray-800/40 rounded-lg border border-gray-700/50">
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3 min-w-0">
            <BookOpenIcon className="w-6 h-6 text-indigo-300 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-indigo-300 truncate" title={summaryTitle || 'Yol Özeti'}>
              {isLoading ? 'Oluşturuluyor...' : (summaryTitle || 'Yol Özeti')}
            </h3>
        </div>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed transition"
        >
          <SparklesIcon className="w-5 h-5" />
          {isLoading ? 'Oluşturuluyor...' : (summary ? 'Yenile' : 'Oluştur')}
        </button>
      </div>
      { (isLoading || error || summary) && (
        <div className="border-t border-gray-700/50">
            {renderContent()}
        </div>
      )}
    </div>
  );
};
