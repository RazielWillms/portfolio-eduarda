export const MATEUS_PSI = {
  name: "@omateuspsi",
  url: "https://www.instagram.com/omateuspsi",
};

export type Activity = {
  emoji: string;
  title: string;
  description: string;
  author?: {
    name: string;
    url: string;
  };
  href: string;
  color: string;
  badgeColor: string;
  tag: string;
};

export const activities = [
    {
    emoji: "🐵",
    title: "Zoo das Carinhas",
    description:
      "Jogo lúdico para reconhecer emoções como feliz, triste, bravo, assustado e surpreso, estimulando a percepção emocional, a atenção e a comunicação de sentimentos.",
    href: "/atividades/zoo-das-carinhas.html",
    color: "bg-[oklch(0.96_0.03_45)]",
    badgeColor:
      "bg-[oklch(0.90_0.05_45)] text-[oklch(0.38_0.12_35)]",
    tag: "Emoções",
  },
  {
    emoji: "🧺",
    title: "Caixa de Guardar",
    description:
      "Atividade interativa de arrastar e guardar objetos na caixa correta, desenvolvendo organização, categorização, atenção, coordenação motora e habilidades de seguir instruções.",
    href: "/atividades/caixa-de-guardar.html",
    color: "bg-[oklch(0.95_0.03_160)]",
    badgeColor:
      "bg-[oklch(0.89_0.05_160)] text-[oklch(0.34_0.11_160)]",
    tag: "Organização e Atenção",
  },
  {
    emoji: "🤖",
    title: "Robozinho Ajudante",
    description:
      "Jogo interativo de seguir comandos em sequência, estimulando atenção sustentada, memória de trabalho, planejamento, controle inibitório e outras funções executivas de forma divertida.",
    href: "/atividades/robozinho-ajudante.html",
    color: "bg-[oklch(0.95_0.03_250)]",
    badgeColor:
      "bg-[oklch(0.88_0.05_250)] text-[oklch(0.32_0.10_250)]",
    tag: "Funções Executivas",
  },
  {
    emoji: "🦊",
    title: "Trilha das Habilidades Sociais",
    description:
      "Jogo de tabuleiro interativo para praticar comunicação, empatia e resolução de conflitos de forma lúdica e divertida.",
    author: MATEUS_PSI,
    href: "/atividades/trilha-habilidades-sociais-v2.html",
    color: "bg-[oklch(0.93_0.06_35)]",
    badgeColor: "bg-[oklch(0.87_0.09_35)] text-[oklch(0.28_0.1_35)]",
    tag: "Habilidades Sociais",
  },
  {
    emoji: "💗",
    title: "Como o Reforcinho se Sente?",
    description:
      "Jogo de identificação de emoções: a criança escolhe o sentimento do personagem Reforcinho em diferentes situações do cotidiano.",
    author: MATEUS_PSI,
    href: "/atividades/como-o-reforcinho-se-sente.html",
    color: "bg-[oklch(0.94_0.04_10)]",
    badgeColor: "bg-[oklch(0.88_0.07_10)] text-[oklch(0.28_0.1_10)]",
    tag: "Emoções",
  },
  {
    emoji: "🎈",
    title: "Balão Enchendo",
    description:
      "Atividade de tolerância à espera: a criança segura o balão enquanto ele enche, treinando o controle do impulso de forma lúdica.",
    author: MATEUS_PSI,
    href: "/atividades/balao-enchendo.html",
    color: "bg-[oklch(0.93_0.05_220)]",
    badgeColor: "bg-[oklch(0.87_0.07_220)] text-[oklch(0.28_0.1_220)]",
    tag: "Regulação Emocional",
  },
  {
    emoji: "✨",
    title: "Jardim das Estrelas",
    description:
      "Atividade de tolerância à espera: a criança toca uma estrela e mantém o toque, com calma, até ela florescer, treinando o controle do impulso de forma lúdica e sensorial.",
    href: "/atividades/jardim-das-estrelas.html",
    color: "bg-[oklch(0.93_0.05_220)]",
    badgeColor: "bg-[oklch(0.87_0.07_220)] text-[oklch(0.28_0.1_220)]",
    tag: "Regulação Emocional",
  },
  {
    emoji: "🧱",
    title: "Torre Calma",
    description:
      "Atividade de equilíbrio e paciência: a criança empilha blocos com toques precisos, sentindo a torre ficar mais instável a cada peça. Se ela cair, tudo bem — uma pausa para respirar guia o recomeço, treinando tolerância à frustração e regulação após o erro.",
    href: "/atividades/torre-calma.html",
    color: "bg-[oklch(0.93_0.05_175)]",
    badgeColor: "bg-[oklch(0.87_0.07_175)] text-[oklch(0.28_0.1_175)]",
    tag: "Tolerância à Frustração",
  },
]