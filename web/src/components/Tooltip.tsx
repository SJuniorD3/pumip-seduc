'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delayMs?: number;
  interactive?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  delayMs = 150,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent border-4';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent border-4';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent border-4';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent border-4';
    }
  };

  // Extrai string se content for simples para acessibilidade nativa
  const plainTextContent = typeof content === 'string' ? content : undefined;

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      title={plainTextContent}
    >
      {children}
      {isVisible && content && (
        <span
          role="tooltip"
          className={`absolute ${getPositionClasses()} z-50 pointer-events-none whitespace-normal min-w-[160px] max-w-xs bg-slate-900 text-slate-100 text-[11px] leading-relaxed font-normal px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700/80 animate-fade-in`}
        >
          {content}
          <span className={`absolute ${getArrowClasses()}`} />
        </span>
      )}
    </span>
  );
};

/**
 * Componente semântico <abbr> para siglas e acrônimos do serviço público e da Lei 14.133/2021.
 * Exibe sublinhado pontilhado suave e balão orientador ao manter o mouse em cima.
 */
export interface AbbrProps {
  sigla: string;
  descricao?: string;
  className?: string;
}

export const DICIONARIO_SIGLAS: Record<string, string> = {
  PUMIP: 'Plataforma Unificada de Monitoramento e Inteligência Processual (SEDUC-MA)',
  SEDUC: 'Secretaria de Estado da Educação do Maranhão',
  'SEDUC-MA': 'Secretaria de Estado da Educação do Maranhão',
  SEI: 'Sistema Eletrônico de Informações do Governo do Estado do Maranhão',
  'SEI!': 'Sistema Eletrônico de Informações do Governo do Estado do Maranhão',
  'SEI-GOVMA': 'Sistema Eletrônico de Informações oficial do Estado do Maranhão',
  StartGov: 'Sistema Integrado de Gestão de Licitações e Compras Públicas',
  PNCP: 'Portal Nacional de Contratações Públicas (instituído pela Lei Federal nº 14.133/2021)',
  PCA: 'Plano de Contratações Anual (Art. 12 da Lei 14.133/2021 - Instrumento prévio de governança)',
  SLA: 'Service Level Agreement (Acordo de Nível de Serviço / Prazo Máximo Regulamentar de Permanência)',
  RLS: 'Row Level Security (Segurança em Nível de Linha / Controle de Acesso Restrito por Setor e Perfil)',
  STI: 'Superintendência de Tecnologia da Informação da SEDUC-MA',
  SUDES: 'Supervisão de Desenvolvimento e Manutenção de Sistemas (subordinada à STI)',
  SUPREDES: 'Supervisão de Redes, Infraestrutura e Conectividade Escolar',
  SUGEC: 'Supervisão de Gestão de Chamados e Suporte ao Usuário',
  SAAD: 'Secretaria Adjunta de Administração da SEDUC-MA',
  SAOFC: 'Secretaria Adjunta de Orçamento, Finanças e Contabilidade',
  SUBSEDUC: 'Subsecretaria de Educação do Maranhão',
  GAB: 'Gabinete do Secretário de Estado da Educação',
  ASJUR: 'Assessoria Jurídica da SEDUC-MA (análise de legalidade de editais, contratos e aditivos)',
  AJU: 'Assessoria Jurídica da SEDUC-MA',
  ASPLAN: 'Assessoria de Planejamento e Ações Estratégicas',
  CSL: 'Comissão Setorial de Licitação da SEDUC-MA',
  CPL: 'Comissão Permanente de Licitação',
  SUINFRA: 'Superintendência de Infraestrutura e Engenharia Escolar',
  SUPRI: 'Superintendência de Suprimento e Alimentação Escolar (Merenda)',
  SUPERLOG: 'Superintendência de Logística e Apoio Operacional',
  DFD: 'Documento de Formalização da Demanda (Ato inicial que oficializa a necessidade de compra)',
  ETP: 'Estudo Técnico Preliminar (Avaliação de viabilidade técnica, econômica e ambiental)',
  TR: 'Termo de Referência (Especificações técnicas do objeto, critérios e obrigações)',
  PB: 'Projeto Básico (Detalhamento técnico para obras e serviços comuns de engenharia)',
  PE: 'Pregão Eletrônico (Modalidade obrigatória para bens e serviços comuns)',
  'ICP-Brasil': 'Infraestrutura de Chaves Públicas Brasileira (Certificação digital com validade jurídica)',
  'A1': 'Certificado Digital A1 em arquivo criptográfico (PKCS#12 / .pfx) para autenticação institucional',
  'Delta Hash': 'Assinatura criptográfica SHA-256 para detecção em lote de alterações em processos e documentos',
  'Jitter': 'Intervalo randômico aplicado às consultas automatizadas para mitigar sobrecargas e bloqueios de IP',
  'Circuit Breaker': 'Padrão de resiliência que interrompe temporariamente requisições a serviços externos instáveis',
  'Inércia': 'Tempo decorrido em dias úteis que o processo permanece na mesma unidade sem movimentação física ou eletrônica'
};

export const Abbr: React.FC<AbbrProps> = ({ sigla, descricao, className = '' }) => {
  const explicacao = descricao || DICIONARIO_SIGLAS[sigla] || `Sigla institucional: ${sigla}`;

  return (
    <Tooltip
      content={
        <div className="space-y-0.5">
          <span className="font-bold text-blue-300 block">{sigla}</span>
          <span className="text-slate-200">{explicacao}</span>
        </div>
      }
      position="top"
    >
      <abbr
        title={`${sigla}: ${explicacao}`}
        className={`cursor-help font-semibold underline decoration-dotted decoration-slate-400/80 hover:decoration-blue-600 underline-offset-2 transition-colors ${className}`}
      >
        {sigla}
      </abbr>
    </Tooltip>
  );
};

/**
 * Ícone informativo para orientações contextuais ao lado de títulos, colunas ou campos.
 */
export interface InfoTooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  position = 'top',
  className = '',
  size = 'xs'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  }[size];

  return (
    <Tooltip content={content} position={position} className={className}>
      <span
        tabIndex={0}
        aria-label="Mais informações e orientação"
        className="inline-flex items-center justify-center p-0.5 text-slate-400 hover:text-blue-600 focus:text-blue-600 rounded transition cursor-help focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <HelpCircle className={sizeClasses} />
      </span>
    </Tooltip>
  );
};
