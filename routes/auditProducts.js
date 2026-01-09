// routes/auditProducts.js - Rotas para gerenciar produtos por tipo de auditoria
import express from "express";
import AuditProductsService from "../services/auditProductsService.js";
import Loja from "../models/Loja.js";
import LojaAuditProducts from "../models/LojaAuditProducts.js";

const router = express.Router();

// Nova rota: Buscar produtos do modelo LojaAuditProducts
router.get("/produtos-auditorias/:lojaId", async (req, res) => {
  try {
    const { lojaId } = req.params;

    console.log(`🔍 Buscando produtos para loja: ${lojaId}`);

    // Primeiro, buscar a loja pelo código para obter o ObjectId
    let loja;

    // Tentar buscar por ObjectId se parecer um ObjectId válido (24 caracteres hex)
    if (/^[0-9a-fA-F]{24}$/.test(lojaId)) {
      loja = await Loja.findById(lojaId);
    }

    // Se não encontrou ou não é ObjectId, buscar pelo código
    if (!loja) {
      loja = await Loja.findOne({ codigo: lojaId });
    }

    if (!loja) {
      console.warn(`⚠️ Loja não encontrada: ${lojaId}`);
      return res.status(404).json({
        success: false,
        message: "Loja não encontrada",
        produtos: {
          etiqueta: [],
          presenca: [],
          ruptura: [],
        },
      });
    }

    console.log(`✅ Loja encontrada: ${loja.nome} (ID: ${loja._id})`);

    // Buscar produtos do modelo LojaAuditProducts
    const lojaAuditProducts = await LojaAuditProducts.findOne({
      loja: loja._id,
    }).lean();

    console.log(`📊 LojaAuditProducts encontrado:`, !!lojaAuditProducts);

    // Organizar produtos por tipo de auditoria
    const produtosPorTipo = {
      etiqueta: [],
      presenca: [],
      ruptura: [],
    };

    if (lojaAuditProducts && lojaAuditProducts.produtos) {
      // Extrair produtos de cada tipo
      produtosPorTipo.etiqueta = lojaAuditProducts.produtos.etiqueta || [];
      produtosPorTipo.presenca = lojaAuditProducts.produtos.presenca || [];
      produtosPorTipo.ruptura = lojaAuditProducts.produtos.ruptura || [];

      console.log(`📦 Produtos encontrados:`, {
        etiqueta: produtosPorTipo.etiqueta.length,
        presenca: produtosPorTipo.presenca.length,
        ruptura: produtosPorTipo.ruptura.length,
      });
    }

    const totalProdutos =
      produtosPorTipo.etiqueta.length +
      produtosPorTipo.presenca.length +
      produtosPorTipo.ruptura.length;

    console.log(`✅ Total de produtos: ${totalProdutos}`);

    res.status(200).json({
      success: true,
      message: "Produtos obtidos com sucesso do LojaAuditProducts",
      produtos: produtosPorTipo,
      totalProdutos: {
        etiqueta: produtosPorTipo.etiqueta.length,
        presenca: produtosPorTipo.presenca.length,
        ruptura: produtosPorTipo.ruptura.length,
        total: totalProdutos,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar produtos",
      error: error.message,
      produtos: {
        etiqueta: [],
        presenca: [],
        ruptura: [],
      },
    });
  }
});

// Rota para obter produtos por tipo de auditoria
router.get("/produtos/:lojaId/:tipo", async (req, res) => {
  try {
    const { lojaId, tipo } = req.params;

    // Validar tipo de auditoria
    if (!["etiqueta", "presenca", "ruptura"].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura",
      });
    }

    const resultado = await AuditProductsService.getProdutosPorTipo(
      lojaId,
      tipo
    );

    res.status(resultado.success ? 200 : 404).json(resultado);
  } catch (error) {
    console.error("Erro ao obter produtos por tipo:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

// Rota para obter todos os produtos de uma loja
router.get("/produtos/:lojaId", async (req, res) => {
  try {
    const { lojaId } = req.params;

    const resultado = await AuditProductsService.getAllProdutosPorLoja(lojaId);

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao obter todos os produtos da loja:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

// Rota para limpar produtos de auditoria de um tipo específico
router.delete("/produtos/:lojaId/:tipo", async (req, res) => {
  try {
    const { lojaId, tipo } = req.params;

    // Validar tipo de auditoria
    if (!["etiqueta", "presenca", "ruptura"].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura",
      });
    }

    const resultado = await AuditProductsService.limparProdutosPorLojaELojaTipo(
      lojaId,
      tipo
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao limpar produtos por tipo:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

// Rota para limpar todos os produtos de auditoria de uma loja
router.delete("/produtos/:lojaId", async (req, res) => {
  try {
    const { lojaId } = req.params;

    const resultado = await AuditProductsService.limparTodosProdutosPorLoja(
      lojaId
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao limpar todos os produtos da loja:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

// Rota para extrair produtos de auditorias existentes
router.post("/produtos/extrair/:lojaId/:tipo", async (req, res) => {
  try {
    const { lojaId, tipo } = req.params;
    const { dataInicio, dataFim } = req.body;

    // Validar tipo de auditoria
    if (!["etiqueta", "presenca", "ruptura"].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de auditoria inválido. Use: etiqueta, presenca ou ruptura",
      });
    }

    // Validar loja
    const loja = await Loja.findById(lojaId);
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: "Loja não encontrada",
      });
    }

    const resultado = await AuditProductsService.extrairProdutosDeAuditorias(
      lojaId,
      loja.nome,
      tipo,
      dataInicio,
      dataFim
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao extrair produtos de auditorias:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
});

export default router;
