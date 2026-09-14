import { useEffect, useRef, useState } from 'react';
import { bootAsadalGame } from './game/asadalGame';

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

const getEndingScenes = (ending) => ending === 'conqueror'
  ? [
      {
        eyebrow: '결말 · 무너진 호왕',
        title: '거짓말은 끝났지만 두려움은 남았다',
        body: '호왕의 창이 부러지고 거짓 소문도 드러났다. 그러나 필요 이상으로 쌓인 희생은 다른 부족들의 눈에 또 하나의 공포가 되었다.',
      },
      {
        eyebrow: '엔딩 B · 정복자',
        title: '호랑이를 몰아낸 자가 그 자리를 차지했다',
        body: '웅은 승리했지만 부족들은 무기를 내려놓지 않았다. 아사달은 연맹이 아니라, 가장 강한 전사를 두려워하는 땅으로 기억되었다.',
      },
    ]
  : [
      {
        eyebrow: '결말 · 무너진 호왕',
        title: '다섯 부족이 진실을 보았다',
        body: '호왕의 창이 부러지자 거짓 소문도 힘을 잃었다. 절제된 싸움을 지켜본 부족들은 마침내 무기를 내려놓고 같은 불가에 모였다.',
      },
      {
        eyebrow: '엔딩 A · 아사달',
        title: '서로 다른 토템 아래, 하나의 터전이 시작되었다',
        body: '웅은 왕이 되지 않았다. 대신 부족들이 함께 지킬 질서를 세웠다. 훗날 사람들은 그 첫 마을과 약속을 아사달이라 불렀다.',
      },
    ];

function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const joystickRef = useRef(null);
  const [hud, setHud] = useState(initialHud);
  const [choices, setChoices] = useState([]);
  const [choiceSource, setChoiceSource] = useState('map');
  const [choiceMeta, setChoiceMeta] = useState({ label: '가르침', remaining: null, selected: [] });
  const [showIntro, setShowIntro] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [prologueStep, setPrologueStep] = useState(-1);
  const [chapter, setChapter] = useState(null);
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

    const handleStart = () => {
      setShowIntro(false);
      setChoices([]);
    };

    const handleChapter = (event) => {
      setChapter(event.detail || null);
      setChoices([]);
    };

    window.addEventListener('asadal:state', handleHud);
    window.addEventListener('asadal:skillChoices', handleChoices);
    window.addEventListener('asadal:clearChoices', clearChoices);
    window.addEventListener('asadal:start', handleStart);
    window.addEventListener('asadal:story', handleChapter);

    return () => {
      window.removeEventListener('asadal:state', handleHud);
      window.removeEventListener('asadal:skillChoices', handleChoices);
      window.removeEventListener('asadal:clearChoices', clearChoices);
      window.removeEventListener('asadal:start', handleStart);
      window.removeEventListener('asadal:story', handleChapter);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) {
      return;
    }

    gameRef.current = bootAsadalGame(containerRef.current);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const startRun = () => {
    const pair = pickTribePair();
    setAlliedTribe(pair.alliedTribe);
    setHostileTribe(pair.hostileTribe);
    setShowIntro(false);
    setPrologueStep(0);
    window.dispatchEvent(new CustomEvent('asadal:tribeSetup', {
      detail: {
        alliedTribe: pair.alliedTribe,
        hostileTribe: pair.hostileTribe,
      },
    }));
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
    setShowTutorial(false);
    window.dispatchEvent(new CustomEvent('asadal:startRun'));
  };

  const continueChapter = () => {
    setChapter(null);
    window.dispatchEvent(new CustomEvent('asadal:continueStory'));
  };

  const selectSkill = (skillId) => {
    window.dispatchEvent(new CustomEvent('asadal:chooseSkill', { detail: { id: skillId, source: choiceSource } }));
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

        {!showIntro && !showTutorial && prologueStep < 0 && !chapter && (
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

        {!showIntro && !showTutorial && prologueStep < 0 && !chapter && !hud.gameOver && !hud.win && choices.length === 0 && (
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

        {showIntro && (
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
                <button type="button" onClick={startRun}>
                  이야기 시작
                </button>
              </div>
              <div className="intro-art" aria-hidden="true">
                <span className="totem-mark">熊</span>
                <img src="/assets/ung-bear-warrior.png" alt="" />
              </div>
            </div>
          </div>
        )}

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
                <li>수련은 영구적으로 투자되어 다음 판에도 이어집니다.</li>
                <li>3스테이지마다 보스가 나타나고, 마지막에는 호랑이 부족과 맞서게 됩니다.</li>
              </ul>
              <button type="button" onClick={beginRun}>
                전투 시작
              </button>
            </div>
          </div>
        )}

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
              <button type="button" onClick={() => window.location.reload()}>
                다시 시작
              </button>
            </div>
          </div>
        )}

        {hud.win && !showIntro && (() => {
          const endingScenes = getEndingScenes(hud.ending);
          const scene = endingScenes[Math.min(endingStep, endingScenes.length - 1)];
          return (
            <div className="overlay story-overlay ending-overlay">
              <div className="story-card ending-card" style={{ '--story-image': 'url(/assets/story-ending.png)' }}>
                <div className="story-copy">
                  <p className="eyebrow">{scene.eyebrow}</p>
                  <h2>{scene.title}</h2>
                  <p>{scene.body}</p>
                  <p className="rumor-summary">최종 악명 {hud.reputation} · {hud.ending === 'conqueror' ? '공포가 진실보다 오래 남았다' : '절제가 거짓 소문을 이겼다'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (endingStep < endingScenes.length - 1) setEndingStep((step) => step + 1);
                      else window.location.reload();
                    }}
                  >
                    {endingStep < endingScenes.length - 1 ? '마지막 장면' : '새 이야기 시작'}
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
