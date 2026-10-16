import type { Metadata } from 'next';
import './globals.css';
import { ClientShell } from '../components/ClientShell';

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
      <body className="min-h-screen bg-slate-50">
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
