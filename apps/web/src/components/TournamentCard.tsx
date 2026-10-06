'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Building2, ChevronRight, Edit3, Trash2, Settings } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '../lib/i18n';

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    description?: string | null;
    venue: string;
    startDate: string;
    endDate: string;
    status: string;
    isPublic: boolean;
    modality?: {
      name: string;
      code: string;
    } | null;
    organization?: {
      name: string;
      slug: string;
      city?: string | null;
    } | null;
  };
  isOwner?: boolean;
  onDelete?: (id: string) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  isOwner = false,
  onDelete,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="group relative rounded-2xl bg-billiard-card border border-billiard-border hover:border-billiard-borderLight hover:bg-billiard-cardHover transition-all duration-300 p-5 flex flex-col justify-between shadow-lg hover:shadow-emerald-950/20">
      <div>
        {/* Encabezado: Modalidad y Estado */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-billiard-felt text-emerald-300 border border-billiard-green/30">
            {tournament.modality?.name || 'Billar'}
          </span>
          <StatusBadge status={tournament.status} />
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-white group-hover:text-billiard-green transition-colors line-clamp-2 mb-2">
          {tournament.name}
        </h3>

        {/* Descripción breve */}
        {tournament.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {tournament.description}
          </p>
        )}

        {/* Metadatos */}
        <div className="space-y-2 text-xs text-gray-300 mt-2 mb-5">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-billiard-gold flex-shrink-0" />
            <span>
              {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{tournament.venue}</span>
          </div>

          {tournament.organization && (
            <div className="flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-billiard-muted flex-shrink-0" />
              <span className="truncate font-medium text-gray-200">
                {tournament.organization.name}
                {tournament.organization.city ? ` (${tournament.organization.city})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer y Acciones */}
      <div className="pt-4 border-t border-billiard-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-billiard-green/15 hover:bg-billiard-green text-emerald-300 hover:text-billiard-darker border border-billiard-green/40 text-xs font-bold transition-all shadow-sm group-hover:scale-105"
          >
            <span>Ver Torneo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          {isOwner && (
            <div className="flex items-center space-x-2">
              <Link
                href={`/dashboard/tournaments/${tournament.id}/edit`}
                className="p-1.5 rounded-lg bg-billiard-card hover:bg-billiard-felt text-gray-300 hover:text-white border border-billiard-border transition-colors"
                title={t('dashboard.edit')}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
              {onDelete && (
                <button
                  onClick={() => onDelete(tournament.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                  title={t('dashboard.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <Link
            href={`/dashboard/tournaments/${tournament.id}`}
            className="flex items-center justify-center space-x-2 w-full px-3.5 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-600/30 text-xs font-bold transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gestionar: Partidas · Inscritos · Resultados</span>
          </Link>
        )}
      </div>
    </div>
  );
};
