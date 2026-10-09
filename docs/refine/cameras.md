# 细化方案：运镜宝典与运镜速配自测

> 模块 id：`cameras` · 数据区 `js/data.js:346-460`（cameras/camRules/camTalkRules/camEmoMap）与 `js/data.js:1721-1754`（quizBank） · 渲染函数 `js/app.js:492-503`（cameras 视图）、`js/app.js:960-984`（renderCams）、`js/app.js:1000-1073`（速配自测）
> 本方案为补丁文档，只写入 `docs/refine/cameras.md`；`js/`、`css/`、`index.html`、`sw.js`、`research/` 一律只读，由实施者按本文代码块落地。
> 补丁代码合计约 124 行（app.js 三个整函数替换块 85 行 + data.js 五处代码块 33 行，其中纯新增约 23 行、其余为锚点上下文 + css 6 行），远低于 350 行上限。文内行号以 2026-10-07 工作区版本为准（js/ 下有未提交改动，若后续有新提交请以锚点文本重新定位）。
> 所有补丁代码已在临时目录对 js/data.js、js/app.js 实际试打过：锚点全部命中且唯一，`node --check` 通过，VM 冒烟跑通（22 卡全渲染、6 分组标题、38 题答案全部命中卡名、答题反馈含 EN 提示词复制按钮）。

---

## 一、现状盘点

**数据区构成**（js/data.js，经 Node VM 实测计数）：

| 键 | 形态 | 条目数 | 内容 |
|---|---|---|---|
| `cameras` | `{m,n,en,emo[],pen,pcn,use}` 数组 | 21（16 基础运镜 + 5 台词镜头） | 每条含动画 motion 键、中英可复制提示词、漫剧用法 |
| `camRules` | 字符串数组 | 6 | 运镜铁律（Runway 官方指南口径：方向+速度+目的、≤2 种运镜等） |
| `camTalkRules` | 字符串数组 | 8 | 台词镜头运镜约束（一人开口/五段式/先配音后驱动/禁改条款等） |
| `camEmoMap` | `{emo,sig,cams,tip}` 数组 | 8 | 运镜×情绪映射表（隐忍愤怒→群像史诗） |
| `quizBank` | `{q,a}` 数组 | 31 | 速配自测题库（场景题 16 + 首尾帧题 7 + 台词镜头题 8） |

**渲染层**（js/app.js）：`cameras()` 视图 = 铁律 callout + v1.5 版本动态 + 台词约束 callout + 情绪映射表 + 收藏筛选 + 卡片网格 + 折叠自测区（492-503）；`renderCams()` 平铺渲染卡片、含收藏/深链/双提示词复制（960-984）；自测三件套 quizStart/quizRender/quizPick（1020-1073）；`camDemo()` CSS 动画外壳支持暂停/0.5×/1×/2× 变速（419-432）。CSS 侧 `css/style.css:383-417` 卡面、562-583 共 18 条 `data-motion` 关键帧挂载（另有未使用的 `cmBullet`）、618 视口外自动暂停。

**模块外引用点**（全部自动跟随数据增量，无需改动）：导航计数 `js/app.js:102`（`DB.cameras.length+'种'`）、总览副标题 `js/app.js:125`、全局搜索索引 `js/app.js:1786,1793`（遍历 `DB.cameras`/`DB.quizBank`）、路由懒渲染钩子 `js/app.js:238-239`。

**已有优势**：16 种基础运镜动画+双语提示词是全站最扎实的"照抄即用"资产；台词五件套（正反打/过肩/反应/插入空镜/情绪推拉）已把 research/19 的口型掩护链路落成卡片；铁律与台词约束两条 callout 口径清晰。

**薄点（按严重度排序，均为本次盘点实测）**：

1. **模型适配层整块缺失，且页面承诺落空**。22 张卡只给一条"通用"提示词，但同一句运镜提示词在不同模型响应差异巨大——research/05 §五有现成的 7 家对照表未进站。页面尾部 mini-note 写着"各家模型对运镜指令的响应差异见「大模型应用」"（js/app.js:501），经核实大模型应用数据区（js/data.js:840-1050）**并没有**运镜控制差异内容；学习路径周3还要求"建立自己的运镜-模型适配表"（js/data.js:1390），平台没给起点。
2. **卡片平铺无结构**：台词五件套与 16 条基础运镜混排一整面墙，无分组小标题、无整组复制——新手抓不住"对话戏该从哪 5 张卡看起"。
3. **自测闭环差最后一厘米**：答题反馈只给 `use` 一句（js/app.js:1068-1071），答完看不到可直接抄的提示词，"练出条件反射"到"上手写提示词"断链。
4. **角度层缺 Dutch（荷兰角）**：research/10 §一角度枚举（平/俯/仰/过肩/Dutch）里的 Dutch 在宝典 22 类镜头中无对应条目，倾斜系运镜是空白。
5. **camTalkRules 缺可直接抄的模板句**：已讲"先配音后驱动画面"（js/data.js:447），但没有给出 research/05 §更新里现成的 `"@图片中的{角色} 说：{台词}"` 句式与情绪标注词位置。

---

## 二、变更清单（逐条，含出处）

共 **16 条新增数据条目 + 1 个新键 + 3 个整函数替换 + 1 段 CSS**。所有新增条目字段结构与同区现有条目完全一致（cameras 区严格保持 `m/n/en/emo/pen/pcn/use` 七字段，经 VM 断言）；既有条目与既有数字口径**零改动**。

| # | 落点 | 类型 | 内容摘要 | 出处 |
|---|---|---|---|---|
| 1 | `cameras` +1（荷兰角） | 新增条目（4 行，字段同区一致） | 倾斜系运镜 Dutch angle：动画键 `dutch` + 中英提示词 + 漫剧用法 | research/10 §一（角度枚举含 Dutch）；pen/pcn 按 research/05 §一铁律编写；use 含一句【经验】演绎（见「五」） |
| 2 | 区注释 16种→22种 | 注释修正 | `运镜宝典（16种）`→`运镜宝典（22种）`（注释在 5 条台词镜头入站时已漏更） | 计数一致性，非内容 |
| 3 | `camTalkRules` +1 | 新增条目 | 图生视频台词模板：`"@图片中的{角色} 说：{台词}"`，情绪标注词（[悲伤][激动]）放台词前 | research/05 §更新·2026-10-01「音画同步模板（Seedance 2.0 漫剧手册）」（站内仅 line:148/1566 有情绪标注词概念，无此句式） |
| 4 | `camEmoMap` +1（心虚隐瞒） | 新增条目 | sig=视线避开/话说一半停顿/指尖摩挲杯沿；cams=固定机位 → 移焦【经验】 | sig 词汇：research/05 §更新「微表情与台词戏：分层公式」（眼神方向/肢体语言/语气节奏三层的原词）；cams 与 tip 后半句为本表既有风格的组内演绎，尾缀【经验】（见「五」） |
| 5 | `camModelMap` 新键（7 行） | 新增键 | 7 家模型运镜控制方式+注意点对照（可灵面板/即梦中文复合词/Runway 术语精准/Vidu 分级词/通义时间戳/Luma 关键帧/Pika 参数式） | research/05 §五「各家运镜控制差异」逐行迁移；可灵行 smooth motion 与 js/data.js:303 con 字段同口径；Pika 行与 js/data.js:310 同口径 |
| 6 | `quizBank` +7 | 新增条目 | 荷兰角 1 题、横移/俯仰摇/移焦机位-焦点辨析 3 题、插入空镜 1 题、希区柯克变焦对比辨析 1 题、升镜头收尾 1 题 | 逐题出处见「四」 |
| 7 | app.js `cameras()` | 整函数替换 | 新增「各家模型运镜控制差异」表（读 `DB.camModelMap`）；尾部 mini-note 改为指向新表+工具库（兑现原承诺）；其余区块原样保留 | 渲染增量 |
| 8 | app.js `renderCams()` + `mjxCamerasGroups` | 整函数替换 | 6 个分组小标题（推进与揭示/同行与跟随/升降与规模/高光与奇观/真实与克制/台词戏五件套）+ 每组「一键复制整组EN提示词」；未收录名称自动落「🧩 其他」组；收藏筛选、深链、逐卡复制、动画观察器全保留 | 交互增强（组内分组+整组复制，均在模块自身渲染函数内） |
| 9 | app.js `quizPick()` | 整函数替换 | 答题反馈追加该运镜的 EN 提示词 + 复制按钮（复用既有 `regCopy`/`data-copy` 体系） | 交互增强 |
| 10 | css/style.css 追加 6 行 | 样式增量 | `.mjx-cameras-ghead`/`.mjx-cameras-gcnt` 分组标题样式；`dutch` 动画挂载与 `mjxCamerasDutch` 关键帧（复用 `--spd` 变速与视口外暂停机制） | 交互增强（新类均带 mjx-cameras- 前缀；dutch 用既有 `data-motion` 选择器挂载） |

---

## 三、落点与代码

### 改动 1：`js/data.js` — 区注释计数修正（锚点：`js/data.js:346`）

将：

```
/* ================= 运镜宝典（16种） ================= */
```

替换为：

```
/* ================= 运镜宝典（22种） ================= */
```

### 改动 2：`js/data.js` — cameras 追加「荷兰角」条目（锚点：`js/data.js:396-400`，固定机位条目收尾 + 移焦条目开头，全文唯一）

将：

```
    use: `谈判桌对峙；主角沉默；宣判时刻。静止镜头最难，必须写明 motionless。` },
  { m: `rack`, n: `移焦`, en: `Rack focus`, emo: [`揭示`, `注意转移`],
```

替换为：

```
    use: `谈判桌对峙；主角沉默；宣判时刻。静止镜头最难，必须写明 motionless。` },
  { m: `dutch`, n: `荷兰角`, en: `Dutch angle / Canted angle`, emo: [`不安`, `失衡`, `疯感`],
    pen: `slow dutch angle tilting clockwise, horizon slanting as the room loses its balance, subtle`,
    pcn: `荷兰角：地平线缓缓倾斜，房间仿佛失去平衡，幅度轻微`,
    use: `疑心戏"被监视感"；疯狂/失控/邪教氛围；揭穿前夜世界"歪了"的主观时刻——多与固定机位或缓推叠加，一镜即收【经验】。` },
  { m: `rack`, n: `移焦`, en: `Rack focus`, emo: [`揭示`, `注意转移`],
```

### 改动 3：`js/data.js` — camTalkRules 追加音画同步模板句（锚点：`js/data.js:447-448`，全文唯一）

将：

```
  `先配音后驱动画面：音频定稿→按单句剪音频（长句拆2-3段、接缝补1-2帧）→逐句驱动，顺序不能反`,
  `一镜只安排一次情绪转折；首帧若是中性脸，视频阶段救不回来——先重写静态表情再生成`,
```

替换为：

```
  `先配音后驱动画面：音频定稿→按单句剪音频（长句拆2-3段、接缝补1-2帧）→逐句驱动，顺序不能反`,
  `图生视频台词模板：先TTS定稿音频，再写"@图片中的{角色} 说：{台词}"——情绪标注词（[悲伤][激动]）放台词前，口型与音频同步`,
  `一镜只安排一次情绪转折；首帧若是中性脸，视频阶段救不回来——先重写静态表情再生成`,
```

### 改动 4：`js/data.js` — camEmoMap 追加 1 行 + 其后新增 `camModelMap` 键（锚点：`js/data.js:459-462`，群像史诗行收尾 + 提示词库注释，全文唯一）

将：

```
  { emo: `群像史诗`, sig: `尸山血海、万人齐望`, cams: `升镜头 → 降镜头`, tip: `升镜头收场面、降镜头落个体接戏，升完必降形成叙事闭环` },
],

/* ================= 提示词库 ================= */
```

替换为：

```
  { emo: `群像史诗`, sig: `尸山血海、万人齐望`, cams: `升镜头 → 降镜头`, tip: `升镜头收场面、降镜头落个体接戏，升完必降形成叙事闭环` },
  { emo: `心虚隐瞒`, sig: `视线避开、话说一半停顿、指尖摩挲杯沿`, cams: `固定机位 → 移焦`, tip: `视线避开=心虚，猛然抬起=转折；把注意力移到手部小动作上，不切镜完成攻防【经验】` },
],
camModelMap: [
  { m: `可灵`, ctrl: `运镜控制面板（6基本+4大师）+运动幅度+首尾帧`, note: `面板与提示词切忌双重指挥；图生视频加 smooth motion 稳住` },
  { m: `即梦 / Seedance`, ctrl: `无面板，靠提示词+首尾帧（多模态参考可参考运镜）`, note: `中文复合运镜词响应好；"图生视频+首尾帧"最强` },
  { m: `Runway Gen-4`, ctrl: `纯提示词，专业术语响应最精准`, note: `无负向栏，约束正着写；静止必须写 motionless；删掉 cinematic/4K 等无效词` },
  { m: `Vidu`, ctrl: `纯提示词+运镜词典；参考生视频锚定一致性`, note: `用运动幅度分级词"轻微/明显/剧烈"；避免大幅拉镜` },
  { m: `通义万相`, ctrl: `API公式；唯一官方时间戳多镜头写法`, note: `"第2个镜头[4-6秒]硬切转场，固定机位…"式分段下达` },
  { m: `Luma`, ctrl: `结构化关键帧（首尾帧+多锚点）`, note: `提示词只写两帧之间的连续运动` },
  { m: `Pika`, ctrl: `-camera 参数式`, note: `简单运镜+特效玩法，叙事精度弱` },
],

/* ================= 提示词库 ================= */
```

### 改动 5：`js/data.js` — quizBank 追加 7 题（锚点：`js/data.js:1753-1754`，雨夜天台题收尾，全文唯一）

将：

```
  { q: `雨夜天台两人沉默对望，镜头一动不动，画面里只有雨丝在动——用哪种运镜？`, a: `固定机位` },
],
```

替换为：

```
  { q: `雨夜天台两人沉默对望，镜头一动不动，画面里只有雨丝在动——用哪种运镜？`, a: `固定机位` },
  { q: `疑心戏：主角总觉得有人在暗处盯着自己，画面地平线整个斜了、世界失去平衡——用哪种运镜/角度？`, a: `荷兰角` },
  { q: `机位沿着整面证据墙平行滑动，画框依次掠过每件证物——机位本身在动，不是原地转。是哪种运镜？`, a: `横移` },
  { q: `机位原地不动，只有镜头从墓碑的刻字缓缓向上翻，最后停在他低头凝视的侧脸——是哪种运镜？`, a: `俯仰摇` },
  { q: `A说完狠话，镜头切到门后墙上挂着的全家福老照片，画面里没有任何活人——用哪种镜头掩护口型？`, a: `插入空镜` },
  { q: `谈判戏机位锁死，焦点却从他的脸缓缓移到桌下攥紧的拳头——镜头没动，注意力动了。是哪种运镜？`, a: `移焦` },
  { q: `同样是"猛扑向主角的脸"：急推变焦是整个画面撞过去，而"推近他的脸同时背景被拉远扭曲"是哪种？`, a: `希区柯克变焦` },
  { q: `单集收尾：镜头从主角仰头的小小背影缓缓上升，直到整座燃烧的城尽收眼底再黑场——用哪种运镜？`, a: `升镜头` },
],
```

### 改动 6：`js/app.js` — cameras 视图整函数替换（锚点：`js/app.js:492-503`，`cameras() {` 至其收尾 `},`，全文唯一）

将整个 `cameras() { … },` 函数替换为：

```js
    cameras() {
      return '<div class="callout blue"><b>运镜铁律（Runway官方指南 2025-2026）：</b>' + DB.camRules.join('；') + '。每格演示左下角可 <b>暂停 / 0.5× / 1× / 2×</b> 变速观察。</div>' +
        '<div class="callout"><b>版本动态（v1.5）：</b>可灵4.0已正式上线（2026-09末）——3-30秒生成、720P/1080P/4K直出（1080P与4K支持10-bit HDR）、全能参考多主体控制，续写功能可把片段串联至2分钟且角色场景基本不漂移；正式版初期排队拥堵，"4.0大场面+3.0 Omni跑量"是当前最优组合。八款模型横向对比见「工具库」顶部速查表。</div>' +
        '<div class="callout red" style="margin-bottom:16px"><b>台词镜头运镜约束（research/19 · 口型表演进阶）：</b>' + DB.camTalkRules.join('；') + '。</div>' +
        '<h4 class="block-t">各家模型运镜控制差异 <span class="sub">同一句运镜提示词不通用 · 学习路径周3"运镜-模型适配表"的起点</span></h4>' +
        '<div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl"><thead><tr><th>模型</th><th>运镜控制方式</th><th>注意点</th></tr></thead><tbody>' +
        DB.camModelMap.map((r) => '<tr><td><b>' + r.m + '</b></td><td>' + r.ctrl + '</td><td style="color:var(--tx2)">' + r.note + '</td></tr>').join('') + '</tbody></table></div>' +
        '<h4 class="block-t">运镜×情绪映射表 <span class="sub">' + DB.camEmoMap.length + '个戏剧时刻 → 观众信号 + 运镜组合</span></h4>' +
        '<div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl"><thead><tr><th>戏剧时刻</th><th>观众信号（照抄进提示词）</th><th>运镜组合</th><th>节拍提示</th></tr></thead><tbody>' +
        DB.camEmoMap.map((r) => '<tr><td><b>' + r.emo + '</b></td><td style="color:var(--tx2)">' + r.sig + '</td><td>' + r.cams + '</td><td style="color:var(--tx2)">' + r.tip + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="tool-filters"><span class="chip' + (camFav ? ' on' : '') + '" data-camfav="1">★ 只看收藏</span><span class="mini-note" style="margin:0">点卡片右上角 ☆ 收藏常用运镜，拍摄时一键调出</span></div>' +
        '<div class="cam-grid" id="camGrid"></div>' +
        '<p class="mini-note">※ 动画为CSS示意效果，用于直观理解每种运镜的画面关系；各家模型对运镜指令的响应差异见上方对照表，模型价格与版本细节见「工具库」。</p>' +
        '<details id="camQuizDetails" style="margin-top:20px"><summary style="cursor:pointer;font-weight:800;font-size:15px;padding:12px 0">🎯 运镜速配挑战（练习）</summary><div id="quizBox" style="margin-top:8px"></div></details>';
    },
```

### 改动 7：`js/app.js` — renderCams 整函数替换（含分组常量；锚点：`js/app.js:960-984`，从注释 `/* ---------- 运镜收藏过滤 ---------- */` 到 renderCams 收尾 `}`，全文唯一）

将整块替换为：

```js
  /* ---------- 运镜收藏过滤 ---------- */
  let camFav = false;
  const mjxCamerasGroups = [
    { ico: '🎯', n: '推进与揭示', ns: ['推镜头', '拉镜头', '摇镜头', '甩镜头', '移焦'] },
    { ico: '🚶', n: '同行与跟随', ns: ['横移', '跟拍'] },
    { ico: '🏗️', n: '升降与规模', ns: ['升镜头', '降镜头', '俯仰摇'] },
    { ico: '⚡', n: '高光与奇观', ns: ['环绕', '急推变焦', '希区柯克变焦', '穿越/子弹时间'] },
    { ico: '🎬', n: '真实与克制', ns: ['手持晃动', '固定机位', '荷兰角'] },
    { ico: '💬', n: '台词戏五件套', ns: ['正反打', '过肩镜头', '反应镜头', '插入空镜', '情绪推拉'] },
  ];
  function renderCams() {
    const grid = $('#camGrid');
    if (!grid) return;
    const favs = loadFavs();
    const list = camFav ? DB.cameras.filter((c) => favs.has(c.n)) : DB.cameras;
    if (!list.length) {
      grid.innerHTML = '<div class="callout violet" style="grid-column:1/-1;margin:0"><b>还没有收藏的运镜。</b>浏览时点击卡片右上角的 ☆，拍摄分镜时就能一键调出你的常用镜头语言。</div>';
      return;
    }
    const card = (c) => {
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
    };
    const byN = {};
    list.forEach((c) => { byN[c.n] = c; });
    const used = new Set();
    const ghead = (label, cnt, cid) => '<div class="mjx-cameras-ghead"><b>' + label + '</b><span class="mjx-cameras-gcnt">' + cnt + '</span>' +
      '<button class="copy-btn" data-copy="' + cid + '">📋 复制整组EN提示词</button></div>';
    let html = '';
    mjxCamerasGroups.forEach((g) => {
      const items = g.ns.map((n) => byN[n]).filter(Boolean);
      if (!items.length) return;
      items.forEach((c) => used.add(c.n));
      html += ghead(g.ico + ' ' + g.n, items.length + '种', regCopy(items.map((c) => '【' + c.n + '】' + c.pen).join('\n'))) + items.map(card).join('');
    });
    const rest = list.filter((c) => !used.has(c.n));
    if (rest.length) html += ghead('🧩 其他', rest.length + '种', regCopy(rest.map((c) => '【' + c.n + '】' + c.pen).join('\n'))) + rest.map(card).join('');
    grid.innerHTML = html;
    observeCamDemos();
  }
```

说明：卡片构建逻辑与原实现逐字一致（收藏 ☆、深链 🔗、双提示词复制、`camDemo` 动画、`observeCamDemos` 全保留）；分组为纯展示层，未收录的新运镜名自动进「🧩 其他」组，不会丢卡。整组复制按钮复用全局既有的 `data-copy` 委托（js/app.js:1958-1959）与 `regCopy` 注册表（js/app.js:47），无需新增任何全局事件代码。

### 改动 8：`js/app.js` — quizPick 整函数替换（锚点：`js/app.js:1054-1072`，`function quizPick(opt) {` 至其收尾 `}`，全文唯一）

将整个函数替换为：

```js
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
    const idP = cam.pen ? regCopy(cam.pen) : null;
    const fb = $('#quizFb');
    if (fb) fb.innerHTML = '<div class="quiz-fb" style="border-color:' + (correct ? 'rgba(52,211,153,.45)' : 'rgba(244,63,94,.45)') + '">' +
      '<b style="color:' + (correct ? 'var(--ok)' : 'var(--hot)') + '">' + (correct ? '✓ 正确！' : '✗ 正确答案：' + esc(q.a)) + '</b>' +
      '<span style="color:var(--tx3)"> ' + esc(cam.use || '') + '</span>' +
      (idP ? '<div class="cam-p" style="margin-top:8px"><span class="cp-k">EN</span><span class="cp-v">' + esc(cam.pen) + '</span><button class="copy-btn" data-copy="' + idP + '">复制</button></div>' : '') +
      '</div>' +
      '<button class="btn pri" data-quiz-next style="margin-top:12px">' + (st.idx === st.qs.length - 1 ? '看结果 →' : '下一题 →') + '</button>';
  }
```

### 改动 9：`css/style.css` — 追加分组标题样式与荷兰角动画（锚点：`css/style.css:618`，规则 `.cam-demo.off *{animation-play-state:paused !important}` 之后）

```css
/* ---------- mjx-cameras：运镜宝典增强（分组标题 + 荷兰角演示） ---------- */
.mjx-cameras-ghead{grid-column:1/-1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;padding:10px 2px 0;border-top:1px dashed var(--line)}
.mjx-cameras-ghead b{font-size:14.5px}
.mjx-cameras-gcnt{font-size:11px;color:var(--tx3);border:1px solid var(--line);border-radius:20px;padding:1px 8px}
.cam-demo[data-motion="dutch"] .cam-scene{inset:-28%;animation:mjxCamerasDutch calc(4.6s*var(--spd,1)) ease-in-out infinite alternate}
@keyframes mjxCamerasDutch{0%,12%{transform:rotate(-7deg)}58%,100%{transform:rotate(7deg)}}
```

说明：关键帧写法（`0%,12%{…}58%,100%{…}` + `infinite alternate`）沿用既有 `cm*` 系列的 house style（css/style.css:540-561）；`inset:-28%` 为旋转预留出血，±7° 不露底；自动继承视口外暂停（css/style.css:618）与 prefers-reduced-motion 降级（css/style.css:586-590）。

---

## 四、来源对照表

| 新增数据 | 出处（research/ 为全站事实源头） |
|---|---|
| 荷兰角条目（含动画键 dutch） | research/10-实战SOP深化.md §一「镜头语言量化」（角度枚举：平/俯/仰/过肩/Dutch）；pen/pcn 按 research/05-运镜与提示词.md §一运镜铁律（方向+速度+目的）编写 |
| camTalkRules「@图片中的{角色} 说：{台词}」模板句 | research/05 §更新·2026-10-01「音画同步模板（Seedance 2.0 漫剧手册）」 |
| camEmoMap「心虚隐瞒」sig 三词 | research/05 §更新「微表情与台词戏：分层公式」（眼神方向：视线避开=心虚、猛然抬起=转折；肢体语言：摩挲杯沿；语气节奏：说到一半停顿） |
| camModelMap 全部 7 行 | research/05 §五「各家运镜控制差异」表（控制方式/注意点两列逐行迁移）；交叉核对站内 js/data.js:303（可灵 smooth motion）、js/data.js:310（Pika -camera）口径一致 |
| quiz 新题①荷兰角 | research/10 §一（Dutch 枚举） |
| quiz 新题②横移证据墙 | research/05 §二「移」行（camera trucks left 与主体同速平行位移，区别于原地转动） |
| quiz 新题③俯仰摇墓碑 | research/05 §二「俯仰」行（机位不动、镜头自下而上摇） |
| quiz 新题④插入空镜老照片 | research/19 §A1.1（五段式④：物体/环境空镜掩护台词） |
| quiz 新题⑤移焦桌下拳头 | research/05 §二「移焦」行（不切镜转移注意力） |
| quiz 新题⑥希区柯克变焦对比 | research/05 §二「急推变焦」「希区柯克变焦」两行机制对比（背景拉远扭曲为判定特征） |
| quiz 新题⑦升镜头收尾 | js/data.js:457 camEmoMap「悲伤离别」行（缓升抽离成命运感）+ research/05 §二「升」行 |
| 分组常量/整组复制/反馈提示词 | 交互增强，无外部事实主张；复用设施：`regCopy`（js/app.js:47）、`data-copy` 全局委托（js/app.js:1958）、收藏体系（js/app.js:1587,1620）、`data-share` 深链（js/app.js:1976） |

## 五、需人工核实

1. **荷兰角条目的作者层内容**：research/10 §一仅枚举了 "Dutch" 一词，无用法与提示词示例。`pen`/`pcn` 的具体措辞与 `use` 中【经验】句（"多与固定机位或缓推叠加，一镜即收"）为按 research/05 §一铁律与模块既有条目风格所作的行业常识演绎，已在数据内标【经验】。若不接受无检索出处的演绎，可回退该【经验】句或整条删除，不影响其余改动。
2. **camEmoMap「心虚隐瞒」的 cams 组合与 tip 后半句**（"固定机位 → 移焦""把注意力移到手部小动作上，不切镜完成攻防"）为映射表组内演绎，已标【经验】；sig 词汇本身有出处（见「四」）。
3. quizBank 7 题的题干情景为既有题库同级的戏剧化包装，答案机制均有出处，无需额外核实。

除上述外无。

## 六、不做的事

1. **不改任何既有条目与既有数字口径**：camRules 6 条、camTalkRules 原 8 条、camEmoMap 原 8 行、quizBank 原 31 题逐字保留；4秒缓推 / ≤2种运镜 / 2-5秒 / 一集别超3次 等数字一律不动。
2. **不给 `DB.cameras` 条目加新字段**（渲染层依赖七字段结构）；模型适配层由独立新键 `camModelMap` 承载。
3. **不重复收录已在站内的知识**：防崩七步摘要（js/data.js:98 总览区）、稳定性阶梯与参考链（js/data.js:701 无限画布区）、口型返工止损数字（js/data.js:633 负面提示词区）、焦段/角度/光比量化（js/data.js:231-232 开发流程产出物区）、口型验收帧数（js/data.js:241）——这些内容已分别在各自模块落地，再往运镜宝典塞一遍只会稀释密度。
4. **不越模块边界改文案**：学习路径周3的「16种运镜」（js/data.js:1390）、7天闭环的「16种运镜中英提示词」（js/data.js:1533）属其他模块数据区，本次不动（建议后续跨模块统一时一并更新）；研究日志 js/data.js:2426/2453 为历史记录，永不改写。导航/副标题条数为运行时计算（js/app.js:102,125），落地后自动显示 22种。
5. **不动公共设施**：路由（js/app.js:238-239）、命令面板、全局搜索索引（js/app.js:1786,1793 自动跟随）、收藏体系、主题、sw.js、index.html 一律不碰；交互增强全部收敛在 cameras 模块自己的三个函数与追加 CSS 内，且只复用既有 `.chip`/`.copy-btn`/`regCopy`/`data-copy` 机制，未新增任何全局事件委托。
6. **不新建模块、不做移动端新断点**：分组标题 flex 自动换行适配窄屏；荷兰角动画沿用 `--spd` 变速与视口外暂停，无需额外降级代码。
