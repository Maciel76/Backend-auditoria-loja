/**
 * MODELO: MetricasUsuario
 * ENDPOINTS ASSOCIADOS:
 * - GET /metricas/usuarios - Obtém métricas de usuários com filtros opcionais
 * - GET /metricas/usuarios/:usuarioId - Obtém métricas de um usuário específico em uma loja
 * - POST /metricas/usuarios/calcular - Recalcula métricas de todos os usuários (período completo)
 * - GET /datas-auditoria - Obtém datas de auditoria disponíveis para uma loja
 */
// models/MetricasUsuario.js - VERSÃO ATUALIZADA
import mongoose from "mongoose";

// Mapeamento padrão de pontuação por raridade de conquista
const RARITY_POINTS = {
  Basica: 100,
  Comum: 250,
  Raro: 500,
  Epico: 1000,
  Lendario: 5000,
  Diamante: 10000,
  Especial: 20000,
};

// Níveis dinâmicos para conquistas de Classe/Local
// Cada nível tem um target (quantidade), raridade e ícone próprio
const DYNAMIC_ACHIEVEMENT_LEVELS = [
  { level: 1, target: 100,   rarity: "Basica",   label: "Iniciante",    icon: "🌱" },
  { level: 2, target: 500,   rarity: "Comum",    label: "Conhecedor",   icon: "📦" },
  { level: 3, target: 2000,  rarity: "Raro",     label: "Especialista", icon: "⚡" },
  { level: 4, target: 5000,  rarity: "Epico",    label: "Dominador",    icon: "🔥" },
  { level: 5, target: 10000, rarity: "Lendario",  label: "Lenda",        icon: "👑" },
  { level: 6, target: 25000, rarity: "Diamante",  label: "Supremo",      icon: "💎" },
];

// Ícones temáticos para categorias de classe de produto
const CLASS_ICONS = {
  "MERCEARIA SALGADA": "🧂",
  "MERCEARIA DOCE": "🍬",
  "LACTEO E PERECIVEL FRESCO": "🥛",
  "PERECIVEL INDUSTRIALIZADO": "🥫",
  "LIMPEZA": "🧹",
  "HIGIENE PESSOAL": "🧴",
  "BEBIDAS": "🥤",
  "FLV": "🥬",
  "BAZAR": "🛒",
  "BASICOS": "🍚",
  "ACOUGUE / CARNE EMBALADA": "🥩",
  "SERVICOS": "🔧",
};

// Ícone padrão para locais
const LOCAL_ICON = "📍";

/**
 * Retorna todas as regras de conquistas estáticas (não dinâmicas).
 * Usado tanto na inicialização de documentos novos quanto na injeção
 * de conquistas novas em documentos existentes.
 */
function getStaticAchievementRules() {
  const achievementRules = {
    "first-audit": {
      title: "Primeiro Passo",
      description: "Você completou sua primeira auditoria! Toda grande jornada começa com um único passo.",
      icon: "🔍",
      category: "audits",
      difficulty: "easy",
      rarity: "Basica",
      points: 10,
      criteria: { type: "count", target: 1, description: "Realizar 1 auditoria atualizada" },
    },
    "audit-enthusiast": {
      title: "Olho de Águia",
      description: "Completou 5 auditorias com sucesso! Seus olhos já estão afiados para encontrar qualquer detalhe.",
      icon: "📊",
      category: "audits",
      difficulty: "medium",
      rarity: "Raro",
      points: 150,
      criteria: { type: "count", target: 5, description: "Realizar 5 auditorias atualizadas" },
    },
    "audit-master": {
      title: "Guardião da Qualidade",
      description: "10 auditorias completas! Você é referência em qualidade e precisão no controle de estoque.",
      icon: "🏆",
      category: "audits",
      difficulty: "hard",
      rarity: "Epico",
      points: 1500,
      criteria: { type: "count", target: 10, description: "Realizar 10 auditorias atualizadas" },
    },
    "consistent-auditor": {
      title: "Máquina de Precisão",
      description: "20 auditorias realizadas! Sua consistência é admirável. Nada escapa do seu radar.",
      icon: "📅",
      category: "consistency",
      difficulty: "hard",
      rarity: "Lendario",
      points: 5000,
      criteria: { type: "count", target: 20, description: "Realizar 20 auditorias atualizadas" },
    },
    "weekly-warrior": {
      title: "Imperador das Auditorias",
      description: "50 auditorias! Você domina completamente a arte de auditar. Uma lenda viva do estoque!",
      icon: "👑",
      category: "performance",
      difficulty: "very-hard",
      rarity: "Diamante",
      points: 25000,
      criteria: { type: "count", target: 50, description: "Realizar 50 auditorias atualizadas" },
    },
    "item-collector-100": {
      title: "Primeiras Moedas",
      description: "Acumulou 100 pontos totais! Você está construindo sua reputação como auditor.",
      icon: "💯",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 50,
      criteria: { type: "count", target: 100, description: "Alcançar 100 pontos totais" },
    },
    "item-collector-500": {
      title: "Cofre em Crescimento",
      description: "2.000 pontos! Sua coleção de conquistas cresce a cada dia. Continue acumulando!",
      icon: "🎯",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 100,
      criteria: { type: "count", target: 2000, description: "Alcançar 2.000 pontos totais" },
    },
    "item-collector-1000": {
      title: "Tesouro Valioso",
      description: "5.000 pontos acumulados! Você é um verdadeiro caçador de tesouros do estoque.",
      icon: "🏅",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 250,
      criteria: { type: "count", target: 5000, description: "Alcançar 5.000 pontos totais" },
    },
    "item-collector-2000": {
      title: "Fortuna do Auditor",
      description: "15.000 pontos! Seu desempenho é extraordinário. Poucos chegam tão longe.",
      icon: "🏆",
      category: "performance",
      difficulty: "hard",
      rarity: "Epico",
      points: 500,
      criteria: { type: "count", target: 15000, description: "Alcançar 15.000 pontos totais" },
    },
    "item-collector-5000": {
      title: "Barão do Estoque",
      description: "30.000 pontos! Você é uma força imparável. O estoque treme quando você chega!",
      icon: "👑",
      category: "performance",
      difficulty: "very-hard",
      rarity: "Lendario",
      points: 1000,
      criteria: { type: "count", target: 30000, description: "Alcançar 30.000 pontos totais" },
    },
    "item-collector-10000": {
      title: "Magnata Supremo",
      description: "50.000 pontos! Você alcançou o topo do topo. Lendas são escritas sobre você.",
      icon: "💎",
      category: "performance",
      difficulty: "extreme",
      rarity: "Diamante",
      points: 2000,
      criteria: { type: "count", target: 50000, description: "Alcançar 50.000 pontos totais" },
    },
    "detetive-1": {
      title: "Investigador Novato",
      description: "Verificou 100 itens de ruptura. Você começou a desvendar os mistérios das prateleiras vazias!",
      icon: "🕵️",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 50,
      criteria: { type: "count", target: 100, description: "Verificar 100 itens de ruptura" },
    },
    "detetive-2": {
      title: "Detetive de Rupturas",
      description: "1.000 rupturas investigadas! Nenhuma prateleira vazia escapa da sua investigação.",
      icon: "🔎",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 500,
      criteria: { type: "count", target: 1000, description: "Verificar 1.000 itens de ruptura" },
    },
    "detetive-3": {
      title: "Caçador de Rupturas",
      description: "5.000 rupturas! Seu faro para encontrar falhas no estoque é incomparável.",
      icon: "🕵️‍♂️",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 1000,
      criteria: { type: "count", target: 5000, description: "Verificar 5.000 itens de ruptura" },
    },
    "detetive-4": {
      title: "Xerife do Estoque",
      description: "10.000 rupturas investigadas! A lei do estoque é mantida por suas mãos.",
      icon: "🔦",
      category: "performance",
      difficulty: "hard",
      rarity: "Epico",
      points: 2000,
      criteria: { type: "count", target: 10000, description: "Verificar 10.000 itens de ruptura" },
    },
    "detetive-5": {
      title: "Sentinela das Prateleiras",
      description: "15.000 rupturas! Você vigia cada centímetro da loja. Nada passa despercebido!",
      icon: "🕵️‍♀️",
      category: "performance",
      difficulty: "very-hard",
      rarity: "Lendario",
      points: 3000,
      criteria: { type: "count", target: 15000, description: "Verificar 15.000 itens de ruptura" },
    },
    "detetive-6": {
      title: "Oráculo das Rupturas",
      description: "30.000 rupturas! Você prevê rupturas antes mesmo delas acontecerem. Lendário!",
      icon: "👑",
      category: "performance",
      difficulty: "extreme",
      rarity: "Diamante",
      points: 6000,
      criteria: { type: "count", target: 30000, description: "Verificar 30.000 itens de ruptura" },
    },
    "auditor-etiqueta-1": {
      title: "Leitor de Etiquetas",
      description: "Leu 500 etiquetas! Você está aprendendo a linguagem secreta dos preços.",
      icon: "🏷️",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 75,
      criteria: { type: "count", target: 500, description: "Ler 500 etiquetas" },
    },
    "auditor-etiqueta-2": {
      title: "Mestre dos Preços",
      description: "2.000 etiquetas lidas! Os números não têm segredos para você.",
      icon: "🔖",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 2000, description: "Ler 2.000 etiquetas" },
    },
    "auditor-etiqueta-3": {
      title: "Scanner Humano",
      description: "5.000 etiquetas! Você lê preços mais rápido que um leitor de código de barras.",
      icon: "📋",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 750,
      criteria: { type: "count", target: 5000, description: "Ler 5.000 etiquetas" },
    },
    "auditor-etiqueta-4": {
      title: "Arquiteto dos Preços",
      description: "10.000 etiquetas verificadas! Cada preço é uma obra de arte sob sua supervisão.",
      icon: "🎯",
      category: "performance",
      difficulty: "hard",
      rarity: "Epico",
      points: 1500,
      criteria: { type: "count", target: 10000, description: "Ler 10.000 etiquetas" },
    },
    "auditor-etiqueta-5": {
      title: "Titã das Etiquetas",
      description: "20.000 etiquetas! As prateleiras se curvam diante da sua dedicação. Impressionante!",
      icon: "🏆",
      category: "performance",
      difficulty: "very-hard",
      rarity: "Lendario",
      points: 3000,
      criteria: { type: "count", target: 20000, description: "Ler 20.000 etiquetas" },
    },
    "auditor-etiqueta-6": {
      title: "Divindade das Etiquetas",
      description: "40.000 etiquetas! Você transcendeu os limites humanos. Uma força da natureza!",
      icon: "👑",
      category: "performance",
      difficulty: "extreme",
      rarity: "Diamante",
      points: 6000,
      criteria: { type: "count", target: 40000, description: "Ler 40.000 etiquetas" },
    },
    "auditor-presenca-1": {
      title: "Vigia Atento",
      description: "Verificou 300 presenças! Seus olhos capturam cada detalhe nas prateleiras.",
      icon: "👁️",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 75,
      criteria: { type: "count", target: 300, description: "Verificar 300 presenças" },
    },
    "auditor-presenca-2": {
      title: "Fiscal de Gôndolas",
      description: "1.500 presenças conferidas! As gôndolas estão sempre perfeitas sob sua gestão.",
      icon: "👀",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 1500, description: "Verificar 1.500 presenças" },
    },
    "auditor-presenca-3": {
      title: "Guardião da Exposição",
      description: "4.000 presenças! Cada produto está no lugar certo graças a você.",
      icon: "🔍",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 750,
      criteria: { type: "count", target: 4000, description: "Verificar 4.000 presenças" },
    },
    "auditor-presenca-4": {
      title: "Senhor das Prateleiras",
      description: "8.000 presenças verificadas! As prateleiras são seu reino e você as governa com maestria.",
      icon: "✅",
      category: "performance",
      difficulty: "hard",
      rarity: "Epico",
      points: 1500,
      criteria: { type: "count", target: 8000, description: "Verificar 8.000 presenças" },
    },
    "auditor-presenca-5": {
      title: "Olho que Tudo Vê",
      description: "16.000 presenças! Nenhum produto fora do lugar escapa da sua visão absoluta.",
      icon: "🌟",
      category: "performance",
      difficulty: "very-hard",
      rarity: "Lendario",
      points: 3000,
      criteria: { type: "count", target: 16000, description: "Verificar 16.000 presenças" },
    },
    "auditor-presenca-6": {
      title: "Entidade Onipresente",
      description: "32.000 presenças! Você está em todos os lugares ao mesmo tempo. Sobrenatural!",
      icon: "👑",
      category: "performance",
      difficulty: "extreme",
      rarity: "Diamante",
      points: 6000,
      criteria: { type: "count", target: 32000, description: "Verificar 32.000 presenças" },
    },
    // ===== CONQUISTAS DE RANKING =====
    "ranking-first-1": {
      title: "Primeira Coroa",
      description: "Você conquistou o 1º lugar no ranking! O topo da montanha é seu, mesmo que por um instante glorioso.",
      icon: "🏅",
      category: "ranking",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 1, description: "Ficar em 1º lugar no ranking 1 vez" },
    },
    "ranking-first-5": {
      title: "Rei do Ranking",
      description: "5 vezes no topo! Você não visita o 1º lugar, você mora lá. Uma verdadeira dinastia!",
      icon: "👑",
      category: "ranking",
      difficulty: "very-hard",
      rarity: "Epico",
      points: 1000,
      criteria: { type: "count", target: 5, description: "Ficar em 1º lugar no ranking 5 vezes" },
    },
    "ranking-top3-5": {
      title: "Pódio Frequente",
      description: "5 vezes no Top 3! Seu lugar no pódio já tem placa com seu nome.",
      icon: "🥇",
      category: "ranking",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 5, description: "Ficar no Top 3 do ranking 5 vezes" },
    },
    "ranking-top3-20": {
      title: "Medalhista Nato",
      description: "20 vezes no Top 3! Você coleciona medalhas como se fossem figurinhas. Impressionante!",
      icon: "🏆",
      category: "ranking",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 20, description: "Ficar no Top 3 do ranking 20 vezes" },
    },
    "ranking-top10-10": {
      title: "Elite Constante",
      description: "10 vezes no Top 10! Consistência é sua marca registrada. Sempre entre os melhores!",
      icon: "⭐",
      category: "ranking",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 10, description: "Ficar no Top 10 do ranking 10 vezes" },
    },
    "ranking-top10-50": {
      title: "Inabalável",
      description: "50 vezes no Top 10! Você é uma fortaleza inabalável. Ninguém te derruba da elite!",
      icon: "💫",
      category: "ranking",
      difficulty: "very-hard",
      rarity: "Epico",
      points: 1000,
      criteria: { type: "count", target: 50, description: "Ficar no Top 10 do ranking 50 vezes" },
    },
    // ===== CONQUISTAS DE CUSTO RUPTURA =====
    "custo-ruptura-1k": {
      title: "Caçador de Prejuízos",
      description: "Identificou R$1.000 em custos de ruptura! Cada real conta e você está de olho.",
      icon: "💰",
      category: "financial",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 1000, description: "Identificar R$1.000 em custos de ruptura" },
    },
    "custo-ruptura-10k": {
      title: "Protetor do Lucro",
      description: "R$10.000 em rupturas mapeadas! Você protege o lucro da empresa como um guardião.",
      icon: "💵",
      category: "financial",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 10000, description: "Identificar R$10.000 em custos de ruptura" },
    },
    "custo-ruptura-50k": {
      title: "Salvador Financeiro",
      description: "R$50.000 identificados! Suas auditorias salvam fortunas. O financeiro te agradece!",
      icon: "🏦",
      category: "financial",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 50000, description: "Identificar R$50.000 em custos de ruptura" },
    },
    "custo-ruptura-200k": {
      title: "Guardião do Caixa",
      description: "R$200.000 em rupturas rastreadas! Você é o anjo guardião das finanças da loja.",
      icon: "💎",
      category: "financial",
      difficulty: "very-hard",
      rarity: "Epico",
      points: 1000,
      criteria: { type: "count", target: 200000, description: "Identificar R$200.000 em custos de ruptura" },
    },
    // ===== CONQUISTAS DE PRESENÇA CONFIRMADA =====
    "confirmador-1": {
      title: "Confirmador Atento",
      description: "100 presenças confirmadas! Você garante que os produtos estão onde deveriam estar.",
      icon: "✅",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 100, description: "Confirmar 100 presenças de produtos" },
    },
    "confirmador-2": {
      title: "Validador Experiente",
      description: "500 confirmações! Sua validação é sinônimo de confiança. Nada escapa!",
      icon: "🔍",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 500, description: "Confirmar 500 presenças de produtos" },
    },
    "confirmador-3": {
      title: "Selo de Aprovação",
      description: "2.000 presenças confirmadas! Seu selo de aprovação é o mais respeitado da loja.",
      icon: "🏅",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 2000, description: "Confirmar 2.000 presenças de produtos" },
    },
    // ===== CONQUISTAS DE ITENS DESATUALIZADOS =====
    "desatualizado-1": {
      title: "Caçador de Defasagem",
      description: "Encontrou 100 itens desatualizados! Você é essencial para manter os preços corretos.",
      icon: "📉",
      category: "quality",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 100, description: "Encontrar 100 itens desatualizados" },
    },
    "desatualizado-2": {
      title: "Detetive dos Preços",
      description: "500 preços defasados encontrados! Nenhum erro escapa do seu faro investigativo.",
      icon: "🔎",
      category: "quality",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 500, description: "Encontrar 500 itens desatualizados" },
    },
    "desatualizado-3": {
      title: "Fiscal Implacável",
      description: "2.000 desatualizações! Você é o pesadelo dos preços errados. Implacável!",
      icon: "🎯",
      category: "quality",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 2000, description: "Encontrar 2.000 itens desatualizados" },
    },
    // ===== CONQUISTAS DE ITENS SEM ESTOQUE =====
    "sem-estoque-1": {
      title: "Alerta de Estoque",
      description: "50 itens sem estoque identificados! Você é o primeiro alarme contra a falta de produtos.",
      icon: "⚠️",
      category: "quality",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 50, description: "Identificar 50 itens sem estoque" },
    },
    "sem-estoque-2": {
      title: "Radar de Escassez",
      description: "200 faltas detectadas! Seu radar de escassez funciona 24 horas por dia.",
      icon: "📡",
      category: "quality",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 200, description: "Identificar 200 itens sem estoque" },
    },
    "sem-estoque-3": {
      title: "Previsor de Faltas",
      description: "1.000 itens sem estoque encontrados! Você prevê faltas antes que o cliente perceba.",
      icon: "🔮",
      category: "quality",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 1000, description: "Identificar 1.000 itens sem estoque" },
    },
    // ===== CONQUISTAS DE ESPECIALIZAÇÃO POR TIPO =====
    "especialista-etiqueta": {
      title: "Etiquetador Focado",
      description: "5 auditorias de etiqueta concluídas! Você está se especializando na arte das etiquetas.",
      icon: "🏷️",
      category: "specialization",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 5, description: "Realizar 5 auditorias de etiqueta" },
    },
    "guru-etiqueta": {
      title: "Guru das Etiquetas",
      description: "20 auditorias de etiqueta! Você é o guru absoluto quando o assunto é precificação.",
      icon: "📋",
      category: "specialization",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 20, description: "Realizar 20 auditorias de etiqueta" },
    },
    "especialista-ruptura": {
      title: "Investigador Focado",
      description: "5 auditorias de ruptura! Você está se tornando especialista em caçar rupturas.",
      icon: "🕵️",
      category: "specialization",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 5, description: "Realizar 5 auditorias de ruptura" },
    },
    "guru-ruptura": {
      title: "Mestre da Ruptura",
      description: "20 auditorias de ruptura! As prateleiras vazias tremem quando ouvem seu nome.",
      icon: "🔦",
      category: "specialization",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 20, description: "Realizar 20 auditorias de ruptura" },
    },
    "especialista-presenca": {
      title: "Fiscal Dedicado",
      description: "5 auditorias de presença! Seu olhar atento garante que nada está fora do lugar.",
      icon: "👁️",
      category: "specialization",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 5, description: "Realizar 5 auditorias de presença" },
    },
    "guru-presenca": {
      title: "Guru da Presença",
      description: "20 auditorias de presença! Você enxerga cada produto como um maestro enxerga as notas.",
      icon: "🌟",
      category: "specialization",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 20, description: "Realizar 20 auditorias de presença" },
    },
    // ===== CONQUISTAS DE VERSATILIDADE =====
    "versatil-1": {
      title: "Auditor Polivalente",
      description: "Realizou ao menos 1 auditoria de cada tipo! Etiqueta, ruptura e presença - você faz tudo!",
      icon: "🎭",
      category: "versatility",
      difficulty: "medium",
      rarity: "Raro",
      points: 500,
      criteria: { type: "custom", target: 1, description: "Realizar ao menos 1 auditoria de cada tipo (etiqueta, ruptura, presença)" },
    },
    "versatil-2": {
      title: "Mestre de Todas as Artes",
      description: "10 auditorias de cada tipo! Você domina todas as vertentes da auditoria. Um verdadeiro polímata!",
      icon: "🌈",
      category: "versatility",
      difficulty: "hard",
      rarity: "Epico",
      points: 1000,
      criteria: { type: "custom", target: 10, description: "Realizar ao menos 10 auditorias de cada tipo" },
    },
    // ===== CONQUISTAS DE LEITURA TOTAL =====
    "leitor-total-1k": {
      title: "Devorador de Dados",
      description: "1.000 itens lidos no total! Você está devorando dados como um verdadeiro analista.",
      icon: "📖",
      category: "performance",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 1000, description: "Ler 1.000 itens no total" },
    },
    "leitor-total-10k": {
      title: "Máquina de Leitura",
      description: "10.000 itens lidos! Seus olhos processam informação mais rápido que um computador.",
      icon: "📚",
      category: "performance",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 10000, description: "Ler 10.000 itens no total" },
    },
    "leitor-total-50k": {
      title: "Biblioteca Viva",
      description: "50.000 itens lidos! Você é uma enciclopédia ambulante do estoque. Incrível!",
      icon: "🏛️",
      category: "performance",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 50000, description: "Ler 50.000 itens no total" },
    },
    // ===== CONQUISTAS DE PARTICIPAÇÃO COMUNITÁRIA (cross-model) =====
    "sugestao-1": {
      title: "Voz Ativa",
      description: "Enviou sua primeira sugestão! Sua opinião importa e ajuda a melhorar o sistema.",
      icon: "💡",
      category: "community",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 1, description: "Enviar 1 sugestão" },
    },
    "sugestao-5": {
      title: "Fonte de Ideias",
      description: "5 sugestões enviadas! Você é uma máquina de ideias. Continue inovando!",
      icon: "🧠",
      category: "community",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 5, description: "Enviar 5 sugestões" },
    },
    "sugestao-15": {
      title: "Visionário",
      description: "15 sugestões! Você enxerga além do óbvio. O futuro do sistema tem sua digital.",
      icon: "🔭",
      category: "community",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 15, description: "Enviar 15 sugestões" },
    },
    "artigo-1": {
      title: "Primeiro Artigo",
      description: "Publicou seu primeiro artigo! Compartilhar conhecimento é a maior riqueza.",
      icon: "✍️",
      category: "community",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 1, description: "Publicar 1 artigo" },
    },
    "artigo-5": {
      title: "Blogueiro Nato",
      description: "5 artigos publicados! Você é um comunicador excepcional. A comunidade aprende com você!",
      icon: "📰",
      category: "community",
      difficulty: "hard",
      rarity: "Raro",
      points: 500,
      criteria: { type: "count", target: 5, description: "Publicar 5 artigos" },
    },
    "comentarista-1": {
      title: "Opinião que Conta",
      description: "5 comentários feitos! Você participa ativamente das discussões. Continue engajado!",
      icon: "💬",
      category: "community",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 5, description: "Fazer 5 comentários" },
    },
    "comentarista-2": {
      title: "Debatedor Ativo",
      description: "20 comentários! Suas opiniões enriquecem as discussões. Um verdadeiro influenciador!",
      icon: "🗣️",
      category: "community",
      difficulty: "medium",
      rarity: "Comum",
      points: 250,
      criteria: { type: "count", target: 20, description: "Fazer 20 comentários" },
    },
    "votante-1": {
      title: "Cidadão Participativo",
      description: "5 votos dados! Sua participação nas votações ajuda a definir o futuro da plataforma.",
      icon: "🗳️",
      category: "community",
      difficulty: "easy",
      rarity: "Basica",
      points: 100,
      criteria: { type: "count", target: 5, description: "Dar 5 votos em votações" },
    },
  };

  // Padronizar pontuação por raridade
  Object.values(achievementRules).forEach((rule) => {
    if (RARITY_POINTS[rule.rarity]) {
      rule.points = RARITY_POINTS[rule.rarity];
    }
  });

  return achievementRules;
}

/**
 * Gera conquistas dinâmicas para uma classe de produto ou local.
 * Retorna um array com 6 conquistas (uma por nível).
 * @param {string} type - "classe" ou "local"
 * @param {string} name - Nome da classe/local (ex: "MERCEARIA SALGADA", "G08A - G08A")
 */
function gerarConquistasDinamicas(type, name) {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const prefix = type === "classe" ? "classe" : "local";
  const baseIcon = type === "classe" ? (CLASS_ICONS[name] || "📊") : LOCAL_ICON;
  const categoryLabel = type === "classe" ? "Classe" : "Local";
  const shortName = name.length > 20 ? name.substring(0, 20) + "..." : name;

  return DYNAMIC_ACHIEVEMENT_LEVELS.map((lvl) => {
    const achievementId = `${prefix}-${safeName}-lvl${lvl.level}`;
    return {
      achievementId,
      unlocked: false,
      progress: { current: 0, target: lvl.target, percentage: 0 },
      unlockedAt: null,
      unlockedBy: null,
      achievementData: {
        title: `${lvl.label} em ${shortName}`,
        description: `Audite ${lvl.target.toLocaleString("pt-BR")} itens na ${categoryLabel.toLowerCase()} "${name}" para se tornar ${lvl.label}!`,
        icon: lvl.level <= 2 ? baseIcon : lvl.icon,
        category: type === "classe" ? "dynamic-class" : "dynamic-local",
        difficulty: ["easy", "medium", "hard", "hard", "very-hard", "extreme"][lvl.level - 1],
        rarity: lvl.rarity,
        points: RARITY_POINTS[lvl.rarity],
        isDynamic: true,
        dynamicType: type,
        dynamicKey: name,
        dynamicLevel: lvl.level,
        criteria: {
          type: "count",
          target: lvl.target,
          description: `Auditar ${lvl.target.toLocaleString("pt-BR")} itens na ${categoryLabel.toLowerCase()} "${name}"`,
        },
      },
      rarity: lvl.rarity,
      fixedXpValue: RARITY_POINTS[lvl.rarity],
    };
  });
}

const metricasUsuarioSchema = new mongoose.Schema(
  {
    // Referências obrigatórias
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    usuarioNome: {
      type: String,
      required: true,
    },
    lojaNome: {
      type: String,
      required: true,
      index: true,
    },

    // Período das métricas - AGORA APENAS PERÍODO COMPLETO
    periodo: {
      type: String,
      required: true,
      enum: ["periodo_completo"],
      default: "periodo_completo",
      index: true,
    },
    dataInicio: {
      type: Date,
      required: true,
      index: true,
    },
    dataFim: {
      type: Date,
      required: true,
      index: true,
    },

    // Métricas por tipo de auditoria
    etiquetas: {
      totalItens: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensDesatualizado: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensSemEstoque: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensNaopertence: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    rupturas: {
      totalItens: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      custoTotalRuptura: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      custoMedioRuptura: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    presencas: {
      totalItens: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensSemEstoque: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensNaopertence: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      presencasConfirmadas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    // NOVOS CAMPOS ADICIONADOS
    ContadorClassesProduto: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["A CLASSIFICAR", 0],
          ["ALTO GIRO", 0],
          ["BAZAR", 0],
          ["DIVERSOS", 0],
          ["DPH", 0],
          ["FLV", 0],
          ["LATICINIOS 1", 0],
          ["LIQUIDA", 0],
          ["PERECIVEL 1", 0],
          ["PERECIVEL 2", 0],
          ["PERECIVEL 2 B", 0],
          ["PERECIVEL 3", 0],
          ["SECA DOCE", 0],
          ["SECA SALGADA", 0],
          ["SECA SALGADA 2", 0],
        ]),
    },

    ContadorLocais: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["C01 - C01", 0],
          ["CS01 - CS01", 0],
          ["F01 - F01", 0],
          ["F02 - F02", 0],
          ["FLV - FLV", 0],
          ["G01A - G01A", 0],
          ["G01B - G01B", 0],
          ["G02A - G02A", 0],
          ["G02B - G02B", 0],
          ["G03A - G03A", 0],
          ["G03B - G03B", 0],
          ["G04A - G04A", 0],
          ["G04B - G04B", 0],
          ["G05A - G05A", 0],
          ["G05B - G05B", 0],
          ["G06A - G06A", 0],
          ["G06B - G06B", 0],
          ["G07A - G07A", 0],
          ["G07B - G07B", 0],
          ["G08A - G08A", 0],
          ["G08B - G08B", 0],
          ["G09A - G09A", 0],
          ["G09B - G09B", 0],
          ["G10A - G10A", 0],
          ["G10B - G10B", 0],
          ["G11A - G11A", 0],
          ["G11B - G11B", 0],
          ["G12A - G12A", 0],
          ["G12B - G12B", 0],
          ["G13A - G13A", 0],
          ["G13B - G13B", 0],
          ["G14A - G14A", 0],
          ["G14B - G14B", 0],
          ["G15A - G15A", 0],
          ["G15B - G15B", 0],
          ["G16A - G16A", 0],
          ["G16B - G16B", 0],
          ["G17A - G17A", 0],
          ["G17B - G17B", 0],
          ["G18A - G18A", 0],
          ["G18B - G18B", 0],
          ["G19A - G19A", 0],
          ["G19B - G19B", 0],
          ["G20A - G20A", 0],
          ["G20B - G20B", 0],
          ["G21A - G21A", 0],
          ["G21B - G21B", 0],
          ["G22A - G22A", 0],
          ["G22B - G22B", 0],
          ["GELO - GELO", 0],
          ["I01 - I01", 0],
          ["PA01 - PA01", 0],
          ["PAO - PAO", 0],
          ["PF01 - PF01", 0],
          ["PF02 - PF02", 0],
          ["PF03 - PF03", 0],
          ["PL01 - PL01", 0],
          ["PL02 - PL02", 0],
          ["SORVETE - SORVETE", 0],
        ]),
    },

    // Métricas consolidadas
    totais: {
      totalItens: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      percentualConclusaoGeral: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      pontuacaoTotal: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    // Contadores de auditorias por tipo
    contadoresAuditorias: {
      totalEtiquetas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      totalRupturas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      totalPresencas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      totalGeral: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    // Totais acumulados de itens lidos
    totaisAcumulados: {
      itensLidosEtiquetas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidosRupturas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidosPresencas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      itensLidosTotal: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    // Dados de participação comunitária (cross-model)
    participacao: {
      sugestoesEnviadas: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      artigosPublicados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      comentariosFeitos: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      votosRealizados: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
    },

    // Histórico de posições no ranking
    historicoRanking: {
      posicao1: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao2: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao3: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao4: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao5: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao6: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao7: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao8: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao9: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      posicao10: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      ACIMA10: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }, // NOVO CAMPO
      },
      totalTop10: {
        type: Number,
        default: 0,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        },
      },
      melhorPosicao: {
        type: Number,
        default: null,
        set: function (value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? null : numValue;
        },
      },
    },

    // Dados de conquistas e gamificação
    achievements: {
      xp: {
        total: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
        fromAchievements: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
        fromActivities: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
      },
      level: {
        current: {
          type: Number,
          default: 1,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 1 : numValue;
          },
        },
        title: { type: String, default: "Novato" },
        xpForNextLevel: {
          type: Number,
          default: 100,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 100 : numValue;
          },
        },
        progressPercentage: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
      },
      stats: {
        totalUnlockedAchievements: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
        totalAudits: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
        totalItems: {
          type: Number,
          default: 0,
          set: function (value) {
            const numValue = Number(value);
            return value == null || isNaN(numValue) ? 0 : numValue;
          },
        },
        lastActivityAt: { type: Date },
      },
      achievements: {
        type: [
          {
            achievementId: { type: String, required: true },
            unlocked: { type: Boolean, default: false },
            progress: {
              current: {
                type: Number,
                default: 0,
                set: function (value) {
                  const numValue = Number(value);
                  return value == null || isNaN(numValue) ? 0 : numValue;
                },
              },
              target: {
                type: Number,
                required: true,
                set: function (value) {
                  const numValue = Number(value);
                  return value == null || isNaN(numValue) ? 0 : numValue;
                },
              },
              percentage: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
                set: function (value) {
                  const numValue = Number(value);
                  return value == null || isNaN(numValue) ? 0 : numValue;
                },
              },
            },
            unlockedAt: { type: Date },
            unlockedBy: { type: String }, // ID da ação que desbloqueou
            achievementData: { type: mongoose.Schema.Types.Mixed, default: {} },
            rarity: {
              type: String,
              enum: [
                "Basica",
                "Comum",
                "Raro",
                "Epico",
                "Lendario",
                "Diamante",
                "Especial",
              ],
              default: "Comum",
            },
            fixedXpValue: {
              type: Number,
              default: 0,
            },
          },
        ],
        default: function () {
          // Usa a função centralizada para obter todas as regras de conquistas
          const achievementRules = getStaticAchievementRules();

          return Object.keys(achievementRules).map((achievementId) => ({
            achievementId: achievementId,
            unlocked: false,
            progress: {
              current: 0,
              target: achievementRules[achievementId].criteria.target,
              percentage: 0,
            },
            unlockedAt: null,
            unlockedBy: null,
            achievementData: achievementRules[achievementId],
            rarity: achievementRules[achievementId].rarity || "Comum",
            fixedXpValue: RARITY_POINTS[achievementRules[achievementId].rarity] || achievementRules[achievementId].points || 0,
          }));
        },
      },
    },

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "3.0", // Atualizei a versão para refletir a adição das conquistas
    },
  },
  {
    timestamps: true,
  },
);

// Índices compostos - ATUALIZADOS PARA PERÍODO COMPLETO
metricasUsuarioSchema.index({ loja: 1, dataInicio: -1 });
metricasUsuarioSchema.index({ loja: 1, usuarioId: 1 });
metricasUsuarioSchema.index({
  dataInicio: -1,
  "totaisAcumulados.itensLidosTotal": -1,
});
metricasUsuarioSchema.index({
  loja: 1,
  "totaisAcumulados.itensLidosTotal": -1,
});

// Índice único para evitar duplicatas - REMOVER PERÍODO
metricasUsuarioSchema.index(
  { loja: 1, usuarioId: 1, dataInicio: 1 },
  { unique: true },
);

// Métodos estáticos - ATUALIZADOS PARA PERÍODO COMPLETO
metricasUsuarioSchema.statics.obterRankingLoja = function (
  lojaId,
  dataInicio,
  dataFim,
) {
  return this.find({
    loja: lojaId,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .sort({ "totaisAcumulados.itensLidosTotal": -1 })
    .limit(50);
};

// Método estático para obter as configurações padrão das conquistas
metricasUsuarioSchema.statics.getConfiguracoesPadrao = function () {
  // Retorna as configurações padrão usando a função centralizada
  return getStaticAchievementRules();
};

metricasUsuarioSchema.statics.obterMetricasUsuario = function (
  usuarioId,
  lojaId,
  dataInicio,
  dataFim,
) {
  return this.findOne({
    usuarioId: usuarioId,
    loja: lojaId,
    $or: [
      { dataInicio: { $gte: dataInicio, $lte: dataFim } },
      { dataFim: { $gte: dataInicio, $lte: dataFim } },
      {
        $and: [
          { dataInicio: { $lte: dataInicio } },
          { dataFim: { $gte: dataFim } },
        ],
      },
    ],
  });
};

// Métodos de instância
metricasUsuarioSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    etiquetas: 1.0,
    rupturas: 1.5,
    presencas: 1.2,
  };

  let pontuacao = 0;
  pontuacao += this.etiquetas.itensAtualizados * pesos.etiquetas;
  pontuacao += this.rupturas.itensAtualizados * pesos.rupturas;
  pontuacao += this.presencas.itensAtualizados * pesos.presencas;

  // Bonus por consistência
  const tiposTrabalho = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  if (tiposTrabalho >= 2) {
    pontuacao *= 1.1;
  }
  if (tiposTrabalho === 3) {
    pontuacao *= 1.2;
  }

  this.totais.pontuacaoTotal = Math.round(pontuacao);
  return this.totais.pontuacaoTotal;
};

metricasUsuarioSchema.methods.atualizarTotais = function () {
  this.totais.totalItens =
    this.etiquetas.totalItens +
    this.rupturas.totalItens +
    this.presencas.totalItens;
  this.totais.itensLidos =
    this.etiquetas.itensLidos +
    this.rupturas.itensLidos +
    (this.presencas.totalItens || 0);
  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
    this.presencas.itensAtualizados;

  if (this.totais.totalItens > 0) {
    this.totais.percentualConclusaoGeral = Math.round(
      (this.totais.itensAtualizados / this.totais.totalItens) * 100,
    );
  }

  // Atualizar totais acumulados automaticamente
  this.totaisAcumulados.itensLidosEtiquetas = this.etiquetas.itensLidos || 0;
  this.totaisAcumulados.itensLidosRupturas = this.rupturas.itensLidos || 0;
  this.totaisAcumulados.itensLidosPresencas = this.presencas.totalItens || 0;
  this.totaisAcumulados.itensLidosTotal =
    (this.totaisAcumulados.itensLidosEtiquetas || 0) +
    (this.totaisAcumulados.itensLidosRupturas || 0) +
    (this.totaisAcumulados.itensLidosPresencas || 0);

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();

  // Atualizar também as conquistas com base nas métricas atualizadas
  this.calcularAchievements();
};

// Método para atualizar os dados de conquistas a partir do UserAchievement
metricasUsuarioSchema.methods.atualizarAchievements = function (
  userAchievementDoc,
) {
  if (!userAchievementDoc) return;

  // Atualizar dados de XP e nível
  this.achievements.xp = {
    ...userAchievementDoc.xp,
  };
  this.achievements.level = {
    ...userAchievementDoc.level,
  };
  this.achievements.stats = {
    ...userAchievementDoc.stats,
  };

  // Atualizar lista de conquistas
  if (
    userAchievementDoc.achievements &&
    Array.isArray(userAchievementDoc.achievements)
  ) {
    this.achievements.achievements = userAchievementDoc.achievements.map(
      (ach) => ({
        achievementId: ach.achievementId,
        unlocked: ach.unlocked,
        progress: {
          current: ach.progress?.current || 0,
          target: ach.progress?.target || 0,
          percentage: ach.progress?.percentage || 0,
        },
        unlockedAt: ach.unlockedAt,
        unlockedBy: ach.unlockedBy,
        achievementData: ach.achievementData || {},
        rarity: ach.rarity || ach.achievementData?.rarity || "Comum",
        fixedXpValue:
          RARITY_POINTS[ach.rarity || ach.achievementData?.rarity] ||
          ach.achievementData?.points ||
          ach.fixedXpValue ||
          0,
      }),
    );
  }

  // Atualizar data de última atualização
  this.ultimaAtualizacao = new Date();
};

// Método para calcular conquistas com base nos próprios dados do modelo
metricasUsuarioSchema.methods.calcularAchievements = function () {
  // Atualizar estrutura de achievements com base nas métricas atuais
  const currentItensLidos = this.totais.itensAtualizados;

  // ===== INJETAR CONQUISTAS ESTÁTICAS FALTANTES EM DOCUMENTOS EXISTENTES =====
  const staticRules = getStaticAchievementRules();
  const existingIds = new Set(
    this.achievements.achievements.map((a) => a.achievementId)
  );

  for (const [achievementId, rule] of Object.entries(staticRules)) {
    if (!existingIds.has(achievementId)) {
      this.achievements.achievements.push({
        achievementId,
        unlocked: false,
        progress: {
          current: 0,
          target: rule.criteria.target,
          percentage: 0,
        },
        unlockedAt: null,
        unlockedBy: null,
        achievementData: rule,
        rarity: rule.rarity || "Comum",
        fixedXpValue: RARITY_POINTS[rule.rarity] || rule.points || 0,
      });
      existingIds.add(achievementId);
    }
  }

  // ===== GERAR CONQUISTAS DINÂMICAS DE CLASSE E LOCAL =====
  // Verificar se já existem conquistas dinâmicas, se não, gerar baseado nos Maps
  const existingDynamicIds = new Set(
    this.achievements.achievements
      .filter((a) => a.achievementData?.isDynamic)
      .map((a) => a.achievementId)
  );

  // Gerar conquistas dinâmicas para cada classe de produto
  if (this.ContadorClassesProduto && this.ContadorClassesProduto.size > 0) {
    for (const [className, count] of this.ContadorClassesProduto.entries()) {
      if (count > 0) {
        const dynamicAchs = gerarConquistasDinamicas("classe", className);
        for (const dynAch of dynamicAchs) {
          if (!existingDynamicIds.has(dynAch.achievementId)) {
            this.achievements.achievements.push(dynAch);
            existingDynamicIds.add(dynAch.achievementId);
          }
        }
      }
    }
  }

  // Gerar conquistas dinâmicas para cada local
  if (this.ContadorLocais && this.ContadorLocais.size > 0) {
    for (const [localName, count] of this.ContadorLocais.entries()) {
      if (count > 0 && localName !== "Não especificado") {
        const dynamicAchs = gerarConquistasDinamicas("local", localName);
        for (const dynAch of dynamicAchs) {
          if (!existingDynamicIds.has(dynAch.achievementId)) {
            this.achievements.achievements.push(dynAch);
            existingDynamicIds.add(dynAch.achievementId);
          }
        }
      }
    }
  }

  // ===== ATUALIZAR PROGRESSO DE TODAS AS CONQUISTAS =====
  for (let i = 0; i < this.achievements.achievements.length; i++) {
    const achievement = this.achievements.achievements[i];
    let currentProgress = 0;

    // Verificar se é conquista dinâmica
    if (achievement.achievementData?.isDynamic) {
      const dynType = achievement.achievementData.dynamicType;
      const dynKey = achievement.achievementData.dynamicKey;

      if (dynType === "classe" && this.ContadorClassesProduto) {
        currentProgress = this.ContadorClassesProduto.get(dynKey) || 0;
      } else if (dynType === "local" && this.ContadorLocais) {
        currentProgress = this.ContadorLocais.get(dynKey) || 0;
      }
    } else {
      // Calcular progresso para conquistas estáticas
      switch (achievement.achievementId) {
        case "first-audit":
        case "audit-enthusiast":
        case "audit-master":
        case "consistent-auditor":
        case "weekly-warrior":
          currentProgress = this.contadoresAuditorias.totalGeral;
          break;
        case "item-collector-100":
        case "item-collector-500":
        case "item-collector-1000":
        case "item-collector-2000":
        case "item-collector-5000":
        case "item-collector-10000":
          currentProgress = this.totais.pontuacaoTotal;
          break;
        case "detetive-1":
        case "detetive-2":
        case "detetive-3":
        case "detetive-4":
        case "detetive-5":
        case "detetive-6":
          currentProgress = this.rupturas.totalItens;
          break;
        case "auditor-etiqueta-1":
        case "auditor-etiqueta-2":
        case "auditor-etiqueta-3":
        case "auditor-etiqueta-4":
        case "auditor-etiqueta-5":
        case "auditor-etiqueta-6":
          currentProgress = this.totaisAcumulados.itensLidosEtiquetas;
          break;
        case "auditor-presenca-1":
        case "auditor-presenca-2":
        case "auditor-presenca-3":
        case "auditor-presenca-4":
        case "auditor-presenca-5":
        case "auditor-presenca-6":
          currentProgress = this.totaisAcumulados.itensLidosPresencas;
          break;

        // === RANKING ===
        case "ranking-first-1":
        case "ranking-first-5":
          currentProgress = this.historicoRanking.posicao1 || 0;
          break;
        case "ranking-top3-5":
        case "ranking-top3-20":
          currentProgress = (this.historicoRanking.posicao1 || 0) +
            (this.historicoRanking.posicao2 || 0) +
            (this.historicoRanking.posicao3 || 0);
          break;
        case "ranking-top10-10":
        case "ranking-top10-50":
          currentProgress = this.historicoRanking.totalTop10 || 0;
          break;

        // === CUSTO RUPTURA ===
        case "custo-ruptura-1k":
        case "custo-ruptura-10k":
        case "custo-ruptura-50k":
        case "custo-ruptura-200k":
          currentProgress = this.rupturas.custoTotalRuptura || 0;
          break;

        // === PRESENÇA CONFIRMADA ===
        case "confirmador-1":
        case "confirmador-2":
        case "confirmador-3":
          currentProgress = this.presencas.presencasConfirmadas || 0;
          break;

        // === ITENS DESATUALIZADOS ===
        case "desatualizado-1":
        case "desatualizado-2":
        case "desatualizado-3":
          currentProgress = this.etiquetas.itensDesatualizado || 0;
          break;

        // === ITENS SEM ESTOQUE ===
        case "sem-estoque-1":
        case "sem-estoque-2":
        case "sem-estoque-3":
          currentProgress = (this.etiquetas.itensSemEstoque || 0) +
            (this.presencas.itensSemEstoque || 0);
          break;

        // === ESPECIALIZAÇÃO POR TIPO ===
        case "especialista-etiqueta":
        case "guru-etiqueta":
          currentProgress = this.contadoresAuditorias.totalEtiquetas || 0;
          break;
        case "especialista-ruptura":
        case "guru-ruptura":
          currentProgress = this.contadoresAuditorias.totalRupturas || 0;
          break;
        case "especialista-presenca":
        case "guru-presenca":
          currentProgress = this.contadoresAuditorias.totalPresencas || 0;
          break;

        // === VERSATILIDADE ===
        case "versatil-1":
        case "versatil-2":
          // Progresso = menor valor entre os 3 tipos (precisa todos >= target)
          currentProgress = Math.min(
            this.contadoresAuditorias.totalEtiquetas || 0,
            this.contadoresAuditorias.totalRupturas || 0,
            this.contadoresAuditorias.totalPresencas || 0
          );
          break;

        // === LEITURA TOTAL ===
        case "leitor-total-1k":
        case "leitor-total-10k":
        case "leitor-total-50k":
          currentProgress = this.totaisAcumulados.itensLidosTotal || 0;
          break;

        // === PARTICIPAÇÃO COMUNITÁRIA (cross-model) ===
        case "sugestao-1":
        case "sugestao-5":
        case "sugestao-15":
          currentProgress = this.participacao?.sugestoesEnviadas || 0;
          break;
        case "artigo-1":
        case "artigo-5":
          currentProgress = this.participacao?.artigosPublicados || 0;
          break;
        case "comentarista-1":
        case "comentarista-2":
          currentProgress = this.participacao?.comentariosFeitos || 0;
          break;
        case "votante-1":
          currentProgress = this.participacao?.votosRealizados || 0;
          break;

        default:
          currentProgress = 0;
      }
    }

    const target = achievement.achievementData?.criteria?.target || 0;
    const percentage =
      target > 0
        ? Math.min(Math.round((currentProgress / target) * 100), 100)
        : 0;
    const shouldUnlock = currentProgress >= target;

    // Atualizar apenas os campos de progresso e status, mantendo os dados existentes
    achievement.progress.current = currentProgress;
    achievement.progress.target = target;
    achievement.progress.percentage = percentage;

    // Se ainda não estiver desbloqueado e agora deveria estar, atualizar status
    if (!achievement.unlocked && shouldUnlock) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
    }
    // Se já estava desbloqueado, manter o status e a data

    // Garantir que os campos de raridade e XP fixo estejam presentes
    if (!achievement.rarity && achievement.achievementData?.rarity) {
      achievement.rarity = achievement.achievementData.rarity;
    } else if (!achievement.rarity) {
      achievement.rarity = "Comum"; // valor padrão
    }

    // Padronizar fixedXpValue baseado na raridade
    achievement.fixedXpValue = RARITY_POINTS[achievement.rarity] || 
      achievement.achievementData?.points || 
      achievement.fixedXpValue || 0;
  }

  // Calcular estatísticas de conquistas
  const unlockedCount = this.achievements.achievements.filter(
    (ach) => ach.unlocked,
  ).length;
  this.achievements.stats.totalUnlockedAchievements = unlockedCount;
  this.achievements.stats.totalAudits = this.totais.itensAtualizados;
  this.achievements.stats.totalItems = this.totais.itensAtualizados;
  this.achievements.stats.lastActivityAt = new Date();

  // Calcular XP baseado em conquistas desbloqueadas
  let xpFromAchievements = 0;
  this.achievements.achievements.forEach((achievement) => {
    if (achievement.unlocked) {
      // Usar RARITY_POINTS como fonte principal de pontuação
      const xpValue = RARITY_POINTS[achievement.rarity] || 
        achievement.fixedXpValue || achievement.achievementData?.points || 0;
      xpFromAchievements += xpValue;
    }
  });

  // Calcular XP total (usando total de itens lidos acumulados)
  const xpFromActivities = this.totaisAcumulados.itensLidosTotal || 0;
  this.achievements.xp.fromAchievements = xpFromAchievements;
  this.achievements.xp.fromActivities = xpFromActivities;
  this.achievements.xp.total = xpFromAchievements + xpFromActivities;

  // Calcular nível baseado no XP total (mesma lógica do UserAchievement)
  const level = this.calcularLevel(this.achievements.xp.total);
  this.achievements.level.current = level;
  this.achievements.level.title = this.getLevelTitle(level);

  // Calcular progresso para o próximo nível
  const xpInCurrentLevel = this.achievements.xp.total % 100;
  this.achievements.level.xpForNextLevel = 100 - xpInCurrentLevel;
  this.achievements.level.progressPercentage = Math.round(xpInCurrentLevel);
};

// Helper: Calcular nível baseado no XP (mesma lógica do UserAchievement)
metricasUsuarioSchema.methods.calcularLevel = function (xp) {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  if (xp < 5500) return 10;
  if (xp < 6600) return 11;
  if (xp < 7800) return 12;
  if (xp < 9100) return 13;
  if (xp < 10500) return 14;
  if (xp < 12000) return 15;
  return Math.floor(Math.sqrt(xp / 10)) + 1;
};

// Helper: Obter título baseado no nível (mesma lógica do UserAchievement)
metricasUsuarioSchema.methods.getLevelTitle = function (level) {
  const titles = {
    1: "Auditor Novato",
    5: " Auditor Aprendiz",
    10: "Auditor Iniciante",
    15: "Auditor Competente",
    20: "Auditor Profissional",
    25: "Auditor Experiente",
    30: "Auditor Especialista",
    35: "Auditor Especialista Sênior",
    40: "Auditor Veterano",
    45: "Auditor Mestre",
    50: "Auditor Sênior",
    60: "Auditor Pleno",
    70: "Auditor Master",
    80: " Auditor Lendario",
    90: "Auditor Elite",
    100: "Auditor Campeão",
    120: "Auditor Supremo",
    140: "Auditor Imortal",
    160: "Auditor Ascendido",
    180: " Auditor Divino",
    200: "Auditor Infinito",
    500: "Auditor Lendário Supremo",
    1000: "Auditor Divino Supremo",
    5000: "Y am god of audits",
  };

  const sortedLevels = Object.keys(titles)
    .map(Number)
    .sort((a, b) => b - a);

  for (const minLevel of sortedLevels) {
    if (level >= minLevel) {
      return titles[minLevel];
    }
  }

  return "Auditor de Estoque";
};

// Middleware to ensure numeric fields are always numbers
metricasUsuarioSchema.pre("save", function (next) {
  // Ensure contadoresAuditorias fields are numbers
  if (this.contadoresAuditorias) {
    this.contadoresAuditorias.totalEtiquetas =
      Number(this.contadoresAuditorias.totalEtiquetas) || 0;
    this.contadoresAuditorias.totalRupturas =
      Number(this.contadoresAuditorias.totalRupturas) || 0;
    this.contadoresAuditorias.totalPresencas =
      Number(this.contadoresAuditorias.totalPresencas) || 0;
    this.contadoresAuditorias.totalGeral =
      Number(this.contadoresAuditorias.totalGeral) || 0;
  }

  // Ensure totais fields are numbers
  if (this.totais) {
    this.totais.totalItens = Number(this.totais.totalItens) || 0;
    this.totais.itensLidos = Number(this.totais.itensLidos) || 0;
    this.totais.itensAtualizados = Number(this.totais.itensAtualizados) || 0;
    this.totais.percentualConclusaoGeral =
      Number(this.totais.percentualConclusaoGeral) || 0;
    this.totais.pontuacaoTotal = Number(this.totais.pontuacaoTotal) || 0;
  }

  if (this.historicoRanking) {
    this.historicoRanking.posicao1 =
      Number(this.historicoRanking.posicao1) || 0;
    this.historicoRanking.posicao2 =
      Number(this.historicoRanking.posicao2) || 0;
    this.historicoRanking.posicao3 =
      Number(this.historicoRanking.posicao3) || 0;
    this.historicoRanking.posicao4 =
      Number(this.historicoRanking.posicao4) || 0;
    this.historicoRanking.posicao5 =
      Number(this.historicoRanking.posicao5) || 0;
    this.historicoRanking.posicao6 =
      Number(this.historicoRanking.posicao6) || 0;
    this.historicoRanking.posicao7 =
      Number(this.historicoRanking.posicao7) || 0;
    this.historicoRanking.posicao8 =
      Number(this.historicoRanking.posicao8) || 0;
    this.historicoRanking.posicao9 =
      Number(this.historicoRanking.posicao9) || 0;
    this.historicoRanking.posicao10 =
      Number(this.historicoRanking.posicao10) || 0;
    this.historicoRanking.ACIMA10 = Number(this.historicoRanking.ACIMA10) || 0;
    this.historicoRanking.totalTop10 =
      Number(this.historicoRanking.totalTop10) || 0;
    this.historicoRanking.melhorPosicao =
      Number(this.historicoRanking.melhorPosicao) || null;
  }

  if (this.totaisAcumulados) {
    this.totaisAcumulados.itensLidosEtiquetas =
      Number(this.totaisAcumulados.itensLidosEtiquetas) || 0;
    this.totaisAcumulados.itensLidosRupturas =
      Number(this.totaisAcumulados.itensLidosRupturas) || 0;
    this.totaisAcumulados.itensLidosPresencas =
      Number(this.totaisAcumulados.itensLidosPresencas) || 0;
    this.totaisAcumulados.itensLidosTotal =
      Number(this.totaisAcumulados.itensLidosTotal) || 0;
  }

  // Ensure achievement XP and level fields are numbers
  if (this.achievements && this.achievements.xp) {
    this.achievements.xp.total = Number(this.achievements.xp.total) || 0;
    this.achievements.xp.fromAchievements =
      Number(this.achievements.xp.fromAchievements) || 0;
    this.achievements.xp.fromActivities =
      Number(this.achievements.xp.fromActivities) || 0;
  }

  if (this.achievements && this.achievements.level) {
    this.achievements.level.current =
      Number(this.achievements.level.current) || 1;
    this.achievements.level.xpForNextLevel =
      Number(this.achievements.level.xpForNextLevel) || 100;
    this.achievements.level.progressPercentage =
      Number(this.achievements.level.progressPercentage) || 0;
  }

  // Ensure stat fields are numbers
  if (this.achievements && this.achievements.stats) {
    this.achievements.stats.totalUnlockedAchievements =
      Number(this.achievements.stats.totalUnlockedAchievements) || 0;
    this.achievements.stats.totalAudits =
      Number(this.achievements.stats.totalAudits) || 0;
    this.achievements.stats.totalItems =
      Number(this.achievements.stats.totalItems) || 0;
  }

  // Ensure tipo-specific metrics are numbers
  if (this.etiquetas) {
    this.etiquetas.totalItens = Number(this.etiquetas.totalItens) || 0;
    this.etiquetas.itensLidos = Number(this.etiquetas.itensLidos) || 0;
    this.etiquetas.itensAtualizados =
      Number(this.etiquetas.itensAtualizados) || 0;
    this.etiquetas.itensDesatualizado =
      Number(this.etiquetas.itensDesatualizado) || 0;
    this.etiquetas.itensSemEstoque =
      Number(this.etiquetas.itensSemEstoque) || 0;
    this.etiquetas.itensNaopertence =
      Number(this.etiquetas.itensNaopertence) || 0;
  }

  if (this.rupturas) {
    this.rupturas.totalItens = Number(this.rupturas.totalItens) || 0;
    this.rupturas.itensLidos = Number(this.rupturas.itensLidos) || 0;
    this.rupturas.itensAtualizados =
      Number(this.rupturas.itensAtualizados) || 0;
    this.rupturas.custoTotalRuptura =
      Number(this.rupturas.custoTotalRuptura) || 0;
    this.rupturas.custoMedioRuptura =
      Number(this.rupturas.custoMedioRuptura) || 0;
  }

  if (this.presencas) {
    this.presencas.totalItens = Number(this.presencas.totalItens) || 0;
    this.presencas.itensAtualizados =
      Number(this.presencas.itensAtualizados) || 0;
    this.presencas.itensSemEstoque =
      Number(this.presencas.itensSemEstoque) || 0;
    this.presencas.itensNaopertence =
      Number(this.presencas.itensNaopertence) || 0;
    this.presencas.presencasConfirmadas =
      Number(this.presencas.presencasConfirmadas) || 0;
  }

  // Ensure participacao fields are numbers
  if (this.participacao) {
    this.participacao.sugestoesEnviadas =
      Number(this.participacao.sugestoesEnviadas) || 0;
    this.participacao.artigosPublicados =
      Number(this.participacao.artigosPublicados) || 0;
    this.participacao.comentariosFeitos =
      Number(this.participacao.comentariosFeitos) || 0;
    this.participacao.votosRealizados =
      Number(this.participacao.votosRealizados) || 0;
  }

  next();
});

export default mongoose.model("MetricasUsuario", metricasUsuarioSchema);
