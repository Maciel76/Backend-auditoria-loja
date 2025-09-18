import mongoose from "mongoose";

const auditoriaSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  contador: { type: Number, default: 0 },
  detalhes: [
    {
      codigo: String,
      produto: String,
      local: String,
      situacao: String,
      estoque: String,
      tipoAuditoria: {
        type: String,
        enum: ["etiqueta", "presenca", "ruptura"],
        default: "etiqueta",
      },
      loja: {
        type: String,
        required: true,
        default: "000", // loja padrão
      },
    },
  ],
});

const userSchema = new mongoose.Schema(
  {
    id: { type: String },
    nome: { type: String, required: true },
    email: { type: String },
    telefone: { type: String },
    cargo: { type: String },
    foto: { type: String },
    contadorTotal: { type: Number, default: 0 },
    auditorias: [auditoriaSchema],
    // ADICIONE ESTE CAMPO NO NÍVEL PRINCIPAL DO USUÁRIO TAMBÉM
    loja: {
      type: String,
      default: "000", // loja padrão para o usuário
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
