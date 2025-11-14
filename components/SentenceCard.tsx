
import React, { useState, useEffect } from 'react';
import { Sentence, Author, SentenceStatus } from '../types';
import { NewSentenceForm } from './NewSentenceForm';
import { ClockIcon } from './icons/ClockIcon';

interface SentenceCardProps {
  sentence: Sentence;
  author?: Author;
  isLoggedIn: boolean;
  canVote: boolean;
  votesRemaining: number;
  hasVoted: boolean;
  onVote: (sentenceId: string) => void;
  onSubmitNewSentence: (parentSentenceId: string, text: string) => void;
  onNavigateToBranch: (branchId: string) => void;
  childBranchId?: string;
  isVoting: boolean;
  justVoted: boolean;
  votingDurationHours: number;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({ 
  sentence, author, isLoggedIn, canVote, votesRemaining, hasVoted, onVote, 
  onSubmitNewSentence, onNavigateToBranch, childBranchId, isVoting,
  justVoted, votingDurationHours
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (sentence.durum !== SentenceStatus.VOTING) return;

    const votingEndTime = new Date(
        new Date(sentence.gonderme_zamani).getTime() + votingDurationHours * 60 * 60 * 1000
    ).getTime();

    const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const difference = votingEndTime - now;

        if (difference > 0) {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
        } else {
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
    };

    calculateTimeLeft(); // initial calculation
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [sentence.gonderme_zamani, sentence.durum, votingDurationHours]);

  const { hours, minutes, seconds } = timeLeft;
  const isTimeUp = sentence.durum === SentenceStatus.VOTING && hours <= 0 && minutes <= 0 && seconds <= 0;
  const isOutOfVotes = isLoggedIn && votesRemaining <= 0;

  const getStatusInfo = () => {
    switch (sentence.durum) {
      case SentenceStatus.VOTING:
        return {
          bgColor: 'bg-blue-950/50 border-blue-700/70',
          textColor: 'text-blue-200',
          statusText: 'Oylanıyor',
          statusColor: 'text-yellow-400'
        };
      case SentenceStatus.APPROVED:
        return {
          bgColor: 'bg-green-900/60 border-green-600',
          textColor: 'text-green-100',
          statusText: 'Onaylandı',
          statusColor: 'text-green-400'
        };
      case SentenceStatus.REJECTED:
        return {
          bgColor: 'bg-red-950/60 border-red-800/60',
          textColor: 'text-gray-500',
          statusText: 'Reddedildi',
          statusColor: 'text-red-500'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  const handleNewSentenceSubmit = (text: string) => {
    onSubmitNewSentence(sentence.cumle_id, text);
  };
  
  const voteButtonText = () => {
    if (isVoting) return 'Oylanıyor...';
    if (!isLoggedIn) return 'Oy için Giriş Yap';
    if (hasVoted) return 'Oy Verildi';
    if (isOutOfVotes) return 'Oy Hakkı Doldu';
    return 'Oy Ver';
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ease-in-out ${statusInfo.bgColor} ${justVoted ? 'transform scale-105 shadow-lg shadow-indigo-500/40' : ''}`}>
      <p className={`text-lg ${statusInfo.textColor}`}>{sentence.metin}</p>
      <div className="flex justify-between items-center mt-3 text-sm text-gray-400">
        <span>Yazar: {author?.kullanici_adi || 'Bilinmiyor'}</span>
        <span className={`font-semibold ${statusInfo.statusColor}`}>{statusInfo.statusText}</span>
      </div>
      
      {sentence.durum === SentenceStatus.VOTING && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <span className="text-indigo-400 font-bold">{sentence.toplam_oy} Oy</span>
            <div className={`flex items-center gap-1 text-xs ${isTimeUp ? 'text-red-400' : 'text-gray-400'}`}>
                <ClockIcon className="w-4 h-4" />
                {isTimeUp ? (
                    <span>Süre Doldu</span>
                ) : (
                    <span className="font-mono tabular-nums">
                        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                )}
            </div>
          </div>
          <button
            onClick={() => onVote(sentence.cumle_id)}
            disabled={!canVote || hasVoted || isVoting || !isLoggedIn || isTimeUp || isOutOfVotes}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
              hasVoted || !isLoggedIn || isOutOfVotes
                ? 'bg-gray-600 text-gray-400 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed'
            }`}
          >
            {voteButtonText()}
          </button>
        </div>
      )}

      {sentence.durum === SentenceStatus.APPROVED && (
        <div className="mt-4">
          {childBranchId ? (
            <button 
              onClick={() => onNavigateToBranch(childBranchId)}
              className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
            >
              Bu Yolu Keşfet &rarr;
            </button>
          ) : (
            isLoggedIn ? (
              <NewSentenceForm isLoggedIn={isLoggedIn} parentSentenceText={sentence.metin} onSubmit={handleNewSentenceSubmit} />
            ) : (
              <div className="text-center p-4 bg-gray-800 rounded-lg text-gray-400">
                Yeni bir yol başlatmak için giriş yapmalısın.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};