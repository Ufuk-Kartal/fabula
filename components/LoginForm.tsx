import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { LockIcon } from './icons/LockIcon';

interface LoginFormProps {
  onLogin: (username: string) => boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Kullanıcı adı gerekli.');
      return;
    }
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const success = onLogin(username);
      if (!success) {
        setError('Kullanıcı bulunamadı. (İpucu: Gezgin veya Kaşif)');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="w-56 bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
      <div className="space-y-3">
        <div>
            <label htmlFor="username-input" className="sr-only">Kullanıcı Adı</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    id="username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-md border-0 bg-gray-900/80 py-1.5 pl-9 text-gray-200 ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                    placeholder="Kullanıcı Adı"
                    autoComplete="username"
                    disabled={isLoading}
                />
            </div>
        </div>
        <div>
            <label htmlFor="password-input" className="sr-only">Şifre</label>
            <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LockIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="password"
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 bg-gray-900/80 py-1.5 pl-9 text-gray-200 ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
                    placeholder="Şifre"
                    autoComplete="current-password"
                    disabled={isLoading}
                />
            </div>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-900 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
};
