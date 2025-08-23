import mongoose from "mongoose";

const conectarBanco = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/auditoria");
    console.log("✅ Conectado ao MongoDB Local");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

export default conectarBanco;
