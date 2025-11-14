
import React from 'react';
import { Author, Badge } from '../types';
import { BadgeIcon } from './icons/BadgeIcon';
import { HandRaisedIcon } from './icons/HandRaisedIcon';

interface UserProfileProps {
  user: Author;
  badges: Badge[];
  votesRemaining: number;
  dailyVoteLimit: number;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, badges, votesRemaining, dailyVoteLimit }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-lg text-sm flex items-center gap-4">
      <div>
        <h3 className="font-bold text-md text-indigo-300 whitespace-nowrap">{user.kullanici_adi}</h3>
        <div className="mt-1 text-xs text-gray-300 flex items-center gap-3">
          <span>Yazılan: <span className="font-semibold text-white">{user.toplam_gonderilen_cumle}</span></span>
          <span>Açılan: <span className="font-semibold text-white">{user.toplam_kazanis}</span></span>
          <span className="flex items-center gap-1" title="Günlük Kalan Oy Hakkı">
            <HandRaisedIcon className="w-4 h-4 text-indigo-300" />
            <span className="font-semibold text-white">{votesRemaining < 0 ? 0 : votesRemaining}/{dailyVoteLimit}</span>
          </span>
        </div>
      </div>
       {badges.length > 0 && (
         <div className="border-l border-gray-600 pl-3 flex items-center gap-2">
            {badges.map(badge => (
              <div key={badge.rozet_id} title={badge.rozet_adi} className="transition-transform hover:scale-110">
                <BadgeIcon className="w-6 h-6 text-yellow-400" />
              </div>
            ))}
         </div>
       )}
    </div>
  );
};