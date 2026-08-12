from pathlib import Path
import shutil
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "guia-sistema-registros-aba.pdf"
PUBLIC = ROOT / "public" / "guia-sistema-registros-aba.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
PUBLIC.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Guide", "C:/Windows/Fonts/arial.ttf"))
pdfmetrics.registerFont(TTFont("GuideBold", "C:/Windows/Fonts/arialbd.ttf"))

PRIMARY = colors.HexColor("#4F7F74")
INK = colors.HexColor("#26332F")
MUTED = colors.HexColor("#64726D")
PALE = colors.HexColor("#EEF5F2")
ATTENTION = colors.HexColor("#FFF7E6")
LINE = colors.HexColor("#D7E2DE")

base = getSampleStyleSheet()
title = ParagraphStyle("Title", parent=base["Title"], fontName="GuideBold", fontSize=24, leading=29, textColor=INK, alignment=TA_CENTER, spaceAfter=8)
subtitle = ParagraphStyle("Subtitle", parent=base["BodyText"], fontName="Guide", fontSize=10.5, leading=15, textColor=MUTED, alignment=TA_CENTER)
h1 = ParagraphStyle("H1", parent=base["Heading1"], fontName="GuideBold", fontSize=16, leading=20, textColor=PRIMARY, spaceBefore=8, spaceAfter=7)
h2 = ParagraphStyle("H2", parent=base["Heading2"], fontName="GuideBold", fontSize=10.5, leading=14, textColor=INK, spaceBefore=5, spaceAfter=3)
body = ParagraphStyle("Body", parent=base["BodyText"], fontName="Guide", fontSize=8.7, leading=12.6, textColor=INK, spaceAfter=4)
small = ParagraphStyle("Small", parent=body, fontSize=7.7, leading=10.5, textColor=MUTED)
bullet = ParagraphStyle("Bullet", parent=body, leftIndent=7*mm, firstLineIndent=-5*mm, spaceAfter=3)
toc = ParagraphStyle("Toc", parent=body, fontSize=9.2, leading=14, leftIndent=7*mm, firstLineIndent=-6*mm)

SECTIONS = [
("1. Das sessões iniciais ao planejamento",
 "O acompanhamento pode começar com vínculo, entrevista, avaliação ou observação sem alvos. A área Avaliação consolida essas evidências antes do planejamento.",
 "Registrar o trabalho clínico anterior ao planejamento, documentar potencialidades, necessidades e prioridades e manter requisitos progressivos para cada finalidade.",
 "Logo após vincular o paciente e sempre que um novo alvo for incluído.",
 ["Use vínculo, entrevista, avaliação, observação ou orientação antes do planejamento.", "Em Avaliação, vincule as sessões consideradas e registre fontes, potencialidades, necessidades e prioridades.", "Salve rascunhos e conclua uma versão quando houver base suficiente.", "Use a síntese concluída para justificar plano e objetivos.", "Para linha de base, o protocolo não é obrigatório.", "Configure critério e protocolo antes da intervenção e registre a integridade."],
 "Conecta cada medida à sua finalidade, fase e intervenção, permitindo análise e revisão confiáveis.",
 "Sessões iniciais não entram nos gráficos de alvos. Linha de base exige alvo e medição; intervenção também exige protocolo."),
("2. Pacientes, cadastro único e vínculos",
 "O paciente é um cadastro único. O vínculo define quais profissionais estão autorizados a trabalhar com ele; possuir login não concede acesso.",
 "Evitar duplicidade, preservar um histórico coerente e separar autenticação de autorização.",
 "Antes do primeiro planejamento. Se houver correspondência, solicite acesso; se for novo, conclua o cadastro.",
 ["Informe dados suficientes para a verificação.", "Confirme correspondências somente pelos dados mínimos mascarados.", "Acompanhe pedidos em Solicitações.", "Revise vínculos quando a composição da equipe mudar."],
 "Cadastros duplicados fragmentam histórico, decisões e compartilhamentos.",
 "A busca de duplicidade não deve ser usada como consulta livre de pessoas."),
("3. Plano clínico",
 "Estrutura que reúne objetivos e alvos relacionados a uma necessidade clínica. Seu status pode evoluir de rascunho até encerrado.",
 "Registrar a direção geral do trabalho, sua justificativa e o período de revisão.",
 "Depois de compreender a demanda e antes de cadastrar alvos isolados.",
 ["Use um título que identifique o foco.", "Descreva a justificativa clínica.", "Defina início e revisão.", "Atualize o status conforme o plano avança."],
 "Impede que alvos se tornem tarefas desconectadas de uma finalidade relevante.",
 "Não crie um plano novo apenas para organizar a tela; use outra estrutura quando houver finalidade clínica distinta."),
("4. Objetivos clínicos",
 "Resultados funcionais amplos, de curto ou longo prazo, que agrupam alvos relacionados.",
 "Conectar medidas específicas a mudanças significativas para a pessoa.",
 "Depois do plano e antes dos alvos. Revise quando a prioridade funcional mudar.",
 ["Escreva em linguagem funcional.", "Indique o horizonte de tempo.", "Evite descrever procedimentos como se fossem resultados.", "Ordene por prioridade."],
 "A equipe consegue compreender a direção do trabalho sem depender dos detalhes de cada medida.",
 None),
("5. Alvos clínicos",
 "Unidades observáveis e mensuráveis do acompanhamento. Podem ser de aquisição ou de redução.",
 "Transformar um objetivo amplo em algo que possa ser medido e revisado.",
 "Quando houver razão clínica clara, definição possível e condições reais de coleta.",
 ["Dê um nome reconhecível.", "Associe ao objetivo correto.", "Escolha natureza e fase.", "Complete definição, medição, critério e protocolo."],
 "Sessões, gráficos, critérios e revisões se conectam ao alvo.",
 "Evite rótulos vagos ou estados internos não observáveis."),
("6. Definição operacional",
 "Descrição objetiva do que conta e do que não conta como resposta, com condições, exemplos e não exemplos.",
 "Permitir que pessoas diferentes reconheçam a mesma ocorrência.",
 "Antes da primeira medição e sempre que a definição deixar de representar o alvo.",
 ["Descreva ações observáveis.", "Inclua início, fim e limites relevantes.", "Registre exemplos e não exemplos semelhantes.", "Crie nova versão quando mudar."],
 "Sustenta confiabilidade, treinamento e interpretação dos dados.",
 "Nunca reescreva o significado histórico de dados já coletados; versione a mudança."),
("7. Configuração de medição",
 "Regra que define tipo e unidade da medida: frequência, taxa, duração, latência, oportunidades, tentativas, intervalos, amostragem, independência ou intensidade.",
 "Adequar a coleta à dimensão do comportamento e permitir comparação.",
 "Antes da coleta; revise quando a medida deixar de responder à pergunta clínica.",
 ["Escolha a dimensão relevante.", "Informe unidade e parâmetros.", "Mantenha condições comparáveis.", "Crie nova versão se a regra mudar."],
 "Gráficos só são úteis quando os pontos representam medidas comparáveis.",
 "Não troque a medida apenas para melhorar a aparência do resultado."),
("8. Critério de domínio",
 "Regra quantitativa e contextual com direção, valor-alvo, sessões consecutivas, oportunidades, ambientes e aplicadores.",
 "Explicitar antecipadamente o que será considerado desempenho consistente.",
 "Antes de analisar domínio; versione quando a exigência mudar.",
 ["Defina aumentar ou reduzir.", "Escolha valor coerente com a medida.", "Defina sessões consecutivas.", "Inclua ambientes e aplicadores quando houver generalização.", "Defina manutenção quando necessário."],
 "Reduz decisões improvisadas e torna a regra auditável.",
 "Atingir o critério não muda a fase automaticamente nem equivale sozinho a encerramento."),
("9. Ciclo de vida e fases",
 "As fases comunicam a função atual do alvo: rascunho, linha de base, ensino, generalização, manutenção, pausado e encerrado.",
 "Contextualizar dados e deixar claro o que se pretende fazer com o alvo.",
 "Na criação e sempre que evidências e decisão clínica justificarem uma transição.",
 ["Rascunho: estrutura incompleta.", "Linha de base: observar antes ou sem a intervenção planejada.", "Ensino: aplicar o protocolo.", "Generalização: verificar novas pessoas, ambientes, estímulos ou respostas.", "Manutenção: verificar estabilidade no tempo.", "Pausado: interromper temporariamente.", "Encerrado: finalizar trabalho ativo preservando o histórico."],
 "A mesma medida tem significados diferentes em linha de base, ensino ou manutenção.",
 "Não avance apenas porque o último ponto melhorou."),
("10. Mudança de fase",
 "Transição registrada entre fases, acompanhada de justificativa.",
 "Relacionar mudanças no acompanhamento às evidências e decisões que as motivaram.",
 "Após revisar dados, integridade, contexto, prioridade e condições do paciente.",
 ["Revise o período relevante.", "Confira integridade e desvios.", "Considere contextos e validade social.", "Escolha a fase e justifique.", "Confirme se protocolo, medida e critério continuam adequados."],
 "Cria rastreabilidade e ajuda a interpretar mudanças posteriores na tendência.",
 "Melhora isolada, ausência de dados ou conveniência operacional não bastam como justificativa."),
("11. Intervenção e protocolos de ensino",
 "Descrição versionada da estratégia, hierarquia de ajuda, esvanecimento, reforçadores, esquema, correção de erro e instruções.",
 "Transformar a intenção clínica em procedimento aplicável, treinável e revisável.",
 "Antes das sessões de ensino e sempre que uma mudança material alterar a aplicação.",
 ["Escolha estratégia compatível.", "Descreva a hierarquia de ajuda.", "Planeje esvanecimento.", "Defina reforçadores e esquema.", "Explique a correção de erro.", "Inclua instruções suficientes."],
 "Permite relacionar resultados ao procedimento vigente em cada sessão.",
 "Documentação no sistema não valida competência, ética ou segurança do procedimento."),
("12. Apoio comportamental",
 "Plano para alvos de redução que reúne hipótese funcional, antecedentes, comportamento substitutivo, ensino, consequências, segurança e revisão.",
 "Organizar prevenção e ensino de alternativas, mantendo coerência entre pessoas e ambientes.",
 "Após reunir informações suficientes para uma hipótese prudente; revise diante de novos dados ou baixa efetividade.",
 ["Declare a função como hipótese.", "Registre evidências.", "Planeje estratégias antecedentes.", "Defina e ensine o substitutivo.", "Registre consequências e segurança.", "Defina critérios de revisão."],
 "Evita tratar redução sem compreender contexto ou ensinar alternativas relevantes.",
 "Registros ABC são descritivos e não confirmam função por si sós."),
("13. Sessões clínicas e integridade",
 "Registro contextualizado de data, ambiente, aplicador, alvos, medidas e integridade. Medidas por oportunidades podem detalhar resultado, nível de ajuda e latência de cada tentativa.",
 "Relacionar resultados às condições reais de aplicação.",
 "Em cada encontro com coleta válida, durante ou logo após a observação.",
 ["Escolha o paciente correto.", "Informe ambiente, aplicador e contexto.", "Inclua apenas alvos trabalhados.", "Em tentativas discretas ou oportunidades, detalhe resultado, ajuda e latência quando necessário.", "O resumo é calculado a partir das tentativas detalhadas.", "Marque componentes aplicados e explique desvios."],
 "Sessões completas aumentam a confiabilidade de gráficos, domínio e revisões.",
 "Somente o autor pode cancelar ou restaurar. O cancelamento retira a sessão dos gráficos e tokens, mas preserva histórico e auditoria."),
("14. Análise, domínio e revisão clínica",
 "Séries históricas na unidade original de cada alvo, com critérios, fases, protocolos, integridade, contexto e revisões.",
 "Apoiar decisões sobre manter, modificar, avançar, retornar, pausar ou encerrar.",
 "Em revisões programadas, ausência de progresso, mudança relevante, possível domínio ou variabilidade incomum.",
 ["Filtre alvo, período, fase, ambiente e aplicador.", "Leia ocorrências, taxa, segundos, percentual ou nível sem misturar unidades.", "Observe nível, tendência e variabilidade.", "Use o critério como referência, não como decisão automática.", "Confira fase, protocolo e integridade.", "Registre decisão e justificativa."],
 "A decisão documentada preserva continuidade e responsabilidade clínica.",
 "Indicadores apoiam, mas não substituem análise profissional nem demonstram causalidade sozinhos."),
("15. Participação, validade social e capacitação",
 "Validade social registra relevância, aceitabilidade, viabilidade, benefício e assentimento. Capacitação documenta instrução, modelação, ensaio, feedback e competência.",
 "Verificar se objetivos e procedimentos fazem sentido e se aplicadores conseguem implementá-los.",
 "No planejamento, em revisões, após mudanças e quando participação ou viabilidade puderem alterar decisões.",
 ["Identifique o respondente.", "Registre relato concreto e assentimento observado.", "Documente adaptações.", "Marque componentes realmente treinados.", "Separe competência de presença.", "Planeje acompanhamento."],
 "Resultados técnicos podem não ser relevantes, aceitáveis ou sustentáveis.",
 "Assentimento observado não substitui consentimento formal."),
("16. Equipe, privacidade e compartilhamento",
 "Conjunto de profissionais explicitamente vinculados, com autoria e limites de acesso. Compartilhamentos externos possuem escopo e validade.",
 "Permitir colaboração sem acesso irrestrito ao prontuário.",
 "Ao entrar ou sair alguém da equipe e sempre que houver finalidade legítima para acesso externo.",
 ["Confirme vínculos na área Equipe.", "Escolha o menor escopo e período necessários.", "Selecione alvos e se critérios, fases, integridade e contextos serão exibidos.", "Mantenha apenas tokens necessários.", "Revogue acessos sem finalidade ativa.", "Observações privadas e registros ABC não entram no portal."],
 "Autorização mínima reduz exposição e preserva responsabilidade por cada registro.",
 "Administração técnica não equivale a autorização clínica irrestrita.")
,
("17. Tentativas, ajuda e leitura contextual", "A coleta detalhada separa respostas corretas independentes, corretas com ajuda, incorretas e sem resposta, além de níveis de ajuda e latência.", "Verificar dependência de prompts, esvanecimento e consistência contextual.", "Em tentativas discretas ou oportunidades, quando houver critérios consistentes de observação.", ["Registre apenas tentativas observadas.", "Diferencie correta independente de correta com ajuda.", "Escolha o nível de ajuda utilizado.", "Informe latência com início e término definidos.", "Compare blocos recentes e cobertura."], "O agregado pode melhorar enquanto a dependência de ajuda continua alta.", "Poucas sessões, protocolos diferentes ou baixa integridade limitam a interpretação."),
("18. Prontidão, revisão e aplicação da decisão", "Fluxo auditável entre indicadores de prontidão, revisão com snapshot e aplicação explícita da mudança de fase.", "Separar análise, decisão e transição, preservando as evidências utilizadas.", "Em revisões programadas, possível domínio, ausência de progresso ou necessidade de modificar, pausar ou encerrar.", ["Escolha o período relevante.", "Leia prontidão e limitações.", "Registre decisão e justificativa.", "Confirme validade social, assentimento, integridade e generalização.", "Aplique depois a transição pendente.", "Reserve alteração manual para correção administrativa."], "Reduz mudanças acidentais e vincula a fase à revisão.", "Prontidão favorável não obriga mudança; cada revisão aplica apenas uma transição adjacente.")
]

def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.line(17*mm, height-14*mm, width-17*mm, height-14*mm)
    canvas.setFont("GuideBold", 8)
    canvas.setFillColor(PRIMARY)
    canvas.drawString(17*mm, height-10*mm, "REGISTROS ABA | MANUAL DE UTILIZAÇÃO")
    canvas.setFont("Guide", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width-17*mm, 10*mm, f"Página {doc.page}")
    canvas.restoreState()

def info_box(label, text, background=PALE):
    table = Table([[Paragraph(f"<b>{label}</b><br/>{text}", body)]], colWidths=[170*mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), background),
        ("BOX", (0,0), (-1,-1), 0.5, LINE),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))
    return table

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=22*mm, bottomMargin=18*mm, title="Manual de utilização - Sistema de Registros ABA", author="Sistema de Registros ABA")
story = [
    Spacer(1, 24*mm),
    Paragraph("Manual de utilização", title),
    Paragraph("Sistema de Registros ABA", title),
    Spacer(1, 4*mm),
    Paragraph("Referência operacional e conceitual para compreender o que preencher, quando preencher e por que cada etapa importa.", subtitle),
    Spacer(1, 15*mm),
    info_box("Como usar este manual", "Consulte o índice, localize o tema e leia os blocos de definição, finalidade, momento de uso, preenchimento e relevância. O PDF permite busca textual pelo visualizador."),
    Spacer(1, 8*mm),
    info_box("Limite do material", "Este guia orienta o uso do software. Não substitui formação, supervisão, avaliação individualizada, consentimento, requisitos profissionais ou julgamento clínico.", ATTENTION),
    PageBreak(),
    Paragraph("Índice", h1),
]
for i, section in enumerate(SECTIONS, 1):
    story.append(Paragraph(f"<b>{i}.</b> {section[0].split('. ',1)[1]}", toc))
story += [
    Spacer(1, 5*mm),
    Paragraph("Hierarquia do planejamento", h1),
    Paragraph("Paciente e vínculo → Sessões iniciais → Síntese da avaliação → Plano → Objetivos → Alvos → Definição e medição → Critério → Protocolo → Sessões → Análise → Revisão.", body),
    Paragraph("O planejamento parte de uma finalidade ampla e chega a medidas concretas. Os dados retornam para análise; a análise sustenta revisões, mudanças de fase e novas versões dos procedimentos.", body),
    PageBreak(),
]

for heading, what, purpose, when, how, relevance, attention in SECTIONS:
    section = [Paragraph(heading, h1), Paragraph("O que é", h2), Paragraph(what, body),
        Paragraph("Para que serve", h2), Paragraph(purpose, body),
        Paragraph("Quando preencher ou revisar", h2), Paragraph(when, body),
        Paragraph("Como preencher e utilizar", h2)]
    for item in how:
        section.append(Paragraph(f"• {item}", bullet))
    section.append(info_box("Por que é relevante", relevance))
    if attention:
        section.append(Spacer(1, 2*mm))
        section.append(info_box("Atenção", attention, ATTENTION))
    section.append(Spacer(1, 5*mm))
    story.append(KeepTogether(section))

story += [
    PageBreak(),
    Paragraph("Perguntas rápidas", h1),
    Paragraph("<b>O critério foi atingido. A fase muda sozinha?</b><br/>Não. O indicador apoia a análise, mas a transição exige decisão e justificativa.", body),
    Paragraph("<b>Posso alterar uma definição, medida ou protocolo antigo?</b><br/>Mudanças materiais devem gerar nova versão. Assim, cada sessão continua ligada ao que estava vigente.", body),
    Paragraph("<b>Quando usar observação ABC?</b><br/>Quando houver evento relevante em alvo de redução e for possível registrar antecedente, resposta e consequência de forma descritiva.", body),
    Paragraph("<b>Um treinamento significa competência?</b><br/>Não. O sistema separa os componentes da capacitação da competência efetivamente observada.", body),
    Paragraph("<b>O administrador pode ver tudo?</b><br/>A administração do ambiente não elimina limites de finalidade, autoria, privacidade e responsabilidade clínica.", body),
    Spacer(1, 6*mm),
    Paragraph("Versão do manual: agosto de 2026", small),
]

doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
shutil.copyfile(OUT, PUBLIC)
print(OUT)
