export const GAME_PHASE = Object.freeze({
  HOME: 'home',
  PROLOGUE: 'prologue',
  TUTORIAL: 'tutorial',
  PLAYING: 'playing',
  CHOICE: 'choice',
  DECISION: 'decision',
  REWARD: 'reward',
  TRAVEL: 'travel',
  CHAPTER: 'chapter',
  DEFEAT: 'defeat',
  ENDING: 'ending',
});

export function resolveGamePhase({ atHome, prologueStep, tutorial, chapter, gameOver, win, hasChoices, hasDecision, hasReward, travelling }) {
  if (atHome) return GAME_PHASE.HOME;
  if (win) return GAME_PHASE.ENDING;
  if (gameOver) return GAME_PHASE.DEFEAT;
  if (chapter) return GAME_PHASE.CHAPTER;
  if (travelling) return GAME_PHASE.TRAVEL;
  if (hasReward) return GAME_PHASE.REWARD;
  if (hasDecision) return GAME_PHASE.DECISION;
  if (hasChoices) return GAME_PHASE.CHOICE;
  if (prologueStep >= 0) return GAME_PHASE.PROLOGUE;
  if (tutorial) return GAME_PHASE.TUTORIAL;
  return GAME_PHASE.PLAYING;
}

export const isCombatPaused = (phase) => phase !== GAME_PHASE.PLAYING;

export const canOfferLevelChoice = ({ clearedFinalBoss, health, finalStage = false }) => (
  !clearedFinalBoss && health > 0 && !finalStage
);

export const stageGoalFor = (stage, isBoss) => (isBoss ? 1 : 5 + stage * 2);

export const enemyRunFrame = (runCycleTime, speedScale) => {
  const frameDuration = speedScale < 0.8 ? 190 : 135;
  return Math.floor(runCycleTime / frameDuration) % 2 + 1;
};

export const filterSkillsByPrerequisite = (skills, levels) => (
  skills.filter((skill) => !skill.requires || (levels[skill.requires] ?? 0) > 0)
);

export const canProposeTigerAlliance = ({ reputation, sparedTribes, followers }) => (
  reputation >= 45 && reputation < 70 && sparedTribes <= 2 && followers >= 2
);

export function resolveTribeReaction(choice, roll = Math.random()) {
  if (choice === 'spare') return roll < 0.5 ? 'accept' : 'resist';
  return roll < 0.1 ? 'flee' : 'resist';
}

export const reputationForDefeat = (enemyType, scale = 1) => (
  (enemyType === 'boss' ? 6 : 1) * scale
);

export function resolveEnding({ reputation, sparedTribes, followers, runsStarted, foundForgottenTribe, tigerAlliance }) {
  if (tigerAlliance && canProposeTigerAlliance({ reputation, sparedTribes, followers })) return 'jinguk';
  if (sparedTribes >= 4 && followers >= 2 && reputation <= 12) return 'asadal';
  if (foundForgottenTribe) return 'forgotten_tribe';
  if (reputation >= 70) return 'conqueror';
  if (reputation >= 36 && sparedTribes <= 1) return 'rebellion';
  if (sparedTribes >= 4) return 'bear_return';
  if (runsStarted >= 2 && reputation <= 28) return 'hwanung_parting';
  return 'tiger_heir';
}
