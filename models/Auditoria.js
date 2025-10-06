// models/Auditoria.js - UNIFICADO (substitui Setor, Presenca, Ruptura)
import mongoose from "mongoose";

const auditoriaSchema = new mongoose.Schema(
  {
    // Referências obrigatórias
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
    nomeLoja: {
      type: String,
      required: false,
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

    // Tipo de auditoria
    tipo: {
      type: String,
      required: true,
      enum: ["etiqueta", "presenca", "ruptura"],
      index: true,
    },

    // Data da auditoria
    data: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Campos comuns a todos os tipos
    codigo: String,
    produto: String,
    ClasseProduto: String,
    local: {
      type: String,
      required: true,
      index: true,
    },
    situacao: {
      type: String,
      default: "Não lido",
    },
    situacaoAtual: {
      type: String,
      enum: ["Ativo", "Encerrada", "Pendente", "Cancelada"],
    },
    estoque: String,

    // Campos específicos por tipo (opcionais conforme o tipo)
    // Para ETIQUETA
    ultimaCompra: String,
    AuditadoDia: String,
    AuditadoHora: String,

    // Para PRESENÇA
    presenca: Boolean,
    presencaConfirmada: String,
    auditadoEm: Date,
    presencaConfirmadaEm: Date,

    // Para RUPTURA
    classeProdutoRaiz: String,
    classeProduto: String,
    setor: String,
    situacaoAuditoria: String,
    estoqueAtual: String,
    estoqueLeitura: String,
    residuo: String,
    fornecedor: String,
    diasSemVenda: Number,
    custoRuptura: Number,

    // Contador para ranking
    contador: {
      type: Number,
      default: 0,
    },

    // Metadata
    metadata: {
      planilhaOrigem: String,
      dataUpload: {
        type: Date,
        default: Date.now,
      },
      linhaPlanilha: Number,
      sincronizado: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices compostos para queries otimizadas
auditoriaSchema.index({ loja: 1, data: -1 });
auditoriaSchema.index({ loja: 1, tipo: 1, data: -1 });
auditoriaSchema.index({ loja: 1, usuarioId: 1, data: -1 });
auditoriaSchema.index({ loja: 1, local: 1, data: -1 });
auditoriaSchema.index({ tipo: 1, situacao: 1 });

// Métodos úteis
auditoriaSchema.methods.isAtualizado = function () {
  return this.situacao === "Atualizado";
};

auditoriaSchema.statics.buscarPorLoja = function (lojaId, filtros = {}) {
  return this.find({ loja: lojaId, ...filtros });
};

auditoriaSchema.statics.estatisticasPorLoja = function (
  lojaId,
  tipo,
  dataInicio,
  dataFim
) {
  return this.aggregate([
    {
      $match: {
        loja: lojaId,
        tipo: tipo,
        data: { $gte: dataInicio, $lte: dataFim },
      },
    },
    {
      $group: {
        _id: "$local",
        totalItens: { $sum: 1 },
        itensAtualizados: {
          $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        local: "$_id",
        totalItens: 1,
        itensAtualizados: 1,
        percentualConclusao: {
          $round: [
            {
              $multiply: [
                { $divide: ["$itensAtualizados", "$totalItens"] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
  ]);
};

export default mongoose.model("Auditoria", auditoriaSchema);
