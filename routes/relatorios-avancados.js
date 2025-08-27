import express from "express";
import Auditoria from "../models/Auditoria.js"; // Usando a nova coleção
import Setor from "../models/Setor.js";

const router = express.Router();

// Helper para calcular períodos de data
const calcularPeriodo = (periodo) => {
  const hoje = new Date();
  let inicio, fim;

  switch (periodo) {
    case "hoje":
      inicio = new Date(hoje.setHours(0, 0, 0, 0));
      fim = new Date(hoje.setHours(23, 59, 59, 999));
      break;
    case "semana":
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - hoje.getDay());
      inicio.setHours(0, 0, 0, 0);
      fim = new Date(hoje);
      fim.setDate(hoje.getDate() + (6 - hoje.getDay()));
      fim.setHours(23, 59, 59, 999);
      break;
    case "mes":
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      fim.setHours(23, 59, 59, 999);
      break;
    default:
      // Últimos 30 dias por padrão
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 30);
      inicio.setHours(0, 0, 0, 0);
      fim = new Date(hoje);
      fim.setHours(23, 59, 59, 999);
  }

  return { inicio, fim };
};

// 📊 DASHBOARD PRINCIPAL
router.get("/dashboard", async (req, res) => {
  try {
    const { periodo = "mes", tipo } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    // Filtro por tipo de auditoria
    const filtroTipo = tipo && tipo !== "todos" ? { tipo } : {};

    const matchStage = {
      data: { $gte: inicio, $lte: fim },
      ...filtroTipo,
    };

    // Agregação principal usando a NOVA coleção
    const [dashboardData, evolucaoSemanal, topColaboradores] =
      await Promise.all([
        // Dados principais do dashboard
        Auditoria.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalItens: { $sum: 1 },
              itensVerificados: {
                $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
              },
              colaboradoresUnicos: { $addToSet: "$usuarioId" },
            },
          },
          {
            $project: {
              totalItens: 1,
              itensVerificados: 1,
              colaboradoresAtivos: { $size: "$colaboradoresUnicos" },
              taxaConclusao: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$itensVerificados", "$totalItens"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            },
          },
        ]),

        // Evolução semanal (últimas 4 semanas)
        Auditoria.aggregate([
          {
            $match: {
              data: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 28)),
                $lte: new Date(),
              },
            },
          },
          {
            $group: {
              _id: {
                semana: { $week: "$data" },
                ano: { $year: "$data" },
              },
              totalItens: { $sum: 1 },
              itensVerificados: {
                $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              semana: "$_id.semana",
              ano: "$_id.ano",
              totalItens: 1,
              itensVerificados: 1,
              taxaConclusao: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$itensVerificados", "$totalItens"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            },
          },
          { $sort: { ano: 1, semana: 1 } },
          { $limit: 4 },
        ]),

        // Top 5 colaboradores
        Auditoria.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$usuarioId",
              totalItens: { $sum: 1 },
              itensVerificados: {
                $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              usuarioId: "$_id",
              totalItens: 1,
              itensVerificados: 1,
              eficiencia: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$itensVerificados", "$totalItens"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            },
          },
          { $sort: { itensVerificados: -1 } },
          { $limit: 5 },
        ]),
      ]);

    // Enriquecer top colaboradores com nomes
    const topColabEnriquecido = await Promise.all(
      topColaboradores.map(async (colab) => {
        // Buscar o nome do usuário (usando a coleção User existente ou da própria auditoria)
        const usuarioAuditoria = await Auditoria.findOne({
          usuarioId: colab.usuarioId,
        }).sort({ data: -1 });

        return {
          ...colab,
          nome: usuarioAuditoria?.usuarioNome || `Usuário ${colab.usuarioId}`,
        };
      })
    );

    const resultado = dashboardData[0] || {
      totalItens: 0,
      itensVerificados: 0,
      colaboradoresAtivos: 0,
      taxaConclusao: 0,
    };

    res.json({
      periodo: {
        inicio,
        fim,
        label: periodo,
      },
      metricas: resultado,
      evolucaoSemanal: evolucaoSemanal || [],
      topColaboradores: topColabEnriquecido,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Erro no dashboard:", error);
    res.status(500).json({
      erro: "Falha ao gerar dashboard",
      detalhes: error.message,
    });
  }
});
// 📊 DISTRIBUIÇÃO POR SITUAÇÃO
router.get("/distribuicao-situacao", async (req, res) => {
  try {
    const { periodo = "30dias", tipo } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    const filtroTipo = tipo && tipo !== "todos" ? { tipo } : {};

    const distribuicao = await Auditoria.aggregate([
      {
        $match: {
          data: { $gte: inicio, $lte: fim },
          ...filtroTipo,
        },
      },
      {
        $group: {
          _id: "$situacao",
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    // Converter array para objeto
    const resultado = {};
    distribuicao.forEach((item) => {
      resultado[item._id] = item.total;
    });

    res.json(resultado);
  } catch (error) {
    console.error("Erro na distribuição por situação:", error);
    res.status(500).json({ erro: error.message });
  }
});

// 🏪 TOP LOCAIS
router.get("/top-locais", async (req, res) => {
  try {
    const { periodo = "30dias", tipo } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    const filtroTipo = tipo && tipo !== "todos" ? { tipo } : {};

    const locais = await Auditoria.aggregate([
      {
        $match: {
          data: { $gte: inicio, $lte: fim },
          ...filtroTipo,
        },
      },
      {
        $group: {
          _id: "$local",
          total: { $sum: 1 },
          verificados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    res.json(locais);
  } catch (error) {
    console.error("Erro no top locais:", error);
    res.status(500).json({ erro: error.message });
  }
});

// 📈 EVOLUÇÃO DIÁRIA
router.get("/evolucao-diaria", async (req, res) => {
  try {
    const { periodo = "7dias", tipo } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    const filtroTipo = tipo && tipo !== "todos" ? { tipo } : {};

    const evolucao = await Auditoria.aggregate([
      {
        $match: {
          data: { $gte: inicio, $lte: fim },
          ...filtroTipo,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$data",
            },
          },
          total: { $sum: 1 },
          verificados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(evolucao);
  } catch (error) {
    console.error("Erro na evolução diária:", error);
    res.status(500).json({ erro: error.message });
  }
});

// 📈 ESTATÍSTICAS POR TIPO DE AUDITORIA
router.get("/estatisticas-tipo", async (req, res) => {
  try {
    const { periodo = "mes" } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    const estatisticas = await Auditoria.aggregate([
      {
        $match: {
          data: { $gte: inicio, $lte: fim },
        },
      },
      {
        $group: {
          _id: "$tipo",
          totalItens: { $sum: 1 },
          itensVerificados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
          itensComProblema: {
            $sum: { $cond: [{ $ne: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          tipo: "$_id",
          totalItens: 1,
          itensVerificados: 1,
          itensComProblema: 1,
          taxaConclusao: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$itensVerificados", "$totalItens"] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { totalItens: -1 } },
    ]);

    res.json({
      periodo: { inicio, fim },
      estatisticas,
      totalGeral: estatisticas.reduce((acc, curr) => acc + curr.totalItens, 0),
    });
  } catch (error) {
    console.error("Erro nas estatísticas por tipo:", error);
    res.status(500).json({
      erro: "Falha ao buscar estatísticas",
      detalhes: error.message,
    });
  }
});

// 🔍 DETALHES POR SETOR/LOCAL
router.get("/por-setor", async (req, res) => {
  try {
    const { periodo = "mes" } = req.query;
    const { inicio, fim } = calcularPeriodo(periodo);

    // Usando a coleção Setor para dados por local
    const dadosSetores = await Setor.aggregate([
      {
        $match: {
          dataAuditoria: { $gte: inicio, $lte: fim },
        },
      },
      {
        $group: {
          _id: "$local",
          totalItens: { $sum: 1 },
          itensVerificados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
          colaboradores: { $addToSet: "$usuario" },
        },
      },
      {
        $project: {
          local: "$_id",
          totalItens: 1,
          itensVerificados: 1,
          colaboradoresAtivos: { $size: "$colaboradores" },
          taxaConclusao: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$itensVerificados", "$totalItens"] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { totalItens: -1 } },
    ]);

    res.json({
      periodo: { inicio, fim },
      setores: dadosSetores,
      totalSetores: dadosSetores.length,
    });
  } catch (error) {
    console.error("Erro nos dados por setor:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados por setor",
      detalhes: error.message,
    });
  }
});

// ⚠️ SISTEMA DE ALERTAS INTELIGENTES
router.get("/alertas", async (req, res) => {
  try {
    const alertas = [];

    // Verificar taxa de conclusão baixa (últimos 7 dias)
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

    const desempenhoRecente = await Auditoria.aggregate([
      {
        $match: {
          data: { $gte: umaSemanaAtras },
        },
      },
      {
        $group: {
          _id: null,
          totalItens: { $sum: 1 },
          itensVerificados: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
    ]);

    if (desempenhoRecente.length > 0) {
      const { totalItens, itensVerificados } = desempenhoRecente[0];
      const taxa = totalItens > 0 ? (itensVerificados / totalItens) * 100 : 0;

      if (taxa < 60) {
        alertas.push({
          tipo: "critico",
          codigo: "TAXA_BAIXA",
          mensagem: `Taxa de conclusão muito baixa: ${taxa.toFixed(1)}%`,
          acao: "Verificar causas da baixa produtividade",
          timestamp: new Date(),
        });
      } else if (taxa < 80) {
        alertas.push({
          tipo: "aviso",
          codigo: "TAXA_MEDIA",
          mensagem: `Taxa de conclusão pode melhorar: ${taxa.toFixed(1)}%`,
          acao: "Analisar pontos de melhoria",
          timestamp: new Date(),
        });
      }
    }

    // Verificar setores com problemas
    const setoresProblema = await Setor.aggregate([
      {
        $match: {
          dataAuditoria: { $gte: umaSemanaAtras },
          situacao: { $ne: "Atualizado" },
        },
      },
      {
        $group: {
          _id: "$local",
          problemas: { $sum: 1 },
        },
      },
      { $match: { problemas: { $gt: 10 } } }, // Mais de 10 problemas
      { $sort: { problemas: -1 } },
      { $limit: 5 },
    ]);

    setoresProblema.forEach((setor) => {
      alertas.push({
        tipo: "aviso",
        codigo: "SETOR_PROBLEMA",
        mensagem: `${setor.problemas} itens com problema em ${setor._id}`,
        acao: "Verificar situação do setor",
        timestamp: new Date(),
      });
    });

    res.json({
      totalAlertas: alertas.length,
      alertas: alertas.sort((a, b) => {
        const prioridade = { critico: 0, aviso: 1, info: 2 };
        return prioridade[a.tipo] - prioridade[b.tipo];
      }),
      ultimaVerificacao: new Date(),
    });
  } catch (error) {
    console.error("Erro no sistema de alertas:", error);
    res.status(500).json({
      erro: "Falha ao verificar alertas",
      detalhes: error.message,
    });
  }
});

// 📋 RELATÓRIO COMPARATIVO ENTRE PERÍODOS
router.get("/comparativo", async (req, res) => {
  try {
    const { periodoAtual = "semana", periodoAnterior = "semana" } = req.query;

    const [dadosAtual, dadosAnterior] = await Promise.all([
      // Período atual
      Auditoria.aggregate([
        {
          $match: {
            data: { $gte: calcularPeriodo(periodoAtual).inicio },
          },
        },
        {
          $group: {
            _id: null,
            totalItens: { $sum: 1 },
            itensVerificados: {
              $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
            },
            colaboradores: { $addToSet: "$usuarioId" },
          },
        },
      ]),

      // Período anterior
      Auditoria.aggregate([
        {
          $match: {
            data: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 60)),
              $lte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalItens: { $sum: 1 },
            itensVerificados: {
              $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
            },
            colaboradores: { $addToSet: "$usuarioId" },
          },
        },
      ]),
    ]);

    const atual = dadosAtual[0] || {
      totalItens: 0,
      itensVerificados: 0,
      colaboradores: [],
    };
    const anterior = dadosAnterior[0] || {
      totalItens: 0,
      itensVerificados: 0,
      colaboradores: [],
    };

    const taxaAtual =
      atual.totalItens > 0
        ? (atual.itensVerificados / atual.totalItens) * 100
        : 0;
    const taxaAnterior =
      anterior.totalItens > 0
        ? (anterior.itensVerificados / anterior.totalItens) * 100
        : 0;

    const variacao = {
      totalItens: calcularVariacao(atual.totalItens, anterior.totalItens),
      itensVerificados: calcularVariacao(
        atual.itensVerificados,
        anterior.itensVerificados
      ),
      taxaConclusao: calcularVariacao(taxaAtual, taxaAnterior),
      colaboradoresAtivos: calcularVariacao(
        atual.colaboradores.length,
        anterior.colaboradores.length
      ),
    };

    res.json({
      periodos: {
        atual: periodoAtual,
        anterior: periodoAnterior,
      },
      metricas: {
        atual: {
          ...atual,
          taxaConclusao: taxaAtual,
          colaboradoresAtivos: atual.colaboradores.length,
        },
        anterior: {
          ...anterior,
          taxaConclusao: taxaAnterior,
          colaboradoresAtivos: anterior.colaboradores.length,
        },
      },
      variacao,
      analise: gerarAnaliseComparativa(variacao),
    });
  } catch (error) {
    console.error("Erro no comparativo:", error);
    res.status(500).json({
      erro: "Falha ao gerar comparativo",
      detalhes: error.message,
    });
  }
});

// Funções auxiliares
function calcularVariacao(atual, anterior) {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
}

function gerarAnaliseComparativa(variacao) {
  const analises = [];

  if (variacao.taxaConclusao > 5) {
    analises.push("📈 Melhoria significativa na taxa de conclusão");
  } else if (variacao.taxaConclusao < -5) {
    analises.push("📉 Queda preocupante na eficiência");
  }

  if (variacao.itensVerificados > 20) {
    analises.push("🚀 Aumento expressivo na produtividade");
  }

  if (variacao.colaboradoresAtivos > 10) {
    analises.push("👥 Mais colaboradores ativos no período");
  }

  return analises.length > 0 ? analises : ["📊 Desempenho estável no período"];
}

export default router;
