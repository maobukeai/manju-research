/* ============================================================
   学习仪表盘（studyhub）· 自注册模块
   用途：全站唯一的「我的学习状态」聚合页。只读聚合 8 个 localStorage
   进度源——制作清单勾选（manju_checklist_v1）、三个练习器最佳分
   （manju_quiz_best / manju_rt_best / manju_ft_best）、接单/成片两套
   进度（manju_od_progress_v1 / manju_ff_progress_v1）、收藏数
   （manju_favs_v1）、最近访问（manju_recent_v1）——渲染 SVG 双环
   总览 + 分项卡 + 规则引擎「下一步建议」。
   写入仅两个本模块专属键：manju_studyhub_snap_v1（手动校对时间）、
   manju_studyhub_hide_v1（单条建议隐藏表），不碰任何既有键。
   经 window.MJ.addModule(mod) 自注册；须在 app.js 之后以同步经典
   脚本加载（index.html 中置于 app.js 之后、</body> 之前）。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  var MOD_ID = 'studyhub';
  var K = {
    CK: 'manju_checklist_v1',
    QZ: 'manju_quiz_best',
    RT: 'manju_rt_best',
    FT: 'manju_ft_best',
    OD: 'manju_od_progress_v1',
    FF: 'manju_ff_progress_v1',
    FAV: 'manju_favs_v1',
    RECENT: 'manju_recent_v1',
    SNAP: 'manju_studyhub_snap_v1', /* 本模块专属：手动校对时间戳 */
    HIDE: 'manju_studyhub_hide_v1', /* 本模块专属：已隐藏建议 ruleId 表 */
  };
  /* 练习满分基准：轮次题量与 app.js 各练习器 slice 口径一致（8/5/8），
     对照题库长度取小者——题库扩充到不足一轮时自动降档 */
  var QZ_MAX = Math.min(8, (typeof DB !== 'undefined' && DB.quizBank || []).length);
  var RT_MAX = Math.min(5, (typeof DB !== 'undefined' && DB.rhythmBank || []).length);
  var FT_MAX = Math.min(8, (typeof DB !== 'undefined' && DB.frameBank || []).length);

  /* 双环几何：外环 r=80（制作清单）、内环 r=58（三练习均值），viewBox 200 */
  var R_RO = 80, R_RI = 58;
  var C_O = +(2 * Math.PI * R_RO).toFixed(2);
  var C_I = +(2 * Math.PI * R_RI).toFixed(2);

  /* NAV 模块名镜像（仅供「最近访问」展示，与 app.js 导航表对齐；
     MJ 未暴露 NAV，故此处静态映射，未知 id 回退显示原文） */
  var ID_NAME = {
    dashboard: '总览', pipeline: '开发流程', tools: '工具库', cameras: '运镜宝典',
    prompts: '提示词库', canvas: '无限画布', llm: '大模型应用', hot: '爆款心法',
    genres: '题材风向库', learning: '学习路径', firstfilm: '第一部成片',
    monetize: '变现运营', earnpath: '收益决策树', orders: '接单实操包',
    calc: '互动计算器', cases: '案例拆解', rhythm: '节奏练习',
    checklist: '制作清单', glossary: '行业术语表', docs: '研究档案',
    log: '研究日志', studyhub: '学习仪表盘',
  };

  var CTX = null;     /* render 时捕获的 window.MJ */
  var ROOT = null;    /* render 时捕获的 .sh-root 常驻容器（重绘只换其 innerHTML） */
  var lastSig = null; /* 上次绘制的数据签名（进入自动重算的增量判断） */

  /* ---------- 小工具 ---------- */
  function num0(v) { const n = Number(v); return n >= 0 ? n : 0; }
  function pctOf(a, b) { return b > 0 ? Math.round(a / b * 100) : 0; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTime(ms) { const d = new Date(ms); return (d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function E(s) { return CTX ? CTX.esc(s) : String(s); } /* HTML 转义走 ctx.esc */
  /* 星级：达成率 → 0-5 星（阈值为本模块常量） */
  function starsOf(r) { if (r <= 0) return 0; if (r >= 0.99) return 5; if (r >= 0.85) return 4; if (r >= 0.7) return 3; if (r >= 0.5) return 2; return 1; }
  /* 星级 HTML：沿用 app.js stars() 的 .stars/.off 标记，样式复用既有 CSS */
  function starsHtml(n) {
    let h = '';
    for (let i = 1; i <= 5; i++) h += i <= n ? '★' : '<span class="off">★</span>';
    return '<span class="stars">' + h + '</span>';
  }

  /* ---------- 数据聚合（只读 8 个进度源） ---------- */
  /* 勾选型进度：遍历 DB 分组计数，键前缀 ck 组为 'ck-gi-ii'，od/ff 组为 'gi-ii' */
  function countMap(key, groups, pre) {
    const st = CTX.store.get(key, {}) || {};
    let done = 0, total = 0;
    (groups || []).forEach((g, gi) => {
      (g.items || []).forEach((_, ii) => { total++; if (st[pre + gi + '-' + ii]) done++; });
    });
    return { done, total, pct: pctOf(done, total) };
  }
  /* 最佳分型：数值容错并夹在 [0, max] */
  function bestN(key, max) {
    let n = num0(CTX.store.get(key, 0));
    if (n > max) n = max;
    return { best: n, max, pct: pctOf(n, max) };
  }
  /* 收藏统计：单一名册键 manju_favs_v1 按各库名册对账 */
  function favStats() {
    const arr = CTX.store.get(K.FAV, []) || [];
    const set = {};
    (Array.isArray(arr) ? arr : []).forEach((n) => { set[n] = 1; });
    const t = DB.tools.filter((x) => set[x.n]).length;
    const c = DB.cameras.filter((x) => set[x.n]).length;
    let p = 0, pt = 0;
    DB.promptBank.forEach((g) => { pt += g.items.length; g.items.forEach((it) => { if (set[it.cn]) p++; }); });
    return {
      tools: { n: t, total: DB.tools.length, pct: pctOf(t, DB.tools.length) },
      cams: { n: c, total: DB.cameras.length, pct: pctOf(c, DB.cameras.length) },
      prompts: { n: p, total: pt, pct: pctOf(p, pt) },
      all: t + c + p,
    };
  }
  function aggregate() {
    const st = CTX.store;
    const ck = countMap(K.CK, DB.checklist, 'ck-');
    const od = countMap(K.OD, DB.orders.plan.checklist, '');
    const ff = countMap(K.FF, DB.firstfilm.checklist, '');
    const quiz = bestN(K.QZ, QZ_MAX);
    const rt = bestN(K.RT, RT_MAX);
    const ft = bestN(K.FT, FT_MAX);
    const exAvg = Math.round((quiz.pct + rt.pct + ft.pct) / 3);
    const favs = favStats();
    const recent = (st.get(K.RECENT, []) || [])
      .filter((x) => typeof x === 'string').slice(0, 6);
    const overall = Math.round((ck.pct + exAvg) / 2);
    const emptyAll = ck.done === 0 && quiz.best === 0 && rt.best === 0 && ft.best === 0 &&
      od.done === 0 && ff.done === 0 && favs.all === 0;
    return { ck, od, ff, quiz, rt, ft, exAvg, overall, favs, recent, emptyAll };
  }
  function sigOf(S) {
    return [S.ck.done, S.quiz.best, S.rt.best, S.ft.best, S.od.done, S.ff.done,
      S.favs.tools.n, S.favs.cams.n, S.favs.prompts.n, S.recent.join('|')].join('~');
  }

  /* ---------- 规则引擎：按优先级取最弱项，最多出 3 条建议 ---------- */
  const RULES = [
    { id: 'cold-start', pr: 100, make(S) {
      if (!S.emptyAll) return null;
      return { t: '从零到第一条片：先跑通，再谈清单',
        d: '8 个进度源都还是空的。不要先啃「制作清单」——从「第一部成片」D1 开始，7 天产出第一条可发布的成片，闭环跑通后再回头逐项对照清单。',
        go: 'firstfilm', goLab: '去「第一部成片」D1 →' }; } },
    { id: 'ff-not-started', pr: 95, make(S) {
      if (S.ff.done > 0 || S.ck.pct >= 30) return null;
      return { t: '清单完成度 ' + S.ck.pct + '%：先跑「第一部成片」D1',
        d: '制作清单完成了 ' + S.ck.done + '/' + S.ck.total + ' 项，但 7 天闭环还没启动。完整清单是正式项目用的自查表——第一部片请按 D1-D7 每天三步走，先完成再完美。',
        go: 'firstfilm', goLab: '去「第一部成片」→' }; } },
    { id: 'quiz-zero', pr: 90, make(S) {
      if (S.quiz.best > 0) return null;
      return { t: '运镜速配还没有第一轮成绩',
        d: '运镜速配挑战 0 次记录。先来一轮 8 道场景题，练出「看到情绪就知道用哪种镜头」的条件反射——每镜 = 1 个基础运镜 + 1 个标志性运镜。',
        go: 'cameras?quiz=1', goLab: '去练「运镜速配」→' }; } },
    { id: 'rt-zero', pr: 88, make(S) {
      if (S.rt.best > 0) return null;
      return { t: '分镜节奏还没开练',
        d: '节奏练习 0 次记录。来一轮 5 道剧情拍点题，练出「拍点放第几秒」的 98 秒结构感——钩子、反转、卡点的位置感全靠它。',
        go: 'rhythm', goLab: '去练「分镜节奏」→' }; } },
    { id: 'ft-zero', pr: 86, make(S) {
      if (S.ft.best > 0) return null;
      return { t: '首尾帧挑战还没开练',
        d: '尾帧链（上一镜尾帧 = 下一镜首帧）是无限画布连绘的核心。先做一轮 8 题挑战，再上手七步实操工作流。',
        go: 'canvas', goLab: '去练「首尾帧挑战」→' }; } },
    { id: 'weakest-practice', pr: 70, make(S) {
      if (S.quiz.best === 0 || S.rt.best === 0 || S.ft.best === 0) return null;
      const arr = [
        { n: '运镜速配', p: S.quiz.pct, go: 'cameras?quiz=1' },
        { n: '分镜节奏', p: S.rt.pct, go: 'rhythm' },
        { n: '首尾帧挑战', p: S.ft.pct, go: 'canvas' },
      ].sort((a, b) => a.p - b.p);
      const w = arr[0];
      if (w.p >= 75) return null;
      return { t: '补最短的板：「' + w.n + '」',
        d: '三练习中「' + w.n + '」达成率最低（' + w.p + '%，低于 75% 及格线）。结构感是刷出来的——先来两轮，把短板拉上 75%。',
        go: w.go, goLab: '去练「' + w.n + '」→' }; } },
    { id: 'ff-stalled', pr: 60, make(S) {
      if (S.ff.done === 0 || S.ff.pct >= 100) return null;
      return { t: '第一部成片进行中：' + S.ff.pct + '%',
        d: '7 天自查已完成 ' + S.ff.done + '/' + S.ff.total + ' 项。按 D1-D7 顺序推进，别跳步——锚点图没锁定就跑视频，返工成本翻倍。',
        go: 'firstfilm', goLab: '继续推进 →' }; } },
    { id: 'od-not-started', pr: 55, make(S) {
      if (S.ff.pct < 80 || S.od.done > 0) return null;
      return { t: '从会做片到能收钱',
        d: '第一部成片接近完成（' + S.ff.pct + '%）。去「接单实操包」跑 14 天行动计划：渠道盘点 → 报价分层 → 作品集三部样片 → 合同与定金。',
        go: 'orders', goLab: '去「接单实操包」→' }; } },
    { id: 'od-stalled', pr: 50, make(S) {
      if (S.od.done === 0 || S.od.pct >= 100) return null;
      return { t: '14 天行动计划进行中：' + S.od.pct + '%',
        d: '接单准备已完成 ' + S.od.done + '/' + S.od.total + ' 项。本周目标三件套：报价单、3 部样片、合同模板——齐了再开始投渠道。',
        go: 'orders', goLab: '继续推进 →' }; } },
    { id: 'ck-continue', pr: 40, make(S) {
      if (S.ck.pct < 30 || S.ck.pct >= 100 || S.ff.pct < 100) return null;
      return { t: '正式项目用完整清单自查',
        d: '第一部片已跑通：把「制作清单」全部 ' + S.ck.total + ' 项逐项过一遍（当前 ' + S.ck.pct + '%），从「跑通」升级到「工业化」。',
        go: 'checklist', goLab: '去「制作清单」→' }; } },
    { id: 'favs-empty', pr: 30, make(S) {
      if (S.emptyAll || S.favs.all > 0) return null;
      return { t: '先囤装备：收藏夹还是空的',
        d: '逛「工具库」把趁手的工具点亮 ☆，运镜与提示词同理——收藏后拍摄/写分镜时一键调出，不用每次全库翻。',
        go: 'tools', goLab: '去「工具库」收藏 →' }; } },
    { id: 'all-green', pr: 20, make(S) {
      if (S.overall < 90) return null;
      return { t: '全线飘绿：进入对表与系列化',
        d: '综合进度 ' + S.overall + '%。去「案例拆解」对表现象级案例的可复制经验，把单点方法升级成模板与系列化生产线。',
        go: 'cases', goLab: '去「案例拆解」→' }; } },
  ];
  function pickSuggestions(S) {
    const hide = CTX.store.get(K.HIDE, {}) || {};
    const firing = [];
    RULES.forEach((r) => { const v = r.make(S); if (v) firing.push({ id: r.id, pr: r.pr, v }); });
    firing.sort((a, b) => b.pr - a.pr);
    /* 隐藏表剪枝：规则不再触发时清掉对应记录，避免脏数据长存 */
    const ids = {};
    firing.forEach((f) => { ids[f.id] = 1; });
    let dirty = false;
    Object.keys(hide).forEach((k) => { if (!ids[k]) { delete hide[k]; dirty = true; } });
    if (dirty) CTX.store.set(K.HIDE, hide);
    const shown = firing.filter((f) => !hide[f.id]).slice(0, 3);
    return { shown, hidden: firing.length - shown.length };
  }

  /* ---------- 分区渲染 ---------- */
  function lgRow(color, name, val, sub) {
    return '<div class="sh-lg-row"><span class="sh-dot" style="background:' + color + '"></span>' +
      '<span class="sh-lg-name">' + name + '</span><span class="sh-lg-val">' + val + '</span>' +
      (sub ? '<span class="sh-lg-sub">' + sub + '</span>' : '') + '</div>';
  }
  function overviewHtml(S) {
    const offO = (C_O * (1 - S.ck.pct / 100)).toFixed(1);
    const offI = (C_I * (1 - S.exAvg / 100)).toFixed(1);
    const dashO = S.ck.pct > 0 ? String(C_O) : '0 ' + C_O;
    const dashI = S.exAvg > 0 ? String(C_I) : '0 ' + C_I;
    const hideO = S.ck.pct > 0 ? '' : ' visibility:hidden'; /* 0% 时藏起描边，避免圆点残影 */
    const hideI = S.exAvg > 0 ? '' : ' visibility:hidden';
    const snap = CTX.store.get(K.SNAP, null);
    const copyId = CTX.regCopy(summaryText(S));
    return '<h4 class="block-t">双环总览 <span class="sub">外环 = 制作清单 · 内环 = 三练习均值 · 中心 = 综合进度</span></h4>' +
      '<div class="chart-box sh-overview">' +
      '<svg class="sh-rings" viewBox="0 0 200 200" width="190" height="190" role="img" aria-label="学习进度双环图：综合 ' + S.overall + '%">' +
      '<defs>' +
      '<linearGradient id="shG1" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#8b5cf6" style="stop-color:var(--p1)"/>' +
      '<stop offset="1" stop-color="#22d3ee" style="stop-color:var(--p2)"/></linearGradient>' +
      '<linearGradient id="shG2" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f5b942" style="stop-color:var(--gold)"/>' +
      '<stop offset="1" stop-color="#8b5cf6" style="stop-color:var(--p1)"/></linearGradient>' +
      '</defs>' +
      '<circle cx="100" cy="100" r="' + R_RO + '" class="sh-ring-bg"/>' +
      '<circle cx="100" cy="100" r="' + R_RI + '" class="sh-ring-bg2"/>' +
      '<circle cx="100" cy="100" r="' + R_RO + '" class="sh-ring-fg sh-o" stroke="url(#shG1)" stroke-width="13" stroke-linecap="round" transform="rotate(-90 100 100)" style="stroke-dasharray:' + dashO + ';stroke-dashoffset:' + offO + ';' + hideO + '"/>' +
      '<circle cx="100" cy="100" r="' + R_RI + '" class="sh-ring-fg sh-i" stroke="url(#shG2)" stroke-width="11" stroke-linecap="round" transform="rotate(-90 100 100)" style="stroke-dasharray:' + dashI + ';stroke-dashoffset:' + offI + ';' + hideI + '"/>' +
      '<text x="100" y="98" text-anchor="middle" class="sh-num">' + S.overall + '%</text>' +
      '<text x="100" y="119" text-anchor="middle" class="sh-num-sub">综合进度</text>' +
      '</svg>' +
      '<div class="sh-side"><div class="sh-lg-list">' +
      lgRow('var(--p1)', '外环 · 制作清单', S.ck.pct + '%', S.ck.done + ' / ' + S.ck.total + ' 项已勾选') +
      lgRow('var(--gold)', '内环 · 三练习均值', S.exAvg + '%', '速配 ' + S.quiz.best + '/' + S.quiz.max + ' · 节奏 ' + S.rt.best + '/' + S.rt.max + ' · 首尾帧 ' + S.ft.best + '/' + S.ft.max) +
      lgRow('var(--p2)', '综合完成度', S.overall + '%', '两环各占 50% 权重') +
      '</div>' +
      '<div class="sh-btns">' +
      '<button class="copy-btn" data-sh-refresh title="重新读取 8 个本地进度源并重绘">↻ 重新计算</button>' +
      '<button class="copy-btn" data-copy="' + copyId + '">📋 复制学习摘要</button>' +
      '</div>' +
      '<p class="mini-note" style="margin:8px 0 0">进入本页自动重算；' +
      (snap ? '上次手动校对 ' + fmtTime(snap.t) : '尚未手动校对过') +
      '。数据只存本机浏览器，换设备不同步。</p>' +
      '</div></div>';
  }
  function suggestHtml(S, sug) {
    if (S.emptyAll) {
      return '<h4 class="block-t">下一步建议</h4>' +
        '<div class="callout violet sh-empty"><b>👋 一切从第一条片开始。</b>8 个进度源都还是空的——不要先啃清单，' +
        '按「第一部成片」D1-D7 用 7 天做出第一条可发布的成片；练习成绩和收藏会在使用中自然积累。' +
        '<div class="sh-btns">' +
        '<button class="btn pri sh-sm" data-go="firstfilm">从 D1 开始 →</button>' +
        '<button class="btn ghost sh-sm" data-go="cameras?quiz=1">先玩一轮运镜速配</button>' +
        '<button class="btn ghost sh-sm" data-go="tools">囤几件趁手工具</button>' +
        '</div></div>';
    }
    if (!sug.shown.length) {
      return '<h4 class="block-t">下一步建议</h4>' +
        '<div class="callout blue sh-empty"><b>✓ 暂无待办建议。</b>各进度源状态均衡（或已达高位）。保持节奏，每周回来点一次「重新计算」对表。</div>';
    }
    const cards = sug.shown.map((f, i) =>
      '<div class="card sh-sug"><div class="sh-sug-head"><span class="tag c">建议 ' + (i + 1) + '</span>' +
      '<button class="sh-x" data-sh-hide="' + f.id + '" title="本条建议不再提示；对应进度变化后会自动恢复">✕ 知道了</button></div>' +
      '<b>' + f.v.t + '</b><p>' + f.v.d + '</p>' +
      '<button class="btn ghost sh-sm" data-go="' + f.v.go + '">' + f.v.goLab + '</button></div>').join('');
    return '<h4 class="block-t">下一步建议 <span class="sub">规则引擎按最弱项生成 · 点「知道了」隐藏单条</span></h4>' +
      '<div class="grid g2">' + cards + '</div>' +
      (sug.hidden > 0 ? '<p class="mini-note">另有 ' + sug.hidden + ' 条建议被隐藏——对应进度发生变化后会自动恢复。</p>' : '');
  }
  function exCard(def, S) {
    const st = S[def.k];
    const tag = st.best === 0 ? '<span class="tag">未开始</span>'
      : st.pct >= 100 ? '<span class="tag g">满分达成</span>' : '<span class="tag c">进行中</span>';
    return '<div class="card sh-ex"><div class="sh-ex-top"><span class="sh-ex-ico">' + def.ico + '</span>' +
      '<div><b>' + def.n + '</b><div class="sh-ex-best">历史最佳 ' + st.best + ' / ' + st.max + ' · 达成率 ' + st.pct + '%</div></div>' + tag + '</div>' +
      '<div>' + starsHtml(starsOf(st.best / st.max)) + '</div>' +
      '<div class="sh-ex-bar"><i style="width:' + st.pct + '%"></i></div>' +
      '<button class="btn pri sh-sm" data-go="' + def.go + '">' + def.goLab + '</button></div>';
  }
  function exerciseHtml(S) {
    const defs = [
      { k: 'quiz', ico: '🎯', n: '运镜速配挑战', go: 'cameras?quiz=1', goLab: '去练习 →' },
      { k: 'rt', ico: '🥁', n: '分镜节奏练习', go: 'rhythm', goLab: '去练习 →' },
      { k: 'ft', ico: '🎞️', n: '首尾帧挑战', go: 'canvas', goLab: '去练习 →' },
    ];
    return '<h4 class="block-t">练习战绩 <span class="sub">三个练习器的本地最佳分 · 星级：100%=★5 / 85%=★4 / 70%=★3 / 50%=★2</span></h4>' +
      '<div class="grid g3">' + defs.map((d) => exCard(d, S)).join('') + '</div>';
  }
  function favRow(name, d, go) {
    return '<div class="bar-row sh-fav-row" data-go="' + go + '" title="点击打开「' + name + '」">' +
      '<span class="b-lab">' + name + '</span>' +
      '<span class="b-track"><span class="b-fill" style="margin-left:0;width:' + d.pct + '%"></span></span>' +
      '<span class="b-val">' + d.n + ' / ' + d.total + ' · ' + d.pct + '%</span></div>';
  }
  function favHtml(S) {
    return '<h4 class="block-t">收藏统计 <span class="sub">☆ 收藏数 / 各库总数 · 点击行直达对应库</span></h4>' +
      '<div class="chart-box">' +
      favRow('工具', S.favs.tools, 'tools') +
      favRow('运镜', S.favs.cams, 'cameras') +
      favRow('提示词', S.favs.prompts, 'prompts') +
      '<p class="mini-note">共收藏 ' + S.favs.all + ' 条 · 收藏按名称与各库条目对账计数，只存本机。</p></div>';
  }
  function projCard(title, sub, d, go) {
    const tagCls = d.pct >= 100 ? ' g' : d.pct > 0 ? ' c' : '';
    return '<div class="ck-progress sh-proj"><div class="ck-head"><b>' + title + '</b>' +
      '<span class="tag' + tagCls + '">' + d.pct + '%</span></div>' +
      '<div class="ck-bar"><div class="ck-fill" style="width:' + d.pct + '%"></div></div>' +
      '<p class="mini-note">' + d.done + ' / ' + d.total + ' 项 · ' + sub + '</p>' +
      '<div class="sh-btns"><button class="btn ghost sh-sm" data-go="' + go + '">去推进 →</button></div></div>';
  }
  function projHtml(S) {
    return '<h4 class="block-t">项目进度 <span class="sub">三套进度自查独立保存 · 复用制作清单进度条样式</span></h4>' +
      '<div class="grid g3">' +
      projCard('制作清单', '正式项目逐项自查', S.ck, 'checklist') +
      projCard('第一部成片', '7 天出片闭环', S.ff, 'firstfilm') +
      projCard('接单实操', '14 天接单行动计划', S.od, 'orders') +
      '</div>';
  }
  function recentHtml(S) {
    const chips = S.recent.map((id) =>
      '<span class="chip" data-go="' + E(id) + '">' + E(ID_NAME[id] || id) + '</span>').join('');
    return '<h4 class="block-t">最近访问 <span class="sub">平台自动记录的最近 6 个模块</span></h4>' +
      '<div class="tool-filters" style="margin-bottom:8px">' +
      (chips || '<span class="mini-note" style="margin:0">暂无记录——从左侧导航挑一个模块开始逛吧。</span>') +
      '</div>';
  }
  function summaryText(S) {
    return [
      '【我的学习状态 · 漫剧研究学习平台】',
      '综合进度 ' + S.overall + '%（制作清单 ' + S.ck.pct + '% ｜ 三练习均值 ' + S.exAvg + '%）',
      '· 制作清单 ' + S.ck.done + '/' + S.ck.total + ' 项',
      '· 第一部成片 ' + S.ff.done + '/' + S.ff.total + ' 项',
      '· 接单实操 ' + S.od.done + '/' + S.od.total + ' 项',
      '· 运镜速配 最佳 ' + S.quiz.best + '/' + S.quiz.max,
      '· 分镜节奏 最佳 ' + S.rt.best + '/' + S.rt.max,
      '· 首尾帧挑战 最佳 ' + S.ft.best + '/' + S.ft.max,
      '· 收藏：工具 ' + S.favs.tools.n + ' · 运镜 ' + S.favs.cams.n + ' · 提示词 ' + S.favs.prompts.n,
      '生成于 ' + fmtTime(Date.now()),
    ].join('\n');
  }

  /* ---------- 绘制与交互 ---------- */
  function paintInto(root, S) {
    if (!root) return;
    const sug = pickSuggestions(S);
    root.innerHTML =
      overviewHtml(S) + suggestHtml(S, sug) + exerciseHtml(S) +
      favHtml(S) + projHtml(S) + recentHtml(S);
    lastSig = sigOf(S);
  }
  function refreshNow(manual) {
    if (!CTX || !ROOT) return;
    if (manual) {
      CTX.store.set(K.SNAP, { t: Date.now() });
      if (CTX.toast) CTX.toast('✓ 已重新读取 8 个进度源');
    }
    paintInto(ROOT, aggregate());
  }
  function onElClick(e) {
    const t = e.target;
    if (!t || typeof t.closest !== 'function') return;
    const rf = t.closest('[data-sh-refresh]');
    if (rf) { refreshNow(true); return; }
    const hd = t.closest('[data-sh-hide]');
    if (hd) {
      const hide = CTX.store.get(K.HIDE, {}) || {};
      hide[hd.dataset.shHide] = 1;
      CTX.store.set(K.HIDE, hide);
      refreshNow(false);
    }
    /* data-go 深链不在此处理：app.js 的 document 级委托已覆盖 */
  }

  /* ---------- 样式注入（一次性，全部走既有 CSS 变量，明暗主题自适应） ---------- */
  function ensureCss() {
    if (document.getElementById('mj-studyhub-style')) return;
    const st = document.createElement('style');
    st.id = 'mj-studyhub-style';
    st.textContent =
      '#sec-studyhub .sh-overview{display:flex;gap:24px;align-items:center;flex-wrap:wrap}' +
      '#sec-studyhub .sh-rings{flex:0 0 auto;max-width:100%}' +
      '#sec-studyhub .sh-ring-bg{fill:none;stroke:var(--panel2);stroke-width:13}' +
      '#sec-studyhub .sh-ring-bg2{fill:none;stroke:var(--line);stroke-width:11}' +
      '#sec-studyhub .sh-ring-fg{fill:none;transition:stroke-dashoffset .9s var(--ease-out)}' +
      '#sec-studyhub .sh-ring-fg.sh-o{animation:shRingO .9s var(--ease-out)}' +
      '#sec-studyhub .sh-ring-fg.sh-i{animation:shRingI .9s var(--ease-out)}' +
      '@keyframes shRingO{from{stroke-dashoffset:' + C_O + '}}' +
      '@keyframes shRingI{from{stroke-dashoffset:' + C_I + '}}' +
      '#sec-studyhub .sh-num{fill:var(--tx);font-size:34px;font-weight:800;font-family:inherit}' +
      '#sec-studyhub .sh-num-sub{fill:var(--tx3);font-size:11px;font-family:inherit}' +
      '#sec-studyhub .sh-side{flex:1;min-width:230px}' +
      '#sec-studyhub .sh-lg-row{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13px}' +
      '#sec-studyhub .sh-lg-list .sh-lg-row:last-child{border-bottom:none}' +
      '#sec-studyhub .sh-dot{width:10px;height:10px;border-radius:3px;flex:0 0 auto;align-self:center}' +
      '#sec-studyhub .sh-lg-name{color:var(--tx2)}' +
      '#sec-studyhub .sh-lg-val{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums}' +
      '#sec-studyhub .sh-lg-sub{flex-basis:100%;font-size:11.5px;color:var(--tx3);margin:-2px 0 0 19px}' +
      '#sec-studyhub .sh-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}' +
      '#sec-studyhub .btn.sh-sm{padding:6px 14px;font-size:12.5px;border-radius:10px}' +
      '#sec-studyhub .sh-ex{display:flex;flex-direction:column;gap:9px}' +
      '#sec-studyhub .sh-ex-top{display:flex;align-items:flex-start;gap:10px}' +
      '#sec-studyhub .sh-ex-top .tag{margin-left:auto;flex:0 0 auto}' +
      '#sec-studyhub .sh-ex-ico{font-size:24px;line-height:1.2}' +
      '#sec-studyhub .sh-ex-best{font-size:12px;color:var(--tx3)}' +
      '#sec-studyhub .sh-ex-bar{height:7px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;overflow:hidden}' +
      '#sec-studyhub .sh-ex-bar i{display:block;height:100%;background:var(--grad);border-radius:6px;transition:width .7s var(--ease-out)}' +
      '#sec-studyhub .sh-ex .btn{margin-top:auto}' +
      '#sec-studyhub .sh-sug p{font-size:12.8px;color:var(--tx2);margin:5px 0 10px}' +
      '#sec-studyhub .sh-sug-head{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      '#sec-studyhub .sh-x{background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11.5px;padding:3px 8px;border-radius:8px;font-family:inherit}' +
      '#sec-studyhub .sh-x:hover{color:var(--hot);background:var(--panel2)}' +
      '#sec-studyhub .sh-fav-row{cursor:pointer;border-radius:var(--r-s);padding:3px 6px;margin:0 -6px;transition:background .15s}' +
      '#sec-studyhub .sh-fav-row:hover{background:var(--panel2)}' +
      '#sec-studyhub .sh-proj{margin-bottom:0}' +
      '#sec-studyhub .sh-empty{margin:0}' +
      '@media(max-width:700px){#sec-studyhub .sh-overview{justify-content:center}#sec-studyhub .sh-rings{width:170px;height:170px}}';
    document.head.appendChild(st);
  }

  /* ---------- render（每页加载仅执行一次；重绘只替换 .sh-root，不碰 route() 注入的 .sec-head） ---------- */
  function render(el, ctx) {
    CTX = ctx;
    ensureCss();
    el.innerHTML = '<div class="sh-root"></div>';
    ROOT = el.querySelector('.sh-root');
    el.addEventListener('click', onElClick);
    paintInto(ROOT, aggregate());
  }

  /* 进入模块自动重算：hashchange 时若本页已渲染且数据签名有变则重绘
     （签名未变则跳过，保留 route() 的进场动画） */
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('hashchange', () => {
      if (String(location.hash || '').indexOf('#/' + MOD_ID) !== 0) return;
      if (!CTX) return;
      const sec = document.getElementById('sec-' + MOD_ID);
      if (!sec || !sec.dataset.rendered) return;
      const S = aggregate();
      if (sigOf(S) === lastSig) return;
      const root = sec.querySelector('.sh-root');
      if (root) paintInto(root, S);
    });
  }

  /* ---------- 自注册 ---------- */
  const mod = {
    id: MOD_ID,
    icon: '📊',
    name: '学习仪表盘',
    cnt: '总进度',
    sub: ['学习仪表盘 · 全站进度总览', '聚合 8 个本地进度源（制作清单勾选 / 三练习最佳分 / 接单·成片两套进度 / 收藏数 / 最近访问）成一张双环总览与下一步建议——本页对进度源只读不写，数据只存在本机浏览器。'],
    search: [
      { tit: '学习仪表盘', txt: '全站学习状态总览：SVG 双环进度、练习最佳分与星级、收藏统计、项目进度、下一步建议' },
      { tit: '下一步建议（学习仪表盘）', txt: '规则引擎按最弱项生成行动建议，每条可一键跳转对应模块，也可单条隐藏' },
      { tit: '练习战绩（学习仪表盘）', txt: '运镜速配 / 分镜节奏 / 首尾帧挑战的历史最佳分、达成率与星级对照' },
    ],
    render,
  };
  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod); /* true=已注册；false=被拒（id 冲突或缺必填字段） */
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod); /* app.js init 时统一排水 */
  }
})();
