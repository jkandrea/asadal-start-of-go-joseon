export const META_STORAGE_KEY = 'asadal.meta.v1';

export const TRAINING_ITEMS = [
  { id: 'claw', name: '곰의 발톱', description: '기본 공격력이 레벨마다 3% 증가합니다.', maxLevel: 5 },
  { id: 'herb', name: '쑥의 향', description: '60초마다 최대 체력의 1.5% × 레벨만큼 회복합니다.', maxLevel: 5 },
  { id: 'stomp', name: '마늘밭', description: '2초마다 주변 적에게 공격력의 10% × 레벨만큼 피해를 줍니다.', maxLevel: 5 },
  { id: 'roar', name: '곰의 포효', description: '주기적으로 광역 피해와 넉백을 줍니다. 레벨마다 재사용 시간이 줄어듭니다.', maxLevel: 5 },
  { id: 'mountain', name: '산의 힘', description: '최대 체력이 레벨마다 4% 증가합니다.', maxLevel: 5 },
];

export const ENDINGS = [
  { id: 'asadal', code: '엔딩 A · 진엔딩', name: '아사달', hint: '네 부족 이상을 살리고 동료들과 낮은 악명으로 호왕을 쓰러뜨리세요.' },
  { id: 'conqueror', code: '엔딩 B', name: '정복자', hint: '악명 70 이상으로 호왕을 쓰러뜨리세요.' },
  { id: 'rebellion', code: '엔딩 C', name: '다섯 부족의 반란', hint: '자비 없이 전진하되 공포가 완전히 굳기 전에 호왕을 쓰러뜨리세요.' },
  { id: 'tiger_heir', code: '엔딩 D', name: '호랑이의 마지막 새끼', hint: '아직 다른 결말의 조건을 갖추지 못한 채 호왕을 쓰러뜨리세요.' },
  { id: 'bear_return', code: '엔딩 E', name: '곰의 귀환', hint: '대부분의 부족을 살리고 고향으로 돌아갈 길을 남기세요.' },
  { id: 'hwanung_parting', code: '엔딩 F', name: '환웅을 만났지만', hint: '두 번째 출정 이후 낮은 악명으로 환웅을 만나세요.' },
  { id: 'forgotten_tribe', code: '엔딩 G', name: '잊힌 부족', hint: '원정 중 아주 드문 잊힌 부족의 흔적을 발견하세요.' },
  { id: 'jinguk', code: '엔딩 H', name: '진국', hint: '높은 악명과 두 명 이상의 부하를 거느리고 호왕을 굴복시킨 뒤 혼인 동맹을 선택하세요.' },
];

const emptyTraining = () => Object.fromEntries(TRAINING_ITEMS.map(({ id }) => [id, 0]));

export const createInitialMeta = () => ({
  version: 1,
  trainingPoints: 5,
  trainingLevels: emptyTraining(),
  unlockedEndings: [],
  runsStarted: 0,
  victories: 0,
  bossesDefeated: 0,
});

export const trainingCost = (currentLevel) => Math.min(5, Math.max(0, currentLevel) + 1);

export function normalizeMeta(value) {
  const base = createInitialMeta();
  if (!value || typeof value !== 'object') return base;
  return {
    ...base,
    trainingPoints: Math.max(0, Number(value.trainingPoints) || 0),
    trainingLevels: Object.fromEntries(TRAINING_ITEMS.map(({ id, maxLevel }) => [
      id,
      Math.min(maxLevel, Math.max(0, Math.floor(Number(value.trainingLevels?.[id]) || 0))),
    ])),
    unlockedEndings: ENDINGS.map(({ id }) => id).filter((id) => value.unlockedEndings?.includes(id)),
    runsStarted: Math.max(0, Math.floor(Number(value.runsStarted) || 0)),
    victories: Math.max(0, Math.floor(Number(value.victories) || 0)),
    bossesDefeated: Math.max(0, Math.floor(Number(value.bossesDefeated) || 0)),
  };
}

export function investTraining(meta, trainingId) {
  const current = normalizeMeta(meta);
  const item = TRAINING_ITEMS.find(({ id }) => id === trainingId);
  if (!item) return current;
  const level = current.trainingLevels[trainingId];
  const cost = trainingCost(level);
  if (level >= item.maxLevel || current.trainingPoints < cost) return current;
  return {
    ...current,
    trainingPoints: current.trainingPoints - cost,
    trainingLevels: { ...current.trainingLevels, [trainingId]: level + 1 },
  };
}

export function refundTraining(meta) {
  const current = normalizeMeta(meta);
  const refund = Object.values(current.trainingLevels)
    .reduce((total, level) => total + (level * (level + 1)) / 2, 0);
  return { ...current, trainingPoints: current.trainingPoints + refund, trainingLevels: emptyTraining() };
}

export function recordRunStart(meta) {
  const current = normalizeMeta(meta);
  return { ...current, runsStarted: current.runsStarted + 1 };
}

export function rewardBoss(meta, isFinalBoss = false) {
  const current = normalizeMeta(meta);
  return {
    ...current,
    trainingPoints: current.trainingPoints + 1 + (isFinalBoss ? 3 : 0),
    bossesDefeated: current.bossesDefeated + 1,
  };
}

export function unlockEnding(meta, endingId) {
  const current = normalizeMeta(meta);
  if (!ENDINGS.some(({ id }) => id === endingId) || current.unlockedEndings.includes(endingId)) return current;
  return {
    ...current,
    trainingPoints: current.trainingPoints + 2,
    victories: current.victories + 1,
    unlockedEndings: [...current.unlockedEndings, endingId],
  };
}
