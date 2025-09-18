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
  loja: {
    type: String,
    required: true,
    default: "000", // loja padrão
  },
});

const Setor = mongoose.model("Setor", SetorSchema);

export default Setor;
