import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialMeta,
  investTraining,
  normalizeMeta,
  recordRunStart,
  refundTraining,
  rewardBoss,
  unlockEnding,
  unlockMemory,
} from '../src/metaProgress.js';
import {
  GAME_PHASE,
  canOfferLevelChoice,
  canProposeTigerAlliance,
  enemyRunFrame,
  filterSkillsByPrerequisite,
  isCombatPaused,
  reputationForDefeat,
  resolveGamePhase,
  resolveEnding,
  resolveTribeReaction,
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

test('journey memories unlock once and award persistent training points', () => {
  let meta = recordRunStart(createInitialMeta());
  assert.equal(meta.runsStarted, 1);
  assert.equal(meta.trainingPoints, 7);
  assert.deepEqual(meta.unlockedMemories, ['tiger_lie']);

  meta = recordRunStart(recordRunStart(meta));
  assert.equal(meta.runsStarted, 3);
  assert.equal(meta.trainingPoints, 9);
  assert.deepEqual(meta.unlockedMemories, ['tiger_lie', 'mountain_stranger']);

  meta = unlockMemory(meta, 'snake_elder');
  assert.equal(meta.trainingPoints, 11);
  meta = unlockMemory(meta, 'snake_elder');
  assert.equal(meta.trainingPoints, 11);
});

test('the tiger heir ending records the surviving child as a memory', () => {
  const meta = unlockEnding(createInitialMeta(), 'tiger_heir');
  assert.equal(meta.trainingPoints, 9);
  assert.deepEqual(meta.unlockedMemories, ['tiger_child']);
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

test('eight ending routes resolve from run history and the final alliance choice', () => {
  assert.equal(resolveEnding({ reputation: 52, sparedTribes: 1, followers: 2, runsStarted: 1, tigerAlliance: true }), 'jinguk');
  assert.equal(resolveEnding({ reputation: 30, sparedTribes: 1, followers: 2, runsStarted: 1, tigerAlliance: true }), 'tiger_heir');
  assert.equal(resolveEnding({ reputation: 8, sparedTribes: 4, followers: 2, runsStarted: 1 }), 'asadal');
  assert.equal(resolveEnding({ reputation: 75, sparedTribes: 0, followers: 0, runsStarted: 1 }), 'conqueror');
  assert.equal(resolveEnding({ reputation: 40, sparedTribes: 0, followers: 0, runsStarted: 1 }), 'rebellion');
  assert.equal(resolveEnding({ reputation: 20, sparedTribes: 4, followers: 0, runsStarted: 1 }), 'bear_return');
  assert.equal(resolveEnding({ reputation: 20, sparedTribes: 2, followers: 0, runsStarted: 2 }), 'hwanung_parting');
  assert.equal(resolveEnding({ reputation: 20, sparedTribes: 2, followers: 0, runsStarted: 1 }), 'tiger_heir');
  assert.equal(resolveEnding({ reputation: 0, sparedTribes: 3, followers: 1, runsStarted: 3, foundForgottenTribe: true }), 'forgotten_tribe');
});

test('the tiger marriage alliance requires ambition and an established force', () => {
  assert.equal(canProposeTigerAlliance({ reputation: 52, sparedTribes: 1, followers: 2 }), true);
  assert.equal(canProposeTigerAlliance({ reputation: 30, sparedTribes: 1, followers: 2 }), false);
  assert.equal(canProposeTigerAlliance({ reputation: 52, sparedTribes: 3, followers: 2 }), false);
  assert.equal(canProposeTigerAlliance({ reputation: 52, sparedTribes: 1, followers: 1 }), false);
  assert.equal(canProposeTigerAlliance({ reputation: 72, sparedTribes: 0, followers: 3 }), false);
});

test('tribe reactions use the requested persuasion and flight probabilities', () => {
  assert.equal(resolveTribeReaction('spare', 0.49), 'accept');
  assert.equal(resolveTribeReaction('spare', 0.5), 'resist');
  assert.equal(resolveTribeReaction('fight', 0.09), 'flee');
  assert.equal(resolveTribeReaction('fight', 0.1), 'resist');
});

test('resisting and fleeing enemies apply their reputation multipliers', () => {
  assert.equal(reputationForDefeat('raider', 0.5), 0.5);
  assert.equal(reputationForDefeat('raider', 5), 5);
  assert.equal(reputationForDefeat('boss'), 6);
});

test('slow sheep and boar archetypes alternate their running frames', () => {
  assert.deepEqual([enemyRunFrame(0, 0.74), enemyRunFrame(190, 0.74)], [1, 2]);
  assert.deepEqual([enemyRunFrame(0, 0.68), enemyRunFrame(190, 0.68)], [1, 2]);
});

test('poison and flame enhancers require their base weapon effect', () => {
  const skills = [
    { id: 'poison', requires: undefined },
    { id: 'cold-blood', requires: 'poison' },
  ];
  assert.deepEqual(filterSkillsByPrerequisite(skills, {}).map(({ id }) => id), ['poison']);
  assert.deepEqual(filterSkillsByPrerequisite(skills, { poison: 1 }).map(({ id }) => id), ['poison', 'cold-blood']);
});
