// middleware/loja.js - VERSÃO CORRIGIDA
import Loja from "../models/Loja.js";

// Lista de lojas válidas (você pode mover isso para um arquivo de config)
const LOJAS_VALIDAS = [
  { codigo: "056", nome: "Loja 056 - Goiania Burits" },
  { codigo: "084", nome: "Loja 084 - Goiania Independência" },
  { codigo: "105", nome: "Loja 105 - T9" },
  { codigo: "111", nome: "Loja 111 - Rio Verde" },
  { codigo: "140", nome: "Loja 140 - Perimetral" },
  { codigo: "214", nome: "Loja 214 - Caldas Novas" },
  { codigo: "176", nome: "Loja 176 - Palmas Teotônio" },
  { codigo: "194", nome: "Loja 194 - Anápolis" },
  { codigo: "310", nome: "Loja 310 - Portugal" },
  { codigo: "320", nome: "Loja 320 - Palmas cesamar" },
  { codigo: "347", nome: "Loja 347 - Araguaina" },
];

// Middleware OBRIGATÓRIO - NÃO permite requests sem loja válida
export const verificarLojaObrigatoria = async (req, res, next) => {
  try {
    // Tentar obter loja de múltiplas fontes (com verificação de segurança)
    const codigoLoja =
      req.headers["x-loja"] || (req.body && req.body.loja) || req.query.loja;

    // ERRO: Nenhuma loja fornecida
    if (!codigoLoja) {
      return res.status(400).json({
        erro: "LOJA_NAO_SELECIONADA",
        mensagem: "É obrigatório selecionar uma loja antes de continuar",
        dica: "Envie o código da loja no header 'x-loja' ou no body 'loja'",
      });
    }

    // Verificar se a loja é válida
    const lojaValida = LOJAS_VALIDAS.find((l) => l.codigo === codigoLoja);

    if (!lojaValida) {
      return res.status(400).json({
        erro: "LOJA_INVALIDA",
        mensagem: `Loja '${codigoLoja}' não é válida`,
        lojasDisponiveis: LOJAS_VALIDAS.map((l) => l.codigo),
      });
    }

    // Buscar loja no banco (ou criar se não existir)
    let loja = await Loja.findOne({ codigo: codigoLoja });

    if (!loja) {
      // Criar loja automaticamente se não existir
      loja = await Loja.create({
        codigo: lojaValida.codigo,
        nome: lojaValida.nome,
        ativa: true,
      });
      console.log(`✅ Loja criada automaticamente: ${loja.nome}`);
    }

    // Adicionar informações da loja ao request
    req.loja = {
      _id: loja._id,
      codigo: loja.codigo,
      nome: loja.nome,
    };

    console.log(`🏪 Loja selecionada: ${req.loja.codigo} - ${req.loja.nome}`);
    next();
  } catch (error) {
    console.error("❌ Erro no middleware de loja:", error);
    return res.status(500).json({
      erro: "ERRO_MIDDLEWARE_LOJA",
      mensagem: "Erro interno ao verificar loja",
      detalhes: error.message,
    });
  }
};

// Middleware OPCIONAL - Para rotas que podem funcionar sem loja específica
export const verificarLojaOpcional = async (req, res, next) => {
  try {
    const codigoLoja =
      req.headers["x-loja"] || (req.body && req.body.loja) || req.query.loja;

    if (codigoLoja) {
      // Se forneceu loja, validar
      const lojaValida = LOJAS_VALIDAS.find((l) => l.codigo === codigoLoja);

      if (!lojaValida) {
        return res.status(400).json({
          erro: "LOJA_INVALIDA",
          mensagem: `Loja '${codigoLoja}' não é válida`,
        });
      }

      let loja = await Loja.findOne({ codigo: codigoLoja });

      if (!loja) {
        loja = await Loja.create({
          codigo: lojaValida.codigo,
          nome: lojaValida.nome,
          ativa: true,
        });
      }

      req.loja = {
        _id: loja._id,
        codigo: loja.codigo,
        nome: loja.nome,
      };
    } else {
      // Sem loja = todas as lojas
      req.loja = null;
    }

    next();
  } catch (error) {
    console.error("❌ Erro no middleware de loja opcional:", error);
    req.loja = null;
    next();
  }
};

// Função helper para obter filtro de loja para queries MongoDB
export const getFiltroLoja = (req) => {
  if (!req.loja) return {}; // Sem filtro = todas as lojas

  return { loja: req.loja._id }; // Usar ObjectId da loja
};

// Função helper para obter código da loja como string
export const getCodigoLoja = (req) => {
  return req.loja ? req.loja.codigo : null;
};

export default {
  verificarLojaObrigatoria,
  verificarLojaOpcional,
  getFiltroLoja,
  getCodigoLoja,
};
