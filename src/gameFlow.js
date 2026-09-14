export const GAME_PHASE = Object.freeze({
  HOME: 'home',
  PROLOGUE: 'prologue',
  TUTORIAL: 'tutorial',
  PLAYING: 'playing',
  CHOICE: 'choice',
  CHAPTER: 'chapter',
  DEFEAT: 'defeat',
  ENDING: 'ending',
});

export function resolveGamePhase({ atHome, prologueStep, tutorial, chapter, gameOver, win, hasChoices }) {
  if (atHome) return GAME_PHASE.HOME;
  if (win) return GAME_PHASE.ENDING;
  if (gameOver) return GAME_PHASE.DEFEAT;
  if (chapter) return GAME_PHASE.CHAPTER;
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
