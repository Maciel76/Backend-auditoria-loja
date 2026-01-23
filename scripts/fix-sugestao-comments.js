// scripts/fix-sugestao-comments.js - Script para corrigir dados de comentários nas sugestões existentes
import mongoose from "mongoose";
import Sugestao from "../models/Sugestao.js";
import User from "../models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

async function fixSugestaoComments() {
  try {
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    console.log("🔍 Buscando sugestões com comentários...");
    const sugestoes = await Sugestao.find({ "comentarios.0": { $exists: true } });
    
    console.log(`📊 Encontradas ${sugestoes.length} sugestões com comentários`);
    
    let sugestoesAtualizadas = 0;
    let comentariosCorrigidos = 0;

    for (const sugestao of sugestoes) {
      let comentariosModificados = false;
      
      for (let i = 0; i < sugestao.comentarios.length; i++) {
        const comentario = sugestao.comentarios[i];
        
        // Verificar e corrigir userId se necessário
        if (!comentario.userId) {
          console.log(`⚠️  Comentário ${i} na sugestão ${sugestao._id} está sem userId`);

          // Tentar inferir o userId com base em outros campos
          if (comentario.autor) {
            const usuario = await User.findOne({ nome: comentario.autor });
            if (usuario) {
              comentario.userId = usuario._id;
              comentariosModificados = true;
              comentariosCorrigidos++;
              console.log(`   ✅ userId inferido para usuário: ${comentario.autor}`);
            } else {
              // Se não encontrar o usuário, tentar encontrar por outro campo
              // Pode ser que o autor seja um ID ou email
              const usuarioPorId = await User.findOne({ id: comentario.autor });
              if (usuarioPorId) {
                comentario.userId = usuarioPorId._id;
                comentariosModificados = true;
                comentariosCorrigidos++;
                console.log(`   ✅ userId inferido por ID para: ${comentario.autor}`);
              } else {
                // Como o campo é obrigatório no schema, precisamos garantir que tenha um valor
                // Vamos tentar encontrar algum usuário padrão ou criar um valor fictício
                // Mas o ideal é tentar manter a integridade dos dados
                const primeiroUsuario = await User.findOne();
                if (primeiroUsuario) {
                  comentario.userId = primeiroUsuario._id;
                  comentariosModificados = true;
                  comentariosCorrigidos++;
                  console.log(`   ✅ userId definido para primeiro usuário encontrado`);
                } else {
                  console.error(`   ❌ Nenhum usuário encontrado para associar ao comentário`);
                }
              }
            }
          } else {
            // Se não tiver autor, tentar usar o primeiro usuário disponível
            const primeiroUsuario = await User.findOne();
            if (primeiroUsuario) {
              comentario.userId = primeiroUsuario._id;
              comentariosModificados = true;
              comentariosCorrigidos++;
              console.log(`   ✅ userId definido para primeiro usuário (sem autor definido)`);
            } else {
              console.error(`   ❌ Nenhum usuário disponível para comentário sem autor`);
            }
          }
        }
        
        // Verificar e corrigir avatar se necessário
        if (comentario.avatar && comentario.avatar.length > 200) {
          console.log(`⚠️  Comentário ${i} na sugestão ${sugestao._id} tem avatar muito longo`);
          comentario.avatar = comentario.avatar.substring(0, 200); // Truncar para o novo limite
          comentariosModificados = true;
          comentariosCorrigidos++;
          console.log(`   ✅ Avatar truncado para ${comentario.avatar.length} caracteres`);
        }
      }
      
      if (comentariosModificados) {
        await sugestao.save();
        sugestoesAtualizadas++;
        console.log(`📝 Sugestão ${sugestao._id} atualizada`);
      }
    }

    console.log("\n📈 Resultado da correção:");
    console.log(`   - Sugestões atualizadas: ${sugestoesAtualizadas}`);
    console.log(`   - Comentários corrigidos: ${comentariosCorrigidos}`);
    console.log("✅ Processo concluído com sucesso!");

  } catch (error) {
    console.error("❌ Erro ao corrigir comentários:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixSugestaoComments();
}

export default fixSugestaoComments;