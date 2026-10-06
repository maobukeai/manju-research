/* ============================================================
   漫剧研究学习平台 · 外挂模块：选型向导（picker）
   —— 答题式工具链收敛器：6 步单选问答（用途场景 / 月预算 / 产能节奏 /
      是否出海 / 协作方式 / 画质要求），加权计分当场输出
      「主力视频模型 + 跑量方案 + 画布工具 + 配音剪辑」组合推荐，
      每项带推荐理由与价格档，data-go 深链「工具库」?hl= 高亮对应卡片。
   数据来源（不新增研究口径）：
   · 视频模型推荐池 = DB.videoCompare 8 款模型的 scene/price 口径 + DB.videoCompareNote 选型口诀
   · 画布三档 = DB.canvas.select / DB.canvas.deepGuides
   · 配音剪辑价格档与理由 = DB.tools 对应条目的 price/tag 字段
   · 题目与计分权重为本文件内常量；答案持久化 localStorage「manju_picker_v1」
   定位：与「收益决策树」（选变现路径）、「工具库」（可筛选全量库）互补不重复。
   ============================================================ */
(function () {
  'use strict';

  var PK_KEY = 'manju_picker_v1';
  var pkState = null; /* { v:1, ans:{qid:optKey}, hist:[qid...] } */
  var ctx = null;     /* window.MJ */
  /* data.js 以顶层 const 声明 DB（全局词法绑定，不在 window 上，MJ.DB 实为 undefined）；
     与 app.js 既有渲染器一致，直接引用裸标识符 DB（同步脚本序保证 data.js 先于本文件执行） */
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* ---------- 候选池：k 为模块内键，vc 绑定 DB.videoCompare 下标，
     hl 为「工具库」卡片 data-hl 键（= DB.tools 的 n，深链高亮用） ---------- */
  var MODELS = [
    { k: 'jm',     vc: 0, fam: 'jm',     motto: '叙事段落用Seedance 2.5',           hl: '即梦 Seedance',  hlNote: '' },
    { k: 'kl4',    vc: 1, fam: 'kl',     motto: '大场面4K上可灵4.0',                hl: '可灵 Kling',     hlNote: '（4.0 档）' },
    { k: 'kl3',    vc: 2, fam: 'kl',     motto: '跑量用3.0 Omni或海螺Fast',         hl: '可灵 Kling',     hlNote: '（3.0 Omni 档）' },
    { k: 'vidu',   vc: 3, fam: 'vidu',   motto: '',                                 hl: 'Vidu',           hlNote: '' },
    { k: 'hailuo', vc: 4, fam: 'hailuo', motto: '跑量用3.0 Omni或海螺Fast',         hl: '海螺 Hailuo',    hlNote: '' },
    { k: 'veo',    vc: 5, fam: 'veo',    motto: '出海用Veo',                        hl: 'Veo 3.1',        hlNote: '' },
    { k: 'runway', vc: 6, fam: 'runway', motto: '修复改写用Runway Aleph',           hl: 'Runway',         hlNote: '' },
    { k: 'wan',    vc: 7, fam: 'wan',    motto: '私有化用Wan',                      hl: '通义万相 Wan',   hlNote: '' },
  ];
  var MODEL_ORDER = ['jm', 'kl4', 'kl3', 'vidu', 'hailuo', 'veo', 'runway', 'wan'];
  /* 跑量方案并列时的优先序：免费/低成本优先 */
  var V_PRI = ['kl3', 'hailuo', 'wan', 'jm', 'vidu', 'kl4', 'veo', 'runway'];
  /* 当前倾向轻提示：领先模型 → 链路标签 */
  var LEAN = {
    jm: '国产叙事主力链路', kl4: '旗舰大场面链路', kl3: '免费/性价比跑量链路',
    vidu: '整段声画直出链路', hailuo: '低成本动作跑量链路', veo: '出海国际链路',
    runway: '素材修复改写链路', wan: '私有化开源链路',
  };

  /* ---------- 题库与计分权重（模块内常量） ----------
     w = 主力模型计分增量；v = 跑量方案计分增量（单独排序，保证与主力互补） */
  var QS = [
    { id: 'scene', short: '用途', t: '你做漫剧，主力镜头是什么类型？',
      sub: '对应「工具库」视频模型对比表的「适用场景」列——这是主力模型的定档依据。',
      opts: [
        { k: 'story',  n: '剧情叙事',          d: '台词戏、多镜头叙事段落，剧情连贯优先', w: { jm: 3, vidu: 2, kl4: 1, kl3: 1 }, v: { kl3: 1, hailuo: 1 } },
        { k: 'action', n: '大场面 / 动作戏',   d: '打斗、爆炸、复杂运镜，单镜头震撼优先', w: { kl4: 3, hailuo: 2, jm: 1 }, v: { kl3: 1, hailuo: 2 } },
        { k: 'volume', n: '日更跑量短打',      d: '爽点节奏快、量大管饱，成本与产能优先于单镜上限', w: { kl3: 2, hailuo: 2, wan: 2, jm: 1 }, v: { kl3: 2, hailuo: 2, wan: 2, jm: 1 } },
        { k: 'mix',    n: '混合都做',          d: '叙事为主，穿插大场面和跑量素材', w: { jm: 2, kl4: 2, vidu: 1 }, v: { jm: 1, kl3: 1 } },
      ] },
    { id: 'budget', short: '预算', t: '每月愿意为生成工具花多少钱？',
      sub: '决定价格档——免费链路靠每日积分与开源模型硬扛，旗舰档买的是单镜上限。',
      opts: [
        { k: 'free',  n: '免费 / 极低（<¥50）',  d: '白嫖每日免费积分 + 开源模型，一分钱掰两半花', w: { wan: 3, kl3: 2, hailuo: 1, jm: 1 }, v: { wan: 3, kl3: 2 } },
        { k: 'light', n: '轻预算（¥50-300）',    d: '够一张低价档会员或按量小额充值', w: { hailuo: 3, kl3: 2, jm: 2, vidu: 1 }, v: { hailuo: 2, kl3: 1, wan: 1 } },
        { k: 'mid',   n: '认真投入（¥300-1000）', d: '主力会员拉满，配额不再是抽卡瓶颈', w: { jm: 3, kl4: 2, vidu: 2, kl3: 1 }, v: { jm: 2, kl3: 1 } },
        { k: 'high',  n: '工作室级（¥1000+）',   d: '多席位会员 + API 走量，追头部画质与产能', w: { kl4: 3, veo: 2, runway: 2, jm: 1 }, v: { kl3: 2, jm: 1 } },
      ] },
    { id: 'pace', short: '节奏', t: '更新节奏打算怎么排？',
      sub: '节奏决定抽卡次数：日更的每一次重 roll 都是钱，慢工细活可以慢慢磨关键镜头。',
      opts: [
        { k: 'slow',   n: '慢工细活（周更1集或更低）', d: '精品导向，单镜反复抽卡到满意为止', w: { kl4: 2, jm: 2, veo: 1, runway: 1 }, v: {} },
        { k: 'weekly', n: '稳定周更（2-3集）',         d: '产量质量平衡，要一条顺手的固定产线', w: { jm: 2, vidu: 1, kl3: 1, hailuo: 1 }, v: { kl3: 1, hailuo: 1, jm: 1 } },
        { k: 'daily',  n: '日更冲量（每天1集+）',      d: '工业化流水线，成本曲线压到最低', w: { kl3: 2, hailuo: 2, wan: 2, jm: 1 }, v: { kl3: 2, hailuo: 2, wan: 2, jm: 1 } },
      ] },
    { id: 'sea', short: '出海', t: '内容发国内还是海外？',
      sub: '出海英文向直接换生态：Veo 原生音频与画质口碑第一，配音口型也要换国际线。',
      opts: [
        { k: 'no',   n: '只做国内',     d: '红果/抖音/快手分发，国产模型生态最顺', w: { jm: 2, kl4: 1, kl3: 1, hailuo: 1 }, v: {} },
        { k: 'yes',  n: '出海为主',     d: '英文向 / TikTok / YouTube，英文台词与海外审美元素多', w: { veo: 4, runway: 2, vidu: 1 }, v: { veo: 1 } },
        { k: 'both', n: '国内海外双线', d: '一鱼两吃：主链路国产，关键出海镜头另开国际档', w: { jm: 1, veo: 2, vidu: 2, runway: 1 }, v: {} },
      ] },
    { id: 'team', short: '协作', t: '几个人干活？',
      sub: '协作方式主要决定画布工具档位与流程编排——单人拼链路最短，工作室拼统筹与私有化。',
      opts: [
        { k: 'solo',   n: '单人作战',                d: '一条龙全包，工具越少越好、链路越短越好', w: { kl3: 1, jm: 1 }, v: {} },
        { k: 'duo',    n: '2-3 人小队',              d: '有人写本有人出图出片，轻协作即可', w: { vidu: 1, kl4: 1, jm: 1 }, v: {} },
        { k: 'studio', n: '5 人以上 / 多人协作',     d: '需要画布多人实时协作、资产统一管理', w: { kl4: 1, runway: 1, wan: 1 }, v: { wan: 1 } },
      ] },
    { id: 'qual', short: '画质', t: '成片质量标准定在哪一档？',
      sub: '决定"达标就发"还是"关键镜头上旗舰"——跑量与精品的预算分配完全不同。',
      opts: [
        { k: 'ok',     n: '达标就行',               d: '能看、出片快，先跑通闭环再谈升级', w: { kl3: 2, hailuo: 2, wan: 1 }, v: { kl3: 1, hailuo: 1, wan: 1 } },
        { k: 'hd',     n: '精品感',                 d: '封面级关键镜头、4K 规格，观众一眼看出制作力', w: { kl4: 3, veo: 2, jm: 1 }, v: { jm: 1, kl3: 1 } },
        { k: 'client', n: '商单交付标准',           d: '客户审片，稳定性与可修改性优先', w: { veo: 2, runway: 2, kl4: 2, vidu: 1 }, v: {} },
      ] },
  ];

  /* ---------- 画布三档：sel 绑定 DB.canvas.select 下标，guides 绑定 DB.canvas.deepGuides 下标 ---------- */
  var CANVAS_TIERS = [
    { sel: 0, guides: [0],    go: 'canvas', goLabel: '→ 「无限画布」看实操与对比' },
    { sel: 1, guides: [1, 2], go: 'canvas', goLabel: '→ 「无限画布」看实操与对比' },
    { sel: 2, guides: [3, 5], go: 'tools?hl=' + encodeURIComponent('星流Agent / Lovart'), goLabel: '→ 工具库「星流Agent / Lovart」' },
  ];

  /* ---------- 小工具 ---------- */
  function esc(s) { return ctx.esc(s); }
  function eachKey(o, fn) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) fn(k, o[k]); }
  function trim(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + '…' : s; }
  function modelOf(k) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].k === k) return MODELS[i]; return MODELS[0]; }
  function vcOf(m) { return DBX.videoCompare[m.vc]; }
  function optOf(q, k) { for (var i = 0; i < q.opts.length; i++) if (q.opts[i].k === k) return q.opts[i]; return null; }
  function argMax(tab, order) {
    var best = order[0];
    order.forEach(function (k) { if (tab[k] > tab[best]) best = k; });
    return best;
  }
  function toolInfo(name) {
    var list = (DBX && DBX.tools) || [];
    for (var i = 0; i < list.length; i++) if (list[i].n === name) return list[i];
    return null;
  }
  function hlLink(name) { return 'tools?hl=' + encodeURIComponent(name); }

  /* ---------- 计分 ---------- */
  function score(ans) {
    var tot = {}, vol = {};
    MODEL_ORDER.forEach(function (k) { tot[k] = 0; vol[k] = 0; });
    QS.forEach(function (q) {
      var o = optOf(q, ans[q.id]);
      if (!o) return;
      eachKey(o.w, function (mk, dv) { if (tot[mk] !== undefined) tot[mk] += dv; });
      eachKey(o.v, function (mk, dv) { if (vol[mk] !== undefined) vol[mk] += dv; });
    });
    return { tot: tot, vol: vol };
  }

  /* ---------- 结果推导 ---------- */
  function canvasTierIdx(ans) {
    if (ans.team === 'studio') return 2;
    if ((ans.budget === 'free' || ans.budget === 'light') && ans.team === 'solo') return 0;
    return 1;
  }
  function computeResult(ans) {
    var s = score(ans);
    var mainK = argMax(s.tot, MODEL_ORDER);
    var rest = MODEL_ORDER.filter(function (k) { return k !== mainK; });
    var secK = rest[0];
    rest.forEach(function (k) { if (s.tot[k] > s.tot[secK]) secK = k; });
    var volK = argMax(s.vol, V_PRI.filter(function (k) { return k !== mainK; }));

    var main = modelOf(mainK), vol = modelOf(volK), second = modelOf(secK);
    var mainVc = vcOf(main), volVc = vcOf(vol), secVc = vcOf(second);

    var warn = '';
    if (ans.budget === 'free' && (mainK === 'veo' || mainK === 'runway' || mainK === 'kl4')) {
      warn = '该模型为付费订阅档（' + mainVc.price + '），与「免费 / 极低」预算冲突——建议先用免费积分试产，或直接以次选「' + secVc.m + '」为主力。';
    }

    var famSame = main.fam === vol.fam;

    var tierIdx = canvasTierIdx(ans);
    var ct = CANVAS_TIERS[tierIdx];
    var sel = DBX.canvas.select[ct.sel];
    var guides = ct.guides.map(function (gi) { return DBX.canvas.deepGuides[gi]; });

    function toolPack(name) {
      var t = toolInfo(name);
      return { tool: name, price: t ? t.price : '—', why: t ? t.tag : '', hl: name };
    }
    var audioName = ans.sea === 'yes' ? 'ElevenLabs' : 'MiniMax Speech';
    var editName = (ans.team === 'studio' || ans.qual === 'client' || ans.sea === 'yes') ? 'Premiere / DaVinci' : '剪映专业版';
    var lipsName = ans.sea === 'yes' ? 'Hedra' : (ans.scene === 'story' ? '即梦对口型' : '可灵对口型');

    return {
      main: { m: main, vc: mainVc },
      vol: { m: vol, vc: volVc, famSame: famSame },
      second: { m: second, vc: secVc, gap: s.tot[mainK] - s.tot[secK] },
      warn: warn,
      canvas: { tierIdx: tierIdx, tierName: sel.w, pick: sel.pick, why: sel.why, guides: guides, go: ct.go, goLabel: ct.goLabel },
      audio: toolPack(audioName),
      edit: toolPack(editName),
      lips: toolPack(lipsName),
    };
  }

  /* ---------- 本地持久化 ---------- */
  function save() { ctx.store.set(PK_KEY, pkState); }
  function loadState() {
    var s = ctx.store.get(PK_KEY, null);
    if (!s || typeof s !== 'object' || s.v !== 1) return null;
    if (!s.ans || typeof s.ans !== 'object' || !Array.isArray(s.hist)) return null;
    if (s.hist.length > QS.length) return null;
    for (var i = 0; i < s.hist.length; i++) {
      if (s.hist[i] !== QS[i].id || !optOf(QS[i], s.ans[s.hist[i]])) return null;
    }
    return { v: 1, ans: s.ans, hist: s.hist };
  }
  function reset() {
    pkState = null;
    try { localStorage.removeItem(PK_KEY); } catch (e) { }
    ctx.toast('↻ 已重置，重新开始');
    draw();
  }

  /* ---------- 状态动作 ---------- */
  function start() { pkState = { v: 1, ans: {}, hist: [] }; save(); draw(); }
  function pick(key) {
    var qi = pkState.hist.length;
    if (qi >= QS.length) return;
    var q = QS[qi];
    var sep = key.indexOf(':');
    if (sep < 0 || key.slice(0, sep) !== q.id) return; /* 只接受当前题的作答 */
    var k = key.slice(sep + 1);
    if (!optOf(q, k)) return;
    pkState.ans[q.id] = k;
    if (pkState.hist[qi] !== q.id) pkState.hist.push(q.id);
    save();
    var done = pkState.hist.length >= QS.length;
    draw();
    if (done) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function back() {
    if (!pkState || !pkState.hist.length) return;
    var last = pkState.hist.pop();
    delete pkState.ans[last];
    save(); draw();
  }
  function jump(i) {
    if (!pkState || i >= pkState.hist.length) return;
    /* 第 i 段步进对应第 i 题（0 基）：保留前 i 个答案，从第 i 题起重答 */
    var drop = pkState.hist.splice(i);
    drop.forEach(function (qid) { delete pkState.ans[qid]; });
    save(); draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 视图：步进条 / 倾向提示 ---------- */
  function stepsHtml(cur) {
    return '<div class="pk-steps">' + QS.map(function (q, i) {
      var cls = i < cur ? 'done' : (i === cur ? 'cur' : '');
      var act = i < cur ? ' data-pk-step="' + i + '" title="回到第' + (i + 1) + '题改答（其后作答将作废）"' : ' disabled';
      return '<button class="pk-step ' + cls + '"' + act + '><i>' + (i + 1) + '</i><span>' + q.short + '</span></button>';
    }).join('') + '</div>';
  }
  function leanHtml() {
    if (!pkState || !pkState.hist.length) return '';
    var lead = modelOf(argMax(score(pkState.ans).tot, MODEL_ORDER));
    return '<div class="pk-lean">🧭 已偏向：<b>' + esc(LEAN[lead.k]) + '</b> · 当前候选「' + esc(vcOf(lead).m) + '」' +
      '<span style="margin-left:auto;color:var(--tx3);flex-shrink:0">随作答即时更新</span></div>';
  }

  /* ---------- 视图：开场 / 答题 / 结果 ---------- */
  function viewIntro() {
    var chips = QS.map(function (q) { return '<span class="chip on" style="cursor:default">' + q.short + '</span>'; }).join('');
    return '<div class="card" style="text-align:center;padding:38px 20px">' +
      '<div style="font-size:42px">🎯</div>' +
      '<b style="font-size:18px;display:block;margin:10px 0 6px">工具链选型向导</b>' +
      '<p style="font-size:13px;color:var(--tx2);max-width:600px;margin:0 auto">答 ' + QS.length + ' 个问题（用途场景 / 月预算 / 产能节奏 / 是否出海 / 协作方式 / 画质要求），当场加权计分，输出「主力视频模型 + 跑量方案 + 画布工具 + 配音剪辑」组合推荐——每项带推荐理由与价格档，可一键深链「工具库」高亮对应卡片。</p>' +
      '<div class="tool-filters" style="justify-content:center;margin-top:12px">' + chips + '</div>' +
      '<div class="callout blue" style="max-width:600px;margin:14px auto 0;text-align:left"><b>三件套分工：</b>「收益决策树」选的是变现路径，「工具库」是可筛选的全量库，本向导是答题式收敛器——先把组合定下来，再去全量库里挑替身。</div>' +
      '<button class="btn pri" data-pk-start style="margin-top:18px">开始作答 →</button>' +
      '<p class="mini-note">题目与权重为本模块内置口径；推荐池仅 DB.videoCompare 8 款视频模型 + 画布三档选型，不新增研究结论。作答进度自动保存在本机浏览器，中途离开回来可续答。</p></div>';
  }
  function viewQuestion() {
    var i = pkState.hist.length;
    var q = QS[i];
    var cur = pkState.ans[q.id];
    var opts = q.opts.map(function (o) {
      return '<button class="quiz-opt pk-opt' + (cur === o.k ? ' on' : '') + '" data-pk-opt="' + q.id + ':' + o.k + '">' +
        '<b>' + esc(o.n) + '</b><span>' + esc(o.d) + '</span></button>';
    }).join('');
    return stepsHtml(i) + leanHtml() +
      '<div class="card quiz-card">' +
      '<div class="quiz-head"><span class="tag">第 ' + (i + 1) + ' / ' + QS.length + ' 题 · ' + q.short + '</span><span class="tag c">单选 · 即时计分</span></div>' +
      '<div class="quiz-q">' + esc(q.t) + '</div>' +
      '<p class="mini-note" style="margin:0">' + esc(q.sub) + '</p>' +
      '<div class="quiz-opts">' + opts + '</div>' +
      '<div style="margin-top:14px">' +
      (i > 0 ? '<button class="btn ghost" data-pk-back>← 上一步</button> ' : '') +
      '<button class="btn ghost" data-pk-reset>↻ 重答</button></div></div>';
  }
  function zoneMain(R) {
    var M = R.main.m, vc = R.main.vc;
    var lis = ['场景匹配「' + esc(vc.scene) + '」'];
    if (M.motto) lis.push('选型口诀（引自「工具库」对比表）：' + esc(M.motto));
    lis.push('能力亮点：' + esc(trim(vc.adv, 76)));
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag c">① 主力视频模型</span><div class="pk-price">💰 ' + esc(vc.price) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(vc.m) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      (R.warn ? '<div class="callout red pk-warn"><b>预算提示：</b>' + esc(R.warn) + '</div>' : '') +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink(M.hl) + '">→ 工具库「' + esc(M.hl) + '」' + esc(M.hlNote) + '</button></div></div>';
  }
  function zoneVol(R) {
    var v = R.vol, vc = v.vc;
    var lis = ['场景匹配「' + esc(vc.scene) + '」'];
    if (v.famSame) lis.push('与主力同生态换档：关键镜头留在主力档，跑量镜头降到本档控成本。');
    else lis.push('与主力互补："开源跑量 + 闭源关键镜头"的混合编排是工作室降本标配（引自选型口诀）。');
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag g">② 跑量方案</span><div class="pk-price">💰 ' + esc(vc.price) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(vc.m) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink(v.m.hl) + '">→ 工具库「' + esc(v.m.hl) + '」' + esc(v.m.hlNote) + '</button></div></div>';
  }
  function zoneCanvas(R) {
    var c = R.canvas;
    var lis = ['三档选型（引自「无限画布」）：' + esc(c.why)];
    c.guides.forEach(function (g) { lis.push(g.n + '：' + esc(trim(g.d, 84))); });
    lis.push('价格档：画布工具未收录价格口径，以「无限画布」对比表与各自生态会员为准。');
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag">③ 画布工具</span><div class="pk-price">档位 · ' + esc(c.tierName) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(c.pick) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + c.go + '">' + esc(c.goLabel) + '</button></div></div>';
  }
  function pkRow(label, t) {
    return '<div class="pk-row"><div style="min-width:0">' +
      '<b>' + label + ' · ' + esc(t.tool) + '</b>' +
      '<div style="font-size:12px;color:var(--tx2);margin-top:2px">' + esc(trim(t.why, 58)) + '</div>' +
      '<div style="font-size:11.5px;color:var(--gold);margin-top:2px">💰 ' + esc(t.price) + '</div></div>' +
      '<button class="btn ghost pk-go" data-go="' + hlLink(t.tool) + '" title="去工具库高亮「' + esc(t.tool) + '」">→</button></div>';
  }
  function zoneAudio(R) {
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag h">④ 配音剪辑</span><div class="pk-price">价格档见各行</div></div>' +
      '<b class="pk-zone-t">声音与成片的最后两公里</b>' +
      '<div class="pk-rows">' + pkRow('配音', R.audio) + pkRow('剪辑', R.edit) + pkRow('口型', R.lips) + '</div>' +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink('剪映音效库') + '">→ 音效：剪映音效库（免费）</button></div></div>';
  }
  function viewResult() {
    var R = computeResult(pkState.ans);
    var recap = QS.map(function (q) {
      var o = optOf(q, pkState.ans[q.id]);
      return '<span class="chip on" style="cursor:default">' + q.short + '：' + esc(o ? o.n : '—') + '</span>';
    }).join('');
    var copyId = ctx.regCopy(copyText(R));
    return stepsHtml(QS.length) +
      '<div class="card" style="padding:16px 18px;margin-bottom:14px"><span class="tag g">组合推荐已生成</span>' +
      '<b style="display:block;font-size:17px;margin:8px 0 2px">▸ 你的推荐工具链</b>' +
      '<div class="tool-filters" style="margin-top:8px">' + recap + '</div>' +
      '<p class="mini-note">点任意已完成步骤可回退改答（其后作答将作废重答）。</p></div>' +
      '<div class="grid g2">' + zoneMain(R) + zoneVol(R) + zoneCanvas(R) + zoneAudio(R) + '</div>' +
      '<div class="card" style="margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px">' +
      '<span class="tag">次选备胎</span><b>' + esc(R.second.vc.m) + '</b>' +
      '<span style="font-size:12.5px;color:var(--tx2)">与主力总分差 ' + R.second.gap + ' 分——题材切换或某档涨价时的第一替换。</span>' +
      '<button class="btn ghost pk-go" data-go="' + hlLink(R.second.m.hl) + '">→ 工具库「' + esc(R.second.m.hl) + '」' + esc(R.second.m.hlNote) + '</button></div>' +
      '<div class="card" style="margin-top:14px">' +
      '<div class="pk-foot">' +
      '<button class="btn pri" data-copy="' + copyId + '">📋 一键复制推荐清单</button>' +
      '<button class="btn ghost" data-pk-back>← 回上一题改答</button>' +
      '<button class="btn ghost" data-pk-reset>↻ 重答</button>' +
      '<button class="btn ghost" data-go="tools">浏览「工具库」全量库 →</button>' +
      '<button class="btn ghost" data-go="earnpath">去「收益决策树」选变现路径 →</button></div>' +
      '<p class="mini-note">计分口径：推荐池仅为 DB.videoCompare 8 款视频模型与画布三档选型，权重为本模块内置常量（出海 / 场景 / 预算权重最高，节奏 / 画质次之，协作最低）；价格档引用「工具库」对比表当日数据。本模块不新增研究口径。</p></div>';
  }
  function copyText(R) {
    var L = [];
    L.push('【漫剧研究 · 选型向导】我的推荐工具链');
    L.push('1. 主力视频模型：' + R.main.vc.m);
    L.push('   价格档：' + R.main.vc.price);
    L.push('   理由：场景匹配「' + R.main.vc.scene + '」' + (R.main.m.motto ? '；选型口诀：' + R.main.m.motto : ''));
    L.push('2. 跑量方案：' + R.vol.vc.m + '（' + (R.vol.famSame ? '与主力同生态换档' : '开源跑量+闭源关键镜头的混合编排') + '）');
    L.push('   价格档：' + R.vol.vc.price);
    L.push('3. 画布工具：' + R.canvas.pick + '（' + R.canvas.tierName + '档；' + R.canvas.why + '）');
    L.push('4. 配音：' + R.audio.tool + '（价格档：' + R.audio.price + '）');
    L.push('   剪辑：' + R.edit.tool + '（价格档：' + R.edit.price + '）');
    L.push('   口型：' + R.lips.tool + '（价格档：' + R.lips.price + '）');
    L.push('5. 次选备胎：' + R.second.vc.m + '（与主力分差 ' + R.second.gap + ' 分）');
    L.push('— 依据作答：' + QS.map(function (q) {
      var o = optOf(q, pkState.ans[q.id]);
      return q.short + '=' + (o ? o.n : '—');
    }).join('；'));
    L.push('— 生成于「漫剧研究学习平台 · 选型向导」，权重为模块内置口径，价格档以工具库当日数据为准');
    return L.join('\n');
  }

  function draw() {
    var body = document.getElementById('pkBody');
    if (!body) return;
    if (!pkState) body.innerHTML = viewIntro();
    else if (pkState.hist.length >= QS.length) body.innerHTML = viewResult();
    else body.innerHTML = viewQuestion();
  }

  /* ---------- 事件委托（render 每页加载只执行一次，这里绑定一次） ---------- */
  function onElClick(e) {
    var b;
    if ((b = e.target.closest('[data-pk-opt]'))) { pick(b.dataset.pkOpt); return; }
    if ((b = e.target.closest('[data-pk-start]'))) { start(); return; }
    if ((b = e.target.closest('[data-pk-back]'))) { back(); return; }
    if ((b = e.target.closest('[data-pk-reset]'))) { reset(); return; }
    if ((b = e.target.closest('[data-pk-step]'))) { jump(+b.dataset.pkStep); return; }
    /* data-copy / data-go 交给 app.js 的 document 级委托处理（复制/深链高亮） */
  }

  /* ---------- 样式注入（唯一 id，颜色/圆角/阴影全部取自 style.css 变量） ---------- */
  function injectStyle() {
    if (document.getElementById('mj-picker-style')) return;
    var st = document.createElement('style');
    st.id = 'mj-picker-style';
    st.textContent =
      '#sec-picker .pk-steps{display:flex;gap:7px;margin:2px 0 14px}' +
      '#sec-picker .pk-step{flex:1;min-width:0;display:flex;align-items:center;gap:7px;padding:9px 10px;border-radius:var(--r-s);border:1px solid var(--line);background:var(--panel2);color:var(--tx3);font-size:12px;cursor:default;font-family:inherit;transition:.2s var(--ease-out);overflow:hidden}' +
      '#sec-picker .pk-step i{font-style:normal;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--line2);color:var(--tx2);font-size:11px;font-weight:700;flex-shrink:0;transition:.2s}' +
      '#sec-picker .pk-step span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#sec-picker .pk-step.done{cursor:pointer;color:var(--tx2);border-color:var(--line2)}' +
      '#sec-picker .pk-step.done i{background:var(--grad);color:#fff}' +
      '#sec-picker .pk-step.done:hover{border-color:var(--p1);transform:translateY(-1px)}' +
      '#sec-picker .pk-step.cur{color:var(--tx);border-color:var(--p1);box-shadow:var(--shadow-sm)}' +
      '#sec-picker .pk-step.cur i{background:var(--p1);color:#fff}' +
      '#sec-picker .pk-lean{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--tx2);background:var(--panel2);border:1px dashed var(--line2);border-radius:var(--r-s);padding:8px 12px;margin:0 0 14px}' +
      '#sec-picker .pk-lean b{color:var(--gold)}' +
      '#sec-picker .pk-opt{text-align:left}' +
      '#sec-picker .pk-opt b{display:block;font-size:14px}' +
      '#sec-picker .pk-opt span{display:block;font-size:12px;color:var(--tx3);margin-top:3px;font-weight:400;line-height:1.6}' +
      '#sec-picker .pk-opt.on{border-color:var(--p1);background:rgba(139,92,246,.14);box-shadow:0 0 0 1px var(--p1) inset}' +
      '#sec-picker .pk-zone{display:flex;flex-direction:column}' +
      '#sec-picker .pk-zone-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}' +
      '#sec-picker .pk-price{font-size:11.5px;color:var(--gold);text-align:right;line-height:1.5;max-width:58%}' +
      '#sec-picker .pk-zone-t{font-size:16.5px;line-height:1.5}' +
      '#sec-picker .pk-why{margin:8px 0 10px;padding:0;list-style:none}' +
      '#sec-picker .pk-why li{position:relative;padding:3px 0 3px 15px;font-size:12.8px;color:var(--tx2);line-height:1.65}' +
      '#sec-picker .pk-why li::before{content:"";position:absolute;left:2px;top:12px;width:5px;height:5px;border-radius:50%;background:var(--p2)}' +
      '#sec-picker .pk-rows{margin:2px 0 8px}' +
      '#sec-picker .pk-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px dashed var(--line)}' +
      '#sec-picker .pk-rows .pk-row:first-child{border-top:none}' +
      '#sec-picker .pk-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:8px}' +
      '#sec-picker .pk-go{padding:7px 14px;font-size:12.5px;border-radius:var(--r-s)}' +
      '#sec-picker .pk-warn{margin-top:2px;margin-bottom:10px;font-size:12.5px}' +
      '#sec-picker .pk-foot{display:flex;flex-wrap:wrap;gap:10px}' +
      '@media(max-width:960px){#sec-picker .pk-step span{display:none}#sec-picker .pk-step{padding:8px;justify-content:center}#sec-picker .pk-price{max-width:100%}}';
    document.head.appendChild(st);
  }

  /* ---------- 渲染入口（契约：写 el.innerHTML，返回值被忽略） ---------- */
  function render(sec, MJ) {
    ctx = MJ;
    injectStyle();
    sec.innerHTML = '<div id="pkBody"></div>';
    document.getElementById('pkBody').addEventListener('click', onElClick);
    pkState = loadState(); /* 中途离开回来续答 */
    draw();
  }

  /* ---------- 直开深链兜底 ----------
     app.js 的 route() 在 init() 内先于本文件执行：页面首开若带 '#/picker' 的 hash，
     会被当作未知路由重定向到最近访问/总览。注册成功后用导航起始 URL
     （PerformanceNavigationTiming.name，含原始 hash）识别直开意图并恢复路由；
     API 缺失或 hash 非本模块时静默跳过（行为退化为：点一次导航进入）。 */
  function rescueDeepLink() {
    try {
      var entries = (window.performance && typeof window.performance.getEntriesByType === 'function')
        ? window.performance.getEntriesByType('navigation') : [];
      var name = (entries && entries[0] && typeof entries[0].name === 'string') ? entries[0].name : '';
      var i = name.indexOf('#/');
      if (i < 0) return;
      var h = name.slice(i);
      if ((h === '#/picker' || h.indexOf('#/picker?') === 0) && location.hash !== h) {
        window.MJ.go('picker');
      }
    } catch (e) { /* 任何异常都忽略，不影响正常入口 */ }
  }

  /* ---------- 自注册 ---------- */
  var mod = {
    id: 'picker',
    icon: '🎯',
    name: '选型向导',
    cnt: '6问',
    sub: ['答题式工具链选型向导', '答6个问题（用途场景/月预算/产能节奏/是否出海/协作方式/画质要求），加权计分当场输出「主力视频模型+跑量方案+画布工具+配音剪辑」组合推荐，每项带理由与价格档，可深链「工具库」高亮对应卡片。与「收益决策树」（选变现路径）、「工具库」（可筛选全量库）互补：这里是答题式收敛器。'],
    after: 'tools',
    search: [
      { tit: '选型向导 · 答题式工具链收敛器', txt: '答6个问题（用途场景/月预算/产能节奏/是否出海/协作方式/画质要求），加权计分输出主力视频模型+跑量方案+画布工具+配音剪辑组合推荐，带理由与价格档，深链工具库高亮对应卡片，作答进度本地保存。' },
      { tit: '视频模型选型口诀（选型向导引用）', txt: '叙事段落用Seedance 2.5，大场面4K上可灵4.0，试镜用4.0 Flash，跑量用3.0 Omni或海螺Fast，出海用Veo，修复改写用Runway Aleph，私有化用Wan；开源跑量+闭源关键镜头的混合编排是工作室降本标配。' },
      { tit: '画布三档选型（选型向导引用）', txt: '新手选即梦智能画布：中文免费积分、参数直观、与即梦视频/剪映同生态；进阶选剪映Hub+可灵灵动画布：Hub成片最短链路、灵动画布一致性+102%、Agent智能分镜；工作室选星流Agent统筹+Toonflow/ComfyUI私有化：导演台式多人协作、开源可私有部署、自由接模型。' },
    ],
    render: render,
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    if (window.MJ.addModule(mod)) rescueDeepLink();
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod); /* 兜底：app.js init 时统一排水 */
  }
})();
