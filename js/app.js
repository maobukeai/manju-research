/* ============================================================
   漫剧研究学习平台 · 交互层 v2
   原生JS单页应用：hash路由 / 命令面板 / 全局搜索 / 三态主题
   进场编排 / 工具收藏 / 运镜控制台 / 清单存储 / 最近访问
   外挂模块自注册：window.MJ.addModule(mod)，feat-*.js 在 app.js 之后同步加载即插即用
   ============================================================ */
(function () {
  'use strict';

  const UI_VERSION = 'v2.0';

  /* ---------- 基础工具 ---------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const stars = (n) => {
    let h = '';
    for (let i = 1; i <= 5; i++) h += i <= n ? '★' : '<span class="off">★</span>';
    return '<span class="stars">' + h + '</span>';
  };
  const heatBar = (n) => {
    let h = '';
    for (let i = 1; i <= 5; i++) h += '<i class="hb-seg' + (i <= n ? ' on' : '') + '" style="animation-delay:' + (i * 0.06) + 's"></i>';
    return '<span class="heat-bar" title="热度 ' + n + '/5">' + h + '</span>';
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  };
  function hlMark(text, q) {
    text = String(text); q = String(q);
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  /* ---------- 复制 ---------- */
  const COPY_REG = []; let copySeq = 0;
  function regCopy(text) { COPY_REG[copySeq] = text; return copySeq++; }
  function doCopy(id, btn) {
    const text = COPY_REG[id] || '';
    const ok = () => {
      toast('✓ 已复制到剪贴板');
      if (btn) { const o = btn.textContent; btn.textContent = '✓ 已复制'; btn.classList.add('ok'); setTimeout(() => { btn.textContent = o; btn.classList.remove('ok'); }, 1200); }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('复制失败，请手动选择文本'); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- 内联SVG图标（UI chrome 用） ---------- */
  const svgWrap = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ICONS = {
    dashboard: svgWrap('<path d="M3.5 10.6 12 3.6l8.5 7"/><path d="M5.6 9.6V20h12.8V9.6"/><path d="M10 20v-5.4h4V20"/>'),
    pipeline: svgWrap('<rect x="3.4" y="8.2" width="17.2" height="11.6" rx="2"/><path d="M3.4 8.2 5 4.8l16.4 1.5-.8 1.9"/><path d="M8.2 4.9 6.9 8M12.6 5.4l-1.3 2.8M17 6l-1.3 2.7"/>'),
    tools: svgWrap('<path d="M5.5 4v5.5M5.5 14.5V20M12 4v9M12 18v2M18.5 4v2M18.5 11v9"/><circle cx="5.5" cy="12" r="2.2"/><circle cx="12" cy="15.5" r="2.2"/><circle cx="18.5" cy="8.5" r="2.2"/>'),
    cameras: svgWrap('<rect x="2.8" y="7" width="12.4" height="10" rx="2.2"/><path d="m15.2 10.6 5.8-3v8.8l-5.8-3"/>'),
    prompts: svgWrap('<path d="m4.2 19.8 4.4-1L19.9 7.5a2.1 2.1 0 0 0-3-3L5.6 15.8l-1.4 4Z"/><path d="m13.6 6.4 3.4 3.4"/>'),
    canvas: svgWrap('<path d="M13.5 4 14.7 7l3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2L13.5 4Z"/><path d="m5.5 12.5 6 6"/><path d="M18 13.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"/>'),
    llm: svgWrap('<rect x="6" y="6" width="12" height="12" rx="2.2"/><rect x="10.2" y="10.2" width="3.6" height="3.6"/><path d="M9 2.8V6M15 2.8V6M9 18v3.2M15 18v3.2M2.8 9H6M2.8 15H6M18 9h3.2M18 15h3.2"/>'),
    hot: svgWrap('<path d="M12 3.2c.9 3-2.8 4.6-2.8 7.8a2.8 2.8 0 0 0 5.6.2c0-1.2-.5-2.1-.5-2.1 2.1 1.1 4.2 3.4 4.2 6.2A6.5 6.5 0 0 1 5.5 15c0-5.2 5.3-7.6 6.5-11.8Z"/>'),
    learning: svgWrap('<path d="m12 4 10 4.5L12 13 2 8.5 12 4Z"/><path d="M6.5 10.5V15c0 1.5 2.5 2.9 5.5 2.9s5.5-1.4 5.5-2.9v-4.5"/><path d="M22 8.5v5.2"/>'),
    monetize: svgWrap('<circle cx="12" cy="12" r="8.6"/><path d="m8.8 7.6 3.2 4.2 3.2-4.2M12 11.8v5M9.4 13.4h5.2M9.4 15.4h5.2"/>'),
    cases: svgWrap('<path d="M4 5.6A2.6 2.6 0 0 1 6.6 3H20v15.2H6.6A2.6 2.6 0 0 0 4 20.8V5.6Z"/><path d="M20 18.2V21H6.6A2.6 2.6 0 0 1 4 18.4"/>'),
    checklist: svgWrap('<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="m8.4 12.4 2.6 2.6 4.8-5.4"/>'),
    glossary: svgWrap('<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5v17M13 8.5h3M13 12h3"/>'),
    docs: svgWrap('<path d="M4.5 5h5.5v14.5H4.5z"/><path d="M10 7h5.5v14.5H10z"/><path d="M15.5 9H20v12.5h-4.5z"/><path d="M6.2 8.5h2M11.7 10.5h2"/>'),
    calc: svgWrap('<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><path d="M8 7h8M8.2 12h.1M12 12h.1M15.8 12h.1M8.2 16h.1M12 16h.1M15.8 16h.1"/>'),
    earnpath: svgWrap('<path d="M12 20.8v-5.4"/><path d="M12 15.4C12 12.2 9 11.5 5.8 10.7"/><path d="M12 15.4c0-3.2 3-3.9 6.2-4.7"/><circle cx="12" cy="20.6" r="1.2"/><circle cx="5" cy="8.9" r="1.9"/><circle cx="19" cy="8.9" r="1.9"/><circle cx="12" cy="3.9" r="1.9"/><path d="M12 5.8v3.1"/>'),
    orders: svgWrap('<rect x="3.2" y="7.2" width="17.6" height="13" rx="2.2"/><path d="M9 7.2V5.4A1.9 1.9 0 0 1 10.9 3.5h2.2A1.9 1.9 0 0 1 15 5.4v1.8"/><path d="M3.2 12.6h17.6"/><path d="M10.6 12.6v2.6h2.8v-2.6"/>'),
    genres: svgWrap('<path d="M4.5 4.5h6.4v5.6a3.2 3.2 0 0 1-6.4 0V4.5Z"/><path d="M13.1 8.6h6.4v5.6a3.2 3.2 0 0 1-6.4 0V8.6Z"/><path d="M6.3 6.8h.1M9.1 6.8h.1M6.4 8.6q1.3 1.1 2.6 0"/><path d="M14.9 11h.1M17.7 11h.1M15 12.8q1.3 1.1 2.6 0"/><path d="M6 15.5c1.8 2.4 4 3.6 6.2 3.9"/>'),
    rhythm: svgWrap('<path d="M3 12h4l2.2-5.4 3.6 10.8 2.2-5.4H21"/>'),
    firstfilm: svgWrap('<rect x="3.4" y="4.6" width="17.2" height="16" rx="2.2"/><path d="M3.4 9h17.2M8 2.6v4M16 2.6v4"/><path d="m10.2 12.4 4.8 2.7-4.8 2.7v-5.4Z"/>'),
    log: svgWrap('<path d="M12 6.4C10.5 5 8.4 4.4 3.6 4.4v13.2c4.8 0 6.9.6 8.4 2 1.5-1.4 3.6-2 8.4-2V4.4c-4.8 0-6.9.6-8.4 2Z"/><path d="M12 6.4v13.2"/>'),
    theme: svgWrap('<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4a8.6 8.6 0 0 1 0 17.2" fill="currentColor" stroke="none" opacity=".4"/>'),
    link: svgWrap('<path d="M10 14.2a4.2 4.2 0 0 0 6 0l3.2-3.2a4.24 4.24 0 0 0-6-6l-1.4 1.4"/><path d="M14 9.8a4.2 4.2 0 0 0-6 0l-3.2 3.2a4.24 4.24 0 0 0 6 6l1.4-1.4"/>'),
    dice: svgWrap('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/>'),
    star: svgWrap('<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.6Z"/>'),
    kbd: svgWrap('<rect x="2.8" y="6" width="18.4" height="12" rx="2.2"/><path d="M6.2 9.8h.1M9.4 9.8h.1M12.6 9.8h.1M15.8 9.8h.1M6.2 14.2h.1M9 14.2h6.8M17.8 9.8h.1M17.8 14.2h.1"/>'),
  };

  /* ---------- 导航 ---------- */
  const NAV = [
    { id: 'dashboard', ico: 'dashboard', n: '总览' },
    { id: 'pipeline', ico: 'pipeline', n: '开发流程', cnt: DB.pipeline.length + '阶段' },
    { id: 'tools', ico: 'tools', n: '工具库', cnt: DB.tools.length + '款' },
    { id: 'cameras', ico: 'cameras', n: '运镜宝典', cnt: DB.cameras.length + '种' },
    { id: 'prompts', ico: 'prompts', n: '提示词库', cnt: DB.promptBank.reduce((a, c) => a + c.items.length, 0) + '+' },
    { id: 'canvas', ico: 'canvas', n: '无限画布' },
    { id: 'llm', ico: 'llm', n: '大模型应用' },
    { id: 'hot', ico: 'hot', n: '爆款心法' },
    { id: 'genres', ico: 'genres', n: '题材风向库', cnt: DB.genres.items.length + '题材' },
    { id: 'learning', ico: 'learning', n: '学习路径', cnt: '90天' },
    { id: 'firstfilm', ico: 'firstfilm', n: '第一部成片', cnt: '7天闭环' },
    { id: 'monetize', ico: 'monetize', n: '变现运营' },
    { id: 'earnpath', ico: 'earnpath', n: '收益决策树', cnt: '选路径' },
    { id: 'orders', ico: 'orders', n: '接单实操包', cnt: '报价/合同' },
    { id: 'calc', ico: 'calc', n: '互动计算器', cnt: '成本/收益' },
    { id: 'cases', ico: 'cases', n: '案例拆解', cnt: DB.cases.length + '个' },
    { id: 'rhythm', ico: 'rhythm', n: '节奏练习', cnt: DB.rhythmBank.length + '题' },
    { id: 'checklist', ico: 'checklist', n: '制作清单', cnt: DB.checklist.reduce((a, g) => a + g.items.length, 0) + '项' },
    { id: 'glossary', ico: 'glossary', n: '行业术语表', cnt: DB.glossary.length + '条' },
    { id: 'docs', ico: 'docs', n: '研究档案', cnt: (typeof RESEARCH_DOCS !== 'undefined' ? RESEARCH_DOCS.length : 0) + '篇' },
    { id: 'log', ico: 'log', n: '研究日志' },
  ];
  const SECTION_SUB = {
    dashboard: ['漫剧行业全景速览', '一图看懂 2026 年的 AI 漫剧：市场、产能、收益与工具生态。'],
    pipeline: ['九阶段开发全流程', '立项选题 → 剧本 → 分镜 → 设定 → 图像 → 视频 → 声音 → 剪辑 → 发布，点任何一个阶段查看实操细节。'],
    tools: ['漫剧工具矩阵', '顶部为' + DB.videoCompare.length + '款视频模型选型对比表；下方覆盖剧本、图像、视频、口型、声音、剪辑、平台流水线' + (DB.toolCats.length - 1) + '大环节，版本信息截至 ' + DB.meta.updated + '。点 ☆ 可收藏常用工具。'],
    cameras: [DB.cameras.length + '种AI运镜语言', '左侧为动画示意（可暂停/调速），每条提示词都可直接复制——铁律：方向 + 速度 + 目的。'],
    prompts: ['提示词工程手册', '两个万能公式 + ' + DB.promptBank.reduce((a, c) => a + c.items.length, 0) + '条可复制模板（含微表情与台词戏、古风专场） + 画风关键词 + 负面提示词，覆盖漫剧制作全部场景。'],
    canvas: ['无限画布工作流', '分镜连绘、角色锚定、场景延展的完整方法论与七步实操。'],
    llm: ['大模型在漫剧中的用法', '各环节 LLM 用途映射、模型选型、分镜 JSON 模板与自动化流水线。'],
    hot: ['爆款方法论', '黄金3秒、反转密度、卡点、投流、算法差异——从 0.18% 的爆款率里突围。'],
    genres: ['题材风向库', '男频/女频/出海主流题材的热度评级、对标爆款与风险提示，附2026新风向——立项前先来这里对表。'],
    learning: ['90天学习路径', '第1周跑通第一条片 → 第2-4周形成可复用生产线 → 第2-3月商业化与规模化。'],
    firstfilm: ['「第一部成片」7天闭环', '0基础照做：D1-D7每天做什么 / 用什么工具 / 产出物 / 常见坑——7天产出第一部可发布的AI漫剧单集并衔接第一笔收入；页首有成本速算与7天进度自查清单。页内工具名可直接跳转「工具库」对应条目。'],
    monetize: ['变现与合规', '各平台分账政策、出海机会、商业模式与四条合规红线。'],
    earnpath: ['收益决策树与对照表', '"我这种背景能赚多少、该走哪条变现路"——先用对照表立预期基准（业余/半职/全职 × 分账/商单/素材/教学），再答6个问题让决策树给出主路径与理由，最后用「互动计算器」算三本账验证。预期管理工具，不是暴富案例墙。'],
    orders: ['接单/商单实操包', '去哪接单（渠道盘点+门槛抽成）→ 怎么报价（三市场分层+四因子+计算器）→ 作品集（3部样片+数据截图）→ 交付标准 → 合同与定金 → 防骗 → 14天行动计划——报价单/合同条款/话术全部可复制，14天进度保存在本机浏览器。'],
    calc: ['互动计算器', '制作成本计算器 + 收益模拟器——"三本账"不用再心算，参数一调、回本播放量立刻算出来。'],
    cases: ['案例拆解', '2025-2026 年的现象级漫剧，每个案例提炼可复制经验。'],
    rhythm: ['分镜节奏练习', '随机5道剧情拍点题，判断它属于98秒单集结构的哪一段——黄金钩子0-3s/冲突建立3-15s/递进铺垫15-45s/黄金反转45-60s/爽点释放60-80s/卡点留钩80-98s。目标：练出"看到拍点就知道放第几秒"的结构感——最高分保存在本地。'],
    checklist: [DB.checklist.reduce((a, g) => a + g.items.length, 0) + '项制作检查清单', '从立项到发布的逐项自查，勾选进度自动保存在本地浏览器。'],
    glossary: ['行业术语速查', '行业与商业 / 剧本叙事 / 镜头语言 / 图像一致性 / 视频生成 / 合规——' + DB.glossary.length + '条黑话一次看懂。'],
    docs: ['研究档案阅读器', '全部研究档案的完整版站内阅读——左侧切换章节，支持全文检索；源文件在 research/ 目录，改后运行 node scripts/build-research.js 同步。'],
    log: ['研究更新日志', '本项目由自动研究管线持续追踪，每次更新记录在此。'],
  };

  /* ---------- 本地存储键 ---------- */
  const CK_KEY = 'manju_checklist_v1';
  const FAV_KEY = 'manju_favs_v1';
  const RECENT_KEY = 'manju_recent_v1';

  function renderNav() {
    $('#nav').innerHTML = NAV.map((x) =>
      '<div class="nav-item" data-go="' + x.id + '"><span class="ico">' + (ICONS[x.ico] || x.ico) + '</span>' + x.n +
      (x.cnt ? '<span class="cnt">' + x.cnt + '</span>' : '') + '</div>').join('');
  }

  /* ---------- 移动端底部快捷导航 ---------- */
  function renderMobNav() {
    const nav = $('#mobNav');
    if (!nav) return;
    const ids = ['dashboard', 'tools', 'cameras', 'prompts', 'calc'];
    nav.innerHTML = ids.map((id) => {
      const n = NAV.find((x) => x.id === id);
      if (!n) return '';
      return '<button class="mn-item" data-go="' + id + '">' + (ICONS[n.ico] || n.ico) + '<span>' + n.n + '</span></button>';
    }).join('') + '<button class="mn-item" id="mnPalette" title="命令面板（Ctrl+K）">⌘<span>面板</span></button>';
    const pal = document.getElementById('mnPalette');
    if (pal) pal.addEventListener('click', palOpen);
  }

  /* ---------- 主题系统（auto → light → dark 三态循环） ---------- */
  const mql = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function getThemePref() {
    try { const v = localStorage.getItem('manju_theme'); return (v === 'light' || v === 'dark') ? v : 'auto'; } catch (e) { return 'auto'; }
  }
  function resolvedTheme(pref) {
    return pref === 'auto' ? (mql && mql.matches ? 'dark' : 'light') : pref;
  }
  function applyThemeNow(pref) {
    document.documentElement.dataset.theme = resolvedTheme(pref);
    const btn = $('#themeBtn');
    btn.textContent = pref === 'dark' ? '🌙' : pref === 'light' ? '☀️' : '🌗';
    btn.title = '主题：' + (pref === 'dark' ? '深色' : pref === 'light' ? '浅色' : '跟随系统');
  }
  function setThemePref(pref) {
    try { localStorage.setItem('manju_theme', pref); } catch (e) { }
    applyThemeNow(pref);
    toast(pref === 'auto' ? '主题：跟随系统' : pref === 'dark' ? '主题：深色' : '主题：浅色');
  }
  function cycleTheme(originEl) { /* originEl 仅为兼容旧调用保留，圆形扩散过渡已移除 */
    const order = ['auto', 'light', 'dark'];
    setThemePref(order[(order.indexOf(getThemePref()) + 1) % order.length]);
  }
  if (mql && mql.addEventListener) mql.addEventListener('change', () => { if (getThemePref() === 'auto') applyThemeNow('auto'); });

  /* ---------- 路由 ---------- */
  let current = '';
  function route() {
    const qIdx = (location.hash || '').indexOf('?');
    const urlParams = new URLSearchParams(qIdx >= 0 ? location.hash.slice(qIdx + 1) : '');
    let id = (qIdx >= 0 ? location.hash.slice(0, qIdx) : (location.hash || '')).replace(/^#\/?/, '');
    if (!NAV.some((x) => x.id === id)) {
      const last = store.get(RECENT_KEY, [])[0];
      id = NAV.some((x) => x.id === last) ? last : 'dashboard';
      if (location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id);
    }
    current = id;
    $$('.sec').forEach((s) => s.classList.remove('show'));
    let sec = document.getElementById('sec-' + id);
    if (!sec) { sec = document.createElement('section'); sec.className = 'sec'; sec.id = 'sec-' + id; $('#app').appendChild(sec); }
    if (!sec.dataset.rendered) {
      try { const out = RENDERERS[id](); if (out !== null) sec.innerHTML = out; }
      catch (err) {
        console.error('render section: ' + id, err);
        sec.innerHTML = '<div class="callout red" style="margin-top:24px"><b>😮 该模块渲染出错：</b>' +
          esc(String((err && err.message) || err)) + '<br><span style="font-size:12px">数据更新过程中可能出现临时问题，刷新页面通常可恢复。</span></div>';
      }
      sec.dataset.rendered = '1';
    }
    sec.classList.add('show');
    $$('.nav-item').forEach((n) => {
      const on = n.dataset.go === id;
      n.classList.toggle('active', on);
      if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
    });
    $$('.mn-item[data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === id));
    const sub = SECTION_SUB[id];
    if (sub && !sec.querySelector('.sec-head')) sec.insertAdjacentHTML('afterbegin',
      '<div class="sec-head"><div class="bar"></div><h2>' + sub[0] + '</h2><p>' + sub[1] + '</p></div>');
    document.title = (NAV.find((x) => x.id === id) || {}).n + ' · 漫剧研究学习平台';
    $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show');
    window.scrollTo({ top: 0 });
    if (id === 'dashboard') runCounters(sec);
    if (id === 'checklist') { refreshCkProgress(); const cg = urlParams.get('g'); if (cg !== null) { const cel = document.getElementById('ckg-' + cg); if (cel && cel.closest('.ck-group')) cel.closest('.ck-group').scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    if (id === 'pipeline' && !$('#pipeDetail').innerHTML) renderPipeDetail(1);
    if (id === 'tools' && !$('#toolGrid').innerHTML) renderTools(toolCat);
    if (id === 'glossary' && !$('#glGrid').innerHTML) renderGlossary();
    if (id === 'cases' && !$('#caseGrid').innerHTML) renderCasesList();
    if (id === 'cameras' && !$('#camGrid').innerHTML) renderCams();
    if (id === 'cameras') initCamQuiz();
    if (id === 'genres' && !$('#gdGrid').innerHTML) renderGenres();
    if (id === 'prompts' && !$('#pbBank').innerHTML) renderPromptsBank();
    if (id === 'hot' && !$('#epDetail').innerHTML) renderEpBar();
    if (id === 'docs' && !$('#docToc').innerHTML) { renderDocToc(''); renderDoc(0); }
    if (id === 'calc') calcCompute();
    if (id === 'earnpath' && !$('#dtBox').innerHTML) dtRender();
    if (id === 'orders') { if (!$('#odGrid').innerHTML) renderOdChannels(); odQuoteCompute(); refreshOdProgress(); }
    if (id === 'firstfilm') { ffCostCompute(); refreshFfProgress(); }
    reveal(sec);
    enhanceTables(sec);
    buildTOC(sec);
    enhanceCode(sec);
    const hlKey = urlParams.get('hl');
    if (hlKey) setTimeout(() => jumpToCard(sec, hlKey), 380);
    if (urlParams.get('quiz')) setTimeout(() => {
      const d = $('#camQuizDetails');
      if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 380);
    const rec = store.get(RECENT_KEY, []).filter((x) => x !== id);
    rec.unshift(id); store.set(RECENT_KEY, rec.slice(0, 6));
  }

  /* ---------- 宽表格增强：需要横向滚动时显示右侧渐隐提示 ---------- */
  function enhanceTables(sec) {
    sec.querySelectorAll('.tbl-wrap').forEach((w) => {
      if (w.scrollWidth > w.clientWidth + 8) w.classList.add('scrollable');
      else w.classList.remove('scrollable');
    });
  }

  /* ---------- 代码块 JSON 语法高亮 ---------- */
  function highlightJSONPre(pre) {
    const txt = pre.textContent;
    const t = txt.trim();
    if (!t.startsWith('{') && !t.startsWith('[')) return;
    try { JSON.parse(t); } catch (e) { return; }
    const esc2 = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    let html = '', last = 0, m;
    while ((m = re.exec(txt))) {
      html += esc2(txt.slice(last, m.index));
      if (m[1] !== undefined) {
        html += m[2] ? '<span class="j-key">' + esc2(m[1]) + '</span>' + esc2(m[2])
                     : '<span class="j-str">' + esc2(m[1]) + '</span>';
      } else if (/^-?[\d]/.test(m[0])) {
        html += '<span class="j-num">' + esc2(m[0]) + '</span>';
      } else {
        html += '<span class="j-lit">' + esc2(m[0]) + '</span>';
      }
      last = m.index + m[0].length;
    }
    html += esc2(txt.slice(last));
    pre.innerHTML = html;
  }
  function enhanceCode(sec) {
    sec.querySelectorAll('.codebox pre').forEach((p) => {
      if (!p.dataset.jhl) { p.dataset.jhl = '1'; highlightJSONPre(p); }
    });
  }

  /* ---------- 卡片深链定位与脉冲高亮 ---------- */
  function jumpToCard(sec, key) {
    let target = null;
    sec.querySelectorAll('[data-hl]').forEach((el) => { if (el.dataset.hl === key) target = el; });
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 90);
    window.scrollTo({ top, behavior: 'smooth' });
    target.classList.add('hl-pulse');
    setTimeout(() => target.classList.remove('hl-pulse'), 2400);
  }

  /* ---------- 区块浮动目录（≥1200px 宽屏可用） ---------- */
  let tocEls = [];
  function buildTOC(sec) {
    const btn = $('#tocBtn'), panel = $('#tocPanel');
    if (!btn || !panel) return;
    const items = [];
    const title = sec.querySelector('.sec-head h2');
    if (title) items.push({ el: title, n: '📍 ' + title.textContent });
    sec.querySelectorAll('h4.block-t').forEach((h) => items.push({ el: h, n: h.textContent.replace(/\s+/g, ' ').trim() }));
    tocEls = items;
    if (items.length < 3) { btn.classList.remove('show'); panel.classList.remove('show'); return; }
    panel.innerHTML = '<div class="toc-title">本页目录</div>' + items.map((it, i) =>
      '<div class="toc-item" data-toc="' + i + '">' + esc(it.n.length > 30 ? it.n.slice(0, 30) + '…' : it.n) + '</div>').join('');
    btn.classList.add('show');
    tocSpy();
  }
  function tocSpy() {
    const panel = $('#tocPanel');
    if (!panel || !panel.classList.contains('show') || !tocEls.length) return;
    let cur = 0;
    tocEls.forEach((it, i) => { if (it.el.getBoundingClientRect().top <= 140) cur = i; });
    panel.querySelectorAll('.toc-item').forEach((n, i) => n.classList.toggle('cur', i === cur));
  }

  /* ---------- 进场编排（IntersectionObserver） ---------- */
  const rvIO = ('IntersectionObserver' in window)
    ? new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        rvIO.unobserve(el);
        setTimeout(() => { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, 900);
      });
    }, { threshold: .04, rootMargin: '0px 0px -30px' })
    : null;
  function reveal(sec) {
    if (!rvIO) return;
    const els = sec.querySelectorAll('.card,.stat-card,.pipe-step,.step-item,.log-item,.ck-progress,.chart-box,.sec-head');
    els.forEach((el, i) => {
      if (el.classList.contains('rv')) return;
      el.classList.add('rv');
      el.style.transitionDelay = Math.min(i, 12) * 38 + 'ms';
      rvIO.observe(el);
    });
  }

  /* ---------- 运镜演示：视口外自动暂停（省CPU），回视口恢复 ---------- */
  const camIO = ('IntersectionObserver' in window)
    ? new IntersectionObserver((es) => {
      es.forEach((en) => en.target.classList.toggle('off', !en.isIntersecting));
    }, { threshold: 0 })
    : null;
  function observeCamDemos() {
    if (!camIO) return;
    $$('.cam-demo').forEach((d) => { if (!d.dataset.camObs) { d.dataset.camObs = '1'; camIO.observe(d); } });
  }

  /* ---------- 数字滚动 ---------- */
  function countUpEl(el) {
    const raw = el.textContent.trim();
    const t0 = performance.now(), dur = 950;
    const ease = (p) => 1 - Math.pow(1 - p, 3);
    let m = raw.match(/^([\d.]+)\s*[-–~]\s*([\d.]+)(.*)$/);
    if (m && !/\d/.test(m[3])) {
      const a = +m[1], b = +m[2], decA = (m[1].split('.')[1] || '').length, decB = (m[2].split('.')[1] || '').length;
      const fr = (t) => { const p = Math.min(1, (t - t0) / dur), e = ease(p);
        el.textContent = (a * e).toFixed(decA) + '-' + (b * e).toFixed(decB) + m[3];
        if (p < 1) requestAnimationFrame(fr); };
      requestAnimationFrame(fr); return;
    }
    m = raw.match(/^([\d.]+)(.*)$/);
    if (m && m[1].length <= 7 && !/\d/.test(m[2])) {
      const to = +m[1], dec = (m[1].split('.')[1] || '').length;
      const fr = (t) => { const p = Math.min(1, (t - t0) / dur), e = ease(p);
        el.textContent = (to * e).toFixed(dec) + m[2];
        if (p < 1) requestAnimationFrame(fr); };
      requestAnimationFrame(fr);
    }
  }
  function runCounters(sec) {
    sec.querySelectorAll('.stat-card .s-num').forEach((el, i) => setTimeout(() => countUpEl(el), 120 + i * 70));
  }

  /* ---------- 场景SVG（运镜演示用） ---------- */
  const CITY_SVG = `<svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
  <g fill="#171d33"><rect x="0" y="60" width="34" height="60"/><rect x="30" y="38" width="26" height="82"/>
  <rect x="60" y="70" width="40" height="50"/><rect x="96" y="26" width="30" height="94"/>
  <rect x="130" y="52" width="24" height="68"/><rect x="158" y="14" width="36" height="106"/>
  <rect x="198" y="44" width="28" height="76"/><rect x="230" y="30" width="22" height="90"/>
  <rect x="256" y="58" width="36" height="62"/><rect x="296" y="20" width="30" height="100"/>
  <rect x="330" y="50" width="26" height="70"/><rect x="360" y="34" width="40" height="86"/></g>
  <g fill="#8b5cf6" opacity=".55"><rect x="36" y="48" width="3" height="4"/><rect x="44" y="60" width="3" height="4"/>
  <rect x="104" y="38" width="3" height="4"/><rect x="112" y="56" width="3" height="4"/><rect x="166" y="26" width="3" height="4"/>
  <rect x="178" y="44" width="3" height="4"/><rect x="304" y="32" width="3" height="4"/><rect x="312" y="52" width="3" height="4"/>
  <rect x="240" y="42" width="3" height="4"/><rect x="368" y="46" width="3" height="4"/></g>
  <g fill="#22d3ee" opacity=".45"><rect x="104" y="70" width="3" height="4"/><rect x="166" y="60" width="3" height="4"/>
  <rect x="304" y="70" width="3" height="4"/><rect x="36" y="76" width="3" height="4"/><rect x="240" y="66" width="3" height="4"/></g></svg>`;
  const CHAR_SVG = `<svg viewBox="0 0 120 170" style="width:100%;display:block">
  <defs><linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#a78bfa"/><stop offset=".5" stop-color="#e879a8"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
  <g fill="#0d1122" stroke="url(#rim)" stroke-width="1.6">
  <circle cx="60" cy="34" r="19"/>
  <path d="M41 30 Q38 8 60 10 Q82 8 79 30 Q80 18 70 14 Q74 22 66 16 Q60 22 50 15 Q44 20 41 30 Z"/>
  <path d="M42 52 Q60 46 78 52 L92 74 Q86 80 80 76 L84 150 Q60 160 36 150 L40 76 Q34 80 28 74 Z"/>
  <path d="M78 58 Q104 52 112 30 Q108 56 88 70 Z"/></g>
  <path d="M60 46 q-5 8 0 12 q5 -4 0 -12" fill="url(#rim)" opacity=".8"/></svg>`;

  function camDemo(c) {
    return '<div class="cam-demo" data-motion="' + c.m + '">' +
      '<div class="cam-scene"><div class="cam-sky"></div><div class="cam-moon"></div>' +
      '<div class="cam-city">' + CITY_SVG + '</div><div class="cam-ground"></div>' +
      '<div class="cam-char">' + CHAR_SVG + '</div></div>' +
      '<div class="cam-tag">' + c.n + ' · ' + c.en.split('/')[0].trim() + '</div>' +
      '<div class="cam-live">● 演示中</div>' +
      '<div class="cam-ctl">' +
      '<button class="cam-btn" data-camact="toggle" title="暂停 / 播放">⏸</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="0.5" title="0.5倍速">½×</button>' +
      '<button class="cam-btn on" data-camact="spd" data-v="1" title="1倍速">1×</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="2" title="2倍速">2×</button>' +
      '</div></div>';
  }

  /* ---------- 各区块渲染 ---------- */
  const RENDERERS = {

    dashboard() {
      const stat = (s) => '<div class="stat-card"><div class="s-num">' + s.n + '</div><div class="s-lab">' + s.l + '</div><div class="s-sub">' + s.s + '</div></div>';
      const note = (x) => '<div class="card"><div style="font-size:24px">' + x.ico + '</div><b style="display:block;margin:6px 0 4px">' + x.t + '</b><p style="font-size:12.8px;color:var(--tx2)">' + x.d + '</p><div style="margin-top:8px">' + (x.tag ? '<span class="tag ' + x.tag + '">' + { h: '⚠ 警示', c: '→ 机会', g: '→ 增长' }[x.tag] + '</span>' : '') + '</div></div>';
      const mod = (x, d) => '<div class="card mod-card" data-go="' + x.id + '"><span class="m-go">→</span><div class="m-ico">' + ICONS[x.ico] + '</div><b>' + x.n + '</b><p>' + d + '</p>' + (x.cnt ? '<span class="mod-badge">' + x.cnt + '</span>' : '') + '</div>';
      const modDesc = {
        pipeline: '九阶段全流程拆解，每阶段含工具/产出/避坑', tools: '视频模型对比表+' + DB.tools.length + '款工具的定位/价格/实战技巧', cameras: DB.cameras.length + '种运镜动画演示+可复制提示词',
        prompts: '2个万能公式+' + DB.promptBank.reduce((a, c) => a + c.items.length, 0) + '条模板+负面词对照表', canvas: '即梦/剪映Hub/可灵灵动画布等' + DB.canvas.tools.length + '款画布工具+七步实操', llm: '分镜JSON模板+完整一集示例+' + DB.llm.automation.length + '条自动化流水线路线',
        hot: '黄金3秒/反转/卡点/投流的量化标准', learning: '7天入门→30天产线→90天商业化的完整路径', monetize: DB.monetize.platforms.length + '大平台分账政策与出海打法',
        calc: '制作成本计算器+收益模拟器，一键算出回本播放量', cases: DB.cases.length + '个现象级案例的可复制经验',
        genres: '男频/女频/出海题材热度与对标，含2026新风向', rhythm: '98秒单集结构拍点判断，8题随机5题，练"拍点放第几秒"的结构感',
        checklist: DB.checklist.reduce((a, g) => a + g.items.length, 0) + '项自查清单，本地保存进度', glossary: DB.glossary.length + '条行业黑话分类速查', log: '每周自动研究更新记录',
        docs: RESEARCH_DOCS.length + '篇完整研究档案站内阅读，支持章节切换与全文检索',
      };
      return `
      <div class="hero">
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
        <div class="h-kicker">MANJU RESEARCH LAB · AI ANIME SHORT DRAMA</div>
        <h1>把 <em>AI漫剧</em> 做成一门<br>可复制的工业化手艺</h1>
        <p>本平台持续研究漫剧（AI动态漫画短剧）的最新开发流程、工具栈、运镜语言、无限画布工作流、大模型玩法与变现政策——研究成果全部结构化收录在此，由自动研究管线每周更新。</p>
        <div class="h-btns">
          <button class="btn pri" data-go="pipeline">从九阶段流程开始 →</button>
          <button class="btn ghost" data-go="tools">浏览工具库</button>
          <button class="btn ghost" data-go="cameras">看运镜演示</button>
        </div>
      </div>
      ${DB.log[0] ? '<button class="latest-strip" data-go="log"><span class="ls-badge">最新研究</span><span class="ls-txt">' + DB.log[0].date + ' · ' + DB.log[0].t + '</span><span class="ls-go">查看 →</span></button>' : ''}
      <div class="stat-grid">${DB.quickStats.map(stat).join('')}</div>
      <h4 class="block-t">2026年10月 · 行业${DB.industryNotes.length}个关键词</h4>
      <div class="grid g4">${DB.industryNotes.map(note).join('')}</div>
      <h4 class="block-t">平台模块导航 <span class="sub">全部 ${NAV.length - 1} 个模块见左侧导航</span></h4>
      <div class="module-grid">
        ${['pipeline', 'tools', 'prompts', 'cameras', 'calc', 'docs'].map((id) => NAV.find((x) => x.id === id)).filter(Boolean).map((x) => mod(x, modDesc[x.id] || '')).join('')}
      </div>
      <div class="callout red"><b>入局必读：</b>行业报价半年跌幅超90%、在播爆款率仅0.18%、红果已砍保底——先用「制作清单」里的"三本账"算清成本，再决定投入。可行路径：官方授权IP改编 + Agent流水线压成本 + 多平台矩阵分发 + 出海IAP溢价。</div>`;
    },

    pipeline() {
      const strip = DB.pipeline.map((p) =>
        '<div class="pipe-step" data-stage="' + p.no + '"><div class="p-num">STAGE ' + p.no + '</div><div class="p-ico">' + p.ico + '</div><div class="p-name">' + p.name + '</div><div class="p-time">⏱ ' + p.time + '</div></div>').join('');
      return '<div class="pipe-strip">' + strip + '</div><div id="pipeDetail"></div>';
    },

    tools() {
      const cats = DB.toolCats;
      const vcRows = DB.videoCompare.map((v) => '<tr><td><b>' + v.m + '</b></td><td>' + v.dur + '</td><td>' + v.res + '</td><td>' + v.adv + '</td><td style="color:var(--tx2)">' + v.con + '</td><td>' + v.scene + '</td><td style="color:var(--tx2)">' + v.price + '</td></tr>').join('');
      const vc = '<div class="chart-box" style="margin-bottom:16px"><h5>视频模型选型对比（' + DB.videoCompare.length + '款主力 · v1.5）</h5>' +
        '<div class="tbl-wrap vc-wrap"><table class="tbl vc-table"><thead><tr><th>模型</th><th>单次时长</th><th>分辨率</th><th>核心优势</th><th>一致性手段</th><th>适用场景</th><th>价位</th></tr></thead><tbody>' + vcRows + '</tbody></table></div>' +
        '<p class="mini-note">' + DB.videoCompareNote + '</p></div>';
      return vc + '<div class="tool-filters">' + cats.map((c, i) =>
        '<span class="chip' + (i === 0 ? ' on' : '') + '" data-cat="' + c.id + '">' + c.ico + ' ' + c.n + '</span>').join('') +
        '<span class="chip" data-cat="__fav">★ 收藏 <b class="fav-cnt" id="favCnt"></b></span>' +
        '<span class="chip" data-tsort="rate">★ 评分优先</span><span class="chip" data-tsort="name">名称 A-Z</span>' +
        '</div><div class="inline-search"><span class="search-ico">⌕</span><input id="toolSearch" placeholder="即时筛选：输入名称 / 定位 / 优势 / 技巧关键词…" autocomplete="off"></div><div class="grid g3" id="toolGrid"></div>';
    },

    cameras() {
      return '<div class="callout blue"><b>运镜铁律（Runway官方指南 2025-2026）：</b>' + DB.camRules.join('；') + '。每格演示左下角可 <b>暂停 / 0.5× / 1× / 2×</b> 变速观察。</div>' +
        '<div class="callout"><b>版本动态（v1.5）：</b>可灵4.0已正式上线（2026-09末）——3-30秒生成、720P/1080P/4K直出（1080P与4K支持10-bit HDR）、全能参考多主体控制，续写功能可把片段串联至2分钟且角色场景基本不漂移；正式版初期排队拥堵，"4.0大场面+3.0 Omni跑量"是当前最优组合。八款模型横向对比见「工具库」顶部速查表。</div>' +
        '<div class="callout red" style="margin-bottom:16px"><b>台词镜头运镜约束（research/19 · 口型表演进阶）：</b>' + DB.camTalkRules.join('；') + '。</div>' +
        '<h4 class="block-t">运镜×情绪映射表 <span class="sub">' + DB.camEmoMap.length + '个戏剧时刻 → 观众信号 + 运镜组合</span></h4>' +
        '<div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl"><thead><tr><th>戏剧时刻</th><th>观众信号（照抄进提示词）</th><th>运镜组合</th><th>节拍提示</th></tr></thead><tbody>' +
        DB.camEmoMap.map((r) => '<tr><td><b>' + r.emo + '</b></td><td style="color:var(--tx2)">' + r.sig + '</td><td>' + r.cams + '</td><td style="color:var(--tx2)">' + r.tip + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="tool-filters"><span class="chip' + (camFav ? ' on' : '') + '" data-camfav="1">★ 只看收藏</span><span class="mini-note" style="margin:0">点卡片右上角 ☆ 收藏常用运镜，拍摄时一键调出</span></div>' +
        '<div class="cam-grid" id="camGrid"></div>' +
        '<p class="mini-note">※ 动画为CSS示意效果，用于直观理解每种运镜的画面关系；各家模型对运镜指令的响应差异见「大模型应用」与研究报告。</p>' +
        '<details id="camQuizDetails" style="margin-top:20px"><summary style="cursor:pointer;font-weight:800;font-size:15px;padding:12px 0">🎯 运镜速配挑战（练习）</summary><div id="quizBox" style="margin-top:8px"></div></details>';
    },

    prompts() {
      const formula = (f) => {
        const ex = (e) => {
          const a = regCopy(e.cn), b = regCopy(e.en);
          return '<div class="card pf-card" style="margin-top:10px"><div class="pf-t">' + e.t + '</div>' +
            '<div class="cam-p" style="margin-top:8px"><span class="cp-k">中</span><span class="cp-v">' + esc(e.cn) + '</span><button class="copy-btn" data-copy="' + a + '">复制</button></div>' +
            '<div class="cam-p"><span class="cp-k">EN</span><span class="cp-v">' + esc(e.en) + '</span><button class="copy-btn" data-copy="' + b + '">复制</button></div></div>';
        };
        return '<div class="card"><div class="pf-t">' + f.t + ' <span class="tag c">' + f.tag + '</span></div><div class="pf-f">' + f.f + '</div>' + f.ex.map(ex).join('') + '</div>';
      };
      const styleTbl = '<div class="tbl-wrap"><table class="tbl sw-tbl"><thead><tr><th>画风</th><th>中文关键词</th><th>英文关键词</th><th>题材匹配建议</th></tr></thead><tbody>' +
        DB.styleKeywords.map((s) => '<tr><td>' + s.n + '</td><td>' + s.cn + '</td><td style="font-style:italic;color:var(--tx2)">' + esc(s.en) + '</td><td style="font-size:12px;color:var(--tx2)">' + (s.fit ? esc(s.fit) : '—') + '</td></tr>').join('') + '</tbody></table></div>';
      const neg = DB.negativePrompt;
      const idNe = regCopy(neg.en), idNc = regCopy(neg.cn);
      const negCard = '<div class="card" style="margin-top:10px"><div class="pf-t">负面提示词（Negative Prompt）</div>' +
        '<div class="codebox"><div class="cb-bar"><span>EN</span><button class="copy-btn" data-copy="' + idNe + '">复制</button></div><pre>' + esc(neg.en) + '</pre></div>' +
        '<div class="codebox"><div class="cb-bar"><span>中文</span><button class="copy-btn" data-copy="' + idNc + '">复制</button></div><pre>' + esc(neg.cn) + '</pre></div>' +
        '<div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>崩坏问题</th><th>提示词对策</th><th>参数级对策</th></tr></thead><tbody>' +
        neg.fixes.map((f) => '<tr><td><b>' + f.p + '</b></td><td>' + f.s + '</td><td style="color:var(--tx2)">' + f.a + '</td></tr>').join('') + '</tbody></table></div></div>';
      return '<div class="insp-bar"><button class="btn pri" id="inspBtn" style="padding:8px 18px;font-size:13px">🎲 随机抽一条灵感</button><span class="chip" data-pbfav="1">★ 只看收藏 <b class="fav-cnt" id="pbFavCnt"></b></span><span class="mini-note" style="margin:0">从 ' + DB.promptBank.reduce((a, c) => a + c.items.length, 0) + ' 条模板中随机抽取，卡壳时来一发</span></div>' +
        '<div id="inspBox" hidden></div>' +
        '<div class="grid g2">' + DB.promptFormulas.map(formula).join('') + '</div>' +
        '<h4 class="block-t">模板库 <span class="sub">共' + DB.promptBank.reduce((a, c) => a + c.items.length, 0) + '条 · 中英对照 · 点★收藏 · 点击复制</span></h4><div id="pbBank"></div>' +
        '<h4 class="block-t">画风关键词对照表</h4>' + styleTbl +
        '<h4 class="block-t">负面提示词与避坑</h4>' + negCard;
    },

    canvas() {
      const C = DB.canvas;
      const ftBest = store.get(FT_KEY, 0);
      const val = C.value.map((v) => '<div class="card"><div style="font-size:22px">' + v.ico + '</div><b style="display:block;margin:5px 0 3px">' + v.t + '</b><p style="font-size:12.6px;color:var(--tx2)">' + v.d + '</p></div>').join('');
      const tbl = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>工具</th><th>画布核心能力</th><th>适配</th><th>备注</th></tr></thead><tbody>' +
        C.tools.map((t) => '<tr><td><b>' + t.n + '</b></td><td>' + t.cap + '</td><td>' + stars(t.fit) + '</td><td style="color:var(--tx2)">' + t.note + '</td></tr>').join('') + '</tbody></table></div>';
      const steps = '<div class="step-flow">' + C.steps.map((s) => '<div class="step-item"><b>' + s.t + '</b><p>' + s.d + '</p></div>').join('') + '</div>';
      const tips = C.tips.map((t) => '<div class="card" style="padding:12px 15px;font-size:13px;color:var(--tx2)"><b style="color:var(--gold)">⚡ </b>' + t + '</div>').join('');
      const guides = C.deepGuides.map((g) => '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b>' + g.n + '</b><span class="tag c">' + g.lvl + '</span></div><p style="font-size:12.7px;color:var(--tx2);margin-top:7px">' + g.d + '</p></div>').join('');
      const selRows = C.select.map((s) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 64px;text-align:left;color:var(--gold);font-weight:700">' + s.w + '</span><span style="flex:1;font-size:13px"><b>' + s.pick + '</b></span><span style="flex:1.6;font-size:12px;color:var(--tx3)">' + s.why + '</span></div>').join('');
      return '<div class="grid g4">' + val + '</div>' +
        '<h4 class="block-t">工具对比</h4>' + tbl +
        '<div class="callout"><b>即梦智能画布操作路径：</b>' + C.jimengOps + '</div>' +
        '<h4 class="block-t">剪映Hub / 可灵灵动画布 · 等效操作对照 <span class="sub">与三档选型对应 · 2026-10 实测口径</span></h4>' + (C.opsAlt || []).map((o) => '<div class="callout blue"><b>' + o.n + '：</b>' + o.path + '<br><b style="color:var(--gold)">⚡ 关键差异：</b>' + o.key + '</div>').join('') +
        '<h4 class="block-t">六款画布手把手实操要点 <span class="sub">2026-10 深度实测口径</span></h4><div class="grid g3">' + guides + '</div>' +
        '<h4 class="block-t">七步实操工作流 <span class="sub">角色三视图锚定 → 分镜连绘 → 导出</span></h4>' + steps +
        '<h4 class="block-t">进阶技巧</h4><div class="grid g2">' + tips + '</div>' +
        '<h4 class="block-t">👥 多角色一致性专节 <span class="sub">同框 / 对话 / 换装 · 技法源自 research/19</span></h4><div class="grid g2">' + (C.multiChar || []).map((m) => '<div class="card"><b style="display:block;margin-bottom:5px">' + m.t + '</b><p style="font-size:12.7px;color:var(--tx2);margin:0">' + m.d + '</p></div>').join('') + '</div>' +
        '<h4 class="block-t">🎞️ 首尾帧转场挑战 <span class="sub">题库' + DB.frameBank.length + '题 · 每轮随机8题 · 考察视觉DNA / 帧差定义运动 / 2-5秒原则</span></h4>' +
        '<div id="ftBox"><div class="card" style="text-align:center;padding:30px 20px">' +
        '<b style="font-size:16px;display:block;margin-bottom:6px">给首帧和运镜，选出正确的尾帧</b>' +
        '<p style="font-size:12.8px;color:var(--tx2);max-width:520px;margin:0 auto">尾帧链是无限画布连绘的核心（见上方第七步）：上一镜尾帧=下一镜首帧。规则口诀——两帧共享视觉DNA、帧差定义运动类型、单镜2-5秒。</p>' +
        (ftBest ? '<p class="mini-note" style="margin-top:10px">🏆 历史最佳：' + ftBest + '/8</p>' : '') +
        '<button class="btn pri" data-ft-start style="margin-top:14px">开始挑战 →</button></div></div>' +
        '<h4 class="block-t">怎么选 <span class="sub">按人群给出2026-10选型</span></h4><div class="chart-box">' + selRows + '</div>';
    },

    llm() {
      const L = DB.llm;
      const map = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>环节</th><th>LLM任务</th><th>要点</th></tr></thead><tbody>' +
        L.mapping.map((m) => '<tr><td><b>' + m.s + '</b></td><td>' + m.t + '</td><td style="color:var(--tx2)">' + m.n + '</td></tr>').join('') + '</tbody></table></div>';
      const models = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>模型</th><th>漫剧任务适配</th><th>长文本</th><th>价格</th></tr></thead><tbody>' +
        L.models.map((m) => '<tr><td><b>' + m.n + '</b></td><td>' + m.f + '</td><td>' + m.c + '</td><td style="color:var(--tx2)">' + m.p + '</td></tr>').join('') + '</tbody></table></div>';
      const pick = L.pick.map((p) => '<li style="margin-left:18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('');
      const code1 = '<div class="codebox"><div class="cb-bar"><span>分镜表 JSON 输出格式（novelvids / Claude Code 流水线实践）</span><button class="copy-btn" data-copy="' + regCopy(L.jsonExample) + '">复制</button></div><pre>' + esc(L.jsonExample) + '</pre></div>';
      const code2 = '<div class="codebox"><div class="cb-bar"><span>LLM 生成分镜脚本 · 完整Prompt模板（可复制）</span><button class="copy-btn" data-copy="' + regCopy(L.promptTemplate) + '">复制</button></div><pre>' + esc(L.promptTemplate) + '</pre></div>';
      const code3 = '<div class="codebox"><div class="cb-bar"><span>完整一集分镜JSON示例（10镜 · 92秒 · 战神归来题材 · 可直接复制）</span><button class="copy-btn" data-copy="' + regCopy(L.fullEpisode) + '">复制</button></div><pre>' + esc(L.fullEpisode) + '</pre></div>' +
        '<div class="callout"><b>示例结构解读：</b>' + L.fullEpisodeNote + '</div>';
      const code4 = L.serialMemory ? '<div class="codebox"><div class="cb-bar"><span>连载化 · 跨集设定与记忆管理JSON（每集开工先喂LLM：前情提要+伏笔对账，再生成分镜）</span><button class="copy-btn" data-copy="' + regCopy(L.serialMemory) + '">复制</button></div><pre>' + esc(L.serialMemory) + '</pre></div>' +
        '<div class="callout blue"><b>与分镜板工作台双向兼容：</b>' + L.compatNote + '</div>' : '';
      const routes = L.automation.map((r) => '<div class="card route-card"><span class="tag c">' + r.tag + '</span><br><b style="display:block;margin-top:6px">' + r.t + '</b><p>' + r.d + '</p></div>').join('');
      return '<h4 class="block-t" style="margin-top:0">各环节用途映射</h4>' + map +
        '<h4 class="block-t">模型选型</h4>' + models + '<ul style="margin-top:8px">' + pick + '</ul>' +
        '<h4 class="block-t">四个可直接复制的模板</h4>' + code1 + code2 + code3 + code4 +
        '<h4 class="block-t">自动化流水线 · ' + L.automation.length + '条路线</h4><div class="grid g2">' + routes + '</div>' +
        '<div class="callout blue"><b>选型口诀：</b>' + L.automationPick + '</div>';
    },

    hot() {
      const GR = DB.hot.ruleGroups || [];
      const giOf = (i) => GR.findIndex((g) => g.ids.includes(i + 1));
      const gchips = '<div class="tool-filters" id="hotGrpChips" style="margin-bottom:12px"><span class="chip on" data-hgi="all">全部' + DB.hot.rules.length + '条</span>' +
        GR.map((g, gi) => '<span class="chip" data-hgi="' + gi + '">' + g.ico + ' ' + g.n + ' · ' + g.ids.length + '</span>').join('') + '</div>';
      const rules = gchips + '<div class="grid g4" style="grid-template-columns:repeat(2,1fr)" id="hotRules">' +
        DB.hot.rules.map((r, i) => '<div class="card rule-card" data-hgi="' + giOf(i) + '"><span class="r-num">' + String(i + 1).padStart(2, '0') + '</span><b>' + r.t + '</b><p>' + r.d + '</p></div>').join('') + '</div>';
      const rates = '<div class="chart-box"><h5>关键量化指标速查</h5>' + DB.hot.rates.map((r) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:1;text-align:left;color:var(--tx2)">' + r.k + '</span><span class="b-val" style="text-align:right;color:var(--gold);font-weight:700">' + r.v + '</span></div>').join('') + '</div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>爆款总公式（2026-08）：</b>' + DB.hot.formula + '</div>' +
        rules +
        '<div class="callout" style="margin-top:16px"><b>头部系列化规律（2026-09）：</b>' + DB.hot.series + '</div>' +
        '<div class="chart-box" style="margin:16px 0"><h5>🎬 结构沙盘 · 点击色块看任务</h5>' +
        '<div class="tool-filters" style="margin-bottom:8px"><span class="chip on" data-epmode="0">⏱ 单集98秒</span>' +
        (DB.hot.episodeMap.serial ? '<span class="chip" data-epmode="1">📺 ' + DB.hot.episodeMap.serial.label + '</span>' : '') + '</div>' +
        '<div class="ep-bar" id="epBar"></div>' +
        '<div class="ep-detail" id="epDetail"></div>' +
        '<p class="mini-note" id="epNote"></p></div>' +
        '<div class="callout" style="margin:16px 0"><b>封面公式（拆解100个爆款）：</b>' + DB.hot.coverFormula + '</div>' +
        '<div class="chart-box" style="margin-bottom:16px"><h5>✍️ 标题打分器（规则版 · 输入标题即时诊断）</h5>' +
        '<div class="ts-row"><input id="titleInput" placeholder="粘贴你的标题，如：战神赘婿被扫地出门，次日全军来迎" maxlength="40"><button class="btn pri" data-tscore style="flex-shrink:0">打分</button></div>' +
        (DB.hot.titleScorer.playbook ? '<div class="ts-chips" style="margin:10px 0 0">' + DB.hot.titleScorer.playbook.map((p) =>
          '<span class="tag" style="cursor:pointer" data-tpl="' + esc(p.ex) + '" title="' + esc(p.how) + '">📋 ' + p.n + '：' + esc(p.ex) + '</span>').join('') + '</div>' : '') +
        '<div id="titleResult"><p class="mini-note">六维规则打分：身份反差 / 悬念留白 / 情绪词 / 冲突动作 / 数字锚点 / 长度12-18字——命中越多分越高，满分100；点上方模板一键填入试打；打完分用下方AB测试流程定胜负。</p></div></div>' +
        '<div class="grid g2" style="margin-top:16px"><div class="chart-box"><h5>变现方式占比（2026-01，古东管家）</h5>' + donut([{ n: 'IAA 免费+广告', v: 71, c: '#8b5cf6' }, { n: 'IAP 单集付费', v: 26, c: '#22d3ee' }, { n: 'IAAP 混合', v: 3, c: '#f5b942' }]) + '</div>' + rates + '</div>' +
        '<div class="callout red"><b>一句总结：</b>爆款率0.18%的行业里，结构化方法（3秒钩子+黄金分割反转+结尾卡点）不是加分项，是入场券。</div>';
    },

    genres() {
      return '<div class="tool-filters" id="gdChips"></div><div class="grid g3" id="gdGrid"></div>';
    },

    learning() {
      const qzMax = Math.min(8, DB.quizBank.length), rtMax = Math.min(5, DB.rhythmBank.length), ftMax = Math.min(8, DB.frameBank.length);
      const gatePct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
      const gateCount = (key, groups, pre) => { const st = store.get(key, {}) || {}; let done = 0, total = 0; (groups || []).forEach((g, gi) => (g.items || []).forEach((_, ii) => { total++; if (st[pre + gi + '-' + ii]) done++; })); return gatePct(done, total); };
      /* 完成判定关卡：与「学习仪表盘」读同一批本机进度源——阈值：7天自查≥80%（仪表盘「接近完成」线）、三练习≥75%（仪表盘及格线）、接单计划≥50%（经验线，档案无出处） */
      const LN_GATES = [
        { lab: '第一部成片 · 7天自查', cur: gateCount('manju_ff_progress_v1', DB.firstfilm.checklist, ''), need: 80, go: 'firstfilm', goLab: '去推进 →' },
        { lab: '产线三练习均值', cur: Math.round((gatePct(Math.min(store.get('manju_quiz_best', 0), qzMax), qzMax) + gatePct(Math.min(store.get('manju_rt_best', 0), rtMax), rtMax) + gatePct(Math.min(store.get('manju_ft_best', 0), ftMax), ftMax)) / 3), need: 75, go: 'studyhub', goLab: '去仪表盘 →' },
        { lab: '接单14天行动计划', cur: gateCount('manju_od_progress_v1', DB.orders.plan.checklist, ''), need: 50, go: 'orders', goLab: '去推进 →' },
      ];
      const track = (tr, i) => {
        const links = (tr.links || []).map((x) => '<button class="btn ghost" data-go="' + x.go + '" title="' + esc(x.use) + '" style="padding:4px 12px;font-size:12.5px">' + esc(x.n) + ' →</button>').join('');
        const linkRow = links ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px dashed var(--line)">' + links + '</div>' : '';
        const g = i < LN_GATES.length ? LN_GATES[i] : null;
        const ok = g && g.cur >= g.need;
        const gate = g ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;padding:8px 12px;border:1px dashed var(--line);border-radius:var(--r-s);background:var(--panel2)">' +
          '<span class="tag' + (ok ? ' g' : ' c') + '">' + (ok ? '✓ 达成' : '完成判定') + '</span>' +
          '<span style="font-size:12.3px;color:var(--tx2)">' + g.lab + ' ' + g.cur + '%（判定线 ' + g.need + '%）</span>' +
          '<button class="btn ghost" data-go="' + g.go + '" style="margin-left:auto;padding:3px 10px;font-size:12px">' + g.goLab + '</button></div>' : '';
        return '<div class="card learn-card"><div class="ln-head"><span style="font-size:22px">' + tr.ico + '</span><div><b>' + tr.t + '</b><p class="ln-goal">' + tr.goal + '</p></div></div>' +
          tr.items.map((it) => '<div class="ln-item"><b>' + it.d + '</b><p>' + it.d2 + '</p></div>').join('') +
          linkRow + gate + '</div>';
      };
      return '<div class="grid g3">' + DB.learning.map(track).join('') + '</div>' +
        '<div class="callout"><b>路径逻辑：</b>第一周用「开发流程」9阶段跑通闭环（完成＞完美）；第一个月把偶然的成功变成模板与资产（提示词库/无限画布/运镜适配表）；第三个月才算经济账——备案合规、矩阵分发、投流ROI、出海溢价，最后用系列化沉淀长期价值。</div>' +
        '<div class="callout blue" style="margin-top:12px"><b>关卡与分岔：</b>每阶段卡底部的「完成判定」与「学习仪表盘」读同一批本机进度源，达标即亮绿灯——先解锁再进下一阶段；第31-90天按分账/商单/出海三条分岔小步并行试点，用真实数据决定主攻方向，口径详见「收益决策树」。</div>';
    },

    firstfilm() {
      const F = DB.firstfilm;
      /* 页首：诚实预期 */
      const truth = F.truth.map((t) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + t + '</li>').join('');
      /* 成本速算 */
      const d = F.cost.defaults;
      const num = (k, step, suffix, label) => '<label class="calc-num"><span>' + label + '</span><span class="cn-in"><input type="number" id="ff-' + k + '" value="' + d[k] + '" step="' + step + '" min="0">' + (suffix ? '<i>' + suffix + '</i>' : '') + '</span></label>';
      const costBox = '<div class="chart-box"><h5>⚡ 第一部片成本速算 <span class="sub">单集生成成本 · 与「互动计算器」同口径</span></h5>' +
        '<div class="calc-grid">' +
        num('shots', 1, '镜', '单集镜头数（第一部片建议10-15镜）') +
        num('imgUnit', 0.1, '元/张', '单张成品图成本') +
        num('rate', 5, '%', '抽卡可用率（图像健康线≥30%）') +
        num('vidUnit', 0.5, '元/条', '单条视频成本') +
        num('retries', 0.5, '倍', '视频重抽系数（常态2起）') +
        '</div><div class="calc-out" id="ffCostOut"></div>' +
        '<p class="mini-note">' + F.cost.notes.join('<br>') + '</p>' +
        '<div style="margin-top:10px"><button class="btn pri" data-go="calc">用「互动计算器」算全片三本账与回本播放量 →</button></div></div>';
      /* 7天进度自查清单 */
      const groups = F.checklist.map((g, gi) => {
        const items = g.items.map((it, ii) =>
          '<div class="ff-ck" data-ffck="' + gi + '-' + ii + '"><span class="box"></span><span>' + it + '</span></div>').join('');
        return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><b style="font-size:13px">' + g.d + ' ' + g.t + '</b><span class="tag" id="ffg-' + gi + '">0/' + g.items.length + '</span></div>' + items + '</div>';
      }).join('');
      const total = F.checklist.reduce((a, g) => a + g.items.length, 0);
      const ckBox = '<div class="chart-box"><h5>✅ 7天进度自查 <span class="sub">勾选自动保存在本机浏览器</span></h5>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:15px" id="ffPct">0%</b><span class="mini-note" style="margin:0" id="ffNum"></span>' +
        '<button class="copy-btn" id="ffReset" style="margin-left:auto">↻ 重置进度</button></div>' +
        '<div class="ff-bar"><div class="ff-fill" id="ffFill"></div></div>' +
        '<div class="grid g2" style="margin-top:12px;gap:10px 18px">' + groups + '</div>' +
        '<p class="mini-note" style="margin-top:8px">共' + total + '项 · 与「制作清单」的37项完整版独立保存——第一条片跑通后，正式项目请用完整版。</p></div>';
      /* D1-D7 每日章节 */
      const dayHtml = F.days.map((dy) => {
        const steps = dy.steps.map((s) => '<li>' + s + '</li>').join('');
        const tools = dy.tools.map((t) =>
          '<div class="bar-row" style="padding:5px 0"><span style="flex:0 0 150px;text-align:left"><button class="btn ghost" data-go="' + t.go + '" style="padding:4px 12px;font-size:12.5px">' + esc(t.n) + ' →</button></span><span style="flex:1;font-size:12.6px;color:var(--tx2)">' + t.use + '</span></div>').join('');
        return '<h4 class="block-t">' + dy.ico + ' ' + dy.d + ' · ' + dy.t + ' <span class="sub">⏱ ' + dy.time + '</span></h4>' +
          '<div class="card" style="padding:16px 18px">' +
          '<p style="font-size:13.2px;color:var(--tx);margin:0 0 12px"><b>今天的目标：</b>' + dy.goal + '</p>' +
          '<div class="grid g2" style="gap:12px;align-items:start">' +
          '<div class="pd-box"><h5>今天做什么（' + dy.steps.length + '步）</h5><ul>' + steps + '</ul></div>' +
          '<div><div class="pd-box" style="margin-bottom:12px"><h5>用什么工具（点击直达）</h5>' + tools + '</div>' +
          '<div class="pd-box"><h5>产出物</h5><ul><li>' + dy.output + '</li></ul></div></div>' +
          '</div>' +
          '<div class="pd-box warn" style="margin-top:12px"><h5>常见坑</h5><ul>' + dy.pits.map((p) => '<li>' + p + '</li>').join('') + '</ul></div>' +
          '</div>';
      }).join('');
      /* 收入衔接 */
      const inc = F.income;
      const tierRows = inc.tiers.map((t) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 110px;text-align:left">' + t.n + '</span><span style="flex:0 0 120px;color:var(--gold);font-weight:700;font-size:12.8px">' + t.v + '</span><span style="flex:1;font-size:12.4px;color:var(--tx2)">' + t.d + '</span></div>').join('');
      const pathRows = inc.paths.map((p) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 96px;text-align:left;color:var(--gold);font-weight:700">' + p.n + '</span><span style="flex:1;font-size:12.6px;color:var(--tx2)">' + p.d + '</span></div>').join('');
      const incomeBox = '<h4 class="block-t">💰 出片之后：第一笔收入怎么衔接 <span class="sub">90天见钱的诚实路径</span></h4>' +
        '<div class="card" style="padding:16px 18px">' +
        '<p style="font-size:13px;color:var(--tx2);margin:0 0 10px">' + inc.note + '</p>' +
        '<div class="chart-box"><h5>收益三分层（引用「变现运营」收益对照矩阵）</h5>' + tierRows + '</div>' +
        '<div class="chart-box" style="margin-top:10px"><h5>按你的背景选路径</h5>' + pathRows + '</div>' +
        '<div class="callout" style="margin-top:12px"><b>行情参考：</b>' + inc.market + '</div></div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>本页双承诺：7天出片 + 90天见钱。</b>' +
        '7天跑通"创意→可发布成片"全链路（外部回测支持：CSDN七步教程/B站24集保姆级教程，2026-09检索）；首笔收入现实预期在第60-90天（知乎·天狐 2026-08-24口径，与「学习路径」第31-90天商业化一致）。' +
        '<ul style="margin:8px 0 0;list-style:disc">' + truth + '</ul></div>' +
        '<div class="grid g2" style="align-items:start">' + costBox + ckBox + '</div>' +
        '<h4 class="block-t" style="margin-top:8px">7天每日实操 <span class="sub">每节固定结构：今天做什么 / 用什么工具 / 产出物 / 常见坑</span></h4>' +
        dayHtml + incomeBox +
        '<div class="callout blue"><b>跑通之后去哪：</b>第二部片起别再从零开始——把本页D3-D5沉淀的描述卡/锚点图/提示词模板搬进「无限画布」工作流，按「学习路径」第8-30天模板化+资产化，爆款率0.16%的行业里，复用资产才是把偶然变必然的方法。</div>';
    },

    monetize() {
      const M = DB.monetize;
      const pf = (p) => '<div class="card plat-card"><div class="pl-head"><span class="pl-name">' + p.n + '</span><span class="pl-tag">分账政策</span></div>' +
        '<div class="pl-row"><span class="pl-k">政策</span><p>' + p.pol + '</p></div>' +
        '<div class="pl-row"><span class="pl-k gold">收益</span><p>' + p.inc + '</p></div>' +
        '<div class="pl-row"><span class="pl-k cyan">门槛</span><p>' + p.bar + '</p></div></div>';
      const platCards = '<div class="grid g2">' + M.platforms.map(pf).join('') + '</div>';
      const ov = M.overseas.map((o) => '<div class="card"><b>' + o.t + '</b><p style="font-size:12.8px;color:var(--tx2);margin-top:5px">' + o.d + '</p></div>').join('');
      const biz = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>模式</th><th>机制</th><th>收益量级</th></tr></thead><tbody>' +
        M.bizModels.map((b) => '<tr><td><b>' + b.m + '</b></td><td>' + b.h + '</td><td style="color:var(--tx2)">' + b.l + '</td></tr>').join('') + '</tbody></table></div>';
      const warn = M.warning.map((w) => '<li style="margin-left:18px;padding:3px 0;color:var(--tx2);font-size:13px">' + w + '</li>').join('');
      const comp = M.compliance.map((c) => '<div class="card"><span class="tag h">合规</span><br><b style="display:block;margin-top:6px">' + c.t + '</b><p style="font-size:12.8px;color:var(--tx2);margin-top:5px">' + c.d + '</p></div>').join('');
      return '<h4 class="block-t" style="margin-top:0">各平台政策（2025-2026，政策变动极快，以官方后台为准）</h4>' + platCards +
        '<div class="callout red"><b>收益警示：</b><ul style="margin:6px 0 0;list-style:none;padding:0">' + warn + '</ul></div>' +
        '<h4 class="block-t">收益预期对照（三分层 × 背景三档 · 预期管理工具而非案例墙）</h4>' +
        '<p class="mini-note">' + M.incomeMatrix.note + '</p>' +
        '<div class="grid g3">' + M.incomeMatrix.tiers.map((t) => '<div class="card"><b>' + t.n + '</b><p style="font-size:12.8px;color:var(--tx);margin:4px 0 2px">' + t.v + '</p><p style="font-size:12.4px;color:var(--tx2);margin:0">' + t.d + '</p></div>').join('') + '</div>' +
        '<div class="grid g3" style="margin-top:10px">' + M.incomeMatrix.bg.map((b) => '<div class="card"><b>' + b.n + '</b><p style="font-size:12.4px;color:var(--tx2);margin:4px 0 2px"><b style="color:var(--tx)">可投入：</b>' + b.hours + '</p><p style="font-size:12.4px;color:var(--tx2);margin:0 0 2px"><b style="color:var(--tx)">现实预期：</b>' + b.exp + '</p><p style="font-size:12.4px;color:var(--tx2);margin:0"><b style="color:var(--tx)">路径：</b>' + b.path + '</p></div>').join('') + '</div>' +
        '<div class="chart-box" style="margin:16px 0"><h5>制作成本阶梯（元/分钟 · 2025-11口径）</h5>' + costLadder() + '</div>' +
        '<h4 class="block-t">出海机会</h4><div class="grid g4">' + ov + '</div>' +
        '<h4 class="block-t">出海平台入驻速查 <span class="sub">模式 / 门槛 / 收益（2026-10）</span></h4>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>平台</th><th>模式</th><th>入驻口径</th><th>收益参考</th></tr></thead><tbody>' +
        M.overseasTable.map((p) => '<tr><td><b>' + p.n + '</b></td><td>' + p.mode + '</td><td style="color:var(--tx2)">' + p.entry + '</td><td style="color:var(--tx2)">' + p.income + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<h4 class="block-t">商业模式全景</h4>' + biz +
        '<h4 class="block-t">四条合规红线</h4><div class="grid g2">' + comp + '</div>';
    },

    earnpath() {
      const E = DB.earnpath, B = E.bench, T = E.tree;
      /* §1 基准锚点 */
      const anchors = '<div class="chart-box" style="margin-bottom:16px"><h5>先立基准：四组数锚定所有收益预期 <span class="sub">口径截至 ' + DB.meta.updated + '</span></h5>' +
        B.anchors.map((a) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 132px;text-align:left;color:var(--gold);font-weight:700">' + a.k + '</span>' +
          '<span style="flex:1;font-size:12.8px"><b>' + a.v + '</b><br><span style="color:var(--tx3);font-size:11.5px">' + a.src + '</span></span></div>').join('') + '</div>';
      /* §1 收益预期对照表（投入程度 × 路径） */
      const matrix = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:96px">投入程度</th>' +
        B.cols.map((c) => '<th style="min-width:200px">' + c + '</th>').join('') + '</tr></thead><tbody>' +
        B.rows.map((r) => '<tr><td><b>' + r.bg + '</b><br><span style="font-size:11px;color:var(--tx3)">' + r.assume + '</span></td>' +
          r.cells.map((c) => '<td><b style="color:var(--gold);font-size:12.8px">' + c.v + '</b>' +
            '<p style="font-size:12.2px;color:var(--tx);margin:4px 0 3px">' + c.d + '</p>' +
            '<p style="font-size:11px;color:var(--tx3);margin:0">' + c.src + '</p></td>').join('') + '</tr>').join('') +
        '</tbody></table></div>';
      /* §3 三本账计算器入口 */
      const calcCard = '<div class="card" style="padding:16px 18px"><ul style="margin:0;list-style:disc">' +
        E.calcBridge.points.map((p) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('') +
        '</ul><div style="margin-top:12px"><button class="btn pri" data-go="calc">打开「互动计算器」算三本账与回本播放量 →</button></div></div>';
      /* §4 避坑清单 */
      const pits = E.pitfalls.map((p, i) => '<div class="card"><span class="tag h">坑 ' + String(i + 1).padStart(2, '0') + '</span>' +
        '<b style="display:block;margin-top:6px">' + p.t + '</b><p style="font-size:12.6px;color:var(--tx2);margin-top:5px">' + p.d + '</p>' +
        '<p style="font-size:11px;color:var(--tx3);margin:4px 0 0">' + p.src + '</p></div>').join('');
      /* §5 真实案例对照 */
      const caseRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>案例（见「案例拆解」）</th><th>路径标签</th><th>发生了什么</th><th>对你的决策启示</th></tr></thead><tbody>' +
        E.caseMap.map((c) => '<tr><td><b>' + c.n + '</b></td><td><span class="tag ' + (c.tag.indexOf('反面') === 0 ? 'h' : 'c') + '">' + c.tag + '</span></td>' +
          '<td style="color:var(--tx2)">' + c.d + '</td><td>' + c.lesson + '</td></tr>').join('') + '</tbody></table></div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>这页回答一个问题：我这种背景能赚多少、该走哪条变现路。</b>' + E.note + '</div>' +
        '<h4 class="block-t" style="margin-top:0">① 收益预期对照表 <span class="sub">投入程度 × 变现路径 · 全部数字引用站内已有口径</span></h4>' + anchors + matrix +
        '<div class="callout" style="margin-top:12px"><b>使用规则：</b>' + B.rule + '</div>' +
        '<h4 class="block-t">② 变现路径决策树 <span class="sub">' + T.questions.length + '问 · 选项驱动结论 · 纯本地计算不上传</span></h4>' +
        '<div id="dtBox"></div>' +
        '<div class="callout" style="margin-top:12px"><b>通用规则：</b>' + T.rule + '</div>' +
        '<h4 class="block-t">③ 三本账计算器入口 <span class="sub">与「互动计算器」联动</span></h4>' + calcCard +
        '<h4 class="block-t">④ 避坑清单 <span class="sub">引用「变现运营」收益警示与 research/23 防骗清单</span></h4><div class="grid g2">' + pits + '</div>' +
        '<h4 class="block-t">⑤ 真实案例对照 <span class="sub">四条路径各有一个可对表的样本</span></h4>' + caseRows +
        '<div style="margin-top:12px"><button class="btn ghost" data-go="cases">去「案例拆解」看全部' + DB.cases.length + '个案例 →</button></div>';
    },

    orders() {
      const O = DB.orders, P = O.pricing;
      /* §2 报价：三市场分层表 + 四因子 + 计算器 + 报价单模板 */
      const tierChips = P.tiers.map((t, i) => '<span class="chip' + (i === odTier ? ' on' : '') + '" data-odtier="' + i + '" title="' + esc(t.src) + '">' + t.n + '</span>').join('');
      const tierRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:130px">市场档位</th><th style="min-width:130px">报价口径</th><th>说明与口径来源</th><th style="min-width:200px">使用提示</th></tr></thead><tbody>' +
        P.tiers.map((t) => {
          const u = (t.cur === '$' ? '美元/' : '元/') + t.unit;
          const rng = t.lo === t.hi ? t.lo + u + '起' : t.lo + '-' + t.hi + ' ' + u;
          return '<tr><td><b>' + t.n + '</b></td><td style="color:var(--gold);font-weight:700;white-space:nowrap">' + rng + '</td>' +
            '<td style="color:var(--tx2)">' + t.d + '<br><span style="font-size:11px;color:var(--tx3)">' + t.src + '</span></td>' +
            '<td style="color:var(--tx2);font-size:11.5px">' + t.verd + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      const factorCards = P.factors.map((f) => '<div class="card"><span class="tag c">' + f.t + '</span><p style="font-size:12.6px;color:var(--tx2);margin:8px 0 0">' + f.d + '</p></div>').join('');
      const quoteBox = '<div class="chart-box"><h5>💰 报价参考计算器 <span class="sub">市场档位 × 时长 · 定金即算 · 纯本地计算</span></h5>' +
        '<div class="tool-filters" style="margin-bottom:10px">' + tierChips + '</div>' +
        '<div class="calc-grid">' +
        '<label class="calc-num"><span>时长</span><span class="cn-in"><input type="number" id="od-mins" value="2" step="0.5" min="0"><i>分钟</i></span></label>' +
        '<label class="calc-num"><span>系列单资产复用折扣</span><span class="cn-in"><input type="number" id="od-reuse" value="0" step="5" min="0" max="40"><i>%</i></span></label>' +
        '</div><div class="calc-out" id="odQuoteOut"></div>' +
        '<p class="mini-note">' + P.notes.join('<br>') + '</p>' +
        '<div class="codebox" style="margin-top:10px"><div class="cb-bar"><span>报价单模板（计算结果自动带入 · 复制后填空即用）</span><button class="copy-btn" id="odQuoteCopy">复制</button></div><pre id="odQuotePre"></pre></div></div>';
      const scriptCards = O.scripts.map((s) => '<div class="card pf-card"><div class="pf-t">' + s.t + '</div>' +
        '<p style="font-size:12.4px;color:var(--tx2);margin:6px 0 8px">' + s.d + '</p>' +
        '<div class="codebox"><div class="cb-bar"><span>话术 · 复制后填空即用</span><button class="copy-btn" data-copy="' + regCopy(s.txt) + '">复制</button></div><pre>' + esc(s.txt) + '</pre></div></div>').join('');
      /* §3 作品集 */
      const folioRules = '<div class="callout"><ul style="margin:0;list-style:disc">' + O.folio.rules.map((r) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + r + '</li>').join('') + '</ul></div>';
      const sampleCards = O.folio.samples.map((s) => '<div class="card" data-hl="' + esc(s.n) + '"><b>' + s.n + '</b>' +
        '<div class="gd-bench" style="margin:6px 0 4px">🎯 对标：' + s.ref + '</div>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0 0 8px">' + s.d + '</p>' +
        '<span class="tag c">为什么是它：' + s.why + '</span></div>').join('');
      const proofList = '<div class="chart-box" style="margin-top:12px"><h5>数据与产能证据（甲方看什么）</h5><ul style="margin:0;list-style:disc">' +
        O.folio.proof.map((p) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('') + '</ul></div>';
      /* §4 交付标准 */
      const deliveryTbl = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:130px">分组</th><th style="min-width:110px">标准项</th><th>要求</th><th style="min-width:190px">口径出处</th></tr></thead><tbody>' +
        O.delivery.map((g) => g.items.map((it, ii) =>
          '<tr><td>' + (ii === 0 ? '<b>' + g.g + '</b>' : '') + '</td><td><b>' + it.t + '</b></td>' +
          '<td style="color:var(--tx2)">' + it.d + '</td><td style="color:var(--tx3);font-size:11.5px">' + it.src + '</td></tr>').join('')).join('') +
        '</tbody></table></div>';
      /* §5 合同与定金 */
      const flowHtml = '<div class="step-flow">' + O.contract.flow.map((f) => '<div class="step-item"><b>' + f.t + '</b><p>' + f.d + '</p></div>').join('') + '</div>';
      const clauseRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:110px">关键条款</th><th>要点</th><th style="min-width:200px">依据</th></tr></thead><tbody>' +
        O.contract.clauses.map((c) => '<tr><td><b>' + c.t + '</b></td><td style="color:var(--tx2)">' + c.d + '</td><td style="color:var(--tx3);font-size:11.5px">' + c.src + '</td></tr>').join('') +
        '</tbody></table></div>';
      const tplCode = '<div class="codebox"><div class="cb-bar"><span>合同核心条款模板（可复制后按项目调整 · 签约前咨询专业意见）</span><button class="copy-btn" data-copy="' + regCopy(O.contract.tpl) + '">复制</button></div><pre>' + esc(O.contract.tpl) + '</pre></div>';
      /* §6 防骗 */
      const scamCards = O.scams.map((s) => '<div class="card" data-hl="' + esc(s.t) + '"><span class="tag h">骗术 · ' + s.t + '</span>' +
        '<p style="font-size:12.6px;margin:8px 0 4px"><b>识别信号：</b>' + s.sign + '</p>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0 0 6px"><b style="color:var(--ok)">应对：</b>' + s.how + '</p>' +
        '<p style="font-size:11px;color:var(--tx3);margin:0">' + s.src + '</p></div>').join('');
      /* §7 14天计划（进度自查复用 ff-ck 样式族，独立存储键） */
      const ckGroups = O.plan.checklist.map((g, gi) => {
        const items = g.items.map((it, ii) => '<div class="ff-ck od-ck" data-odck="' + gi + '-' + ii + '"><span class="box"></span><span>' + it + '</span></div>').join('');
        return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><b style="font-size:13px">' + g.d + ' · ' + g.t + '</b><span class="tag" id="odg-' + gi + '">0/' + g.items.length + '</span></div>' + items + '</div>';
      }).join('');
      const ckTotal = O.plan.checklist.reduce((a, g) => a + g.items.length, 0);
      const planBox = '<div class="chart-box"><h5>✅ 14天进度自查 <span class="sub">勾选自动保存在本机浏览器</span></h5>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:15px" id="odPct">0%</b><span class="mini-note" style="margin:0" id="odNum"></span>' +
        '<button class="copy-btn" id="odReset" style="margin-left:auto">↻ 重置进度</button></div>' +
        '<div class="ff-bar"><div class="ff-fill" id="odFill"></div></div>' +
        '<div class="grid g2" style="margin-top:12px;gap:10px 18px">' + ckGroups + '</div>' +
        '<p class="mini-note" style="margin-top:8px">共' + ckTotal + '项 · 与「制作清单」「第一部成片」7天清单相互独立保存。</p></div>';
      const phaseCards = O.plan.phases.map((p) => '<div class="card"><span class="tag c">' + p.d + '</span>' +
        '<b style="display:block;margin:6px 0 4px">' + p.t + '</b>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0">' + p.d2 + '</p></div>').join('');
      return '<div class="callout gold" style="margin-bottom:16px"><b>从"会做片子"到"能收钱"。</b>' + O.note + '</div>' +
        '<h4 class="block-t" style="margin-top:0">① 接单渠道盘点 <span class="sub">垂直平台7个口径：网易·数艺社2026-09-09（research/23§4.1 原文核验）</span></h4>' +
        '<div class="tool-filters" id="odChips"></div><div class="grid g2" id="odGrid"></div>' +
        '<div class="callout" style="margin-top:12px"><b>渠道总原则：</b>' + O.channels.extra + '</div>' +
        '<h4 class="block-t">② 报价方法论 <span class="sub">三市场分层 + 四因子 + 计算器（参照「变现运营」成本阶梯800-1200元/分钟）</span></h4>' + tierRows +
        '<div class="grid g4" style="margin-top:12px">' + factorCards + '</div>' + quoteBox +
        '<h4 class="block-t">接单话术 <span class="sub">4段可复制 · 填空即用</span></h4><div class="grid g2">' + scriptCards + '</div>' +
        '<h4 class="block-t">③ 作品集怎么搭 <span class="sub">3部不同题材样片 + 数据截图（用「案例拆解」案例库的对标思路）</span></h4>' + folioRules +
        '<div class="grid g3" style="margin-top:12px">' + sampleCards + '</div>' + proofList +
        '<h4 class="block-t">④ 交付标准清单 <span class="sub">分辨率/时长/字幕/音轨/AI标识合规——AI标识整段引用「变现运营」compliance</span></h4>' + deliveryTbl +
        '<h4 class="block-t">⑤ 合同与定金 <span class="sub">标准收款流程：research/23§4.3 · 定金30-50%</span></h4>' + flowHtml + clauseRows + tplCode +
        '<h4 class="block-t">⑥ 防骗指南 <span class="sub">六类骗术 × 识别信号 × 应对（research/23§4.3）</span></h4><div class="grid g2">' + scamCards + '</div>' +
        '<h4 class="block-t">⑦ 从0到第一单的14天行动计划 <span class="sub">诚实预期：14天=接单准备，不是14天赚到钱（首笔收入第60-90天）</span></h4>' +
        '<div class="callout" style="margin-bottom:12px">' + O.plan.note + '</div>' +
        '<div class="grid g4" style="margin-bottom:12px">' + phaseCards + '</div>' + planBox +
        '<div style="margin-top:12px"><button class="btn pri" data-go="earnpath">用「收益决策树」对表收入预期 →</button> ' +
        '<button class="btn ghost" data-go="calc">用「互动计算器」算自己的单分钟成本 →</button></div>';
    },

    calc() {
      const C = DB.calc, d = C.costDefaults;
      const num = (k, step, suffix) => '<label class="calc-num"><span>' + C.costLabels[k] + '</span><span class="cn-in"><input type="number" id="cf-' + k + '" value="' + d[k] + '" step="' + step + '" min="0">' + (suffix ? '<i>' + suffix + '</i>' : '') + '</span></label>';
      const resRow = (id, label, big) => '<div class="calc-res-row' + (big ? ' big' : '') + '"><span>' + label + '</span><b id="' + id + '">—</b></div>';
      const tiers = C.revTiers.map((t) => '<span class="chip" data-unit="' + t.unit + '" title="' + esc(t.d) + '">' + t.n + ' · ' + t.unit + '元</span>').join('');
      return '<div class="grid g2">' +
        '<div class="chart-box"><h5>🎬 制作成本计算器 <span class="sub">12集试播季 · 试试改参数</span></h5>' +
        '<div class="calc-grid">' +
        num('eps', 1, '集') + num('minPerEp', 0.5, '分钟') + num('shotsPerEp', 5, '镜/集') +
        num('imgUnit', 0.1, '元/张') + num('usableRate', 5, '%') + num('vidUnit', 0.5, '元/条') +
        num('retries', 0.5, '倍') + num('voicePerEp', 5, '元/集') +
        num('team', 1, '人') + num('daily', 50, '元/天') + num('days', 1, '天') +
        '</div><div class="calc-out" id="costOut"></div>' +
        '<p class="mini-note">' + C.costNotes.join('<br>') + '</p></div>' +
        '<div class="chart-box"><h5>💰 收益模拟器 <span class="sub">万播单价 × 播放量</span></h5>' +
        '<div class="calc-grid" style="grid-template-columns:1fr">' +
        '<label class="calc-num"><span>月播放量</span><span class="cn-in"><input type="number" id="rv-views" value="' + C.revDefaults.views + '" step="50" min="0"><i>万</i></span></label>' +
        '<label class="calc-num"><span>万播单价</span><span class="cn-in"><input type="number" id="rv-unit" value="' + C.revDefaults.unit + '" step="1" min="0"><i>元</i></span></label>' +
        '</div><div class="tool-filters" style="margin:10px 0 4px">' + tiers + '</div>' +
        '<div class="calc-out" id="revOut"></div>' +
        '<p class="mini-note">' + C.revNotes.join('<br>') + '</p></div>' +
        '</div>' +
        '<div class="callout blue"><b>用法：</b>左边改制作参数 → 右下角自动算出"回本播放量"；右边调收益档位 → 对照左边成本，判断这个项目值不值得开。改任意数字即时重算。</div>';
    },

    cases() {
      return '<div class="inline-search"><span class="search-ico">⌕</span><input id="caseSearch" placeholder="即时筛选：输入剧名 / 题材 / 关键词（如 出海 / 破亿 / 系列化）…" autocomplete="off"></div>' +
        '<div class="tool-filters"><span class="chip on" data-cfilter="all">全部</span><span class="chip" data-cfilter="good">标杆案例</span><span class="chip" data-cfilter="warn">风险案例</span></div>' +
        '<div class="grid g3" id="caseGrid"></div>';
    },

    rhythm() {
      const best = store.get(RT_KEY, 0);
      return '<div id="rtBox"><div class="card" style="text-align:center;padding:38px 20px">' +
        '<div style="font-size:42px">🥁</div><b style="font-size:18px;display:block;margin:10px 0 6px">分镜节奏练习</b>' +
        '<p style="font-size:13px;color:var(--tx2);max-width:540px;margin:0 auto">每轮随机抽 5 道剧情拍点题，从 98 秒单集结构的六段中选出它的正确归属。</p>' +
        (best ? '<p class="mini-note" style="margin-top:10px">🏆 历史最佳：' + best + '/5</p>' : '') +
        '<button class="btn pri" data-rt-start style="margin-top:18px">开始练习 →</button></div></div>';
    },

    docs() {
      return '<div class="docs-layout"><div class="docs-toc"><div class="inline-search" style="max-width:none"><span class="search-ico">⌕</span>' +
        '<input id="docSearch" placeholder="全文检索档案…" autocomplete="off"></div><div id="docToc"></div></div>' +
        '<div class="docs-view"><div id="docBody" class="md"></div></div></div>';
    },

    checklist() {
      const groups = DB.checklist.map((g, gi) => {
        const items = g.items.map((it, ii) => {
          const id = 'ck-' + gi + '-' + ii;
          return '<div class="ck-item" data-ck="' + id + '"><span class="box"></span><span>' + it + '</span></div>';
        }).join('');
        return '<div class="ck-group"><div class="card"><div class="ck-g-head"><b>' + g.g + '</b><span class="ck-gp" id="ckg-' + gi + '">0/' + g.items.length + '</span></div><div style="margin-top:4px">' + items + '</div></div></div>';
      }).join('');
      const total = DB.checklist.reduce((a, g) => a + g.items.length, 0);
      return '<div class="ck-progress"><div class="ck-head"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><b>总体完成度</b><span id="ckPct" style="font-weight:800;color:var(--p2);font-size:18px">0%</span><span class="mini-note" style="margin:0" id="ckNum"></span></div>' +
        '<button class="copy-btn" id="ckExport" style="padding:6px 14px">📋 复制进度摘要</button></div>' +
        '<div class="ck-bar"><div class="ck-fill" id="ckFill"></div></div><p class="mini-note">勾选状态自动保存在本机浏览器（localStorage），换设备不同步。</p></div><div class="grid g3">' + groups + '</div>';
    },

    glossary() {
      return '<div class="inline-search"><span class="search-ico">⌕</span><input id="glSearch" placeholder="即时筛选：如 抽卡 / 卡点 / IAA / 一致性 …" autocomplete="off"></div><div class="tool-filters" id="glChips"></div><div class="grid g3" id="glGrid"></div>';
    },

    log() {
      return DB.log.map((l, i) => '<div class="log-item' + (i === 0 ? ' latest' : '') + '">' +
        '<div class="l-meta"><span class="l-ver">' + l.ver + '</span>' +
        (i === 0 ? '<span class="l-new">● 最新</span>' : '') +
        '<span class="l-date">' + l.date + '</span></div>' +
        '<b class="l-title">' + l.t + '</b><ul style="list-style:disc">' +
        l.items.map((it) => '<li>' + it + '</li>').join('') + '</ul></div>').join('');
    },
  };

  /* ---------- 术语表过滤 ---------- */
  let glossaryCat = 'all';
  let glQ = '';
  /* ---------- 案例库过滤 ---------- */
  let casesFilter = 'all';
  let casesQ = '';
  function renderCasesList() {
    const grid = $('#caseGrid');
    if (!grid) return;
    let items = DB.cases.filter((x) => casesFilter === 'all' || (casesFilter === 'warn' ? x.warn : !x.warn));
    if (casesQ) { const ql = casesQ.toLowerCase(); items = items.filter((x) => (x.n + ' ' + x.plat + ' ' + x.sub + ' ' + x.d + ' ' + x.l).toLowerCase().includes(ql)); }
    grid.innerHTML = items.length
      ? items.map((x) => '<div class="card case-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><b>' + x.n + '</b>' + (x.warn ? '<span class="tag h">风险案例</span>' : '') + '</div>' +
          '<div class="cs-plat">' + x.plat + ' · ' + x.sub + '</div>' +
          '<div class="cs-data">' + x.data + '</div><p>' + x.d + '</p>' +
          '<div class="cs-lesson"><b>可复制经验：</b>' + x.l + '</div></div>').join('')
      : '<div class="callout" style="grid-column:1/-1;margin:0"><b>没有匹配「' + esc(casesQ) + '」的案例。</b>换个关键词试试。</div>';
  }
  function renderGlossary() {
    const chips = $('#glChips'), grid = $('#glGrid');
    if (!grid) return;
    if (chips) chips.innerHTML = DB.glossaryCats.map((c) =>
      '<span class="chip' + (c.id === glossaryCat ? ' on' : '') + '" data-gcat="' + c.id + '">' + c.n + '</span>').join('');
    let items = DB.glossary.filter((g) => glossaryCat === 'all' || g.c === glossaryCat);
    if (glQ) { const ql = glQ.toLowerCase(); items = items.filter((g) => (g.t + ' ' + g.d).toLowerCase().includes(ql)); }
    grid.innerHTML = items.length
      ? items.map((g) => '<div class="card glossary-card"><b><span class="gl-badge">' + esc(g.t.charAt(0).toUpperCase()) + '</span>' + g.t + '</b><p style="font-size:12.8px;color:var(--tx2);margin-top:5px">' + g.d + '</p></div>').join('')
      : '<div class="callout violet" style="grid-column:1/-1;margin:0"><b>没有匹配「' + esc(glQ) + '」的术语。</b>换个关键词，或清空筛选框。</div>';
  }

  /* ---------- 运镜收藏过滤 ---------- */
  let camFav = false;
  function renderCams() {
    const grid = $('#camGrid');
    if (!grid) return;
    const favs = loadFavs();
    const list = camFav ? DB.cameras.filter((c) => favs.has(c.n)) : DB.cameras;
    if (!list.length) {
      grid.innerHTML = '<div class="callout violet" style="grid-column:1/-1;margin:0"><b>还没有收藏的运镜。</b>浏览时点击卡片右上角的 ☆，拍摄分镜时就能一键调出你的常用镜头语言。</div>';
      return;
    }
    grid.innerHTML = list.map((c) => {
      const idE = regCopy(c.pen), idC = regCopy(c.pcn);
      const on = favs.has(c.n);
      return '<div class="card cam-card" data-hl="' + esc(c.n) + '">' + camDemo(c) +
        '<div class="cam-info"><div class="c-name"><b>' + c.n + '</b><span class="en">' + c.en + '</span>' +
        '<button class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + esc(c.n) + '" title="' + (on ? '取消收藏' : '收藏此运镜') + '" style="margin-left:auto">' + (on ? '★' : '☆') + '</button>' +
        '<button class="link-btn" data-share="' + esc(c.n) + '" data-share-page="cameras" title="复制本卡深链">🔗</button></div>' +
        '<div style="margin:6px 0 2px">' + c.emo.map((e) => '<span class="tag h">' + e + '</span>').join('') + '</div>' +
        '<div class="cam-p"><span class="cp-k">EN</span><span class="cp-v">' + esc(c.pen) + '</span><button class="copy-btn" data-copy="' + idE + '">复制</button></div>' +
        '<div class="cam-p"><span class="cp-k">中</span><span class="cp-v">' + esc(c.pcn) + '</span><button class="copy-btn" data-copy="' + idC + '">复制</button></div>' +
        '<div class="cam-use"><b>漫剧用法：</b>' + c.use + '</div></div></div>';
    }).join('');
    observeCamDemos();
  }

  /* ---------- 题材风向库过滤 ---------- */
  let genreCat = 'all';
  function renderGenres() {
    const chips = $('#gdChips'), grid = $('#gdGrid');
    if (!grid) return;
    if (chips) chips.innerHTML = DB.genres.cats.map((c) =>
      '<span class="chip' + (c.id === genreCat ? ' on' : '') + '" data-gdcat="' + c.id + '">' + c.n + '</span>').join('');
    const items = DB.genres.items.filter((g) => genreCat === 'all' || g.c === genreCat);
    grid.innerHTML = items.map((g) => '<div class="card genre-card"><div class="gd-top"><b>' + g.n + '</b><span class="gd-heat"><i>热度</i>' + heatBar(g.heat) + '</span></div>' +
      '<div class="gd-bench">🏆 对标：' + g.bench + '</div>' +
      '<p class="gd-note">' + g.note + '</p>' +
      '<div class="gd-risk">⚠ ' + g.risk + '</div></div>').join('');
  }

  /* ---------- 运镜自测（已并入运镜宝典页折叠区） ---------- */
  const QUIZ_KEY = 'manju_quiz_best';
  let quizState = null;
  function shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function quizStartCard() {
    const best = store.get(QUIZ_KEY, 0);
    return '<div class="card" style="text-align:center;padding:38px 20px">' +
      '<div style="font-size:42px">🎯</div><b style="font-size:18px;display:block;margin:10px 0 6px">运镜速配挑战</b>' +
      '<p style="font-size:13px;color:var(--tx2);max-width:540px;margin:0 auto">每轮随机抽 8 道场景题，选出最合适的运镜。目标：练出"看到情绪就知道用哪种镜头"的条件反射——<b>每镜 = 1个基础运镜 + 1个标志性运镜</b>。</p>' +
      (best ? '<p class="mini-note" style="margin-top:10px">🏆 历史最佳：' + best + '/8</p>' : '') +
      '<button class="btn pri" data-quiz-start style="margin-top:18px">开始挑战 →</button></div>';
  }
  function initCamQuiz() {
    const box = $('#quizBox');
    if (box && !box.innerHTML) box.innerHTML = quizStartCard();
  }
  function quizStart() {
    const qs = shuffleArr(DB.quizBank).slice(0, 8).map((q) => {
      const wrong = shuffleArr(DB.cameras.filter((c) => c.n !== q.a)).slice(0, 3).map((c) => c.n);
      return { q: q.q, a: q.a, opts: shuffleArr([q.a, ...wrong]) };
    });
    quizState = { qs, idx: 0, score: 0, picked: null, wrongList: [] };
    quizRender();
  }
  function quizRender() {
    const box = $('#quizBox');
    if (!box || !quizState) return;
    const st = quizState;
    if (st.idx >= st.qs.length) {
      const best = Math.max(store.get(QUIZ_KEY, 0), st.score);
      store.set(QUIZ_KEY, best);
      const level = st.score >= 7 ? ['🏆 镜头语言大师', 'var(--ok)'] : st.score >= 5 ? ['🎯 基本功扎实', 'var(--gold)'] : ['📖 建议回运镜宝典回炉', 'var(--hot)'];
      box.innerHTML = '<div class="card" style="text-align:center;padding:34px 20px">' +
        '<div style="font-size:42px">' + (st.score >= 7 ? '🏆' : st.score >= 5 ? '🎯' : '📖') + '</div>' +
        '<div style="font-size:32px;font-weight:900;color:var(--p2)">' + st.score + ' / ' + st.qs.length + '</div>' +
        '<b style="display:block;margin:6px 0 2px;color:' + level[1] + '">' + level[0] + '</b>' +
        '<p class="mini-note">历史最佳：' + best + '/' + st.qs.length + '</p>' +
        (st.wrongList.length ? '<div style="text-align:left;max-width:600px;margin:16px auto 0"><b style="font-size:13.5px">错题回顾</b>' +
          st.wrongList.map((w) => '<div class="card" style="margin-top:8px;padding:10px 14px"><div style="font-size:12.8px">' + esc(w.q) + '</div>' +
            '<div style="margin-top:6px"><span class="tag h">你选：' + esc(w.picked) + '</span><span class="tag c">正解：' + esc(w.a) + '</span></div></div>').join('') + '</div>' : '') +
        '<div style="margin-top:18px"><button class="btn pri" data-quiz-start>再来一轮 ↻</button> <button class="btn ghost" data-go="cameras">回运镜宝典复习</button></div></div>';
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const q = st.qs[st.idx];
    box.innerHTML = '<div class="card quiz-card"><div class="quiz-head"><span class="tag">第 ' + (st.idx + 1) + ' / ' + st.qs.length + ' 题</span><span class="tag c">得分 ' + st.score + '</span></div>' +
      '<div class="quiz-q">' + esc(q.q) + '</div>' +
      '<div class="quiz-opts">' + q.opts.map((o) => '<button class="quiz-opt" data-quiz-opt="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div>' +
      '<div id="quizFb" aria-live="polite"></div></div>';
  }
  function quizPick(opt) {
    const st = quizState;
    if (!st || st.picked !== null) return;
    const q = st.qs[st.idx];
    st.picked = opt;
    const correct = opt === q.a;
    if (correct) st.score++; else st.wrongList.push({ q: q.q, picked: opt, a: q.a });
    $$('#quizBox .quiz-opt').forEach((b) => {
      b.disabled = true;
      if (b.dataset.quizOpt === q.a) b.classList.add('right');
      else if (b.dataset.quizOpt === opt) b.classList.add('wrong');
    });
    const cam = DB.cameras.find((c) => c.n === q.a) || {};
    const fb = $('#quizFb');
    if (fb) fb.innerHTML = '<div class="quiz-fb" style="border-color:' + (correct ? 'rgba(52,211,153,.45)' : 'rgba(244,63,94,.45)') + '">' +
      '<b style="color:' + (correct ? 'var(--ok)' : 'var(--hot)') + '">' + (correct ? '✓ 正确！' : '✗ 正确答案：' + esc(q.a)) + '</b>' +
      '<span style="color:var(--tx3)"> ' + esc(cam.use || '') + '</span></div>' +
      '<button class="btn pri" data-quiz-next style="margin-top:12px">' + (st.idx === st.qs.length - 1 ? '看结果 →' : '下一题 →') + '</button>';
  }
  function quizNext() { if (quizState) { quizState.idx++; quizState.picked = null; quizRender(); } }

  /* ---------- 分镜节奏练习 ---------- */
  const RT_KEY = 'manju_rt_best';
  let rtState = null;
  function rtStart() {
    const segOpts = () => shuffleArr(DB.hot.episodeMap.segs.map((s, i) => ({ i, n: s.n, t: s.t })));
    rtState = { qs: shuffleArr(DB.rhythmBank).slice(0, 5).map((q) => ({ q: q.q, a: q.a, opts: segOpts() })),
      idx: 0, score: 0, picked: null, wrongList: [] };
    rtRender();
  }
  function rtRender() {
    const box = $('#rtBox');
    if (!box || !rtState) return;
    const st = rtState;
    if (st.idx >= st.qs.length) {
      const best = Math.max(store.get(RT_KEY, 0), st.score);
      store.set(RT_KEY, best);
      const level = st.score >= 5 ? ['🏆 节奏大师', 'var(--ok)'] : st.score >= 4 ? ['🎯 结构感在线', 'var(--gold)'] : ['📖 建议回「爆款心法」复习单集结构', 'var(--hot)'];
      box.innerHTML = '<div class="card" style="text-align:center;padding:34px 20px">' +
        '<div style="font-size:42px">' + (st.score >= 5 ? '🏆' : st.score >= 4 ? '🎯' : '📖') + '</div>' +
        '<div style="font-size:32px;font-weight:900;color:var(--p2)">' + st.score + ' / ' + st.qs.length + '</div>' +
        '<b style="display:block;margin:6px 0 2px;color:' + level[1] + '">' + level[0] + '</b>' +
        '<p class="mini-note">历史最佳：' + best + '/' + st.qs.length + '</p>' +
        (st.wrongList.length ? '<div style="text-align:left;max-width:600px;margin:16px auto 0"><b style="font-size:13.5px">错题回顾</b>' +
          st.wrongList.map((w) => '<div class="card" style="margin-top:8px;padding:10px 14px"><div style="font-size:12.8px">' + esc(w.q) + '</div>' +
            '<div style="margin-top:6px"><span class="tag h">你选：' + esc(w.picked) + '</span><span class="tag c">正解：' + esc(w.a) + '</span></div></div>').join('') + '</div>' : '') +
        '<div style="margin-top:18px"><button class="btn pri" data-rt-start>再来一轮 ↻</button> <button class="btn ghost" data-go="hot">回爆款心法复习单集结构</button></div></div>';
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const q = st.qs[st.idx];
    box.innerHTML = '<div class="card rt-card"><div class="rt-head"><span class="tag">第 ' + (st.idx + 1) + ' / ' + st.qs.length + ' 题</span><span class="tag c">得分 ' + st.score + '</span></div>' +
      '<div class="rt-q">剧情拍点：' + esc(q.q) + '</div>' +
      '<div class="rt-opts">' + q.opts.map((o) => '<button class="rt-opt" data-rt-opt="' + o.i + '"><b>' + esc(o.n) + '</b><span>' + esc(o.t) + '</span></button>').join('') + '</div>' +
      '<div id="rtFb" aria-live="polite"></div></div>';
  }
  function rtPick(i) {
    const st = rtState;
    if (!st || st.picked !== null) return;
    const q = st.qs[st.idx];
    st.picked = i;
    const correct = i === q.a;
    if (correct) st.score++; else st.wrongList.push({ q: q.q, picked: DB.hot.episodeMap.segs[i].n, a: DB.hot.episodeMap.segs[q.a].n });
    $$('#rtBox .rt-opt').forEach((b) => {
      b.disabled = true;
      if (+b.dataset.rtOpt === q.a) b.classList.add('right');
      else if (+b.dataset.rtOpt === i) b.classList.add('wrong');
    });
    const s = DB.hot.episodeMap.segs[q.a];
    const fb = $('#rtFb');
    if (fb) fb.innerHTML = '<div class="rt-fb" style="border-color:' + (correct ? 'rgba(52,211,153,.45)' : 'rgba(244,63,94,.45)') + '">' +
      '<b style="color:' + (correct ? 'var(--ok)' : 'var(--hot)') + '">' + (correct ? '✓ 正确！' : '✗ 正确归属：' + esc(s.n) + ' · ' + esc(s.t)) + '</b>' +
      '<div style="margin-top:6px"><b>任务：</b>' + esc(s.task) + '</div>' +
      '<div><b>常用运镜：</b>' + esc(s.cams) + '</div>' +
      '<div style="color:var(--gold)"><b>要点：</b>' + esc(s.tip) + '</div></div>' +
      '<button class="btn pri" data-rt-next style="margin-top:12px">' + (st.idx === st.qs.length - 1 ? '看结果 →' : '下一题 →') + '</button>';
  }
  function rtNext() { if (rtState) { rtState.idx++; rtState.picked = null; rtRender(); } }

  /* ---------- 首尾帧转场挑战 ---------- */
  const FT_KEY = 'manju_ft_best';
  let ftState = null;
  function ftStart() {
    ftState = { qs: shuffleArr(DB.frameBank).slice(0, 8).map((q) => ({
        q, opts: shuffleArr(q.opts.map((o, i) => ({ t: o.t, why: o.why, ok: !!o.ok, oi: i }))) })),
      idx: 0, score: 0, picked: null };
    ftRender();
  }
  function ftRender() {
    const box = $('#ftBox');
    if (!box || !ftState) return;
    const st = ftState;
    if (st.idx >= st.qs.length) {
      const rate = Math.round(st.score / st.qs.length * 100);
      const best = Math.max(store.get(FT_KEY, 0), st.score);
      store.set(FT_KEY, best);
      const level = st.score >= 7 ? ['🏆 转场大师', 'var(--ok)'] : st.score >= 5 ? ['🎯 帧差感觉不错', 'var(--gold)'] : ['📖 建议回「无限画布·七步实操」复习尾帧链', 'var(--hot)'];
      box.innerHTML = '<div class="card" style="text-align:center;padding:34px 20px">' +
        '<div style="font-size:42px">' + (st.score >= 7 ? '🏆' : st.score >= 5 ? '🎯' : '📖') + '</div>' +
        '<div style="font-size:32px;font-weight:900;color:var(--p2)">' + st.score + ' / ' + st.qs.length + '</div>' +
        '<b style="display:block;margin:6px 0 2px;color:' + level[1] + '">' + level[0] + '</b>' +
        '<p class="mini-note">正确率 ' + rate + '% · 历史最佳：' + best + '/' + st.qs.length + '</p>' +
        '<div style="margin-top:18px"><button class="btn pri" data-ft-start>再挑战一轮 ↻</button> <button class="btn ghost" data-go="canvas">回「七步实操」复习尾帧链</button></div></div>';
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const q = st.qs[st.idx].q;
    box.innerHTML = '<div class="card ft-card">' +
      '<div class="ft-head"><span class="tag">第 ' + (st.idx + 1) + ' / ' + st.qs.length + ' 题</span><span class="tag c">得分 ' + st.score + '</span></div>' +
      '<div class="ft-move">🎯 期望运镜：' + esc(q.move) + '</div>' +
      '<div class="ft-frames"><div class="ft-frame"><span class="ft-flab">首帧 FrameA</span><p>' + esc(q.a) + '</p></div>' +
      '<div class="ft-arrow">➜</div>' +
      '<div class="ft-frame q"><span class="ft-flab">尾帧 FrameB = ?</span><p>四选一：选出让这个运镜成立的尾帧</p></div></div>' +
      '<div class="ft-opts">' + st.qs[st.idx].opts.map((o, i) => '<button class="ft-opt" data-ft-opt="' + i + '"><b>B' + (i + 1) + '</b><span>' + esc(o.t) + '</span></button>').join('') + '</div>' +
      '<div id="ftFb" aria-live="polite"></div></div>';
  }
  function ftPick(i) {
    const st = ftState;
    if (!st || st.picked !== null) return;
    st.picked = i;
    const item = st.qs[st.idx];
    const hit = item.opts[i].ok;
    if (hit) st.score++;
    $$('#ftBox .ft-opt').forEach((b) => {
      b.disabled = true;
      const k = +b.dataset.ftOpt;
      if (item.opts[k].ok) b.classList.add('right');
      else if (k === i) b.classList.add('wrong');
    });
    const good = item.opts.find((o) => o.ok);
    const fb = $('#ftFb');
    if (fb) fb.innerHTML = '<div class="ft-fb" style="border-color:' + (hit ? 'rgba(52,211,153,.45)' : 'rgba(244,63,94,.45)') + '">' +
      '<b style="color:' + (hit ? 'var(--ok)' : 'var(--hot)') + '">' + (hit ? '✓ 正确！' : '✗ 应选 B' + (item.opts.indexOf(good) + 1)) + '</b>' +
      '<div class="ft-why">你选的：' + esc(item.opts[i].why) + '</div>' +
      (hit ? '' : '<div class="ft-why">正确项：' + esc(good.why) + '</div>') + '</div>' +
      '<button class="btn pri" data-ft-next style="margin-top:12px">' + (st.idx === st.qs.length - 1 ? '看结果 →' : '下一题 →') + '</button>';
  }
  function ftNext() { if (ftState) { ftState.idx++; ftState.picked = null; ftRender(); } }

  /* ---------- 收益决策树（earnpath） ---------- */
  let dtState = null; /* { answers:{qid:optKey}, hist:[qid], res:结果id|null } */
  /* 分支路由（research/23§三文字版决策树）：返回 {q:下一问id} 或 {res:结果id} */
  function epNext(a) {
    if (!a.folio) return { q: 'folio' };
    if (a.folio === 'no') return { res: 'prep' };
    if (!a.time) return { q: 'time' };
    if (a.time === 'lt10') { /* 每周<10h：轻变现短路（research/23 决策树第2条） */
      if (!a.write) return { q: 'write' };
      return { res: a.write === 'can' ? 'script' : 'light' };
    }
    if (!a.team) return { q: 'team' };
    if (a.team === 'team3') { /* 3人+产线：承制/分账档（research/23 决策树第3条） */
      if (!a.risk) return { q: 'risk' };
      return { res: a.risk === 'gamble' ? 'teamGamble' : 'team' };
    }
    if (!a.budget) return { q: 'budget' };
    if (a.budget === 'lo') return { res: 'light' }; /* 预算<500元/月：免费档轻变现 */
    if (!a.write) return { q: 'write' };
    if (!a.risk) return { q: 'risk' };
    return { res: a.risk === 'gamble' ? 'soloGamble' : 'solo' };
  }
  function dtStartCard() {
    const T = DB.earnpath.tree;
    return '<div class="card" style="text-align:center;padding:38px 20px">' +
      '<div style="font-size:42px">🧭</div><b style="font-size:18px;display:block;margin:10px 0 6px">变现路径决策树</b>' +
      '<p style="font-size:13px;color:var(--tx2);max-width:560px;margin:0 auto">答 ' + T.questions.length + ' 个问题（作品集 / 每周时间 / 团队 / 写本 / 月预算 / 风险偏好），当场给出推荐路径与理由。分支规则来自 research/23 文字版决策树：没有作品集先补样片、每周&lt;10小时走轻变现、3人+产线走承制、分账作彩票不作主食。</p>' +
      '<button class="btn pri" data-dt-start style="margin-top:18px">开始作答 →</button></div>';
  }
  function dtRender() {
    const box = $('#dtBox');
    if (!box) return;
    if (!dtState) { box.innerHTML = dtStartCard(); return; }
    if (dtState.res) { box.innerHTML = dtResultCard(dtState.res); return; }
    const T = DB.earnpath.tree;
    const nx = epNext(dtState.answers);
    const q = T.questions.find((x) => x.id === nx.q);
    if (!q) { dtState.res = 'solo'; box.innerHTML = dtResultCard('solo'); return; }
    const n = Object.keys(dtState.answers).length;
    box.innerHTML = '<div class="card quiz-card"><div class="quiz-head"><span class="tag">第 ' + (n + 1) + ' 问 · 最长' + T.questions.length + '问</span><span class="tag c">选项驱动 · 纯本地计算</span></div>' +
      '<div class="quiz-q">' + esc(q.t) + '</div>' +
      '<p class="mini-note" style="margin:0">' + esc(q.sub) + '</p>' +
      '<div class="quiz-opts">' + q.opts.map((o) => '<button class="quiz-opt" data-dt-opt="' + o.k + '"><b style="display:block">' + esc(o.n) + '</b><span style="display:block;font-size:12px;color:var(--tx3);margin-top:3px;font-weight:400">' + esc(o.d) + '</span></button>').join('') + '</div>' +
      '<div style="margin-top:12px">' + (n ? '<button class="btn ghost" data-dt-back>← 上一题</button> ' : '') + '<button class="btn ghost" data-dt-restart>↻ 重新开始</button></div></div>';
  }
  function dtResultCard(id) {
    const T = DB.earnpath.tree, R = T.results[id] || T.results.solo;
    const recap = T.questions.filter((q) => dtState.answers[q.id]).map((q) => {
      const o = q.opts.find((x) => x.k === dtState.answers[q.id]);
      return '<span class="chip on" style="cursor:default">' + esc(q.s) + '：' + esc(o ? o.n : '—') + '</span>';
    }).join('');
    const why = R.why.map((w) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + w + '</li>').join('');
    const dataRows = R.data.map((d) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 104px;text-align:left;color:var(--gold);font-weight:700">' + d.t + '</span>' +
      '<span style="flex:1;font-size:12.6px;color:var(--tx2)">' + d.v + '</span></div>').join('');
    const steps = R.steps.map((s, i) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px"><b style="color:var(--tx)">第' + (i + 1) + '步：</b>' + s + '</li>').join('');
    return '<div class="card" style="padding:18px 20px"><span class="tag c">' + R.tag + '</span>' +
      '<b style="display:block;font-size:17px;margin:8px 0 4px">▸ 推荐路径：' + R.title + '</b>' +
      '<p class="mini-note" style="margin:0">适合谁：' + R.fit + '</p>' +
      (recap ? '<div class="tool-filters" style="margin:10px 0 0">' + recap + '</div>' : '') +
      '<div class="chart-box" style="margin-top:12px"><h5>为什么是这条路</h5><ul style="margin:0;list-style:disc">' + why + '</ul></div>' +
      '<div class="chart-box" style="margin-top:10px"><h5>数据锚点 <span class="sub">口径详见「变现运营」「案例拆解」与 research/23</span></h5>' + dataRows + '</div>' +
      '<div class="chart-box" style="margin-top:10px"><h5>接下来三步</h5><ul style="margin:0;list-style:disc">' + steps + '</ul></div>' +
      '<div class="callout red" style="margin-top:12px"><b>最大坑：</b>' + R.pitfall + '</div>' +
      '<div style="margin-top:14px"><button class="btn pri" data-go="calc">用「互动计算器」验证三本账 →</button> ' +
      '<button class="btn ghost" data-dt-restart>↻ 重新测一次</button></div></div>';
  }
  function dtStart() { dtState = { answers: {}, hist: [], res: null }; dtRender(); }
  function dtPick(k) {
    if (!dtState || dtState.res) return;
    const qid = epNext(dtState.answers).q;
    if (!qid) return;
    dtState.answers[qid] = k; dtState.hist.push(qid);
    const nx = epNext(dtState.answers);
    if (nx.res) dtState.res = nx.res;
    dtRender();
  }
  function dtBack() {
    if (!dtState) return;
    dtState.res = null;
    const last = dtState.hist.pop();
    if (last) delete dtState.answers[last];
    dtRender();
  }
  function dtRestart() { dtState = null; dtRender(); }

  /* ---------- 接单实操包：渠道筛选 + 报价计算器 + 14天进度（独立存储，不与「制作清单」「第一部成片」互通） ---------- */
  const OD_KEY = 'manju_od_progress_v1';
  let odCat = 'all';
  let odTier = 3; /* 默认档：商用定制（AI中档 800-1200元/分钟，对齐「变现运营」成本阶梯） */
  let odQuoteStr = '';
  function renderOdChannels() {
    const chips = $('#odChips'), grid = $('#odGrid');
    if (!grid) return;
    if (chips) chips.innerHTML = DB.orders.channels.cats.map((c) =>
      '<span class="chip' + (c.id === odCat ? ' on' : '') + '" data-odcat="' + c.id + '">' + c.n + '</span>').join('') +
      '<span class="mini-note" style="margin:0">共' + DB.orders.channels.items.length + '个渠道 · 💰=抽成/结算口径（档案未载明即标注自查）</span>';
    const items = DB.orders.channels.items.filter((c) => odCat === 'all' || c.c === odCat);
    grid.innerHTML = items.map((c) => '<div class="card" data-hl="' + esc(c.n) + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b>' + c.n + '</b><span class="tag">' + esc((DB.orders.channels.cats.find((x) => x.id === c.c) || {}).n || '') + '</span></div>' +
      '<div style="font-size:12.6px;margin-top:8px;color:var(--tx2)"><b style="color:var(--tx)">🎚 门槛：</b>' + c.bar + '</div>' +
      '<div style="font-size:12.4px;margin-top:4px;color:var(--tx2)">' + c.feat + '</div>' +
      '<div style="font-size:12.4px;margin-top:6px;color:var(--tx2)"><b style="color:var(--gold)">💰 结算/抽成：</b>' + (c.fee ? c.fee : '档案未载明——以平台结算页为准，报名前自查') + '</div>' +
      '<p class="mini-note" style="margin:6px 0 0">信源：' + c.src + '</p></div>').join('');
  }
  function odQuoteCompute() {
    const out = $('#odQuoteOut');
    if (!out) return;
    const P = DB.orders.pricing;
    const t = P.tiers[odTier] || P.tiers[0];
    const mins = calcNum('od-mins');
    let reuse = calcNum('od-reuse');
    if (!(reuse > 0)) reuse = 0;
    if (reuse > 40) reuse = 40;
    const isUsd = t.cur === '$';
    const fy = (n) => (isUsd ? '$' : '¥') + Math.round(n).toLocaleString('zh-CN');
    const unitTxt = (isUsd ? '美元/' : '元/') + t.unit;
    const priceTxt = t.lo === t.hi ? fy(t.lo) + ' ' + unitTxt + '起' : fy(t.lo) + ' - ' + fy(t.hi) + ' ' + unitTxt;
    const perM = t.unit === '分钟';
    let lo = perM ? t.lo * mins : t.lo;
    let hi = perM ? t.hi * mins : t.hi;
    if (reuse > 0) { lo *= (1 - reuse / 100); hi *= (1 - reuse / 100); }
    const mid = (lo + hi) / 2;
    const row = (l, v) => '<div class="calc-res-row"><span>' + l + '</span><b>' + v + '</b></div>';
    out.innerHTML = row('报价区间', fy(lo) + ' - ' + fy(hi)) +
      row('建议定金（30%-50%）', fy(mid * 0.3) + ' - ' + fy(mid * 0.5)) +
      row('尾款（源文件发出前）', fy(mid * 0.5) + ' - ' + fy(mid * 0.7)) +
      '<div class="calc-verdict" style="color:var(--gold)">▸ ' + t.verd + '</div>' +
      (reuse > 0 ? '<div class="calc-verdict" style="color:var(--p2)">▸ 已按系列单资产复用折扣 -' + reuse + '%（research/18口径：续集省30-40%）</div>' : '') +
      (!perM ? '<div class="calc-verdict" style="color:var(--p2)">▸ 该档按条报价：时长输入不参与计算</div>'
        : (mins <= 0 ? '<div class="calc-verdict" style="color:var(--hot)">▸ 请输入有效时长</div>' : ''));
    odQuoteStr = P.quoteTpl
      .replace(/{{tier}}/g, t.n)
      .replace(/{{price}}/g, priceTxt)
      .replace(/{{mins}}/g, perM ? (mins + '分钟/条 × ____条（单集____分钟）') : '按条报价：____条（定制1-3分钟/条口径）')
      .replace(/{{range}}/g, fy(lo) + ' - ' + fy(hi))
      .replace(/{{reuseNote}}/g, reuse > 0 ? '（已按系列单资产复用折扣-' + reuse + '%，research/18口径30-40%）' : '')
      .replace(/{{total}}/g, fy(mid) + '（区间中值；合同按双方确认价填写）')
      .replace(/{{dep30}}/g, fy(mid * 0.3))
      .replace(/{{dep50}}/g, fy(mid * 0.5))
      .replace(/{{tail}}/g, fy(mid * 0.5) + ' - ' + fy(mid * 0.7));
    const pre = $('#odQuotePre');
    if (pre) pre.textContent = odQuoteStr;
  }
  function refreshOdProgress() {
    const sec = $('#sec-orders');
    if (!sec) return;
    const st = store.get(OD_KEY, {});
    const boxes = sec.querySelectorAll('.od-ck');
    let done = 0;
    boxes.forEach((b) => { const on = !!st[b.dataset.odck]; b.classList.toggle('done', on); if (on) done++; });
    const pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    const f = $('#odFill'), p = $('#odPct'), n = $('#odNum');
    if (f) f.style.width = pct + '%'; if (p) p.textContent = pct + '%';
    if (n) n.textContent = done + ' / ' + boxes.length + ' 项';
    DB.orders.plan.checklist.forEach((g, gi) => {
      const el = document.getElementById('odg-' + gi);
      if (!el) return;
      let d = 0;
      g.items.forEach((_, ii) => { if (st[gi + '-' + ii]) d++; });
      el.textContent = d + '/' + g.items.length;
    });
  }
  function toggleOdCk(id, el) {
    const st = store.get(OD_KEY, {});
    st[id] = !st[id];
    store.set(OD_KEY, st);
    el.classList.toggle('done', st[id]);
    refreshOdProgress();
  }
  function resetOdProgress() {
    store.set(OD_KEY, {});
    refreshOdProgress();
    toast('14天进度已重置');
  }

  /* ---------- 第一部成片：成本速算 + 7天进度自查（独立存储，不与「制作清单」互通） ---------- */
  const FF_KEY = 'manju_ff_progress_v1';
  function ffCostCompute() {
    const out = $('#ffCostOut');
    if (!out) return;
    const shots = calcNum('ff-shots'), imgU = calcNum('ff-imgUnit'), rate = calcNum('ff-rate') / 100;
    const vidU = calcNum('ff-vidUnit'), ret = calcNum('ff-retries');
    const imgC = rate > 0 ? shots * imgU / rate : 0;
    const vidC = shots * vidU * ret;
    const total = imgC + vidC;
    let verdict, vColor;
    if (total > 0 && total <= 100) { verdict = '落在行业单集算力参考带（80-100元/集，2026-09口径）内或以下——第一部片控制在这个量级即可开工'; vColor = 'var(--ok)'; }
    else if (total > 100) { verdict = '高于参考带上限（80-100元/集）：先提可用率或降重抽——可用率是成本第一杠杆'; vColor = 'var(--gold)'; }
    else { verdict = '请检查参数（镜头数为0或参数为0）'; vColor = 'var(--hot)'; }
    const row = (l, v) => '<div class="calc-res-row"><span>' + l + '</span><b>' + v + '</b></div>';
    out.innerHTML = row('图像总成本（含废片）', fmtY(imgC)) + row('视频总成本（含重抽）', fmtY(vidC)) +
      row('单集生成成本估算', fmtY(total)) +
      '<div class="calc-verdict" style="color:' + vColor + '">▸ ' + verdict + '</div>';
  }
  function refreshFfProgress() {
    const sec = $('#sec-firstfilm');
    if (!sec) return;
    const st = store.get(FF_KEY, {});
    const boxes = sec.querySelectorAll('.ff-ck');
    let done = 0;
    boxes.forEach((b) => { const on = !!st[b.dataset.ffck]; b.classList.toggle('done', on); if (on) done++; });
    const pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    const f = $('#ffFill'), p = $('#ffPct'), n = $('#ffNum');
    if (f) f.style.width = pct + '%'; if (p) p.textContent = pct + '%';
    if (n) n.textContent = done + ' / ' + boxes.length + ' 项';
    DB.firstfilm.checklist.forEach((g, gi) => {
      const el = document.getElementById('ffg-' + gi);
      if (!el) return;
      let d = 0;
      g.items.forEach((_, ii) => { if (st[gi + '-' + ii]) d++; });
      el.textContent = d + '/' + g.items.length;
    });
  }
  function toggleFfCk(id, el) {
    const st = store.get(FF_KEY, {});
    st[id] = !st[id];
    store.set(FF_KEY, st);
    el.classList.toggle('done', st[id]);
    refreshFfProgress();
  }
  function resetFfProgress() {
    store.set(FF_KEY, {});
    refreshFfProgress();
    toast('7天进度已重置');
  }

  /* ---------- 结构沙盘（单集98秒 / 连载卡点双形态） ---------- */
  let epMode = 0;
  function epCur() { const M = DB.hot.episodeMap; return (epMode && M.serial) ? M.serial : M; }
  function renderEpBar() {
    const bar = $('#epBar'), note = $('#epNote');
    if (!bar) return;
    const cur = epCur();
    bar.innerHTML = cur.segs.map((s, i) =>
      '<div class="ep-seg' + (i === 0 ? ' on' : '') + '" data-ep="' + i + '" style="flex:' + (s.w * 1.6) + ' 1 0"><b>' + s.n + '</b><span>' + s.t + '</span></div>').join('');
    if (note) note.textContent = cur.note;
    renderEp(0);
  }
  function renderEp(i) {
    const box = $('#epDetail');
    if (!box) return;
    const cur = epCur();
    const segs = cur.segs;
    const s = segs[i] || segs[0];
    document.querySelectorAll('.ep-seg').forEach((el) => el.classList.toggle('on', +el.dataset.ep === i));
    const row = (k, v) => '<div class="ep-row"><span class="ep-k">' + k + '</span><span>' + v + '</span></div>';
    const L = cur.labels || ['任务', '镜头', '常用运镜', '要点'];
    box.innerHTML = '<div class="ep-title">' + s.n + ' <span class="tag">' + s.t + '</span></div>' +
      row(L[0], s.task) + row(L[1], s.shots) + row(L[2], s.cams) + row(L[3], '<span style="color:var(--gold)">' + s.tip + '</span>');
  }

  /* ---------- 研究档案阅读器 ---------- */
  const docsList = () => (typeof RESEARCH_DOCS !== 'undefined') ? RESEARCH_DOCS : [];
  let docIdx = 0;
  function escInline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function mdToHtml(md) {
    const lines = String(md).split(/\r?\n/);
    let out = '', i = 0, list = null, table = [];
    const flushList = () => { if (list) { out += '</' + list + '>'; list = null; } };
    const flushTable = () => {
      if (!table.length) return;
      let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + table[0].map((c) => '<th>' + escInline(c) + '</th>').join('') + '</tr></thead><tbody>';
      for (let r = 1; r < table.length; r++) {
        if (table[r].every((c) => /^[-\s:]*$/.test(c))) continue;
        h += '<tr>' + table[r].map((c) => '<td>' + escInline(c) + '</td>').join('') + '</tr>';
      }
      out += h + '</tbody></table></div>';
      table = [];
    };
    while (i < lines.length) {
      const L = lines[i];
      if (/^```/.test(L)) {
        flushList(); flushTable();
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out += '<div class="codebox"><pre>' + esc(buf.join('\n')) + '</pre></div>';
        continue;
      }
      if (/^\s*\|/.test(L)) { flushList(); table.push(L.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())); i++; continue; }
      flushTable();
      const h = L.match(/^(#{1,4})\s+(.*)/);
      if (h) { flushList(); out += '<h' + (h[1].length + 2) + ' class="md-h md-h' + h[1].length + '">' + escInline(h[2]) + '</h' + (h[1].length + 2) + '>'; i++; continue; }
      if (/^>\s?/.test(L)) { flushList(); out += '<blockquote class="md-quote">' + escInline(L.replace(/^>\s?/, '')) + '</blockquote>'; i++; continue; }
      if (/^\s*[-*]\s+/.test(L)) {
        if (list !== 'ul') { flushList(); out += '<ul class="md-ul">'; list = 'ul'; }
        out += '<li>' + escInline(L.replace(/^\s*[-*]\s+/, '')) + '</li>'; i++; continue;
      }
      if (/^\s*\d+\.\s+/.test(L)) {
        if (list !== 'ol') { flushList(); out += '<ol class="md-ol">'; list = 'ol'; }
        out += '<li>' + escInline(L.replace(/^\s*\d+\.\s+/, '')) + '</li>'; i++; continue;
      }
      if (/^---+\s*$/.test(L)) { flushList(); out += '<hr class="md-hr">'; i++; continue; }
      if (!L.trim()) { flushList(); i++; continue; }
      flushList(); out += '<p class="md-p">' + escInline(L) + '</p>'; i++;
    }
    flushList(); flushTable();
    return out;
  }
  function renderDocToc(q) {
    const toc = $('#docToc');
    if (!toc) return;
    const docs = docsList();
    const ql = (q || '').toLowerCase();
    const items = docs.map((d, i) => ({ d, i, hits: ql ? (d.content.toLowerCase().split(ql).length - 1) : -1 }))
      .filter((x) => !ql || x.hits > 0 || x.d.title.toLowerCase().includes(ql));
    toc.innerHTML = items.length ? items.map((x) =>
      '<div class="doc-toc-item' + (x.i === docIdx ? ' on' : '') + '" data-doc="' + x.i + '"><b>' + esc(x.d.title) + '</b>' +
      (ql && x.hits > 0 ? '<span class="doc-hits">' + x.hits + ' 处</span>' : '') +
      '<span class="doc-file">' + esc(x.d.file) + '</span></div>').join('')
      : '<div class="sd-empty">没有匹配「' + esc(q) + '」的档案</div>';
  }
  function renderDoc(idx) {
    const docs = docsList();
    const body = $('#docBody');
    if (!body || !docs.length) return;
    docIdx = Math.max(0, Math.min(idx, docs.length - 1));
    body.innerHTML = '<div class="doc-meta">' + esc(docs[docIdx].file) + ' · 源文件 research/ 目录</div>' + mdToHtml(docs[docIdx].content);
    renderDocToc($('#docSearch') ? $('#docSearch').value.trim() : '');
    body.parentElement.scrollTop = 0;
  }

  /* ---------- 标题打分器 ---------- */
  function scoreTitle() {
    const box = $('#titleResult');
    if (!box) return;
    const input = $('#titleInput');
    const t = (input ? input.value : '').trim();
    if (!t) { box.innerHTML = '<div class="callout red" style="margin:10px 0 0">先输入一个标题再打分。</div>'; return; }
    const S = DB.hot.titleScorer;
    const hits = [], miss = [];
    let score = 0;
    Object.values(S.lex).forEach((lx) => {
      const hit = lx.words.split(',').some((w) => t.includes(w));
      if (hit) { score += lx.w; hits.push(lx.k); } else miss.push({ k: lx.k, w: lx.w });
    });
    const len = Array.from(t).length;
    if (len >= 12 && len <= 18) { score += S.lens.w; hits.push(S.lens.k + '（' + len + '字）'); }
    else miss.push({ k: S.lens.k + '（当前' + len + '字）', w: S.lens.w });
    score = Math.min(100, score);
    const grade = score >= 80 ? ['🏆 爆款潜质', 'var(--ok)'] : score >= 60 ? ['🎯 及格，可再强化', 'var(--gold)'] : ['✍️ 建议重写', 'var(--hot)'];
    const cl = (S.cliche ? S.cliche.words.split(',') : []).filter((w) => w && t.includes(w));
    box.innerHTML = '<div class="ts-score"><b style="color:' + grade[1] + '">' + score + '</b><span>' + grade[0] + '</span></div>' +
      '<div class="ts-chips">' + hits.map((h) => '<span class="tag c">✓ ' + h + '</span>').join('') +
      miss.map((m) => '<span class="tag h">✗ ' + m.k + '</span>').join('') +
      cl.map((c) => '<span class="tag h">⚠ ' + c + '</span>').join('') + '</div>' +
      (cl.length ? '<div class="ts-sug" style="color:var(--hot)">⚠️ 反套路警示：' + cl.join('、') + ' 已被过度使用（research/15：反套路真实感细节更易出圈），建议换成具体情境或反预期设定。</div>' : '') +
      (miss.length ? '<div class="ts-sug"><b>改进建议：</b>补上 ' + miss.map((m) => m.k + '（+' + m.w + '分）').join('、') + '。套路参考：悬念留白 / 身份反差 / 数字锚点，标题党要"夸而不谎"。</div>'
        : '<div class="ts-sug" style="color:var(--ok)">六维规则全命中——接下来做AB测试，用点击率数据定胜负。</div>') +
      (S.ab ? '<div class="ts-sug"><b>AB测试流程：</b>' + S.ab.join('；') + '。</div>' : '');
  }

  function pipeTplBlock(p) {
    const t = (DB.pipelineTpl || []).find((x) => x.no === p.no);
    if (!t) return '';
    return '<div class="pd-box" style="margin-top:12px"><h5>📄 产出物模板 · 复制即用</h5>' +
      '<div class="codebox"><div class="cb-bar"><span>' + t.t + '</span><button class="copy-btn" data-copy="' + regCopy(t.text) + '">复制</button></div><pre>' + esc(t.text) + '</pre></div></div>';
  }
  function pipeCkGate(no) {
    const g = DB.checklist[no - 1];
    if (!g) return '';
    return '<div class="pd-box warn" style="margin-top:12px"><h5>✅ 交付物检查点 · 对照「制作清单」' + g.g + '组（' + g.items.length + '项）</h5>' +
      '<ul>' + g.items.map((it) => '<li>' + it + '</li>').join('') + '</ul>' +
      '<button class="btn ghost" data-go="checklist?g=' + (no - 1) + '" style="margin-top:8px;padding:6px 14px;font-size:12.5px">跳到「制作清单」勾选本阶段 →</button></div>';
  }
  /* ---------- 流程详情 ---------- */
  function renderPipeDetail(no) {
    const p = DB.pipeline.find((x) => x.no === no) || DB.pipeline[0];
    $$('.pipe-step').forEach((s) => s.classList.toggle('on', +s.dataset.stage === p.no));
    const tools = p.tools.map((t) => '<span class="tag c">' + t + '</span>').join('');
    const dos = p.do.map((d) => '<li>' + d + '</li>').join('');
    const pits = p.pitfalls.map((d) => '<li>' + d + '</li>').join('');
    $('#pipeDetail').innerHTML = '<div class="pipe-detail">' +
      '<div class="pd-head"><span class="pd-ico">' + p.ico + '</span><h3>' + p.no + '. ' + p.name + '</h3><span class="tag">' + p.en + '</span></div>' +
      '<div class="pd-goal">' + p.goal + '</div>' +
      '<div class="pd-grid"><div class="pd-box"><h5>怎么做</h5><ul>' + dos + '</ul></div>' +
      '<div><div class="pd-box" style="margin-bottom:12px"><h5>推荐工具</h5><div class="pd-tools">' + tools + '</div></div>' +
      '<div class="pd-box warn" style="margin-bottom:12px"><h5>避坑指南</h5><ul>' + pits + '</ul></div>' +
      '<div class="pd-box"><h5>产出物 & 耗时</h5><ul><li>' + p.output + '</li><li>典型耗时：' + p.time + '</li></ul></div></div></div>' +
      pipeTplBlock(p) + pipeCkGate(p.no) +
      '<div class="pd-meta"><span class="pill">阶段 <b>' + p.no + ' / 9</b></span>' +
      (p.no > 1 ? '<button class="btn ghost" data-stage="' + (p.no - 1) + '">← 上一阶段</button>' : '') +
      (p.no < 9 ? '<button class="btn ghost" data-stage="' + (p.no + 1) + '">下一阶段 →</button>' : '<button class="btn pri" data-go="tools">进入工具库 →</button>') +
      '</div></div>';
  }

  /* ---------- 工具过滤 & 收藏 ---------- */
  let toolCat = 'all';
  let toolQ = '';
  let toolSort = '';
  function loadFavs() { return new Set(store.get(FAV_KEY, [])); }
  function saveFavs(set) { store.set(FAV_KEY, Array.from(set)); }
  function renderTools(cat) {
    toolCat = cat;
    const favs = loadFavs();
    $$('.chip[data-cat]').forEach((c) => c.classList.toggle('on', c.dataset.cat === cat));
    const cnt = $('#favCnt'); if (cnt) cnt.textContent = favs.size ? favs.size : '';
    let list = DB.tools.filter((t) => cat === 'all' || t.cat === cat);
    if (cat === '__fav') list = DB.tools.filter((t) => favs.has(t.n));
    if (toolQ) { const ql = toolQ.toLowerCase(); list = list.filter((t) => (t.n + ' ' + t.ver + ' ' + t.tag + ' ' + t.pro + ' ' + t.con + ' ' + t.tip).toLowerCase().includes(ql)); }
    if (toolSort === 'rate') list = [...list].sort((a, b) => (b.rate || 0) - (a.rate || 0));
    else if (toolSort === 'name') list = [...list].sort((a, b) => a.n.localeCompare(b.n, 'zh-Hans-CN'));
    const grid = $('#toolGrid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="callout violet" style="grid-column:1/-1;margin:0"><b>' + (toolQ ? '没有匹配「' + esc(toolQ) + '」的工具。' : '还没有收藏的工具。') + '</b>' + (toolQ ? '换个关键词试试，或清空筛选框。' : '浏览时点击卡片右上角的 ☆，常用工具就会被钉在这里。') + '</div>';
      return;
    }
    grid.innerHTML = list.map((t) => {
      const catName = (DB.toolCats.find((c) => c.id === t.cat) || {}).n || '';
      const on = favs.has(t.n);
      return '<div class="card tool-card' + (t.dead ? ' dead-tool' : '') + '" data-hl="' + esc(t.n) + '">' +
        '<div class="t-top"><div class="t-ico">' + t.ico + '</div><div><div class="t-name">' + t.n + ' <span class="t-ver">' + t.ver + '</span></div>' +
        '<span class="tag" style="margin:4px 0 0">' + catName + '</span></div><span class="t-side">' + stars(t.rate) +
        '<button class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + esc(t.n) + '" title="' + (on ? '取消收藏' : '收藏此工具') + '">' + (on ? '★' : '☆') + '</button>' +
        '<button class="link-btn" data-share="' + esc(t.n) + '" data-share-page="tools" title="复制本卡深链">🔗</button></span></div>' +
        '<div class="t-tag">' + t.tag + '</div>' +
        '<div class="t-row"><span class="k">✓</span><span>' + t.pro + '</span></div>' +
        '<div class="t-row"><span class="k">✗</span><span>' + t.con + '</span></div>' +
        '<div class="t-row"><span class="k">💰</span><span>' + t.price + '</span></div>' +
        '<div class="t-tip">💡 ' + t.tip + '</div></div>';
    }).join('');
  }
  function toggleFav(name, btn) {
    const favs = loadFavs();
    if (favs.has(name)) { favs.delete(name); toast('已取消收藏「' + name + '」'); }
    else { favs.add(name); toast('★ 已收藏「' + name + '」'); }
    saveFavs(favs);
    if (btn) { btn.classList.toggle('on', favs.has(name)); btn.textContent = favs.has(name) ? '★' : '☆'; }
    const cnt = $('#favCnt'); if (cnt) cnt.textContent = favs.size ? favs.size : '';
    if (toolCat === '__fav') renderTools('__fav');
    if (camFav && $('#camGrid')) renderCams();
    if ($('#pbBank')) renderPromptsBank();
  }

  /* ---------- 提示词模板库渲染与收藏 ---------- */
  let pbFavOnly = false;
  function renderPromptsBank() {
    const el = $('#pbBank');
    if (!el) return;
    const favs = loadFavs();
    const pbTotal = DB.promptBank.reduce((a, g) => a + g.items.filter((it) => favs.has(it.cn)).length, 0);
    const cnt = $('#pbFavCnt'); if (cnt) cnt.textContent = pbTotal || '';
    const groups = DB.promptBank.map((g, gi) => {
      let items = g.items;
      if (pbFavOnly) items = items.filter((it) => favs.has(it.cn));
      if (!items.length) return '';
      const rows = items.map((it) => {
        const idx = g.items.indexOf(it) + 1;
        const a = regCopy(it.cn), b = regCopy(it.en);
        const on = favs.has(it.cn);
        return '<div class="card pb-item" data-hl="' + esc(it.cn) + '"><button class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + esc(it.cn) + '" title="' + (on ? '取消收藏' : '收藏此模板') + '">' + (on ? '★' : '☆') + '</button>' +
          '<button class="link-btn" data-share="' + esc(it.cn) + '" data-share-page="prompts" title="复制本条深链">🔗</button>' +
          '<div class="pb-cn"><b style="color:var(--p2)">' + String(idx).padStart(2, '0') + '</b> ' + esc(it.cn) + '</div>' +
          '<div class="pb-en">' + esc(it.en) + '</div><div class="pb-foot">' +
          '<button class="copy-btn" data-copy="' + a + '">复制中文</button><button class="copy-btn" data-copy="' + b + '">复制英文</button></div></div>';
      }).join('');
      const num = pbFavOnly ? items.length + '/' + g.items.length + '条' : g.items.length + '条';
      return '<div class="pb-cat">' + g.cat + ' <span class="pb-n">' + num + '</span><button class="copy-btn" data-pbcopy="' + gi + '" title="复制本组全部中文模板">复制本组</button></div>' + rows;
    }).join('');
    el.innerHTML = groups || '<div class="callout violet" style="margin-top:10px"><b>还没有收藏的模板。</b>点击模板右上角的 ☆，常用句式就会集中在这里，配合「只看收藏」快速取用。</div>';
  }

  /* ---------- 随机灵感 ---------- */
  function randomInsp() {
    const box = $('#inspBox');
    if (!box) { location.hash = '#/prompts'; setTimeout(randomInsp, 220); return; }
    const all = DB.promptBank.flatMap((g) => g.items.map((it) => ({ cn: it.cn, en: it.en, cat: g.cat })));
    const it = all[Math.floor(Math.random() * all.length)];
    const a = regCopy(it.cn), b = regCopy(it.en);
    box.hidden = false;
    box.innerHTML = '<div class="insp-card"><div class="pf-t">🎲 ' + esc(it.cat) + ' · 随机灵感</div>' +
      '<div class="pb-cn" style="font-size:13.5px">' + esc(it.cn) + '</div>' +
      '<div class="pb-en">' + esc(it.en) + '</div>' +
      '<div class="pb-foot"><button class="copy-btn" data-copy="' + a + '">复制中文</button><button class="copy-btn" data-copy="' + b + '">复制英文</button>' +
      '<button class="copy-btn" id="inspAgain">换一条 ↻</button></div></div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- SVG图表 ---------- */
  function donut(data) {
    const total = data.reduce((a, c) => a + c.v, 0);
    let acc = 0; const cx = 70, cy = 70, r = 52, sw = 22;
    const segs = data.map((d) => {
      const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2; acc += d.v;
      const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      return '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" fill="none" stroke="' + d.c + '" stroke-width="' + sw + '"/>';
    }).join('');
    const legend = data.map((d) => '<div class="legend"><i style="background:' + d.c + '"></i>' + d.n + ' <b>' + d.v + '%</b></div>').join('');
    return '<div class="donut-wrap"><svg width="140" height="140" class="svg-chart">' + segs +
      '<text x="70" y="66" text-anchor="middle" style="fill:var(--tx);font-size:18px;font-weight:800">' + total + '%</text>' +
      '<text x="70" y="84" text-anchor="middle" style="font-size:10px">已分配</text></svg><div>' + legend + '</div></div>';
  }
  function costLadder() {
    const items = [
      { n: '传统人工', min: 2000, max: 5000 }, { n: '精品级AI', min: 1000, max: 3000 },
      { n: 'AI中档', min: 800, max: 1200 }, { n: 'AI低档', min: 350, max: 500 }, { n: 'AI解说剧', min: 80, max: 130 },
    ];
    const MAX = 5000;
    return items.map((it) => {
      const l = (it.min / MAX) * 100, w = ((it.max - it.min) / MAX) * 100;
      return '<div class="bar-row"><span class="b-lab">' + it.n + '</span><span class="b-track"><span class="b-fill" style="margin-left:' + l + '%;width:' + w + '%"></span></span><span class="b-val">' + it.min + '-' + it.max + '元</span></div>';
    }).join('') + '<p class="mini-note">标准化AI短剧报价半年从5000元/分钟跌到几百元，跌幅超90%（央视财经 2026-09）；定制短剧仍可达1万-2万元/分钟。</p>';
  }

  /* ---------- 互动计算器 ---------- */
  const fmtY = (n) => '¥' + Math.round(n).toLocaleString('zh-CN');
  function calcNum(id) {
    const el = document.getElementById(id);
    const v = el ? parseFloat(el.value) : NaN;
    return isNaN(v) ? 0 : v;
  }
  function calcCompute() {
    const out = $('#costOut');
    if (!out) return;
    const eps = calcNum('cf-eps'), min = calcNum('cf-minPerEp'), shots = calcNum('cf-shotsPerEp');
    const imgU = calcNum('cf-imgUnit'), rate = calcNum('cf-usableRate') / 100;
    const vidU = calcNum('cf-vidUnit'), ret = calcNum('cf-retries'), voice = calcNum('cf-voicePerEp');
    const labor = calcNum('cf-team') * calcNum('cf-daily') * calcNum('cf-days');
    const totalShots = eps * shots;
    const imgC = rate > 0 ? totalShots * imgU / rate : 0;
    const vidC = totalShots * vidU * ret;
    const voC = eps * voice;
    const total = imgC + vidC + voC + labor;
    const perMin = eps * min > 0 ? total / (eps * min) : 0;
    const row = (l, v) => '<div class="calc-res-row"><span>' + l + '</span><b>' + v + '</b></div>';
    let verdict, vColor;
    if (perMin >= 800 && perMin <= 1200) { verdict = '落在 AI中档主流区间（800-1200元/分钟）'; vColor = 'var(--ok)'; }
    else if (perMin > 1200) { verdict = '高于AI中档区间——要么是精品化路线，要么该压抽卡了'; vColor = 'var(--gold)'; }
    else if (perMin > 0) { verdict = '低于主流区间：确认质量达标了吗？低于350元/分钟≈简易动态漫'; vColor = 'var(--p2)'; }
    else { verdict = '请检查参数'; vColor = 'var(--hot)'; }
    out.innerHTML = row('图像总成本（含废片）', fmtY(imgC)) + row('视频总成本（含重抽）', fmtY(vidC)) +
      row('配音总成本', fmtY(voC)) + row('人力总成本', fmtY(labor)) +
      row('全片总成本', fmtY(total)) + row('单集成本', fmtY(eps ? total / eps : 0)) +
      row('每分钟成本', fmtY(perMin)) +
      '<div class="calc-verdict" style="color:' + vColor + '">▸ ' + verdict + '</div>';
    const revOut = $('#revOut');
    const views = calcNum('rv-views'), unit = calcNum('rv-unit');
    const rev = views * unit;
    const be = unit > 0 ? total / unit : NaN;
    revOut.innerHTML = row('月毛收入', fmtY(rev)) + row('年化毛收入', fmtY(rev * 12)) +
      row('覆盖上面这部片成本需要播放', isNaN(be) ? '—' : fmtY(be) + ' 万播放') +
      (rev > 0 ? '<div class="calc-verdict" style="color:' + (rev > total ? 'var(--ok)' : 'var(--hot)') + '">▸ ' + (rev >= total ? '月收入可覆盖该制作成本，模型成立（注意投流分成）' : '月收入暂难覆盖该成本：压缩集数/工期或提高内容档位') + '</div>' : '');
  }

  /* ---------- 检查清单 ---------- */
  function loadCk() { return store.get(CK_KEY, {}); }
  function saveCk(st) { store.set(CK_KEY, st); }
  function refreshCkProgress() {
    const st = loadCk(); const boxes = $$('.ck-item');
    let done = 0;
    boxes.forEach((b) => { const id = b.dataset.ck; const on = !!st[id]; b.classList.toggle('done', on); if (on) done++; });
    const pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    const f = $('#ckFill'), p = $('#ckPct'), n = $('#ckNum');
    if (f) f.style.width = pct + '%'; if (p) p.textContent = pct + '%';
    if (n) n.textContent = done + ' / ' + boxes.length + ' 项';
    DB.checklist.forEach((g, gi) => {
      const el = document.getElementById('ckg-' + gi);
      if (!el) return;
      let d = 0;
      g.items.forEach((_, ii) => { if (st['ck-' + gi + '-' + ii]) d++; });
      el.textContent = d + '/' + g.items.length;
      el.classList.toggle('all', d === g.items.length);
    });
  }
  function exportCk() {
    const st = loadCk();
    const lines = [];
    let total = 0, done = 0;
    DB.checklist.forEach((g, gi) => {
      let d = 0; const todos = [];
      g.items.forEach((it, ii) => { total++; if (st['ck-' + gi + '-' + ii]) { d++; done++; } else todos.push(it); });
      lines.push((d === g.items.length ? '✅' : '▫️') + ' ' + g.g + '：' + d + '/' + g.items.length);
      if (d !== g.items.length) todos.forEach((t) => lines.push('   ☐ ' + t));
    });
    lines.unshift('【制作清单进度】总体：' + done + '/' + total + '（' + Math.round((done / total) * 100) + '%）· 漫剧研究学习平台');
    doCopy(regCopy(lines.join('\n')), document.getElementById('ckExport'));
  }

  /* ---------- 全局搜索 ---------- */
  let SEARCH_IDX = [];
  function buildIndex() {
    SEARCH_IDX = [];
    const push = (sec, tit, txt, go) => SEARCH_IDX.push({ sec, tit, txt: String(txt).replace(/<[^>]+>/g, ''), go });
    DB.pipeline.forEach((p) => push('开发流程', p.no + '. ' + p.name, p.goal + ' ' + p.do.join(' '), '#/pipeline'));
    DB.tools.forEach((t) => push('工具库', t.n + ' ' + t.ver, t.tag + ' ' + t.pro + ' ' + t.tip, '#/tools'));
    DB.cameras.forEach((c) => push('运镜宝典', c.n + ' ' + c.en, c.pcn + ' ' + c.pen + ' ' + c.use, '#/cameras'));
    DB.promptBank.forEach((g) => g.items.forEach((it, i) => push('提示词库', g.cat + ' #' + (i + 1), it.cn + ' ' + it.en, '#/prompts')));
    DB.cases.forEach((c) => push('案例', c.n, c.d + ' ' + c.l, '#/cases'));
    DB.monetize.platforms.forEach((p) => push('变现', p.n, p.pol + ' ' + p.inc, '#/monetize'));
    DB.hot.rules.forEach((r) => push('爆款心法', r.t, r.d, '#/hot'));
    DB.genres.items.forEach((g) => push('题材风向库', g.n, g.bench + ' ' + g.note + ' ' + g.risk, '#/genres'));
    docsList().forEach((d) => push('研究档案', d.title, d.content.slice(0, 3000), '#/docs'));
    DB.quizBank.forEach((q) => push('运镜速配挑战', '场景题', q.q + '（答案：' + q.a + '）', '#/cameras?quiz=1'));
    DB.rhythmBank.forEach((q) => push('分镜节奏', '节奏拍点题', q.q + '（答案：' + DB.hot.episodeMap.segs[q.a].n + '）', '#/rhythm'));
    DB.frameBank.forEach((q) => push('无限画布', '首尾帧转场挑战', q.a + '（' + q.move + '）', '#/canvas'));
    DB.learning.forEach((tr) => tr.items.forEach((it) => push('学习路径', tr.t, it.d + ' ' + it.d2, '#/learning')));
    DB.firstfilm.days.forEach((d) => push('第一部成片', d.d + ' ' + d.t, d.goal + ' ' + d.steps.join(' ') + ' ' + d.pits.join(' '), '#/firstfilm'));
    push('第一部成片', '第一笔收入衔接', DB.firstfilm.income.note + ' ' + DB.firstfilm.income.paths.map((p) => p.n + '：' + p.d).join(' '), '#/firstfilm');
    DB.earnpath.bench.rows.forEach((r) => push('收益决策树', r.bg + ' · 收益预期对照', r.cells.map((c) => c.v + ' ' + c.d).join(' '), '#/earnpath'));
    Object.keys(DB.earnpath.tree.results).forEach((k) => { const r = DB.earnpath.tree.results[k]; push('收益决策树', '推荐路径：' + r.title, r.fit + ' ' + r.why.join(' ') + ' ' + r.data.map((d) => d.t + '：' + d.v).join(' '), '#/earnpath'); });
    DB.earnpath.tree.questions.forEach((q) => push('收益决策树', '决策树问题：' + q.t, q.sub + ' ' + q.opts.map((o) => o.n + ' ' + o.d).join(' '), '#/earnpath'));
    DB.earnpath.pitfalls.forEach((p) => push('收益决策树', '避坑：' + p.t, p.d, '#/earnpath'));
    DB.earnpath.caseMap.forEach((c) => push('收益决策树', c.n + '（' + c.tag + '）', c.d + ' ' + c.lesson, '#/earnpath'));
    DB.orders.channels.items.forEach((c) => push('接单实操包', c.n, c.bar + ' ' + c.feat + ' ' + c.fee + ' ' + c.src, '#/orders'));
    DB.orders.pricing.tiers.forEach((t) => push('接单实操包', '报价档位：' + t.n, t.d + ' ' + t.src + ' ' + t.verd, '#/orders'));
    DB.orders.pricing.factors.forEach((f) => push('接单实操包', '报价四因子：' + f.t, f.d, '#/orders'));
    DB.orders.folio.samples.forEach((s) => push('接单实操包', '作品集样片：' + s.n, s.ref + ' ' + s.d + ' ' + s.why, '#/orders'));
    DB.orders.delivery.forEach((g) => g.items.forEach((it) => push('接单实操包', '交付标准：' + it.t, it.d + ' ' + it.src, '#/orders')));
    DB.orders.contract.clauses.forEach((c) => push('接单实操包', '合同条款：' + c.t, c.d, '#/orders'));
    DB.orders.scams.forEach((s) => push('接单实操包', '防骗：' + s.t, s.sign + ' ' + s.how, '#/orders'));
    DB.orders.plan.phases.forEach((p) => push('接单实操包', '14天计划：' + p.d + ' ' + p.t, p.d2, '#/orders'));
    DB.orders.plan.checklist.forEach((g) => push('接单实操包', g.d + ' ' + g.t, g.items.join(' '), '#/orders'));
    DB.glossary.forEach((g) => push('术语表', g.t, g.d, '#/glossary'));
    DB.canvas.tips.forEach((t) => push('无限画布', '画布技巧', t, '#/canvas'));
    DB.canvas.tools.forEach((t) => push('无限画布', t.n, t.cap + ' ' + t.note, '#/canvas'));
    push('大模型', '分镜JSON与自动化', DB.llm.automation.map((a) => a.t + a.d).join(' '), '#/llm');
    // 自注册模块（window.MJ.addModule）的搜索条目：SEARCH_IDX 每次全量重建后必须重放，否则索引丢失
    MJ.modules.forEach((m) => {
      if (Array.isArray(m.search)) m.search.forEach((it) => push(m.name, it.tit, it.txt, '#/' + m.id));
    });
  }
  let hlIdx = -1, hlList = [];
  function search(q) {
    const drop = $('#searchDrop');
    if (!q || q.length < 1) { drop.classList.remove('show'); return; }
    const ql = q.toLowerCase();
    const hits = SEARCH_IDX.filter((x) => (x.sec + ' ' + x.tit + ' ' + x.txt).toLowerCase().includes(ql)).slice(0, 12);
    hlList = hits; hlIdx = -1;
    const seen = {}; let grouped = '';
    hits.forEach((x) => {
      if (!seen[x.sec]) { seen[x.sec] = true; grouped += '<div class="sd-group">' + esc(x.sec) + '</div>'; }
      grouped += '<div class="sd-item" data-go="' + x.go + '"><div class="sd-tit">' + hlMark(x.tit, q) + '</div><div class="sd-txt">' + hlMark(x.txt.slice(0, 90), q) + '</div></div>';
    });
    drop.innerHTML = hits.length
      ? grouped +
        '<div class="sd-foot"><span>↑↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>'
      : '<div class="sd-empty">没有找到「' + esc(q) + '」相关内容</div>';
    drop.classList.add('show');
  }

  /* ---------- 命令面板（Ctrl+K） ---------- */
  const cpOverlayEl = () => $('#cpOverlay');
  const palActs = [
    { ico: 'theme', n: '切换明暗主题', sub: '外观 · 自动→浅→深', act: () => cycleTheme() },
    { ico: 'dice', n: '随机抽一条提示词灵感', sub: '提示词库', act: () => { location.hash = '#/prompts'; setTimeout(randomInsp, 220); } },
    { ico: 'star', n: '查看收藏的工具', sub: '工具库', act: () => { location.hash = '#/tools'; setTimeout(() => { if ($('#toolGrid')) renderTools('__fav'); }, 220); } },
    { ico: 'link', n: '复制当前页面链接', sub: '分享', act: copyLink },
    { ico: 'kbd', n: '查看键盘快捷键', sub: '帮助 · 或按 ?', act: kbdOpen },
    { ico: 'star', n: '复制我的收藏清单', sub: '收藏 · 工具/运镜/提示词', act: exportFavs },
  ];
  function copyTextRaw(text, okMsg) {
    const ok = () => toast(okMsg);
    const fb = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('复制失败，请手动选择文本复制'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok).catch(fb);
    else fb();
  }
  function copyLink() {
    copyTextRaw(location.href, '✓ 页面链接已复制');
  }
  function exportFavs() {
    const favs = loadFavs();
    const tools = DB.tools.filter((t) => favs.has(t.n)).map((t) => '🧰 工具：' + t.n);
    const cams = DB.cameras.filter((c) => favs.has(c.n)).map((c) => '🎥 运镜：' + c.n);
    const prs = [];
    DB.promptBank.forEach((g) => g.items.forEach((it) => { if (favs.has(it.cn)) prs.push('✍️ 提示词：' + it.cn); }));
    if (!tools.length && !cams.length && !prs.length) { toast('收藏夹还是空的，先去点亮 ☆ 吧'); return; }
    doCopy(regCopy(['【我的收藏清单 · 漫剧研究学习平台】', ...tools, ...cams, ...prs].join('\n')));
    toast('✓ 收藏清单已复制（' + (tools.length + cams.length + prs.length) + ' 项）');
  }
  let cpList = [], cpIdx = -1;
  function palOpen() {
    const ov = cpOverlayEl();
    if (!ov || !ov.hidden) return;
    ov.hidden = false;
    const inp = $('#cpInput');
    inp.value = ''; palSearch('');
    setTimeout(() => inp.focus(), 30);
    document.documentElement.style.overflow = 'hidden';
  }
  function palClose() {
    const ov = cpOverlayEl();
    if (ov) ov.hidden = true;
    document.documentElement.style.overflow = '';
  }
  function palRender(items, q) {
    cpList = items; cpIdx = items.length ? 0 : -1;
    const box = $('#cpList');
    if (!box) return;
    if (!items.length) { box.innerHTML = '<div class="cp-empty">没有匹配的模块或功能<br><span style="font-size:11.5px;opacity:.7">试试「运镜」「收藏」「主题」</span></div>'; return; }
    let lastSec = '';
    box.innerHTML = items.map((x, i) => {
      const gh = x.group && x.group !== lastSec ? '<div class="cp-group">' + x.group + '</div>' : '';
      lastSec = x.group || lastSec;
      return gh + '<div class="cp-item' + (i === cpIdx ? ' hl' : '') + '" data-cpi="' + i + '" role="option">' +
        '<span class="cp-si">' + (ICONS[x.ico] || '▸') + '</span><b>' + hlMark(x.n, q) + '</b>' +
        (x.sub ? '<span class="cp-sub">' + esc(x.sub) + '</span>' : '') +
        (i === cpIdx ? '<span class="cp-enter">↵</span>' : '') + '</div>';
    }).join('');
  }
  function palSearch(q) {
    const ql = q.trim().toLowerCase();
    if (!ql) {
      const rec = store.get(RECENT_KEY, []).filter((id) => NAV.some((n) => n.id === id)).slice(0, 4);
      const items = [];
      rec.forEach((id) => { const n = NAV.find((x) => x.id === id); items.push({ ico: n.ico, n: n.n, sub: n.cnt || '跳转模块', go: '#/' + id, group: '最近访问' }); });
      palActs.forEach((a) => items.push({ ico: a.ico, n: a.n, sub: a.sub, act: a.act, group: '快捷操作' }));
      palRender(items, '');
      return;
    }
    const items = [];
    NAV.forEach((n) => { if ((n.n).toLowerCase().includes(ql)) items.push({ ico: n.ico, n: n.n, sub: n.cnt || '跳转模块', go: '#/' + n.id, group: '模块' }); });
    palActs.forEach((a) => { if (a.n.toLowerCase().includes(ql)) items.push({ ico: a.ico, n: a.n, sub: a.sub, act: a.act, group: '快捷操作' }); });
    SEARCH_IDX.filter((x) => (x.sec + ' ' + x.tit + ' ' + x.txt).toLowerCase().includes(ql)).slice(0, 8)
      .forEach((x) => items.push({ ico: 'cases', n: x.tit, sub: x.sec, go: x.go, group: '内容检索' }));
    palRender(items.slice(0, 14), q);
  }
  function palRun(i) {
    const it = cpList[i];
    if (!it) return;
    palClose();
    if (it.go) { if (location.hash === it.go) route(); else location.hash = it.go; }
    else if (it.act) setTimeout(it.act, 60);
  }

  /* ---------- 阅读进度 & 回到顶部 ---------- */
  function onScroll() {
    const doc = document.documentElement;
    const y = window.scrollY || doc.scrollTop;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(100, (y / max) * 100) : 0;
    const pb = $('#pbar'); if (pb) pb.style.width = p + '%';
    const tb = $('#topBtn'); if (tb) { tb.classList.toggle('show', y > 520); tb.style.setProperty('--p', Math.round(p)); }
    tocSpy();
  }

  /* ---------- 事件委托 ---------- */
  document.addEventListener('click', (e) => {
    const cam = e.target.closest('[data-camact]');
    if (cam) {
      const demo = cam.closest('.cam-demo');
      if (cam.dataset.camact === 'toggle') {
        const paused = demo.classList.toggle('paused');
        cam.textContent = paused ? '▶' : '⏸';
        const live = demo.querySelector('.cam-live');
        if (live) live.textContent = paused ? '❚❚ 已暂停' : '● 演示中';
      } else {
        demo.style.setProperty('--spd', cam.dataset.v);
        cam.parentElement.querySelectorAll('[data-camact="spd"]').forEach((b) => b.classList.toggle('on', b === cam));
      }
      return;
    }
    const cp = e.target.closest('[data-copy]');
    if (cp) { doCopy(+cp.dataset.copy, cp); return; }
    const fv = e.target.closest('[data-fav]');
    if (fv) { toggleFav(fv.dataset.fav, fv); return; }
    const ti = e.target.closest('[data-toc]');
    if (ti) {
      const it = tocEls[+ti.dataset.toc];
      if (it) {
        const top = Math.max(0, it.el.getBoundingClientRect().top + window.scrollY - 70);
        const dist = Math.abs(top - window.scrollY);
        const behavior = (matchMedia('(prefers-reduced-motion: reduce)').matches || dist > 3000) ? 'auto' : 'smooth';
        window.scrollTo({ top, behavior });
        tocSpy();
      }
      return;
    }
    const tso = e.target.closest('[data-tsort]');
    if (tso) { toolSort = toolSort === tso.dataset.tsort ? '' : tso.dataset.tsort; $$('[data-tsort]').forEach((c) => c.classList.toggle('on', c.dataset.tsort === toolSort)); renderTools(toolCat); return; }
    const sh = e.target.closest('[data-share]');
    if (sh) {
      const url = location.href.split('#')[0] + '#/' + sh.dataset.sharePage + '?hl=' + encodeURIComponent(sh.dataset.share);
      copyTextRaw(url, '🔗 深链已复制，打开即定位到该条');
      return;
    }
    if (e.target.closest('#inspBtn') || e.target.closest('#inspAgain')) { randomInsp(); return; }
    if (e.target.closest('#ckExport')) { exportCk(); return; }
    const pb = e.target.closest('[data-pbcopy]');
    if (pb) { const grp = DB.promptBank[+pb.dataset.pbcopy]; if (grp) doCopy(regCopy(grp.items.map((it) => it.cn).join('\n')), pb); return; }
    const pf = e.target.closest('[data-pbfav]');
    if (pf) { pbFavOnly = !pbFavOnly; document.querySelectorAll('[data-pbfav]').forEach((c) => c.classList.toggle('on', pbFavOnly)); renderPromptsBank(); return; }
    const cpi = e.target.closest('.cp-item');
    if (cpi) { palRun(+cpi.dataset.cpi); return; }
    const gc = e.target.closest('.chip[data-gcat]');
    if (gc) { glossaryCat = gc.dataset.gcat; renderGlossary(); return; }
    const cf = e.target.closest('.chip[data-cfilter]');
    if (cf) { document.querySelectorAll('.chip[data-cfilter]').forEach((c) => c.classList.remove('on')); cf.classList.add('on'); casesFilter = cf.dataset.cfilter; renderCasesList(); return; }
    const cv = e.target.closest('[data-camfav]');
    if (cv) { camFav = !camFav; cv.classList.toggle('on', camFav); renderCams(); return; }
    const gd = e.target.closest('[data-gdcat]');
    if (gd) { genreCat = gd.dataset.gdcat; renderGenres(); return; }
    const odCh = e.target.closest('[data-odcat]');
    if (odCh) { odCat = odCh.dataset.odcat; renderOdChannels(); return; }
    const odT = e.target.closest('[data-odtier]');
    if (odT) { odTier = +odT.dataset.odtier; $$('[data-odtier]').forEach((c) => c.classList.toggle('on', +c.dataset.odtier === odTier)); odQuoteCompute(); return; }
    if (e.target.closest('#odQuoteCopy')) { doCopy(regCopy(odQuoteStr || DB.orders.pricing.quoteTpl), document.getElementById('odQuoteCopy')); return; }
    const odc = e.target.closest('.od-ck');
    if (odc) { toggleOdCk(odc.dataset.odck, odc); return; }
    if (e.target.closest('#odReset')) { resetOdProgress(); return; }
    const eps = e.target.closest('[data-ep]');
    if (eps) { renderEp(+eps.dataset.ep); return; }
    if (e.target.closest('[data-tscore]')) { scoreTitle(); return; }
    const em = e.target.closest('.chip[data-epmode]');
    if (em) { epMode = +em.dataset.epmode; document.querySelectorAll('.chip[data-epmode]').forEach((c) => c.classList.toggle('on', c === em)); renderEpBar(); return; }
    const hg = e.target.closest('.chip[data-hgi]');
    if (hg) { const v = hg.dataset.hgi; document.querySelectorAll('#hotGrpChips .chip').forEach((c) => c.classList.toggle('on', c === hg)); document.querySelectorAll('#hotRules .rule-card').forEach((c) => { c.style.display = (v === 'all' || c.dataset.hgi === v) ? '' : 'none'; }); return; }
    const tp = e.target.closest('[data-tpl]');
    if (tp) { const inp = $('#titleInput'); if (inp) { inp.value = tp.dataset.tpl; scoreTitle(); } return; }
    const dc = e.target.closest('[data-doc]');
    if (dc) { renderDoc(+dc.dataset.doc); const v = $('.docs-view'); if (v) v.scrollTop = 0; return; }
    if (e.target.closest('[data-quiz-start]')) { quizStart(); return; }
    if (e.target.closest('[data-quiz-next]')) { quizNext(); return; }
    const qo = e.target.closest('[data-quiz-opt]');
    if (qo) { quizPick(qo.dataset.quizOpt); return; }
    if (e.target.closest('[data-rt-start]')) { rtStart(); return; }
    if (e.target.closest('[data-rt-next]')) { rtNext(); return; }
    const ro = e.target.closest('[data-rt-opt]');
    if (ro) { rtPick(+ro.dataset.rtOpt); return; }
    if (e.target.closest('[data-ft-start]')) { ftStart(); return; }
    if (e.target.closest('[data-ft-next]')) { ftNext(); return; }
    const fo = e.target.closest('[data-ft-opt]');
    if (fo) { ftPick(+fo.dataset.ftOpt); return; }
    if (e.target.closest('[data-dt-start]')) { dtStart(); return; }
    if (e.target.closest('[data-dt-back]')) { dtBack(); return; }
    if (e.target.closest('[data-dt-restart]')) { dtRestart(); return; }
    const dto = e.target.closest('[data-dt-opt]');
    if (dto) { dtPick(dto.dataset.dtOpt); return; }
    const ffc = e.target.closest('.ff-ck');
    if (ffc) { toggleFfCk(ffc.dataset.ffck, ffc); return; }
    if (e.target.closest('#ffReset')) { resetFfProgress(); return; }
    const tier = e.target.closest('[data-unit]');
    if (tier) { const inp = $('#rv-unit'); if (inp) { inp.value = tier.dataset.unit; calcCompute(); } return; }
    const go = e.target.closest('[data-go]');
    if (go) { const dest = go.dataset.go; location.hash = dest.indexOf('#/') === 0 ? dest : '#/' + dest; if (dest === current) route(); $('#searchDrop').classList.remove('show'); return; }
    const st = e.target.closest('[data-stage]');
    if (st && !e.target.closest('.pipe-step')) { renderPipeDetail(+st.dataset.stage); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const ps = e.target.closest('.pipe-step');
    if (ps) { renderPipeDetail(+ps.dataset.stage); return; }
    const ct = e.target.closest('.chip[data-cat]');
    if (ct) { renderTools(ct.dataset.cat); return; }
    const ck = e.target.closest('.ck-item');
    if (ck) {
      const id = ck.dataset.ck; const state = loadCk(); state[id] = !state[id]; saveCk(state);
      ck.classList.toggle('done', state[id]); refreshCkProgress(); return;
    }
    if (!e.target.closest('.search-box')) $('#searchDrop').classList.remove('show');
    if (!e.target.closest('#tocPanel') && !e.target.closest('#tocBtn')) { const tp = $('#tocPanel'); if (tp) tp.classList.remove('show'); }
    const kmEl = $('#kbdModal');
    if (kmEl && e.target === kmEl) kbdClose();
    const ov = cpOverlayEl();
    if (ov && e.target === ov) palClose();
  });

  /* ---------- 搜索框 ---------- */
  $('#searchInput').addEventListener('input', (e) => search(e.target.value.trim()));
  document.addEventListener('input', (e) => {
    if (e.target.closest('#sec-calc')) calcCompute();
    if (e.target.closest('#sec-firstfilm')) ffCostCompute();
    if (e.target.closest('#sec-orders')) odQuoteCompute();
    if (e.target.id === 'docSearch') renderDocToc(e.target.value.trim());
    if (e.target.id === 'toolSearch') { toolQ = e.target.value.trim(); renderTools(toolCat); }
    if (e.target.id === 'glSearch') { glQ = e.target.value.trim(); renderGlossary(); }
    if (e.target.id === 'caseSearch') { casesQ = e.target.value.trim(); renderCasesList(); }
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    const drop = $('#searchDrop');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hlList.length) return;
      hlIdx = (hlIdx + (e.key === 'ArrowDown' ? 1 : -1) + hlList.length) % hlList.length;
      drop.querySelectorAll('.sd-item').forEach((x, i) => x.classList.toggle('hl', i === hlIdx));
    } else if (e.key === 'Enter') {
      const pick = hlList[hlIdx] || hlList[0];
      if (pick) { location.hash = pick.go; drop.classList.remove('show'); }
    } else if (e.key === 'Escape') drop.classList.remove('show');
  });

  /* ---------- 全局键盘 ---------- */
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    const typing = /INPUT|TEXTAREA/.test(tag);
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      const ov = cpOverlayEl();
      if (ov && ov.hidden) palOpen(); else palClose();
      return;
    }
    if (e.key === 'Escape') {
      const ov = cpOverlayEl();
      if (ov && !ov.hidden) { palClose(); return; }
      if (typing) { document.activeElement.blur(); $('#searchDrop').classList.remove('show'); }
      return;
    }
    if (e.key === '/' && !typing) { e.preventDefault(); $('#searchInput').focus(); return; }
    const ov = cpOverlayEl();
    if (ov && !ov.hidden) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!cpList.length) return;
        cpIdx = (cpIdx + (e.key === 'ArrowDown' ? 1 : -1) + cpList.length) % cpList.length;
        $$('#cpList .cp-item').forEach((x, i) => x.classList.toggle('hl', i === cpIdx));
      } else if (e.key === 'Enter') { e.preventDefault(); palRun(cpIdx); }
    }
  });

  /* ---------- 顶栏按钮 ---------- */
  $('#themeBtn').addEventListener('click', () => cycleTheme());
  $('#paletteBtn').addEventListener('click', palOpen);
  $('#paletteHint').addEventListener('click', palOpen);
  $('#cpInput').addEventListener('input', (e) => palSearch(e.target.value));
  $('#menuBtn').addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#backdrop').classList.toggle('show', open);
  });
  $('#backdrop').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show'); });
  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#tocBtn').addEventListener('click', () => $('#tocPanel').classList.toggle('show'));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { onScroll(); const cur = document.querySelector('.sec.show'); if (cur) enhanceTables(cur); });

  /* ---------- 键盘快捷键帮助面板 ---------- */
  function kbdOpen() {
    const m = $('#kbdModal');
    if (!m) return;
    m.hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }
  function kbdClose() {
    const m = $('#kbdModal');
    if (m && m.hidden) return;
    if (m) m.hidden = true;
    document.documentElement.style.overflow = '';
  }
  document.addEventListener('keydown', (e) => {
    const km = $('#kbdModal');
    if (e.key === 'Escape' && km && !km.hidden) { kbdClose(); return; }
    const typing = /INPUT|TEXTAREA/.test(document.activeElement ? document.activeElement.tagName : '');
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '?') { e.preventDefault(); kbdOpen(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); randomInsp(); }
  });

  /* ---------- 自注册模块机制（window.MJ · 供 js/feat-*.js 外挂扩展调用） ---------- */
  let mjReady = false;
  const MJ_ON = new Set(); // 已安装模块 id
  function mjInstall(mod) {
    // 导航插入：默认排在 glossary（行业术语表）之后、docs/log 之前；after 指向不存在的 id 时回退 glossary
    let at = NAV.findIndex((x) => x.id === (mod.after || 'glossary'));
    if (at < 0) at = NAV.findIndex((x) => x.id === 'glossary');
    NAV.splice(at + 1, 0, { id: mod.id, ico: mod.icon, n: mod.name, cnt: mod.cnt });
    // 渲染器：返回 null 表示 render(el, ctx) 已自行写入 section（route() 对 null 不做 innerHTML 赋值）
    RENDERERS[mod.id] = function () {
      const sec = document.getElementById('sec-' + mod.id);
      if (sec) { mod.render(sec, MJ); if (typeof mod.mount === 'function') mod.mount(sec, MJ); }
      return null;
    };
    if (Array.isArray(mod.sub)) SECTION_SUB[mod.id] = mod.sub;
    if (Array.isArray(mod.search)) mod.search.forEach((it) =>
      SEARCH_IDX.push({ sec: mod.name, tit: it.tit, txt: String(it.txt).replace(/<[^>]+>/g, ''), go: '#/' + mod.id }));
    if (!document.getElementById('sec-' + mod.id)) {
      const s = document.createElement('section'); s.className = 'sec'; s.id = 'sec-' + mod.id; $('#app').appendChild(s);
    }
    renderNav();
    MJ_ON.add(mod.id);
    if (mjReady && current === mod.id) route();
  }
  function addModule(mod) {
    if (!mod || typeof mod !== 'object' || typeof mod.id !== 'string' || !mod.id ||
      typeof mod.name !== 'string' || !mod.name || typeof mod.icon !== 'string' || !mod.icon ||
      typeof mod.render !== 'function') {
      console.warn('[MJ] addModule 拒绝：至少需要 id / icon / name（非空字符串）与 render(el, ctx)（函数）');
      return false;
    }
    if (NAV.some((x) => x.id === mod.id) || Object.prototype.hasOwnProperty.call(RENDERERS, mod.id) ||
      MJ.modules.some((m) => m.id === mod.id)) {
      console.warn('[MJ] addModule 拒绝：id「' + mod.id + '」已存在于 NAV / RENDERERS');
      return false;
    }
    MJ.modules.push(mod);
    if (!mjReady) return true; // init 前只登记入队，init() 开头统一排水安装（兜底，同步脚本序下不会发生）
    try { mjInstall(mod); } catch (err) { console.warn('[MJ] 安装模块「' + mod.id + '」失败：', err); return false; }
    return true;
  }
  window.MJ = {
    ready: false,
    DB: window.DB,
    esc: esc,
    store: store,
    toast: toast,
    regCopy: regCopy,
    go: function (id) { location.hash = '#/' + id; },
    modules: [],
    addModule: addModule,
  };

  /* ---------- 启动 ---------- */
  function init() {
    // 自注册模块排水：MJ 未就绪期间到达的注册请求（含 __MJ_QUEUE 兜底队列）统一安装
    (Array.isArray(window.__MJ_QUEUE) ? window.__MJ_QUEUE.splice(0) : []).forEach((m) => addModule(m));
    MJ.modules.forEach((m) => { if (!MJ_ON.has(m.id)) mjInstall(m); });
    renderNav();
    renderMobNav();
    buildIndex();
    $('#sideUpdated').textContent = DB.meta.updated;
    $('#footUpdated').textContent = DB.meta.updated;
    $('#footMeta').textContent = `等约 ${DB.meta.sources} 个信源 · 累计检索 ${DB.meta.searches} 次`;
    $('#verPill').textContent = DB.meta.version + ' · 前端' + UI_VERSION;
    applyThemeNow(getThemePref());
    if (!store.get('manju_hi_v1', false)) {
      store.set('manju_hi_v1', true);
      setTimeout(() => toast('👋 欢迎来到漫剧研究平台！Ctrl+K 打开命令面板 · 按 / 全局搜索'), 900);
    }
    NAV.forEach((x) => { const s = document.createElement('section'); s.className = 'sec'; s.id = 'sec-' + x.id; $('#app').appendChild(s); });
    route();
    window.addEventListener('hashchange', route);
    onScroll();
    mjReady = true; MJ.ready = true;
  }
  init();
})();
