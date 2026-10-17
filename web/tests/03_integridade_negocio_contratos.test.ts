import test, { describe } from 'node:test';
import assert from 'node:assert';
import { mockProcessos } from '../src/lib/mockData';
import { Processo } from '../src/lib/types';

describe('Integridade de Negócio, Regras Contratuais e IA (RF11, RF14, RF16, RF20)', () => {
  test('Padrão e Regex de Protocolos do SEI! da SEDUC-MA', () => {
    // Padrão oficial do SEI do Maranhão: SEI-Órgão/Sequencial/Ano (ex: SEI-021001/004521/2026)
    const seiProtocolRegex = /^SEI-\d{6}\/\d{6}\/\d{4}$/;

    mockProcessos.forEach(p => {
      assert.ok(
        seiProtocolRegex.test(p.protocolo_sei),
        `Protocolo SEI inválido: ${p.protocolo_sei} no processo ID ${p.id}`
      );
    });
  });

  test('Validação de Metadados Obrigatórios em Todos os Processos da Carteira', () => {
    mockProcessos.forEach(p => {
      assert.ok(p.id, 'ID do processo não pode ser vazio');
      assert.ok(p.objeto && p.objeto.length > 5, `Objeto inválido ou muito curto no processo ${p.id}`);
      assert.ok(p.unidade_origem_id, `unidade_origem_id ausente no processo ${p.id}`);
      assert.ok(p.unidade_atual_sei, `unidade_atual_sei ausente no processo ${p.id}`);
      assert.ok(['QUENTE', 'MORNO', 'FRIO'].includes(p.prioridade), `Prioridade inválida no processo ${p.id}`);
      assert.ok(
        ['FASE_INTERNA_SEI', 'INSTRUCAO_TR', 'ANALISE_JURIDICA', 'FASE_EXTERNA_LICITACAO', 'CONTRATO_EXECUCAO', 'CONCLUIDO'].includes(p.status_etapa),
        `Status de etapa inválido no processo ${p.id}`
      );
      assert.ok(!isNaN(Date.parse(p.created_at)), `created_at deve ser uma data ISO válida no processo ${p.id}`);
      assert.ok(!isNaN(Date.parse(p.proxima_verificacao_em)), `proxima_verificacao_em deve ser válida no processo ${p.id}`);
    });
  });

  test('Regras de Alerta de Vigência de Contratos e PCA (Lei 14.133/2021)', () => {
    // Regras de antecedência para prorrogações ou novas contratações
    function calcularAlertaVigencia(diasRestantes: number): {
      nivel: 'URGENTE' | 'CRITICO' | 'PLANEJAMENTO' | 'REGULAR';
      acaoRecomendada: string;
    } {
      if (diasRestantes <= 30) {
        return { 
          nivel: 'URGENTE', 
          acaoRecomendada: 'Risco iminente de descontinuidade do serviço público. Abertura imediata de termo emergencial ou dispensa.' 
        };
      }
      if (diasRestantes <= 90) {
        return { 
          nivel: 'CRITICO', 
          acaoRecomendada: 'Iniciar minuta do Termo Aditivo de prorrogação ou publicação de novo edital de licitação.' 
        };
      }
      if (diasRestantes <= 180) {
        return { 
          nivel: 'PLANEJAMENTO', 
          acaoRecomendada: 'Consultar unidade demandante sobre interesse em renovação contratual e pesquisa de vantajosidade.' 
        };
      }
      return { 
        nivel: 'REGULAR', 
        acaoRecomendada: 'Contrato em execução regular dentro do prazo pactuado.' 
      };
    }

    assert.strictEqual(calcularAlertaVigencia(20).nivel, 'URGENTE');
    assert.strictEqual(calcularAlertaVigencia(60).nivel, 'CRITICO');
    assert.strictEqual(calcularAlertaVigencia(120).nivel, 'PLANEJAMENTO');
    assert.strictEqual(calcularAlertaVigencia(250).nivel, 'REGULAR');
  });

  test('Confirmação de Vínculos entre Processo Principal e Acessórios (RF16)', () => {
    interface VinculoProcesso {
      id: string;
      processoPaiId: string;
      processoFilhoId: string;
      tipoVinculo: 'TERMO_ADITIVO' | 'APOSTILAMENTO' | 'PAGAMENTO' | 'RECURSO_ADMINISTRATIVO';
      statusValidacao: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO';
      confirmadoPor?: string;
    }

    const vinculoValido: VinculoProcesso = {
      id: 'vinc-01',
      processoPaiId: '10000000-0000-0000-0000-000000000001',
      processoFilhoId: '10000000-0000-0000-0000-000000000003',
      tipoVinculo: 'TERMO_ADITIVO',
      statusValidacao: 'CONFIRMADO',
      confirmadoPor: 'user-servulo'
    };

    assert.ok(vinculoValido.processoPaiId !== vinculoValido.processoFilhoId, 'Processo não pode ser pai de si mesmo');
    assert.strictEqual(vinculoValido.statusValidacao, 'CONFIRMADO');
    assert.ok(vinculoValido.confirmadoPor, 'Vínculo confirmado deve possuir identificação do servidor validador');
  });

  test('Validação Estruturada de Divergência de IA para Auditoria (RF20)', () => {
    type CategoriaDivergencia = 'ALUCINACAO' | 'SETOR_INCORRETO' | 'VALOR_PRAZO' | 'OUTRO';

    interface FeedbackIA {
      eventoId: string;
      usuarioId: string;
      tipo: 'POSITIVO' | 'DIVERGENCIA';
      categoria?: CategoriaDivergencia;
      justificativa?: string;
    }

    function validarPayloadFeedback(fb: FeedbackIA): { valido: boolean; erro?: string } {
      if (fb.tipo === 'DIVERGENCIA') {
        if (!fb.categoria) {
          return { valido: false, erro: 'Categoria de divergência é obrigatória' };
        }
        const categoriasPermitidas: CategoriaDivergencia[] = ['ALUCINACAO', 'SETOR_INCORRETO', 'VALOR_PRAZO', 'OUTRO'];
        if (!categoriasPermitidas.includes(fb.categoria)) {
          return { valido: false, erro: 'Categoria inválida' };
        }
      }
      return { valido: true };
    }

    const feedbackValido: FeedbackIA = {
      eventoId: 'ev-01',
      usuarioId: 'user-servulo',
      tipo: 'DIVERGENCIA',
      categoria: 'SETOR_INCORRETO',
      justificativa: 'O processo foi despachado para a SUDES e não para a SUPDEV.'
    };

    const feedbackInvalidoSemCategoria: FeedbackIA = {
      eventoId: 'ev-01',
      usuarioId: 'user-servulo',
      tipo: 'DIVERGENCIA'
    };

    assert.strictEqual(validarPayloadFeedback(feedbackValido).valido, true);
    assert.strictEqual(validarPayloadFeedback(feedbackInvalidoSemCategoria).valido, false);
  });
});
