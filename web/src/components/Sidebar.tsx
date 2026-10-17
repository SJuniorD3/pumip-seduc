'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  BellRing, 
  FileSearch, 
  Server, 
  Network, 
  Users, 
  GitMerge, 
  ClipboardList, 
  BarChart3, 
  Calendar, 
  X, 
  LogOut, 
  ShieldCheck, 
  KeyRound,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  FolderLock
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 1. Estado de Recolhimento Global da Sidebar (Modo Compacto / Clean)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 2. Estados de Supressão por Seção (Acordeões Recolhíveis)
  const [sectionOperacaoOpen, setSectionOperacaoOpen] = useState(true);
  const [sectionAdminOpen, setSectionAdminOpen] = useState(true);
  const [sectionFontesOpen, setSectionFontesOpen] = useState(true);

  // Carrega preferência persistida do usuário
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pumip_sidebar_collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    } catch {
      // Falha silenciosa em ambientes sem localStorage
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('pumip_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { 
      label: 'Visão Geral', 
      href: '/', 
      icon: LayoutDashboard,
      descricao: 'Visão Geral: Painel executivo da SEDUC, semáforos de inércia e gráficos analíticos por setor'
    },
    { 
      label: 'Processos Monitorados', 
      href: '/processos', 
      icon: FileSearch,
      descricao: 'Processos Monitorados: Carteira completa com busca textual, filtros de SLA e exportação para Excel/PDF'
    },
    { 
      label: 'Quadro Kanban', 
      href: '/kanban', 
      icon: KanbanSquare,
      descricao: 'Quadro Kanban: Gestão visual de fluxo de processos pelas etapas da Lei 14.133/2021'
    },
    { 
      label: 'Vínculos SEI/StartGov', 
      href: '/vinculos', 
      icon: GitMerge,
      descricao: 'Vínculos SEI ↔ StartGov: Validação humana obrigatória de correspondência entre processos e certames (RF16)'
    },
    { 
      label: 'Plano Anual (PCA)', 
      href: '/pca', 
      icon: ClipboardList,
      descricao: 'Plano de Contratações Anual (PCA): Monitoramento da execução do planejamento anual da SEDUC-MA (Art. 12 Lei 14.133/2021)'
    },
    { 
      label: 'Relatórios & Prazos', 
      href: '/relatorios', 
      icon: BarChart3,
      descricao: 'Relatórios & Prazos: Métricas de permanência, inércia processual e relatórios estruturados para CGE e TCE-MA'
    },
    { 
      label: 'Central de Alertas', 
      href: '/alertas', 
      icon: BellRing,
      descricao: 'Central de Alertas: Vigilância automática 24/7 de prazos legais, inércia, diligências e publicidade no PNCP'
    },
  ];

  const adminItems = [
    { 
      label: 'Organograma Setorial', 
      href: '/admin/organograma', 
      icon: Network,
      descricao: 'Organograma Setorial: Gestão da árvore hierárquica e unidades organizacionais da SEDUC-MA'
    },
    { 
      label: 'Perfis & Acessos', 
      href: '/admin/usuarios', 
      icon: Users,
      descricao: 'Perfis & Acessos: Controle de operadores, concessões pontuais e regras de segurança RLS (Row Level Security)'
    },
    { 
      label: 'Feriados & Prazos', 
      href: '/admin/feriados', 
      icon: Calendar,
      descricao: 'Feriados & Prazos: Calendário de dias úteis com feriados de São Luís e do Maranhão (Art. 183 Lei 14.133/2021)'
    },
    { 
      label: 'Credenciais & APIs', 
      href: '/admin/integracoes', 
      icon: KeyRound,
      descricao: 'Credenciais & APIs: Cofre de segredos e conectores automáticos do SEI-GOVMA, StartGov e PNCP Federal'
    },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="p-3 space-y-3 overflow-y-auto overflow-x-hidden">
        {/* Cabeçalho do Drawer no Mobile com Botão Fechar */}
        <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-white text-sm">Menu de Navegação</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botão de Alternância de Recolhimento da Sidebar no Desktop */}
        <div className="hidden lg:flex items-center justify-between pb-2 border-b border-slate-800/80">
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Menu Principal
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expandir Menu Lateral (Shift + S)' : 'Recolher Menu Lateral (Modo Clean)'}
            aria-label={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-400 hover:text-blue-300" />
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-[11px]">Recolher</span>
              </div>
            )}
          </button>
        </div>

        {/* Card do Usuário Logado na Sidebar */}
        <div className={`bg-slate-800/80 rounded-xl border border-slate-700/60 transition-all ${
          isCollapsed ? 'p-1.5 flex flex-col items-center gap-1.5' : 'p-2.5 flex items-center justify-between gap-2'
        }`}>
          <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
            <div 
              className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
              title={`${user.nome} (${user.cargo_titulo}) - ${user.unidade_sigla}`}
            >
              {user.avatar_iniciais || 'SJ'}
            </div>
            
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.nome}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {user.unidade_sigla} &bull; {user.role}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              handleLinkClick();
              logout();
            }}
            className={`text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition shrink-0 ${
              isCollapsed ? 'p-1' : 'p-1.5'
            }`}
            title="Sair da conta"
            aria-label="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 1: OPERAÇÃO & INTELIGÊNCIA (COM OPÇÃO DE SUPRIMIR/ACORDEÃO) */}
        {/* ============================================================== */}
        <div>
          <button
            type="button"
            onClick={() => setSectionOperacaoOpen(prev => !prev)}
            className={`w-full flex items-center justify-between text-slate-400 hover:text-white px-2 py-1 rounded-md transition text-[11px] uppercase tracking-wider font-bold mb-1 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={sectionOperacaoOpen ? 'Suprimir seção de Operação' : 'Expandir seção de Operação'}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span>Operação & Inteligência</span>
              </div>
            )}
            {!isCollapsed && (
              sectionOperacaoOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )
            )}
          </button>

          {/* Links Operacionais (Suprimíveis pelo botão da seção) */}
          {sectionOperacaoOpen && (
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    title={item.descricao || item.label}
                    className={`flex items-center rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isCollapsed 
                        ? 'justify-center p-2.5' 
                        : 'space-x-2.5 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                        : 'hover:bg-slate-800 hover:text-white text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* ============================================================== */}
        {/* SEÇÃO 2: ADMINISTRAÇÃO RESTRITA                                 */}
        {/* REGRA: QUANDO O PERFIL NÃO É ADMIN, SEMPRE SUPRIMIDO (NULL)!    */}
        {/* QUANDO É ADMIN, DISPONÍVEL COM OPÇÃO DE SUPRIMIR / ACORDEÃO!    */}
        {/* ============================================================== */}
        {user.isAdmin && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setSectionAdminOpen(prev => !prev)}
              className={`w-full flex items-center justify-between text-slate-400 hover:text-white px-2 py-1 rounded-md transition text-[11px] uppercase tracking-wider font-bold mb-1 ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={sectionAdminOpen ? 'Suprimir seção de Administração' : 'Expandir seção de Administração'}
            >
              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  <span>Administração</span>
                  <span className="text-[9px] bg-red-950 text-red-300 border border-red-800 px-1 py-0.2 rounded font-bold">
                    ADMIN
                  </span>
                </div>
              )}
              {!isCollapsed && (
                sectionAdminOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )
              )}
              {isCollapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              )}
            </button>

            {/* Links Administrativos (Exibidos apenas para Admin e quando a seção não está suprimida) */}
            {sectionAdminOpen && (
              <nav className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      title={item.descricao || item.label}
                      className={`flex items-center rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isCollapsed 
                          ? 'justify-center p-2.5' 
                          : 'space-x-2.5 px-3 py-2'
                      } ${
                        isActive
                          ? 'bg-slate-800 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5'
                          : 'hover:bg-slate-800 hover:text-white text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SEÇÃO 3: STATUS DAS FONTES INTEGRADAS (COM OPÇÃO DE SUPRIMIR)  */}
        {/* ============================================================== */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSectionFontesOpen(prev => !prev)}
            className={`w-full flex items-center justify-between text-slate-400 hover:text-white px-2 py-1 rounded-md transition text-[11px] uppercase tracking-wider font-bold mb-1 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={sectionFontesOpen ? 'Suprimir fontes integradas' : 'Expandir fontes integradas'}
          >
            {!isCollapsed && <span>Fontes Integradas</span>}
            {!isCollapsed && (
              sectionFontesOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )
            )}
            {isCollapsed && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            )}
          </button>

          {sectionFontesOpen && (
            <div className={`space-y-1.5 ${isCollapsed ? 'flex flex-col items-center py-1' : 'px-1 text-xs'}`}>
              {/* SEI! GOVMA */}
              <div 
                className={`flex items-center text-slate-300 bg-slate-800/70 hover:bg-slate-800 rounded-lg transition border border-slate-700/50 ${
                  isCollapsed ? 'p-2 justify-center' : 'justify-between p-2'
                }`}
                title="SEI! GOVMA • Última sincronização: Hoje às 14:00 (Consulta ativa)"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-200">SEI! GOVMA</span>
                        <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-medium border border-blue-700/50">
                          Consulta
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">Hoje às 14:00</p>
                    </div>
                  )}
                </div>
              </div>

              {/* StartGov */}
              <div 
                className={`flex items-center text-slate-300 bg-slate-800/70 hover:bg-slate-800 rounded-lg transition border border-slate-700/50 ${
                  isCollapsed ? 'p-2 justify-center' : 'justify-between p-2'
                }`}
                title="StartGov Licitações • Última sincronização: Hoje às 13:45 (API ativa)"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-200">StartGov</span>
                        <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-medium border border-emerald-700/50">
                          API
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">Hoje às 13:45</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PNCP Federal */}
              <div 
                className={`flex items-center text-slate-300 bg-slate-800/70 hover:bg-slate-800 rounded-lg transition border border-slate-700/50 ${
                  isCollapsed ? 'p-2 justify-center' : 'justify-between p-2'
                }`}
                title="PNCP Federal • Última sincronização: Hoje às 12:30 (Lei 14.133/2021)"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-200">PNCP Federal</span>
                        <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded font-medium border border-amber-700/50">
                          Lei 14.133
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">Hoje às 12:30</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé da Sidebar com Botão de Modo Clean / Expandir */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-xs shrink-0">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-200 text-[11px]">SEDUC-MA &bull; PUMIP</span>
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                title="Ativar modo limpo de tela cheia"
              >
                Clean Mode
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Monitoramento Unificado de Processos e Inteligência.
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Expandir Menu Lateral"
              aria-label="Expandir Menu"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Versão Desktop: Largura Dinâmica (w-64 quando expandido, w-20 quando recolhido) */}
      <aside 
        className={`hidden lg:flex bg-slate-900 text-slate-300 flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Versão Mobile/Tablet (Off-canvas Drawer deslizante com Backdrop) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
