import mongoose from "mongoose";

const rupturaSchema = new mongoose.Schema({
  codigo: String,
  produto: String,
  classeProdutoRaiz: String,
  classeProduto: String,
  setor: String,
  local: String,
  usuario: String,
  situacao: String,
  situacaoAuditoria: String,
  auditadoEm: Date,
  estoqueAtual: String,
  presencaConfirmada: String,
  diasSemVenda: Number,
  custoRuptura: Number,
  dataAuditoria: Date,
  tipo: { type: String, default: "ruptura" },
});

export default mongoose.model("Ruptura", rupturaSchema);
