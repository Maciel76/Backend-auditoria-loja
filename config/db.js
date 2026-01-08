import mongoose from "mongoose";

const conectarBanco = async () => {
  try {
    // Use MongoDB Atlas connection string from environment variables, fallback to local
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auditoria";

    await mongoose.connect(mongoUri);
    console.log(`✅ Conectado ao MongoDB: ${mongoUri.includes('mongodb.net') ? 'Atlas' : 'Local'}`);
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }
};

export default conectarBanco;
