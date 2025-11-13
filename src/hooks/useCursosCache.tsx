import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/fetchAllRows";

interface CursoData {
  area: string;
  tema: string;
  ordem: number;
  'capa-aula': string;
  'aula-link': string;
  conteudo: string;
  'conteudo-final': string | null;
  'descricao-aula': string | null;
  'descricao_gerada_em': string | null;
  flashcards: any[] | null;
  questoes: any[] | null;
}

const CACHE_KEY_CURSOS = 'cursos_app_cache';
const CACHE_VERSION = '5'; // Incrementado com Realtime habilitado
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora (reduzido de 24h)

export const useCursosCache = () => {
  const [cursos, setCursos] = useState<CursoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadCursos();

    // Configurar Realtime para atualização automática
    const channel: RealtimeChannel = supabase
      .channel('cursos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Ouve INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'CURSOS-APP'
        },
        (payload) => {
          console.log('📡 Atualização Realtime detectada:', payload.eventType);
          // Invalidar cache e buscar dados frescos do servidor
          localStorage.removeItem(CACHE_KEY_CURSOS);
          loadCursos(true); // true = from realtime
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCursos = async (fromRealtime = false) => {
    try {
      // 1. Verificar cache com versão (pular se vier do Realtime)
      if (!fromRealtime) {
        const cached = localStorage.getItem(CACHE_KEY_CURSOS);
        if (cached) {
          const { data, timestamp, version } = JSON.parse(cached);
          if (version === CACHE_VERSION && Date.now() - timestamp < CACHE_DURATION) {
            console.log('📚 Usando cursos do cache (v' + version + '), total:', data.length);
            setCursos(data);
            setLoading(false);
            setLastUpdate(new Date(timestamp));
            return;
          }
        }
      }

      // 2. Buscar todos os cursos do Supabase (sem limite de 1000)
      const source = fromRealtime ? '📡 Realtime' : '🔄 Manual';
      console.log(`${source} Buscando todos os cursos do Supabase...`);
      const data = await fetchAllRows<CursoData>('CURSOS-APP', 'ordem');

      // 3. Salvar no cache com versão
      const now = Date.now();
      localStorage.setItem(CACHE_KEY_CURSOS, JSON.stringify({
        data: data,
        timestamp: now,
        version: CACHE_VERSION
      }));

      console.log('✅ Cursos carregados:', data.length, 'cursos de', new Set(data.map(c => c.area)).size, 'áreas');
      setCursos(data);
      setLastUpdate(new Date(now));
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para invalidar cache e forçar atualização
  const invalidateCache = () => {
    console.log('🔄 Forçando atualização manual...');
    localStorage.removeItem(CACHE_KEY_CURSOS);
    setLoading(true);
    loadCursos(true);
  };

  return { cursos, loading, invalidateCache, lastUpdate };
};
