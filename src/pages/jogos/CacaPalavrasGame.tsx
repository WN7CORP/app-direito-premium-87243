import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

interface CelulaSelecionada {
  linha: number;
  coluna: number;
}

const CacaPalavrasGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { area, tema, dificuldade, conteudo } = location.state || {};

  const [niveis, setNiveis] = useState<any[]>([]);
  const [nivelAtual, setNivelAtual] = useState(1);
  const [palavrasEncontradas, setPalavrasEncontradas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Seleção por arraste
  const [isSelecting, setIsSelecting] = useState(false);
  const [celulasPath, setCelulasPath] = useState<CelulaSelecionada[]>([]);
  const [celulasHighlight, setCelulasHighlight] = useState<Set<string>>(new Set());

  const nivelData = niveis.find(n => n.nivel === nivelAtual);
  const palavrasNivel = nivelData?.palavras || [];
  const grid = nivelData?.grid || [];
  const totalNiveis = niveis.length;

  useEffect(() => {
    carregarJogo();
  }, []);

  const carregarJogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-jogo-juridico', {
        body: {
          tipo: 'caca_palavras',
          area,
          tema,
          dificuldade,
          conteudo: conteudo || `Tema: ${tema}`
        }
      });

      if (error) throw error;

      if (data?.dados_jogo?.niveis) {
        setNiveis(data.dados_jogo.niveis || []);
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
      toast.error('Erro ao carregar jogo');
    } finally {
      setLoading(false);
    }
  };

  const getCelulaKey = (linha: number, coluna: number) => `${linha}-${coluna}`;

  const handleMouseDown = (linha: number, coluna: number) => {
    setIsSelecting(true);
    setCelulasPath([{ linha, coluna }]);
    setCelulasHighlight(new Set([getCelulaKey(linha, coluna)]));
  };

  const handleMouseEnter = (linha: number, coluna: number) => {
    if (!isSelecting) return;
    
    const key = getCelulaKey(linha, coluna);
    if (!celulasHighlight.has(key)) {
      setCelulasPath(prev => [...prev, { linha, coluna }]);
      setCelulasHighlight(prev => new Set([...prev, key]));
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    
    // Verificar se formou alguma palavra
    const palavraFormada = celulasPath
      .map(({ linha, coluna }) => grid[linha]?.[coluna])
      .join('');
    
    const palavraInvertida = palavraFormada.split('').reverse().join('');
    
    // Verificar se encontrou alguma palavra do nível atual
    const palavraEncontrada = palavrasNivel.find(
      p => !palavrasEncontradas.includes(p) && 
           (p === palavraFormada || p === palavraInvertida)
    );

    if (palavraEncontrada) {
      setPalavrasEncontradas([...palavrasEncontradas, palavraEncontrada]);
      toast.success(`✅ Encontrou: ${palavraEncontrada}`);

      // Verificar se completou o nível
      const palavrasDoNivelEncontradas = palavrasEncontradas.filter(p => palavrasNivel.includes(p));
      if (palavrasDoNivelEncontradas.length + 1 === palavrasNivel.length) {
        if (nivelAtual < totalNiveis) {
          setTimeout(() => {
            setNivelAtual(nivelAtual + 1);
            setPalavrasEncontradas([]);
            toast.success(`🎉 Nível ${nivelAtual} completo! Avançando...`);
          }, 1000);
        } else {
          setTimeout(() => {
            // Confete ao completar todos os níveis!
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            toast.success('🏆 Parabéns! Você completou todos os níveis!');
          }, 1000);
        }
      }
    }

    setIsSelecting(false);
    setCelulasPath([]);
    setCelulasHighlight(new Set());
  };

  const progressoNivel = (palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length / palavrasNivel.length) * 100;

  const getBadgeColor = (nivel: number) => {
    if (nivel === 1) return 'bg-green-500';
    if (nivel === 2) return 'bg-yellow-500';
    if (nivel === 3) return 'bg-orange-500';
    if (nivel === 4) return 'bg-red-500';
    return 'bg-purple-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔍</div>
          <p>Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto min-h-screen">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/jogos-juridicos')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🔍 Caça-Palavras</h1>
        <p className="text-sm text-muted-foreground">
          Encontre as palavras escondidas na grade
        </p>
      </div>

      {/* Indicadores de Nível Melhorados */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {niveis.map((nivel) => (
          <Badge
            key={nivel.nivel}
            variant={nivel.nivel === nivelAtual ? 'default' : nivel.nivel < nivelAtual ? 'secondary' : 'outline'}
            className={`flex-shrink-0 px-4 py-2 text-sm ${
              nivel.nivel === nivelAtual ? getBadgeColor(nivel.nivel) + ' text-white' : ''
            }`}
          >
            {nivel.nivel < nivelAtual && <Trophy className="w-3 h-3 mr-1" />}
            Nível {nivel.nivel}
          </Badge>
        ))}
      </div>

      {/* Card de Nível Atual com Progresso Circular */}
      <Card className="mb-4 border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">Nível {nivelAtual}</h2>
              <p className="text-sm text-muted-foreground">
                {palavrasEncontradas.filter(p => palavrasNivel.includes(p)).length}/{palavrasNivel.length} palavras encontradas
              </p>
            </div>
            {/* Progresso Circular */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - progressoNivel / 100)}
                  className="text-green-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{Math.round(progressoNivel)}%</span>
              </div>
            </div>
          </div>
          <Progress value={progressoNivel} className="h-2" />
        </CardContent>
      </Card>

      {/* Lista de Palavras com Animação */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Palavras para encontrar:</h3>
          <div className="flex flex-wrap gap-2">
            {palavrasNivel.map((palavra, idx) => {
              const encontrada = palavrasEncontradas.includes(palavra);
              return (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    encontrada
                      ? 'bg-green-500 text-white scale-105 line-through'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {encontrada && <span className="mr-1">✓</span>}
                  {palavra}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid - Seleção por Arraste */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            Arraste o dedo ou mouse sobre as letras para selecionar palavras
          </p>
          <div 
            className="grid gap-1 select-none" 
            style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 12}, minmax(0, 1fr))` }}
            onMouseLeave={handleMouseUp}
          >
            {grid.map((linha, i) =>
              linha.map((letra, j) => {
                const key = getCelulaKey(i, j);
                const isHighlighted = celulasHighlight.has(key);
                
                return (
                  <button
                    key={key}
                    onMouseDown={() => handleMouseDown(i, j)}
                    onMouseEnter={() => handleMouseEnter(i, j)}
                    onMouseUp={handleMouseUp}
                    onTouchStart={() => handleMouseDown(i, j)}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element?.getAttribute('data-cell')) {
                        const [linha, coluna] = element.getAttribute('data-cell')!.split('-').map(Number);
                        handleMouseEnter(linha, coluna);
                      }
                    }}
                    onTouchEnd={handleMouseUp}
                    data-cell={key}
                    className={`aspect-square flex items-center justify-center text-xs md:text-sm font-bold border rounded transition-all ${
                      isHighlighted
                        ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    {letra}
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {nivelAtual === totalNiveis && palavrasEncontradas.length === palavrasNivel.length && (
        <div className="mt-6 text-center">
          <div className="mb-4">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2 animate-bounce" />
            <p className="text-xl font-bold">Parabéns! 🎉</p>
            <p className="text-muted-foreground">Você completou todos os 5 níveis!</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Jogar Novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default CacaPalavrasGame;
