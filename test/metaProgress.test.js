import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialMeta,
  investTraining,
  normalizeMeta,
  refundTraining,
  rewardBoss,
  unlockEnding,
} from '../src/metaProgress.js';
import {
  GAME_PHASE,
  canOfferLevelChoice,
  isCombatPaused,
  resolveGamePhase,
  stageGoalFor,
} from '../src/gameFlow.js';

test('training uses escalating costs and can be fully refunded', () => {
  let meta = createInitialMeta();
  meta = investTraining(meta, 'claw');
  meta = investTraining(meta, 'claw');
  assert.equal(meta.trainingLevels.claw, 2);
  assert.equal(meta.trainingPoints, 2);
  meta = refundTraining(meta);
  assert.equal(meta.trainingLevels.claw, 0);
  assert.equal(meta.trainingPoints, 5);
});

test('boss rewards persist and a new ending rewards only once', () => {
  let meta = rewardBoss(createInitialMeta(), true);
  assert.equal(meta.trainingPoints, 9);
  meta = unlockEnding(meta, 'asadal');
  assert.equal(meta.trainingPoints, 11);
  meta = unlockEnding(meta, 'asadal');
  assert.equal(meta.trainingPoints, 11);
  assert.deepEqual(meta.unlockedEndings, ['asadal']);
});

test('corrupted save values are normalized', () => {
  const meta = normalizeMeta({ trainingPoints: -3, trainingLevels: { claw: 99 }, unlockedEndings: ['unknown'] });
  assert.equal(meta.trainingPoints, 0);
  assert.equal(meta.trainingLevels.claw, 5);
  assert.deepEqual(meta.unlockedEndings, []);
});

test('combat runs only in the playing phase', () => {
  const base = { atHome: false, prologueStep: -1, tutorial: false, chapter: null, gameOver: false, win: false, hasChoices: false };
  assert.equal(resolveGamePhase(base), GAME_PHASE.PLAYING);
  assert.equal(isCombatPaused(resolveGamePhase({ ...base, atHome: true })), true);
  assert.equal(isCombatPaused(resolveGamePhase({ ...base, hasChoices: true })), true);
  assert.equal(isCombatPaused(resolveGamePhase({ ...base, win: true, hasChoices: true })), true);
});

test('the final boss cannot open another tribe choice', () => {
  assert.equal(canOfferLevelChoice({ clearedFinalBoss: true, health: 40 }), false);
  assert.equal(canOfferLevelChoice({ clearedFinalBoss: false, health: 40, finalStage: true }), false);
  assert.equal(canOfferLevelChoice({ clearedFinalBoss: false, health: 40 }), true);
});

test('stage goals keep a full run moving without changing boss goals', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((stage) => stageGoalFor(stage, stage % 3 === 0)), [7, 9, 1, 13, 15, 1]);
});
