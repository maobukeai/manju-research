/* ============================================================
   漫剧研究学习平台 · 外挂模块：模拟沙盘（mcsim）
   在「互动计算器」确定性点估计之上做蒙特卡洛风险模拟：
   单集成本区间 × 全片播放量 / 万播单价分布随机抽样 2000 次，
   输出回本概率、利润直方图（亏损红 / 盈利绿）、P10/P50/P90 分位
   与 50% 回本所需播放量（保本 S 曲线）。
   calc 回答"平均能赚多少"，mcsim 回答"有多大把握不亏"——
   把"爆款率不足 0.1%"的行业口径变成可拖动感知的概率曲线。
   口径：种子参数 / 档位 / 警示文案全部读 DB.calc（js/data.js），
   概率先验不新增研究数字；抽样引擎与波动默认值为模块内常量。
   通过 window.MJ.addModule 自注册，本文件零依赖、可离线。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  const KEY = 'manju_mcsim_v1';            // localStorage 持久化（对齐 manju_*_v1 前缀风格）
  const N_RUNS = 2000;                     // 每次模拟抽样数
  const BINS = 28;                         // 直方图格数
  const CURVE_N = 120;                     // S 曲线采样点数
  const H_CHART = 250;                     // 画布 CSS 高度
  const FONT = '10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
  const TIER_LABELS = ['尾部 IAA', '中位', '头部 出海IAP'];
  const raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (f) { return setTimeout(f, 16); };

  /* ---------- 数据种子（全部读 DB.calc，不新增研究数字） ---------- */
  const DB = window.DB;
  const C = DB.calc;
  // 单集成本基准：按「互动计算器」三本账公式摊算（与 app.js calcCompute 同式）
  function perEpBase() {
    const d = C.costDefaults;
    const eps = d.eps || 1;
    const shots = eps * (d.shotsPerEp || 0);
    const img = d.usableRate > 0 ? shots * (d.imgUnit || 0) / (d.usableRate / 100) : 0;
    const vid = shots * (d.vidUnit || 0) * (d.retries || 0);
    const vo = eps * (d.voicePerEp || 0);
    const labor = (d.team || 0) * (d.daily || 0) * (d.days || 0);
    return (img + vid + vo + labor) / eps;
  }
  const EPS_N = C.costDefaults.eps || 12;  // 核算单元：一部 12 集试播季
  const _base = perEpBase();
  const DEF = {
    cMin: Math.max(50, Math.round(_base * 0.75 / 50) * 50),                       // ≈¥1,050
    cMax: Math.max(100, Math.round(_base * 1.3 / 50) * 50),                       // ≈¥1,800
    vMed: (C.revDefaults && C.revDefaults.views) || 300,                          // 全片累计播放量中位（万）
    vVol: 120,                                                                    // 模块内常量：爆款右偏长尾
    unit: (C.revDefaults && C.revDefaults.unit) || 15,                            // 万播单价（元）
  };

  /* ---------- 滑杆配置 ---------- */
  const SLIDERS = [
    { k: 'cMin', lab: '单集成本下限', min: 100, max: 10000, step: 50, hint: '均匀抽样下界 · 默认 = 三本账单集成本 × 0.75' },
    { k: 'cMax', lab: '单集成本上限', min: 200, max: 20000, step: 50, hint: '均匀抽样上界 · 默认 = 三本账单集成本 × 1.3' },
    { k: 'vMed', lab: '全片播放量中位', min: 10, max: 5000, step: 10, hint: '三角分布众数 · 默认沿用「互动计算器」收益档 300 万口径' },
    { k: 'vVol', lab: '播放量波动', min: 10, max: 150, step: 5, hint: '三角分布右偏：下限≈中位×(1−v%)，上限=中位×(1+2v%)——播放量是长尾彩票' },
    { k: 'unit', lab: '万播单价', min: 1, max: 60, step: 1, hint: '三角抽样 0.7~1.35 倍 · 档位用下方场景预设一键设定' },
  ];

  /* ---------- 模块状态 ---------- */
  const S = { cMin: DEF.cMin, cMax: DEF.cMax, vMed: DEF.vMed, vVol: DEF.vVol, unit: DEF.unit, view: 'hist', res: null };
  let MJX = null;          // window.MJ（render 时注入）
  let elRef = null;        // #sec-mcsim
  let refs = {};           // 缓存的元素
  let resDirty = false;    // 参数改动后、重跑前：持久化时不落盘旧结果
  let lastGeo = null;      // draw() 缓存坐标映射，供 tooltip 反查
  const hov = { idx: -1 }; // 当前悬停格 / 曲线点
  let drawTries = 0;

  /* ---------- 小工具 ---------- */
  const cssVar = (n) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(n);
    return (v && v.trim()) || '#888888';
  };
  const money = (n) => (n < 0 ? '-¥' : '¥') + Math.round(Math.abs(n)).toLocaleString('zh-CN');
  const wan = (n) => Math.round(n).toLocaleString('zh-CN') + ' 万';
  const pctf = (p) => (p * 100).toFixed(1) + '%';
  const signColor = (v) => (v >= 0 ? 'var(--ok)' : 'var(--hot)');
  const probColor = (p) => (p >= 0.6 ? 'var(--ok)' : p >= 0.3 ? 'var(--gold)' : 'var(--hot)');
  // 三角分布抽样：a≤m≤b，rnd 为随机函数
  function tri(rnd, a, m, b) {
    const F = (m - a) / (b - a), u = rnd();
    return u < F
      ? a + Math.sqrt(u * (b - a) * (m - a))
      : b - Math.sqrt((1 - u) * (b - a) * (b - m));
  }
  // 线性插值分位数（sorted 升序）
  function qtl(s, p) {
    const idx = (s.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
    return s[lo] + (s[hi] - s[lo]) * (idx - lo);
  }

  /* ---------- 样式注入（全部作用域限定 #sec-mcsim，颜色取既有 CSS 变量） ---------- */
  function injectStyle() {
    if (document.getElementById('mj-mcsim-style')) return;
    const st = document.createElement('style');
    st.id = 'mj-mcsim-style';
    st.textContent =
      '#sec-mcsim .mcs-sliders{display:grid;grid-template-columns:1fr 1fr;gap:14px 26px;margin:4px 0 2px}' +
      '#sec-mcsim .mcs-slider-row{display:flex;flex-direction:column;gap:7px;min-width:0}' +
      '#sec-mcsim .mcs-slider-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12.5px;color:var(--tx2)}' +
      '#sec-mcsim .mcs-slider-head b{color:var(--tx);font-size:13.5px;font-variant-numeric:tabular-nums;white-space:nowrap}' +
      '#sec-mcsim .mcs-hint{font-size:11px;color:var(--tx3);line-height:1.55}' +
      '#sec-mcsim input[type=range].mcs-slider{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;background:var(--line);outline:none;cursor:pointer;margin:4px 0 0}' +
      '#sec-mcsim .mcs-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:17px;height:17px;border-radius:50%;background:var(--grad);border:2px solid var(--panel);box-shadow:0 1px 6px rgba(0,0,0,.35);cursor:grab}' +
      '#sec-mcsim .mcs-slider::-webkit-slider-thumb:active{cursor:grabbing}' +
      '#sec-mcsim .mcs-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--p1);border:2px solid var(--panel);cursor:grab}' +
      '#sec-mcsim .mcs-canvas-wrap{position:relative;margin-top:6px}' +
      '#sec-mcsim .mcs-canvas-wrap canvas{display:block;width:100%}' +
      '#sec-mcsim .mcs-tip{position:absolute;top:10px;left:0;display:none;pointer-events:none;background:var(--panel);border:1px solid var(--line2);border-radius:9px;box-shadow:var(--shadow-sm);padding:6px 10px;font-size:11.5px;color:var(--tx2);white-space:nowrap;z-index:5;line-height:1.6}' +
      '#sec-mcsim .mcs-tip b{color:var(--tx)}' +
      '#sec-mcsim .mcs-stale{display:none;font-size:11.5px;color:var(--gold);margin-top:8px}' +
      '#sec-mcsim .mcs-stale.show{display:block}' +
      '#sec-mcsim .mcs-res{display:flex;gap:14px;flex-wrap:wrap;align-items:stretch;margin-top:14px}' +
      '#sec-mcsim .mcs-big{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 20px;display:flex;flex-direction:column;justify-content:center;min-width:190px}' +
      '#sec-mcsim .mcs-big b{font-size:40px;line-height:1.15;font-variant-numeric:tabular-nums}' +
      '#sec-mcsim .mcs-big span{font-size:11px;color:var(--tx3);margin-top:4px;max-width:200px}' +
      '#sec-mcsim .mcs-side{flex:1;min-width:250px}' +
      '#sec-mcsim .mcs-quant{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      '#sec-mcsim .mcs-qcard{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center}' +
      '#sec-mcsim .mcs-qcard i{display:block;font-style:normal;font-size:10.5px;color:var(--tx3);margin-bottom:2px}' +
      '#sec-mcsim .mcs-qcard b{font-size:14.5px;font-variant-numeric:tabular-nums}' +
      '#sec-mcsim .mcs-rows{margin-top:8px}' +
      '#sec-mcsim .mcs-empty{border:1px dashed var(--line2);border-radius:12px;padding:26px 18px;text-align:center;color:var(--tx2);font-size:13px}' +
      '#sec-mcsim .mcs-empty span{font-size:11.5px;color:var(--tx3)}' +
      '@media(max-width:700px){#sec-mcsim .mcs-sliders{grid-template-columns:1fr}#sec-mcsim .mcs-big b{font-size:32px}#sec-mcsim .mcs-big{min-width:150px;padding:10px 14px}}';
    document.head.appendChild(st);
  }

  /* ---------- 持久化 ---------- */
  function persist() {
    if (!MJX) return;
    MJX.store.set(KEY, {
      p: { cMin: S.cMin, cMax: S.cMax, vMed: S.vMed, vVol: S.vVol, unit: S.unit },
      view: S.view,
      res: resDirty ? null : S.res,
    });
  }
  function loadState() {
    const st = MJX.store.get(KEY, null);
    if (!st || !st.p) return false;
    SLIDERS.forEach((c) => {
      let v = parseFloat(st.p[c.k]);
      S[c.k] = isFinite(v) ? Math.min(c.max, Math.max(c.min, v)) : DEF[c.k];
    });
    if (S.cMax < S.cMin + 50) S.cMax = S.cMin + 50;
    S.view = st.view === 'curve' ? 'curve' : 'hist';
    if (st.res && st.res.hist && st.res.curve && isFinite(st.res.prob)) S.res = st.res;
    return true;
  }

  /* ---------- 抽样引擎 ---------- */
  // 直方图分格：min<0<max 时让 0 恰好落在格线上，亏损/盈利分区着色零误差
  function buildBins(ps) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < ps.length; i++) { const p = ps[i]; if (p < lo) lo = p; if (p > hi) hi = p; }
    if (!(hi > lo)) { lo -= 1; hi += 1; }
    const edges = [lo];
    if (lo < 0 && hi > 0) {
      const nNeg = Math.max(1, Math.min(BINS - 1, Math.round(BINS * (0 - lo) / (hi - lo))));
      for (let i = 1; i < nNeg; i++) edges.push(lo + (-lo) * i / nNeg);
      edges.push(0); // 零线精确落在格线上（浮点安全，不做乘除回推）
      const nPos = BINS - nNeg;
      for (let i = 1; i <= nPos; i++) edges.push(hi * i / nPos);
    } else {
      for (let i = 1; i <= BINS; i++) edges.push(lo + (hi - lo) * i / BINS);
    }
    const counts = new Array(BINS).fill(0);
    for (let i = 0; i < ps.length; i++) {
      let b = 0; const p = ps[i];
      while (b < BINS - 1 && p > edges[b + 1]) b++;
      counts[b]++;
    }
    const bins = [];
    for (let b = 0; b < BINS; b++) bins.push({ x0: edges[b], x1: edges[b + 1], n: counts[b], neg: edges[b + 1] <= 0 });
    return { bins: bins, lo: lo, hi: hi };
  }
  // 保本 S 曲线：prob(V) = 样本中 V×单价 ≥ 全片成本 的占比，V 饱和点 ≈ 成本上限 ÷ 单价下界
  function buildCurve(cost, uu, prm) {
    const vHi = prm.vMed * (1 + 2 * prm.vVol / 100);
    const uLo = Math.max(0.5, prm.unit * 0.7);
    let vMax = (prm.cMax * EPS_N) / uLo * 1.06;
    vMax = Math.max(vMax, vHi * 1.15, prm.vMed * 1.6);
    const pts = [];
    for (let k = 0; k < CURVE_N; k++) {
      const V = vMax * k / (CURVE_N - 1);
      let hit = 0;
      for (let i = 0; i < cost.length; i++) if (V * uu[i] >= cost[i]) hit++;
      pts.push({ v: V, p: hit / cost.length });
    }
    let v50 = null;
    if (pts[0].p >= 0.5) v50 = pts[0].v;
    else {
      for (let k = 1; k < CURVE_N; k++) {
        if (pts[k].p >= 0.5 && pts[k - 1].p < 0.5) {
          const a = pts[k - 1], b = pts[k];
          v50 = a.v + (0.5 - a.p) / (b.p - a.p) * (b.v - a.v);
          break;
        }
      }
    }
    let hit = 0;
    for (let i = 0; i < cost.length; i++) if (prm.vMed * uu[i] >= cost[i]) hit++;
    return { pts: pts, vMax: vMax, v50: v50, pMed: hit / cost.length };
  }
  function runSim() {
    const cMin = S.cMin, cMax = Math.max(S.cMax, S.cMin + 50);
    const vol = S.vVol / 100, vMed = S.vMed, unit = S.unit;
    const vLo = Math.max(1, vMed * (1 - vol)), vHi = vMed * (1 + 2 * vol);
    const uLo = Math.max(0.5, unit * 0.7), uHi = unit * 1.35;
    const cost = new Array(N_RUNS), uu = new Array(N_RUNS), ps = new Array(N_RUNS);
    let ok = 0, sum = 0;
    for (let i = 0; i < N_RUNS; i++) {
      const c = (cMin + Math.random() * (cMax - cMin)) * EPS_N;      // 全片成本 = 单集 × 集数，区间均匀抽样
      const v = tri(Math.random, vLo, vMed, vHi);                    // 全片播放量：右偏三角分布
      const u = tri(Math.random, uLo, unit, uHi);                    // 万播单价：围绕档位的三角分布
      cost[i] = c; uu[i] = u;
      const p = v * u - c;                                           // 毛口径利润
      ps[i] = p;
      if (p >= 0) ok++;
      sum += p;
    }
    const sorted = ps.slice().sort((a, b) => a - b);
    const prm = { cMin: cMin, cMax: cMax, vMed: vMed, vVol: S.vVol, unit: unit };
    S.res = {
      n: N_RUNS, prob: ok / N_RUNS, mean: sum / N_RUNS,
      p10: qtl(sorted, 0.1), p50: qtl(sorted, 0.5), p90: qtl(sorted, 0.9),
      params: prm, vLo: vLo, vHi: vHi,
      curve: buildCurve(cost, uu, prm),
      hist: buildBins(ps),
    };
    resDirty = false;
    hov.idx = -1; hideTip();
    renderResult();
    draw();
    persist();
  }

  /* ---------- 渲染：结果卡 / 摘要 / 报告 ---------- */
  function renderSummary() {
    const cMid = (S.cMin + S.cMax) / 2;
    const fullLo = S.cMin * EPS_N, fullHi = S.cMax * EPS_N, fullMid = cMid * EPS_N;
    const rev = S.vMed * S.unit;
    const profit = rev - fullMid;
    const be = S.unit > 0 ? fullMid / S.unit : NaN;
    const vLo = Math.max(1, S.vMed * (1 - S.vVol / 100));
    const worst = vLo * Math.max(0.5, S.unit * 0.7) - fullHi;
    const row = (l, v, color) => '<div class="calc-res-row"><span>' + l + '</span><b' + (color ? ' style="color:' + color + '"' : '') + '>' + v + '</b></div>';
    refs.summary.innerHTML =
      row('全片成本抽样区间（单集×' + EPS_N + '集）', money(fullLo) + ' ~ ' + money(fullHi)) +
      row('中位毛收入（' + wan(S.vMed) + ' × ¥' + S.unit + '）', money(rev)) +
      row('中位利润（点估计）', money(profit), signColor(profit)) +
      row('保本播放量（点估计）', isFinite(be) ? wan(be) : '—') +
      row('最差情形利润（区间下界）', money(worst), signColor(worst));
    refs.vFull.textContent = '¥' + (Math.round(fullLo / 100) / 10) + 'k~' + (Math.round(fullHi / 100) / 10) + 'k';
  }
  function qCard(lab, v) {
    return '<div class="mcs-qcard"><i>' + lab + '</i><b style="color:' + signColor(v) + '">' + money(v) + '</b></div>';
  }
  function renderResult() {
    const r = S.res;
    if (refs.report) refs.report.setAttribute('data-copy', MJX.regCopy(r ? buildReport(r) : '尚未跑模拟：请在「模拟沙盘」点「跑 ' + N_RUNS + ' 次模拟」。'));
    if (!r) {
      refs.resBox.innerHTML = '<div class="mcs-empty">🎲 还没有模拟结果——点上方「跑 ' + N_RUNS + ' 次模拟」开始抽样。<br>' +
        '<span>参数与最近一次结果会自动保存在本机浏览器，刷新后恢复。</span></div>';
      return;
    }
    const v50 = r.curve && isFinite(r.curve.v50) ? r.curve.v50 : null;
    const ratio = v50 && r.params.vMed > 0 ? (v50 / r.params.vMed).toFixed(1) : null;
    refs.resBox.innerHTML =
      '<div class="mcs-res">' +
      '<div class="mcs-big"><b style="color:' + probColor(r.prob) + '">' + pctf(r.prob) + '</b>' +
      '<span>回本概率 · ' + r.n + ' 次抽样中利润 ≥ 0 的占比（毛口径）</span></div>' +
      '<div class="mcs-side">' +
      '<div class="mcs-quant">' + qCard('P10 悲观', r.p10) + qCard('P50 中位', r.p50) + qCard('P90 乐观', r.p90) + '</div>' +
      '<div class="mcs-rows">' +
      '<div class="calc-res-row"><span>期望利润 E[利润]</span><b style="color:' + signColor(r.mean) + '">' + money(r.mean) + '</b></div>' +
      '<div class="calc-res-row"><span>50% 回本需全片播放' + (ratio ? '（当前中位的 ' + ratio + ' 倍）' : '') + '</span><b>' + (v50 ? wan(v50) : '—') + '</b></div>' +
      '<div class="calc-res-row"><span>播放量抽样区间（右偏三角）</span><b>' + wan(r.vLo) + ' ~ ' + wan(r.vHi) + '</b></div>' +
      '</div></div></div>' +
      '<div class="mcs-stale' + (resDirty ? ' show' : '') + '" id="mcStale">⚠️ 上图对应调整前的参数——点「跑 ' + N_RUNS + ' 次模拟」重跑后更新。</div>';
  }
  function buildReport(r) {
    const v50 = r.curve && isFinite(r.curve.v50) ? r.curve.v50 : null;
    const lines = [
      '【模拟沙盘 · 蒙特卡洛报告】（抽样 ' + r.n + ' 次 · 毛口径）',
      '参数：单集成本 ' + money(r.params.cMin) + '~' + money(r.params.cMax) + ' × ' + EPS_N + '集 · 全片播放中位 ' + wan(r.params.vMed) + '（波动 ' + r.params.vVol + '%）· 万播单价 ¥' + r.params.unit,
      '回本概率 ' + pctf(r.prob) + ' · 期望利润 ' + money(r.mean),
      '利润分位：P10 ' + money(r.p10) + ' / P50 ' + money(r.p50) + ' / P90 ' + money(r.p90),
      v50 ? '50% 回本需全片播放约 ' + wan(v50) + (r.params.vMed > 0 ? '（当前中位的 ' + (v50 / r.params.vMed).toFixed(1) + ' 倍）' : '') : null,
      '口径：毛收入未扣投流（投流通常吃掉销售费用的80-90%，净利再打1-3折）· 爆款分布极端（2026H1 破亿率仅0.47%）· 种子参数与档位同「互动计算器」DB.calc 口径',
    ];
    return lines.filter(Boolean).join('\n');
  }

  /* ---------- 绘制 ---------- */
  function setupCanvas() {
    const cv = refs.canvas, wrap = refs.wrap;
    const w = wrap.clientWidth;
    if (!w) return null;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(H_CHART * dpr);
    cv.style.height = H_CHART + 'px';
    let g = null;
    try { g = cv.getContext('2d'); } catch (e) { g = null; }
    if (!g) return null;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, H_CHART);
    return { g: g, w: w, h: H_CHART };
  }
  function draw() {
    if (!refs.canvas || !S.res) { if (S.res === null && refs.resBox) renderResult(); return; }
    if (!elRef || !elRef.isConnected) return;
    const shown = elRef.classList.contains('show');
    if (!shown) return; // 区块未显示：由 .show 的 MutationObserver 在进入路由时补画
    const st = setupCanvas();
    if (!st) {
      if (drawTries++ < 30) raf(draw); // 布局未就绪时下一帧重试（jsdom / 异常环境兜底）
      return;
    }
    drawTries = 0;
    if (S.view === 'hist') drawHist(st); else drawCurve(st);
  }
  function drawHist(st) {
    const g = st.g, w = st.w, h = st.h;
    const r = S.res, bins = r.hist.bins;
    const padL = 12, padR = 12, padT = 18, padB = 26;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    let yMax = 1;
    for (let i = 0; i < bins.length; i++) if (bins[i].n > yMax) yMax = bins[i].n;
    const x = (v) => padL + (v - r.hist.lo) / (r.hist.hi - r.hist.lo) * plotW;
    const y = (n) => padT + plotH - n / yMax * plotH;
    const cHot = cssVar('--hot'), cOk = cssVar('--ok'), cLine = cssVar('--line'), cTx3 = cssVar('--tx3'), cTx = cssVar('--tx');
    g.strokeStyle = cLine; g.lineWidth = 1;
    g.beginPath(); g.moveTo(padL, padT + plotH + 0.5); g.lineTo(w - padR, padT + plotH + 0.5); g.stroke();
    const bw = plotW / BINS;
    for (let i = 0; i < bins.length; i++) {
      const b = bins[i];
      const bx = padL + i * bw + 1, by = y(b.n), bh = padT + plotH - by;
      const bwi = Math.max(1, bw - 2);
      g.globalAlpha = hov.idx === i ? 1 : 0.78;
      g.fillStyle = b.neg ? cHot : cOk;
      if (b.n > 0 || hov.idx === i) g.fillRect(bx, by, bwi, Math.max(bh, 1));
      if (hov.idx === i) {
        g.globalAlpha = 1; g.strokeStyle = cTx; g.lineWidth = 1;
        g.strokeRect(bx + 0.5, by + 0.5, bwi - 1, Math.max(bh, 1) - 1);
      }
      g.globalAlpha = 1;
    }
    if (r.hist.lo < 0 && r.hist.hi > 0) {
      const zx = Math.round(x(0)) + 0.5;
      g.strokeStyle = cTx3; g.setLineDash([4, 4]);
      g.beginPath(); g.moveTo(zx, padT - 4); g.lineTo(zx, padT + plotH); g.stroke();
      g.setLineDash([]);
      g.fillStyle = cTx3; g.font = FONT; g.textAlign = 'center';
      g.fillText('保本线 0', zx, h - 6);
    }
    g.fillStyle = cTx3; g.font = FONT;
    g.textAlign = 'left'; g.fillText('利润（元） · 每格样本峰值 ' + yMax, padL + 2, padT - 7);
    g.fillText(money(r.hist.lo), padL, h - 6);
    g.textAlign = 'right'; g.fillText(money(r.hist.hi), w - padR, h - 6);
    g.textAlign = 'right'; g.fillStyle = cHot; g.fillText('■ 亏损', w - padR - 92, padT - 7);
    g.fillStyle = cOk; g.fillText('■ 盈利', w - padR, padT - 7);
    lastGeo = { mode: 'hist', padL: padL, plotW: plotW, lo: r.hist.lo, hi: r.hist.hi };
  }
  function drawCurve(st) {
    const g = st.g, w = st.w, h = st.h;
    const r = S.res, cv = r.curve;
    const padL = 44, padR = 14, padT = 18, padB = 26;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const X = (v) => padL + v / cv.vMax * plotW;
    const Y = (p) => padT + plotH - p * plotH;
    const cP1 = cssVar('--p1'), cP2 = cssVar('--p2'), cGold = cssVar('--gold'), cOk = cssVar('--ok'), cLine = cssVar('--line'), cTx3 = cssVar('--tx3'), cTx = cssVar('--tx');
    // 横向网格与概率刻度
    g.font = FONT;
    for (let i = 0; i <= 4; i++) {
      const p = i / 4, yy = Math.round(Y(p)) + 0.5;
      g.strokeStyle = cLine; g.lineWidth = 1;
      g.beginPath(); g.moveTo(padL, yy); g.lineTo(w - padR, yy); g.stroke();
      g.fillStyle = cTx3; g.textAlign = 'right';
      g.fillText(i % 2 === 0 ? (p * 100) + '%' : '', padL - 6, yy + 3.5);
    }
    // 曲线下面积 + 描边
    g.beginPath();
    g.moveTo(X(0), Y(0));
    for (let k = 0; k < cv.pts.length; k++) g.lineTo(X(cv.pts[k].v), Y(cv.pts[k].p));
    g.lineTo(X(cv.vMax), Y(0));
    g.closePath();
    g.globalAlpha = 0.13; g.fillStyle = cP1; g.fill(); g.globalAlpha = 1;
    const grad = g.createLinearGradient(padL, 0, w - padR, 0);
    grad.addColorStop(0, cP1); grad.addColorStop(1, cP2);
    g.beginPath();
    for (let k = 0; k < cv.pts.length; k++) {
      const px = X(cv.pts[k].v), py = Y(cv.pts[k].p);
      if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.strokeStyle = grad; g.lineWidth = 2.2; g.stroke();
    // 50% 回本交点
    if (cv.v50 != null) {
      const vx = X(cv.v50);
      g.strokeStyle = cOk; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(padL, Y(0.5)); g.lineTo(Math.max(padL, vx), Y(0.5)); g.stroke();
      g.setLineDash([]);
      g.fillStyle = cOk;
      g.beginPath(); g.arc(vx, Y(0.5), 4, 0, Math.PI * 2); g.fill();
      g.textAlign = vx > w - 130 ? 'right' : 'left';
      g.fillText('50% ↔ ' + wan(cv.v50), vx + (g.textAlign === 'left' ? 8 : -8), Y(0.5) - 7);
    }
    // 当前播放量中位标记
    const mx = X(S.vMed), my = Y(cv.pMed);
    g.strokeStyle = cGold; g.setLineDash([4, 4]);
    g.beginPath(); g.moveTo(mx + 0.5, padT); g.lineTo(mx + 0.5, padT + plotH); g.stroke();
    g.setLineDash([]);
    g.fillStyle = cGold;
    g.beginPath(); g.arc(mx, my, 4.5, 0, Math.PI * 2); g.fill();
    g.textAlign = mx > w - 150 ? 'right' : 'left';
    g.fillText('中位 ' + wan(S.vMed) + ' · ' + pctf(cv.pMed), mx + (g.textAlign === 'left' ? 8 : -8), padT + 10);
    // 悬停十字线
    if (hov.idx >= 0 && cv.pts[hov.idx]) {
      const hx = X(cv.pts[hov.idx].v), hy = Y(cv.pts[hov.idx].p);
      g.strokeStyle = cTx3; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(hx + 0.5, padT); g.lineTo(hx + 0.5, padT + plotH); g.stroke();
      g.setLineDash([]);
      g.fillStyle = cTx;
      g.beginPath(); g.arc(hx, hy, 3.5, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = cTx3; g.textAlign = 'left';
    g.fillText('回本概率随播放量的 S 型累计曲线', padL + 2, padT - 7);
    g.textAlign = 'right';
    g.fillText('全片累计播放量（万）→', w - padR, h - 6);
    lastGeo = { mode: 'curve', padL: padL, plotW: plotW, vMax: cv.vMax, pts: cv.pts };
  }

  /* ---------- 画布 tooltip（hover / 触摸） ---------- */
  function hideTip() {
    if (refs.tip) refs.tip.style.display = 'none';
    if (hov.idx !== -1) { hov.idx = -1; if (S.res) draw(); }
  }
  function moveTip(px, wCss) {
    const r = S.res, geo = lastGeo;
    if (!r || !geo) return false;
    let idx = -1, html = '';
    if (geo.mode === 'hist') {
      const rel = (px - geo.padL) / geo.plotW;
      if (rel < -0.02 || rel > 1.02) { hideTip(); return false; }
      const p = geo.lo + Math.min(1, Math.max(0, rel)) * (geo.hi - geo.lo);
      const bins = r.hist.bins;
      for (let i = 0; i < bins.length; i++) {
        if (p >= bins[i].x0 && (p < bins[i].x1 || i === bins.length - 1)) { idx = i; break; }
      }
      if (idx < 0) { hideTip(); return false; }
      const b = bins[idx];
      const share = r.n ? (b.n / r.n * 100) : 0;
      html = '<b>' + money(b.x0) + ' ~ ' + money(b.x1) + '</b><br>' + b.n + ' 个样本 · 占 ' + share.toFixed(1) + '%' + (b.neg ? ' · 亏损区' : ' · 盈利区');
    } else {
      const rel = (px - geo.padL) / geo.plotW;
      if (rel < -0.02 || rel > 1.02) { hideTip(); return false; }
      idx = Math.min(CURVE_N - 1, Math.max(0, Math.round(rel * (CURVE_N - 1))));
      const pt = geo.pts[idx];
      html = '<b>播放量 ' + wan(pt.v) + '</b><br>回本概率 ≈ ' + pctf(pt.p);
    }
    if (hov.idx !== idx) { hov.idx = idx; draw(); }
    const tip = refs.tip;
    tip.style.display = 'block';
    tip.innerHTML = html;
    const tw = tip.offsetWidth;
    let lx = px + 14;
    if (lx + tw > wCss - 4) lx = px - tw - 14;
    if (lx < 4) lx = 4;
    tip.style.left = lx + 'px';
    return true;
  }
  function bindCanvas() {
    const cv = refs.canvas;
    const relX = (clientX) => {
      const rect = cv.getBoundingClientRect();
      return { px: clientX - rect.left, w: rect.width };
    };
    cv.addEventListener('mousemove', (e) => { const t = relX(e.clientX); moveTip(t.px, t.w); });
    cv.addEventListener('mouseleave', hideTip);
    cv.addEventListener('touchstart', (e) => {
      const t = e.touches && e.touches[0];
      if (t) { const g = relX(t.clientX); moveTip(g.px, g.w); }
    }, { passive: true });
    cv.addEventListener('touchmove', (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      const g = relX(t.clientX);
      if (moveTip(g.px, g.w)) e.preventDefault(); // 命中图表时才拦截页面滚动
    }, { passive: false });
    cv.addEventListener('touchend', hideTip);
  }

  /* ---------- 滑杆与 chips ---------- */
  function labelOf(k) {
    if (k === 'cMin' || k === 'cMax') return money(S[k]);
    if (k === 'vMed') return wan(S[k]);
    if (k === 'vVol') return S[k] + '%';
    if (k === 'unit') return '¥' + S[k] + ' /万播';
    return String(S[k]);
  }
  function paintSlider(inp) {
    const min = parseFloat(inp.min), max = parseFloat(inp.max), v = parseFloat(inp.value);
    const pct = max > min ? (v - min) / (max - min) * 100 : 0;
    inp.style.background = 'linear-gradient(90deg,var(--p1),var(--p2) ' + pct + '%,var(--line) ' + pct + '%)';
  }
  function syncSliders() {
    SLIDERS.forEach((c) => {
      const inp = refs['s_' + c.k];
      inp.value = S[c.k];
      refs['v_' + c.k].textContent = labelOf(c.k);
      paintSlider(inp);
    });
  }
  function syncTierChips() {
    const tiers = C.revTiers || [];
    let matched = -1;
    for (let i = 0; i < tiers.length; i++) if (tiers[i].unit === S.unit) matched = i;
    elRef.querySelectorAll('[data-mctier]').forEach((x) =>
      x.classList.toggle('on', parseInt(x.getAttribute('data-mctier'), 10) === matched));
  }
  function markStale() {
    resDirty = true;
    const st = document.getElementById('mcStale');
    if (st) st.classList.add('show');
    persist();
  }

  /* ---------- render：一次性写入 section 并绑定事件（route 的 render-once 语义） ---------- */
  function render(el, ctx) {
    MJX = ctx; elRef = el;
    injectStyle();
    const hadSaved = loadState();

    const sliderHtml = SLIDERS.map((c) =>
      '<div class="mcs-slider-row"><div class="mcs-slider-head"><span>' + c.lab + '</span><b id="mcv-' + c.k + '">—</b></div>' +
      '<input type="range" class="mcs-slider" id="mcs-' + c.k + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" aria-label="' + c.lab + '">' +
      '<div class="mcs-hint">' + c.hint + '</div></div>'
    ).join('');
    const fullCell =
      '<div class="mcs-slider-row"><div class="mcs-slider-head"><span>全片成本（自动）</span><b id="mcv-full">—</b></div>' +
      '<div class="mcs-hint">单集成本 × ' + EPS_N + ' 集（集数取「互动计算器」默认 eps），抽样时在区间内均匀分布。</div></div>';
    const tierChips = (C.revTiers || []).map((t, i) =>
      '<span class="chip" data-mctier="' + i + '" title="' + MJX.esc(t.d || '') + '">' + TIER_LABELS[i] + ' · ' + t.unit + '元</span>'
    ).join('');
    const warnNote = (C.revNotes && C.revNotes[0]) || '';
    const warnNote2 = (C.revNotes && C.revNotes[1]) || '';
    const warnBody = warnNote.split('：').slice(1).join('：') || warnNote;
    const bandNote = (C.costNotes && C.costNotes[3]) || '';

    el.innerHTML =
      '<div class="callout blue"><b>模拟沙盘 = 「互动计算器」的概率版。</b>calc 用点估计回答"平均能赚多少"，这里把单集成本区间、播放量与万播单价当成<b>分布</b>随机抽样 ' + N_RUNS + ' 次，回答"有多大把握不亏"：回本概率、利润直方图（亏损红 / 盈利绿）、P10/P50/P90 分位与 50% 回本所需播放量。种子参数、收益档位与警示口径全部读自「互动计算器」同一套数据，不新增研究数字。</div>' +
      '<div class="grid g2" style="margin-top:14px">' +
      '<div class="chart-box"><h5>🎚️ 参数沙盘 <span class="sub">5 组滑杆 · 拖动即时重算点估计摘要</span></h5>' +
      '<div class="mcs-sliders">' + sliderHtml + fullCell + '</div>' +
      '<div class="tool-filters" style="margin:14px 0 4px;align-items:center"><span class="mini-note" style="margin:0">场景预设：</span>' + tierChips +
      '<button class="copy-btn" id="mcReset" style="margin-left:auto">↻ 重置参数</button></div>' +
      '<div class="calc-out" id="mcSummary"></div>' +
      '<p class="mini-note">' + MJX.esc(bandNote) + '</p></div>' +
      '<div class="chart-box"><h5>🎲 蒙特卡洛模拟 <span class="sub">利润 = 全片播放量 × 万播单价 − 全片成本（毛口径）</span></h5>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px">' +
      '<button class="btn pri" id="mcRun">🎲 跑 ' + N_RUNS + ' 次模拟</button>' +
      '<span class="chip on" data-mcview="hist" title="利润分布直方图">📊 直方图</span>' +
      '<span class="chip" data-mcview="curve" title="回本概率随播放量的累计曲线">📈 保本S曲线</span>' +
      '<button class="copy-btn" id="mcReport" style="margin-left:auto">📋 复制模拟报告</button></div>' +
      '<div class="mcs-canvas-wrap" id="mcWrap"><canvas id="mcCanvas" aria-label="模拟结果图"></canvas><div class="mcs-tip" id="mcTip"></div></div>' +
      '<div id="mcRes"></div>' +
      '<div class="callout red" style="margin-top:14px"><b>⚠️ 口径警示：</b>模拟利润为<b>毛口径</b>，未扣投流与分成：' + MJX.esc(warnBody) + '。' + MJX.esc(warnNote2) + '</div>' +
      '<p class="mini-note">' + MJX.esc((C.revNotes && C.revNotes[3]) || '') + '</p></div>' +
      '</div>' +
      '<div style="margin-top:14px"><button class="btn ghost" data-go="calc">← 回「互动计算器」算点估计三本账</button></div>';

    refs = {
      canvas: el.querySelector('#mcCanvas'),
      wrap: el.querySelector('#mcWrap'),
      tip: el.querySelector('#mcTip'),
      summary: el.querySelector('#mcSummary'),
      resBox: el.querySelector('#mcRes'),
      report: el.querySelector('#mcReport'),
      reset: el.querySelector('#mcReset'),
      run: el.querySelector('#mcRun'),
      stale: el.querySelector('#mcStale'),
      vFull: el.querySelector('#mcv-full'),
    };
    SLIDERS.forEach((c) => {
      refs['s_' + c.k] = el.querySelector('#mcs-' + c.k);
      refs['v_' + c.k] = el.querySelector('#mcv-' + c.k);
    });

    /* 滑杆：拖动即时重算摘要；跨约束（下限 < 上限）自动互推 */
    SLIDERS.forEach((c) => {
      const inp = refs['s_' + c.k];
      inp.addEventListener('input', () => {
        let v = parseFloat(inp.value);
        if (!isFinite(v)) v = c.min;
        S[c.k] = Math.min(c.max, Math.max(c.min, v));
        if (c.k === 'cMin' && S.cMax < S.cMin + 50) { S.cMax = S.cMin + 50; }
        if (c.k === 'cMax' && S.cMax < S.cMin + 50) { S.cMin = Math.max(100, S.cMax - 50); }
        if (c.k === 'unit') syncTierChips(); // 手动改价后取消预设高亮
        syncSliders();
        renderSummary();
        markStale();
      });
    });

    /* 场景预设：一键换参（档位取 DB.calc.revTiers）并自动重跑 */
    el.querySelectorAll('[data-mctier]').forEach((ch) => {
      ch.addEventListener('click', () => {
        const i = parseInt(ch.getAttribute('data-mctier'), 10);
        const t = (C.revTiers || [])[i];
        if (!t) return;
        S.unit = t.unit;
        syncSliders();
        elRef.querySelectorAll('[data-mctier]').forEach((x) => x.classList.toggle('on', x === ch));
        renderSummary();
        runSim();
        MJX.toast('已切换「' + t.n + '」档：万播 ' + t.unit + ' 元 · 已重跑 ' + N_RUNS + ' 次模拟');
      });
    });

    /* 跑模拟 / 视图切换 / 重置 / 报告复制（data-copy 走 document 级委托） */
    refs.run.addEventListener('click', () => runSim());
    el.querySelectorAll('[data-mcview]').forEach((ch) => {
      ch.addEventListener('click', () => {
        const v = ch.getAttribute('data-mcview');
        if (v === S.view) return;
        S.view = v;
        hov.idx = -1; hideTip();
        el.querySelectorAll('[data-mcview]').forEach((x) => x.classList.toggle('on', x.getAttribute('data-mcview') === v));
        draw();
        persist();
      });
    });
    refs.reset.addEventListener('click', () => {
      S.cMin = DEF.cMin; S.cMax = DEF.cMax; S.vMed = DEF.vMed; S.vVol = DEF.vVol; S.unit = DEF.unit;
      syncSliders(); syncTierChips();
      renderSummary();
      runSim();
      MJX.toast('参数已重置（三本账默认口径）');
    });

    bindCanvas();

    /* 同步初始视图状态 */
    syncSliders();
    syncTierChips();
    renderSummary();
    if (S.res) { renderResult(); draw(); }
    else if (!hadSaved) runSim(); // 首次访问：自动跑一轮默认参数，页面不空白
    else renderResult();

    /* 明暗主题切换 → 取新 CSS 变量重绘 */
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (S.res) draw(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      /* render-once 语义：再次进入本路由不会重跑 render，用 .show 类变化补画（并重取画布宽度） */
      new MutationObserver(() => {
        if (elRef.classList.contains('show')) { drawTries = 0; draw(); }
      }).observe(el, { attributes: true, attributeFilter: ['class'] });
    }
    /* 窗口缩放重绘（rAF 节流） */
    let rzPending = false;
    window.addEventListener('resize', () => {
      if (rzPending) return;
      rzPending = true;
      raf(() => { rzPending = false; if (elRef.classList.contains('show')) draw(); });
    });
  }

  function mount() { /* Canvas 初始化在 render 内完成；mount 留空以对齐契约可选语义 */ }

  /* ---------- 注册（window.MJ 自注册机制；__MJ_QUEUE 兜底） ---------- */
  const mod = {
    id: 'mcsim',
    icon: 'dice', // ICONS 表既有键名（app.js:92）
    name: '模拟沙盘',
    cnt: '2000次',
    sub: ['蒙特卡洛风险模拟 · 有多大把握不亏',
      '「互动计算器」回答平均能赚多少，这里回答有多大把握不亏：单集成本区间 × 播放量 / 万播单价分布随机抽样 2000 次，输出回本概率、利润直方图（亏损红 / 盈利绿）与 P10/P50/P90 分位——把"爆款率不足 0.1%"的行业口径变成可拖动感知的概率曲线。'],
    after: 'calc',
    search: [
      { tit: '蒙特卡洛风险模拟', txt: '单集成本区间×全片播放量×万播单价分布随机抽样2000次：回本概率、利润直方图、P10/P50/P90分位与期望利润——有多大把握不亏' },
      { tit: '保本S曲线', txt: '回本概率随全片播放量的累计曲线：横轴播放量、纵轴回本概率，标出中位播放量位置与50%回本交点，口径与「互动计算器」回本播放量一致' },
      { tit: '场景预设：尾部IAA / 中位 / 头部出海IAP', txt: '万播单价5/15/30元三档一键换参并自动重跑模拟，档位与描述取自「互动计算器」收益档（DB.calc.revTiers）' },
    ],
    render: render,
    mount: mount,
  };
  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod); // false = 被拒（id 冲突等），契约负责 console.warn
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
