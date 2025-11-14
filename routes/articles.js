import express from "express";
import Article from "../models/Article.js";
import Loja from "../models/Loja.js";

const router = express.Router();

// POST /api/articles - Criar novo artigo
router.post("/api/articles", async (req, res) => {
  try {
    const {
      titulo,
      conteudo,
      resumo,
      autor,
      categorias = ['geral'],
      tags = [],
      imagem,
      tempoLeitura,
      status = 'draft',
      destaque = false,
      slug
    } = req.body;

    // Validação básica
    if (!titulo || titulo.trim().length === 0) {
      return res.status(400).json({
        erro: "Título é obrigatório",
      });
    }

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({
        erro: "Conteúdo é obrigatório",
      });
    }

    // Obter loja do header
    let lojaId = null;
    const codigoLoja = req.headers["x-loja"];
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        lojaId = loja._id;
      }
    }

    // Criar novo artigo
    const novoArtigo = new Article({
      titulo: titulo.trim(),
      slug: slug || undefined,
      conteudo: conteudo.trim(),
      resumo: resumo ? resumo.trim() : null,
      autor: autor ? autor.trim() : "Admin",
      categorias: Array.isArray(categorias) ? categorias : [categorias],
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim().toLowerCase()) : [],
      imagem: imagem || null,
      tempoLeitura: tempoLeitura || 5,
      status,
      destaque,
      loja: lojaId,
    });

    const artigoSalvo = await novoArtigo.save();

    // Se for destaque, remove destaque dos outros
    if (destaque) {
      await Article.updateMany(
        { _id: { $ne: artigoSalvo._id }, destaque: true },
        { $set: { destaque: false } }
      );
    }

    res.status(201).json({
      message: "Artigo criado com sucesso!",
      article: artigoSalvo,
    });
  } catch (error) {
    console.error("Erro ao criar artigo:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles - Listar artigos com filtros e paginação
router.get("/api/articles", async (req, res) => {
  try {
    const {
      status,
      categoria,
      loja: codigoLoja,
      tags,
      busca,
      destaque,
      limite = 20,
      pagina = 1,
      sort = 'recent'
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (status) filtros.status = status;
    if (destaque !== undefined) filtros.destaque = destaque === 'true';

    // Filtro por categoria
    if (categoria) {
      filtros.categorias = categoria;
    }

    // Filtro por loja
    if (codigoLoja) {
      const loja = await Loja.findOne({ codigo: codigoLoja });
      if (loja) {
        filtros.loja = loja._id;
      }
    }

    // Filtro por tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filtros.tags = { $in: tagArray };
    }

    // Busca por título, conteúdo ou resumo
    if (busca) {
      filtros.$or = [
        { titulo: { $regex: busca, $options: "i" } },
        { conteudo: { $regex: busca, $options: "i" } },
        { resumo: { $regex: busca, $options: "i" } },
      ];
    }

    // Definir ordenação
    let sortConfig = { dataPublicacao: -1, createdAt: -1 };
    if (sort === 'popular') {
      sortConfig = { visualizacoes: -1, createdAt: -1 };
    } else if (sort === 'reactions') {
      sortConfig = { 'reactions.like.count': -1, 'reactions.heart.count': -1, createdAt: -1 };
    }

    // Paginação
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const artigos = await Article.find(filtros)
      .populate("loja", "nome codigo")
      .populate("usuario", "nome email foto")
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limite));

    const total = await Article.countDocuments(filtros);

    res.json({
      artigos,
      paginacao: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / parseInt(limite)),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar artigos:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles/featured - Obter artigo em destaque
router.get("/api/articles/featured", async (req, res) => {
  try {
    const artigo = await Article.buscarDestaque();

    if (!artigo) {
      return res.status(404).json({
        erro: "Nenhum artigo em destaque encontrado",
      });
    }

    res.json(artigo);
  } catch (error) {
    console.error("Erro ao buscar artigo em destaque:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles/:id - Obter detalhes de um artigo específico
router.get("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { incrementView = 'true' } = req.query;

    let artigo;

    if (incrementView === 'true') {
      artigo = await Article.findByIdAndUpdate(
        id,
        { $inc: { visualizacoes: 1 } },
        { new: true }
      )
        .populate("loja", "nome codigo")
        .populate("usuario", "nome email foto")
        .populate("comentarios.usuario", "nome email foto");
    } else {
      artigo = await Article.findById(id)
        .populate("loja", "nome codigo")
        .populate("usuario", "nome email foto")
        .populate("comentarios.usuario", "nome email foto");
    }

    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    res.json(artigo);
  } catch (error) {
    console.error("Erro ao buscar artigo:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles/slug/:slug - Buscar artigo por slug
router.get("/api/articles/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { incrementView = 'true' } = req.query;

    let artigo;

    if (incrementView === 'true') {
      artigo = await Article.findOneAndUpdate(
        { slug },
        { $inc: { visualizacoes: 1 } },
        { new: true }
      )
        .populate("loja", "nome codigo")
        .populate("usuario", "nome email foto")
        .populate("comentarios.usuario", "nome email foto");
    } else {
      artigo = await Article.findOne({ slug })
        .populate("loja", "nome codigo")
        .populate("usuario", "nome email foto")
        .populate("comentarios.usuario", "nome email foto");
    }

    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    res.json(artigo);
  } catch (error) {
    console.error("Erro ao buscar artigo por slug:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles/:id/related - Buscar artigos relacionados
router.get("/api/articles/:id/related", async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 3 } = req.query;

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    const relacionados = await Article.buscarRelacionados(
      id,
      artigo.categorias,
      artigo.tags,
      parseInt(limite)
    );

    res.json(relacionados);
  } catch (error) {
    console.error("Erro ao buscar artigos relacionados:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// PUT /api/articles/:id - Atualizar artigo
router.put("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      conteudo,
      resumo,
      autor,
      categorias,
      status,
      tags,
      imagem,
      tempoLeitura,
      destaque,
      slug
    } = req.body;

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    // Atualizar campos se fornecidos
    if (titulo !== undefined) artigo.titulo = titulo.trim();
    if (slug !== undefined) artigo.slug = slug.trim();
    if (conteudo !== undefined) artigo.conteudo = conteudo.trim();
    if (resumo !== undefined) artigo.resumo = resumo.trim();
    if (autor !== undefined) artigo.autor = autor.trim();
    if (categorias !== undefined) artigo.categorias = Array.isArray(categorias) ? categorias : [categorias];
    if (status !== undefined) artigo.status = status;
    if (tags !== undefined) artigo.tags = Array.isArray(tags) ? tags.map(t => String(t).trim().toLowerCase()) : [];
    if (imagem !== undefined) artigo.imagem = imagem;
    if (tempoLeitura !== undefined) artigo.tempoLeitura = tempoLeitura;
    if (destaque !== undefined) {
      artigo.destaque = destaque;
      // Se tornou destaque, remove destaque dos outros
      if (destaque) {
        await Article.updateMany(
          { _id: { $ne: id }, destaque: true },
          { $set: { destaque: false } }
        );
      }
    }

    await artigo.save();

    res.json({
      message: "Artigo atualizado com sucesso",
      article: artigo,
    });
  } catch (error) {
    console.error("Erro ao atualizar artigo:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// PUT /api/articles/:id/publish - Publicar artigo
router.put("/api/articles/:id/publish", async (req, res) => {
  try {
    const { id } = req.params;

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    await artigo.publicar();

    res.json({
      message: "Artigo publicado com sucesso",
      article: artigo,
    });
  } catch (error) {
    console.error("Erro ao publicar artigo:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// PUT /api/articles/:id/feature - Tornar artigo destaque
router.put("/api/articles/:id/feature", async (req, res) => {
  try {
    const { id } = req.params;

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    await artigo.tornarDestaque();

    res.json({
      message: "Artigo marcado como destaque",
      article: artigo,
    });
  } catch (error) {
    console.error("Erro ao marcar artigo como destaque:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// DELETE /api/articles/:id - Deletar artigo
router.delete("/api/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const artigo = await Article.findByIdAndDelete(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    res.json({
      message: "Artigo deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar artigo:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// POST /api/articles/:id/react - Reagir a um artigo
router.post("/api/articles/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, userIdentifier } = req.body;

    if (!["like", "dislike", "fire", "heart"].includes(reaction)) {
      return res.status(400).json({
        erro: "Reação deve ser: like, dislike, fire ou heart",
      });
    }

    if (!userIdentifier) {
      return res.status(400).json({
        erro: "Identificador do usuário é obrigatório",
      });
    }

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    // Inicializar reactions se não existir
    if (!artigo.reactions) {
      artigo.reactions = {
        like: { count: 0, users: [] },
        dislike: { count: 0, users: [] },
        fire: { count: 0, users: [] },
        heart: { count: 0, users: [] },
      };
    }

    // Verificar se usuário já reagiu
    const hasReacted = artigo.reactions[reaction].users.includes(
      userIdentifier
    );

    if (hasReacted) {
      // Remover reação
      artigo.reactions[reaction].count = Math.max(
        0,
        artigo.reactions[reaction].count - 1
      );
      artigo.reactions[reaction].users = artigo.reactions[
        reaction
      ].users.filter((user) => user !== userIdentifier);
    } else {
      // Remover outras reações deste usuário
      ["like", "dislike", "fire", "heart"].forEach((r) => {
        if (artigo.reactions[r].users.includes(userIdentifier)) {
          artigo.reactions[r].count = Math.max(
            0,
            artigo.reactions[r].count - 1
          );
          artigo.reactions[r].users = artigo.reactions[r].users.filter(
            (user) => user !== userIdentifier
          );
        }
      });

      // Adicionar nova reação
      artigo.reactions[reaction].count += 1;
      artigo.reactions[reaction].users.push(userIdentifier);
    }

    await artigo.save();

    res.json({
      message: hasReacted ? "Reação removida" : "Reação adicionada",
      reactions: artigo.reactions,
      hasReacted: !hasReacted,
    });
  } catch (error) {
    console.error("Erro ao reagir:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// POST /api/articles/:id/comentarios - Adicionar comentário
router.post("/api/articles/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario, usuarioId, nome } = req.body;

    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({
        erro: "Comentário é obrigatório",
      });
    }

    const artigo = await Article.findById(id);
    if (!artigo) {
      return res.status(404).json({
        erro: "Artigo não encontrado",
      });
    }

    artigo.comentarios.push({
      usuario: usuarioId || null,
      nome: nome || "Anônimo",
      comentario: comentario.trim(),
      data: new Date(),
    });

    await artigo.save();

    // Popular o comentário recém adicionado
    const artigoAtualizado = await Article.findById(id)
      .populate("comentarios.usuario", "nome email foto");

    res.status(201).json({
      message: "Comentário adicionado com sucesso",
      comentarios: artigoAtualizado.comentarios,
    });
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

// GET /api/articles/stats/overview - Estatísticas gerais
router.get("/api/articles/stats/overview", async (req, res) => {
  try {
    const total = await Article.countDocuments();
    const publicados = await Article.countDocuments({ status: "published" });
    const rascunhos = await Article.countDocuments({ status: "draft" });
    const arquivados = await Article.countDocuments({ status: "archived" });

    const totalVisualizacoes = await Article.aggregate([
      { $group: { _id: null, total: { $sum: "$visualizacoes" } } },
    ]);

    const maisVistos = await Article.find({ status: "published" })
      .sort({ visualizacoes: -1 })
      .limit(5)
      .select("titulo visualizacoes");

    res.json({
      total,
      publicados,
      rascunhos,
      arquivados,
      totalVisualizacoes:
        totalVisualizacoes.length > 0 ? totalVisualizacoes[0].total : 0,
      maisVistos,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      details: error.message,
    });
  }
});

export default router;
