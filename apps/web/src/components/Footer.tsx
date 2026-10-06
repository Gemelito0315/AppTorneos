'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n';
import { Trophy, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-billiard-border bg-billiard-darker/60 text-billiard-muted mt-20 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-2">
              <Trophy className="w-5 h-5 text-billiard-gold" />
              <span>BillarPro</span>
            </div>
            <p className="text-gray-400 text-xs max-w-sm">
              {t('app.description')}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-billiard-green" />
              <span>Transparencia y Criptografía</span>
            </h4>
            <p className="text-gray-400 text-xs">
              Algoritmos determinísticos con CSPRNG y verificación de semilla pública para sorteos 100% inalterables.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-billiard-gold" />
              <span>Arquitectura Multi-Club</span>
            </h4>
            <p className="text-gray-400 text-xs">
              Aislamiento estricto de datos por organización, soporte para torneos relámpago de club y abiertos nacionales.
            </p>
          </div>
        </div>

        <div className="border-t border-billiard-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500">
          <p>© 2026 BillarPro. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 font-mono">Fase 1 • Cimientos & Multi-Tenancy</p>
        </div>
      </div>
    </footer>
  );
};
