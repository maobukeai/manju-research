/* ============================================================
   漫剧研究学习平台 · 分镜板工作台（js/feat-storyboard.js）
   自注册外挂模块：依赖 app.js 暴露的 window.MJ（addModule / esc / store / toast / regCopy）
   与 js/data.js 的 DB —— 运镜选项=DB.cameras；示例分镜=DB.llm.fullEpisode（第一集）；
   六段结构对照=DB.hot.episodeMap.segs；导出字段对齐=DB.llm.jsonExample 的 shot 级字段。
   用途：把「大模型应用」的静态分镜 JSON 模板升级为可操作编辑器——
     ① 镜号卡增删 / 上移下移 / 折叠展开，镜号自动重排；
     ② 逐镜标注运镜 / 景别 / 时长 / 台词 / 画面描述；
     ③ 实时汇总总镜数与总时长，映射 98 秒单集六段结构，超时变红告警；
     ④ 一键导出结构化 JSON 数组（regCopy 复制 + codebox 预览，route() 的 JSON 高亮自动生效）。
   状态：镜头数据每次变更即写 localStorage（manju_storyboard_v1），刷新无损恢复。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量与模块内状态 ---------- */
  const KEY = 'manju_storyboard_v1';        // 与平台 manju_* 键前缀同风格
  const STYLE_ID = 'mj-storyboard-style';   // 注入样式唯一 id，防重复注入
  const BUDGET = 98;                        // 与 DB.hot.episodeMap.total 同口径的告警阈值
  let shots = [];                           // [{ id, cam, size, dur, line, desc, fold }]
  let uidSeq = 0;
  let clearArmed = false;
  let clearTimer = null;
  let root = null;                          // #sec-storyboard，render 时缓存
  let ctx = null;                           // window.MJ
  /* 数据源：直接引用 data.js 的全局 DB（与 app.js 同一访问方式）。
     注意：data.js 以「const DB」声明，全局词法绑定不会挂到 window 上，
     故契约里 window.MJ.DB（= window.DB）实为 undefined——本模块不依赖 MJ.DB，
     esc / store / toast / regCopy 仍经 ctx（window.MJ）取用。 */

  /* ---------- 小工具 ---------- */
  const newUid = () => 'sb' + Date.now().toString(36) + (uidSeq++).toString(36);
  function clampDur(v) {
    let n = parseFloat(v);
    if (!isFinite(n) || n < 0) n = 0;
    n = Math.round(n * 10) / 10;
    return Math.min(n, 600);
  }
  function fmtDur(n) {
    n = Math.round((+n || 0) * 10) / 10;
    return (Number.isInteger(n) ? String(n) : n.toFixed(1)) + 's';
  }
  function totalDur() { return shots.reduce((a, s) => a + clampDur(s.dur), 0); }
  function camName(m) { const c = DB.cameras.find((x) => x.m === m); return c ? c.n : ''; }
  function sumText(s) { return (camName(s.cam) || '未指定') + ' · ' + fmtDur(clampDur(s.dur)); }
  function idxOf(uid) { return uid ? shots.findIndex((s) => s.id === uid) : -1; }

  /* ---------- 增补：景别选项 / 护栏检查 / 段落模板 / 交接文本（细化补丁 2026-10） ---------- */
  function mjxStoryboardSizeOptions(sel) {
    let h = '<option value=""' + (sel ? '' : ' selected') + '>景别 · 未标注</option>';
    mjxStoryboardSizes.forEach((z) => {
      h += '<option value="' + z + '"' + (sel === z ? ' selected' : '') + '>' + z + '</option>';
    });
    return h;
  }
  function mjxStoryboardGuards() {
    const out = [];
    let whipN = 0;
    shots.forEach((s, i) => {
      const no = '镜' + (i + 1);
      const d = clampDur(s.dur);
      if (d > 6) out.push(no + ' 时长 ' + fmtDur(d) + '：超出单镜 2-6 秒区间——拆镜或压时长，超长镜易漂移');
      const ln = String(s.line || '').trim();
      if (ln) {
        const k = ln.indexOf('：') >= 0 ? '：' : (ln.indexOf(':') >= 0 ? ':' : '');
        const body = k ? ln.slice(ln.indexOf(k) + k.length) : ln;
        if (body.trim().length > 15) out.push(no + ' 台词单句超 15 字：「先配音后驱动画面」流程下，长句先拆 2-3 段');
        if (s.cam === 'whip' || s.cam === 'orbit') out.push(no + ' 有台词却配甩镜/环绕：台词镜头只用安全运镜（慢推、轻微视差、微手持）');
      }
      if (s.cam === 'whip') whipN++;
      if (s.size && i > 0 && shots[i - 1].size === s.size) out.push('镜' + i + '→' + no + ' 景别相同（' + s.size + '）：相邻镜号避免相同景别，否则「PPT感」');
    });
    if (whipN > 3) out.push('甩镜共 ' + whipN + ' 次：一集别超 3 次【经验口径】，重音多了会钝');
    return out;
  }
  function mjxStoryboardGuardsBlock() {
    if (!shots.length) return '';
    const list = mjxStoryboardGuards();
    return '<div class="mjx-storyboard-guards">' +
      '<div class="mjx-storyboard-guardst">护栏检查 <span class="sub">口径：单镜2-6秒 · 台词单句≤15字 · 相邻镜号避免相同景别 · 台词镜头只用安全运镜 · 甩镜一集≤3次</span></div>' +
      (list.length
        ? list.map((g) => '<div class="mjx-storyboard-guard">⚠ ' + ctx.esc(g) + '</div>').join('')
        : '<div class="mjx-storyboard-guard ok">✓ 五项护栏全部通过</div>') +
      '</div>';
  }
  function mjxStoryboardCheatHTML() {
    return '<details class="mjx-storyboard-cheat"><summary>六段拍摄速查 · 每段的常用运镜与要点（运行时取自「爆款心法」结构沙盘，本页不另存口径）</summary>' +
      DB.hot.episodeMap.segs.map((sg) =>
        '<div class="mjx-storyboard-cheatrow"><b>' + ctx.esc(sg.n) + '</b><span class="t">' + ctx.esc(sg.t) + '</span>' +
        '<span class="c">常用运镜：' + ctx.esc(sg.cams) + '</span><span class="k">' + ctx.esc(sg.tip) + '</span></div>').join('') +
      '</details>';
  }
  function mjxStoryboardTplDur(which) {
    const gs = which === 'all' ? mjxStoryboardSegTpl : [mjxStoryboardSegTpl[which]];
    return fmtDur(gs.reduce((a, g) => a + g.shots.reduce((x, s) => x + clampDur(s.dur), 0), 0));
  }
  function mjxStoryboardInsertTpl() {
    const sel = root.querySelector('#mjxStoryboardTplSel');
    if (!sel || sel.value === '') { ctx.toast('先在下拉里选一段模板（或整集骨架）'); return; }
    const groups = sel.value === 'all' ? mjxStoryboardSegTpl : [mjxStoryboardSegTpl[+sel.value]];
    if (!groups || !groups.length) { ctx.toast('模板数据异常'); return; }
    const added = [];
    groups.forEach((g) => g.shots.forEach((t) => {
      if (!DB.cameras.some((c) => c.m === t.cam)) return;
      added.push({
        id: newUid(), cam: t.cam,
        size: mjxStoryboardSizes.indexOf(t.size) >= 0 ? t.size : '',
        dur: clampDur(t.dur), line: '', desc: t.desc, fold: false,
      });
    }));
    if (!added.length) { ctx.toast('模板运镜档位异常，未插入'); return; }
    shots = shots.concat(added);
    persist(); renderAll();
    ctx.toast('已插入「' + (sel.value === 'all' ? '整集骨架' : groups[0].name) + '」模板 ' + added.length + ' 镜——追加在末尾，时长与描述可继续改');
    try {
      const list = root.querySelector('#sbList');
      if (list && list.lastElementChild) list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { /* 忽略滚动 */ }
  }
  function mjxStoryboardDialogueText() {
    const rows = [];
    shots.forEach((s, i) => {
      const ln = String(s.line || '').trim();
      if (!ln) return;
      const k = ln.indexOf('：') >= 0 ? '：' : (ln.indexOf(':') >= 0 ? ':' : '');
      const sp = k ? ln.slice(0, ln.indexOf(k)).trim() : '';
      const tx = k ? ln.slice(ln.indexOf(k) + k.length).trim() : ln;
      rows.push('S' + (i + 1 < 10 ? '0' : '') + (i + 1) + '｜' + (sp || '（未标说话人）') + '｜' + tx);
    });
    if (!rows.length) return '';
    return ['【台词表】共 ' + rows.length + ' 句 · 供「先配音、后驱动画面」使用（长句拆2-3段、接缝补1-2帧）']
      .concat(rows).join('\n');
  }
  function mjxStoryboardShotlistText() {
    if (!shots.length) return '';
    const rows = shots.map((s, i) => 'S' + (i + 1 < 10 ? '0' : '') + (i + 1) +
      '｜' + (camName(s.cam) || '未指定') +
      '｜' + fmtDur(clampDur(s.dur)) +
      '｜' + (s.size || '—') +
      '｜' + String(s.desc || '').replace(/\s*\n\s*/g, ' '));
    return ['【分镜交接单】' + shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()) + ' · 字段：镜号｜运镜｜时长｜景别｜画面（13字段分镜表的轻量交接版）']
      .concat(rows).join('\n');
  }

  /* ---------- 运镜匹配：示例分镜的自由文本 camera_move → DB.cameras 的 m 键 ---------- */
  const CAM_ALIAS = [
    ['zoom', ['急推', '变焦']],
    ['dollyzoom', ['希区柯克']],
    ['push', ['推近', '推镜']],
    ['pull', ['拉远', '拉升', '拉镜']],
    ['tilt', ['上摇', '下摇', '俯仰']],
    ['panR', ['摇镜', '平摇', '左摇', '右摇']],
    ['whip', ['甩']],
    ['truck', ['横移']],
    ['follow', ['跟拍', '跟随']],
    ['handheld', ['手持', '晃动']],
    ['craneUp', ['升镜', '摇臂升']],
    ['craneDown', ['降镜', '下降']],
    ['orbit', ['环绕']],
    ['fpv', ['穿越', '子弹时间', 'FPV', 'fpv']],
    ['rack', ['移焦']],
    ['static', ['固定', '静止', '机位']],
  ];

  /* ---------- 增补数据区（细化补丁 2026-10）----------
     mjxStoryboardSizes：景别四档，取自 DB.llm.promptTemplate「特写|近景|中景|远景」（data.js:913）；
     mjxStoryboardSegTpl：段落模板——把 DB.hot.episodeMap.segs 六段结构固化成可一键插入的整集骨架：
     每段镜数取 segs「X-Y镜」参考区间内（钩子2∈1-2 / 冲突4∈4-6 / 铺垫10∈10-14 / 反转3∈3-5 /
     爽点6∈6-9 / 卡点3∈3-5，合计28镜），秒数取段窗口内的编排值（铺垫10镜×3s恰好铺满30s段窗，
     全骨架76.5s＜98s预算，余量留给用户加镜/加秒）；运镜取 segs.cams 档位，描述为 segs.task 的执行化改写。
     来源：research/02-开发流程与爆款方法论.md「节奏公式」；research/12-剧本创作与网文改编实操.md §二§三。 */
  let mjxStoryboardLastLines = '';          // 台词表复制内容缓存（去重注册 regCopy）
  let mjxStoryboardLastList = '';           // 交接单复制内容缓存
  const mjxStoryboardSizes = ['特写', '近景', '中景', '远景'];
  const mjxStoryboardSegTpl = [
    { name: '黄金钩子', shots: [
      { cam: 'zoom', size: '特写', dur: 1.5, desc: '钩子主画面：身份错位/利益威胁/视觉冲击三选一，直接砸脸进冲突' },
      { cam: 'whip', size: '中景', dur: 1.5, desc: '甩镜接环境交代：谁、在哪、什么危机已经发生' },
    ]},
    { name: '冲突建立', shots: [
      { cam: 'static', size: '远景', dur: 3, desc: '对峙定场：交代主角处境与被压迫关系——让观众知道「谁欠了什么」' },
      { cam: 'follow', size: '中景', dur: 3, desc: '跟拍主角入场/回到压迫现场' },
      { cam: 'static', size: '特写', dur: 3, desc: '固定机位反应特写：主角隐忍，蓄住第一口情绪' },
      { cam: 'truck', size: '中景', dur: 3, desc: '横移：压迫方逼近或双方同行，关系张力可视化' },
    ]},
    { name: '递进铺垫', shots: [
      { cam: 'push', size: '近景', dur: 3, desc: '压迫升级：新威胁落到主角身上，情绪再压一格' },
      { cam: 'rack', size: '特写', dur: 3, desc: '伏笔①：道具/细节特写，埋一颗 45-60 秒能回收的种子' },
      { cam: 'push', size: '中景', dur: 3, desc: '推镜蓄力：对峙逼近，情绪再压一格' },
      { cam: 'rack', size: '远景', dur: 3, desc: '插入空镜：环境/物件反应，给一拍呼吸感' },
      { cam: 'push', size: '近景', dur: 3, desc: '关系恶化：盟友动摇/敌人加码（台词单句≤15字）' },
      { cam: 'rack', size: '特写', dur: 3, desc: '伏笔②：另一个可回收细节，反转前最后一次给镜头' },
      { cam: 'push', size: '中景', dur: 3, desc: '逼到墙角：冲突推到爆点前最后一格' },
      { cam: 'rack', size: '近景', dur: 3, desc: '暗示：移焦把观众注意力引向真正的底牌' },
      { cam: 'push', size: '远景', dur: 3, desc: '大势压顶：主角被逼入绝境的全景定场' },
      { cam: 'rack', size: '近景', dur: 3, desc: '伏笔收口：最后一次确认道具/细节（观众已能预感反转）' },
    ]},
    { name: '黄金反转', shots: [
      { cam: 'zoom', size: '特写', dur: 0.5, desc: '反转重音：0.5 秒瞳孔地震式特写，砸在 45-60 秒黄金分割点' },
      { cam: 'dollyzoom', size: '近景', dur: 3, desc: '世界观崩塌具象化：身份/利益/关系三大反转模式选一' },
      { cam: 'whip', size: '中景', dur: 2, desc: '甩镜收全场反应：震惊传导给围观者' },
    ]},
    { name: '爽点释放', shots: [
      { cam: 'truck', size: '近景', dur: 3, desc: '逆袭执行：低角度横移近景，主角开始碾压实景' },
      { cam: 'fpv', size: '远景', dur: 3, desc: '高光奇观：FPV 穿越或子弹时间，纯爽点一镜' },
      { cam: 'truck', size: '中景', dur: 3, desc: '逐个击破：压迫方节节败退，音效重音跟打点' },
      { cam: 'orbit', size: '特写', dur: 3, desc: 'hero shot 环绕定格：音效重音落在运镜落点' },
      { cam: 'truck', size: '近景', dur: 3, desc: '全场臣服：横移扫过俯首的人群' },
      { cam: 'fpv', size: '远景', dur: 3, desc: '收尾高光：一记大场面奇观收住爽点段' },
    ]},
    { name: '卡点留钩', shots: [
      { cam: 'pull', size: '中景', dur: 4, desc: '情绪余韵：台词落地后缓拉，把主角留在空画面里' },
      { cam: 'craneUp', size: '远景', dur: 3, desc: '摇臂升起：新一轮危机/悬念入场' },
      { cam: 'static', size: '特写', dur: 1, desc: '卡点：固定机位定格下一集钩子画面，黑场前最后一格' },
    ]},
  ];
  function matchCamera(raw) {
    const t = String(raw || '').trim();
    if (!t) return '';
    const cams = DB.cameras;
    const exact = cams.find((c) => c.n === t) || cams.find((c) => c.m.toLowerCase() === t.toLowerCase());
    if (exact) return exact.m;
    const contains = cams.find((c) => t.indexOf(c.n) >= 0 || c.n.indexOf(t) >= 0);
    if (contains) return contains.m;
    for (let i = 0; i < CAM_ALIAS.length; i++) {
      const keys = CAM_ALIAS[i][1];
      if (keys.some((a) => t.toLowerCase().indexOf(a.toLowerCase()) >= 0)) return CAM_ALIAS[i][0];
    }
    return '';
  }

  /* ---------- 六段结构计算：全部按秒数映射到 DB.hot.episodeMap.segs ---------- */
  function segBounds() {
    const segs = DB.hot.episodeMap.segs;
    const b = [0];
    segs.forEach((s) => { const m = /(\d+)\s*[-–]\s*(\d+)/.exec(String(s.t)); b.push(m ? parseFloat(m[2]) : b[b.length - 1]); });
    return b;
  }
  function segIdxOf(start, bounds) {
    for (let i = 0; i < bounds.length - 1; i++) { if (start < bounds[i + 1] - 1e-9) return i; }
    return -1; // 起点已越过 98s 基准
  }
  /* load=按起点归段的镜头时长合计（用于"该段塞了多久"）；clip=按时间轴裁进该段窗口的秒数（用于分布条填充） */
  function computePlan() {
    const bounds = segBounds();
    const per = DB.hot.episodeMap.segs.map(() => ({ load: 0, n: 0, clip: 0 }));
    const over = { load: 0, n: 0 };
    let acc = 0;
    shots.forEach((s) => {
      const d = clampDur(s.dur);
      const start = acc, end = acc + d; acc = end;
      const si = segIdxOf(start, bounds);
      if (si >= 0) { per[si].load += d; per[si].n += 1; }
      else { over.load += d; over.n += 1; }
      for (let j = 0; j < bounds.length - 1; j++) {
        const ov = Math.min(end, bounds[j + 1]) - Math.max(start, bounds[j]);
        if (ov > 0) per[j].clip += ov;
      }
    });
    return { per, over, total: acc, bounds };
  }

  /* ---------- 持久化 ---------- */
  function persist() { ctx.store.set(KEY, { v: 1, updated: Date.now(), shots: shots }); }
  function restore() {
    const saved = ctx.store.get(KEY, null);
    const list = saved && Array.isArray(saved.shots) ? saved.shots : [];
    const seen = {};
    shots = list.map((s) => {
      if (!s || typeof s !== 'object') return null;
      let id = String(s.id || '');
      if (!id || seen[id]) id = newUid();
      seen[id] = true;
      return {
        id: id,
        cam: DB.cameras.some((c) => c.m === s.cam) ? s.cam : '',
        size: mjxStoryboardSizes.indexOf(s.size) >= 0 ? s.size : '',
        dur: clampDur(s.dur),
        line: String(s.line || ''),
        desc: String(s.desc || ''),
        fold: !!s.fold,
      };
    }).filter(Boolean);
  }

  /* ---------- 导出 JSON（结构对齐 DB.llm.jsonExample 的 shot 级字段） ---------- */
  function buildExportText() {
    return JSON.stringify(shots.map((s, i) => {
      const o = {
        shot_id: 'S' + (i + 1 < 10 ? '0' : '') + (i + 1),
        camera_move: camName(s.cam),
        duration_sec: clampDur(s.dur),
        action: String(s.desc || ''),
      };
      const ln = String(s.line || '').trim();
      if (!ln) o.dialogue = null;
      else {
        const k = ln.indexOf('：') >= 0 ? '：' : (ln.indexOf(':') >= 0 ? ':' : '');
        o.dialogue = k
          ? { speaker: ln.slice(0, ln.indexOf(k)).trim(), line: ln.slice(ln.indexOf(k) + k.length).trim() }
          : { speaker: '', line: ln };
      }
      return o;
    }), null, 2);
  }

  /* ---------- 与 app.js highlightJSONPre（271-293 行）同算法的本地副本：
     平台未在 window.MJ 暴露 enhanceCode，导出按钮实时刷新的预览需要即时高亮；
     初始渲染的预览不调用这里，仍由 route() 的 enhanceCode（app.js:251）自动高亮。 ---------- */
  function sbHighlight(pre) {
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
        html += m[2] ? '<span class="j-key">' + esc2(m[1]) + '</span>' + esc2(m[2]) : '<span class="j-str">' + esc2(m[1]) + '</span>';
      } else if (/^-?[\d]/.test(m[0])) html += '<span class="j-num">' + esc2(m[0]) + '</span>';
      else html += '<span class="j-lit">' + esc2(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    pre.innerHTML = html + esc2(txt.slice(last));
    pre.dataset.jhl = '1';
  }

  /* ---------- HTML 片段 ---------- */
  function camOptions(sel) {
    let h = '<option value=""' + (sel ? '' : ' selected') + '>未指定</option>';
    DB.cameras.forEach((c) => {
      h += '<option value="' + c.m + '"' + (sel === c.m ? ' selected' : '') + '>' +
        ctx.esc(c.n) + ' · ' + ctx.esc(c.en.split('/')[0].trim()) + '</option>';
    });
    return h;
  }
  function fieldsHTML(s) {
    return '<label class="sb-f"><span class="sb-fl">运镜</span><select data-sb-field="cam">' + camOptions(s.cam) + '</select></label>' +
      '<label class="sb-f"><span class="sb-fl">景别</span><select data-sb-field="size">' + mjxStoryboardSizeOptions(s.size) + '</select></label>' +
      '<label class="sb-f sb-f-dur"><span class="sb-fl">时长</span><span class="sb-dur-wrap">' +
      '<input type="number" data-sb-field="dur" min="0" step="0.5" value="' + ctx.esc(String(clampDur(s.dur))) + '"><i>秒</i></span></label>' +
      '<label class="sb-f"><span class="sb-fl">台词</span><textarea data-sb-field="line" rows="2" placeholder="说话人：台词 —— 用「：」分隔说话人，导出时拆为 speaker / line">' + ctx.esc(s.line) + '</textarea></label>' +
      '<label class="sb-f"><span class="sb-fl">画面描述</span><textarea data-sb-field="desc" rows="3" placeholder="这一镜的动作、表情与构图要点（导出为 action 字段）">' + ctx.esc(s.desc) + '</textarea></label>';
  }
  function cardHTML(s, i, starts, bounds) {
    const si = segIdxOf(starts[i], bounds);
    return '<div class="sb-card' + (s.fold ? ' folded' : '') + '" data-sb-uid="' + s.id + '">' +
      '<div class="sb-head" title="点击折叠 / 展开">' +
      '<span class="sb-chev">▼</span>' +
      '<span class="sb-no">镜' + (i + 1) + '</span>' +
      '<span class="sb-sum">' + ctx.esc(sumText(s)) + '</span>' +
      '<span class="sb-segtag' + (si < 0 ? ' over' : '') + '">' + (si < 0 ? '超 98s' : ctx.esc(DB.hot.episodeMap.segs[si].n)) + '</span>' +
      '<span class="sb-ops">' +
      '<button type="button" class="sb-op" data-sb-act="up" title="上移"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button type="button" class="sb-op" data-sb-act="down" title="下移"' + (i === shots.length - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" class="sb-op sb-op-del" data-sb-act="del" title="删除本镜">✕</button>' +
      '</span></div>' +
      '<div class="sb-body">' + fieldsHTML(s) + '</div>' +
      '</div>';
  }
  function renderList() {
    const list = root.querySelector('#sbList');
    if (!list) return;
    if (!shots.length) {
      list.innerHTML = '<div class="sb-empty"><b>分镜板还是空的</b>' +
        '<p>点上方「＋ 添加镜头」从第一镜开始搭节奏，或「📥 载入示例分镜」一键填入完整一集参考。<br>所有变更自动保存在本机浏览器，刷新页面不丢。</p></div>';
      return;
    }
    const starts = []; let acc = 0;
    shots.forEach((s) => { starts.push(acc); acc += clampDur(s.dur); });
    const bounds = segBounds();
    list.innerHTML = shots.map((s, i) => cardHTML(s, i, starts, bounds)).join('');
  }
  function statsHTML(plan) {
    const segs = DB.hot.episodeMap.segs;
    const over = plan.total > BUDGET + 1e-9;
    const max = Math.max(BUDGET, plan.total);
    let zones = '';
    segs.forEach((sg, i) => {
      const a = plan.bounds[i], b = plan.bounds[i + 1];
      const span = Math.max(0, b - a);
      const p = plan.per[i];
      const fill = span > 0 ? Math.min(100, (p.clip / span) * 100) : 0;
      zones += '<div class="sb-zone" style="width:' + ((span / max) * 100).toFixed(3) + '%" title="' +
        ctx.esc(sg.n + ' ' + sg.t + ' · 时间轴占比 ' + fmtDur(p.clip)) + '">' +
        '<span class="sb-zone-fill" style="width:' + fill.toFixed(1) + '%"></span>' +
        '<span class="sb-zone-n">' + ctx.esc(sg.n) + '</span></div>';
    });
    if (over) {
      zones += '<div class="sb-zone overzone" style="width:' + (((plan.total - BUDGET) / max) * 100).toFixed(3) + '%" title="超出 ' + BUDGET + ' 秒基准 ' + fmtDur(plan.total - BUDGET) + '">' +
        '<span class="sb-zone-fill" style="width:100%"></span><span class="sb-zone-n">超出</span></div>';
    }
    let rows = '';
    segs.forEach((sg, i) => {
      const span = Math.max(0, plan.bounds[i + 1] - plan.bounds[i]);
      const p = plan.per[i];
      const isOver = p.load > span + 1e-9;
      rows += '<div class="sb-seg-row" title="' + ctx.esc(sg.n + '：' + sg.task) + '">' +
        '<span class="n">' + ctx.esc(sg.n) + '</span><span class="t">' + ctx.esc(sg.t) + '</span>' +
        '<span class="plan' + (isOver ? ' over' : (p.n === 0 ? ' zero' : '')) + '">计划 ' + fmtDur(p.load) + ' · ' + p.n + '镜' +
        (isOver ? '（超 ' + fmtDur(p.load - span) + '）' : '') + '</span>' +
        '<span class="ref">参考 ' + span + 's · ' + ctx.esc(sg.shots) + '</span></div>';
    });
    if (plan.over.n > 0) {
      rows += '<div class="sb-seg-row sb-seg-overflow"><span class="n">超出 98s</span><span class="t">&gt;98s</span>' +
        '<span class="plan over">计划 ' + fmtDur(plan.over.load) + ' · ' + plan.over.n + '镜</span>' +
        '<span class="ref">— 红果端需压回 98s-2min</span></div>';
    }
    let verdict;
    if (!shots.length) verdict = '<span class="sb-verdict zero">尚无镜头 —— 添加或载入示例后，这里实时汇总并映射六段结构</span>';
    else if (over) verdict = '<span class="sb-verdict over">⚠ 总时长 ' + fmtDur(plan.total) + '，超出 ' + BUDGET + ' 秒基准 ' + fmtDur(plan.total - BUDGET) + '——按「爆款心法」压回 98 秒-2 分钟区间</span>';
    else verdict = '<span class="sb-verdict ok">✓ 在 ' + BUDGET + ' 秒预算内，余 ' + fmtDur(BUDGET - plan.total) + '</span>';
    const guards = mjxStoryboardGuardsBlock();
    return '<h5>实时统计 <span class="sub">总时长按秒映射「' + ctx.esc(String(DB.hot.episodeMap.total)) + '秒单集六段结构」· 对照「爆款心法」结构沙盘</span></h5>' +
      '<div class="sb-stats-row">' +
      '<span class="sb-stat"><b>' + shots.length + '</b>镜</span>' +
      '<span class="sb-stat' + (over ? ' over' : '') + '"><b>' + fmtDur(plan.total) + '</b>/' + BUDGET + 's</span>' +
      verdict + '</div>' +
      '<div class="sb-tl">' + zones + '</div>' +
      '<div class="sb-tl-cap"><span>0s</span><span>' + (over ? BUDGET + 's 基准 → 超出 ' + fmtDur(plan.total - BUDGET) : BUDGET + 's') + '</span></div>' +
      '<div class="sb-seg-rows">' + rows + '</div>' + guards;
  }
  function refreshStats() {
    const plan = computePlan();
    const box = root.querySelector('#sbStats');
    if (box) box.innerHTML = statsHTML(plan);
    const sub = root.querySelector('#sbListSub');
    if (sub) sub.textContent = shots.length ? '共 ' + shots.length + ' 镜 · 合计 ' + fmtDur(plan.total) + '（点击卡头折叠/展开）' : '尚无镜头';
    /* 时长/运镜编辑不重绘列表（保住输入焦点），各卡头的摘要与时段标签在这里同步刷新 */
    const bounds = plan.bounds;
    let acc = 0;
    shots.forEach((s) => {
      const card = root.querySelector('[data-sb-uid="' + s.id + '"]');
      if (card) {
        const sum = card.querySelector('.sb-sum');
        if (sum) sum.textContent = sumText(s);
        const tag = card.querySelector('.sb-segtag');
        if (tag) {
          const si = segIdxOf(acc, bounds);
          tag.textContent = si < 0 ? '超 98s' : DB.hot.episodeMap.segs[si].n;
          tag.classList.toggle('over', si < 0);
        }
      }
      acc += clampDur(s.dur);
    });
    /* 增补：台词表 / 交接单按钮的复制内容与可用态随编辑实时刷新（细化补丁 2026-10） */
    const lb = root.querySelector('#mjxStoryboardLinesBtn');
    if (lb) {
      const lt = mjxStoryboardDialogueText();
      lb.disabled = !lt;
      if (!lt) { mjxStoryboardLastLines = ''; lb.removeAttribute('data-copy'); }
      else if (lt !== mjxStoryboardLastLines) { mjxStoryboardLastLines = lt; lb.dataset.copy = ctx.regCopy(lt); }
    }
    const ob = root.querySelector('#mjxStoryboardListBtn');
    if (ob) {
      const ot = mjxStoryboardShotlistText();
      ob.disabled = !ot;
      if (!ot) { mjxStoryboardLastList = ''; ob.removeAttribute('data-copy'); }
      else if (ot !== mjxStoryboardLastList) { mjxStoryboardLastList = ot; ob.dataset.copy = ctx.regCopy(ot); }
    }
  }
  function renderAll() {
    renderList();
    refreshStats();
    const wrap = root.querySelector('#sbExportWrap');
    if (wrap && !wrap.hidden) fillExport(true);
  }
  function fillExport(quiet) {
    const wrap = root.querySelector('#sbExportWrap');
    if (!wrap) return;
    if (!shots.length) { wrap.hidden = true; return; }
    const txt = buildExportText();
    const pre = root.querySelector('#sbExpPre');
    pre.textContent = txt;
    delete pre.dataset.jhl;
    sbHighlight(pre);
    root.querySelector('#sbExpMeta').textContent = shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()) + ' · episode 数组';
    root.querySelector('#sbExpCopy').dataset.copy = ctx.regCopy(txt);
    wrap.hidden = false;
    if (!quiet) {
      ctx.toast('已生成分镜 JSON —— 点代码框右上「复制」带走');
      try { wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.scrollBy({ top: -76 }); } catch (e) { /* 旧浏览器忽略滚动 */ }
    }
  }

  /* ---------- 动作 ---------- */
  function actAdd() {
    const s = { id: newUid(), cam: '', size: '', dur: 4, line: '', desc: '', fold: false };
    shots.push(s);
    persist(); renderAll();
    const card = root.querySelector('[data-sb-uid="' + s.id + '"]');
    try { if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* 忽略 */ }
    ctx.toast('已添加镜' + shots.length + '，镜号自动重排');
  }
  function actMove(btn, dir) {
    const card = btn.closest('[data-sb-uid]');
    const i = idxOf(card && card.dataset.sbUid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= shots.length) return;
    const t = shots[i]; shots[i] = shots[j]; shots[j] = t;
    persist(); renderAll();
  }
  function actDel(btn) {
    const card = btn.closest('[data-sb-uid]');
    const i = idxOf(card && card.dataset.sbUid);
    if (i < 0) return;
    shots.splice(i, 1);
    persist(); renderAll();
    ctx.toast('已删除镜' + (i + 1));
  }
  function actClear(btn) {
    if (!clearArmed) {
      clearArmed = true;
      btn.classList.add('armed');
      btn.textContent = '⚠ 再点一次确认清空';
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => disarmClear(btn), 3200);
      ctx.toast('3 秒内再点一次「清空」确认');
      return;
    }
    clearTimeout(clearTimer);
    disarmClear(btn);
    shots = [];
    persist(); renderAll();
    ctx.toast('已清空分镜板');
  }
  function disarmClear(btn) {
    clearArmed = false;
    btn.classList.remove('armed');
    btn.textContent = '🗑 清空';
  }
  function actSample() {
    let data = null;
    try { data = JSON.parse(DB.llm.fullEpisode); } catch (err) { ctx.toast('示例分镜解析失败'); return; }
    if (!data || !Array.isArray(data.shots) || !data.shots.length) { ctx.toast('示例分镜数据为空'); return; }
    const toLine = (d) => {
      if (!d) return '';
      if (typeof d === 'string') return d;
      return (d.speaker ? d.speaker + '：' : '') + (d.line || '');
    };
    shots = data.shots.map((s) => ({
      id: newUid(),
      cam: matchCamera(s && s.camera_move),
      size: '',
      dur: clampDur(s && s.duration_sec),
      line: toLine(s && s.dialogue),
      desc: String((s && s.action) || ''),
      fold: false,
    }));
    persist(); renderAll();
    ctx.toast('已载入示例分镜：' + shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()));
  }
  function actExport() {
    if (!shots.length) { ctx.toast('分镜板是空的——先添加镜头或载入示例'); return; }
    fillExport(false);
  }

  /* ---------- 事件绑定（render-once：section 内委托，结构变化无需重绑） ---------- */
  function bindEvents(el) {
    if (el.dataset.sbBound) return;
    el.dataset.sbBound = '1';
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sb-act]');
      if (btn && root.contains(btn)) {
        const act = btn.dataset.sbAct;
        if (act === 'add') actAdd();
        else if (act === 'up') actMove(btn, -1);
        else if (act === 'down') actMove(btn, 1);
        else if (act === 'del') actDel(btn);
        else if (act === 'sample') actSample();
        else if (act === 'export') actExport();
        else if (act === 'clear') actClear(btn);
        else if (act === 'tpl') mjxStoryboardInsertTpl();
        return;
      }
      const head = e.target.closest('.sb-head');
      if (head && root.contains(head)) {
        const card = head.closest('[data-sb-uid]');
        const i = idxOf(card && card.dataset.sbUid);
        if (i < 0) return;
        shots[i].fold = !shots[i].fold;
        persist();
        card.classList.toggle('folded', shots[i].fold);
      }
    });
    const onEdit = (e) => {
      const f = e.target.closest ? e.target.closest('[data-sb-field]') : null;
      if (!f || !root.contains(f)) return;
      const card = f.closest('[data-sb-uid]');
      const i = idxOf(card && card.dataset.sbUid);
      if (i < 0) return;
      const field = f.dataset.sbField;
      if (field === 'dur') { shots[i].dur = clampDur(f.value); persist(); refreshStats(); }
      else if (field === 'cam') { shots[i].cam = f.value; persist(); refreshStats(); }
      else { shots[i][field] = f.value; persist(); refreshStats(); }
    };
    el.addEventListener('input', onEdit);
    el.addEventListener('change', onEdit); /* select 的兜底（部分浏览器 select 也触发 input） */
  }

  /* ---------- 样式注入（唯一 id；颜色/圆角/阴影全部取自 css/style.css 既有变量与同色系 rgba） ---------- */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = [
      '/* 分镜板工作台（feat-storyboard.js 注入） */',
      '.sb-stats-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:2px}',
      '.sb-stat{display:inline-flex;align-items:baseline;gap:5px;background:var(--panel2);border:1px solid var(--line);border-radius:var(--r-s);padding:6px 12px;font-size:12px;color:var(--tx2)}',
      '.sb-stat b{font-size:17px;color:var(--tx);font-variant-numeric:tabular-nums}',
      '.sb-stat.over{border-color:rgba(244,63,94,.45);background:rgba(244,63,94,.08)}',
      '.sb-stat.over b{color:var(--hot)}',
      '.sb-verdict{font-size:12.3px;font-weight:700}',
      '.sb-verdict.ok{color:var(--ok)}',
      '.sb-verdict.over{color:var(--hot)}',
      '.sb-verdict.zero{color:var(--tx3);font-weight:400}',
      '.sb-tl{display:flex;gap:3px;height:36px;margin:12px 0 4px}',
      '.sb-zone{position:relative;background:var(--panel2);border:1px solid var(--line);border-radius:6px;overflow:hidden;min-width:0}',
      '.sb-zone-fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(139,92,246,.5),rgba(34,211,238,.45))}',
      '.sb-zone .sb-zone-n{position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:10.5px;color:var(--tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100% - 10px);pointer-events:none}',
      '.sb-zone.overzone{background:rgba(244,63,94,.12);border-color:rgba(244,63,94,.4)}',
      '.sb-zone.overzone .sb-zone-fill{background:rgba(244,63,94,.4)}',
      '.sb-zone.overzone .sb-zone-n{color:var(--hot)}',
      '.sb-tl-cap{display:flex;justify-content:space-between;font-size:10.5px;color:var(--tx3);margin-bottom:10px}',
      '.sb-seg-rows{display:grid;gap:4px;margin-top:4px}',
      '.sb-seg-row{display:flex;align-items:center;gap:8px;font-size:11.8px;color:var(--tx2);padding:5px 9px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;cursor:help}',
      '.sb-seg-row .n{flex:0 0 58px;color:var(--tx);font-weight:700}',
      '.sb-seg-row .t{flex:0 0 52px;color:var(--tx3);font-variant-numeric:tabular-nums}',
      '.sb-seg-row .plan{flex:1;min-width:0}',
      '.sb-seg-row .plan.over{color:var(--hot);font-weight:700}',
      '.sb-seg-row .plan.zero{color:var(--tx3)}',
      '.sb-seg-row .ref{flex:0 0 auto;color:var(--tx3);font-size:11px}',
      '.sb-seg-overflow{border-color:rgba(244,63,94,.4);background:rgba(244,63,94,.07)}',
      '.sb-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;overflow:hidden;transition:border-color .16s}',
      '.sb-card:hover{border-color:var(--line2)}',
      '.sb-head{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;user-select:none}',
      '.sb-chev{color:var(--tx3);font-size:10px;transition:transform .18s;flex-shrink:0}',
      '.sb-card.folded .sb-chev{transform:rotate(-90deg)}',
      '.sb-no{font-weight:800;font-size:13.5px;color:var(--tx);flex-shrink:0}',
      '.sb-sum{color:var(--tx2);font-size:12.5px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sb-segtag{flex-shrink:0;font-size:10.5px;color:#5fd4e8;background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.3);border-radius:8px;padding:1px 8px}',
      '.sb-segtag.over{color:#fb7f95;background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.35)}',
      '.sb-ops{display:flex;gap:5px;flex-shrink:0}',
      '.sb-op{background:var(--panel2);border:1px solid var(--line);color:var(--tx2);width:26px;height:26px;border-radius:8px;cursor:pointer;font-size:12px;line-height:1;transition:.14s;font-family:inherit}',
      '.sb-op:hover{color:var(--tx);border-color:var(--p1)}',
      '.sb-op:disabled{opacity:.35;cursor:not-allowed}',
      '.sb-op-del:hover{color:var(--hot);border-color:var(--hot)}',
      '.sb-body{padding:6px 14px 14px;border-top:1px dashed var(--line);display:grid;gap:9px}',
      '.sb-card.folded .sb-body{display:none}',
      '.sb-f{display:flex;gap:10px;align-items:flex-start;font-size:12.5px}',
      '.sb-fl{flex:0 0 58px;color:var(--tx3);padding-top:7px;text-align:right}',
      '.sb-f select,.sb-f textarea,.sb-f input{background:var(--panel2);border:1px solid var(--line);color:var(--tx);border-radius:9px;font-size:13px;font-family:inherit;padding:7px 10px;outline:none;width:100%;transition:border-color .14s}',
      '.sb-f textarea{resize:vertical;min-height:38px;line-height:1.6}',
      '.sb-f select:focus,.sb-f textarea:focus,.sb-f input:focus{border-color:var(--p1)}',
      '.sb-dur-wrap{display:inline-flex;align-items:center;gap:6px}',
      '.sb-dur-wrap i{font-style:normal;color:var(--tx3);font-size:12px}',
      '.sb-f-dur input{width:90px;flex:0 0 auto}',
      '.sb-f:not(.sb-f-dur) select{flex:1}',
      '.sb-btn-danger.armed{background:rgba(244,63,94,.14);border-color:var(--hot);color:var(--hot)}',
      '.sb-empty{border:1.5px dashed var(--line2);border-radius:var(--r);padding:34px 20px;text-align:center;color:var(--tx2);font-size:13px}',
      '.sb-empty b{display:block;font-size:15px;color:var(--tx);margin-bottom:6px}',
      '/* —— 细化补丁 2026-10：段落模板 / 护栏 / 速查 / 工具条（新增类一律 mjx-storyboard- 前缀） —— */',
      '.mjx-storyboard-tplwrap{display:inline-flex;gap:6px;align-items:center}',
      '.mjx-storyboard-tplsel{background:var(--panel2);border:1px solid var(--line);color:var(--tx);border-radius:12px;font-size:13px;font-family:inherit;padding:9px 10px;outline:none;max-width:220px;cursor:pointer;transition:border-color .14s}',
      '.mjx-storyboard-tplsel:focus{border-color:var(--p1)}',
      '.sb-toolbar .btn.ghost:disabled{opacity:.4;cursor:not-allowed;transform:none}',
      '.mjx-storyboard-guards{margin-top:10px;display:grid;gap:5px}',
      '.mjx-storyboard-guardst{font-size:12.5px;font-weight:800;color:var(--tx)}',
      '.mjx-storyboard-guardst .sub{font-weight:400;font-size:11px;color:var(--tx3)}',
      '.mjx-storyboard-guard{font-size:11.8px;color:#fb7f95;background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.25);border-radius:8px;padding:5px 9px;line-height:1.55}',
      '.mjx-storyboard-guard.ok{color:var(--ok);background:rgba(52,211,153,.07);border-color:rgba(52,211,153,.3)}',
      '.mjx-storyboard-cheat{margin-top:10px;border:1px dashed var(--line2);border-radius:10px;overflow:hidden}',
      '.mjx-storyboard-cheat summary{cursor:pointer;padding:8px 12px;font-size:12px;color:var(--tx2);user-select:none;background:var(--panel2)}',
      '.mjx-storyboard-cheat summary:hover{color:var(--tx)}',
      '.mjx-storyboard-cheatrow{display:flex;gap:8px;align-items:baseline;padding:6px 12px;font-size:11.6px;color:var(--tx2);border-top:1px dashed var(--line);flex-wrap:wrap}',
      '.mjx-storyboard-cheatrow b{color:var(--tx);flex:0 0 58px}',
      '.mjx-storyboard-cheatrow .t{color:var(--tx3);font-variant-numeric:tabular-nums;flex:0 0 48px}',
      '.mjx-storyboard-cheatrow .c{color:#5fd4e8;flex:0 0 auto}',
      '.mjx-storyboard-cheatrow .k{flex:1;min-width:160px;color:var(--tx3)}',
      '@media(max-width:700px){',
      '  .mjx-storyboard-tplsel{max-width:150px;flex:1 1 auto}',
      '}',
      '@media(max-width:700px){',
      '  .sb-head{flex-wrap:wrap;gap:6px 8px;padding:10px 12px}',
      '  .sb-sum{flex-basis:100%;order:5}',
      '  .sb-f{flex-direction:column;gap:4px}',
      '  .sb-fl{text-align:left;padding-top:0;flex-basis:auto}',
      '  .sb-f-dur input{width:110px}',
      '  .sb-seg-row{flex-wrap:wrap;gap:4px 10px}',
      '}',
    ].join('\n');
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------- 模块注册 ---------- */
  const mod = {
    id: 'storyboard',
    icon: '🎬',
    name: '分镜板',
    cnt: '编辑器',
    after: 'llm', /* 紧跟「大模型应用」——本模块是其静态分镜模板的升级形态 */
    sub: ['分镜板工作台', '把「大模型应用」的静态分镜 JSON 模板变成可操作编辑器：镜号卡增删 / 上移下移 / 折叠，逐镜标注运镜、时长、台词与画面描述；总时长实时映射 98 秒六段结构、超时变红告警；一键导出流水线可消费的结构化 JSON——变更即存本机，刷新无损恢复。'],
    search: [
      { tit: '分镜板工作台 · 使用说明', txt: '镜号卡增删、上移下移、折叠展开，逐镜标注运镜、时长、台词、画面描述；实时汇总总镜数与总时长，超98秒变红告警；所有变更自动保存本地，刷新无损恢复。' },
      { tit: '分镜板工作台 · 导出 JSON', txt: '一键导出结构化镜头数组，字段对齐大模型应用的分镜JSON模板：shot_id / camera_move / duration_sec / action / dialogue(speaker,line)；台词用冒号分隔说话人，无台词导出null。' },
      { tit: '分镜板工作台 · 六段结构对照', txt: '黄金钩子0-3s、冲突建立3-15s、递进铺垫15-45s、黄金反转45-60s、爽点释放60-80s、卡点留钩80-98s；按镜头秒数画出分布条，逐段对照计划与参考时长。' },
      { tit: '分镜板工作台 · 段落模板与整集骨架', txt: '六段结构一键插入起步镜头组：黄金钩子/冲突建立/递进铺垫/黄金反转/爽点释放/卡点留钩各配推荐运镜、景别与执行要点；整集骨架28镜76.5s，各段镜数落在98秒六段结构参考区间内，余量留给加镜/加秒补足98s。' },
      { tit: '分镜板工作台 · 护栏检查与交接单', txt: '实时护栏五项：单镜2-6秒、台词单句≤15字、相邻镜号避免相同景别、台词镜头只用安全运镜（慢推/轻微视差/微手持）、甩镜一集≤3次；一键复制台词表（先配音后驱动画面）与分镜交接单（镜号/运镜/时长/景别/画面）。' },
    ],
    render: function (el, mj) {
      ctx = mj;
      root = el;
      injectStyle();
      restore();
      const hasShots = shots.length > 0;
      el.innerHTML =
        '<div class="callout blue"><b>分镜板工作台：</b>「大模型应用」里的分镜 JSON 模板在这里变成可操作的流水线工件——' +
        '增删 / 排序 / 折叠镜头卡，逐镜标注运镜与时长，总时长实时对照 ' + DB.hot.episodeMap.total + ' 秒单集六段结构，' +
        '超时变红告警，最后一键导出可直接喂给生图 / 生视频流水线的 JSON。</div>' +
        '<div class="insp-bar sb-toolbar">' +
        '<button type="button" class="btn pri" data-sb-act="add">＋ 添加镜头</button>' +
        '<span class="mjx-storyboard-tplwrap">' +
        '<select id="mjxStoryboardTplSel" class="mjx-storyboard-tplsel" title="把「爆款心法」六段结构一键插入为起步镜头组">' +
        '<option value="">📐 插入段落模板…</option>' +
        '<option value="all">全部六段 · 整集骨架（' + mjxStoryboardTplDur('all') + '）</option>' +
        mjxStoryboardSegTpl.map((t, i) =>
          '<option value="' + i + '">' + ctx.esc(t.name) + ' · ' + t.shots.length + '镜' + mjxStoryboardTplDur(i) + '</option>').join('') +
        '</select>' +
        '<button type="button" class="btn ghost" data-sb-act="tpl" title="把选中段落模板的镜头追加到分镜板末尾">插入</button>' +
        '</span>' +
        '<button type="button" class="btn ghost" data-sb-act="sample">📥 载入示例分镜</button>' +
        '<button type="button" class="btn ghost" data-sb-act="export">📤 导出 JSON</button>' +
        '<button type="button" class="btn ghost copy-btn" id="mjxStoryboardLinesBtn" disabled title="按镜号顺序复制台词表——「先配音、后驱动画面」工序用">🗒 台词表</button>' +
        '<button type="button" class="btn ghost copy-btn" id="mjxStoryboardListBtn" disabled title="复制轻量交接单：镜号｜运镜｜时长｜景别｜画面">📋 交接单</button>' +
        '<button type="button" class="btn ghost sb-btn-danger" data-sb-act="clear">🗑 清空</button>' +
        '<span class="mini-note" style="margin:0">变更即自动保存 · 刷新无损恢复</span>' +
        '</div>' +
        '<div class="chart-box sb-stats" id="sbStats"></div>' +
        mjxStoryboardCheatHTML() +
        '<h4 class="block-t">分镜卡 <span class="sub" id="sbListSub"></span></h4>' +
        '<div id="sbList"></div>' +
        '<div id="sbExportWrap"' + (hasShots ? '' : ' hidden') + '>' +
        '<h4 class="block-t">导出预览 <span class="sub">镜头数组 · 字段对齐「大模型应用」分镜 JSON 模板</span></h4>' +
        '<div class="codebox"><div class="cb-bar"><span id="sbExpMeta">' + (hasShots ? shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()) + ' · episode 数组' : '') + '</span>' +
        '<button type="button" class="copy-btn" id="sbExpCopy" data-copy="' + (hasShots ? ctx.regCopy(buildExportText()) : '') + '">复制</button></div>' +
        '<pre id="sbExpPre">' + (hasShots ? ctx.esc(buildExportText()) : '') + '</pre></div>' +
        '<p class="mini-note">导出为镜头数组：shot_id / camera_move / duration_sec / action / dialogue{speaker, line}，与「大模型应用」jsonExample 模板同名字段；台词按第一个「：」拆分说话人，无台词导出 null。景别仅用于板内排布自查与交接单，不进导出契约。</p>' +
        '</div>';
      bindEvents(el);
      renderList();
      refreshStats();
    },
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod); /* true=已注册；false=被拒（id 重复或缺必填字段） */
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod); /* app.js init 开头统一排水（兜底） */
  }
})();
