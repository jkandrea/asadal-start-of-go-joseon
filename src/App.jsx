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
};

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

    window.addEventListener('asadal:state', handleHud);
    window.addEventListener('asadal:skillChoices', handleChoices);
    window.addEventListener('asadal:clearChoices', clearChoices);
    window.addEventListener('asadal:start', handleStart);

    return () => {
      window.removeEventListener('asadal:state', handleHud);
      window.removeEventListener('asadal:skillChoices', handleChoices);
      window.removeEventListener('asadal:clearChoices', clearChoices);
      window.removeEventListener('asadal:start', handleStart);
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
    setShowTutorial(true);
    window.dispatchEvent(new CustomEvent('asadal:tribeSetup', {
      detail: {
        alliedTribe: pair.alliedTribe,
        hostileTribe: pair.hostileTribe,
      },
    }));
  };

  const beginRun = () => {
    setShowTutorial(false);
    window.dispatchEvent(new CustomEvent('asadal:startRun'));
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

        {!showIntro && !showTutorial && (
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

        {!showIntro && !showTutorial && !hud.gameOver && !hud.win && choices.length === 0 && (
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
            <div className="panel-card">
              <p className="eyebrow">로그라이크 서바이버 액션</p>
              <h1>아사달</h1>
              <p>
                곰 부족의 여전사 웅이 5대 부족을 돌파하고, 마지막으로 호랑이 부족을 쓰러뜨리는
                첫 판 전투를 시작합니다.
              </p>
              <button type="button" onClick={startRun}>
                첫 판 시작
              </button>
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

        {hud.win && !showIntro && (
          <div className="overlay game-over-overlay">
            <div className="panel-card success">
              <p className="eyebrow">사건의 결말</p>
              <h2>호랑이 부족을 쓰러뜨렸다</h2>
              <p>웅은 곰 부족의 마지막 전사로서, 아사달의 신화를 시작하는 첫 장을 열었습니다.</p>
              <button type="button" onClick={() => window.location.reload()}>
                다시 시작
              </button>
            </div>
          </div>
        )}

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
