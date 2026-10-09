# 细化方案：工具库与视频模型对比

> 模块 id：`tools`（路由 `#/tools`）· 数据区 `js/data.js:262-344`（videoCompare / toolCats / tools 三区）· 渲染函数 `js/app.js:479-490`（页壳 tools()）与 `js/app.js:1589-1619`（卡片 renderTools()）
> 本方案只允许改动三处现实文件：`js/data.js`（两处新键 + tools 数组 5 处插入 8 条新条目）、`js/app.js`（tools() 与 renderTools() 两个整函数替换）、`css/style.css`（末尾追加 mjx-tools 前缀类）。index.html、sw.js、research/、feat-*.js 一律不动。
> 补丁代码合计 100 行（数据增量 29 行 + 两个函数 63 行 + CSS 8 行，按补丁内非空代码行实测），远低于 350 行上限。

---

## 一、现状盘点

**数据区构成**（实测自 js/data.js，`node` 解析核验）：

| 键 | 位置 | 形态 | 条目数 | 字段 |
|---|---|---|---|---|
| `videoCompare` | data.js:263-272 | 数组 | 8 款模型 | `m,dur,res,adv,con,scene,price` 七字段 |
| `videoCompareNote` | data.js:273 | 字符串 | 1 | 选型口诀 |
| `toolCats` | data.js:276-285 | 数组 | 8 项 | `id,n,ico`（all + 7 大环节） |
| `tools` | data.js:287-344 | 数组 | **49 款** | 基准 `n,cat,ico,ver,tag,pro,con,price,rate,tip`（Sora 2 条目多一个 `dead`） |

`tools` 分组计数（实测）：script 5 / image 6 / video 10 / lips 7 / audio 7 / edit 4 / platform 10。

**模块外引用点**（全部自动跟随数据增量，无需改动）：导航计数 `js/app.js:101`、副标题 `js/app.js:124`、仪表盘文案 `js/app.js:442`、全局搜索索引 `js/app.js:1785`、收藏统计 `js/feat-studyhub.js:94-99`、选型向导 `js/feat-picker.js:25-29,107,115-118`（**按 `DB.videoCompare` 下标 0-7 与 `DB.tools` 的 `n` 精确取名**——因此本方案严禁向 videoCompare 数组插行、严禁改任何现有 `n`）。

**已有交互**：分类 chips（data-cat）、评分/名称排序（data-tsort）、即时搜索（#toolSearch）、收藏夹（__fav + data-fav）、卡片深链复制（data-share）、死亡工具样式（.dead-tool）。

**缺什么 / 哪里最薄（按严重度排序）**：

1. **对比表只有"价位"没有"单集成本"**。`price` 列订阅/按量/积分三种口径混排不可比；而 research/21 §2.2 已有整节经过核验的「单条漫剧成本折算（50秒/集基准）」——8 款模型逐一折算完毕，一条都没进站。这是本模块最值钱的欠账：用户看完对比表仍回答不了"做一集到底花多少钱"。
2. **三档预算工具栈未入站**。research/04 §八「推荐组合（三档工具栈：新手 ¥0-100 / 进阶 ¥500-1500 / 专业 ¥3000+）」是全模块的"总纲"，现在模块里 49 款工具各自为战，没有一条"照抄就能开工"的预算链路。
3. **八类实名工具缺位**（档案里都有、站内全库检索无条目）：网文改编垂直写作（research/12 §五）、开源表演线 Wan2.2-S2V（research/19 §A3.1）、视频同步音效 PixVerse 与移动端补帧 Time Cut（research/14 §一/§二）、出海译制铺量 Rask AI（research/18 §B1.2）、产能外包万兴剧厂（research/18 §A6.4 + research/22 §二）、一站式批量漫剧平台商汤Seko/Magiclight（research/19 §A1.1）、协作/资产管理后台飞书多维表格（research/18 §A4.2）。
4. **"all" 视图 57 张卡平铺无分组小标题**，浏览时只能靠卡片左上的小 tag 辨认环节，扫读成本高。
5. **杂项闭环确认**：research/16-平台升级曾指出"剪映条目缺 AI Ultra 定价档"——data.js:329 现已有 1499 元/年口径，该欠账已闭环，无需再动；Sora 2 死亡条目结构完好；口型组价格口径（research/19 §A4.1）已入站。

---

## 二、变更清单（逐条，含出处）

| # | 类型 | 内容 | 出处（research/*.md） |
|---|---|---|---|
| 1 | 新键 `mjxToolsVcCost` | 单集成本速查：8 行×4 字段（模型/折算式/50秒单集成本/备注）+ 废片系数脚注，挂在对比表下方 | §2.1、§2.2、§四（21）；§A5.3（18）；§A4.1 口径提醒（19） |
| 2 | 新键 `mjxToolsStacks` | 三档预算工具栈：新手/进阶/专业，含链路与一致性策略 | §八、§七（04） |
| 3 | tools 新增 1 条（script） | 塔塔AI写作 / 蛙蛙写作——红果格式分集大纲、本土IP适配 | §五（12） |
| 4 | tools 新增 1 条（lips） | Wan2.2-S2V——开源表演线：静态图+音频→说话/唱歌/表演 | §A3.1（19） |
| 5 | tools 新增 1 条（audio） | PixVerse——视频同步音效；与 ElevenLabs SFX 分工 | §一（14） |
| 6 | tools 新增 1 条（edit） | Time Cut——移动端补帧/慢动作；tip 带 25/30fps 统一口径 | §二（14）；§A5.4（19） |
| 7 | tools 新增 4 条（platform） | 万兴剧厂（5天75集实证+活动价）；商汤Seko / Magiclight.AI（批量漫剧+多角色对口型）；Rask AI（出海译制铺量）；飞书多维表格（分镜/排期/资产看板） | §A6.4（18）+§二（22）；§A1.1（19）；§B1.2、§B5.3（18）；§A4.2、§A6.2-6.3、§A2.4（18） |
| 8 | 交互增强（app.js tools()） | 对比表下渲染成本速查表（带"复制本表"）+ 三档工具栈卡（带"复制链路"），全部走既有 `regCopy/data-copy` 通道，不动任何公共设施 | — |
| 9 | 交互增强（app.js renderTools()） | "all 且无搜索无排序"时按环节渲染分组小标题（图标+名称+条数），其余路径行为与现状逐字节一致 | — |
| 10 | CSS 追加 | 4 组 `mjx-tools-` 前缀类（分组标题/成本表第三列/栈卡） | — |

现有 8 行 videoCompare 条目与 49 款 tools 条目**一个字段都不改**（含所有既有数字口径）；新条目字段结构与同区现有条目完全一致。

---

## 三、落点与代码

### 3.1 js/data.js — 新增 `mjxToolsVcCost`（videoCompare 区末尾）

**锚点**：data.js 第 273 行 `videoCompareNote: \`选型口诀：…\`,` 之后、第 275 行 `/* ================= 工具库 ================= */` 之前，插入：

```js
/* 单集成本速查（50秒/集口径 · 核验时点2026-10-02）——tools() 页渲染；新键名按规范加 mjxTools 前缀 */
mjxToolsVcCost: {
  unit: `以50秒/集为基准（参照《万妖图录传》单集50秒口径）`,
  foot: `废片系数：宣传价默认再乘2-3倍——两家头部均无权威废片率公开数据，"张口就报百分比"的横评要留个心眼；各平台积分/价格政策随时会变，投产前以当天官方页复核。`,
  rows: [
    { m: `可灵 4.0 正式版`, k: `——`, c: `未公布`, n: `截至10-02未全量；官方API企业会员页明示"除Kling 4.0外均支持"，即4.0单独计费` },
    { m: `可灵 4.0 Flash（720P）`, k: `50秒 × 6灵感值/秒`, c: `约300灵感值/集`, n: `纯生成；按黑金档26000灵感值/月折算约86集/月理论产能（不含口型/重抽/升档，档位为转引口径）` },
    { m: `可灵 3.0（均价口径）`, k: `50秒 × 约0.43元/秒`, c: `约21.5元/集`, n: `腾讯新闻2026-04-25实测7款AI视频工具折算（3.0 Omni测试规格80灵感值）` },
    { m: `即梦 Seedance 2.5`, k: `50秒 × 1.5-2.1元/秒（官方720P）`, c: `约75-105元/集`, n: `网页版"样片模式"（480P草稿→升清1080P）实测省约38%` },
    { m: `即梦 Seedance 2.0（API）`, k: `50秒 × 约1元/秒`, c: `约50元/集`, n: `火山引擎口径：15秒≈30.888万tokens` },
    { m: `第三方Agent渠道`, k: `50秒 × 0.23-0.3元/秒`, c: `约11.5-15元/集`, n: `LibTV"标价0.4元/秒"口径上界约20元/集；渠道低价系贴钱甩卖，有服务与账号风险` },
    { m: `万相 Wan 3.0（公测API）`, k: `50秒 × 0.3元/秒（480P档）`, c: `480P约15元/集；720P约30元/集`, n: `0.3元/秒系480P档（720P为0.6、1080P为1.2元/秒）——折算必须注分辨率档位` },
    { m: `模型选型×毛利率`, k: `同一团队换模型`, c: `Sora2时代<100元/剧 → 换Seedance 2.0后约2000元/剧`, n: `优文疯2026-05实测口径——模型选型直接决定毛利率` },
  ],
},
```

### 3.2 js/data.js — 新增 `mjxToolsStacks`（toolCats 区末尾）

**锚点**：data.js 第 285 行（toolCats 数组收口的 `],`）之后、第 287 行 `tools: [` 之前，插入：

```js
/* 三档预算工具栈（照抄起步）——tools() 页渲染，带一键复制链路；新键名按规范加 mjxTools 前缀 */
mjxToolsStacks: [
  { t: `新手档`, b: `¥0-100/月`, c: `豆包/DeepSeek → 即梦图片 + Nano Banana 2 → 即梦Seedance + 可灵对口型 → 魔音/海螺 + Suno免费 → 剪映`, y: `一致性：固定描述词表 + 同一参考图` },
  { t: `进阶档`, b: `¥500-1500/月`, c: `Claude Pro/Kimi → 即梦会员 + NB2 API批量分镜 + LiblibAI LoRA → 可灵黄金 + Seedance 2.5 + Vidu Q3 → MiniMax 2.6 + Suno Pro → 剪映`, y: `一致性：主角LoRA在线训练 + NB2多角色参考锁定` },
  { t: `专业档`, b: `¥3000+/月`, c: `Claude Opus + Dify/ComfyUI自动化 → ComfyUI + FLUX.2自部署 + NB2 + MJ → Seedance 2.5 + Kling 3.0 Turbo + Veo 3.1 + Runway Aleph → Hedra + 可灵原生音频 → ElevenLabs + MiniMax HD + Suno → PR/AE + Runway插件 + DaVinci`, y: `一致性：三级保障体系（结构化Prompt→参考锁定→ComfyUI质检兜底）` },
],
```

### 3.3 js/data.js — tools 数组 5 处插入 8 条新条目

**3.3a 剧本组**——锚点：data.js 第 293 行 `{ n: \`豆包\`, cat: \`script\`…` 整行之后插入：

```js
  { n: `塔塔AI写作 / 蛙蛙写作`, cat: `script`, ico: `🖋️`, ver: `—`, tag: `网文改编垂直线：塔塔出红果格式分集大纲，蛙蛙做本土IP适配`, pro: `社区改编链路的补位工具：塔塔AI写作出红果格式分集大纲、蛙蛙写作适配本土IP，接即梦出画面+人工精修`, con: `垂直工具对短剧套路理解弱于通用旗舰模型；大纲与剧本仍需人工把关`, price: `以官网实时页为准`, rate: 3, tip: `改编卡在"分集大纲"一步时用它补位：梗概→分集大纲→场次化剧本，每集钩子/反转/卡点单独标注成列。` },
```

**3.3b 口型组**——锚点：data.js 第 315 行 `{ n: \`Hedra\`, cat: \`lips\`…` 整行之后插入：

```js
  { n: `Wan2.2-S2V`, cat: `lips`, ico: `🎭`, ver: `阿里开源`, tag: `静态图+音频→说话/唱歌/表演，覆盖半身与全身的开源表演线`, pro: `开源免费可本地部署；支持说话/唱歌/表演，覆盖半身与全身——全身表演戏的零API成本兜底`, con: `需本地显卡与部署能力；开源线效果需自行实测`, price: `开源免费`, rate: 3, tip: `全身表演戏的分工：OmniHuman 1.5类管上限、Hedra订阅管稳定、Wan2.2-S2V自部署管边际成本——先各跑10秒短句实测再定产线。` },
```

**3.3c 声音组**——锚点：data.js 第 327 行 `{ n: \`ChatCut 音效\`, cat: \`audio\`…` 整行之后插入：

```js
  { n: `PixVerse`, cat: `audio`, ico: `🥁`, ver: `—`, tag: `视频同步音效见长：上传成片自动匹配SFX`, pro: `2026年9款音效工具对比结论：细致text-to-SFX选ElevenLabs、视频同步选PixVerse、Adobe工作流选Firefly、轻量任务选LoudMe`, con: `自动匹配的音效仍需人工挑优替换，不适合直接全量上片`, price: `以官网实时页为准`, rate: 3, tip: `与ElevenLabs SFX分工：整段成片自动铺底用PixVerse，关键动作的定制重音用文本生音效精修。` },
```

**3.3d 剪辑组**——锚点：data.js 第 332 行 `{ n: \`Topaz Video AI\`, cat: \`edit\`…` 整行之后插入：

```js
  { n: `Time Cut`, cat: `edit`, ico: `⏱️`, ver: `移动端App`, tag: `手机端补帧与慢动作：AI帧插值+超级慢动作+RSMB动态模糊`, pro: `AI帧插值、超级慢动作、RSMB动态模糊——手机上快速统一素材帧率`, con: `移动端算力有限；批量提质仍以Topaz/剪映AI画质增强为主`, price: `以应用商店实时页为准`, rate: 3, tip: `混生成素材帧率不齐时，先用它把全片补帧统一到同一帧率再进剪辑，避免25/30fps混用导致口型与卡点异常。` },
```

**3.3e 平台组（4 条一块）**——锚点：data.js 第 343 行 `{ n: \`jianying-editor-skill\`, cat: \`platform\`…` 整行之前插入：

```js
  { n: `万兴剧厂`, cat: `platform`, ico: `🎞️`, ver: `万兴科技 · 活动价至2026-10-15`, tag: `3人+万兴剧厂5天75集《气运三角洲》，上线29小时播放破2亿`, pro: `头部项目实证产能：3人+万兴剧厂5天75集（腾讯云2026）；活动期Seedance等按秒计费低至0.2-0.77元/秒（经搜索摘要转述，截止2026-10-15）`, con: `活动价为促销口径随时回收；产能数据系头部个案，不可外推为常态`, price: `活动价0.2-0.77元/秒起`, rate: 3, tip: `接了整季打包单但自建产能不够时，用工具厂活动价补产能；下单前先算"活动价×2-3倍废片系数"是否仍低于自建算力。` },
  { n: `商汤Seko / Magiclight.AI`, cat: `platform`, ico: `🗣️`, ver: `—`, tag: `一站式批量漫短剧平台：角色一致性引擎+多角色逐说话人对口型`, pro: `商汤Seko：SekoIDX角色一致性引擎+SekoTalk多人对口型；Magiclight.AI：多角色口型同步（分配声音与台词、逐说话人同步、引导听众反应），内置37种角色声音（官网口径）`, con: `官网/导航站口径，缺独立第三方实测；群像对口型仍建议"一镜一人开口"拆镜`, price: `以官网实时页为准`, rate: 3, tip: `多角色群像戏先在此类一站式平台试批量产，跑不通再拆回"一镜一人开口+反应镜头掩护"的手工链路。` },
  { n: `Rask AI`, cat: `platform`, ico: `🌐`, ver: `—`, tag: `出海译制铺量：100+语种、多说话人，翻译→配音→字幕一站式`, pro: `100+语种与多说话人区分（转引口径）；与GhostCut/HeyGen同类可三方比价`, con: `定价复杂：多语种实际约$400/月起、口型另扣积分（转引口径，以官网实时页为准）`, price: `多语种实际约$400/月起`, rate: 3, tip: `多语种矩阵铺量前先小批量实测；配音预算向质量倾斜而非条数——观众负面三大项：不像人/不像角色/不像本地人。` },
  { n: `飞书多维表格`, cat: `platform`, ico: `📋`, ver: `官方「视频拍摄分镜管理」模板`, tag: `分镜/排期/资产三合一的轻量产线后台：模板+看板甘特+仪表盘`, pro: `内置「视频拍摄分镜管理」模板（场景画面/镜头运用/旁白字幕字段）与内容排期模板；甘特/看板做生产排期；可自搭「抽卡可用率看板」：镜头一行，字段含资产引用版本/尝试次数/可用率/废片原因`, con: `需自建字段与视图，不是开箱即用的漫剧产线；深度自动化需配工作流`, price: `免费档起步（以官网实时页为准）`, rate: 4, tip: `3人组分工起步：编导交"分镜表+资产引用清单"，生图岗只调用已批准版本资产；产线节点完成/失败经机器人私信推送，免人工盯进度。` },
```

### 3.4 js/app.js — `pages.tools()` 整函数替换

**锚点**：app.js 第 479-490 行（`tools() {` 至其收口 `},`），整函数替换为：

```js
    tools() {
      const cats = DB.toolCats;
      const vcRows = DB.videoCompare.map((v) => '<tr><td><b>' + v.m + '</b></td><td>' + v.dur + '</td><td>' + v.res + '</td><td>' + v.adv + '</td><td style="color:var(--tx2)">' + v.con + '</td><td>' + v.scene + '</td><td style="color:var(--tx2)">' + v.price + '</td></tr>').join('');
      const vc = '<div class="chart-box" style="margin-bottom:16px"><h5>视频模型选型对比（' + DB.videoCompare.length + '款主力 · v1.5）</h5>' +
        '<div class="tbl-wrap vc-wrap"><table class="tbl vc-table"><thead><tr><th>模型</th><th>单次时长</th><th>分辨率</th><th>核心优势</th><th>一致性手段</th><th>适用场景</th><th>价位</th></tr></thead><tbody>' + vcRows + '</tbody></table></div>' +
        '<p class="mini-note">' + DB.videoCompareNote + '</p></div>';
      const C = DB.mjxToolsVcCost || { rows: [] };
      const costCopy = C.rows.length ? regCopy('【单集成本速查 · ' + C.unit + '】\n' + C.rows.map((r) => r.m + '：' + r.c + '（' + r.k + '）' + (r.n ? '——' + r.n : '')).join('\n') + '\n' + C.foot) : '';
      const cost = C.rows.length ? '<div class="chart-box" style="margin-bottom:16px"><h5>单集成本速查 <span class="sub">' + esc(C.unit) + '</span></h5>' +
        '<div class="tbl-wrap"><table class="tbl mjx-tools-cost"><thead><tr><th>模型 / 口径</th><th>折算式</th><th>50秒单集成本</th><th>备注</th></tr></thead><tbody>' +
        C.rows.map((r) => '<tr><td><b>' + r.m + '</b></td><td style="color:var(--tx2)">' + r.k + '</td><td>' + r.c + '</td><td style="color:var(--tx2)">' + r.n + '</td></tr>').join('') +
        '</tbody></table></div><p class="mini-note">' + esc(C.foot) + '</p>' +
        '<button class="copy-btn" data-copy="' + costCopy + '">复制本表（文本版）</button></div>' : '';
      const stacks = '<h4 class="block-t">三档预算工具栈 <span class="sub">照抄起步，再按手头项目换件</span></h4><div class="grid g3" style="margin-bottom:16px">' +
        (DB.mjxToolsStacks || []).map((s) => {
          const sid = regCopy('【' + s.t + '（' + s.b + '）工具链】\n' + s.c + '\n' + s.y);
          return '<div class="card mjx-tools-stack"><div class="st-top"><b>' + s.t + '</b><span class="tag c">' + s.b + '</span><button class="copy-btn" data-copy="' + sid + '">复制链路</button></div><div class="chain">' + esc(s.c) + '</div><p class="mini-note" style="margin:6px 0 0">' + esc(s.y) + '</p></div>';
        }).join('') + '</div>';
      return vc + cost + stacks + '<div class="tool-filters">' + cats.map((c, i) =>
        '<span class="chip' + (i === 0 ? ' on' : '') + '" data-cat="' + c.id + '">' + c.ico + ' ' + c.n + '</span>').join('') +
        '<span class="chip" data-cat="__fav">★ 收藏 <b class="fav-cnt" id="favCnt"></b></span>' +
        '<span class="chip" data-tsort="rate">★ 评分优先</span><span class="chip" data-tsort="name">名称 A-Z</span>' +
        '</div><div class="inline-search"><span class="search-ico">⌕</span><input id="toolSearch" placeholder="即时筛选：输入名称 / 定位 / 优势 / 技巧关键词…" autocomplete="off"></div><div class="grid g3" id="toolGrid"></div>';
    },
```

### 3.5 js/app.js — `renderTools()` 整函数替换

**锚点**：app.js 第 1589-1619 行（`function renderTools(cat) {` 至其收口 `}`，紧邻 `function toggleFav`），整函数替换为。筛选/收藏/排序/空态/深链/死亡样式逻辑逐字保留，仅在"all 且无搜索无排序"时加分组小标题：

```js
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
    const card = (t) => {
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
    };
    const grouped = cat === 'all' && !toolQ && !toolSort;
    grid.innerHTML = grouped
      ? DB.toolCats.filter((c) => c.id !== 'all').map((c) => {
          const items = list.filter((t) => t.cat === c.id);
          if (!items.length) return '';
          return '<div class="mjx-tools-gh">' + c.ico + ' ' + c.n + '<span class="n">' + items.length + '款</span></div>' + items.map(card).join('');
        }).join('')
      : list.map(card).join('');
  }
```

### 3.6 css/style.css — 末尾追加（锚点：第 1002 行 `.ft-why{…}` 之后）

```css
/* ===== 工具库增强（mjx-tools 前缀 · docs/refine/tools.md） ===== */
.mjx-tools-gh{grid-column:1/-1;display:flex;align-items:baseline;gap:8px;margin:8px 0 -4px;font-size:13.5px;font-weight:800;color:var(--p2)}
.mjx-tools-gh .n{font-size:11.5px;font-weight:600;color:var(--tx3)}
.mjx-tools-cost td:nth-child(3){white-space:nowrap;font-weight:700}
.mjx-tools-stack .st-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.mjx-tools-stack .st-top b{font-size:14px}
.mjx-tools-stack .st-top .copy-btn{margin-left:auto}
.mjx-tools-stack .chain{font-size:12.4px;line-height:1.75;color:var(--tx2)}
```

---

## 四、来源对照表

| 落点 | 具体内容 | research 出处（章节级） |
|---|---|---|
| mjxToolsVcCost.unit | 50秒/集基准（万妖单集体量） | research/21 §二 2.2 节标题 |
| mjxToolsVcCost.rows[0] | 4.0 正式版未公布、"除Kling 4.0外均支持" | research/21 §二 2.1 表（klingai.com 企业会员页+API计费文档，检索10-2） |
| mjxToolsVcCost.rows[1] | Flash 6灵感值/秒→约300灵感值/集；黑金26000灵感值/月→约86集/月（转引档位） | research/21 §一（德里克文9-29实测）+ §2.2（86集为档案标注的推断口径，基于雪球转引档位） |
| mjxToolsVcCost.rows[2] | 可灵均价约0.43元/秒→约21.5元/集 | research/21 §2.2（腾讯新闻2026-04-25实测折算） |
| mjxToolsVcCost.rows[3] | 2.5 官方720P 1.5-2.1元/秒→约75-105元/集；样片模式省约38% | research/21 §2.2 + §四（smzdm算力账8-22、36氪8-31；冷逸9-28实测经smzdm转引） |
| mjxToolsVcCost.rows[4] | 2.0 API 约1元/秒→约50元/集；15秒≈30.888万tokens | research/21 §2.2（火山引擎口径） |
| mjxToolsVcCost.rows[5] | 第三方渠道0.23-0.3元/秒→约11.5-15元/集；LibTV 0.4元上界约20元/集；甩卖风险 | research/21 §2.2 + §四（36氪8-31原文，含双口径核验注） |
| mjxToolsVcCost.rows[6] | Wan3.0 0.3元/秒=480P档→15元/集；720P 0.6→约30元/集 | research/21 §2.2（smzdm标题口径+新浪财经2026-08-07公测稿档位） |
| mjxToolsVcCost.rows[7] | Sora2时代<100元/剧→Seedance 2.0后约2000元/剧 | research/18 §A5.3（优文疯2026-05-18） |
| mjxToolsVcCost.foot | 废片系数×2-3、无权威废片率、投产前复核 | research/21 §2.2（9-22带货实测经smzdm转引；smzdm算力账8-22"两家都没有权威废片率数据"）+ research/19 §A4.1 口径提醒 |
| mjxToolsStacks 三档链路 | 新手/进阶/专业三档工具链 | research/04 §八 |
| mjxToolsStacks.y（新手/进阶/专业） | 固定词表+同参考图；LoRA+NB2参考锁定；三级保障体系 | research/04 §八（新手档一致性）、§七 Level 2/Level 3 |
| 塔塔AI写作 / 蛙蛙写作 | 红果格式分集大纲、本土IP适配、接即梦+人工精修 | research/12 §五 |
| Wan2.2-S2V | 静态图+音频→说话/唱歌/表演、半身与全身 | research/19 §A3.1（Dzine工具页口径） |
| Wan2.2-S2V.tip | OmniHuman 1.5/Hedra 分工、短句实测 | research/19 §A3.1（EvoLink/Atlabs/PiAPI 评测交叉）+ §A4.2 省钱要点 |
| PixVerse | 视频同步音效见长、9款工具对比结论 | research/14 §一 |
| Time Cut | AI帧插值、超级慢动作、RSMB动态模糊 | research/14 §二 |
| Time Cut.tip | 25/30fps 不混用 | research/19 §A5.4（帧率与规格） |
| 万兴剧厂 | 5天75集《气运三角洲》29小时破2亿；活动价0.2-0.77元/秒至10-15 | research/18 §A6.4（腾讯云2026）+ research/22 §二（活动价，经搜索摘要转述——已落第五节） |
| 商汤Seko / Magiclight.AI | SekoIDX+SekoTalk；37种角色声音、逐说话人同步 | research/19 §A1.1（AIGC导航/官网口径） |
| Rask AI | 100+语种、多说话人、约$400/月起、口型另扣 | research/18 §B1.2 工具选型表（搜索摘要转引口径） |
| Rask AI.tip | 配音负面三大项 | research/18 §B5.3（GhostCut×GrowData 报告） |
| 飞书多维表格 | 分镜管理模板、甘特/看板、飞书私信通知 | research/18 §A4.2、§A6.2、§A2.4 |
| 飞书多维表格.pro（看板） | "抽卡可用率看板"字段方案 | research/18 §A6.3——档案明确标注为【经验推断】（无现成公开模板），代码中已用"可自搭"框架呈现，不冒充现成产品功能 |

---

## 五、需人工核实

1. **万兴剧厂活动价 0.2-0.77元/秒**：research/22 §二标注"经搜索摘要转述"，且活动截止 2026-10-15（已过期与否需复核）。条目内已注明"促销口径/搜索摘要转述"，但落地后建议人工核对活动页，过期即改 price 或降级条目。
2. **Rask AI "$400/月起"**：research/18 §B1.2 标注为"搜索摘要转引"，条目已注"转引口径"；上产前以官网实时页复核。
3. **未写入代码的【存疑】项**（按纪律排除在代码外，仅在此留痕）：research/19 §B5.2 的 Kavilo、Nano Banana 2（iMini）白模、GPT-6/Codex 等无官方页面佐证的工具名；research/21 §2.1 雪球转引"黄金连续包月46元/月、黑金11079元/年"与站内"黄金¥66/月"的价格差；research/22 §二"300万播放仅收益500元"等流传口径。
4. **PixVerse / Time Cut / 塔塔AI写作 / 蛙蛙写作 / 商汤Seko / Magiclight** 六项档案未给价格或仅厂商口径——条目 price 一律写"以官网实时页为准"，不编数。

---

## 六、不做的事

1. **不向 `videoCompare` 数组插入任何新行**——feat-picker.js:27-34 按 `vc: 0-7` 下标绑定该数组，插行即错位；成本速查改以独立新键 `mjxToolsVcCost` 承载。
2. **不改现有 8 行 videoCompare 与 49 款 tools 条目的任何字段/数字/措辞**（含 price 列的口径混杂——那是既有口径，改动超出"只做增量"授权）；不改任何现有 `n`（feat-picker 深链按名精确匹配）。
3. **不新增/改名 toolCats 分类**——`DB.toolCats.length-1`（"8大环节"）等运行时计数与导航副标题保持不变。
4. **不动公共设施**：路由、命令面板、全局搜索、收藏系统（toggleFav/loadFavs）、data-copy/data-share/事件委托等全局处理器一行不改；新交互只"使用"既有 regCopy→data-copy 通道与 toolCat/toolQ/toolSort 既有状态变量。
5. **不动 index.html、sw.js、research/、js/feat-*.js、js/research-data.js**；不新建模块文件。
6. **不写任何无 research 出处的新数字**进代码（无出处的知识只留在第五节）；不引入需后端/跨域请求的"实时比价"类功能（纯静态站约束）。
7. **不做大改版**：不加二级页面、不改卡片版式与网格布局，分组小标题仅在既有 g3 网格内以通栏元素实现。
