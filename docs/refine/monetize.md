# 细化方案：变现运营（monetize）

> 涉及文件：`js/data.js`（monetize 数据区 4 处增量插入）+ `js/app.js`（monetize() 渲染函数整体替换）。
> 本轮补丁本身只写本文档；上述两个 js 文件当前一律只读，代码块为待应用补丁（已通过 node 内存打补丁自验，见第三节末尾）。基线：`js/data.js:1177-1247`（monetize 数据区）、`js/app.js:707-733`（渲染函数）。

## 一、现状盘点

**有什么（逐键清点，实测自 js/data.js:1177-1247，字段长度用 node 实测）：**

| 数据键 | 条目数 | 结构 | 备注 |
|---|---|---|---|
| platforms | 9 | `{ n, pol, inc, bar }` | 9大平台分账政策；pol 最长 1471 字（抖音/红果卡）、平均 312 字 |
| overseas | 7 | `{ t, d }` | 大盘/格局/成本/双轨/YouTube·TikTok/语种收款/警示；单卡最长 920 字 |
| overseasTable | 7 行 | `{ n, mode, entry, income }` | 出海平台入驻速查 |
| bizModels | 8 行 | `{ m, h, l }` | 商业模式全景表 |
| warning | 5 | 字符串 | 收益警示 |
| compliance | 7 | `{ t, d }` | 备案/标识/治理/版权/音色/地方扶持/司法判例 |
| incomeMatrix | note + tiers 3 + bg 3 | 混合 | 三分层×背景三档对照 |

合计 **49 条目**。渲染层 `app.js:707-733`：27 行纯字符串拼接，零交互、零复制、页尾无跳转桥；合规小标题写死「四条合规红线」但数组实际已有 7 条（文案漂移，`app.js:133` 的 SECTION_SUB 同样残留）。外围：全局搜索只收录 platforms（`app.js:1789`），仪表盘 cnt 动态取 platforms.length（`app.js:444`）。模块分工明确：「接单/商单实操包」（data.js:2017 起）承接怎么接单、「收益决策树」（data.js:1794 起）承接路径决策——本模块定位是**变现数据面板**。

**缺什么 / 哪里最薄（三处知识断层 + 两处呈现缺口，均经 grep 验证）：**

1. **出海板块全是"是什么"，没有一张"怎么做"**：货架4打法、RPM阶梯、42频道亏损账、存活者画像（research/13 全部有据）只存在于研究日志两行转述（data.js:2367、2370）——grep `货架|RPM|42频道|Teddy` 均未命中任何模块数据区；出海平台速查表里只有一句"AI频道RPM约$2-5"，阶梯与运营动作全缺。
2. **合规板块是纯国内口径**：出海平台的 AI 标识义务（TikTok 违规 10万-100万元处罚、YouTube 披露标签）research/13 已核验但未入库——出海是本模块四大板块之一，合规清单却只管国内。
3. **商业模式全景缺「代运营」**：research/23§三路径5（国内挂牌100-300元/单、海外retainer $1500-8000/月、月费制）站内任何模块均未落地（grep `代运营` 仅命中 research/）。
4. **警示清单缺"违规→钱拿不回来"的后果案例**：5 条警示全是收益数字，没有把合规红线和钱直接挂钩的样本（收益冻结案例在 research/08 v2.7§6）。
5. **呈现缺口**：9 张平台卡是一屏文字墙（pol 无折叠、无分组、无复制）；页尾没有任何通往「收益决策树」「接单实操包」「互动计算器」的跳转桥——变现数据看完没有下一步动作。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | overseas 区新增 2 条：「YouTube货架打法与RPM阶梯」「出海频道存活画像」（插在「语种优先级与收款链路」之前） | js/data.js:1196 行前 | research/13-出海频道运营与YouTube打法.md §二（RPM 表+1/16+合集连载结论）、§三（货架四打法/每日更新/多平台联动）、§五（字幕8-10字符）、§四（42频道亏损账）、核验轮§五（Teddy Pooh/Terrorrking/“模板化才是”） |
| 2 | bizModels 表新增第 9 行「代运营」（IP衍生行之后追加） | js/data.js:1216 行后 | research/23-收益预期对照与接单商单实操.md §三 路径5 |
| 3 | warning 新增 1 条「无授权搬运的账」（插在“三本账”收尾条之前，保持行动条殿后） | js/data.js:1223 行前 | research/08-变现运营.md 更新·2026-10-02（v2.7）§6 收益风险个案（潮新闻 2026-09-15） |
| 4 | compliance 新增 1 条「出海平台的AI标识义务」（数组收尾前追加） | js/data.js:1233 `],` 前 | research/13 核验轮§一（TikTok 标识义务+10万-100万元处罚，五笔wiki 2026-08-16 转引）、§五（YouTube 2025-07 披露标签，Google Help）；7-16 三分类细则为站内既有口径（data.js:1195）交叉引用 |
| 5 | monetize() 渲染函数整体替换：平台三分组小标题（依据=各平台自身 bar 字段）+ pol 政策全文 `<details>` 折叠 + 一键复制「9平台政策+合规红线」纯文本速查 + 页尾三跳转桥 + 合规小标题由写死“四条”改为动态计数（修文案漂移：原 7 条即不符） + 出海机会小标题补副题 | js/app.js:707-733 | 无新数据。平台分组依据=data.js:1180-1188 各平台 bar 字段原文；复制复用既有 `regCopy`/`[data-copy]` 委托（app.js:46-64、1958-1959，与 learning 页同一模式）；跳转复用既有 `[data-go]` 委托（app.js:2039-2040） |

新增合计 **5 条数据条目**（overseas 7→9、bizModels 8→9、warning 5→6、compliance 7→8，总条目 49→54）+ 渲染层增强。所有既有条目（字段结构、数字口径、文案）一字不动。

## 三、落点与代码

### 改动 1：js/data.js — overseas 区插入 2 条

- **锚点**：js/data.js:1196 行首 `    { t: \`语种优先级与收款链路\``（该行约1500字、整行保留不动，行号经 grep 唯一性验证）。在其**之前**插入以下两行：

```js
    { t: `YouTube货架打法与RPM阶梯`, d: `把一部剧当"可反复调整的货架商品"（趣丸千音四打法）：①标题可换——按数据反复优化；②封面可测——AB测试点击率；③章节可补——按剧集章节切分长视频；④播放列表可挪——按连载组织、每集标题统一前缀+编号，剪出的Shorts持续导流回正片；头部AI短剧播放列表普遍标注"每日更新"节奏，多平台联动（X测话题传播力、TikTok规模化触达、YouTube积累品牌与连载观众）优于单平台；字幕一行≤8-10字符。RPM阶梯（知乎《2026上半年YouTube短剧市场报告》）：一般频道$2-4、Shorts $0.01-0.06（优质可达$0.20）、优质长视频可达$12；不露脸频道案例：3万订阅、月广告收入$8,000-10,000（8个月开始盈利，Reddit案例）——AI漫剧单条播放效率仅真人剧约1/16（见「YouTube / TikTok」卡），量大单价低，必须靠合集连载拉时长。` },
    { t: `出海频道存活画像`, d: `反面账本：某团队运营42个频道、每天批量上传AI译制剧，半年播放几千万但广告分成不够付AI工具成本（kchuhai出海报告）——纯搬运矩阵ROI极低；叠加2026H1端内审计（26.8%频道停更≥6个月、封禁/处罚近10%，见「YouTube / TikTok」卡），"跑量模式已死"。正面画像（THR 2026-06-13）：Teddy Pooh（AI角色IP）、Terrorrking（西语AI恐怖）——有原创角色IP与一致性人设的AI频道仍可变现；"无脸/无人出镜不是死罪，模板化才是"——出海频道拼的是原创角色IP与内容加工深度，不是露脸与否，也不是账号数量。` },
```

### 改动 2：js/data.js — bizModels 追加「代运营」行

- **锚点**：js/data.js:1216（IP衍生行，整行保留），其后**新增一行**：

```js
    { m: `IP衍生`, h: `付费转化、衍生开发`, l: `头部作品付费转化率约18%（待确认出处）` },
    { m: `代运营`, h: `账号/矩阵代运营（月费制）`, l: `国内挂牌100-300元/单起（猪八戒2026检索口径）；海外retainer $1500-8000/月（Playcut 2026）；现金流稳（月费制）但需账号成绩背书，风险=效果责任纠纷、客户流失——适合已有起号成功案例者` },
```

### 改动 3：js/data.js — warning 插入「无授权搬运的账」

- **锚点**：js/data.js:1223（“三本账”收尾条，整行保留），在其**之前**插入一行：

```js
    `无授权搬运的账：168集搬运成片被违规下架、后台未结算收益同步冻结；静态漫画解说博主2025年单月利润曾达20万元，2026年因成本上涨+完播率42%→19%停更（潮新闻2026-09-15）——合规三门票缺一，已赚到的钱也可能拿不回来`,
    `入局前先算"三本账"：单条综合成本、抽卡可用率、万播单价`,
```

### 改动 4：js/data.js — compliance 追加「出海平台的AI标识义务」

- **锚点**：js/data.js:1233-1234（compliance 数组收尾 `],` + incomeMatrix 开行，两行均保留），`],` 之前**插入一行**：

```js
    { t: `出海平台的AI标识义务`, d: `出海不是合规洼地：TikTok要求按《人工智能生成合成内容标识办法》（2025-09-01施行）显性标注，否则限流、下架乃至10万-100万元处罚（五笔wiki 2026-08-16转引）；YouTube 2025-07起"逼真AI内容须标注"要求延续（Google Help），2026-07-16三分类细则生效后模板化AI内容为频道级取消获利（细则见「YouTube / TikTok」卡）；一部剧双端分发时，国内（苔花+显隐双标识）与海外（披露标签）义务要分别满足——标识方案按分发平台分别设计【经验】，不能一次通用。` },
  ],
  incomeMatrix: {
```

### 改动 5：js/app.js — monetize() 渲染函数整体替换

- **锚点**：js/app.js:707 `    monetize() {` 起至 :733 `    },` 止，整函数替换为下块。既有输出板块与顺序逐段保留（平台政策→收益警示→收益对照→成本阶梯→出海机会→出海速查→商业模式→合规红线）；新增标识符仅 `mjxMonetizeGroups`/`mjxMonetizeMd` 两个（mjxMonetize 前缀、限函数内部）；复制按钮走既有 `[data-copy]` 委托、页尾按钮走既有 `[data-go]` 委托，不触碰任何公共设施、无新增 CSS 类（折叠/分组全用内联样式 + 既有 `copy-btn`/`plat-card`/`pl-*` 类）：

```js
    monetize() {
      const M = DB.monetize;
      /* mjxMonetize*：本模块渲染层小增强（平台分组小标题/政策折叠/一键复制/页尾跳转桥），不动路由、搜索、收藏等公共设施，不新增CSS类 */
      /* 平台三分组：纯渲染编排、不改数据——分组依据=各平台自身「门槛」字段（bar）口径，见各组说明 */
      const mjxMonetizeGroups = [
        { t: `个人与低门槛起步`, note: `快手个人零成本入驻 · 小红书商单起号 · B站创作激励（有粉丝/播放门槛）`, idx: [1, 4, 3] },
        { t: `机构 · 达人 · 企业主体`, note: `红果需机构或达人身份 · 火龙机构对公 · 小程序需企业主体+备案`, idx: [0, 2, 5] },
        { t: `平台邀约 · 合作方 · 签约`, note: `爱奇艺/优酷以邀约与合作方入驻为主 · 阅文书旗走签约合作——个人无直接通道，盯窗口期政策`, idx: [6, 7, 8] },
      ];
      const mjxMonetizeMd = () => '【各平台分账政策速查（' + DB.meta.updated + ' · 政策变动极快，以官方后台为准）】\n' +
        M.platforms.map((p) => '■ ' + p.n + '\n[政策] ' + p.pol + '\n[收益] ' + p.inc + '\n[门槛] ' + p.bar).join('\n\n') +
        '\n\n【合规红线清单】\n' + M.compliance.map((c) => '■ ' + c.t + '\n' + c.d).join('\n\n');
      const pf = (p) => '<div class="card plat-card"><div class="pl-head"><span class="pl-name">' + p.n + '</span><span class="pl-tag">分账政策</span></div>' +
        '<details style="margin:2px 0 4px"><summary style="cursor:pointer;font-size:12px;color:var(--p2);user-select:none">政策全文 ▾<span style="color:var(--tx3);font-weight:400"> 点击展开 · 政策变动极快，以官方后台为准</span></summary><p style="font-size:12.7px;color:var(--tx2);line-height:1.7;margin:8px 0 0">' + p.pol + '</p></details>' +
        '<div class="pl-row"><span class="pl-k gold">收益</span><p>' + p.inc + '</p></div>' +
        '<div class="pl-row"><span class="pl-k cyan">门槛</span><p>' + p.bar + '</p></div></div>';
      const platCards = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
        '<button class="copy-btn" data-copy="' + regCopy(mjxMonetizeMd()) + '">⧉ 复制' + M.platforms.length + '平台政策+合规红线（纯文本速查）</button>' +
        '<span class="mini-note" style="margin:0">按门槛分三组 · 政策全文默认折叠——先比收益/门槛，再展开深读</span></div>' +
        mjxMonetizeGroups.map((g) => '<div style="margin:14px 0 8px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-size:14px">' + g.t + '</b><span style="font-size:11.5px;color:var(--tx3)">' + g.note + '</span></div>' +
          '<div class="grid g2">' + g.idx.map((i) => pf(M.platforms[i])).join('') + '</div>').join('');
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
        '<h4 class="block-t">出海机会 <span class="sub">大盘 / 格局 / 成本 / 双轨 / 平台 / 打法 / 存活画像 / 警示</span></h4><div class="grid g4">' + ov + '</div>' +
        '<h4 class="block-t">出海平台入驻速查 <span class="sub">模式 / 门槛 / 收益（2026-10）</span></h4>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>平台</th><th>模式</th><th>入驻口径</th><th>收益参考</th></tr></thead><tbody>' +
        M.overseasTable.map((p) => '<tr><td><b>' + p.n + '</b></td><td>' + p.mode + '</td><td style="color:var(--tx2)">' + p.entry + '</td><td style="color:var(--tx2)">' + p.income + '</td></tr>').join('') +
        '</tbody></table></div>' +
        '<h4 class="block-t">商业模式全景</h4>' + biz +
        '<h4 class="block-t">合规红线 <span class="sub">' + M.compliance.length + '条 · 备案 / AI标识 / 治理 / 版权 / 音色肖像 / 地方扶持 / 出海标识——缺一即下架停更</span></h4><div class="grid g2">' + comp + '</div>' +
        '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn ghost" data-go="earnpath">我的背景能赚多少？→「收益决策树」对表</button>' +
        '<button class="btn ghost" data-go="orders">怎么收到第一笔钱？→「接单实操包」</button>' +
        '<button class="btn ghost" data-go="calc">算三本账与回本播放量 →「互动计算器」</button></div>';
    },
```

**补丁自验（本轮实际执行）**：将上列 5 处代码写入临时目录（仓库外），用 node 做内存打补丁验证——`node patch-test.mjs`（脚本逐条：①6 个锚点在源文件中均唯一；②补丁内存应用后 `require` 打补丁版 data.js 真实执行，断言 platforms=9/overseas=9/overseasTable=7/bizModels=9/warning=6/compliance=8、incomeMatrix 不变、platforms[0] 原文含“优质AI剧生产活动2.0”未被破坏；③用打补丁后的真实 DB 冒烟执行新 monetize()，输出 23854 字符、28 项关键标记（9 平台名/3 分组标题/5 条新数据/data-copy/data-go 三跳转/costLadder/8条合规副题等）全部命中；④打补丁后整份 app.js 通过 `new Function` 编译）。结果 `ALL CHECKS PASSED`；`git status` 前后一致，仓库零改动。

**代码量核对**：新增数据 5 行 + 渲染函数替换 29→45 行，补丁完整代码合计约 50 行（远低于 350 行上限），全部为完整可粘贴形态、无省略号。

## 四、来源对照表

| 新增内容 | 研究档案出处 | 站内互证（既有口径，未改动） |
|---|---|---|
| 货架四打法（标题可换/封面可测/章节可补/播放列表可挪+Shorts导流）、播放列表“每日更新”、多平台联动（X/TikTok/YouTube 分工）、字幕一行≤8-10字符 | research/13 §三（四打法与两条补充）、§五运营清单第3/5条 | data.js:1195「YouTube / TikTok」卡已有“10分钟+合集成片”“切片前段”同源口径，不冲突 |
| RPM 阶梯：一般频道$2-4 / Shorts $0.01-0.06（优质$0.20）/ 优质长视频可达$12；不露脸案例 3万订阅月$8,000-10,000（8个月盈利，Reddit案例） | research/13 §二 RPM 表（知乎《2026上半年YouTube短剧市场报告》） | data.js:1205 overseasTable“AI频道RPM约$2-5”为同一口径族的概括值，阶梯是其细化，不改原行 |
| “AI漫剧单条效率仅真人剧约1/16、量大单价低必须合集连载拉时长” | research/13 §二结论 | data.js:1195 / data.js:1205 已有“1/16”（站内既有，卡片内注明“见「YouTube / TikTok」卡”） |
| 42频道矩阵亏损账、“跑量模式已死” | research/13 §四（kchuhai出海报告） | data.js:2367/2370 研究日志两行转述（此前未入模块数据）；26.8%停更/封禁处罚近10% 为 data.js:1195 既有审计口径（卡片内交叉引用） |
| 存活者画像：Teddy Pooh（AI角色IP）/Terrorrking（西语AI恐怖）、“无脸不是死罪，模板化才是” | research/13 核验轮§五（THR 2026-06-13） | data.js:1195「inauthentic content 三分类」既有口径的正面补充；Terrorrking 另见 data.js:1709（题材风向库出海行） |
| 代运营：国内挂牌100-300元/单起（猪八戒2026检索口径）、海外retainer $1500-8000/月（Playcut 2026）、月费制、风险=效果责任纠纷/客户流失、适合有起号成功案例者 | research/23 §三 路径5 | 无（本补丁首次入库；research/23§三第6条海外经验互证同源） |
| 无授权搬运：168集搬运被下架+后台未结算收益冻结、解说博主2025年单月利润20万→2026年因成本上涨+完播率42%→19%停更 | research/08 更新·2026-10-02（v2.7）§6（潮新闻 2026-09-15） | data.js:1228 compliance「三门票与停更潮」同源治理口径 |
| TikTok AI标识义务：按《标识办法》显性标注，否则限流/下架/10万-100万元处罚（五笔wiki 2026-08-16转引） | research/13 核验轮§一 | data.js:1227 国内《标识办法》2025-09-01 施行同法源 |
| YouTube 披露标签（2025-07“逼真AI内容须标注”，Google Help）；7-16 三分类频道级取消获利 | research/13 核验轮§五（三分类细则） | data.js:1195「YouTube / TikTok」卡已录三分类细则全段（卡片内交叉引用，不重复展开） |
| 平台三分组小标题（个人低门槛/机构达人企业/邀约合作签约） | 无外部出处——分组依据=js/data.js:1180-1188 各平台自身 bar 字段原文（快手“个人/小工作室友好”、红果“机构对公入驻或达人身份”、爱奇艺“平台邀约与合作方入驻为主”等），纯渲染编排 | 全部取自站内数据 |

## 五、需人工核实

无。5 条新增数据的全部事实性内容均有 research/*.md 章节出处（见上表）；研究侧自带保留标记的口径（kchuhai 报告、Reddit 案例、五笔 wiki 转引、猪八戒检索口径等弱源/转引属性）已在条目内随文标注出处；「出海合规」卡内一句操作建议已标【经验】；平台分组、折叠、复制、跳转桥为编排性增强，不涉及事实断言。

## 六、不做的事

1. **不改任何既有条目**：platforms 9 条（含 1471 字的抖音/红果卡）、overseasTable 7 行、incomeMatrix、既有 overseas/warning/compliance 条目的字段结构与数字口径一字不动；不重命名/删除任何 DB 键；只做增量。
2. **不做组内筛选/排序按钮**：本模块产物由 route() 一次性 innerHTML 渲染（app.js:210-218），模块内无法自持事件；站内所有筛选都依赖全局点击委托（app.js:1943-2040，属公共 JS 设施）——按纪律不新增委托分支，改用零 JS 的 `<details>` 折叠 + 分组小标题达到同等可扫读性（1471 字的政策墙默认收起，收益/门槛保持平铺可对比）。
3. **不新增 CSS 类**：css/ 只读，全部用内联样式 + 既有 `copy-btn`/`plat-card`/`pl-*`/`chip` 类与 CSS 变量，故无 `mjx-monetize-*` 类产出；新增 JS 标识符仅 `mjxMonetizeGroups`/`mjxMonetizeMd`，限渲染函数内部。
4. **不动公共配置与设施**：路由、命令面板、全局搜索、收藏系统、`[data-copy]`/`[data-go]` 委托本体、index.html、sw.js 零改动。仅在此登记一处遗留文案漂移：`app.js:133` SECTION_SUB 仍写“四条合规红线”（实施本补丁后实际为 8 条）——该行在渲染函数之外，按纪律不改，建议实施者顺手同步为“合规红线”。
5. **不重复建库**：算法流量池/千川赛马/掉池恢复归「爆款心法」（data.js:1063-1076），接单渠道/报价/合同防骗归「接单实操包」（data.js:2017 起），路径决策归「收益决策树」（data.js:1794 起），万圣节排期归「题材风向库」出海行（data.js:1709）——本模块一律交叉引用，不复制数字，避免双源漂移。
6. **不新建模块、不改版式**：不拆分出海为独立模块，不加账号体系/证书徽章/UGC 投稿（research/16§一 已明确“不做”）。
