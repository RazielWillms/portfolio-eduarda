"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type Topico = {
  id: string
  titulo: string
  resumo: string
  oQueE: string
  paraQueServe: string
  quando: string
  como: string[]
  relevancia: string
  cuidado?: string
  termos: string[]
}

const topicos: Topico[] = [
  {
    id: "primeira-sessao",
    titulo: "Das sessões iniciais ao planejamento",
    resumo: "Percurso entre vínculo, avaliação, síntese clínica, planejamento, linha de base e intervenção.",
    oQueE: "O acompanhamento pode começar com vínculo, entrevista, avaliação ou observação sem alvos. A área Avaliação consolida as evidências dessas sessões em potencialidades, necessidades e prioridades versionadas. Depois, o planejamento organiza objetivos e alvos; a linha de base exige alvo e medição, enquanto a intervenção também exige protocolo.",
    paraQueServe: "Preserva o trabalho clínico anterior ao planejamento, torna explícita a fundamentação das prioridades e evita iniciar coletas sem definição mensurável ou procedimento documentado.",
    quando: "Logo após vincular o paciente e sempre que um novo alvo for incluído no planejamento.",
    como: ["Antes do planejamento, use Registrar sessão e escolha vínculo, entrevista, avaliação, observação ou orientação.", "Em Avaliação, selecione as sessões consideradas e registre fontes, potencialidades, necessidades, prioridades e conclusão.", "Salve rascunhos enquanto a avaliação estiver aberta e conclua uma versão quando houver base suficiente.", "Use as prioridades concluídas para justificar o plano e criar objetivos funcionais.", "Adicione alvo observável e medida; para linha de base, o protocolo não é obrigatório.", "Configure critério e protocolo antes de iniciar intervenção e registre a integridade nas sessões aplicáveis."],
    relevancia: "A sessão depende dessas configurações para preservar autoria, comparabilidade, integridade e vínculo entre o dado e o procedimento vigente.",
    cuidado: "Sessões iniciais não alimentam gráficos de alvos. Linha de base não exige protocolo; ensino, generalização e manutenção exigem protocolo vigente e integridade.",
    termos: ["primeira sessão", "avaliação", "síntese", "potencialidades", "necessidades", "prioridades", "planejamento", "protocolo", "fase"],
  },
  {
    id: "pacientes",
    titulo: "Pacientes, cadastro único e vínculos",
    resumo: "Identidade do paciente e autorização de acesso entre profissionais.",
    oQueE: "O paciente é um cadastro único no sistema. O vínculo registra quais profissionais estão autorizados a trabalhar com ele; ter uma conta no sistema, por si só, não concede acesso.",
    paraQueServe: "Evita cadastros duplicados, mantém uma visão consistente do paciente e separa autorização de acesso de simples autenticação.",
    quando: "Antes do primeiro planejamento clínico. Se o paciente já existir, solicite acesso; se for novo, conclua o cadastro e o vínculo será criado automaticamente.",
    como: ["Informe os dados disponíveis e aguarde a verificação de possíveis correspondências.", "Confirme correspondências apenas pelos dados mínimos e mascarados.", "Acompanhe pedidos enviados e recebidos em Solicitações.", "Revise periodicamente se os vínculos da equipe continuam necessários."],
    relevancia: "A qualidade da identidade do paciente afeta todo o prontuário. Um cadastro duplicado fragmenta histórico, decisões e compartilhamentos.",
    cuidado: "Nunca use a busca de duplicidade como consulta livre de pessoas. Ela existe somente para apoiar um cadastro legítimo.",
    termos: ["cadastro", "duplicidade", "cpf", "responsável", "vínculo", "solicitação", "acesso"],
  },
  {
    id: "plano",
    titulo: "Plano clínico",
    resumo: "Contêiner que organiza a direção geral do trabalho clínico.",
    oQueE: "É a estrutura que reúne objetivos e alvos relacionados a uma necessidade clínica. Pode passar por rascunho, revisão, aprovação, execução e encerramento.",
    paraQueServe: "Explicita a justificativa do acompanhamento, organiza prioridades e permite revisar um conjunto coerente de objetivos ao longo do tempo.",
    quando: "Após compreender a demanda e antes de criar alvos isolados. Crie outro plano quando houver uma finalidade clínica realmente distinta, não apenas por conveniência.",
    como: ["Use um título que identifique claramente o foco.", "Descreva a justificativa baseada nas necessidades observadas.", "Defina início e data prevista de revisão.", "Atualize o status conforme o trabalho avança; encerre quando sua finalidade terminar."],
    relevancia: "Sem um plano, alvos podem virar tarefas desconectadas. O plano registra por que aquele conjunto de mudanças é relevante para a pessoa.",
    cuidado: "O plano não substitui avaliação individualizada, consentimento, supervisão ou documentação exigida pela profissão.",
    termos: ["plano", "planejamento", "status", "justificativa", "revisão"],
  },
  {
    id: "objetivo",
    titulo: "Objetivos clínicos",
    resumo: "Resultados amplos que dão direção aos alvos mensuráveis.",
    oQueE: "O objetivo descreve uma mudança funcional mais ampla, de curto ou longo prazo. Ele fica dentro de um plano e agrupa alvos que contribuem para o mesmo resultado.",
    paraQueServe: "Conecta medidas específicas a resultados significativos e evita que o acompanhamento se limite a desempenhos fragmentados.",
    quando: "Depois de criar o plano e antes dos alvos. Revise quando a prioridade funcional mudar ou quando os alvos deixarem de representar o resultado pretendido.",
    como: ["Escreva em linguagem funcional e compreensível.", "Indique se é de curto ou longo prazo.", "Evite transformar o objetivo em uma lista de procedimentos.", "Organize a ordem para comunicar prioridade."],
    relevancia: "Um bom objetivo ajuda equipe e responsáveis a entenderem a direção do trabalho, mesmo sem conhecer detalhes técnicos de cada medida.",
    termos: ["objetivo", "curto prazo", "longo prazo", "resultado funcional"],
  },
  {
    id: "alvo",
    titulo: "Alvos clínicos",
    resumo: "Comportamentos ou habilidades específicos que serão observados e medidos.",
    oQueE: "É a unidade prática do acompanhamento. Um alvo pode ser de aquisição, quando se pretende desenvolver uma habilidade, ou de redução, quando se acompanha a diminuição de um comportamento definido.",
    paraQueServe: "Transforma um objetivo amplo em algo observável, mensurável e passível de decisão baseada em dados.",
    quando: "Quando houver uma razão clínica clara, uma definição operacional possível e capacidade real de medir e intervir de maneira consistente.",
    como: ["Escolha um nome curto e reconhecível.", "Associe o alvo ao objetivo correto.", "Defina natureza e fase inicial.", "Complete definição, medição, critério e protocolo antes de iniciar ensino ou intervenção."],
    relevancia: "Tudo o que aparece em sessões, gráficos, critérios e revisões se conecta ao alvo. Um alvo mal definido compromete as etapas seguintes.",
    cuidado: "Não use rótulos vagos como “comportar-se bem” ou inferências como “estar ansioso”; descreva respostas que possam ser observadas.",
    termos: ["alvo", "aquisição", "redução", "habilidade", "comportamento"],
  },
  {
    id: "definicao",
    titulo: "Definição operacional",
    resumo: "Descrição objetiva do que conta e do que não conta como resposta.",
    oQueE: "É uma descrição observável e replicável do alvo, acompanhada de condições, exemplos, não exemplos, materiais e respostas esperadas.",
    paraQueServe: "Permite que pessoas diferentes reconheçam a mesma resposta e reduz interpretações subjetivas na coleta.",
    quando: "Antes da primeira medição do alvo e sempre que a definição vigente deixar de representar corretamente o que está sendo observado.",
    como: ["Descreva ações visíveis ou mensuráveis.", "Inclua início, fim e limites quando forem relevantes.", "Registre exemplos e não exemplos parecidos entre si.", "Crie uma nova versão quando a definição mudar; preserve a versão usada nos dados anteriores."],
    relevancia: "A definição operacional sustenta confiabilidade, treinamento de aplicadores e interpretação válida dos dados.",
    termos: ["definição operacional", "observável", "exemplos", "não exemplos", "versão"],
  },
  {
    id: "medicao",
    titulo: "Configuração de medição",
    resumo: "Regra que determina quais dados serão coletados para o alvo.",
    oQueE: "Define o tipo de medida e sua unidade: frequência, taxa, duração, latência, oportunidades, tentativas discretas, intervalos, amostragem, independência ou intensidade.",
    paraQueServe: "Garante que a medida seja compatível com a dimensão do comportamento e comparável entre sessões.",
    quando: "Antes da coleta. Reavalie quando o tipo de medida não responder mais à pergunta clínica ou quando as condições de observação mudarem.",
    como: ["Escolha a dimensão mais relevante para a decisão.", "Informe unidade e parâmetros necessários.", "Mantenha oportunidades e duração de observação consistentes quando quiser comparar sessões.", "Crie nova versão quando mudar a regra de medição."],
    relevancia: "Um gráfico só é útil quando seus pontos representam medidas comparáveis e clinicamente significativas.",
    cuidado: "Não troque o tipo de medida apenas para produzir um resultado visualmente melhor.",
    termos: ["medição", "frequência", "taxa", "duração", "latência", "intervalo", "tentativas", "oportunidades", "intensidade"],
  },
  {
    id: "criterio",
    titulo: "Critério de domínio",
    resumo: "Condição previamente definida para considerar desempenho consistente.",
    oQueE: "É uma regra quantitativa e contextual que combina direção, valor-alvo, número de sessões consecutivas, oportunidades mínimas, ambientes e aplicadores.",
    paraQueServe: "Reduz decisões improvisadas e deixa explícito o que será considerado evidência suficiente de estabilidade, generalização ou manutenção.",
    quando: "Antes de analisar domínio. Atualize por nova versão quando a exigência clínica mudar, sem reescrever o critério vinculado às sessões anteriores.",
    como: ["Defina se o valor deve aumentar ou reduzir.", "Escolha um valor coerente com o tipo de medição.", "Determine quantas sessões consecutivas são necessárias.", "Use mínimos de ambientes e aplicadores quando generalização fizer parte do resultado.", "Considere manutenção quando a estabilidade ao longo do tempo for relevante."],
    relevancia: "O sistema pode indicar se a regra foi satisfeita, mas a decisão continua exigindo análise de integridade, contexto, variabilidade e relevância social.",
    cuidado: "Atingir o critério não muda automaticamente a fase e não equivale, sozinho, a alta ou encerramento.",
    termos: ["critério", "domínio", "sessões consecutivas", "ambientes", "aplicadores", "manutenção"],
  },
  {
    id: "ciclo",
    titulo: "Ciclo de vida e fases do alvo",
    resumo: "Estados que comunicam a função atual do alvo no acompanhamento.",
    oQueE: "O ciclo organiza o alvo em rascunho, linha de base, ensino, generalização, manutenção, pausado ou encerrado. A fase é contexto clínico, não apenas um marcador visual.",
    paraQueServe: "Comunica o que se pretende fazer com o alvo agora e ajuda a interpretar dados obtidos sob condições diferentes.",
    quando: "Defina a fase inicial ao criar o alvo e registre cada mudança somente quando houver justificativa clínica e evidências suficientes.",
    como: ["Rascunho: estrutura ainda incompleta; não iniciar coleta de intervenção.", "Linha de base: observar desempenho antes ou sem a intervenção planejada.", "Ensino: aplicar o protocolo para desenvolver ou modificar o repertório.", "Generalização: verificar desempenho com novas pessoas, ambientes, estímulos ou respostas.", "Manutenção: verificar se o resultado permanece ao longo do tempo com suporte reduzido.", "Pausado: interromper temporariamente sem encerrar o histórico.", "Encerrado: finalizar o trabalho ativo naquele alvo, preservando dados e decisões."],
    relevancia: "A mesma medida pode ter significados diferentes em linha de base, ensino ou manutenção. Registrar a fase mantém o histórico interpretável.",
    cuidado: "Não avance fases apenas porque o último ponto melhorou. Considere critério, tendência, integridade, generalização, validade social e julgamento clínico.",
    termos: ["ciclo de vida", "fase", "rascunho", "linha de base", "ensino", "generalização", "manutenção", "pausado", "encerrado"],
  },
  {
    id: "mudanca-fase",
    titulo: "Mudança de fase",
    resumo: "Decisão explícita e justificada que altera a etapa atual do alvo.",
    oQueE: "É o registro de uma transição entre fases, acompanhado do motivo. O histórico permite saber quando e por que a estratégia de acompanhamento mudou.",
    paraQueServe: "Diferencia mudanças clínicas reais de simples variação nos dados e cria rastreabilidade para revisões futuras.",
    quando: "Após analisar dados suficientes, qualidade da aplicação, contextos e condições do paciente. Também pode ocorrer por segurança, prioridade, indisponibilidade ou mudança de objetivos.",
    como: ["Revise o gráfico e o período relevante.", "Confira integridade e possíveis desvios.", "Considere contextos, aplicadores e validade social.", "Escolha a nova fase e escreva uma justificativa objetiva.", "Após mudar, confirme se protocolo, medida e critério ainda são adequados."],
    relevancia: "A justificativa evita que transições futuras pareçam arbitrárias e permite relacionar mudanças de tendência às decisões tomadas.",
    termos: ["mudança de fase", "transição", "justificativa", "decisão"],
  },
  {
    id: "intervencao",
    titulo: "Intervenção e protocolos de ensino",
    resumo: "Procedimentos planejados para produzir aprendizagem de forma consistente.",
    oQueE: "O protocolo descreve estratégia de ensino, hierarquia de ajuda, esvanecimento, reforçadores, esquema de reforçamento, correção de erro e instruções de aplicação.",
    paraQueServe: "Transforma a intenção clínica em um procedimento que pode ser aplicado, treinado, monitorado e revisado.",
    quando: "Configure antes de registrar sessões de ensino. Crie nova versão quando uma mudança material alterar como o alvo é trabalhado.",
    como: ["Escolha a estratégia compatível com o alvo e o contexto.", "Descreva a sequência de ajudas do menor ao maior apoio, ou conforme o procedimento adotado.", "Planeje como as ajudas serão reduzidas.", "Defina reforçadores e esquema de entrega.", "Explique a correção de erro sem práticas punitivas ou ambíguas.", "Inclua instruções suficientes para aplicação consistente."],
    relevancia: "Protocolos versionados permitem relacionar resultados ao procedimento vigente em cada sessão.",
    cuidado: "O sistema documenta o protocolo, mas não valida competência profissional, adequação ética ou segurança do procedimento.",
    termos: ["intervenção", "protocolo", "ensino", "ajuda", "esvanecimento", "reforçamento", "correção de erro"],
  },
  {
    id: "apoio",
    titulo: "Apoio comportamental",
    resumo: "Plano específico para alvos de redução, baseado em hipótese funcional explícita.",
    oQueE: "Reúne função assumida, justificativa, estratégias antecedentes, comportamento substitutivo, ensino, consequências, segurança e critérios de revisão.",
    paraQueServe: "Organiza uma resposta preventiva e educativa, priorizando habilidades substitutivas e coerência entre equipe e ambientes.",
    quando: "Após reunir observações e informações suficientes para formular uma hipótese prudente. Revise quando novos dados enfraquecerem a hipótese ou quando o plano não for efetivo ou viável.",
    como: ["Declare a função como hipótese, não como certeza.", "Descreva as evidências que sustentam a formulação.", "Planeje alterações antecedentes.", "Defina o comportamento substitutivo e como será ensinado.", "Registre respostas consequentes e plano de segurança quando necessário.", "Defina quando o plano será reavaliado."],
    relevancia: "Evita que a redução seja tratada isoladamente, sem compreender contexto ou ensinar alternativas funcionalmente relevantes.",
    cuidado: "Registros ABC são descritivos e não confirmam função por si sós. Situações de risco exigem protocolos profissionais e institucionais apropriados.",
    termos: ["apoio comportamental", "função", "hipótese", "abc", "antecedente", "consequência", "substitutivo", "segurança"],
  },
  {
    id: "sessao",
    titulo: "Sessões clínicas",
    resumo: "Registro contextualizado do que foi trabalhado e medido em um encontro.",
    oQueE: "A sessão reúne data, ambiente, aplicador, contexto, alvos, medidas, integridade e, quando pertinente, observações ABC. Medidas por oportunidades também podem registrar cada tentativa, seu resultado, nível de ajuda e latência.",
    paraQueServe: "Preserva a relação entre condições de aplicação e resultados, permitindo analisar múltiplos alvos sem perder contexto.",
    quando: "Ao final ou durante cada encontro em que houver coleta válida. Registre somente dados realmente observados.",
    como: ["Escolha o paciente correto.", "Informe ambiente, aplicador e contexto de forma útil.", "Adicione apenas os alvos efetivamente trabalhados.", "Em tentativas discretas ou oportunidades, abra o detalhamento quando precisar registrar resultado, ajuda e latência por tentativa.", "O sistema calcula oportunidades e respostas independentes a partir desse detalhamento.", "Marque os componentes do protocolo e, se houver erro material, cancele a sessão com justificativa e registre uma substituta."],
    relevancia: "Sessões completas tornam gráficos, domínio, integridade e revisões mais confiáveis.",
    cuidado: "Somente o autor pode cancelar ou restaurar. O cancelamento retira a sessão de gráficos e tokens, mas preserva seu conteúdo e a trilha de auditoria.",
    termos: ["sessão", "coleta", "correção", "cancelamento", "restauração", "substituição", "integridade", "observação privada"],
  },
  {
    id: "analise",
    titulo: "Análise, domínio e revisão clínica",
    resumo: "Leitura integrada dos dados para apoiar decisões documentadas.",
    oQueE: "A área apresenta séries históricas na unidade original de cada alvo, com critério, fase, protocolo, integridade, ambiente e aplicador. Frequência e intensidade usam barras; medidas contínuas, temporais e percentuais usam linhas.",
    paraQueServe: "Ajuda a identificar nível, tendência, variabilidade e possíveis relações com mudanças de fase, contexto ou protocolo sem misturar medidas incompatíveis em uma porcentagem geral.",
    quando: "Em revisões programadas, diante de mudança relevante, ausência de progresso, variabilidade incomum, possível domínio ou necessidade de alterar intervenção.",
    como: ["Selecione alvo, período, fase, ambiente e aplicador.", "Leia o eixo na unidade informada: ocorrências, taxa, segundos, percentual ou nível.", "Observe tendência e variabilidade, não apenas o último ponto.", "Use a linha do critério como referência, nunca como decisão automática.", "Confira mudanças de fase, versão do protocolo e integridade.", "Registre a decisão, justificativa, evidências e próxima revisão."],
    relevancia: "A revisão registrada cria continuidade clínica e deixa claro por que manter, modificar, avançar, pausar ou encerrar.",
    cuidado: "Indicadores automáticos apoiam a decisão; não substituem análise profissional nem permitem inferir causalidade sem desenho e controle adequados.",
    termos: ["análise", "gráfico", "tendência", "variabilidade", "domínio", "revisão", "concordância"],
  },
  {
    id: "participacao",
    titulo: "Participação, validade social e capacitação",
    resumo: "Relevância dos resultados e condições para aplicação fora da sessão.",
    oQueE: "A validade social registra relevância, aceitabilidade, viabilidade, benefício percebido e assentimento observado. A capacitação documenta instrução, modelação, ensaio, feedback e competência.",
    paraQueServe: "Verifica se objetivos e procedimentos fazem sentido para as pessoas envolvidas e se aplicadores possuem condições reais de implementar o que foi planejado.",
    quando: "No planejamento, durante revisões, após mudanças relevantes e sempre que a participação, viabilidade ou implementação puder alterar a decisão.",
    como: ["Escolha quem respondeu e registre relato concreto.", "Diferencie aceite, recusa, ambivalência e ausência de observação.", "Documente adaptações necessárias.", "Na capacitação, marque os componentes realmente realizados.", "Registre competência observada separadamente da mera presença no treinamento.", "Planeje acompanhamento quando o critério ainda não tiver sido atingido."],
    relevancia: "Um resultado tecnicamente positivo pode não ser relevante, aceitável ou sustentável. Esses registros tornam essa dimensão visível.",
    cuidado: "Assentimento observado não substitui consentimento formal nem autoriza ignorar sinais de recusa ou desconforto.",
    termos: ["participação", "validade social", "assentimento", "aceitabilidade", "viabilidade", "capacitação", "bst", "competência"],
  },
  {
    id: "leitura-avancada",
    titulo: "Tentativas, ajuda e leitura contextual",
    resumo: "Como interpretar independência, prompts, latência e diferenças entre contextos sem conclusões automáticas.",
    oQueE: "A coleta detalhada separa respostas corretas independentes, corretas com ajuda, incorretas e sem resposta. Também resume níveis de ajuda e latência. A comparação contextual organiza médias por ambiente, aplicador e fase.",
    paraQueServe: "Permite verificar se o desempenho depende de prompts, se a latência está mudando e se o repertório ocorre fora da condição principal de ensino.",
    quando: "Use quando o tipo de medição for tentativas discretas ou oportunidades e o detalhamento for clinicamente relevante. Consulte a comparação contextual quando existirem dados em mais de um ambiente, aplicador ou fase.",
    como: ["Registre cada tentativa somente quando observada.", "Diferencie correta independente de correta com ajuda.", "Escolha o nível de ajuda realmente utilizado.", "Informe latência apenas quando houver uma regra de início e término consistente.", "Compare blocos recentes e observe a quantidade de sessões.", "Não trate diferença de média como prova de generalização ou causalidade."],
    relevancia: "O percentual agregado pode melhorar enquanto a dependência de ajuda permanece alta. O detalhamento torna essa diferença visível.",
    cuidado: "Categorias do gráfico são mutuamente exclusivas, mas níveis de ajuda descrevem outra dimensão. Poucas sessões, protocolos diferentes ou baixa integridade limitam comparações.",
    termos: ["tentativa", "independência", "prompt", "ajuda", "esvanecimento", "latência", "contexto", "generalização"],
  },
  {
    id: "revisao-decisao",
    titulo: "Prontidão, revisão e aplicação da decisão",
    resumo: "Fluxo auditável entre evidências, decisão clínica e mudança de fase.",
    oQueE: "A prontidão reúne critério, série recente, tendência, integridade e diversidade contextual. A revisão registra decisão e justificativa com snapshot calculado no servidor. Avançar ou retornar de fase permanece como uma segunda ação explícita.",
    paraQueServe: "Evita que uma mudança clínica seja confundida com um clique automático e preserva quais evidências sustentaram a decisão.",
    quando: "Em revisão programada, possível domínio, ausência de progresso, mudança de contexto ou necessidade de modificar, pausar ou encerrar uma intervenção.",
    como: ["Escolha o período clínico relevante.", "Leia os indicadores de prontidão e suas limitações.", "Selecione a decisão e escreva justificativa baseada nos dados.", "Para avançar ou encerrar, confirme que revisou integridade, generalização, validade social e assentimento.", "Depois de salvar, aplique a transição pendente quando ela corresponder à fase atual.", "Use alteração manual somente para correção administrativa e documente o motivo."],
    relevancia: "A separação entre revisar e aplicar reduz mudanças acidentais e vincula a transição ao registro que a justificou.",
    cuidado: "Prontidão favorável não obriga mudança. A mesma revisão só pode aplicar uma transição e o backend permite apenas fases adjacentes.",
    termos: ["prontidão", "revisão", "snapshot", "decisão", "mudança de fase", "correção administrativa", "auditoria"],
  },
  {
    id: "equipe",
    titulo: "Equipe, privacidade e compartilhamento",
    resumo: "Colaboração com limites claros de acesso, autoria e exposição.",
    oQueE: "A equipe reúne profissionais explicitamente vinculados ao paciente. Cada profissional mantém autoria sobre seus alvos, sessões, protocolos e observações privadas.",
    paraQueServe: "Permite continuidade e colaboração sem transformar o prontuário em um espaço de acesso irrestrito.",
    quando: "Revise vínculos quando alguém entra ou sai do caso. Gere compartilhamento externo somente quando houver finalidade definida e destinatário autorizado.",
    como: ["Use Equipe para confirmar profissionais vinculados.", "Não compartilhe credenciais.", "Escolha escopo profissional ou de equipe e limite o período.", "Selecione alvos e decida se critérios, fases, integridade e contextos podem aparecer.", "Mantenha apenas os tokens necessários e revogue os demais.", "Observações privadas e registros ABC nunca são incluídos no portal."],
    relevancia: "Autorização mínima reduz exposição de dados e ajuda a preservar responsabilidade sobre cada registro.",
    cuidado: "O administrador gerencia o ambiente, mas isso não transforma suporte técnico em autorização clínica irrestrita.",
    termos: ["equipe", "privacidade", "rls", "compartilhamento", "token", "responsável", "autoria"],
  },
]

const fluxo = ["Paciente e vínculo", "Plano", "Objetivos", "Alvos", "Definição e medição", "Critério", "Protocolo", "Sessões", "Análise", "Revisão e decisão"]

export function GuiaConteudo() {
  const [busca, setBusca] = useState("")
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR")
    if (!termo) return topicos
    return topicos.filter((topico) => [topico.titulo, topico.resumo, topico.oQueE, topico.paraQueServe, topico.quando, topico.relevancia, topico.cuidado, ...topico.como, ...topico.termos].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(termo))
  }, [busca])

  return <>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-bold">Como as partes se conectam</h2>
      <p className="mt-1 text-sm text-muted-foreground">O planejamento vai do propósito amplo à medida concreta; os dados retornam para análise e revisão.</p>
      <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">{fluxo.map((item, index) => <li key={item} className="rounded-xl bg-muted p-3"><span className="mr-2 font-bold text-primary">{index + 1}.</span>{item}</li>)}</ol>
    </section>

    <section className="space-y-3">
      <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={busca} onChange={(event) => setBusca(event.target.value)} className="pl-9" placeholder="Buscar: critério, fase, protocolo, assentimento..." aria-label="Buscar no guia" /></div>
      <p className="text-xs text-muted-foreground">{filtrados.length} {filtrados.length === 1 ? "tópico encontrado" : "tópicos encontrados"}</p>
    </section>

    {filtrados.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhum tópico corresponde à busca.</div> : <Accordion type="multiple" className="space-y-3">{filtrados.map((topico) => <AccordionItem key={topico.id} value={topico.id} className="rounded-2xl border bg-card px-5">
      <AccordionTrigger className="hover:no-underline"><div className="pr-4 text-left"><p className="font-bold">{topico.titulo}</p><p className="mt-1 text-xs font-normal text-muted-foreground">{topico.resumo}</p></div></AccordionTrigger>
      <AccordionContent className="space-y-5 pb-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Info titulo="O que é" texto={topico.oQueE} />
          <Info titulo="Para que serve" texto={topico.paraQueServe} />
          <Info titulo="Quando preencher ou revisar" texto={topico.quando} />
          <Info titulo="Por que é relevante" texto={topico.relevancia} />
        </div>
        <div><h3 className="text-sm font-bold">Como preencher e utilizar</h3><ol className="mt-3 space-y-2">{topico.como.map((passo, index) => <li key={passo} className="flex gap-3 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><span>{passo}</span></li>)}</ol></div>
        {topico.cuidado && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Atenção:</strong> {topico.cuidado}</div>}
        <div className="flex flex-wrap gap-1.5">{topico.termos.map((termo) => <Badge key={termo} variant="secondary">{termo}</Badge>)}</div>
      </AccordionContent>
    </AccordionItem>)}</Accordion>}
  </>
}

function Info({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="rounded-xl bg-muted p-4"><h3 className="text-sm font-bold">{titulo}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{texto}</p></div>
}
