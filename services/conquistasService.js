// backend/services/conquistasService.js
import UserDailyMetrics from '../models/UserDailyMetrics.js';
import Auditoria from '../models/Auditoria.js';
import Conquista from '../models/Conquista.js';

class ConquistasService {
  constructor() {
    // Definição das conquistas disponíveis com regras mais detalhadas
    this.tiposConquistas = {
      PRIMEIRA_AUDITORIA: {
        id: 'PRIMEIRA_AUDITORIA',
        title: 'Primeira Auditoria',
        description: 'Realize sua primeira auditoria',
        icon: '🔍',
        category: 'auditoria',
        difficulty: 'easy',
        rarity: 'Basica', // Primeira conquista, fácil de obter
        points: 10,
        fixedXpValue: 10, // Valor fixo de XP para esta conquista
        tipo: 'unica',
        condicoes: {
          tipo: 'count',
          campo: 'totalAuditorias',
          valor: 1,
          descricao: 'Completar 1 auditoria'
        }
      },
      DEZ_AUDITORIAS: {
        id: 'DEZ_AUDITORIAS',
        title: 'Dez Auditorias',
        description: 'Complete 10 auditorias',
        icon: '📊',
        category: 'auditoria',
        difficulty: 'medium',
        rarity: 'Comum', // Meta razoável
        points: 50,
        fixedXpValue: 60, // Valor fixo de XP para esta conquista
        tipo: 'unica',
        condicoes: {
          tipo: 'count',
          campo: 'totalAuditorias',
          valor: 10,
          descricao: 'Completar 10 auditorias'
        }
      },
      PERFECCIONISTA: {
        id: 'PERFECCIONISTA',
        title: 'Perfeccionista',
        description: 'Obtenha 100% de acerto em uma auditoria',
        icon: '🎯',
        category: 'performance',
        difficulty: 'hard',
        rarity: 'Raro', // Exige perfeição em uma auditoria
        points: 75,
        fixedXpValue: 100, // Valor fixo de XP para esta conquista rara
        tipo: 'progressiva',
        condicoes: {
          tipo: 'porcentagem',
          campo: 'acertoPorcentagem',
          valor: 100,
          descricao: 'Obter 100% de acerto em uma auditoria'
        }
      },
      MIL_ITENS_LIDOS: {
        id: 'MIL_ITENS_LIDOS',
        title: 'Leitor Ávido',
        description: 'Leia 1000 itens',
        icon: '📖',
        category: 'volume',
        difficulty: 'hard',
        rarity: 'Raro', // Meta desafiadora
        points: 100,
        fixedXpValue: 120, // Valor fixo de XP para esta conquista rara
        tipo: 'unica',
        condicoes: {
          tipo: 'count',
          campo: 'contador',
          valor: 1000,
          descricao: 'Ler 1000 itens'
        }
      },
      SEMANA_PERFEITA: {
        id: 'SEMANA_PERFEITA',
        title: 'Semana Perfeita',
        description: 'Mantenha 100% de acerto por 7 dias seguidos',
        icon: '📅',
        category: 'consistencia',
        difficulty: 'hard',
        rarity: 'Epico', // Exige alto desempenho contínuo
        points: 150,
        fixedXpValue: 200, // Valor fixo de XP para esta conquista épica
        tipo: 'progressiva',
        condicoes: {
          tipo: 'streak',
          campo: 'acertoPorcentagem',
          valor: 100,
          periodo: 7, // Dias consecutivos
          descricao: 'Manter 100% de acerto por 7 dias seguidos'
        }
      },
      // Mais conquistas podem ser adicionadas aqui
    };
  }

  /**
   * Verifica se há novas conquistas desbloqueadas para um usuário
   */
  async verificarConquistas(usuarioId, loja) {
    try {
      // Obter métricas do usuário
      const metricas = await UserDailyMetrics.findOne({
        usuarioId,
        loja
      }).sort({ createdAt: -1 });

      if (!metricas) {
        return { conquistasDesbloqueadas: [] };
      }

      // Obter últimas auditorias do usuário
      const auditorias = await Auditoria.find({
        usuarioId,
        loja
      }).sort({ createdAt: -1 }).limit(20); // Aumentei o limite para mais contexto

      const conquistasDisponiveis = Object.values(this.tiposConquistas);
      const conquistasUsuario = await Conquista.find({ usuarioId, loja });
      const idsConquistasUsuario = conquistasUsuario.map(c => c.tipo);

      const conquistasDesbloqueadas = [];

      for (const conquista of conquistasDisponiveis) {
        // Verificar se já foi desbloqueada
        if (idsConquistasUsuario.includes(conquista.id)) {
          continue;
        }

        // Verificar condições para desbloqueio
        const desbloqueada = await this.verificarCondicoes(conquista, metricas, auditorias);

        if (desbloqueada) {
          // Salvar conquista no banco
          const novaConquista = new Conquista({
            usuarioId,
            loja,
            tipo: conquista.id,
            title: conquista.title,
            description: conquista.description,
            icon: conquista.icon,
            category: conquista.category,
            difficulty: conquista.difficulty,
            rarity: conquista.rarity,
            fixedXpValue: conquista.fixedXpValue,
            points: conquista.points,
            unlockedAt: new Date(),
            achievementId: conquista.id
          });

          await novaConquista.save();
          conquistasDesbloqueadas.push(novaConquista);

          // Atualizar XP do usuário
          await this.atualizarXpUsuario(usuarioId, loja, conquista.points);

          console.log(`🏆 Novo desbloqueio! ${conquista.title} para o usuário ${usuarioId}`);
        }
      }

      return { conquistasDesbloqueadas };
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      throw error;
    }
  }

  /**
   * Verifica se as condições de uma conquista foram atendidas
   */
  async verificarCondicoes(conquista, metricas, auditorias) {
    const condicoes = conquista.condicoes;

    switch (condicoes.tipo) {
      case 'count':
        // Verifica se um campo de métricas atinge um valor específico
        const valorAtual = metricas[condicoes.campo] || 0;
        return valorAtual >= condicoes.valor;

      case 'porcentagem':
        // Verifica se alguma auditoria atende à condição de porcentagem
        return auditorias.some(auditoria => {
          const valorAudit = auditoria[condicoes.campo];
          return valorAudit !== undefined && valorAudit >= condicoes.valor;
        });

      case 'streak':
        // Verifica sequências (ex: dias consecutivos com certa performance)
        return this.verificarStreak(conquista, usuarioId, loja, condicoes);

      default:
        return false;
    }
  }

  /**
   * Verifica sequências (streaks) como conquistas de consistência
   */
  async verificarStreak(conquista, usuarioId, loja, condicoes) {
    if (condicoes.periodo) {
      // Verificar se o usuário teve desempenho consistente por N dias consecutivos
      const diasNecessarios = condicoes.periodo;
      const hoje = new Date();

      // Verificar os últimos N dias
      for (let i = 0; i < diasNecessarios; i++) {
        const dia = new Date(hoje);
        dia.setDate(dia.getDate() - i);

        // Zerar hora para comparação de datas
        dia.setHours(0, 0, 0, 0);

        // Verificar se o usuário teve auditorias com o desempenho necessário nesse dia
        const inicioDia = new Date(dia);
        const fimDia = new Date(dia);
        fimDia.setHours(23, 59, 59, 999);

        const auditoriasDia = await Auditoria.find({
          usuarioId,
          loja,
          data: { $gte: inicioDia, $lte: fimDia }
        });

        if (auditoriasDia.length === 0) {
          // Nenhum dado para esse dia, streak quebrada
          return false;
        }

        // Verificar se todas as auditorias do dia atendem às condições
        const todasAtendem = auditoriasDia.every(auditoria => {
          const valorAudit = auditoria[condicoes.campo];
          return valorAudit !== undefined && valorAudit >= condicoes.valor;
        });

        if (!todasAtendem) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Atualiza o XP do usuário quando uma conquista é desbloqueada
   */
  async atualizarXpUsuario(usuarioId, loja, pontos) {
    try {
      // Atualizar métricas do usuário com os novos pontos de conquista
      const result = await UserDailyMetrics.updateOne(
        { usuarioId, loja },
        {
          $inc: {
            xpConquistas: pontos,
            xpTotal: pontos
          },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ ${pontos} pontos de XP adicionados ao usuário ${usuarioId}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar XP do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém as conquistas desbloqueadas de um usuário
   */
  async getConquistasUsuario(usuarioId, loja) {
    try {
      const conquistas = await Conquista.find({ usuarioId, loja }).sort({ unlockedAt: -1 });

      // Garantir que todas as conquistas tenham o campo de raridade
      return conquistas.map(conquista => ({
        ...conquista.toObject(),
        rarity: conquista.rarity || 'Comum' // Valor padrão se não estiver definido
      }));
    } catch (error) {
      console.error('Erro ao buscar conquistas do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as conquistas possíveis no sistema
   */
  async getTodasConquistas() {
    try {
      // Retorna todas as conquistas possíveis
      const conquistas = Object.values(this.tiposConquistas);

      // Garantir que todas as conquistas tenham o campo de raridade
      return conquistas.map(conquista => ({
        ...conquista,
        rarity: conquista.rarity || 'Comum' // Valor padrão se não estiver definido
      }));
    } catch (error) {
      console.error('Erro ao buscar todas as conquistas:', error);
      throw error;
    }
  }

  /**
   * Calcula progresso para conquistas progressivas
   */
  async calcularProgressoConquista(conquista, metricas, auditorias) {
    const condicoes = conquista.condicoes;

    switch (condicoes.tipo) {
      case 'count':
        const valorAtual = metricas[condicoes.campo] || 0;
        return Math.min(100, Math.round((valorAtual / condicoes.valor) * 100));

      case 'porcentagem':
        const atingiramValor = auditorias.filter(auditoria => {
          const valorAudit = auditoria[condicoes.campo];
          return valorAudit !== undefined && valorAudit >= condicoes.valor;
        });
        return Math.min(100, Math.round((atingiramValor.length / auditorias.length) * 100));

      default:
        return 0;
    }
  }
}

export default new ConquistasService();