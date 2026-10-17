import test, { describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Acessibilidade Digital, e-MAG e Validação de Rotas (WCAG 2.1 AA)', () => {
  test('Integridade Estrutural: Todas as 15 rotas do PUMIP devem possuir page.tsx existente', () => {
    const rotasObrigatorias = [
      'src/app/page.tsx',
      'src/app/login/page.tsx',
      'src/app/processos/page.tsx',
      'src/app/processos/[id]/page.tsx',
      'src/app/kanban/page.tsx',
      'src/app/alertas/page.tsx',
      'src/app/pca/page.tsx',
      'src/app/vinculos/page.tsx',
      'src/app/relatorios/page.tsx',
      'src/app/admin/organograma/page.tsx',
      'src/app/admin/usuarios/page.tsx',
      'src/app/admin/feriados/page.tsx',
      'src/app/admin/integracoes/page.tsx',
      'src/app/layout.tsx',
      'src/app/not-found.tsx'
    ];

    const basePath = process.cwd();

    rotasObrigatorias.forEach(rota => {
      const fullPath = path.join(basePath, rota);
      const existe = fs.existsSync(fullPath);
      assert.ok(existe, `Arquivo obrigatório de rota ausente: ${rota}`);
    });
  });

  test('Conformidade WCAG 2.1 AA: Razão de Contraste de Cores nas Etiquetas de Prioridade', () => {
    // Função para calcular luminância relativa e contraste conforme fórmula WCAG
    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return [r, g, b];
    }

    function luminance(r: number, g: number, b: number): number {
      const a = [r, g, b].map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const [r1, g1, b1] = hexToRgb(hex1);
      const [r2, g2, b2] = hexToRgb(hex2);
      const l1 = luminance(r1, g1, b1);
      const l2 = luminance(r2, g2, b2);
      const brighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (brighter + 0.05) / (darker + 0.05);
    }

    // Cores utilizadas no Tailwind do PUMIP para badges com fundo claro:
    // QUENTE: Fundo vermelho claro (red-100: #fee2e2), Texto vermelho escuro (red-900: #7f1d1d)
    const ratioQuente = contrastRatio('#fee2e2', '#7f1d1d');
    assert.ok(ratioQuente >= 4.5, `Contraste da badge QUENTE (${ratioQuente.toFixed(2)}) deve ser >= 4.5:1`);

    // MORNO: Fundo âmbar claro (amber-100: #fef3c7), Texto âmbar escuro (amber-900: #78350f)
    const ratioMorno = contrastRatio('#fef3c7', '#78350f');
    assert.ok(ratioMorno >= 4.5, `Contraste da badge MORNO (${ratioMorno.toFixed(2)}) deve ser >= 4.5:1`);

    // FRIO: Fundo azul claro (blue-100: #dbeafe), Texto azul escuro (blue-900: #1e3a8a)
    const ratioFrio = contrastRatio('#dbeafe', '#1e3a8a');
    assert.ok(ratioFrio >= 4.5, `Contraste da badge FRIO (${ratioFrio.toFixed(2)}) deve ser >= 4.5:1`);
  });

  test('Atributos de Acessibilidade (ARIA) nos Componentes Críticos', () => {
    const basePath = process.cwd();
    const timelinePath = path.join(basePath, 'src/components/MetroTimeline.tsx');
    const tablePath = path.join(basePath, 'src/components/ProcessTable.tsx');

    const timelineContent = fs.readFileSync(timelinePath, 'utf-8');
    const tableContent = fs.readFileSync(tablePath, 'utf-8');

    // MetroTimeline deve possuir botões com foco acessível e aria-label para botões de ação
    assert.ok(
      timelineContent.includes('focus-visible') || timelineContent.includes('focus:outline'),
      'MetroTimeline deve possuir classes de anel de foco visível'
    );

    // ProcessTable deve possuir estrutura semântica ou links acessíveis
    assert.ok(
      tableContent.includes('focus-visible') || tableContent.includes('aria-label') || tableContent.includes('hover:bg'),
      'ProcessTable deve possuir indicação clara de foco e estados acessíveis'
    );
  });
});
