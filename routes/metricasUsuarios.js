import express from 'express';
import metricasUsuariosService from '../services/metricasUsuariosService.js';
import Loja from '../models/Loja.js';

const router = express.Router();

/**
 * GET /metricas/usuarios
 * Obtém métricas de usuários com filtros opcionais
 * Query params:
 *   - todos: 'true' para buscar de todas as lojas
 *   - dataAuditoria: filtro por data (formato: YYYY-MM-DD)
 * Headers:
 *   - x-loja: código da loja (obrigatório se todos !== 'true')
 */
router.get('/metricas/usuarios', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];
    const { dataAuditoria, todos } = req.query;

    // Validação: se não for "todos", precisa do código da loja
    if (!lojaCodigo && todos !== 'true') {
      return res.status(400).json({
        erro: "Código da loja é obrigatório ou use ?todos=true"
      });
    }

    let metricas;

    if (todos === 'true') {
      // Buscar métricas de todas as lojas
      const filtros = {};
      if (dataAuditoria) {
        filtros.dataInicio = dataAuditoria;
        filtros.dataFim = dataAuditoria;
      }

      metricas = await metricasUsuariosService.obterTodasMetricas(filtros);

    } else {
      // Buscar métricas de uma loja específica
      const loja = await Loja.findOne({ codigo: lojaCodigo });
      if (!loja) {
        return res.status(404).json({ erro: "Loja não encontrada" });
      }

      const filtros = {};
      if (dataAuditoria) {
        filtros.dataInicio = dataAuditoria;
        filtros.dataFim = dataAuditoria;
      }

      metricas = await metricasUsuariosService.obterMetricasLoja(loja._id, filtros);
    }

    // Filtrar apenas usuários válidos com dados úteis
    const usuariosValidos = metricas.filter(metrica => {
      const isValid = metrica.usuarioNome &&
        metrica.usuarioId &&
        !metrica.usuarioNome.toLowerCase().includes("produto não auditado") &&
        !metrica.usuarioNome.toLowerCase().includes("usuário não identificado") &&
        !metrica.usuarioId.toLowerCase().includes("produto não auditado") &&
        !metrica.usuarioId.toLowerCase().includes("usuário não identificado") &&
        (metrica.totaisAcumulados?.itensLidosTotal > 0 || metrica.totais?.itensAtualizados > 0);

      return isValid;
    });

    // Mapear os dados para o formato esperado pelo frontend
    const usuarios = usuariosValidos.map(metrica => ({
      id: metrica.usuarioId,
      nome: metrica.usuarioNome,
      iniciais: metrica.usuarioNome ?
        metrica.usuarioNome.split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .substring(0, 2) : '??',
      contador: metrica.totaisAcumulados?.itensLidosTotal || metrica.totais?.itensAtualizados || 0,
      totalAuditorias: metrica.contadoresAuditorias?.totalGeral || 0,
      loja: metrica.loja?.codigo || lojaCodigo || 'N/A',
      lojaCompleta: metrica.loja?.nome || metrica.lojaNome || 'Nome da Loja',
      foto: metrica.foto || null,
      ultimaAuditoria: metrica.ultimaAtualizacao,
      conquistas: {
        totalConquistas: metrica.achievements?.stats?.totalUnlockedAchievements || 0,
        nivel: metrica.achievements?.level?.current || 1,
        titulo: metrica.achievements?.level?.title || 'Novato',
        xpTotal: metrica.achievements?.xp?.total || 0
      },
      desempenho: {
        posicaoLoja: metrica.ranking?.posicaoLoja || 0,
        posicaoGeral: metrica.ranking?.posicaoGeral || 0,
        pontuacaoTotal: metrica.totais?.pontuacaoTotal || 0
      },
      auditoriasPorTipo: {
        etiquetas: metrica.contadoresAuditorias?.totalEtiquetas || 0,
        rupturas: metrica.contadoresAuditorias?.totalRupturas || 0,
        presencas: metrica.contadoresAuditorias?.totalPresencas || 0
      },
      metricas: {
        etiquetas: metrica.etiquetas,
        rupturas: metrica.rupturas,
        presencas: metrica.presencas
      }
    }));

    const totalColaboradoresGeral = usuarios.length;

    // Obter estatísticas
    const mediaItensPorUsuario = usuarios.length > 0
      ? Math.round(usuarios.reduce((sum, u) => sum + u.contador, 0) / usuarios.length)
      : 0;

    // Encontrar melhor colaborador
    const melhorColaborador = usuarios.length > 0
      ? usuarios.reduce((prev, current) =>
          (prev.desempenho?.pontuacaoTotal || 0) > (current.desempenho?.pontuacaoTotal || 0) ? prev : current
        )
      : null;

    res.json({
      usuarios,
      totalColaboradoresGeral,
      mediaItensPorUsuario,
      melhorColaborador,
      estatisticas: {
        totalUsuarios: usuarios.length,
        mediaItensPorUsuario,
        melhorColaborador
      }
    });

  } catch (error) {
    console.error("❌ [MetricasUsuarios] Erro ao buscar métricas de usuários:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

/**
 * GET /metricas/usuarios/:usuarioId
 * Obtém métricas de um usuário específico em uma loja
 * Headers:
 *   - x-loja: código da loja (obrigatório)
 */
router.get('/metricas/usuarios/:usuarioId', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];
    const { usuarioId } = req.params;

    if (!lojaCodigo) {
      return res.status(400).json({ erro: "Código da loja é obrigatório" });
    }

    // Buscar a loja
    const loja = await Loja.findOne({ codigo: lojaCodigo });
    if (!loja) {
      return res.status(404).json({ erro: "Loja não encontrada" });
    }

    // Buscar métricas do usuário
    const metricas = await metricasUsuariosService.obterMetricasUsuario(loja._id, usuarioId);

    if (!metricas) {
      return res.status(404).json({ erro: "Métricas não encontradas para este usuário" });
    }

    // Formatar resposta
    const usuario = {
      id: metricas.usuarioId,
      nome: metricas.usuarioNome,
      loja: {
        codigo: metricas.loja?.codigo,
        nome: metricas.loja?.nome || metricas.lojaNome,
        endereco: metricas.loja?.endereco,
        imagem: metricas.loja?.imagem
      },
      periodo: {
        dataInicio: metricas.dataInicio,
        dataFim: metricas.dataFim
      },
      metricas: {
        etiquetas: metricas.etiquetas,
        rupturas: metricas.rupturas,
        presencas: metricas.presencas
      },
      totais: metricas.totais,
      totaisAcumulados: metricas.totaisAcumulados,
      contadores: metricas.contadoresAuditorias,
      ranking: metricas.ranking,
      tendencias: metricas.tendencias,
      historicoRanking: metricas.historicoRanking,
      achievements: metricas.achievements,
      ContadorClassesProduto: metricas.ContadorClassesProduto,
      ContadorLocais: metricas.ContadorLocais,
      ultimaAtualizacao: metricas.ultimaAtualizacao
    };

    res.json(usuario);

  } catch (error) {
    console.error("❌ [MetricasUsuarios] Erro ao buscar métricas do usuário:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

/**
 * POST /metricas/usuarios/calcular
 * Recalcula métricas de todos os usuários (período completo)
 * Endpoint administrativo para recalcular métricas
 */
router.post('/metricas/usuarios/calcular', async (req, res) => {
  try {
    console.log('🔄 [MetricasUsuarios] Iniciando recálculo de métricas...');

    const resultado = await metricasUsuariosService.calcularMetricasUsuarios();

    res.json({
      sucesso: true,
      mensagem: "Métricas de usuários recalculadas com sucesso",
      ...resultado
    });

  } catch (error) {
    console.error("❌ [MetricasUsuarios] Erro ao recalcular métricas:", error);
    res.status(500).json({
      erro: "Erro ao recalcular métricas",
      detalhes: error.message
    });
  }
});

/**
 * GET /datas-auditoria
 * Obtém datas de auditoria disponíveis para uma loja
 * Headers:
 *   - x-loja: código da loja (obrigatório)
 */
router.get('/datas-auditoria', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];

    if (!lojaCodigo) {
      return res.status(400).json({
        erro: "Código da loja é obrigatório"
      });
    }

    // Buscar a loja
    const loja = await Loja.findOne({ codigo: lojaCodigo });
    if (!loja) {
      return res.status(404).json({ erro: "Loja não encontrada" });
    }

    // Buscar métricas da loja
    const metricas = await metricasUsuariosService.obterMetricasLoja(loja._id);

    // Extrair datas únicas
    const datasUnicas = [...new Set(
      metricas.map(m => new Date(m.dataInicio).toISOString().split('T')[0])
    )];

    const datasFormatadas = datasUnicas.map(data => {
      const dataObj = new Date(data);
      return {
        data: data,
        dataFormatada: dataObj.toLocaleDateString('pt-BR'),
        timestamp: dataObj.getTime()
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // Mais recentes primeiro

    res.json(datasFormatadas);

  } catch (error) {
    console.error("❌ [MetricasUsuarios] Erro ao buscar datas de auditoria:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

export default router;
