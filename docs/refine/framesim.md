# 细化方案：链路模拟器（framesim）

> 目标文件：`js/feat-framesim.js`（本方案全部代码改动仅落在这一个文件；除本文档外不改任何文件）
> 基线：feat-framesim.js 共 713 行，以 `<script src="js/feat-framesim.js?v=28">` 挂载（index.html:112），已被 sw.js 缓存列表收录（sw.js:5）。

## 一、现状盘点

**有什么（逐区清点，均实测自 js/feat-framesim.js 全文）：**

| 区块 | 规模 | 说明 |
|---|---|---|
| `CHECKS`（feat-framesim.js:30-34） | 3 条 | 衔接三检查（同场景 / 同光线 / 帧差合理），模块自己的方法论数据区 |
| `PRESET_META`（:36-44） | 6 条 | 预置镜头节点（fid 绑定 `DB.frameBank` f1-f6），蛇形三列两行排布 |
| 依赖数据 | `DB.frameBank` 10 题（js/data.js:707-838） | 首尾帧转场题库：`a`（首帧）/`move`（运镜）/`opts`（尾帧选项+why）；本模块 `defaults()`（:62-81）只取前 6 题（f7 移焦 / f8 固定推近 / f9 摇 / f10 降 未接入） |
| 画布交互 | 平移 / 缩放 30%-300% / 双击新建 / 节点拖拽 / 播放链路 | Pointer Events 手势（:504-581）、滚轮与悬浮按钮缩放（:659-667）、视口动画（:372-431） |
| 编辑与持久化 | 首帧 f / 运镜 m / 尾帧 l 就地编辑 + 三检查点灯 | localStorage「manju_framesim_v1」（:24），防抖保存（:84-89），脏数据兜底（:91-118） |
| 侧栏 | 引导卡（未选中）/ 镜头编辑器（选中）+ 复制本镜提示词 | `renderSide`（:330-369）、`copyTextOf`（:320-328） |
| 注入样式 | 97 条规则（:124-220，`<style id="fsFramesimStyle">`） | 全部 `fs-` 前缀、取用 style.css 既有 CSS 变量 |
| 注册元数据 | mod.search 3 条（:701-703） | 自注册 `window.MJ.addModule`（:693-712），`after: 'canvas'` |

**缺什么（最薄的三处 + 一处已知未接入）：**

1. **方法论知识零沉淀（最薄）**：模块把题库题目搬上了画布，但 research 档案里成体系的尾帧链实操要领一条都没进模块——「帧差↔运动类型」映射（research/05 §四第4条）、Match Cut 衔接词三选一（§四第6条）、FFmpeg 尾帧提取兜底（research/06 §四第5步）、出入点精确咬合（§四第2条）……引导卡里只有一句「规则速记」，速查数据区是空的。
2. **链路层面无视图**：三检查是单镜粒度，整链健康度（几镜待补文案、几灯未亮）不可见；复制只有单镜级（`copyTextOf`），没有整链导出——而尾帧链的价值恰恰在「链」，交付/存档都需要链级清单。
3. **运镜填写无支援**：运镜类型是个裸输入框，research/05 §一的运镜铁律（方向+速度+目的、一镜最多 1-2 种运镜、关系动词防滑行）没有在填写处出现。
4. **f7-f10 未接入预置链**：题库 10 题只用 6 题，画布示例覆盖 6 种运镜（推/横移/拉/甩/升/环绕），移焦、固定推近、摇、降四种运镜在示例链里缺席（处置见「六、不做的事」第 2 条）。

**风格说明（与任务提示的差异，以实际代码为准）**：任务模板提示「沿用反引号模板字符串风格」，但本模块数据区与渲染全部使用**单引号字符串 + ES5 拼接**（feat-framesim.js:30-44、:330-369 全区如此），反引号风格属 js/data.js 数据层。本方案新增代码一律沿用模块自身的单引号风格，不引入第二风格（与 docs/refine/picker.md 的处理一致）。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | 新增常量 `mjxFramesimLinkTips`：链路速查 10 条（`{ g, n, d }`，g=分组小标题、n/d 与同区 CHECKS 条目字段一致），分「帧差心法 / 运镜口令 / 链路流水线」三组 | 插入 `PRESET_META` 注释行（:36）之前 | research/05 §四第1/2/4/5/6条、§一第1/2/3/4/5条；research/06 §四第5步；research/10 §一「参考图挂载」；research/19 §A2.1 防崩七步第2/7条+止损数字（逐条对照见 §四） |
| 2 | 新增 `mjxFramesimInjectStyle()`：独立 `<style id="mjxFramesimStyle">`，12 条 `.mjx-framesim-*` 规则（速查卡 / 运镜口令提示 / 复制整链按钮） | 插入「几何」注释行（:228）之前 | 纯样式，颜色/圆角全部取自 style.css:6-15 既有变量（--panel2/--line/--line2/--p1/--tx/--tx2/--tx3，已实测存在） |
| 3 | 新增两个渲染辅助 `mjxFramesimTipsHtml()`（分组渲染速查卡，原生 `<details>` 收纳）与 `mjxFramesimChainText()`（整链导出文案：链路总览 + 每镜首/尾帧/运镜/三检查 + 使用提醒） | 插入「渲染」注释行（:275）之前 | 数据同 #1；文案结构对齐既有 `copyTextOf`（:320-328） |
| 4 | `renderStat` 整函数替换：统计区升级为「共 N 镜 · 待补文案 x 镜 · 检查未亮 y / 全链三检查已亮 ✓ · 自动保存本地」+「📋 复制整链」按钮（走平台 `[data-copy]` 文档级委托，app.js:1958，零新监听） | 整函数替换（:315-317） | 交互增强（一键复制整组类），无新增研究口径 |
| 5 | `renderSide` 整函数替换：未选中引导卡下方挂速查卡；选中态运镜输入框下加一行「运镜口令公式」提示；两种状态尾部均可展开速查卡。原有引导/编辑器文案逐字保留 | 整函数替换（:330-369） | movehint 出处：research/05 §一第1/2条；速查卡数据同 #1 |
| 6 | `toggleCk` 整函数替换：点灯后补调 `renderStat()`，统计区「检查未亮」即时刷新 | 整函数替换（:438-443） | 纯交互一致性，无新增数据 |
| 7 | `scheduleSave` 整行替换：防抖保存回调里补调 `renderStat()`——首/尾帧文案改动停止输入 260ms 后「待补文案」计数跟随，且不逐键注册复制句柄 | 整行替换（:88） | 纯交互一致性，无新增数据 |

不改动：`CHECKS` 全部 3 条、`PRESET_META` 全部 6 条、`mod.search`、存储键 `manju_framesim_v1` 与 `loadState` 校验逻辑、`defaults()`、几何/手势/播放/视口函数、`copyTextOf`、`render()` 本体。所有新增 JS 标识符以 `mjxFramesim` 前缀、CSS 类以 `mjx-framesim-` 前缀（已 grep 确认全站 js/ css/ 零占用）。补丁完整代码合计 **137 行**（预算 ~350 行内），已通过语法与行为校验（见 §三末尾）。

## 三、落点与代码

以下 7 处改动均在 `js/feat-framesim.js`。行号以**未打补丁的当前文件**为准，**请自底向上（先改大行号处）应用**，避免插入使后续锚点移位。代码块均为完整可粘贴最终形态，无省略。

### 改动 1：插入增补数据区 `mjxFramesimLinkTips`

- **锚点**：单行注释 `  /* ---------- 预置镜头元信息：取 DB.frameBank 前 6 题，蛇形排布成示例链 ---------- */`（当前 36 行）。该行保留，在其**之前**插入以下整块：

```js
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
```

### 改动 2：插入增补样式注入函数 `mjxFramesimInjectStyle`

- **锚点**：单行注释 `  /* ================= 几何：贝塞尔链路与箭头 ================= */`（当前 228 行）。该行保留，在其**之前**插入以下整块：

```js
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
```

### 改动 3：插入两个增补渲染辅助函数

- **锚点**：单行注释 `  /* ================= 渲染：画布 / 侧栏 / 统计 ================= */`（当前 275 行）。该行保留，在其**之前**插入以下整块：

```js
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
```

### 改动 4：`renderStat` 整函数替换

- **锚点**：`function renderStat() {` 起至其闭合 `}` 止的整个函数（当前 315-317 行）。
- **替换为**：

```js
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
```

### 改动 5：`renderSide` 整函数替换

- **锚点**：`function renderSide() {` 起至其闭合 `}` 止的整个函数（当前 330-369 行）。
- **替换为**（原引导卡与编辑器文案逐字保留，新增三处：首行样式注入、运镜输入框下口令提示、两种状态尾部挂速查卡）：

```js
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
```

### 改动 6：`toggleCk` 整函数替换

- **锚点**：`function toggleCk(i) {` 起至其闭合 `}` 止的整个函数（当前 438-443 行）。
- **替换为**：

```js
  function toggleCk(i) {
    var n = byId(S.sel);
    if (!n) return;
    n.cks[i] = !n.cks[i];
    renderNodes(); renderStat(); renderSide(); save();   // 增补 renderStat：点灯后统计区「检查未亮」即时刷新
  }
```

### 改动 7：`scheduleSave` 整行替换

- **锚点**：当前 88 行整行。
- **替换为**：

```js
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { save(); renderStat(); }, 260); }   // 增补 renderStat：随防抖保存刷新统计（改首尾帧文案后「待补文案」计数跟随）
```

**合计与校验**：补丁完整代码 7 块合计 **137 行**。校验过程（本方案编写时实测）：① 按上述 7 处改动对 feat-framesim.js 副本拼接后跑 `node --check`——通过；② 在 Node 桩环境（stub 掉 `esc`/`CHECKS`/`S`/`byId`，与模块内同名同义）中实际执行 `mjxFramesimTipsHtml` / `mjxFramesimChainText` 与统计口径——3 组速查、10 条条目、组序「帧差心法→运镜口令→链路流水线」、链路总览行、待填占位、三检查✓/✗ 行、空链返回空串、miss/dim 计数全部通过；③ 原文件 `renderSide` 全部原行经逐行子序列核对确认逐字保留（唯一差异：引导卡 gnote 行行尾 `';` → `' +`，为拼接速查卡所必需，文字零改动）。

**行为说明（落地后可预期）**：复制整链按钮复用平台 `[data-copy]` 文档级委托（app.js:1958-1960 → `doCopy`），未新增任何事件监听；速查卡为原生 `<details>`，零 JS 事件；侧栏每次重渲染（切镜/点灯/播放步进）速查卡会回到收起态——与侧栏既有滚动复位行为（`sideEl.scrollTop = 0`）一致，属可接受的小折衷；统计区 innerHTML 只拼模块自建字符串与计数，用户文案一律经 `MJ.esc`（app.js:15）转义后进入侧栏，无注入面。

## 四、来源对照表

> research/*.md 为全站事实源头；逐条对应如下（引用处均为档案原文口径，未做数字改写）。

### mjxFramesimLinkTips（10 条）

| 条目 | 出处 |
|---|---|
| 帧差即运动语言 | research/05-运镜与提示词.md §四「首尾帧技巧」第4条（帧间差异定义运动类型：位置差→位移；表情差→情绪；景别差→推拉；构图差→转场；想要推镜，就让尾帧=首帧的放大构图） |
| 两帧共享视觉DNA | research/05 §四 第1条（同宽高比、相近曝光、相似构图与色调、主体一致；帧差越小中间运动越干净；差距过大模型会"发明"中间内容） |
| 跨度小是废片防线 | research/10-实战SOP深化.md §一「参考图挂载」（首尾帧两帧关联性不要太远（构图/位置/景别跨度小），否则运镜不完整是废片主因） |
| 出入点精确咬合 | research/05 §四 第2条（片段控制在2-5秒；剪辑时让出入点精确落在上传的两帧上） |
| 方向+速度+目的 | research/05 §一「运镜铁律」第1条（运镜动词必须带方向+速度，模型没有默认速度）、第3条（运镜要带目的，"pan left to reveal…" 优于光杆 "pan left"）、第4条（关系动词连接镜头与主体防滑行） |
| 一镜最多1-2种运镜 | research/05 §一 第2条（最多1-2种运镜，堆三个以上必漂移）+ research/19-数字人口型表演与美术风格进阶.md §A2.1「防崩七步」第2条（安全动作为慢推、轻微视差、微手持；快速环绕、甩镜、大幅转头在稳定前禁用） |
| 15秒拆3镜各5秒 | research/05 §一 第5条（每镜=1个基础运镜+1个标志性运镜；15秒拆3镜各5秒，每镜以运镜动词开头） |
| 尾帧提取兜底 | research/06-无限画布.md §四「七步实操工作流」第5步 逐镜连绘（视频化时尾帧链——供应商不返回尾帧时用FFmpeg从成片提取） |
| Match Cut 三选一 | research/05 §四 第6条（取A最后帧作B首帧；一句话写衔接类型 morph/match cut/whip pan 三选一；加约束词 no extra elements, camera locked） |
| 稳定帧即锚点 | research/19 §A2.1「防崩七步」第7条 参考链锚定（任一稳定帧导出作下一镜锚点首帧，减少模型"自由发挥"）+ 同节「止损数字」（脸稳定4秒但6秒崩→保留前4秒或拆成两镜） |

### 其他新增文案

| 位置 | 出处 |
|---|---|
| `mjxFramesimChainText` 使用提醒「分段首尾帧统一做一致性校准再开拍」 | research/05 §四 第5条（所有分段首尾帧统一导入图像工具做一致性校准） |
| `mjxFramesimChainText` 使用提醒「上一镜成品即下一镜的参考图」 | research/06 §四 第5步（上一镜成品=下一镜参考） |
| `renderSide` movehint「口令公式：运镜动词＋方向＋速度＋目的……一镜最多 1-2 种运镜」 | research/05 §一 第1/2条（浓缩句） |

## 五、需人工核实

无。所有新增数据均逐条溯源至 research/*.md 原文口径（见 §四）；源档案中自带保留标记的内容一律未采用——如 research/19:88 的「GPT Image 2 定妆照+分镜故事板」工作流（源档案标**【存疑】**）与 research/19:72 换装定妆法（标**【经验推断】**）均未进入代码。

## 六、不做的事

1. **不动 `CHECKS` / `PRESET_META` / `mod.search` / 存储与载入逻辑**：三检查点灯数组 `cks` 在渲染（`nodeSvg` 三灯循环，feat-framesim.js:257）、持久化格式与 `loadState` 校验（:101，`n.cks.length === 3`）中全链路硬编码长度 3——向 `CHECKS` 加第 4 项会破坏老用户存档与节点渲染，收益不抵，故速查内容以独立常量旁路新增。
2. **不把预置链扩展到 f7-f10**：`DB.frameBank` 的 f7（移焦）/ f8（固定推近）/ f9（摇）/ f10（降）暂未接入 `PRESET_META`——接入需同步修改 `render()` 页脚「f1-f6」说明（:612）与 `resetAll` 提示「6 个题库镜头」（:476），意味着整函数替换 107 行的 `render()`，可审性差；且既有用户 localStorage 存档不受默认画布影响，扩展只惠及新用户。留待模块官方升级时一并处理。
3. **不动公共设施**：`render()` / `renderCanvas()` / 路由 / 命令面板 / 全局搜索 / 收藏系统 / `[data-copy]`·`[data-go]` 委托（app.js）均不触碰；不新建模块、不改 index.html / sw.js / css / js/data.js。
4. **部署提示（不属本方案文件清单）**：feat-framesim.js 在 index.html:112 以 `?v=28` 挂载、sw.js:5 缓存列表收录——应用本补丁后应按平台惯例递增该版本参数与 SW 缓存版本号，否则老用户拿不到更新。
5. **不把研究档案中带保留标记的补充知识写进代码**：见 §五；各模型价格、积分政策等高时效口径也未引入（本模块本就不涉工具价格）。
6. **不改既有数字口径与文案**：`CHECKS` 三条描述、引导卡、编辑器占位符、search 3 条一概逐字保留（唯一差异为改动 5 中 gnote 行尾连接符，见 §三校验说明）。
