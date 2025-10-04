import mongoose from "mongoose";

const metricasGlobaisSchema = new mongoose.Schema(
  {
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

    // Resumo executivo geral
    resumoExecutivo: {
      totalLojas: { type: Number, default: 0 },
      lojasAtivas: { type: Number, default: 0 },
      totalUsuarios: { type: Number, default: 0 },
      usuariosAtivos: { type: Number, default: 0 },
      totalItensProcessados: { type: Number, default: 0 },
      totalItensAtualizados: { type: Number, default: 0 },
      percentualConclusaoGeral: { type: Number, default: 0 },
      planilhasProcessadas: { type: Number, default: 0 },
    },

    // Métricas por tipo de auditoria
    porTipoAuditoria: {
      etiquetas: {
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        lojasParticipantes: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        produtividadeMedia: { type: Number, default: 0 }, // itens por usuário
        tempoMedioProcessamento: { type: Number, default: 0 }, // minutos
      },
      rupturas: {
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        lojasParticipantes: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        custoTotalRuptura: { type: Number, default: 0 },
        custoMedioRuptura: { type: Number, default: 0 },
        rupturasCriticas: { type: Number, default: 0 }, // > R$ 100
        economiaEstimada: { type: Number, default: 0 }, // potencial de economia
      },
      presencas: {
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        lojasParticipantes: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        presencasConfirmadas: { type: Number, default: 0 },
        percentualPresencaGeral: { type: Number, default: 0 },
      },
    },

    // Rankings e destaques
    rankings: {
      melhorLoja: {
        loja: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Loja",
        },
        lojaInfo: {
          codigo: String,
          nome: String,
          regiao: String,
        },
        pontuacao: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        especialidade: String, // "etiquetas", "rupturas", "presencas", "geral"
      },
      melhorUsuario: {
        usuarioId: String,
        usuarioNome: String,
        loja: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Loja",
        },
        lojaInfo: {
          codigo: String,
          nome: String,
        },
        pontuacao: { type: Number, default: 0 },
        itensProcessados: { type: Number, default: 0 },
        especialidade: String,
      },
      topLojas: [
        {
          posicao: { type: Number, default: 0 },
          loja: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Loja",
          },
          lojaInfo: {
            codigo: String,
            nome: String,
            regiao: String,
          },
          pontuacao: { type: Number, default: 0 },
          percentualConclusao: { type: Number, default: 0 },
        }
      ],
      topUsuarios: [
        {
          posicao: { type: Number, default: 0 },
          usuarioId: String,
          usuarioNome: String,
          loja: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Loja",
          },
          lojaInfo: {
            codigo: String,
            nome: String,
          },
          pontuacao: { type: Number, default: 0 },
          itensProcessados: { type: Number, default: 0 },
        }
      ],
    },

    // Análise regional
    porRegiao: [
      {
        regiao: String,
        totalLojas: { type: Number, default: 0 },
        lojasAtivas: { type: Number, default: 0 },
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        posicaoRanking: { type: Number, default: 0 },
        melhorLoja: {
          codigo: String,
          nome: String,
          percentual: { type: Number, default: 0 },
        },
      }
    ],

    // Indicadores de saúde do negócio
    indicadoresNegocio: {
      saudeOperacional: { type: Number, default: 0 }, // 0-100
      engajamentoUsuarios: { type: Number, default: 0 }, // % usuários ativos
      eficienciaProcessos: { type: Number, default: 0 }, // 0-100
      qualidadeDados: { type: Number, default: 0 }, // 0-100
      impactoFinanceiro: { type: Number, default: 0 }, // valor em R$
      indicePlataforma: { type: Number, default: 0 }, // 0-100 (média geral)
    },

    // Tendências e comparações
    tendencias: {
      crescimentoLojas: { type: Number, default: 0 }, // %
      crescimentoUsuarios: { type: Number, default: 0 }, // %
      melhoriaQualidade: { type: Number, default: 0 }, // %
      economiaGerada: { type: Number, default: 0 }, // R$
      projecaoProximoPeriodo: {
        itensEstimados: { type: Number, default: 0 },
        usuariosEstimados: { type: Number, default: 0 },
        economiaEstimada: { type: Number, default: 0 },
      },
    },

    // Comparação com período anterior
    comparacoes: {
      periodoAnterior: {
        totalItens: { type: Number, default: 0 },
        itensAtualizados: { type: Number, default: 0 },
        percentualConclusao: { type: Number, default: 0 },
        usuariosAtivos: { type: Number, default: 0 },
        lojasAtivas: { type: Number, default: 0 },
      },
      variacoes: {
        totalItens: { type: Number, default: 0 }, // %
        itensAtualizados: { type: Number, default: 0 }, // %
        percentualConclusao: { type: Number, default: 0 }, // pontos percentuais
        usuariosAtivos: { type: Number, default: 0 }, // %
        lojasAtivas: { type: Number, default: 0 }, // %
      },
    },

    // Problemas e oportunidades críticas
    alertasCriticos: [
      {
        tipo: {
          type: String,
          enum: [
            "queda_performance",
            "baixa_adesao",
            "concentracao_problemas",
            "inatividade_massiva",
            "alto_custo_ruptura",
            "disparidade_regional"
          ],
        },
        severidade: {
          type: String,
          enum: ["baixa", "media", "alta", "critica"],
          default: "media",
        },
        titulo: String,
        descricao: String,
        valor: Number,
        entidadesAfetadas: [String], // lojas ou regiões afetadas
        impactoEstimado: String,
        acaoRecomendada: String,
        prazoResolucao: String,
        dataDeteccao: {
          type: Date,
          default: Date.now,
        },
      }
    ],

    // Insights estratégicos
    insightsEstrategicos: [
      {
        categoria: {
          type: String,
          enum: ["crescimento", "eficiencia", "qualidade", "financeiro", "expansao"],
        },
        titulo: String,
        descricao: String,
        dadosSuportes: mongoose.Schema.Types.Mixed,
        impactoNegocio: {
          type: String,
          enum: ["baixo", "medio", "alto", "transformacional"],
          default: "medio",
        },
        acaoSugerida: String,
        roiEstimado: String,
        prazoImplementacao: String,
        prioridade: {
          type: String,
          enum: ["baixa", "media", "alta", "urgente"],
          default: "media",
        },
      }
    ],

    // Metas e objetivos
    metas: {
      percentualConclusaoMeta: { type: Number, default: 80 },
      usuariosAtivosMeta: { type: Number, default: 0 },
      economiaRupturaMeta: { type: Number, default: 0 },
      lojasAtivasMeta: { type: Number, default: 0 },
      statusMetas: {
        conclusao: {
          type: String,
          enum: ["nao_iniciado", "em_andamento", "proximo_meta", "meta_atingida", "superou_meta"],
          default: "nao_iniciado",
        },
        usuarios: {
          type: String,
          enum: ["nao_iniciado", "em_andamento", "proximo_meta", "meta_atingida", "superou_meta"],
          default: "nao_iniciado",
        },
        economia: {
          type: String,
          enum: ["nao_iniciado", "em_andamento", "proximo_meta", "meta_atingida", "superou_meta"],
          default: "nao_iniciado",
        },
        lojas: {
          type: String,
          enum: ["nao_iniciado", "em_andamento", "proximo_meta", "meta_atingida", "superou_meta"],
          default: "nao_iniciado",
        },
      },
    },

    // Metadata
    ultimaAtualizacao: {
      type: Date,
      default: Date.now,
    },
    proximaAtualizacao: {
      type: Date,
    },
    versaoCalculo: {
      type: String,
      default: "1.0",
    },
    tempoProcessamento: { type: Number, default: 0 }, // em segundos
  },
  {
    timestamps: true,
  }
);

// Índices para queries otimizadas
metricasGlobaisSchema.index({ periodo: 1, dataInicio: -1 });
metricasGlobaisSchema.index({ "indicadoresNegocio.indicePlataforma": -1 });
metricasGlobaisSchema.index({ "alertasCriticos.severidade": -1 });

// Índice único para evitar duplicatas
metricasGlobaisSchema.index(
  { periodo: 1, dataInicio: 1 },
  { unique: true }
);

// Métodos estáticos úteis
metricasGlobaisSchema.statics.obterUltimas = function(periodo, limite = 12) {
  return this.find({ periodo: periodo })
    .sort({ dataInicio: -1 })
    .limit(limite);
};

metricasGlobaisSchema.statics.obterComparacaoAnual = function(ano) {
  const inicioAno = new Date(ano, 0, 1);
  const fimAno = new Date(ano, 11, 31);

  return this.find({
    dataInicio: { $gte: inicioAno },
    dataFim: { $lte: fimAno },
    periodo: "mensal",
  })
  .sort({ dataInicio: 1 });
};

metricasGlobaisSchema.statics.obterAlertasCriticos = function(severidade = ["alta", "critica"]) {
  return this.find({
    "alertasCriticos.severidade": { $in: severidade },
  })
  .sort({ dataInicio: -1 })
  .limit(50);
};

// Métodos de instância
metricasGlobaisSchema.methods.calcularIndicadoresNegocio = function() {
  // Saúde operacional (média de conclusão ponderada)
  const tiposAuditoria = [this.porTipoAuditoria.etiquetas, this.porTipoAuditoria.rupturas, this.porTipoAuditoria.presencas];
  const mediaConclusao = tiposAuditoria.reduce((sum, tipo) => sum + tipo.percentualConclusao, 0) / 3;
  this.indicadoresNegocio.saudeOperacional = Math.round(mediaConclusao);

  // Engajamento de usuários
  this.indicadoresNegocio.engajamentoUsuarios = this.resumoExecutivo.totalUsuarios > 0
    ? Math.round((this.resumoExecutivo.usuariosAtivos / this.resumoExecutivo.totalUsuarios) * 100)
    : 0;

  // Eficiência de processos (itens processados por usuário ativo)
  const eficiencia = this.resumoExecutivo.usuariosAtivos > 0
    ? this.resumoExecutivo.totalItensAtualizados / this.resumoExecutivo.usuariosAtivos
    : 0;
  this.indicadoresNegocio.eficienciaProcessos = Math.min(Math.round(eficiencia * 2), 100);

  // Qualidade de dados (% de conclusão geral)
  this.indicadoresNegocio.qualidadeDados = Math.round(this.resumoExecutivo.percentualConclusaoGeral);

  // Impacto financeiro (economia potencial com rupturas)
  this.indicadoresNegocio.impactoFinanceiro = this.porTipoAuditoria.rupturas.economiaEstimada || 0;

  // Índice geral da plataforma (média ponderada)
  const pesos = {
    saude: 0.3,
    engajamento: 0.25,
    eficiencia: 0.2,
    qualidade: 0.25,
  };

  this.indicadoresNegocio.indicePlataforma = Math.round(
    (this.indicadoresNegocio.saudeOperacional * pesos.saude) +
    (this.indicadoresNegocio.engajamentoUsuarios * pesos.engajamento) +
    (this.indicadoresNegocio.eficienciaProcessos * pesos.eficiencia) +
    (this.indicadoresNegocio.qualidadeDados * pesos.qualidade)
  );
};

metricasGlobaisSchema.methods.calcularVariacoes = function(periodoAnterior) {
  if (!periodoAnterior) return;

  // Calcular variações percentuais
  const calcularVariacao = (atual, anterior) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  };

  this.comparacoes.variacoes.totalItens = calcularVariacao(
    this.resumoExecutivo.totalItensProcessados,
    this.comparacoes.periodoAnterior.totalItens
  );

  this.comparacoes.variacoes.itensAtualizados = calcularVariacao(
    this.resumoExecutivo.totalItensAtualizados,
    this.comparacoes.periodoAnterior.itensAtualizados
  );

  this.comparacoes.variacoes.usuariosAtivos = calcularVariacao(
    this.resumoExecutivo.usuariosAtivos,
    this.comparacoes.periodoAnterior.usuariosAtivos
  );

  this.comparacoes.variacoes.lojasAtivas = calcularVariacao(
    this.resumoExecutivo.lojasAtivas,
    this.comparacoes.periodoAnterior.lojasAtivas
  );

  // Variação em pontos percentuais para conclusão
  this.comparacoes.variacoes.percentualConclusao = Math.round(
    this.resumoExecutivo.percentualConclusaoGeral - this.comparacoes.periodoAnterior.percentualConclusao
  );
};

metricasGlobaisSchema.methods.detectarAlertasCriticos = function() {
  this.alertasCriticos = []; // Limpar alertas anteriores

  // Queda de performance
  if (this.comparacoes.variacoes.percentualConclusao < -10) {
    this.alertasCriticos.push({
      tipo: "queda_performance",
      severidade: this.comparacoes.variacoes.percentualConclusao < -25 ? "critica" : "alta",
      titulo: "Queda Significativa na Performance",
      descricao: `Performance geral caiu ${Math.abs(this.comparacoes.variacoes.percentualConclusao)} pontos percentuais`,
      valor: this.comparacoes.variacoes.percentualConclusao,
      impactoEstimado: "Alto impacto na qualidade das auditorias",
      acaoRecomendada: "Investigação urgente das causas e plano de ação corretiva",
      prazoResolucao: "15 dias",
    });
  }

  // Baixa adesão geral
  if (this.resumoExecutivo.percentualConclusaoGeral < 40) {
    this.alertasCriticos.push({
      tipo: "baixa_adesao",
      severidade: this.resumoExecutivo.percentualConclusaoGeral < 25 ? "critica" : "alta",
      titulo: "Taxa de Conclusão Crítica",
      descricao: `Apenas ${this.resumoExecutivo.percentualConclusaoGeral}% de conclusão geral`,
      valor: this.resumoExecutivo.percentualConclusaoGeral,
      impactoEstimado: "Comprometimento grave da qualidade dos dados",
      acaoRecomendada: "Revisão completa dos processos e treinamento intensivo",
      prazoResolucao: "30 dias",
    });
  }

  // Alto custo de ruptura
  if (this.porTipoAuditoria.rupturas.custoTotalRuptura > 100000) {
    this.alertasCriticos.push({
      tipo: "alto_custo_ruptura",
      severidade: this.porTipoAuditoria.rupturas.custoTotalRuptura > 500000 ? "critica" : "alta",
      titulo: "Custo Elevado de Rupturas",
      descricao: `Custo total de rupturas: R$ ${this.porTipoAuditoria.rupturas.custoTotalRuptura.toLocaleString()}`,
      valor: this.porTipoAuditoria.rupturas.custoTotalRuptura,
      impactoEstimado: `Impacto financeiro direto no resultado`,
      acaoRecomendada: "Foco em redução de rupturas e melhoria do processo de reposição",
      prazoResolucao: "45 dias",
    });
  }

  // Inatividade massiva de usuários
  if (this.indicadoresNegocio.engajamentoUsuarios < 30) {
    this.alertasCriticos.push({
      tipo: "inatividade_massiva",
      severidade: this.indicadoresNegocio.engajamentoUsuarios < 15 ? "critica" : "alta",
      titulo: "Baixo Engajamento de Usuários",
      descricao: `Apenas ${this.indicadoresNegocio.engajamentoUsuarios}% dos usuários estão ativos`,
      valor: this.indicadoresNegocio.engajamentoUsuarios,
      impactoEstimado: "Subutilização da plataforma e baixa adoção",
      acaoRecomendada: "Campanha de reativação e melhoria da experiência do usuário",
      prazoResolucao: "60 dias",
    });
  }
};

metricasGlobaisSchema.methods.avaliarMetas = function() {
  // Avaliar meta de conclusão
  if (this.resumoExecutivo.percentualConclusaoGeral >= this.metas.percentualConclusaoMeta) {
    this.metas.statusMetas.conclusao = "meta_atingida";
    if (this.resumoExecutivo.percentualConclusaoGeral > this.metas.percentualConclusaoMeta * 1.1) {
      this.metas.statusMetas.conclusao = "superou_meta";
    }
  } else if (this.resumoExecutivo.percentualConclusaoGeral >= this.metas.percentualConclusaoMeta * 0.9) {
    this.metas.statusMetas.conclusao = "proximo_meta";
  } else if (this.resumoExecutivo.percentualConclusaoGeral > 0) {
    this.metas.statusMetas.conclusao = "em_andamento";
  }

  // Avaliar meta de usuários ativos
  if (this.metas.usuariosAtivosMeta > 0) {
    if (this.resumoExecutivo.usuariosAtivos >= this.metas.usuariosAtivosMeta) {
      this.metas.statusMetas.usuarios = "meta_atingida";
      if (this.resumoExecutivo.usuariosAtivos > this.metas.usuariosAtivosMeta * 1.1) {
        this.metas.statusMetas.usuarios = "superou_meta";
      }
    } else if (this.resumoExecutivo.usuariosAtivos >= this.metas.usuariosAtivosMeta * 0.9) {
      this.metas.statusMetas.usuarios = "proximo_meta";
    } else if (this.resumoExecutivo.usuariosAtivos > 0) {
      this.metas.statusMetas.usuarios = "em_andamento";
    }
  }

  // Avaliar meta de lojas ativas
  if (this.metas.lojasAtivasMeta > 0) {
    if (this.resumoExecutivo.lojasAtivas >= this.metas.lojasAtivasMeta) {
      this.metas.statusMetas.lojas = "meta_atingida";
      if (this.resumoExecutivo.lojasAtivas > this.metas.lojasAtivasMeta * 1.1) {
        this.metas.statusMetas.lojas = "superou_meta";
      }
    } else if (this.resumoExecutivo.lojasAtivas >= this.metas.lojasAtivasMeta * 0.9) {
      this.metas.statusMetas.lojas = "proximo_meta";
    } else if (this.resumoExecutivo.lojasAtivas > 0) {
      this.metas.statusMetas.lojas = "em_andamento";
    }
  }
};

export default mongoose.model("MetricasGlobais", metricasGlobaisSchema);