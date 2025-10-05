import mongoose from "mongoose";
// anotaçoes para implementar validações e regras de negócio para o schema de métricas da loja
// cada loja tera apenas um id unicos e todas as metricas serao da loja serao enviadas para esse id da loja o nome da loja atulmente ta como id mas eu quero o nome da loja ou id da loja por exemplo loja 056 ou a loja selecionada

const metricasLojaSchema = new mongoose.Schema(
  {
    // Referência obrigatória
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },

    // Período das métricas
    periodo: {
      type: String,
      required: true,
      enum: ["diario", "semanal", "mensal"],
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
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      tempoMedioProcessamento: { type: Number, default: 0 }, // em horas
    },

    rupturas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      custoTotalRuptura: { type: Number, default: 0 },
      custoMedioRuptura: { type: Number, default: 0 },
      rupturasCriticas: { type: Number, default: 0 }, // > R$ 100
      usuariosAtivos: { type: Number, default: 0 },
    },

    presencas: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      presencasConfirmadas: { type: Number, default: 0 },
      percentualPresenca: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
    },

    // Métricas consolidadas da loja
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
      usuariosTotais: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      planilhasProcessadas: { type: Number, default: 0 },
    },

    // Ranking e desempenho
    ranking: {
      posicaoGeral: { type: Number, default: 0 },
      pontuacaoTotal: { type: Number, default: 0 },
      notaQualidade: { type: Number, default: 0 }, // 0-10
      eficienciaOperacional: { type: Number, default: 0 }, // 0-100
    },

    // Análise de usuários
    usuariosEstatisticas: {
      melhorUsuario: {
        usuarioId: String,
        usuarioNome: String,
        pontuacao: { type: Number, default: 0 },
      },
      usuarioMaisAtivo: {
        usuarioId: String,
        usuarioNome: String,
        itensProcessados: { type: Number, default: 0 },
      },
      mediaItensPerUsuario: { type: Number, default: 0 },
      produtividadeMedia: { type: Number, default: 0 },
    },

    // Análise por setores/locais
    locaisEstatisticas: [
      {
        local: String,
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        problemasFrecuentes: { type: Number, default: 0 },
      },
    ],

    // Tendências e comparações
    tendencias: {
      crescimentoSemanal: { type: Number, default: 0 }, // %
      melhoriaQualidade: { type: Number, default: 0 }, // %
      consistenciaOperacional: { type: Number, default: 0 }, // 0-100
      tendenciaUsuarios: { type: Number, default: 0 }, // crescimento de usuários ativos
    },

    // Alertas e problemas identificados
    alertas: [
      {
        tipo: {
          type: String,
          enum: [
            "baixa_produtividade",
            "alta_ruptura",
            "poucos_usuarios",
            "qualidade_baixa",
          ],
        },
        severidade: {
          type: String,
          enum: ["baixa", "media", "alta", "critica"],
          default: "media",
        },
        descricao: String,
        valor: Number,
        dataDeteccao: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    versaoCalculo: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
metricasLojaSchema.index({ loja: 1, periodo: 1, dataInicio: -1 });
metricasLojaSchema.index({
  periodo: 1,
  dataInicio: -1,
  "ranking.pontuacaoTotal": -1,
});
metricasLojaSchema.index({ "ranking.posicaoGeral": 1, periodo: 1 });

// Índice único para evitar duplicatas
metricasLojaSchema.index(
  { loja: 1, periodo: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos úteis
metricasLojaSchema.statics.obterRankingGeral = function (
  periodo,
  dataInicio,
  dataFim,
  limite = 50
) {
  return this.find({
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 })
    .limit(limite);
};

metricasLojaSchema.statics.obterComparacaoLojas = function (
  lojasIds,
  periodo,
  dataInicio,
  dataFim
) {
  return this.find({
    loja: { $in: lojasIds },
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "ranking.pontuacaoTotal": -1 });
};

metricasLojaSchema.statics.obterTendenciaLoja = function (
  lojaId,
  periodo,
  limite = 12
) {
  return this.find({
    loja: lojaId,
    periodo: periodo,
  })
    .sort({ dataInicio: -1 })
    .limit(limite);
};

metricasLojaSchema.statics.obterLojasComProblemas = function (
  periodo,
  dataInicio,
  dataFim
) {
  return this.find({
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
    "alertas.severidade": { $in: ["alta", "critica"] },
  })
    .populate("loja", "codigo nome cidade regiao")
    .sort({ "alertas.severidade": -1 });
};

// Métodos de instância
metricasLojaSchema.methods.calcularPontuacaoTotal = function () {
  const pesos = {
    conclusao: 0.4, // 40% - Taxa de conclusão
    qualidade: 0.3, // 30% - Qualidade do trabalho
    produtividade: 0.2, // 20% - Produtividade
    consistencia: 0.1, // 10% - Consistência
  };

  // Taxa de conclusão (0-100)
  const taxaConclusao = this.totais.percentualConclusaoGeral;

  // Qualidade baseada na proporção de diferentes tipos de auditoria
  const diversidade = [
    this.etiquetas.totalItens > 0,
    this.rupturas.totalItens > 0,
    this.presencas.totalItens > 0,
  ].filter(Boolean).length;

  const qualidade = (diversidade / 3) * 100;

  // Produtividade baseada em itens por usuário ativo
  const produtividade =
    this.totais.usuariosAtivos > 0
      ? Math.min(
          (this.totais.itensAtualizados / this.totais.usuariosAtivos) * 2,
          100
        )
      : 0;

  // Consistência baseada na regularidade de uso
  const consistencia = Math.min(this.totais.usuariosAtivos * 10, 100);

  const pontuacao =
    taxaConclusao * pesos.conclusao +
    qualidade * pesos.qualidade +
    produtividade * pesos.produtividade +
    consistencia * pesos.consistencia;

  this.ranking.pontuacaoTotal = Math.round(pontuacao);
  this.ranking.notaQualidade = Math.round(pontuacao / 10); // Nota de 0-10
  this.ranking.eficienciaOperacional = Math.round(pontuacao);

  return this.ranking.pontuacaoTotal;
};

metricasLojaSchema.methods.atualizarTotais = function () {
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

  // Calcular usuários ativos únicos
  this.totais.usuariosAtivos = Math.max(
    this.etiquetas.usuariosAtivos,
    this.rupturas.usuariosAtivos,
    this.presencas.usuariosAtivos
  );

  this.calcularPontuacaoTotal();
  this.ultimaAtualizacao = new Date();
};

metricasLojaSchema.methods.detectarAlertas = function () {
  this.alertas = []; // Limpar alertas anteriores

  // Alerta de baixa produtividade
  if (this.totais.percentualConclusaoGeral < 50) {
    this.alertas.push({
      tipo: "baixa_produtividade",
      severidade:
        this.totais.percentualConclusaoGeral < 25 ? "critica" : "alta",
      descricao: `Taxa de conclusão baixa: ${this.totais.percentualConclusaoGeral}%`,
      valor: this.totais.percentualConclusaoGeral,
    });
  }

  // Alerta de alta ruptura
  if (this.rupturas.custoTotalRuptura > 10000) {
    this.alertas.push({
      tipo: "alta_ruptura",
      severidade: this.rupturas.custoTotalRuptura > 50000 ? "critica" : "alta",
      descricao: `Custo de ruptura elevado: R$ ${this.rupturas.custoTotalRuptura.toLocaleString()}`,
      valor: this.rupturas.custoTotalRuptura,
    });
  }

  // Alerta de poucos usuários
  if (this.totais.usuariosAtivos < 3) {
    this.alertas.push({
      tipo: "poucos_usuarios",
      severidade: this.totais.usuariosAtivos === 1 ? "alta" : "media",
      descricao: `Poucos usuários ativos: ${this.totais.usuariosAtivos}`,
      valor: this.totais.usuariosAtivos,
    });
  }

  // Alerta de qualidade baixa
  if (this.ranking.notaQualidade < 5) {
    this.alertas.push({
      tipo: "qualidade_baixa",
      severidade: this.ranking.notaQualidade < 3 ? "critica" : "alta",
      descricao: `Nota de qualidade baixa: ${this.ranking.notaQualidade}/10`,
      valor: this.ranking.notaQualidade,
    });
  }
};

export default mongoose.model("MetricasLoja", metricasLojaSchema);
