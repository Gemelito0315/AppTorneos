'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../lib/auth-context';
import { Trophy, UserPlus, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    city: '',
    phone: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar club');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-billiard-felt border border-billiard-green/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <Trophy className="w-6 h-6 text-billiard-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-xs text-gray-400">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        <div className="rounded-2xl bg-billiard-card border border-billiard-border p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.orgName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationName: e.target.value })
                  }
                  placeholder="Ej. Club Social de Billar El Diamante"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.city')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ej. Medellín"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Carlos Alberto Pérez"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@clubeldiamante.com"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('auth.password')} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : t('auth.submitRegister')}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-billiard-border/60 text-center text-xs text-gray-400">
            <span>{t('auth.haveAccount')} </span>
            <Link
              href="/login"
              className="text-billiard-green font-semibold hover:underline"
            >
              {t('auth.loginHere')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
