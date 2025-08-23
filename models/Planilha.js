import mongoose from "mongoose";

const planilhaSchema = new mongoose.Schema({
  nomeArquivo: { type: String, required: true },
  dataUpload: { type: Date, default: Date.now },
  dataAuditoria: { type: Date, required: true },
  totalItens: { type: Number, default: 0 },
  totalItensLidos: { type: Number, default: 0 },
  usuariosEnvolvidos: [String],
});

// Exporte corretamente como default
export default mongoose.model("Planilha", planilhaSchema);
