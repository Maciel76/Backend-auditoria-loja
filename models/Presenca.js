import mongoose from "mongoose";

const presencaSchema = new mongoose.Schema({
  codigo: String,
  produto: String,
  local: String,
  usuario: String,
  situacao: String,
  auditadoEm: Date,
  estoque: String,
  presenca: Boolean,
  loja: {
    type: String,
    required: true,
    default: "000", // loja padrão
  },
  dataAuditoria: Date,
  tipo: { type: String, default: "presenca" },
});

export default mongoose.model("Presenca", presencaSchema);
