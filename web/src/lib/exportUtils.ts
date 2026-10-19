/**
 * PUMIP-SEDUC: Utilitários de Exportação de Dados e Auditoria (RF11)
 * Suporte a CSV com UTF-8 BOM, Planilhas Excel (XML/XLSX) e Impressão de Relatórios em PDF.
 */

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((item: T) => string | number | null | undefined);
}

const INICIO_FORMULA = /^[=+\-@\t\r\n＝＋－＠]/;

/**
 * Sanitiza valores contra CSV/Formula Injection (OWASP) prefixando com apóstrofo
 * células que iniciam com caracteres disparadores de fórmula.
 */
export function neutralizarCelula(valor: string): string {
  if (typeof valor !== 'string') return valor;
  return INICIO_FORMULA.test(valor) ? `'${valor}` : valor;
}

/**
 * Exporta dados para formato CSV com BOM para compatibilidade com acentuação no Excel.
 */
export function exportToCSV<T>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[],
  usuarioNome?: string
) {
  if (!data || data.length === 0) return;

  const headerRow = columns.map((col) => `"${neutralizarCelula(col.header).replace(/"/g, '""')}"`).join(';');
  
  const rows = data.map((item) =>
    columns
      .map((col) => {
        let val: any;
        if (typeof col.key === 'function') {
          val = col.key(item);
        } else {
          val = item[col.key];
        }

        if (val === null || val === undefined) val = '';
        const strVal = neutralizarCelula(String(val)).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(';')
  );

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);

  recordClientAuditLog('EXPORTACAO_CSV', filename, data.length, usuarioNome);
}

/**
 * Exporta dados para formato de Planilha Excel estruturada (XML Spreadsheet).
 */
export function exportToExcel<T>(
  filename: string,
  sheetName: string,
  data: T[],
  columns: ExportColumn<T>[],
  usuarioNome?: string
) {
  if (!data || data.length === 0) return;

  const headerCells = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(neutralizarCelula(col.header))}</Data></Cell>`
    )
    .join('');

  const rows = data
    .map((item) => {
      const cells = columns
        .map((col) => {
          let val: any;
          if (typeof col.key === 'function') {
            val = col.key(item);
          } else {
            val = item[col.key];
          }

          if (val === null || val === undefined) val = '';
          const isNum = typeof val === 'number';
          const type = isNum ? 'Number' : 'String';
          const cellContent = isNum ? String(val) : neutralizarCelula(String(val));
          return `<Cell><Data ss:Type="${type}">${escapeXml(cellContent)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const excelTemplate = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E40AF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName || 'Processos SEDUC')}">
  <Table>
   <Row ss:StyleID="header">${headerCells}</Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelTemplate], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });
  downloadBlob(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);

  recordClientAuditLog('EXPORTACAO_EXCEL', filename, data.length);
}

/**
 * Dispara o diálogo de impressão configurado para relatório PDF.
 */
export function triggerPrintPDF(title: string) {
  recordClientAuditLog('EXPORTACAO_PDF', title, 1);
  window.print();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Registro de Auditoria no cliente / Supabase (RF11).
 */
export function recordClientAuditLog(
  acao: 'EXPORTACAO_CSV' | 'EXPORTACAO_EXCEL' | 'EXPORTACAO_PDF' | 'CONSULTA' | 'VINCULO_CONFIRMADO',
  entidade: string,
  totalRegistros: number,
  usuarioNome?: string
) {
  let nomeEfetivo = usuarioNome;
  if (!nomeEfetivo && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pumip_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.nome) nomeEfetivo = u.nome;
      }
    } catch {
      // Ignora erro de parse
    }
  }

  const logItem = {
    acao,
    entidade,
    totalRegistros,
    dataHora: new Date().toISOString(),
    usuario: nomeEfetivo || 'Usuário Autenticado SEDUC'
  };

  try {
    const existing = JSON.parse(localStorage.getItem('pumip_audit_log') || '[]');
    existing.unshift(logItem);
    // Limita aos 100 mais recentes no armazenamento local
    localStorage.setItem('pumip_audit_log', JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn('Falha ao registrar auditoria no cliente:', e);
  }
}
