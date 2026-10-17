import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Erro 404 &bull; SEDUC-MA
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Página Não Encontrada
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            O recurso ou processo solicitado não foi localizado na base de dados ou você não possui autorização de visualização conforme a Regra de Não Ampliação de Acesso (RLS).
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Caso este seja um processo que deveria tramitar em sua unidade, consulte a Assessoria Jurídica (ASJUR) ou o Administrador de TI para concessão formal de acesso (RF02).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4" />
            <span>Painel Principal</span>
          </Link>
          <Link
            href="/processos"
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Carteira de Processos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
