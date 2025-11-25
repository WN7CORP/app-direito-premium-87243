import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ModeloPeticao {
  id: number;
  "Petições": string;
  "Link": string;
}

const AdvogadoModelos = () => {
  const [modelos, setModelos] = useState<ModeloPeticao[]>([]);
  const [filteredModelos, setFilteredModelos] = useState<ModeloPeticao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchModelos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredModelos(modelos);
    } else {
      const filtered = modelos.filter((modelo) =>
        modelo["Petições"]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredModelos(filtered);
    }
  }, [searchTerm, modelos]);

  const fetchModelos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("PETIÇÃO" as any)
        .select("*")
        .order("Petições", { ascending: true });

      if (error) throw error;
      
      const modelosData = (data || []).map((item: any) => ({
        id: item.id,
        "Petições": item["Petições"],
        "Link": item["Link"]
      }));
      
      setModelos(modelosData);
      setFilteredModelos(modelosData);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Modelos de Petições</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filteredModelos.length} modelos disponíveis`}
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar área do direito..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : filteredModelos.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum modelo encontrado para esta busca" : "Nenhum modelo disponível"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredModelos.map((modelo) => (
            <button
              key={modelo.id}
              onClick={() => handleOpenLink(modelo["Link"])}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-accent/50 transition-all group text-left"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-600/10 flex-shrink-0 group-hover:bg-amber-600/20 transition-colors">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              
              <span className="flex-1 font-medium text-sm md:text-base text-foreground truncate">
                {modelo["Petições"]}
              </span>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                <span className="hidden sm:inline">Abrir</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvogadoModelos;
