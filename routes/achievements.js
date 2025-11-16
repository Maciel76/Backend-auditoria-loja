import express from "express";
import achievementRulesService from "../services/achievementRulesService.js";
import { UserAchievement } from "../models/UserAchievement.js";
import { extractLoja } from "../middleware/auth.js";

const router = express.Router();

// GET /api/achievements - Get all user achievements
router.get("/", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDoc = await UserAchievement.findOne({ userId, loja });

    if (!userDoc) {
      return res.json({
        success: true,
        achievements: [],
        message: "No achievements found for this user",
      });
    }

    res.json({
      success: true,
      achievements: userDoc.achievements,
      xp: userDoc.xp,
      level: userDoc.level,
      stats: userDoc.stats,
    });
  } catch (error) {
    console.error("Error getting user achievements:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/achievements/evaluate - Manually trigger achievement evaluation
router.post("/evaluate", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.body.userId;
    const dataReferencia = req.body.dataReferencia
      ? new Date(req.body.dataReferencia)
      : new Date();

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await achievementRulesService.evaluateUserAchievements(
      userId,
      loja,
      dataReferencia
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error evaluating achievements:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/xp - Get user XP and level
router.get("/xp", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDoc = await UserAchievement.findOne({ userId, loja });

    if (!userDoc) {
      return res.json({
        success: true,
        xp: { total: 0, fromAchievements: 0, fromActivities: 0 },
        level: {
          current: 1,
          title: "Novato",
          xpForNextLevel: 100,
          progressPercentage: 0,
        },
        stats: { totalUnlockedAchievements: 0, totalAudits: 0, totalItems: 0 },
      });
    }

    res.json({
      success: true,
      userId: userDoc.userId,
      userName: userDoc.userName,
      xp: userDoc.xp,
      level: userDoc.level,
      stats: userDoc.stats,
    });
  } catch (error) {
    console.error("Error getting user XP:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/achievements/ranking - Get ranking by XP
router.get("/ranking", extractLoja, async (req, res) => {
  try {
    const { loja } = req;
    const limit = parseInt(req.query.limit) || 10;

    const ranking = await UserAchievement.getRankingByXp(loja, limit);

    res.json({
      success: true,
      ranking: ranking.map((user, index) => ({
        position: index + 1,
        userId: user.userId,
        userName: user.userName,
        xp: user.xp,
        level: user.level,
        stats: user.stats,
      })),
    });
  } catch (error) {
    console.error("Error getting ranking:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;