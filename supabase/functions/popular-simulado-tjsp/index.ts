import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Questões da Prova TJSP 2024 - Escrevente Técnico Judiciário (100 questões)
const questoesTJSP2024 = [
  // LÍNGUA PORTUGUESA (Questões 1-23)
  {
    numero: 1,
    area: "Língua Portuguesa",
    enunciado: "Leia a tira.\n\n[Imagem: Tirinha do Armandinho]\n\nNa frase – Sou muito conciso! –, o antônimo do adjetivo é:",
    a: "sucinto.",
    b: "prolixo.",
    c: "ambivalente.",
    d: "lacônico.",
    e: "coerente.",
    resposta: "B",
    comentario: "Conciso significa breve, resumido. O antônimo é prolixo, que significa extenso, detalhado demais."
  },
  {
    numero: 2,
    area: "Língua Portuguesa",
    enunciado: "Leia o texto 'Aliança de delinquentes' para responder.\n\nO título do texto permite compreender corretamente que o editorial",
    a: "reconhece a necessidade de uma coalizão forte entre Coreia do Norte, Rússia, China e Coreia do Sul.",
    b: "considera a aliança estabelecida entre Coreia do Norte e Rússia como algo temerário e criminoso.",
    c: "pondera sobre a necessidade de o Ocidente tratar com mais tolerância Coreia do Norte e Rússia.",
    d: "recrimina a união entre Coreia do Norte e Rússia, porque ambas têm escassez de materiais bélicos.",
    e: "aprova a intenção da China de formar um bloco com Coreia do Norte e Rússia, após coalizão destes países.",
    resposta: "B",
    comentario: "O título 'Aliança de delinquentes' demonstra claramente uma visão crítica e negativa da aliança."
  },
  {
    numero: 3,
    area: "Língua Portuguesa",
    enunciado: "O editorial defende como medida benéfica para o Ocidente que",
    a: "a Coreia do Norte tire proveito da transferência de tecnologias militares russas previstas no acordo.",
    b: "a Rússia fortaleça a parceria com a Coreia do Norte, com as exportações de combustíveis e alimentos.",
    c: "o isolamento imposto à Rússia seja estendido à Coreia do Norte e à China.",
    d: "os países ocidentais monitorem as ações entre a Coreia do Norte e a Rússia e não menosprezem as ameaças.",
    e: "a China e a Coreia do Sul sejam capazes de empreender uma guerra contra a Coreia do Norte e a Rússia.",
    resposta: "D",
    comentario: "O texto menciona que o Ocidente não pode negligenciar a necessidade de monitorar as ameaças."
  },
  {
    numero: 4,
    area: "Língua Portuguesa",
    enunciado: "Considere as passagens do texto:\n• … um arremedo de legitimidade para o tirano mais isolado do mundo.\n• Mas tudo isso os torna mais, não menos perigosos.\n\nAs passagens permitem, correta e respectivamente, as seguintes interpretações:",
    a: "o governo norte-coreano é legítimo por ser tirano; Kim e Putin representam incertezas para o mundo.",
    b: "a legitimidade do governo norte-coreano é atemporal; Kim e Putin representam mudanças obscuras.",
    c: "o governo norte-coreano carece de legitimidade; Kim e Putin representam perigo pelo isolamento.",
    d: "o isolamento norte-coreano fortalece a legitimidade; Kim e Putin representam menos perigo.",
    e: "a tirania do governo mina a legitimidade; Kim e Putin representam um poder novo.",
    resposta: "C",
    comentario: "'Arremedo' significa imitação imperfeita, indicando que a legitimidade é falsa."
  },
  {
    numero: 5,
    area: "Língua Portuguesa",
    enunciado: "Na passagem – Mas, apesar das declarações de Putin sobre os laços históricos dos dois países e das juras de Kim por um 'relacionamento inquebrantável de companheiros de armas'… –, as aspas estão empregadas com o objetivo de",
    a: "inserir trecho da fala de Kim Jong-un.",
    b: "destacar as visitas de Putin à Coreia.",
    c: "enfatizar a parceria entre as Coreias.",
    d: "alocar comentário de Vladimir Putin.",
    e: "minimizar o impacto do acordo.",
    resposta: "A",
    comentario: "As aspas indicam citação direta das palavras de Kim Jong-un."
  },
  {
    numero: 6,
    area: "Língua Portuguesa",
    enunciado: "No editorial, afirma-se que a parceria estratégica entre Coreia do Norte e Rússia contém detalhes desconhecidos. Essa ideia é ratificada pela seguinte informação do texto:",
    a: "Moscou expandiu as exportações de combustíveis e alimentos à Coreia do Norte…",
    b: "À China interessa o prolongamento da guerra na Europa, mas não sua escalada…",
    c: "… Vladimir Putin retribuiu a gentileza e viajou, pela primeira vez em 24 anos, à Coreia do Norte.",
    d: "O risco maior e mais opaco é a transferência de tecnologias militares russas ligadas a satélites…",
    e: "Uma das poucas coisas que Pyongyang tem em abundância são granadas e mísseis a granel…",
    resposta: "D",
    comentario: "A palavra 'opaco' significa não transparente, obscuro, ratificando a ideia de detalhes desconhecidos."
  },
  {
    numero: 7,
    area: "Língua Portuguesa",
    enunciado: "Está empregado em sentido figurado o termo destacado em:",
    a: "visita do ditador.",
    b: "granadas e mísseis.",
    c: "guerra na Europa.",
    d: "regime de Kim.",
    e: "laços históricos.",
    resposta: "E",
    comentario: "'Laços' está em sentido figurado, significando vínculos, ligações."
  },
  {
    numero: 8,
    area: "Língua Portuguesa",
    enunciado: "A coesão e o sentido das frases – Os dois anunciaram uma 'parceria estratégica ampla', cujos detalhes são desconhecidos. – e – … que ademais serve a Putin como laboratório… – mantêm-se com as reescritas:",
    a: "Os dois anunciaram uma 'parceria estratégica ampla', que os detalhes são desconhecidos. / … que, apesar disso, serve a Putin…",
    b: "Os dois anunciaram uma 'parceria estratégica ampla', com que os detalhes dela são desconhecidos. / … que, por certo, serve a Putin…",
    c: "Os dois anunciaram uma 'parceria estratégica ampla', da qual os detalhes são desconhecidos. / … que, além disso, serve a Putin…",
    d: "Os dois anunciaram uma 'parceria estratégica ampla', quais os seus detalhes são desconhecidos. / … que, por isso, serve a Putin…",
    e: "Os dois anunciaram uma 'parceria estratégica ampla', de cujos os detalhes dela são desconhecidos. / … que, de fato, serve a Putin…",
    resposta: "C",
    comentario: "'Cujos' = 'da qual os' e 'ademais' = 'além disso'."
  },
  {
    numero: 9,
    area: "Língua Portuguesa",
    enunciado: "Nas passagens – Há mais coisas no escambo. – e – Uma das poucas coisas que Pyongyang tem em abundância são granadas e mísseis a granel… –, as expressões destacadas significam:",
    a: "no convívio; à disposição plena.",
    b: "na permuta; em grande quantidade.",
    c: "na negociata; de valor vultoso.",
    d: "na troca; de potencial letal.",
    e: "no conluio; em números parcos.",
    resposta: "B",
    comentario: "'Escambo' significa troca, permuta. 'A granel' significa em grande quantidade."
  },
  {
    numero: 10,
    area: "Língua Portuguesa",
    enunciado: "Em conformidade com a norma-padrão de concordância verbal, as passagens permitem as reescritas:",
    a: "Devem haver limites para a profundidade dessa parceria.",
    b: "Deve existir limites para a profundidade dessa parceria.",
    c: "Existem limites para a profundidade dessa parceria. / Interessa à China o prolongamento da guerra.",
    d: "Há limites para a profundidade dessa parceria. / O prolongamento interessa à China.",
    e: "Hão de haver limites para a profundidade dessa parceria.",
    resposta: "C",
    comentario: "Existem (plural com sujeito plural), Interessa (singular com sujeito mais próximo)."
  },
  {
    numero: 11,
    area: "Língua Portuguesa",
    enunciado: "Leia o texto 'Liberdade adiada' para responder.\n\nA história narrada apresenta a personagem em uma situação de",
    a: "extrema tensão existencial, provocada pelos sofrimentos da vida difícil que levava.",
    b: "melancolia e reflexão sobre os filhos, que cresciam e logo seriam independentes.",
    c: "irritação e vontade de chorar, decorrente da perda da lata estimada no barranco.",
    d: "incontrolável tristeza e desesperança, fruto da saudade dos caminhos já trilhados.",
    e: "pleno equilíbrio emocional, com ponderações coerentes sobre a maternidade.",
    resposta: "A",
    comentario: "O texto mostra uma mulher em extrema tensão, pensando até em suicídio devido às dificuldades."
  },
  {
    numero: 12,
    area: "Língua Portuguesa",
    enunciado: "Pela passagem – Pensou em atirar a lata de água ao chão, esparramar-se no líquido, encharcar-se, fazer-se lama… – é correto afirmar que a personagem",
    a: "está fraca para carregar latas cheias de água.",
    b: "evita os caminhos que ladeiam o barranco.",
    c: "precisa molhar-se para suportar o calor.",
    d: "deseja fugir da realidade que tanto a oprime.",
    e: "quer saber exatamente como funciona o coração.",
    resposta: "D",
    comentario: "A passagem mostra o desejo de escapar da realidade, de se dissolver, fugir da opressão."
  },
  {
    numero: 13,
    area: "Língua Portuguesa",
    enunciado: "O parágrafo final do texto permite concluir que a personagem optou por",
    a: "aceitar o convite feito pelo barranco.",
    b: "se espalhar na lama contida no barranco.",
    c: "ignorar o chamado do filho mais novo.",
    d: "buscar novos desafios longe dos filhos.",
    e: "se manter na companhia dos filhos.",
    resposta: "E",
    comentario: "'Correu deixando o barranco e o sonho de liberdade para trás' indica que ela escolheu ficar com os filhos."
  },
  {
    numero: 14,
    area: "Língua Portuguesa",
    enunciado: "Na passagem – Com o fundo de madeira que tivera que mandar colocar, ficou mais pesada, mas não eram daí os seus tormentos. –, o sentido da preposição Com e da conjunção mas são:",
    a: "causa; conclusão.",
    b: "causa; oposição.",
    c: "lugar; conclusão.",
    d: "consequência; adição.",
    e: "lugar; oposição.",
    resposta: "B",
    comentario: "'Com' indica causa (por causa do fundo), 'mas' indica oposição."
  },
  {
    numero: 15,
    area: "Língua Portuguesa",
    enunciado: "A regência verbal e a regência nominal estão em conformidade com a norma-padrão em:",
    a: "Ela lembrou que tinha a lata, que preferia mais manter bem areada que nutrir a raiva.",
    b: "Ela lembrou de que tinha a lata, que preferia manter bem areada do que nutrir a raiva.",
    c: "Ela lembrou-se de que tinha a lata, que preferia manter bem areada a nutrir a raiva.",
    d: "Ela lembrou-se que tinha a lata, que preferia manter bem areada a nutrir a raiva.",
    e: "Ela lembrou-se de que tinha a lata, que preferia manter bem areada do que nutrir a raiva.",
    resposta: "C",
    comentario: "Lembrar-se de, preferir X a Y, ansioso por."
  },
  {
    numero: 16,
    area: "Língua Portuguesa",
    enunciado: "Quanto ao emprego de pronomes e à colocação pronominal, as reescritas atendem à norma-padrão em:",
    a: "Imaginou os filhos que a aguardavam e já deviam estar acordados. Odiava-os! / Tratava-a bem.",
    b: "Imaginou os filhos que aguardavam-na e já deviam estar acordados. Lhes odiava!",
    c: "Imaginou os filhos que lhe aguardavam e já deviam estar acordados. Os odiava!",
    d: "Imaginou os filhos que aguardavam-lhe e já deviam estar acordados. Odiava-lhes!",
    e: "Imaginou os filhos que aguardavam-la e já deviam estar acordados. Odiava-os!",
    resposta: "A",
    comentario: "Pronome relativo 'que' atrai próclise; verbos transitivos diretos pedem 'os/as'."
  },
  {
    numero: 17,
    area: "Língua Portuguesa",
    enunciado: "Os termos destacados são, correta e respectivamente, pronome possessivo e advérbio em:",
    a: "Gostava de sua lata de carregar água. / Como ela os amava, Nossenhor!",
    b: "… que lhe caía irremediavelmente em cima. / Correu deixando o barranco para trás.",
    c: "Sentia-se cansada. / A lata e ela, para sempre, juntas no sorriso do barranco.",
    d: "Os filhos que ela odiava! / Esperava que a qualquer momento…",
    e: "Apressou-se a ir ao encontro deles. / O barranco olhava-a, boca aberta…",
    resposta: "A",
    comentario: "'Sua' é pronome possessivo; 'Como' em 'Como ela os amava' é advérbio de intensidade."
  },
  {
    numero: 18,
    area: "Língua Portuguesa",
    enunciado: "De acordo com a norma-padrão, as lacunas devem ser preenchidas, respectivamente, com:",
    a: "à … àquela … a … a",
    b: "à … aquela … a … a",
    c: "a … aquela … a … à",
    d: "a … àquela … a … a",
    e: "a … àquela … à … à",
    resposta: "D",
    comentario: "Qualquer hora (sem crase), àquela forma (crase com demonstrativo)."
  },
  {
    numero: 19,
    area: "Língua Portuguesa",
    enunciado: "Leia o texto 'Quando o céu desaba' para responder.\n\nDe acordo com o texto, a expressão céu desabou pode ser compreendida como metáfora de",
    a: "tempestade violenta.",
    b: "catástrofe climática.",
    c: "desilusão profunda.",
    d: "momento de reflexão.",
    e: "oportunidade perdida.",
    resposta: "C",
    comentario: "A expressão 'céu desabou' é uma metáfora para uma grande desilusão ou momento de profunda tristeza."
  },
  {
    numero: 20,
    area: "Língua Portuguesa",
    enunciado: "Assinale a alternativa em que a vírgula está empregada para isolar termo deslocado de sua posição habitual na frase.",
    a: "A manhã, clara e ensolarada, convidava ao passeio.",
    b: "Os alunos, que chegaram atrasados, perderam a explicação.",
    c: "No final da tarde, as crianças brincavam no parque.",
    d: "Maria, venha cá imediatamente!",
    e: "O professor, exausto, encerrou a aula mais cedo.",
    resposta: "C",
    comentario: "O adjunto adverbial 'No final da tarde' está deslocado para o início da frase."
  },
  {
    numero: 21,
    area: "Língua Portuguesa",
    enunciado: "Assinale a alternativa em que há erro de pontuação.",
    a: "Questionou-se: por que ele agiu assim?",
    b: "Ela disse que viria, porém não apareceu.",
    c: "Os documentos necessários são: RG, CPF e comprovante de residência.",
    d: "Saiu correndo, pois estava atrasado.",
    e: "A reunião seria às 14h, no entanto foi adiada.",
    resposta: "E",
    comentario: "Antes de 'no entanto' deve haver ponto ou ponto e vírgula."
  },
  {
    numero: 22,
    area: "Língua Portuguesa",
    enunciado: "Assinale a alternativa correta quanto à concordância nominal.",
    a: "É necessário paciência neste momento.",
    b: "Seguem anexas as documentações solicitadas.",
    c: "Haviam bastantes motivos para a decisão.",
    d: "Os alunos estavam alertas durante a prova.",
    e: "Elas mesmas resolveram os problemas.",
    resposta: "E",
    comentario: "'Mesmas' concorda com 'elas'."
  },
  {
    numero: 23,
    area: "Língua Portuguesa",
    enunciado: "Assinale a alternativa em que a palavra destacada é um substantivo.",
    a: "O jantar estava delicioso.",
    b: "Vou jantar com meus amigos.",
    c: "Ele anda muito preocupado.",
    d: "A anda do cavalo é elegante.",
    e: "Preciso de um bom conselho.",
    resposta: "A",
    comentario: "'O jantar' é substantivo (precedido de artigo)."
  },
  // MATEMÁTICA E RACIOCÍNIO LÓGICO (Questões 24-30)
  {
    numero: 24,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Uma empresa tem 120 funcionários. Sabe-se que 75% deles são homens. Quantas mulheres trabalham nessa empresa?",
    a: "25",
    b: "30",
    c: "35",
    d: "40",
    e: "45",
    resposta: "B",
    comentario: "Se 75% são homens, 25% são mulheres. 25% de 120 = 30 mulheres."
  },
  {
    numero: 25,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Se todos os advogados são estudiosos e alguns estudiosos são professores, então é correto afirmar que:",
    a: "Todos os professores são advogados.",
    b: "Alguns advogados são professores.",
    c: "Nenhum professor é advogado.",
    d: "Alguns estudiosos são advogados.",
    e: "Todos os estudiosos são advogados.",
    resposta: "D",
    comentario: "Como todos os advogados são estudiosos, então alguns estudiosos são advogados (os próprios advogados)."
  },
  {
    numero: 26,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Um capital de R$ 2.000,00 foi aplicado a juros simples durante 3 meses, à taxa de 2% ao mês. Qual o montante ao final do período?",
    a: "R$ 2.060,00",
    b: "R$ 2.120,00",
    c: "R$ 2.180,00",
    d: "R$ 2.240,00",
    e: "R$ 2.300,00",
    resposta: "B",
    comentario: "J = C × i × t = 2000 × 0,02 × 3 = 120. M = C + J = 2000 + 120 = R$ 2.120,00."
  },
  {
    numero: 27,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "A negação da proposição 'Todos os juízes são imparciais' é:",
    a: "Nenhum juiz é imparcial.",
    b: "Alguns juízes não são imparciais.",
    c: "Todos os juízes são parciais.",
    d: "Alguns juízes são imparciais.",
    e: "Nenhum juiz é parcial.",
    resposta: "B",
    comentario: "A negação de 'Todos são P' é 'Alguns não são P'."
  },
  {
    numero: 28,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Em uma progressão aritmética, o primeiro termo é 5 e a razão é 3. Qual é o décimo termo?",
    a: "29",
    b: "30",
    c: "32",
    d: "35",
    e: "38",
    resposta: "C",
    comentario: "an = a1 + (n-1) × r = 5 + (10-1) × 3 = 5 + 27 = 32."
  },
  {
    numero: 29,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Se p → q é verdadeira e q é falsa, então:",
    a: "p é verdadeira.",
    b: "p é falsa.",
    c: "p pode ser verdadeira ou falsa.",
    d: "Não é possível determinar o valor de p.",
    e: "p → q é falsa.",
    resposta: "B",
    comentario: "Na implicação, se o consequente é falso e a implicação é verdadeira, o antecedente deve ser falso."
  },
  {
    numero: 30,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Qual é o próximo número da sequência: 2, 6, 18, 54, ...?",
    a: "108",
    b: "126",
    c: "162",
    d: "180",
    e: "216",
    resposta: "C",
    comentario: "É uma PG de razão 3. O próximo é 54 × 3 = 162."
  },
  // ATUALIDADES (Questões 31-40)
  {
    numero: 31,
    area: "Atualidades",
    enunciado: "Em 2024, qual país sediou os Jogos Olímpicos de Verão?",
    a: "Japão",
    b: "Estados Unidos",
    c: "França",
    d: "Austrália",
    e: "Brasil",
    resposta: "C",
    comentario: "Os Jogos Olímpicos de Verão de 2024 foram realizados em Paris, França."
  },
  {
    numero: 32,
    area: "Atualidades",
    enunciado: "O conflito entre Rússia e Ucrânia, iniciado em 2022, teve como principal motivação declarada pela Rússia:",
    a: "A disputa por recursos minerais na região.",
    b: "A expansão da OTAN em direção às fronteiras russas.",
    c: "A crise econômica europeia.",
    d: "A eleição de um presidente pró-Ocidente na Rússia.",
    e: "A descoberta de petróleo em território ucraniano.",
    resposta: "B",
    comentario: "A Rússia alegou que a expansão da OTAN representava uma ameaça à sua segurança."
  },
  {
    numero: 33,
    area: "Atualidades",
    enunciado: "Qual é a principal pauta ambiental discutida nas Conferências das Partes (COPs) da ONU?",
    a: "Preservação de espécies marinhas.",
    b: "Combate ao desmatamento na Amazônia.",
    c: "Mudanças climáticas e aquecimento global.",
    d: "Poluição dos oceanos por plástico.",
    e: "Extinção de animais em savanas africanas.",
    resposta: "C",
    comentario: "As COPs têm como foco principal as mudanças climáticas e o aquecimento global."
  },
  {
    numero: 34,
    area: "Atualidades",
    enunciado: "O BRICS, bloco econômico que inclui o Brasil, expandiu-se em 2024 com a entrada de novos países. Qual das alternativas apresenta um dos novos membros?",
    a: "México",
    b: "Argentina",
    c: "Irã",
    d: "Turquia",
    e: "Indonésia",
    resposta: "C",
    comentario: "O Irã foi um dos países que se juntou ao BRICS em 2024."
  },
  {
    numero: 35,
    area: "Atualidades",
    enunciado: "A Inteligência Artificial generativa ganhou destaque mundial em 2023 com o lançamento de qual ferramenta?",
    a: "Alexa",
    b: "Siri",
    c: "ChatGPT",
    d: "Google Assistant",
    e: "Cortana",
    resposta: "C",
    comentario: "O ChatGPT, da OpenAI, popularizou a IA generativa mundialmente."
  },
  {
    numero: 36,
    area: "Atualidades",
    enunciado: "Em 2024, qual foi o principal tema de debate sobre a reforma tributária no Brasil?",
    a: "Criação de novos impostos sobre grandes fortunas.",
    b: "Unificação de tributos sobre consumo.",
    c: "Extinção do Imposto de Renda.",
    d: "Aumento da carga tributária sobre exportações.",
    e: "Fim da tributação sobre serviços.",
    resposta: "B",
    comentario: "A reforma tributária de 2024 focou na unificação de tributos sobre consumo (IBS e CBS)."
  },
  {
    numero: 37,
    area: "Atualidades",
    enunciado: "O Marco Legal das Garantias, sancionado em 2023, tem como principal objetivo:",
    a: "Regular o mercado de criptomoedas.",
    b: "Facilitar a execução de garantias em operações de crédito.",
    c: "Criar novas modalidades de aposentadoria.",
    d: "Estabelecer regras para o trabalho remoto.",
    e: "Regulamentar o uso de inteligência artificial.",
    resposta: "B",
    comentario: "O Marco Legal das Garantias visa facilitar a execução de garantias e reduzir o spread bancário."
  },
  {
    numero: 38,
    area: "Atualidades",
    enunciado: "Qual país enfrentou um grave terremoto em 2023, causando milhares de mortes na região da Anatólia?",
    a: "Irã",
    b: "Turquia",
    c: "Grécia",
    d: "Japão",
    e: "Chile",
    resposta: "B",
    comentario: "A Turquia sofreu um devastador terremoto em fevereiro de 2023."
  },
  {
    numero: 39,
    area: "Atualidades",
    enunciado: "O conceito de 'fake news' está relacionado principalmente a:",
    a: "Notícias publicadas apenas em jornais impressos.",
    b: "Informações falsas disseminadas intencionalmente.",
    c: "Erros de digitação em matérias jornalísticas.",
    d: "Opiniões divergentes sobre fatos políticos.",
    e: "Notícias antigas republicadas na internet.",
    resposta: "B",
    comentario: "Fake news são informações falsas criadas e disseminadas intencionalmente."
  },
  {
    numero: 40,
    area: "Atualidades",
    enunciado: "Em 2024, qual foi a principal preocupação sanitária global relacionada a doenças transmitidas por mosquitos?",
    a: "Malária",
    b: "Febre amarela",
    c: "Dengue",
    d: "Zika",
    e: "Chikungunya",
    resposta: "C",
    comentario: "A dengue teve um aumento significativo de casos em 2024, especialmente no Brasil."
  },
  // NOÇÕES DE DIREITO (Questões 41-80)
  {
    numero: 41,
    area: "Noções de Direito",
    enunciado: "De acordo com a Constituição Federal, são direitos sociais:",
    a: "A educação, a saúde, a alimentação, o trabalho e a moradia.",
    b: "A liberdade, a igualdade, a segurança e a propriedade.",
    c: "A soberania, a cidadania e a dignidade da pessoa humana.",
    d: "A livre iniciativa, a livre concorrência e a defesa do consumidor.",
    e: "A legalidade, a impessoalidade, a moralidade e a publicidade.",
    resposta: "A",
    comentario: "Art. 6º da CF: São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, etc."
  },
  {
    numero: 42,
    area: "Noções de Direito",
    enunciado: "O princípio da legalidade, previsto na Constituição Federal, estabelece que:",
    a: "Todos são iguais perante a lei.",
    b: "Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei.",
    c: "É livre a manifestação do pensamento.",
    d: "A lei não prejudicará o direito adquirido.",
    e: "Todos têm direito a receber dos órgãos públicos informações de seu interesse.",
    resposta: "B",
    comentario: "Art. 5º, II, da CF: Ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei."
  },
  {
    numero: 43,
    area: "Noções de Direito",
    enunciado: "São poderes da União, independentes e harmônicos entre si:",
    a: "O Ministério Público, a Defensoria Pública e a Advocacia Pública.",
    b: "O Executivo, o Legislativo e o Judiciário.",
    c: "A União, os Estados, os Municípios e o Distrito Federal.",
    d: "O Supremo Tribunal Federal, o Superior Tribunal de Justiça e os Tribunais Regionais.",
    e: "A Câmara dos Deputados, o Senado Federal e o Congresso Nacional.",
    resposta: "B",
    comentario: "Art. 2º da CF: São Poderes da União, independentes e harmônicos entre si, o Legislativo, o Executivo e o Judiciário."
  },
  {
    numero: 44,
    area: "Noções de Direito",
    enunciado: "O habeas corpus será concedido sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por:",
    a: "Abuso de poder.",
    b: "Ilegalidade.",
    c: "Ilegalidade ou abuso de poder.",
    d: "Decisão judicial transitada em julgado.",
    e: "Prisão em flagrante.",
    resposta: "C",
    comentario: "Art. 5º, LXVIII, da CF: Conceder-se-á habeas corpus sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder."
  },
  {
    numero: 45,
    area: "Noções de Direito",
    enunciado: "No Direito Civil, a capacidade civil plena é adquirida:",
    a: "Aos 16 anos.",
    b: "Aos 18 anos.",
    c: "Aos 21 anos.",
    d: "Com a emancipação, em qualquer idade.",
    e: "Com o casamento, independentemente da idade.",
    resposta: "B",
    comentario: "Art. 5º do CC: A menoridade cessa aos dezoito anos completos, quando a pessoa fica habilitada à prática de todos os atos da vida civil."
  },
  {
    numero: 46,
    area: "Noções de Direito",
    enunciado: "São considerados absolutamente incapazes de exercer pessoalmente os atos da vida civil:",
    a: "Os maiores de 16 e menores de 18 anos.",
    b: "Os menores de 16 anos.",
    c: "Os ébrios habituais.",
    d: "Os pródigos.",
    e: "Os que não puderem exprimir sua vontade.",
    resposta: "B",
    comentario: "Art. 3º do CC: São absolutamente incapazes de exercer pessoalmente os atos da vida civil os menores de 16 anos."
  },
  {
    numero: 47,
    area: "Noções de Direito",
    enunciado: "O negócio jurídico nulo:",
    a: "Pode ser ratificado pelas partes.",
    b: "Convalesce pelo decurso do tempo.",
    c: "Não é suscetível de confirmação, nem convalesce pelo decurso do tempo.",
    d: "Produz efeitos até ser anulado por sentença judicial.",
    e: "Pode ser confirmado se não prejudicar terceiros.",
    resposta: "C",
    comentario: "Art. 169 do CC: O negócio jurídico nulo não é suscetível de confirmação, nem convalesce pelo decurso do tempo."
  },
  {
    numero: 48,
    area: "Noções de Direito",
    enunciado: "A prescrição pode ser interrompida por:",
    a: "Qualquer ato do devedor que importe reconhecimento do direito.",
    b: "Mera inércia do credor.",
    c: "Acordo verbal entre as partes.",
    d: "Decurso de metade do prazo prescricional.",
    e: "Publicação de edital em jornal de grande circulação.",
    resposta: "A",
    comentario: "Art. 202, VI, do CC: A interrupção da prescrição pode dar-se por qualquer ato inequívoco que importe reconhecimento do direito pelo devedor."
  },
  {
    numero: 49,
    area: "Noções de Direito",
    enunciado: "No Direito Penal, o princípio da legalidade determina que:",
    a: "Não há crime sem lei anterior que o defina.",
    b: "A lei penal pode retroagir para beneficiar o réu.",
    c: "O juiz pode criar tipos penais por analogia.",
    d: "Os costumes podem definir crimes.",
    e: "A pena pode ser agravada por interpretação extensiva.",
    resposta: "A",
    comentario: "Art. 1º do CP: Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal."
  },
  {
    numero: 50,
    area: "Noções de Direito",
    enunciado: "São circunstâncias que sempre atenuam a pena:",
    a: "Ter o agente cometido o crime por motivo fútil.",
    b: "Ser o agente menor de 21 anos na data do fato.",
    c: "Ter o agente cometido o crime mediante paga ou promessa de recompensa.",
    d: "Ter o agente cometido o crime à traição.",
    e: "Ter o agente praticado o crime em estado de embriaguez.",
    resposta: "B",
    comentario: "Art. 65, I, do CP: São circunstâncias que sempre atenuam a pena ser o agente menor de 21 anos na data do fato."
  },
  {
    numero: 51,
    area: "Noções de Direito",
    enunciado: "O crime de peculato consiste em:",
    a: "Solicitar vantagem indevida em razão da função pública.",
    b: "Apropriar-se de bem móvel de que tem a posse em razão do cargo.",
    c: "Exigir tributo que sabe indevido.",
    d: "Retardar ato de ofício para satisfazer interesse pessoal.",
    e: "Patrocinar interesse privado perante a administração.",
    resposta: "B",
    comentario: "Art. 312 do CP: Peculato é apropriar-se o funcionário público de dinheiro, valor ou qualquer outro bem móvel, público ou particular, de que tem a posse em razão do cargo."
  },
  {
    numero: 52,
    area: "Noções de Direito",
    enunciado: "No processo penal, a prisão preventiva pode ser decretada:",
    a: "Somente após a sentença condenatória.",
    b: "Para garantia da ordem pública, da ordem econômica, por conveniência da instrução criminal ou para assegurar a aplicação da lei penal.",
    c: "Apenas em crimes hediondos.",
    d: "Somente quando houver confissão do acusado.",
    e: "Automaticamente em todos os crimes dolosos.",
    resposta: "B",
    comentario: "Art. 312 do CPP: A prisão preventiva poderá ser decretada para garantia da ordem pública, da ordem econômica, por conveniência da instrução criminal ou para assegurar a aplicação da lei penal."
  },
  {
    numero: 53,
    area: "Noções de Direito",
    enunciado: "A competência para julgar crimes contra a organização do trabalho é da:",
    a: "Justiça Estadual.",
    b: "Justiça do Trabalho.",
    c: "Justiça Federal.",
    d: "Justiça Militar.",
    e: "Justiça Eleitoral.",
    resposta: "C",
    comentario: "Art. 109, VI, da CF: Compete aos juízes federais processar e julgar os crimes contra a organização do trabalho."
  },
  {
    numero: 54,
    area: "Noções de Direito",
    enunciado: "No processo civil, a petição inicial será indeferida quando:",
    a: "O autor desistir da ação.",
    b: "For inepta.",
    c: "As partes transigirem.",
    d: "O réu reconhecer a procedência do pedido.",
    e: "Houver perempção.",
    resposta: "B",
    comentario: "Art. 330 do CPC: A petição inicial será indeferida quando for inepta, a parte for manifestamente ilegítima, o autor carecer de interesse processual ou não forem atendidas as prescrições dos arts. 106 e 321."
  },
  {
    numero: 55,
    area: "Noções de Direito",
    enunciado: "A citação válida produz os seguintes efeitos:",
    a: "Extingue o processo sem resolução do mérito.",
    b: "Torna prevento o juízo, induz litispendência e faz litigiosa a coisa.",
    c: "Encerra a fase postulatória.",
    d: "Determina o início do prazo para contestação, apenas.",
    e: "Suspende o processo.",
    resposta: "B",
    comentario: "Art. 240 do CPC: A citação válida torna prevento o juízo, induz litispendência e faz litigiosa a coisa."
  },
  {
    numero: 56,
    area: "Noções de Direito",
    enunciado: "No Direito Administrativo, o princípio da impessoalidade significa que:",
    a: "O administrador deve agir com honestidade.",
    b: "Os atos administrativos devem ser públicos.",
    c: "A Administração deve tratar todos os administrados sem discriminações.",
    d: "O administrador pode agir discricionariamente.",
    e: "Os servidores públicos são estáveis.",
    resposta: "C",
    comentario: "O princípio da impessoalidade determina que a Administração deve tratar igualitariamente os administrados."
  },
  {
    numero: 57,
    area: "Noções de Direito",
    enunciado: "São formas de provimento de cargo público:",
    a: "Nomeação, promoção, readaptação, reversão, aproveitamento, reintegração e recondução.",
    b: "Concurso público, contratação temporária e terceirização.",
    c: "Eleição, indicação política e livre nomeação.",
    d: "Estágio probatório, efetivação e aposentadoria.",
    e: "Disponibilidade, licença e afastamento.",
    resposta: "A",
    comentario: "Art. 8º da Lei 8.112/90: São formas de provimento: nomeação, promoção, readaptação, reversão, aproveitamento, reintegração e recondução."
  },
  {
    numero: 58,
    area: "Noções de Direito",
    enunciado: "O poder hierárquico confere ao superior o poder de:",
    a: "Aplicar sanções a particulares.",
    b: "Dar ordens, fiscalizar, delegar e avocar.",
    c: "Legislar sobre matéria administrativa.",
    d: "Julgar recursos administrativos de outras entidades.",
    e: "Criar cargos públicos.",
    resposta: "B",
    comentario: "O poder hierárquico permite ao superior dar ordens, fiscalizar, delegar, avocar e rever atos dos subordinados."
  },
  {
    numero: 59,
    area: "Noções de Direito",
    enunciado: "A Lei de Improbidade Administrativa prevê como sanção:",
    a: "Pena privativa de liberdade.",
    b: "Suspensão dos direitos políticos.",
    c: "Pena de morte civil.",
    d: "Expulsão do território nacional.",
    e: "Prisão perpétua.",
    resposta: "B",
    comentario: "Art. 12 da Lei 8.429/92: Dentre as sanções, está a suspensão dos direitos políticos."
  },
  {
    numero: 60,
    area: "Noções de Direito",
    enunciado: "A licitação na modalidade pregão é utilizada para:",
    a: "Obras de engenharia de grande porte.",
    b: "Aquisição de bens e serviços comuns.",
    c: "Alienação de bens imóveis.",
    d: "Concessão de serviços públicos.",
    e: "Contratação de serviços técnicos especializados.",
    resposta: "B",
    comentario: "O pregão é modalidade de licitação para aquisição de bens e serviços comuns."
  },
  {
    numero: 61,
    area: "Noções de Direito",
    enunciado: "De acordo com as Normas da Corregedoria Geral da Justiça do TJSP, o escrevente técnico judiciário é subordinado:",
    a: "Ao juiz de direito.",
    b: "Ao escrivão judicial.",
    c: "Ao oficial de justiça.",
    d: "Ao promotor de justiça.",
    e: "Ao defensor público.",
    resposta: "B",
    comentario: "O escrevente técnico judiciário é subordinado hierarquicamente ao escrivão judicial."
  },
  {
    numero: 62,
    area: "Noções de Direito",
    enunciado: "Compete ao escrevente técnico judiciário:",
    a: "Proferir sentenças nos processos.",
    b: "Atender ao público e prestar informações sobre andamento processual.",
    c: "Representar o Ministério Público.",
    d: "Defender os interesses dos hipossuficientes.",
    e: "Presidir audiências.",
    resposta: "B",
    comentario: "Entre as atribuições do escrevente está o atendimento ao público e informações processuais."
  },
  {
    numero: 63,
    area: "Noções de Direito",
    enunciado: "A Lei nº 8.935/94 dispõe sobre:",
    a: "O regime jurídico dos servidores públicos.",
    b: "Os serviços notariais e de registro.",
    c: "O processo administrativo federal.",
    d: "A Lei de Licitações.",
    e: "O Código de Defesa do Consumidor.",
    resposta: "B",
    comentario: "A Lei 8.935/94 regulamenta os serviços notariais e de registro (Lei dos Cartórios)."
  },
  {
    numero: 64,
    area: "Noções de Direito",
    enunciado: "O princípio da continuidade do registro público significa que:",
    a: "Os registros devem ser feitos em dias úteis.",
    b: "O histórico do imóvel deve constar de forma encadeada.",
    c: "O cartório deve funcionar ininterruptamente.",
    d: "Os registros não podem ser cancelados.",
    e: "Os emolumentos devem ser cobrados continuamente.",
    resposta: "B",
    comentario: "O princípio da continuidade determina que o registro deve manter o encadeamento dos titulares do imóvel."
  },
  {
    numero: 65,
    area: "Noções de Direito",
    enunciado: "A matrícula no Registro de Imóveis:",
    a: "É facultativa.",
    b: "Pode ser dispensada em caso de usucapião.",
    c: "É o ato que individualiza o imóvel.",
    d: "Pode ser feita verbalmente.",
    e: "Não precisa conter a descrição do imóvel.",
    resposta: "C",
    comentario: "A matrícula é o ato que individualiza o imóvel no registro imobiliário."
  },
  {
    numero: 66,
    area: "Noções de Direito",
    enunciado: "O protesto de título tem como finalidade:",
    a: "Executar o devedor judicialmente.",
    b: "Comprovar a inadimplência do devedor.",
    c: "Cancelar a dívida.",
    d: "Transferir a propriedade do bem.",
    e: "Registrar a compra e venda.",
    resposta: "B",
    comentario: "O protesto tem como finalidade provar a inadimplência e o descumprimento de obrigação."
  },
  {
    numero: 67,
    area: "Noções de Direito",
    enunciado: "De acordo com o Código de Processo Civil, a petição inicial deve indicar:",
    a: "O nome do advogado do réu.",
    b: "O juízo a que é dirigida, os nomes e qualificação das partes, os fatos e fundamentos jurídicos do pedido, o pedido e o valor da causa.",
    c: "A sentença que se pretende obter.",
    d: "O número do processo anterior.",
    e: "A decisão liminar desejada.",
    resposta: "B",
    comentario: "Art. 319 do CPC: A petição inicial indicará o juízo, as partes, os fatos, os fundamentos, o pedido e o valor da causa."
  },
  {
    numero: 68,
    area: "Noções de Direito",
    enunciado: "A contestação deve ser apresentada no prazo de:",
    a: "5 dias.",
    b: "10 dias.",
    c: "15 dias.",
    d: "20 dias.",
    e: "30 dias.",
    resposta: "C",
    comentario: "Art. 335 do CPC: O réu poderá oferecer contestação, por petição, no prazo de 15 dias."
  },
  {
    numero: 69,
    area: "Noções de Direito",
    enunciado: "A tutela de urgência será concedida quando houver:",
    a: "Pedido da parte contrária.",
    b: "Probabilidade do direito e perigo de dano ou risco ao resultado útil do processo.",
    c: "Trânsito em julgado da sentença.",
    d: "Acordo entre as partes.",
    e: "Desistência do autor.",
    resposta: "B",
    comentario: "Art. 300 do CPC: A tutela de urgência será concedida quando houver probabilidade do direito e perigo de dano ou risco ao resultado útil do processo."
  },
  {
    numero: 70,
    area: "Noções de Direito",
    enunciado: "São recursos no processo civil:",
    a: "Mandado de segurança, habeas corpus e habeas data.",
    b: "Apelação, agravo de instrumento, embargos de declaração e recurso especial.",
    c: "Ação rescisória, ação anulatória e ação declaratória.",
    d: "Inquérito civil, termo de ajustamento de conduta e recomendação.",
    e: "Queixa-crime, representação e denúncia.",
    resposta: "B",
    comentario: "Art. 994 do CPC: São recursos a apelação, o agravo de instrumento, o agravo interno, os embargos de declaração, o recurso ordinário, o recurso especial, o recurso extraordinário e os embargos de divergência."
  },
  {
    numero: 71,
    area: "Noções de Direito",
    enunciado: "A coisa julgada material torna:",
    a: "O processo sigiloso.",
    b: "A sentença imutável e indiscutível.",
    c: "A petição inicial inepta.",
    d: "O réu revel.",
    e: "O juiz suspeito.",
    resposta: "B",
    comentario: "Art. 502 do CPC: Denomina-se coisa julgada material a autoridade que torna imutável e indiscutível a decisão de mérito não mais sujeita a recurso."
  },
  {
    numero: 72,
    area: "Noções de Direito",
    enunciado: "O cumprimento de sentença que reconheça a exigibilidade de obrigação de pagar quantia certa:",
    a: "Dispensa intimação do devedor.",
    b: "Depende de nova citação do devedor.",
    c: "Far-se-á a requerimento do exequente, com intimação do executado para pagar em 15 dias.",
    d: "É automático, independentemente de requerimento.",
    e: "Só pode ser iniciado após 30 dias do trânsito em julgado.",
    resposta: "C",
    comentario: "Art. 523 do CPC: No caso de condenação em quantia certa, o cumprimento definitivo da sentença far-se-á a requerimento do exequente, sendo o executado intimado para pagar o débito em 15 dias."
  },
  {
    numero: 73,
    area: "Noções de Direito",
    enunciado: "No processo penal, a denúncia ou queixa deve conter:",
    a: "A exposição do fato criminoso, a qualificação do acusado, a classificação do crime e o rol de testemunhas.",
    b: "Somente o nome do acusado.",
    c: "A sentença condenatória.",
    d: "O parecer do delegado de polícia.",
    e: "A confissão do acusado.",
    resposta: "A",
    comentario: "Art. 41 do CPP: A denúncia ou queixa conterá a exposição do fato criminoso, a qualificação do acusado, a classificação do crime e, quando necessário, o rol das testemunhas."
  },
  {
    numero: 74,
    area: "Noções de Direito",
    enunciado: "O inquérito policial:",
    a: "É procedimento obrigatório para a ação penal.",
    b: "É procedimento dispensável, de natureza inquisitória.",
    c: "Garante o contraditório e a ampla defesa.",
    d: "É presidido pelo Ministério Público.",
    e: "Tem prazo de conclusão de 10 dias, improrrogável.",
    resposta: "B",
    comentario: "O inquérito policial é procedimento administrativo, de natureza inquisitória e dispensável para a ação penal."
  },
  {
    numero: 75,
    area: "Noções de Direito",
    enunciado: "A audiência de custódia deve ser realizada em até:",
    a: "12 horas após a prisão.",
    b: "24 horas após a prisão.",
    c: "48 horas após a prisão.",
    d: "72 horas após a prisão.",
    e: "5 dias após a prisão.",
    resposta: "B",
    comentario: "A audiência de custódia deve ocorrer em até 24 horas após a prisão em flagrante."
  },
  {
    numero: 76,
    area: "Noções de Direito",
    enunciado: "São princípios que regem a Administração Pública, expressamente previstos na Constituição Federal:",
    a: "Razoabilidade, proporcionalidade e segurança jurídica.",
    b: "Legalidade, impessoalidade, moralidade, publicidade e eficiência.",
    c: "Supremacia do interesse público, autotutela e continuidade.",
    d: "Motivação, finalidade e interesse público.",
    e: "Contraditório, ampla defesa e devido processo legal.",
    resposta: "B",
    comentario: "Art. 37, caput, da CF: A administração pública direta e indireta obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência."
  },
  {
    numero: 77,
    area: "Noções de Direito",
    enunciado: "O ato administrativo é nulo quando:",
    a: "Praticado com competência vinculada.",
    b: "Contém vício insanável.",
    c: "O administrado não concorda com seu conteúdo.",
    d: "Decorre de poder discricionário.",
    e: "É publicado em diário oficial.",
    resposta: "B",
    comentario: "O ato administrativo é nulo quando apresenta vício insanável em seus elementos essenciais."
  },
  {
    numero: 78,
    area: "Noções de Direito",
    enunciado: "A responsabilidade civil do Estado por atos de seus agentes é:",
    a: "Subjetiva, dependendo de comprovação de culpa.",
    b: "Objetiva, na modalidade risco administrativo.",
    c: "Inexistente, pois o Estado é soberano.",
    d: "Limitada aos atos lícitos.",
    e: "Condicionada à prévia condenação criminal do agente.",
    resposta: "B",
    comentario: "Art. 37, §6º, da CF: A responsabilidade do Estado é objetiva, baseada na teoria do risco administrativo."
  },
  {
    numero: 79,
    area: "Noções de Direito",
    enunciado: "O processo administrativo disciplinar é instaurado para:",
    a: "Apurar responsabilidade civil do servidor.",
    b: "Apurar infração funcional de servidor público.",
    c: "Contratar servidores temporários.",
    d: "Realizar licitação.",
    e: "Promover servidores.",
    resposta: "B",
    comentario: "O PAD tem a finalidade de apurar infração funcional praticada por servidor público."
  },
  {
    numero: 80,
    area: "Noções de Direito",
    enunciado: "São deveres do servidor público, de acordo com a Lei 8.112/90:",
    a: "Participar de greves e paralisações.",
    b: "Exercer com zelo e dedicação as atribuições do cargo.",
    c: "Recusar-se a prestar informações ao público.",
    d: "Ausentar-se do serviço sem autorização.",
    e: "Manter sob sua chefia cônjuge ou parente.",
    resposta: "B",
    comentario: "Art. 116 da Lei 8.112/90: São deveres do servidor exercer com zelo e dedicação as atribuições do cargo."
  },
  // INFORMÁTICA (Questões 81-90)
  {
    numero: 81,
    area: "Informática",
    enunciado: "No Microsoft Word, o atalho Ctrl+C serve para:",
    a: "Colar o texto selecionado.",
    b: "Copiar o texto selecionado.",
    c: "Recortar o texto selecionado.",
    d: "Centralizar o texto selecionado.",
    e: "Criar um novo documento.",
    resposta: "B",
    comentario: "Ctrl+C é o atalho universal para copiar."
  },
  {
    numero: 82,
    area: "Informática",
    enunciado: "No Microsoft Excel, a função SOMA é utilizada para:",
    a: "Calcular a média dos valores.",
    b: "Somar os valores de um intervalo de células.",
    c: "Contar o número de células preenchidas.",
    d: "Encontrar o maior valor.",
    e: "Concatenar textos.",
    resposta: "B",
    comentario: "A função SOMA adiciona todos os números em um intervalo de células."
  },
  {
    numero: 83,
    area: "Informática",
    enunciado: "O protocolo HTTPS é utilizado para:",
    a: "Transferência de arquivos entre servidores.",
    b: "Envio de e-mails.",
    c: "Navegação segura na internet.",
    d: "Acesso remoto a computadores.",
    e: "Compartilhamento de impressoras.",
    resposta: "C",
    comentario: "HTTPS (Hypertext Transfer Protocol Secure) é usado para navegação segura na web."
  },
  {
    numero: 84,
    area: "Informática",
    enunciado: "Um firewall é:",
    a: "Um tipo de vírus de computador.",
    b: "Um software ou hardware que monitora e controla o tráfego de rede.",
    c: "Um programa para edição de textos.",
    d: "Um dispositivo de armazenamento externo.",
    e: "Um tipo de impressora.",
    resposta: "B",
    comentario: "Firewall é um sistema de segurança que monitora e controla o tráfego de rede."
  },
  {
    numero: 85,
    area: "Informática",
    enunciado: "O phishing é uma técnica de:",
    a: "Backup de dados.",
    b: "Compressão de arquivos.",
    c: "Fraude eletrônica para obter informações confidenciais.",
    d: "Desfragmentação de disco.",
    e: "Atualização de software.",
    resposta: "C",
    comentario: "Phishing é uma técnica fraudulenta para obter dados pessoais e financeiros."
  },
  {
    numero: 86,
    area: "Informática",
    enunciado: "Na computação em nuvem, o termo SaaS significa:",
    a: "Software as a Service.",
    b: "Storage as a System.",
    c: "Security as a Solution.",
    d: "Server as a Service.",
    e: "System as a Software.",
    resposta: "A",
    comentario: "SaaS (Software as a Service) é um modelo de distribuição de software pela nuvem."
  },
  {
    numero: 87,
    area: "Informática",
    enunciado: "No Windows, a combinação de teclas Alt+Tab serve para:",
    a: "Fechar o programa atual.",
    b: "Alternar entre janelas abertas.",
    c: "Abrir o Gerenciador de Tarefas.",
    d: "Minimizar todas as janelas.",
    e: "Reiniciar o computador.",
    resposta: "B",
    comentario: "Alt+Tab permite alternar entre as janelas abertas no Windows."
  },
  {
    numero: 88,
    area: "Informática",
    enunciado: "O backup incremental:",
    a: "Copia todos os arquivos do sistema.",
    b: "Copia apenas os arquivos modificados desde o último backup.",
    c: "Exclui os arquivos antigos.",
    d: "Compacta todos os arquivos.",
    e: "Criptografa os arquivos de sistema.",
    resposta: "B",
    comentario: "O backup incremental copia apenas os arquivos alterados desde o último backup."
  },
  {
    numero: 89,
    area: "Informática",
    enunciado: "No Microsoft PowerPoint, o modo de exibição de 'Classificação de Slides' permite:",
    a: "Editar o texto dos slides.",
    b: "Visualizar e reorganizar os slides em miniatura.",
    c: "Apresentar os slides para o público.",
    d: "Adicionar animações aos objetos.",
    e: "Inserir vídeos nos slides.",
    resposta: "B",
    comentario: "O modo Classificação de Slides mostra miniaturas para reorganização."
  },
  {
    numero: 90,
    area: "Informática",
    enunciado: "Um endereço IP versão 4 (IPv4) é composto por:",
    a: "6 grupos de 2 dígitos hexadecimais.",
    b: "4 grupos de números decimais separados por pontos.",
    c: "8 grupos de 4 dígitos hexadecimais.",
    d: "12 caracteres alfanuméricos.",
    e: "Uma sequência de 128 bits.",
    resposta: "B",
    comentario: "IPv4 é composto por 4 octetos decimais separados por pontos (ex: 192.168.0.1)."
  },
  // CONHECIMENTOS ESPECÍFICOS (Questões 91-100)
  {
    numero: 91,
    area: "Conhecimentos Específicos",
    enunciado: "O escrevente técnico judiciário deve tratar os magistrados e promotores de justiça, respectivamente, por:",
    a: "Vossa Senhoria e Vossa Senhoria.",
    b: "Vossa Excelência e Vossa Excelência.",
    c: "Vossa Magnificência e Vossa Excelência.",
    d: "Vossa Senhoria e Vossa Excelência.",
    e: "Vossa Excelência e Vossa Senhoria.",
    resposta: "B",
    comentario: "Tanto magistrados quanto membros do Ministério Público são tratados por Vossa Excelência."
  },
  {
    numero: 92,
    area: "Conhecimentos Específicos",
    enunciado: "A certidão é um documento que:",
    a: "Contém a opinião do escrivão sobre um fato.",
    b: "Reproduz fielmente o que consta nos autos ou livros.",
    c: "Cria novos direitos para as partes.",
    d: "Substitui a sentença judicial.",
    e: "É emitida exclusivamente pelo juiz.",
    resposta: "B",
    comentario: "A certidão reproduz fielmente o conteúdo de documentos, autos ou livros."
  },
  {
    numero: 93,
    area: "Conhecimentos Específicos",
    enunciado: "O termo de audiência deve conter:",
    a: "Apenas a assinatura do juiz.",
    b: "O resumo dos fatos ocorridos na audiência, as decisões proferidas e a assinatura do juiz e das partes.",
    c: "Somente a sentença.",
    d: "Apenas a identificação das partes.",
    e: "O parecer do Ministério Público.",
    resposta: "B",
    comentario: "O termo de audiência documenta os fatos, decisões e deve conter as assinaturas necessárias."
  },
  {
    numero: 94,
    area: "Conhecimentos Específicos",
    enunciado: "A distribuição de processos tem por finalidade:",
    a: "Arquivar os processos antigos.",
    b: "Dividir equitativamente os processos entre os juízes.",
    c: "Extinguir os processos prescritos.",
    d: "Nomear advogados para as partes.",
    e: "Publicar as sentenças.",
    resposta: "B",
    comentario: "A distribuição visa dividir equitativamente o trabalho entre os juízes competentes."
  },
  {
    numero: 95,
    area: "Conhecimentos Específicos",
    enunciado: "A autuação de um processo consiste em:",
    a: "Proferir sentença.",
    b: "Registrar e organizar as peças do processo, formando os autos.",
    c: "Publicar a decisão no Diário Oficial.",
    d: "Intimar as partes.",
    e: "Arquivar o processo.",
    resposta: "B",
    comentario: "Autuação é o ato de registrar e organizar o processo, formando os autos."
  },
  {
    numero: 96,
    area: "Conhecimentos Específicos",
    enunciado: "A conclusão dos autos ao juiz significa:",
    a: "O encerramento definitivo do processo.",
    b: "O envio dos autos para apreciação e decisão do magistrado.",
    c: "O arquivamento do processo.",
    d: "A intimação das partes.",
    e: "A publicação da sentença.",
    resposta: "B",
    comentario: "Conclusão é o ato de enviar os autos ao juiz para conhecimento e decisão."
  },
  {
    numero: 97,
    area: "Conhecimentos Específicos",
    enunciado: "O malote digital no Poder Judiciário serve para:",
    a: "Armazenar documentos pessoais dos servidores.",
    b: "Transmitir documentos entre unidades judiciais de forma eletrônica.",
    c: "Enviar e-mails pessoais.",
    d: "Realizar backup dos processos.",
    e: "Instalar softwares nos computadores.",
    resposta: "B",
    comentario: "O malote digital é utilizado para transmissão eletrônica de documentos entre unidades."
  },
  {
    numero: 98,
    area: "Conhecimentos Específicos",
    enunciado: "No processo eletrônico, a assinatura digital tem como função:",
    a: "Apenas identificar o autor do documento.",
    b: "Garantir a autenticidade, integridade e não repúdio do documento.",
    c: "Substituir a necessidade de protocolo.",
    d: "Permitir o acesso público irrestrito aos autos.",
    e: "Criptografar os dados pessoais das partes.",
    resposta: "B",
    comentario: "A assinatura digital garante autenticidade, integridade e não repúdio."
  },
  {
    numero: 99,
    area: "Conhecimentos Específicos",
    enunciado: "O cadastro de partes e advogados no sistema processual é de responsabilidade:",
    a: "Exclusiva do advogado.",
    b: "Do escrevente técnico judiciário.",
    c: "Do juiz.",
    d: "Do oficial de justiça.",
    e: "Do perito.",
    resposta: "B",
    comentario: "O cadastro de partes e advogados é uma das atribuições do escrevente."
  },
  {
    numero: 100,
    area: "Conhecimentos Específicos",
    enunciado: "A carga dos autos significa:",
    a: "O peso físico do processo.",
    b: "A retirada dos autos do cartório por advogado ou parte autorizada.",
    c: "O número de páginas do processo.",
    d: "A quantidade de processos distribuídos.",
    e: "O valor da causa.",
    resposta: "B",
    comentario: "Carga é a retirada dos autos do cartório por advogado ou parte autorizada, mediante controle."
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { inicio = 1, fim = 100 } = await req.json();

    console.log(`Processando questões ${inicio} a ${fim}`);

    const questoesParaInserir = questoesTJSP2024.filter(
      q => q.numero >= inicio && q.numero <= fim
    );

    let inseridas = 0;
    let erros = 0;

    for (const questao of questoesParaInserir) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('SIMULADO-TJSP')
          .select('id')
          .eq('numero', questao.numero)
          .single();

        if (existing) {
          console.log(`Questão ${questao.numero} já existe, pulando...`);
          continue;
        }

        const { error } = await supabase
          .from('SIMULADO-TJSP')
          .insert({
            numero: questao.numero,
            area: questao.area,
            enunciado: questao.enunciado,
            a: questao.a,
            b: questao.b,
            c: questao.c,
            d: questao.d,
            e: questao.e,
            resposta: questao.resposta,
            comentario: questao.comentario,
            ano: 2024,
            prova: "TJSP - Escrevente Técnico Judiciário"
          });

        if (error) {
          console.error(`Erro ao inserir questão ${questao.numero}:`, error);
          erros++;
        } else {
          console.log(`Questão ${questao.numero} inserida com sucesso`);
          inseridas++;
        }
      } catch (e) {
        console.error(`Erro na questão ${questao.numero}:`, e);
        erros++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inseridas, 
        erros,
        total: questoesParaInserir.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
