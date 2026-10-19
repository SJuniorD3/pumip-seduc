'use client';

import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { Abbr, InfoTooltip } from '../../../../components/Tooltip';
import { IntegracaoConfig } from '../types';

interface MtlsAlertBannerProps {
  config: IntegracaoConfig;
  setConfig: React.Dispatch<React.SetStateAction<IntegracaoConfig>>;
}

export const MtlsAlertBanner: React.FC<MtlsAlertBannerProps> = ({ config, setConfig }) => {
  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-md border border-amber-300">
                Modo de Transição / Homologação Ativo
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Sistema 100% Operacional sem Certificado
              </span>
            </div>
            <h2 className="text-sm font-bold text-amber-950 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Urgência Institucional: Solicitação de Certificado Digital</span>
              <Abbr sigla="ICP-Brasil" />
              <Abbr sigla="A1" />
              <span>(e-CNPJ <Abbr sigla="SEDUC" />)</span>
              <InfoTooltip content="Certificado institucional em arquivo PKCS#12 (.pfx) emitido para o CNPJ da SEDUC-MA, indispensável em produção para mTLS e acesso irrestrito contra bloqueios WAF." />
            </h2>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <label className="text-xs font-semibold text-amber-900 flex items-center gap-2 cursor-pointer bg-white/70 px-3 py-1.5 rounded-lg border border-amber-300">
            <input
              type="checkbox"
              checked={config.certificadoDigital.habilitado}
              onChange={(e) => setConfig({
                ...config,
                certificadoDigital: { ...config.certificadoDigital, habilitado: e.target.checked }
              })}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span>Habilitar Modo mTLS com Certificado A1</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs text-amber-900">
        <div className="lg:col-span-2 space-y-2">
          <p className="leading-relaxed">
            <strong>Status Atual:</strong> O PUMIP está funcionando perfeitamente utilizando autenticação por 
            <strong> Conta de Serviço institucional (*Service Account*)</strong> com usuário e senha do SEI!, 
            garantindo que todas as validações, testes de homologação e cadastros operem sem nenhum bloqueio.
          </p>
          <p className="leading-relaxed text-amber-800/90 text-[11px]">
            <strong>Alerta para Produção Definitiva:</strong> Para o ambiente oficial no datacenter do Governo do Maranhão (ATI-MA), 
            é <strong>urgente</strong> que a chefia administrativa solicite junto à autoridade certificadora o 
            <strong> Certificado Digital A1 da SEDUC-MA (e-CNPJ 06.354.468/0001-30)</strong>. Isso garantirá autenticação mútua TLS (mTLS), 
            imunidade a bloqueios por WAF e conformidade com o Decreto Estadual de Segurança da Informação.
          </p>
        </div>

        <div className="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-bold text-amber-950">
            <span>Configuração do Certificado:</span>
            <span className={config.certificadoDigital.habilitado ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
              {config.certificadoDigital.habilitado ? 'ATIVO' : 'OPCIONAL (DESATIVADO)'}
            </span>
          </div>
          <div className="space-y-1 text-slate-600">
            <p><strong>Emissor:</strong> {config.certificadoDigital.emissor}</p>
            <p><strong>Validade Prevista:</strong> Até {config.certificadoDigital.dataValidade}</p>
            <p><strong>Arquivo Suportado:</strong> .PFX / .P12 (PKCS#12)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
