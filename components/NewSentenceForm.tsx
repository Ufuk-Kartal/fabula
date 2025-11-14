import React, { useState } from 'react';
import { generateSentenceSuggestion } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface NewSentenceFormProps {
  isLoggedIn: boolean;
  parentSentenceText: string;
  onSubmit: (text: string) => void;
}

export const NewSentenceForm: React.FC<NewSentenceFormProps> = ({ isLoggedIn, parentSentenceText, onSubmit }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSuggestion = async () => {
    setIsGenerating(true);
    setError('');
    const suggestion = await generateSentenceSuggestion(parentSentenceText);
    if (!suggestion.toLowerCase().includes('error')) {
      setText(suggestion);
    } else {
      setError(suggestion);
    }
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError('Cümle göndermek için giriş yapmalısınız.');
      return;
    }
    if (text.length < 5 || text.length > 150) {
      setError('Cümle 5 ile 150 karakter arasında olmalıdır.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    onSubmit(text);
    setText('');
    setIsSubmitting(false);
  };

  if (!isLoggedIn) {
    return (
       <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center text-gray-400">
          Hikayeye katkıda bulunmak için lütfen giriş yapın.
       </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <form onSubmit={handleSubmit}>
        <label htmlFor="sentence-input" className="block text-sm font-medium text-indigo-300 mb-2">Bu yola yeni bir cümle ekle:</label>
        <div className="relative">
          <textarea
            id="sentence-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            rows={3}
            placeholder="Hikayeyi devam ettir..."
            maxLength={150}
            disabled={isSubmitting || isGenerating}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {text.length} / 150
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={handleGenerateSuggestion}
            disabled={isGenerating || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition"
          >
            <SparklesIcon className="w-5 h-5" />
            {isGenerating ? 'Üretiliyor...' : 'Yapay Zeka Önerisi'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isGenerating || text.length < 5}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
};