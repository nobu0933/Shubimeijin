const WORLD_WIDTH = 360;
const WORLD_HEIGHT = 640;

// ★追加: 自校名と相手校名を取得する設定
let mySchoolName = localStorage.getItem('baseball_my_school_name') || '守備高校';

function getOpponentSchoolName() {
  if (typeof isVsMode !== 'undefined' && isVsMode) {
    // 1P（先攻）攻撃時は2P、2P（後攻）攻撃時は1Pが相手
    return isTopInning ? (vsP2Config?.name || '2Pチーム') : (vsP1Config?.name || '1Pチーム');
  }
  return (typeof opponentData !== 'undefined' && opponentData.schoolName) 
    ? opponentData.schoolName 
    : '相手高校';
}

const BASES = [
  { x: 0, y: -150, name: '本塁', radius: 40 },
  { x: -300, y: 150, name: '1塁', radius: 40 },
  { x: 0, y: 450, name: '2塁', radius: 40 },
  { x: 300, y: 150, name: '3塁', radius: 40 }
];

const POSITIONS = [
  { name: 'ファースト', x: -300, y: 285 }, // 後ろに下げつつ少しライン際へ
  { name: 'セカンド',   x: -150, y: 450 }, // 1・2塁間を深めに
  { name: 'ショート',   x: 150,  y: 450 }, // 2・3塁間を深めに
  { name: 'サード',     x: 300,  y: 285 },
  { name: 'レフト',     x: 800,  y: 1200 },
  { name: 'センター',   x: 0,    y: 1450 },
  { name: 'ライト',     x: -800, y: 1200 }
];

const defenseRoster = [
  { pos: 'P',  posName: 'ピッチャー', name: 'K.ゴロウタスマン' },
  { pos: 'C',  posName: 'キャッチャー', name: 'Z.トルマン' },
  { pos: '1B', posName: 'ファースト', name: '一井 剛' },
  { pos: '2B', posName: 'セカンド',   name: '二口 守' },
  { pos: '3B', posName: 'サード',     name: '佐渡 充' },
  { pos: 'SS', posName: 'ショート',   name: '遊 翔斗' },
  { pos: 'LF', posName: 'レフト',     name: '玉賀 光編' },
  { pos: 'CF', posName: 'センター',   name: '玉賀 己内' },
  { pos: 'RF', posName: 'ライト',     name: '玉賀 渾' }
];

const BASE_MY_BATTERS = [
  { name: "玉賀（己）(中)", bb: 20, h1: 20, h2: 7, h3: 2, hr: 1, so: 10, fo: 20, go: 20, speed: 90 },
  { name: "玉賀（光）(左)", bb: 15, h1: 22, h2: 8, h3: 2, hr: 2, so: 11, fo: 20, go: 20, speed: 80 },
  { name: "玉賀（渾）(右)", bb: 12, h1: 25, h2: 7, h3: 1, hr: 3, so: 15, fo: 18, go: 19, speed: 80 },
  { name: "一井(一)", bb: 10, h1: 12, h2: 8, h3: 1, hr: 5, so: 30, fo: 20, go: 14, speed: 50 },
  { name: "佐渡(三)", bb: 8, h1: 10, h2: 7, h3: 1, hr: 4, so: 35, fo: 20, go: 15, speed: 50 },
  { name: "遊(遊)", bb: 8, h1: 15, h2: 4.5, h3: 1, hr: 1.5, so: 20, fo: 25, go: 25, speed: 50 },
  { name: "二口(二)", bb: 8, h1: 15, h2: 4.5, h3: 1, hr: 1.5, so: 20, fo: 25, go: 25, speed: 50 },
  { name: "Z.トルマン(捕)", bb: 5, h1: 10, h2: 3, h3: 1, hr: 0.5, so: 35.5, fo: 20, go: 25, speed: 30 },
  { name: "K.ゴロウタスマン(投)", bb: 5, h1: 8, h2: 2, h3: 1, hr: 0.5, so: 35.5, fo: 20, go: 28, speed: 30 }
];

// 2. 相手の投手力・守備力に応じて打撃確率と走力を計算・規格化する関数
function getAdjustedMyBatters(pitchingStat, defenseStat) {
  // パラメータがない場合は基準値の50とする
  const pitching = pitchingStat !== undefined ? pitchingStat : 50;
  const defense = defenseStat !== undefined ? defenseStat : 50;
  
  // ① 出塁系の補正倍率 = 2^(1 - pitching/50)
  const multiplier = Math.pow(2, 1 - pitching / 50);

  // ② 相手の守備力に応じた走力の計算: (元の値) + 25 - defense/2
  return BASE_MY_BATTERS.map(b => {
    const newSpeed = b.speed + 25 - (defense / 2);

    // 出塁系の新しい確率を計算
    const newBb = b.bb * multiplier;
    const newH1 = b.h1 * multiplier;
    const newH2 = b.h2 * multiplier;
    const newH3 = b.h3 * multiplier;
    const newHr = b.hr * multiplier;

    // 出塁系の新しい合計値
    const newOffenseSum = newBb + newH1 + newH2 + newH3 + newHr;

    // アウト系（so, fo, go）の元の合計を計算
    const oldOutSum = b.so + b.fo + b.go;

    // 全体の合計が100になるようにアウト系を再配分
    const targetOutSum = Math.max(0.1, 100 - newOffenseSum);
    const outMultiplier = oldOutSum > 0 ? (targetOutSum / oldOutSum) : 0;
    
    const newSo = b.so * outMultiplier;
    const newFo = b.fo * outMultiplier;
    const newGo = b.go * outMultiplier;

    return {
      ...b,
      bb: newBb,
      h1: newH1,
      h2: newH2,
      h3: newH3,
      hr: newHr,
      so: newSo,
      fo: newFo,
      go: newGo,
      speed: newSpeed // ★ 補正後の走力を適用
    };
  });
}

function addErrorToStats(posName) {
  let batterIndex = -1;
  switch (posName) {
    case 'センター': batterIndex = 0; break;
    case 'レフト': batterIndex = 1; break;
    case 'ライト': batterIndex = 2; break;
    case 'ファースト': batterIndex = 3; break;
    case 'サード': batterIndex = 4; break;
    case 'ショート': batterIndex = 5; break;
    case 'セカンド': batterIndex = 6; break;
    case 'キャッチャー': batterIndex = 7; break;
    case 'ピッチャー': batterIndex = 8; break;
  }

  if (batterIndex !== -1 && currentGameStats.batters[batterIndex]) {
    currentGameStats.batters[batterIndex].e = (currentGameStats.batters[batterIndex].e || 0) + 1;
  }
}

function getPlayerName(posName) {
  if (!posName) return "選手";
  const found = defenseRoster.find(d => d.posName === posName);
  return found ? found.name : posName;
}

function createPullTendencyBar(val, hand = '右') {
  const p = Math.max(0, Math.min(100, val ?? 50));
  
  let leftLabel = '';
  let rightLabel = '';

  if (hand === '右') {
    leftLabel = '流';
    rightLabel = '引';
  } else if (hand === '左') {
    leftLabel = '引';
    rightLabel = '流';
  } else if (hand === '両') {
    leftLabel = '';
    rightLabel = '';
  }

  const leftSpan = leftLabel ? `<span style="font-size: 12px; color: #94a3b8;">${leftLabel}</span>` : '';
  const rightSpan = rightLabel ? `<span style="font-size: 12px; color: #94a3b8;">${rightLabel}</span>` : '';

  return `
    <span style="display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">
      ${leftSpan}
      <span style="position: relative; display: inline-block; width: 44px; height: 5px; background-color: #475569; border-radius: 3px;">
        <span style="position: absolute; top: 50%; left: ${p}%; transform: translate(-50%, -50%); width: 9px; height: 9px; background-color: #ffffff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></span>
      </span>
      ${rightSpan}
    </span>
  `;
}