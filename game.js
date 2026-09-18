const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status-display');

// ★ チュートリアル関連のストレージをすべてリセット（tutorial_basic_completed を追加）
localStorage.removeItem('baseball_tutorial_completed');
localStorage.removeItem('tutorial_basic_completed'); // ← これを追加
localStorage.removeItem('tutorial_step4_done');
localStorage.removeItem('tutorial_step5_done');
localStorage.removeItem('tutorial_step6_done');

let isPlaying = false;
let freezeTimer = null;
let currentTutorialStep = 0;

// 相手高校が「指南高校」かどうかを判定する関数
function checkIsTutorialMode() {
  const oppName = (typeof getOpponentSchoolName === 'function') 
    ? getOpponentSchoolName() 
    : (opponentData ? (opponentData.name || opponentData.schoolName || '') : '');
  return oppName.includes('指南');
}

// ◯ 修正後：変数定義のみ行い、値の確定は後から行う
let isTutorialMode = false;
let currentLevelIndex = 0;
let opponentData = { pitching: 50, defense: 50, batters: [] };

// ページの読み込み完了後に初期化を実行する関数
function initGameData() {
  currentLevelIndex = parseInt(localStorage.getItem('baseball_save_level')) || 0;
  
  if (typeof opponentList !== 'undefined' && opponentList.length > 0) {
    opponentData = opponentList[currentLevelIndex] || opponentList[0];
  }
  
  isTutorialMode = checkIsTutorialMode();
}

// DOM読み込み完了時に実行
window.addEventListener('DOMContentLoaded', () => {
  initGameData();
});

// --- ポーズ機能・設定画面の追加 ---

let isPaused = false; // ポーズ状態を管理

function createPauseMenu() {
  // 既に存在する場合は作成しない
  if (document.getElementById('pause-overlay')) return;

  const container = document.getElementById('game-container') || document.body;

  // 1. ポーズボタン（画面左上に配置・初期は非表示）
  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'pause-btn';
  pauseBtn.innerText = '⏸ 一時停止';
  pauseBtn.style.cssText = `
    position: absolute; top: 5px; left: 10px; z-index: 100;
    padding: 8px 12px; font-size: 14px; font-weight: bold;
    color: white; background-color: rgba(0, 0, 0, 0.6);
    border: 2px solid white; border-radius: 8px; cursor: pointer;
    display: none; /* ホーム画面では非表示 */
  `;
  pauseBtn.onclick = togglePause;
  container.appendChild(pauseBtn);

  // 2. ポーズ画面（オーバーレイ） - 背景を完全に不透明（rgba(15, 23, 42, 1.0)）に変更
  const overlay = document.createElement('div');
  overlay.id = 'pause-overlay';
  overlay.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(15, 23, 42, 1.0); /* 後ろが透けないように不透明化 */
    z-index: 400;
    display: none; flex-direction: column; align-items: center; justify-content: center;
    color: white; padding: 20px; box-sizing: border-box;
  `;

  // トグル用の状態を取得
  const isRotated = localStorage.getItem('setting_rotate_runner_ui') === 'true';
  const showArrow = localStorage.getItem('setting_show_throw_arrow') !== 'false';

  // 3. トグルUIを含むポーズ画面内のHTML構成
  overlay.innerHTML = `
    <style>
      .pause-toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
      .pause-toggle-switch input { opacity: 0; width: 0; height: 0; }
      .pause-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4b5563; transition: .3s; border-radius: 24px; }
      .pause-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
      .pause-toggle-switch input:checked + .pause-slider { background-color: #3b82f6; }
      .pause-toggle-switch input:checked + .pause-slider:before { transform: translateX(20px); }
      .pause-setting-item { display: flex; justify-content: center; align-items: center; gap: 15px; margin: 15px 0 25px; font-size: 15px; font-weight: bold; }
      .pause-setting-label { width: 80px; text-align: center; transition: color 0.3s; }
    </style>

    <h2 style="margin: 0 0 15px 0; color: #fbbf24;">⏸ 一時停止中</h2>
    
    <!-- スコア表示エリア -->
    <div id="pause-score-area" style="width: 100%; max-width: 400px; margin-bottom: 20px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;"></div>
    
    <!-- 設定エリア (トグルUI) -->
    <div style="margin-bottom: 25px; text-align: center; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; width: 100%; max-width: 400px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px solid #fff; padding-bottom: 5px;">⚙️ 設定</h3>
      
      <div style="color: #9ca3af; font-size: 12px; margin-top: 10px;">送球矢印の表示</div>
      <div class="pause-setting-item">
        <span class="pause-setting-label" id="pause-label-arrow-off" style="color: ${showArrow ? '#6b7280' : '#ffffff'};">塁上のみ</span>
        <label class="pause-toggle-switch">
          <input type="checkbox" id="setting-arrow" ${showArrow ? 'checked' : ''}>
          <span class="pause-slider"></span>
        </label>
        <span class="pause-setting-label" id="pause-label-arrow-on" style="color: ${showArrow ? '#ffffff' : '#6b7280'};">常に表示</span>
      </div>

      <div style="color: #9ca3af; font-size: 12px;">塁状況の表示</div>
      <div class="pause-setting-item">
        <span class="pause-setting-label" id="pause-label-base-down" style="color: ${isRotated ? '#6b7280' : '#ffffff'};">本塁が下</span>
        <label class="pause-toggle-switch">
          <input type="checkbox" id="setting-ui-rotate" ${isRotated ? 'checked' : ''}>
          <span class="pause-slider"></span>
        </label>
        <span class="pause-setting-label" id="pause-label-base-up" style="color: ${isRotated ? '#ffffff' : '#6b7280'};">本塁が上</span>
      </div>
    </div>
    
    <button id="resume-btn" style="
      padding: 12px 30px; font-size: 16px; font-weight: bold;
      color: white; background-color: #4CAF50; border: none;
      border-radius: 25px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.4);
    ">▶ ゲーム再開</button>
  `;

  container.appendChild(overlay);

  // イベントリスナーの設定
  document.getElementById('resume-btn').onclick = togglePause;

  // 設定変更を保存＆ラベル色をリアルタイム更新
  document.getElementById('setting-arrow').addEventListener('change', (e) => {
    localStorage.setItem('setting_show_throw_arrow', e.target.checked);
    document.getElementById('pause-label-arrow-on').style.color = e.target.checked ? '#ffffff' : '#6b7280';
    document.getElementById('pause-label-arrow-off').style.color = e.target.checked ? '#6b7280' : '#ffffff';
  });
  document.getElementById('setting-ui-rotate').addEventListener('change', (e) => {
    localStorage.setItem('setting_rotate_runner_ui', e.target.checked);
    document.getElementById('pause-label-base-up').style.color = e.target.checked ? '#ffffff' : '#6b7280';
    document.getElementById('pause-label-base-down').style.color = e.target.checked ? '#6b7280' : '#ffffff';
  });
}

function togglePause() {
  const overlay = document.getElementById('pause-overlay');
  if (!overlay) return;

  if (!isPaused) {
    // ポーズをオンにする
    if (!isPlaying) return; // すでに別の理由で停止中（攻撃中など）ならポーズしない
    isPaused = true;
    isPlaying = false; 
    
    // 現在のスコアボード要素を複製してポーズ画面に表示
    const scoreArea = document.getElementById('pause-score-area');
    const mainScoreBoard = document.getElementById('score-board');
    if (mainScoreBoard && scoreArea) {
      scoreArea.innerHTML = mainScoreBoard.innerHTML;
    } else {
      scoreArea.innerHTML = "<p>スコア情報がありません</p>";
    }

    overlay.style.display = 'flex';
  } else {
    // ポーズを解除する
    isPaused = false;
    isPlaying = true;
    update.lastTime = performance.now(); // 再開時の時間ズレ（ワープ）を防ぐ
    overlay.style.display = 'none';
  }
}

// ページの読み込み完了時にポーズUIを生成
window.addEventListener('DOMContentLoaded', () => {
  initGameData();
  createPauseMenu(); // ← これを追加
});

// --- ブラウザ非アクティブ時の自動ポーズ ---
document.addEventListener('visibilitychange', () => {
  // タブが隠れた、かつ現在ゲームがプレイ中(isPlaying)であればポーズをかける
  if (document.hidden && isPlaying && !isPaused) {
    togglePause();
  }
});

// ウィンドウからフォーカスが外れた際も念のためポーズ
window.addEventListener('blur', () => {
  if (isPlaying && !isPaused) {
    togglePause();
  }
});



let tutorialBasicCompleted = false;
let tutorialStep4Done = false;
let tutorialStep5Done = false;
let tutorialStep6Done = false;

// メッセージ表示と同時に画面をフリーズ（一時停止）させる関数
function showMessageWithFreeze(text, duration = 1500) {
  statusDisplay.innerText = text;
  if (duration > 0) {
    isPlaying = false; // 画面処理を停止
    if (freezeTimer) clearTimeout(freezeTimer);
    freezeTimer = setTimeout(() => {
      isPlaying = true; // 指定時間経過後に再開
      requestAnimationFrame(update);
    }, duration);
  }
}

let currentPosition = POSITIONS[2];

let player = { 
  x: 0, 
  y: 0, 
  width: 28, 
  height: 36, 
  speed: 2.5, 
  state: 'IDLE',
  playerName: '操作選手' 
};

let ball = { x: BASES[0].x, y: BASES[0].y, vx: 0, vy: 0, radius: 5, state: 'WAITING', baseIndex: -1 };
let runners = []; 
let aiFielders = []; 

let outs = 0;
let playStartOuts = 0; // ★追加: プレイ開始時のアウト数を記憶
let currentInning = 1;
let isTopInning = true;
let isPlayerFirst = Math.random() < 0.5;
let playerScore = 0;    
let opponentScore = 0;  
let playerHits = 0;
let opponentHits = 0;
let playerErrors = 0;
let opponentErrors = 0; 
let currentPlayHit = false; 
let currentPlayError = false; 
let isPitcherCovering1B = false; 

let playerInningScores = [];
let opponentInningScores = [];
let hrBatters = [];

let nextPlayDelay = 0;       
let isWaitingNextPlay = false; 

let playResolved = true;
let relayMode = false; 
let relayBaseIndex = -1; 

let camera = { x: currentPosition.x - WORLD_WIDTH / 2, y: currentPosition.y - WORLD_HEIGHT / 2 };
let moveVector = { x: 0, y: 0 };
let throwAimAngle = 0; 
let isHoldingBtn = false;
let gameTick = 0; 
let padPointerId = null;
let btnPointerId = null;
let hitTick = 0; 

// 3. 試合用の味方打線データ生成（現在の相手データの投手力・守備力を渡す）
const currentPitching = (typeof opponentData !== 'undefined' && opponentData.pitching !== undefined) 
  ? opponentData.pitching 
  : 50;

const currentDefense = (typeof opponentData !== 'undefined' && opponentData.defense !== undefined) 
  ? opponentData.defense 
  : 50;

let MY_BATTERS = getAdjustedMyBatters(currentPitching, currentDefense);

// その後にデータを参照
let OPPONENT_BATTERS = opponentData.batters;

let playerBatterIndex = 0;   // 味方の今の打順
let opponentBatterIndex = 0; // 相手の今の打順

let vsP1BatterIndex = 0; // 1Pの打順
let vsP2BatterIndex = 0; // 2Pの打順

// 1試合ごとの一時成績データ
let currentGameStats = {
  batters: [],
  pitcher: { outs: 0, hits: 0, runs: 0, er: 0 }
};

// 試合開始時に一時成績をリセット（startGame() などから呼び出し）
function initCurrentGameStats() {
  currentGameStats = {
    batters: (typeof BASE_MY_BATTERS !== 'undefined') ? BASE_MY_BATTERS.map(b => ({
      name: b.name, pa: 0, ab: 0, h: 0, h2: 0, h3: 0, hr: 0, rbi: 0, bb: 0, so: 0, e: 0
    })) : [],
    pitcher: { outs: 0, hits: 0, runs: 0, er: 0 }
  };
}

// 試合終了時に通算成績へ書き込む
function finalizeGameStats() {
  // 練習試合時は加算しない
  if (typeof isPracticeMode !== 'undefined' && isPracticeMode) return;

  let stats = getStoryStats();

  // 打者成績の加算
  if (currentGameStats.batters && stats.batters) {
    currentGameStats.batters.forEach((cb, idx) => {
      if (stats.batters[idx]) {
        let sb = stats.batters[idx];
        sb.pa = (sb.pa || 0) + (cb.pa || 0);
        sb.ab = (sb.ab || 0) + (cb.ab || 0);
        sb.h  = (sb.h  || 0) + (cb.h  || 0);
        sb.h2 = (sb.h2 || 0) + (cb.h2 || 0);
        sb.h3 = (sb.h3 || 0) + (cb.h3 || 0);
        sb.hr = (sb.hr || 0) + (cb.hr || 0);
        sb.rbi = (sb.rbi || 0) + (cb.rbi || 0);
        sb.bb = (sb.bb || 0) + (cb.bb || 0);
        sb.so = (sb.so || 0) + (cb.so || 0);
        sb.e  = (sb.e  || 0) + (cb.e  || 0);
      }
    });
  }

  // 投手成績の加算
  if (currentGameStats.pitcher && stats.pitcher) {
    let cp = currentGameStats.pitcher;
    let sp = stats.pitcher;
    sp.games = (sp.games || 0) + 1;
    sp.outs  = (sp.outs || 0)  + cp.outs;
    sp.hits  = (sp.hits || 0)  + cp.hits;
    sp.runs  = (sp.runs || 0)  + cp.runs;
    sp.er    = (sp.er || 0)    + cp.er;
  }

  saveStoryStats(stats);
}

// ★追加：打順を正しく1回だけ進めるための共通関数
function advanceBatterIndex() {
  if (!ball.batterAdvanced) {
    ball.batterAdvanced = true;
    if (typeof isVsMode !== 'undefined' && isVsMode) {
      if (isTopInning) {
        vsP1BatterIndex = (vsP1BatterIndex + 1) % 9;
        opponentBatterIndex = vsP1BatterIndex;
      } else {
        vsP2BatterIndex = (vsP2BatterIndex + 1) % 9;
        opponentBatterIndex = vsP2BatterIndex;
      }
    } else {
      opponentBatterIndex = (opponentBatterIndex + 1) % 9;
    }
  }
}

function updateScoreBoard() {
  const sb = document.getElementById('score-board') || document.createElement('div');
  sb.id = 'score-board';
  sb.style.position = 'relative'; 
  sb.style.margin = '10px auto';
  sb.style.color = 'white';
  sb.style.fontWeight = 'bold';
  sb.style.textShadow = '1px 1px 2px black';
  sb.style.fontSize = '14px'; 
  sb.style.zIndex = '10';
  sb.style.textAlign = 'center';
  sb.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  sb.style.padding = '10px 5px';
  sb.style.borderRadius = '5px';
  sb.style.width = '95%';

  // ★ 名称整形用のアロー関数（「高校」「学院」「ベストナイン」を削除）
  const cleanName = (name) => (name || '').replace(/(高校|学院|学園|ベストナイン)/g, '');

  const inningStr = `${currentInning}回${isTopInning ? "表" : "裏"}`;
  let headerRow = '<th>TEAM</th>';

  let awayName, homeName;
  let awayScores, homeScores;
  let awayR, awayH, awayE;
  let homeR, homeH, homeE;

  // 対戦モード時は 1P(先攻) と 2P(後攻) を固定で割り振る
  if (typeof isVsMode !== 'undefined' && isVsMode) {
    const p1 = cleanName(vsP1Config?.name || 'Aチーム');
    const p2 = cleanName(vsP2Config?.name || 'Bチーム');
    awayName = `${p1}(先)`;
    homeName = `${p2}(後)`;
    awayScores = playerInningScores;
    homeScores = opponentInningScores;
    awayR = playerScore; awayH = playerHits; awayE = playerErrors;
    homeR = opponentScore; homeH = opponentHits; homeE = opponentErrors;
  } else {
    const myName = cleanName(mySchoolName);
    const oppName = cleanName(getOpponentSchoolName());
    awayName = isPlayerFirst ? `${myName}(先)` : `${oppName}(先)`;
    homeName = isPlayerFirst ? `${oppName}(後)` : `${myName}(後)`;
    awayScores = isPlayerFirst ? playerInningScores : opponentInningScores;
    homeScores = isPlayerFirst ? opponentInningScores : playerInningScores;
    awayR = isPlayerFirst ? playerScore : opponentScore;
    awayH = isPlayerFirst ? playerHits : opponentHits;
    awayE = isPlayerFirst ? playerErrors : opponentErrors;
    homeR = isPlayerFirst ? opponentScore : playerScore;
    homeH = isPlayerFirst ? opponentHits : playerHits;
    homeE = isPlayerFirst ? opponentErrors : playerScore;
  }

  let awayRow = `<td>${awayName}</td>`;
  let homeRow = `<td>${homeName}</td>`;

  const isExtraInnings = currentInning > 9;
  const startInning = isExtraInnings ? 10 : 1;
  const endInning = isExtraInnings ? 18 : 9;

  for (let i = startInning - 1; i < endInning; i++) {
    headerRow += `<th>${i + 1}</th>`;
    let awayScore = awayScores[i];
    let homeScore = homeScores[i];
    awayRow += `<td>${awayScore !== undefined ? awayScore : ''}</td>`;
    homeRow += `<td>${homeScore !== undefined ? homeScore : ''}</td>`;
  }

  headerRow += '<th>|</th><th>R</th><th>H</th><th>E</th>';
  awayRow += `<td>|</td><td style="color: yellow;">${awayR}</td><td>${awayH}</td><td>${awayE}</td>`;
  homeRow += `<td>|</td><td style="color: yellow;">${homeR}</td><td>${homeH}</td><td>${homeE}</td>`;

  sb.innerHTML = `
    <div style="margin-bottom: 5px;">【${inningStr}】 OUT: ${outs}</div>
    <table style="width: 100%; border-collapse: collapse; text-align: center;">
      <tr style="border-bottom: 1px solid white;">${headerRow}</tr>
      <tr style="border-bottom: 1px dashed gray;">${awayRow}</tr>
      <tr>${homeRow}</tr>
    </table>
  `;

  if (!document.getElementById('score-board')) {
    const attackScreen = document.getElementById('attack-screen');
    if (attackScreen) {
      attackScreen.insertBefore(sb, attackScreen.firstChild);
    } else {
      document.body.appendChild(sb);
    }
  }
}

let hitBallTimer = null;

function startInning() {
  outs = 0;
  playStartOuts = 0;
  runners = [];

  if (hitBallTimer) {
    clearTimeout(hitBallTimer);
    hitBallTimer = null;
  }

  // 対戦モードの設定切り替えと1P/2P打順インデックスの同期
  if (typeof isVsMode !== 'undefined' && isVsMode) {
    const attackingConfig = isTopInning ? vsP1Config : vsP2Config;
    const defendingConfig = isTopInning ? vsP2Config : vsP1Config;

    MY_BATTERS = getAdjustedMyBatters(defendingConfig.pitching, defendingConfig.defense);
    OPPONENT_BATTERS = attackingConfig.batters;
    mySchoolName = attackingConfig.name;

    // 現在のイニング（表/裏）に合わせて個別打順インデックスを切り替え
    opponentBatterIndex = isTopInning ? vsP1BatterIndex : vsP2BatterIndex;
  }

  // 9回裏以降等の試合終了判定
  if (currentInning >= 9 && !isTopInning) {
    let homeScore = isPlayerFirst ? opponentScore : playerScore;
    let awayScore = isPlayerFirst ? playerScore : opponentScore;
    if (homeScore > awayScore) {
      showGameResult();
      return;
    }
  }

  const isVsInningStart = (typeof isVsMode !== 'undefined' && isVsMode);
  const isPlayerBatting = (isTopInning === isPlayerFirst);

  if (isVsInningStart) {

    isPlaying = false;
    outs = 0;
    updateScoreBoard();

    const attackScreen = document.getElementById('attack-screen');
    const attackScore = document.getElementById('attack-score');
    const attackLog = document.getElementById('attack-log');
    const btn = document.getElementById('defense-start-btn');

    const currentAttacker = isTopInning ? vsP1Config.name : vsP2Config.name;
    const currentDefender = isTopInning ? vsP2Config.name : vsP1Config.name;

    attackScore.innerHTML = `【${currentInning}回${isTopInning ? "表" : "裏"}】 ${currentAttacker} の攻撃`;
    attackLog.innerHTML = `攻守交代です。スコアボードとNEXT打者を確認して「プレイ開始」を押してください。`;

    let nextBatterEl = document.getElementById('attack-next-batter');
    if (!nextBatterEl) {
      nextBatterEl = document.createElement('div');
      nextBatterEl.id = 'attack-next-batter';
      nextBatterEl.style.marginBottom = '12px';
      nextBatterEl.style.fontSize = '14px';
      nextBatterEl.style.fontWeight = 'bold';
      nextBatterEl.style.color = '#fbbf24';
      nextBatterEl.style.textAlign = 'center';
      btn.parentNode.insertBefore(nextBatterEl, btn);
    }

    let oppB = OPPONENT_BATTERS[opponentBatterIndex] || OPPONENT_BATTERS[0];
    const order = oppB.order || (opponentBatterIndex + 1);
    const handStr = oppB.hand || '右';
    const pullBar = (typeof createPullTendencyBar === 'function') 
      ? createPullTendencyBar(oppB.pullTendency, handStr) 
      : '';

    nextBatterEl.innerHTML = `【先頭打者】 ${order}番 ${oppB.name} (${handStr}) 走:${oppB.speed ?? '-'} / 打:${oppB.hitSpeed ?? '-'}<br>傾向:${pullBar}`;
    nextBatterEl.style.display = 'block';

    btn.innerText = `プレイ開始 (${currentDefender}の守備)`;
    btn.onclick = () => {
      attackScreen.classList.add('hidden');
      const pauseBtn = document.getElementById('pause-btn');
      if (pauseBtn) pauseBtn.style.display = 'block'; // ★追加: 守備開始時にポーズボタンを表示
      isPlaying = true;

      if (typeof ball !== 'undefined') ball.state = 'WAITING';
      if (typeof aiFielders !== 'undefined') aiFielders = [];
      if (typeof player !== 'undefined') player.state = 'IDLE';

      statusDisplay.innerText = `【${currentInning}回${isTopInning ? "表" : "裏"}】 ${currentDefender}の守備！`;
      updateScoreBoard();
      updateBatterDisplay(false);

      hitBallTimer = setTimeout(hitBall, 1500);
    };

    attackScreen.classList.remove('hidden');
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.style.display = 'none';

  // 修正後のコード（296行目付近）
} else if (isPlayerBatting && (typeof isTutorialMode !== 'undefined' && !isTutorialMode)) {
    // 【ストーリーモード：味方攻撃フェーズ】※チュートリアル中はスキップ
    isPlaying = false;
    updateBatterDisplay();
    outs = 0;
    let simOuts = 0;
    let simRuns = 0;
    let b1 = null, b2 = null, b3 = null; 
    let inningLog = []; 
    const outcomeText = { 'BB':'四球', '1B':'単打', '2B':'2塁打', '3B':'3塁打', 'HR':'本塁打', 'SO':'三振', 'FO':'フライアウト', 'GO':'ゴロアウト' };

    const currentDefDefense = currentDefense;

    while (simOuts < 3) {
      let batter = MY_BATTERS[playerBatterIndex];
      let roll = Math.random() * 100;
      let cumulative = 0;
      let outcome = '';
      
      if (roll < (cumulative += batter.bb)) outcome = 'BB';
      else if (roll < (cumulative += batter.h1)) outcome = '1B';
      else if (roll < (cumulative += batter.h2)) outcome = '2B';
      else if (roll < (cumulative += batter.h3)) outcome = '3B';
      else if (roll < (cumulative += batter.hr)) outcome = 'HR';
      else if (roll < (cumulative += batter.so)) outcome = 'SO';
      else if (roll < (cumulative += batter.fo)) outcome = 'FO';
      else outcome = 'GO';
      
      let isError = false;
      if (outcome === 'FO' || outcome === 'GO') {
        const errorProb = Math.max(0, (1 / 5) - (currentDefDefense / 500));
        if (Math.random() < errorProb) {
          isError = true;
          opponentErrors++;
        }
      }

      let preRuns = simRuns;
      let preOuts = simOuts;

      if (outcome === 'BB') {
        if (b1 && b2 && b3) { simRuns++; } 
        else if (b1 && b2) { b3 = b2; b2 = b1; b1 = batter; }
        else if (b1 && b3) { b2 = b1; b1 = batter; } 
        else if (b1) { b2 = b1; b1 = batter; }
        else { b1 = batter; }
      } else if (outcome === '1B') {
        playerHits++; 
        if (b3) { simRuns++; b3 = null; }
        if (b2) { if (Math.random() * 100 < b2.speed) { simRuns++; } else { b3 = b2; } b2 = null; }
        if (b1) { b2 = b1; b1 = null; }
        b1 = batter;
      } else if (outcome === '2B') {
        playerHits++; 
        if (b3) { simRuns++; b3 = null; }
        if (b2) { simRuns++; b2 = null; }
        if (b1) { b3 = b1; b1 = null; }
        b2 = batter;
      } else if (outcome === '3B') {
        playerHits++; 
        if (b3) { simRuns++; b3 = null; }
        if (b2) { simRuns++; b2 = null; }
        if (b1) { simRuns++; b1 = null; }
        b3 = batter;
      } else if (outcome === 'HR') {
        playerHits++; 
        hrBatters.push(batter.name); 
        simRuns += (b1 ? 1 : 0) + (b2 ? 1 : 0) + (b3 ? 1 : 0) + 1;
        b1 = null; b2 = null; b3 = null;
      } else if (outcome === 'SO') { simOuts++; }
      else if (outcome === 'FO') {
        if (isError) {
          if (b3) { simRuns++; b3 = null; }
          if (b2) { if (Math.random() * 100 < b2.speed) { simRuns++; } else { b3 = b2; } b2 = null; }
          if (b1) { b2 = b1; b1 = null; }
          b1 = batter;
        } else {
          if (simOuts < 2 && b3 && (Math.random() * 100 < b3.speed)) { simRuns++; b3 = null; } 
          simOuts++;
        }
      } else if (outcome === 'GO') {
        if (isError) {
          if (b3) { simRuns++; b3 = null; }
          if (b2) { if (Math.random() * 100 < b2.speed) { simRuns++; } else { b3 = b2; } b2 = null; }
          if (b1) { b2 = b1; b1 = null; }
          b1 = batter;
        } else {
          if (simOuts < 2 && b1) {
            if (Math.random() * 100 < (120 - batter.speed)) { simOuts += 2; b1 = null; } 
            else { simOuts += 1; b1 = batter; }
          } else { simOuts++; }
        }
      }

      let rbi = simRuns - preRuns;
      let outDiff = simOuts - preOuts;

      if (currentGameStats.batters[playerBatterIndex]) {
        let bStat = currentGameStats.batters[playerBatterIndex];
        bStat.pa++;
        if (outcome !== 'BB') bStat.ab++;
        if (['1B', '2B', '3B', 'HR'].includes(outcome)) bStat.h++;
        if (outcome === '2B') bStat.h2++;
        if (outcome === '3B') bStat.h3++;
        if (outcome === 'HR') bStat.hr++;
        if (outcome === 'BB') bStat.bb++;
        if (outcome === 'SO') bStat.so++;
        bStat.rbi += rbi;
      }

      let resultText = "";
      let isHit = ['1B', '2B', '3B'].includes(outcome);
      let isHR = outcome === 'HR';

      if (isError) {
        resultText = '敵失(エラー)';
      } else if (outcome === '1B') {
        const hits = ['左安', '中安', '右安'];
        resultText = hits[Math.floor(Math.random() * hits.length)];
      } else if (outcome === '2B') { resultText = '2塁打';
      } else if (outcome === '3B') { resultText = '3塁打';
      } else if (outcome === 'HR') { resultText = '本塁打';
      } else { resultText = outcomeText[outcome]; }

      if (outcome === 'FO' && rbi > 0 && !isError) resultText += " (犠飛)";
      if (outcome === 'GO' && outDiff === 2 && !isError) resultText += " (併殺)";

      let color = isHR ? 'red' : 
                  (isHit && rbi > 0) ? 'orange' : 
                  isHit ? 'yellow' : 
                  (rbi > 0) ? 'green' : 
                  (outcome === 'BB' || isError) ? 'cyan' : 'white';
                  
      inningLog.push(`<span style="color: ${color}; font-weight: bold;">${batter.name} : ${resultText} ${rbi > 0 ? `[${rbi}打点]` : ''}</span>`);
      
      if (!isPlayerFirst && !isTopInning && currentInning >= 9) {
         if (playerScore + simRuns > opponentScore) {
            simOuts = 3; 
            inningLog.push(`<span style="color: gold; font-weight: bold;">【サヨナラ勝ち！】 試合終了！</span>`);
         }
      }
      playerBatterIndex = (playerBatterIndex + 1) % 9;
    }
    
    playerScore += simRuns;
    playerInningScores[currentInning - 1] = simRuns;
    updateScoreBoard();
    
    document.getElementById('attack-score').innerHTML = `【${currentInning}回${isTopInning ? "表" : "裏"}】 ${mySchoolName}の攻撃<br>この回の得点: ${simRuns}点`;
    document.getElementById('attack-log').innerHTML = inningLog.join('<br>');
    
    const btn = document.getElementById('defense-start-btn');
    
    let nextBatterEl = document.getElementById('attack-next-batter');
    if (!nextBatterEl) {
      nextBatterEl = document.createElement('div');
      nextBatterEl.id = 'attack-next-batter';
      nextBatterEl.style.marginBottom = '12px';
      nextBatterEl.style.fontSize = '14px';
      nextBatterEl.style.fontWeight = 'bold';
      nextBatterEl.style.color = '#fbbf24';
      nextBatterEl.style.textAlign = 'center';
      btn.parentNode.insertBefore(nextBatterEl, btn);
    }

    let isGameOver = false;
    let homeScore = isPlayerFirst ? opponentScore : playerScore;
    let awayScore = isPlayerFirst ? playerScore : opponentScore;

    if (currentInning >= 9) {
      if (isTopInning && homeScore > awayScore) {
        isGameOver = true;
      } else if (!isTopInning && homeScore !== awayScore) {
        isGameOver = true;
      } else if (!isTopInning && currentInning === 18 && homeScore === awayScore) {
        isGameOver = true;
      }
    }

    if (isGameOver) {
       nextBatterEl.style.display = 'none';
       btn.innerText = "試合結果を見る";
       btn.onclick = () => {
         document.getElementById('attack-screen').classList.add('hidden');
         showGameResult();
       };
    } else {
       let oppB = OPPONENT_BATTERS[opponentBatterIndex] || OPPONENT_BATTERS[0];
       const order = oppB.order || (opponentBatterIndex + 1);
       const handStr = oppB.hand || '右';
       const pullBar = (typeof createPullTendencyBar === 'function') 
         ? createPullTendencyBar(oppB.pullTendency, handStr) 
         : '';

       nextBatterEl.innerHTML = `【NEXT】 ${order}番 ${oppB.name} (${handStr}) 走:${oppB.speed ?? '-'} / 打:${oppB.hitSpeed ?? '-'}<br>傾向:${pullBar}`;
       nextBatterEl.style.display = 'block';

       btn.innerText = "次のプレイ・守備へ";
       
       btn.onclick = () => {
         document.getElementById('attack-screen').classList.add('hidden');
         isPlaying = true;
         if (isTopInning) {
           isTopInning = false;
         } else {
           currentInning++;
           isTopInning = true;
         }
         startInning();
       };
    }
    document.getElementById('attack-screen').classList.remove('hidden');
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.style.display = 'none';
    
  } else {
    // 【ストーリーモード / チュートリアル：敵攻撃・味方守備フェーズ】
    isPlaying = true;
    outs = 0;
    runners = []; 

    const attackScreen = document.getElementById('attack-screen');
    if (attackScreen) {
      attackScreen.classList.add('hidden');
    }

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.style.display = 'block';

    if (typeof ball !== 'undefined') ball.state = 'WAITING';
    if (typeof aiFielders !== 'undefined') aiFielders = [];
    if (typeof player !== 'undefined') player.state = 'IDLE';

    // チュートリアル表示の分岐処理を追加
    if (typeof isTutorialMode !== 'undefined' && isTutorialMode) {
      statusDisplay.innerText = `【チュートリアル】守備の練習をしましょう！`;
    } else {
      statusDisplay.innerText = `【${currentInning}回${isTopInning ? "表" : "裏"}】 守備につけ！ 3アウトを取れ！`;
    }

    updateScoreBoard();
    updateBatterDisplay(false);

    hitBallTimer = setTimeout(hitBall, 2000);
  }

  if (typeof isTutorialMode !== 'undefined' && isTutorialMode) {
    updateTutorialUI(currentTutorialStep);
  }

}

function hitBall() {
  playResolved = false;
  relayMode = false;
  currentPlayHit = false; 
  currentPlayError = false; // 次のプレイ開始時に消灯
  isPitcherCovering1B = false; // 投手が1塁カバーに入っているか
  
  // ★ チュートリアル時は毎打球ごとにアウト数とランナーを完全リセット
  if (typeof isTutorialMode !== 'undefined' && isTutorialMode) {
    outs = 0;
    playStartOuts = 0;
    runners = [];
    currentPlayHit = false;
    currentPlayError = false;
    updateScoreBoard(); 
  } else {
    runners = runners.filter(r => !r.isOut && r.finalBase < 4);
  }

  playStartOuts = outs;

  const currentBatter = OPPONENT_BATTERS[opponentBatterIndex] || OPPONENT_BATTERS[0];
  const pullTendency = currentBatter.pullTendency ?? 50; // パラメータがない場合は50(均等)

  // （以下、既存の打球処理へと続く...）

  // 0(1塁側) 〜 100(3塁側) を 0.0〜1.0 の割合に変換
  const p = pullTendency / 100;
  
  // 乱数を歪ませるための指数を計算 (50なら1、100なら0.1、0なら10)
  const power = Math.pow(10, (0.5 - p) * 2);
  
  // 0〜1の乱数をべき乗して歪ませる
  const weightedU = Math.pow(Math.random(), power);
  
  // 歪んだ乱数を使って 0〜3 のインデックスを決定 (0:1B, 1:2B, 2:SS, 3:3B)
  let posIndex = Math.floor(weightedU * 4);
  if (posIndex > 3) posIndex = 3;

  // 自操作プレイヤーのランダム配置と初期化
  currentPosition = POSITIONS[posIndex];
  player.x = currentPosition.x;
  player.y = currentPosition.y;
  player.state = 'IDLE';
  player.playerName = getPlayerName(currentPosition.name);
  player.hasThrown = false;

  // hitBall() 内の ball 初期化直後に以下を追加
  ball.errantFenceCount = 0;
  ball.isErrant = false;
  ball.hasHitFence = false;
  ball.fenceImpactPredicted = false;
  ball.predictedFencePoint = null;
  ball.batterAdvanced = false;
  ball.isTouchedByInfielder = false;
  ball.isDistanceExceeded700 = false;
  ball.scoredRunnersThisPlay = []; // ★ 追加：このプレイで生還した走者を記録

  // AI野手生成
  aiFielders = POSITIONS
    .filter(p => p.name !== currentPosition.name)
    .map(p => ({
      name: p.name,
      playerName: getPlayerName(p.name),
      x: p.x,
      y: p.y,
      speed: ['レフト', 'センター', 'ライト'].includes(p.name) ? 5 : 1.9,
      state: 'IDLE'
    }));

  aiFielders.push({
    name: 'キャッチャー',
    playerName: getPlayerName('キャッチャー'),
    x: BASES[0].x,
    y: BASES[0].y,
    speed: 2.25,
    state: 'IDLE'
  });

  aiFielders.push({
    name: 'ピッチャー',
    playerName: getPlayerName('ピッチャー'),
    x: 0,
    y: 150,
    speed: 2.8, 
    state: 'IDLE'
  });
    
  // hitBall() 内の ball 初期化部分（230行目付近）
  ball.x = BASES[0].x;
  ball.y = BASES[0].y;
  ball.baseIndex = -1;
  ball.throwStartX = undefined; // ★ 古い送球始点をクリア
  ball.throwStartY = undefined; // ★ 古い送球始点をクリア
  
  const targetX = currentPosition.x + (Math.random() - 0.5) * 150;
  const targetY = currentPosition.y + (Math.random() - 0.5) * 120;
  const angle = Math.atan2(targetY - ball.y, targetX - ball.x);

  // ★ 指定の打球速度計算式を適用
  const baseHitSpeed = currentBatter.hitSpeed ?? 50;
  const speed = (2 + baseHitSpeed * 0.025) * (2 + Math.random());

  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.state = 'ROLLING';

  // ★ 指定の走力計算式を適用
  const runnerSpeed = 1.3 + 0.014 * (currentBatter.speed ?? 50);

  // ▼▼▼ 追加：2塁ランナーを足止めする条件の判定 ▼▼▼
  const isHitToLeft = (currentPosition.name === 'ショート' || currentPosition.name === 'サード');
  const is1BEmpty = !runners.some(r => !r.isOut && r.finalBase % 4 === 1);
  const shouldHold2B = (outs < 2 && isHitToLeft && is1BEmpty);
  // ▲▲▲ 追加ここまで ▲▲▲

  runners.forEach(r => {
    r.startBase = r.finalBase % 4; 
    
    // ▼▼▼ 変更：条件に合致する場合は2塁ランナーを一旦ストップさせる ▼▼▼
    if (r.startBase === 2 && shouldHold2B) {
      r.nextBase = 2;
      r.finalBase = 2;
      r.reached = false; // 進塁完了扱いにして止める
      r.isHoldingForLeftHit = true; // 後で解除するための目印フラグ
    } else {
      r.nextBase = r.startBase + 1;
      r.finalBase = r.startBase + 1;
      r.reached = false;
      r.isHoldingForLeftHit = false;
    }
    // ▲▲▲ 変更ここまで ▲▲▲
    
    // --- リードを取る処理の追加 ---
    const startB = BASES[r.startBase];
    const nextB = BASES[r.nextBase % 4];
    
    // リード幅（ピクセル単位）。数値を大きくするとリードが大きくなります
    const leadDistance = 45; 
    
    // 現在の塁から次の塁への角度を計算
    const angle = Math.atan2(nextB.y - startB.y, nextB.x - startB.x);
    
    // 塁の中心からリード幅の分だけ進んだ位置を初期座標にする
    r.x = startB.x + Math.cos(angle) * leadDistance;
    r.y = startB.y + Math.sin(angle) * leadDistance;
  });

  runners.push({ 
    x: BASES[0].x, y: BASES[0].y, 
    vx: 0, vy: 0, speed: runnerSpeed, 
    startBase: 0, nextBase: 1, finalBase: 1, 
    reached: false, isOut: false 
  });
  
  let camOffsetX = 0;
  if (currentPosition.name === 'ファースト') {
    camOffsetX = 100;  // カメラを右にずらし、選手を左寄りに
  } else if (currentPosition.name === 'サード') {
    camOffsetX = -100; // カメラを左にずらし、選手を右寄りに
  }

  camera.x = currentPosition.x - WORLD_WIDTH / 2 + camOffsetX;
  camera.y = currentPosition.y - WORLD_HEIGHT / 2;

  statusDisplay.innerText = `【${currentPosition.name}】捕球してアウトを狙え！`;
  updateScoreBoard();
  hitTick = gameTick; // 打たれた瞬間のタイムを記録

  // ★ 追加：打球が飛んだ瞬間に、ピッチャーが1塁カバーに行くかを1度だけ判定して固定する
  const isLessThanTwoOuts = outs < 2;
  const runnerHeadingTo2B = runners.some(r => !r.isOut && r.nextBase === 2);
  const is1BPlay = (currentPosition.name === 'ファースト'); 
  // 判定結果を保存（次のプレイまで変わりません）
  isPitcherCovering1B = (isLessThanTwoOuts && runnerHeadingTo2B && is1BPlay);

  hitTick = gameTick; 
  isPitcherCovering1B = (isLessThanTwoOuts && runnerHeadingTo2B && is1BPlay);

  // ★ 修正: 打球が飛んだ瞬間に `false` を渡して「【打席】」に戻す
  updateBatterDisplay(false);

  setTimeout(() => {
    triggerTutorialStep(0);
  }, 500);
}

function checkPlayEnd() {
  if (playResolved) return;
  const allStopped = runners.every(r => r.reached || r.isOut);
  // ★ OF_HELD を除外し、内野に送球されて捕球（CAUGHT等）されるまで終了させない
  const ballSettled = ball.state === 'HELD' || ball.state === 'CAUGHT' || ball.state === 'DEAD';

  if (allStopped && ballSettled) {
    playResolved = true;

    // ★ チュートリアル中でない場合（!isTutorialMode）のみヒット処理を実行
    if (!isTutorialMode && outs === playStartOuts && !currentPlayError && !currentPlayHit) {
      // ★ 対戦モードの表イニングなら1P(先攻)のヒット、それ以外は相手(または2P)のヒット
      if (typeof isVsMode !== 'undefined' && isVsMode && isTopInning) {
        playerHits++;
      } else {
        opponentHits++;
      }
      currentGameStats.pitcher.hits++;
      currentPlayHit = true;
      statusDisplay.innerText = "【内野安打】出塁を許した！"; 
      updateScoreBoard();
    }

    runners = runners.filter(r => !r.isOut && r.finalBase < 4);

    isWaitingNextPlay = true;
    nextPlayDelay = 120;

    // 変更後
    advanceBatterIndex();

    if (outs < 3) {
      updateBatterDisplay(true); // true を渡して「NEXT BATTER」表示にする
    } else {
      updateBatterDisplay(false); // 3アウトになったら非表示
    }
  }
}

const padContainer = document.getElementById('padContainer');
const padStick = document.getElementById('padStick');
const maxRadius = 30;
let isPadActive = false;

function handlePadMove(clientX, clientY) {
  const rect = padContainer.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let deltaX = clientX - centerX;
  let deltaY = clientY - centerY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance > maxRadius) {
    deltaX = (deltaX / distance) * maxRadius;
    deltaY = (deltaY / distance) * maxRadius;
  }
  padStick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
  moveVector.x = deltaX / maxRadius;
  moveVector.y = deltaY / maxRadius;

  if (relayMode && distance > 5) {
    throwAimAngle = Math.atan2(deltaY, deltaX);
  }
}

padContainer.addEventListener('pointerdown', (e) => {
  e.preventDefault(); isPadActive = true; padPointerId = e.pointerId; 
  handlePadMove(e.clientX, e.clientY);
});
window.addEventListener('pointermove', (e) => {
  if (isPadActive && e.pointerId === padPointerId) handlePadMove(e.clientX, e.clientY);
});
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);

const actionBtn = document.getElementById('actionBtn');
actionBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  isHoldingBtn = true;
  btnPointerId = e.pointerId;
  actionBtn.classList.add('holding');

  if (relayMode) {
    actionBtn.innerText = '投げる！';
  } else {
    actionBtn.innerText = '構え';
    if (ball.state === 'ROLLING') {
      const dist = Math.hypot(player.x - ball.x, player.y - ball.y);
      if (dist < 35) {
        ball.state = 'HELD';
        statusDisplay.innerText = "捕球！塁に投げるか、自分で踏め！";

        // ★ 修正：ここで completed フラグを立てず、stepIndex 2 のみを呼び出す
        triggerTutorialStep(2);
      }
    }
  }
});

function handlePointerUp(e) {
  if (isPadActive && e.pointerId === padPointerId) {
    isPadActive = false; padPointerId = null;
    padStick.style.transform = 'translate(-50%, -50%)';
    moveVector = { x: 0, y: 0 };
  }
  if (isHoldingBtn && e.pointerId === btnPointerId) {
    isHoldingBtn = false; btnPointerId = null;
    actionBtn.classList.remove('holding');
    actionBtn.innerText = '';

    if (ball.state === 'HELD' || (relayMode && ball.state === 'CAUGHT')) {
      
      // パッドに触れていない（方向入力がない）場合は送球をキャンセル
      if (moveVector.x === 0 && moveVector.y === 0) {
        statusDisplay.innerText = "投げる方向をパッドで指示してください！";
        return; 
      }

      let throwAngle = relayMode ? throwAimAngle : Math.atan2(moveVector.y, moveVector.x);
      
      const speed = 8; 
      ball.vx = Math.cos(throwAngle) * speed;
      ball.vy = Math.sin(throwAngle) * speed;
      ball.state = 'THROWN';
      ball.isFielderThrow = false;

      ball.throwStartX = ball.x;
      ball.throwStartY = ball.y;

      player.hasThrown = true;
      ball.sourceBaseIndex = relayMode ? relayBaseIndex : -1;

      relayMode = false;
      player.state = 'THROW';

      isWaitingNextPlay = false;
      playResolved = false;

      statusDisplay.innerText = "送球！";
      setTimeout(() => { if (player.state === 'THROW') player.state = 'IDLE'; }, 500);
    }
  }
}

function isForceRunner(runner, allRunners) {
  // すでに次の塁（フォース先の塁）に到達してストップしている場合はフォース解除
  // （例：1塁到達済みの打者走者がベースから離れた場合、タッチアウトが必要）
  if (runner.reached && runner.nextBase > runner.startBase) {
    return false;
  }

  // 打者走者（0塁スタート）の処理
  if (runner.startBase === 0) {
    // 1塁に向かっている途中（まだ1塁に到達していない）であればフォース状態
    return runner.nextBase === 1 && !runner.reached;
  }

  // 元から塁にいた走者（1塁、2塁、3塁スタート）の処理
  // 本塁(b=0)から自分の1つ手前の塁まで、すべてに非アウトの走者が揃っているか確認
  for (let b = 0; b < runner.startBase; b++) {
    const hasRunner = allRunners.some(r => r !== runner && !r.isOut && r.startBase === b);
    if (!hasRunner) return false; // 1つでも空き塁・アウトがあればタッチが必要
  }
  
  return true;
}

// ★ 追加：第3アウトがフォースアウトの際に、そのプレイでの得点を取り消す関数
function cancelRunsScoredThisPlay() {
  if (ball.scoredRunnersThisPlay && ball.scoredRunnersThisPlay.length > 0) {
    ball.scoredRunnersThisPlay.forEach(r => {
      if (typeof isVsMode !== 'undefined' && isVsMode) {
        if (isTopInning) {
          playerScore--;
          playerInningScores[currentInning - 1]--;
        } else {
          opponentScore--;
          opponentInningScores[currentInning - 1]--;
        }
      } else {
        opponentScore--;
        opponentInningScores[currentInning - 1]--;
      }
      currentGameStats.pitcher.runs--;
      const isRunnerReachedByError = !!r.reachedByError;
      const isScoredByError = !!r.advancedByError || currentPlayError;
      if (!isRunnerReachedByError && !isScoredByError) {
        currentGameStats.pitcher.er--;
      }
    });
    ball.scoredRunnersThisPlay = []; // リセット
  }
}

function attemptForceOut(baseIndex) {
  let gotOut = false;
  runners.forEach(r => {
    if (!r.isOut && !r.reached && (r.nextBase % 4 === baseIndex) && isForceRunner(r, runners)) {
      r.isOut = true;
      outs++;
      currentGameStats.pitcher.outs++; 
      gotOut = true;
      
      // ★ 追加: 第3アウトがフォースアウトの場合、得点を取り消す
      if (outs === 3) {
        cancelRunsScoredThisPlay();
      }

      statusDisplay.innerText = `アウト！`;
      updateScoreBoard();
    }
  });
  return gotOut;
}

function getExtendedPoint(p1, p2, length) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  return {
    x: p1.x + (dx / dist) * length,
    y: p1.y + (dy / dist) * length
  };
}

// 送球が逸れる（カバーのない場所や明後日の方向へ飛ぶ）かを瞬時に計算する予測関数
function isThrowErrant(ball, bases, aiFielders, player) {
  if (ball.state !== 'THROWN') return false;

  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  if (ballSpeed === 0) return false;

  let headingToCoveredBase = false;

  bases.forEach((base, index) => {
    if (index === ball.sourceBaseIndex) return;

    // ボールからベースへのベクトル
    const dx = base.x - ball.x;
    const dy = base.y - ball.y;
    
    // 内積で送球の進行方向にあるか判定
    const dot = (dx * ball.vx + dy * ball.vy) / ballSpeed;
    if (dot > 0) {
      // 軌道直線とベースの中心との最短距離
      const perpDist = Math.abs(dx * ball.vy - dy * ball.vx) / ballSpeed;

      if (perpDist < base.radius * 1.5) {
        // そのベースに誰かカバーに入っているか確認
        const isPlayerCovering = Math.hypot(player.x - base.x, player.y - base.y) < base.radius * 1.5;
        const isAICovering = aiFielders.some(f => 
          !['レフト', 'センター', 'ライト'].includes(f.name) && 
          Math.hypot(f.x - base.x, f.y - base.y) < base.radius * 1.5
        );

        if (isPlayerCovering || isAICovering) {
          headingToCoveredBase = true;
        }
      }
    }
  });

  // カバーされたベースに向かっていない送球は「逸れる球」と断定
  return !headingToCoveredBase;
}

// triggerThrowError() 内（465行目付近）
function triggerThrowError() {
  if (ball.errorProcessed || outs >= 3) return;

  const hasActiveRunner = runners.some(r => !r.isOut);
  if (!hasActiveRunner) return;

  ball.errorProcessed = true;
  
  // ★ 対戦モードの表イニングなら守備側(2P)のエラー、それ以外は1Pのエラー
  if (typeof isVsMode !== 'undefined' && isVsMode && isTopInning) {
    opponentErrors++;
  } else {
    playerErrors++;
  }
  
  currentPlayError = true; 
  statusDisplay.innerText = `悪送球!`;

  addErrorToStats(currentPosition.name);

  runners.forEach(r => {
    if (!r.isOut) {
      r.advancedByError = true; // ★ エラーによる進塁・生還フラグをセット
      
      // 打者走者（0塁からスタート）がエラーで進塁した場合は「エラー出塁」として記録
      if (r.startBase === 0) {
        r.reachedByError = true; // ★ エラー出塁フラグをセット
      }

      // ★ 修正: 自重していたランナーは目標塁を3塁止めにする
      const targetBaseOnError = r.isHoldingForLeftHit ? 3 : r.startBase + 2;
      if (r.finalBase < targetBaseOnError) {
        r.finalBase = Math.min(4, targetBaseOnError);
      } else {
        r.finalBase = Math.min(4, r.finalBase + 1);
      }
      r.reached = false; 
    }
  });
}

function updateBatterDisplay(isNext = false) {
  let el = document.getElementById('batter-display');
  if (!el) {
    el = document.createElement('div');
    el.id = 'batter-display';
    document.getElementById('game-container').appendChild(el);
    
    el.style.position = 'absolute';
    el.style.bottom = 'auto'; 
    el.style.top = '15%';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    
    el.style.width = 'fit-content'; 
    el.style.maxWidth = '95%';      
    el.style.height = 'fit-content'; 
    el.style.minHeight = '0px';      
    el.style.lineHeight = '1.5';     
    el.style.margin = '0px';         
    el.style.boxSizing = 'border-box';
    el.style.whiteSpace = 'nowrap'; 
    
    el.style.textAlign = 'center';
    el.style.padding = '6px 12px';  
    el.style.borderRadius = '5px';
    el.style.zIndex = '150';
  }

  const isTutorial = (typeof isTutorialMode !== 'undefined' && isTutorialMode);
  const isPlayerDefense = isTutorial || ((typeof isVsMode !== 'undefined' && isVsMode) ? true : (isTopInning !== isPlayerFirst));
  
  // 守備時かつ3アウト未満のときのみ相手打者を表示
  if (isPlayerDefense && outs < 3 && OPPONENT_BATTERS[opponentBatterIndex]) {
    let b = OPPONENT_BATTERS[opponentBatterIndex];
    const order = b.order || (opponentBatterIndex + 1);
    
    const prefix = isNext ? '<span style="color:#fbbf24;">【NEXT】</span>' : '【打席】';
    el.style.backgroundColor = isNext ? 'rgba(76, 29, 149, 0.85)' : 'rgba(15, 23, 42, 0.85)';
    
    const handStr = b.hand || '右';
    const pullBar = createPullTendencyBar(b.pullTendency, handStr);

    el.innerHTML = `${prefix}${order}番 ${b.name} <span style="color:#93c5fd;">(${handStr})</span> <span style="color:#a7f3d0;">走:${b.speed ?? '-'}</span> / <span style="color:#fde047;">打:${b.hitSpeed ?? '-'}</span> / <span style="color:#e2e8f0;">傾向:${pullBar}</span>`;
    el.style.display = 'block';

  } else {
    // 攻撃時・チェンジ時は非表示
    el.style.display = 'none'; 
  }
}

function update(timestamp) {
  if (!isPlaying) {
    requestAnimationFrame(update); // ループ自体は途切れさせない
    return; // 下の計算処理には進ませない
  }

  requestAnimationFrame(update);

  // --- ★ここから書き換え ---
  if (!timestamp) timestamp = performance.now();
  if (!update.lastTime) update.lastTime = timestamp;
  
  // 60FPS(約16.6ms)を基準「1.0」とした倍率(dt)を計算
  let dt = (timestamp - update.lastTime) / (1000 / 60);
  update.lastTime = timestamp;

  // タブ切り替え時などの巨大なズレ（ワープ）を防止
  if (dt > 2.0) dt = 1.0;
  if (dt <= 0) return;

  gameTick += dt; // ★「gameTick++」から変更
  // --- ★ここまで ---

  updateScoreBoard();
  
  // 以降の共通変数の定義などはそのまま...

  // 共通変数の定義（関数の先頭で1回だけ宣言）
  const home = BASES[0];
  const base1 = BASES[1];
  const base3 = BASES[3];
  const outerCenter = { x: 0, y: 0 };
  const OUTER_RADIUS = 1600;
  const BACKSTOP_RADIUS = 300;
  const FOUL_ANGLE_OFFSET = 10 * (Math.PI / 180);

  // --- ここから追加・移動：グラウンドの正確な形状を定義 ---
  const angle1 = Math.atan2(base1.y - home.y, base1.x - home.x); 
  const angle3 = Math.atan2(base3.y - home.y, base3.x - home.x); 

  function getPoleIntersection(rayAngle) {
    const dx = home.x - outerCenter.x;
    const dy = home.y - outerCenter.y;
    const a = 1;
    const b = 2 * (dx * Math.cos(rayAngle) + dy * Math.sin(rayAngle));
    const c = dx * dx + dy * dy - Math.pow(OUTER_RADIUS, 2);
    const r = (-b + Math.sqrt(b * b - 4 * a * c)) / 2;
    return { x: home.x + r * Math.cos(rayAngle), y: home.y + r * Math.sin(rayAngle) };
  }

  const pole1 = getPoleIntersection(angle1);
  const pole3 = getPoleIntersection(angle3);
  const outerAngle1 = Math.atan2(pole1.y - outerCenter.y, pole1.x - outerCenter.x);
  const outerAngle3 = Math.atan2(pole3.y - outerCenter.y, pole3.x - outerCenter.x);

  const dist1 = Math.hypot(pole1.x - home.x, pole1.y - home.y);
  const offset1 = Math.acos(BACKSTOP_RADIUS / dist1);
  const touchAngle1 = angle1 + offset1; 

  const dist3 = Math.hypot(pole3.x - home.x, pole3.y - home.y);
  const offset3 = Math.acos(BACKSTOP_RADIUS / dist3);
  const touchAngle3 = angle3 - offset3; 

  // 描画と当たり判定の両方で使うフィールドの形状パス
  const fieldPath = new Path2D();
  fieldPath.arc(home.x, home.y, BACKSTOP_RADIUS, touchAngle1, touchAngle3, false);
  fieldPath.arc(outerCenter.x, outerCenter.y, OUTER_RADIUS, outerAngle3, outerAngle1, false);
  fieldPath.closePath();
  // --- ここまで ---

  fieldPath.closePath();
  // --- ここまで（既存のコード） ---

  // ★ 追加：ボールの軌道予測（フェンス激突地点の計算）
  if ((ball.state === 'ROLLING' || ball.state === 'THROWN') && !ball.fenceImpactPredicted) {
    ball.fenceImpactPredicted = true;
    ball.predictedFencePoint = null;

    let speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0) {
      let simX = ball.x;
      let simY = ball.y;
      let step = 15; // 15pxずつ進めてシミュレーション（負荷軽減）
      let sx = (ball.vx / speed) * step;
      let sy = (ball.vy / speed) * step;
      
      for (let i = 0; i < 200; i++) { // 最大3000px先まで計算
        simX += sx;
        simY += sy;
        // fieldPath（グラウンド）の外に出た瞬間をフェンス激突地点とする
        if (!ctx.isPointInPath(fieldPath, simX, simY)) {
          ball.predictedFencePoint = { x: simX, y: simY };
          break;
        }
      }
    }
  }

  // 1. プレイヤーの移動処理
  if (!relayMode) {
    if (player.hasThrown) {
      // ----------------------------------------
      // 【送球後】自動で定位置（ベース）へ戻る処理
      // ----------------------------------------
      let autoTarget = null;

      // サードは無条件で3塁へ
      if (currentPosition.name === 'サード') {
        autoTarget = BASES[3];
      } 
      // ファーストはピッチャーがカバーに来ていない時だけ1塁へ
      else if (currentPosition.name === 'ファースト' && !isPitcherCovering1B) {
        autoTarget = BASES[1];
      }

      if (autoTarget) {
        let dx = autoTarget.x - player.x;
        let dy = autoTarget.y - player.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 2) {
          player.x += (dx / dist) * player.speed * dt;
          player.y += (dy / dist) * player.speed * dt;
          player.state = 'RUN';
        } else {
          player.state = 'IDLE'; // ベース到着で待機
        }
      } else {
        player.state = 'IDLE';
      }

    } else {
      // ----------------------------------------
      // 【送球前】通常の手動操作（パッド移動）
      // ----------------------------------------
      if (moveVector.x !== 0 || moveVector.y !== 0) {
        player.x += moveVector.x * player.speed * dt;
        player.y += moveVector.y * player.speed * dt;
        if (player.state !== 'THROW') player.state = 'RUN';
      } else {
        if (player.state !== 'THROW') player.state = 'IDLE';
      }
    }
  }

  // 2. AI野手の移動処理
  // 送球が逸れているか関数で判定
  const checkErrant = isThrowErrant(ball, BASES, aiFielders, player);

  if (ball.state === 'THROWN' && checkErrant && !ball.isFielderThrow) {
    ball.isErrant = true;
    if (!ball.errorProcessed && outs < 3) {
      const hasActiveRunner = runners.some(r => !r.isOut);
      if (hasActiveRunner) {
        ball.errorProcessed = true;
        
        if (typeof isVsMode !== 'undefined' && isVsMode && isTopInning) {
          opponentErrors++;
        } else {
          playerErrors++;
        }
        
        currentPlayError = true;
        statusDisplay.innerText = `悪送球!`;
        addErrorToStats(currentPosition.name);
      }
    }
  }

  // ★ 悪送球であっても、外野手自身の送球なら追尾しないように除外
  const outfieldersShouldMove = (ball.state === 'ROLLING' || ball.state === 'OF_HELD' || (ball.state === 'THROWN' && ball.isErrant && !ball.isFielderThrow));

    // 最もボールに近い外野手を1人選出
    let closestOutfielder = null;
    let minScore = Infinity;

    // ★追加: 本塁(BASES[0])からの距離が450未満でフェンスに当たっている場合は追わない
    const distFromHome = Math.hypot(ball.x - BASES[0].x, ball.y - BASES[0].y);
    const ignoreFenceNearHome = ball.hasHitFence && distFromHome < 450;

    // ★修正: 追尾すべき状況かつ、近距離フェンス直撃時ではない場合のみ選出を行う
    if (outfieldersShouldMove && !ignoreFenceNearHome) {
      const v2 = ball.vx * ball.vx + ball.vy * ball.vy;

      aiFielders.forEach(f => {
        if (['レフト', 'センター', 'ライト'].includes(f.name)) {
          let score;

          if (ball.hasHitFence) {
            score = Math.hypot(ball.x - f.x, ball.y - f.y) / f.speed;
          } 
          else if (v2 > 0) {
            const t = ((f.x - ball.x) * ball.vx + (f.y - ball.y) * ball.vy) / v2;
            const px = ball.x + t * ball.vx;
            const py = ball.y + t * ball.vy;
            const distToLine = Math.hypot(f.x - px, f.y - py);
            
            if (t > 0) {
              const fielderTime = distToLine / f.speed;
              
              if (fielderTime < t + 20) {
                score = fielderTime;
              } 
              else if (ball.predictedFencePoint) {
                score = Math.hypot(ball.predictedFencePoint.x - f.x, ball.predictedFencePoint.y - f.y) / f.speed;
              } else {
                score = fielderTime;
              }
            } else {
              score = Math.hypot(ball.x - f.x, ball.y - f.y) / f.speed;
            }
          } else {
            score = Math.hypot(ball.x - f.x, ball.y - f.y) / f.speed;
          }

          if (score < minScore) {
            minScore = score;
            closestOutfielder = f;
          }
        }
      });
    }

    aiFielders.forEach(f => {
      let isOutfielder = ['レフト', 'センター', 'ライト'].includes(f.name);
      let targetX = f.x;
      let targetY = f.y;

      // 内野手・キャッチャーの定位置/カバー移動
      if (f.name === 'ファースト') { targetX = BASES[1].x; targetY = BASES[1].y; }
      if (f.name === 'サード')     { targetX = BASES[3].x; targetY = BASES[3].y; }
      if (f.name === 'ショート' || f.name === 'セカンド') { targetX = BASES[2].x; targetY = BASES[2].y; }
      if (f.name === 'キャッチャー') { targetX = BASES[0].x; targetY = BASES[0].y; }

      // ピッチャーの1塁カバー判定
      if (f.name === 'ピッチャー') {
        // ★ 変更：毎フレームの判定を削除し、開始時に決めたフラグを使用する
        // hitTickから60（約1秒）経過したかを確認
        const isDelayFinished = gameTick > hitTick + 60;

        if (isPitcherCovering1B && isDelayFinished) {
          // 条件を満たし、かつ1秒経過したら1塁へ走る
          targetX = BASES[1].x;
          targetY = BASES[1].y;
        } else {
          // それまではマウンドにとどまる
          targetX = 0;   
          targetY = 150;
        }
      }

      // 外野手の制御
      if (isOutfielder) {
        if (f === closestOutfielder) {
          const v2 = ball.vx * ball.vx + ball.vy * ball.vy;
          
          if (ball.hasHitFence) {
            targetX = ball.x;
            targetY = ball.y;
          } else if (v2 > 0 && !isWaitingNextPlay) {
            const t = ((f.x - ball.x) * ball.vx + (f.y - ball.y) * ball.vy) / v2;
            const px = ball.x + t * ball.vx;
            const py = ball.y + t * ball.vy;
            const distToLine = Math.hypot(f.x - px, f.y - py);
            const fielderTime = distToLine / f.speed;

            if (t > 0 && fielderTime < t + 20) {
              if (distToLine > 10) {
                targetX = px;
                targetY = py;
              } else {
                targetX = ball.x;
                targetY = ball.y;
              }
            } else if (ball.predictedFencePoint) {
              targetX = ball.predictedFencePoint.x;
              targetY = ball.predictedFencePoint.y;
            } else if (t > 0) {
              targetX = px;
              targetY = py;
            } else {
              targetX = ball.x;
              targetY = ball.y;
            }
          } else {
             targetX = ball.x;
             targetY = ball.y;
          }
        } else {
          f.state = 'IDLE';
          return; // 担当以外の外野手は待機
        }
      }

      // 移動処理
      let dx = targetX - f.x;
      let dy = targetY - f.y;
      let dist = Math.hypot(dx, dy);
      
      if (dist > 2) { 
        f.x += (dx / dist) * f.speed * dt;
        f.y += (dy / dist) * f.speed * dt;
        f.state = 'RUN';
      } else {
        f.state = 'IDLE';
      }

      // ▼▼▼ ここから追加：観客席への侵入を防ぎ、フェンス沿いに移動させる ▼▼▼
      if (!ctx.isPointInPath(fieldPath, f.x, f.y)) {
        const distToCenter = Math.hypot(f.x, f.y);
        // 外野フェンス（円弧）付近の場合は、原点(0,0)方向へ押し戻す
        if (distToCenter > 1500) {
          f.x -= (f.x / distToCenter) * (f.speed * dt + 1);
          f.y -= (f.y / distToCenter) * (f.speed * dt + 1);
        } else {
          // ファウルゾーンなどの場合はホームベース方向へ押し戻す
          const angleToHome = Math.atan2(BASES[0].y - f.y, BASES[0].x - f.x);
          f.x += Math.cos(angleToHome) * (f.speed * dt + 1);
          f.y += Math.sin(angleToHome) * (f.speed * dt + 1);
        }
      }
      // ▲▲▲ 追加ここまで ▲▲▲

      // 外野手の自動捕球時
      if (isOutfielder && f === closestOutfielder) {
        const distToBall = Math.hypot(ball.x - f.x, ball.y - f.y);
        
// 変更後: 送球(THROWN)であっても、外野手自身の送球(isFielderThrow)なら再捕球しない
if (distToBall < 35 && (ball.state === 'ROLLING' || (ball.state === 'THROWN' && !ball.isFielderThrow))) {
  ball.vx = 0; 
  ball.vy = 0;
  ball.state = 'OF_HELD';
  ball.x = f.x; 
  ball.y = f.y;
  ball.ofHeldTick = gameTick;
  // ...

          if (!currentPlayError && !ball.isTouchedByInfielder) {
            if (!currentPlayHit) { 
              if (typeof isVsMode !== 'undefined' && isVsMode && isTopInning) {
                playerHits++;
              } else {
                opponentHits++;
              }
              currentGameStats.pitcher.hits++; 
              currentPlayHit = true; 
            }
            statusDisplay.innerText = `ヒット！捕球！`;
          } else {
            statusDisplay.innerText = `捕球！`;
          }
        }

        // 外野手がボールを保持している状態
        if (ball.state === 'OF_HELD') {
          ball.x = f.x;
          ball.y = f.y;
          
          // ★ 30フレーム（約0.5秒）経過後に送球
          if (gameTick > ball.ofHeldTick + 60) {
            const targetBase = BASES[2]; 
            const angle = Math.atan2(targetBase.y - ball.y, targetBase.x - ball.x);
            const speed = 8.5; 
            
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
            ball.state = 'THROWN';
            ball.isFielderThrow = true;

            ball.throwStartX = ball.x;
            ball.throwStartY = ball.y;

            ball.sourceBaseIndex = -1;
            isWaitingNextPlay = false; // ★ 送球中は次のプレイ待ちを解除
            playResolved = false;      // ★ プレイ判定を継続
            statusDisplay.innerText = `外野から2塁へ送球！`;
          }
        }
      }
    });

  // 3. タッチアウト判定
  runners.forEach(r => {
    if (r.isOut || r.reached) return;

    let isTagged = false;

    if (ball.state === 'HELD' && Math.hypot(player.x - r.x, player.y - r.y) < 30) {
      isTagged = true;
    } 
    else if (ball.state === 'CAUGHT' && Math.hypot(ball.x - r.x, ball.y - r.y) < 30) {
      isTagged = true;
    }

    if (isTagged) {
      r.isOut = true;
      outs++;
      currentGameStats.pitcher.outs++; 
      
      // ★ 追加: 第3アウトがフォース状態の走者へのタッチアウトの場合も得点取り消し
      if (outs === 3 && isForceRunner(r, runners)) {
        cancelRunsScoredThisPlay();
      }

      statusDisplay.innerText = `タッチアウト！`;
      updateScoreBoard();

      // ★ タッチアウト（塁上以外）: 4 → 6 の順で再生
      if (typeof triggerTutorialStep === 'function') {
        if (!tutorialStep4Done) {
          triggerTutorialStep(4);
          setTimeout(() => {
            if (!tutorialStep6Done) triggerTutorialStep(6);
          }, 4500);
        } else if (!tutorialStep6Done) {
          triggerTutorialStep(6);
        }
      }
    }
  });

  if (ball.state === 'ROLLING') {
    // ★ 追加：移動前の座標を記録
    ball.prevX = ball.x;
    ball.prevY = ball.y;

    ball.x += ball.vx * dt; 
    ball.y += ball.vy * dt;
  } else if (ball.state === 'HELD') {
    ball.errorProcessed = false; 
    ball.x = player.x; ball.y = player.y - 5;
    BASES.forEach((base, index) => {
      if (Math.hypot(player.x - base.x, player.y - base.y) < base.radius * 0.8) {
        
        relayMode = true; 
        relayBaseIndex = index;
        ball.state = 'CAUGHT';
        
        player.x = base.x;
        player.y = base.y;
        ball.x = base.x; 
        ball.y = base.y;
        
        let gotOut = attemptForceOut(index);
  
        if (gotOut) {
          // ★ 塁上アウト: 4 → 5 → 6 の順で連鎖再生
          if (typeof triggerTutorialStep === 'function') {
            if (!tutorialStep4Done) {
              triggerTutorialStep(4);
              setTimeout(() => {
                if (!tutorialStep5Done) {
                  triggerTutorialStep(5);
                  setTimeout(() => {
                    if (!tutorialStep6Done) triggerTutorialStep(6);
                  }, 4500);
                } else if (!tutorialStep6Done) {
                  triggerTutorialStep(6);
                }
              }, 4500);
            } else if (!tutorialStep5Done) {
              triggerTutorialStep(5);
              setTimeout(() => {
                if (!tutorialStep6Done) triggerTutorialStep(6);
              }, 4500);
            } else if (!tutorialStep6Done) {
              triggerTutorialStep(6);
            }
          }
        } else {
          // ★ アウト不成立（セーフ）時: 5 → 6 の順で再生
          statusDisplay.innerText = `【ベース到達】${base.name}に入った！どこへ投げる？`;
          if (typeof triggerTutorialStep === 'function') {
            if (!tutorialStep5Done) {
              triggerTutorialStep(5);
              setTimeout(() => {
                if (!tutorialStep6Done) triggerTutorialStep(6);
              }, 4500);
            } else if (!tutorialStep6Done) {
              triggerTutorialStep(6);
            }
          }
        }
      }
    });
  } else if (ball.state === 'THROWN') {
    ball.prevX = ball.x;
    ball.prevY = ball.y;

    // ★ 投げた瞬間の座標を記録
    if (ball.throwStartX === undefined) {
      ball.throwStartX = ball.x;
      ball.throwStartY = ball.y;
    }

    // ★ 投げた地点からの飛距離を計算
    const travelDist = Math.hypot(ball.x - ball.throwStartX, ball.y - ball.throwStartY);

    // ★ 変更：飛距離が600pxを超え、かつ「野手の送球ではない」場合は転がり状態(ROLLING)にする
    if (travelDist > 600 && !ball.isFielderThrow) {
      ball.state = 'ROLLING'; // 送球から転がる打球状態へ変更

      // 地面を転がる際の摩擦減速
      const GROUND_FRICTION = 0.99; // 摩擦係数（数値が小さいほど急減速）
      const drag = Math.pow(GROUND_FRICTION, dt);
      ball.vx *= drag;
      ball.vy *= drag;
    }

    ball.x += ball.vx * dt; 
    ball.y += ball.vy * dt;

    let targetCamX = ball.x - WORLD_WIDTH / 2;
    let targetCamY = ball.y - WORLD_HEIGHT / 2;

    camera.x += (targetCamX - camera.x) * 0.15;
    camera.y += (targetCamY - camera.y) * 0.15;

BASES.forEach((base, index) => {
  if (index !== ball.sourceBaseIndex && Math.hypot(ball.x - base.x, ball.y - base.y) < base.radius) {
    let isCovered = Math.hypot(player.x - base.x, player.y - base.y) < base.radius ||
                    aiFielders.some(f => Math.hypot(f.x - base.x, f.y - base.y) < base.radius);

    if (isCovered) {
      ball.vx = 0; ball.vy = 0;
      ball.x = base.x; ball.y = base.y;
      ball.state = 'CAUGHT';
      relayMode = true;
      relayBaseIndex = index;
      throwAimAngle = 0; 

      let gotOut = attemptForceOut(index);

      if (gotOut) {
        // ★ 4 → 5 → 6 を安全に順番再生
        if (typeof runTutorialSequence === 'function') {
          runTutorialSequence([4, 5, 6]);
        }
      } else {
        statusDisplay.innerText = `【中継】${base.name}から送球しろ！`;
        // セーフ時（5 → 6）
        if (typeof runTutorialSequence === 'function') {
          runTutorialSequence([5, 6]);
        }
      }
    } else {
      triggerThrowError();
    }
  }
});

  } else if (ball.state === 'CAUGHT') {
    let targetCamX = ball.x - WORLD_WIDTH / 2;
    let targetCamY = ball.y - WORLD_HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * 0.1;
    camera.y += (targetCamY - camera.y) * 0.1;
  }

  // ★ 追加：内野手がボールに触れたかの判定（ボールをHELDしたのが内野ポジションか）
  if (ball.state === 'HELD') {
    const isInfielder = !['レフト', 'センター', 'ライト'].includes(currentPosition.name);
    if (isInfielder) {
      ball.isTouchedByInfielder = true;
    }
  }

  // ★ 追加：2塁ランナーの足止め解除判定（本塁からの距離が700を超えたか）
  if (ball.state !== 'WAITING') {
    const distFromHome = Math.hypot(ball.x - BASES[0].x, ball.y - BASES[0].y);
    if (distFromHome > 700 && !ball.isDistanceExceeded700) {
      ball.isDistanceExceeded700 = true; // 初回のみ判定する
      
      // 内野手が一度も触れていなければ解除
      if (!ball.isTouchedByInfielder) {
        runners.forEach(r => {
          if (r.isHoldingForLeftHit && !r.isOut) {
            r.nextBase = 3;
            r.finalBase = 3; // 3塁へ向かわせる
            r.reached = false; // 移動再開
            r.isHoldingForLeftHit = false; // フラグを解除
          }
        });
      }
    }
  }

  // ★ フェンス接触時の処理（エリア判定による確実な跳ね返り）
  if (ball.state === 'ROLLING' || ball.state === 'THROWN') {
    if (!ctx.isPointInPath(fieldPath, ball.x, ball.y)) {
      
      // 1. 直前の「グラウンド内座標」へ復元
      if (ball.prevX !== undefined && ball.prevY !== undefined) {
        ball.x = ball.prevX;
        ball.y = ball.prevY;
      }

      const home = BASES[0];
      const distCenter = Math.hypot(ball.x, ball.y);
      const distHome = Math.hypot(ball.x - home.x, ball.y - home.y);

      // 2. ボールの位置から正しい壁の「内向き法線ベクトル」を判定
      let nx, ny;

      if (distCenter > 1100) {
        // 【外野フェンスエリア】中心(0,0)に向かって跳ね返す
        nx = -ball.x / (distCenter || 1);
        ny = -ball.y / (distCenter || 1);
      } else if (ball.y < home.y && distHome > 180) {
        // 【バックネットエリア】本塁(home)に向かって跳ね返す
        nx = (home.x - ball.x) / (distHome || 1);
        ny = (home.y - ball.y) / (distHome || 1);
      } else if (ball.x < 0) {
        // 【1塁側ファウルエリア】グラウンド内側（右下）へ跳ね返す
        nx = Math.cos(angle1 - Math.PI / 2);
        ny = Math.sin(angle1 - Math.PI / 2);
      } else {
        // 【3塁側ファウルエリア】グラウンド内側（左下）へ跳ね返す
        nx = Math.cos(angle3 + Math.PI / 2);
        ny = Math.sin(angle3 + Math.PI / 2);
      }

      // 3. 外に向かう速度成分（内積 < 0）を跳ね返す
      let dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        const bounce = 0.1; // 跳ね返り係数
        ball.vx = (ball.vx - 2 * dot * nx) * bounce;
        ball.vy = (ball.vy - 2 * dot * ny) * bounce;
      }

      // 4. 壁からの固着を防ぐため、内側へ押し戻し
      ball.x += nx * 4;
      ball.y += ny * 4;

      let safetyCounter = 0;
      while (!ctx.isPointInPath(fieldPath, ball.x, ball.y) && safetyCounter < 15) {
        ball.x += nx * 2;
        ball.y += ny * 2;
        safetyCounter++;
      }

      ball.hasHitFence = true; // ★ 追加：フェンスに当たったことを記録

      ball.state = 'ROLLING'; 

      if (ball.isErrant) {
      ball.isErrant = false; // 1回の悪送球につき1度だけ処理
      ball.errantFenceCount = (ball.errantFenceCount || 0) + 1;

      statusDisplay.innerText = `悪送球がフェンス直撃！走者進塁！`;

      const hasActiveRunner = runners.some(r => !r.isOut);
        if (typeof triggerTutorialStep === 'function' && hasActiveRunner) {
          triggerTutorialStep(7);
        }

      runners.forEach(r => {
        if (!r.isOut) {
          if (ball.errantFenceCount === 1) {
            // ★ 修正: 自重していた2塁ランナーは3塁止めにし、その他は2進塁（本塁など）とする
            if (r.isHoldingForLeftHit) {
              r.finalBase = 3;
            } else {
              r.finalBase = Math.min(4, r.startBase + 2);
            }
          } else {
            // 2回目以降の悪送球フェンス直撃: 現在の目標からさらに+1進塁
            r.finalBase = Math.min(4, r.finalBase + 1);
          }
          r.reached = false; // 再び走らせる
        }
      });
    }

    ball.state = 'ROLLING'; 

    if (!isWaitingNextPlay) {
      statusDisplay.innerText = "フェンス直撃！走者の進塁完了を待機中...";
      isWaitingNextPlay = true;
      nextPlayDelay = 120;
    }

    }
  }

  // 5. 走者の移動処理
  runners.forEach(r => {
    if (r.isOut || r.reached) return;

    const targetBaseIndex = r.nextBase % 4;
    const target = BASES[targetBaseIndex];
    
    const angle = Math.atan2(target.y - r.y, target.x - r.x);
    r.x += Math.cos(angle) * r.speed * dt;
    r.y += Math.sin(angle) * r.speed * dt;

    if (Math.hypot(r.x - target.x, r.y - target.y) < 15) {
      r.x = target.x; 
      r.y = target.y;

      if (r.nextBase < r.finalBase) {
        r.nextBase++;
      } else {
        r.reached = true;
      }

      // update() 内（1050行目付近：走者の本塁到達時）
      if (r.nextBase >= 4 && !r.scoreProcessed) { 
        r.scoreProcessed = true; // 二重カウント防止

        const isRunnerReachedByError = !!r.reachedByError; 
        const isScoredByError = !!r.advancedByError || currentPlayError; 

        if (outs < 3) {
          // ★ 対戦モード時は表なら先攻(1P)、裏なら後攻(2P)に得点加算
          if (typeof isVsMode !== 'undefined' && isVsMode) {
            if (isTopInning) {
              playerScore++;
              playerInningScores[currentInning - 1] = (playerInningScores[currentInning - 1] || 0) + 1;
            } else {
              opponentScore++;
              opponentInningScores[currentInning - 1] = (opponentInningScores[currentInning - 1] || 0) + 1;
            }
          } else {
            opponentScore++;
            opponentInningScores[currentInning - 1] = (opponentInningScores[currentInning - 1] || 0) + 1;
          }

          currentGameStats.pitcher.runs++; 

          if (!isRunnerReachedByError && !isScoredByError) {
            currentGameStats.pitcher.er++;
          }

          // ★ 追加：得点取り消し用に記録
          if (!ball.scoredRunnersThisPlay) ball.scoredRunnersThisPlay = [];
          ball.scoredRunnersThisPlay.push(r);

          if (isRunnerReachedByError || isScoredByError) {
            statusDisplay.innerText = "【ホームイン！】 エラーにより失点しました！";
          } else {
            statusDisplay.innerText = "【ホームイン！】 失点しました！";
          }

          updateScoreBoard();

          if (isPlayerFirst && !isTopInning && currentInning >= 9) {
             if (opponentScore > playerScore) {
                statusDisplay.innerText = "【サヨナラ負け】 試合終了...";
                outs = 3; 
             }
          }
        }
      }
    }
  });

  // 本塁到達済みの走者を消去
  runners = runners.filter(r => !(r.reached && r.nextBase >= 4));

  checkPlayEnd(); 

  // 6. プレイ終了・イニング進行制御
  if (isWaitingNextPlay) {
    const allRunnersStopped = runners.every(r => r.reached || r.isOut);

    if (allRunnersStopped && !ball.batterAdvanced && outs < 3) {
      advanceBatterIndex(); // ★書き換え
      updateBatterDisplay(true);
    }

    if (isHoldingBtn) {
      statusDisplay.innerText = "【一時停止】 塁状況を確認中...";
    } else if (!allRunnersStopped) {
      if (outs < 3) statusDisplay.innerText = "走者の進塁完了を待機中...";
    } else {
      if (outs >= 3) {
        statusDisplay.innerText = `【${currentInning}回裏 終了】 3アウトチェンジ！`;
      } else {
        statusDisplay.innerText = "プレイ終了。右ボタン長押しで確認可能...";
      }

      nextPlayDelay -= dt;
      if (nextPlayDelay <= 0) {
        isWaitingNextPlay = false;

       if (!playResolved) {
          playResolved = true;
          advanceBatterIndex(); // ★書き換え
        }

        // 6. プレイ終了・イニング進行制御
if (outs >= 3) {

  // ★【追加】チェンジ時に得点が記録されていなければ 0 をセットして表示を更新
  if (isTopInning) {
    const awayScores = isPlayerFirst ? playerInningScores : opponentInningScores;
    if (awayScores[currentInning - 1] === undefined) awayScores[currentInning - 1] = 0;
  } else {
    const homeScores = isPlayerFirst ? opponentInningScores : playerInningScores;
    if (homeScores[currentInning - 1] === undefined) homeScores[currentInning - 1] = 0;
  }
  updateScoreBoard(); // 確定した 0 を画面に反映

  let isGameOver = false;
  let homeScore = isPlayerFirst ? opponentScore : playerScore;
  let awayScore = isPlayerFirst ? playerScore : opponentScore;

  if (currentInning >= 9) {
    if (isTopInning && homeScore > awayScore) {
       isGameOver = true; // 先行が攻撃終了し、後攻がリード
    } else if (!isTopInning && homeScore !== awayScore) {
       isGameOver = true; // 後攻が攻撃終了し、同点ではない
    } else if (!isTopInning && currentInning === 18 && homeScore === awayScore) {
       isGameOver = true; // ★追加：18回裏終了時点で同点なら引き分け終了
    }
  }

  if (isGameOver) {
    statusDisplay.innerText = `試合終了！`;
    showGameResult();
  } else {
    // ★ 同点の場合はここを通って延長戦に入ります
    if (isTopInning) {
      isTopInning = false;
    } else {
      currentInning++;
      isTopInning = true;
    }
    startInning();
  }
} else {
  hitBall();
}
      }
    }
  }

  // 7. 描画処理
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // 7-1. 観客席（スタンド）背景
  ctx.fillStyle = '#222222';
  ctx.fillRect(-2000, -2000, 4000, 4000);

  // 7-2. フィールド境界計算と芝生描画
  ctx.fillStyle = '#2e8b57';
  ctx.fill(fieldPath);

  // 7-3. 外野およびファウルゾーンのフェンス
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 10;
  ctx.stroke(fieldPath);

  // 7-4. 塁間ライン（土）
  ctx.strokeStyle = '#c2a649';
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(base1.x, base1.y);
  ctx.lineTo(BASES[2].x, BASES[2].y);
  ctx.lineTo(base3.x, base3.y);
  ctx.closePath();
  ctx.stroke();

  // 7-5. ピッチャーマウンド & プレート
  ctx.fillStyle = '#c2a649';
  ctx.beginPath();
  ctx.arc(0, 150, 30, 0, Math.PI * 2); // 座標が固定値になっていますが、必要に応じて調整してください
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-10, 147, 20, 6);

  // 7-6. ファウルライン
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(pole1.x, pole1.y); // 計算したポールまで引く
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(pole3.x, pole3.y);
  ctx.stroke();

  // 7-7. ベース
  ctx.fillStyle = '#ffffff';
  BASES.forEach(base => {
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.rotate(45 * Math.PI / 180); // ★ 45度回転
    ctx.fillRect(-15, -15, 30, 30); // 中心を合わせて30x30の四角形を描画
    ctx.restore();
  });

  // 7-8. 走者
  runners.forEach(r => {
    if (!r.isOut) drawDotCharacter(ctx, r.x, r.y, '#1e88e5', true, gameTick); 
  });

  // 7-9. 送球矢印
  const showThrowArrow = localStorage.getItem('setting_show_throw_arrow') !== 'false';
  const isHoldingBall = ball.state === 'HELD' || ball.state === 'CAUGHT' || ball.state === 'OF_HELD';

  // ★ 変更: トグルがON、または塁上にいる(relayMode)場合は矢印を表示する
  if (isHoldingBall && (moveVector.x !== 0 || moveVector.y !== 0) && (showThrowArrow || relayMode)) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    
    // 中継モード時は throwAimAngle、それ以外はパッド入力の moveVector から角度を計算
    const arrowAngle = relayMode ? throwAimAngle : Math.atan2(moveVector.y, moveVector.x);
    ctx.rotate(arrowAngle);
    
    ctx.translate(40, 0);
    ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(-5, 10); ctx.lineTo(-5, 4);
    ctx.lineTo(-25, 4); ctx.lineTo(-25, -4); ctx.lineTo(-5, -4);
    ctx.lineTo(-5, -10); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 7-10. 野手（自操作・AI・ピッチャー）
  drawDotCharacter(ctx, player.x, player.y, '#e53935', player.state === 'RUN', gameTick);
  
  aiFielders.forEach(f => {
    drawDotCharacter(ctx, f.x, f.y, '#e53935', f.state === 'RUN', gameTick);
  });

  // ボール保持者の描画部分
  if (['HELD', 'CAUGHT', 'DEAD', 'OF_HELD'].includes(ball.state)) {
    let holderName = null;
    let holderX = 0;
    let holderY = 0;
    let minDist = 45;

    // 自操作プレイヤーとの距離
    const pDist = Math.hypot(player.x - ball.x, player.y - ball.y);
    if (pDist < minDist) {
      minDist = pDist;
      holderName = player.playerName;
      holderX = player.x;
      holderY = player.y;
    }

    // AI野手との距離
    aiFielders.forEach(f => {
      const fDist = Math.hypot(f.x - ball.x, f.y - ball.y);
      if (fDist < minDist) {
        minDist = fDist;
        holderName = f.playerName;
        holderX = f.x;
        holderY = f.y;
      }
    });

    // プレート描画
    if (holderName) {
      ctx.font = 'bold 17px Arial';
      const textWidth = ctx.measureText(holderName).width;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(holderX - textWidth / 2 - 6, holderY - 48, textWidth + 12, 24);
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(holderName, holderX, holderY - 36);
    }
  }

  // 7-11. ボール (跳ねる演出を追加)
  if (ball.state !== 'WAITING') {
    let bounceHeight = 0;
    
    if (ball.state === 'ROLLING') {
      // 速度が速いほど高く、ゲーム内時間(gameTick)を利用してサイン波でバウンドさせる
      let speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 1) {
        let period = 25 / speed; // 速いほど小刻みに跳ねる
        bounceHeight = Math.abs(Math.sin(gameTick / period)) * (speed * 1.5);
      }
    } else if (ball.state === 'THROWN') {
      // 送球時は少し浮いているように見せる
      bounceHeight = 15; 
    } else if (ball.state === 'CAUGHT' || ball.state === 'HELD' || ball.state === 'OF_HELD') {
      // 野手が持っている時は胸の高さくらい
      bounceHeight = 12; 
    }

    // ① 影の描画 (野手が持っていない時だけ描画)
    if (!['HELD', 'CAUGHT', 'OF_HELD'].includes(ball.state)) {
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y, ball.radius * 0.8, ball.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
    }

    // ② ボール本体の描画 (Y座標を bounceHeight 分だけ上にずらす)
    ctx.beginPath();
    ctx.arc(ball.x, ball.y - bounceHeight, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
  drawRunnerUI(ctx);
}

function drawDotCharacter(ctx, x, y, color, isRunning, tick) {
  ctx.save();
  ctx.translate(x, y);
  
  // ★ ここを 1.8 から 3.6 に変更してサイズを2倍に
  const p = 2.4; 
  
  const animFrame = Math.floor(tick / 8) % 4;

  ctx.fillStyle = color;
  ctx.fillRect(-4*p, -3*p, 8*p, 6*p);
  ctx.fillStyle = '#ffffff';
  let leftLegY = 2*p, rightLegY = 2*p;
  if (isRunning) {
    if (animFrame === 0) { leftLegY += 2*p; rightLegY -= 2*p; }
    else if (animFrame === 2) { leftLegY -= 2*p; rightLegY += 2*p; }
  }
  ctx.fillRect(-3*p, leftLegY, 2.5*p, 5*p);
  ctx.fillRect(1*p, rightLegY, 2.5*p, 5*p);
  ctx.fillStyle = '#ffcc99';
  ctx.fillRect(-3*p, -8*p, 6*p, 5*p);
  ctx.restore();
}

function drawRunnerUI(ctx) {
  ctx.save();
  // 画面右上を基準にする
  ctx.setTransform(1, 0, 0, 1, 0, 0); 
  ctx.translate(WORLD_WIDTH - 60, 65); 

  // --- 1. ランナー状況の塁間ライン描画 ---
  const uiRot = localStorage.getItem('setting_rotate_runner_ui') === 'true' ? -1 : 1;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 20 * uiRot);  
  ctx.lineTo(-20 * uiRot, 0); 
  ctx.lineTo(0, -20 * uiRot); 
  ctx.lineTo(20 * uiRot, 0);  
  ctx.closePath();
  ctx.stroke();

  // ランナーの有無を判定
  let has1B = false, has2B = false, has3B = false;
  runners.forEach(r => {
    if (r.isOut) return;
    const currentBase = (r.reached ? r.finalBase : r.startBase) % 4;
    if (currentBase === 1) has1B = true;
    if (currentBase === 2) has2B = true;
    if (currentBase === 3) has3B = true;
  });

  const drawBase = (x, y, isOccupied) => {
    ctx.fillStyle = isOccupied ? '#ffeb3b' : 'rgba(50, 50, 50, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  drawBase(20 * uiRot, 0, has1B);         // 1塁
  drawBase(0, -20 * uiRot, has2B);        // 2塁
  drawBase(-20 * uiRot, 0, has3B);        // 3塁

  // --- 2. アウトカウントの描画 ---
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('O', -90, 0); 

  // アウトカウントの赤い丸を2つ描画
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(-75 + i * 15, 0, 5.5, 0, Math.PI * 2);
    
    if (outs > i) {
      ctx.fillStyle = '#ff3333';
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();
    }
    
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // --- 3. 追加：Hランプ・Eランプの描画 ---
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  
  // Hランプ (敵のヒットで緑色に点灯)
  ctx.fillStyle = currentPlayHit ? '#00ff00' : 'rgba(100, 100, 100, 0.5)';
  ctx.fillText('H', -140, 0);

  // Eランプ (味方のエラーで赤色に点灯)
  ctx.fillStyle = currentPlayError ? '#ff3333' : 'rgba(100, 100, 100, 0.5)';
  ctx.fillText('E', -115, 0);

  /// --- 4. 変更：イニングとスコア表示（さらに左側へ） ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'right';
  
  let displayInning = typeof currentInning !== 'undefined' ? currentInning : 1;
  let topOrBottom = isTopInning ? "表" : "裏";

  let awayScoreDisplay, homeScoreDisplay;
  let awayInitial, homeInitial;

  // ★修正：対戦モード・ストーリーモードで先攻/後攻を正しく判定
  if (typeof isVsMode !== 'undefined' && isVsMode) {
    awayInitial = vsP1Config?.name ? vsP1Config.name.charAt(0) : 'A';
    homeInitial = vsP2Config?.name ? vsP2Config.name.charAt(0) : 'B';
    awayScoreDisplay = playerScore;
    homeScoreDisplay = opponentScore;
  } else {
    const myInitial = typeof mySchoolName !== 'undefined' && mySchoolName ? mySchoolName.charAt(0) : '味';
    const oppInitial = typeof getOpponentSchoolName === 'function' && getOpponentSchoolName() ? getOpponentSchoolName().charAt(0) : '敵';
    
    if (isPlayerFirst) {
      awayInitial = myInitial;
      homeInitial = oppInitial;
      awayScoreDisplay = playerScore;
      homeScoreDisplay = opponentScore;
    } else {
      awayInitial = oppInitial;
      homeInitial = myInitial;
      awayScoreDisplay = opponentScore;
      homeScoreDisplay = playerScore;
    }
  }

  ctx.fillText(`${displayInning}回${topOrBottom}   ${awayInitial} ${awayScoreDisplay} - ${homeScoreDisplay} ${homeInitial}`, -165, 0);
  ctx.restore();
}

function showGameResult() {
  finalizeGameStats(); 
  isPlaying = false;

  // 投手成績集計処理（試合終了時に登板数・成績をまとめて加算）
  if (typeof isPracticeMode !== 'undefined' && !isPracticeMode) {
    let stats = getStoryStats();
    stats.pitcher.games++; // ★ 試合終了時に登板数をカウント
    stats.pitcher.outs += (currentInning - 1) * 3 + outs; // 取ったアウト数
    stats.pitcher.hits += opponentHits; // 被安打
    stats.pitcher.runs += opponentScore; // 失点
    saveStoryStats(stats);
  }

  const oldResult = document.getElementById('result-screen');
  if (oldResult) oldResult.remove();

  updateScoreBoard(); 

  let isWin = playerScore > opponentScore;

  if (isWin) {
    console.log("勝利！次は Lv." + (currentLevelIndex + 2));
  } else {
    console.log("敗北…。もう一度同じチームと対戦します。");
  }
  
  const resultScreen = document.createElement('div');
  resultScreen.id = 'result-screen';
  resultScreen.style.position = 'absolute';
  resultScreen.style.top = '0';
  resultScreen.style.left = '0';
  resultScreen.style.width = '100%';
  resultScreen.style.height = '100%';
  resultScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
  resultScreen.style.zIndex = '200';
  resultScreen.style.display = 'flex';
  resultScreen.style.flexDirection = 'column';
  resultScreen.style.alignItems = 'center';
  resultScreen.style.color = 'white';
  resultScreen.style.padding = '30px 20px';

  const resultHeader = document.createElement('div');
  let resultText = isWin ? "【勝利！】" : (playerScore < opponentScore ? "【敗北...】" : "【引き分け】");
  
  resultHeader.innerHTML = `試合終了<br><span style="color: #ff4081; font-size: 24px; display: inline-block; margin-top: 10px;">${resultText}</span>`;
  resultHeader.style.fontSize = '18px';
  resultHeader.style.fontWeight = 'bold';
  resultHeader.style.textAlign = 'center';
  resultHeader.style.borderBottom = '2px solid #fff';
  resultHeader.style.paddingBottom = '15px';
  resultHeader.style.marginBottom = '20px';
  resultHeader.style.width = '100%';
  resultScreen.appendChild(resultHeader);

  const sb = document.getElementById('score-board');
  if (sb) {
    sb.style.position = 'static'; 
    sb.style.transform = 'none';
    sb.style.width = '100%';
    sb.style.margin = '0 0 20px 0';
    resultScreen.appendChild(sb); 
  }

  const spacer = document.createElement('div');
  spacer.style.flex = '1';
  resultScreen.appendChild(spacer);

  const hrDiv = document.createElement('div');
  hrDiv.id = 'hr-board';
  hrDiv.style.color = 'white';
  hrDiv.style.fontWeight = 'bold';
  hrDiv.style.textShadow = '1px 1px 2px black';
  hrDiv.style.fontSize = '16px';
  hrDiv.style.textAlign = 'center';
  hrDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  hrDiv.style.padding = '15px';
  hrDiv.style.borderRadius = '8px';
  hrDiv.style.width = '100%';
  hrDiv.style.marginBottom = '15px'; 

  let hrText = hrBatters.length > 0 ? hrBatters.join('、') : 'なし';
  hrDiv.innerHTML = `【本塁打】<br><span style="color: #ffcc00; font-size: 18px; display: inline-block; margin-top: 8px;">${hrText}</span>`;
  resultScreen.appendChild(hrDiv);

  const stageName = (typeof opponentData !== 'undefined' && opponentData.stage) 
    ? opponentData.stage 
    : `地方大会 ${currentLevelIndex + 1}回戦`;

  const stageDiv = document.createElement('div');
  stageDiv.innerText = stageName;
  stageDiv.style.color = '#a7f3d0';
  stageDiv.style.fontSize = '14px';
  stageDiv.style.fontWeight = 'bold';
  stageDiv.style.marginBottom = '12px';
  resultScreen.appendChild(stageDiv);

  // ★ ボタンコンテナを作成
  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '12px';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.flexWrap = 'wrap';
  btnContainer.style.marginBottom = '10px';

  // ボタン共通生成関数
  const createBtn = (text, bgColor, onClick) => {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.style.padding = '12px 20px';
    btn.style.fontSize = '15px';
    btn.style.fontWeight = 'bold';
    btn.style.color = 'white';
    btn.style.backgroundColor = bgColor;
    btn.style.border = 'none';
    btn.style.borderRadius = '25px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.4)';
    btn.onclick = () => {
      if (sb) sb.remove();
      resultScreen.remove();
      onClick();
    };
    return btn;
  };

  // --- ここから書き換え ---
  if (typeof isVsMode !== 'undefined' && isVsMode) {
    // 【① 対戦モード時のボタン】
    const newVsBtn = createBtn("新しい対戦", "#2196F3", () => {
      if (typeof showVsSetupScreen === 'function') showVsSetupScreen();
    });
    const homeBtn = createBtn("ホームに戻る", "#757575", () => {
      showHomeScreen();
    });

    btnContainer.appendChild(newVsBtn);
    btnContainer.appendChild(homeBtn);

  } else if (typeof isPracticeMode !== 'undefined' && isPracticeMode) {
    // 【② 練習試合モード時のボタン】
    const newPracticeBtn = createBtn("新しい練習試合", "#2196F3", () => {
      showPracticeSelectScreen();
    });
    const homeBtn = createBtn("ホームに戻る", "#757575", () => {
      showHomeScreen();
    });

    btnContainer.appendChild(newPracticeBtn);
    btnContainer.appendChild(homeBtn);

  } else {
    // 【③ ストーリーモード時のボタン】
    if (isWin) {
      // 勝利時：「次の試合へ」と「ホームに戻る」を表示
      const nextBtn = createBtn("次の試合へ", "#ff4081", () => {
        const currentLevel = currentLevelIndex + 1;
        const list = (typeof opponentList !== 'undefined') ? opponentList : [];

        // 最後の相手でない場合のみレベルを進める
        // （最後の相手の場合は currentLevelIndex がそのままになる）
        if (currentLevelIndex < list.length - 1) {
          currentLevelIndex++;
          localStorage.setItem('baseball_save_level', currentLevelIndex);
        }

        // アラートとリセットを削除し、シンプルに次(または同じ相手)の画面へ進む
        const proceedToNext = () => {
          updateOpponentDataByLevel();
          showOpponentScreen();
        };

        // レベルごとのストーリー分岐処理
        if (currentLevel === 5) {
          playStory(story1Data, proceedToNext);
        } else if (currentLevel === 10) {
          playStory(getStory2Data(), proceedToNext);
        } else {
          proceedToNext();
        }
      });

      const homeBtn = createBtn("ホームに戻る", "#757575", () => {
        // 勝利したレベル（1始まり）を先に計算
        const currentLevel = currentLevelIndex + 1; 
        const list = (typeof opponentList !== 'undefined') ? opponentList : [];

        // ★修正: こちらにも「最後の相手でない場合のみレベルを進める」処理を追加
        if (currentLevelIndex < list.length - 1) {
          currentLevelIndex++;
          localStorage.setItem('baseball_save_level', currentLevelIndex);
        }
        updateOpponentDataByLevel();

        // レベルごとのストーリー分岐処理
        if (currentLevel === 5) {
          playStory(story1Data, showHomeScreen);
        } else if (currentLevel === 10) {
          playStory(getStory2Data(), showHomeScreen);
        } else {
          showHomeScreen();
        }
      });

      btnContainer.appendChild(nextBtn);
      btnContainer.appendChild(homeBtn);
    } else {
      // 敗戦時：「ホーム画面に戻る」のみを表示し、押した際にエピローグを再生
      const homeBtn = createBtn("ホーム画面に戻る", "#757575", () => {
        let epilogue = null;
        if (typeof getEpilogueLoseData === 'function') {
          const stageName = (typeof opponentData !== 'undefined' && opponentData.stage) 
            ? opponentData.stage 
            : `地方大会 ${currentLevelIndex + 1}回戦`;
          epilogue = getEpilogueLoseData(stageName);
        }

        if (!epilogue || epilogue.length === 0) {
          epilogue = (opponentData && opponentData.epilogue) || (typeof epilogueData !== 'undefined' ? epilogueData : null);
        }

        if (epilogue && epilogue.length > 0) {
          localStorage.setItem('baseball_epilogue_seen', 'true');
          playStory(epilogue, () => {
            showHomeScreen();
          });
        } else {
          showHomeScreen();
        }
      });

      btnContainer.appendChild(homeBtn);
    }
  }

  resultScreen.appendChild(btnContainer);

  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.appendChild(resultScreen);
  } else {
    document.body.appendChild(resultScreen);
  }
}

function resetGameState() {
  // ★ リセット時にもチュートリアル用ストレージを消去する
  localStorage.removeItem('baseball_tutorial_completed');
  localStorage.removeItem('tutorial_basic_completed');
  localStorage.removeItem('tutorial_step4_done');
  localStorage.removeItem('tutorial_step5_done');

  outs = 0;
  playStartOuts = 0;
  currentInning = 1;
  isTopInning = true;
  isPlayerFirst = Math.random() < 0.5;
  playerScore = 0;
  opponentScore = 0;
  playerHits = 0;
  opponentHits = 0;
  playerErrors = 0;
  opponentErrors = 0;
  currentPlayHit = false;
  currentPlayError = false;
  isPitcherCovering1B = false;

  playerInningScores = [];
  opponentInningScores = [];
  hrBatters = [];
  playerBatterIndex = 0;
  opponentBatterIndex = 0;

  runners = [];
  isWaitingNextPlay = false;
  playResolved = true;

  if (typeof isPaused !== 'undefined') {
    isPaused = false;
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ★ ボール・プレイヤー・AIの状態をクリア
  ball.state = 'WAITING';
  ball.vx = 0;
  ball.vy = 0;
  ball.x = BASES[0].x;
  ball.y = BASES[0].y;
  
  if (typeof currentPosition !== 'undefined') {
    player.x = currentPosition.x;
    player.y = currentPosition.y;
  }
  player.state = 'IDLE';
  player.hasThrown = false;
  aiFielders = [];
  
  const attackScreen = document.getElementById('attack-screen');
  if (attackScreen) attackScreen.classList.add('hidden');

  // ★ 追加: ゲームリセット時に打席バナーを確実に非表示にする
  const batterDisplay = document.getElementById('batter-display');
  if (batterDisplay) batterDisplay.style.display = 'none';

  vsP1BatterIndex = 0;
  vsP2BatterIndex = 0;

  // ★ 確実にチュートリアルモードを有効化
  isTutorialMode = checkIsTutorialMode();
  currentTutorialStep = 0;
  tutorialBasicCompleted = false;
  tutorialStep4Done = false;
  tutorialStep5Done = false;

}

function startGame() {
  initCurrentGameStats();
  runners = []; // ランナー配列を空にする
  outs = 0;
  currentInning = 1;
  isTopInning = true;
  isPlaying = true;
  
  if (hitBallTimer) clearTimeout(hitBallTimer); // タイマーリセット
  
  resetGameState();
  updateScoreBoard();
  startInning();
}

function updateOpponentDataByLevel() {
  if (typeof isPracticeMode === 'undefined' || !isPracticeMode) {
    currentLevelIndex = parseInt(localStorage.getItem('baseball_save_level')) || 0;
  }
  
  const list = (typeof opponentList !== 'undefined' && opponentList.length > 0) ? opponentList : [];
  if (list.length > 0) {
    if (currentLevelIndex >= list.length) {
      currentLevelIndex = list.length - 1;
    }
    opponentData = list[currentLevelIndex];
    OPPONENT_BATTERS = opponentData.batters || [];
    
    const pitching = opponentData.pitching !== undefined ? opponentData.pitching : 50;
    const defense = opponentData.defense !== undefined ? opponentData.defense : 50;
    MY_BATTERS = getAdjustedMyBatters(pitching, defense);

    // ★ 相手データ更新時にチュートリアル判定を再実行
    isTutorialMode = checkIsTutorialMode();
  }
}

function showVsOrderCheckScreen(onConfirm) {
  const oldScreen = document.getElementById('vs-order-screen');
  if (oldScreen) oldScreen.remove();

  const screen = document.createElement('div');
  screen.id = 'vs-order-screen';
  screen.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.95); z-index: 300; display: flex;
    flex-direction: column; align-items: center; padding: 20px;
    box-sizing: border-box; color: white; overflow-y: auto;
  `;

  const renderTeamOrder = (config, title) => {
    let html = `<div style="font-size:16px; font-weight:bold; color:#fbbf24; margin-bottom:8px;">${title}: ${config.name}</div>`;
    html += `<table style="width:100%; font-size:12px; border-collapse:collapse; margin-bottom:15px; background:rgba(0,0,0,0.4);">
      <tr style="border-bottom:1px solid #555; color:#93c5fd;"><th>順</th><th>名前</th><th>利き</th><th>走</th><th>打</th></tr>`;
    config.batters.forEach((b, idx) => {
      html += `<tr style="border-bottom:1px solid #333; text-align:center;">
        <td>${idx + 1}</td><td>${b.name}</td><td>${b.hand || '右'}</td><td>${b.speed ?? '-'}</td><td>${b.hitSpeed ?? '-'}</td>
      </tr>`;
    });
    html += `</table>`;
    return html;
  };

  screen.innerHTML = `
    <h2 style="font-size:20px; margin-bottom:15px; color:#fff;">【対戦前 オーダー確認】</h2>
    <div style="width:100%; max-width:500px;">
      ${renderTeamOrder(vsP1Config, 'Aチーム (先攻)')}
      ${renderTeamOrder(vsP2Config, 'Bチーム (後攻)')}
    </div>
    <button id="vs-start-btn" style="
      padding: 12px 30px; font-size: 16px; font-weight: bold; color: white;
      background: #22c55e; border: none; border-radius: 25px; cursor: pointer; margin-top: 10px;
    ">試合開始</button>
  `;

  document.body.appendChild(screen);
  document.getElementById('vs-start-btn').onclick = () => {
    screen.remove();
    if (onConfirm) onConfirm();
  };
}

function startVsMatch() {
  resetGameState();
  showVsOrderCheckScreen(() => {
    startGame();
  });
}

// 対戦前打順確認画面の定義
function showVsOrderConfirmScreen(p1Config, p2Config) {
  const getPresetData = (level) => {
    const list = (typeof opponentList !== 'undefined' && Array.isArray(opponentList)) ? opponentList : [];
    return list.find(o => o && o.level === level) || list[0] || { pitching: 50, defense: 50, batters: [] };
  };

  const p1Data = getPresetData(p1Config.level);
  const p2Data = getPresetData(p2Config.level);
  const p1Batters = (p1Data.batters && p1Data.batters.length > 0) ? p1Data.batters : BASE_MY_BATTERS;
  const p2Batters = (p2Data.batters && p2Data.batters.length > 0) ? p2Data.batters : BASE_MY_BATTERS;

  let confirmModal = document.getElementById('vs-order-modal');
  if (!confirmModal) {
    confirmModal = document.createElement('div');
    confirmModal.id = 'vs-order-modal';
    confirmModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.98); z-index: 10001;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
      color: white; padding: 15px 10px; box-sizing: border-box; overflow-y: auto;
    `;
    document.body.appendChild(confirmModal);
  }

  const renderTableRows = (batters) => {
    return batters.map((b, idx) => {
      const order = b.order || (idx + 1);
      const handStr = b.hand || '右';
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 11px;">
          <td style="padding: 4px;">${order}</td>
          <td style="padding: 4px; text-align: left;">${b.name} (${handStr})</td>
          <td style="padding: 4px;">${b.speed ?? '-'}</td>
          <td style="padding: 4px;">${b.hitSpeed ?? '-'}</td>
        </tr>
      `;
    }).join('');
  };

  confirmModal.innerHTML = `
    <h2 style="color: #facc15; margin-bottom: 10px; font-size: 18px;">対戦前打順確認</h2>
    
    <div style="display: flex; gap: 8px; width: 100%; max-width: 500px; margin-bottom: 15px;">
      <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px;">
        <div style="color: #60a5fa; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 6px;">
          【先攻】${p1Config.name}
        </div>
        <table style="width: 100%; color: white; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(255,255,255,0.1); font-size: 10px;">
              <th>順</th><th>選手</th><th>走</th><th>打</th>
            </tr>
          </thead>
          <tbody>${renderTableRows(p1Batters)}</tbody>
        </table>
      </div>

      <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px;">
        <div style="color: #f87171; font-weight: bold; font-size: 13px; text-align: center; margin-bottom: 6px;">
          【後攻】${p2Config.name}
        </div>
        <table style="width: 100%; color: white; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(255,255,255,0.1); font-size: 10px;">
              <th>順</th><th>選手</th><th>走</th><th>打</th>
            </tr>
          </thead>
          <tbody>${renderTableRows(p2Batters)}</tbody>
        </table>
      </div>
    </div>

    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 12px; width: 100%; max-width: 340px; margin: 10px auto 20px auto; box-sizing: border-box; padding: 0 10px;">
  <button id="vs-order-start-btn" style="flex: 1; max-width: 145px; padding: 10px 16px; font-size: 15px; font-weight: bold; color: #ffffff; background-color: #22c55e; border: none; border-radius: 9999px; cursor: pointer; text-align: center; white-space: nowrap; box-sizing: border-box; outline: none; -webkit-tap-highlight-color: transparent;">試合開始</button>
  <button id="vs-order-back-btn" style="flex: 1; max-width: 145px; padding: 10px 16px; font-size: 15px; font-weight: bold; color: #ffffff; background-color: #4b5563; border: none; border-radius: 9999px; cursor: pointer; text-align: center; white-space: nowrap; box-sizing: border-box; outline: none; -webkit-tap-highlight-color: transparent;">設定に戻る</button>
</div>
  `;

  confirmModal.style.display = 'flex';

  document.getElementById('vs-order-back-btn').onclick = () => {
    confirmModal.style.display = 'none';
    showVsSetupScreen();
  };

  document.getElementById('vs-order-play-btn').onclick = () => {
    confirmModal.style.display = 'none';
    startVsMatch(p1Config, p2Config);
  };
}

// ==========================================
// チュートリアルUI＆状態管理
// ==========================================

// 1. ストレージの完全リセット
localStorage.removeItem('baseball_tutorial_completed');
localStorage.removeItem('tutorial_basic_completed');
localStorage.removeItem('tutorial_step4_done');
localStorage.removeItem('tutorial_step5_done');
localStorage.removeItem('tutorial_step6_done');

// 2. フラグ初期化
currentTutorialStep = 0;
tutorialBasicCompleted = false;
tutorialStep4Done = false;
tutorialStep5Done = false;
tutorialStep6Done = false;
isTutorialMode = true;

const TUTORIAL_STEPS = [
  { step: 0, text: "パッドを操作し、打球が飛んでくる位置に内野手を移動させます。", trigger: "start" },
  { step: 1, text: "打球が飛んで来たら、右のボタンを<strong style='color: #ff4d4d; font-size: 1.1em;'>長押し開始</strong>で捕球！", trigger: "ball_rolling" },
  { step: 2, text: "<strong style='color: #ff4d4d; font-size: 1.1em;'>⚠️ 長押し状態をキープ！</strong><br>長押ししている間は、球を保持したまま内野手をパッドで操作できます。", trigger: "ball_held" },
  { step: 3, text: "<strong style='color: #ff4d4d; font-size: 1.1em;'>⚠️ 長押し状態をキープ！</strong><br>右のボタンを離すと、パッドが傾いている方向に球を送球します。パッドに触れていない時は、送球できません。", trigger: "holding_wait" },
  { step: 4, text: "球を保持した状態で直接ランナーをタッチするか、ランナーが次の塁に到達する前に球を塁に投げる or 塁を踏むと、ランナーをアウトにできます。", trigger: "play_continue" },
  { step: 5, text: "塁上で球を持っている場合は、パッドを傾けたまま右のボタンをタップすると送球です。パッドを離して送球ではないので注意！", trigger: "play_continue" },
  { step: 6, text: "プレイ終了後に右のボタンを長押しすると、ポーズします。次の打者や塁状況を確認したいときに使ってください。", trigger: "play_continue" },
  { step: 7, text: "送球がそれてフェンスに球が当たった場合は、ランナーが更に1個先の塁まで進みます。（今回のように、ランナーが鈍足すぎると、外野手が2塁に送球してアウトにすることもあります。笑）", trigger: "play_continue" }
];

function updateTutorialArrow(stepIndex) {
  let arrow = document.getElementById('tutorial-arrow');
  
  if (!arrow) {
    arrow = document.createElement('div');
    arrow.id = 'tutorial-arrow';
    arrow.style.cssText = `
      position: absolute;
      z-index: 10002;
      pointer-events: none;
      display: none;
      text-align: center;
      line-height: 1;
      animation: tutorialArrowBounce 0.6s infinite alternate ease-in-out;
    `;
    // ★ width / height を 40 から 70 に拡大
    // ★ d属性の座標を変更して「太い矢印」に変更
    arrow.innerHTML = `
      <svg width="70" height="70" viewBox="0 0 24 24" fill="#ff4d4d" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.8));">
        <path d="M8 2h8v10h4L12 21 4 12h4Z"/>
      </svg>
    `;

    // ★ 矢印の大型化に合わせて浮遊幅（Y座標）も拡張
    if (!document.getElementById('tutorial-arrow-style')) {
      const style = document.createElement('style');
      style.id = 'tutorial-arrow-style';
      style.innerHTML = `
        @keyframes tutorialArrowBounce {
          0% { transform: translate(-50%, -50px); }
          100% { transform: translate(-50%, -100px); }
        }
      `;
      document.head.appendChild(style);
    }

    const container = document.getElementById('game-container') || document.body;
    container.appendChild(arrow);
  }

  let targetEl = null;
  if (stepIndex === 0) {
    targetEl = document.getElementById('padContainer');
} else if (stepIndex === 1 || stepIndex === 6) {
    targetEl = document.getElementById('actionBtn');
  }

  if (targetEl && typeof isTutorialMode !== 'undefined' && isTutorialMode) {
    const container = document.getElementById('game-container') || document.body;
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const top = targetRect.top - containerRect.top;
    const left = targetRect.left - containerRect.left + (targetRect.width / 2);

    arrow.style.top = `${top}px`;
    arrow.style.left = `${left}px`;
    arrow.style.display = 'block';
  } else {
    arrow.style.display = 'none';
  }
}

function triggerTutorialStep(stepIndex) {
  if (typeof isTutorialMode !== 'undefined' && !isTutorialMode) return;

  showTutorialExitButton();

  if (stepIndex <= 3 && tutorialBasicCompleted) return; 
  if (stepIndex === 4 && tutorialStep4Done) return;         
  if (stepIndex === 5 && tutorialStep5Done) return;         
  if (stepIndex === 6 && tutorialStep6Done) return; 

  if (stepIndex === 3) {
    tutorialBasicCompleted = true;
    localStorage.setItem('tutorial_basic_completed', 'true');
  }
  if (stepIndex === 4) {
    tutorialStep4Done = true;
    localStorage.setItem('tutorial_step4_done', 'true');
  }
  if (stepIndex === 5) {
    tutorialStep5Done = true;
    localStorage.setItem('tutorial_step5_done', 'true');
  }
  if (stepIndex === 6) {
    tutorialStep6Done = true;
    localStorage.setItem('tutorial_step6_done', 'true');
  }

  if (tutorialBasicCompleted && tutorialStep4Done && tutorialStep5Done) {
    localStorage.setItem('baseball_tutorial_completed', 'true');
  }

  const stepData = TUTORIAL_STEPS.find(s => s.step === stepIndex);
  if (!stepData) return;

  currentTutorialStep = stepIndex;

  // ★ 赤矢印の表示を更新（step 0 または step 1 のときに指し示す）
  updateTutorialArrow(stepIndex);

  let dialog = document.getElementById('field-tutorial-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'field-tutorial-dialog';
    dialog.style.cssText = `
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #facc15;
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      box-sizing: border-box;
      font-size: 13px;
      line-height: 1.5;
      text-align: center;
    `;
    const container = document.getElementById('game-container') || document.body;
    container.appendChild(dialog);
  }

  const textContent = (stepData && stepData.text) ? stepData.text : "テキストが設定されていません";

  dialog.innerHTML = `
    <div>${textContent}</div>
  `;
  dialog.style.display = 'block';

  isPlaying = false;

  if (typeof freezeTimer !== 'undefined' && freezeTimer) clearTimeout(freezeTimer);

  freezeTimer = setTimeout(() => {
    if (typeof isTutorialMode !== 'undefined' && !isTutorialMode) return;
    dialog.style.display = 'none';

    // ★ ダイアログ消滅時に矢印を非表示にする
    updateTutorialArrow(-1);

    isPlaying = true;

    if (stepIndex === 0) {
      triggerTutorialStep(1);
    } else if (stepIndex === 2) {
      triggerTutorialStep(3);
    }
  }, 4000);
}

// 指定したステップを順番に連続再生する関数
function runTutorialSequence(steps) {
  if (typeof isTutorialMode !== 'undefined' && !isTutorialMode) return;

  // 完了していないステップのみを抽出
  const pendingSteps = steps.filter(s => {
    if (s <= 3) return !tutorialBasicCompleted;
    if (s === 4) return !tutorialStep4Done;
    if (s === 5) return !tutorialStep5Done;
    if (s === 6) return !tutorialStep6Done;
    return true;
  });

  if (pendingSteps.length === 0) return;

  function executeStep(index) {
    if (index >= pendingSteps.length) return;

    const currentStep = pendingSteps[index];
    triggerTutorialStep(currentStep);

    // 次のステップがある場合、ダイアログ表示終了(4000ms)直後に次を実行
    if (index + 1 < pendingSteps.length) {
      setTimeout(() => {
        executeStep(index + 1);
      }, 4100); // 4.1秒後に次のステップへ
    }
  }

  executeStep(0);
}

function exitTutorial() {
  if (typeof isTutorialMode !== 'undefined') {
    isTutorialMode = false;
  }

  if (typeof freezeTimer !== 'undefined' && freezeTimer) {
    clearTimeout(freezeTimer);
  }

  const dialog = document.getElementById('field-tutorial-dialog');
  if (dialog) dialog.style.display = 'none';

  const exitBtn = document.getElementById('tutorial-exit-btn');
  if (exitBtn) exitBtn.style.display = 'none';

  // ★ チュートリアル終了時に赤矢印を非表示にする
  updateTutorialArrow(-1);

  const batterDisplay = document.getElementById('batter-display');
  if (batterDisplay) batterDisplay.style.display = 'none';

  isPlaying = false;

  showHomeScreen();
}

// プレイ画面右上に「チュートリアル終了」ボタンを表示・生成する関数
function showTutorialExitButton() {
  if (typeof isTutorialMode !== 'undefined' && !isTutorialMode) return;

  let btn = document.getElementById('tutorial-exit-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'tutorial-exit-btn';
    btn.innerHTML = 'チュートリアル終了';
    btn.onclick = exitTutorial;
    btn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10001;
      background: #ef4444;
      color: #ffffff;
      border: 1px solid #ffffff;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      transition: background 0.2s;
    `;
    const container = document.getElementById('game-container') || document.body;
    container.appendChild(btn);
  }
  btn.style.display = 'block';
}

update();
