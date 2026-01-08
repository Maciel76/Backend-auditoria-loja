// scripts/adicionar-loja-347.js - Script para adicionar a loja 347 ao banco de dados
import mongoose from "mongoose";
import Loja from "../models/Loja.js";

// Configuração do banco de dados
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

async function adicionarLoja347() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Dados da loja 347
    const loja347 = {
      codigo: "347",
      nome: "Loja 347 - Araguaina",
      cidade: "Araguaina",
      endereco: "Endereço da Loja 347", // Ajuste conforme necessário
      regiao: "Tocantins", // Ajuste conforme necessário
      imagem: "/images/lojas/347.jpeg",
      ativa: true,
      metadata: {
        telefone: "(63) 99999-9999", // Ajuste conforme necessário
        email: "contato@loja347.com", // Ajuste conforme necessário
        gerente: "Nome do Gerente", // Ajuste conforme necessário
      },
    };

    // Verificar se a loja já existe
    const lojaExistente = await Loja.findOne({ codigo: "347" });
    if (lojaExistente) {
      console.log("⚠️ Loja 347 já existe no banco de dados");
      console.log(lojaExistente);
      return;
    }

    // Criar nova loja
    const novaLoja = new Loja(loja347);
    await novaLoja.save();

    console.log("✅ Loja 347 adicionada com sucesso!");
    console.log(novaLoja);
  } catch (error) {
    console.error("❌ Erro ao adicionar loja 347:", error);
  } finally {
    // Fechar conexão
    await mongoose.connection.close();
    console.log("🔌 Conexão fechada");
  }
}

// Executar o script
adicionarLoja347();
