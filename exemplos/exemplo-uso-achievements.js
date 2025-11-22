/**
 * Exemplo de Uso: Sistema de Conquistas
 *
 * Este arquivo demonstra como usar corretamente o sistema de conquistas
 * após as implementações da versão 3.1
 */

import MetricasUsuario from '../models/MetricasUsuario.js';
import Auditoria from '../models/Auditoria.js';

// ========== EXEMPLO 1: Processar Auditoria Completa ==========

/**
 * Processa uma auditoria e atualiza todas as métricas e conquistas
 */
export async function processarAuditoriaComAchievements(auditoriaData) {
  const {
    usuarioId,
    lojaId,
    periodoInicio,
    periodoFim,
    tipo, // 'etiquetas', 'rupturas' ou 'presencas'
    itensLidos,
    itensAtualizados,
    setor, // Ex: "G01A - G01A"
    dataAuditoria = new Date()
  } = auditoriaData;

  // 1. Buscar métricas do usuário (período completo)
  let metricas = await MetricasUsuario.findOne({
    usuarioId,
    loja: lojaId,
    periodo: 'periodo_completo',
    dataInicio: periodoInicio,
    dataFim: periodoFim
  });

  // Se não existir, criar novo documento
  if (!metricas) {
    metricas = new MetricasUsuario({
      usuarioId,
      usuarioNome: auditoriaData.usuarioNome || 'Usuário',
      loja: lojaId,
      lojaNome: auditoriaData.lojaNome || 'Loja',
      periodo: 'periodo_completo',
      dataInicio: periodoInicio,
      dataFim: periodoFim
    });
  }

  // 2. Atualizar contadores de auditorias
  metricas.contadoresAuditorias.totalGeral += 1;

  switch (tipo) {
    case 'etiquetas':
      metricas.contadoresAuditorias.totalEtiquetas += 1;
      metricas.etiquetas.itensLidos += itensLidos;
      metricas.etiquetas.itensAtualizados += itensAtualizados;
      metricas.totaisAcumulados.itensLidosEtiquetas += itensLidos;
      break;
    case 'rupturas':
      metricas.contadoresAuditorias.totalRupturas += 1;
      metricas.rupturas.itensLidos += itensLidos;
      metricas.rupturas.itensAtualizados += itensAtualizados;
      metricas.totaisAcumulados.itensLidosRupturas += itensLidos;
      break;
    case 'presencas':
      metricas.contadoresAuditorias.totalPresencas += 1;
      metricas.presencas.itensLidos += itensLidos;
      metricas.presencas.itensAtualizados += itensAtualizados;
      metricas.totaisAcumulados.itensLidosPresencas += itensLidos;
      break;
  }

  // 3. Atualizar total acumulado geral
  metricas.totaisAcumulados.itensLidosTotal += itensLidos;

  // 4. Atualizar ContadorLocais (para conquista team-player)
  if (setor && metricas.ContadorLocais) {
    const contagemAtual = metricas.ContadorLocais.get(setor) || 0;
    metricas.ContadorLocais.set(setor, contagemAtual + itensLidos);
  }

  // 5. ⭐ CALCULAR AUDITORIAS SEMANAIS (últimos 7 dias)
  const ultimaSemana = new Date();
  ultimaSemana.setDate(ultimaSemana.getDate() - 7);

  const weeklyAuditsCount = await Auditoria.countDocuments({
    usuarioId: usuarioId,
    loja: lojaId,
    createdAt: { $gte: ultimaSemana }
  });

  // 6. ⭐ ATUALIZAR TENDÊNCIAS (streak e weekly)
  const tendenciasAtualizadas = metricas.atualizarTendenciasParaAchievements(
    dataAuditoria,
    weeklyAuditsCount
  );

  console.log('📊 Tendências atualizadas:', tendenciasAtualizadas);

  // 7. ⭐ RECALCULAR TOTAIS E ACHIEVEMENTS
  metricas.atualizarTotais(); // Este método já chama calcularAchievements() internamente

  // 8. Salvar
  await metricas.save();

  // 9. ⭐ VERIFICAR CONQUISTAS DESBLOQUEADAS RECENTEMENTE
  const conquistasNovas = metricas.achievements.achievements.filter(ach => {
    if (!ach.unlocked || !ach.unlockedAt) return false;

    // Considera "nova" se foi desbloqueada nos últimos 10 segundos
    const agora = new Date();
    const dataDesbloqueio = new Date(ach.unlockedAt);
    const diffMs = agora - dataDesbloqueio;

    return diffMs < 10000; // 10 segundos
  });

  // 10. Retornar resultado
  return {
    metricas: {
      xpTotal: metricas.achievements.xp.total,
      xpFromProducts: metricas.achievements.xp.fromProducts,
      xpFromAchievements: metricas.achievements.xp.fromAchievements,
      nivel: metricas.achievements.level.current,
      titulo: metricas.achievements.level.title,
      progressoNivel: metricas.achievements.level.progressPercentage,
      totalAuditorias: metricas.contadoresAuditorias.totalGeral,
      totalItensLidos: metricas.totaisAcumulados.itensLidosTotal,
      currentStreak: metricas.tendencias.currentStreak,
      weeklyAudits: metricas.tendencias.weeklyAudits
    },
    conquistasNovas: conquistasNovas.map(ach => ({
      id: ach.achievementId,
      titulo: ach.achievementData?.title,
      descricao: ach.achievementData?.description,
      icone: ach.achievementData?.icon,
      pontos: ach.achievementData?.points,
      desbloqueadoEm: ach.unlockedAt
    })),
    todasConquistas: metricas.achievements.achievements.map(ach => ({
      id: ach.achievementId,
      titulo: ach.achievementData?.title,
      desbloqueado: ach.unlocked,
      progresso: ach.progress.current,
      meta: ach.progress.target,
      percentual: ach.progress.percentage
    }))
  };
}

// ========== EXEMPLO 2: Consultar Progresso de Conquistas ==========

/**
 * Consulta o progresso de todas as conquistas de um usuário
 */
export async function consultarProgressoConquistas(usuarioId, lojaId) {
  const metricas = await MetricasUsuario.findOne({
    usuarioId,
    loja: lojaId,
    periodo: 'periodo_completo'
  }).sort({ dataInicio: -1 }); // Mais recente

  if (!metricas) {
    return {
      encontrado: false,
      mensagem: 'Nenhuma métrica encontrada para este usuário'
    };
  }

  // Organizar conquistas por categoria
  const categorias = {
    audits: [],
    performance: [],
    consistency: [],
    participation: []
  };

  metricas.achievements.achievements.forEach(ach => {
    const categoria = ach.achievementData?.category || 'outros';
    if (categorias[categoria]) {
      categorias[categoria].push({
        id: ach.achievementId,
        titulo: ach.achievementData?.title,
        descricao: ach.achievementData?.description,
        icone: ach.achievementData?.icon,
        desbloqueado: ach.unlocked,
        progresso: ach.progress.current,
        meta: ach.progress.target,
        percentual: ach.progress.percentage,
        pontos: ach.achievementData?.points,
        dificuldade: ach.achievementData?.difficulty
      });
    }
  });

  return {
    encontrado: true,
    usuario: {
      id: metricas.usuarioId,
      nome: metricas.usuarioNome
    },
    resumo: {
      xpTotal: metricas.achievements.xp.total,
      nivel: metricas.achievements.level.current,
      titulo: metricas.achievements.level.title,
      progressoParaProximoNivel: metricas.achievements.level.progressPercentage,
      xpFaltante: metricas.achievements.level.xpForNextLevel,
      totalConquistasDesbloqueadas: metricas.achievements.stats.totalUnlockedAchievements,
      totalAuditorias: metricas.achievements.stats.totalAudits,
      totalItens: metricas.achievements.stats.totalItems
    },
    tendencias: {
      diasConsecutivos: metricas.tendencias.currentStreak,
      auditoriasSemanais: metricas.tendencias.weeklyAudits,
      ultimaAuditoria: metricas.tendencias.lastAuditDate
    },
    categorias
  };
}

// ========== EXEMPLO 3: Ranking de Usuários por XP ==========

/**
 * Retorna ranking de usuários por XP total
 */
export async function obterRankingPorXP(lojaId, limite = 10) {
  const ranking = await MetricasUsuario.find({
    loja: lojaId,
    periodo: 'periodo_completo'
  })
    .sort({ 'achievements.xp.total': -1 })
    .limit(limite)
    .select('usuarioId usuarioNome achievements.xp achievements.level contadoresAuditorias totaisAcumulados');

  return ranking.map((metricas, index) => ({
    posicao: index + 1,
    usuarioId: metricas.usuarioId,
    usuarioNome: metricas.usuarioNome,
    xpTotal: metricas.achievements.xp.total,
    nivel: metricas.achievements.level.current,
    titulo: metricas.achievements.level.title,
    totalAuditorias: metricas.contadoresAuditorias?.totalGeral || 0,
    totalItens: metricas.totaisAcumulados?.itensLidosTotal || 0
  }));
}

// ========== EXEMPLO 4: Verificar Conquista Específica ==========

/**
 * Verifica o progresso de uma conquista específica
 */
export async function verificarConquista(usuarioId, lojaId, achievementId) {
  const metricas = await MetricasUsuario.findOne({
    usuarioId,
    loja: lojaId,
    periodo: 'periodo_completo'
  }).sort({ dataInicio: -1 });

  if (!metricas) {
    return { encontrado: false };
  }

  const conquista = metricas.achievements.achievements.find(
    ach => ach.achievementId === achievementId
  );

  if (!conquista) {
    return { encontrado: false };
  }

  return {
    encontrado: true,
    conquista: {
      id: conquista.achievementId,
      titulo: conquista.achievementData?.title,
      descricao: conquista.achievementData?.description,
      icone: conquista.achievementData?.icon,
      categoria: conquista.achievementData?.category,
      dificuldade: conquista.achievementData?.difficulty,
      pontos: conquista.achievementData?.points,
      desbloqueado: conquista.unlocked,
      progresso: {
        atual: conquista.progress.current,
        meta: conquista.progress.target,
        percentual: conquista.progress.percentage,
        faltam: conquista.progress.target - conquista.progress.current
      },
      desbloqueadoEm: conquista.unlockedAt
    },
    fonteDados: obterFonteDadosConquista(achievementId, metricas)
  };
}

/**
 * Helper: Retorna a fonte de dados usada para cada conquista
 */
function obterFonteDadosConquista(achievementId, metricas) {
  const fontes = {
    'first-audit': {
      campo: 'contadoresAuditorias.totalGeral',
      valorAtual: metricas.contadoresAuditorias?.totalGeral || 0
    },
    'audit-enthusiast': {
      campo: 'contadoresAuditorias.totalGeral',
      valorAtual: metricas.contadoresAuditorias?.totalGeral || 0
    },
    'audit-master': {
      campo: 'contadoresAuditorias.totalGeral',
      valorAtual: metricas.contadoresAuditorias?.totalGeral || 0
    },
    'item-collector-100': {
      campo: 'totaisAcumulados.itensLidosTotal',
      valorAtual: metricas.totaisAcumulados?.itensLidosTotal || 0
    },
    'item-collector-500': {
      campo: 'totaisAcumulados.itensLidosTotal',
      valorAtual: metricas.totaisAcumulados?.itensLidosTotal || 0
    },
    'item-collector-1000': {
      campo: 'totaisAcumulados.itensLidosTotal',
      valorAtual: metricas.totaisAcumulados?.itensLidosTotal || 0
    },
    'perfect-accuracy': {
      campo: 'totais.percentualConclusaoGeral',
      valorAtual: metricas.totais?.percentualConclusaoGeral || 0
    },
    'team-player': {
      campo: 'ContadorLocais (setores > 0)',
      valorAtual: metricas.ContadorLocais
        ? Array.from(metricas.ContadorLocais.values()).filter(v => v > 0).length
        : 0
    },
    'consistent-auditor': {
      campo: 'tendencias.currentStreak',
      valorAtual: metricas.tendencias?.currentStreak || 0
    },
    'weekly-warrior': {
      campo: 'tendencias.weeklyAudits',
      valorAtual: metricas.tendencias?.weeklyAudits || 0
    }
  };

  return fontes[achievementId] || { campo: 'desconhecido', valorAtual: 0 };
}

// ========== EXEMPLO 5: Simular Progresso de Conquista ==========

/**
 * Simula quanto falta para desbloquear uma conquista
 */
export async function simularProgressoConquista(usuarioId, lojaId, achievementId) {
  const resultado = await verificarConquista(usuarioId, lojaId, achievementId);

  if (!resultado.encontrado) {
    return { erro: 'Conquista não encontrada' };
  }

  const { conquista, fonteDados } = resultado;

  if (conquista.desbloqueado) {
    return {
      status: 'desbloqueada',
      mensagem: `Conquista "${conquista.titulo}" já foi desbloqueada!`,
      desbloqueadoEm: conquista.desbloqueadoEm
    };
  }

  const faltam = conquista.progresso.faltam;
  const percentual = conquista.progresso.percentual;

  return {
    status: 'em_progresso',
    conquista: conquista.titulo,
    progresso: {
      atual: conquista.progresso.atual,
      meta: conquista.progresso.meta,
      faltam: faltam,
      percentualCompleto: percentual
    },
    fonteDados: {
      campo: fonteDados.campo,
      valorAtual: fonteDados.valorAtual
    },
    estimativa: gerarEstimativa(achievementId, faltam, conquista.progresso.atual)
  };
}

/**
 * Helper: Gera estimativa de como completar a conquista
 */
function gerarEstimativa(achievementId, faltam, atual) {
  const estimativas = {
    'first-audit': `Complete sua primeira auditoria!`,
    'audit-enthusiast': `Complete mais ${faltam} auditorias.`,
    'audit-master': `Complete mais ${faltam} auditorias.`,
    'item-collector-100': `Leia mais ${faltam} itens.`,
    'item-collector-500': `Leia mais ${faltam} itens.`,
    'item-collector-1000': `Leia mais ${faltam} itens.`,
    'perfect-accuracy': `Melhore sua precisão para ${faltam}% a mais.`,
    'team-player': `Trabalhe em mais ${faltam} setores diferentes.`,
    'consistent-auditor': `Continue fazendo auditorias por mais ${faltam} dias consecutivos.`,
    'weekly-warrior': `Faça mais ${faltam} auditorias esta semana.`
  };

  return estimativas[achievementId] || `Faltam ${faltam} para completar.`;
}

// ========== EXEMPLO DE USO COMPLETO ==========

/**
 * Exemplo prático de como usar em uma rota Express
 */
export const exemploRotaExpress = async (req, res) => {
  try {
    const {
      usuarioId,
      lojaId,
      tipo,
      itensLidos,
      itensAtualizados,
      setor
    } = req.body;

    // Processar auditoria
    const resultado = await processarAuditoriaComAchievements({
      usuarioId,
      lojaId,
      periodoInicio: new Date('2025-11-01'),
      periodoFim: new Date('2025-12-01'),
      tipo,
      itensLidos,
      itensAtualizados,
      setor,
      usuarioNome: req.user?.nome,
      lojaNome: req.loja?.nome
    });

    // Se houver conquistas novas, emitir evento ou notificação
    if (resultado.conquistasNovas.length > 0) {
      console.log('🎉 Novas conquistas desbloqueadas!', resultado.conquistasNovas);

      // Aqui você pode:
      // - Emitir evento via Socket.IO
      // - Enviar notificação push
      // - Registrar log
      // - etc.
    }

    res.json({
      sucesso: true,
      metricas: resultado.metricas,
      conquistasNovas: resultado.conquistasNovas,
      todasConquistas: resultado.todasConquistas
    });

  } catch (error) {
    console.error('Erro ao processar auditoria:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};

export default {
  processarAuditoriaComAchievements,
  consultarProgressoConquistas,
  obterRankingPorXP,
  verificarConquista,
  simularProgressoConquista,
  exemploRotaExpress
};
