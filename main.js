// --- ストーリー・画面遷移の管理 ---

let currentStoryData = [];
let currentStoryIndex = 0;
let postStoryCallback = null;
isTutorialMode = isTutorialMode ?? false;
let tutorialStep = 1;

function playStory(storyData, callback) {
  currentStoryData = storyData;
  currentStoryIndex = 0;
  postStoryCallback = callback;
  
  const prologueScreen = document.getElementById('prologue-screen');
  prologueScreen.classList.remove('hidden');
  
  // ▼▼▼ ここから背景画像の設定を追加 ▼▼▼
  prologueScreen.style.backgroundImage = "url('room.png')";
  prologueScreen.style.backgroundSize = "cover";
  prologueScreen.style.backgroundPosition = "center";
  prologueScreen.style.backgroundRepeat = "no-repeat";
  // ▲▲▲ ここまで ▲▲▲

  updateStory();
}

function updateStory() {
  if (currentStoryIndex >= currentStoryData.length) {
    document.getElementById('prologue-screen').classList.add('hidden');
    if (postStoryCallback) postStoryCallback();
    return;
  }

  const data = currentStoryData[currentStoryIndex];
  document.getElementById('prologue-name').innerText = data.name;
  document.getElementById('prologue-text').innerText = data.text;
  
  const imgEl = document.getElementById('prologue-image');
  if (data.image) {
    imgEl.src = data.image;
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none'; 
  }
}

document.getElementById('prologue-screen')?.addEventListener('pointerdown', () => {
  currentStoryIndex++;
  updateStory();
});

// ホーム画面を表示する関数
function showHomeScreen() {
  isPlaying = false;
  
  if (typeof updateOpponentDataByLevel === 'function') {
    updateOpponentDataByLevel();
  }
  
  document.getElementById('prologue-screen')?.classList.add('hidden');
  document.getElementById('opponent-screen')?.classList.add('hidden');
  document.getElementById('practice-select-screen')?.classList.add('hidden');
  document.getElementById('results-screen')?.classList.add('hidden');
  document.getElementById('school-name-screen')?.classList.add('hidden');
  document.getElementById('attack-screen')?.classList.add('hidden');

  const list = (typeof opponentList !== 'undefined' && opponentList.length > 0) ? opponentList : [opponentData];
  
  // currentLevelIndex が未定義の場合のフォールバック処理
  const safeLevelIndex = (typeof currentLevelIndex !== 'undefined') ? currentLevelIndex : 0;
  const targetData = list[safeLevelIndex] || list[0];
  const stageName = targetData.stage || `地方大会 ${safeLevelIndex + 1}回戦`;

  const stageDisplayEl = document.getElementById('home-stage-display');
  if (stageDisplayEl) {
    stageDisplayEl.innerText = stageName;
  }

  document.getElementById('home-screen')?.classList.remove('hidden');
}

// 試合前画面（オーダーと対戦校情報）を表示
function showOpponentScreen() {
  // ★ 追加：最新のレベルと対戦相手データを同期
  if (!isPracticeMode && !isVsMode && typeof updateOpponentDataByLevel === 'function') {
    updateOpponentDataByLevel();
  }

  // 1. 全ての画面要素を確実に非表示化
  document.querySelectorAll('.screen, [id$="-screen"]').forEach(el => {
    el.classList.add('hidden');
  });

  // （以下既存の対戦画面表示処理...）

  // 2. 対戦画面を表示し、画面全体を固定レイアウト化（背景透過を防止）
  const screen = document.getElementById('opponent-screen');
  if (!screen) return;
  
  screen.classList.remove('hidden');
  screen.style.position = 'fixed';
  screen.style.top = '0';
  screen.style.left = '0';
  screen.style.width = '100vw';
  screen.style.height = '100vh';
  screen.style.backgroundColor = '#0f172a'; // 不透明なダーク背景
  screen.style.zIndex = '9999';
  screen.style.display = 'flex';
  screen.style.flexDirection = 'column';
  screen.style.alignItems = 'center';
  screen.style.justifyContent = 'flex-start';
  screen.style.padding = '20px 12px 40px';
  screen.style.boxSizing = 'border-box';
  screen.style.overflowY = 'auto'; // 画面からはみ出る場合はスクロール可能にする

  // 3. 対戦校データの取得とタイトル描画
  const stageName = opponentData?.stage || `地方大会 ${currentLevelIndex + 1}回戦`;
  const schoolName = opponentData?.schoolName || "対戦校";
  const pitcherName = opponentData?.pitcherName || "先発投手";
  const pitching = opponentData?.pitching ?? 50;
  const defense = opponentData?.defense ?? 50;
    
  const titleEl = document.getElementById('opponent-school-title');
  if (titleEl) {
    titleEl.style.width = '100%';
    titleEl.style.textAlign = 'center';
    titleEl.style.marginBottom = '16px';
    titleEl.innerHTML = `
      <div style="font-size: 14px; color: #a7f3d0; margin-bottom: 2px;">${stageName}</div>
      <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px; color: #facc15;">【${schoolName}】</div>
      <div style="font-size: 13px; color: #e2e8f0; background: rgba(255, 255, 255, 0.12); padding: 6px 10px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
        <span id="opponent-pitching-info" style="display: inline-block; padding: 2px 4px; border-radius: 4px;">投手:${pitcherName} (投手力:${pitching})</span>
        <span>/</span>
        <span id="opponent-defense-info" style="display: inline-block; padding: 2px 4px; border-radius: 4px;">守備力:${defense}</span>
      </div>
    `;
  }

  // 4. テーブル本体とヘッダーのスタイル調整
  const table = screen.querySelector('table');
  if (table) {
    table.style.width = '100%';
    table.style.maxWidth = '480px';
    table.style.margin = '0 auto 20px auto';
    table.style.borderCollapse = 'collapse';
    table.style.color = '#ffffff';
    table.style.fontSize = '13px';
  }

  const thead = screen.querySelector('table thead');
  if (thead) {
    thead.innerHTML = `
      <tr style="background: rgba(255,255,255,0.1); border-bottom: 1px solid #475569;">
        <th style="padding: 8px 4px;">打順</th>
        <th style="padding: 8px 4px;">選手名</th>
        <th style="padding: 8px 4px;">打</th>
        <th style="padding: 8px 4px;">走</th>
        <th style="padding: 8px 4px;">打力</th>
        <th style="padding: 8px 4px;">傾向</th>
      </tr>
    `;
  }

  // 5. オーダーテーブル（<tbody>）の描画
  const tbody = document.getElementById('opponent-lineup-body');
  if (tbody) {
    tbody.innerHTML = '';
    const batters = opponentData?.batters || [];
    batters.forEach(b => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
      tr.style.textAlign = 'center';
      
      const handStr = b.hand || '右';
      const pullBar = (typeof createPullTendencyBar === 'function') ? createPullTendencyBar(b.pullTendency, handStr) : '';
      tr.innerHTML = `
        <td style="padding: 8px 4px;">${b.order}</td>
        <td style="padding: 8px 4px; text-align: left;">${b.name} (${b.pos})</td>
        <td style="padding: 8px 4px;">${handStr}</td>
        <td style="padding: 8px 4px;">${b.speed}</td>
        <td style="padding: 8px 4px;">${b.hitSpeed}</td>
        <td style="padding: 8px 4px;">${pullBar}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 6. ボタンのスタイリング適用
  const startBtn = document.getElementById('start-btn') || document.getElementById('start-game-btn');
  const homeBtn = document.getElementById('opponent-home-btn');

  // 画像のようなフラットで角丸（丸みのある）デザインをセット
  const applyBtnStyle = (btn, bgColor) => {
    if (!btn) return;
    btn.style.flex = '1';
    btn.style.maxWidth = '145px';
    btn.style.padding = '10px 16px';
    btn.style.fontSize = '15px';
    btn.style.fontWeight = 'bold';
    btn.style.color = '#ffffff';
    btn.style.backgroundColor = bgColor;
    btn.style.border = 'none';
    btn.style.borderRadius = '9999px'; // 完全なカプセル型
    btn.style.cursor = 'pointer';
    btn.style.textAlign = 'center';
    btn.style.whiteSpace = 'nowrap';
    btn.style.boxSizing = 'border-box';
    btn.style.outline = 'none';
    btn.style.webkitTapHighlightColor = 'transparent';
  };

  const targetBtn = startBtn || homeBtn;
  if (targetBtn && targetBtn.parentElement) {
    const parentContainer = targetBtn.parentElement;
    
    // テーブルの下にボタン親要素を移動
    screen.appendChild(parentContainer);

    parentContainer.style.display = 'flex';
    parentContainer.style.flexDirection = 'row';
    parentContainer.style.justifyContent = 'center';
    parentContainer.style.alignItems = 'center';
    parentContainer.style.gap = '12px';
    parentContainer.style.width = '100%';
    parentContainer.style.maxWidth = '340px';
    parentContainer.style.margin = '10px auto 20px auto';
    parentContainer.style.boxSizing = 'border-box';
    parentContainer.style.padding = '0 10px';
  }

  if (startBtn) {
    startBtn.onclick = () => {
      // 対戦相手画面を非表示にする
      screen.classList.add('hidden');
      // 試合開始
      if (typeof isVsMode !== 'undefined' && isVsMode) {
        if (typeof startInning === 'function') startInning();
      } else {
        if (typeof startGame === 'function') startGame();
      }
    };
  }

  if (homeBtn) {
    homeBtn.onclick = () => {
      screen.classList.add('hidden');
      if (typeof showHomeScreen === 'function') showHomeScreen();
    };
  }

// showOpponentScreen() 関数の最下部
  if (isTutorialMode) {
    startOpponentTutorial();
  }
}

// 高校名入力画面の表示
function showSchoolNameScreen() {
  isPlaying = false;
  document.getElementById('prologue-screen')?.classList.add('hidden');
  
  const schoolScreen = document.getElementById('school-name-screen');
  if (!schoolScreen) return;

  schoolScreen.classList.remove('hidden');
  schoolScreen.style.position = 'absolute';
  schoolScreen.style.top = '0';
  schoolScreen.style.left = '0';
  schoolScreen.style.width = '100%';
  schoolScreen.style.height = '100%';
  schoolScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  schoolScreen.style.zIndex = '100';
  schoolScreen.style.display = 'flex';
  schoolScreen.style.flexDirection = 'column';
  schoolScreen.style.alignItems = 'center';
  schoolScreen.style.justifyContent = 'center';
  schoolScreen.style.color = 'white';

  const inputEl = document.getElementById('school-input');
  if (inputEl) {
    const currentName = localStorage.getItem('baseball_my_school_name') || mySchoolName || '';
    inputEl.value = currentName.replace(/高校$/, '');
  }

  setTimeout(() => {
    if (inputEl) inputEl.focus();
  }, 100);
}

function handleSchoolSubmit(e) {
  if (e) e.preventDefault();

  const inputEl = document.getElementById('school-input');
  let inputVal = inputEl ? inputEl.value.trim() : '';

  if (!inputVal) {
    inputVal = "守備"; 
  }

  // ★追加: 既に名前が保存されているか確認（初回プレイ判定）
  const isFirstPlay = !localStorage.getItem('baseball_my_school_name');

  mySchoolName = inputVal + "高校";
  localStorage.setItem('baseball_my_school_name', mySchoolName);
  window.userSchoolName = mySchoolName;

  const schoolScreen = document.getElementById('school-name-screen');
  if (schoolScreen) {
    schoolScreen.classList.add('hidden');
    schoolScreen.style.display = 'none';
  }

  // ★変更: 初回プレイ時はチュートリアルへ、2回目以降はホーム画面へ
  if (isFirstPlay) {
    if (typeof startTutorial === 'function') {
      startTutorial();
    } else {
      // フォールバック: startTutorialが無い場合は練習試合(難易度1)を開始
      startPracticeMatch(1);
    }
  } else {
    if (typeof showHomeScreen === 'function') {
      showHomeScreen();
    } else if (typeof startMainGame === 'function') {
      startMainGame();
    }
  }
}

// 練習試合 難易度選択画面を表示する関数
function showPracticeSelectScreen() {
  document.getElementById('home-screen')?.classList.add('hidden');
  document.getElementById('opponent-screen')?.classList.add('hidden');
  
  const practiceSelectScreen = document.getElementById('practice-select-screen');
  if (practiceSelectScreen) {
    practiceSelectScreen.style.position = 'absolute';
    practiceSelectScreen.style.top = '0';
    practiceSelectScreen.style.left = '0';
    practiceSelectScreen.style.width = '100%';
    practiceSelectScreen.style.height = '100%';
    practiceSelectScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    practiceSelectScreen.style.zIndex = '100';
    practiceSelectScreen.style.display = 'flex';
    practiceSelectScreen.style.flexDirection = 'column';
    practiceSelectScreen.style.alignItems = 'center';
    practiceSelectScreen.style.justifyContent = 'center';
    practiceSelectScreen.style.color = 'white';
    practiceSelectScreen.classList.remove('hidden');
  }
}

// 練習試合の難易度選択処理
function startPracticeMatch(targetLevel) {
  isPracticeMode = true;

  const defaultOpponent = {
    stage: '練習試合',
    schoolName: '練習校',
    pitcherName: '練習投手',
    pitching: 50,
    defense: 50,
    batters: []
  };

  const list = (typeof opponentList !== 'undefined' && Array.isArray(opponentList) && opponentList.length > 0) 
    ? opponentList 
    : [];

  const targetOpponent = list.find(o => o && o.level === targetLevel) 
    || list[targetLevel - 1] 
    || list[0]
    || defaultOpponent;

  opponentData = targetOpponent;
  OPPONENT_BATTERS = opponentData.batters || [];
  MY_BATTERS = getAdjustedMyBatters(opponentData.pitching, opponentData.defense);

  const practiceSelectScreen = document.getElementById('practice-select-screen');
  if (practiceSelectScreen) {
    practiceSelectScreen.classList.add('hidden');
    practiceSelectScreen.style.display = 'none';
  }
  showOpponentScreen();
}

// --- イベントリスナーの一括登録 ---
document.addEventListener('DOMContentLoaded', () => {
  // ストーリーモード「試合へ」ボタン
  document.getElementById('match-btn')?.addEventListener('click', () => {
    isPracticeMode = false;
    const list = (typeof opponentList !== 'undefined' && Array.isArray(opponentList)) ? opponentList : [];
    currentLevelIndex = parseInt(localStorage.getItem('baseball_save_level')) || 0;
    opponentData = list[currentLevelIndex] || list[0] || { pitching: 50, defense: 50, batters: [] };
    OPPONENT_BATTERS = opponentData.batters || [];
    MY_BATTERS = getAdjustedMyBatters(opponentData.pitching ?? 50, opponentData.defense ?? 50);
    if (typeof showOpponentScreen === 'function') showOpponentScreen();
  });

  // 対戦画面の「試合開始」ボタン
  document.getElementById('start-btn')?.addEventListener('click', () => {
    document.getElementById('opponent-screen')?.classList.add('hidden');
    if (typeof startGame === 'function') startGame();
  });

  // 対戦画面の「ホームに戻る」ボタン
  document.getElementById('opponent-home-btn')?.addEventListener('click', () => {
    if (typeof showHomeScreen === 'function') showHomeScreen();
  });

  // 学校名変更ボタン
  document.getElementById('change-school-btn')?.addEventListener('click', showSchoolNameScreen);

  // 学校名決定ボタン
  document.getElementById('save-school-btn')?.addEventListener('click', handleSchoolSubmit);

  // ホーム画面の「練習試合」ボタン
  document.getElementById('practice-btn')?.addEventListener('click', showPracticeSelectScreen);

  // 練習試合選択画面の「戻る」ボタン
  document.getElementById('practice-back-btn')?.addEventListener('click', () => {
    const practiceScreen = document.getElementById('practice-select-screen');
    if (practiceScreen) {
      practiceScreen.classList.add('hidden');
      practiceScreen.style.display = 'none'; // ★ インラインスタイルを明示的に上書きして非表示にする
    }
    if (typeof showHomeScreen === 'function') showHomeScreen();
  });

  // 練習試合 難易度ボタン
  document.getElementById('practice-easy-btn')?.addEventListener('click', () => startPracticeMatch(1));
  document.getElementById('practice-normal-btn')?.addEventListener('click', () => startPracticeMatch(4));
  document.getElementById('practice-hard-btn')?.addEventListener('click', () => startPracticeMatch(10));

  // 成績画面の「成績」ボタン
  document.getElementById('results-btn')?.addEventListener('click', () => {
    showResultsScreen();
  });

  // 成績画面の「戻る」ボタン
  document.getElementById('results-back-btn')?.addEventListener('click', () => {
    const resultsScreen = document.getElementById('results-screen');
    if (resultsScreen) {
      resultsScreen.classList.add('hidden');
      resultsScreen.style.display = 'none'; // ★インラインスタイルを明示的にnoneで上書き
    }
    if (typeof showHomeScreen === 'function') showHomeScreen();
  });

// ★ 初期化処理（学校名の有無で初回分岐）
if (localStorage.getItem('baseball_my_school_name')) {
  if (typeof showHomeScreen === 'function') showHomeScreen();
} else {
  if (typeof playStory === 'function') {
    playStory(typeof prologueData !== 'undefined' ? prologueData : {}, showSchoolNameScreen);
  } else {
    showSchoolNameScreen();
  }
}

});

// 成績データの取得関数
function getStoryStats() {
  const defaultStats = {
    batters: typeof BASE_MY_BATTERS !== 'undefined' ? BASE_MY_BATTERS.map(b => ({
      name: b.name,
      pa: 0, ab: 0, h: 0, h2: 0, h3: 0, hr: 0, rbi: 0, bb: 0, so: 0, e: 0
    })) : [],
    pitcher: {
  name: "K.ゴロウタスマン",
  games: 0, outs: 0, hits: 0, runs: 0, er: 0 // ★ er (自責点) を追加
}
  };

  const saved = localStorage.getItem('baseball_story_stats');
  if (!saved) return defaultStats;

  try {
    const parsed = JSON.parse(saved);
    if (!parsed.batters) return defaultStats;
    return parsed;
  } catch(e) {
    return defaultStats;
  }
}

// 成績データの保存関数
function saveStoryStats(stats) {
  localStorage.setItem('baseball_story_stats', JSON.stringify(stats));
}

// 成績画面の表示処理
function showResultsScreen() {
  document.querySelectorAll('.screen, [id$="-screen"]').forEach(el => el.classList.add('hidden'));

  const screen = document.getElementById('results-screen');
  if (!screen) return;

  const titleEl = document.getElementById('results-title');
  if (titleEl) {
    if (localStorage.getItem('baseball_epilogue_seen')) {
      titleEl.innerText = "ストーリー累計成績（夢落ち含む）";
    } else {
      titleEl.innerText = "ストーリー累計成績";
    }
  }

  screen.classList.remove('hidden');
  screen.style.position = 'fixed';
  screen.style.top = '0';
  screen.style.left = '0';
  screen.style.width = '100vw';
  screen.style.height = '100vh';
  screen.style.backgroundColor = '#0f172a';
  screen.style.zIndex = '9999';
  screen.style.display = 'flex';
  screen.style.flexDirection = 'column';
  screen.style.alignItems = 'center';
  screen.style.justifyContent = 'flex-start';
  screen.style.padding = '30px 15px';
  screen.style.boxSizing = 'border-box';

  renderStatsTables();
}

function renderStatsTables() {
  const stats = getStoryStats();

  // 1. 打者成績テーブル描画
  const battersBody = document.getElementById('stats-batters-body');
  if (battersBody && stats.batters) {
    battersBody.innerHTML = '';
    stats.batters.forEach(b => {
      const ab = b.ab || 0;
      const h = b.h || 0;
      const h2 = b.h2 || 0;
      const h3 = b.h3 || 0;
      const hr = b.hr || 0;
      const bb = b.bb || 0;

      const avg = ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.000';

      // 出塁率 (OBP)
      const obpVal = (ab + bb) > 0 ? (h + bb) / (ab + bb) : 0;
      const obp = (ab + bb) > 0 ? obpVal.toFixed(3).replace(/^0/, '') : '.000';

      // 長打率 (SLG)
      const h1 = h - (h2 + h3 + hr);
      const totalBases = h1 + (h2 * 2) + (h3 * 3) + (hr * 4);
      const slgVal = ab > 0 ? totalBases / ab : 0;
      const slg = ab > 0 ? slgVal.toFixed(3).replace(/^0/, '') : '.000';

      // OPS
      const opsVal = obpVal + slgVal;
      const ops = (ab + bb) > 0 || ab > 0 ? opsVal.toFixed(3) : '.000';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
      tr.style.textAlign = 'center';
      
      // 出塁率・長打率・OPS を color: #ffffff; font-weight: bold; に指定
      tr.innerHTML = `
        <td style="padding: 6px 2px; text-align: left; font-weight: bold;">${b.name || '選手'}</td>
        <td style="padding: 6px 2px; color: #facc15; font-weight: bold;">${avg}</td>
        <td style="padding: 6px 2px; color: #ffffff; font-weight: bold;">${obp}</td>
        <td style="padding: 6px 2px; color: #ffffff; font-weight: bold;">${slg}</td>
        <td style="padding: 6px 2px; color: #ffffff; font-weight: bold;">${ops}</td>
        <td style="padding: 6px 2px;">${ab}</td>
        <td style="padding: 6px 2px;">${h}</td>
        <td style="padding: 6px 2px; color: #f87171;">${hr}</td>
        <td style="padding: 6px 2px; color: #4ade80;">${b.rbi || 0}</td>
        <td style="padding: 6px 2px;">${b.so || 0}</td>
        <td style="padding: 6px 2px;">${bb}</td>
        <td style="padding: 6px 2px;">${b.e || 0}</td>
      `;
      battersBody.appendChild(tr);
    });
  }

  // 2. 投手成績テーブル描画（復元部分）
  const pitcherBody = document.getElementById('stats-pitcher-body') || document.getElementById('stats-pitchers-body');
  if (pitcherBody && stats.pitcher) {
    pitcherBody.innerHTML = '';
    const p = stats.pitcher;
    const outs = p.outs || 0;
    const er = p.er || 0;
    
    // 投球回数 (例: 7アウト -> 2.1回)
    const ip = `${Math.floor(outs / 3)}${outs % 3 > 0 ? '.' + (outs % 3) : ''}`;
    
    // 防御率 (ERA = 自責点 * 27 / アウト数)
    const era = outs > 0 ? ((er * 27) / outs).toFixed(2) : '0.00';

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
    tr.style.textAlign = 'center';
    
    tr.innerHTML = `
      <td style="padding: 6px 2px; text-align: left; font-weight: bold;">${p.name || '投手'}</td>
      <td style="padding: 6px 2px; color: #facc15; font-weight: bold;">${era}</td>
      <td style="padding: 6px 2px;">${p.games || 0}</td>
      <td style="padding: 6px 2px;">${ip}</td>
      <td style="padding: 6px 2px;">${p.hits || 0}</td>
      <td style="padding: 6px 2px; color: #f87171;">${p.runs || 0}</td>
      <td style="padding: 6px 2px;">${er}</td>
    `;
    pitcherBody.appendChild(tr);
  }
}

// --- 対戦モード関連の処理 ---
let isVsMode = false;
let vsP1Config = null;
let vsP2Config = null;

// 対戦設定画面（モーダル）を表示する関数
function showVsSetupScreen() {
  let vsModal = document.getElementById('vs-setup-modal');
  
  if (!vsModal) {
    vsModal = document.createElement('div');
    vsModal.id = 'vs-setup-modal';
    vsModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.95); z-index: 10000;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
      color: white; padding: 20px 10px; box-sizing: border-box; overflow-y: auto;
    `;
    document.body.appendChild(vsModal);
  }

  vsModal.innerHTML = `
    <h2 style="color: #facc15; margin-bottom: 15px; font-size: 20px;">2人対戦モード設定</h2>
    
    <div style="width: 100%; max-width: 400px; background: rgba(255,255,255,0.08); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
      <h3 style="color: #60a5fa; margin-top:0; font-size: 16px;">A高校 (先攻) 設定</h3>
      <label style="font-size: 12px; display: block; margin-bottom: 4px;">チーム名 (5文字以内):</label>
      <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
        <input type="text" id="vs-p1-name" value="A" maxlength="5" style="width: 70%; padding: 6px; border-radius: 4px; border: 1px solid #475569; background: #1e293b; color: white;">
        <span style="font-size: 14px;">高校</span>
      </div>
      
      <label style="font-size: 12px; display: block; margin-bottom: 4px;">打順強さ:</label>
      <select id="vs-p1-level" style="width: 95%; padding: 6px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #475569; background: #1e293b; color: white;">
        <option value="1">よわい (かんたん)</option>
        <option value="4" selected>ふつう (ふつう)</option>
        <option value="10">つよい (むずかしい)</option>
      </select>
    </div>

    <div style="width: 100%; max-width: 400px; background: rgba(255,255,255,0.08); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
      <h3 style="color: #f87171; margin-top:0; font-size: 16px;">B高校 (後攻) 設定</h3>
      <label style="font-size: 12px; display: block; margin-bottom: 4px;">チーム名 (5文字以内):</label>
      <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
        <input type="text" id="vs-p2-name" value="B" maxlength="5" style="width: 70%; padding: 6px; border-radius: 4px; border: 1px solid #475569; background: #1e293b; color: white;">
        <span style="font-size: 14px;">高校</span>
      </div>
      
      <label style="font-size: 12px; display: block; margin-bottom: 4px;">打順強さ:</label>
      <select id="vs-p2-level" style="width: 95%; padding: 6px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #475569; background: #1e293b; color: white;">
        <option value="1">よわい (かんたん)</option>
        <option value="4" selected>ふつう (ふつう)</option>
        <option value="10">つよい (むずかしい)</option>
      </select>
    </div>

    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 12px; width: 100%; max-width: 340px; margin: 10px auto 20px auto; box-sizing: border-box; padding: 0 10px;">
  <button id="vs-start-game-btn" style="flex: 1; max-width: 145px; padding: 10px 16px; font-size: 15px; font-weight: bold; color: #ffffff; background-color: #22c55e; border: none; border-radius: 9999px; cursor: pointer; text-align: center; white-space: nowrap; box-sizing: border-box; outline: none; -webkit-tap-highlight-color: transparent;">対戦開始</button>
  <button id="vs-back-btn" style="flex: 1; max-width: 145px; padding: 10px 16px; font-size: 15px; font-weight: bold; color: #ffffff; background-color: #4b5563; border: none; border-radius: 9999px; cursor: pointer; text-align: center; white-space: nowrap; box-sizing: border-box; outline: none; -webkit-tap-highlight-color: transparent;">ホームに戻る</button>
</div>
  `;

  vsModal.classList.remove('hidden');
  vsModal.style.display = 'flex';

  document.getElementById('vs-back-btn').onclick = () => {
    vsModal.style.display = 'none';
    if (typeof showHomeScreen === 'function') showHomeScreen();
  };

  // showVsSetupScreen() 内の vs-start-game-btn クリックイベント
  document.getElementById('vs-start-game-btn').onclick = () => {
    const rawP1 = document.getElementById('vs-p1-name').value.trim() || 'A';
    const p1Name = rawP1 + '高校';
    const p1Level = parseInt(document.getElementById('vs-p1-level').value);
    
    const rawP2 = document.getElementById('vs-p2-name').value.trim() || 'B';
    const p2Name = rawP2 + '高校';
    const p2Level = parseInt(document.getElementById('vs-p2-level').value);

    vsModal.style.display = 'none';
    
    // 横並びのオーダー確認画面を呼び出す
    showVsOrderConfirmScreen(
      { name: p1Name, level: p1Level },
      { name: p2Name, level: p2Level }
    );
  };
}

// 対戦オーダー確認画面（横並び）を表示する関数
function showVsOrderConfirmScreen(p1Config, p2Config) {
  // 対戦相手リストから強さに応じたデータを取得
  const getPresetData = (level) => {
    const list = (typeof opponentList !== 'undefined' && Array.isArray(opponentList)) ? opponentList : [];
    return list.find(o => o && o.level === level) || list[0] || { pitching: 50, defense: 50, batters: [] };
  };
  
  const p1Data = getPresetData(p1Config.level);
  const p2Data = getPresetData(p2Config.level);

  // 対戦モード用の固定メンバーを適用
  const vsFixedLineup = [
    { name: "玉賀（己）", pos: "中" }, { name: "玉賀（光）", pos: "左" }, { name: "玉賀（渾）", pos: "右" },
    { name: "一井", pos: "一" }, { name: "佐渡", pos: "三" }, { name: "遊", pos: "遊" },
    { name: "二口", pos: "二" }, { name: "Z.トルマン", pos: "捕" }, { name: "K.ゴロウタスマン", pos: "投" }
  ];

  const applyFixedLineup = (batters) => {
    const sourceBatters = (!batters || batters.length === 0) ? (typeof BASE_MY_BATTERS !== 'undefined' ? BASE_MY_BATTERS : []) : batters;
    return JSON.parse(JSON.stringify(sourceBatters)).map((b, index) => {
      const fixed = vsFixedLineup[index % 9];
      return { ...b, name: fixed.name, pos: fixed.pos };
    });
  };

  const p1Batters = applyFixedLineup(p1Data.batters);
  const p2Batters = applyFixedLineup(p2Data.batters);

  // テーブルの行（選手データ）を作成するヘルパー関数
  const createRows = (batters) => {
    return batters.map(b => {
      const handStr = b.hand || '右';
      const pullBar = (typeof createPullTendencyBar === 'function') ? createPullTendencyBar(b.pullTendency, handStr) : '';
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <td style="padding: 6px 2px;">${b.order || ''}</td>
          <td style="padding: 6px 2px; text-align: left;">${b.name}</td>
          <td style="padding: 6px 2px;">${b.pos}</td>
          <td style="padding: 6px 2px;">${b.speed}</td>
          <td style="padding: 6px 2px;">${b.hitSpeed}</td>
          <td style="padding: 6px 2px;">${pullBar}</td>
        </tr>
      `;
    }).join('');
  };

  // モーダル画面の作成と表示
  let modal = document.getElementById('vs-order-confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'vs-order-confirm-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.98); z-index: 10001;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
      color: white; padding: 20px 10px; box-sizing: border-box; overflow-y: auto;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <h2 style="color: #facc15; margin-bottom: 15px; font-size: 20px;">両チーム オーダー確認</h2>
    <div style="display: flex; flex-direction: row; gap: 10px; width: 100%; max-width: 800px; overflow-x: auto; margin-bottom: 20px;">
      
      <!-- 先攻 (P1) -->
      <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
        <h3 style="color: #60a5fa; text-align: center; margin-top: 0; font-size: 16px;">${p1Config.name} (先攻)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.1); border-bottom: 1px solid #475569;">
              <th>打順</th><th>名前</th><th>守</th><th>走</th><th>打力</th><th>傾向</th>
            </tr>
          </thead>
          <tbody>${createRows(p1Batters)}</tbody>
        </table>
      </div>

      <!-- 後攻 (P2) -->
      <div style="flex: 1; min-width: 300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px;">
        <h3 style="color: #f87171; text-align: center; margin-top: 0; font-size: 16px;">${p2Config.name} (後攻)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.1); border-bottom: 1px solid #475569;">
              <th>打順</th><th>名前</th><th>守</th><th>走</th><th>打力</th><th>傾向</th>
            </tr>
          </thead>
          <tbody>${createRows(p2Batters)}</tbody>
        </table>
      </div>
    </div>
    
    <div style="display: flex; gap: 12px; width: 100%; max-width: 340px;">
      <button id="vs-final-start-btn" style="flex: 1; padding: 10px 16px; font-size: 15px; font-weight: bold; color: white; background-color: #22c55e; border: none; border-radius: 9999px; cursor: pointer;">試合開始</button>
      <button id="vs-confirm-back-btn" style="flex: 1; padding: 10px 16px; font-size: 15px; font-weight: bold; color: white; background-color: #4b5563; border: none; border-radius: 9999px; cursor: pointer;">戻る</button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';

  // 戻るボタンの処理
  document.getElementById('vs-confirm-back-btn').onclick = () => {
    modal.style.display = 'none';
    if (typeof showVsSetupScreen === 'function') showVsSetupScreen();
  };

  // 試合開始ボタンの処理
  document.getElementById('vs-final-start-btn').onclick = () => {
    modal.style.display = 'none';
    if (typeof startVsMatch === 'function') startVsMatch(p1Config, p2Config);
  };
}

// 対戦モードの試合開始処理
function startVsMatch(p1Config, p2Config) {
  isVsMode = true;
  isPracticeMode = true; // 成績の保存を防ぐ

  const getPresetData = (level) => {
    const list = (typeof opponentList !== 'undefined' && Array.isArray(opponentList)) ? opponentList : [];
    return list.find(o => o && o.level === level) || list[0] || { pitching: 50, defense: 50, batters: [] };
  };

  const p1Data = getPresetData(p1Config.level);
  const p2Data = getPresetData(p2Config.level);

  // ▼▼▼ 追加: 対戦モード用の固定打順データ ▼▼▼
  const vsFixedLineup = [
    { name: "玉賀（己）", pos: "中" },
    { name: "玉賀（光）", pos: "左" },
    { name: "玉賀（渾）", pos: "右" },
    { name: "一井", pos: "一" },
    { name: "佐渡", pos: "三" },
    { name: "遊", pos: "遊" },
    { name: "二口", pos: "二" },
    { name: "Z.トルマン", pos: "捕" },
    { name: "K.ゴロウタスマン", pos: "投" }
  ];

  // パラメータ（走力や打力など）はそのままに、名前とポジションだけ上書きする関数
  const applyFixedLineup = (batters) => {
    // ▼▼▼ 修正：データが空の場合は BASE_MY_BATTERS をソースとして扱う ▼▼▼
    const sourceBatters = (!batters || batters.length === 0) ? BASE_MY_BATTERS : batters;
    
    return JSON.parse(JSON.stringify(sourceBatters)).map((b, index) => {
      const fixed = vsFixedLineup[index % 9]; // 9人ループ
      return {
        ...b,             // 難易度で選んだ既存のパラメータを展開
        name: fixed.name, // 名前を上書き
        pos: fixed.pos    // ポジションを上書き
      };
    });
  };

  vsP1Config = {
    name: p1Config.name,
    pitching: p1Data.pitching || 50,
    defense: p1Data.defense || 50,
    batters: applyFixedLineup(p1Data.batters) // ★ 関数を通して上書きしたデータをセット
  };

  vsP2Config = {
    name: p2Config.name,
    pitching: p2Data.pitching || 50,
    defense: p2Data.defense || 50,
    batters: applyFixedLineup(p2Data.batters) // ★ 関数を通して上書きしたデータをセット
  };

  // 初期設定：1Pが先攻、2Pが後攻
  isPlayerFirst = true;
  currentInning = 1;
  isTopInning = true;
  playerScore = 0;
  opponentScore = 0;
  playerHits = 0;
  opponentHits = 0;
  playerErrors = 0;
  opponentErrors = 0;
  playerInningScores = [];
  opponentInningScores = [];
  playerBatterIndex = 0;
  opponentBatterIndex = 0;

  document.querySelectorAll('.screen, [id$="-screen"]').forEach(el => el.classList.add('hidden'));
  
  // ▼▼▼ 変更：試合を直接開始せず、1P(先攻)のデータをセットしてオーダー画面を開く ▼▼▼
  opponentData = {
    stage: '2人対戦モード',
    schoolName: vsP1Config.name + ' (先攻)',
    pitcherName: vsP1Config.batters[8]?.name || "投手",
    pitching: vsP1Config.pitching,
    defense: vsP1Config.defense,
    batters: vsP1Config.batters
  };
  
  document.querySelectorAll('.screen, [id$="-screen"]').forEach(el => el.classList.add('hidden'));
  startInning();
}

// DOMContentLoaded 内のイベント登録
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('vs-mode-btn')?.addEventListener('click', showVsSetupScreen); // ★ #vs-mode-btn を追加
  document.getElementById('vs-btn')?.addEventListener('click', showVsSetupScreen);
  document.getElementById('versus-btn')?.addEventListener('click', showVsSetupScreen);
});

// クリック委譲処理
document.addEventListener('click', (e) => {
  // ★ セレクタに '#vs-mode-btn' (ID) を追加
  const target = e.target.closest('#vs-mode-btn, #vs-btn, #versus-btn, .vs-mode-btn');
  if (target) {
    e.preventDefault();
    if (typeof showVsSetupScreen === 'function') {
      showVsSetupScreen();
    }
  }
});

function startTutorial() {
  // フラグを確実に true に設定
  isTutorialMode = true;
  tutorialStep = 1;
  
  isPracticeMode = true;
  // チュートリアル用の特別な対戦相手データを用意
  opponentData = {
    stage: 'チュートリアル',
    schoolName: '指南高校',
    pitcherName: 'コーチ',
    pitching: 10,
    defense: 10,
    batters: [
      // チュートリアル用の固定打者（必要に応じて調整）
      { name: "練習生1", order: 1, pos: "投", hand: "右", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生2", order: 2, pos: "捕", hand: "左", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生3", order: 3, pos: "一", hand: "右", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生4", order: 4, pos: "二", hand: "左", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生5", order: 5, pos: "三", hand: "右", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生6", order: 6, pos: "遊", hand: "左", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生7", order: 7, pos: "左", hand: "右", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生8", order: 8, pos: "中", hand: "左", speed: 15, hitSpeed: 15, pullTendency: 50 },
      { name: "練習生9", order: 9, pos: "右", hand: "両", speed: 15, hitSpeed: 15, pullTendency: 50 },
    ]
  };
  
OPPONENT_BATTERS = opponentData.batters;
  MY_BATTERS = getAdjustedMyBatters(opponentData.pitching, opponentData.defense);
  
  alert("チュートリアルを開始します！守備の基本を学びましょう！");
  
  if (typeof showOpponentScreen === 'function') {
    showOpponentScreen();
  }
}

const OPPONENT_TUTORIAL_STEPS = [
  {
    text: "ここでは対戦する相手チームの打順や選手の能力を確認できます。相手の強み・弱みをしっかりチェックして守備に備えましょう！",
    targetSelector: null
  },
  {
    text: "【投手力】 です。数値が高いほど、味方のヒットが出にくくなります。",
    targetSelector: "#opponent-pitching-info" // 投手力部分をピンポイント指定
  },
  {
    text: "【守備力】 です。数値が高いほど、味方の攻撃時に併殺打が増え、逆に犠牲フライや敵失が減ります。",
    targetSelector: "#opponent-defense-info" // 守備力部分をピンポイント指定
  },
  {
    text: "【走力】 です。数値が高い選手ほど足が速く、次の塁へ到達するまでの時間が短くなります。俊足バッターが出塁したときは、素早い送球と判断が重要です！",
    columnIndex: 3
  },
  {
    text: "【打力】 です。数値が高い選手ほど鋭い打球が飛びやすくなります。なお、実際の打球速度は打席ごとに変化します。",
    columnIndex: 4
  },
  {
    text: "【打球傾向】 です。ゲージが左寄りなら一塁方向、右寄りなら三塁方向への打球が多くなります。バッターの傾向に合わせて捕球の準備をしておきましょう！",
    columnIndex: 5
  },
  {
    text: "相手のデータを頭に入れたら『試合開始』を押して、いよいよプレイボールです！",
    targetSelector: "#start-btn, #start-game-btn"
  }
];

// オーダー画面チュートリアルを開始する関数
function startOpponentTutorial() {
  currentTutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  const step = OPPONENT_TUTORIAL_STEPS[currentTutorialStep];
  const screen = document.getElementById('opponent-screen');
  if (!screen) return;

  // 1. 既存のハイライトをクリア
  clearHighlights();

  // 2. 該当箇所のハイライト適用
  if (step.columnIndex !== undefined) {
    // テーブルの特定の列（th, td）をハイライト
    const table = screen.querySelector('table');
    if (table) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cell = row.children[step.columnIndex];
        if (cell) {
          cell.style.outline = '2px solid #facc15';
          cell.style.backgroundColor = 'rgba(250, 204, 21, 0.2)';
        }
      });
    }
  } else if (step.targetSelector) {
    // ボタン等の特定要素をハイライト
    const target = screen.querySelector(step.targetSelector);
    if (target) {
      target.style.outline = '3px solid #facc15';
      target.style.boxShadow = '0 0 12px #facc15';
    }
  }

  // 3. ダイアログの表示更新
  let dialog = document.getElementById('tutorial-dialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'tutorial-dialog';
    dialog.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      width: 90%; max-width: 440px; background: rgba(15, 23, 42, 0.95);
      border: 2px solid #facc15; border-radius: 12px; padding: 16px;
      color: white; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      box-sizing: border-box; font-size: 14px; line-height: 1.5;
    `;
    screen.appendChild(dialog);
  }

  const isLast = currentTutorialStep === OPPONENT_TUTORIAL_STEPS.length - 1;

  // 最後のステップの場合は「開始」ボタン、それ以外は「次へ >」ボタンを同じ位置に配置
  dialog.innerHTML = `
    <div style="margin-bottom: 12px;">${step.text}</div>
    <div style="text-align: right;">
      <button id="tutorial-next-btn" style="
        background: #facc15; color: #0f172a; border: none; padding: 8px 18px;
        font-weight: bold; border-radius: 20px; cursor: pointer;
      ">${isLast ? 'チュートリアル　開始' : '次へ >'}</button>
    </div>
  `;

  document.getElementById('tutorial-next-btn').onclick = () => {
    if (isLast) {
      // 「開始」ボタンが押されたらチュートリアルUIを閉じて試合を開始
      clearHighlights();
      dialog.remove();
      screen.classList.add('hidden');
      if (typeof startGame === 'function') startGame();
    } else {
      currentTutorialStep++;
      if (currentTutorialStep < OPPONENT_TUTORIAL_STEPS.length) {
        showTutorialStep();
      }
    }
  };
}

// スタイル初期化用関数
function clearHighlights() {
  const screen = document.getElementById('opponent-screen');
  if (!screen) return;

  // 1. 全要素のアウトラインと影をクリア（ダイアログ除く）
  screen.querySelectorAll('*').forEach(el => {
    if (el.closest('#tutorial-dialog')) return;
    el.style.outline = '';
    el.style.boxShadow = '';
  });

  // 2. テーブルのマス目や指定領域のみ背景色をクリア（ゲージ内の背景色を維持）
  screen.querySelectorAll('th, td, #opponent-pitching-info, #opponent-defense-info').forEach(el => {
    el.style.backgroundColor = '';
  });
}