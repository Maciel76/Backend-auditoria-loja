// services/auditProductsService.js - Serviço para gerenciar produtos por tipo de auditoria
import LojaAuditProducts from "../models/LojaAuditProducts.js";
import Auditoria from "../models/Auditoria.js";

class AuditProductsService {
  // Função para limpar produtos de auditoria antes de processar nova planilha
  async limparProdutosPorLojaELojaTipo(lojaId, tipoAuditoria) {
    try {
      console.log(
        `🧹 Limpando produtos de auditoria para loja ${lojaId} e tipo ${tipoAuditoria}`
      );

      // Limpar produtos do tipo específico para a loja
      const resultado = await LojaAuditProducts.limparProdutosPorTipo(
        lojaId,
        tipoAuditoria
      );

      console.log(
        `✅ Produtos de auditoria do tipo ${tipoAuditoria} limpos para loja ${lojaId}`
      );
      return {
        success: true,
        message: `Produtos de auditoria do tipo ${tipoAuditoria} limpos com sucesso`,
        data: resultado,
      };
    } catch (error) {
      console.error(
        `❌ Erro ao limpar produtos de auditoria para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao limpar produtos de auditoria: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Função para limpar todos os produtos de auditoria de uma loja
  async limparTodosProdutosPorLoja(lojaId) {
    try {
      console.log(
        `🧹 Limpando todos os produtos de auditoria para loja ${lojaId}`
      );

      // Limpar todos os produtos para a loja
      const resultado = await LojaAuditProducts.limparTodosProdutos(lojaId);

      console.log(
        `✅ Todos os produtos de auditoria limpos para loja ${lojaId}`
      );
      return {
        success: true,
        message: "Todos os produtos de auditoria limpos com sucesso",
        data: resultado,
      };
    } catch (error) {
      console.error(
        `❌ Erro ao limpar todos os produtos de auditoria para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao limpar todos os produtos de auditoria: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Função para converter auditoria em objeto de produto padronizado
  converterAuditoriaParaProduto(auditoria) {
    return {
      codigo: auditoria.codigo || auditoria.codigoProduto || "",
      nome:
        auditoria.produto ||
        auditoria.nomeProduto ||
        auditoria.descricaoProduto ||
        "",
      classe:
        auditoria.ClasseProduto ||
        auditoria.classeProdutoRaiz ||
        auditoria.classeProduto ||
        "",
      local: auditoria.local || "",
      situacao: auditoria.situacao || auditoria.situacaoAtual || "",
      estoque: auditoria.estoque || auditoria.estoqueAtual || "0",
      ultimaCompra: auditoria.ultimaCompra || "",
      auditadoDia: auditoria.AuditadoDia || "",
      auditadoHora: auditoria.AuditadoHora || "",
      fornecedor: auditoria.fornecedor || "",
      setor: auditoria.setor || "",
      custoRuptura: auditoria.custoRuptura || 0,
      presenca: auditoria.presenca || false,
      presencaConfirmada: auditoria.presencaConfirmada || "",
      diasSemVenda: auditoria.diasSemVenda || 0,
      residuo: auditoria.residuo || "",
      classeProdutoRaiz: auditoria.classeProdutoRaiz || "",
      classeProduto: auditoria.classeProduto || "",
      situacaoAuditoria: auditoria.situacaoAuditoria || "",
      estoqueAtual: auditoria.estoqueAtual || "0",
      estoqueLeitura: auditoria.estoqueLeitura || "0",
      // Campos para armazenar informações do usuário que realizou a leitura
      usuarioLeitura: auditoria.usuarioNome || auditoria.usuario || "",
      usuarioId: auditoria.usuarioId || auditoria.usuario || ""
    };
  }

  // Função para extrair e armazenar produtos de auditorias existentes
  async extrairProdutosDeAuditorias(
    lojaId,
    lojaNome,
    tipoAuditoria,
    dataInicio,
    dataFim
  ) {
    try {
      console.log(
        `🔍 Extraindo produtos de auditorias para loja ${lojaId}, tipo ${tipoAuditoria}`
      );

      // Buscar auditorias da loja no período especificado
      const query = {
        loja: lojaId,
        tipo: tipoAuditoria,
      };

      // Adicionar filtro de data se fornecido
      if (dataInicio && dataFim) {
        query.dataAuditoria = {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim),
        };
      }

      const auditorias = await Auditoria.find(query).lean();

      // Converter auditorias em objetos de produto
      const produtos = [];
      const codigosUnicos = new Set(); // Para evitar duplicatas por código

      auditorias.forEach((auditoria) => {
        const produto = this.converterAuditoriaParaProduto(auditoria);

        // Verificar se o produto já foi adicionado (baseado no código)
        if (produto.codigo && !codigosUnicos.has(produto.codigo)) {
          codigosUnicos.add(produto.codigo);
          produtos.push(produto);
        } else if (
          !produto.codigo &&
          produto.nome &&
          !produtos.some((p) => p.nome === produto.nome)
        ) {
          // Se não tiver código, usar nome como identificador
          produtos.push(produto);
        }
      });

      if (produtos.length > 0) {
        // Adicionar os produtos ao modelo
        const resultado =
          await LojaAuditProducts.adicionarVariosProdutosDetalhados(
            lojaId,
            lojaNome,
            tipoAuditoria,
            produtos
          );

        console.log(
          `✅ ${produtos.length} produtos extraídos e armazenados para loja ${lojaId}, tipo ${tipoAuditoria}`
        );
        return {
          success: true,
          message: `${produtos.length} produtos extraídos e armazenados com sucesso`,
          totalProdutos: produtos.length,
          data: resultado,
        };
      } else {
        console.log(
          `ℹ️ Nenhum produto encontrado para loja ${lojaId}, tipo ${tipoAuditoria}`
        );
        return {
          success: true,
          message: "Nenhum produto encontrado para armazenar",
          totalProdutos: 0,
        };
      }
    } catch (error) {
      console.error(
        `❌ Erro ao extrair produtos de auditorias para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao extrair produtos de auditorias: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Função para processar nova planilha e atualizar produtos
  async processarNovaPlanilha(
    lojaId,
    lojaNome,
    tipoAuditoria,
    novasAuditorias
  ) {
    try {
      console.log(
        `🔄 Processando nova planilha para loja ${lojaId}, tipo ${tipoAuditoria}`
      );

      // Primeiro, limpar os produtos existentes do tipo específico
      await this.limparProdutosPorLojaELojaTipo(lojaId, tipoAuditoria);

      // Converter auditorias em objetos de produto
      const produtos = [];
      const codigosUnicos = new Set(); // Para evitar duplicatas por código

      novasAuditorias.forEach((auditoria) => {
        const produto = this.converterAuditoriaParaProduto(auditoria);

        // Verificar se o produto já foi adicionado (baseado no código)
        if (produto.codigo && !codigosUnicos.has(produto.codigo)) {
          codigosUnicos.add(produto.codigo);
          produtos.push(produto);
        } else if (
          !produto.codigo &&
          produto.nome &&
          !produtos.some((p) => p.nome === produto.nome)
        ) {
          // Se não tiver código, usar nome como identificador
          produtos.push(produto);
        }
      });

      if (produtos.length > 0) {
        // Adicionar os novos produtos ao modelo
        const resultado =
          await LojaAuditProducts.adicionarVariosProdutosDetalhados(
            lojaId,
            lojaNome,
            tipoAuditoria,
            produtos
          );

        console.log(
          `✅ ${produtos.length} produtos da nova planilha armazenados para loja ${lojaId}, tipo ${tipoAuditoria}`
        );
        return {
          success: true,
          message: `${produtos.length} produtos da nova planilha armazenados com sucesso`,
          totalProdutos: produtos.length,
          data: resultado,
        };
      } else {
        console.log(
          `ℹ️ Nenhum produto encontrado na nova planilha para loja ${lojaId}, tipo ${tipoAuditoria}`
        );
        return {
          success: true,
          message: "Nenhum produto encontrado na nova planilha para armazenar",
          totalProdutos: 0,
        };
      }
    } catch (error) {
      console.error(
        `❌ Erro ao processar nova planilha para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao processar nova planilha: ${error.message}`,
        error: error.message,
      };
    }
  }

  // Função para obter produtos por tipo de auditoria
  async getProdutosPorTipo(lojaId, tipoAuditoria) {
    try {
      const resultado = await LojaAuditProducts.obterProdutosPorTipo(
        lojaId,
        tipoAuditoria
      );

      if (!resultado) {
        return {
          success: false,
          message: "Nenhum produto encontrado para esta loja",
          produtos: { [tipoAuditoria]: [] },
        };
      }

      // Formatar resposta com estrutura esperada
      const produtos = resultado.produtos?.[tipoAuditoria] || [];

      return {
        success: true,
        message: `${produtos.length} produtos encontrados`,
        produtos: {
          [tipoAuditoria]: produtos,
        },
        totalProdutos: produtos.length,
      };
    } catch (error) {
      console.error(
        `❌ Erro ao obter produtos por tipo para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao obter produtos: ${error.message}`,
        produtos: { [tipoAuditoria]: [] },
        error: error.message,
      };
    }
  }

  // Função para obter todos os produtos de uma loja
  async getAllProdutosPorLoja(lojaId) {
    try {
      const resultado = await LojaAuditProducts.obterProdutosPorLoja(lojaId);

      return resultado; // O modelo já retorna o formato correto
    } catch (error) {
      console.error(
        `❌ Erro ao obter todos os produtos para loja ${lojaId}:`,
        error.message
      );
      return {
        success: false,
        message: `Erro ao obter produtos: ${error.message}`,
        produtos: {
          etiqueta: [],
          presenca: [],
          ruptura: [],
        },
        error: error.message,
      };
    }
  }
}

export default new AuditProductsService();
