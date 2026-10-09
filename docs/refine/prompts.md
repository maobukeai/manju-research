# 细化方案：提示词库（prompts）

> 模块 id：`prompts` ｜ 数据区：`js/data.js:462-635`（区注释 `/* ================= 提示词库 ================= */`，含 `promptFormulas` / `promptBank` / `styleKeywords` / `negativePrompt` 四个子键）｜ 渲染函数：`js/app.js:505-530` 的 `prompts()` + `js/app.js:1632-1658` 的 `renderPromptsBank()`
> 本方案只做增量加深，不改版式、不推倒重来；既有 DB 键、字段、条目数字口径一律不动。补丁完整代码合计 91 行（3+20+3+1+64，实测），全部经 Node 校验（见「七、校验记录」）。

## 一、现状盘点

**现有资产**（Node 实测清点，方法见「七、校验记录」第 1 条）：

| 子键 | 现状 |
|---|---|
| `promptFormulas` | 2 张万能公式卡（图像/视频），字段 `{t, tag, f, ex:[{t, cn, en}]}`，各带 3 个中英示例 |
| `promptBank` | 12 组共 92 条：A 开场钩子8 / B 角色登场6 / C 对白特写8 / D 打斗8 / E 情绪渲染6 / F 转场衔接8 / G 环境空镜8 / H 结尾卡点4 / I 微表情台词戏9 / J 古风8 / K 微表情生理级词库10 / L 声音提示词9；条目字段统一 `{cn, en}`，组字段 `{cat, items}`，实测无重复 `cn`（收藏以 `cn` 为键） |
| `styleKeywords` | 15 条画风，字段 `{n, cn, en, fit?}`，其中仅 5 条带 `fit` 题材匹配 |
| `negativePrompt` | EN/CN 两段可复制负面词 + `fixes` 15 行 `{p, s, a}` 症状/对策/参数级对策 |

**渲染与事件接线**：`prompts()`（`js/app.js:505-530`）输出灵感条→两张公式卡→模板库容器→画风表→负面词卡；模板库本体由 `renderPromptsBank()`（`js/app.js:1634-1658`）按组渲染，懒加载触发点在 `js/app.js:241`。既有交互全部走全局事件委托：收藏 `data-fav`（app.js:1960-1961）、组复制 `data-pbcopy`（app.js:1984-1985）、只看收藏 `data-pbfav`（app.js:1986-1987）、随机灵感 `#inspBtn`（app.js:1982）。收藏键即 `it.cn`（`data-fav`），因此**新增条目的 `cn` 必须全库唯一**（本方案已满足）。

**自动传播（数据追加零接线成本）**：模块计数徽标（app.js:103）、模块副标题与仪表盘描述中的模板总数（app.js:126、443，均为 `reduce` 实时计算）、全局搜索收录全部条目（app.js:1787）、命令面板随机灵感（app.js:1845、1661-1674）、收藏导出（app.js:1871）——新增条目自动进入以上所有入口，无需改公共设施。

**缺口（哪里最薄）**：
1. **与模型解耦**——92 条模板没有一条说明"同一意图在不同模型上该怎么写"；research/05 §五整节（7 家模型控制方式差异表）与 research/21 §三（可灵 4.0 全能参考 `@image1/@video1` 指定语法、提示词 8000 tokens 上限）均未入模块（实测 grep：`第2个镜头`/`轻微/明显/剧烈`/`结构化关键帧`/`@image1`/`8000 tokens` 在 data.js 全部 0 命中）；
2. **首尾帧只有题没有公式**——F 组 8 条是现成句子，但"两帧共享视觉DNA / 帧差定义运动类型（位置差→位移·表情差→情绪·景别差→推拉·构图差→转场）/ 提示词只补三件事 / 约束词 `no extra elements, camera locked`"这套可迁移写法（research/05 §四）未入模块；
3. **一致性锁定句式无可复制版**——"角色措辞锁定/风格短语锁定/禁改条款"散落在运镜宝典 tips（data.js:448-449）与无限画布 multiChar（data.js:695-703）里作散文，提示词库内没有可直接粘贴的 `{cn, en}` 条目（research/19 §A1.1/§A2.1）；
4. **画风表 15 条中 10 条无 `fit`**——research/19 下篇已量化"画风×题材×平台系数"（B2/B3 节），巨日禄高饱和风、水墨暗调怪谈、非遗质感混搭三类有案例背书的画风缺位（实测 grep：`巨日禄`仅出现于既有 fit 与题材风向库，`水墨暗调`0 命中）；
5. **L 组声音条目缺实操规则**——"声音即人设""中英混读拆分""@图片中的{角色}说：{台词} 音画同步基础模板"（research/19 §A1.1/§A1.4、research/05 §八·更新）均未入库（实测 grep：`声音即人设`/`图片中的`0 命中）；
6. **负面词表只有"怎么修"没有"验收尺"**——口型验收标尺（≤3 帧合格、>5 帧返工、帧率换算口径，research/19 §A1.3）已在开发流程 tips（data.js:132）出现，但避坑对照表内无此行；
7. **交互：92 条平铺无导航无筛选**——工具库/案例库/术语表都有 `inline-search` 即时筛选（app.js:489/882/917），本模块没有；12 组跳转只能滚轮。

## 二、变更清单（逐条，含出处）

| # | 变更 | 内容 | 出处 |
|---|---|---|---|
| 1 | `promptBank` L 组（声音提示词）追加 3 条 | ①声音即人设；②中英混读拆分（拆分做法保留 research 原文标注"经验推断"，成因与译制验收为多源实据）；③音画同步基础模板 `@图片中的{角色} 说：{台词}，口型与音频同步` | research/19-数字人口型表演与美术风格进阶.md §A1.1、§A1.4；research/05-运镜与提示词.md §八·更新 |
| 2 | `promptBank` 新增组 `M · 首尾帧写法`（5 条） | 视觉DNA 公式 / 帧差定义运动四映射 / 只补三件事 / 约束词 `no extra elements, camera locked` 与 morph/match cut/whip pan 三选一 / 分段首尾帧统一校准 | research/05-运镜与提示词.md §四-1~6（帧差四映射为 §四-4） |
| 3 | `promptBank` 新增组 `N · 模型适配写法`（6 条） | 通义万相时间戳多镜头（唯一官方写法）/ Vidu 运动幅度三档（轻微/明显/剧烈）/ Runway 约束正着写+motionless+删无效词 / Luma 结构化关键帧 / 即梦中文复合运镜词 / 可灵4.0 全能参考 `@image1/@video1` 指定用途与 8000 tokens 上限 | research/05-运镜与提示词.md §五；research/21-可灵4.0正式版实测与视频模型价格核验.md §三 |
| 4 | `promptBank` 新增组 `O · 一致性锁定句式`（3 条） | 角色措辞锁定（逐字复用+稳定特征锚定）/ 风格短语锁定（soft window light 等固定表述）/ 多角色发言者+站位+禁改条款（中文句式已在运镜宝典 data.js:449 出现，此处补全可复制版与英文版） | research/19-数字人口型表演与美术风格进阶.md §A2.1（防崩七步之4/5）、§A2.2（稳定特征锚定）、§A1.1 |
| 5 | `styleKeywords` 追加 3 条（均带 `fit`） | 巨日禄高饱和风（题材方向标注"推断"）/ 水墨暗调怪谈 / 非遗质感混搭（cn/en 按档案原文收敛为"水墨×3D 混搭 + 全形拓纹理"） | research/19-数字人口型表演与美术风格进阶.md §B2-1、§B3（含"水墨×3D 混搭、非遗质感纹理"）、§B2-8（全形拓案例） |
| 6 | `negativePrompt.fixes` 追加 1 行「口型·验收标尺」 | ≤3 帧合格（30fps 口径；25fps 下 3 帧=120ms，须标注帧率）、>5 帧返工、重点测重音音节与开口/闭口/边鼻音、唱歌与难词单独测试；与开发流程既有口径（data.js:132）一致，未改动任何既有行 | research/19-数字人口型表演与美术风格进阶.md §A1.3 |
| 7 | `renderPromptsBank()` 整函数替换（模块自有渲染函数内的交互增强） | ①组锚点导航 chips（覆盖渲染出的全部组，打补丁后 A-O 共 15 个；点击平滑滚动到组标题，尊重 prefers-reduced-motion）；②全库关键词即时筛选（中英文，复用既有 `.inline-search` 样式，纯 DOM 显隐不重渲染、不丢焦点、不影响收藏与深链高亮）；③命中计数提示。仅复用既有公共委托能力（`regCopy`/`esc`/`loadFavs`），新增标识符均 `mjxPrompts` 前缀，不碰全局 click/input 委托、路由、命令面板、全局搜索、收藏系统 | 交互基础设施为本站既有（js/app.js:13-15、46-48、1587） |

新增后自动变化（无需接线）：模板总数 92→109 条，模块计数、副标题、仪表盘描述、全局搜索、随机灵感池、收藏导出同步更新；组计数徽标 A-L 不变、新增 M/N/O 三组。**不触碰**：`promptFormulas` 两个公式卡、既有 92 条条目、既有 styleKeywords 15 条、既有 fixes 15 行、四个子键名与字段结构。

## 三、落点与代码

### 改动 1｜js/data.js — `promptBank` L 组末尾追加 3 条

**锚点**：`js/data.js:593`（L 组最后一条，行首 `[混音·三轨]` 全文唯一），在其后、`js/data.js:594` 的 `]},` 之前插入以下 3 行：

```js
    { cn: `[配音·声音即人设] 每位角色固定专属语气、语速、情绪并写进每次台词提示（一人轻快、一人冷淡），降低观众对口型敏感度`, en: `voice = persona: fix each character's tone, pace and emotion in every line prompt (one breezy, one cold) to lower viewers' sensitivity to lip sync` },
    { cn: `[配音·中英混读拆分] 中英混合播报时参数冲突会产生过渡帧异常：混读台词建议拆成单语种片段分别生成再拼接（经验推断）；译制版验收必须用最终本地化音频重新判定口型，难词（名字/缩写/数字）单独测试`, en: `mixed Chinese-English lines cause parameter conflicts and transition-frame glitches — split into single-language segments, generate separately, then stitch (rule of thumb); for dubs re-judge lip sync on the final localized audio, and test hard words (names, abbreviations, numbers) separately` },
    { cn: `[配音·音画同步模板] 先生成台词音频，再写图生视频提示词："@图片中的{角色} 说：{台词}，口型与音频同步"；情绪标注词（[悲伤][激动]）放在台词前——Seedance 2.0漫剧实操手册基础模板`, en: `generate the line audio first, then prompt image-to-video: "the {character} in @image says: {line}, lip-synced to the audio"; put emotion tags ([sad][excited]) before the line — the base template from the Seedance 2.0 drama handbook` },
```

### 改动 2｜js/data.js — `promptBank` 数组收尾新增 M/N/O 三组

**锚点**：`js/data.js:595` 的 `],`（`promptBank` 数组收尾，其后紧跟空行与 `styleKeywords: [`，该组合全文唯一），在其之前插入以下 20 行：

```js
  { cat: `M · 首尾帧写法`, items: [
    { cn: `[公式·视觉DNA] 两帧必须共享视觉DNA：同宽高比、相近曝光、相似构图与色调、主体一致——帧差越小中间运动越干净，差距过大模型会"发明"中间内容；单段控制在2-5秒`, en: `Frame A and Frame B must share visual DNA: same aspect ratio, similar exposure, composition, tone and subject — the smaller the gap, the cleaner the in-between motion; keep each clip 2-5s` },
    { cn: `[公式·帧差定义运动] 位置差→位移；表情差→情绪；景别差→推拉；构图差→转场。想要推镜，就让尾帧=首帧的放大构图`, en: `position gap = movement; expression gap = emotion; shot-size gap = push or pull; framing gap = transition. For a push-in, make Frame B a tighter crop of Frame A` },
    { cn: `[公式·只补三件事] 首尾帧模式下提示词不重复描述画面，只补：节奏（slow/rapid）+ 氛围 + 两帧之间的行为`, en: `in first/last-frame mode the prompt never re-describes the visuals — it adds only pacing (slow/rapid), mood, and the action between the two frames` },
    { cn: `[约束词] 句尾加 "no extra elements, camera locked" 禁止模型自加元素；衔接类型一句话写明：morph / match cut / whip pan 三选一`, en: `end with "no extra elements, camera locked" to stop invented details; name the join type in one phrase: morph, match cut, or whip pan` },
    { cn: `[分段校准] 即梦实测：不涉及一镜到底时只放首帧或尾帧即可；所有分段的首尾帧统一导入图像工具做一致性校准后再拼接`, en: `on Jimeng a single first or last frame suffices when no one-take is needed; calibrate all segment frames together in an image tool before stitching` },
  ]},
  { cat: `N · 模型适配写法`, items: [
    { cn: `[通义万相·时间戳多镜头] "第2个镜头[4-6秒]硬切转场，固定机位，男子推门而入"——镜头序号+起止秒+转场方式+机位逐段写，通义万相是唯一官方支持时间戳多镜头写法的模型`, en: `shot 2 [4-6s] hard cut, locked-off camera, the man pushes the door open — number each shot with start-end seconds, transition and camera; Wan is the only model with official timestamped multi-shot syntax` },
    { cn: `[Vidu·运动幅度三档] 用"轻微/明显/剧烈"分级词显式标注运动强度（slight / noticeable / intense motion），默认避免大幅拉镜`, en: `tag motion intensity explicitly: slight / noticeable / intense — and avoid wide-range camera pulls by default` },
    { cn: `[Runway·约束正着写] Gen-4无负向栏：不想要什么，就正着写想要什么；静止必须写 "camera entirely motionless"；删掉 cinematic、4K 等无效词`, en: `Gen-4 has no negative field: state what you want instead of what you don't; stillness must read "camera entirely motionless"; drop filler words like cinematic or 4K` },
    { cn: `[Luma·结构化关键帧] 首尾帧+多锚点走结构化控制，提示词只写两帧之间的连续运动，不重复描述画面内容`, en: `structured keyframes (first, last and anchor frames) carry the visuals; the prompt describes only the continuous motion between frames` },
    { cn: `[即梦·中文复合运镜] 无运镜面板，靠提示词+首尾帧：中文复合运镜词响应好（如"缓慢推近同时轻微环绕"），多模态参考可直接参考运镜；"图生视频+首尾帧"是最强链路`, en: `no camera panel — rely on prompts plus first/last frames; compound Chinese camera phrases respond well ("slow push-in with a slight orbit"); multimodal reference can carry the camera move; image-to-video with frame pairs is the strongest path` },
    { cn: `[可灵4.0·全能参考@指定] 多图参考用 @image1/@video1 在提示词中指定每项用途（哪张图当脸、哪段视频当动作参考）；单次图片≤10张、视频≤5段且合计≤30秒；提示词上限约8000 tokens`, en: `tag each reference with @image1 / @video1 and its role (which image is the face, which video is the motion reference); up to 10 images and 5 videos (30s total) per run; prompt cap about 8000 tokens` },
  ]},
  { cat: `O · 一致性锁定句式`, items: [
    { cn: `[角色措辞锁定] 年龄、发型+标志特征、服装、灯光、镜头风格的描述文本逐字复用——改一个词就可能变脸；除"脸部不变"外，点出眼睛颜色、痣等稳定特征锚定身份`, en: `reuse the wording for age, hairstyle + signature features, outfit, lighting and camera style verbatim — one changed word can change the face; anchor identity by also naming eye color, a mole, or other stable features` },
    { cn: `[风格短语锁定] 灯光/色调/镜头类型用固定表述逐字复用（如 "soft window light, warm tone, shallow depth of field"），同场戏每个镜头尾缀都带这一句`, en: `soft window light, warm tone, shallow depth of field — lock this style phrase verbatim and append it to every shot of the same scene` },
    { cn: `[多角色·发言者与禁改条款] 每个场景提示重述角色外观并明确站位（"米娜站左侧、莉子站右侧"），末尾加禁改条款："请勿更改她的面部、穿搭、发型、年龄或风格"；特写写明视线方向（"米娜微微向右看向里科"）`, en: `restate each character's look and blocking every scene ("Mina stands LEFT, Riko stands RIGHT"), end with the lock clause "do not change her face, outfit, hairstyle, age, or art style", and spell out gaze direction ("Mina glances right toward Riko")` },
  ]},
```

### 改动 3｜js/data.js — `styleKeywords` 末尾追加 3 条

**锚点**：`js/data.js:612`（`美漫厚涂出海` 条目，行首唯一）之后的 `js/data.js:613` `],`（其后紧跟空行与 `negativePrompt: {`，该组合全文唯一），在其之前插入以下 3 行：

```js
  { n: `巨日禄高饱和风`, cn: `高饱和撞色，强光影对比，多人同框，打斗特效，机位丰富`, en: `high-saturation palette, strong lighting contrast, multi-character group frames, action VFX, rich camera variety`, fit: `题材方向系由画风特征推断——多人同框打斗类男频向；与"2D酱油条漫"同生态但路线相反（酱油=低饱和弱光影）；巨日禄生态测出率50%-75%、同期大盘约10%（2025-08，短剧自习室）` },
  { n: `水墨暗调怪谈`, cn: `中式水墨，暗色低明度，民俗恐怖，留白压迫感`, en: `Chinese ink wash, dark low-key tones, folk horror, oppressive negative space`, fit: `中式民俗恐怖/克苏鲁方向（《恶仙》）；可按题材气质与"末世诡异红黑"二选一——水墨走暗调压迫，红黑走色彩冲击` },
  { n: `非遗质感混搭`, cn: `水墨×3D 混搭，非遗全形拓纹理`, en: `ink-wash × 3D blend, ink-rubbing texture`, fit: `国风/非遗/文旅品牌向——《有山灵》全形拓×山海经（即梦AI，5人团队8个月），联名果酒卖出数万瓶、抖音1000多万播放` },
```

### 改动 4｜js/data.js — `negativePrompt.fixes` 末尾追加 1 行

**锚点**：`js/data.js:633`（`口型·返工止损` 条目，行首唯一）之后、`js/data.js:634` 的 `  ],`（fixes 数组收尾，其后为 `},` 与 `/* ================= 无限画布`）之前插入以下 1 行：

```js
    { p: `口型·验收标尺`, s: `唇形误差≤3帧合格（30fps口径；25fps下3帧=120ms，引用必须标注帧率）、>5帧观众明显感知需返工；重点测重音音节与开口音(a/o/e)、闭口音(i/u/ü)、边鼻音(l/n)；唱歌与难词（名字/缩写/数字）单独测试`, a: `达不到标尺时用"十秒对照测试"单变量定位环节（见上方"口型·定位难"行）` },
```

### 改动 5｜js/app.js — `renderPromptsBank()` 整函数替换（组导航 + 即时筛选）

**锚点**：`js/app.js:1632-1658`，从注释行 `/* ---------- 提示词模板库渲染与收藏 ---------- */` 起，到函数收尾 `}`（下一空行之后是 `/* ---------- 随机灵感 ---------- */`）止，整段替换为：

```js
  /* ---------- 提示词模板库渲染与收藏（组导航 + 即时筛选 · mjx-prompts 增强） ---------- */
  let pbFavOnly = false;
  let mjxPromptsFilter = '';
  function renderPromptsBank() {
    const el = $('#pbBank');
    if (!el) return;
    const favs = loadFavs();
    const pbTotal = DB.promptBank.reduce((a, g) => a + g.items.filter((it) => favs.has(it.cn)).length, 0);
    const cnt = $('#pbFavCnt'); if (cnt) cnt.textContent = pbTotal || '';
    const nav = '<div id="mjxPromptsNav" style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px">' +
      DB.promptBank.map((g, gi) => '<button class="chip" data-pbnav="' + gi + '" style="padding:3px 11px;font-size:12px">' + esc(g.cat) + '</button>').join('') + '</div>' +
      '<div class="inline-search" style="max-width:none"><span class="search-ico">⌕</span><input id="mjxPromptsQ" placeholder="即时筛选：输入 雨夜 / 子弹时间 / 口型 / 万相 …（中英文均可）" autocomplete="off" value="' + esc(mjxPromptsFilter) + '"></div>' +
      '<span class="mini-note" id="mjxPromptsCount" style="display:block;margin:-4px 0 0"></span>';
    const groups = DB.promptBank.map((g, gi) => {
      let items = g.items;
      if (pbFavOnly) items = items.filter((it) => favs.has(it.cn));
      if (!items.length) return '';
      const rows = items.map((it) => {
        const idx = g.items.indexOf(it) + 1;
        const a = regCopy(it.cn), b = regCopy(it.en);
        const on = favs.has(it.cn);
        return '<div class="card pb-item" data-pbg="' + gi + '" data-pbi="' + (idx - 1) + '" data-hl="' + esc(it.cn) + '"><button class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + esc(it.cn) + '" title="' + (on ? '取消收藏' : '收藏此模板') + '">' + (on ? '★' : '☆') + '</button>' +
          '<button class="link-btn" data-share="' + esc(it.cn) + '" data-share-page="prompts" title="复制本条深链">🔗</button>' +
          '<div class="pb-cn"><b style="color:var(--p2)">' + String(idx).padStart(2, '0') + '</b> ' + esc(it.cn) + '</div>' +
          '<div class="pb-en">' + esc(it.en) + '</div><div class="pb-foot">' +
          '<button class="copy-btn" data-copy="' + a + '">复制中文</button><button class="copy-btn" data-copy="' + b + '">复制英文</button></div></div>';
      }).join('');
      const num = pbFavOnly ? items.length + '/' + g.items.length + '条' : g.items.length + '条';
      return '<div class="pb-cat" id="mjxPromptsCat' + gi + '">' + g.cat + ' <span class="pb-n">' + num + '</span><button class="copy-btn" data-pbcopy="' + gi + '" title="复制本组全部中文模板">复制本组</button></div>' + rows;
    }).join('');
    el.innerHTML = nav + (groups || '<div class="callout violet" style="margin-top:10px"><b>还没有收藏的模板。</b>点击模板右上角的 ☆，常用句式就会集中在这里，配合「只看收藏」快速取用。</div>');
    const navEl = el.querySelector('#mjxPromptsNav');
    if (navEl) navEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-pbnav]');
      if (!btn) return;
      const catEl = document.getElementById('mjxPromptsCat' + btn.dataset.pbnav);
      if (!catEl) return;
      const top = Math.max(0, catEl.getBoundingClientRect().top + window.scrollY - 70);
      const dist = Math.abs(top - window.scrollY);
      const behavior = (matchMedia('(prefers-reduced-motion: reduce)').matches || dist > 3000) ? 'auto' : 'smooth';
      window.scrollTo({ top, behavior });
    });
    const applyQ = () => {
      const q = mjxPromptsFilter.trim().toLowerCase();
      let total = 0;
      DB.promptBank.forEach((g, gi) => {
        let n = 0;
        el.querySelectorAll('.pb-item[data-pbg="' + gi + '"]').forEach((cardEl) => {
          const it = g.items[+cardEl.dataset.pbi];
          const hit = !q || (it.cn + '\n' + it.en).toLowerCase().includes(q);
          cardEl.style.display = hit ? '' : 'none';
          if (hit) n++;
        });
        const catEl = document.getElementById('mjxPromptsCat' + gi);
        if (catEl) catEl.style.display = n ? '' : 'none';
        total += n;
      });
      const note = document.getElementById('mjxPromptsCount');
      if (note) note.textContent = q ? ('「' + mjxPromptsFilter.trim() + '」命中 ' + total + ' 条') : '';
    };
    const inp = el.querySelector('#mjxPromptsQ');
    if (inp) inp.addEventListener('input', () => { mjxPromptsFilter = inp.value; applyQ(); });
    applyQ();
  }
```

要点说明：①导航 chips 复用既有 `.chip` 类，`data-pbnav` 不与全局 click 委托的任何选择器冲突，监听器绑在 `#mjxPromptsNav` 容器自身（模块内部，随 innerHTML 重建自动清理）；②筛选监听器直接绑在输入框元素上，不走全局 input 委托（app.js:2062-2070 只认 toolSearch/glSearch 等固定 id，零冲突）；③筛选为纯 DOM 显隐（`data-pbg`/`data-pbi` 记录原始组/条索引，映射回 `g.items` 原文匹配），不重渲染、不丢输入焦点，收藏切换触发的重渲染会用 `mjxPromptsFilter` 状态还原输入框与筛选结果；④`data-hl` 深链高亮、`data-fav` 收藏、`data-pbcopy` 组复制、`data-pbfav` 只看收藏的行为与键名全部保持不变；⑤已知边界：仅收藏模式下无收藏的组不渲染组标题，点击对应导航 chip 会静默无动作（`if (!catEl) return`），可接受。无新增 CSS 文件与 CSS 类（复用 `.chip`/`.inline-search`/`.search-ico`/`.mini-note` + 内联样式），无新增公共设施改动。

## 四、来源对照表

| 新增内容 | 站内事实源头（research/ 原文） | 入库前核验 |
|---|---|---|
| M 组 5 条首尾帧公式 | research/05-运镜与提示词.md §四（1-6 条技巧，行 44-50） | grep data.js：`no extra elements`/`morph/match cut` 0 命中；「帧差定义运动类型」仅在 frameBank 单题 why 中出现过单例，四映射未沉淀 |
| N 组：万相时间戳 / Vidu 三档 / Runway 正着写 / Luma 关键帧 / 即梦复合运镜 | research/05-运镜与提示词.md §五「各家运镜控制差异」表（行 52-60） | grep data.js：`第2个镜头`/`运动幅度分级`/`轻微/明显/剧烈`/`结构化关键帧`/`复合运镜`/`无效词` 全部 0 命中；Pika `-camera` 已在工具库（data.js:310）故未重复收录 |
| N 组：可灵4.0 全能参考 @ 指定 + 8000 tokens | research/21-可灵4.0正式版实测与视频模型价格核验.md §三（fal.ai 规格页+smzdm 两源一致） | grep data.js：`@image1` 0 命中；「8000」在 data.js 共 5 处命中，其中提示词上限语境仅研究日志一处（data.js:2353，作"8000字符"，与本条"约8000 tokens"为既有行口径偏差——按纪律不改既有行，建议另开研究日志修订），提示词库无 |
| L 组：声音即人设 / 禁改条款·站位·视线 | research/19-数字人口型表演与美术风格进阶.md §A1.1（行 13-19；示例仅"一人轻快、一人冷淡"，条目已按原文收敛） | 禁改条款中文散文句已在运镜宝典（data.js:449），`{cn, en}` 可复制条目与英文版为本方案新增 |
| L 组：中英混读拆分 / 译制验收 | research/19 同上 §A1.4（行 45-46；成因 AIGC SDM、验收 DomoAI） | grep data.js：`声音即人设` 0 命中；`混读`1 命中（data.js:161，开发流程 tips 散文），无条目化；拆分做法保留原文"经验推断"标注 |
| L 组：音画同步基础模板 | research/05-运镜与提示词.md §八·更新（行 94-96） | grep data.js：`图片中的` 0 命中 |
| O 组：角色措辞锁定 / 风格短语锁定 | research/19 §A2.1 防崩七步之 4/5（行 58-59）；"点出眼睛、痣等稳定特征锚定身份"见 §A2.2（行 68） | grep data.js：`soft window light` 0 命中；`触发词`4 命中均为 LoRA 语境 |
| O 组：多角色五要素合成句 | research/19 §A1.1（重述外观+站位+禁改条款+视线方向） | 同上，条目化为新增 |
| styleKeywords ×3 | research/19 §B2-1（巨日禄测出率 50%-75%/大盘 10%）、§B3（水墨暗调/《恶仙》；"水墨×3D 混搭、非遗质感纹理"——行 241）、§B2-8（《有山灵》全形拓：5 人 8 个月/数万瓶/1000 多万播放——行 231） | grep data.js：`水墨暗调` 0 命中；`全形拓`1 命中（data.js:1717 题材风向库），画风关键词表无；复核意见指出的"木刻/纪录片气质"为无出处扩写，已删——research/ 全目录 grep `木刻`/`纪录片` 均 0 命中（本轮实测） |
| fixes「口型·验收标尺」 | research/19 §A1.3（行 36；≤3 帧合格、>5 帧返工、25fps 换算 120ms、开口/闭口/边鼻音清单） | 口径与开发流程既有 tips（data.js:132）完全一致，未改动既有行 |

## 五、需人工核实

无。所有新增数据均可在 research/ 对应章节找到原文依据（见上表）；复核意见指出的"木刻纹理/人文纪录片气质"无出处扩写已删，非遗质感混搭条 cn/en 已收敛至 research/19 §B2-8/§B3 原文表述；英文翻译与"巨日禄高饱和风"的题材方向归属已在条目内自带"推断"标注，不构成无出处知识。

## 六、不做的事

1. **不动 `promptFormulas`**：不加第三张"首尾帧万能公式"卡——模块副标题与仪表盘描述写死"两个万能公式"（app.js:126、443，纯展示字符串），加卡即失真，而改这两处越出"仅模块渲染函数内增强"的授权；首尾帧公式改以 M 组可复制条目入库，语义等价。
2. **不改任何既有条目口径**：包括「2D酱油条漫」fit 中"巨日禄生态测出率"的归属表述（research/19 §B2-1 口径为"巨日禄生态"而非"酱油风"，按纪律只在此存档、不回改）。
3. **不碰公共设施**：路由、命令面板、全局搜索、收藏系统、全局 click/input 事件委托、`prompts()` 主渲染函数、index.html、sw.js、css/ 全部不动；交互增强只替换 `renderPromptsBank()`。
4. **不重复收录已覆盖内容**：Pika `-camera` 参数（工具库 data.js:310 已有）、可灵 smooth motion（工具库可灵 tip + negativePrompt「双重指挥」行已有）、动作拆步法则（运镜宝典 data.js:438 已有）、微表情分层公式（negativePrompt「表演僵硬」行已有）、换装定妆照（无限画布 multiChar data.js:699 已有）、ElevenLabs/MiniMax 标签体系（工具库+开发流程已有）。
5. **不新增 CSS 类与文件**：交互增强零 CSS 改动（复用既有类 + 内联样式），因此不涉及 `mjx-prompts-` 前缀类的使用场景；新增 JS 标识符仅 `mjxPromptsFilter`（模块级变量）与 `mjxPromptsNav`/`mjxPromptsQ`/`mjxPromptsCount`/`mjxPromptsCat*`（DOM id），全部 `mjxPrompts` 前缀。
6. **未做浏览器端实测**：本环境无浏览器，点击/筛选交互未在真实 DOM 中运行；已完成的校验见下节，风险点（委托冲突、焦点保持、深链兼容）已逐一静态核对。

## 七、校验记录

1. **数据现状清点**（已运行）：`node -e` 在 vm 上下文执行 `js/data.js` 并断言——promptBank 12 组 92 条、组内条目键 `{cn,en}`、组键 `{cat,items}`、promptFormulas 2 条（ex 键 `{t,cn,en}`）、styleKeywords 15 条（5 条带 fit）、negativePrompt.fixes 15 行（键 `{p,s,a}`）、全库 `cn` 无重复。与「一、现状盘点」一致。
2. **缺口核验**（已运行）：对本方案每条新增内容的特征词逐一 grep `js/data.js`（命令如 `grep -c "第2个镜头" js/data.js`、`grep -c "@image1" js/data.js`、`grep -c "soft window light" js/data.js` 等），确认站内无重复收录后再入库。
3. **补丁模拟校验**（已运行）：用 Node 脚本把本文件「三、落点与代码」的 5 个代码块按各自锚点应用到 data.js / app.js 的内存副本上——patched data.js 在 vm 中求值成功，promptBank 变为 15 组 109 条、styleKeywords 18 条、fixes 16 行、新增 `cn` 与全库零重复；patched app.js 以 `new Function()` 编译通过（仅编译不执行，不触 DOM）。
4. **未运行**：浏览器端交互（导航滚动、筛选、收藏联动）未实测。**部署提醒**：sw.js:3 缓存名为 `manju-v3.0` 且 js/data.js、js/app.js 均在 CORE 预缓存清单，落地本补丁时必须按发布惯例 bump 缓存名，否则老用户拿不到新数据（本方案不改 sw.js，留待发布步骤）。
5. **复核修订后复跑（第二轮）**：①blocker 证实——research/ 全目录 `grep -rc "木刻" research/ | grep -v ":0"` 与 `grep -rc "纪录片"` 均无输出（0 命中），非遗质感混搭条 cn/en 已改为 research/19 §B2-8（行 231）/§B3（行 241）原文表述「水墨×3D 混搭，非遗全形拓纹理 / ink-wash × 3D blend, ink-rubbing texture」；②修订后 5 个代码块重新提取并应用到内存副本——15 组 / 109 条 / L组 12 条 / M 5 / N 6 / O 3、styleKeywords 18（8 带 fit）、fixes 16、既有条目逐值保留、19 条新 cn 全库零重复，patched data.js vm 求值与 patched app.js 编译均通过；③data.js「8000」grep 实测 5 处命中（1242/1614/1808/2042/2353），仅 2353 为提示词上限语境，来源对照表已按此改写。
