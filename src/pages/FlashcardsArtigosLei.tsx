import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Lista estática de todos os códigos do Vade Mecum
const codigosVadeMecum = [
  { id: "CP - Código Penal", nome: "Código Penal", sigla: "CP", emoji: "⚖️" },
  { id: "CC - Código Civil", nome: "Código Civil", sigla: "CC", emoji: "📜" },
  { id: "CF - Constituição Federal", nome: "Constituição Federal", sigla: "CF", emoji: "🏛️" },
  { id: "CPC – Código de Processo Civil", nome: "Código de Processo Civil", sigla: "CPC", emoji: "📋" },
  { id: "CPP – Código de Processo Penal", nome: "Código de Processo Penal", sigla: "CPP", emoji: "🔍" },
  { id: "CDC – Código de Defesa do Consumidor", nome: "Código de Defesa do Consumidor", sigla: "CDC", emoji: "🛒" },
  { id: "CLT - Consolidação das Leis do Trabalho", nome: "CLT", sigla: "CLT", emoji: "👷" },
  { id: "CTN – Código Tributário Nacional", nome: "Código Tributário Nacional", sigla: "CTN", emoji: "💰" },
  { id: "CTB Código de Trânsito Brasileiro", nome: "Código de Trânsito", sigla: "CTB", emoji: "🚗" },
  { id: "CE – Código Eleitoral", nome: "Código Eleitoral", sigla: "CE", emoji: "🗳️" },
  { id: "CPM – Código Penal Militar", nome: "Código Penal Militar", sigla: "CPM", emoji: "🎖️" },
  { id: "CPPM – Código de Processo Penal Militar", nome: "Código de Processo Penal Militar", sigla: "CPPM", emoji: "⚔️" },
  { id: "CA - Código de Águas", nome: "Código de Águas", sigla: "CA", emoji: "💧" },
  { id: "CBA Código Brasileiro de Aeronáutica", nome: "Código Brasileiro de Aeronáutica", sigla: "CBA", emoji: "✈️" },
  { id: "CBT Código Brasileiro de Telecomunicações", nome: "Código de Telecomunicações", sigla: "CBT", emoji: "📡" },
  { id: "CCOM – Código Comercial", nome: "Código Comercial", sigla: "CCOM", emoji: "🏪" },
  { id: "CDM – Código de Minas", nome: "Código de Minas", sigla: "CDM", emoji: "⛏️" },
  { id: "ESTATUTO - ECA", nome: "Estatuto da Criança e Adolescente", sigla: "ECA", emoji: "👶" },
  { id: "ESTATUTO - IDOSO", nome: "Estatuto do Idoso", sigla: "IDOSO", emoji: "👴" },
  { id: "ESTATUTO - OAB", nome: "Estatuto da OAB", sigla: "OAB", emoji: "⚖️" },
  { id: "ESTATUTO - PESSOA COM DEFICIÊNCIA", nome: "Estatuto da Pessoa com Deficiência", sigla: "PCD", emoji: "♿" },
  { id: "ESTATUTO - IGUALDADE RACIAL", nome: "Estatuto da Igualdade Racial", sigla: "RACIAL", emoji: "🤝" },
  { id: "ESTATUTO - CIDADE", nome: "Estatuto da Cidade", sigla: "CIDADE", emoji: "🏙️" },
  { id: "ESTATUTO - TORCEDOR", nome: "Estatuto do Torcedor", sigla: "TORC", emoji: "⚽" },
];

const glowColors = [
  "rgb(16, 185, 129)",
  "rgb(139, 92, 246)",
  "rgb(239, 68, 68)", 
  "rgb(245, 158, 11)",
  "rgb(59, 130, 246)",
  "rgb(236, 72, 153)",
];

const FlashcardsArtigosLei = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodigos = codigosVadeMecum.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Artigos da Lei</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um código para estudar
            </p>
          </div>
        </div>
      </div>

      {/* Campo de Busca */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Códigos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Códigos Disponíveis ({filteredCodigos.length})
        </h2>
        
        {filteredCodigos.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum código encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCodigos.map((item, index) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
                onClick={() =>
                  navigate(`/flashcards/artigos-lei/temas?codigo=${encodeURIComponent(item.id)}`)
                }
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColors[index % glowColors.length]}, transparent)`,
                    boxShadow: `0 0 20px ${glowColors[index % glowColors.length]}`
                  }}
                />
                
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{item.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.sigla}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsArtigosLei;
