
import React from 'react';
import { StoryEvent } from '../types';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { BadgeIcon } from './icons/BadgeIcon';

interface EventBannerProps {
  event: StoryEvent;
  onNavigate: (branchId: string) => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ event, onNavigate }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-400/50 p-4 rounded-lg mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-lg shadow-purple-900/40">
      <div className="flex-shrink-0 text-purple-300">
        <MegaphoneIcon className="w-10 h-10" />
      </div>
      <div className="flex-grow text-center sm:text-left">
        <h2 className="text-lg font-bold text-white">{event.baslik}</h2>
        <p className="text-sm text-purple-200 mt-1">{event.aciklama}</p>
        <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-yellow-300 font-semibold">
            <BadgeIcon className="w-4 h-4 text-yellow-400" />
            <span>Özel Ödül: {event.rozet_adi}</span>
        </div>
      </div>
      <div className="flex-shrink-0 mt-3 sm:mt-0">
        <button 
            onClick={() => onNavigate(event.baslangic_dal_id)}
            className="px-5 py-2 text-sm font-bold text-gray-900 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors shadow-md"
        >
            Maceraya Katıl!
        </button>
      </div>
    </div>
  );
};
