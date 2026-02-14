// routes/usuarios.js - Gestão de usuários e upload de fotos
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import Loja from "../models/Loja.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/usuarios";

    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nome do arquivo: userId-timestamp.extensao
    const userId = req.params.id || Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `user-${userId}-${Date.now()}${ext}`);
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de arquivo não permitido. Use apenas JPEG, PNG, GIF ou WebP.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

/**
 * POST /api/usuarios/:id/foto
 * Upload de foto de perfil do usuário
 */
router.post("/:id/foto", upload.single("foto"), async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ erro: "Nenhuma foto foi enviada" });
    }

    // Buscar usuário
    const usuario = await User.findOne({ id: userId });

    if (!usuario) {
      // Remover arquivo se usuário não existir
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Remover foto antiga se existir
    if (usuario.foto) {
      const fotoAntigaPath = path.join(process.cwd(), usuario.foto);
      if (fs.existsSync(fotoAntigaPath)) {
        fs.unlinkSync(fotoAntigaPath);
      }
    }

    // Atualizar caminho da foto no usuário (relativo para funcionar no frontend)
    const fotoPath = `/usuarios/${req.file.filename}`;
    usuario.foto = fotoPath;
    await usuario.save();

    res.json({
      sucesso: true,
      mensagem: "Foto atualizada com sucesso",
      foto: fotoPath,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        foto: usuario.foto,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error);

    // Remover arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      erro: "Erro ao fazer upload da foto",
      detalhes: error.message,
    });
  }
});

/**
 * PATCH /api/usuarios/:id/cover
 * Atualiza o cover/tema do perfil do usuário
 */
router.patch("/:id/cover", async (req, res) => {
  try {
    const userId = req.params.id;
    const { coverId, selectedBadges, selectedAvatar } = req.body;

    console.log('Recebendo requisição para atualizar avatar do usuário:', userId);
    console.log('Body da requisição:', { coverId, selectedBadges, selectedAvatar });

    // At least one field must be provided
    if (!coverId && !selectedBadges && !selectedAvatar) {
      return res.status(400).json({ erro: "Pelo menos um campo deve ser fornecido: coverId, selectedBadges ou selectedAvatar" });
    }

    // Prepare update object
    const updateObj = {};

    // Include coverId if provided
    if (coverId !== undefined) {
      updateObj.coverId = coverId;
    }

    // Include selectedBadges if provided
    if (selectedBadges !== undefined) {
      updateObj.selectedBadges = selectedBadges;
    }

    // Include selectedAvatar if provided
    if (selectedAvatar !== undefined) {
      updateObj.foto = selectedAvatar;
    }

    console.log('Tentando atualizar usuário com ID:', userId);
    console.log('Objeto de atualização:', updateObj);

    const usuario = await User.findOneAndUpdate(
      { id: userId },
      updateObj,
      { new: true, runValidators: true },
    );

    console.log('Resultado da atualização:', usuario ? 'SUCESSO' : 'FALHA - Usuário não encontrado');

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        coverId: usuario.coverId,
        selectedBadges: usuario.selectedBadges,
        foto: usuario.foto,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    res.status(500).json({
      erro: "Erro ao atualizar perfil",
      detalhes: error.message,
    });
  }
});

/**
 * DELETE /api/usuarios/:id/foto
 * Remove foto de perfil do usuário
 */
router.delete("/:id/foto", async (req, res) => {
  try {
    const userId = req.params.id;

    const usuario = await User.findOne({ id: userId });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (!usuario.foto) {
      return res.status(400).json({ erro: "Usuário não possui foto" });
    }

    // Remover arquivo físico
    const fotoPath = path.join(process.cwd(), usuario.foto);
    if (fs.existsSync(fotoPath)) {
      fs.unlinkSync(fotoPath);
    }

    // Remover referência no banco
    usuario.foto = null;
    await usuario.save();

    res.json({
      sucesso: true,
      mensagem: "Foto removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover foto:", error);
    res.status(500).json({
      erro: "Erro ao remover foto",
      detalhes: error.message,
    });
  }
});

/**
 * GET /api/usuarios
 * Listar usuários com opção de filtro por loja
 */
router.get("/", verificarLojaObrigatoria, async (req, res) => {
  try {
    const usuarios = await User.find({ loja: req.loja._id })
      .populate("loja", "codigo nome")
      .sort({ nome: 1 });

    const usuariosFormatados = usuarios.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      foto: user.foto,
      coverId: user.coverId || "gradient-1",
      selectedBadges: user.selectedBadges || [],
      iniciais: user.nome
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
      contador: user.contadorTotal || 0,
      loja: user.loja,
    }));

    res.json(usuariosFormatados);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      erro: "Erro ao buscar usuários",
      detalhes: error.message,
    });
  }
});

/**
 * GET /api/usuarios/:id
 * Buscar usuário específico por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const usuario = await User.findOne({ id: req.params.id }).populate(
      "loja",
      "codigo nome cidade",
    );

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const usuarioFormatado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cargo: usuario.cargo,
      foto: usuario.foto,
      coverId: usuario.coverId || "gradient-1",
      selectedBadges: usuario.selectedBadges || [],
      iniciais: usuario.nome
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
      contador: usuario.contadorTotal || 0,
      loja: usuario.loja,
    };

    res.json(usuarioFormatado);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      erro: "Erro ao buscar usuário",
      detalhes: error.message,
    });
  }
});

export default router;
