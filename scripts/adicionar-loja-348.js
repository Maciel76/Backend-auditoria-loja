// scripts/adicionar-loja-348.js
import mongoose from "mongoose";
import Loja from "../models/Loja.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

async function adicionarLoja348() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    const loja348 = {
      codigo: "348",
      nome: "Loja 348 - Aparecida",
      cidade: "Aparecida",
      endereco: "Endereço da Loja 348 - Aparecida",
      regiao: "Região da Aparecida",
      imagem: "/images/lojas/348.jpg",
      ativa: true,
      metadata: {
        telefone: "(00) 00000-0000",
        email: "contato@loja348.com",
        gerente: "Nome do Gerente",
      },
    };

    const existente = await Loja.findOne({ codigo: "348" });
    if (existente) {
      console.log("⚠️ Loja 348 já existe");
      return;
    }

    await Loja.create(loja348);
    console.log("✅ Loja 348 adicionada com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await mongoose.connection.close();
  }
}

adicionarLoja348();