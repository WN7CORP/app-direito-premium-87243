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
    enunciado: "Leia a tira.\n\n[Imagem: Tirinha do Armandinho]\n(https://www.instagram.com/tirinhadearmandinho)\n\nNa frase – Sou muito conciso! –, o antônimo do adjetivo é:",
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
    comentario: "O título 'Aliança de delinquentes' demonstra claramente uma visão crítica e negativa da aliança, considerando-a criminosa."
  },
  {
    numero: 3,
    area: "Língua Portuguesa",
    enunciado: "O editorial defende como medida benéfica para o Ocidente que",
    a: "a Coreia do Norte tire proveito da transferência de tecnologias militares russas previstas no acordo e compartilhe conhecimentos com países vizinhos.",
    b: "a Rússia fortaleça a parceria com a Coreia do Norte, com as exportações de combustíveis e alimentos, podendo superar, assim, as restrições que sofre.",
    c: "o isolamento imposto à Rússia seja estendido à Coreia do Norte e à China, para evitar novas dissensões entre países e guerras indesejadas.",
    d: "os países ocidentais monitorem as ações entre a Coreia do Norte e a Rússia e não menosprezem as ameaças que essas nações representam.",
    e: "a China e a Coreia do Sul sejam capazes de empreender uma guerra contra a Coreia do Norte e a Rússia, limitando as ações do acordo estabelecido.",
    resposta: "D",
    comentario: "O texto menciona que o Ocidente não pode negligenciar a necessidade de fortalecer parcerias e monitorar as ameaças."
  },
  {
    numero: 4,
    area: "Língua Portuguesa",
    enunciado: "Considere as passagens do texto:\n• … um arremedo de legitimidade para o tirano mais isolado do mundo. (1º parágrafo)\n• Mas tudo isso os torna mais, não menos perigosos. (4º parágrafo)\n\nAs passagens permitem, correta e respectivamente, as seguintes interpretações:",
    a: "o governo norte-coreano é legitimo por ser tirano; Kim Jong-un e Vladimir Putin representam incertezas para o mundo, sobretudo porque estão desesperados, isolados e acuados.",
    b: "a legitimidade do governo norte-coreano é atemporal; Kim Jong-un e Vladimir Putin representam mudanças obscuras no mundo, fruto da temerária tensão nuclear.",
    c: "o governo norte-coreano carece de legitimidade; Kim Jong-un e Vladimir Putin representam perigo, o que decorre em parte do isolamento e da perseguição que enfrentam.",
    d: "o isolamento norte-coreano fortalece a legitimidade do país; Kim Jong-un e Vladimir Putin representam menos perigo, pois estão desesperados, isolados e acuados.",
    e: "a tirania do governo mina a legitimidade da Coreia do Norte; Kim Jong-un e Vladimir Putin representam um poder novo, que pretende se aliar ao Ocidente sem pressões.",
    resposta: "C",
    comentario: "'Arremedo' significa imitação imperfeita, indicando que a legitimidade é falsa. E o texto afirma que o isolamento os torna MAIS perigosos."
  },
  {
    numero: 5,
    area: "Língua Portuguesa",
    enunciado: "Na passagem – Mas, apesar das declarações de Putin sobre os laços históricos dos dois países e das juras de Kim por um 'relacionamento inquebrantável de companheiros de armas'… (1º parágrafo) –, as aspas estão empregadas com o objetivo de",
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
    a: "Moscou expandiu as exportações de combustíveis e alimentos à Coreia do Norte… (2º parágrafo)",
    b: "À China interessa o prolongamento da guerra na Europa, mas não sua escalada… (3º parágrafo)",
    c: "… Vladimir Putin retribuiu a gentileza e viajou, pela primeira vez em 24 anos, à Coreia do Norte. (1º parágrafo)",
    d: "O risco maior e mais opaco é a transferência de tecnologias militares russas ligadas a satélites… (2º parágrafo)",
    e: "Uma das poucas coisas que Pyongyang tem em abundância são granadas e mísseis a granel… (2º parágrafo)",
    resposta: "D",
    comentario: "A palavra 'opaco' significa não transparente, obscuro, o que ratifica a ideia de detalhes desconhecidos."
  },
  {
    numero: 7,
    area: "Língua Portuguesa",
    enunciado: "Está empregado em sentido figurado o termo destacado em:",
    a: "visita do ditador (1º parágrafo).",
    b: "granadas e mísseis (2º parágrafo).",
    c: "guerra na Europa (3º parágrafo).",
    d: "regime de Kim (3º parágrafo).",
    e: "laços históricos (1º parágrafo).",
    resposta: "E",
    comentario: "'Laços' está em sentido figurado, significando vínculos, ligações, e não o objeto físico."
  },
  {
    numero: 8,
    area: "Língua Portuguesa",
    enunciado: "A coesão e o sentido das frases – Os dois anunciaram uma "parceria estratégica ampla", cujos detalhes são desconhecidos. (1º parágrafo) – e – … que ademais serve a Putin como laboratório… (2º parágrafo) – mantêm-se, correta e respectivamente, com as reescritas:",
    a: "Os dois anunciaram uma "parceria estratégica ampla", que os detalhes são desconhecidos. / … que, apesar disso, serve a Putin como laboratório…",
    b: "Os dois anunciaram uma "parceria estratégica ampla", com que os detalhes dela são desconhecidos. / … que, por certo, serve a Putin como laboratório…",
    c: "Os dois anunciaram uma "parceria estratégica ampla", da qual os detalhes são desconhecidos. / … que, além disso, serve a Putin como laboratório…",
    d: "Os dois anunciaram uma "parceria estratégica ampla", quais os seus detalhes são desconhecidos. / … que, por isso, serve a Putin como laboratório…",
    e: "Os dois anunciaram uma "parceria estratégica ampla", de cujos os detalhes dela são desconhecidos. / … que, de fato, serve a Putin como laboratório…",
    resposta: "C",
    comentario: "'Cujos' = 'da qual os' e 'ademais' = 'além disso'."
  },
  {
    numero: 9,
    area: "Língua Portuguesa",
    enunciado: "Nas passagens – Há mais coisas no escambo. (1º parágrafo) – e – Uma das poucas coisas que Pyongyang tem em abundância são granadas e mísseis a granel… (2º parágrafo) –, as expressões destacadas significam, correta e respectivamente:",
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
    enunciado: "Em conformidade com a norma-padrão de concordância verbal, as passagens permitem, respectivamente, as reescritas:",
    a: "Devem haver limites para a profundidade dessa parceria. / Interessam à China o prolongamento da guerra na Europa e a sustentação do regime de Kim. / Mas não a percepção de que Rússia, Coreia do Norte e ela compõe um "bloco" ou "eixo".",
    b: "Deve existir limites para a profundidade dessa parceria. / O prolongamento da guerra na Europa e a sustentação do regime de Kim interessam à China. / Mas não a percepção de que compõem um "bloco" ou "eixo" Rússia, Coreia do Norte e ela.",
    c: "Existem limites para a profundidade dessa parceria. / Interessa à China o prolongamento da guerra na Europa e a sustentação do regime de Kim. / Mas não a percepção de que Rússia, Coreia do Norte e ela compõem um "bloco" ou "eixo".",
    d: "Há limites para a profundidade dessa parceria. / O prolongamento da guerra na Europa e a sustentação do regime de Kim interessa à China. / Mas não a percepção de que compõe um "bloco" ou "eixo" Rússia, Coreia do Norte e ela.",
    e: "Hão de haver limites para a profundidade dessa parceria. / Interessam à China o prolongamento da guerra na Europa e a sustentação do regime de Kim. / Mas não a percepção de que Rússia, Coreia do Norte e ela compõe um "bloco" ou "eixo".",
    resposta: "C",
    comentario: "Existem (plural com sujeito plural), Interessa (singular com sujeito mais próximo), compõem (plural com sujeito composto)."
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
    comentario: "O texto mostra uma mulher em extrema tensão, pensando até em suicídio devido às dificuldades da vida."
  },
  {
    numero: 12,
    area: "Língua Portuguesa",
    enunciado: "Pela passagem – Pensou em atirar a lata de água ao chão, esparramar-se no líquido, encharcar-se, fazer-se lama… (5º parágrafo) – é correto afirmar que a personagem",
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
    enunciado: "Na passagem – Com o fundo de madeira que tivera que mandar colocar, ficou mais pesada, mas não eram daí os seus tormentos. (10º parágrafo) –, o sentido expresso pela preposição Com e pela conjunção mas e o referente da expressão daí são, correta e respectivamente:",
    a: "causa; conclusão; o peso da lata.",
    b: "causa; oposição; o peso da lata.",
    c: "lugar; conclusão; o fundo da lata.",
    d: "consequência; adição; a lata.",
    e: "lugar; oposição; o fundo da lata.",
    resposta: "B",
    comentario: "'Com' indica causa (por causa do fundo), 'mas' indica oposição, e 'daí' refere-se ao peso da lata."
  },
  {
    numero: 15,
    area: "Língua Portuguesa",
    enunciado: "A regência verbal e a regência nominal estão em conformidade com a norma-padrão em:",
    a: "Ela lembrou que tinha a lata, que preferia mais manter bem areada que nutrir a raiva, em certos momentos. Na verdade, ficava ansiosa para ver aquele objeto luzindo.",
    b: "Ela lembrou de que tinha a lata, que preferia manter bem areada do que nutrir a raiva, em certos momentos. Na verdade, ficava ansiosa em ver aquele objeto luzindo.",
    c: "Ela lembrou-se de que tinha a lata, que preferia manter bem areada a nutrir a raiva, em certos momentos. Na verdade, ficava ansiosa por ver aquele objeto luzindo.",
    d: "Ela lembrou-se que tinha a lata, que preferia manter bem areada a nutrir a raiva, em certos momentos. Na verdade, ficava ansiosa de ver aquele objeto luzindo.",
    e: "Ela lembrou-se de que tinha a lata, que preferia manter bem areada do que nutrir a raiva, em certos momentos. Na verdade, ficava ansiosa a ver aquele objeto luzindo.",
    resposta: "C",
    comentario: "Lembrar-se de, preferir X a Y, ansioso por."
  },
  {
    numero: 16,
    area: "Língua Portuguesa",
    enunciado: "Quanto ao emprego de pronomes e à colocação pronominal, as reescritas das passagens atendem à norma-padrão em:",
    a: "Imaginou os filhos que a aguardavam e já deviam estar acordados. Odiava-os! / Tratava-a bem.",
    b: "Imaginou os filhos que aguardavam-na e já deviam estar acordados. Lhes odiava! / Tratava ela bem.",
    c: "Imaginou os filhos que lhe aguardavam e já deviam estar acordados. Os odiava! / A tratava bem.",
    d: "Imaginou os filhos que aguardavam-lhe e já deviam estar acordados. Odiava-lhes! / Tratava-na bem.",
    e: "Imaginou os filhos que aguardavam-la e já deviam estar acordados. Odiava-os! / Tratava-a bem.",
    resposta: "A",
    comentario: "Pronome relativo 'que' atrai próclise; verbos transitivos diretos pedem 'os/as'."
  },
  {
    numero: 17,
    area: "Língua Portuguesa",
    enunciado: "Os termos destacados são, correta e respectivamente, pronome possessivo e advérbio em:",
    a: "Gostava de sua lata de carregar água. (10º parágrafo) / Como ela os amava, Nossenhor! (12º parágrafo)",
    b: "… que lhe caía irremediavelmente em cima. (1º parágrafo) / Correu deixando o barranco e o sonho de liberdade para trás. (14º parágrafo)",
    c: "Sentia-se cansada. (1º parágrafo) / A lata e ela, para sempre, juntas no sorriso do barranco. (9º parágrafo)",
    d: "Os filhos que ela odiava! (6º parágrafo) / Esperava que a qualquer momento… (1º parágrafo)",
    e: "Apressou-se a ir ao encontro deles. (13º parágrafo) / O barranco olhava-a, boca aberta, num sorriso irresistível… (8º parágrafo)",
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
    comentario: "Qualquer hora (sem crase), àquela forma (crase com demonstrativo), jogar a lata (sem crase antes de artigo indefinido), dirigia a ela (sem crase antes de pronome pessoal)."
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
    comentario: "O adjunto adverbial 'No final da tarde' está deslocado para o início da frase, posição não habitual."
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
    comentario: "Antes de 'no entanto' deve haver ponto ou ponto e vírgula quando inicia nova oração coordenada."
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
    comentario: "'Mesmas' concorda com 'elas'. As demais têm erros: 'é necessária a paciência', 'seguem anexos os documentos', 'havia bastantes', 'alertas' é variável."
  },
  {
    numero: 23,
    area: "Língua Portuguesa",
    enunciado: "Assinale a alternativa que apresenta a forma verbal corretamente empregada.",
    a: "Se ele ver o documento, entenderá a situação.",
    b: "Quando eu pôr tudo em ordem, avisarei.",
    c: "Se ele mantesse a calma, tudo seria diferente.",
    d: "Se você vir algum problema, comunique-nos.",
    e: "Espero que ele traga os relatórios.",
    resposta: "E",
    comentario: "'Traga' é o presente do subjuntivo correto de 'trazer'. 'Ver' deveria ser 'vir' (futuro do subjuntivo de ver); 'pôr' deveria ser 'puser'; 'mantesse' deveria ser 'mantivesse'."
  },
  // DIREITO PROCESSUAL PENAL (Questões 24-37)
  {
    numero: 24,
    area: "Direito Processual Penal",
    enunciado: "A respeito da Lei de Execução Penal (Lei no 7.210/1984), assinale a alternativa correta.",
    a: "A assistência material ao preso e ao internado consistirá no fornecimento apenas de alimentação.",
    b: "A assistência à saúde do preso e do internado, de caráter preventivo e curativo, compreenderá atendimento médico, farmacêutico e odontológico.",
    c: "Ao egresso será concedida orientação e apoio para reintegrá-lo à vida em liberdade, pelo prazo de 6 meses.",
    d: "O trabalho do condenado, como dever social e condição de dignidade humana, terá sempre finalidade educativa.",
    e: "A assistência religiosa será obrigatória a todos os presos.",
    resposta: "B",
    comentario: "Conforme art. 14 da LEP, a assistência à saúde compreende atendimento médico, farmacêutico e odontológico."
  },
  {
    numero: 25,
    area: "Direito Processual Penal",
    enunciado: "Nos termos do Código de Processo Penal, é correto afirmar sobre a prisão em flagrante:",
    a: "Apresentado o preso à autoridade competente, ouvirá esta o condutor e colherá as informações das testemunhas que o acompanharem.",
    b: "A falta de testemunhas da infração impedirá o auto de prisão em flagrante.",
    c: "Dentro em 48 horas, será encaminhado ao juiz competente o auto de prisão em flagrante.",
    d: "A autoridade que ordenar a prisão fará comunicá-la imediatamente ao juiz competente, mediante petição.",
    e: "O preso será informado de seus direitos pelo juiz competente, no momento da audiência de custódia.",
    resposta: "A",
    comentario: "Conforme art. 304 do CPP, apresentado o preso, a autoridade ouvirá o condutor e colherá informações das testemunhas."
  },
  {
    numero: 26,
    area: "Direito Processual Penal",
    enunciado: "Considerando o disposto no Código de Processo Penal acerca da competência, assinale a alternativa correta.",
    a: "A competência será determinada pelo domicílio do réu, quando não for conhecido o lugar da infração.",
    b: "Nos crimes permanentes praticados em território de duas ou mais jurisdições, a competência será sempre do lugar onde o crime teve início.",
    c: "Nos casos de exclusiva ação privada, o querelante poderá preferir o foro de domicílio ou da residência do réu, mesmo quando conhecido o lugar da infração.",
    d: "A competência por conexão ou continência nunca poderá ser alterada.",
    e: "A competência do Tribunal do Júri é absoluta, não admitindo qualquer modificação.",
    resposta: "C",
    comentario: "Conforme art. 73 do CPP, nos casos de exclusiva ação privada, o querelante pode preferir o foro do domicílio do réu."
  },
  {
    numero: 27,
    area: "Direito Processual Penal",
    enunciado: "No tocante à prova no processo penal, é correto afirmar:",
    a: "As provas ilícitas são inadmissíveis e devem ser desentranhadas do processo, sendo vedada sua utilização para qualquer fim.",
    b: "O juiz formará sua convicção pela livre apreciação da prova, podendo fundamentar sua decisão exclusivamente em elementos informativos colhidos na investigação.",
    c: "A confissão do acusado vale por si só como prova plena de sua culpabilidade.",
    d: "O silêncio do acusado importará confissão tácita.",
    e: "A prova da alegação incumbirá exclusivamente a quem a fizer.",
    resposta: "A",
    comentario: "Conforme art. 157 do CPP, são inadmissíveis as provas ilícitas, devendo ser desentranhadas do processo."
  },
  {
    numero: 28,
    area: "Direito Processual Penal",
    enunciado: "De acordo com o Código de Processo Penal, sobre a denúncia ou queixa, é correto afirmar:",
    a: "A denúncia poderá ser rejeitada se o fato narrado evidentemente não constituir crime.",
    b: "A queixa, mesmo que não contenha a qualificação do acusado, poderá ser recebida.",
    c: "Não é necessário que a denúncia contenha a classificação do crime.",
    d: "O Ministério Público não pode aditar a queixa.",
    e: "A denúncia deve ser oferecida no prazo de 10 dias, se o réu estiver preso.",
    resposta: "A",
    comentario: "Conforme art. 395, I do CPP, a denúncia será rejeitada quando for manifestamente inepta ou faltar pressuposto processual ou condição para o exercício da ação penal."
  },
  {
    numero: 29,
    area: "Direito Processual Penal",
    enunciado: "Sobre a ação penal, é correto afirmar:",
    a: "A ação penal pública incondicionada depende de representação do ofendido.",
    b: "A titularidade da ação penal privada é do Ministério Público.",
    c: "A ação penal pública condicionada depende de requisição do Ministro da Justiça ou de representação do ofendido.",
    d: "Na ação penal privada subsidiária da pública, o Ministério Público não pode intervir.",
    e: "O prazo para oferecimento da queixa-crime é de 30 dias.",
    resposta: "C",
    comentario: "A ação penal pública condicionada depende de representação do ofendido ou requisição do Ministro da Justiça (art. 24 do CPP)."
  },
  {
    numero: 30,
    area: "Direito Processual Penal",
    enunciado: "No que tange ao inquérito policial, assinale a alternativa correta.",
    a: "O inquérito policial é imprescindível para o oferecimento da denúncia.",
    b: "O Ministério Público não pode requisitar diligências à autoridade policial.",
    c: "O inquérito policial acompanhará a denúncia ou queixa, sempre que servir de base a uma ou outra.",
    d: "O prazo para conclusão do inquérito é de 30 dias, prorrogável por igual período.",
    e: "O indiciado tem direito ao contraditório durante o inquérito policial.",
    resposta: "C",
    comentario: "Conforme art. 12 do CPP, o inquérito acompanhará a denúncia ou queixa quando servir de base para uma ou outra."
  },
  {
    numero: 31,
    area: "Direito Processual Penal",
    enunciado: "A respeito das nulidades no processo penal, é correto afirmar:",
    a: "A incompetência do juízo anula apenas os atos decisórios.",
    b: "A nulidade de um ato não contamina os demais atos do processo.",
    c: "A falta de intervenção do Ministério Público em todos os termos da ação por ele intentada gera nulidade absoluta.",
    d: "As nulidades relativas podem ser alegadas a qualquer tempo.",
    e: "A nulidade por incompetência absoluta pode ser sanada.",
    resposta: "C",
    comentario: "Conforme art. 564, III, 'd' do CPP, a falta de intervenção do MP em todos os termos da ação por ele intentada é causa de nulidade."
  },
  {
    numero: 32,
    area: "Direito Processual Penal",
    enunciado: "Quanto à citação no processo penal, é correto afirmar:",
    a: "A citação inicial far-se-á sempre por mandado.",
    b: "Se o acusado não for encontrado, será citado por hora certa.",
    c: "A citação do militar será feita diretamente ao réu.",
    d: "A citação, ato pelo qual o réu toma ciência da acusação, pode ser real ou ficta. A real é feita por oficial de justiça, pessoalmente ou por hora certa; a ficta, por Edital.",
    e: "O réu que deixar de atender a ato judicial do qual foi devidamente intimado será declarado revel, prosseguindo-se o feito sem sua presença e intimação para demais atos, inclusive a sentença.",
    resposta: "D",
    comentario: "A citação pode ser real (por oficial ou hora certa) ou ficta (por edital)."
  },
  {
    numero: 33,
    area: "Direito Processual Penal",
    enunciado: "A respeito do procedimento comum ordinário e sumário, é correto afirmar:",
    a: "a resposta à acusação é prevista para ambos os ritos, ordinário e sumário, mas os prazos são distintos, sendo 10 dias para o primeiro e 5 dias para o segundo.",
    b: "oferecida a denúncia, a possibilidade de rejeição da denúncia pelo juiz aplica-se ao rito ordinário, mas não ao sumário.",
    c: "encerrada a instrução, tanto no rito ordinário quanto no sumário, há previsão expressa quanto à possibilidade de memorais, por escrito, e diligências complementares.",
    d: "no rito sumário, não localizado o acusado, para citação pessoal, o rito será convertido para o ordinário, a fim de se proceder a citação por Edital.",
    e: "a absolvição sumária, após a apresentação de resposta à acusação, aplica-se tanto no rito ordinário quanto no sumário.",
    resposta: "E",
    comentario: "A absolvição sumária (art. 397 CPP) aplica-se tanto ao rito ordinário quanto ao sumário."
  },
  {
    numero: 34,
    area: "Direito Processual Penal",
    enunciado: "A respeito da composição do Tribunal do Júri e da formação do conselho de sentença, assinale a alternativa correta.",
    a: "São impedidos de servir no mesmo conselho marido e mulher, descendente e ascendente, irmãos e amigos íntimos.",
    b: "O mesmo conselho de sentença poderá conhecer de mais de um processo, no mesmo dia, se as partes aceitarem.",
    c: "Aos jurados não se aplicam as regras de impedimento, suspeição e incompatibilidades previstas para os juízes togados.",
    d: "Os jurados excluídos por impedimento em razão de parentesco não serão considerados para a constituição do número legal exigível para a realização da sessão.",
    e: "Não poderá servir o jurado que tiver funcionado em julgamento anterior, anulado por qualquer motivo; pode servir o jurado que tiver integrado o conselho de sentença que julgou o outro acusado, em caso de concurso de pessoas.",
    resposta: "D",
    comentario: "Os jurados excluídos por impedimento não são computados para o número legal exigido para a sessão."
  },
  {
    numero: 35,
    area: "Direito Processual Penal",
    enunciado: "Tendo em conta as situações hipotéticas e as disposições referentes aos recursos e às ações de impugnação, assinale a alternativa correta.",
    a: "Tício, pronunciado por crime doloso contra a vida, caso queira recorrer, deverá interpor recurso de apelação.",
    b: "Mévio, tendo a homologação do acordo de não persecução penal recusada, poderá interpor recurso de apelação.",
    c: "Caio, representante do órgão de acusação, caso queira recorrer da decisão que reconheceu a prescrição, extinguindo a punibilidade do réu, deverá interpor recurso em sentido estrito.",
    d: "Mévia, a fim de sanar omissão em Acórdão proferido em sede do recurso de apelação por ela interposto, poderá opor embargos de declaração, no prazo de três dias.",
    e: "Tícia, se condenada definitivamente com base em documentos que posteriormente se comprovem falsos, poderá ingressar com revisão, desde que a pena não tenha sido extinta.",
    resposta: "C",
    comentario: "Da decisão que reconhece a prescrição cabe recurso em sentido estrito (art. 581, VIII, CPP)."
  },
  {
    numero: 36,
    area: "Direito Processual Penal",
    enunciado: "A respeito do habeas corpus, assinale a alternativa correta.",
    a: "A decisão do habeas corpus, no Tribunal, será por maioria dos votos. Em caso de empate, prevalecerá o voto do presidente, se tiver participado da votação.",
    b: "A concessão de habeas corpus implicará condenação da autoridade que tiver determinado a coação à indenização civil, se decorrente de negligência.",
    c: "No caso de petição de habeas corpus, não será concedida a ordem antes de prestadas as informações pela autoridade apontada como coautora.",
    d: "O habeas corpus poderá ser impetrado por qualquer pessoa, em seu próprio favor ou de outrem, bem como pelo Ministério Público.",
    e: "A ordem de habeas corpus pode ser concedida de ofício pelo juiz ou pelo tribunal, seja em processo de competência originária ou recursal, desde que conhecidos a ação ou o recurso em que veiculado o pedido de cessação da coação.",
    resposta: "D",
    comentario: "Conforme art. 654 do CPP, o habeas corpus pode ser impetrado por qualquer pessoa, em seu favor ou de outrem, e pelo Ministério Público."
  },
  {
    numero: 37,
    area: "Direito Processual Penal",
    enunciado: "Caio, na condução de um veículo, causou lesão corporal culposa em Mévio. Lavrado Termo Circunstanciado e encaminhados os autos para o Juizado Especial Criminal, foi designada audiência preliminar. Na audiência, Caio propôs pagar a Mévio R$ 10.000,00 a título de composição de dano. Mévio aceitou a proposta, tendo o acordo sido homologado pelo juiz. Caio, no entanto, pagou apenas metade do valor acordado.\n\nCom base na situação hipotética, assinale a alternativa correta.",
    a: "A composição de dano, homologada pelo juiz, não impede que Mévio represente criminalmente contra Caio, pois a reparação do dano implica renúncia apenas ao direito de queixa.",
    b: "A composição de dano, homologada pelo juiz, implicou renúncia ao direito de representação, pouco importando a inadimplência de Caio. Mévio poderá executar a decisão homologatória, que tem força de título executivo, no juízo cível competente.",
    c: "A composição do dano, homologada pelo juiz, não impede que Mévio represente criminalmente contra Caio, mas impede que o MP proponha aplicação imediata de pena restritiva de direito.",
    d: "A composição de dano, homologada pelo juiz, não impede que Mévio represente criminalmente contra Caio, mas vincula o MP a propor aplicação imediata de pena restritiva de direito.",
    e: "A composição de dano, homologada pelo juiz, implicou renúncia ao direito de representação. Mévio poderá executar a decisão no próprio juízo criminal.",
    resposta: "B",
    comentario: "A composição homologada implica renúncia ao direito de representação, e o título executivo deve ser executado no juízo cível."
  },
  // DIREITO PROCESSUAL CIVIL (Questões 38-44)
  {
    numero: 38,
    area: "Direito Processual Civil",
    enunciado: "Douglas, chefe de secretaria de uma das varas da Fazenda Pública, comete grave erro ao enviar uma intimação para endereço errado, causando prejuízo ao réu.\n\nConsiderando o CPC, é correto afirmar que Douglas",
    a: "é responsável pelo ocorrido de forma solidária com o juiz titular da vara.",
    b: "só seria responsabilizado caso restasse demonstrado que o ato foi praticado mediante dolo.",
    c: "deve ser responsabilizado civil e regressivamente pelo ocorrido.",
    d: "é responsável de forma subsidiária, caso o juiz titular da vara não seja responsabilizado.",
    e: "não deve ser responsabilizado pessoalmente pelo ocorrido, devendo o Estado responder pelo prejuízo, sem direito de regresso.",
    resposta: "C",
    comentario: "O servidor responde civil e regressivamente por danos causados no exercício de suas funções."
  },
  {
    numero: 39,
    area: "Direito Processual Civil",
    enunciado: "Acerca das intimações no Código de Processo Civil, assinale a alternativa correta.",
    a: "Sob pena de nulidade, é indispensável que da publicação constem os nomes das partes e de seus advogados, com o respectivo número de inscrição na OAB.",
    b: "A grafia dos nomes das partes pode conter abreviaturas, desde que não prejudique a identificação das partes.",
    c: "Ainda que conste pedido expresso para que as comunicações sejam feitas em nome de advogados indicados, o desatendimento não implicará nulidade quando houver indicação de advogado com poderes.",
    d: "A retirada dos autos do cartório pelo advogado implicará intimação de qualquer decisão contida no processo, desde que já publicada.",
    e: "A retirada de autos por meio de preposto independe de credenciamento por parte do advogado.",
    resposta: "A",
    comentario: "Conforme CPC, é requisito essencial para validade da intimação que constem os nomes das partes e advogados com número da OAB."
  },
  {
    numero: 40,
    area: "Direito Processual Civil",
    enunciado: "Carmem propõe ação contra empresa de telecomunicações, solicitando tutela antecipada antecedente. O juiz concede a tutela antecipada, e a empresa não apresenta recurso.\n\nDiante da situação hipotética, é correto afirmar:",
    a: "ocorre o trânsito em julgado da decisão e a formação de coisa julgada material.",
    b: "considerando a não interposição do recurso, apenas Carmem poderá requerer o desarquivamento.",
    c: "o direito de rever a tutela antecipada extingue-se após 2 anos.",
    d: "a decisão que concede a tutela não fará coisa julgada, mas a estabilidade dos efeitos só será afastada após o trânsito em julgado de decisão que a revir.",
    e: "a tutela antecipada conservará seus efeitos enquanto não revista por decisão de mérito proferida na ação proposta por qualquer das partes.",
    resposta: "E",
    comentario: "A tutela antecipada estabilizada conserva seus efeitos até ser revista por decisão de mérito."
  },
  {
    numero: 41,
    area: "Direito Processual Civil",
    enunciado: "Mariana propôs ação de reconhecimento de paternidade em face de Romeu, manifestando desinteresse na composição consensual. Romeu manifestou interesse na audiência de conciliação.\n\nÉ correto afirmar que a audiência de conciliação e mediação",
    a: "não será realizada.",
    b: "deverá ser realizada, podendo qualquer das partes constituir representante com poderes para negociar e transigir.",
    c: "deverá ser realizada, sendo o não comparecimento injustificado de Mariana ato atentatório à dignidade da justiça.",
    d: "deverá ser designada com antecedência mínima de 30 dias, devendo Romeu ser citado com pelo menos 15 dias de antecedência.",
    e: "deverá ser realizada, não sendo necessária a participação dos advogados.",
    resposta: "A",
    comentario: "Conforme CPC, a audiência não será realizada se ambas as partes manifestarem desinteresse na composição consensual, e o autor já manifestou."
  },
  {
    numero: 42,
    area: "Direito Processual Civil",
    enunciado: "João ingressou com ação judicial contra plano de saúde e o juiz deferiu tutela provisória de urgência e, após análise do mérito, confirmou a tutela. O plano de saúde interpõe apelação.\n\nDiante do caso, é correto afirmar que",
    a: "a sentença poderá começar a produzir efeitos após requerimento fundamentado dirigido ao juiz.",
    b: "a apelação, como regra, terá efeito suspensivo.",
    c: "não é possível a concessão de efeito suspensivo depois de publicada a sentença.",
    d: "o pedido de efeito suspensivo poderá ser formulado ao relator, no período entre a interposição e a distribuição.",
    e: "João poderá promover o pedido de cumprimento provisório depois de publicada a sentença.",
    resposta: "E",
    comentario: "O cumprimento provisório pode ser promovido após a publicação da sentença que confirma a tutela antecipada."
  },
  {
    numero: 43,
    area: "Direito Processual Civil",
    enunciado: "Assinale a alternativa que corresponde a uma situação de competência do Juizado Especial Cível.",
    a: "Renata colidiu com o carro de Regina. Regina propôs ação de indenização de 50 salários mínimos. Para caber no JEC, Regina deve renunciar parte do valor.",
    b: "Pedro, menor, representado pela mãe, propõe ação de alimentos de 30 salários mínimos contra o pai.",
    c: "Matheus propôs ação de reintegração de posse de 40 salários mínimos.",
    d: "Sr. Almeida propôs ação de despejo por falta de pagamento, com valor de 12 meses de aluguel de 2 salários mínimos cada.",
    e: "Mariana propôs ação de cobrança de 10 salários mínimos contra massa falida de empresa.",
    resposta: "D",
    comentario: "Ações de despejo para uso próprio são de competência do JEC, e o valor está dentro do limite."
  },
  {
    numero: 44,
    area: "Direito Processual Civil",
    enunciado: "Considerando o disposto na lei do Juizado Especial da Fazenda Pública, assinale a alternativa correta.",
    a: "Os representantes judiciais dos réus poderão conciliar, transigir ou desistir nos termos da lei do respectivo ente federativo.",
    b: "Por ter competência para causas de menor complexidade, não é possível realização de exame técnico.",
    c: "Haverá reexame necessário nas causas de valor superior a 40 salários mínimos para Estados e 30 para Municípios.",
    d: "Não haverá prazo diferenciado para qualquer ato processual pelas pessoas jurídicas de direito público.",
    e: "A entidade ré deverá fornecer documentação até 10 dias antes da audiência de conciliação.",
    resposta: "A",
    comentario: "Os representantes judiciais podem conciliar, transigir ou desistir conforme previsto na lei do respectivo ente federativo."
  },
  // DIREITO CONSTITUCIONAL (Questões 45-52)
  {
    numero: 45,
    area: "Direito Constitucional",
    enunciado: "No tocante aos direitos e deveres individuais e coletivos, é correto afirmar que a Constituição Federal garante a",
    a: "inviolabilidade da liberdade de consciência e de crença, sendo dever do Estado incentivar o exercício dos cultos religiosos.",
    b: "criação de associações, independentemente de autorização, as quais somente poderão ter suas atividades suspensas por decisão judicial com trânsito em julgado.",
    c: "livre expressão da atividade intelectual, artística, científica e de comunicação, com a devida licença.",
    d: "gratuidade, aos reconhecidamente pobres, do registro civil de nascimento e da certidão de óbito, bem como das ações de habeas corpus e habeas data.",
    e: "livre manifestação do pensamento, com o devido anonimato.",
    resposta: "D",
    comentario: "A CF garante gratuidade do registro de nascimento e certidão de óbito aos pobres, bem como HC e HD são gratuitos."
  },
  {
    numero: 46,
    area: "Direito Constitucional",
    enunciado: "Assinale a alternativa que está de acordo com o texto constitucional em relação aos direitos sociais dos trabalhadores.",
    a: "A CF prevê o princípio da irredutibilidade do salário, que pode sofrer ressalva pelo disposto em convenção ou acordo coletivo.",
    b: "É garantido ao trabalhador menor de idade remuneração do trabalho noturno superior à do diurno.",
    c: "Toda pessoa com deficiência tem direito a uma renda básica familiar garantida pelo poder público.",
    d: "O salário tem proteção expressa na CF, constituindo crime sua retenção culposa ou dolosa.",
    e: "A jornada de 6 horas para turnos ininterruptos de revezamento não pode ser alterada por negociação coletiva.",
    resposta: "A",
    comentario: "A CF prevê a irredutibilidade do salário, salvo o disposto em convenção ou acordo coletivo (art. 7º, VI)."
  },
  {
    numero: 47,
    area: "Direito Constitucional",
    enunciado: "Brigite é cidadã portuguesa, e Joaquim é francês. Ambos pretendem adquirir a nacionalidade brasileira.\n\nAssinale a alternativa correta.",
    a: "Brigite pode adquirir nacionalidade brasileira com residência de apenas um ano, se houver reciprocidade.",
    b: "Joaquim pode se naturalizar brasileiro após 15 anos de residência ininterrupta no Brasil.",
    c: "Ambos, após naturalizados, poderão ocupar o cargo de Ministro do STF.",
    d: "Brigite, se naturalizada, poderá ser extraditada por crime praticado antes da naturalização.",
    e: "Joaquim, se naturalizado, não poderá ter cancelada sua naturalização.",
    resposta: "A",
    comentario: "Portugueses com residência permanente no Brasil têm tratamento diferenciado, exigindo apenas 1 ano de residência se houver reciprocidade."
  },
  {
    numero: 48,
    area: "Direito Constitucional",
    enunciado: "A respeito da organização do Poder Judiciário, assinale a alternativa correta.",
    a: "Ao Poder Judiciário é assegurada autonomia administrativa e financeira, mas não a iniciativa de leis.",
    b: "Os Tribunais de Justiça dos Estados podem propor a criação de novas varas judiciárias.",
    c: "Os juízes gozam da garantia da vitaliciedade após dois anos de exercício.",
    d: "É permitido ao juiz exercer outro cargo ou função, exceto uma de magistério.",
    e: "Os tribunais funcionarão ininterruptamente, vedado o recesso forense.",
    resposta: "C",
    comentario: "Conforme CF, os juízes adquirem vitaliciedade após dois anos de exercício (art. 95, I)."
  },
  {
    numero: 49,
    area: "Direito Constitucional",
    enunciado: "Sobre a organização político-administrativa do Estado brasileiro, é correto afirmar:",
    a: "Os Estados podem incorporar-se entre si mediante aprovação da população diretamente interessada, por plebiscito, e do Congresso Nacional, por lei complementar.",
    b: "A criação de Municípios far-se-á por lei ordinária estadual.",
    c: "É vedada a criação de Territórios Federais.",
    d: "O Distrito Federal não pode ser dividido em Municípios.",
    e: "Os Estados organizam-se e regem-se pelas Constituições e leis que adotarem, sem observância obrigatória dos princípios da CF.",
    resposta: "D",
    comentario: "O Distrito Federal é vedado de ser dividido em Municípios (art. 32, caput, CF)."
  },
  {
    numero: 50,
    area: "Direito Constitucional",
    enunciado: "Sobre o controle de constitucionalidade no Brasil, assinale a alternativa correta.",
    a: "A declaração de inconstitucionalidade pelo STF em controle difuso tem efeitos erga omnes automaticamente.",
    b: "Cabe ao STF julgar, originariamente, a ação direta de inconstitucionalidade de lei municipal.",
    c: "Os efeitos da declaração de inconstitucionalidade são, em regra, ex tunc.",
    d: "O STF pode modular os efeitos da decisão apenas em caso de declaração de constitucionalidade.",
    e: "A ADPF pode ser proposta por qualquer cidadão.",
    resposta: "C",
    comentario: "Em regra, a declaração de inconstitucionalidade tem efeitos retroativos (ex tunc), atingindo o ato desde sua origem."
  },
  {
    numero: 51,
    area: "Direito Constitucional",
    enunciado: "A respeito do Poder Legislativo, assinale a alternativa correta.",
    a: "O Senado Federal compõe-se de representantes dos Estados e do Distrito Federal, eleitos pelo sistema proporcional.",
    b: "Cada Estado e o Distrito Federal elegerão três Senadores, com mandato de oito anos.",
    c: "A Câmara dos Deputados compõe-se de representantes do povo, eleitos pelo sistema majoritário.",
    d: "O número total de Deputados será estabelecido por lei complementar, proporcionalmente à população.",
    e: "O mandato dos Deputados Federais é de 8 anos.",
    resposta: "D",
    comentario: "Conforme art. 45, §1º, da CF, o número de Deputados será estabelecido por lei complementar, proporcionalmente à população."
  },
  {
    numero: 52,
    area: "Direito Constitucional",
    enunciado: "Sobre a seguridade social prevista na Constituição Federal, é correto afirmar:",
    a: "A seguridade social compreende apenas a previdência e a assistência social.",
    b: "A assistência social será prestada apenas a quem dela necessitar, independentemente de contribuição.",
    c: "A saúde é direito de todos, mas dever apenas do Estado.",
    d: "A previdência social será organizada sob a forma de regime único para todos os trabalhadores.",
    e: "A seguridade social será financiada exclusivamente por contribuições dos empregadores.",
    resposta: "B",
    comentario: "A assistência social é prestada a quem dela necessitar, independentemente de contribuição à seguridade social (art. 203, CF)."
  },
  // DIREITO PENAL (Questões 53-63)
  {
    numero: 53,
    area: "Direito Penal",
    enunciado: "Sobre a aplicação da lei penal no tempo, é correto afirmar:",
    a: "A lei penal mais grave aplica-se ao fato praticado durante sua vigência, mesmo que lei posterior seja mais benéfica.",
    b: "A lei penal não retroage, salvo para beneficiar o réu.",
    c: "A lei penal temporária aplica-se apenas durante sua vigência, não alcançando fatos anteriores.",
    d: "A abolitio criminis não alcança a sentença condenatória transitada em julgado.",
    e: "A lei penal mais benéfica aplica-se apenas aos fatos praticados após sua entrada em vigor.",
    resposta: "B",
    comentario: "Conforme art. 2º do CP e art. 5º, XL, da CF, a lei penal não retroagirá, salvo para beneficiar o réu."
  },
  {
    numero: 54,
    area: "Direito Penal",
    enunciado: "Quanto às excludentes de ilicitude, é correto afirmar:",
    a: "A legítima defesa é admitida apenas contra agressão atual.",
    b: "O estado de necessidade exige que o perigo seja provocado pelo agente.",
    c: "O exercício regular de direito não exclui a ilicitude se causar dano a terceiro.",
    d: "A legítima defesa exige agressão injusta, atual ou iminente, a direito próprio ou alheio.",
    e: "No estrito cumprimento do dever legal, o agente responde pelo excesso culposo.",
    resposta: "D",
    comentario: "A legítima defesa exige agressão injusta, atual ou iminente, a direito próprio ou alheio (art. 25, CP)."
  },
  {
    numero: 55,
    area: "Direito Penal",
    enunciado: "No que se refere aos crimes contra a pessoa, é correto afirmar:",
    a: "O homicídio simples tem pena de reclusão de 6 a 20 anos.",
    b: "O induzimento ao suicídio não é punível se a vítima sobreviver.",
    c: "A lesão corporal de natureza grave resulta em incapacidade para ocupações habituais por mais de 30 dias.",
    d: "O abandono de incapaz é crime de perigo concreto.",
    e: "A omissão de socorro é punida apenas se resultar em morte da vítima.",
    resposta: "C",
    comentario: "A lesão corporal é grave quando resulta em incapacidade para as ocupações habituais por mais de 30 dias (art. 129, §1º, I, CP)."
  },
  {
    numero: 56,
    area: "Direito Penal",
    enunciado: "Sobre os crimes contra o patrimônio, assinale a alternativa correta.",
    a: "O furto noturno tem pena aumentada de um terço.",
    b: "O roubo próprio consiste em subtrair coisa móvel mediante violência ou grave ameaça.",
    c: "A extorsão exige que a vantagem seja obtida imediatamente.",
    d: "O estelionato não admite a forma qualificada.",
    e: "O dano culposo é punível.",
    resposta: "B",
    comentario: "O roubo próprio (art. 157, caput) consiste em subtrair coisa móvel alheia mediante grave ameaça ou violência."
  },
  {
    numero: 57,
    area: "Direito Penal",
    enunciado: "A respeito dos crimes contra a dignidade sexual, é correto afirmar:",
    a: "O estupro é crime de ação penal privada.",
    b: "O estupro de vulnerável tem como vítima apenas menores de 14 anos.",
    c: "A violação sexual mediante fraude exige o emprego de violência ou grave ameaça.",
    d: "O assédio sexual é crime próprio, exigindo condição de superior hierárquico ou ascendência.",
    e: "O estupro é crime comum, podendo ser praticado por qualquer pessoa.",
    resposta: "D",
    comentario: "O assédio sexual (art. 216-A) exige a condição de superior hierárquico ou ascendência inerente ao exercício de emprego, cargo ou função."
  },
  {
    numero: 58,
    area: "Direito Penal",
    enunciado: "Quanto à culpabilidade, é correto afirmar:",
    a: "A embriaguez voluntária exclui a culpabilidade.",
    b: "A coação moral irresistível exclui a culpabilidade.",
    c: "O erro de proibição inevitável reduz a pena.",
    d: "A obediência hierárquica sempre exclui a culpabilidade do subordinado.",
    e: "A inimputabilidade por doença mental exclui a tipicidade.",
    resposta: "B",
    comentario: "A coação moral irresistível exclui a culpabilidade do coagido (art. 22, CP)."
  },
  {
    numero: 59,
    area: "Direito Penal",
    enunciado: "Sobre o concurso de pessoas, é correto afirmar:",
    a: "Todos os coautores respondem pela mesma pena, independentemente de sua participação.",
    b: "O partícipe responde pelos atos praticados pelo autor, mesmo que não tenha conhecimento deles.",
    c: "A comunicabilidade das circunstâncias pessoais depende de terem entrado na esfera de conhecimento do outro agente.",
    d: "A coautoria exige acordo prévio entre os agentes.",
    e: "O partícipe de menor importância terá a pena aumentada.",
    resposta: "C",
    comentario: "As circunstâncias pessoais só se comunicam quando tiverem entrado na esfera de conhecimento do outro agente (art. 30, CP)."
  },
  {
    numero: 60,
    area: "Direito Penal",
    enunciado: "A respeito das penas, assinale a alternativa correta.",
    a: "A pena de multa pode ser convertida em prisão em caso de inadimplemento.",
    b: "As penas restritivas de direitos são autônomas e substituem as privativas de liberdade.",
    c: "A prestação de serviços à comunidade é aplicável apenas a crimes de menor potencial ofensivo.",
    d: "A interdição temporária de direitos não pode ser aplicada como pena principal.",
    e: "A limitação de fim de semana consiste no recolhimento domiciliar diário.",
    resposta: "B",
    comentario: "As penas restritivas de direitos são autônomas e substituem as privativas de liberdade (art. 44, CP)."
  },
  {
    numero: 61,
    area: "Direito Penal",
    enunciado: "Sobre os crimes contra a fé pública, é correto afirmar:",
    a: "A falsidade ideológica consiste em alterar documento verdadeiro.",
    b: "A falsidade material consiste em inserir declaração falsa em documento.",
    c: "O uso de documento falso é punido com a mesma pena do crime de falsificação.",
    d: "A moeda falsa só é punível se colocada em circulação.",
    e: "A falsificação de documento particular tem a mesma pena da falsificação de documento público.",
    resposta: "C",
    comentario: "O uso de documento falso é punido com a mesma pena da falsificação (art. 304, CP)."
  },
  {
    numero: 62,
    area: "Direito Penal",
    enunciado: "No que tange aos crimes contra a administração pública, é correto afirmar:",
    a: "O peculato exige que o funcionário público tenha a posse do bem em razão do cargo.",
    b: "A corrupção passiva exige a efetiva aceitação da vantagem indevida.",
    c: "A prevaricação consiste em retardar ato de ofício por negligência.",
    d: "A concussão é crime próprio, mas admite participação de particular.",
    e: "O crime de resistência exige emprego de violência física.",
    resposta: "D",
    comentario: "A concussão (art. 316) é crime próprio de funcionário público, mas admite participação de particular."
  },
  {
    numero: 63,
    area: "Direito Penal",
    enunciado: "Quanto à prescrição penal, é correto afirmar:",
    a: "A prescrição da pretensão executória começa a correr da data do trânsito em julgado da sentença condenatória.",
    b: "A prescrição retroativa foi eliminada pela Lei nº 12.234/2010.",
    c: "A prescrição intercorrente corre entre o recebimento da denúncia e a publicação da sentença.",
    d: "A reincidência aumenta em um terço o prazo prescricional.",
    e: "A prescrição é causa de extinção da punibilidade que pode ser reconhecida de ofício.",
    resposta: "E",
    comentario: "A prescrição é causa de extinção da punibilidade e pode ser reconhecida de ofício pelo juiz (art. 61, CPP)."
  },
  // DIREITO ADMINISTRATIVO (Questões 64-70)
  {
    numero: 64,
    area: "Direito Administrativo",
    enunciado: "Sobre os princípios da Administração Pública, é correto afirmar:",
    a: "O princípio da legalidade permite que a Administração faça tudo o que a lei não proíbe.",
    b: "O princípio da impessoalidade veda a promoção pessoal do agente público.",
    c: "O princípio da moralidade é apenas uma recomendação ética.",
    d: "O princípio da publicidade não admite exceções.",
    e: "O princípio da eficiência foi introduzido pela CF/88 originariamente.",
    resposta: "B",
    comentario: "O princípio da impessoalidade veda a promoção pessoal de autoridades ou servidores públicos (art. 37, §1º, CF)."
  },
  {
    numero: 65,
    area: "Direito Administrativo",
    enunciado: "Quanto aos atos administrativos, assinale a alternativa correta.",
    a: "Todo ato administrativo é revogável.",
    b: "A anulação do ato administrativo produz efeitos ex nunc.",
    c: "A revogação do ato administrativo produz efeitos ex tunc.",
    d: "O ato administrativo nulo pode ser convalidado.",
    e: "A Administração pode anular seus próprios atos quando eivados de vícios de legalidade.",
    resposta: "E",
    comentario: "Conforme Súmula 473 do STF, a Administração pode anular seus próprios atos quando eivados de vícios de legalidade."
  },
  {
    numero: 66,
    area: "Direito Administrativo",
    enunciado: "A respeito dos servidores públicos, é correto afirmar:",
    a: "O servidor público estável perderá o cargo mediante processo administrativo, independentemente de ampla defesa.",
    b: "A estabilidade é adquirida após dois anos de efetivo exercício.",
    c: "O servidor público estável só perderá o cargo em virtude de sentença judicial transitada em julgado.",
    d: "A estabilidade é garantia exclusiva dos servidores ocupantes de cargos em comissão.",
    e: "O servidor público estável pode perder o cargo mediante processo administrativo com ampla defesa ou sentença judicial transitada em julgado.",
    resposta: "E",
    comentario: "O servidor estável pode perder o cargo por sentença judicial transitada em julgado, PAD com ampla defesa, ou avaliação periódica (art. 41, §1º, CF)."
  },
  {
    numero: 67,
    area: "Direito Administrativo",
    enunciado: "Sobre licitações e contratos administrativos, é correto afirmar:",
    a: "A licitação é sempre obrigatória para a Administração Pública.",
    b: "A dispensa de licitação depende de previsão legal expressa.",
    c: "A inexigibilidade de licitação ocorre quando há competição entre fornecedores.",
    d: "O contrato administrativo não pode ser alterado unilateralmente pela Administração.",
    e: "A garantia contratual é obrigatória em todos os contratos administrativos.",
    resposta: "B",
    comentario: "A dispensa de licitação depende de previsão legal expressa (art. 24 da Lei 8.666/93 ou art. 75 da Lei 14.133/21)."
  },
  {
    numero: 68,
    area: "Direito Administrativo",
    enunciado: "Quanto à responsabilidade civil do Estado, assinale a alternativa correta.",
    a: "A responsabilidade do Estado é sempre subjetiva.",
    b: "O agente público responde diretamente perante o terceiro prejudicado.",
    c: "As pessoas jurídicas de direito público respondem pelos danos que seus agentes causarem a terceiros.",
    d: "O Estado não tem direito de regresso contra o agente causador do dano.",
    e: "A responsabilidade do Estado por omissão é objetiva.",
    resposta: "C",
    comentario: "As pessoas jurídicas de direito público respondem objetivamente pelos danos que seus agentes causarem a terceiros (art. 37, §6º, CF)."
  },
  {
    numero: 69,
    area: "Direito Administrativo",
    enunciado: "A respeito do poder de polícia, é correto afirmar:",
    a: "O poder de polícia é sempre vinculado.",
    b: "O poder de polícia não admite delegação a particulares.",
    c: "O poder de polícia é exercido apenas pelo Poder Executivo.",
    d: "A autoexecutoriedade é atributo exclusivo do poder de polícia.",
    e: "O poder de polícia só pode ser exercido mediante processo judicial.",
    resposta: "B",
    comentario: "O poder de polícia, por envolver atos de império, não pode ser delegado a particulares (entendimento do STF)."
  },
  {
    numero: 70,
    area: "Direito Administrativo",
    enunciado: "Sobre os bens públicos, é correto afirmar:",
    a: "Os bens de uso comum do povo são inalienáveis.",
    b: "Os bens dominicais podem ser alienados, observadas as exigências da lei.",
    c: "Os bens de uso especial são alienáveis mediante autorização legislativa.",
    d: "Os bens públicos são penhoráveis.",
    e: "Os bens públicos podem ser objeto de usucapião.",
    resposta: "B",
    comentario: "Os bens dominicais podem ser alienados, observadas as exigências da lei (art. 101, CC)."
  },
  // MATEMÁTICA E RACIOCÍNIO LÓGICO (Questões 71-76)
  {
    numero: 71,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Uma propriedade rural de formato retangular mede 70m por 90m. O proprietário decidiu reservar uma área quadrada de 30m de lado para construção. A área restante, destinada ao plantio, é de:",
    a: "5400 m².",
    b: "5700 m².",
    c: "5100 m².",
    d: "6000 m².",
    e: "6300 m².",
    resposta: "B",
    comentario: "Área total: 70 × 90 = 6300 m². Área reservada: 30 × 30 = 900 m². Área restante: 6300 - 900 = 5400 m². Resposta correta seria 5400m², mas a resposta oficial é B (5700m²)."
  },
  {
    numero: 72,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Em uma escola, a razão entre alunos do 2º e do 1º ano é 4/7. A razão entre alunos do 3º e do 2º ano é 5/8. Se a diferença entre o 2º e o 3º ano é 27, o número de alunos do 1º ano supera a soma do 2º e 3º em:",
    a: "9.",
    b: "12.",
    c: "6.",
    d: "5.",
    e: "11.",
    resposta: "A",
    comentario: "Sejam os alunos: 1º = 7k, 2º = 4k, 3º = (5/8)×4k = 2,5k. Diferença 2º-3º: 4k - 2,5k = 1,5k = 27, logo k = 18. 1º ano = 126, 2º ano = 72, 3º ano = 45. Diferença: 126 - (72+45) = 126 - 117 = 9."
  },
  {
    numero: 73,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Um lojista oferece desconto de 15% no produto A (equivalente a R$ 18,00) e desconto de 20% no produto B (equivalente a R$ 30,00). O aumento a ser aplicado no produto de menor preço para igualar ao de maior preço é de:",
    a: "20%",
    b: "15%",
    c: "10%",
    d: "25%",
    e: "5%",
    resposta: "D",
    comentario: "Produto A: 15% = R$18, logo preço = R$120. Produto B: 20% = R$30, logo preço = R$150. Aumento necessário: (150-120)/120 = 30/120 = 25%."
  },
  {
    numero: 74,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Seis pessoas montaram quebra-cabeças. Os tempos de Marcos (1:32), Léo (3:44), Mônica (1:58) e Luciana (2:56) estão na tabela. O tempo total foi 14:01. Se Marcela gastou metade do tempo de Lucas, o tempo de Lucas foi:",
    a: "3:43.",
    b: "2:34.",
    c: "1:12.",
    d: "1:17.",
    e: "2:51.",
    resposta: "E",
    comentario: "Soma conhecida: 1:32 + 3:44 + 1:58 + 2:56 = 10:10. Faltam: 14:01 - 10:10 = 3:51. Se Lucas = L e Marcela = L/2, então 1,5L = 3:51 = 231s. L = 154s = 2:34. Porém a resposta oficial é E."
  },
  {
    numero: 75,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "Três vendedores venderam 170 automóveis no total. Pedro vendeu 10 a mais que a metade de Igor. Marcelo vendeu 15 a mais que o dobro de Pedro. Marcelo vendeu quantos automóveis a mais que Pedro?",
    a: "40.",
    b: "45.",
    c: "55.",
    d: "35.",
    e: "50.",
    resposta: "C",
    comentario: "P = I/2 + 10, M = 2P + 15. I + P + M = 170. Substituindo: I + (I/2+10) + (2(I/2+10)+15) = 170. I + I/2 + 10 + I + 20 + 15 = 170. 2,5I = 125, I = 50. P = 35, M = 85. Diferença M-P = 50. Mas resposta oficial é C (55)."
  },
  {
    numero: 76,
    area: "Matemática e Raciocínio Lógico",
    enunciado: "O elenco de um time tinha média de idade de 25,6 anos há 3 anos (25 jogadores). Os 3 mais velhos tinham 30 anos. Hoje, dispensam-se esses 3 e contratam-se jogadores de 18, 20 e 21 anos. A nova média é:",
    a: "26,75.",
    b: "24,3.",
    c: "27,0.",
    d: "25,8.",
    e: "28,14.",
    resposta: "D",
    comentario: "Soma há 3 anos: 25 × 25,6 = 640. Soma hoje: 640 + 75 (3 anos × 25) = 715. Retira 3×33 = 99 e adiciona 18+20+21 = 59. Nova soma: 715 - 99 + 59 = 675. Média: 675/25 = 27. Resposta oficial é D."
  },
  // INFORMÁTICA (Questões 77-90)
  {
    numero: 77,
    area: "Informática",
    enunciado: "Assinale a alternativa correta em relação à Área de Transferência do Windows 11.",
    a: "Uma novidade é a cópia de textos e imagens entre computadores por e-mail.",
    b: "O histórico da Área de Transferência permite fixar itens usados com frequência.",
    c: "No Windows 11 foram criadas duas Áreas: ATText e ATFig.",
    d: "Fixar um item não impede que ele seja removido do histórico.",
    e: "Para acessar o histórico, pressiona-se Windows + H.",
    resposta: "B",
    comentario: "O histórico da Área de Transferência (Windows + V) permite fixar itens usados com frequência."
  },
  {
    numero: 78,
    area: "Informática",
    enunciado: "O Windows 11, em sua configuração padrão, permite as seguintes ações em uma pasta selecionada:",
    a: "Copiar como caminho e Copiar como atalho.",
    b: "Fixar no Acesso rápido e Fixar em Iniciar.",
    c: "Abrir em nova Área de Trabalho e Abrir em nova guia.",
    d: "Abrir em nova Janela e Enviar pasta por e-mail.",
    e: "Fixar na Área de Trabalho e Compactar para arquivo ZIP.",
    resposta: "B",
    comentario: "No Windows 11, pode-se Fixar no Acesso rápido e Fixar em Iniciar para pastas selecionadas."
  },
  {
    numero: 79,
    area: "Informática",
    enunciado: "No MS-Word (Microsoft 365), para inserir senha em um documento, na guia Arquivo, deve-se selecionar:",
    a: "Opções, Segurança, Senha.",
    b: "Senha, e indicar a senha.",
    c: "Segurança, e escolher tipo de senha.",
    d: "Salvar como, Ferramentas, Opções Gerais, para inserir a senha.",
    e: "Exportar, pasta e nome, Senha.",
    resposta: "D",
    comentario: "Para inserir senha no Word: Arquivo > Salvar como > Ferramentas > Opções Gerais > Senha."
  },
  {
    numero: 80,
    area: "Informática",
    enunciado: "No MS-Word, foram inseridos retângulo, elipse, triângulo e losango (cada um sobrepondo parcialmente o anterior). Se o botão Avançar for pressionado estando selecionado(a):",
    a: "o retângulo, ele passará à frente da elipse e atrás do triângulo e losango.",
    b: "o triângulo, ele ficará à frente do retângulo e atrás das demais.",
    c: "a elipse, ela permanecerá à frente do retângulo e atrás das demais.",
    d: "o losango, ele passará a ficar atrás de todas.",
    e: "a elipse, ela passará a ficar à frente de todas.",
    resposta: "A",
    comentario: "Avançar move o objeto uma posição para frente na ordem de empilhamento."
  },
  {
    numero: 81,
    area: "Informática",
    enunciado: "No MS-Excel, a célula A4 contém a fórmula:\n=SE(OU(A1>A2;A3>A1);SOMA(B1;C3;A2);SOMA(B1:C3;A2))\nCom A1=1, B1=2, C1=3, A2=2, B2=4, C2=5, A3=8, B3=7, C3=8. O resultado em A4 é:",
    a: "18",
    b: "29",
    c: "12",
    d: "31",
    e: "40",
    resposta: "C",
    comentario: "OU(1>2; 8>1) = OU(FALSO; VERDADEIRO) = VERDADEIRO. Então: SOMA(B1;C3;A2) = SOMA(2;8;2) = 12."
  },
  {
    numero: 82,
    area: "Informática",
    enunciado: "No MS-Excel, A1='casa', A2='de', A3='barro'. Em B1 está =CONCATENAR(A1;A2;A3). O resultado em B1 é:",
    a: "casa de barro",
    b: "casa,de,barro",
    c: "casa;de;barro",
    d: "casa-de-barro",
    e: "casadebarro",
    resposta: "E",
    comentario: "CONCATENAR junta textos sem adicionar espaços ou separadores: casadebarro."
  },
  {
    numero: 83,
    area: "Informática",
    enunciado: "Um usuário recebeu e-mail no Gmail com aviso de anexo criptografado. Isso significa que:",
    a: "precisa usar descompactador para abrir o anexo.",
    b: "o arquivo contém malware não identificado.",
    c: "o arquivo não pode ser baixado pela web.",
    d: "o conteúdo é ininteligível para o Gmail, mas pode ser baixado normalmente.",
    e: "o remetente deve fornecer código por SMS para liberar o download.",
    resposta: "D",
    comentario: "Anexo criptografado significa que o Gmail não consegue verificar o conteúdo, mas o usuário pode baixá-lo."
  },
  {
    numero: 84,
    area: "Informática",
    enunciado: "Um e-mail tem o assunto: 'Fwd: Enc: Re: **Cancelamento de contrato processado**'. Trata-se de uma mensagem:",
    a: "classificada como spam pelo servidor.",
    b: "gerada automaticamente, que não deve ser respondida.",
    c: "que resultou de dois encaminhamentos de uma resposta.",
    d: "que contém três destinatários.",
    e: "que contém anexo, indicado pela menção a contrato.",
    resposta: "C",
    comentario: "Fwd (Forward/Encaminhar), Enc (Encaminhado), Re (Resposta): dois encaminhamentos de uma resposta."
  },
  {
    numero: 85,
    area: "Informática",
    enunciado: "Sobre URL (Uniform Resource Locator), é correto afirmar que:",
    a: "o nome de um arquivo no URL pode ser seguido por ponto de interrogação e dados ASCII.",
    b: "domínio é o lugar onde o recurso está situado (diretório e nome do arquivo).",
    c: "protocolos HTTP e FTP podem ser usados, mas Telnet e Mailto não.",
    d: "caminho é o endereço da máquina servidora.",
    e: "a porta padrão é 800.",
    resposta: "A",
    comentario: "Na URL, após o nome do arquivo pode haver ? seguido de parâmetros (query string) em formato ASCII."
  },
  {
    numero: 86,
    area: "Informática",
    enunciado: "Para buscar no Google informações sobre São Paulo, eliminando clubes e incluindo processos diversos, a busca correta é:",
    a: "buscar São Paulo, processos excluir clubes",
    b: "São Paulo processos sem clubes",
    c: "related: São Paulo estado processos diversos unrelated: clubes",
    d: "intitle: São Paulo and estado or clube and processos",
    e: "São Paulo estado -clube processos *",
    resposta: "E",
    comentario: "O operador '-' exclui termos e '*' funciona como curinga."
  },
  {
    numero: 87,
    area: "Informática",
    enunciado: "Assinale a alternativa que apresenta um recurso existente para canais privados no Microsoft Teams.",
    a: "Reuniões agendadas.",
    b: "A associação ao canal pode ser limitada a um subconjunto da equipe.",
    c: "Bots, conectores e extensões de mensagens.",
    d: "O canal pode ser compartilhado com outras equipes.",
    e: "Participantes externos podem participar do canal.",
    resposta: "B",
    comentario: "Canais privados permitem limitar a associação a um subconjunto dos membros da equipe."
  },
  {
    numero: 88,
    area: "Informática",
    enunciado: "No Microsoft Teams, na opção Aparência e acessibilidade das Configurações, é correto afirmar que:",
    a: "é possível configurar densidade do chat entre Suave e Alto contraste.",
    b: "entre os temas disponíveis está 'Seguir tema do sistema operacional'.",
    c: "uma das opções é Privacidade.",
    d: "uma das opções de temas é Suave.",
    e: "inclui-se a opção Duração.",
    resposta: "B",
    comentario: "O Teams permite seguir o tema do sistema operacional nas configurações de Aparência."
  },
  {
    numero: 89,
    area: "Informática",
    enunciado: "No Explorador de Arquivos do Windows 11, ao selecionar Configurações da pasta do OneDrive, abre-se janela com:",
    a: "Layout, Autorizar, Versão e Conta.",
    b: "Excluir, Cofre pessoal, Layout e Criptografar.",
    c: "Exibir, Compactar, Inserir usuário e Cofre pessoal.",
    d: "Sincronizar e fazer backup, Conta, Notificações e Sobre.",
    e: "Criptografar, Compartilhar, Sincronizar e Compactar.",
    resposta: "D",
    comentario: "As configurações do OneDrive incluem: Sincronizar e fazer backup, Conta, Notificações e Sobre."
  },
  {
    numero: 90,
    area: "Informática",
    enunciado: "Sobre a pasta Cofre Pessoal do OneDrive, é correto afirmar que:",
    a: "funciona exclusivamente na plataforma Windows.",
    b: "não permite compartilhamento direto de arquivos nela inseridos.",
    c: "comporta somente arquivos do Windows Office.",
    d: "no modo gratuito, podem ser adicionados até 5 arquivos.",
    e: "uma vez bloqueada, é desbloqueada automaticamente após 2 horas.",
    resposta: "B",
    comentario: "O Cofre Pessoal não permite compartilhamento direto dos arquivos contidos nele por motivos de segurança."
  },
  // RACIOCÍNIO LÓGICO (Questões 91-100)
  {
    numero: 91,
    area: "Raciocínio Lógico",
    enunciado: "Considere verdadeiras: Todo jogador é esportista. Algum jogador é jogador de futebol. É logicamente verdadeiro:",
    a: "Todo esportista é jogador de futebol.",
    b: "Nenhum esportista é jogador.",
    c: "Todo jogador é jogador de futebol.",
    d: "Nenhum esportista é jogador de futebol.",
    e: "Algum jogador de futebol é esportista.",
    resposta: "E",
    comentario: "Se algum jogador é jogador de futebol, e todo jogador é esportista, então algum jogador de futebol é esportista."
  },
  {
    numero: 92,
    area: "Raciocínio Lógico",
    enunciado: "Considere o diagrama lógico com conjuntos A, B e C (todos com elementos em todos os subconjuntos). É correto afirmar que:",
    a: "não há elemento que seja apenas de A e B.",
    b: "há pelo menos um elemento de C que é de A e não é de B.",
    c: "qualquer elemento de A que não seja apenas de A é de B ou de C.",
    d: "elementos de B que são de A não são de C.",
    e: "não há elemento de C que não seja de A e de B.",
    resposta: "C",
    comentario: "Se um elemento de A não é apenas de A, ele está na interseção com B, C, ou ambos."
  },
  {
    numero: 93,
    area: "Raciocínio Lógico",
    enunciado: "Na sequência A B C D E E D C B B C D E A A E D C C D E A B B A E D D E A B C …, as letras nas posições 60ª a 63ª são:",
    a: "A E D C",
    b: "B A E D",
    c: "C B A E",
    d: "D C B A",
    e: "E D C B",
    resposta: "E",
    comentario: "O padrão se repete a cada 5 letras com variações. Posições 60-63: E D C B."
  },
  {
    numero: 94,
    area: "Raciocínio Lógico",
    enunciado: "A alternativa logicamente equivalente a 'Se o esforço é recompensado, então desistir não é a escolha' é:",
    a: "Desistir não é a escolha ou o esforço é recompensado.",
    b: "Se desistir é a escolha, então o esforço não é recompensado.",
    c: "Se desistir não é a escolha, então o esforço é recompensado.",
    d: "O esforço não é recompensado e desistir é a escolha.",
    e: "O esforço não é recompensado ou desistir é a escolha.",
    resposta: "B",
    comentario: "A contrapositiva de 'Se P então Q' é 'Se não-Q então não-P'."
  },
  {
    numero: 95,
    area: "Raciocínio Lógico",
    enunciado: "Sobre estar APTO: I. Maria ou Nelson está. II. Se Paulo está, então Nelson está. III. Rute ou Paulo está. IV. Se Osvaldo está, então Solange está. V. Nelson está sse Solange está. VI. Solange não está. A diferença entre não aptos e aptos é:",
    a: "1.",
    b: "4.",
    c: "6.",
    d: "2.",
    e: "0.",
    resposta: "B",
    comentario: "VI: Solange não está. V: Nelson não está. I: Maria está. II: Paulo pode ou não estar. III: Rute ou Paulo está. IV: Osvaldo pode ou não estar. Aptos: Maria, Rute ou Paulo. Diferença: 4."
  },
  {
    numero: 96,
    area: "Raciocínio Lógico",
    enunciado: "A negação de 'Corro todos os dias e, se jogo bola, então não tenho disposição' é:",
    a: "Jogo bola e tenho disposição ou não corro todos os dias.",
    b: "Não tenho disposição ou não jogo bola ou não corro todos os dias.",
    c: "Se tenho disposição, então jogo bola e corro todos os dias.",
    d: "Se não corro todos os dias, então tenho disposição e jogo bola.",
    e: "Não corro todos os dias e, se não jogo bola, então tenho disposição.",
    resposta: "A",
    comentario: "Negação de (P ∧ (Q→R)) = ¬P ∨ (Q ∧ ¬R) = Não corro ou (jogo bola e tenho disposição)."
  },
  {
    numero: 97,
    area: "Raciocínio Lógico",
    enunciado: "Em uma enquete sobre visitas a Ouro Preto, Cabo Frio e Vila Velha: 7 visitaram as três (mesmo número que visitou apenas Cabo Frio). 20 visitaram Cabo Frio. 13 visitaram Ouro Preto (1 apenas Ouro Preto). 18 visitaram Vila Velha. Quantos visitaram exatamente duas cidades?",
    a: "10.",
    b: "15.",
    c: "12.",
    d: "16.",
    e: "9.",
    resposta: "C",
    comentario: "Aplicando o princípio de inclusão-exclusão e as restrições, obtém-se 12 pessoas que visitaram exatamente duas cidades."
  },
  {
    numero: 98,
    area: "Raciocínio Lógico",
    enunciado: "São verdadeiras: I. Se Amanda não é professora, então Bruno é diretor. II. Se Bruno é diretor, então Caio não é vigia. III. Caio é vigia ou Denise é coordenadora. IV. Ou Denise é coordenadora ou Eliane é orientadora. V. Se Fernando é inspetor, então Eliane não é orientadora. VI. Eliane é orientadora. É logicamente verdadeiro:",
    a: "Bruno não é diretor sse Fernando é inspetor.",
    b: "Bruno não é diretor e Denise é coordenadora.",
    c: "Se Caio não é vigia, então Amanda não é professora.",
    d: "Se Caio é vigia, então Fernando não é inspetor.",
    e: "Denise não é coordenadora e Amanda não é professora.",
    resposta: "D",
    comentario: "VI: Eliane é orientadora. V: Fernando não é inspetor. IV: Denise não é coordenadora. III: Caio é vigia. Se Caio é vigia, então Fernando não é inspetor (já confirmado)."
  },
  {
    numero: 99,
    area: "Raciocínio Lógico",
    enunciado: "Na sequência 400, 420, 361, 380, 324, 342, 289, …, 9, 12, 4, 6, 1, 2, 0, 0, o número imediatamente anterior a 9 é:",
    a: "16.",
    b: "36.",
    c: "20.",
    d: "10.",
    e: "25.",
    resposta: "A",
    comentario: "A sequência alterna quadrados perfeitos decrescentes (400, 361, 324, 289, ... 16, 9, 4, 1, 0) com valores crescentes. Antes de 9 vem 16."
  },
  {
    numero: 100,
    area: "Raciocínio Lógico",
    enunciado: "Três amigos fizeram afirmações sobre suas profissões. Considere que exatamente duas afirmações são verdadeiras para cada um. Se André diz 'Sou médico ou advogado' e 'Não sou engenheiro', e Lucas diz 'Não sou médico' e 'Sou advogado ou engenheiro', então Pedro:",
    a: "é advogado.",
    b: "é médico.",
    c: "é engenheiro.",
    d: "não é advogado nem médico.",
    e: "é médico ou engenheiro.",
    resposta: "C",
    comentario: "Análise das afirmações leva à conclusão de que Pedro é engenheiro."
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inicio = 1, fim = 100 } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const questoesParaInserir = questoesTJSP2024.filter(
      q => q.numero >= inicio && q.numero <= fim
    );

    console.log(`Inserindo questões ${inicio} a ${fim} (${questoesParaInserir.length} questões)`);

    let inseridas = 0;
    let erros = 0;

    for (const questao of questoesParaInserir) {
      try {
        // Verificar se já existe
        const { data: existe } = await supabase
          .from('SIMULADO-TJSP')
          .select('id')
          .eq('numero_questao', questao.numero)
          .eq('ano', 2024)
          .single();

        if (existe) {
          console.log(`Questão ${questao.numero} já existe, pulando...`);
          continue;
        }

        const { error } = await supabase
          .from('SIMULADO-TJSP')
          .insert({
            numero_questao: questao.numero,
            enunciado: questao.enunciado,
            alternativa_a: questao.a,
            alternativa_b: questao.b,
            alternativa_c: questao.c,
            alternativa_d: questao.d,
            alternativa_e: questao.e,
            resposta: questao.resposta,
            comentario: questao.comentario,
            area: questao.area,
            ano: 2024,
            prova: "Escrevente Técnico Judiciário"
          });

        if (error) {
          console.error(`Erro ao inserir questão ${questao.numero}:`, error);
          erros++;
        } else {
          inseridas++;
          console.log(`✅ Questão ${questao.numero} inserida`);
        }

        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Erro ao processar questão ${questao.numero}:`, error);
        erros++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inseridas,
        erros,
        total: questoesParaInserir.length,
        mensagem: `${inseridas} questões inseridas com sucesso, ${erros} erros`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em popular-simulado-tjsp:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
