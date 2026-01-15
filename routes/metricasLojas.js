import express from 'express';
import MetricasLoja from '../models/MetricasLoja.js';
import MetricasUsuario from '../models/MetricasUsuario.js';
import Loja from '../models/Loja.js';

const router = express.Router();

// Endpoint para obter métricas resumidas de uma loja específica
router.get('/metricas/lojas', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];

    if (!lojaCodigo) {
      return res.status(400).json({
        erro: "Código da loja é obrigatório"
      });
    }

    // Buscar a loja pelo código
    const loja = await Loja.findOne({ codigo: lojaCodigo });
    if (!loja) {
      return res.status(404).json({ erro: "Loja não encontrada" });
    }

    // Buscar métricas da loja (período completo mais recente)
    const metricasLoja = await MetricasLoja.findOne({ loja: loja._id })
      .sort({ dataInicio: -1 })
      .populate('loja', 'nome codigo cidade');

    // Buscar o colaborador em destaque diretamente do modelo MetricasUsuario
    let colaboradorDestaque = "N/A";
    try {
      const topUsuario = await MetricasUsuario.findOne({ loja: loja._id })
        .sort({ 'totais.pontuacaoTotal': -1 }) // Ordenar pela pontuação total
        .limit(1);

      if (topUsuario && topUsuario.usuarioNome) {
        colaboradorDestaque = topUsuario.usuarioNome;
      }
    } catch (error) {
      console.error("Erro ao buscar colaborador em destaque:", error);
      // Continuar com o valor padrão "N/A"
    }

    if (!metricasLoja) {
      // Se não houver métricas, retornar valores padrão
      return res.json({
        auditoriasRealizadas: 0,
        variacaoAuditorias: 0,
        posicaoGeral: 0,
        colaboradorDestaque: colaboradorDestaque, // Usar o valor buscado do MetricasUsuario
        totalColaboradores: 0,
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
          cidade: loja.cidade
        }
      });
    }

    // Buscar métricas anteriores para calcular variação
    const metricasAnteriores = await MetricasLoja.find({ loja: loja._id })
      .sort({ dataInicio: -1 })
      .skip(1)
      .limit(1);

    let variacaoAuditorias = 0;
    if (metricasAnteriores.length > 0) {
      const atual = metricasLoja.totais.planilhasProcessadas || 0;
      const anterior = metricasAnteriores[0].totais.planilhasProcessadas || 0;

      if (anterior > 0) {
        variacaoAuditorias = Math.round(((atual - anterior) / anterior) * 100);
      }
    }

    // Formatar resposta para o componente
    const response = {
      auditoriasRealizadas: metricasLoja.totais.planilhasProcessadas || 0,
      variacaoAuditorias: variacaoAuditorias,
      posicaoGeral: metricasLoja.ranking.posicaoGeral || 0,
      colaboradorDestaque: colaboradorDestaque, // Usar o valor buscado do MetricasUsuario
      totalColaboradores: metricasLoja.totais.usuariosAtivos || 0,
      totalItensAuditados: metricasLoja.totais.itensLidos || 0, // Adicionando o campo itensLidos
      loja: {
        codigo: metricasLoja.loja.codigo,
        nome: metricasLoja.loja.nome,
        cidade: metricasLoja.loja.cidade
      },
      // Dados extras que podem ser úteis
      detalhes: {
        percentualConclusao: metricasLoja.totais.percentualConclusaoGeral || 0,
        itensAtualizados: metricasLoja.totais.itensAtualizados || 0,
        notaQualidade: metricasLoja.ranking.notaQualidade || 0,
        eficienciaOperacional: metricasLoja.ranking.eficienciaOperacional || 0,
        pontuacaoTotal: metricasLoja.ranking.pontuacaoTotal || 0
      }
    };

    res.json(response);

  } catch (error) {
    console.error("Erro ao buscar métricas da loja:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

// Endpoint para obter ranking de todas as lojas
router.get('/metricas/lojas/ranking', async (req, res) => {
  try {
    const { limite = 50 } = req.query;

    // Buscar todas as métricas mais recentes
    const metricas = await MetricasLoja.aggregate([
      // Agrupar por loja e pegar a mais recente
      {
        $sort: { dataInicio: -1 }
      },
      {
        $group: {
          _id: '$loja',
          metrica: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$metrica' }
      },
      // Ordenar por pontuação total
      {
        $sort: { 'ranking.pontuacaoTotal': -1 }
      },
      {
        $limit: parseInt(limite)
      }
    ]);

    // Popular os dados da loja
    await MetricasLoja.populate(metricas, {
      path: 'loja',
      select: 'codigo nome cidade regiao'
    });

    // Atualizar posições se necessário
    metricas.forEach((metrica, index) => {
      if (metrica.ranking.posicaoGeral !== index + 1) {
        MetricasLoja.updateOne(
          { _id: metrica._id },
          { 'ranking.posicaoGeral': index + 1 }
        ).exec();
      }
    });

    const ranking = metricas.map((metrica, index) => ({
      posicao: index + 1,
      loja: {
        codigo: metrica.loja.codigo,
        nome: metrica.loja.nome,
        cidade: metrica.loja.cidade
      },
      pontuacao: metrica.ranking.pontuacaoTotal || 0,
      percentualConclusao: metrica.totais.percentualConclusaoGeral || 0,
      usuariosAtivos: metrica.totais.usuariosAtivos || 0,
      notaQualidade: metrica.ranking.notaQualidade || 0
    }));

    res.json({
      total: ranking.length,
      ranking
    });

  } catch (error) {
    console.error("Erro ao buscar ranking de lojas:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

export default router;
