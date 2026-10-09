/* ============================================================
   漫剧研究学习平台 · 自注册模块：画布链路模拟器（framesim）
   ------------------------------------------------------------
   「无限画布」模块（文章+题库）的实操姊妹篇：把"逐镜连绘 + 尾帧链"
   方法论变成手感——
   · SVG 迷你无限画布：Pointer Events 拖拽平移（鼠标/触摸通吃，
     双指捏合缩放）+ 滚轮缩放 30%-300% + 右下角 +/-/复位悬浮按钮
   · 预置 6 个镜头节点（取自 DB.frameBank：首帧=a、尾帧=ok 选项、
     运镜=move），点选节点 → 侧栏显示首/尾帧描述、运镜类型与
     衔接三检查（同场景/同光线/帧差合理，可点灯自查）
   · 节点间自动连出"上一镜尾帧=下一镜首帧"贝塞尔链路 + 箭头；
     选中镜的上/下游链路高亮（青=上游流入 / 紫=下游流出），其余淡化
   · 「播放链路」：按链序逐节点脉冲高亮 + 视口自动平移跟随
   · 双击空白新建节点（接链尾）、拖动节点重排、文案就地编辑
   · 视图（平移/缩放/节点坐标/选中项）持久化 localStorage
     键 manju_framesim_v1（沿用平台 manju_*_v1 键风格）
   依赖 window.MJ 自注册机制（js/app.js），零第三方依赖、离线可用；
   样式经 <style id="fsFramesimStyle"> 注入，全部取用 style.css 既有
   CSS 变量，明暗主题自适应。
   ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'manju_framesim_v1';
  var ZMIN = 0.3, ZMAX = 3.0;        // 缩放范围 30%-300%
  var NW = 196, NH = 88;             // 节点卡世界坐标尺寸
  var GRID = 26;                     // 画布点阵间距（世界单位）

  /* ---------- 衔接三检查（模块常量，归纳自 DB.frameBank 选项 why 的视觉DNA规则） ---------- */
  var CHECKS = [
    { n: '同场景', d: '两帧共享同一空间锚点：主体、背景、道具可以变角度变景别，不能凭空换地方——进新场景必须先切镜。' },
    { n: '同光线', d: '光源方向、色温、时段保持一致：黄昏橙红不能跳成夜晚冷蓝——光线突变会被模型强行变形过渡，产出融帧鬼影。' },
    { n: '帧差合理', d: '帧差恰好定义本镜的运动类型，且 2-5 秒内可完成：过小＝静图拖时长易被判低质，过大＝运动插值崩坏。' },
  ];

  /* ---------- 增补数据区（细化补丁）：链路速查 10 条 · 字段结构对齐上方 CHECKS（n/d，另加 g 分组） ----------
     内容逐条溯源 research/*.md（出处对照见 docs/refine/framesim.md §四）；纯增量，不改动 CHECKS / PRESET_META。 */
  var mjxFramesimLinkTips = [
    { g: '帧差心法', n: '帧差即运动语言', d: '帧间差异定义运动类型：位置差→位移、表情差→情绪、景别差→推拉、构图差→转场。想要推镜，就把尾帧写成首帧的放大构图——先定运动类型，再回头写两帧。' },
    { g: '帧差心法', n: '两帧共享视觉DNA', d: '同宽高比、相近曝光、相似构图与色调、主体一致——帧差越小中间运动越干净；差距过大模型会"发明"中间内容，产出不受控的融帧。' },
    { g: '帧差心法', n: '跨度小是废片防线', d: '首尾帧两帧关联性不要太远（构图 / 位置 / 景别跨度小）——跨度太大运镜就不完整，是废片主因。' },
    { g: '帧差心法', n: '出入点精确咬合', d: '单镜片段控制在 2-5 秒；剪辑时让出入点精确落在上传的两帧上——帧与帧才算真正咬合，链路不松口。' },
    { g: '运镜口令', n: '方向+速度+目的', d: '每个运镜动词必须带方向与速度（模型没有默认速度），再补一个目的："pan left to reveal the hidden door" 优于光杆 "pan left"；用关系动词绑定主体（camera follows the cyclist）防人物滑行。' },
    { g: '运镜口令', n: '一镜最多1-2种运镜', d: '堆三个以上运镜必漂移；基座稳定前只用安全动作：慢推、轻微视差、微手持——快速环绕、甩镜、大幅转头先禁用，稳了再上。' },
    { g: '运镜口令', n: '15秒拆3镜各5秒', d: '多镜头配速口诀：每镜=1个基础运镜+1个标志性运镜，15秒拆3镜各5秒，每镜提示词以运镜动词开头——链路节点排布照此配速。' },
    { g: '链路流水线', n: '尾帧提取兜底', d: '视频供应商不返回尾帧时，用 FFmpeg 从成片末尾提取最后一帧，作下一镜的首帧参考——别让链路在缺尾帧处断掉。' },
    { g: '链路流水线', n: 'Match Cut 三选一', d: '取A镜最后帧作B镜首帧时，一句话写明衔接类型：morph（变形）/ match cut（匹配剪切）/ whip pan（甩镜）三选一，并加约束词 no extra elements, camera locked 防自由发挥。' },
    { g: '链路流水线', n: '稳定帧即锚点', d: '任一稳定帧（哪怕动作不完美）都导出作下一镜的锚点首帧，减少模型"自由发挥"；脸稳定 4 秒但 6 秒崩→保留前 4 秒或拆成两镜。' },
  ];
  /* ---------- 预置镜头元信息：取 DB.frameBank 前 6 题，蛇形排布成示例链 ---------- */
  var PRESET_META = [
    { fid: 'f1', t: '战场黄昏', x: 40, y: 40 },
    { fid: 'f2', t: '走廊跟拍', x: 300, y: 40 },
    { fid: 'f3', t: '夜战被围', x: 560, y: 40 },
    { fid: 'f4', t: '深夜来电', x: 560, y: 226 },
    { fid: 'f5', t: '雨夜街头', x: 300, y: 226 },
    { fid: 'f6', t: '废墟环绕', x: 40, y: 226 },
  ];

  /* ---------- 模块内运行时状态 ---------- */
  var MJ = null;                                   // render 时注入的 window.MJ
  var S = { nodes: [], chain: [], view: null, sel: null };
  var play = { on: false, i: -1, timer: null };    // 播放链路状态
  var animRaf = null;                              // 视口平移动画句柄
  var saveTimer = null, viewSaveTimer = null;      // 持久化防抖
  var viewEl, vpEl, edgesEl, nodesEl, sideEl, playBtn, statEl;

  /* ================= 小工具 ================= */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esc(s) { return MJ ? MJ.esc(s) : String(s); }
  function tr(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function moveShort(m) { if (!m) return '未设运镜'; return tr(String(m).split('：')[0].split(':')[0], 12); }
  function byId(id) { for (var i = 0; i < S.nodes.length; i++) if (S.nodes[i].id === id) return S.nodes[i]; return null; }

  /* ================= 默认画布（DB.frameBank 前 6 题） ================= */
  function defaults() {
    var bank = (MJ && MJ.DB && MJ.DB.frameBank) ? MJ.DB.frameBank : [];
    var nodes = [], chain = [];
    PRESET_META.forEach(function (pm) {
      var q = null;
      for (var i = 0; i < bank.length; i++) if (bank[i].id === pm.fid) { q = bank[i]; break; }
      var okOpt = null;
      if (q && Array.isArray(q.opts)) for (var j = 0; j < q.opts.length; j++) if (q.opts[j].ok) { okOpt = q.opts[j]; break; }
      nodes.push({
        id: pm.fid, from: 'bank', x: pm.x, y: pm.y,
        t: pm.t,
        f: q ? q.a : '（示例镜头）',
        l: okOpt ? okOpt.t : '（待填写尾帧）',
        m: q ? q.move : '缓慢推近',
        cks: [true, true, true],   // 题库正确选项天然满足三检查（见各题 why 文案）
      });
      chain.push(pm.fid);
    });
    return { nodes: nodes, chain: chain, view: null, sel: null };
  }

  /* ================= 持久化 ================= */
  function save() {
    if (!MJ) return;
    MJ.store.set(STORE_KEY, { v: 1, nodes: S.nodes, chain: S.chain, view: S.view, sel: S.sel });
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(); renderStat(); }, 260); }   // 增补 renderStat：随防抖保存刷新统计（改首尾帧文案后「待补文案」计数跟随）
  function scheduleViewSave() { clearTimeout(viewSaveTimer); viewSaveTimer = setTimeout(save, 260); }

  function loadState() {
    var saved = MJ ? MJ.store.get(STORE_KEY, null) : null;
    if (saved && typeof saved === 'object') {
      var nodes = Array.isArray(saved.nodes) ? saved.nodes.filter(function (n) {
        return n && typeof n.id === 'string' && isFinite(+n.x) && isFinite(+n.y);
      }) : [];
      var map = {};
      nodes.forEach(function (n) {
        n.x = +n.x; n.y = +n.y;
        n.t = String(n.t || '未命名镜头'); n.f = String(n.f || ''); n.l = String(n.l || ''); n.m = String(n.m || '');
        n.cks = (Array.isArray(n.cks) && n.cks.length === 3) ? n.cks.map(Boolean) : [false, false, false];
        map[n.id] = n;
      });
      var chain = (Array.isArray(saved.chain) ? saved.chain : [])
        .filter(function (id, i) { return map[id] && chain.indexOf(id) === i; });
      nodes.forEach(function (n) { if (chain.indexOf(n.id) < 0) chain.push(n.id); }); // 链外节点并回链尾，防脏数据
      if (chain.length) {
        var v = saved.view;
        return {
          nodes: nodes, chain: chain,
          view: (v && isFinite(+v.x) && isFinite(+v.y) && +v.s >= ZMIN && +v.s <= ZMAX)
            ? { x: +v.x, y: +v.y, s: +v.s } : null,
          sel: map[saved.sel] ? saved.sel : null,
        };
      }
    }
    return defaults();
  }

  /* ================= 样式注入（唯一 style id，明暗主题走既有变量） ================= */
  function injectStyle() {
    if (document.getElementById('fsFramesimStyle')) return;
    var css = [
      '/* js/feat-framesim.js 注入：画布链路模拟器 */',
      '.fs-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}',
      '.fs-toolbar .btn{padding:8px 16px;font-size:13px}',
      '.fs-stat{font-size:12px;color:var(--tx3);margin-left:auto}',
      '.fs-main{display:flex;gap:14px;align-items:stretch}',
      '.fs-view{position:relative;flex:1;min-width:0;height:560px;overflow:hidden;cursor:grab;',
      '  border:1px solid var(--line);border-radius:var(--r);background-color:var(--bg2);',
      '  background-image:radial-gradient(var(--line2) 1.1px,transparent 1.1px);background-size:' + GRID + 'px ' + GRID + 'px;',
      '  touch-action:none;user-select:none;-webkit-user-select:none}',
      '.fs-view:active{cursor:grabbing}',
      '.fs-view svg{position:absolute;inset:0;width:100%;height:100%;display:block}',
      '.fs-zoom{position:absolute;top:10px;left:10px;font-size:11.5px;color:var(--tx2);pointer-events:none;',
      '  background:var(--glass);border:1px solid var(--line);border-radius:8px;padding:3px 9px;backdrop-filter:blur(6px)}',
      '.fs-hint{position:absolute;bottom:10px;left:10px;max-width:62%;font-size:11px;color:var(--tx3);pointer-events:none;',
      '  background:var(--glass);border:1px solid var(--line);border-radius:8px;padding:3px 9px;backdrop-filter:blur(6px)}',
      '.fs-fabs{position:absolute;right:10px;bottom:10px;display:flex;flex-direction:column;gap:6px}',
      '.fs-fabs button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line2);background:var(--panel);',
      '  color:var(--tx2);font-size:15px;line-height:1;cursor:pointer;transition:.15s;font-family:inherit}',
      '.fs-fabs button:hover{color:var(--tx);border-color:var(--p1);transform:translateY(-1px)}',
      /* 连线 */
      '.fs-edge .bz{fill:none;stroke:var(--line2);stroke-width:2;opacity:.9;transition:opacity .2s,stroke .2s}',
      '.fs-edge .ar{fill:var(--line2);transition:fill .2s}',
      '.fs-edge.up .bz{stroke:var(--p2);stroke-width:2.4;filter:drop-shadow(0 0 3px rgba(34,211,238,.5))}',
      '.fs-edge.up .ar{fill:var(--p2)}',
      '.fs-edge.dn .bz{stroke:var(--p1);stroke-width:2.4;filter:drop-shadow(0 0 3px rgba(139,92,246,.5))}',
      '.fs-edge.dn .ar{fill:var(--p1)}',
      '.fs-edge.flow .bz{stroke-dasharray:7 6;animation:fsFlow 1s linear infinite}',
      '.fs-edge.dim{opacity:.22}',
      '.fs-edge.done .bz{stroke:var(--ok);opacity:.95}',
      '.fs-edge.done .ar{fill:var(--ok)}',
      '@keyframes fsFlow{to{stroke-dashoffset:-13}}',
      /* 节点卡 */
      '.fs-node{cursor:pointer}',
      '.fs-node .fs-nin{transition:opacity .2s}',
      '.fs-node .fs-nb{fill:var(--panel);stroke:var(--line2);stroke-width:1.5;transition:stroke .2s}',
      '.fs-node .fs-nbadge{fill:var(--p1)}',
      '.fs-node .fs-nnum{fill:#fff;font-size:12px;font-weight:800}',
      '.fs-node .fs-nt{fill:var(--tx);font-size:12.5px;font-weight:700}',
      '.fs-node .fs-nm{fill:var(--tx2);font-size:10px}',
      '.fs-node .fs-ff{fill:var(--p2);stroke:var(--p2);stroke-width:1;fill-opacity:.14}',
      '.fs-node .fs-lf{fill:var(--gold);stroke:var(--gold);stroke-width:1;fill-opacity:.14}',
      '.fs-node .fs-fl{fill:var(--tx2);font-size:9.5px}',
      '.fs-node .fs-fa{stroke:var(--tx3);stroke-width:1.6;fill:none;stroke-linecap:round}',
      '.fs-node .fs-ckd{fill:var(--ok)}',
      '.fs-node .fs-ckd.off{fill:var(--line2)}',
      '.fs-node.dim{opacity:.26}',
      '.fs-node.up .fs-nb{stroke:var(--p2)}',
      '.fs-node.up .fs-nbadge{fill:var(--p2)}',
      '.fs-node.dn .fs-nb{stroke:var(--p1)}',
      '.fs-node.dn .fs-nbadge{fill:var(--p1)}',
      '.fs-node.sel .fs-nb{stroke:var(--gold);stroke-width:2;filter:drop-shadow(0 0 7px rgba(245,185,66,.45))}',
      '.fs-node.sel .fs-nbadge{fill:var(--gold)}',
      '.fs-node.play .fs-nb{stroke:var(--ok);stroke-width:2.2;filter:drop-shadow(0 0 9px rgba(52,211,153,.6))}',
      '.fs-node.play .fs-nbadge{fill:var(--ok)}',
      '.fs-node.play .fs-nin{transform-box:fill-box;transform-origin:center;animation:fsPulse .9s ease-in-out infinite}',
      '@keyframes fsPulse{0%{transform:scale(1)}35%{transform:scale(1.07)}100%{transform:scale(1)}}',
      /* 侧栏 */
      '.fs-side{width:320px;flex-shrink:0;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);',
      '  padding:16px;overflow-y:auto;max-height:560px}',
      '.fs-sh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.fs-shn{font-size:11px;font-weight:800;color:#fff;background:var(--grad);border-radius:7px;padding:2px 8px;flex-shrink:0}',
      '.fs-sh b{font-size:15px}',
      '.fs-shnav{margin-left:auto;display:flex;gap:6px}',
      '.fs-navb{font-size:11px;color:var(--tx2);background:var(--panel2);border:1px solid var(--line);border-radius:8px;',
      '  padding:3px 8px;cursor:pointer;font-family:inherit;transition:.15s}',
      '.fs-navb:hover{color:var(--tx);border-color:var(--p1)}',
      '.fs-pos{font-size:11.5px;color:var(--tx3);margin-top:6px}',
      '.fs-fl2{display:block;font-size:11px;font-weight:800;letter-spacing:.5px;color:var(--tx3);margin:12px 0 5px}',
      '.fs-ta,.fs-ti{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:9px;color:var(--tx);',
      '  font-family:inherit;font-size:12.8px;line-height:1.6;padding:8px 10px;outline:none;resize:vertical;transition:.15s}',
      '.fs-ta:focus,.fs-ti:focus{border-color:var(--p1);box-shadow:0 0 0 3px rgba(139,92,246,.14)}',
      '.fs-ta::placeholder,.fs-ti::placeholder{color:var(--tx3)}',
      '.fs-cks{margin-top:14px;border:1px solid var(--line);border-radius:11px;overflow:hidden}',
      '.fs-cks-t{font-size:12px;font-weight:800;padding:9px 12px;background:var(--panel2);',
      '  display:flex;justify-content:space-between;align-items:center;gap:6px}',
      '.fs-cks-t span{font-size:10px;color:var(--tx3);font-weight:500}',
      '.fs-ck{display:flex;gap:10px;padding:10px 12px;border-top:1px solid var(--line);cursor:pointer;transition:.15s}',
      '.fs-ck:hover{background:var(--panel2)}',
      '.fs-ck i{flex-shrink:0;width:13px;height:13px;border-radius:50%;margin-top:4px;background:var(--line2);transition:.2s}',
      '.fs-ck.on i{background:var(--ok);box-shadow:0 0 8px rgba(52,211,153,.6)}',
      '.fs-ck b{font-size:12.5px;display:block}',
      '.fs-ck.on b{color:var(--ok)}',
      '.fs-ck span{font-size:11.3px;color:var(--tx3);line-height:1.55;display:block;margin-top:2px}',
      '.fs-sbtns{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}',
      '.fs-sbtns .btn{padding:7px 13px;font-size:12px}',
      '.fs-delb{color:var(--hot)!important;border-color:rgba(244,63,94,.35)!important}',
      /* 侧栏引导卡（未选中态） */
      '.fs-gd b{font-size:14px}',
      '.fs-gi{display:flex;gap:9px;font-size:12.6px;color:var(--tx2);margin-top:10px;line-height:1.6}',
      '.fs-lgd{margin-top:14px;border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:7px;',
      '  font-size:11.6px;color:var(--tx2)}',
      '.fs-lgd i{display:inline-block;width:18px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}',
      '.lg-up{background:var(--p2)}',
      '.lg-dn{background:var(--p1)}',
      '.fs-gnote{margin-top:12px;font-size:11px;color:var(--tx3);line-height:1.6}',
      /* 移动端 */
      '@media(max-width:960px){.fs-main{flex-direction:column}.fs-view{height:440px}.fs-side{width:100%;max-height:none}}',
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'fsFramesimStyle';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ================= 增补样式（细化补丁）：仅新增类，全部 mjx-framesim- 前缀，取用既有 CSS 变量 ================= */
  function mjxFramesimInjectStyle() {
    if (document.getElementById('mjxFramesimStyle')) return;
    var st = document.createElement('style');
    st.id = 'mjxFramesimStyle';
    st.textContent = [
      '/* js/feat-framesim.js 增补注入：链路速查卡 / 整链复制 / 运镜口令提示 */',
      '.mjx-framesim-tips{margin-top:14px;border:1px dashed var(--line2);border-radius:11px;background:var(--panel2)}',
      '.mjx-framesim-tips summary{cursor:pointer;font-size:12px;font-weight:800;color:var(--tx2);padding:10px 12px;user-select:none;list-style:none}',
      '.mjx-framesim-tips summary::-webkit-details-marker{display:none}',
      '.mjx-framesim-tips summary::before{content:"▸ ";color:var(--p1)}',
      '.mjx-framesim-tips[open] summary::before{content:"▾ "}',
      '.mjx-framesim-tips summary:hover{color:var(--tx)}',
      '.mjx-framesim-tg{display:block;font-size:10.5px;font-weight:800;letter-spacing:.5px;color:var(--tx3);margin:2px 12px 2px;border-top:1px dashed var(--line);padding-top:8px}',
      '.mjx-framesim-ti{padding:7px 12px;font-size:11.8px;color:var(--tx2);line-height:1.65}',
      '.mjx-framesim-ti b{color:var(--tx);margin-right:4px}',
      '.mjx-framesim-movehint{font-size:11.3px;color:var(--tx3);line-height:1.6;margin:5px 0 0}',
      '.mjx-framesim-copyall{padding:5px 11px!important;font-size:11.5px!important;margin-left:8px;white-space:nowrap}',
    ].join('\n');
    document.head.appendChild(st);
  }
  /* ================= 几何：贝塞尔链路与箭头 ================= */
  function anchor(a, b) {
    var acx = a.x + NW / 2, acy = a.y + NH / 2;
    var bcx = b.x + NW / 2, bcy = b.y + NH / 2;
    var dx = bcx - acx, dy = bcy - acy;
    if (Math.abs(dx) >= Math.abs(dy)) {
      var sx = dx >= 0 ? a.x + NW : a.x;
      var ex = dx >= 0 ? b.x : b.x + NW;
      var k = Math.max(36, Math.abs(dx) * 0.42);
      return { x1: sx, y1: acy, x2: ex, y2: bcy, c1x: sx + (dx >= 0 ? k : -k), c1y: acy, c2x: ex + (dx >= 0 ? -k : k), c2y: bcy };
    }
    var sy = dy >= 0 ? a.y + NH : a.y;
    var ey = dy >= 0 ? b.y : b.y + NH;
    var k2 = Math.max(36, Math.abs(dy) * 0.42);
    return { x1: acx, y1: sy, x2: bcx, y2: ey, c1x: acx, c1y: sy + (dy >= 0 ? k2 : -k2), c2x: bcx, c2y: ey + (dy >= 0 ? -k2 : k2) };
  }
  function edgeSvg(p, cls) {
    var ang = Math.atan2(p.y2 - p.c2y, p.x2 - p.c2x);
    var dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    var bx = p.x2 - 10 * dx, by = p.y2 - 10 * dy;
    var d = 'M' + p.x1 + ' ' + p.y1 +
      ' C' + p.c1x + ' ' + p.c1y + ' ' + p.c2x + ' ' + p.c2y + ' ' + p.x2 + ' ' + p.y2;
    var ar = 'M' + p.x2 + ' ' + p.y2 +
      ' L' + (bx + 4.5 * px) + ' ' + (by + 4.5 * py) +
      ' L' + (bx - 4.5 * px) + ' ' + (by - 4.5 * py) + ' Z';
    return '<g class="' + cls + '"><path class="bz" d="' + d + '"/><path class="ar" d="' + ar + '"/></g>';
  }
  function nodeSvg(n, num, cls) {
    var dots = '';
    for (var i = 0; i < 3; i++) dots += '<circle class="fs-ckd' + (n.cks[i] ? '' : ' off') + '" cx="' + (128 + i * 14) + '" cy="66" r="3.5"/>';
    return '<g class="' + cls + '" data-nid="' + n.id + '" transform="translate(' + n.x + ' ' + n.y + ')">' +
      '<title>S' + num + ' · ' + esc(n.t) + '（衔接三检查：同场景 / 同光线 / 帧差合理）</title>' +
      '<g class="fs-nin">' +
      '<rect class="fs-nb" width="' + NW + '" height="' + NH + '" rx="13"/>' +
      '<circle class="fs-nbadge" cx="21" cy="21" r="11"/>' +
      '<text class="fs-nnum" x="21" y="25.5" text-anchor="middle">' + num + '</text>' +
      '<text class="fs-nt" x="40" y="25.5">' + esc(tr(n.t, 9)) + '</text>' +
      '<text class="fs-nm" x="14" y="46">🎥 ' + esc(moveShort(n.m)) + '</text>' +
      '<rect class="fs-ff" x="14" y="55" width="36" height="22" rx="6"/>' +
      '<text class="fs-fl" x="32" y="70" text-anchor="middle">首</text>' +
      '<path class="fs-fa" d="M54 66 L69 66 M64.5 62 L69 66 L64.5 70"/>' +
      '<rect class="fs-lf" x="73" y="55" width="36" height="22" rx="6"/>' +
      '<text class="fs-fl" x="91" y="70" text-anchor="middle">尾</text>' +
      dots +
      '</g></g>';
  }

  /* ================= 增补渲染（细化补丁）：链路速查卡 / 整链导出文案 ================= */
  function mjxFramesimTipsHtml() {
    var groups = [], gis = {};
    mjxFramesimLinkTips.forEach(function (t) {
      if (!gis[t.g]) { gis[t.g] = []; groups.push(t.g); }
      gis[t.g].push('<div class="mjx-framesim-ti"><b>' + esc(t.n) + '</b>' + esc(t.d) + '</div>');
    });
    var body = groups.map(function (g) {
      return '<b class="mjx-framesim-tg">' + esc(g) + '</b>' + gis[g].join('');
    }).join('');
    return '<details class="mjx-framesim-tips"><summary>📖 链路速查 · ' + mjxFramesimLinkTips.length +
      ' 条实战要领（点开）</summary>' + body + '</details>';
  }
  function mjxFramesimChainText() {
    if (!S.chain.length) return '';
    var L = ['【链路模拟器 · 整条尾帧链导出（共 ' + S.chain.length + ' 镜）】'];
    L.push('链路总览：' + S.chain.map(function (id, i) {
      var n = byId(id);
      return 'S' + (i + 1) + (n && n.t ? ' ' + n.t : '');
    }).join(' → '));
    S.chain.forEach(function (id, i) {
      var n = byId(id);
      if (!n) return;
      L.push('——');
      L.push('【S' + (i + 1) + ' · ' + (n.t || '未命名镜头') + '】');
      L.push('首帧：' + (n.f || '（待填写）'));
      L.push('运镜：' + (n.m || '（待填写）'));
      L.push('尾帧：' + (n.l || '（待填写）'));
      L.push('衔接三检查：' + n.cks.map(function (c, j) { return CHECKS[j].n + (c ? '✓' : '✗'); }).join(' '));
    });
    L.push('——');
    L.push('使用提醒：上一镜尾帧 = 下一镜首帧；分段首尾帧统一做一致性校准再开拍；逐镜生成时上一镜成品即下一镜的参考图。');
    return L.join('\n');
  }
  /* ================= 渲染：画布 / 侧栏 / 统计 ================= */
  function renderEdges() {
    var selIdx = S.sel ? S.chain.indexOf(S.sel) : -1;
    var html = '';
    for (var i = 0; i < S.chain.length - 1; i++) {
      var a = byId(S.chain[i]), b = byId(S.chain[i + 1]);
      if (!a || !b) continue;
      var cls = 'fs-edge';
      if (play.on) {
        if (i < play.i) { cls += ' done'; if (i === play.i - 1) cls += ' flow'; }
        else cls += ' dim';
      } else if (selIdx >= 0) {
        if (i === selIdx - 1) cls += ' up flow';       // 上游流入：上一镜尾帧 → 本镜首帧
        else if (i === selIdx) cls += ' dn flow';      // 下游流出：本镜尾帧 → 下一镜首帧
        else cls += ' dim';
      }
      html += edgeSvg(anchor(a, b), cls);
    }
    edgesEl.innerHTML = html;
  }
  function renderNodes() {
    var selIdx = S.sel ? S.chain.indexOf(S.sel) : -1;
    var html = '';
    S.chain.forEach(function (id, i) {
      var n = byId(id);
      if (!n) return;
      var cls = 'fs-node';
      if (play.on) {
        if (i === play.i) cls += ' play';
        else if (i > play.i) cls += ' dim';
      } else if (selIdx >= 0) {
        if (i === selIdx) cls += ' sel';
        else if (i === selIdx - 1) cls += ' up';
        else if (i === selIdx + 1) cls += ' dn';
        else cls += ' dim';
      }
      html += nodeSvg(n, i + 1, cls);
    });
    nodesEl.innerHTML = html;
  }
  function renderStat() {
    if (!statEl) return;
    var miss = 0, dim = 0;   // miss=首/尾帧未填齐的镜头数；dim=三检查未点亮的灯数
    S.chain.forEach(function (id) {
      var n = byId(id);
      if (!n) return;
      if (!n.f || !n.l) miss++;
      n.cks.forEach(function (c) { if (!c) dim++; });
    });
    var btn = '';
    if (S.chain.length) {
      btn = ' <button class="btn ghost mjx-framesim-copyall" data-copy="' + MJ.regCopy(mjxFramesimChainText()) + '">📋 复制整链</button>';
    }
    statEl.innerHTML = '共 ' + S.chain.length + ' 镜 · ' +
      ((miss || dim) ? '待补文案 ' + miss + ' 镜 · 检查未亮 ' + dim : '全链三检查已亮 ✓') +
      ' · 自动保存本地' + btn;
  }
  function renderCanvas() { renderEdges(); renderNodes(); renderStat(); }

  function copyTextOf(n, num) {
    var cks = n.cks.map(function (c, i) { return CHECKS[i].n + (c ? '✓' : '✗'); }).join(' ');
    return ['【S' + num + ' · ' + n.t + '】',
      '首帧：' + (n.f || '（待填写）'),
      '运镜：' + (n.m || '（待填写）'),
      '尾帧：' + (n.l || '（待填写）'),
      '衔接三检查：' + cks,
      '—— 上一镜尾帧 = 下一镜首帧（尾帧链）'].join('\n');
  }

  function renderSide() {
    mjxFramesimInjectStyle();   // 增补样式按需注入（幂等，函数内有 getElementById 守卫）
    var n = byId(S.sel);
    if (!n) {
      sideEl.innerHTML =
        '<div class="fs-gd"><b>🎯 试试这样玩</b>' +
        '<div class="fs-gi">🖱️<span>按住空白处拖动平移画布；滚轮或双指捏合缩放（30%–300%），右下角按钮微调与复位。</span></div>' +
        '<div class="fs-gi">👆<span>点选镜头节点：查看首帧 / 尾帧描述、运镜类型与衔接三检查；青色＝上游链路、紫色＝下游链路，即帧的流向。</span></div>' +
        '<div class="fs-gi">✍️<span>双击画布空白新建镜头（自动接到链尾），拖动节点重排走线；首尾帧与运镜文案可直接在下面改。</span></div>' +
        '<div class="fs-gi">▶️<span>点「播放链路」：视口自动跟随，按连绘顺序逐镜走一遍尾帧链。</span></div>' +
        '<div class="fs-lgd"><span><i class="lg-up"></i>上游链路：上一镜尾帧 → 本镜首帧</span>' +
        '<span><i class="lg-dn"></i>下游链路：本镜尾帧 → 下一镜首帧</span></div>' +
        '<div class="fs-gnote">📌 规则速记（对应「无限画布」七步实操第五步）：两帧共享视觉DNA（同场景 / 同光线），帧差定义运动类型，单镜 2-5 秒。<br>💾 视图与编辑实时保存在本机浏览器（manju_framesim_v1），「恢复默认画布」可随时重置。</div></div>' +
        mjxFramesimTipsHtml();
      return;
    }
    var idx = S.chain.indexOf(n.id);
    var num = idx + 1;
    var copyId = MJ.regCopy(copyTextOf(n, num));
    sideEl.innerHTML =
      '<div class="fs-sh"><span class="fs-shn">S' + num + '</span><b>' + esc(n.t) + '</b>' +
      '<span class="fs-shnav">' +
      (idx > 0 ? '<button class="fs-navb" data-fsnav="-1">◀ 上一镜</button>' : '') +
      (idx < S.chain.length - 1 ? '<button class="fs-navb" data-fsnav="1">下一镜 ▶</button>' : '') +
      '</span></div>' +
      '<div class="fs-pos">链路位置 ' + num + ' / ' + S.chain.length +
      (idx > 0 ? ' · 上游 ' + idx + ' 镜' : ' · 链首') +
      (idx < S.chain.length - 1 ? ' · 下游 ' + (S.chain.length - 1 - idx) + ' 镜' : ' · 链尾') + '</div>' +
      '<label class="fs-fl2">🖼️ 首帧（本镜起点）</label>' +
      '<textarea class="fs-ta" data-fsf="f" rows="3" placeholder="例：战场黄昏全景，主角持剑立于尸山之巅…">' + esc(n.f) + '</textarea>' +
      '<label class="fs-fl2">🎬 运镜类型</label>' +
      '<input class="fs-ti" data-fsf="m" value="' + esc(n.m) + '" placeholder="例：缓慢推近 / 横移跟随 / 环绕 180°…">' +
      '<p class="mjx-framesim-movehint">🎯 口令公式：运镜动词＋方向＋速度＋目的（模型没有默认速度）；一镜最多 1-2 种运镜，堆多必漂移。</p>' +
      '<label class="fs-fl2">🖼️ 尾帧（→ 下一镜首帧）</label>' +
      '<textarea class="fs-ta" data-fsf="l" rows="3" placeholder="例：推到主角怒视的面部特写，天际线仍是橙红…">' + esc(n.l) + '</textarea>' +
      '<div class="fs-cks"><div class="fs-cks-t">衔接三检查<span>点灯自查 · 本镜首帧 → 尾帧</span></div>' +
      CHECKS.map(function (c, i) {
        return '<div class="fs-ck' + (n.cks[i] ? ' on' : '') + '" data-fsck="' + i + '"><i></i><div><b>' + c.n + '</b><span>' + c.d + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="fs-sbtns"><button class="btn ghost" data-copy="' + copyId + '">📋 复制本镜提示词</button>' +
      '<button class="btn ghost fs-delb" data-fsdel="1">🗑 移除本镜</button></div>' +
      mjxFramesimTipsHtml();
    sideEl.scrollTop = 0;
  }

  /* ================= 视口：应用 / 缩放 / 适配 / 动画 ================= */
  function applyView() {
    var v = S.view || { x: 0, y: 0, s: 1 };
    vpEl.setAttribute('transform', 'translate(' + v.x + ' ' + v.y + ') scale(' + v.s + ')');
    viewEl.style.backgroundSize = (GRID * v.s) + 'px ' + (GRID * v.s) + 'px';
    viewEl.style.backgroundPosition = v.x + 'px ' + v.y + 'px';
    var z = document.getElementById('fsZoomTxt');
    if (z) z.textContent = Math.round(v.s * 100) + '%';
  }
  function zoomTo(mx, my, ns, wx, wy) {
    S.view.s = ns;
    S.view.x = mx - wx * ns;
    S.view.y = my - wy * ns;
    applyView(); scheduleViewSave();
  }
  function zoomStep(f) {
    var r = viewEl.getBoundingClientRect();
    if (!r.width) return;
    var mx = r.width / 2, my = r.height / 2;
    zoomTo(mx, my, clamp(S.view.s * f, ZMIN, ZMAX), (mx - S.view.x) / S.view.s, (my - S.view.y) / S.view.s);
  }
  function fit(animate) {
    var r = viewEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (!S.view) S.view = { x: 0, y: 0, s: 1 };
    if (!S.nodes.length) {
      S.view = { x: r.width / 2, y: r.height / 2, s: 1 };
      applyView(); return;
    }
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    S.nodes.forEach(function (n) {
      minx = Math.min(minx, n.x); miny = Math.min(miny, n.y);
      maxx = Math.max(maxx, n.x + NW); maxy = Math.max(maxy, n.y + NH);
    });
    var bw = Math.max(1, maxx - minx), bh = Math.max(1, maxy - miny);
    var s = clamp(Math.min((r.width - 90) / bw, (r.height - 90) / bh), ZMIN, 1.4);
    var tx = (r.width - bw * s) / 2 - minx * s;
    var ty = (r.height - bh * s) / 2 - miny * s;
    if (animate) animateView(tx, ty, 450);
    else { S.view.x = tx; S.view.y = ty; S.view.s = s; }
    applyView();
  }
  function animateView(tx, ty, ms) {
    cancelAnimationFrame(animRaf);
    var sx = S.view.x, sy = S.view.y, t0 = performance.now();
    function fr(t) {
      var p = Math.min(1, (t - t0) / ms);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;  // easeInOutCubic
      S.view.x = sx + (tx - sx) * e;
      S.view.y = sy + (ty - sy) * e;
      applyView();
      if (p < 1) animRaf = requestAnimationFrame(fr);
    }
    animRaf = requestAnimationFrame(fr);
  }
  function centerOn(n, ms) {
    var r = viewEl.getBoundingClientRect();
    if (!r.width) return;
    var s = S.view.s;
    animateView(r.width / 2 - (n.x + NW / 2) * s, r.height / 2 - (n.y + NH / 2) * s, ms);
  }

  /* ================= 选择 / 编辑 / 播放 ================= */
  function selectNode(id) {
    S.sel = id;
    renderCanvas(); renderSide(); save();
  }
  function toggleCk(i) {
    var n = byId(S.sel);
    if (!n) return;
    n.cks[i] = !n.cks[i];
    renderNodes(); renderStat(); renderSide(); save();   // 增补 renderStat：点灯后统计区「检查未亮」即时刷新
  }
  function addNode(x, y) {
    var n = {
      id: 'u' + Date.now().toString(36), from: 'user',
      x: Math.round(x), y: Math.round(y),
      t: '自定义镜头', f: '', l: '', m: '', cks: [false, false, false],
    };
    S.nodes.push(n); S.chain.push(n.id);
    S.sel = n.id;
    renderCanvas(); renderSide(); save();
    MJ.toast('已新建镜头并接到链尾，在右侧填写首尾帧');
  }
  function addAtCenter() {
    var r = viewEl.getBoundingClientRect();
    if (!r.width) return;
    addNode((r.width / 2 - S.view.x) / S.view.s - NW / 2, (r.height / 2 - S.view.y) / S.view.s - NH / 2);
  }
  function removeNode() {
    var n = byId(S.sel);
    if (!n) return;
    var t = n.t;
    S.chain = S.chain.filter(function (id) { return id !== n.id; });
    S.nodes = S.nodes.filter(function (m) { return m.id !== n.id; });
    S.sel = null;
    renderCanvas(); renderSide(); save();
    MJ.toast('已移除「' + t + '」');
  }
  function resetAll() {
    playStop();
    var d = defaults();
    S.nodes = d.nodes; S.chain = d.chain; S.sel = null; S.view = { x: 0, y: 0, s: 1 };
    renderCanvas(); renderSide(); save();
    requestAnimationFrame(function () { fit(false); save(); });
    MJ.toast('⟲ 已恢复默认画布（6 个题库镜头）');
  }

  function togglePlay() {
    if (play.on) { playStop(); return; }
    if (S.chain.length < 2) { MJ.toast('链路上至少需要 2 个镜头才能播放'); return; }
    play.on = true; play.i = -1;
    playBtn.textContent = '⏹ 停止播放';
    playStep();
  }
  function playStep() {
    play.i++;
    if (play.i >= S.chain.length) { playStop(); MJ.toast('✓ 链路播放完毕（共 ' + S.chain.length + ' 镜）'); return; }
    S.sel = S.chain[play.i];
    renderCanvas(); renderSide(); save();
    var n = byId(S.sel);
    if (n) centerOn(n, 620);
    play.timer = setTimeout(playStep, 1250);
  }
  function playStop() {
    if (!play.on) return;
    play.on = false; play.i = -1;
    clearTimeout(play.timer);
    if (playBtn) playBtn.textContent = '▶ 播放链路';
    renderCanvas();
  }

  /* ================= 指针手势：平移 / 节点拖拽 / 双指缩放 ================= */
  var ptrs = new Map();
  var gest = null;

  function ptrDist(p1, p2) { var dx = p1.x - p2.x, dy = p1.y - p2.y; return Math.sqrt(dx * dx + dy * dy) || 1; }

  function onDown(e) {
    if (e.target.closest && e.target.closest('.fs-fabs')) return;  // 悬浮按钮走原生 click，不进画布手势
    if (play.on) playStop();
    if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
    try { viewEl.setPointerCapture(e.pointerId); } catch (err) { }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      var pts = Array.from(ptrs.values());
      gest = {
        mode: 'pinch',
        d0: ptrDist(pts[0], pts[1]), s0: S.view.s,
        mx: (pts[0].x + pts[1].x) / 2, my: (pts[0].y + pts[1].y) / 2,
        vx: S.view.x, vy: S.view.y,
      };
      e.preventDefault();
      return;
    }
    var ng = e.target && e.target.closest ? e.target.closest('.fs-node') : null;
    if (ng) {
      var n = byId(ng.getAttribute('data-nid'));
      if (n) gest = { mode: 'node', id: n.id, moved: false, sx: e.clientX, sy: e.clientY, nx: n.x, ny: n.y };
    } else {
      gest = { mode: 'pan', moved: false, sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y };
    }
    e.preventDefault();
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gest) return;
    if (gest.mode === 'pinch' && ptrs.size >= 2) {
      var pts = Array.from(ptrs.values());
      var r = viewEl.getBoundingClientRect();
      var ns = clamp(gest.s0 * ptrDist(pts[0], pts[1]) / gest.d0, ZMIN, ZMAX);
      var mx = (pts[0].x + pts[1].x) / 2 - r.left, my = (pts[0].y + pts[1].y) / 2 - r.top;
      // 初始中指下的世界点始终吸附到当前中指位置（缩放+平移一次完成）
      var wx = (gest.mx - r.left - gest.vx) / gest.s0, wy = (gest.my - r.top - gest.vy) / gest.s0;
      zoomTo(mx, my, ns, wx, wy);
      return;
    }
    var dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) gest.moved = true;
    if (gest.mode === 'pan') {
      S.view.x = gest.vx + dx; S.view.y = gest.vy + dy;
      applyView(); scheduleViewSave();
    } else if (gest.mode === 'node') {
      var n = byId(gest.id);
      if (!n) return;
      n.x = Math.round(gest.nx + dx / S.view.s);
      n.y = Math.round(gest.ny + dy / S.view.s);
      var el = nodesEl.querySelector('[data-nid="' + gest.id + '"]');
      if (el) el.setAttribute('transform', 'translate(' + n.x + ' ' + n.y + ')');
      renderEdges(); scheduleSave();
    }
  }
  function onUp(e) {
    ptrs.delete(e.pointerId);
    if (!gest) return;
    if (gest.mode === 'pinch') {
      if (ptrs.size === 1) {
        var p = Array.from(ptrs.values())[0];
        gest = { mode: 'pan', moved: true, sx: p.x, sy: p.y, vx: S.view.x, vy: S.view.y };
      } else if (ptrs.size === 0) gest = null;
      return;
    }
    if (gest.mode === 'node') {
      if (!gest.moved) selectNode(gest.id);
      else { save(); }
    } else if (gest.mode === 'pan' && !gest.moved) {
      selectNode(null);   // 点空白取消选中
    }
    if (ptrs.size === 0) gest = null;
  }

  /* ================= 注册与渲染入口 ================= */
  function render(el, ctx) {
    MJ = ctx;
    injectStyle();
    S = loadState();
    var hasSavedView = !!S.view;
    if (!S.view) S.view = { x: 0, y: 0, s: 1 };   // 首帧前兜底，rAF 里再做自适应全览
    el.innerHTML =
      '<div class="fs-toolbar">' +
      '<button class="btn pri" id="fsPlay">▶ 播放链路</button>' +
      '<button class="btn ghost" id="fsAdd">＋ 新建镜头</button>' +
      '<button class="btn ghost" id="fsReset">⟲ 恢复默认画布</button>' +
      '<span class="fs-stat" id="fsStat"></span>' +
      '</div>' +
      '<div class="fs-main">' +
      '<div class="fs-view" id="fsView">' +
      '<svg id="fsSvg">' +
      '<g id="fsVp"><g id="fsEdges"></g><g id="fsNodes"></g></g>' +
      '</svg>' +
      '<div class="fs-zoom" id="fsZoomTxt">100%</div>' +
      '<div class="fs-hint">拖空白平移 · 滚轮/双指缩放 · 双击空白新建 · 拖镜头重排</div>' +
      '<div class="fs-fabs">' +
      '<button id="fsZin" title="放大">＋</button>' +
      '<button id="fsZout" title="缩小">－</button>' +
      '<button id="fsFit" title="复位视图（显示全部镜头）">⤢</button>' +
      '</div>' +
      '</div>' +
      '<aside class="fs-side" id="fsSide"></aside>' +
      '</div>' +
      '<p class="mini-note">📦 节点文案取自「无限画布」模块的<a data-go="canvas" style="color:var(--p2);cursor:pointer">首尾帧转场题库</a>（DB.frameBank f1-f6：首帧＝题面 a、尾帧＝正确选项、运镜＝move）；衔接三检查规则归纳自题库 why 文案。本模块与「无限画布」互为实操与理论。</p>';

    viewEl = el.querySelector('#fsView');
    vpEl = el.querySelector('#fsVp');
    edgesEl = el.querySelector('#fsEdges');
    nodesEl = el.querySelector('#fsNodes');
    sideEl = el.querySelector('#fsSide');
    playBtn = el.querySelector('#fsPlay');
    statEl = el.querySelector('#fsStat');

    /* -- 模块内按钮/侧栏交互（复制按钮走平台 [data-copy] 文档级委托，跳转走 [data-go]） -- */
    el.addEventListener('click', function (e) {
      var ck = e.target.closest ? e.target.closest('[data-fsck]') : null;
      if (ck) { toggleCk(+ck.getAttribute('data-fsck')); return; }
      if (e.target.closest && e.target.closest('[data-fsdel]')) { removeNode(); return; }
      var nv = e.target.closest ? e.target.closest('[data-fsnav]') : null;
      if (nv) {
        var i = S.chain.indexOf(S.sel), j = i + (+nv.getAttribute('data-fsnav'));
        if (i >= 0 && j >= 0 && j < S.chain.length) selectNode(S.chain[j]);
        return;
      }
      if (e.target.closest('#fsPlay')) { togglePlay(); return; }
      if (e.target.closest('#fsAdd')) { addAtCenter(); return; }
      if (e.target.closest('#fsReset')) { resetAll(); return; }
      if (e.target.closest('#fsZin')) { zoomStep(1.25); return; }
      if (e.target.closest('#fsZout')) { zoomStep(1 / 1.25); return; }
      if (e.target.closest('#fsFit')) { fit(true); save(); return; }
    });

    /* -- 侧栏文案就地编辑（首帧 f / 运镜 m / 尾帧 l） -- */
    el.addEventListener('input', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-fsf');
      if (!f || !S.sel) return;
      var n = byId(S.sel);
      if (!n) return;
      n[f] = e.target.value;
      if (f === 'm') renderNodes();   // 节点卡上的运镜摘要同步
      scheduleSave();
    });

    /* -- 画布指针手势（Pointer Events：鼠标/触摸/触控笔通吃） -- */
    viewEl.addEventListener('pointerdown', onDown);
    viewEl.addEventListener('pointermove', onMove);
    viewEl.addEventListener('pointerup', onUp);
    viewEl.addEventListener('pointercancel', onUp);

    /* -- 滚轮缩放（30%-300%，以光标为锚点） -- */
    viewEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (play.on) playStop();
      var r = viewEl.getBoundingClientRect();
      var dY = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      var ns = clamp(S.view.s * Math.exp(-dY * 0.0016), ZMIN, ZMAX);
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      zoomTo(mx, my, ns, (mx - S.view.x) / S.view.s, (my - S.view.y) / S.view.s);
    }, { passive: false });

    /* -- 双击空白新建镜头（自动接链尾并选中编辑） -- */
    viewEl.addEventListener('dblclick', function (e) {
      if (e.target.closest && (e.target.closest('.fs-node') || e.target.closest('.fs-fabs'))) return;
      var r = viewEl.getBoundingClientRect();
      addNode((e.clientX - r.left - S.view.x) / S.view.s - NW / 2, (e.clientY - r.top - S.view.y) / S.view.s - NH / 2);
    });

    /* -- 播放中按 Esc 停止 -- */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && play.on) playStop();
    });

    renderCanvas();
    renderSide();

    /* -- 初始视口：优先恢复保存的视图；否则一帧后（section 已 .show）自适应全览 -- */
    requestAnimationFrame(function () {
      if (hasSavedView) applyView();
      else fit(false);
      save();
    });
  }

  /* ================= 模块元数据与自注册 ================= */
  var mod = {
    id: 'framesim',
    icon: '🎞️',
    name: '链路模拟器',
    cnt: '实操',
    sub: ['画布链路模拟器', '「无限画布」的实操姊妹篇：把"逐镜连绘 + 尾帧链"方法论变成手感——迷你无限画布上拖拽平移、滚轮缩放，点选镜头查看首尾帧与衔接三检查，一键播放链路看帧怎么一镜镜连下去。'],
    after: 'canvas',
    search: [
      { tit: '画布链路模拟器', txt: '逐镜连绘+尾帧链的动手模拟器：拖拽/缩放迷你无限画布，预置6个镜头节点（取自首尾帧转场题库），点选查看首帧/尾帧/运镜与衔接三检查，播放链路自动走线，双击空白新建镜头。' },
      { tit: '衔接三检查（视觉DNA规则）', txt: '同场景：两帧共享同一空间锚点，进新场景必须先切镜；同光线：光源方向色温时段一致；帧差合理：帧差恰好定义运动类型且2-5秒内完成——归纳自首尾帧题库 why 文案。' },
      { tit: '尾帧链画布操作说明', txt: '按住空白拖动平移，滚轮/双指缩放30%-300%，右下角加减复位按钮；点选镜头高亮上下游链路（青=上游/紫=下游）；视图与编辑状态本地保存（manju_framesim_v1）。' },
    ],
    render: render,
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);  // app.js init 时统一排水（兜底）
  }
})();
