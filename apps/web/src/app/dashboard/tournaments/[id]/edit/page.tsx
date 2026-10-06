'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '../../../../../lib/i18n';
import { useAuth } from '../../../../../lib/auth-context';
import { apiRequest } from '../../../../../lib/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function EditTournamentPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.id as string;

  const [modalities, setModalities] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [tourData, modData] = await Promise.all([
          apiRequest<any>(`/tournaments/${tournamentId}`),
          apiRequest<any[]>('/modalities'),
        ]);

        setModalities(modData || []);

        // Convertir fechas a formato datetime-local
        const formatForInput = (dStr: string) => {
          if (!dStr) return '';
          const d = new Date(dStr);
          return d.toISOString().slice(0, 16);
        };

        setFormData({
          name: tourData.name,
          description: tourData.description || '',
          venue: tourData.venue,
          startDate: formatForInput(tourData.startDate),
          endDate: formatForInput(tourData.endDate),
          modalityId: tourData.modalityId,
          status: tourData.status,
          isPublic: tourData.isPublic,
          contactPhone: tourData.contactPhone || '',
          contactEmail: tourData.contactEmail || '',
        });
      } catch (err: any) {
        setError(err.message || 'Error cargando torneo');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && tournamentId) {
      loadData();
    }
  }, [authLoading, user, tournamentId, router]);

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

      await apiRequest(`/tournaments/${tournamentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error actualizando el torneo');
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-billiard-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            {t('dashboard.edit')}: {formData.name}
          </h1>
          <p className="text-xs text-gray-400">Modifica los detalles del torneo de tu club</p>
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
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('form.name')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
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
                  <option value="DRAW_COMPLETED">{t('status.DRAW_COMPLETED')}</option>
                  <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
                  <option value="FINISHED">{t('status.FINISHED')}</option>
                  <option value="CANCELLED">{t('status.CANCELLED')}</option>
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
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
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
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t('form.description')}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-billiard-darker border border-billiard-border rounded-xl text-sm text-white focus:outline-none focus:border-billiard-green transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="isPublicEdit"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 rounded text-billiard-green bg-billiard-darker border-billiard-border focus:ring-billiard-green"
              />
              <label htmlFor="isPublicEdit" className="text-xs text-gray-300 cursor-pointer">
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
