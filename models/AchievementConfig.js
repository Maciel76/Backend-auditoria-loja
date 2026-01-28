import mongoose from "mongoose";

const achievementConfigSchema = new mongoose.Schema(
  {
    achievementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: ["Basica", "Comum", "Raro", "Epico", "Lendario", "Diamante", "Especial"],
    },
    points: {
      type: Number,
      required: true,
    },
    criteria: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para garantir que cada conquista tenha apenas uma configuração
achievementConfigSchema.index({ achievementId: 1 });

// Método estático para obter todas as configurações
achievementConfigSchema.statics.getAllConfigs = async function() {
  const configs = await this.find({ isActive: true });
  
  // Converter para o formato esperado
  const configsMap = {};
  configs.forEach(config => {
    configsMap[config.achievementId] = {
      title: config.title,
      description: config.description,
      icon: config.icon,
      category: config.category,
      difficulty: config.difficulty,
      rarity: config.rarity,
      points: config.points,
      criteria: config.criteria,
    };
  });
  
  return configsMap;
};

// Método estático para atualizar uma configuração
achievementConfigSchema.statics.updateConfig = async function(achievementId, updateData, updatedBy = "system") {
  const config = await this.findOneAndUpdate(
    { achievementId: achievementId },
    {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: updatedBy
    },
    {
      new: true,
      upsert: true, // Cria se não existir
      runValidators: true
    }
  );

  return config;
};

const AchievementConfig = mongoose.model("AchievementConfig", achievementConfigSchema);

export default AchievementConfig;