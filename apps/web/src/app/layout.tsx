import type { Metadata } from 'next';
import '../styles/globals.css';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth-context';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'BillarPro | Plataforma de Campeonatos de Billar',
  description:
    'Organización profesional de torneos de billar a 3 bandas, pool y libre. Sorteos transparentes verificables y resultados oficiales.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-billiard-dark text-gray-100 flex flex-col min-h-screen selection:bg-billiard-green selection:text-black">
        <I18nProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
