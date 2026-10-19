'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS } from '../../lib/authContext';
import { isDemoMode } from '../../lib/appMode';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  UserCheck, 
  Sparkles,
  Fingerprint,
  ExternalLink,
  Info,
  X
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAs } = useAuth();

  const [email, setEmail] = useState(isDemoMode() ? 'supervisor.sudes@seduc.ma.gov.br' : '');
  const [password, setPassword] = useState(isDemoMode() ? '••••••••••••' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'SEDUC' | 'GOVBR'>('SEDUC');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu e-mail funcional.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const ok = await login(email, password);
      if (ok) {
        router.push('/');
      } else {
        setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha institucional.');
      }
    } catch (err) {
      setErrorMsg('Ocorreu uma falha na comunicação com o servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGovBrLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await login('supervisor.sudes@seduc.ma.gov.br');
      router.push('/');
    } else {
      setErrorMsg('O login unificado Gov.br em ambiente de produção requer habilitação do provedor OIDC junto à STI / COGETIC.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-700/40">
        
        {/* Painel Esquerdo: Identidade Visual Institucional SEDUC-MA */}
        <div className="lg:w-5/12 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Efeitos de Luz e Textura de Fundo */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Topo: Logo Oficial e Governo do Maranhão */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white/10">
                P
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-tight text-white">PUMIP</span>
                  <span className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full font-bold">
                    SEDUC-MA
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Governo do Estado do Maranhão
                </p>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Plataforma Unificada de Monitoramento e Inteligência Processual
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Sistema corporativo de governança e rastreamento de fluxos processuais do SEI GOVMA, 
              contratações do StartGov e cumprimento da Lei nº 14.133/2021.
            </p>
          </div>

          {/* Meio: Pilares de Segurança Governamental */}
          <div className="relative z-10 my-8 space-y-3.5 border-t border-b border-white/10 py-5 text-xs text-slate-200">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Segurança RLS Hierárquica</strong>
                <span className="text-slate-300 text-xs">
                  Regra de não ampliação de acesso conforme o organograma oficial da SEDUC-MA.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Interoperabilidade em Tempo Real</strong>
                <span className="text-slate-300 text-xs">
                  Cruzamento automático entre despachos no SEI, lances no StartGov e contratos do PNCP.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Conformidade Legal & LGPD</strong>
                <span className="text-slate-300 text-xs">
                  Rastreabilidade ponta a ponta e auditabilidade estrita segundo a LAI e a LGPD.
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé Institucional */}
          <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
            <span>Secretaria de Estado da Educação</span>
            <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs text-slate-300">
              v2.0 Oficial
            </span>
          </div>
        </div>

        {/* Painel Direito: Formulário de Autenticação */}
        <div className="lg:w-7/12 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/50">
          <div>
            {/* Cabeçalho do Formulário */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  Acesso ao Sistema
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
                  Terminal Autenticado
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Autentique-se com sua identidade funcional para acessar a carteira de processos do seu setor.
              </p>
            </div>

            {/* Alternador de Método de Acesso */}
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLoginMethod('SEDUC')}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'SEDUC'
                    ? 'bg-white text-blue-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Conta Institucional SEDUC</span>
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('GOVBR')}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'GOVBR'
                    ? 'bg-white text-blue-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-700 via-yellow-500 to-green-600 shrink-0" />
                <span>Gov.br / Certificado</span>
              </button>
            </div>

            {/* Método 1: E-mail Institucional SEDUC */}
            {loginMethod === 'SEDUC' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo de E-mail */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                    E-mail Institucional (@seduc.ma.gov.br)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.nome@seduc.ma.gov.br"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Campo de Senha */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                      Senha de Rede / SEI
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-blue-600 hover:underline hover:text-blue-800"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder:text-slate-400 font-medium text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded focus-visible:ring-2 focus-visible:ring-blue-600"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                      aria-label={showPassword ? 'Ocultar senha digitada' : 'Exibir senha digitada'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Lembrar e Segurança */}
                <div className="flex items-center justify-between pt-1">
                  <label htmlFor="login-remember-me" className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      id="login-remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium">Lembrar neste computador</span>
                  </label>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Sessão Criptografada
                  </span>
                </div>

                {/* Mensagem de Erro (se houver) */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Botão de Entrar */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Autenticando no SEI e Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no PUMIP-SEDUC</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Método 2: Autenticação Gov.br / Certificado Digital */
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Fingerprint className="w-7 h-7 text-blue-700" />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Acesso com Conta Gov.br ou Certificado Digital
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Utilize o login unificado do Governo Federal (Prata ou Ouro) ou seu certificado digital ICP-Brasil (Token A3 ou Nuvem).
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGovBrLogin}
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-500 via-yellow-400 to-green-500 shrink-0" />
                        <span>Entrar com Gov.br / Certificado</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 italic">
                  O perfil e as permissões de acesso serão vinculados automaticamente ao seu CPF cadastrado na SEDUC.
                </p>
              </div>
            )}

            {/* Painel de Avaliação Rápida de Perfis (Apenas em Modo Demonstração) */}
            {isDemoMode() && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Acesso Rápido para Avaliação de Perfis (1-Clique)</span>
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.2 rounded font-semibold border border-blue-200">
                    Demonstração RLS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                  {/* 1. Supervisor SUDES */}
                  <button
                    type="button"
                    onClick={() => loginAs('servulo')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-left group"
                    title="Supervisor de Desenvolvimento (SUDES)"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      Supervisor SUDES
                    </p>
                    <p className="text-xs text-slate-500 truncate">SUDES / STI</p>
                    <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      SUPERVISOR
                    </span>
                  </button>

                  {/* 2. Superintendente STI */}
                  <button
                    type="button"
                    onClick={() => loginAs('natalia')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-left group"
                    title="Superintendente de Informática (STI)"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      Superintendente STI
                    </p>
                    <p className="text-xs text-slate-500 truncate">Superintendente STI</p>
                    <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      SUPERINTENDENTE
                    </span>
                  </button>

                  {/* 3. Assessor Jurídico (ASJUR) */}
                  <button
                    type="button"
                    onClick={() => loginAs('valter')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-left group"
                    title="Assessor Jurídico Chefe (ASJUR)"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      Assessor ASJUR
                    </p>
                    <p className="text-xs text-slate-500 truncate">Assessor ASJUR</p>
                    <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      ASSESSOR
                    </span>
                  </button>

                  {/* 4. Secretário de Educação */}
                  <button
                    type="button"
                    onClick={() => loginAs('secretario')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-left group"
                    title="Secretário de Estado da Educação"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      Sec. de Educação
                    </p>
                    <p className="text-xs text-slate-500 truncate">Gabinete SEDUC</p>
                    <span className="text-[9px] text-amber-800 font-semibold bg-amber-50 px-1 py-0.2 rounded mt-1 inline-block">
                      SECRETARIO
                    </span>
                  </button>

                  {/* 5. Administrador do Sistema */}
                  <button
                    type="button"
                    onClick={() => loginAs('admin')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-left group col-span-2 sm:col-span-1"
                    title="Administrador Geral com acesso às telas restritas"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                      Administrador TI
                    </p>
                    <p className="text-xs text-slate-500 truncate">Gestão & Acessos</p>
                    <span className="text-[9px] text-red-700 font-bold bg-red-50 px-1 py-0.2 rounded mt-1 inline-block">
                      ADMIN TOTAL
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé de Auditoria e Aviso Legal */}
          <div className="pt-6 mt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Conforme a Lei nº 12.527/2011 (LAI) e Lei nº 13.709/2018 (LGPD).
            </span>
            <span className="text-slate-400">
              IP registrado para fins de auditoria forense.
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Esqueceu a Senha / Suporte STI */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <Building2 className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                Redefinição de Senha Institucional
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A autenticação do PUMIP é integrada aos diretórios de rede da 
              <strong> Secretaria de Estado da Educação (SEDUC-MA)</strong>.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 mb-4">
              <p>
                <strong>Para redefinir sua credencial:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Utilize o portal de autosserviço de senha do Governo do Estado.</li>
                <li>Ou entre em contato com a <strong>Superintendência de TI (STI / COGETIC)</strong>.</li>
                <li>Ramais internos: <strong>4100 / 4105</strong>.</li>
                <li>E-mail de suporte: <strong>suporte.ti@seduc.ma.gov.br</strong>.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
