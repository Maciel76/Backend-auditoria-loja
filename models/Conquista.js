// models/Conquista.js
import mongoose from "mongoose";

/**
 * Schema para configuração de conquistas do sistema
 * Este modelo armazena as DEFINIÇÕES de cada conquista,
 * não o progresso individual dos usuários (que fica em MetricasUsuario)
 */
const conquistaSchema = new mongoose.Schema(
  {
    // Identificador único da conquista
    achievementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    // Informações básicas
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: "🏆",
    },

    // Classificação
    category: {
      type: String,
      required: true,
      enum: ["audits", "performance", "consistency", "participation"],
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },

    // Critérios de desbloqueio
    criteria: {
      type: {
        type: String,
        required: true,
        enum: ["count", "percentage", "streak", "custom"],
      },
      target: {
        type: Number,
        required: true,
        min: 0,
      },
      description: {
        type: String,
        required: true,
      },
      period: {
        // Para conquistas com período específico (ex: semanal)
        type: Number,
        min: 1,
      },
    },

    // Campo fonte no modelo MetricasUsuario
    sourceField: {
      type: String,
      required: true,
      // Exemplos: 'contadoresAuditorias.totalGeral', 'totaisAcumulados.itensLidosTotal'
    },

    // Repetição (opcional)
    repeticao: {
      type: String,
      enum: [null, "diaria", "semanal", "mensal"],
      default: null,
    },

    // Status
    ativo: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Ordem de exibição (para ordenar conquistas)
    ordem: {
      type: Number,
      default: 0,
    },

    // Metadados
    criadoPor: {
      type: String,
      default: "system",
    },
    atualizadoPor: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: "conquistas",
  }
);

// Índices compostos para melhor performance
conquistaSchema.index({ category: 1, difficulty: 1 });
conquistaSchema.index({ ativo: 1, ordem: 1 });
conquistaSchema.index({ category: 1, ativo: 1 });

// Virtual para exibir info completa
conquistaSchema.virtual("info").get(function () {
  return `${this.icon} ${this.title} (${this.points} XP)`;
});

// Método de instância para verificar se usuário desbloqueou
conquistaSchema.methods.verificarDesbloqueio = function (metricas) {
  // Obter valor do campo fonte
  const valor = this.obterValorCampo(metricas, this.sourceField);

  // Verificar baseado no tipo de critério
  switch (this.criteria.type) {
    case "count":
      return valor >= this.criteria.target;
    case "percentage":
      return valor >= this.criteria.target;
    case "streak":
      return valor >= this.criteria.target;
    default:
      return false;
  }
};

// Método para obter valor de campo aninhado
conquistaSchema.methods.obterValorCampo = function (obj, caminho) {
  // Suporta caminhos como 'totais.percentualConclusaoGeral'
  return caminho.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return acc[part];
    }
    return undefined;
  }, obj) || 0;
};

// Método de instância para calcular progresso
conquistaSchema.methods.calcularProgresso = function (metricas) {
  const valor = this.obterValorCampo(metricas, this.sourceField);
  const progresso = Math.min(100, (valor / this.criteria.target) * 100);
  return Math.round(progresso);
};

// Método estático para buscar conquistas ativas
conquistaSchema.statics.buscarAtivas = function () {
  return this.find({ ativo: true }).sort({ ordem: 1, createdAt: 1 });
};

// Método estático para buscar por categoria
conquistaSchema.statics.buscarPorCategoria = function (category) {
  return this.find({ ativo: true, category }).sort({ ordem: 1 });
};

// Método estático para validar todas as conquistas de um usuário
conquistaSchema.statics.validarConquistasUsuario = async function (metricas) {
  const conquistas = await this.buscarAtivas();

  return conquistas.map(conquista => ({
    achievementId: conquista.achievementId,
    title: conquista.title,
    description: conquista.description,
    icon: conquista.icon,
    category: conquista.category,
    difficulty: conquista.difficulty,
    points: conquista.points,
    desbloqueada: conquista.verificarDesbloqueio(metricas),
    progresso: conquista.calcularProgresso(metricas),
    criteria: conquista.criteria,
    sourceField: conquista.sourceField,
  }));
};

// Middleware pre-save para validação
conquistaSchema.pre("save", function (next) {
  // Validar sourceField
  if (!this.sourceField) {
    next(new Error("Campo sourceField é obrigatório"));
  }

  // Garantir que achievementId está em kebab-case
  this.achievementId = this.achievementId.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  next();
});

// Middleware post-save para log
conquistaSchema.post("save", function (doc) {
  console.log(`✅ Conquista salva: ${doc.achievementId} - ${doc.title}`);
});

const Conquista = mongoose.model("Conquista", conquistaSchema);

export default Conquista;
