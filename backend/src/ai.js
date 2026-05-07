/**
 * Score Routes (all require auth)
 *
 * POST /api/score    — calculate + persist score for current user
 * GET  /api/history  — return last 12 scores for current user
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { calcLDVS, getGrade } from "../ldvs.js";
import { generateRecs } from "../recommendations.js";
import { getAIRecommendations } from "../ai.js";

const router = Router();
router.use(requireAuth);

// ── Calculate + save score ────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    profileComplete, postFreq, engagement, responsiveness,
    platforms, businessName, sector, location,
    language = "en", source = "manual",
  } = req.body;

  // Input validation
  const metrics = { profileComplete, postFreq, engagement, responsiveness };
  for (const [key, val] of Object.entries(metrics)) {
    const n = Number(val);
    if (isNaN(n) || n < 0 || n > 100) {
      return res.status(400).json({ error: `Invalid value for ${key}. Must be 0-100.` });
    }
  }

  try {
    const scoreValue = calcLDVS({ profileComplete: Number(profileComplete), postFreq: Number(postFreq), engagement: Number(engagement), responsiveness: Number(responsiveness), platforms });
    const grade = getGrade(scoreValue);

    // Generate AI recs (falls back through Groq → Gemini → Claude → rule-based)
    const [recsEn, recsSw] = await Promise.all([
      getAIRecommendations({ score: scoreValue, profileComplete: Number(profileComplete), postFreq: Number(postFreq), engagement: Number(engagement), responsiveness: Number(responsiveness), platforms, businessName, sector, location, language: "en" }),
      getAIRecommendations({ score: scoreValue, profileComplete: Number(profileComplete), postFreq: Number(postFreq), engagement: Number(engagement), responsiveness: Number(responsiveness), platforms, businessName, sector, location, language: "sw" }),
    ]);

    // Persist score + recommendations in a transaction
    const saved = await prisma.$transaction(async (tx) => {
      const score = await tx.score.create({
        data: {
          userId:          req.user.id,
          score:           scoreValue,
          grade,
          profileComplete: Number(profileComplete),
          postFreq:        Number(postFreq),
          engagement:      Number(engagement),
          responsiveness:  Number(responsiveness),
          platformCount:   platforms?.length || 0,
          platforms:       platforms || [],
          businessName:    businessName?.trim() || null,
          sector:          sector || null,
          location:        location || null,
          source,
        },
      });

      // Store paired EN/SW recs
      await tx.recommendation.createMany({
        data: recsEn.map((rec, i) => ({
          scoreId:  score.id,
          icon:     rec.icon,
          priority: rec.priority,
          titleEn:  rec.title,
          titleSw:  recsSw[i]?.title || rec.title,
          descEn:   rec.desc,
          descSw:   recsSw[i]?.desc || rec.desc,
        })),
      });

      return score;
    });

    // If user just onboarded, mark it
    if (!req.body.hasOnboarded) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { hasOnboarded: true },
      }).catch(() => {}); // Non-fatal
    }

    const recs = language === "sw"
      ? recsSw
      : recsEn;

    res.json({
      id:             saved.id,
      score:          scoreValue,
      grade,
      recs,
      businessName,
      sector,
      location,
      platforms:      platforms || [],
      profileComplete: Number(profileComplete),
      postFreq:        Number(postFreq),
      engagement:      Number(engagement),
      responsiveness:  Number(responsiveness),
      date:   new Date().toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      timestamp: saved.createdAt.getTime(),
    });
  } catch (err) {
    console.error("Score calculation error:", err);
    res.status(500).json({ error: "Could not save score. Please try again." });
  }
});

// ── Score history ─────────────────────────────────────────────────────────────
router.get("/history", async (req, res) => {
  const lang = req.query.lang || "en";

  try {
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
      take: 12,
      include: { recommendations: true },
    });

    const result = scores.map(s => ({
      id:             s.id,
      score:          s.score,
      grade:          s.grade,
      profileComplete: s.profileComplete,
      postFreq:        s.postFreq,
      engagement:      s.engagement,
      responsiveness:  s.responsiveness,
      platforms:       s.platforms,
      businessName:    s.businessName,
      sector:          s.sector,
      location:        s.location,
      source:          s.source,
      date:   s.createdAt.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      timestamp: s.createdAt.getTime(),
      recs: s.recommendations.map(r => ({
        icon:     r.icon,
        priority: r.priority,
        title:    lang === "sw" ? r.titleSw : r.titleEn,
        desc:     lang === "sw" ? r.descSw  : r.descEn,
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Could not fetch score history." });
  }
});

export default router;