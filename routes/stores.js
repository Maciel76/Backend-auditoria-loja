// routes/stores.js - API endpoints for store management
import express from "express";
import Loja from "../models/Loja.js";

const router = express.Router();

// Get all stores
router.get("/", async (req, res) => {
  try {
    const { ativa } = req.query;
    const filter = {};
    
    if (ativa !== undefined) {
      filter.ativa = ativa === 'true';
    }
    
    const stores = await Loja.find(filter).sort({ codigo: 1 });
    res.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Erro ao buscar lojas" });
  }
});

// Get store by ID
router.get("/:id", async (req, res) => {
  try {
    const store = await Loja.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    res.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Erro ao buscar loja" });
  }
});

// Create new store
router.post("/", async (req, res) => {
  try {
    const { codigo, nome, cidade, endereco, regiao, imagem, metadata } = req.body;
    
    // Validate required fields
    if (!codigo || !nome || !cidade) {
      return res.status(400).json({ 
        error: "Código, nome e cidade são obrigatórios" 
      });
    }
    
    // Check if store with this code already exists
    const existingStore = await Loja.findOne({ codigo });
    if (existingStore) {
      return res.status(409).json({ 
        error: "Já existe uma loja com este código" 
      });
    }
    
    const store = new Loja({
      codigo,
      nome,
      cidade,
      endereco,
      regiao,
      imagem,
      metadata
    });
    
    await store.save();
    res.status(201).json(store);
  } catch (error) {
    console.error("Error creating store:", error);
    res.status(500).json({ error: "Erro ao criar loja" });
  }
});

// Update store
router.put("/:id", async (req, res) => {
  try {
    const { codigo, nome, cidade, endereco, regiao, imagem, metadata, ativa } = req.body;
    
    const store = await Loja.findByIdAndUpdate(
      req.params.id,
      { 
        codigo,
        nome, 
        cidade, 
        endereco, 
        regiao, 
        imagem,
        metadata,
        ativa
      },
      { new: true, runValidators: true }
    );
    
    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    
    res.json(store);
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ error: "Erro ao atualizar loja" });
  }
});

// Delete store
router.delete("/:id", async (req, res) => {
  try {
    const store = await Loja.findByIdAndDelete(req.params.id);
    
    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }
    
    res.json({ message: "Loja excluída com sucesso" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ error: "Erro ao excluir loja" });
  }
});

export default router;
