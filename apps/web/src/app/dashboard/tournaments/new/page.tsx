'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../lib/i18n';
import { useAuth } from '../../../../lib/auth-context';
import { apiRequest } from '../../../../lib/api';
import { Trophy, ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewTournamentPage() {
  const { t } = useTranslation();
  const { user, organization, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [modalities, setModalities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    modalityId: '',
    status: 'REGISTRATION_OPEN',
    isPublic: true,
    contactPhone: '',
    contactEmail: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchModalities = async () => {
      try {
        const data = await apiRequest<any[]>('/modalities');
        setModalities(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            modalityId: data[0].id,
            venue: organization?.name ? `${organization.name} - Sede Principal` : '',
            contactEmail: user?.email || '',
            contactPhone: user?.phone || '',
          }));
        }
      } catch (err: any) {
        console.error('Error cargando modalidades:', err);
      }
    };

    if (user) {
      fetchModalities();
    }
  }, [authLoading, user, organization, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      await apiRequest('/tournaments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error creando el torneo');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-billiard-card hover:bg-billiard-felt text-gray-300 hover:text-white border border-billiard-border transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {t('nav.newTournament')}
          </h1>
          <p className="text-xs text-gray-400">
            {organization?.name ? `Organizado por ${organization.name}` : ''}
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-billiard-card border border-billiard-border p-6 sm:p-8 shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 border-b border-billiard-border pb-2">
              Información Básica
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('form.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('form.namePlaceholder')}
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.modality')} *
                </label>
                <select
                  required
                  value={formData.modalityId}
                  onChange={(e) => setFormData({ ...formData, modalityId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
                >
                  {modalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
                >
                  <option value="DRAFT">{t('status.DRAFT')}</option>
                  <option value="REGISTRATION_OPEN">{t('status.REGISTRATION_OPEN')}</option>
                  <option value="DRAW_PENDING">{t('status.DRAW_PENDING')}</option>
                  <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('form.venue')} *
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder={t('form.venuePlaceholder')}
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.startDate')} *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.endDate')} *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-billiard-border/60">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 border-b border-billiard-border pb-2">
              Reglamento y Contacto
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('form.description')}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('form.descriptionPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.contactPhone')}
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  {t('form.contactEmail')}
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="torneos@miclub.com"
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 rounded text-billiard-green bg-billiard-darker border-billiard-border focus:ring-billiard-green"
              />
              <label htmlFor="isPublic" className="text-xs text-gray-300 cursor-pointer">
                {t('form.isPublic')}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-billiard-border">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-billiard-darker hover:bg-billiard-felt text-gray-300 hover:text-white border border-billiard-border text-xs font-semibold transition-colors"
            >
              {t('form.cancel')}
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-billiard-green hover:bg-emerald-400 text-billiard-darker font-bold text-xs shadow-lg shadow-emerald-950/40 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? t('form.saving') : t('form.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
