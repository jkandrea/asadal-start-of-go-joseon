import Phaser from 'phaser';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const skillCatalog = [
  { id: 'claw', name: '곰의 발톱', description: '근접 공격이 20% 강화되고, 적 처치 시 체력을 회복합니다.', modifier: 'attack' },
  { id: 'herb', name: '쑥의 향', description: '체력 회복량과 회복 스택이 증가합니다.', modifier: 'heal' },
  { id: 'stomp', name: '마늘밭', description: '주변 적에게 지속 피해를 입히는 충격파를 생성합니다.', modifier: 'aura' },
  { id: 'roar', name: '곰의 포효', description: '광역 넉백과 분노의 공격 세기를 얻습니다.', modifier: 'roar' },
  { id: 'mountain', name: '산의 힘', description: '최대 체력과 방어력을 증가시킵니다.', modifier: 'vigor' },
  { id: 'hare', name: '토끼의 발', description: '이동 속도를 증가하고 회피 시간이 길어집니다.', modifier: 'speed' },
];

const bearTrainingCatalog = [
  { id: 'claw', name: '곰의 발톱', description: '기본 공격력이 3%씩 증가합니다. 최대 5레벨.', modifier: 'permanent_attack', maxLevel: 5 },
  { id: 'herb', name: '쑥의 향', description: '60초마다 체력의 1.5%를 회복합니다.', modifier: 'permanent_heal', maxLevel: 5 },
  { id: 'stomp', name: '마늘밭', description: '2초마다 주변 적에게 피해를 줍니다.', modifier: 'permanent_aura', maxLevel: 5 },
  { id: 'roar', name: '곰의 포효', description: '20초마다 광역 넉백과 피해를 준다.', modifier: 'permanent_roar', maxLevel: 5 },
  { id: 'mountain', name: '산의 힘', description: '최대 체력이 4%씩 증가합니다.', modifier: 'permanent_vigor', maxLevel: 5 },
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
    { id: 'everglow', name: '꺼지지 않는 불씨', description: '적중 시 화상 피해를 입힙니다.', modifier: 'aura' },
    { id: 'flame-spread', name: '불길 확장', description: '범위 공격 효과가 커집니다.', modifier: 'aura' },
    { id: 'reverse-bow', name: '역린', description: '보스에게 추가 피해를 줍니다.', modifier: 'roar' },
  ],
  뱀: [
    { id: 'slithering-poison', name: '스미는 독', description: '독 피해 효과가 증가합니다.', modifier: 'aura' },
    { id: 'cold-blood', name: '냉혈', description: '중독/감속 대상에게 큰 피해를 줍니다.', modifier: 'attack' },
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
};

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
  isInvulnerable: false,
  attackTimer: 0,
  attackFlash: 0,
  healTimer: 0,
  auraTimer: 0,
  rage: 0,
  trainingPoints: 5,
  trainingLevels: {
    claw: 0,
    herb: 0,
    stomp: 0,
    roar: 0,
    mountain: 0,
  },
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
      alliedTribe: tribeNames[alliedTribeIndex] ?? '쥐',
      hostileTribe: tribeNames[hostileTribeIndex] ?? '호랑이',
      reputation: state.reputation,
      totalKills: 0,
      gameOver: state.health <= 0,
      running: true,
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

function emitChoices(tribeIndex = window.__asadalTribeIndex ?? 0) {
  const safeIndex = Number.isInteger(tribeIndex) && tribeIndex >= 0 ? tribeIndex : 0;
  const tribeKey = tribeNames[safeIndex] ?? '쥐';
  const pool = mapSkillCatalog[tribeKey] ?? skillCatalog;
  const choices = shuffle(pool).slice(0, 3);

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

function emitTrainingChoices(player) {
  window.dispatchEvent(new CustomEvent('asadal:skillChoices', {
    detail: {
      source: 'training',
      choices: bearTrainingCatalog,
      remaining: player.trainingPoints,
      selected: bearTrainingCatalog
        .filter((training) => (player.trainingLevels[training.id] ?? 0) > 0)
        .map((training) => ({
          ...training,
          level: player.trainingLevels[training.id] ?? 0,
        })),
      label: '곰의 수련',
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

function bootAsadalGame(container) {
  const config = {
    type: Phaser.AUTO,
    width: container.clientWidth || 1280,
    height: container.clientHeight || 720,
    backgroundColor: '#090705',
    parent: container,
    physics: {
      default: 'arcade',
    },
    scene: {
      create() {
        const scene = this;
        const player = createPlayerState();
        const enemies = [];
        const projectiles = [];
        const floatingTexts = [];
        let userInput = { up: false, down: false, left: false, right: false };
        let spawnTimer = 0;
        let stage = 1;
        let currentTribeIndex = 0;
        let bossSpawned = false;
        let pendingRestart = false;
        let skillSelectionOpen = false;
        let combo = 0;
        let worldTime = 0;
        let clearedFinalBoss = false;
        let alliedTribeIndex = 0;
        let hostileTribeIndex = 0;

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
          player.tribeBonus = { ...trait };
        };

        const world = scene.add.rectangle(0, 0, 1400, 900, 0x1c140f).setOrigin(0, 0);
        scene.physics.world.setBounds(0, 0, world.width, world.height);

        const playerBody = scene.add.circle(200, 300, 18, 0xf8d8a0);
        scene.physics.add.existing(playerBody);
        playerBody.body.setCollideWorldBounds(true);
        playerBody.body.setDrag(800);
        playerBody.setDepth(10);

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
        stageLabel.setDepth(30);

        const hudText = scene.add.text(30, 52, '체력 100 / 100', {
          fontSize: '16px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#e5d5ae',
        });
        hudText.setDepth(30);

        const bossText = scene.add.text(0, 0, '', {
          fontSize: '22px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#ffbd82',
          fontStyle: 'bold',
        });
        bossText.setDepth(30);

        const stageObjectiveText = scene.add.text(30, 78, '목표: 적 8마리 처치', {
          fontSize: '15px',
          fontFamily: 'Segoe UI, sans-serif',
          fill: '#e9dbc0',
        });
        stageObjectiveText.setDepth(30);

        let stageGoal = 8;
        let nextStageQueued = false;
        let stageAdvanceReady = false;

        function updateStageGoalText() {
          const goalLabel = bossSpawned ? '보스 처치' : '적';
          stageObjectiveText.setText(`목표: ${goalLabel} ${stageGoal}마리 처치 • ${Math.min(player.kills, stageGoal)}/${stageGoal}`);
        }

        function getTrainingSummary() {
          return bearTrainingCatalog
            .filter((training) => (player.trainingLevels[training.id] ?? 0) > 0)
            .map((training) => ({
              ...training,
              level: player.trainingLevels[training.id] ?? 0,
            }));
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

        function setStageState(nextStage) {
          stage = nextStage;
          currentTribeIndex = (stage - 1) % tribeNames.length;
          window.__asadalTribeIndex = currentTribeIndex;
          const currentTribeName = tribeNames[currentTribeIndex];
          const currentTribe = currentTribeName + ' 부족';
          bossSpawned = stage % 3 === 0;
          stageLabel.setText(currentTribe);
          stageGoal = bossSpawned ? 1 : Math.max(5, stage * 4 + 2);
          player.kills = 0;
          nextStageQueued = false;
          stageAdvanceReady = false;
          applyTribeTrait(player, currentTribeName);
          updateStageGoalText();
          showDefaultHud(stage, currentTribe, player);
          bossText.setText(bossSpawned ? `${currentTribe} 보스 등장!` : `${currentTribe} 전투 시작`);
          bossText.setPosition(240, 20);
          bossText.setVisible(true);
          scene.time.delayedCall(1800, () => bossText.setVisible(false));

          enemies.forEach((enemy) => {
            if (enemy.sprite) enemy.sprite.destroy();
            if (enemy.attackRing) enemy.attackRing.destroy();
          });
          enemies.splice(0, enemies.length);

          if (bossSpawned) {
            const boss = createEnemyState(700, 360, 'boss');
            const sprite = scene.add.circle(boss.x, boss.y, boss.radius, 0xff7e50);
            sprite.setDepth(4);
            boss.sprite = sprite;
            boss.attackRing = scene.add.circle(boss.x, boss.y, boss.attackRange + boss.radius, 0xff4d4d, 0.15);
            boss.attackRing.setDepth(1);
            enemies.push(boss);
          } else {
            createEnemyBurst(650, 260, false);
            createEnemyBurst(760, 420, false);
          }
        }

        function advanceStage() {
          const nextStage = stage + 1;
          setStageState(nextStage);
        }

        function tryAdvanceStage() {
          if (!nextStageQueued || !stageAdvanceReady || skillSelectionOpen) {
            return;
          }

          enemies.forEach((enemy) => {
            if (enemy.sprite) enemy.sprite.destroy();
            if (enemy.attackRing) enemy.attackRing.destroy();
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
          const sprite = scene.add.circle(base.x, base.y, base.radius, 0xce6946);
          sprite.setDepth(4);
          base.sprite = sprite;
          base.attackRing = scene.add.circle(base.x, base.y, base.attackRange + base.radius, 0xff4d4d, 0.05);
          base.attackRing.setDepth(1);
          enemies.push(base);
          return base;
        }

        function createEnemyBurst(centerX, centerY, isBoss = false) {
          const enemyCount = isBoss ? 1 : 4 + Math.min(6, stage * 2);
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
            const sprite = scene.add.circle(enemy.x, enemy.y, enemy.radius, isBoss ? 0xff7e50 : 0xc96f52);
            sprite.setDepth(4);
            enemy.sprite = sprite;
            enemy.attackRing = scene.add.circle(enemy.x, enemy.y, enemy.attackRange + enemy.radius, 0xff4d4d, 0.05);
            enemy.attackRing.setDepth(1);
            enemies.push(enemy);
          }
        }

        function spawnBossSupport() {
          const activeSupportCount = enemies.filter((enemy) => enemy.type !== 'boss').length;
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
            const sprite = scene.add.circle(support.x, support.y, support.radius, 0xf39f61);
            sprite.setDepth(4);
            support.sprite = sprite;
            support.attackRing = scene.add.circle(support.x, support.y, support.attackRange + support.radius, 0xff8d4d, 0.05);
            support.attackRing.setDepth(1);
            enemies.push(support);
          }
        }

        function awardStageClear() {
          player.xp += bossSpawned ? 30 : 18;
          player.reputation += bossSpawned ? 12 : 6;
          bossText.setText(bossSpawned ? '보스 처치! 다음 부족으로 이동' : '목표 달성! 다음 부족으로 이동');
          bossText.setVisible(true);
        }

        function triggerVictory() {
          if (clearedFinalBoss) return;
          clearedFinalBoss = true;
          skillSelectionOpen = true;
          bossText.setText('호랑이 부족을 쓰러뜨렸다. 아사달의 신화가 시작된다');
          bossText.setVisible(true);
          stageLabel.setText('호랑이 부족');
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
            },
          }));
        }

        function damageEnemy(enemy, damage, knockback = 0) {
          enemy.health -= damage;
          enemy.hitFlash = 0.12;
          spawnFloatingText(enemy.x, enemy.y - 18, `-${Math.max(1, Math.round(damage))}`, '#ffd38d');

          if (enemy.sprite) {
            enemy.sprite.setFillStyle(0xffffff);
          }
          if (knockback > 0) {
            const angle = Phaser.Math.Angle.Between(playerBody.x, playerBody.y, enemy.x, enemy.y);
            enemy.x += Math.cos(angle) * knockback;
            enemy.y += Math.sin(angle) * knockback;
          }
          if (enemy.health <= 0) {
            player.kills += 1;
            player.xp += enemy.type === 'boss' ? 25 : 8;
            player.reputation += enemy.type === 'boss' ? 10 : 2;
            if (enemy.sprite) {
              enemy.sprite.destroy();
            }
            if (enemy.attackRing) {
              enemy.attackRing.destroy();
            }
            const index = enemies.indexOf(enemy);
            if (index >= 0) {
              enemies.splice(index, 1);
            }
            spawnFloatingText(enemy.x, enemy.y - 20, enemy.type === 'boss' ? '+25' : '+8', '#8ef1a7');
            updateStageGoalText();
            if (enemy.type === 'boss') {
              bossSpawned = false;
              if (stage >= 5) {
                triggerVictory();
              }
            }
            if (Math.random() < (enemy.type === 'boss' ? 0.9 : 0.28)) {
            }
          }
        }

        function spawnWave() {
          if (bossSpawned || skillSelectionOpen) {
            return;
          }
          const desiredCount = Math.min(8, Math.max(2, stage + 1));
          if (enemies.length < desiredCount) {
            spawnEnemyAtEdge();
          }
        }

        function levelUp() {
          while (player.xp >= player.xpToNext) {
            player.xp -= player.xpToNext;
            player.level += 1;
            player.xpToNext = Math.round(player.xpToNext * 1.4);
            emitChoices(currentTribeIndex);
            skillSelectionOpen = true;
          }
        }

        function applyPermanentTraining(skillId) {
          const training = bearTrainingCatalog.find((item) => item.id === skillId);
          if (!training || player.trainingPoints <= 0) return;

          const currentLevel = player.trainingLevels[skillId] ?? 0;
          if (currentLevel >= training.maxLevel) return;

          player.trainingLevels[skillId] = currentLevel + 1;
          player.trainingPoints -= 1;

          switch (skillId) {
            case 'claw':
              player.damage *= 1.03;
              break;
            case 'herb':
              player.maxHealth += 8;
              player.health = Math.min(player.maxHealth, player.health + 10);
              break;
            case 'stomp':
              player.skillState.aura += 1;
              break;
            case 'roar':
              player.skillState.roar += 1;
              player.damage += 2;
              break;
            case 'mountain':
              player.maxHealth *= 1.04;
              player.health = Math.min(player.maxHealth, player.health + 12);
              break;
            default:
              break;
          }

          if (player.trainingPoints <= 0) {
            skillSelectionOpen = false;
            window.dispatchEvent(new CustomEvent('asadal:clearChoices'));
            setStageState(1);
            window.dispatchEvent(new CustomEvent('asadal:start'));
            return;
          }

          emitTrainingChoices(player);
        }

        function applySkill(skillId) {
          const skill = skillCatalog.find((item) => item.id === skillId)
            || (mapSkillCatalog[tribeNames[currentTribeIndex]] || []).find((item) => item.id === skillId)
            || bearTrainingCatalog.find((item) => item.id === skillId);
          if (!skill) return;

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

          player.attackFlash = 0.18;
          playerAttackRing.setFillStyle(0xf8d8a0, 0.18);

          enemies.forEach((enemy) => {
            const d = Phaser.Math.Distance.Between(playerBody.x, playerBody.y, enemy.x, enemy.y);
            if (d < nearestDistance) {
              nearestDistance = d;
              nearestEnemy = enemy;
            }
            if (d <= baseAttackRadius) {
              const damage = player.damage + player.skillState.attack * 5 + player.skillState.roar * 3;
              damageEnemy(enemy, damage, player.skillState.roar > 0 ? 18 : 10);
              hitCount += 1;
              if (player.skillState.aura > 0 && Math.random() < 0.5) {
                enemy.health -= player.skillState.aura * 2;
              }
              if (player.skillState.heal > 0 && hitCount % 2 === 0) {
                player.health = Math.min(player.maxHealth, player.health + 2 + player.skillState.heal * 1.5);
              }
            }
          });

          if (nearestEnemy) {
            const angle = Phaser.Math.Angle.Between(playerBody.x, playerBody.y, nearestEnemy.x, nearestEnemy.y);
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

        function updateEnemyMovement(delta) {
          enemies.forEach((enemy) => {
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - delta / 1000);
            enemy.attackWarning = Math.max(0, enemy.attackWarning - delta / 1000);
            enemy.chargeCooldown = Math.max(0, (enemy.chargeCooldown ?? 0) - delta / 1000);
            enemy.isCharging = Math.max(0, (enemy.isCharging ?? 0) - delta / 1000);
            enemy.bossRushCooldown = Math.max(0, (enemy.bossRushCooldown ?? 0) - delta / 1000);
            enemy.bossPulseCooldown = Math.max(0, (enemy.bossPulseCooldown ?? 0) - delta / 1000);
            enemy.bossSummonCooldown = Math.max(0, (enemy.bossSummonCooldown ?? 0) - delta / 1000);

            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
            const attackRange = enemy.attackRange + playerBody.radius;

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
                  spawnFloatingText(playerBody.x, playerBody.y - 18, '-10', '#ff7e50');
                }
              }

              if (enemy.bossPhase === 2 && enemy.bossSummonCooldown <= 0) {
                enemy.bossSummonCooldown = 5.5;
                spawnBossSupport();
              }
            }

            if (enemy.type === 'boss' && enemy.isCharging > 0) {
              const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
              enemy.x += Math.cos(angle) * enemy.speed * 2.1 * (delta / 1000);
              enemy.y += Math.sin(angle) * enemy.speed * 2.1 * (delta / 1000);
            } else if (d > attackRange) {
              const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerBody.x, playerBody.y);
              const moveSpeed = enemy.speed * (delta / 1000);
              enemy.x += Math.cos(angle) * moveSpeed;
              enemy.y += Math.sin(angle) * moveSpeed;
            }

            enemy.x = clamp(enemy.x, 16, world.width - 16);
            enemy.y = clamp(enemy.y, 16, world.height - 16);

            if (enemy.sprite) {
              enemy.sprite.setPosition(enemy.x, enemy.y);
            }

            if (enemy.attackRing) {
              enemy.attackRing.setPosition(enemy.x, enemy.y);
              enemy.attackRing.setRadius(enemy.attackRange + enemy.radius);
              enemy.attackRing.setFillStyle(enemy.type === 'boss' && enemy.isCharging > 0 ? 0xffc266 : 0xff5c5c, d <= attackRange ? 0.22 : 0.08);
            }

            if (enemy.hitFlash > 0) {
              enemy.hitFlash -= delta / 1000;
              if (enemy.sprite) {
                enemy.sprite.setFillStyle(0xffffff);
              }
            } else if (enemy.sprite) {
              const isThreatened = d <= attackRange + 22;
              enemy.sprite.setFillStyle(isThreatened ? 0xffc077 : enemy.type === 'boss' ? 0xff7e50 : 0xc96f52);
            }

            if (d <= attackRange && enemy.attackCooldown <= 0) {
              enemy.attackWarning = 0.25;
              const angle = Phaser.Math.Angle.Between(playerBody.x, playerBody.y, enemy.x, enemy.y);
              const strike = scene.add.line(
                0,
                0,
                enemy.x,
                enemy.y,
                enemy.x + Math.cos(angle) * 35,
                enemy.y + Math.sin(angle) * 35,
                enemy.type === 'boss' ? 0xffb46d : 0xff8a6b,
                0.8,
              );
              strike.setLineWidth(enemy.type === 'boss' ? 5 : 4);
              scene.tweens.add({
                targets: strike,
                alpha: 0,
                duration: 120,
                onComplete: () => strike.destroy(),
              });

              player.health -= enemy.damage + (enemy.type === 'boss' && enemy.isCharging > 0 ? 4 : 0);
              enemy.attackCooldown = enemy.attackDelay;
              enemy.hitFlash = 0.12;

              if (player.health <= 0) {
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
                    totalKills: 0,
                    gameOver: true,
                    running: false,
                  },
                }));
              }
            }
          });
        }

        const onKeyChange = (event, isDown) => {
          const key = event.key.toLowerCase();
          if (key === 'w' || key === 'arrowup') keyboardInput.up = isDown;
          if (key === 's' || key === 'arrowdown') keyboardInput.down = isDown;
          if (key === 'a' || key === 'arrowleft') keyboardInput.left = isDown;
          if (key === 'd' || key === 'arrowright') keyboardInput.right = isDown;
        };

        window.addEventListener('keydown', (event) => onKeyChange(event, true));
        window.addEventListener('keyup', (event) => onKeyChange(event, false));
        window.addEventListener('asadal:input', (event) => {
          touchInput = {
            x: clamp(Number(event.detail?.x || 0), -1, 1),
            y: clamp(Number(event.detail?.y || 0), -1, 1),
          };
        });

        window.addEventListener('asadal:tribeSetup', (event) => {
          const { alliedTribe, hostileTribe } = event.detail || {};
          alliedTribeIndex = tribeNames.indexOf(alliedTribe || tribeNames[0]);
          hostileTribeIndex = tribeNames.indexOf(hostileTribe || tribeNames[1]);
          resolveTribeIndexes();
        });

        window.addEventListener('asadal:startRun', () => {
          worldTime = 0;
          player.trainingPoints = 5;
          player.trainingLevels = {
            claw: 0,
            herb: 0,
            stomp: 0,
            roar: 0,
            mountain: 0,
          };
          player.health = player.maxHealth;
          player.xp = 0;
          player.level = 1;
          player.reputation = 0;
          player.kills = 0;
          stage = 0;
          if (alliedTribeIndex < 0 || hostileTribeIndex < 0 || alliedTribeIndex === hostileTribeIndex) {
            const available = tribeNames.map((_, index) => index).filter((index) => index !== 0);
            const shuffled = shuffle(available);
            alliedTribeIndex = shuffled[0] ?? 0;
            hostileTribeIndex = shuffled[1] ?? 1;
          }
          currentTribeIndex = alliedTribeIndex;
          clearedFinalBoss = false;
          applyAlliedSetupBonus();
          window.__asadalTribeIndex = currentTribeIndex;
          enemies.forEach((enemy) => {
            if (enemy.sprite) enemy.sprite.destroy();
            if (enemy.attackRing) enemy.attackRing.destroy();
          });
          enemies.splice(0, enemies.length);
          touchInput = { x: 0, y: 0 };
          keyboardInput = { up: false, down: false, left: false, right: false };
          if (playerBody) {
            playerBody.setPosition(200, 300);
          }
          skillSelectionOpen = true;
          stageLabel.setText(`${tribeNames[alliedTribeIndex]} 부족`);
          stageObjectiveText.setText('수련을 선택하세요');
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
            },
          }));
          emitTrainingChoices(player);
        });

        window.addEventListener('asadal:chooseSkill', (event) => {
          const { id, source = 'map' } = event.detail || {};
          if (source === 'training') {
            applyPermanentTraining(id);
            return;
          }
          applySkill(id);
        });

        scene.events.on('shutdown', () => {
          window.removeEventListener('keydown', onKeyChange);
          window.removeEventListener('keyup', onKeyChange);
        });

        showDefaultHud(stage, tribeNames[currentTribeIndex] + ' 부족', player);

        this.tweens.add({
          targets: runeCircle,
          scale: 1.2,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });

        this.time.addEvent({
          delay: 150,
          callback: () => {
            if (!pendingRestart && !skillSelectionOpen && player.health > 0) {
              const keyboardX = (keyboardInput.right ? 1 : 0) - (keyboardInput.left ? 1 : 0);
              const keyboardY = (keyboardInput.down ? 1 : 0) - (keyboardInput.up ? 1 : 0);
              const directionX = keyboardX + touchInput.x;
              const directionY = keyboardY + touchInput.y;
              const moveX = directionX !== 0 || directionY !== 0 ? 1 : 0;
              if (moveX) {
                const length = Math.hypot(directionX, directionY) || 1;
                const normX = directionX / length;
                const normY = directionY / length;
                playerBody.x += normX * player.speed * 0.05;
                playerBody.y += normY * player.speed * 0.05;
              }
            }
          },
          loop: true,
        });

        this.events.on('update', (time, delta) => {
          worldTime += delta;

          if (player.health <= 0) {
            return;
          }

          if (!skillSelectionOpen) {
            const movementX = (keyboardInput.right ? 1 : 0) - (keyboardInput.left ? 1 : 0) + touchInput.x;
            const movementY = (keyboardInput.down ? 1 : 0) - (keyboardInput.up ? 1 : 0) + touchInput.y;
            if (movementX !== 0 || movementY !== 0) {
              const length = Math.hypot(movementX, movementY) || 1;
              const vx = (movementX / length) * player.speed * (delta / 1000);
              const vy = (movementY / length) * player.speed * (delta / 1000);
              playerBody.x = clamp(playerBody.x + vx, 20, world.width - 20);
              playerBody.y = clamp(playerBody.y + vy, 20, world.height - 20);
            }

            player.x = playerBody.x;
            player.y = playerBody.y;
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

            spawnTimer += delta;
            if (spawnTimer >= 1200) {
              spawnWave();
              spawnTimer = 0;
            }

            if (player.kills >= stageGoal && !nextStageQueued) {
              nextStageQueued = true;
              awardStageClear();
              scene.time.delayedCall(1200, () => {
                stageAdvanceReady = true;
                tryAdvanceStage();
              });
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
          }

          hudText.setText(`체력 ${Math.ceil(player.health)} / ${player.maxHealth}`);
        });
      },
    },
  };

  return new Phaser.Game(config);
}

export { bootAsadalGame };
