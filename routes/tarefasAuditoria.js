// routes/tarefasAuditoria.js - Rotas para o sistema de delegação de tarefas de auditoria
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Schema para checklist de tarefas de auditoria por colaborador
const tarefaChecklistSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true, index: true },
  lojaId: { type: String, required: true, index: true },
  tipo: { type: String, enum: ["etiqueta", "presenca", "ruptura"], default: "etiqueta" },
  corredor: { type: String, default: "" },
  itensVerificados: [{ type: String }], // códigos dos produtos verificados
  ultimaAtualizacao: { type: Date, default: Date.now },
  versaoPlanilha: { type: Date, default: null }, // para detectar novos uploads
}, {
  timestamps: true,
  collection: "tarefa_checklists"
});

// Índice composto para busca rápida
tarefaChecklistSchema.index({ usuarioId: 1, lojaId: 1, tipo: 1 }, { unique: true });

const TarefaChecklist = mongoose.model("TarefaChecklist", tarefaChecklistSchema);

// POST /api/tarefas-auditoria/checklist - Salvar/atualizar checklist do colaborador
router.post("/checklist", async (req, res) => {
  try {
    const { lojaId, tipo, itensVerificados, usuarioId, corredor } = req.body;

    if (!lojaId || !tipo) {
      return res.status(400).json({
        success: false,
        message: "lojaId e tipo são obrigatórios",
      });
    }

    // Usar o usuarioId do body ou header
    const userId = usuarioId || req.headers["x-usuario-id"] || "anonimo";

    const checklist = await TarefaChecklist.findOneAndUpdate(
      { usuarioId: userId, lojaId, tipo },
      {
        $set: {
          itensVerificados: itensVerificados || [],
          corredor: corredor || "",
          ultimaAtualizacao: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Checklist salvo com sucesso",
      checklist,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar checklist:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao salvar checklist",
      error: error.message,
    });
  }
});

// GET /api/tarefas-auditoria/checklist/:lojaId/:usuarioId - Buscar checklist do colaborador
router.get("/checklist/:lojaId/:usuarioId", async (req, res) => {
  try {
    const { lojaId, usuarioId } = req.params;
    const { tipo } = req.query;

    const filtro = { usuarioId, lojaId };
    if (tipo) filtro.tipo = tipo;

    const checklists = await TarefaChecklist.find(filtro).lean();

    res.json({
      success: true,
      checklists: checklists || [],
      checklist: checklists[0] || null, // retrocompatibilidade
    });
  } catch (error) {
    console.error("❌ Erro ao buscar checklist:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar checklist",
      error: error.message,
    });
  }
});

// DELETE /api/tarefas-auditoria/checklist/:lojaId/:usuarioId - Limpar checklist (novo upload)
router.delete("/checklist/:lojaId/:usuarioId", async (req, res) => {
  try {
    const { lojaId, usuarioId } = req.params;
    const { tipo } = req.query;

    const filtro = { usuarioId, lojaId };
    if (tipo) filtro.tipo = tipo;

    await TarefaChecklist.deleteMany(filtro);

    res.json({
      success: true,
      message: "Checklist limpo com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao limpar checklist:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao limpar checklist",
      error: error.message,
    });
  }
});

// GET /api/tarefas-auditoria/resumo/:lojaId - Resumo das tarefas de todos os colaboradores
router.get("/resumo/:lojaId", async (req, res) => {
  try {
    const { lojaId } = req.params;

    const checklists = await TarefaChecklist.find({ lojaId }).lean();

    // Agrupar por corredor com colaboradores atribuídos
    const resumoPorCorredor = {};
    checklists.forEach((checklist) => {
      const corredor = checklist.corredor || "Não atribuído";
      if (!resumoPorCorredor[corredor]) {
        resumoPorCorredor[corredor] = {
          corredor,
          colaboradores: [],
          totalVerificados: 0,
        };
      }
      resumoPorCorredor[corredor].colaboradores.push({
        usuarioId: checklist.usuarioId,
        itensVerificados: checklist.itensVerificados.length,
        ultimaAtualizacao: checklist.ultimaAtualizacao,
      });
      resumoPorCorredor[corredor].totalVerificados += checklist.itensVerificados.length;
    });

    res.json({
      success: true,
      resumo: Object.values(resumoPorCorredor),
      totalColaboradores: new Set(checklists.map((c) => c.usuarioId)).size,
      totalItensVerificados: checklists.reduce((acc, c) => acc + c.itensVerificados.length, 0),
    });
  } catch (error) {
    console.error("❌ Erro ao gerar resumo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar resumo",
      error: error.message,
    });
  }
});

export default router;
