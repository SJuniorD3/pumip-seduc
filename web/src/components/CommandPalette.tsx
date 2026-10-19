'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockProcessos } from '../lib/mockData';
import { Processo } from '../lib/types';
import { filterProcessosByRLS } from '../lib/rlsFilter';
import { useAuth } from '../lib/authContext';
import { 
  Search, 
  Command, 
  ArrowRight, 
  Building, 
  Clock, 
  FileText,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Listener para ESC fechar a busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // REMEDIAÇÃO P0-5: Aplica filtro RLS na busca global
  const processosAutorizados = filterProcessosByRLS(mockProcessos, user);
  const filtered = query.trim() === '' 
    ? processosAutorizados.slice(0, 4) 
    : processosAutorizados.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.protocolo_sei.toLowerCase().includes(q) ||
          (p.protocolo_startgov && p.protocolo_startgov.toLowerCase().includes(q)) ||
          p.objeto.toLowerCase().includes(q) ||
          p.unidade_atual_sei.toLowerCase().includes(q) ||
          (p.unidade_origem && p.unidade_origem.sigla.toLowerCase().includes(q))
        );
      });

  const handleSelect = (id: string) => {
    onClose();
    router.push(`/processos/${id}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Entrada de Busca */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número do SEI, StartGov, objeto ou setor (ex: switches, CSL, 004521)..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm text-slate-500">
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {query.trim() === '' ? 'Processos Recentes' : `Resultados (${filtered.length})`}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Nenhum processo localizado para "{query}".
            </div>
          ) : (
            filtered.map((proc) => (
              <div
                key={proc.id}
                onClick={() => handleSelect(proc.id)}
                className="p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {proc.protocolo_sei}
                    </span>
                    {proc.protocolo_startgov && (
                      <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {proc.protocolo_startgov}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {proc.unidade_atual_sei}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-900 line-clamp-1">
                    {proc.objeto}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {proc.dias_parado_na_unidade}d parado
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 flex items-center justify-center text-slate-400 transition">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé da Busca */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>Dica: Use</span>
            <kbd className="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-300 text-[10px]">Cmd + K</kbd>
            <span>em qualquer tela para abrir a busca</span>
          </span>
          <span className="text-blue-700 font-semibold">PUMIP-SEDUC</span>
        </div>
      </div>
    </div>
  );
};
