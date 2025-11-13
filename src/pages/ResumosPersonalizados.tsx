import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StepSelectType } from "@/components/resumos/StepSelectType";
import { StepSelectInput } from "@/components/resumos/StepSelectInput";
import { StepAnalyzing } from "@/components/resumos/StepAnalyzing";
import { StepSelectLevel } from "@/components/resumos/StepSelectLevel";
import { StepGenerating } from "@/components/resumos/StepGenerating";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type InputType = "texto" | "pdf" | "imagem";
type ResumoLevel = "detalhado" | "resumido" | "super_resumido";
type Step = "select-type" | "input-content" | "analyzing" | "select-level" | "generating";

const ResumosPersonalizados = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("select-type");
  const [inputType, setInputType] = useState<InputType | null>(null);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ResumoLevel | null>(null);

  const handleTypeSelect = (type: InputType) => {
    setInputType(type);
    setCurrentStep("input-content");
    setTexto("");
    setArquivo(null);
    setExtractedText(null);
    setSelectedLevel(null);
  };

  const handleInputSubmit = async (text?: string, file?: File) => {
    if (text) setTexto(text);
    if (file) setArquivo(file);
    
    setCurrentStep("analyzing");
    
    try {
      let arquivoBase64: string | undefined;
      if (file) {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const { data, error } = await supabase.functions.invoke("gerar-resumo", {
        body: {
          tipo: inputType,
          conteudo: text || undefined,
          arquivo: arquivoBase64,
          nomeArquivo: file?.name,
          acao: "extrair",
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("Erro na extração:", error);
        throw new Error("Erro ao processar documento. Tente um arquivo menor ou em outro formato.");
      }

      if (data?.extraido && typeof data.extraido === "string" && data.extraido.trim().length > 0) {
        setExtractedText(data.extraido);
        // Transição instantânea para a próxima etapa
        setTimeout(() => {
          setCurrentStep("select-level");
        }, 100);
      } else {
        throw new Error("Não foi possível extrair texto do documento.");
      }
    } catch (error: any) {
      console.error("Erro ao analisar:", error);
      
      const errorMessage = error.name === 'AbortError' 
        ? "Tempo esgotado. Tente um arquivo menor." 
        : error.message || "Erro ao processar documento.";
      
      toast({
        title: "Erro na análise",
        description: errorMessage,
        variant: "destructive",
      });
      
      setCurrentStep("input-content");
    }
  };

  const handleLevelSelect = async (level: ResumoLevel) => {
    setSelectedLevel(level);
    setCurrentStep("generating");

    try {
      let arquivoBase64: string | undefined;
      if (arquivo && inputType !== "texto") {
        const reader = new FileReader();
        arquivoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(arquivo);
        });
      }

      const { data, error } = await supabase.functions.invoke("gerar-resumo", {
        body: {
          tipo: inputType,
          conteudo: inputType === "texto" ? texto : extractedText || undefined,
          arquivo: arquivoBase64,
          nomeArquivo: arquivo?.name,
          acao: "resumir",
          nivel: level,
        },
      });

      if (error) {
        console.error("Erro ao gerar resumo:", error);
        throw error;
      }

      if (data?.resumo) {
        // Transição instantânea para o resultado
        setTimeout(() => {
          navigate("/resumos-juridicos/resultado", {
            state: { 
              resumo: data.resumo, 
              titulo: "Resumo Jurídico Personalizado",
              nivel: level 
            },
          });
        }, 100);
      } else {
        throw new Error(data?.error || "Falha ao gerar resumo.");
      }
    } catch (error: any) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setCurrentStep("select-level");
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "input-content":
        setCurrentStep("select-type");
        setInputType(null);
        break;
      case "select-level":
        setCurrentStep("input-content");
        setExtractedText(null);
        break;
      default:
        navigate("/resumos-juridicos");
    }
  };

  return (
    <div className="min-h-screen">
      {currentStep === "select-type" && (
        <StepSelectType onSelect={handleTypeSelect} />
      )}
      
      {currentStep === "input-content" && inputType && (
        <StepSelectInput
          inputType={inputType}
          onSubmit={handleInputSubmit}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "analyzing" && (
        <StepAnalyzing />
      )}
      
      {currentStep === "select-level" && (
        <StepSelectLevel
          onSelect={handleLevelSelect}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "generating" && (
        <StepGenerating nivel={selectedLevel || "detalhado"} />
      )}
    </div>
  );
};

export default ResumosPersonalizados;
