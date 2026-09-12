const opponentList = [
  {
    level: 1,
    stage: "地方大会 初戦",
    schoolName: "雑魚稲高校",
    pitcherName: "雑魚井",
    pitching: 25,
    defense: 25,
    batters: [
      { order: 1, name: "阿呆川", pos: "中", hand: "左", speed: 30, hitSpeed: 30, pullTendency: 50 },
      { order: 2, name: "鰯田", pos: "右", hand: "左", speed: 25, hitSpeed: 30, pullTendency: 40 },
      { order: 3, name: "片内", pos: "二", hand: "右", speed: 20, hitSpeed: 30, pullTendency: 30 },
      { order: 4, name: "鈍間", pos: "一", hand: "右", speed: 10, hitSpeed: 25, pullTendency: 60 },
      { order: 5, name: "勝梨", pos: "三", hand: "右", speed: 15, hitSpeed: 25, pullTendency: 50 },
      { order: 6, name: "骨川", pos: "遊", hand: "左", speed: 15, hitSpeed: 30, pullTendency: 30 },
      { order: 7, name: "凡田", pos: "左", hand: "左", speed: 15, hitSpeed: 30, pullTendency: 20 },
      { order: 8, name: "弱木", pos: "捕", hand: "右", speed: 5, hitSpeed: 15, pullTendency: 10 },
      { order: 9, name: "雑魚井", pos: "投", hand: "右", speed: 5, hitSpeed: 15, pullTendency: 0 }
    ]
  },
  {
    level: 2,
    stage: "地方大会 2回戦",
    schoolName: "いろは高校",
    pitcherName: "李",
    pitching: 30,
    defense: 35,
    batters: [
      { order: 1, name: "井上", pos: "左", hand: "左", speed: 40, hitSpeed: 40, pullTendency: 50 },
      { order: 2, name: "六田", pos: "一", hand: "右", speed: 35, hitSpeed: 40, pullTendency: 40 },
      { order: 3, name: "橋本", pos: "三", hand: "右", speed: 35, hitSpeed: 40, pullTendency: 30 },
      { order: 4, name: "仁科", pos: "二", hand: "右", speed: 10, hitSpeed: 45, pullTendency: 60 },
      { order: 5, name: "保科", pos: "遊", hand: "右", speed: 20, hitSpeed: 45, pullTendency: 50 },
      { order: 6, name: "辺見", pos: "中", hand: "左", speed: 20, hitSpeed: 40, pullTendency: 30 },
      { order: 7, name: "東郷", pos: "捕", hand: "右", speed: 20, hitSpeed: 40, pullTendency: 20 },
      { order: 8, name: "千早", pos: "右", hand: "右", speed: 10, hitSpeed: 30, pullTendency: 10 },
      { order: 9, name: "李", pos: "投", hand: "右", speed: 10, hitSpeed: 30, pullTendency: 0 }
    ]
  },
  {
    level: 3,
    stage: "地方大会 3回戦",
    schoolName: "甲田高校",
    pitcherName: "癸生川",
    pitching: 40,
    defense: 70,
    batters: [
      { order: 1, name: "乙部", pos: "右", hand: "左", speed: 50, hitSpeed: 45, pullTendency: 70 },
      { order: 2, name: "丙", pos: "一", hand: "左", speed: 45, hitSpeed: 45, pullTendency: 50 },
      { order: 3, name: "丁野", pos: "二", hand: "左", speed: 45, hitSpeed: 45, pullTendency: 40 },
      { order: 4, name: "戊谷", pos: "三", hand: "右", speed: 55, hitSpeed: 55, pullTendency: 70 },
      { order: 5, name: "己波", pos: "遊", hand: "左", speed: 50, hitSpeed: 50, pullTendency: 60 },
      { order: 6, name: "庚田", pos: "捕", hand: "右", speed: 40, hitSpeed: 45, pullTendency: 40 },
      { order: 7, name: "辛嶋", pos: "左", hand: "右", speed: 40, hitSpeed: 45, pullTendency: 30 },
      { order: 8, name: "壬生", pos: "中", hand: "右", speed: 45, hitSpeed: 35, pullTendency: 30 },
      { order: 9, name: "癸生川", pos: "投", hand: "右", speed: 50, hitSpeed: 35, pullTendency: 20 }
    ]
  },
{
    level: 4,
    stage: "地方大会 準決勝",
    schoolName: "凡庸高校",
    pitcherName: "小林",
    pitching: 50,
    defense: 50,
    batters: [
      { order: 1, name: "佐藤", pos: "三", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 2, name: "鈴木", pos: "右", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 3, name: "高橋", pos: "中", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 4, name: "田中", pos: "一", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 5, name: "伊藤", pos: "二", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 6, name: "渡辺", pos: "遊", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 7, name: "山本", pos: "左", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 8, name: "中村", pos: "捕", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 },
      { order: 9, name: "小林", pos: "投", hand: "右", speed: 50, hitSpeed: 50, pullTendency: 50 }
    ]
  },
{
    level: 5,
    stage: "地方大会 決勝",
    schoolName: "栄光学院",
    pitcherName: "杉本",
    pitching: 60,
    defense: 60,
    batters: [
      { order: 1, name: "杉本", pos: "投", hand: "右", speed: 70, hitSpeed: 40, pullTendency: 70 },
      { order: 2, name: "島田", pos: "捕", hand: "右", speed: 65, hitSpeed: 50, pullTendency: 70 },
      { order: 3, name: "古川", pos: "一", hand: "両", speed: 50, hitSpeed: 60, pullTendency: 30 },
      { order: 4, name: "大西", pos: "二", hand: "右", speed: 50, hitSpeed: 70, pullTendency: 80 },
      { order: 5, name: "水野", pos: "三", hand: "左", speed: 50, hitSpeed: 65, pullTendency: 30 },
      { order: 6, name: "櫻井", pos: "遊", hand: "右", speed: 65, hitSpeed: 60, pullTendency: 50 },
      { order: 7, name: "高野", pos: "左", hand: "右", speed: 55, hitSpeed: 55, pullTendency: 55 },
      { order: 8, name: "吉川", pos: "中", hand: "右", speed: 45, hitSpeed: 45, pullTendency: 40 },
      { order: 9, name: "渡部", pos: "右", hand: "左", speed: 40, hitSpeed: 40, pullTendency: 30 }
    ]
  },
{
    level: 6,
    stage: "甲子園　初戦",
    schoolName: "中山高校",
    pitcherName: "中山",
    pitching: 50,
    defense: 95,
    batters: [
      { order: 1, name: "中田", pos: "右", hand: "右", speed: 75, hitSpeed: 70, pullTendency: 80 },
      { order: 2, name: "山田", pos: "左", hand: "左", speed: 70, hitSpeed: 50, pullTendency: 30 },
      { order: 3, name: "中川", pos: "一", hand: "右", speed: 50, hitSpeed: 60, pullTendency: 70 },
      { order: 4, name: "山川", pos: "三", hand: "左", speed: 60, hitSpeed: 70, pullTendency: 70 },
      { order: 5, name: "中井", pos: "二", hand: "右", speed: 50, hitSpeed: 65, pullTendency: 60 },
      { order: 6, name: "山井", pos: "遊", hand: "左", speed: 60, hitSpeed: 60, pullTendency: 20 },
      { order: 7, name: "中原", pos: "中", hand: "右", speed: 65, hitSpeed: 60, pullTendency: 50 },
      { order: 8, name: "山原", pos: "捕", hand: "左", speed: 60, hitSpeed: 55, pullTendency: 20 },
      { order: 9, name: "中山", pos: "投", hand: "両", speed: 60, hitSpeed: 55, pullTendency: 70 }
    ]
  },
{
    level: 7,
    stage: "甲子園　2回戦",
    schoolName: "歴史ヶ丘高校",
    pitcherName: "飛鳥",
    pitching: 65,
    defense: 65,
    batters: [
      { order: 1, name: "弥生", pos: "三", hand: "右", speed: 60, hitSpeed: 40, pullTendency: 60 },
      { order: 2, name: "飛鳥", pos: "投", hand: "右", speed: 55, hitSpeed: 40, pullTendency: 30 },
      { order: 3, name: "奈良", pos: "二", hand: "両", speed: 90, hitSpeed: 90, pullTendency: 90 },
      { order: 4, name: "鎌倉", pos: "遊", hand: "両", speed: 90, hitSpeed: 90, pullTendency: 90 },
      { order: 5, name: "室町", pos: "捕", hand: "左", speed: 50, hitSpeed: 65, pullTendency: 60 },
      { order: 6, name: "安土", pos: "一", hand: "右", speed: 60, hitSpeed: 50, pullTendency: 40 },
      { order: 7, name: "桃山", pos: "左", hand: "右", speed: 55, hitSpeed: 50, pullTendency: 50 },
      { order: 8, name: "江戸", pos: "右", hand: "右", speed: 50, hitSpeed: 45, pullTendency: 20 },
      { order: 9, name: "大正", pos: "中", hand: "左", speed: 50, hitSpeed: 45, pullTendency: 70 }
    ]
  },
{
    level: 8,
    stage: "甲子園 3回戦",
    schoolName: "侍日本モドキ学園",
    pitcherName: "小谷",
    pitching: 75,
    defense: 60,
    batters: [
      { order: 1, name: "斤藤", pos: "左", hand: "左", speed: 60, hitSpeed: 70, pullTendency: 50 },
      { order: 2, name: "小谷", pos: "投", hand: "左", speed: 80, hitSpeed: 75, pullTendency: 20 },
      { order: 3, name: "鈴本", pos: "右", hand: "右", speed: 65, hitSpeed: 70, pullTendency: 70 },
      { order: 4, name: "村下", pos: "一", hand: "左", speed: 60, hitSpeed: 75, pullTendency: 25 },
      { order: 5, name: "丘本", pos: "三", hand: "右", speed: 60, hitSpeed: 70, pullTendency: 70 },
      { order: 6, name: "古田", pos: "中", hand: "左", speed: 60, hitSpeed: 70, pullTendency: 30 },
      { order: 7, name: "槙", pos: "二", hand: "右", speed: 60, hitSpeed: 65, pullTendency: 70 },
      { order: 8, name: "坂木", pos: "捕", hand: "右", speed: 60, hitSpeed: 55, pullTendency: 60 },
      { order: 9, name: "原田", pos: "遊", hand: "左", speed: 65, hitSpeed: 55, pullTendency: 50 }
    ]
  },
{
    level: 9,
    stage: "甲子園 準決勝",
    schoolName: "知弁岡山高校",
    pitcherName: "三宅",
    pitching: 70,
    defense: 95,
    batters: [
      { order: 1, name: "内山", pos: "遊", hand: "左", speed: 75, hitSpeed: 50, pullTendency: 80 },
      { order: 2, name: "成田", pos: "一", hand: "右", speed: 70, hitSpeed: 70, pullTendency: 20 },
      { order: 3, name: "川島", pos: "二", hand: "右", speed: 65, hitSpeed: 80, pullTendency: 70 },
      { order: 4, name: "杉浦", pos: "三", hand: "右", speed: 60, hitSpeed: 80, pullTendency: 80 },
      { order: 5, name: "桑原", pos: "中", hand: "左", speed: 60, hitSpeed: 80, pullTendency: 90 },
      { order: 6, name: "沢田", pos: "左", hand: "左", speed: 70, hitSpeed: 65, pullTendency: 15 },
      { order: 7, name: "片岡", pos: "右", hand: "右", speed: 70, hitSpeed: 60, pullTendency: 70 },
      { order: 8, name: "三宅", pos: "投", hand: "右", speed: 65, hitSpeed: 55, pullTendency: 20 },
      { order: 9, name: "富田", pos: "捕", hand: "右", speed: 60, hitSpeed: 55, pullTendency: 70 }
    ]
  },
{
    level: 10,
    stage: "甲子園 決勝",
    schoolName: "帝都第一高校",
    pitcherName: "勅使河原",
    pitching: 80,
    defense: 80,
    batters: [
      { order: 1, name: "早川", pos: "中", hand: "左", speed: 90, hitSpeed: 50, pullTendency: 70 },
      { order: 2, name: "巧田", pos: "遊", hand: "両", speed: 75, hitSpeed: 60, pullTendency: 30 },
      { order: 3, name: "福打", pos: "捕", hand: "左", speed: 70, hitSpeed: 80, pullTendency: 70 },
      { order: 4, name: "剛田", pos: "一", hand: "右", speed: 70, hitSpeed: 90, pullTendency: 70 },
      { order: 5, name: "財前", pos: "二", hand: "右", speed: 65, hitSpeed: 85, pullTendency: 60 },
      { order: 6, name: "熊谷", pos: "左", hand: "右", speed: 75, hitSpeed: 75, pullTendency: 20 },
      { order: 7, name: "早瀬", pos: "三", hand: "右", speed: 80, hitSpeed: 70, pullTendency: 50 },
      { order: 8, name: "大山", pos: "右", hand: "左", speed: 70, hitSpeed: 65, pullTendency: 20 },
      { order: 9, name: "勅使河原", pos: "投", hand: "右", speed: 60, hitSpeed: 60, pullTendency: 70 }
    ]
  },
  {
    level: 11,
    stage: "番外編",
    schoolName: "NPBベストナイン",
    pitcherName: "大谷",
    pitching: 100,
    defense: 100,
    batters: [
      { order: 1, name: "イチロー", pos: "右", hand: "左", speed: 100, hitSpeed: 20, pullTendency: 80 },
      { order: 2, name: "大谷", pos: "投", hand: "左", speed: 90, hitSpeed: 100, pullTendency: 10 },
      { order: 3, name: "王", pos: "一", hand: "左", speed: 80, hitSpeed: 100, pullTendency: 30 },
      { order: 4, name: "長嶋", pos: "三", hand: "右", speed: 80, hitSpeed: 90, pullTendency: 70 },
      { order: 5, name: "松井（英）", pos: "左", hand: "右", speed: 80, hitSpeed: 90, pullTendency: 70 },
      { order: 6, name: "落合", pos: "二", hand: "右", speed: 80, hitSpeed: 90, pullTendency: 70 },
      { order: 7, name: "野村", pos: "捕", hand: "右", speed: 80, hitSpeed: 90, pullTendency: 70 },
      { order: 8, name: "張本", pos: "中", hand: "左", speed: 90, hitSpeed: 90, pullTendency: 50 },
      { order: 9, name: "松井（稼）", pos: "遊", hand: "両", speed: 90, hitSpeed: 85, pullTendency: 50 }
    ]
  }
];