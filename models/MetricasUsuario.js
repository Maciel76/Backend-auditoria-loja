// models/MetricasUsuario.js - VERSÃO ATUALIZADA
import mongoose from "mongoose";

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
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensDesatualizado: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensSemEstoque: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensNaopertence: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      percentualConclusao: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      }, // % em relação ao total da loja
    },

    rupturas: {
      totalItens: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensDesatualizado: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensSemEstoque: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensNaopertence: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      percentualConclusao: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      }, // % em relação ao total da loja
      custoTotalRuptura: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      custoMedioRuptura: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    presencas: {
      totalItens: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensDesatualizado: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensSemEstoque: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensNaopertence: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      percentualConclusao: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      }, // % em relação ao total da loja
      presencasConfirmadas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      percentualPresenca: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
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
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidos: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensAtualizados: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      percentualConclusaoGeral: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      pontuacaoTotal: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    // Desempenho e ranking
    ranking: {
      posicaoLoja: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicaoGeral: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      pontosPorItem: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      bonusConsistencia: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    // Análise temporal
    tendencias: {
      melhoriaPercentual: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      diasAtivos: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      mediaItensPerDia: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      regularidade: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    // Contadores de auditorias por tipo
    contadoresAuditorias: {
      totalEtiquetas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      totalRupturas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      totalPresencas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      totalGeral: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    // Totais acumulados de itens lidos
    totaisAcumulados: {
      itensLidosEtiquetas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidosRupturas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidosPresencas: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      itensLidosTotal: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
    },

    // Histórico de posições no ranking
    historicoRanking: {
      posicao1: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao2: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao3: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao4: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao5: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao6: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao7: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao8: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao9: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      posicao10: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      ACIMA10: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        } // NOVO CAMPO
      },
      totalTop10: {
        type: Number,
        default: 0,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
      },
      melhorPosicao: {
        type: Number,
        default: null,
        set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? null : numValue;
        }
      },
    },

    // Dados de conquistas e gamificação
    achievements: {
      xp: {
        total: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
        fromAchievements: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
        fromActivities: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
      },
      level: {
        current: {
          type: Number,
          default: 1,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 1 : numValue;
        }
        },
        title: { type: String, default: "Novato" },
        xpForNextLevel: {
          type: Number,
          default: 100,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 100 : numValue;
        }
        },
        progressPercentage: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
      },
      stats: {
        totalUnlockedAchievements: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
        totalAudits: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
        totalItems: {
          type: Number,
          default: 0,
          set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
        },
        lastActivityAt: { type: Date },
      },
      achievements: {
        type: [{
          achievementId: { type: String, required: true },
          unlocked: { type: Boolean, default: false },
          progress: {
            current: {
              type: Number,
              default: 0,
              set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
            },
            target: {
              type: Number,
              required: true,
              set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
            },
            percentage: {
              type: Number,
              default: 0,
              min: 0,
              max: 100,
              set: function(value) {
          const numValue = Number(value);
          return value == null || isNaN(numValue) ? 0 : numValue;
        }
            },
          },
          unlockedAt: { type: Date },
          unlockedBy: { type: String }, // ID da ação que desbloqueou
          achievementData: { type: mongoose.Schema.Types.Mixed, default: {} },
        }],
        default: function() {
          // Retornar array inicializado com todas as conquistas
          const achievementRules = {
            "first-audit": {
              title: "Primeira Auditoria",
              description: "Concluiu sua primeira auditoria",
              icon: "🔍",
              category: "audits",
              difficulty: "easy",
              points: 10,
              criteria: { type: "count", target: 1, description: "Realizar 1 auditoria atualizada" },
            },
            "audit-enthusiast": {
              title: "Entusiasta de Auditoria",
              description: "Concluiu 10 auditorias atualizadas",
              icon: "📊",
              category: "audits",
              difficulty: "medium",
              points: 25,
              criteria: { type: "count", target: 10, description: "Realizar 10 auditorias atualizadas" },
            },
            "audit-master": {
              title: "Mestre de Auditoria",
              description: "Concluiu 50 auditorias atualizadas",
              icon: "🏆",
              category: "audits",
              difficulty: "hard",
              points: 50,
              criteria: { type: "count", target: 50, description: "Realizar 50 auditorias atualizadas" },
            },
            "consistent-auditor": {
              title: "Auditor Consistente",
              description: "Realizou auditorias por 5 dias consecutivos",
              icon: "📅",
              category: "consistency",
              difficulty: "medium",
              points: 30,
              criteria: { type: "streak", target: 5, description: "Realizar auditorias por 5 dias consecutivos" },
            },
            "weekly-warrior": {
              title: "Guerreiro Semanal",
              description: "Realizou 5 auditorias em uma semana",
              icon: "🔥",
              category: "performance",
              difficulty: "medium",
              points: 20,
              criteria: { type: "count", target: 5, period: 7, description: "Realizar 5 auditorias em uma semana" },
            },
            "item-collector-100": {
              title: "Colecionador",
              description: "Leu 100 itens",
              icon: "💯",
              category: "performance",
              difficulty: "easy",
              points: 15,
              criteria: { type: "count", target: 100, description: "Ler 100 itens" },
            },
            "item-collector-500": {
              title: "Meta Batida",
              description: "Leu 500 itens",
              icon: "🎯",
              category: "performance",
              difficulty: "medium",
              points: 50,
              criteria: { type: "count", target: 500, description: "Ler 500 itens" },
            },
            "item-collector-1000": {
              title: "Maratona",
              description: "Leu 1000 itens",
              icon: "🏅",
              category: "performance",
              difficulty: "hard",
              points: 100,
              criteria: { type: "count", target: 1000, description: "Ler 1000 itens" },
            },
            "perfect-accuracy": {
              title: "Precisão Perfeita",
              description: "Manteve 95% de precisão",
              icon: "🎯",
              category: "performance",
              difficulty: "hard",
              points: 40,
              criteria: { type: "percentage", target: 95, description: "Manter 95% de precisão" },
            },
            "team-player": {
              title: "Jogador de Equipe",
              description: "Trabalhou em 3 setores diferentes",
              icon: "🤝",
              category: "participation",
              difficulty: "medium",
              points: 20,
              criteria: { type: "count", target: 3, description: "Trabalhar em 3 setores diferentes" },
            }
          };

          return Object.keys(achievementRules).map(achievementId => ({
            achievementId: achievementId,
            unlocked: false,
            progress: {
              current: 0,
              target: achievementRules[achievementId].criteria.target,
              percentage: 0
            },
            achievementData: achievementRules[achievementId]
          }));
        }
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
  }
);

// Índices compostos - ATUALIZADOS PARA PERÍODO COMPLETO
metricasUsuarioSchema.index({ loja: 1, dataInicio: -1 });
metricasUsuarioSchema.index({ loja: 1, usuarioId: 1 });
metricasUsuarioSchema.index({
  dataInicio: -1,
  "totais.pontuacaoTotal": -1,
});
metricasUsuarioSchema.index({ loja: 1, "ranking.posicaoLoja": 1 });

// Índice único para evitar duplicatas - REMOVER PERÍODO
metricasUsuarioSchema.index(
  { loja: 1, usuarioId: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos - ATUALIZADOS PARA PERÍODO COMPLETO
metricasUsuarioSchema.statics.obterRankingLoja = function (
  lojaId,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: lojaId,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .sort({ "totais.pontuacaoTotal": -1 })
    .limit(50);
};

metricasUsuarioSchema.statics.obterMetricasUsuario = function (
  usuarioId,
  lojaId,
  dataInicio,
  dataFim
) {
  return this.findOne({
    usuarioId: usuarioId,
    loja: lojaId,
    $or: [
      { dataInicio: { $gte: dataInicio, $lte: dataFim } },
      { dataFim: { $gte: dataInicio, $lte: dataFim } },
      { $and: [{ dataInicio: { $lte: dataInicio } }, { dataFim: { $gte: dataFim } }] }
    ]
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
    this.presencas.itensLidos;
  this.totais.itensAtualizados =
    this.etiquetas.itensAtualizados +
    this.rupturas.itensAtualizados +
    this.presencas.itensAtualizados;

  if (this.totais.totalItens > 0) {
    this.totais.percentualConclusaoGeral = Math.round(
      (this.totais.itensAtualizados / this.totais.totalItens) * 100
    );
  }

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();

  // Atualizar também as conquistas com base nas métricas atualizadas
  this.calcularAchievements();
};

// Método para atualizar os dados de conquistas a partir do UserAchievement
metricasUsuarioSchema.methods.atualizarAchievements = function (userAchievementDoc) {
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
  if (userAchievementDoc.achievements && Array.isArray(userAchievementDoc.achievements)) {
    this.achievements.achievements = userAchievementDoc.achievements.map(ach => ({
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
    }));
  }

  // Atualizar data de última atualização
  this.ultimaAtualizacao = new Date();
};

// Método para calcular conquistas com base nos próprios dados do modelo
metricasUsuarioSchema.methods.calcularAchievements = function () {
  // Atualizar estrutura de achievements com base nas métricas atuais
  const currentItensLidos = this.totais.itensAtualizados;
  const currentAudits = this.totais.itensAtualizados; // Considerando cada item lido como uma "auditoria atualizada"

  // Obter total de setores únicos a partir do ContadorLocais
  let setoresUnicos = 0;
  if (this.ContadorLocais) {
    setoresUnicos = Array.from(this.ContadorLocais.values()).filter(value => value > 0).length;
  }

  // Calcular precisão geral
  const precisaoGeral = this.totais.totalItens > 0
    ? (this.totais.itensAtualizados / this.totais.totalItens) * 100
    : 0;

  // Atualizar o array de conquistas existente com base nos dados atuais
  for (let i = 0; i < this.achievements.achievements.length; i++) {
    const achievement = this.achievements.achievements[i];
    let currentProgress = 0;

    // Calcular progresso com base nas métricas atuais
    switch (achievement.achievementId) {
      case "first-audit":
      case "audit-enthusiast":
      case "audit-master":
        currentProgress = this.totais.itensAtualizados;
        break;
      case "item-collector-100":
      case "item-collector-500":
      case "item-collector-1000":
        currentProgress = this.totais.itensAtualizados; // Itens lidos são os itens atualizados
        break;
      case "perfect-accuracy":
        currentProgress = precisaoGeral;
        break;
      case "team-player":
        currentProgress = setoresUnicos;
        break;
      case "consistent-auditor":
      case "weekly-warrior":
        // Para conquistas de dias consecutivos e semanais, usar os dados atuais como 0 por enquanto
        // Estas podem precisar de lógica adicional baseada em histórico
        currentProgress = 0;
        break;
      default:
        currentProgress = 0;
    }

    const target = achievement.achievementData?.criteria?.target || 0;
    const percentage = target > 0 ? Math.min(Math.round((currentProgress / target) * 100), 100) : 0;
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
  }

  // Calcular estatísticas de conquistas
  const unlockedCount = this.achievements.achievements.filter(ach => ach.unlocked).length;
  this.achievements.stats.totalUnlockedAchievements = unlockedCount;
  this.achievements.stats.totalAudits = this.totais.itensAtualizados;
  this.achievements.stats.totalItems = this.totais.itensAtualizados;
  this.achievements.stats.lastActivityAt = new Date();

  // Calcular XP baseado em conquistas desbloqueadas
  let xpFromAchievements = 0;
  this.achievements.achievements.forEach(achievement => {
    if (achievement.unlocked && achievement.achievementData?.points) {
      xpFromAchievements += achievement.achievementData.points;
    }
  });

  // Calcular XP total (mantendo o XP anterior de atividades se existir)
  const xpFromActivities = this.achievements.xp.fromActivities || currentItensLidos; // Usar itens lidos como XP base
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
metricasUsuarioSchema.methods.calcularLevel = function(xp) {
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
metricasUsuarioSchema.methods.getLevelTitle = function(level) {
  const titles = {
    1: "Novato",
    2: "Iniciante",
    3: "Aprendiz",
    5: "Competente",
    8: "Experiente",
    12: "Veterano",
    16: "Especialista",
    20: "Mestre",
    25: "Auditor Senior",
    30: "Lenda",
    40: "Elite",
    50: "Supremo",
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
metricasUsuarioSchema.pre('save', function(next) {
  // Ensure contadoresAuditorias fields are numbers
  if (this.contadoresAuditorias) {
    this.contadoresAuditorias.totalEtiquetas = Number(this.contadoresAuditorias.totalEtiquetas) || 0;
    this.contadoresAuditorias.totalRupturas = Number(this.contadoresAuditorias.totalRupturas) || 0;
    this.contadoresAuditorias.totalPresencas = Number(this.contadoresAuditorias.totalPresencas) || 0;
    this.contadoresAuditorias.totalGeral = Number(this.contadoresAuditorias.totalGeral) || 0;
  }

  // Ensure totais fields are numbers
  if (this.totais) {
    this.totais.totalItens = Number(this.totais.totalItens) || 0;
    this.totais.itensLidos = Number(this.totais.itensLidos) || 0;
    this.totais.itensAtualizados = Number(this.totais.itensAtualizados) || 0;
    this.totais.percentualConclusaoGeral = Number(this.totais.percentualConclusaoGeral) || 0;
    this.totais.pontuacaoTotal = Number(this.totais.pontuacaoTotal) || 0;
  }

  // Ensure other numeric fields are numbers
  if (this.tendencias) {
    this.tendencias.melhoriaPercentual = Number(this.tendencias.melhoriaPercentual) || 0;
    this.tendencias.diasAtivos = Number(this.tendencias.diasAtivos) || 0;
    this.tendencias.mediaItensPerDia = Number(this.tendencias.mediaItensPerDia) || 0;
    this.tendencias.regularidade = Number(this.tendencias.regularidade) || 0;
  }

  if (this.ranking) {
    this.ranking.posicaoLoja = Number(this.ranking.posicaoLoja) || 0;
    this.ranking.posicaoGeral = Number(this.ranking.posicaoGeral) || 0;
    this.ranking.pontosPorItem = Number(this.ranking.pontosPorItem) || 0;
    this.ranking.bonusConsistencia = Number(this.ranking.bonusConsistencia) || 0;
  }

  if (this.historicoRanking) {
    this.historicoRanking.posicao1 = Number(this.historicoRanking.posicao1) || 0;
    this.historicoRanking.posicao2 = Number(this.historicoRanking.posicao2) || 0;
    this.historicoRanking.posicao3 = Number(this.historicoRanking.posicao3) || 0;
    this.historicoRanking.posicao4 = Number(this.historicoRanking.posicao4) || 0;
    this.historicoRanking.posicao5 = Number(this.historicoRanking.posicao5) || 0;
    this.historicoRanking.posicao6 = Number(this.historicoRanking.posicao6) || 0;
    this.historicoRanking.posicao7 = Number(this.historicoRanking.posicao7) || 0;
    this.historicoRanking.posicao8 = Number(this.historicoRanking.posicao8) || 0;
    this.historicoRanking.posicao9 = Number(this.historicoRanking.posicao9) || 0;
    this.historicoRanking.posicao10 = Number(this.historicoRanking.posicao10) || 0;
    this.historicoRanking.ACIMA10 = Number(this.historicoRanking.ACIMA10) || 0;
    this.historicoRanking.totalTop10 = Number(this.historicoRanking.totalTop10) || 0;
    this.historicoRanking.melhorPosicao = Number(this.historicoRanking.melhorPosicao) || null;
  }

  if (this.totaisAcumulados) {
    this.totaisAcumulados.itensLidosEtiquetas = Number(this.totaisAcumulados.itensLidosEtiquetas) || 0;
    this.totaisAcumulados.itensLidosRupturas = Number(this.totaisAcumulados.itensLidosRupturas) || 0;
    this.totaisAcumulados.itensLidosPresencas = Number(this.totaisAcumulados.itensLidosPresencas) || 0;
    this.totaisAcumulados.itensLidosTotal = Number(this.totaisAcumulados.itensLidosTotal) || 0;
  }

  // Ensure achievement XP and level fields are numbers
  if (this.achievements && this.achievements.xp) {
    this.achievements.xp.total = Number(this.achievements.xp.total) || 0;
    this.achievements.xp.fromAchievements = Number(this.achievements.xp.fromAchievements) || 0;
    this.achievements.xp.fromActivities = Number(this.achievements.xp.fromActivities) || 0;
  }

  if (this.achievements && this.achievements.level) {
    this.achievements.level.current = Number(this.achievements.level.current) || 1;
    this.achievements.level.xpForNextLevel = Number(this.achievements.level.xpForNextLevel) || 100;
    this.achievements.level.progressPercentage = Number(this.achievements.level.progressPercentage) || 0;
  }

  // Ensure stat fields are numbers
  if (this.achievements && this.achievements.stats) {
    this.achievements.stats.totalUnlockedAchievements = Number(this.achievements.stats.totalUnlockedAchievements) || 0;
    this.achievements.stats.totalAudits = Number(this.achievements.stats.totalAudits) || 0;
    this.achievements.stats.totalItems = Number(this.achievements.stats.totalItems) || 0;
  }

  // Ensure tipo-specific metrics are numbers
  if (this.etiquetas) {
    this.etiquetas.totalItens = Number(this.etiquetas.totalItens) || 0;
    this.etiquetas.itensLidos = Number(this.etiquetas.itensLidos) || 0;
    this.etiquetas.itensAtualizados = Number(this.etiquetas.itensAtualizados) || 0;
    this.etiquetas.itensDesatualizado = Number(this.etiquetas.itensDesatualizado) || 0;
    this.etiquetas.itensSemEstoque = Number(this.etiquetas.itensSemEstoque) || 0;
    this.etiquetas.itensNaopertence = Number(this.etiquetas.itensNaopertence) || 0;
    this.etiquetas.percentualConclusao = Number(this.etiquetas.percentualConclusao) || 0;
  }

  if (this.rupturas) {
    this.rupturas.totalItens = Number(this.rupturas.totalItens) || 0;
    this.rupturas.itensLidos = Number(this.rupturas.itensLidos) || 0;
    this.rupturas.itensAtualizados = Number(this.rupturas.itensAtualizados) || 0;
    this.rupturas.itensDesatualizado = Number(this.rupturas.itensDesatualizado) || 0;
    this.rupturas.itensSemEstoque = Number(this.rupturas.itensSemEstoque) || 0;
    this.rupturas.itensNaopertence = Number(this.rupturas.itensNaopertence) || 0;
    this.rupturas.percentualConclusao = Number(this.rupturas.percentualConclusao) || 0;
    this.rupturas.custoTotalRuptura = Number(this.rupturas.custoTotalRuptura) || 0;
    this.rupturas.custoMedioRuptura = Number(this.rupturas.custoMedioRuptura) || 0;
  }

  if (this.presencas) {
    this.presencas.totalItens = Number(this.presencas.totalItens) || 0;
    this.presencas.itensLidos = Number(this.presencas.itensLidos) || 0;
    this.presencas.itensAtualizados = Number(this.presencas.itensAtualizados) || 0;
    this.presencas.itensDesatualizado = Number(this.presencas.itensDesatualizado) || 0;
    this.presencas.itensSemEstoque = Number(this.presencas.itensSemEstoque) || 0;
    this.presencas.itensNaopertence = Number(this.presencas.itensNaopertence) || 0;
    this.presencas.percentualConclusao = Number(this.presencas.percentualConclusao) || 0;
    this.presencas.presencasConfirmadas = Number(this.presencas.presencasConfirmadas) || 0;
    this.presencas.percentualPresenca = Number(this.presencas.percentualPresenca) || 0;
  }

  next();
});

export default mongoose.model("MetricasUsuario", metricasUsuarioSchema);
