'use client';

import React, { useState } from 'react';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { AdminGuard } from '../../../components/AdminGuard';
import { mockProcessos, mockUnidades } from '../../../lib/mockData';
import { UserRole } from '../../../lib/types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Calendar, 
  FileCheck, 
  Trash2, 
  CheckCircle,
  Building,
  Search,
  Lock
} from 'lucide-react';

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cargo_titulo: string;
  unidadeSigla: string;
  ativo: boolean;
}

interface ConcessaoProcesso {
  id: string;
  processoId: string;
  protocoloSei: string;
  objeto: string;
  usuarioNome: string;
  usuarioEmail: string;
  motivo: string;
  dataConcessao: string;
  dataValidade?: string;
  ativo: boolean;
}

export default function AdminUsuariosPage() {
  const [activeTab, setActiveTab] = useState<'perfis' | 'processos'>('perfis');

  // Base inicial de usuários
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([
    {
      id: 'usr-1',
      nome: 'Jandira Dias Araújo Silva',
      email: 'secretaria@seduc.ma.gov.br',
      role: 'SECRETARIO',
      cargo_titulo: 'Secretária de Estado da Educação',
      unidadeSigla: 'SEDUC',
      ativo: true
    },
    {
      id: 'usr-2',
      nome: 'José Antônio Barros Heluy',
      email: 'subsecretario@seduc.ma.gov.br',
      role: 'SUBSECRETARIO',
      cargo_titulo: 'Subsecretário de Educação',
      unidadeSigla: 'SUBSEDUC',
      ativo: true
    },
    {
      id: 'usr-3',
      nome: 'Luzivete Botelho da Silva Rodrigues',
      email: 'saad@seduc.ma.gov.br',
      role: 'SECRETARIO_ADJUNTO',
      cargo_titulo: 'Secretária Adjunta de Administração',
      unidadeSigla: 'SAAD',
      ativo: true
    },
    {
      id: 'usr-4',
      nome: 'Roberto Max Louzeiro Pimentel',
      email: 'sti@seduc.ma.gov.br',
      role: 'SUPERINTENDENTE',
      cargo_titulo: 'Superintendente de Tecnologia da Informação',
      unidadeSigla: 'STI',
      ativo: true
    },
    {
      id: 'usr-5',
      nome: 'Sérvulo José Freire Junior',
      email: 'servulo.junior@seduc.ma.gov.br',
      role: 'SUPERVISOR',
      cargo_titulo: 'Supervisor de Desenvolvimento e Manutenção de Sistemas',
      unidadeSigla: 'SUDES',
      ativo: true
    },
    {
      id: 'usr-6',
      nome: 'Valter Pereira Veras Neto',
      email: 'asjur@seduc.ma.gov.br',
      role: 'ASSESSOR',
      cargo_titulo: 'Assessor Jurídico Chefe',
      unidadeSigla: 'ASJUR',
      ativo: true
    },
    {
      id: 'usr-7',
      nome: 'Igor Manuel Sousa Rocha',
      email: 'csl@seduc.ma.gov.br',
      role: 'ASSESSOR',
      cargo_titulo: 'Presidente da Comissão Setorial de Licitação',
      unidadeSigla: 'CSL',
      ativo: true
    }
  ]);

  // Base inicial de concessões pontuais de processos
  const [concessoes, setConcessoes] = useState<ConcessaoProcesso[]>([
    {
      id: 'conc-1',
      processoId: '10000000-0000-0000-0000-000000000002',
      protocoloSei: 'SEI-021001/007812/2026',
      objeto: 'Contratação de Serviços Especializados de Nuvem Governamental e Supabase',
      usuarioNome: 'Valter Pereira Veras Neto',
      usuarioEmail: 'asjur@seduc.ma.gov.br',
      motivo: 'Acompanhamento prioritário de parecer do Art. 53 por determinação do Gabinete',
      dataConcessao: '10/10/2026',
      dataValidade: '31/12/2026',
      ativo: true
    }
  ]);

  // Estado do formulário de concessão pontual
  const [selectedProcessoId, setSelectedProcessoId] = useState(mockProcessos[0].id);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState(usuarios[4].id);
  const [motivoConcessao, setMotivoConcessao] = useState('');
  const [validadeConcessao, setValidadeConcessao] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(false);

  const handleConcederAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoConcessao.trim()) return;

    const proc = mockProcessos.find((p) => p.id === selectedProcessoId) || mockProcessos[0];
    const usr = usuarios.find((u) => u.id === selectedUsuarioId) || usuarios[0];

    const nova: ConcessaoProcesso = {
      id: `conc-${Date.now()}`,
      processoId: proc.id,
      protocoloSei: proc.protocolo_sei,
      objeto: proc.objeto,
      usuarioNome: usr.nome,
      usuarioEmail: usr.email,
      motivo: motivoConcessao.trim(),
      dataConcessao: new Date().toLocaleDateString('pt-BR'),
      dataValidade: validadeConcessao || 'Indeterminado',
      ativo: true
    };

    setConcessoes([nova, ...concessoes]);
    setMotivoConcessao('');
    setValidadeConcessao('');
    setFeedbackMsg(true);
    setTimeout(() => setFeedbackMsg(false), 3000);
  };

  const handleRevogarConcessao = (id: string) => {
    setConcessoes(concessoes.filter((c) => c.id !== id));
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsuarios(usuarios.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  return (
    <AdminGuard moduloNome="Perfis de Acesso & Concessões">
      <div className="space-y-5 max-w-6xl">
        {/* Trilha de Navegação */}
        <Breadcrumb
          items={[
            { label: 'Administração', href: '/admin/organograma' },
            { label: 'Perfis & Acessos Pontuais', isCurrent: true }
          ]}
        />

      {/* Cabeçalho */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-blue-700" />
          <h1 className="text-xl font-bold text-slate-900">
            Perfis de Acesso & Concessão de Permissões Pontuais
          </h1>
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
            Acesso Restrito: ADMIN
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Gerenciamento exclusivo da equipe administrativa para atribuição de cargos funcionais e concessão de acesso a processos específicos fora da lotação de origem.
        </p>
      </div>

      {/* Abas de Navegação Administrativa */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('perfis')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'perfis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Perfis de Usuários e Cargos ({usuarios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('processos')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            activeTab === 'processos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Acesso Pontual a Processos Específicos ({concessoes.length})</span>
        </button>
      </div>

      {/* ABA 1: Perfis de Usuários e Cargos */}
      {activeTab === 'perfis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nome do Servidor</th>
                    <th className="py-3 px-4">Lotação Atual</th>
                    <th className="py-3 px-4">Cargo / Função</th>
                    <th className="py-3 px-4">Alçada no Sistema (Role)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usuarios.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{usr.nome}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{usr.email}</p>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                          {usr.unidadeSigla}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 max-w-xs truncate">
                        {usr.cargo_titulo}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={usr.role}
                          onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                          className="text-xs bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="SECRETARIO">Secretário(a)</option>
                          <option value="SUBSECRETARIO">Subsecretário(a)</option>
                          <option value="SECRETARIO_ADJUNTO">Secretário(a) Adjunto(a)</option>
                          <option value="SUPERINTENDENTE">Superintendente</option>
                          <option value="SUPERVISOR">Supervisor(a)</option>
                          <option value="ASSESSOR">Assessor(a)</option>
                          <option value="TECNICO">Técnico / Analista</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="AUDITOR">Auditor</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: Concessão Pontual de Acesso a Processos Específicos */}
      {activeTab === 'processos' && (
        <div className="space-y-6">
          {/* Formulário para Apontar Acesso a Processos */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Apontar Acesso Excepcional a Processo Específico</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite ao Administrador conceder permissão temporária de leitura e acompanhamento a um servidor que não pertença à unidade de origem do processo.
              </p>
            </div>

            <form onSubmit={handleConcederAcesso} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Selecione o Processo Administrativo:
                  </label>
                  <select
                    value={selectedProcessoId}
                    onChange={(e) => setSelectedProcessoId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {mockProcessos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.protocolo_sei} - {p.objeto.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Selecione o Servidor Beneficiário:
                  </label>
                  <select
                    value={selectedUsuarioId}
                    onChange={(e) => setSelectedUsuarioId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.cargo_titulo} - {u.unidadeSigla})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Motivo / Justificativa Administrativa:
                  </label>
                  <input
                    type="text"
                    required
                    value={motivoConcessao}
                    onChange={(e) => setMotivoConcessao(e.target.value)}
                    placeholder="Ex: Instrução de parecer conjunto / Substituição de férias / Comissão Especial"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Data de Término (Opcional):
                  </label>
                  <input
                    type="date"
                    value={validadeConcessao}
                    onChange={(e) => setValidadeConcessao(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {feedbackMsg ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Permissão pontual concedida com sucesso e registrada na auditoria!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    O acesso pontual não altera a propriedade do processo nem o organograma de origem.
                  </span>
                )}

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Conceder Acesso ao Processo
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Acessos Concedidos Ativos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Acessos Pontuais Concedidos pelo Administrador ({concessoes.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Processo Administrativo</th>
                    <th className="py-3 px-4">Servidor Autorizado</th>
                    <th className="py-3 px-4">Motivo / Fundamentação</th>
                    <th className="py-3 px-4">Vigência</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {concessoes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Nenhum acesso pontual concedido no momento.
                      </td>
                    </tr>
                  ) : (
                    concessoes.map((conc) => (
                      <tr key={conc.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <p className="font-bold text-blue-700 font-mono">{conc.protocoloSei}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{conc.objeto}</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{conc.usuarioNome}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{conc.usuarioEmail}</p>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700 max-w-xs">
                          {conc.motivo}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Até {conc.dataValidade}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRevogarConcessao(conc.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded transition"
                            title="Revogar Acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminGuard>
  );
}
