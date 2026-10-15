import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'PUMIP | Plataforma Unificada de Monitoramento Processual - SEDUC-MA',
  description: 'Monitoramento unificado de processos administrativos do SEI! e contratações do StartGov no Maranhão.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
