import mongoose from "mongoose";

const metricasAuditoriaSchema = new mongoose.Schema(
  {
    // Tipo de auditoria
    tipo: {
      type: String,
      required: true,
      enum: ["etiqueta", "ruptura", "presenca"],
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

    // Métricas gerais por tipo
    totais: {
      totalItens: { type: Number, default: 0 },
      itensLidos: { type: Number, default: 0 },
      itensAtualizados: { type: Number, default: 0 },
      percentualConclusao: { type: Number, default: 0 },
      lojasTotais: { type: Number, default: 0 },
      lojasAtivas: { type: Number, default: 0 },
      usuariosTotais: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
    },

    // Métricas específicas por tipo de auditoria
    metricas: {
      // Para ETIQUETAS
      etiquetas: {
        tempoMedioProcessamento: { type: Number, default: 0 }, // minutos
        itensPerUsuario: { type: Number, default: 0 },
        produtividadeMedia: { type: Number, default: 0 },
        locaisMaisMovimentados: [
          {
            local: String,
            totalItens: { type: Number, default: 0 },
            percentual: { type: Number, default: 0 },
          }
        ],
      },

      // Para RUPTURAS
      rupturas: {
        custoTotalRuptura: { type: Number, default: 0 },
        custoMedioRuptura: { type: Number, default: 0 },
        custoMedioPerLoja: { type: Number, default: 0 },
        rupturasCriticas: { type: Number, default: 0 }, // > R$ 100
        diasMediosSemVenda: { type: Number, default: 0 },
        setoresMaisAfetados: [
          {
            setor: String,
            totalRupturas: { type: Number, default: 0 },
            custoTotal: { type: Number, default: 0 },
            percentual: { type: Number, default: 0 },
          }
        ],
        fornecedoresMaisAfetados: [
          {
            fornecedor: String,
            totalRupturas: { type: Number, default: 0 },
            custoTotal: { type: Number, default: 0 },
            percentual: { type: Number, default: 0 },
          }
        ],
      },

      // Para PRESENÇAS
      presencas: {
        presencasConfirmadas: { type: Number, default: 0 },
        percentualPresenca: { type: Number, default: 0 },
        tempoMedioConfirmacao: { type: Number, default: 0 }, // minutos
        produtosComPresenca: { type: Number, default: 0 },
        produtosSemPresenca: { type: Number, default: 0 },
        setoresComMelhorPresenca: [
          {
            setor: String,
            totalItens: { type: Number, default: 0 },
            presencasConfirmadas: { type: Number, default: 0 },
            percentualPresenca: { type: Number, default: 0 },
          }
        ],
      },
    },

    // Análise por lojas
    porLoja: [
      {
        loja: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Loja",
        },
        lojaInfo: {
          codigo: String,
          nome: String,
          regiao: String,
        },
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        posicaoRanking: { type: Number, default: 0 },
        valor: { type: Number, default: 0 }, // Para rupturas: custo total
      }
    ],

    // Análise temporal
    tendencias: {
      crescimentoSemanal: { type: Number, default: 0 }, // %
      melhoriaQualidade: { type: Number, default: 0 }, // %
      variabilidadeLojas: { type: Number, default: 0 }, // Desvio padrão
      consistenciaOperacional: { type: Number, default: 0 }, // 0-100
      preditaProximoPeriodo: { type: Number, default: 0 },
    },

    // Comparações com períodos anteriores
    comparacoes: {
      periodoAnterior: {
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        variacao: { type: Number, default: 0 }, // %
      },
      mediaMostraPeriodo: {
        percentualConclusao: { type: Number, default: 0 },
        desvioMedio: { type: Number, default: 0 },
        classificacao: String, // "acima_media", "na_media", "abaixo_media"
      },
    },

    // Identificação de padrões críticos
    padroesCriticos: [
      {
        tipo: {
          type: String,
          enum: [
            "baixa_adesao",
            "alta_variabilidade",
            "concentracao_problemas",
            "declinio_performance",
            "inatividade_usuarios"
          ],
        },
        severidade: {
          type: String,
          enum: ["baixa", "media", "alta", "critica"],
          default: "media",
        },
        descricao: String,
        valor: Number,
        lojasAfetadas: [String], // códigos das lojas
        recomendacao: String,
        dataDeteccao: {
          type: Date,
          default: Date.now,
        },
      }
    ],

    // Insights automáticos
    insights: [
      {
        categoria: {
          type: String,
          enum: ["performance", "qualidade", "produtividade", "tendencia", "oportunidade"],
        },
        titulo: String,
        descricao: String,
        valor: Number,
        impacto: {
          type: String,
          enum: ["baixo", "medio", "alto"],
          default: "medio",
        },
        acao_sugerida: String,
      }
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
metricasAuditoriaSchema.index({ tipo: 1, periodo: 1, dataInicio: -1 });
metricasAuditoriaSchema.index({ periodo: 1, dataInicio: -1, "totais.percentualConclusao": -1 });
metricasAuditoriaSchema.index({ tipo: 1, "padroesCriticos.severidade": -1 });

// Índice único para evitar duplicatas
metricasAuditoriaSchema.index(
  { tipo: 1, periodo: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos úteis
metricasAuditoriaSchema.statics.obterComparacaoTipos = function(periodo, dataInicio, dataFim) {
  return this.find({
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
  })
  .sort({ tipo: 1 });
};

metricasAuditoriaSchema.statics.obterTipoMaisProblematico = function(periodo, dataInicio, dataFim) {
  return this.find({
    periodo: periodo,
    dataInicio: { $gte: dataInicio },
    dataFim: { $lte: dataFim },
    "padroesCriticos.severidade": { $in: ["alta", "critica"] },
  })
  .sort({ "padroesCriticos.severidade": -1, "totais.percentualConclusao": 1 })
  .limit(1);
};

metricasAuditoriaSchema.statics.obterTendenciasTipo = function(tipo, periodo, limite = 12) {
  return this.find({
    tipo: tipo,
    periodo: periodo,
  })
  .sort({ dataInicio: -1 })
  .limit(limite);
};

metricasAuditoriaSchema.statics.obterInsightsPorCategoria = function(categoria, limite = 10) {
  return this.find({
    "insights.categoria": categoria,
  })
  .sort({ dataInicio: -1 })
  .limit(limite);
};

// Métodos de instância
metricasAuditoriaSchema.methods.calcularTendencias = function(periodoAnterior) {
  if (!periodoAnterior) return;

  // Crescimento semanal
  if (periodoAnterior.totais.totalItens > 0) {
    this.tendencias.crescimentoSemanal = Math.round(
      ((this.totais.totalItens - periodoAnterior.totais.totalItens) / periodoAnterior.totais.totalItens) * 100
    );
  }

  // Melhoria de qualidade
  if (periodoAnterior.totais.percentualConclusao > 0) {
    this.tendencias.melhoriaQualidade = Math.round(
      this.totais.percentualConclusao - periodoAnterior.totais.percentualConclusao
    );
  }

  // Variabilidade entre lojas
  if (this.porLoja.length > 1) {
    const mediana = this.porLoja.reduce((sum, loja) => sum + loja.percentualConclusao, 0) / this.porLoja.length;
    const variancia = this.porLoja.reduce((sum, loja) => {
      return sum + Math.pow(loja.percentualConclusao - mediana, 2);
    }, 0) / this.porLoja.length;
    this.tendencias.variabilidadeLojas = Math.sqrt(variancia);
  }

  // Consistência operacional (menor variabilidade = maior consistência)
  this.tendencias.consistenciaOperacional = Math.max(0, 100 - this.tendencias.variabilidadeLojas);
};

metricasAuditoriaSchema.methods.detectarPadroesCriticos = function() {
  this.padroesCriticos = []; // Limpar padrões anteriores

  // Baixa adesão geral
  if (this.totais.percentualConclusao < 30) {
    this.padroesCriticos.push({
      tipo: "baixa_adesao",
      severidade: this.totais.percentualConclusao < 15 ? "critica" : "alta",
      descricao: `Taxa de conclusão muito baixa para ${this.tipo}: ${this.totais.percentualConclusao}%`,
      valor: this.totais.percentualConclusao,
      lojasAfetadas: this.porLoja.filter(l => l.percentualConclusao < 30).map(l => l.lojaInfo.codigo),
      recomendacao: "Revisar processo de treinamento e motivar equipes",
    });
  }

  // Alta variabilidade entre lojas
  if (this.tendencias.variabilidadeLojas > 25) {
    this.padroesCriticos.push({
      tipo: "alta_variabilidade",
      severidade: this.tendencias.variabilidadeLojas > 40 ? "alta" : "media",
      descricao: `Grande variação de performance entre lojas: ${this.tendencias.variabilidadeLojas.toFixed(1)}%`,
      valor: this.tendencias.variabilidadeLojas,
      lojasAfetadas: this.porLoja.filter(l => l.percentualConclusao < this.totais.percentualConclusao * 0.7).map(l => l.lojaInfo.codigo),
      recomendacao: "Padronizar processos e oferecer suporte às lojas com menor performance",
    });
  }

  // Concentração de problemas em poucas lojas
  const lojasProblematicas = this.porLoja.filter(l => l.percentualConclusao < 25);
  if (lojasProblematicas.length > 0 && lojasProblematicas.length <= this.porLoja.length * 0.3) {
    this.padroesCriticos.push({
      tipo: "concentracao_problemas",
      severidade: lojasProblematicas.length === 1 ? "media" : "alta",
      descricao: `${lojasProblematicas.length} loja(s) com performance crítica concentram os problemas`,
      valor: lojasProblematicas.length,
      lojasAfetadas: lojasProblematicas.map(l => l.lojaInfo.codigo),
      recomendacao: "Intervenção focada nas lojas com maior dificuldade",
    });
  }

  // Declínio de performance
  if (this.tendencias.melhoriaQualidade < -10) {
    this.padroesCriticos.push({
      tipo: "declinio_performance",
      severidade: this.tendencias.melhoriaQualidade < -25 ? "critica" : "alta",
      descricao: `Declínio significativo na performance: ${this.tendencias.melhoriaQualidade}%`,
      valor: this.tendencias.melhoriaQualidade,
      lojasAfetadas: [],
      recomendacao: "Investigar causas do declínio e implementar ações corretivas urgentes",
    });
  }

  // Inatividade de usuários
  const percentualUsuariosAtivos = this.totais.usuariosTotais > 0
    ? (this.totais.usuariosAtivos / this.totais.usuariosTotais) * 100
    : 0;

  if (percentualUsuariosAtivos < 50) {
    this.padroesCriticos.push({
      tipo: "inatividade_usuarios",
      severidade: percentualUsuariosAtivos < 25 ? "critica" : "alta",
      descricao: `Baixa adesão de usuários: apenas ${percentualUsuariosAtivos.toFixed(1)}% ativos`,
      valor: percentualUsuariosAtivos,
      lojasAfetadas: [],
      recomendacao: "Campanha de engajamento e revisão do processo de onboarding",
    });
  }
};

metricasAuditoriaSchema.methods.gerarInsights = function() {
  this.insights = []; // Limpar insights anteriores

  // Insight de performance
  if (this.totais.percentualConclusao > 80) {
    this.insights.push({
      categoria: "performance",
      titulo: "Excelente Taxa de Conclusão",
      descricao: `${this.tipo} apresenta ${this.totais.percentualConclusao}% de conclusão, superando a meta de 80%`,
      valor: this.totais.percentualConclusao,
      impacto: "alto",
      acao_sugerida: "Manter padrão e compartilhar boas práticas com outras auditorias",
    });
  }

  // Insight de tendência positiva
  if (this.tendencias.melhoriaQualidade > 15) {
    this.insights.push({
      categoria: "tendencia",
      titulo: "Melhoria Consistente",
      descricao: `Crescimento de ${this.tendencias.melhoriaQualidade}% na qualidade das auditorias`,
      valor: this.tendencias.melhoriaQualidade,
      impacto: "alto",
      acao_sugerida: "Identificar e replicar fatores de sucesso",
    });
  }

  // Insight de oportunidade para rupturas
  if (this.tipo === "ruptura" && this.metricas.rupturas.custoTotalRuptura > 0) {
    const economia_potencial = this.metricas.rupturas.custoTotalRuptura * 0.7; // 70% de redução potencial
    this.insights.push({
      categoria: "oportunidade",
      titulo: "Potencial de Economia",
      descricao: `Reduzindo rupturas em 70%, economia potencial de R$ ${economia_potencial.toLocaleString()}`,
      valor: economia_potencial,
      impacto: "alto",
      acao_sugerida: "Foco nas rupturas críticas e melhoria do processo de reposição",
    });
  }

  // Insight de produtividade
  if (this.tipo === "etiqueta" && this.metricas.etiquetas.itensPerUsuario > 0) {
    this.insights.push({
      categoria: "produtividade",
      titulo: "Produtividade por Usuário",
      descricao: `Média de ${this.metricas.etiquetas.itensPerUsuario} itens processados por usuário`,
      valor: this.metricas.etiquetas.itensPerUsuario,
      impacto: this.metricas.etiquetas.itensPerUsuario > 50 ? "alto" : "medio",
      acao_sugerida: this.metricas.etiquetas.itensPerUsuario > 50
        ? "Reconhecer alta produtividade e manter padrão"
        : "Identificar gargalos e melhorar eficiência do processo",
    });
  }
};

export default mongoose.model("MetricasAuditoria", metricasAuditoriaSchema);