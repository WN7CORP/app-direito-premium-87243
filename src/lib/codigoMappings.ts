/**
 * Mapeamento Universal de Códigos - FONTE ÚNICA DA VERDADE
 * 
 * Este arquivo centraliza o mapeamento entre códigos curtos (slugs)
 * e nomes completos das tabelas do banco de dados.
 */

// Mapeamento: Código curto → Nome da Tabela
export const CODIGO_TO_TABLE: Record<string, string> = {
  'cp': 'CP - Código Penal',
  'cpp': 'CPP – Código de Processo Penal',
  'cc': 'CC - Código Civil',
  'cpc': 'CPC – Código de Processo Civil',
  'cf': 'CF - Constituição Federal',
  'cdc': 'CDC – Código de Defesa do Consumidor',
  'clt': 'CLT – Consolidação das Leis do Trabalho',
  'ctn': 'CTN – Código Tributário Nacional',
  'ctb': 'CTB Código de Trânsito Brasileiro',
  'ce': 'CE – Código Eleitoral',
  'ca': 'CA - Código de Águas',
  'cba': 'CBA Código Brasileiro de Aeronáutica',
  'ccom': 'CCOM – Código Comercial',
  'cdm': 'CDM – Código de Minas',
  'cppenal': 'CPP – Código de Processo Penal', // Alias para compatibilidade
  'eca': 'ESTATUTO - ECA',
  'idoso': 'ESTATUTO - IDOSO',
  'oab': 'ESTATUTO - OAB',
  'pcd': 'ESTATUTO - PESSOA COM DEFICIÊNCIA',
  'racial': 'ESTATUTO - IGUALDADE RACIAL',
  'cidade': 'ESTATUTO - CIDADE',
  'torcedor': 'ESTATUTO - TORCEDOR'
};

// Mapeamento inverso: Nome da Tabela → Código curto
export const TABLE_TO_CODIGO: Record<string, string> = Object.entries(CODIGO_TO_TABLE)
  .reduce((acc, [key, value]) => {
    // Evitar duplicatas do alias 'cppenal'
    if (key !== 'cppenal' || !acc[value]) {
      acc[value] = key;
    }
    return acc;
  }, {} as Record<string, string>);

/**
 * Função helper para obter código curto a partir do nome da tabela
 * @param tableName Nome completo da tabela
 * @returns Código curto (ex: 'cp', 'cpp', 'cc')
 */
export function getCodigoFromTable(tableName: string): string {
  const codigo = TABLE_TO_CODIGO[tableName];
  if (!codigo) {
    console.warn(`⚠️ Código não encontrado para tabela: ${tableName}. Usando 'cp' como fallback.`);
    return 'cp';
  }
  return codigo;
}

/**
 * Função helper para obter nome da tabela a partir do código curto
 * @param codigo Código curto (ex: 'cp', 'cpp', 'cc')
 * @returns Nome completo da tabela
 */
export function getTableFromCodigo(codigo: string): string {
  const tableName = CODIGO_TO_TABLE[codigo];
  if (!tableName) {
    console.warn(`⚠️ Tabela não encontrada para código: ${codigo}. Usando 'CP - Código Penal' como fallback.`);
    return 'CP - Código Penal';
  }
  return tableName;
}
