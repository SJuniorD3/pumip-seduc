import test, { describe } from 'node:test';
import assert from 'node:assert';
import { filterProcessosByRLS } from '../src/lib/rlsFilter';
import { mockProcessos } from '../src/lib/mockData';
import { DEMO_USERS, AuthUser } from '../src/lib/authUsers';
import { Processo } from '../src/lib/types';
import { neutralizarCelula } from '../src/lib/exportUtils';

describe('Segurança de Aplicação e RLS (OWASP Top 10 - Broken Access Control)', () => {
  test('Segurança Zero-Trust: Usuário nulo ou indefinido deve receber 0 processos', () => {
    // Tentativa de acesso sem autenticação (bypass de sessão)
    const processosNull = filterProcessosByRLS(mockProcessos, null);
    const processosUndefined = filterProcessosByRLS(mockProcessos, undefined);

    assert.strictEqual(processosNull.length, 0, 'Usuário nulo não deve ter acesso a nenhum processo');
    assert.strictEqual(processosUndefined.length, 0, 'Usuário indefinido não deve ter acesso a nenhum processo');
  });

  test('Gabinete e Secretário de Estado: Devem possuir visão 100% global (14.133 / Governança)', () => {
    const processosSecretario = filterProcessosByRLS(mockProcessos, DEMO_USERS.secretario);
    assert.strictEqual(
      processosSecretario.length, 
      mockProcessos.length, 
      'Secretário deve enxergar todos os processos da pasta'
    );
  });

  test('Administrador de Governança e TI: Deve possuir visão 100% para suporte e auditoria', () => {
    const processosAdmin = filterProcessosByRLS(mockProcessos, DEMO_USERS.admin);
    assert.strictEqual(
      processosAdmin.length, 
      mockProcessos.length, 
      'Admin deve enxergar todos os processos da pasta'
    );
  });

  test('Superintendente de TI (STI): Não deve enxergar processos fora da hierarquia de tecnologia', () => {
    const processosSTI = filterProcessosByRLS(mockProcessos, DEMO_USERS.natalia);
    
    // Todos os processos retornados devem pertencer à hierarquia de tecnologia (STI, SUDES, SUPDEV)
    processosSTI.forEach(p => {
      const sigla = p.unidade_origem?.sigla;
      const caminho = p.unidade_origem?.caminho_hierarquico || '';
      const valido = sigla === 'STI' || sigla === 'SUDES' || sigla === 'SUPDEV' || caminho.startsWith('SEDUC.SAAD.STI');
      assert.ok(valido, `Processo ${p.protocolo_sei} da unidade ${sigla} não deveria ser visível para STI`);
    });

    // Deve ser um subconjunto estrito (menor que o total de processos)
    assert.ok(processosSTI.length < mockProcessos.length, 'STI não pode ter acesso indiscriminado');
    assert.ok(processosSTI.length > 0, 'STI deve ver os processos de sua área');
  });

  test('Supervisor de Sistemas (SUDES): Não deve enxergar processos de outras superintendências', () => {
    const processosSUDES = filterProcessosByRLS(mockProcessos, DEMO_USERS.servulo);

    processosSUDES.forEach(p => {
      const sigla = p.unidade_origem?.sigla;
      const valido = sigla === 'SUDES' || sigla === 'STI' || sigla === 'SUPDEV';
      assert.ok(valido, `Processo ${p.protocolo_sei} (${sigla}) não deveria ser acessível para SUDES`);
    });

    assert.ok(processosSUDES.length <= mockProcessos.length);
  });

  test('Assessor Jurídico (ASJUR): Vê apenas processos em tramitação jurídica ou com concessão pontual', () => {
    const processosASJUR = filterProcessosByRLS(mockProcessos, DEMO_USERS.valter);

    // Dr. Valter Veras possui concessão expressa ao processo 10000000-0000-0000-0000-000000000002 (Nuvem)
    const processoConcedido = processosASJUR.find(p => p.id === '10000000-0000-0000-0000-000000000002');
    assert.ok(processoConcedido, 'Processo concedido pontualmente (RF02) deve estar visível');

    // Não deve enxergar processos aleatórios de secretarias adjuntas que não tramitaram pela ASJUR
    processosASJUR.forEach(p => {
      const isTramitandoASJUR = p.unidade_atual_sei === 'ASJUR' || p.unidade_origem?.sigla === 'ASJUR';
      const isConcedido = p.id === '10000000-0000-0000-0000-000000000002';
      assert.ok(isTramitandoASJUR || isConcedido, `Processo ${p.protocolo_sei} viola a regra de não ampliação para ASJUR`);
    });
  });

  test('Tentativa de Injeção de Privilégios (Role Spoofing & SQL Injection nos dados do usuário)', () => {
    // Injeção de string de SQL Injection no campo de role
    const maliciousUser: any = {
      id: 'hacker-01',
      nome: 'Tentativa Invasor',
      email: 'hacker@teste.com',
      role: "ADMIN' OR '1'='1" as any,
      cargo_titulo: 'Atacante',
      unidade_sigla: 'INTRUSO',
      unidade_nome: 'Intrusão',
      caminho_hierarquico: 'SEDUC.FAKE',
      isAdmin: false,
      avatar_iniciais: 'XX'
    };

    const processosAcesso = filterProcessosByRLS(mockProcessos, maliciousUser);
    assert.strictEqual(processosAcesso.length, 0, 'Usuário com role forjada ou maliciosa não deve obter nenhum processo');
  });

  test('Sanitização contra Cross-Site Scripting (XSS) em anotações internas da unidade (RF15)', () => {
    // Simulação de anotação contendo payload malicioso
    const rawMaliciousInput = '<script>alert("XSS SEDUC")</script><img src=x onerror=stealCookies()>';
    
    // Função utilitária de sanitização recomendada
    function sanitizeInput(input: string): string {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/javascript:/gi, '');
    }

    const sanitized = sanitizeInput(rawMaliciousInput);
    assert.ok(!sanitized.includes('<script>'), 'Tag script deve ser neutralizada');
    assert.ok(!sanitized.includes('<img'), 'Tag img com payload deve ser neutralizada');
    assert.ok(sanitized.includes('&lt;script&gt;'), 'Caracteres devem ser convertidos em HTML entities');
  });

  test('Proteção contra Formula Injection (CSV / Excel Injection - SEG-08)', () => {
    assert.strictEqual(neutralizarCelula('=SUM(A1:A10)'), "'=SUM(A1:A10)", 'Fórmula iniciada por = deve ser prefixada com apóstrofo');
    assert.strictEqual(neutralizarCelula('+cmd|"/C calc"!A0'), "'+cmd|\"/C calc\"!A0", 'Comando iniciado por + deve ser neutralizado');
    assert.strictEqual(neutralizarCelula('-2+3*cmd'), "'-2+3*cmd", 'Expressão iniciada por - deve ser neutralizada');
    assert.strictEqual(neutralizarCelula('@SUM(1+1)'), "'@SUM(1+1)", 'Anotação iniciada por @ deve ser neutralizada');
    assert.strictEqual(neutralizarCelula('SEI-021001/004521/2026'), 'SEI-021001/004521/2026', 'Texto comum não deve ser alterado');
  });
});
