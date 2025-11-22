import express from 'express';
import MetricasUsuario from '../models/MetricasUsuario.js';
import Loja from '../models/Loja.js';

const router = express.Router();

// Endpoint para obter métricas de usuários de uma loja específica
router.get('/metricas/usuarios', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];
    const { dataAuditoria, todos } = req.query;

    if (!lojaCodigo && todos !== 'true') {
      return res.status(400).json({
        erro: "Código da loja é obrigatório"
      });
    }

    // Consulta base
    const query = {};

    if (lojaCodigo && todos !== 'true') {
      // Primeiro, precisamos encontrar o ID da loja com base no código
      const loja = await Loja.findOne({ codigo: lojaCodigo });
      if (!loja) {
        return res.status(404).json({ erro: "Loja não encontrada" });
      }
      query.loja = loja._id;
    }

    // Se houver filtro de data
    if (dataAuditoria) {
      // Para dataAuditoria, ajustamos os critérios de acordo com o modelo
      const dataInicio = new Date(dataAuditoria);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + 1);
      
      query.dataInicio = { $gte: dataInicio };
      query.dataFim = { $lte: dataFim };
    }

    // Buscar métricas de usuários com populate da loja
    const metricas = await MetricasUsuario.find(query)
      .populate('loja', 'nome codigo endereco imagem')
      .sort({ 'totaisAcumulados.itensLidosTotal': -1, 'ranking.posicaoGeral': 1 });

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
      loja: metrica.loja?.codigo || metrica.lojaCodigo || lojaCodigo,
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
    console.error("Erro ao buscar métricas de usuários:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

// Endpoint para obter datas de auditoria disponíveis para uma loja
router.get('/datas-auditoria', async (req, res) => {
  try {
    const lojaCodigo = req.headers['x-loja'];

    if (!lojaCodigo) {
      return res.status(400).json({ 
        erro: "Código da loja é obrigatório" 
      });
    }

    // Buscar documentos MetricasUsuario para a loja e extrair datas únicas
    // Primeiro, precisamos encontrar o ID da loja com base no código
    const loja = await Loja.findOne({ codigo: lojaCodigo });
    if (!loja) {
      return res.status(404).json({ erro: "Loja não encontrada" });
    }

    const metricas = await MetricasUsuario.find({
      loja: loja._id
    })
    .select('dataInicio ultimaAtualizacao')
    .sort({ dataInicio: -1 });

    // Converter datas para o formato esperado pelo frontend
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
    });

    res.json(datasFormatadas);

  } catch (error) {
    console.error("Erro ao buscar datas de auditoria:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message
    });
  }
});

export default router;