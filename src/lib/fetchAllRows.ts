import { supabase } from "@/integrations/supabase/client";

interface FetchOptions {
  limit?: number;
  offset?: number;
}

/**
 * Estima o tamanho de uma tabela para decidir estratégia de carregamento
 */
async function estimateTableSize(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error(`Erro ao estimar tamanho da tabela ${tableName}:`, error);
    return 1000; // Fallback conservador
  }
}

/**
 * Busca direta para tabelas pequenas
 */
async function fetchDirect<T>(tableName: string, orderBy: string = "id"): Promise<T[]> {
  const { data, error } = await supabase
    .from(tableName as any)
    .select("*")
    .order(orderBy as any, { ascending: true });

  if (error) {
    console.error(`Erro ao buscar tabela ${tableName}:`, error);
    throw error;
  }

  return (data || []) as T[];
}

/**
 * Busca paginada para tabelas grandes
 */
async function fetchPaginated<T>(
  tableName: string,
  orderBy: string = "id",
  estimatedSize: number
): Promise<T[]> {
  const pageSize = 1000;
  const maxPages = Math.ceil(estimatedSize / pageSize) + 1;
  let from = 0;
  let all: T[] = [];

  for (let i = 0; i < Math.min(maxPages, 50); i++) {
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order(orderBy as any, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Erro ao paginar tabela ${tableName}:`, error);
      throw error;
    }

    const batch = (data || []) as T[];
    all = all.concat(batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

/**
 * Busca todos os registros com estratégia otimizada
 * - Tabelas pequenas (< 300): busca direta
 * - Tabelas grandes: busca paginada
 */
export async function fetchAllRows<T>(
  tableName: string, 
  orderBy: string = "id",
  options?: FetchOptions
): Promise<T[]> {
  // Se tem limite específico, busca apenas o necessário
  if (options?.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;

    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order(orderBy as any, { ascending: true })
      .range(from, to);

    if (error) {
      console.error(`Erro ao buscar tabela ${tableName}:`, error);
      throw error;
    }

    return (data || []) as T[];
  }

  // Estima tamanho da tabela para decidir estratégia
  const estimatedSize = await estimateTableSize(tableName);

  // Tabelas pequenas: busca direta (mais rápido)
  if (estimatedSize < 300) {
    return fetchDirect<T>(tableName, orderBy);
  }

  // Tabelas grandes: busca paginada
  return fetchPaginated<T>(tableName, orderBy, estimatedSize);
}

// Nova função otimizada para carregamento inicial rápido
export async function fetchInitialRows<T>(
  tableName: string,
  limit: number = 50,
  orderBy: string = "id"
): Promise<T[]> {
  return fetchAllRows<T>(tableName, orderBy, { limit, offset: 0 });
}
