import { useEffect, useRef, useState } from 'react';
import { GAME_PHASE, isCombatPaused, resolveGamePhase } from './gameFlow';
import {
  ENDINGS,
  META_STORAGE_KEY,
  TRAINING_ITEMS,
  createInitialMeta,
  investTraining,
  normalizeMeta,
  recordRunStart,
  refundTraining,
  rewardBoss,
  trainingCost,
  unlockEnding,
} from './metaProgress';

const tribePool = ['쥐', '소', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

const pickTribePair = () => {
  const shuffled = [...tribePool].sort(() => Math.random() - 0.5);
  return {
    alliedTribe: shuffled[0],
    hostileTribe: shuffled[1],
  };
};

const initialHud = {
  health: 100,
  maxHealth: 100,
  xp: 0,
  level: 1,
  stage: 1,
  currentTribe: '곰 부족',
  reputation: 0,
  totalKills: 0,
  gameOver: false,
  win: false,
  running: false,
  route: [],
  ending: null,
};

const createRunSetup = () => {
  const pair = pickTribePair();
  const routePool = tribePool.filter((tribe) => tribe !== pair.alliedTribe && tribe !== pair.hostileTribe);
  const route = [pair.hostileTribe, ...routePool.sort(() => Math.random() - 0.5).slice(0, 4)];
  return { ...pair, route };
};

const prologueScenes = [
  {
    eyebrow: '프롤로그 · 산의 아침',
    title: '곰 부족의 마지막 평온',
    body: '동굴 앞에서는 마늘과 쑥을 거두고, 아이들은 볕 아래를 뛰놀았다. 웅이 지키던 산은 작지만 누구의 아래에도 들지 않은 땅이었다.',
  },
  {
    eyebrow: '프롤로그 · 침입',
    title: '“이 산을 호랑이의 영역으로 선포한다.”',
    body: '연기와 함께 호랑이 부족의 군세가 나타났다. 웅은 방패를 들었다. “우리는 누구의 아래에도 들어가지 않는다.” 그날, 첫 번째 발톱이 부딪쳤다.',
  },
  {
    eyebrow: '프롤로그 · 거짓 소문',
    title: '승리 뒤에 더 큰 전쟁이 왔다',
    body: '물러난 호랑이 부족은 열한 부족에 거짓말을 퍼뜨렸다. “곰의 웅이 모든 부족을 정복하려 한다.” 다섯 부족이 창을 들었고, 웅은 진실을 되찾기 위해 산을 나섰다.',
  },
];

const endingStories = {
  asadal: {
    eyebrow: '결말 · 하늘과 땅의 약속',
    title: '서로 다른 토템 아래, 하나의 터전이 시작되었다',
    body: '환웅과 웅 사이에서 한 아이가 태어났다. 아이는 자라 단군왕검이 되었고, 사람을 널리 이롭게 하겠다는 뜻으로 아사달에 새로운 나라를 세웠다.',
    epilogue: '서로 다른 부족들이 함께 세운 그 나라는 훗날 고조선이라 불리게 되었다. 그리고 이들의 이야기는 오랜 세월을 지나, 곰과 호랑이, 그리고 하늘에서 내려온 신의 이야기가 되어 전해졌다고 한다.',
  },
  conqueror: {
    title: '호랑이를 몰아낸 자가 그 자리를 차지했다',
    body: '웅은 승리했지만 부족들은 무기를 내려놓지 않았다. 가장 강한 전사를 두려워하는 땅만 남았다.',
    epilogue: '호랑이가 실패한 일을 곰이 해냈다. 그러나 그곳에는 함께 세운 나라가 없었다.',
  },
  rebellion: {
    title: '전쟁에서 이겼지만 세상을 얻지는 못했다',
    body: '호왕은 쓰러졌으나 살아남은 부족들은 웅을 새로운 폭군으로 여겼다. 다섯 토템이 동시에 반란의 불을 밝혔다.',
    epilogue: '승리한 전사는 다시 끝나지 않는 전쟁의 한가운데에 섰다.',
  },
  tiger_heir: {
    title: '숲속에서 어린 포효가 들렸다',
    body: '호왕에게는 마지막 후계자가 남아 있었다. 웅은 그 아이를 베지 않았고, 끝난 전쟁 뒤에 또 다른 이야기가 자라기 시작했다.',
    epilogue: '그 선택이 복수의 씨앗인지 화해의 시작인지는 아직 아무도 몰랐다.',
  },
  bear_return: {
    title: '웅은 왕좌 대신 고향으로 돌아갔다',
    body: '살아남은 부족들은 스스로 화해의 질서를 만들었다. 웅은 쑥과 마늘 향이 피어나는 곰 부족의 산으로 돌아갔다.',
    epilogue: '왕이 되지 않은 영웅의 이름은 평화가 필요할 때마다 불렸다.',
  },
  hwanung_parting: {
    title: '환웅을 만났지만, 두 사람은 다른 길을 택했다',
    body: '환웅은 하늘의 뜻을 말했고 웅은 아직 땅의 상처가 남았다고 답했다. 둘은 다시 만날 날을 약속했다.',
    epilogue: '완성되지 않은 만남은 다음 회차에서 진정한 건국으로 이어질 실마리가 되었다.',
  },
  forgotten_tribe: {
    title: '열두 토템 밖의 이름 없는 사람들이 나타났다',
    body: '기록에서 지워진 부족은 호랑이의 거짓말보다 오래된 진실을 전했다. 웅은 알려진 신화 바깥의 역사를 마주했다.',
    epilogue: '역사는 강한 자뿐 아니라 끝내 기억된 자의 것이기도 했다.',
  },
  jinguk: {
    eyebrow: '결말 · 굴복한 호왕',
    title: '호랑이와 곰은 같은 왕좌를 택했다',
    body: '웅은 굴복한 호왕을 베지 않았다. 두 사람은 혼인으로 전쟁을 끝내고 열두 부족을 하나의 강대한 군세로 묶었다. 그 사이에서 태어난 아이는 영토 지배에 대한 야욕이 남다르고 매우 영특했다.',
    epilogue: '자라난 아이는 강한 군대를 이끌고 남쪽으로 내려가 새로운 나라를 세웠다. 그 나라는 훗날 "진국"이라 불렸다고 한다.',
  },
};

const endingIllustrations = Object.fromEntries(
  ENDINGS.map(({ id }) => [id, `/assets/ending-${id.replaceAll('_', '-')}.jpg`]),
);

const getEndingScenes = (ending) => {
  const endingMeta = ENDINGS.find(({ id }) => id === ending) || ENDINGS[3];
  const story = endingStories[ending] || endingStories.tiger_heir;
  return [
    {
      eyebrow: story.eyebrow || '결말 · 무너진 호왕',
      title: story.title,
      body: story.body,
    },
    {
      eyebrow: endingMeta.code,
      title: endingMeta.name,
      body: story.epilogue,
    },
  ];
};

function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const joystickRef = useRef(null);
  const runSetupRef = useRef(null);
  const [hud, setHud] = useState(initialHud);
  const [choices, setChoices] = useState([]);
  const [choiceSource, setChoiceSource] = useState('map');
  const [choiceMeta, setChoiceMeta] = useState({ label: '가르침', remaining: null, selected: [] });
  const [showIntro, setShowIntro] = useState(true);
  const [menuView, setMenuView] = useState('home');
  const [galleryEnding, setGalleryEnding] = useState(null);
  const [galleryEndingStep, setGalleryEndingStep] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [meta, setMeta] = useState(() => {
    try {
      return normalizeMeta(JSON.parse(localStorage.getItem(META_STORAGE_KEY)));
    } catch {
      return createInitialMeta();
    }
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [prologueStep, setPrologueStep] = useState(-1);
  const [chapter, setChapter] = useState(null);
  const [tribeDecision, setTribeDecision] = useState(null);
  const [finalDecision, setFinalDecision] = useState(null);
  const [tribeReward, setTribeReward] = useState(null);
  const [travel, setTravel] = useState(null);
  const [tribeNotice, setTribeNotice] = useState('');
  const [endingStep, setEndingStep] = useState(0);
  const [alliedTribe, setAlliedTribe] = useState('쥐');
  const [hostileTribe, setHostileTribe] = useState('호랑이');
  const [stick, setStick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleHud = (event) => {
      const detail = event.detail || {};
      if (detail.alliedTribe) {
        setAlliedTribe(detail.alliedTribe);
      }
      if (detail.hostileTribe) {
        setHostileTribe(detail.hostileTribe);
      }
      if (detail.win) {
        setEndingStep(0);
        setChoices([]);
        setTribeDecision(null);
        setFinalDecision(null);
        setTribeReward(null);
        setTravel(null);
        setMeta((current) => unlockEnding(current, detail.ending));
      }
      setHud((previous) => ({ ...previous, ...detail }));
    };

    const handleChoices = (event) => {
      const detail = event.detail || {};
      setChoiceSource(detail.source || 'map');
      setChoices(detail.choices || detail || []);
      setChoiceMeta({
        label: detail.label || '가르침',
        remaining: detail.remaining ?? null,
        selected: detail.selected || [],
      });
    };

    const clearChoices = () => {
      setChoices([]);
    };

    const handleChapter = (event) => {
      setChapter(event.detail || null);
      setChoices([]);
    };

    const handleMetaReward = (event) => {
      if (event.detail?.type === 'boss') {
        setMeta((current) => rewardBoss(current, Boolean(event.detail.final)));
      }
    };

    const handleTribeDecision = (event) => setTribeDecision(event.detail || null);
    const handleFinalDecision = (event) => setFinalDecision(event.detail || null);
    const handleTribeReward = (event) => setTribeReward(event.detail || null);
    const clearTribeReward = () => setTribeReward(null);
    const handleTravel = (event) => setTravel(event.detail || null);
    const handleTribeEvent = (event) => {
      setTribeNotice(event.detail?.text || '부족의 마음이 움직였습니다.');
      window.setTimeout(() => setTribeNotice(''), 4200);
    };

    window.addEventListener('asadal:state', handleHud);
    window.addEventListener('asadal:skillChoices', handleChoices);
    window.addEventListener('asadal:clearChoices', clearChoices);
    window.addEventListener('asadal:story', handleChapter);
    window.addEventListener('asadal:metaReward', handleMetaReward);
    window.addEventListener('asadal:tribeDecision', handleTribeDecision);
    window.addEventListener('asadal:finalDecision', handleFinalDecision);
    window.addEventListener('asadal:tribeReward', handleTribeReward);
    window.addEventListener('asadal:clearTribeReward', clearTribeReward);
    window.addEventListener('asadal:travel', handleTravel);
    window.addEventListener('asadal:tribeEvent', handleTribeEvent);

    return () => {
      window.removeEventListener('asadal:state', handleHud);
      window.removeEventListener('asadal:skillChoices', handleChoices);
      window.removeEventListener('asadal:clearChoices', clearChoices);
      window.removeEventListener('asadal:story', handleChapter);
      window.removeEventListener('asadal:metaReward', handleMetaReward);
      window.removeEventListener('asadal:tribeDecision', handleTribeDecision);
      window.removeEventListener('asadal:finalDecision', handleFinalDecision);
      window.removeEventListener('asadal:tribeReward', handleTribeReward);
      window.removeEventListener('asadal:clearTribeReward', clearTribeReward);
      window.removeEventListener('asadal:travel', handleTravel);
      window.removeEventListener('asadal:tribeEvent', handleTribeEvent);
    };
  }, []);

  useEffect(() => () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
    } catch (error) {
      console.warn('영구 진행 데이터를 저장하지 못했습니다.', error);
    }
  }, [meta]);

  const gamePhase = resolveGamePhase({
    atHome: showIntro,
    prologueStep,
    tutorial: showTutorial,
    chapter,
    gameOver: hud.gameOver,
    win: hud.win,
    hasChoices: choices.length > 0,
    hasDecision: Boolean(tribeDecision || finalDecision),
    hasReward: Boolean(tribeReward),
    travelling: Boolean(travel),
  });

  useEffect(() => {
    if (!gameReady) return;
    window.dispatchEvent(new CustomEvent('asadal:setPaused', {
      detail: { paused: isCombatPaused(gamePhase), phase: gamePhase },
    }));
  }, [gamePhase, gameReady]);

  useEffect(() => {
    if (!travel) return undefined;
    const timer = window.setTimeout(() => {
      setTravel(null);
      window.dispatchEvent(new CustomEvent('asadal:continueTravel'));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [travel]);

  const prepareGame = async (setup) => {
    runSetupRef.current = setup;
    if (gameRef.current && gameReady) {
      window.dispatchEvent(new CustomEvent('asadal:tribeSetup', { detail: setup }));
      return;
    }

    setGameLoading(true);
    setLoadError('');
    try {
      const { bootAsadalGame } = await import('./game/asadalGame');
      const handleReady = () => {
        setGameReady(true);
        setGameLoading(false);
        window.dispatchEvent(new CustomEvent('asadal:tribeSetup', { detail: runSetupRef.current }));
      };
      window.addEventListener('asadal:ready', handleReady, { once: true });
      gameRef.current = bootAsadalGame(containerRef.current, { preloadTribes: [...setup.route, '호랑이'] });
    } catch (error) {
      setGameLoading(false);
      setLoadError('전장 데이터를 불러오지 못했습니다. 다시 시도해 주세요.');
      console.error(error);
    }
  };

  const startRun = () => {
    const setup = createRunSetup();
    setAlliedTribe(setup.alliedTribe);
    setHostileTribe(setup.hostileTribe);
    setHud({ ...initialHud, route: setup.route });
    setMeta((current) => recordRunStart(current));
    setShowIntro(false);
    setPrologueStep(0);
    prepareGame(setup);
  };

  const advancePrologue = () => {
    if (prologueStep < prologueScenes.length - 1) {
      setPrologueStep((step) => step + 1);
      return;
    }
    setPrologueStep(-1);
    setShowTutorial(true);
  };

  const beginRun = () => {
    if (!gameReady) return;
    setShowTutorial(false);
    window.dispatchEvent(new CustomEvent('asadal:startRun', {
      detail: { trainingLevels: meta.trainingLevels, runsStarted: meta.runsStarted },
    }));
  };

  const returnHome = () => {
    window.dispatchEvent(new CustomEvent('asadal:endRun'));
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    setGameReady(false);
    setGameLoading(false);
    setHud(initialHud);
    setChoices([]);
    setChapter(null);
    setTribeDecision(null);
    setFinalDecision(null);
    setTribeReward(null);
    setTravel(null);
    setTribeNotice('');
    setPrologueStep(-1);
    setShowTutorial(false);
    setEndingStep(0);
    setMenuView('home');
    setShowIntro(true);
  };

  const continueChapter = () => {
    setChapter(null);
    window.dispatchEvent(new CustomEvent('asadal:continueStory'));
  };

  const selectSkill = (skillId) => {
    window.dispatchEvent(new CustomEvent('asadal:chooseSkill', { detail: { id: skillId, source: choiceSource } }));
  };

  const chooseTribeDecision = (choice) => {
    setTribeDecision(null);
    window.dispatchEvent(new CustomEvent('asadal:tribeDecisionChoice', { detail: { choice } }));
  };

  const chooseFinalDecision = (choice) => {
    setFinalDecision(null);
    window.dispatchEvent(new CustomEvent('asadal:finalDecisionChoice', { detail: { choice } }));
  };

  const chooseTribeReward = (choice) => {
    if (!tribeReward) return;
    window.dispatchEvent(new CustomEvent('asadal:chooseTribeReward', {
      detail: { choice, tribe: tribeReward.tribe },
    }));
  };

  const updateStickFromPointer = (clientX, clientY) => {
    if (!joystickRef.current) return;
    const bounds = joystickRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDistance = bounds.width * 0.32;
    const distance = Math.hypot(dx, dy) || 1;
    const clampedDistance = Math.min(distance, maxDistance);
    const ratio = clampedDistance / distance;
    const x = (dx * ratio) / maxDistance;
    const y = (dy * ratio) / maxDistance;

    const normalized = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };

    setStick(normalized);
    window.dispatchEvent(new CustomEvent('asadal:input', { detail: normalized }));
  };

  const resetStick = () => {
    setStick({ x: 0, y: 0 });
    window.dispatchEvent(new CustomEvent('asadal:input', { detail: { x: 0, y: 0 } }));
  };

  return (
    <div className="app-shell">
      <div className="game-panel">
        <div ref={containerRef} className="game-root" />

        {gamePhase === GAME_PHASE.PLAYING && (
          <header className="hud-bar" aria-label="게임 상태">
            <div className="hud-pill health-pill">
              <span className="label">체력</span>
              <strong>
                {Math.ceil(hud.health)} / {Math.ceil(hud.maxHealth)}
              </strong>
            </div>
            <div className="hud-pill">
              <span className="label">레벨</span>
              <strong>{hud.level}</strong>
            </div>
            <div className="hud-pill">
              <span className="label">스테이지</span>
              <strong>{hud.stage}</strong>
            </div>
            <div className="hud-pill">
              <span className="label">악명</span>
              <strong>{hud.reputation}</strong>
            </div>
            <div className="hud-pill tribe-pill">
              <span className="label">현재 부족</span>
              <strong>{hud.currentTribe}</strong>
            </div>
          </header>
        )}

        {gamePhase === GAME_PHASE.PLAYING && (
          <div
            ref={joystickRef}
            className="virtual-joystick"
            role="application"
            aria-label="이동 조이스틱"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              updateStickFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                updateStickFromPointer(event.clientX, event.clientY);
              }
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              resetStick();
            }}
            onPointerLeave={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) resetStick();
            }}
            onPointerCancel={resetStick}
          >
            <div className="joystick-base" />
            <div
              className="joystick-knob"
              style={{
                transform: `translate(${stick.x * 28}px, ${stick.y * 28}px)`,
              }}
            />
          </div>
        )}

        {showIntro && menuView === 'home' && (
          <div className="overlay intro-overlay">
            <div className="panel-card intro-card">
              <div className="intro-copy">
                <p className="eyebrow">고조선 이전 · 부족들의 전쟁</p>
                <h1>아사달</h1>
                <p className="intro-tagline">사라진 하늘의 이름을 되찾아라.</p>
                <p>
                  곰을 섬기는 마지막 전사 <strong>웅</strong>. 청동 단검과 방패를 들고
                  열한 토템 부족의 전장을 돌파하세요.
                </p>
                <div className="weapon-line" aria-label="주요 장비">
                  <span>청동 단검</span>
                  <span>생가죽 방패</span>
                  <span>곰 발톱 부적</span>
                </div>
                <div className="meta-summary" aria-label="영구 진행 현황">
                  <span><strong>{meta.trainingPoints}</strong> 수련점</span>
                  <span><strong>{meta.unlockedEndings.length}/{ENDINGS.length}</strong> 엔딩</span>
                  <span><strong>{meta.runsStarted}</strong> 출정</span>
                </div>
                <div className="menu-actions">
                  <button type="button" className="primary-action" onClick={startRun}>새 출정</button>
                  <button type="button" onClick={() => setMenuView('training')}>곰의 수련</button>
                  <button type="button" onClick={() => setMenuView('gallery')}>기억의 전당</button>
                </div>
                {loadError && <p className="load-error" role="alert">{loadError}</p>}
              </div>
              <div className="intro-art" aria-hidden="true">
                <span className="totem-mark">熊</span>
                <img src="/assets/ung-bear-warrior.png" alt="" />
              </div>
            </div>
          </div>
        )}

        {showIntro && menuView === 'training' && (
          <div className="overlay menu-overlay">
            <div className="panel-card meta-panel">
              <div className="menu-heading">
                <div>
                  <p className="eyebrow">곰 부족 마을 · 영구 성장</p>
                  <h2>곰의 수련</h2>
                </div>
                <span className="point-badge">수련점 {meta.trainingPoints}</span>
              </div>
              <p className="menu-description">투자한 수련은 모든 출정에 적용됩니다. 다음 레벨 비용은 1점부터 5점까지 증가합니다.</p>
              <div className="training-list">
                {TRAINING_ITEMS.map((training) => {
                  const level = meta.trainingLevels[training.id];
                  const cost = trainingCost(level);
                  const canInvest = level < training.maxLevel && meta.trainingPoints >= cost;
                  return (
                    <div className="training-row" key={training.id}>
                      <div className="training-copy">
                        <div className="training-title">
                          <strong>{training.name}</strong>
                          <span>Lv.{level}/{training.maxLevel}</span>
                        </div>
                        <p>{training.description}</p>
                        <div className="level-track" aria-label={`${training.name} ${level}레벨`}>
                          {Array.from({ length: training.maxLevel }, (_, index) => (
                            <span key={index} className={index < level ? 'filled' : ''} />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canInvest}
                        onClick={() => setMeta((current) => investTraining(current, training.id))}
                      >
                        {level >= training.maxLevel ? '완료' : `${cost}점 투자`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="menu-footer-actions">
                <button type="button" onClick={() => setMenuView('home')}>돌아가기</button>
                <button type="button" onClick={() => setMeta((current) => refundTraining(current))}>전체 회수</button>
              </div>
            </div>
          </div>
        )}

        {showIntro && menuView === 'gallery' && (
          <div className="overlay menu-overlay">
            <div className="panel-card meta-panel gallery-panel">
              <div className="menu-heading">
                <div>
                  <p className="eyebrow">발견한 이야기</p>
                  <h2>기억의 전당</h2>
                </div>
                <span className="point-badge">{meta.unlockedEndings.length}/{ENDINGS.length}</span>
              </div>
              <div className="ending-grid">
                {ENDINGS.map((ending) => {
                  const unlocked = meta.unlockedEndings.includes(ending.id);
                  const scene = getEndingScenes(ending.id)[1];
                  return (
                    <button
                      type="button"
                      className={`ending-memory ${unlocked ? 'unlocked' : 'locked'}`}
                      key={ending.id}
                      style={{ '--ending-image': `url(${endingIllustrations[ending.id]})` }}
                      onClick={() => {
                        if (!unlocked) return;
                        setGalleryEnding(ending.id);
                        setGalleryEndingStep(0);
                      }}
                      aria-label={unlocked ? `${ending.name} 엔딩 다시 보기` : `${ending.name} 엔딩 미발견`}
                    >
                      <span className="ending-memory-copy">
                        <span className="ending-code">{unlocked ? ending.code : '미발견'}</span>
                        <strong>{unlocked ? ending.name : '잠긴 기억'}</strong>
                        <span>{unlocked ? scene.body : ending.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => setMenuView('home')}>마을로 돌아가기</button>
            </div>
          </div>
        )}

        {showIntro && galleryEnding && (() => {
          const scenes = getEndingScenes(galleryEnding);
          const scene = scenes[Math.min(galleryEndingStep, scenes.length - 1)];
          return (
            <div className="overlay story-overlay gallery-story-overlay">
              <div
                className="story-card ending-card"
                style={{ '--story-image': `url(${endingIllustrations[galleryEnding]})` }}
              >
                <div className="story-copy">
                  <p className="eyebrow">기억의 전당 · {scene.eyebrow}</p>
                  <h2>{scene.title}</h2>
                  <p>{scene.body}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (galleryEndingStep < scenes.length - 1) setGalleryEndingStep((step) => step + 1);
                      else setGalleryEnding(null);
                    }}
                  >
                    {galleryEndingStep < scenes.length - 1 ? '마지막 장면' : '기억의 전당으로'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {prologueStep >= 0 && (
          <div className="overlay story-overlay">
            <div className="story-card" style={{ '--story-image': 'url(/assets/story-prologue.png)' }}>
              <div className="story-copy">
                <p className="eyebrow">{prologueScenes[prologueStep].eyebrow}</p>
                <h2>{prologueScenes[prologueStep].title}</h2>
                <p>{prologueScenes[prologueStep].body}</p>
                <div className="story-progress" aria-label={`${prologueStep + 1} / ${prologueScenes.length}`}>
                  {prologueScenes.map((scene, index) => (
                    <span key={scene.title} className={index === prologueStep ? 'active' : ''} />
                  ))}
                </div>
                <button type="button" onClick={advancePrologue}>
                  {prologueStep === prologueScenes.length - 1 ? '원정 준비' : '다음 장면'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTutorial && (
          <div className="overlay intro-overlay">
            <div className="panel-card tutorial-card">
              <p className="eyebrow">첫 판 안내</p>
              <h2>이번 판의 외교 상태</h2>
              <p>
                이번 판의 <strong>{alliedTribe}</strong> 부족은 당신의 편이고,
                <strong> {hostileTribe}</strong> 부족은 적대적인 세력입니다.
              </p>
              {hud.route.length > 0 && (
                <div className="route-line" aria-label="이번 원정 경로">
                  {hud.route.map((tribe, index) => (
                    <span key={`${tribe}-${index}`}>{index + 1}. {tribe}</span>
                  ))}
                  <span>마지막. 호랑이</span>
                </div>
              )}
              <ul className="tutorial-list">
                <li>조이스틱으로 이동하고, 공격 범위 안에서 적을 처치하세요.</li>
                <li>레벨업 시 선택지는 부족의 가르침이 나오며, 현재 판에만 적용됩니다.</li>
                <li>전투 중 부족이 흔들리면 끝까지 싸우거나 설득해 악명을 낮출 수 있습니다.</li>
                <li>부족을 넘을 때 고유 능력 또는 함께 싸울 부하를 선택합니다.</li>
                <li>수련은 영구적으로 투자되어 다음 판에도 이어집니다.</li>
                <li>3스테이지마다 보스가 나타나고, 마지막에는 호랑이 부족과 맞서게 됩니다.</li>
              </ul>
              <button type="button" onClick={beginRun} disabled={!gameReady}>
                {gameReady ? '전투 시작' : gameLoading ? '전장 준비 중…' : '전장 준비 실패'}
              </button>
            </div>
          </div>
        )}

        {travel && (
          <div className="overlay travel-overlay">
            <div className="travel-scene">
              <p className="eyebrow">부족 사이의 길</p>
              <h2>{travel.from}의 땅에서 {travel.to}의 땅으로</h2>
              <div className="travel-path" aria-label={`${travel.from}에서 ${travel.to}로 이동 중`}>
                <span className="travel-node">{travel.from}</span>
                <span className="travel-line" />
                <img src="/assets/ung-run-2.png" alt="달리는 웅" />
                <span className="travel-node destination">{travel.to}</span>
              </div>
              <p>웅과 동료들은 다음 토템의 연기를 향해 쉬지 않고 달렸다.</p>
            </div>
          </div>
        )}

        {tribeDecision && (
          <div className="choice-overlay">
            <div className="choice-panel decision-panel">
              <p className="eyebrow">전황 변화 · {tribeDecision.tribe} 부족</p>
              <h2>{tribeDecision.title || '남은 전사들이 무기를 내리려 한다'}</h2>
              <p>{tribeDecision.body} 이미 {tribeDecision.defeated}명을 쓰러뜨렸다. 남은 {tribeDecision.remaining}명과 계속 싸울 수도, 호랑이의 거짓말을 설명하고 길을 열 수도 있다.</p>
              <div className="decision-grid">
                <button type="button" onClick={() => chooseTribeDecision('spare')}>
                  <strong>무기를 거두고 설득한다</strong>
                  <span>즉시 스테이지 완료 · 악명 감소 · 부족 신뢰 증가</span>
                </button>
                <button type="button" className="danger-choice" onClick={() => chooseTribeDecision('fight')}>
                  <strong>끝까지 제압한다</strong>
                  <span>전투 지속 · 경험치 확보 · 악명 증가</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {finalDecision && (
          <div className="choice-overlay">
            <div className="choice-panel decision-panel final-decision-panel">
              <p className="eyebrow">최후의 선택 · 굴복한 호왕</p>
              <h2>호왕의 목숨과 전쟁의 결말을 정하세요</h2>
              <p>쓰러진 호왕은 열두 부족을 함께 다스릴 혼인 동맹을 제안한다. 웅은 복수를 끝낼 수도, 두 세력을 하나의 강대한 나라로 묶을 수도 있다.</p>
              <div className="decision-grid">
                <button type="button" className="danger-choice" onClick={() => chooseFinalDecision('finish')}>
                  <strong>호왕을 베고 전쟁을 끝낸다</strong>
                  <span>지금까지의 자비·악명·동료에 따라 기존 엔딩으로 진행</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseFinalDecision('alliance')}
                  disabled={!finalDecision.allianceEligible}
                >
                  <strong>혼인 동맹을 받아들인다</strong>
                  <span>
                    {finalDecision.allianceEligible
                      ? '호랑이와 곰의 군세를 합쳐 진국 엔딩으로 진행'
                      : '악명 45~69 · 부하 2명 이상 · 살려준 부족 2곳 이하 필요'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {tribeReward && (
          <div className="choice-overlay">
            <div className="choice-panel reward-panel">
              <p className="eyebrow">{tribeReward.tribe} 부족의 약속</p>
              <h2>다음 여정에 가져갈 힘을 고르세요</h2>
              <div className="choice-grid reward-grid">
                {[tribeReward.power, tribeReward.follower].map((reward) => (
                  <button key={reward.id} type="button" className="skill-card" onClick={() => chooseTribeReward(reward.id)}>
                    <span className="skill-header">
                      <span className="skill-name">{reward.name}</span>
                      <span className="skill-tag">{reward.id === 'follower' ? '부하' : '고유 능력'}</span>
                    </span>
                    <span className="skill-desc">{reward.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tribeNotice && <div className="tribe-notice" role="status">{tribeNotice}</div>}

        {chapter && !hud.win && (
          <div className="overlay story-overlay">
            <div className="story-card chapter-card" style={{ '--story-image': 'url(/assets/story-prologue.png)' }}>
              <div className="story-copy">
                <p className="eyebrow">최종장 · 소문의 끝</p>
                <h2>“이제야 모두가 진실을 보았다.”</h2>
                <p>
                  다섯 부족을 지나며 호랑이의 거짓말은 무너졌다. 남은 길은 하나,
                  모든 소문의 근원인 <strong>호왕</strong>의 본거지다.
                </p>
                <p className="rumor-summary">현재 악명 {hud.reputation} · 불필요한 처치를 줄이면 부족들은 웅의 말을 믿는다.</p>
                <button type="button" onClick={continueChapter}>호왕에게 간다</button>
              </div>
            </div>
          </div>
        )}

        {hud.gameOver && !showIntro && !hud.win && (
          <div className="overlay game-over-overlay">
            <div className="panel-card danger">
              <p className="eyebrow">전투 종료</p>
              <h2>웅은 쓰러졌다</h2>
              <p>부족의 힘을 다시 모아, 다음 판에서 아사달의 신화를 다시 쓸 수 있습니다.</p>
              <button type="button" onClick={returnHome}>
                곰 부족 마을로
              </button>
            </div>
          </div>
        )}

        {hud.win && !showIntro && (() => {
          const endingScenes = getEndingScenes(hud.ending);
          const scene = endingScenes[Math.min(endingStep, endingScenes.length - 1)];
          return (
            <div className="overlay story-overlay ending-overlay">
              <div
                className="story-card ending-card"
                style={{ '--story-image': `url(${endingIllustrations[hud.ending] || '/assets/story-ending.png'})` }}
              >
                <div className="story-copy">
                  <p className="eyebrow">{scene.eyebrow}</p>
                  <h2>{scene.title}</h2>
                  <p>{scene.body}</p>
                  <p className="rumor-summary">최종 악명 {hud.reputation} · {ENDINGS.find(({ id }) => id === hud.ending)?.name || '기록되지 않은 결말'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (endingStep < endingScenes.length - 1) setEndingStep((step) => step + 1);
                      else returnHome();
                    }}
                  >
                    {endingStep < endingScenes.length - 1 ? '마지막 장면' : '기억을 간직하고 귀환'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {choices.length > 0 && (
          <div className="choice-overlay">
            <div className="choice-panel">
              <div className="choice-header">
                <div>
                  <p className="eyebrow">{choiceSource === 'training' ? '영구 수련' : '부족 가르침'}</p>
                  <h2>{choiceMeta.label}</h2>
                </div>
                {choiceSource === 'training' && (
                  <div className="choice-badges">
                    <span className="badge">남은 수련점 {choiceMeta.remaining ?? 0}</span>
                  </div>
                )}
              </div>

              {choiceSource === 'training' && (
                <div className="choice-meta">
                  <span className="meta-label">현재 투자</span>
                  <span className="meta-value">
                    {choiceMeta.selected.length > 0
                      ? choiceMeta.selected.map((item) => `${item.name} Lv.${item.level}`).join(' · ')
                      : '아직 선택한 수련이 없습니다'}
                  </span>
                </div>
              )}

              {choiceSource !== 'training' && (
                <div className="choice-meta">
                  <span className="meta-label">현재 부족</span>
                  <span className="meta-value">{hud.currentTribe}</span>
                </div>
              )}

              <div className="choice-grid">
                {choices.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="skill-card"
                    onClick={() => selectSkill(skill.id)}
                  >
                    <span className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-tag">{choiceSource === 'training' ? '영구' : '부족'}</span>
                    </span>
                    <span className="skill-desc">{skill.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
