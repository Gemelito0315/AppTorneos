'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'IN_PROGRESS':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
      case 'DRAW_COMPLETED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'DRAW_PENDING':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'FINISHED':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'DRAFT':
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const label = t(`status.${status}`) || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};
