'use client';

import React, { useState } from 'react';
import { mockUnidades } from '../../../lib/mockData';
import { UnidadeOrganizacional, TipoUnidade } from '../../../lib/types';
import { 
  Network, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  ShieldAlert, 
  CheckCircle, 
  Edit3, 
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function AdminOrganogramaPage() {
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>(mockUnidades);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formulário de nova unidade
  const [novaNome, setNovaNome] = useState('');
  const [novaSigla, setNovaSigla] = useState('');
  const [novaTipo, setNovaTipo] = useState<TipoUnidade>('SUPERVISAO');
  const [novaParentId, setNovaParentId] = useState('5'); // Default: STI
  const [novaTitular, setNovaTitular] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState(false);

  const filteredUnidades = unidades.filter((u) => {
    const matchesSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.titular_nome && u.titular_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.caminho_hierarquico.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = tipoFiltro === 'TODOS' || u.tipo === tipoFiltro;

    return matchesSearch && matchesTipo;
  });

  const handleAddUnidade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNome || !novaSigla) return;

    const parent = unidades.find((u) => u.id === novaParentId);
    const caminho = parent ? `${parent.caminho_hierarquico}.${novaSigla.toUpperCase()}` : novaSigla.toUpperCase();

    const nova: UnidadeOrganizacional = {
      id: `unit-${Date.now()}`,
      nome: novaNome,
      sigla: novaSigla.toUpperCase(),
      tipo: novaTipo,
      parent_id: parent ? parent.id : null,
      caminho_hierarquico: caminho,
      titular_nome: novaTitular || 'A designar'
    };

    setUnidades([...unidades, nova]);
    setNovaNome('');
    setNovaSigla('');
    setNovaTitular('');
    setShowAddModal(false);
    setSucessoMsg(true);
    setTimeout(() => setSucessoMsg(false), 3000);
  };

  const getTipoBadge = (tipo: TipoUnidade) => {
    switch (tipo) {
      case 'SECRETARIA':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'SUBSECRETARIA':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'SECRETARIA_ADJUNTA':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'SUPERINTENDENCIA':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'SUPERVISAO':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'ASSESSORIA':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'COMISSAO':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Cabeçalho Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Gestão do Organograma e Estrutura Setorial (SEDUC-MA)
            </h1>
            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
              Acesso Restrito: ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Módulo exclusivo da equipe administrativa para cadastro, ajuste de hierarquia e atualização de titulares dos setores.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Unidade / Setor</span>
        </button>
      </div>

      {/* Aviso de Governança */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Aviso de Controle e Versionamento Temporal:</span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Alterações na árvore hierárquica impactam imediatamente o cálculo de permissões de <strong>Row Level Security (RLS)</strong> no banco de dados. 
            Conforme a Seção 3 do Descritivo Técnico, o histórico de lotações anteriores permanece preservado para relatórios retroativos.
          </p>
        </div>
      </div>

      {sucessoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Unidade cadastrada com sucesso! Caminho hierárquico computado automaticamente.</span>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, sigla, titular ou caminho..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">Nível:</span>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="SECRETARIA">Secretaria Central</option>
            <option value="SUBSECRETARIA">Subsecretaria</option>
            <option value="SECRETARIA_ADJUNTA">Secretarias Adjuntas</option>
            <option value="SUPERINTENDENCIA">Superintendências</option>
            <option value="SUPERVISAO">Supervisões</option>
            <option value="ASSESSORIA">Assessorias</option>
            <option value="COMISSAO">Comissões</option>
          </select>
        </div>
      </div>

      {/* Tabela de Unidades do Organograma */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sigla / Nível</th>
                <th className="py-3 px-4">Nome da Unidade</th>
                <th className="py-3 px-4">Caminho Hierárquico (ltree)</th>
                <th className="py-3 px-4">Titular Atual</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUnidades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nenhuma unidade localizada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredUnidades.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.sigla}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getTipoBadge(u.tipo)}`}>
                          {u.tipo.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      {u.nome}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-blue-700 bg-blue-50/50">
                      {u.caminho_hierarquico}
                    </td>

                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {u.titular_nome || 'Não informado'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded transition"
                        title="Editar Unidade"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação de Unidade */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Cadastrar Nova Unidade Setorial
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUnidade} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nome por Extenso da Unidade:
                </label>
                <input
                  type="text"
                  required
                  value={novaNome}
                  onChange={(e) => setNovaNome(e.target.value)}
                  placeholder="Ex: Supervisão de Inteligência de Dados"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Sigla Oficial:
                  </label>
                  <input
                    type="text"
                    required
                    value={novaSigla}
                    onChange={(e) => setNovaSigla(e.target.value)}
                    placeholder="Ex: SUID"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nível / Tipo:
                  </label>
                  <select
                    value={novaTipo}
                    onChange={(e) => setNovaTipo(e.target.value as TipoUnidade)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="SUPERVISAO">Supervisão</option>
                    <option value="SUPERINTENDENCIA">Superintendência</option>
                    <option value="ASSESSORIA">Assessoria</option>
                    <option value="COMISSAO">Comissão</option>
                    <option value="SETOR">Setor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Unidade Imediata Superior (Parent):
                </label>
                <select
                  value={novaParentId}
                  onChange={(e) => setNovaParentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
                >
                  {unidades
                    .filter((u) => ['SECRETARIA', 'SECRETARIA_ADJUNTA', 'SUPERINTENDENCIA'].includes(u.tipo))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sigla} - {p.nome}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nome do Titular Responsável:
                </label>
                <input
                  type="text"
                  value={novaTitular}
                  onChange={(e) => setNovaTitular(e.target.value)}
                  placeholder="Nome do servidor titular"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
