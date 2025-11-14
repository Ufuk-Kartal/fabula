import React, { useState, useMemo } from 'react';
import { Author } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface LeaderboardProps {
  authors: Author[];
  currentUserId: string | null;
  onClose: () => void;
}

type SortKey = 'toplam_gonderilen_cumle' | 'toplam_kazanis';

export const Leaderboard: React.FC<LeaderboardProps> = ({ authors, currentUserId, onClose }) => {
  const [sortKey, setSortKey] = useState<SortKey>('toplam_gonderilen_cumle');

  const sortedAuthors = useMemo(() => {
    // Filter out 'SISTEM' author and sort
    return [...authors]
      .filter(a => a.yazar_id !== 'SISTEM')
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [authors, sortKey]);

  const TabButton = ({ label, currentSortKey }: { label: string, currentSortKey: SortKey }) => {
    const isActive = sortKey === currentSortKey;
    return (
      <button
        onClick={() => setSortKey(currentSortKey)}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
          isActive
            ? 'bg-gray-800 text-indigo-300 border-b-2 border-indigo-400'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-gray-900 border border-indigo-500/30 rounded-lg shadow-2xl shadow-indigo-900/50 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-indigo-300">Liderlik Tablosu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="border-b border-gray-700 px-4">
            <nav className="flex -mb-px">
                <TabButton label="En Üretken" currentSortKey="toplam_gonderilen_cumle" />
                <TabButton label="Efsane Anlatıcılar" currentSortKey="toplam_kazanis" />
            </nav>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          <ul className="space-y-2">
            {sortedAuthors.map((author, index) => (
              <li
                key={author.yazar_id}
                className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                  author.yazar_id === currentUserId
                    ? 'bg-indigo-600/20 border border-indigo-500'
                    : 'bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                  <span className="font-semibold text-gray-200">{author.kullanici_adi}</span>
                </div>
                <span className="text-lg font-bold text-indigo-400">
                  {author[sortKey]}
                  <span className="text-xs ml-1 text-gray-400">{sortKey === 'toplam_kazanis' ? 'dal' : 'cümle'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};