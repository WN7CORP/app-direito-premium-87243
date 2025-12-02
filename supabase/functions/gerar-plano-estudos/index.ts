import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const diasSemanaMap: { [key: string]: string } = {
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
  dom: "Domingo",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia, horasPorDia, diasSemana, duracaoSemanas, arquivo, tipoArquivo } = await req.json();
    
    console.log("Gerando plano - Matéria:", materia, "Horas:", horasPorDia, "Dias:", diasSemana.length, "Semanas:", duracaoSemanas);

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    const totalHoras = horasPorDia * diasSemana.length * duracaoSemanas;
    const diasFormatados = diasSemana.map((d: string) => diasSemanaMap[d]).join(", ");

    let conteudoArquivo = "";

    // Processar arquivo se houver
    if (arquivo && tipoArquivo) {
      const base64Data = arquivo.split(",")[1];
      const mimeType = arquivo.split(";")[0].split(":")[1];

      console.log("Processando arquivo:", tipoArquivo);

      const visionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: tipoArquivo === "pdf"
                    ? "Extraia TODO o conteúdo deste documento (ementa, tópicos, cronograma). Mantenha a estrutura."
                    : "Extraia TODO o texto e informações desta imagem de ementa ou material de estudo."
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 3000,
            }
          }),
        }
      );

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        conteudoArquivo = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("Conteúdo extraído do arquivo, tamanho:", conteudoArquivo.length);
      }
    }

    // Gerar plano de estudos estruturado em JSON
    const prompt = `Você é um especialista em planejamento de estudos para concursos e OAB.

INFORMAÇÕES DO PLANO:
- Matéria/Tema: ${materia}
- Horas disponíveis por dia: ${horasPorDia}h
- Dias da semana disponíveis: ${diasFormatados}
- Duração total: ${duracaoSemanas} semanas
- Carga horária total: ${totalHoras}h

${conteudoArquivo ? `CONTEÚDO DO MATERIAL ENVIADO PELO USUÁRIO:\n${conteudoArquivo}\n\nBaseie o plano de estudos no conteúdo acima, distribuindo os tópicos de forma lógica e progressiva.\n` : ""}

GERE UM PLANO DE ESTUDOS COMPLETO E DETALHADO no formato JSON abaixo.

REGRAS IMPORTANTES:
1. Distribua TODO o conteúdo de forma equilibrada ao longo das ${duracaoSemanas} semanas
2. Cada dia deve ter tópicos específicos com horários realistas
3. Inclua revisões periódicas e exercícios práticos
4. Seja MUITO específico nos tópicos - nada genérico
5. Os horários devem somar ${horasPorDia}h por dia
6. Crie EXATAMENTE ${duracaoSemanas} semanas no cronograma
7. Cada semana deve ter EXATAMENTE ${diasSemana.length} dias (${diasFormatados})

Retorne APENAS o JSON válido, sem texto adicional:

{
  "objetivo": "Descrição clara e objetiva do que será aprendido ao final do plano (2-3 frases)",
  "visaoGeral": {
    "cargaTotal": "${totalHoras}h",
    "duracao": "${duracaoSemanas} semanas",
    "frequencia": "${diasSemana.length} dias por semana",
    "intensidade": "${horasPorDia}h por dia",
    "descricao": "Breve descrição da metodologia e abordagem do plano"
  },
  "cronograma": [
    {
      "semana": 1,
      "titulo": "Título descritivo do tema principal da semana",
      "dias": [
        {
          "dia": "${diasSemanaMap[diasSemana[0]]}",
          "cargaHoraria": "${horasPorDia}h",
          "topicos": [
            { "horario": "08:00-09:30", "titulo": "Tópico específico 1", "descricao": "Detalhes do que estudar" },
            { "horario": "09:45-11:00", "titulo": "Tópico específico 2", "descricao": "Detalhes do que estudar" }
          ]
        }
      ]
    }
  ],
  "materiais": [
    { "tipo": "Livro", "titulo": "Nome do livro", "autor": "Autor", "detalhes": "Capítulos recomendados" },
    { "tipo": "Vídeo", "titulo": "Nome do curso/canal", "detalhes": "Aulas específicas" },
    { "tipo": "Legislação", "titulo": "Nome da lei/código", "detalhes": "Artigos importantes" }
  ],
  "estrategias": [
    { "titulo": "Nome da técnica", "descricao": "Como aplicar esta técnica no estudo" }
  ],
  "checklist": [
    { "semana": 1, "meta": "Meta específica para a semana 1" },
    { "semana": 2, "meta": "Meta específica para a semana 2" }
  ],
  "revisaoFinal": {
    "descricao": "Orientações para a revisão final",
    "simulado": {
      "duracao": "${horasPorDia}h",
      "formato": "Descrição do formato do simulado"
    }
  }
}`;

    console.log("Gerando plano estruturado JSON com Gemini");

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar plano:", errorText);
      throw new Error("Falha ao gerar plano de estudos com IA");
    }

    const aiData = await aiResponse.json();
    const planoTexto = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("Resposta recebida, tamanho:", planoTexto.length);

    // Parse do JSON
    let planoJSON;
    try {
      planoJSON = JSON.parse(planoTexto);
      console.log("JSON parseado com sucesso. Semanas:", planoJSON.cronograma?.length || 0);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", parseError);
      console.log("Texto recebido (primeiros 500 chars):", planoTexto.substring(0, 500));
      throw new Error("Falha ao processar resposta da IA");
    }

    return new Response(
      JSON.stringify({
        plano: planoJSON,
        totalHoras,
        materia,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função gerar-plano-estudos:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar plano",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
