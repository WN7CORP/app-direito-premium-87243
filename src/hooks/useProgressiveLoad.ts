import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInitialRows, fetchAllRows } from '@/lib/fetchAllRows';
import { useIndexedDBCache } from './useIndexedDBCache';

interface UseProgressiveLoadOptions {
  tableName: string;
  initialBatchSize?: number;
  orderBy?: string;
  enabled?: boolean;
}

/**
 * Hook para carregamento progressivo de artigos
 * 1. Mostra cache instantaneamente (se existir)
 * 2. Carrega primeiros 50-100 artigos rapidamente
 * 3. Carrega resto em background
 */
export const useProgressiveLoad = <T = any>({
  tableName,
  initialBatchSize = 100,
  orderBy = 'id',
  enabled = true
}: UseProgressiveLoadOptions) => {
  const [allArticles, setAllArticles] = useState<T[]>([]);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  
  const { cachedData, isLoadingCache, saveToCache } = useIndexedDBCache<T>(tableName);

  // Carrega cache imediatamente quando disponível
  useEffect(() => {
    if (!isLoadingCache && cachedData && cachedData.length > 0) {
      setAllArticles(cachedData);
    }
  }, [cachedData, isLoadingCache]);

const { data: initialData, isLoading: isLoadingInitial } = useQuery({
  queryKey: ['progressive-load-initial', tableName, initialBatchSize],
  queryFn: async () => {
    // Busca primeiros artigos rapidamente
    const initial = await fetchInitialRows<T>(tableName, initialBatchSize, orderBy);
    
    // Sempre seta os artigos se não temos nenhum ainda
    setAllArticles(prev => prev.length === 0 ? initial : prev);
    
    // Dispara carregamento completo em background apenas se não temos cache completo
    if (!cachedData || cachedData.length < 100) {
      loadFullData();
    }
    
    return initial;
  },
  enabled: enabled && !isLoadingCache,
  staleTime: 1000 * 60 * 60, // 1 hora
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnMount: false // Não revalidar ao remontar
});

// Se a query já possui dados em cache (React Query), usa-os na primeira montagem
useEffect(() => {
  if (allArticles.length === 0 && initialData && (initialData as T[]).length > 0) {
    setAllArticles(initialData as T[]);
  }
}, [initialData, allArticles.length]);

  const loadFullData = useCallback(async () => {
    setIsLoadingFull(true);
    
    try {
      // Aguarda 100ms para não bloquear a UI inicial
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const fullData = await fetchAllRows<T>(tableName, orderBy);
      
      // Atualiza estado e cache
      setAllArticles(fullData);
      await saveToCache(fullData);
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
    } finally {
      setIsLoadingFull(false);
    }
  }, [tableName, orderBy, saveToCache]);

  return {
    articles: allArticles,
    isLoadingInitial,
    isLoadingFull,
    isLoading: isLoadingInitial || isLoadingCache,
    totalLoaded: allArticles.length
  };
};
