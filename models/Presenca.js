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
  dataAuditoria: Date,
  tipo: { type: String, default: "presenca" },
});

export default mongoose.model("Presenca", presencaSchema);
