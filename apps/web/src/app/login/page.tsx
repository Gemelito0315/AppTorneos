'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth-context';
import { Trophy, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-billiard-felt border border-billiard-green/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <Trophy className="w-6 h-6 text-billiard-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-xs text-gray-400">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-6 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@losmaestrosbillar.com"
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Iniciando...' : t('auth.submitLogin')}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-billiard-border/60 text-center text-xs text-gray-400">
            <span>{t('auth.noAccount')} </span>
            <Link
              href="/register"
              className="text-billiard-green font-semibold hover:underline"
            >
              {t('auth.registerHere')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
