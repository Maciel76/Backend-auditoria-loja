import express from "express";
import DashboardActivity from "../models/DashboardActivity.js";
import VotingItem from "../models/VotingItem.js";
import { Achievement, UserAchievement } from "../models/UserAchievement.js";

const router = express.Router();

// Middleware para extrair loja do header
const extractLoja = (req, res, next) => {
  req.loja = req.headers['x-loja'] || null;
  next();
};

// GET /api/dashboard/stats - Estatísticas gerais
router.get('/stats', extractLoja, async (req, res) => {
  try {
    const { loja } = req;

    // Contar atividades ativas
    const activeActivities = await DashboardActivity.countDocuments({
      status: 'active',
      $or: [
        { loja: loja },
        { loja: { $exists: false } }
      ]
    });

    // Contar sugestões aceitas (com resposta admin)
    const acceptedSuggestions = await DashboardActivity.countDocuments({
      type: 'suggestion',
      'adminResponse.text': { $exists: true },
      status: 'active'
    });

    // Contar items em desenvolvimento
    const inDevelopment = await VotingItem.countDocuments({
      status: 'in-progress',
      isActive: true
    });

    // Simular usuários online (seria implementado com websockets/sessions)
    const onlineUsers = Math.floor(Math.random() * 50) + 10;

    const stats = {
      activeAudits: activeActivities,
      onlineUsers: onlineUsers,
      acceptedSuggestions: acceptedSuggestions,
      inDevelopment: inDevelopment,
      totalLojas: 10,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar estatísticas',
      error: error.message
    });
  }
});

// GET /api/dashboard/feed - Feed de atividades
router.get('/feed', extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const limit = parseInt(req.query.limit) || 10;

    const activities = await DashboardActivity.getActiveByLoja(loja, limit);

    // Formatar para o formato esperado pelo frontend
    const feedItems = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      votes: activity.votes,
      comments: activity.comments,
      time: formatRelativeTime(activity.createdAt),
      badge: activity.badge,
      user: activity.user,
      adminResponse: activity.adminResponse
    }));

    res.json({
      success: true,
      feed: feedItems
    });

  } catch (error) {
    console.error('Erro ao buscar feed:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar feed',
      error: error.message
    });
  }
});

// GET /api/dashboard/voting - Items de votação
router.get('/voting', extractLoja, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const votingItems = await VotingItem.getActiveItems(limit);

    // Formatar para o formato esperado pelo frontend
    const formattedItems = votingItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      votes: item.votes,
      userVoted: false // Seria verificado com ID do usuário
    }));

    res.json({
      success: true,
      voting: formattedItems
    });

  } catch (error) {
    console.error('Erro ao buscar votação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar items de votação',
      error: error.message
    });
  }
});

// POST /api/dashboard/vote/:id - Votar em item
router.post('/vote/:id', extractLoja, async (req, res) => {
  try {
    const { id } = req.params;
    const { loja } = req;

    // Por enquanto usar um userId fake - seria extraído do token/session
    const userId = req.body.userId || 'user_' + Date.now();

    const votingItem = await VotingItem.findOne({ id, isActive: true });

    if (!votingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    const result = await votingItem.addVote(userId, loja);

    res.json(result);

  } catch (error) {
    console.error('Erro ao votar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar voto',
      error: error.message
    });
  }
});

// GET /api/dashboard/achievements - Conquistas do usuário
router.get('/achievements', extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.query.user || 'user_demo'; // Seria extraído do token

    let userAchievements = await UserAchievement.getUserAchievements(userId, loja);

    // Se não existem conquistas para este usuário, criar as básicas
    if (userAchievements.length === 0) {
      await initializeUserAchievements(userId, loja);
      userAchievements = await UserAchievement.getUserAchievements(userId, loja);
    }

    // Formatar para o frontend
    const achievements = userAchievements.map(achievement => ({
      id: achievement.achievementId,
      title: achievement.achievementData.title,
      description: achievement.achievementData.description,
      unlocked: achievement.unlocked,
      icon: achievement.achievementData.icon,
      type: achievement.unlocked ? 'unlocked' :
            achievement.progress.percentage > 0 ? 'progress' : 'locked',
      progress: achievement.progress.percentage
    }));

    res.json({
      success: true,
      achievements
    });

  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar conquistas',
      error: error.message
    });
  }
});

// POST /api/dashboard/suggestion - Nova sugestão (já existe na rota de sugestões)
// Esta rota pode ser um alias para manter compatibilidade
router.post('/suggestion', extractLoja, async (req, res) => {
  try {
    const { sugestao, email } = req.body;
    const { loja } = req;

    if (!sugestao || sugestao.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sugestão é obrigatória'
      });
    }

    // Criar atividade no dashboard
    const activity = new DashboardActivity({
      id: 'suggestion_' + Date.now(),
      type: 'suggestion',
      title: `💡 ${sugestao.substring(0, 50)}${sugestao.length > 50 ? '...' : ''}`,
      description: sugestao,
      user: {
        name: email ? email.split('@')[0] : 'Anônimo',
        avatar: email ? email.substring(0, 2).toUpperCase() : 'AN'
      },
      loja
    });

    await activity.save();

    res.json({
      success: true,
      message: 'Sugestão enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao salvar sugestão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar sugestão',
      error: error.message
    });
  }
});

// Função auxiliar para inicializar conquistas básicas do usuário
async function initializeUserAchievements(userId, loja) {
  const basicAchievements = [
    {
      achievementId: 'first-audit',
      title: 'Primeira Auditoria',
      description: 'Concluiu sua primeira auditoria',
      icon: '🔍',
      type: 'unlocked',
      category: 'audits',
      target: 1
    },
    {
      achievementId: 'active-suggester',
      title: 'Sugestor Ativo',
      description: 'Enviou 5+ sugestões',
      icon: '💡',
      type: 'progress',
      category: 'suggestions',
      target: 5
    },
    {
      achievementId: 'top-collaborator',
      title: 'Top Colaborador',
      description: 'Fique entre os 3 melhores do mês',
      icon: '🏅',
      type: 'locked',
      category: 'performance',
      target: 3
    },
    {
      achievementId: 'experienced-auditor',
      title: 'Auditor Experiente',
      description: '3/10 auditorias concluídas',
      icon: '📊',
      type: 'progress',
      category: 'audits',
      target: 10
    }
  ];

  const userAchievements = basicAchievements.map(achievement => ({
    userId,
    userName: `User ${userId}`,
    loja,
    achievementId: achievement.achievementId,
    unlocked: achievement.type === 'unlocked',
    progress: {
      current: achievement.type === 'unlocked' ? achievement.target :
               achievement.type === 'progress' ? Math.floor(achievement.target * 0.3) : 0,
      target: achievement.target
    },
    achievementData: achievement,
    unlockedAt: achievement.type === 'unlocked' ? new Date() : null
  }));

  await UserAchievement.insertMany(userAchievements);
}

// Função auxiliar para formatação de tempo relativo
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} horas`;
  if (diffDays < 7) return `${diffDays} dias`;
  return new Date(date).toLocaleDateString();
}

export default router;