import mongoose from "mongoose";

const SetorSchema = new mongoose.Schema({
  codigo: String,
  produto: String,
  local: String,
  usuario: String,
  situacao: String,
  estoque: String,
  ultimaCompra: String,
  dataAuditoria: Date,
});

const Setor = mongoose.model("Setor", SetorSchema);

export default Setor;
