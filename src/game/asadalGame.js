import Phaser from 'phaser';
import {
  canOfferLevelChoice,
  canProposeTigerAlliance,
  enemyRunFrame,
  filterSkillsByPrerequisite,
  resolveEnding,
  stageGoalFor,
} from '../gameFlow';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const skillCatalog = [
  { id: 'claw', name: '곰의 발톱', description: '근접 공격이 20% 강화되고, 적 처치 시 체력을 회복합니다.', modifier: 'attack' },
  { id: 'herb', name: '쑥의 향', description: '체력 회복량과 회복 스택이 증가합니다.', modifier: 'heal' },
  { id: 'stomp', name: '마늘밭', description: '주변 적에게 지속 피해를 입히는 충격파를 생성합니다.', modifier: 'aura' },
  { id: 'roar', name: '곰의 포효', description: '광역 넉백과 분노의 공격 세기를 얻습니다.', modifier: 'roar' },
  { id: 'mountain', name: '산의 힘', description: '최대 체력과 방어력을 증가시킵니다.', modifier: 'vigor' },
  { id: 'hare', name: '토끼의 발', description: '이동 속도를 증가하고 회피 시간이 길어집니다.', modifier: 'speed' },
];

const mapSkillCatalog = {
  쥐: [
    { id: 'swarm-breeding', name: '떼의 번식', description: '적 처치 시 소환수 수가 증가합니다.', modifier: 'attack' },
    { id: 'hole-search', name: '쥐구멍 수색', description: '경험치 획득량이 증가합니다.', modifier: 'heal' },
    { id: 'survival', name: '악착같은 생존', description: '체력이 낮을 때 공격속도가 증가합니다.', modifier: 'speed' },
  ],
  소: [
    { id: 'thick-hide', name: '두꺼운 가죽', description: '받는 피해가 줄어듭니다.', modifier: 'vigor' },
    { id: 'heavy-horn', name: '무거운 뿔', description: '넉백과 추가 피해를 얻습니다.', modifier: 'roar' },
    { id: 'earth-vigor', name: '대지의 체력', description: '최대 체력이 증가합니다.', modifier: 'vigor' },
  ],
  토끼: [
    { id: 'light-step', name: '가벼운 발', description: '이동 속도가 증가합니다.', modifier: 'speed' },
    { id: 'moon-dodge', name: '달빛 회피', description: '회피 대기시간이 감소합니다.', modifier: 'speed' },
    { id: 'quick-hands', name: '재빠른 손', description: '공격 속도가 증가합니다.', modifier: 'attack' },
  ],
  용: [
    { id: 'everglow', name: '꺼지지 않는 불씨', description: '적중 시 일정 확률로 3초간 화상을 부여합니다.', modifier: 'burn' },
    { id: 'flame-spread', name: '불길 확장', description: '화상의 피해와 지속시간을 강화합니다.', modifier: 'burn_spread', requires: 'everglow' },
    { id: 'reverse-bow', name: '역린', description: '보스에게 추가 피해를 줍니다.', modifier: 'roar' },
  ],
  뱀: [
    { id: 'slithering-poison', name: '스미는 독', description: '공격에 4초간 지속되는 독을 부여합니다.', modifier: 'poison' },
    { id: 'cold-blood', name: '냉혈', description: '중독된 대상에게 추가 피해를 줍니다.', modifier: 'cold_blood', requires: 'slithering-poison' },
    { id: 'shedding-skin', name: '허물 벗기', description: '회복 속도가 증가합니다.', modifier: 'heal' },
  ],
  말: [
    { id: 'grassland-stride', name: '초원의 발', description: '이동과 공격 피해를 증가합니다.', modifier: 'speed' },
    { id: 'hoof-shock', name: '발굽 충격', description: '이동 시 충격파가 발생합니다.', modifier: 'roar' },
    { id: 'endurance', name: '지치지 않는 숨', description: '재사용 대기시간이 줄어듭니다.', modifier: 'speed' },
  ],
  양: [
    { id: 'soft-fur', name: '포근한 털', description: '보호막을 얻습니다.', modifier: 'vigor' },
    { id: 'gentle-breath', name: '온화한 숨결', description: '체력 회복량이 늘어납니다.', modifier: 'heal' },
    { id: 'calm', name: '평온', description: '피해를 받지 않을 때 방어력이 늘어납니다.', modifier: 'vigor' },
  ],
  원숭이: [
    { id: 'trickster', name: '잔재주', description: '재사용 대기시간이 줄어듭니다.', modifier: 'speed' },
    { id: 'loot-skill', name: '노획술', description: '경험치 보상이 늘어납니다.', modifier: 'heal' },
    { id: 'stone-sling', name: '돌팔매', description: '주변 적에게 추가 피해를 줍니다.', modifier: 'roar' },
  ],
  닭: [
    { id: 'dawn-call', name: '새벽 울음', description: '주기적 광역 피해를 줍니다.', modifier: 'aura' },
    { id: 'red-comb', name: '붉은 볏', description: '공격 속도가 증가합니다.', modifier: 'attack' },
    { id: 'fighting-spirit', name: '싸움닭의 기세', description: '연속 처치 보너스가 증가합니다.', modifier: 'roar' },
  ],
  개: [
    { id: 'scent-of-blood', name: '피 냄새', description: '보스에 대한 피해가 증가합니다.', modifier: 'roar' },
    { id: 'pack-hunt', name: '무리 사냥', description: '소환수와 부하의 데미지가 증가합니다.', modifier: 'attack' },
    { id: 'relentless-tracking', name: '끈질긴 추적', description: '표식된 적에게 추가 피해를 줍니다.', modifier: 'aura' },
  ],
  돼지: [
    { id: 'hearty-meal', name: '푸짐한 식사', description: '최대 체력이 늘고 즉시 회복합니다.', modifier: 'vigor' },
    { id: 'pouch', name: '복주머니', description: '골드 획득량이 증가합니다.', modifier: 'heal' },
    { id: 'gluttony', name: '탐식', description: '다음 레벨업에 필요한 경험치가 줄어듭니다.', modifier: 'heal' },
  ],
};

const tribeNames = ['쥐', '소', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

const tribeTraits = {
  쥐: { speed: 0, damage: 0, maxHealth: 0, attackRange: 0, heal: 0 },
  소: { speed: -10, damage: 2, maxHealth: 18, attackRange: 0, heal: 0 },
  토끼: { speed: 22, damage: 0, maxHealth: 0, attackRange: 4, heal: 0 },
  용: { speed: 0, damage: 4, maxHealth: 8, attackRange: 0, heal: 0 },
  뱀: { speed: 0, damage: 2, maxHealth: 0, attackRange: 0, heal: 2 },
  말: { speed: 18, damage: 3, maxHealth: 0, attackRange: 6, heal: 0 },
  양: { speed: -8, damage: 0, maxHealth: 16, attackRange: 0, heal: 4 },
  원숭이: { speed: 12, damage: 0, maxHealth: 0, attackRange: 2, heal: 0 },
  닭: { speed: 0, damage: 5, maxHealth: 0, attackRange: 0, heal: 0 },
  개: { speed: 0, damage: 3, maxHealth: 6, attackRange: 0, heal: 0 },
  돼지: { speed: -10, damage: 0, maxHealth: 22, attackRange: 0, heal: 6 },
  호랑이: { speed: 12, damage: 5, maxHealth: 12, attackRange: 5, heal: 0 },
};

const enemyArchetypes = {
  쥐: { texture: 'enemy-rat', width: 72, height: 86, speed: 1.22, health: 0.72, damage: 0.82, range: 12, frequency: 0.023, bob: 3.8, tilt: 4.8, lunge: 10, strike: 'sling', color: 0xaeb1a5 },
  소: { texture: 'enemy-ox', width: 112, height: 116, speed: 0.7, health: 1.65, damage: 1.35, range: 1, frequency: 0.009, bob: 1.5, tilt: 1.2, lunge: 5, strike: 'blunt', color: 0xb98a54 },
  토끼: { texture: 'enemy-rabbit', width: 72, height: 100, speed: 1.35, health: 0.76, damage: 0.9, range: 3, frequency: 0.026, bob: 5.5, tilt: 5.5, lunge: 13, strike: 'slash', color: 0xe7ddd1 },
  용: { texture: 'enemy-dragon', width: 99, height: 112, speed: 0.82, health: 1.3, damage: 1.25, range: 18, frequency: 0.011, bob: 1.3, tilt: 1.4, lunge: 10, strike: 'spear', color: 0xc84f39 },
  뱀: { texture: 'enemy-snake', width: 76, height: 101, speed: 1.08, health: 0.86, damage: 1.05, range: 8, frequency: 0.017, bob: 2.2, tilt: 6.5, lunge: 12, strike: 'slash', color: 0x5f9b69 },
  말: { texture: 'enemy-horse', width: 94, height: 108, speed: 1.32, health: 1.02, damage: 1.12, range: 22, frequency: 0.021, bob: 4.4, tilt: 3.2, lunge: 15, strike: 'spear', color: 0xb88761 },
  양: { texture: 'enemy-sheep', width: 94, height: 110, speed: 0.74, health: 1.5, damage: 0.92, range: 5, frequency: 0.01, bob: 1.2, tilt: 2.4, lunge: 5, strike: 'blunt', color: 0xd8c7a2 },
  원숭이: { texture: 'enemy-monkey', width: 82, height: 91, speed: 1.3, health: 0.84, damage: 0.94, range: 8, frequency: 0.025, bob: 6.2, tilt: 7.5, lunge: 14, strike: 'blunt', color: 0xb05e42 },
  닭: { texture: 'enemy-rooster', width: 78, height: 104, speed: 1.12, health: 0.9, damage: 1.22, range: 13, frequency: 0.019, bob: 3.2, tilt: 3.8, lunge: 14, strike: 'slash', color: 0xc93f39 },
  개: { texture: 'enemy-dog', width: 91, height: 105, speed: 1.18, health: 1.08, damage: 1.08, range: 15, frequency: 0.02, bob: 3.5, tilt: 3.2, lunge: 14, strike: 'spear', color: 0x77675c },
  돼지: { texture: 'enemy-boar', width: 110, height: 113, speed: 0.68, health: 1.72, damage: 1.42, range: 4, frequency: 0.008, bob: 1.8, tilt: 2.2, lunge: 7, strike: 'slash', color: 0x9b6646 },
  호랑이: { texture: 'enemy-tiger', width: 105, height: 122, speed: 1.08, health: 1.35, damage: 1.32, range: 22, frequency: 0.016, bob: 2.6, tilt: 2.8, lunge: 16, strike: 'spear', color: 0xe09239 },
};

const enemyTactics = {
  쥐: { style: 'ranged', rangeBonus: 82, retreatRange: 92, attackDelay: 1.18, windup: 0.9, projectileSpeed: 250 },
  소: { style: 'crusher', rangeBonus: 2, attackDelay: 1.35, windup: 1.3, impactScale: 1.35 },
  토끼: { style: 'flanker', rangeBonus: 6, attackDelay: 0.72, windup: 0.76, orbit: 0.92 },
  용: { style: 'commander', rangeBonus: 26, attackDelay: 1.08, windup: 1.08, auraRadius: 150 },
  뱀: { style: 'poison', rangeBonus: 10, attackDelay: 0.9, windup: 0.88, orbit: 0.58 },
  말: { style: 'charger', rangeBonus: 18, attackDelay: 1.08, windup: 0.9, chargeSpeed: 2.25 },
  양: { style: 'support', rangeBonus: 18, retreatRange: 76, attackDelay: 1.32, windup: 1.1, auraRadius: 135 },
  원숭이: { style: 'skirmisher', rangeBonus: 9, retreatRange: 54, attackDelay: 0.7, windup: 0.72, orbit: 1.08 },
  닭: { style: 'duelist', rangeBonus: 10, attackDelay: 0.62, windup: 0.72, orbit: 0.42 },
  개: { style: 'formation', rangeBonus: 14, attackDelay: 0.94, windup: 1, formationSpacing: 28 },
  돼지: { style: 'berserker', rangeBonus: 4, attackDelay: 1.24, windup: 1.18, impactScale: 1.3 },
  호랑이: { style: 'pouncer', rangeBonus: 22, attackDelay: 0.92, windup: 0.86, chargeSpeed: 2.55 },
};

const tribeRewards = {
  쥐: { power: '끈질긴 생명', follower: '굴쥐 대장' },
  소: { power: '들이받기', follower: '뿔방패 수호자' },
  토끼: { power: '달토끼의 뜀박질', follower: '달빛 궁수' },
  용: { power: '역린의 불꽃', follower: '비늘 화공' },
  뱀: { power: '백사의 독', follower: '독침 술사' },
  말: { power: '질풍 질주', follower: '초원 기수' },
  양: { power: '구름 양털', follower: '구름 치유사' },
  원숭이: { power: '원숭이의 잔재주', follower: '돌팔매 재주꾼' },
  닭: { power: '새벽의 북소리', follower: '새벽 북잡이' },
  개: { power: '사냥의 표식', follower: '검은 사냥개' },
  돼지: { power: '풍요의 몫', follower: '복주머니 짐꾼' },
};

const tribeSituations = [
  { title: '남은 전사들이 무기를 내리려 한다', body: '싸움이 길어지자 호랑이의 소문을 의심하는 목소리가 커졌다.' },
  { title: '붙잡힌 호랑이 전령이 거짓말을 실토했다', body: '젊은 전사들이 전투를 멈추고 웅의 해명을 듣자고 요구한다.' },
  { title: '부족 장로가 부상자를 돌볼 시간을 청했다', body: '지금 창을 거두면 이 부족은 웅을 침략자가 아닌 중재자로 기억할 것이다.' },
];

const createPlayerState = () => ({
  x: 0,
  y: 0,
  radius: 16,
  health: 100,
  maxHealth: 100,
  speed: 180,
  damage: 22,
  attackRate: 0.7,
  attackRange: 72,
  xp: 0,
  xpToNext: 12,
  level: 1,
  reputation: 0,
  kills: 0,
  alliedTribe: '쥐',
  hostileTribe: '호랑이',
  isInvulnerable: false,
  attackTimer: 0,
  attackFlash: 0,
  attackPoseTimer: 0,
  hitPoseTimer: 0,
  facing: 1,
  runCycleTime: 0,
  healTimer: 0,
  permanentHealTimer: 0,
  auraTimer: 0,
  roarTimer: 0,
  poisonTimer: 0,
  poisonTickTimer: 0,
  burnTimer: 0,
  burnTickTimer: 0,
  rage: 0,
  trainingLevels: {
    claw: 0,
    herb: 0,
    stomp: 0,
    roar: 0,
    mountain: 0,
  },
  mapSkillLevels: {},
  skillState: {
    attack: 0,
    heal: 0,
    aura: 0,
    roar: 0,
    vigor: 0,
    speed: 0,
  },
  tribeBonus: { speed: 0, damage: 0, maxHealth: 0, attackRange: 0, heal: 0 },
});

const createEnemyState = (x, y, type = 'raider') => ({
  x,
  y,
  radius: type === 'boss' ? 26 : 14,
  health: type === 'boss' ? 150 : 28,
  maxHealth: type === 'boss' ? 150 : 28,
  speed: type === 'boss' ? 58 : 82,
  damage: type === 'boss' ? 12 : 6,
  type,
  attackCooldown: 0,
  attackDelay: type === 'boss' ? 1.2 : 0.95,
  attackRange: type === 'boss' ? 44 : 30,
  hitFlash: 0,
  attackWarning: 0,
  chargeCooldown: 0,
  isCharging: 0,
  bossRushCooldown: 0,
  bossPulseCooldown: 0,
  bossSummonCooldown: 0,
  bossPhase: 1,
  stridePhase: Math.random() * Math.PI * 2,
  attackPose: 0,
  attackHitPending: false,
  hitPose: 0,
  knockdownTimer: 0,
  deathTimer: 0,
  defeated: false,
  aiCooldown: Math.random() * 1.5,
  orbitDirection: Math.random() < 0.5 ? -1 : 1,
  comboCount: 0,
  runCycleTime: Math.random() * 240,
  poisonStacks: 0,
  poisonTimer: 0,
  poisonTickTimer: 0,
});

function dispatchHud(state, stage, currentTribe) {
  const event = new CustomEvent('asadal:state', {
    detail: {
      health: state.health,
      maxHealth: state.maxHealth,
      xp: state.xp,
      level: state.level,
      stage,
      currentTribe,
      alliedTribe: state.alliedTribe,
      hostileTribe: state.hostileTribe,
      reputation: state.reputation,
      totalKills: state.kills,
      gameOver: state.health <= 0,
      running: state.health > 0,
    },
  });

  window.dispatchEvent(event);
}

const shuffle = (list) => {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

function emitChoices(tribeIndex = window.__asadalTribeIndex ?? 0, player = null) {
  const safeIndex = Number.isInteger(tribeIndex) && tribeIndex >= 0 ? tribeIndex : 0;
  const tribeKey = tribeNames[safeIndex] ?? '쥐';
  const pool = mapSkillCatalog[tribeKey] ?? skillCatalog;
  const eligible = player ? filterSkillsByPrerequisite(pool, player.mapSkillLevels) : pool;
  const choices = shuffle(eligible).slice(0, 3);

  window.dispatchEvent(new CustomEvent('asadal:skillChoices', {
    detail: {
      source: 'map',
      choices,
      tribe: tribeKey,
      label: `${tribeKey} 부족의 가르침`,
      selected: [],
    },
  }));
}

function applyTribeTrait(player, tribeName) {
  const previous = player.tribeBonus || { speed: 0, damage: 0, maxHealth: 0, attackRange: 0, heal: 0 };
  player.speed -= previous.speed;
  player.damage -= previous.damage;
  player.maxHealth -= previous.maxHealth;
  player.attackRange -= previous.attackRange;

  const next = tribeTraits[tribeName] || tribeTraits.쥐;
  player.speed += next.speed;
  player.damage += next.damage;
  player.maxHealth += next.maxHealth;
  player.attackRange += next.attackRange;
  player.tribeBonus = { ...next };

  player.health = Math.min(player.maxHealth, player.health + next.heal);
  if (player.health <= 0) {
    player.health = 1;
  }
}

function showDefaultHud(stage, currentTribe, player) {
  dispatchHud(player, stage, currentTribe);
}

function bootAsadalGame(container, options = {}) {
  const preloadTribes = Array.isArray(options.preloadTribes) && options.preloadTribes.length > 0
    ? [...new Set([...options.preloadTribes, '호랑이'])]
    : Object.keys(enemyArchetypes);
  const config = {
    type: Phaser.AUTO,
    width: container.clientWidth || 540,
    height: container.clientHeight || 960,
    backgroundColor: '#090705',
    parent: container,
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
    },
    scene: {
      preload() {
        this.load.image('ung-warrior', '/assets/ung-bear-warrior.png');
        this.load.image('ung-run-1', '/assets/ung-run-1.png');
        this.load.image('ung-run-2', '/assets/ung-run-2.png');
        this.load.image('ung-run-3', '/assets/ung-run-3.png');
        this.load.image('ung-run-4', '/assets/ung-run-4.png');
        this.load.image('ung-attack', '/assets/ung-attack.png');
        preloadTribes.map((tribe) => enemyArchetypes[tribe]).filter(Boolean).forEach(({ texture }) => {
          this.load.image(texture, `/assets/${texture}.png`);
          this.load.image(`${texture}-run-1`, `/assets/${texture}-run-1.png`);
          this.load.image(`${texture}-run-2`, `/assets/${texture}-run-2.png`);
          this.load.image(`${texture}-attack-1`, `/assets/${texture}-attack-1.png`);
          this.load.image(`${texture}-attack-2`, `/assets/${texture}-attack-2.png`);
          this.load.image(`${texture}-hit`, `/assets/${texture}-hit.png`);
          this.load.image(`${texture}-down`, `/assets/${texture}-down.png`);
          this.load.image(`${texture}-death`, `/assets/${texture}-death.png`);
          this.load.image(`${texture}-recover`, `/assets/${texture}-recover.png`);
        });
      },
      create() {
        const scene = this;
        const player = createPlayerState();
        const enemies = [];
        const followers = [];
        const projectiles = [];
        const floatingTexts = [];
        let userInput = { up: false, down: false, left: false, right: false };
        let spawnTimer = 0;
        let hudUpdateTimer = 0;
        let stage = 1;
        let currentTribeIndex = 0;
        let bossSpawned = false;
        let skillSelectionOpen = false;
        let runStarted = false;
        let gamePaused = true;
        let combo = 0;
        let worldTime = 0;
        let clearedFinalBoss = false;
        let pendingFinalDecision = false;
        let stageDecisionOffered = false;
        let sparedTribes = 0;
        let foundForgottenTribe = false;
        let pendingTravelStage = null;
        let runHistory = { runsStarted: 1 };
        let alliedTribeIndex = 0;
        let hostileTribeIndex = 0;
        let currentBattleTribe = tribeNames[0];
        let stageTribeOrder = tribeNames.slice(0, 5);

        const resolveTribeIndexes = () => {
          if (!tribeNames.includes(tribeNames[alliedTribeIndex])) {
            alliedTribeIndex = 0;
          }
          if (!tribeNames.includes(tribeNames[hostileTribeIndex])) {
            hostileTribeIndex = 1;
          }
          if (alliedTribeIndex === hostileTribeIndex) {
            hostileTribeIndex = (hostileTribeIndex + 1) % tribeNames.length;
          }
        };

        const getHostilePressure = () => {
          const hostileName = tribeNames[hostileTribeIndex] || '소';
          const trait = tribeTraits[hostileName] || tribeTraits.소;
          return 1 + ((trait.damage + trait.maxHealth / 30 + trait.speed / 120) / 12);
        };

        const applyAlliedSetupBonus = () => {
          const alliedName = tribeNames[alliedTribeIndex] || '쥐';
          const trait = tribeTraits[alliedName] || tribeTraits.쥐;
          player.damage += trait.damage * 0.75;
          player.speed += trait.speed * 0.45;
          player.maxHealth += trait.maxHealth * 0.5;
          player.attackRange += trait.attackRange * 0.5;
          player.health = player.maxHealth;
        };

        const world = scene.add.rectangle(0, 0, 1400, 900, 0x17120d).setOrigin(0, 0);
        scene.physics.world.setBounds(0, 0, world.width, world.height);

        const ground = scene.add.graphics().setDepth(0);
        ground.fillStyle(0x241a11, 1).fillRect(0, 0, world.width, world.height);
        ground.fillStyle(0x352515, 0.7).fillRect(0, 180, world.width, 520);
        ground.lineStyle(2, 0x6e4b27, 0.22);
        for (let y = 220; y < 700; y += 92) {
          ground.beginPath();
          ground.moveTo(0, y);
          ground.lineTo(world.width, y + 18);
          ground.strokePath();
        }
        ground.fillStyle(0x0d1713, 1).fillRect(0, 0, world.width, 170);
        ground.fillStyle(0x101713, 1).fillRect(0, 710, world.width, 190);
        ground.fillStyle(0x936232, 0.4);
        for (let index = 0; index < 34; index += 1) {
          const x = (index * 173 + 47) % world.width;
          const y = 205 + ((index * 97) % 470);
          ground.fillEllipse(x, y, 10 + (index % 4) * 5, 5 + (index % 3) * 3);
        }

        const makeTotem = (x, y, color, scale = 1) => {
          const totem = scene.add.graphics({ x, y }).setDepth(1);
          totem.fillStyle(0x080706, 0.35).fillEllipse(0, 18 * scale, 74 * scale, 18 * scale);
          totem.fillStyle(0x49321d, 1).fillRoundedRect(-7 * scale, -50 * scale, 14 * scale, 68 * scale, 4);
          totem.fillStyle(color, 1).fillCircle(0, -55 * scale, 19 * scale);
          totem.fillStyle(0x17100b, 1).fillCircle(-7 * scale, -58 * scale, 3 * scale);
          totem.fillStyle(0x17100b, 1).fillCircle(7 * scale, -58 * scale, 3 * scale);
          totem.lineStyle(3 * scale, 0xc19a5b, 0.75).strokeCircle(0, -55 * scale, 13 * scale);
          return totem;
        };
        makeTotem(128, 160, 0x8b623a, 1.1);
        makeTotem(1170, 735, 0xa85c27, 1.25);
        makeTotem(720, 120, 0x755137, 0.9);

        const playerBody = scene.add.circle(200, 300, 18, 0xf8d8a0, 0);
        scene.physics.add.existing(playerBody);
        playerBody.body.setCollideWorldBounds(true);
        playerBody.body.setDrag(800);
        playerBody.setDepth(10);
        scene.cameras.main.setBounds(0, 0, world.width, world.height);
        scene.cameras.main.startFollow(playerBody, true, 0.12, 0.12);

        const playerShadow = scene.add.ellipse(playerBody.x, playerBody.y + 19, 54, 17, 0x000000, 0.42).setDepth(7);
        const playerSprite = scene.add.image(playerBody.x, playerBody.y, 'ung-warrior')
          .setOrigin(0.5, 0.82)
          .setDisplaySize(75, 112)
          .setDepth(10);
        let playerPose = 'idle';
        let playerTexture = 'ung-warrior';
        let lastRunFrame = -1;

        let touchInput = { x: 0, y: 0 };
        let keyboardInput = { up: false, down: false, left: false, right: false };

        player.x = playerBody.x;
        player.y = playerBody.y;

        const runeCircle = scene.add.circle(playerBody.x, playerBody.y, 24, 0xf2bf6f, 0.18);
        runeCircle.setDepth(8);

        const playerAttackRing = scene.add.circle(playerBody.x, playerBody.y, player.attackRange + 10, 0xf8d8a0, 0.12);
        playerAttackRing.setDepth(2);

        const playerAttackSlash = scene.add.line(0, 0, 0, 0, 0, 0, 0xf8d8a0, 0);
        playerAttackSlash.setLineWidth(4);
        playerAttackSlash.setDepth(15);

        const stageLabel = scene.add.text(30, 20, '곰 부족', {
          fontSize: '22px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#f6e5b0',
          fontStyle: 'bold',
        });
        stageLabel.setDepth(30).setScrollFactor(0).setVisible(false);

        const hudText = scene.add.text(30, 52, '체력 100 / 100', {
          fontSize: '16px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#e5d5ae',
        });
        hudText.setDepth(30).setScrollFactor(0).setVisible(false);

        const bossText = scene.add.text(0, 0, '', {
          fontSize: '22px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#ffbd82',
          fontStyle: 'bold',
        });
        bossText.setDepth(30).setScrollFactor(0).setOrigin(0.5, 0);

        const stageObjectiveText = scene.add.text(0, 0, '목표: 적 8마리 처치', {
          fontSize: '15px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#e9dbc0',
          align: 'center',
        });
        stageObjectiveText.setDepth(30).setScrollFactor(0).setOrigin(0.5, 0);

        const positionCanvasHud = (gameSize = scene.scale.gameSize) => {
          const viewportWidth = gameSize?.width || scene.scale.width;
          const textWidth = Math.max(220, viewportWidth - 28);
          stageObjectiveText.setPosition(viewportWidth / 2, 66).setWordWrapWidth(textWidth);
          bossText.setPosition(viewportWidth / 2, 92).setWordWrapWidth(textWidth);
        };
        positionCanvasHud();
        scene.scale.on('resize', positionCanvasHud);

        let stageGoal = 8;
        let nextStageQueued = false;
        let stageAdvanceReady = false;

        function updateStageGoalText() {
          const goalLabel = bossSpawned ? '보스 처치' : '적';
          stageObjectiveText.setText(`목표: ${goalLabel} ${stageGoal}마리 처치 • ${Math.min(player.kills, stageGoal)}/${stageGoal}`);
        }

        function spawnFloatingText(x, y, value, color = '#f9d38d') {
          const text = scene.add.text(x, y, value, {
            fontSize: '16px',
            fill: color,
            fontStyle: 'bold',
            fontFamily: 'Segoe UI, sans-serif',
          });
          text.setDepth(30);
          floatingTexts.push({ text, life: 0.7, y });
        }

        function createEnemyVisual(enemy, variant = 'raider') {
          const isBoss = enemy.type === 'boss';
          const archetype = enemyArchetypes[currentBattleTribe] || enemyArchetypes.쥐;
          const tactic = enemyTactics[currentBattleTribe] || enemyTactics.쥐;
          const sizeScale = isBoss ? 1.34 : variant === 'support' ? 0.9 : 1;
          enemy.tribe = currentBattleTribe;
          enemy.archetype = archetype;
          enemy.tactic = tactic;
          enemy.speed *= archetype.speed;
          enemy.health *= archetype.health;
          enemy.maxHealth *= archetype.health;
          enemy.damage *= archetype.damage;
          enemy.attackRange += archetype.range + tactic.rangeBonus;
          enemy.attackDelay *= tactic.attackDelay;
          enemy.visualWidth = archetype.width * sizeScale;
          enemy.visualHeight = archetype.height * sizeScale;
          const sprite = scene.add.image(enemy.x, enemy.y, archetype.texture)
            .setOrigin(0.5, 0.8)
            .setDisplaySize(enemy.visualWidth, enemy.visualHeight)
            .setDepth(isBoss ? 6 : 5);
          if (isBoss) sprite.setTint(0xffd1bc);
          if (variant === 'support') sprite.setTint(0xe7c9a2);
          enemy.sprite = sprite;
          enemy.baseTint = isBoss ? 0xffd1bc : variant === 'support' ? 0xe7c9a2 : 0xffffff;
          enemy.shadow = scene.add.ellipse(
            enemy.x,
            enemy.y + enemy.visualHeight * 0.16,
            enemy.visualWidth * 0.56,
            enemy.visualHeight * 0.14,
            0x000000,
            0.38,
          ).setDepth(3);
          enemy.attackRing = scene.add.circle(
            enemy.x,
            enemy.y,
            enemy.attackRange + enemy.radius,
            archetype.color,
            isBoss ? 0.12 : 0.04,
          ).setDepth(2);
          return enemy;
        }

        function destroyEnemyVisual(enemy) {
          if (enemy.sprite) enemy.sprite.destroy();
          if (enemy.shadow) enemy.shadow.destroy();
          if (enemy.attackRing) enemy.attackRing.destroy();
        }

        function recruitFollower(tribe) {
          if (followers.some((follower) => follower.tribe === tribe)) return;
          if (followers.length >= 3) {
            const replaced = followers.shift();
            replaced.sprite?.destroy();
          }
          const archetype = enemyArchetypes[tribe] || enemyArchetypes.쥐;
          const sprite = scene.add.image(playerBody.x, playerBody.y, archetype.texture)
            .setOrigin(0.5, 0.8)
            .setDisplaySize(archetype.width * 0.48, archetype.height * 0.48)
            .setTint(0xbfe8c1)
            .setDepth(9);
          followers.push({ tribe, sprite, attackTimer: Math.random() * 600 });
        }

        function applyTribePower(tribe) {
          switch (tribe) {
            case '쥐': player.attackRate *= 0.94; break;
            case '소': player.damage *= 1.1; break;
            case '토끼': player.speed *= 1.18; break;
            case '용': player.mapSkillLevels.everglow = Math.max(5, player.mapSkillLevels.everglow ?? 0); break;
            case '뱀': player.mapSkillLevels['slithering-poison'] = Math.max(3, player.mapSkillLevels['slithering-poison'] ?? 0); break;
            case '말': player.speed *= 1.1; player.damage *= 1.06; break;
            case '양': player.maxHealth *= 1.12; player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.12); break;
            case '원숭이': player.attackRate *= 0.9; break;
            case '닭': player.damage *= 1.12; break;
            case '개': player.damage *= 1.08; followers.forEach((follower) => { follower.attackTimer += 300; }); break;
            case '돼지': player.maxHealth *= 1.16; player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.2); break;
            default: break;
          }
        }

        function emitTribeReward() {
          const reward = tribeRewards[currentBattleTribe] || tribeRewards.쥐;
          skillSelectionOpen = true;
          window.dispatchEvent(new CustomEvent('asadal:tribeReward', {
            detail: {
              tribe: currentBattleTribe,
              power: { id: 'power', name: reward.power, description: `${currentBattleTribe} 부족의 고유 능력을 이번 원정 동안 얻습니다.` },
              follower: { id: 'follower', name: reward.follower, description: `자동으로 싸우는 ${currentBattleTribe} 부족 부하를 영입합니다. 최대 3명.` },
            },
          }));
        }

        function updateFollowers(delta) {
          followers.forEach((follower, index) => {
            const angle = worldTime * 0.0007 + (Math.PI * 2 * index) / Math.max(1, followers.length);
            const targetX = playerBody.x + Math.cos(angle) * (52 + index * 8);
            const targetY = playerBody.y + 26 + Math.sin(angle) * 24;
            follower.sprite.setPosition(targetX, targetY).setDepth(9 + targetY / 1000).setFlipX(Math.cos(angle) < 0);
            follower.attackTimer += delta;
            if (follower.attackTimer < 1200) return;
            const target = enemies.filter((enemy) => !enemy.defeated).sort((a, b) => (
              Phaser.Math.Distance.Between(targetX, targetY, a.x, a.y)
              - Phaser.Math.Distance.Between(targetX, targetY, b.x, b.y)
            ))[0];
            if (target && Phaser.Math.Distance.Between(targetX, targetY, target.x, target.y) <= 260) {
              damageEnemy(target, player.damage * 0.45, 5);
              const strike = scene.add.line(0, 0, targetX, targetY - 14, target.x, target.y - 12, 0xbfe8c1, 0.72).setDepth(14);
              scene.tweens.add({ targets: strike, alpha: 0, duration: 160, onComplete: () => strike.destroy() });
            }
            follower.attackTimer = 0;
          });
        }

        function spawnEnemyWeaponMotion(enemy, angle) {
          const archetype = enemy.archetype || enemyArchetypes.쥐;
          const reach = 34 + archetype.range * 0.75 + (enemy.type === 'boss' ? 16 : 0);
          const color = archetype.color;

          if (archetype.strike === 'slash') {
            const arc = scene.add.graphics({ x: enemy.x, y: enemy.y - 3 });
            arc.lineStyle(enemy.type === 'boss' ? 7 : 5, color, 0.86);
            arc.beginPath();
            arc.arc(0, 0, reach, -0.9, 0.72, false);
            arc.strokePath();
            arc.setRotation(angle).setDepth(16);
            scene.tweens.add({
              targets: arc,
              scaleX: 1.18,
              scaleY: 1.18,
              alpha: 0,
              duration: 150,
              onComplete: () => arc.destroy(),
            });
            return;
          }

          const strike = scene.add.line(
            0,
            0,
            enemy.x,
            enemy.y - 5,
            enemy.x + Math.cos(angle) * reach,
            enemy.y - 5 + Math.sin(angle) * reach,
            color,
            archetype.strike === 'sling' ? 0.66 : 0.88,
          );
          strike.setLineWidth(archetype.strike === 'blunt' ? 8 : enemy.type === 'boss' ? 6 : 4);
          strike.setDepth(16);
          scene.tweens.add({
            targets: strike,
            alpha: 0,
            duration: archetype.strike === 'blunt' ? 190 : 125,
            onComplete: () => strike.destroy(),
          });

          if (archetype.strike === 'blunt') {
            const impact = scene.add.circle(
              enemy.x + Math.cos(angle) * reach,
              enemy.y + Math.sin(angle) * reach,
              enemy.type === 'boss' ? 18 : 11,
              color,
              0.28,
            ).setDepth(15);
            scene.tweens.add({
              targets: impact,
              scale: 2.2,
              alpha: 0,
              duration: 210,
              onComplete: () => impact.destroy(),
            });
          }
        }

        function setStageState(nextStage) {
          stage = nextStage;
          bossSpawned = stage % 3 === 0;
          const currentTribeName = stage >= 6 ? '호랑이' : stageTribeOrder[(stage - 1) % stageTribeOrder.length];
          currentTribeIndex = Math.max(0, tribeNames.indexOf(currentTribeName));
          window.__asadalTribeIndex = currentTribeIndex;
          const currentTribe = currentTribeName + ' 부족';
          currentBattleTribe = currentTribeName;
          stageLabel.setText(currentTribe);
          stageGoal = stageGoalFor(stage, bossSpawned);
          player.kills = 0;
          stageDecisionOffered = false;
          nextStageQueued = false;
          stageAdvanceReady = false;
          applyTribeTrait(player, currentTribeName);
          updateStageGoalText();
          showDefaultHud(stage, currentTribe, player);
          bossText.setText(bossSpawned ? `${currentTribe} 보스 등장!` : `${currentTribe} 전투 시작`);
          bossText.setVisible(true);
          scene.time.delayedCall(1800, () => bossText.setVisible(false));

          enemies.forEach((enemy) => {
            destroyEnemyVisual(enemy);
          });
          enemies.splice(0, enemies.length);

          if (bossSpawned) {
            const boss = createEnemyState(700, 360, 'boss');
            enemies.push(createEnemyVisual(boss));
          } else {
            createEnemyBurst(650, 260, false);
            createEnemyBurst(760, 420, false);
          }

          if (stage === 6) {
            skillSelectionOpen = true;
            window.dispatchEvent(new CustomEvent('asadal:story', {
              detail: {
                id: 'tiger-truth',
                route: [...stageTribeOrder, '호랑이'],
              },
            }));
          }
        }

        function advanceStage() {
          const nextStage = stage + 1;
          pendingTravelStage = nextStage;
          skillSelectionOpen = true;
          window.dispatchEvent(new CustomEvent('asadal:travel', {
            detail: {
              from: currentBattleTribe,
              to: nextStage >= 6 ? '호랑이' : stageTribeOrder[(nextStage - 1) % stageTribeOrder.length],
              stage: nextStage,
            },
          }));
        }

        function tryAdvanceStage() {
          if (!nextStageQueued || !stageAdvanceReady || skillSelectionOpen) {
            return;
          }

          enemies.forEach((enemy) => {
            destroyEnemyVisual(enemy);
          });
          enemies.splice(0, enemies.length);
          advanceStage();
        }

        function spawnEnemyAtEdge() {
          const side = Math.floor(Math.random() * 4);
          let x = 0;
          let y = 0;

          if (side === 0) {
            x = Math.random() * world.width;
            y = -32;
          } else if (side === 1) {
            x = world.width + 32;
            y = Math.random() * world.height;
          } else if (side === 2) {
            x = Math.random() * world.width;
            y = world.height + 32;
          } else {
            x = -32;
            y = Math.random() * world.height;
          }

          const base = createEnemyState(x, y);
          const hostileMultiplier = getHostilePressure();
          base.health *= hostileMultiplier;
          base.maxHealth *= hostileMultiplier;
          base.damage *= hostileMultiplier * 0.9;
          base.speed *= 1 + (hostileMultiplier - 1) * 0.3;
          enemies.push(createEnemyVisual(base));
          return base;
        }

        function createEnemyBurst(centerX, centerY, isBoss = false) {
          const enemyCount = isBoss ? 1 : Math.min(4, 2 + Math.ceil(stage / 2));
          for (let i = 0; i < enemyCount; i += 1) {
            const angle = (Math.PI * 2 * i) / enemyCount + Math.random() * 0.8;
            const distance = isBoss ? 120 : 280 + Math.random() * 180;
            const enemy = createEnemyState(
              clamp(centerX + Math.cos(angle) * distance, 40, world.width - 40),
              clamp(centerY + Math.sin(angle) * distance, 40, world.height - 40),
              isBoss ? 'boss' : 'raider',
            );
            if (!isBoss) {
              const hostileMultiplier = getHostilePressure();
              enemy.health *= hostileMultiplier;
              enemy.maxHealth *= hostileMultiplier;
              enemy.damage *= hostileMultiplier * 0.8;
            }
            enemies.push(createEnemyVisual(enemy));
          }
        }

        function spawnBossSupport() {
          const activeSupportCount = enemies.filter((enemy) => enemy.type !== 'boss' && !enemy.defeated).length;
          if (activeSupportCount >= 4) {
            return;
          }

          for (let i = 0; i < 2; i += 1) {
            const spawnSide = Math.floor(Math.random() * 4);
            let x = 0;
            let y = 0;

            if (spawnSide === 0) {
              x = Math.random() * world.width;
              y = -32;
            } else if (spawnSide === 1) {
              x = world.width + 32;
              y = Math.random() * world.height;
            } else if (spawnSide === 2) {
              x = Math.random() * world.width;
              y = world.height + 32;
            } else {
              x = -32;
              y = Math.random() * world.height;
            }

            const support = createEnemyState(x, y, 'raider');
            support.health = 18;
            support.maxHealth = 18;
            support.damage = 5;
            enemies.push(createEnemyVisual(support, 'support'));
          }
        }

        function awardStageClear() {
          const clearedBossStage = stage % 3 === 0;
          player.xp += clearedBossStage ? 30 : 18;
          bossText.setText(clearedBossStage ? '보스 처치! 다음 부족으로 이동' : '목표 달성! 다음 부족으로 이동');
          bossText.setVisible(true);
        }

        function queueStageClear() {
          if (nextStageQueued || clearedFinalBoss) return;
          nextStageQueued = true;
          awardStageClear();
          if (stage < 6) emitTribeReward();
          scene.time.delayedCall(1200, () => {
            stageAdvanceReady = true;
            tryAdvanceStage();
          });
        }

        function triggerVictory(endingOverride = null) {
          if (clearedFinalBoss) return;
          clearedFinalBoss = true;
          pendingFinalDecision = false;
          skillSelectionOpen = true;
          const ending = endingOverride || resolveEnding({
            reputation: player.reputation,
            sparedTribes,
            followers: followers.length,
            runsStarted: runHistory.runsStarted,
            foundForgottenTribe,
          });
          bossText.setText('호랑이 부족을 쓰러뜨렸다. 아사달의 신화가 시작된다');
          bossText.setVisible(true);
          stageLabel.setText('호랑이 부족');
          window.dispatchEvent(new CustomEvent('asadal:clearChoices'));
          window.dispatchEvent(new CustomEvent('asadal:state', {
            detail: {
              health: Math.max(1, player.health),
              maxHealth: player.maxHealth,
              xp: player.xp,
              level: player.level,
              stage: Math.max(stage, 6),
              currentTribe: '호랑이 부족',
              reputation: player.reputation,
              totalKills: player.kills,
              gameOver: false,
              win: true,
              running: false,
              ending,
              route: [...stageTribeOrder, '호랑이'],
            },
          }));
        }

        function offerFinalDecision() {
          if (pendingFinalDecision || clearedFinalBoss) return;
          pendingFinalDecision = true;
          skillSelectionOpen = true;
          const allianceEligible = canProposeTigerAlliance({
            reputation: player.reputation,
            sparedTribes,
            followers: followers.length,
          });
          window.dispatchEvent(new CustomEvent('asadal:finalDecision', {
            detail: {
              allianceEligible,
              reputation: player.reputation,
              sparedTribes,
              followers: followers.length,
            },
          }));
        }

        function damageEnemy(enemy, damage, knockback = 0) {
          if (enemy.defeated) return;
          enemy.health -= damage;
          enemy.hitFlash = 0.12;
          enemy.hitPose = 0.2;
          spawnFloatingText(enemy.x, enemy.y - 18, `-${Math.max(1, Math.round(damage))}`, '#ffd38d');

          if (enemy.sprite) {
            enemy.sprite.setTintFill(0xffffff);
          }
          if (knockback > 0) {
            const angle = Phaser.Math.Angle.Between(playerBody.x, playerBody.y, enemy.x, enemy.y);
            enemy.x += Math.cos(angle) * knockback;
            enemy.y += Math.sin(angle) * knockback;
          }
          if (enemy.health <= 0) {
            enemy.health = 0;
            enemy.defeated = true;
            enemy.deathTimer = enemy.type === 'boss' && stage >= 5
              ? Number.POSITIVE_INFINITY
              : enemy.type === 'boss' ? 1.35 : 0.92;
            enemy.attackPose = 0;
            enemy.attackHitPending = false;
            enemy.knockdownTimer = 0;
            enemy.attackRing?.setVisible(false);
            player.kills += 1;
            player.xp += enemy.type === 'boss' ? 25 : 8;
            player.reputation += enemy.type === 'boss' ? 6 : 1;
            spawnFloatingText(enemy.x, enemy.y - 20, enemy.type === 'boss' ? '+25' : '+8', '#8ef1a7');
            updateStageGoalText();
            if (enemy.type === 'boss') {
              bossSpawned = false;
              window.dispatchEvent(new CustomEvent('asadal:metaReward', {
                detail: { type: 'boss', final: stage >= 6 },
              }));
              if (stage >= 5) {
                offerFinalDecision();
              }
            }
          } else if (knockback >= 16 || damage >= enemy.maxHealth * 0.42) {
            enemy.knockdownTimer = enemy.type === 'boss' ? 0.5 : 0.78;
            enemy.attackPose = 0;
            enemy.attackHitPending = false;
          }
        }

        function spawnWave() {
          if (bossSpawned || skillSelectionOpen) {
            return;
          }
          const desiredCount = Math.min(8, Math.max(2, stage + 1));
          if (enemies.filter((enemy) => !enemy.defeated).length < desiredCount) {
            spawnEnemyAtEdge();
          }
        }

        function levelUp() {
          if (!canOfferLevelChoice({ clearedFinalBoss, health: player.health, finalStage: stage >= 6 })) return;
          while (player.xp >= player.xpToNext) {
            player.xp -= player.xpToNext;
            player.level += 1;
            player.xpToNext = Math.round(player.xpToNext * 1.4);
            emitChoices(currentTribeIndex, player);
            skillSelectionOpen = true;
          }
        }

        function applySkill(skillId) {
          const skill = skillCatalog.find((item) => item.id === skillId)
            || (mapSkillCatalog[tribeNames[currentTribeIndex]] || []).find((item) => item.id === skillId);
          if (!skill) return;
          player.mapSkillLevels[skillId] = (player.mapSkillLevels[skillId] ?? 0) + 1;

          switch (skill.modifier) {
            case 'attack':
              player.skillState.attack += 1;
              player.damage += 4;
              break;
            case 'heal':
              player.skillState.heal += 1;
              player.maxHealth += 12;
              player.health = Math.min(player.maxHealth, player.health + 18);
              break;
            case 'aura':
              player.skillState.aura += 1;
              player.rage += 1;
              break;
            case 'roar':
              player.skillState.roar += 1;
              player.damage += 6;
              break;
            case 'vigor':
              player.skillState.vigor += 1;
              player.maxHealth += 20;
              player.health = Math.min(player.maxHealth, player.health + 22);
              break;
            case 'speed':
              player.skillState.speed += 1;
              player.speed += 18;
              break;
            case 'poison':
              break;
            case 'cold_blood':
              break;
            case 'burn':
              break;
            case 'burn_spread':
              break;
            default:
              break;
          }

          skillSelectionOpen = false;
          window.dispatchEvent(new CustomEvent('asadal:clearChoices'));
          showDefaultHud(stage, tribeNames[currentTribeIndex] + ' 부족', player);
          tryAdvanceStage();
        }

        function handlePlayerAttack() {
          const baseAttackRadius = player.attackRange + 10;
          let hitCount = 0;
          let nearestEnemy = null;
          let nearestDistance = Number.MAX_VALUE;

          enemies.forEach((enemy) => {
            if (enemy.defeated) return;
            const d = Phaser.Math.Distance.Between(playerBody.x, playerBody.y, enemy.x, enemy.y);
            if (d < nearestDistance) {
              nearestDistance = d;
              nearestEnemy = enemy;
            }
            if (d <= baseAttackRadius) {
              const auraDamage = player.skillState.aura > 0 && Math.random() < 0.5 ? player.skillState.aura * 2 : 0;
              const coldBloodLevel = player.mapSkillLevels['cold-blood'] ?? 0;
              const poisonBonus = enemy.poisonStacks > 0 ? 1 + coldBloodLevel * 0.08 : 1;
              const damage = (player.damage + player.skillState.attack * 5 + player.skillState.roar * 3 + auraDamage) * poisonBonus;
              damageEnemy(enemy, damage, player.skillState.roar > 0 ? 18 : 10);
              const poisonLevel = player.mapSkillLevels['slithering-poison'] ?? 0;
              if (poisonLevel > 0 && !enemy.defeated) {
                enemy.poisonStacks = Math.min(poisonLevel, enemy.poisonStacks + 1);
                enemy.poisonTimer = 4;
              }
              const burnLevel = player.mapSkillLevels.everglow ?? 0;
              if (burnLevel > 0 && !enemy.defeated && Math.random() < Math.min(0.6, burnLevel * 0.12)) {
                enemy.burnTimer = 3 + (player.mapSkillLevels['flame-spread'] ?? 0);
              }
              hitCount += 1;
              if (player.skillState.heal > 0 && hitCount % 2 === 0) {
                player.health = Math.min(player.maxHealth, player.health + 2 + player.skillState.heal * 1.5);
              }
            }
          });

          if (nearestEnemy && nearestDistance <= baseAttackRadius + 8) {
            player.attackFlash = 0.18;
            player.attackPoseTimer = 240;
            playerAttackRing.setFillStyle(0xf8d8a0, 0.18);
            const angle = Phaser.Math.Angle.Between(playerBody.x, playerBody.y, nearestEnemy.x, nearestEnemy.y);
            player.facing = Math.cos(angle) < 0 ? -1 : 1;
            const slashLength = Math.min(90, Phaser.Math.Distance.Between(playerBody.x, playerBody.y, nearestEnemy.x, nearestEnemy.y));
            const slash = scene.add.line(
              0,
              0,
              playerBody.x,
              playerBody.y,
              playerBody.x + Math.cos(angle) * slashLength,
              playerBody.y + Math.sin(angle) * slashLength,
              0xf8d8a0,
              0.9,
            );
            slash.setLineWidth(4);
            slash.setDepth(16);
            scene.tweens.add({
              targets: slash,
              alpha: 0,
              duration: 120,
              onComplete: () => slash.destroy(),
            });

            const weaponArc = scene.add.graphics({ x: playerBody.x, y: playerBody.y - 3 });
            weaponArc.lineStyle(7, 0xffe0a0, 0.82);
            weaponArc.beginPath();
            weaponArc.arc(0, 0, 58, -0.85, 0.65, false);
            weaponArc.strokePath();
            weaponArc.lineStyle(2, 0xffffff, 0.9);
            weaponArc.beginPath();
            weaponArc.arc(0, 0, 64, -0.72, 0.5, false);
            weaponArc.strokePath();
            weaponArc.setRotation(angle).setDepth(17);
            scene.tweens.add({
              targets: weaponArc,
              scaleX: 1.16,
              scaleY: 1.16,
              alpha: 0,
              duration: 170,
              ease: 'Cubic.easeOut',
              onComplete: () => weaponArc.destroy(),
            });

            const impactRing = scene.add.circle(playerBody.x, playerBody.y, 14, 0xf8d8a0, 0.18);
            impactRing.setDepth(6);
            scene.tweens.add({
              targets: impactRing,
              scale: 2.5,
              alpha: 0,
              duration: 160,
              onComplete: () => impactRing.destroy(),
            });
          }

          if (hitCount > 0 && player.skillState.attack > 0) {
            player.health = Math.min(player.maxHealth, player.health + 1.5);
          }
        }

        function getEnemyAttackDuration(enemy) {
          const strike = enemy.archetype?.strike;
          const baseDuration = strike === 'blunt' ? 0.48 : strike === 'sling' ? 0.42 : strike === 'spear' ? 0.4 : 0.34;
          return baseDuration * (enemy.tactic?.windup ?? 1) * (enemy.type === 'boss' ? 1.12 : 1);
        }

        function spawnEnemyProjectile(enemy, angle) {
          const speed = enemy.tactic?.projectileSpeed ?? 230;
          const orb = scene.add.circle(enemy.x, enemy.y - 7, enemy.type === 'boss' ? 7 : 5, enemy.archetype.color, 0.95)
            .setStrokeStyle(2, 0xffe3ad, 0.8)
            .setDepth(18);
          projectiles.push({
            orb,
            x: enemy.x,
            y: enemy.y - 7,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.35,
            damage: enemy.damage * 0.86,
          });
        }

        function pulseEnemyAura(enemy, color, radius) {
          const pulse = scene.add.circle(enemy.x, enemy.y, 18, color, 0.13)
            .setStrokeStyle(2, color, 0.5)
            .setDepth(4);
          scene.tweens.add({
            targets: pulse,
            scale: radius / 18,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => pulse.destroy(),
          });
        }

        function updateEnemyTactic(enemy, distance, delta) {
          const tactic = enemy.tactic || enemyTactics.쥐;
          enemy.aiCooldown = Math.max(0, (enemy.aiCooldown ?? 0) - delta / 1000);
          enemy.retreatTimer = Math.max(0, (enemy.retreatTimer ?? 0) - delta / 1000);

          if (enemy.type !== 'boss' && (tactic.style === 'charger' || tactic.style === 'pouncer')
            && enemy.aiCooldown <= 0 && distance > 82 && distance < 245) {
            enemy.isCharging = tactic.style === 'pouncer' ? 0.44 : 0.58;
            enemy.aiCooldown = tactic.style === 'pouncer' ? 2.6 : 3.35;
            pulseEnemyAura(enemy, enemy.archetype.color, tactic.style === 'pouncer' ? 62 : 76);
          }

          if (tactic.style === 'support' && enemy.aiCooldown <= 0) {
            const radius = tactic.auraRadius;
            let healed = false;
            enemies.forEach((ally) => {
              if (ally === enemy || ally.defeated) return;
              if (Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y) > radius) return;
              const before = ally.health;
              ally.health = Math.min(ally.maxHealth, ally.health + ally.maxHealth * 0.12);
              healed ||= ally.health > before;
            });
            enemy.aiCooldown = 4.4;
            if (healed) pulseEnemyAura(enemy, 0xbfe8b2, radius);
          }

          if (tactic.style === 'commander' && enemy.aiCooldown <= 0) {
            const radius = tactic.auraRadius;
            enemies.forEach((ally) => {
              if (ally.defeated || Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y) > radius) return;
              ally.attackCooldown = Math.max(0, ally.attackCooldown - 0.32);
            });
            enemy.aiCooldown = 4.8;
            pulseEnemyAura(enemy, 0xe7b05b, radius);
          }
        }

        function getEnemySteering(enemy, distance, attackRange) {
          const tactic = enemy.tactic || enemyTactics.쥐;
          let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
          const shouldRetreat = enemy.retreatTimer > 0
            || ((tactic.style === 'ranged' || tactic.style === 'support') && distance < tactic.retreatRange)
            || (tactic.style === 'skirmisher' && distance < tactic.retreatRange);

          if (shouldRetreat) angle += Math.PI;
          else if ((tactic.style === 'flanker' || tactic.style === 'skirmisher' || tactic.style === 'duelist')
            && distance < attackRange + 76) angle += enemy.orbitDirection * (tactic.orbit ?? 0.5);

          if (tactic.style === 'formation') {
            const active = enemies.filter((candidate) => !candidate.defeated);
            const slot = active.indexOf(enemy) % 3 - 1;
            const targetY = playerBody.y + slot * tactic.formationSpacing;
            angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, targetY);
          }

          return angle;
        }

        function triggerPlayerDefeat() {
          if (player.health > 0) return;
          player.health = 0;
          dispatchHud(player, stage, tribeNames[currentTribeIndex] + ' 부족');
          window.dispatchEvent(new CustomEvent('asadal:state', {
            detail: {
              health: 0,
              maxHealth: player.maxHealth,
              xp: player.xp,
              level: player.level,
              stage,
              currentTribe: tribeNames[currentTribeIndex] + ' 부족',
              reputation: player.reputation,
              totalKills: player.kills,
              gameOver: true,
              running: false,
            },
          }));
        }

        function updateEnemyProjectiles(delta) {
          for (let index = projectiles.length - 1; index >= 0; index -= 1) {
            const projectile = projectiles[index];
            projectile.life -= delta / 1000;
            projectile.x += projectile.vx * delta / 1000;
            projectile.y += projectile.vy * delta / 1000;
            projectile.orb.setPosition(projectile.x, projectile.y);
            const hit = Phaser.Math.Distance.Between(projectile.x, projectile.y, playerBody.x, playerBody.y) <= playerBody.radius + 7;
            if (hit && player.health > 0) {
              player.health = Math.max(0, player.health - projectile.damage);
              player.hitPoseTimer = 160;
              spawnFloatingText(playerBody.x, playerBody.y - 18, `-${Math.max(1, Math.round(projectile.damage))}`, '#ff9f70');
              triggerPlayerDefeat();
            }
            if (hit || projectile.life <= 0 || projectile.x < 0 || projectile.x > world.width || projectile.y < 0 || projectile.y > world.height) {
              projectile.orb.destroy();
              projectiles.splice(index, 1);
            }
          }
        }

        function setEnemyReactionVisual(enemy, pose, alpha = 1) {
          if (!enemy.sprite) return;
          const textureKey = `${enemy.archetype.texture}-${pose}`;
          if (enemy.sprite.texture.key !== textureKey) enemy.sprite.setTexture(textureKey);
          const runFrameOne = scene.textures.getFrame(`${enemy.archetype.texture}-run-1`);
          const runFrameTwo = scene.textures.getFrame(`${enemy.archetype.texture}-run-2`);
          const referenceHeight = (runFrameOne.realHeight + runFrameTwo.realHeight) * 0.5;
          const motionScale = enemy.visualHeight / referenceHeight;
          enemy.sprite
            .setPosition(enemy.x, enemy.y)
            .setDisplaySize(enemy.sprite.frame.realWidth * motionScale, enemy.sprite.frame.realHeight * motionScale)
            .setDepth(10 + enemy.y / 1000)
            .setFlipX(playerBody.x > enemy.x)
            .setAngle(0)
            .setAlpha(alpha);
        }

        function resolveEnemyAttack(enemy, attackRange) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
          spawnEnemyWeaponMotion(enemy, angle);
          enemy.attackHitPending = false;

          if (enemy.tactic?.style === 'ranged') {
            spawnEnemyProjectile(enemy, angle);
            return;
          }

          const impactDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
          if (impactDistance > attackRange + 16 || player.health <= 0) return;

          let damageScale = enemy.tactic?.impactScale ?? 1;
          if (enemy.tactic?.style === 'berserker' && enemy.health <= enemy.maxHealth * 0.45) damageScale *= 1.28;
          if (enemy.tactic?.style === 'commander') damageScale *= 1.08;
          player.health -= enemy.damage * damageScale + (enemy.type === 'boss' && enemy.isCharging > 0 ? 4 : 0);
          player.hitPoseTimer = 180;
          if (enemy.tactic?.style === 'poison') {
            player.poisonTimer = Math.max(player.poisonTimer, 2.4);
            player.poisonTickTimer = 0;
          }
          if (enemy.tactic?.style === 'skirmisher') enemy.retreatTimer = 0.55;
          if (enemy.tactic?.style === 'duelist') {
            if (enemy.comboCount === 0) {
              enemy.comboCount = 1;
              enemy.attackCooldown = 0.14;
            } else {
              enemy.comboCount = 0;
            }
          }
          scene.cameras.main.shake(enemy.type === 'boss' ? 90 : 55, enemy.type === 'boss' ? 0.0035 : 0.0018);

          triggerPlayerDefeat();
        }

        function updateEnemyMovement(delta) {
          const expiredEnemies = [];
          enemies.forEach((enemy) => {
            const archetype = enemy.archetype || enemyArchetypes.쥐;
            const attackDuration = getEnemyAttackDuration(enemy);
            const previousAttackPose = enemy.attackPose ?? 0;
            enemy.hitPose = Math.max(0, (enemy.hitPose ?? 0) - delta / 1000);

            if (!enemy.defeated && enemy.poisonTimer > 0) {
              enemy.poisonTimer = Math.max(0, enemy.poisonTimer - delta / 1000);
              enemy.poisonTickTimer += delta / 1000;
              if (enemy.poisonTickTimer >= 1) {
                enemy.poisonTickTimer = 0;
                damageEnemy(enemy, player.damage * 0.08 * Math.max(1, enemy.poisonStacks));
              }
              if (enemy.poisonTimer <= 0) enemy.poisonStacks = 0;
            }

            if (!enemy.defeated && enemy.burnTimer > 0) {
              enemy.burnTimer = Math.max(0, enemy.burnTimer - delta / 1000);
              enemy.burnTickTimer += delta / 1000;
              if (enemy.burnTickTimer >= 1) {
                enemy.burnTickTimer = 0;
                const spreadLevel = player.mapSkillLevels['flame-spread'] ?? 0;
                damageEnemy(enemy, player.damage * (0.18 + spreadLevel * 0.06));
              }
            }

            if (enemy.defeated) {
              enemy.deathTimer = Math.max(0, enemy.deathTimer - delta / 1000);
              const fallThreshold = enemy.type === 'boss' ? 0.86 : 0.58;
              const fadeThreshold = enemy.type === 'boss' ? 0.42 : 0.26;
              const pose = enemy.deathTimer > fallThreshold ? 'down' : 'death';
              const alpha = enemy.deathTimer < fadeThreshold ? enemy.deathTimer / fadeThreshold : 1;
              setEnemyReactionVisual(enemy, pose, alpha);
              enemy.shadow?.setAlpha(0.38 * alpha).setPosition(enemy.x, enemy.y + enemy.visualHeight * 0.12);
              if (enemy.deathTimer <= 0) expiredEnemies.push(enemy);
              return;
            }

            if (enemy.knockdownTimer > 0) {
              enemy.knockdownTimer = Math.max(0, enemy.knockdownTimer - delta / 1000);
              const pose = enemy.knockdownTimer > 0.52 ? 'down' : enemy.knockdownTimer > 0.22 ? 'death' : 'recover';
              setEnemyReactionVisual(enemy, pose);
              enemy.shadow?.setPosition(enemy.x, enemy.y + enemy.visualHeight * 0.12).setAlpha(0.34);
              return;
            }

            if (enemy.hitPose > 0) {
              setEnemyReactionVisual(enemy, 'hit');
              enemy.shadow?.setPosition(enemy.x, enemy.y + enemy.visualHeight * 0.16).setAlpha(0.38);
              return;
            }

            updateEnemyTactic(enemy, Phaser.Math.Distance.Between(enemy.x, enemy.y, playerBody.x, playerBody.y), delta);
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta / 1000);
            enemy.attackWarning = Math.max(0, enemy.attackWarning - delta / 1000);
            enemy.chargeCooldown = Math.max(0, (enemy.chargeCooldown ?? 0) - delta / 1000);
            enemy.isCharging = Math.max(0, (enemy.isCharging ?? 0) - delta / 1000);
            enemy.bossRushCooldown = Math.max(0, (enemy.bossRushCooldown ?? 0) - delta / 1000);
            enemy.bossPulseCooldown = Math.max(0, (enemy.bossPulseCooldown ?? 0) - delta / 1000);
            enemy.bossSummonCooldown = Math.max(0, (enemy.bossSummonCooldown ?? 0) - delta / 1000);
            enemy.attackPose = Math.max(0, (enemy.attackPose ?? 0) - delta / 1000);

            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
            const attackRange = enemy.attackRange + playerBody.radius;
            const impactRemaining = attackDuration * 0.46;

            if (enemy.attackHitPending && previousAttackPose > impactRemaining && enemy.attackPose <= impactRemaining) {
              resolveEnemyAttack(enemy, attackRange);
            }

            if (enemy.type === 'boss') {
              enemy.bossPhase = enemy.health <= enemy.maxHealth * 0.6 ? 2 : 1;

              if (enemy.bossRushCooldown <= 0 && d > 80 && d < 260) {
                enemy.bossRushCooldown = enemy.bossPhase === 2 ? 2.4 : 3.2;
                enemy.isCharging = enemy.bossPhase === 2 ? 0.52 : 0.42;
                const warningRing = scene.add.circle(enemy.x, enemy.y, 72, 0xff7e50, 0.12);
                warningRing.setDepth(2);
                scene.tweens.add({
                  targets: warningRing,
                  scale: 1.8,
                  alpha: 0,
                  duration: enemy.bossPhase === 2 ? 360 : 450,
                  onComplete: () => warningRing.destroy(),
                });
              }

              if (enemy.bossPulseCooldown <= 0) {
                enemy.bossPulseCooldown = enemy.bossPhase === 2 ? 2.2 : 3.2;
                const pulseRing = scene.add.circle(enemy.x, enemy.y, 86, 0xffb46d, 0.15);
                pulseRing.setDepth(2);
                scene.tweens.add({
                  targets: pulseRing,
                  scale: 2.2,
                  alpha: 0,
                  duration: 520,
                  onComplete: () => pulseRing.destroy(),
                });

                if (d <= 120) {
                  player.health -= 8 + enemy.bossPhase * 2;
                  player.hitPoseTimer = 180;
                  scene.cameras.main.shake(70, 0.0025);
                  spawnFloatingText(playerBody.x, playerBody.y - 18, '-10', '#ff7e50');
                  triggerPlayerDefeat();
                }
              }

              if (enemy.bossPhase === 2 && enemy.bossSummonCooldown <= 0) {
                enemy.bossSummonCooldown = 5.5;
                spawnBossSupport();
              }
            }

            let enemyMoved = false;
            if (enemy.isCharging > 0) {
              const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
              const chargeScale = enemy.tactic?.chargeSpeed ?? 2.1;
              enemy.x += Math.cos(angle) * enemy.speed * chargeScale * (delta / 1000);
              enemy.y += Math.sin(angle) * enemy.speed * chargeScale * (delta / 1000);
              enemyMoved = true;
            } else if (enemy.attackPose <= 0 && (
              d > attackRange
              || ((enemy.tactic?.style === 'ranged' || enemy.tactic?.style === 'support' || enemy.tactic?.style === 'skirmisher')
                && d < (enemy.tactic?.retreatRange ?? 0))
              || ((enemy.tactic?.style === 'flanker' || enemy.tactic?.style === 'duelist') && d < attackRange + 76)
            )) {
              const angle = getEnemySteering(enemy, d, attackRange);
              const rageScale = enemy.tactic?.style === 'berserker' && enemy.health <= enemy.maxHealth * 0.45 ? 1.38 : 1;
              const moveSpeed = enemy.speed * rageScale * (delta / 1000);
              enemy.x += Math.cos(angle) * moveSpeed;
              enemy.y += Math.sin(angle) * moveSpeed;
              enemyMoved = true;
            }

            enemy.x = clamp(enemy.x, 16, world.width - 16);
            enemy.y = clamp(enemy.y, 16, world.height - 16);
            if (enemyMoved) enemy.runCycleTime += delta;

            if (enemy.sprite) {
              const runFrameMs = archetype.speed < 0.8 ? 190 : 135;
              const strideCycle = (enemy.runCycleTime / runFrameMs) * Math.PI + enemy.stridePhase;
              const stride = Math.sin(strideCycle);
              const lunging = enemy.attackPose > 0;
              const walking = !lunging && enemyMoved;
              const visualHeight = enemy.visualHeight;
              const attackProgress = lunging ? 1 - enemy.attackPose / attackDuration : 0;
              const stepLift = walking ? ((Math.cos(strideCycle * 2) + 1) * 0.5) * archetype.bob * 0.55 : 0;
              const anticipation = lunging && attackProgress < 0.46
                ? Math.sin((attackProgress / 0.46) * Math.PI * 0.5)
                : 0;
              const followThrough = lunging && attackProgress >= 0.46
                ? Math.sin(((attackProgress - 0.46) / 0.54) * Math.PI)
                : 0;
              const lungeProgress = followThrough - anticipation * 0.2;
              const squash = lunging ? followThrough * 0.055 : walking ? Math.abs(stride) * 0.012 : 0;
              const targetOnRight = playerBody.x > enemy.x;
              const facing = targetOnRight ? 1 : -1;
              const textureKey = lunging
                ? `${archetype.texture}-attack-${attackProgress < 0.46 ? 1 : 2}`
                : walking
                  ? `${archetype.texture}-run-${enemyRunFrame(enemy.runCycleTime, archetype.speed)}`
                  : archetype.texture;

              if (enemy.sprite.texture.key !== textureKey) enemy.sprite.setTexture(textureKey);
              const isMotionFrame = lunging || walking;
              const runFrameOne = scene.textures.getFrame(`${archetype.texture}-run-1`);
              const runFrameTwo = scene.textures.getFrame(`${archetype.texture}-run-2`);
              const referenceHeight = (runFrameOne.realHeight + runFrameTwo.realHeight) * 0.5;
              const motionScale = visualHeight / referenceHeight;
              const poseHeight = isMotionFrame
                ? enemy.sprite.frame.realHeight * motionScale * (1 - squash * 0.35)
                : visualHeight;
              const poseWidth = isMotionFrame
                ? enemy.sprite.frame.realWidth * motionScale * (1 + squash)
                : visualHeight * (enemy.sprite.frame.realWidth / enemy.sprite.frame.realHeight);

              enemy.sprite
                .setPosition(
                  enemy.x + facing * lungeProgress * archetype.lunge,
                  enemy.y - stepLift,
                )
                .setDisplaySize(poseWidth, poseHeight)
                .setDepth(10 + enemy.y / 1000)
                .setFlipX(targetOnRight)
                .setAngle(
                  lunging
                    ? facing * -archetype.tilt * followThrough * 0.18
                    : walking
                      ? stride * archetype.tilt * 0.18
                      : 0,
                );
            }

            if (enemy.shadow) {
              const runFrameMs = archetype.speed < 0.8 ? 190 : 135;
              const strideCycle = (enemy.runCycleTime / runFrameMs) * Math.PI + enemy.stridePhase;
              const stepLift = enemyMoved && enemy.attackPose <= 0
                ? ((Math.cos(strideCycle * 2) + 1) * 0.5) * archetype.bob * 0.55
                : 0;
              enemy.shadow
                .setPosition(enemy.x, enemy.y + enemy.visualHeight * 0.16)
                .setScale(1 - stepLift * 0.025, 1 - stepLift * 0.012);
            }

            if (enemy.attackRing) {
              enemy.attackRing.setPosition(enemy.x, enemy.y);
              enemy.attackRing.setRadius(enemy.attackRange + enemy.radius);
              const telegraphing = enemy.attackWarning > 0;
              const warningPulse = 0.18 + Math.abs(Math.sin(worldTime * 0.025)) * 0.12;
              enemy.attackRing.setFillStyle(
                enemy.isCharging > 0 ? 0xffc266 : telegraphing ? archetype.color : 0xff5c5c,
                telegraphing ? warningPulse : d <= attackRange ? 0.14 : 0.045,
              );
            }

            if (enemy.hitFlash > 0) {
              enemy.hitFlash -= delta / 1000;
              if (enemy.sprite) {
                enemy.sprite.setTintFill(0xffffff);
              }
            } else if (enemy.sprite) {
              const isThreatened = d <= attackRange + 22;
              enemy.sprite.setTint(isThreatened ? 0xffc077 : enemy.baseTint);
            }

            if (d <= attackRange && enemy.attackCooldown <= 0 && enemy.attackPose <= 0) {
              enemy.attackWarning = attackDuration * 0.54;
              enemy.attackPose = attackDuration;
              enemy.attackHitPending = true;
              enemy.attackCooldown = enemy.attackDelay;
              enemy.hitFlash = 0.1;
            }
          });

          for (let left = 0; left < enemies.length; left += 1) {
            const first = enemies[left];
            if (first.defeated || first.knockdownTimer > 0) continue;
            for (let right = left + 1; right < enemies.length; right += 1) {
              const second = enemies[right];
              if (second.defeated || second.knockdownTimer > 0) continue;
              const dx = second.x - first.x;
              const dy = second.y - first.y;
              const distance = Math.hypot(dx, dy) || 0.001;
              const spacing = first.radius + second.radius + 5;
              if (distance >= spacing) continue;
              const push = (spacing - distance) * 0.45;
              const nx = dx / distance;
              const ny = dy / distance;
              first.x = clamp(first.x - nx * push, 16, world.width - 16);
              first.y = clamp(first.y - ny * push, 16, world.height - 16);
              second.x = clamp(second.x + nx * push, 16, world.width - 16);
              second.y = clamp(second.y + ny * push, 16, world.height - 16);
            }
          }

          expiredEnemies.forEach((enemy) => {
            destroyEnemyVisual(enemy);
            const index = enemies.indexOf(enemy);
            if (index >= 0) enemies.splice(index, 1);
          });

          updateEnemyProjectiles(delta);
          if (player.poisonTimer > 0 && player.health > 0) {
            player.poisonTimer = Math.max(0, player.poisonTimer - delta / 1000);
            player.poisonTickTimer += delta / 1000;
            if (player.poisonTickTimer >= 0.48) {
              player.poisonTickTimer = 0;
              const poisonDamage = 1.6;
              player.health = Math.max(0, player.health - poisonDamage);
              player.hitPoseTimer = 90;
              spawnFloatingText(playerBody.x, playerBody.y - 20, '-독', '#8fce75');
              triggerPlayerDefeat();
            }
          }
        }

        const onKeyChange = (event, isDown) => {
          const key = event.key.toLowerCase();
          if (key === 'w' || key === 'arrowup') keyboardInput.up = isDown;
          if (key === 's' || key === 'arrowdown') keyboardInput.down = isDown;
          if (key === 'a' || key === 'arrowleft') keyboardInput.left = isDown;
          if (key === 'd' || key === 'arrowright') keyboardInput.right = isDown;
        };

        const onKeyDown = (event) => onKeyChange(event, true);
        const onKeyUp = (event) => onKeyChange(event, false);
        const resetMovementInput = () => {
          touchInput = { x: 0, y: 0 };
          keyboardInput = { up: false, down: false, left: false, right: false };
        };
        const onVisibilityChange = () => {
          if (document.hidden) resetMovementInput();
        };
        const onTouchInput = (event) => {
          touchInput = {
            x: clamp(Number(event.detail?.x || 0), -1, 1),
            y: clamp(Number(event.detail?.y || 0), -1, 1),
          };
        };

        const onTribeSetup = (event) => {
          const { alliedTribe, hostileTribe, route } = event.detail || {};
          alliedTribeIndex = tribeNames.indexOf(alliedTribe || tribeNames[0]);
          hostileTribeIndex = tribeNames.indexOf(hostileTribe || tribeNames[1]);
          resolveTribeIndexes();
          player.alliedTribe = tribeNames[alliedTribeIndex];
          player.hostileTribe = tribeNames[hostileTribeIndex];
          const hostileName = tribeNames[hostileTribeIndex];
          const validRoute = Array.isArray(route)
            ? route.filter((name) => tribeNames.includes(name) && name !== player.alliedTribe).slice(0, 5)
            : [];
          const remainingTribes = shuffle(tribeNames.filter(
            (name) => name !== player.alliedTribe && name !== hostileName && !validRoute.includes(name),
          ));
          stageTribeOrder = validRoute.length === 5
            ? validRoute
            : [hostileName, ...remainingTribes].filter((name, index, list) => list.indexOf(name) === index).slice(0, 5);
          window.dispatchEvent(new CustomEvent('asadal:state', {
            detail: {
              alliedTribe: player.alliedTribe,
              hostileTribe: player.hostileTribe,
              route: [...stageTribeOrder],
            },
          }));
        };

        const onStartRun = (event) => {
          runStarted = true;
          gamePaused = false;
          worldTime = 0;
          const freshPlayer = createPlayerState();
          Object.assign(player, freshPlayer);
          player.trainingLevels = { ...freshPlayer.trainingLevels, ...(event.detail?.trainingLevels || {}) };
          runHistory = { runsStarted: Math.max(1, Number(event.detail?.runsStarted) || 1) };
          sparedTribes = 0;
          foundForgottenTribe = false;
          pendingFinalDecision = false;
          pendingTravelStage = null;
          followers.forEach((follower) => follower.sprite?.destroy());
          followers.splice(0, followers.length);
          player.damage *= 1 + player.trainingLevels.claw * 0.03;
          player.maxHealth *= 1 + player.trainingLevels.mountain * 0.04;
          player.health = player.maxHealth;
          playerPose = 'idle';
          playerTexture = 'ung-warrior';
          lastRunFrame = -1;
          playerSprite.setTexture('ung-warrior').setAngle(0).clearTint();
          stage = 0;
          if (alliedTribeIndex < 0 || hostileTribeIndex < 0 || alliedTribeIndex === hostileTribeIndex) {
            const available = tribeNames.map((_, index) => index).filter((index) => index !== 0);
            const shuffled = shuffle(available);
            alliedTribeIndex = shuffled[0] ?? 0;
            hostileTribeIndex = shuffled[1] ?? 1;
          }
          currentTribeIndex = alliedTribeIndex;
          player.alliedTribe = tribeNames[alliedTribeIndex];
          player.hostileTribe = tribeNames[hostileTribeIndex];
          const hostileName = tribeNames[hostileTribeIndex];
          if (stageTribeOrder.length !== 5 || stageTribeOrder[0] !== hostileName) {
            const remainingTribes = shuffle(
              tribeNames.filter((name) => name !== player.alliedTribe && name !== hostileName),
            );
            stageTribeOrder = [hostileName, ...remainingTribes.slice(0, 4)];
          }
          clearedFinalBoss = false;
          applyAlliedSetupBonus();
          window.__asadalTribeIndex = currentTribeIndex;
          enemies.forEach((enemy) => {
            destroyEnemyVisual(enemy);
          });
          enemies.splice(0, enemies.length);
          touchInput = { x: 0, y: 0 };
          keyboardInput = { up: false, down: false, left: false, right: false };
          if (playerBody) {
            playerBody.setPosition(200, 300);
          }
          skillSelectionOpen = false;
          setStageState(1);
          window.dispatchEvent(new CustomEvent('asadal:state', {
            detail: {
              health: player.health,
              maxHealth: player.maxHealth,
              xp: player.xp,
              level: player.level,
              stage: 1,
              currentTribe: `${tribeNames[alliedTribeIndex]} 부족`,
              alliedTribe: tribeNames[alliedTribeIndex],
              hostileTribe: tribeNames[hostileTribeIndex],
              reputation: player.reputation,
              totalKills: 0,
              gameOver: false,
              win: false,
              running: true,
              ending: null,
              route: [...stageTribeOrder],
            },
          }));
        };

        const onChooseSkill = (event) => {
          const { id } = event.detail || {};
          applySkill(id);
        };

        const onTribeDecision = (event) => {
          if (!stageDecisionOffered || nextStageQueued) return;
          if (event.detail?.choice === 'spare') {
            sparedTribes += 1;
            player.reputation = Math.max(0, player.reputation - 8);
            player.kills = stageGoal;
            if (stage === 4 && sparedTribes >= 2 && Math.random() < 0.35) {
              foundForgottenTribe = true;
              window.dispatchEvent(new CustomEvent('asadal:tribeEvent', {
                detail: { text: '풀려난 전사가 지도에 없는 오래된 토템의 길을 알려 주었다.' },
              }));
            }

            skillSelectionOpen = false;
            queueStageClear();
          } else {
            player.reputation += 6;
            skillSelectionOpen = false;
          }
        };

        const onChooseTribeReward = (event) => {
          const choice = event.detail?.choice;
          const tribe = event.detail?.tribe || currentBattleTribe;
          if (choice === 'follower') recruitFollower(tribe);
          else applyTribePower(tribe);
          skillSelectionOpen = false;
          window.dispatchEvent(new CustomEvent('asadal:clearTribeReward'));
          tryAdvanceStage();
        };

        const onFinalDecision = (event) => {
          if (!pendingFinalDecision || clearedFinalBoss) return;
          const wantsAlliance = event.detail?.choice === 'alliance';
          const allianceEligible = canProposeTigerAlliance({
            reputation: player.reputation,
            sparedTribes,
            followers: followers.length,
          });
          triggerVictory(wantsAlliance && allianceEligible ? 'jinguk' : null);
        };

        const onContinueTravel = () => {
          if (!pendingTravelStage) return;
          const nextStage = pendingTravelStage;
          pendingTravelStage = null;
          setStageState(nextStage);
          skillSelectionOpen = stage === 6;
        };

        const onSetPaused = (event) => {
          gamePaused = Boolean(event.detail?.paused);
          if (gamePaused) resetMovementInput();
        };

        const onEndRun = () => {
          runStarted = false;
          gamePaused = true;
          skillSelectionOpen = false;
          pendingFinalDecision = false;
          enemies.forEach((enemy) => destroyEnemyVisual(enemy));
          enemies.splice(0, enemies.length);
          followers.forEach((follower) => follower.sprite?.destroy());
          followers.splice(0, followers.length);
          projectiles.forEach((projectile) => projectile.orb?.destroy());
          projectiles.splice(0, projectiles.length);
          resetMovementInput();
        };

        const onContinueStory = () => {
          if (stage === 6 && !clearedFinalBoss) {
            skillSelectionOpen = false;
          }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', resetMovementInput);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('asadal:input', onTouchInput);
        window.addEventListener('asadal:tribeSetup', onTribeSetup);
        window.addEventListener('asadal:startRun', onStartRun);
        window.addEventListener('asadal:chooseSkill', onChooseSkill);
        window.addEventListener('asadal:continueStory', onContinueStory);
        window.addEventListener('asadal:tribeDecisionChoice', onTribeDecision);
        window.addEventListener('asadal:chooseTribeReward', onChooseTribeReward);
        window.addEventListener('asadal:finalDecisionChoice', onFinalDecision);
        window.addEventListener('asadal:continueTravel', onContinueTravel);
        window.addEventListener('asadal:setPaused', onSetPaused);
        window.addEventListener('asadal:endRun', onEndRun);

        scene.events.on('shutdown', () => {
          scene.scale.off('resize', positionCanvasHud);
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
          window.removeEventListener('blur', resetMovementInput);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('asadal:input', onTouchInput);
          window.removeEventListener('asadal:tribeSetup', onTribeSetup);
          window.removeEventListener('asadal:startRun', onStartRun);
          window.removeEventListener('asadal:chooseSkill', onChooseSkill);
          window.removeEventListener('asadal:continueStory', onContinueStory);
          window.removeEventListener('asadal:tribeDecisionChoice', onTribeDecision);
          window.removeEventListener('asadal:chooseTribeReward', onChooseTribeReward);
          window.removeEventListener('asadal:finalDecisionChoice', onFinalDecision);
          window.removeEventListener('asadal:continueTravel', onContinueTravel);
          window.removeEventListener('asadal:setPaused', onSetPaused);
          window.removeEventListener('asadal:endRun', onEndRun);
        });

        window.dispatchEvent(new CustomEvent('asadal:ready'));

        showDefaultHud(stage, tribeNames[currentTribeIndex] + ' 부족', player);

        this.tweens.add({
          targets: runeCircle,
          scale: 1.2,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });

        this.events.on('update', (time, delta) => {
          if (!runStarted || gamePaused) {
            return;
          }

          worldTime += delta;

          if (player.health <= 0) {
            return;
          }

          if (!skillSelectionOpen) {
            const movementX = (keyboardInput.right ? 1 : 0) - (keyboardInput.left ? 1 : 0) + touchInput.x;
            const movementY = (keyboardInput.down ? 1 : 0) - (keyboardInput.up ? 1 : 0) + touchInput.y;
            if (movementX !== 0 || movementY !== 0) {
              const length = Math.hypot(movementX, movementY) || 1;
              const attackMoveScale = player.attackPoseTimer > 0 ? 0.34 : 1;
              const vx = (movementX / length) * player.speed * attackMoveScale * (delta / 1000);
              const vy = (movementY / length) * player.speed * attackMoveScale * (delta / 1000);
              playerBody.x = clamp(playerBody.x + vx, 20, world.width - 20);
              playerBody.y = clamp(playerBody.y + vy, 20, world.height - 20);
            }

            player.x = playerBody.x;
            player.y = playerBody.y;
            const isMoving = Math.hypot(movementX, movementY) > 0.08;
            if (Math.abs(movementX) > 0.08) player.facing = movementX < 0 ? -1 : 1;
            player.attackPoseTimer = Math.max(0, player.attackPoseTimer - delta);
            player.hitPoseTimer = Math.max(0, player.hitPoseTimer - delta);

            const nextPose = player.attackPoseTimer > 0 ? 'attack' : isMoving ? 'run' : 'idle';
            if (isMoving && nextPose === 'run') {
              player.runCycleTime += delta * clamp(player.speed / 180, 0.82, 1.35);
            } else if (!isMoving) {
              player.runCycleTime = 0;
              lastRunFrame = -1;
            }

            const runFrame = Math.floor(player.runCycleTime / 105) % 4;
            const runCycle = (player.runCycleTime / 420) * Math.PI * 2;
            const nextTexture = nextPose === 'attack'
              ? 'ung-attack'
              : nextPose === 'run'
                ? `ung-run-${runFrame + 1}`
                : 'ung-warrior';
            if (nextPose !== playerPose || nextTexture !== playerTexture) {
              playerPose = nextPose;
              playerTexture = nextTexture;
              playerSprite.setTexture(nextTexture);
            }

            if (playerPose === 'run' && runFrame !== lastRunFrame) {
              if (runFrame === 0 || runFrame === 2) {
                const footDust = scene.add.ellipse(
                  playerBody.x - player.facing * 9,
                  playerBody.y + 18,
                  18,
                  6,
                  0xb38a59,
                  0.28,
                ).setDepth(8);
                scene.tweens.add({
                  targets: footDust,
                  x: footDust.x - player.facing * 8,
                  scaleX: 1.8,
                  scaleY: 0.6,
                  alpha: 0,
                  duration: 220,
                  onComplete: () => footDust.destroy(),
                });
              }
              lastRunFrame = runFrame;
            }

            const runBounce = isMoving && playerPose === 'run' ? Math.abs(Math.sin(runCycle)) * 3.2 : 0;
            const idleBreath = playerPose === 'idle' ? Math.sin(worldTime * 0.004) : 0;
            const attackProgress = player.attackPoseTimer / 240;
            const attackKick = playerPose === 'attack' ? Math.sin((1 - attackProgress) * Math.PI) : 0;
            const hitSquash = player.hitPoseTimer > 0 ? Math.sin((player.hitPoseTimer / 180) * Math.PI) * 0.1 : 0;
            const poseWidth = playerPose === 'attack' ? 84 : playerPose === 'run' ? 76 : 75;
            const poseHeight = playerPose === 'attack' ? 108 : playerPose === 'run' ? 110 : 112;

            playerSprite
              .setPosition(
                playerBody.x + player.facing * attackKick * 5,
                playerBody.y - runBounce + idleBreath * 1.2,
              )
              .setDisplaySize(
                poseWidth * (1 + attackKick * 0.08 + hitSquash),
                poseHeight * (1 - hitSquash * 0.55),
              )
              .setDepth(10 + playerBody.y / 1000)
              .setFlipX(player.facing < 0)
              .setAngle(
                playerPose === 'attack'
                  ? player.facing * (-7 + (1 - attackProgress) * 13)
                  : playerPose === 'run'
                    ? Math.sin(runCycle) * 1.35
                    : idleBreath * 0.45,
              );

            if (player.hitPoseTimer > 0) {
              playerSprite.setTintFill(0xffd7c2);
            } else {
              playerSprite.clearTint();
            }

            playerShadow
              .setPosition(playerBody.x, playerBody.y + 19)
              .setScale(isMoving ? 1 - runBounce * 0.018 : 1, isMoving ? 0.92 : 1)
              .setAlpha(playerPose === 'attack' ? 0.5 : 0.42);
            runeCircle.setPosition(playerBody.x, playerBody.y);
            playerAttackRing.setPosition(playerBody.x, playerBody.y);
            playerAttackRing.setRadius(player.attackRange + 10);
            player.attackFlash = Math.max(0, player.attackFlash - delta / 1000);
            const ringAlpha = player.attackFlash > 0 ? 0.2 : 0.08;
            playerAttackRing.setFillStyle(0xf8d8a0, ringAlpha);

            player.attackTimer += delta;
            if (player.attackTimer >= player.attackRate * 1000) {
              handlePlayerAttack();
              player.attackTimer = 0;
            }

            if (player.skillState.heal > 0) {
              player.healTimer += delta;
              if (player.healTimer >= 2200) {
                player.health = Math.min(player.maxHealth, player.health + 4 + player.skillState.heal * 2);
                player.healTimer = 0;
              }
            }

            const herbLevel = player.trainingLevels.herb;
            if (herbLevel > 0) {
              player.permanentHealTimer += delta;
              if (player.permanentHealTimer >= 60000) {
                player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.015 * herbLevel);
                player.permanentHealTimer = 0;
                spawnFloatingText(playerBody.x, playerBody.y - 22, '쑥의 회복', '#8ef1a7');
              }
            }

            const stompLevel = player.trainingLevels.stomp;
            if (stompLevel > 0) {
              player.auraTimer += delta;
              if (player.auraTimer >= 2000) {
                enemies.forEach((enemy) => {
                  if (!enemy.defeated && Phaser.Math.Distance.Between(playerBody.x, playerBody.y, enemy.x, enemy.y) <= 125) {
                    damageEnemy(enemy, player.damage * 0.1 * stompLevel, 8);
                  }
                });
                player.auraTimer = 0;
              }
            }

            const roarLevel = player.trainingLevels.roar;
            if (roarLevel > 0) {
              player.roarTimer += delta;
              const roarCooldown = (22 - roarLevel * 2) * 1000;
              if (player.roarTimer >= roarCooldown) {
                enemies.forEach((enemy) => {
                  if (!enemy.defeated && Phaser.Math.Distance.Between(playerBody.x, playerBody.y, enemy.x, enemy.y) <= 165) {
                    damageEnemy(enemy, player.damage * 0.2, 30);
                  }
                });
                player.roarTimer = 0;
                spawnFloatingText(playerBody.x, playerBody.y - 22, '곰의 포효', '#ffd38d');
              }
            }

            spawnTimer += delta;
            if (spawnTimer >= 1200) {
              spawnWave();
              spawnTimer = 0;
            }

            updateFollowers(delta);

            if (
              stage < 6
              && !bossSpawned
              && !stageDecisionOffered
              && player.kills >= Math.ceil(stageGoal * 0.55)
              && player.kills < stageGoal
            ) {
              stageDecisionOffered = true;
              skillSelectionOpen = true;
              const situation = tribeSituations[(stage + Math.floor(player.reputation / 10)) % tribeSituations.length];
              window.dispatchEvent(new CustomEvent('asadal:tribeDecision', {
                detail: {
                  tribe: currentBattleTribe,
                  title: situation.title,
                  body: situation.body,
                  defeated: player.kills,
                  remaining: Math.max(0, stageGoal - player.kills),
                  reputation: player.reputation,
                },
              }));
              return;
            }

            if (player.kills >= stageGoal && !nextStageQueued) {
              queueStageClear();
              return;
            }

            for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
              const floating = floatingTexts[i];
              floating.life -= delta / 1000;
              floating.text.y -= 0.12 * (delta / 16.7);
              floating.text.alpha = Math.max(0, floating.life * 1.5);
              if (floating.life <= 0) {
                floating.text.destroy();
                floatingTexts.splice(i, 1);
              }
            }

            levelUp();
            updateEnemyMovement(delta);

            if (player.xp >= player.xpToNext) {
              levelUp();
            }

            hudUpdateTimer += delta;
            if (hudUpdateTimer >= 200 && !clearedFinalBoss) {
              dispatchHud(player, stage, `${currentBattleTribe} 부족`);
              hudUpdateTimer = 0;
            }
          }

          hudText.setText(`체력 ${Math.ceil(player.health)} / ${player.maxHealth}`);
        });
      },
    },
  };

  return new Phaser.Game(config);
}

export { bootAsadalGame };
