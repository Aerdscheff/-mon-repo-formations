/*
 * Progression and XP utilities
 *
 * This module encapsulates the logic for calculating experience points,
 * levels and tiers based on a configurable role map. The role map is
 * defined in `/config/rolemap.json` and contains XP thresholds, difficulty
 * multipliers and tier/job definitions.
 */
import { asset } from '../utils/paths.js';

let roleMapCache = null;

/**
 * Loads the role map configuration. Cached after first call.
 * @returns {Promise<Object>}
 */
export async function loadRoleMap() {
  if (roleMapCache) return roleMapCache;
  const res = await fetch(asset('config/rolemap.json'), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load role map');
  }
  roleMapCache = await res.json();
  return roleMapCache;
}

/**
 * Determines the level for a given total XP.
 * @param {number} xp
 * @returns {number}
 */
export function levelForXp(xp, levelsArray) {
  let level = 1;
  for (let i = 0; i < levelsArray.length; i++) {
    if (xp >= levelsArray[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Returns the tier id for a given level.
 * @param {number} level
 * @param {Array} tiers
 */
export function tierForLevel(level, tiers) {
  for (const t of tiers) {
    if (level >= t.minLevel && level <= t.maxLevel) return t.id;
  }
  return tiers[0].id;
}

/**
 * Computes XP earned for a run based on correct/wrong answers and streak.
 * Applies difficulty multipliers and caps.
 * @param {Object} opts
 * @param {number} opts.correct
 * @param {number} opts.wrong
 * @param {number} opts.streakMax
 * @param {string} opts.difficultyId
 * @param {Object} roleMap
 */
export function computeXpEarned({ correct, wrong, streakMax, difficultyId }, roleMap) {
  const base = roleMap.xp.basePerCorrect ?? 20;
  const streakBonus = roleMap.xp.streakBonus ?? 0;
  const mult = roleMap.difficulty[difficultyId] ?? 1;
  let xp = correct * base * mult;
  if (streakMax > 1) {
    xp += streakBonus * (streakMax - 1);
  }
  // Penalise wrong answers lightly
  xp -= wrong * 5;
  if (xp < 0) xp = 0;
  return Math.min(xp, roleMap.xp.maxXpPerRun ?? 2000);
}

/**
 * Applies XP gain to a progress record and updates level/tier.
 * @param {Object} progress
 * @param {number} xpEarned
 * @param {Object} roleMap
 * @returns {Object} new progress
 */
export function applyXp(progress, xpEarned, roleMap) {
  const newXp = (progress.xp_total || 0) + xpEarned;
  const level = levelForXp(newXp, roleMap.xp.levels);
  const tier = tierForLevel(level, roleMap.roles.tiers);
  return { ...progress, xp_total: newXp, level, tier };
}