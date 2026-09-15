const endpoint = process.argv[2] || 'http://127.0.0.1:9223/json';
const pages = await fetch(endpoint).then((response) => response.json());
const page = pages.find((item) => item.type === 'page' && item.url.includes('127.0.0.1:3000')) || pages[0];
if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable browser page found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let messageId = 0;
const pending = new Map();
const runtimeErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || 'Runtime exception');
    return;
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async (expression) => {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await command('Runtime.enable');

const waitFor = async (expression, timeout = 30000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  const snapshot = await evaluate(`({
    url: location.href,
    title: document.title,
    body: document.body?.innerText?.slice(0, 500) || '',
    html: document.body?.innerHTML?.slice(0, 500) || '',
  })`);
  throw new Error(`Timed out waiting for: ${expression}\n${JSON.stringify({ ...snapshot, runtimeErrors }, null, 2)}`);
};

const clickButton = async (label) => {
  const clicked = await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.includes(${JSON.stringify(label)})); if (!button) return false; button.click(); return true; })()`);
  if (!clicked) throw new Error(`Button not found: ${label}`);
};

await evaluate("localStorage.removeItem('asadal.meta.v1'); location.reload(); true");
await waitFor("document.body.innerText.includes('새 출정')");
await clickButton('곰의 수련');
await waitFor("document.body.innerText.includes('전체 회수')");
await clickButton('1점 투자');
const savedLevel = await evaluate(`JSON.parse(localStorage.getItem('asadal.meta.v1')).trainingLevels.claw`);
if (savedLevel !== 1) throw new Error('Training investment was not persisted');
await clickButton('돌아가기');
await clickButton('기억의 전당');
await waitFor("document.querySelectorAll('.ending-memory').length === 8");
const uniqueEndingArt = await evaluate("new Set([...document.querySelectorAll('.ending-memory')].map((card) => card.style.getPropertyValue('--ending-image'))).size");
if (uniqueEndingArt !== 8) throw new Error(`Expected 8 distinct ending illustrations, found ${uniqueEndingArt}`);
await clickButton('마을로 돌아가기');
await evaluate(`(() => {
  const meta = JSON.parse(localStorage.getItem('asadal.meta.v1'));
  meta.unlockedEndings = ['asadal'];
  localStorage.setItem('asadal.meta.v1', JSON.stringify(meta));
  location.reload();
  return true;
})()`);
await waitFor("document.body.innerText.includes('새 출정')");
await clickButton('기억의 전당');
await waitFor("document.querySelectorAll('.ending-memory.unlocked').length === 1");
await clickButton('아사달');
await waitFor("document.body.innerText.includes('환웅과 웅 사이에서 한 아이가 태어났다')");
await clickButton('마지막 장면');
await waitFor("document.body.innerText.includes('곰과 호랑이, 그리고 하늘에서 내려온 신')");
await clickButton('기억의 전당으로');
await clickButton('마을로 돌아가기');
await clickButton('새 출정');
await waitFor("document.body.innerText.includes('프롤로그')");
await new Promise((resolve) => setTimeout(resolve, 2500));
const prematureDefeat = await evaluate("document.body.innerText.includes('웅은 쓰러졌다')");
if (prematureDefeat) throw new Error('Combat advanced behind the prologue');
await clickButton('다음 장면');
await clickButton('다음 장면');
await clickButton('원정 준비');
await waitFor("[...document.querySelectorAll('button')].some((button) => button.textContent.includes('전투 시작') && !button.disabled)", 60000);
await clickButton('전투 시작');
await waitFor("document.querySelector('.hud-bar') !== null");

const result = await evaluate(`({
  health: document.querySelector('.health-pill strong')?.textContent.trim(),
  stage: [...document.querySelectorAll('.hud-pill')][2]?.querySelector('strong')?.textContent.trim(),
  choices: document.querySelectorAll('.choice-overlay').length,
  errors: document.querySelectorAll('[role="alert"]').length,
})`);
if (!result.health || result.stage !== '1' || result.errors > 0) throw new Error(`Unexpected game state: ${JSON.stringify(result)}`);
if (Number.parseFloat(result.health) < 100) throw new Error(`Player max health regressed below its base value: ${result.health}`);

await evaluate("window.dispatchEvent(new CustomEvent('asadal:tribeDecision', { detail: { tribe: '양', defeated: 4, remaining: 3, reputation: 4 } })); true");
await waitFor("document.body.innerText.includes('남은 전사들이 무기를 내리려 한다')");
await clickButton('끝까지 제압한다');
await waitFor("document.querySelector('.decision-panel') === null");

await evaluate("window.dispatchEvent(new CustomEvent('asadal:tribeReward', { detail: { tribe: '돼지', power: { id: 'power', name: '풍요의 몫', description: '고유 능력' }, follower: { id: 'follower', name: '복주머니 짐꾼', description: '부하' } } })); true");
await waitFor("document.body.innerText.includes('다음 여정에 가져갈 힘')");
const rewardLayout = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.reward-grid .skill-card')];
  const first = cards[0]?.getBoundingClientRect();
  const second = cards[1]?.getBoundingClientRect();
  return { count: cards.length, firstBottom: first?.bottom, secondTop: second?.top };
})()`);
if (rewardLayout.count !== 2 || rewardLayout.secondTop < rewardLayout.firstBottom) {
  throw new Error(`Reward choices are not stacked vertically: ${JSON.stringify(rewardLayout)}`);
}
await clickButton('풍요의 몫');
await waitFor("document.querySelector('.reward-panel') === null");

await evaluate("window.dispatchEvent(new CustomEvent('asadal:travel', { detail: { from: '양', to: '돼지', stage: 2 } })); true");
await waitFor("document.querySelector('.travel-scene') !== null");
await waitFor("document.querySelector('.travel-scene') === null", 5000);

await evaluate("window.dispatchEvent(new CustomEvent('asadal:finalDecision', { detail: { allianceEligible: false } })); true");
await waitFor("document.body.innerText.includes('호왕의 목숨과 전쟁의 결말')");
const allianceDisabled = await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.includes('혼인 동맹'))?.disabled");
if (!allianceDisabled) throw new Error('The alliance choice should be disabled without its route conditions');
await clickButton('호왕을 베고 전쟁을 끝낸다');
await evaluate("window.dispatchEvent(new CustomEvent('asadal:finalDecision', { detail: { allianceEligible: true } })); true");
await waitFor("[...document.querySelectorAll('button')].some((button) => button.textContent.includes('혼인 동맹') && !button.disabled)");
await clickButton('혼인 동맹을 받아들인다');
await waitFor("document.querySelector('.final-decision-panel') === null");

if (runtimeErrors.length > 0) throw new Error(`Browser runtime errors: ${JSON.stringify(runtimeErrors)}`);

console.log(JSON.stringify({ ok: true, ...result }));
socket.close();
