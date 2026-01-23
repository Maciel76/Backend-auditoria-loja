/**
 * MODELO: User
 * ENDPOINTS ASSOCIADOS:
 * - GET /api/usuarios - Listar usuários com opção de filtro por loja
 * - GET /api/usuarios/:id - Buscar usuário específico por ID
 * - POST /api/usuarios/:id/foto - Upload de foto de perfil do usuário
 * - PATCH /api/usuarios/:id/cover - Atualiza o cover/tema do perfil do usuário
 * - DELETE /api/usuarios/:id/foto - Remove foto de perfil do usuário
 */
// models/User.js - UNIFICADO (substitui User, UserAudit, userRuptura)
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      index: true,
    },
    nome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    telefone: {
      type: String,
    },
    cargo: {
      type: String,
    },
    foto: {
      type: String,
    },
    coverId: {
      type: String,
      default: "gradient-1",
    },
    selectedBadges: [{
      type: String
    }],
    contadorTotal: {
      type: Number,
      default: 0,
    },
    // CAMPO LOJA - ObjectId referenciando Loja
    loja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loja",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Índices compostos para queries otimizadas
userSchema.index({ loja: 1, nome: 1 });
userSchema.index({ loja: 1, contadorTotal: -1 });

export default mongoose.model("User", userSchema);
