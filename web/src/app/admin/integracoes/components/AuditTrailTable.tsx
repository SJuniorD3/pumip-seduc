'use client';

import React from 'react';
import { History } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditTrailTableProps {
  auditLogs: AuditLogEntry[];
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({ auditLogs }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Trilha de Auditoria de Acesso e Modificações (Super Admin)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Registros imutáveis &bull; LGPD Art. 37
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <th className="py-2.5 px-3">Data/Hora</th>
              <th className="py-2.5 px-3">Responsável</th>
              <th className="py-2.5 px-3">Ação Registrada</th>
              <th className="py-2.5 px-3">Sistema</th>
              <th className="py-2.5 px-3">IP de Origem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 transition">
                <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                  {log.dataHora}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {log.usuarioNome}
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {log.acao}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    log.sistema === 'SEI' 
                      ? 'bg-blue-50 text-blue-800 border-blue-200' 
                      : log.sistema === 'STARTGOV'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : log.sistema === 'PNCP'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    {log.sistema}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                  {log.ipOrigem}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
